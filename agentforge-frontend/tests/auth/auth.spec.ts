import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages';

test.describe('Authentication Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto('/login');
  });

  test('login with valid credentials', async ({ page }) => {
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('login with invalid credentials shows error', async () => {
    await loginPage.login('invalid@test.com', 'wrongpassword');
    await loginPage.expectError(/invalid|incorrect|failed/i);
  });

  test('login with empty email shows validation error', async () => {
    await loginPage.fill('[data-testid="password-input"], input[type="password"]', 'password123');
    await loginPage.click('[data-testid="login-button"], button[type="submit"]');
    await loginPage.expectError(/email|required/i);
  });

  test('login with empty password shows validation error', async () => {
    await loginPage.fill('[data-testid="email-input"], input[type="email"]', 'test@test.com');
    await loginPage.click('[data-testid="login-button"], button[type="submit"]');
    await loginPage.expectError(/password|required/i);
  });

  test('login with invalid email format shows error', async () => {
    await loginPage.login('invalid-email', 'password123');
    await loginPage.expectError(/invalid|format|email/i);
  });

  test('password visibility toggle works', async () => {
    await loginPage.fill('[data-testid="password-input"], input[type="password"]', 'password123');
    const passwordInput = loginPage.passwordInput;
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await loginPage.togglePasswordVisibility();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await loginPage.togglePasswordVisibility();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('forgot password link navigates to reset page', async ({ page }) => {
    await loginPage.forgotPassword();
    await expect(page).toHaveURL(/.*forgot-password/);
  });

  test('register link navigates to register page', async ({ page }) => {
    await loginPage.goToRegister();
    await expect(page).toHaveURL(/.*register/);
  });

  test('logout redirects to login', async ({ page }) => {
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await page.getByTestId('user-menu').or(page.locator('button[aria-label*="user" i]')).click();
    await page.getByRole('menuitem', { name: /logout|sign out/i }).click();
    await expect(page).toHaveURL(/.*login/);
  });

  test('unauthenticated access to protected routes redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('session persistence after page refresh', async ({ page }) => {
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await page.reload();
    await expect(page).toHaveURL(/.*dashboard/);
  });
});