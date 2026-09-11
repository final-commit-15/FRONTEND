import { test, expect } from '@playwright/test';
import { DashboardPage, LoginPage } from '../pages';

test.describe('Dashboard Tests', () => {
  let dashboardPage: DashboardPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    loginPage = new LoginPage(page);
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
  });

  test('dashboard loads with stats cards', async () => {
    await dashboardPage.open();
    await dashboardPage.verifyStatsVisible();
  });

  test('dashboard shows usage charts', async () => {
    await dashboardPage.open();
    await dashboardPage.verifyChartsLoaded();
  });

  test('recent activity section is visible', async () => {
    await dashboardPage.open();
    await expect(dashboardPage.recentActivity).toBeVisible();
  });

  test('workspace selector works', async () => {
    await dashboardPage.open();
    await expect(dashboardPage.workspaceSelector).toBeVisible();
  });

  test('sidebar navigation links work', async ({ page }) => {
    await dashboardPage.open();
    await dashboardPage.navigateSidebar('Agents');
    await expect(page).toHaveURL(/.*agents/);
    await page.goBack();
    await dashboardPage.navigateSidebar('Workflows');
    await expect(page).toHaveURL(/.*workflows/);
  });

  test('notifications badge is visible', async () => {
    await dashboardPage.open();
    await expect(dashboardPage.notificationsButton).toBeVisible();
  });

  test('loading skeletons appear during data fetch', async ({ page }) => {
    await page.route('**/api/v1/dashboard/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    await dashboardPage.open();
    await dashboardPage.expectLoading();
  });

  test('error state displays correctly', async ({ page }) => {
    await page.route('**/api/v1/dashboard/**', async route => {
      await route.fulfill({ status: 500, body: 'Server Error' });
    });
    await dashboardPage.open();
    await dashboardPage.expectError();
  });

  test('empty state displays when no data', async ({ page }) => {
    await page.route('**/api/v1/dashboard/**', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ stats: [], activities: [] }) });
    });
    await dashboardPage.open();
    await dashboardPage.expectEmpty();
  });

  test('user menu opens and shows options', async ({ page }) => {
    await dashboardPage.open();
    await dashboardPage.openUserMenu();
    await expect(page.getByRole('menuitem', { name: /profile|settings/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /logout|sign out/i })).toBeVisible();
  });
});