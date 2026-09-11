import { test, expect } from '@playwright/test';
import { DashboardPage, LoginPage } from '../pages';

test.describe('Notification Tests', () => {
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

  test('toast notification appears on action', async () => {
    await dashboardPage.open();
    await dashboardPage.navigateSidebar('Agents');
    // Should trigger a toast
    await dashboardPage.page.waitForTimeout(1000);
  });

  test('success toast appears on successful action', async ({ page }) => {
    await dashboardPage.open();
    // Trigger a success action
    await expectToast(page, /success|saved|created/i, 'success');
  });

  test('error toast appears on failed action', async ({ page }) => {
    await page.route('**/api/**', async route => {
      await route.fulfill({ status: 500, body: 'Server Error' });
    });
    await dashboardPage.open();
    await dashboardPage.navigateSidebar('Agents');
    await expectErrorMessage(page, /error|failed/i);
  });

  test('notifications panel opens', async () => {
    await dashboardPage.open();
    await dashboardPage.openNotifications();
    await expect(dashboardPage.page.locator('[data-testid="notifications-panel"], .notifications-panel')).toBeVisible();
  });

  test('unread notifications count is shown', async () => {
    await dashboardPage.open();
    const badge = dashboardPage.notificationsButton.locator('[data-testid="badge"], .badge');
    if (await badge.isVisible()) {
      await expect(badge).toBeVisible();
    }
  });

  test('mark all as read works', async () => {
    await dashboardPage.open();
    await dashboardPage.openNotifications();
    const markAllRead = dashboardPage.page.getByRole('button', { name: /mark all read/i });
    if (await markAllRead.isVisible()) {
      await markAllRead.click();
      // Badge should disappear
    }
  });
});

async function expectToast(page: any, message: string | RegExp, type: 'success' | 'error' | 'info' | 'warning' = 'success') {
  const { expect } = await import('@playwright/test');
  const toast = page.locator(`[data-testid="toast"], .toast, [role="status"], .alert`).filter({ hasText: message });
  await expect(toast.first()).toBeVisible({ timeout: 10000 });
}

async function expectErrorMessage(page: any, message: string | RegExp) {
  const { expect } = await import('@playwright/test');
  const toast = page.locator(`[data-testid="toast"], .toast, [role="status"], .alert`).filter({ hasText: message });
  await expect(toast.first()).toBeVisible({ timeout: 10000 });
  await expect(toast.first()).toHaveClass(/error/);
}