import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { LoginPage, DashboardPage, ChatPage, WorkflowPage, BillingPage, SettingsPage } from '../pages';

test.describe('Accessibility Tests', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let chatPage: ChatPage;
  let workflowPage: WorkflowPage;
  let billingPage: BillingPage;
  let settingsPage: SettingsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    chatPage = new ChatPage(page);
    workflowPage = new WorkflowPage(page);
    billingPage = new BillingPage(page);
    settingsPage = new SettingsPage(page);
  });

  test('login page has no accessibility violations', async ({ page }) => {
    await loginPage.goto('/login');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('dashboard page has no accessibility violations', async ({ page }) => {
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await dashboardPage.open();
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('chat page has no accessibility violations', async ({ page }) => {
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await chatPage.open();
    await chatPage.startNewChat();
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('workflow builder page has no accessibility violations', async ({ page }) => {
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await workflowPage.open();
    await workflowPage.createWorkflow('A11y Test Workflow');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('billing page has no accessibility violations', async ({ page }) => {
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await billingPage.open();
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('settings page has no accessibility violations', async ({ page }) => {
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await settingsPage.open();
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation works on login page', async ({ page }) => {
    await loginPage.goto('/login');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('keyboard navigation works on dashboard', async ({ page }) => {
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await dashboardPage.open();
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('ARIA labels present on interactive elements', async ({ page }) => {
    await loginPage.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');

    await expect(emailInput).toHaveAttribute('aria-label', /email/i);
    await expect(passwordInput).toHaveAttribute('aria-label', /password/i);
    await expect(loginButton).toHaveAttribute('aria-label', /login|sign in/i);
  });

  test('focus indicators are visible', async ({ page }) => {
    await loginPage.goto('/login');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    const styles = await focused.evaluate(el => window.getComputedStyle(el));
    expect(styles.outline).not.toBe('none');
    expect(styles.outlineWidth).not.toBe('0px');
  });

  test('color contrast meets WCAG AA', async ({ page }) => {
    await loginPage.goto('/login');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();
    const contrastViolations = accessibilityScanResults.violations.filter(v =>
      v.id === 'color-contrast'
    );
    expect(contrastViolations).toEqual([]);
  });

  test('form labels are associated', async ({ page }) => {
    await loginPage.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    const emailId = await emailInput.getAttribute('id');
    const passwordId = await passwordInput.getAttribute('id');

    if (emailId) {
      const label = page.locator(`label[for="${emailId}"]`);
      await expect(label).toBeVisible();
    }
    if (passwordId) {
      const label = page.locator(`label[for="${passwordId}"]`);
      await expect(label).toBeVisible();
    }
  });

  test('error messages are announced', async ({ page }) => {
    await loginPage.goto('/login');
    await loginPage.login('invalid@test.com', 'wrongpassword');
    const error = page.locator('[role="alert"], [aria-live="assertive"], .error-message');
    await expect(error).toBeVisible();
  });
});