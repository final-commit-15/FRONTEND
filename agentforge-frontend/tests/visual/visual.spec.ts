import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage, ChatPage, WorkflowPage, BillingPage, SettingsPage } from '../pages';

test.describe('Visual Regression Tests', () => {
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

  test('login page matches snapshot', async ({ page }) => {
    await loginPage.goto('/login');
    await expect(page).toHaveScreenshot('login-page.png');
  });

  test('dashboard page matches snapshot', async ({ page }) => {
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await dashboardPage.open();
    await expect(page).toHaveScreenshot('dashboard-page.png');
  });

  test('chat page matches snapshot', async ({ page }) => {
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await chatPage.open();
    await chatPage.startNewChat();
    await expect(page).toHaveScreenshot('chat-page.png');
  });

  test('workflow builder page matches snapshot', async ({ page }) => {
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await workflowPage.open();
    await workflowPage.createWorkflow('Visual Test Workflow');
    await expect(page).toHaveScreenshot('workflow-page.png');
  });

  test('billing page matches snapshot', async ({ page }) => {
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await billingPage.open();
    await expect(page).toHaveScreenshot('billing-page.png');
  });

  test('settings page matches snapshot', async ({ page }) => {
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await settingsPage.open();
    await expect(page).toHaveScreenshot('settings-page.png');
  });

  test('mobile navigation matches snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await dashboardPage.open();
    await expect(page).toHaveScreenshot('mobile-dashboard.png');
  });

  test('dark theme dashboard matches snapshot', async ({ page }) => {
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await settingsPage.open();
    await settingsPage.changeTheme('dark');
    await dashboardPage.open();
    await expect(page).toHaveScreenshot('dashboard-dark.png');
  });

  test('light theme dashboard matches snapshot', async ({ page }) => {
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await settingsPage.open();
    await settingsPage.changeTheme('light');
    await dashboardPage.open();
    await expect(page).toHaveScreenshot('dashboard-light.png');
  });
});