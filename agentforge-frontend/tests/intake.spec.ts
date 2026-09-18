import { test, expect, Page } from '@playwright/test';

const PROJECTS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'test - test',
    description: 'Test project for intake',
    status: 'active',
    client_name: 'ABC College',
    client_email: 'client@abc.test',
    company: 'Hyderabad',
    organization_name: 'Hyderabad',
    project_priority: 'medium',
    deadline: '2026-12-31T00:00:00Z',
    expected_delivery_date: '2026-12-31T00:00:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Attendance System',
    description: 'Attendance tracking',
    status: 'upcoming',
    client_name: 'ABC College',
    client_email: 'att@abc.test',
    company: 'Hyderabad',
    organization_name: 'Hyderabad',
    project_priority: 'high',
    deadline: '2026-11-30T00:00:00Z',
    expected_delivery_date: '2026-11-30T00:00:00Z',
  },
];

const PROVIDERS = {
  providers: [
    {
      provider: 'opencode-zen',
      enabled: true,
      connected: true,
      default_model: 'test-model',
      models: ['test-model'],
      priority: 1,
      timeout: 30,
      max_retries: 3,
      health_status: 'healthy',
      models_available: 1,
    },
  ],
  default_provider: 'opencode-zen',
  default_model: 'test-model',
};

const HEALTH = {
  providers: {
    'opencode-zen': {
      provider: 'opencode-zen',
      is_healthy: true,
      last_check: new Date().toISOString(),
      latency_ms: 120,
      error_rate: 0,
      consecutive_failures: 0,
      models_available: 1,
    },
  },
  overall_healthy: true,
};

