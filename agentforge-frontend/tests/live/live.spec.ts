import { test, expect, Page } from '@playwright/test';

// LIVE verification against the real Docker backend (Vite on :3000 proxies
// /api -> localhost:8000). No API mocking: every request hits real services.
const EMAIL = 'smoketest@agentforge.dev';
const PASSWORD = 'SmokeTest123!';
const DOCX = 'C:\\Users\\kanam\\Downloads\\Smart_Notes_AgentForge_Demo_Requirements.docx';

async function liveLogin(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL('**/dashboard', { timeout: 45000 });
}

test.describe('Live AgentForge against real backend', () => {
  test('login + dashboard', async ({ page }) => {
    await liveLogin(page);
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: 'test-results/live-dashboard.png', fullPage: true });
  });

  test('settings - AI providers show truthful live statuses', async ({ page }) => {
    await liveLogin(page);
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: /AI Providers|Providers/i }).first().click();
    await page.locator('[data-testid^="provider-card-"]').first().waitFor({ state: 'visible', timeout: 30000 });

    const cards = page.locator('[data-testid^="provider-card-"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(4);

    const statuses: string[] = [];
    for (let i = 0; i < count; i++) {
      const txt = (await cards.nth(i).innerText()).toLowerCase();
      statuses.push(txt.split('\n')[0] ?? `provider-${i}`);
      expect(txt, `provider card ${i} must not read Degraded`).not.toContain('degraded');
    }
    expect(statuses.length).toBe(count);
    await page.screenshot({ path: 'test-results/live-settings-providers.png', fullPage: true });
  });

  test('intake -> execute -> pipeline runs to completion with Monitoring Summary', async ({ page }) => {
    test.setTimeout(600000);
    await liveLogin(page);
    await page.goto('/ai-intake', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('project-select-trigger')).toBeVisible({ timeout: 30000 });

    // Pick the newest "Smart Notes Demo" project.
    let projectEl: import('@playwright/test').Locator | null = null;
    for (let attempt = 0; attempt < 3 && !projectEl; attempt++) {
      await page.getByTestId('project-select-trigger').click();
      await expect(page.getByTestId('project-select-content')).toBeVisible({ timeout: 15000 });
      const opts = page.locator('[data-testid^="project-option-"]');
      const n = await opts.count();
      for (let i = 0; i < n; i++) {
        const opt = opts.nth(i);
        const txt = (await opt.innerText()).toLowerCase();
        if (txt.includes('smart notes demo')) {
          projectEl = opt;
          break;
        }
      }
      if (!projectEl) await page.keyboard.press('Escape');
    }
    expect(projectEl, 'a Smart Notes Demo project option must exist').not.toBeNull();
    await projectEl!.click();

    const fileInput = page.getByTestId('requirements-file-input');
    await fileInput.setInputFiles(DOCX);
    await expect(page.getByTestId('requirements-file-name')).toContainText('Smart_Notes_AgentForge_Demo_Requirements.docx', { timeout: 20000 });
    await expect(page.getByTestId('start-execution-button')).toBeEnabled({ timeout: 30000 });

    // Real execute -> pipeline runs in the live UI.
    await page.getByTestId('start-execution-button').click();

    // Provider switcher appears once the pipeline view mounts.
    const switcher = page.locator('[data-testid^="provider-switch-"]').first();
    await switcher.waitFor({ state: 'visible', timeout: 60000 });

    // Poll the pipeline monitor panel until terminal state.
    const deadline = Date.now() + 540000;
    let terminal = '';
    while (Date.now() < deadline) {
      const body = (await page.locator('body').innerText()).toLowerCase();
      if (body.includes('pipeline completed') || body.includes('monitoring summary completed')) {
        terminal = 'completed';
        break;
      }
      if (body.includes('pipeline failed')) {
        terminal = 'failed';
        break;
      }
      await page.screenshot({ path: 'test-results/live-pipeline-running.png' });
      await page.waitForTimeout(20000);
    }
    expect(terminal, 'live intake->pipeline must reach a terminal state').toBe('completed');

    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/live-pipeline-completed.png', fullPage: true });

    const finalBody = (await page.locator('body').innerText()).toLowerCase();
    expect(finalBody).toContain('monitoring summary');
  });
});