import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from '../pages';

test.describe('Smoke Tests', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AgentForge/i);
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('email-input').or(page.locator('input[type="email"]'))).toBeVisible();
    await expect(page.getByTestId('password-input').or(page.locator('input[type="password"]'))).toBeVisible();
    await expect(page.getByTestId('login-button').or(page.locator('button[type="submit"]'))).toBeVisible();
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('dashboard loads with stats', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.open();
    await dashboardPage.expectDashboardLoaded();
  });

  test('sidebar navigation works', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.open();
    await dashboardPage.navigateSidebar('Agents');
    await expect(page).toHaveURL(/.*agents/);
  });

  test('health endpoint reachable', async ({ request }) => {
    const response = await request.get(`${process.env.API_URL || 'http://localhost:8000'}/health`);
    expect(response.ok()).toBeTruthy();
  });
});