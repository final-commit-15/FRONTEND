import { test, expect, Page } from '@playwright/test';

// Production hardening suite: provider switching end-to-end, execute payload,
// and provider Settings truthfulness. API layer is mocked; the app code under
// test is real (persistence, payloads, status mapping, wiring).

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
];

const PROVIDERS = {
  providers: [
    {
      provider: 'groq',
      enabled: true,
      connected: true,
      default_model: 'llama-3.3-70b-versatile',
      models: ['llama-3.3-70b-versatile', 'qwen-3-32b'],
      priority: 99,
      timeout: 30,
      max_retries: 3,
      health_status: 'healthy',
      models_available: 2,
    },
    {
      provider: 'opencode-zen',
      enabled: true,
      connected: true,
      default_model: 'muse-spark-1.3-contributor-free',
      models: ['muse-spark-1.3-contributor-free'],
      priority: 97,
      timeout: 30,
      max_retries: 3,
      health_status: 'healthy',
      models_available: 1,
    },
    {
      provider: 'google-ai',
      enabled: true,
      connected: false,
      default_model: 'gemini-2.5-flash',
      models: [],
      priority: 100,
      timeout: 30,
      max_retries: 3,
      health_status: 'not_configured',
      models_available: 0,
    },
  ],
  default_provider: 'groq',
  default_model: 'llama-3.3-70b-versatile',
};

const HEALTH = {
  providers: {
    groq: {
      provider: 'groq',
      is_healthy: true,
      last_check: new Date().toISOString(),
      latency_ms: 210,
      error_rate: 0,
      consecutive_failures: 0,
      models_available: 2,
    },
  },
  overall_healthy: true,
};

const MODELS = {
  models: {
    groq: [
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B',
        provider: 'groq',
        capabilities: ['chat'],
        context_window: 128000,
        max_output_tokens: 4096,
        pricing_input: 0,
        pricing_output: 0,
        is_free: true,
        is_available: true,
        metadata: {},
      },
    ],
    'google-ai': [],
  },
};