async function mockIntakeApis(page: Page) {
  // Only ever mock API (xhr/fetch) traffic. Let Vite module scripts,
  // stylesheets, documents and HMR websockets pass through untouched —
  // fulfilling a JS module with JSON breaks lazy page imports.
  const isApiRequest = (route: any) => {
    const req = route.request();
    const rt = req.resourceType();
    if (rt !== 'xhr' && rt !== 'fetch') return false;
    try {
      const u = new URL(req.url());
      // Frontend dev server serves the app; API mocks target the backend
      // origin (or relative API paths). Never mock the dev-server origin.
      if (u.hostname === 'localhost' && u.port === '5173') return false;
      if (u.hostname === '127.0.0.1' && u.port === '5173') return false;
    } catch {
      return false;
    }
    return true;
  };

  await page.route('**/auth/me', async (route) => {
    if (!isApiRequest(route)) return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'u1', email: 'test@agentforge.ai', full_name: 'Test User' }),
    });
  });

  const projectsHandler = async (route: any) => {
    if (!isApiRequest(route)) return route.continue();
    const req = route.request();
    // Detail fetch /projects/:id → single object; list → array.
    const url = req.url();
    const m = url.match(/\/projects\/([0-9a-f-]{10,})/i);
    if (m) {
      const found = PROJECTS.find((p) => p.id === m[1]) ?? PROJECTS[0];
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(found) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PROJECTS) });
  };
  await page.route('**/api/projects**', projectsHandler);
  await page.route('**/projects/**', projectsHandler);

  await page.route('**/ai/providers/health**', async (route) => {
    if (!isApiRequest(route)) return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(HEALTH) });
  });
  await page.route('**/ai/providers/models**', async (route) => {
    if (!isApiRequest(route)) return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ models: {} }) });
  });
  await page.route('**/ai/providers**', async (route) => {
    if (!isApiRequest(route)) return route.continue();
    // fallback() delegates to the specific handlers above; continue()
    // would skip them and hit the network.
    if (route.request().url().includes('/health') || route.request().url().includes('/models')) return route.fallback();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PROVIDERS) });
  });

  const corsOk = (route: any) =>
    route.fulfill({
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    });

  await page.route('**/intelligence/intake', async (route) => {
    if (!isApiRequest(route)) return route.continue();
    if (route.request().method() === 'OPTIONS') return corsOk(route);
    // Small delay so the loading-phase UI (Uploading document... →
    // Requirements Analysis...) is observable before the pipeline flips to
    // the monitoring view.
    await new Promise((r) => setTimeout(r, 1200));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        requirement_id: 'req-123',
        project_id: PROJECTS[0].id,
        filename: 'Requirements_v2.docx',
        file_size: 1024,
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        provider: 'opencode-zen',
        model: '',
        status: 'uploaded',
      }),
    });
  });

  await page.route('**/requirements', async (route) => {
    if (!isApiRequest(route)) return route.continue();
    const req = route.request();
    if (req.method() === 'OPTIONS') return corsOk(route);
    if (req.method() === 'POST' && !req.url().includes('/upload') && !req.url().includes('/execute')) {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'req-123', title: 'test - test' }),
      });
      return;
    }
    return route.continue();
  });
  await page.route('**/requirements/*/upload', async (route) => {
    if (!isApiRequest(route)) return route.continue();
    if (route.request().method() === 'OPTIONS') return corsOk(route);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'req-123' }) });
  });
  await page.route('**/requirements/*/execute', async (route) => {
    if (!isApiRequest(route)) return route.continue();
    if (route.request().method() === 'OPTIONS') return corsOk(route);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ jobId: 'req-123', runId: 'run-1', status: 'started', currentStage: 'requirements_analysis' }),
    });
  });
  await page.route('**/monitoring/**', async (route) => {
    if (!isApiRequest(route)) return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'running',
        pipelineStatus: 'running',
        current_stage: 'requirements',
        progress: 12,
        stages: [
          { key: 'requirements', label: 'Requirements', status: 'running' },
          { key: 'features', label: 'Features', status: 'pending' },
        ],
      }),
    });
  });
  await page.route('**/intelligence/activity/**', async (route) => {
    if (!isApiRequest(route)) return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ events: [] }) });
  });
  await page.route('**/intelligence/logs/**', async (route) => {
    if (!isApiRequest(route)) return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ logs: [] }) });
  });

  // App-shell + sidebar calls: mock so a live backend's 401s can never log
  // the test out mid-run (the auth interceptor logs out on 401).
  await page.route('**/intelligence/model-ownership**', async (route) => {
    if (!isApiRequest(route)) return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ provider: 'multi-provider', pipelineOwner: '', models: [], providerModels: {} }),
    });
  });
  await page.route('**/sprints**', async (route) => {
    if (!isApiRequest(route)) return route.continue();
    if (route.request().url().includes('/requirements/')) return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0 }) });
  });
  await page.route('**/notifications**', async (route) => {
    if (!isApiRequest(route)) return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
}

async function seedAuth(page: Page) {
  // NOTE: addInitScript runs on EVERY navigation (including page.reload()).
  // It must only (re)seed auth — never clear intake keys — otherwise the
  // "persists after refresh" assertion wipes the very state it checks.
  // Each test gets a fresh context, so intake storage already starts clean.
  await page.addInitScript(() => {
    const payload = {
      state: {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        user: { id: 'u1', email: 'test@agentforge.ai', full_name: 'Test User' },
        workspace: null,
        isAuthenticated: true,
      },
      version: 0,
    };
    window.localStorage.setItem('agentforge-auth', JSON.stringify(payload));
  });
}

async function gotoIntake(page: Page) {
  await seedAuth(page);
  await mockIntakeApis(page);
  await page.goto('/ai-intake', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('project-select-trigger')).toBeVisible({ timeout: 20000 });
}

async function selectTestProject(page: Page) {
  await page.getByTestId('project-select-trigger').click();
  await expect(page.getByTestId('project-select-content')).toBeVisible();
  const option = page.getByTestId(`project-option-${PROJECTS[0].id}`);
  await expect(option).toBeVisible();
  await option.click();
}

test.describe('AI Intake — project dropdown + requirements upload (P0)', () => {
  test('project selection populates field, shows client/org, persists after refresh', async ({ page }) => {
    await gotoIntake(page);

    // Dropdown opens and lists existing projects.
    await page.getByTestId('project-select-trigger').click();
    await expect(page.getByTestId('project-select-content')).toBeVisible();
    await expect(page.getByTestId(`project-option-${PROJECTS[0].id}`)).toContainText('test - test');

    // Clicking selects immediately and closes the dropdown.
    await page.getByTestId(`project-option-${PROJECTS[0].id}`).click();
    await expect(page.getByTestId('project-select-content')).toBeHidden();
    await expect(page.getByTestId('project-select-trigger')).toContainText('test - test');

    // Client + organization load; project id stored.
    await expect(page.getByTestId('selected-project-card')).toBeVisible();
    await expect(page.getByTestId('selected-project-name')).toContainText('test - test');
    await expect(page.getByTestId('selected-project-client')).toContainText('ABC College');
    await expect(page.getByTestId('selected-project-org')).toContainText('Hyderabad');
    const storedId = await page.evaluate(() => window.localStorage.getItem('agentforge.intake.selectedProjectId'));
    expect(storedId).toBe(PROJECTS[0].id);

    // Search filters the list.
    await page.getByTestId('project-select-trigger').click();
    await page.getByTestId('project-search-input').fill('attendance');
    await expect(page.getByTestId(`project-option-${PROJECTS[1].id}`)).toBeVisible();
    await page.keyboard.press('Escape');

    await page.screenshot({ path: 'test-results/intake-project-selected.png' });

    // Selected project remains visible after refresh.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('project-select-trigger')).toContainText('test - test', { timeout: 20000 });
    await expect(page.getByTestId('selected-project-card')).toContainText('ABC College');
  });

  test('PDF upload shows preview; remove and replace work', async ({ page }) => {
    await gotoIntake(page);
    await selectTestProject(page);

    const pdf = { name: 'requirements.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test pdf content') };
    await page.getByTestId('requirements-file-input').setInputFiles(pdf);
    await expect(page.getByTestId('requirements-preview')).toBeVisible();
    await expect(page.getByTestId('requirements-file-name')).toContainText('requirements.pdf');
    await expect(page.getByTestId('requirements-file-size')).toContainText('B');
    await expect(page.getByText('Uploaded successfully.')).toBeVisible();
    await page.screenshot({ path: 'test-results/intake-upload-pdf.png' });

    // Remove works.
    await page.getByTestId('requirements-remove').click();
    await expect(page.getByTestId('requirements-preview')).toBeHidden();
    await expect(page.getByTestId('requirements-dropzone')).toBeVisible();

    // Replace works (upload DOC after PDF).
    await page.getByTestId('requirements-file-input').setInputFiles(pdf);
    await expect(page.getByTestId('requirements-file-name')).toContainText('requirements.pdf');
    const doc = {
      name: 'Requirements_v2.doc',
      mimeType: 'application/msword',
      buffer: Buffer.from('fake doc content'),
    };
    await page.getByTestId('requirements-replace-input').setInputFiles(doc);
    await expect(page.getByTestId('requirements-file-name')).toContainText('Requirements_v2.doc');
  });

  test('drag & drop zone activates on dragover and accepts files via picker', async ({ page }) => {
    await gotoIntake(page);
    await selectTestProject(page);

    const dropzone = page.getByTestId('requirements-dropzone');
    await expect(dropzone).toBeVisible();
    // Drag interaction uses the same validated handleFileSelect pipeline as
    // click-upload: dragover highlights the zone...
    await dropzone.dispatchEvent('dragover');
    await expect(page.getByText('Drop it — I’ll take it from here')).toBeVisible();
    await dropzone.dispatchEvent('dragleave');
    await expect(page.getByText('Drag & drop or click to upload')).toBeVisible();
    // ...and the zone stays functional afterwards.
    await page.getByTestId('requirements-file-input').setInputFiles({
      name: 'drag-proven.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 drag test'),
    });
    await expect(page.getByTestId('requirements-file-name')).toContainText('drag-proven.pdf');
  });

  test('DOC and DOCX uploads validate; PNG/ZIP rejected with error', async ({ page }) => {
    await gotoIntake(page);
    await selectTestProject(page);

    for (const f of [
      { name: 'spec.doc', mimeType: 'application/msword', buffer: Buffer.from('doc-bytes') },
      {
        name: 'Requirements_v2.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: Buffer.from('docx-bytes'),
      },
    ]) {
      await page.getByTestId('requirements-file-input').setInputFiles(f);
      await expect(page.getByTestId('requirements-preview')).toBeVisible();
      await expect(page.getByTestId('requirements-file-name')).toContainText(f.name);
      await page.getByTestId('requirements-remove').click();
      await expect(page.getByTestId('requirements-dropzone')).toBeVisible();
    }

    // Reject PNG with toast; no preview appears.
    await page.getByTestId('requirements-file-input').setInputFiles({
      name: 'evil.png',
      mimeType: 'image/png',
      buffer: Buffer.from('png-bytes'),
    });
    await expect(page.getByRole('alert').first()).toContainText(/Invalid file type/i);
    await expect(page.getByTestId('requirements-dropzone')).toBeVisible();
  });

  test('20 MB limit enforced', async ({ page }) => {
    await gotoIntake(page);
    await selectTestProject(page);
    const big = {
      name: 'huge.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(21 * 1024 * 1024, 0x61),
    };
    await page.getByTestId('requirements-file-input').setInputFiles(big);
    await expect(page.getByRole('alert').first()).toContainText(/20 MB/i);
  });

  test('start execution enables when ready; POST /intelligence/intake 200; analysis begins', async ({ page }) => {
    await gotoIntake(page);

    const startBtn = page.getByTestId('start-execution-button');
    await expect(startBtn).toBeDisabled();
    await expect(page.getByText('Select a project to continue.')).toBeVisible();

    await selectTestProject(page);
    // Project chosen but no file → still disabled with reason.
    await expect(startBtn).toBeDisabled();
    await expect(page.getByTestId('start-disabled-reason')).toContainText('Upload requirements.');

    const docx = {
      name: 'Requirements_v2.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('docx-bytes for execution'),
    };
    await page.getByTestId('requirements-file-input').setInputFiles(docx);
    await expect(page.getByTestId('requirements-preview')).toBeVisible();

    // Now enabled (provider mocked healthy).
    await expect(startBtn).toBeEnabled({ timeout: 15000 });

    const uploadReq = page.waitForResponse(
      (r) => r.url().includes('/intelligence/intake') && r.request().method() === 'POST',
      { timeout: 20000 },
    );
    await startBtn.click();
    // Loading state appears while the upload is in flight (mock delays the
    // response) and prevents double clicks.
    await expect(page.getByTestId('intake-loading-phase')).toBeVisible({ timeout: 10000 });
    await expect(startBtn).toBeDisabled();
    const resp = await uploadReq;
    expect(resp.status()).toBe(200);

    // Requirements Analysis begins automatically.
    await expect(page.getByText(/Requirements/i).first()).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: 'test-results/intake-execution-started.png' });
  });
});