async function mockProductionApis(page: Page, hooks: { onExecuteBody?: (body: any) => void } = {}) {
  const isApi = (route: any) => {
    const rt = route.request().resourceType();
    if (rt !== 'xhr' && rt !== 'fetch') return false;
    try {
      const u = new URL(route.request().url());
      if ((u.hostname === 'localhost' || u.hostname === '127.0.0.1') && u.port === '5173') return false;
    } catch {
      return false;
    }
    return true;
  };

  await page.route('**/auth/me', async (route) => {
    if (!isApi(route)) return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'test@agentforge.ai' }) });
  });
  await page.route('**/settings/', async (route) => {
    if (!isApi(route)) return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 'u1' } }) });
  });

  await page.route('**/api/projects**', async (route) => {
    if (!isApi(route)) return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PROJECTS) });
  });
  await page.route('**/projects/**', async (route) => {
    if (!isApi(route)) return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PROJECTS) });
  });

  // NOTE: Playwright checks later-registered routes first, so the general
  // health handler is registered BEFORE the per-provider one.
  await page.route('**/ai/providers/health**', async (route) => {
    if (!isApi(route)) return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(HEALTH) });
  });
  await page.route('**/ai/providers/health/**', async (route) => {
    if (!isApi(route)) return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(HEALTH.providers.groq) });
  });
  await page.route('**/ai/providers/models**', async (route) => {
    if (!isApi(route)) return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MODELS) });
  });
  await page.route('**/ai/providers/groq/refresh-models', async (route) => {
    if (!isApi(route)) return route.continue();
    if (route.request().method() === 'OPTIONS') return corsOk(route);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ provider: 'groq', count: 2, models: ['llama-3.3-70b-versatile', 'qwen-3-32b'] }),
    });
  });
  await page.route('**/ai/providers/groq/enabled', async (route) => {
    if (!isApi(route)) return route.continue();
    if (route.request().method() === 'OPTIONS') return corsOk(route);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ provider: 'groq', enabled: false, connected: true }),
    });
  });
  await page.route('**/ai/providers**', async (route) => {
    if (!isApi(route)) return route.continue();
    const url = route.request().url();
    // NOTE: fallback() (not continue()) delegates to the more specific
    // handlers above; continue() would skip them and hit the network.
    if (url.includes('/health') || url.includes('/models') || url.includes('/enabled') || url.includes('/refresh')) {
      return route.fallback();
    }
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
    if (!isApi(route)) return route.continue();
    if (route.request().method() === 'OPTIONS') return corsOk(route);
    await new Promise((r) => setTimeout(r, 800));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        requirement_id: 'req-123',
        project_id: PROJECTS[0].id,
        filename: 'Requirements_v2.docx',
        file_size: 1024,
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        status: 'uploaded',
      }),
    });
  });
  await page.route('**/requirements', async (route) => {
    if (!isApi(route)) return route.continue();
    const req = route.request();
    if (req.method() === 'OPTIONS') return corsOk(route);
    if (req.method() === 'POST' && !req.url().includes('/upload') && !req.url().includes('/execute')) {
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'req-123', title: 'test - test' }) });
      return;
    }
    return route.continue();
  });
  await page.route('**/requirements/*/upload', async (route) => {
    if (!isApi(route)) return route.continue();
    if (route.request().method() === 'OPTIONS') return corsOk(route);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'req-123' }) });
  });
  await page.route('**/requirements/*/execute', async (route) => {
    if (!isApi(route)) return route.continue();
    if (route.request().method() === 'OPTIONS') return corsOk(route);
    try {
      hooks.onExecuteBody?.(route.request().postDataJSON());
    } catch {
      hooks.onExecuteBody?.(null);
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ jobId: 'req-123', runId: 'run-1', status: 'started', currentStage: 'requirements_analysis', provider: 'groq' }),
    });
  });
  await page.route('**/monitoring/**', async (route) => {
    if (!isApi(route)) return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'running',
        pipelineStatus: 'running',
        current_stage: 'requirements',
        progress: 12,
        stages: [{ key: 'requirements', label: 'Requirements', status: 'running' }],
      }),
    });
  });
  await page.route('**/intelligence/activity/**', async (route) => {
    if (!isApi(route)) return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ events: [] }) });
  });
  await page.route('**/intelligence/logs/**', async (route) => {
    if (!isApi(route)) return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ logs: [] }) });
  });

  // App-shell + sidebar calls: mock so a live backend's 401s can never log
  // the test out mid-run (the auth interceptor logs out on 401).
  await page.route('**/intelligence/model-ownership**', async (route) => {
    if (!isApi(route)) return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ provider: 'multi-provider', pipelineOwner: '', models: [], providerModels: {} }),
    });
  });
  await page.route('**/sprints**', async (route) => {
    if (!isApi(route)) return route.continue();
    if (route.request().url().includes('/requirements/')) return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0 }) });
  });
  await page.route('**/notifications**', async (route) => {
    if (!isApi(route)) return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
}

async function seedAuth(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'agentforge-auth',
      JSON.stringify({
        state: { accessToken: 't', refreshToken: 'r', user: { id: 'u1' }, workspace: null, isAuthenticated: true },
        version: 0,
      }),
    );
    // Pre-select groq so the execute-payload test exercises a stored choice.
    // Guarded: must NOT reset on reload (switch test relies on persistence).
    if (!window.localStorage.getItem('agentforge.provider.selected')) {
      window.localStorage.setItem('agentforge.provider.selected', 'groq');
    }
  });
}

async function startPipeline(page: Page) {
  await page.getByTestId('project-select-trigger').click();
  await expect(page.getByTestId('project-select-content')).toBeVisible({ timeout: 10000 });
  const option = page.getByTestId(`project-option-${PROJECTS[0].id}`);
  await expect(option).toBeVisible({ timeout: 10000 });
  await option.click();
  await page.getByTestId('requirements-file-input').setInputFiles({
    name: 'Requirements_v2.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: Buffer.from('docx-bytes'),
  });
  await expect(page.getByTestId('start-execution-button')).toBeEnabled({ timeout: 15000 });
  await page.getByTestId('start-execution-button').click();
  // Started view: pipeline stepper/sidebar appears.
  await expect(page.getByTestId('provider-switch-groq')).toBeVisible({ timeout: 25000 });
}

test.describe('Production hardening — providers & execution wiring', () => {
  test('execute payload carries provider + model from backend data', async ({ page }) => {
    let executeBody: any = null;
    await seedAuth(page);
    await mockProductionApis(page, { onExecuteBody: (b) => { executeBody = b; } });
    await page.goto('/ai-intake', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('project-select-trigger')).toBeVisible({ timeout: 20000 });
    await startPipeline(page);
    // Execute fires after intake upload + requirement create — wait for it.
    const execResp = await page.waitForResponse(
      (r) => r.url().includes('/requirements/req-123/execute') && r.request().method() === 'POST',
      { timeout: 25000 },
    );
    expect(execResp.status()).toBe(200);
    expect(executeBody).not.toBeNull();
    expect(executeBody.provider).toBe('groq');
    expect(executeBody.model).toContain('llama');
    await page.screenshot({ path: 'test-results/prod-execute-provider.png' });
  });

  test('provider switch persists across reload and syncs storage', async ({ page }) => {
    await seedAuth(page);
    await mockProductionApis(page);
    await page.goto('/ai-intake', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('project-select-trigger')).toBeVisible({ timeout: 20000 });
    await startPipeline(page);

    // groq pre-selected (stored); click opencode-zen for a real switch.
    await expect(page.getByTestId('provider-switch-groq')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('provider-switch-opencode-zen').click();
    await expect(page.getByTestId('provider-switch-opencode-zen')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => window.localStorage.getItem('agentforge.provider.selected'))).toBe('opencode-zen');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('provider-switch-opencode-zen')).toHaveAttribute('aria-pressed', 'true', { timeout: 25000 });
    expect(await page.evaluate(() => window.localStorage.getItem('agentforge.provider.selected'))).toBe('opencode-zen');
    await page.screenshot({ path: 'test-results/prod-provider-switch.png' });
  });

  test('settings shows truthful statuses; refresh + test hit real endpoints', async ({ page }) => {
    await seedAuth(page);
    await mockProductionApis(page);
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: 'AI Providers' }).click();
    await expect(page.getByTestId('provider-card-groq')).toBeVisible({ timeout: 20000 });

    await expect(page.getByTestId('provider-status-groq')).toContainText('Healthy');
    await expect(page.getByTestId('provider-status-google-ai')).toContainText('Not Configured');
    await expect(page.getByTestId('provider-card-google-ai')).toContainText('API key missing.');
    await expect(page.getByTestId('provider-card-groq')).not.toContainText('Degraded');

    // Per-provider controls live inside the inner provider tabs.
    await page.getByRole('tab', { name: 'Groq' }).click();
    await expect(page.getByTestId('provider-connection-groq')).toContainText('Connected');
    await expect(page.getByTestId('provider-meta-groq')).toContainText('Model Count:');

    const refreshCall = page.waitForResponse(
      (r) => r.url().includes('/ai/providers/groq/refresh-models') && r.request().method() === 'POST',
      { timeout: 15000 },
    );
    await page.getByTestId('provider-refresh-groq').click();
    const refreshResp = await refreshCall;
    expect(refreshResp.status()).toBe(200);
    await expect(page.getByText('models refreshed')).toBeVisible({ timeout: 10000 });

    const testCall = page.waitForResponse(
      (r) => r.url().includes('/ai/providers/health/groq'),
      { timeout: 15000 },
    );
    await page.getByTestId('provider-test-groq').click();
    const testResp = await testCall;
    expect(testResp.status()).toBe(200);
    await expect(page.getByText('Connection successful')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/prod-settings-providers.png' });
  });
});
