import { Page, BrowserContext } from '@playwright/test';
import { LoginPage } from '../pages';

export async function login(
  page: Page,
  email: string = process.env.TEST_EMAIL || 'test@agentforge.ai',
  password: string = process.env.TEST_PASSWORD || 'password123'
): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto('/login');
  await loginPage.loginAndWaitForDashboard(email, password);
}

export async function logout(page: Page): Promise<void> {
  await page.getByTestId('user-menu').or(page.locator('button[aria-label*="user" i]')).click();
  await page.getByRole('menuitem', { name: /logout|sign out/i }).click();
  await page.waitForURL('**/login');
}

export async function saveAuthState(page: Page, path: string): Promise<void> {
  await page.context().storageState({ path });
}

export async function loadAuthState(context: BrowserContext, path: string): Promise<void> {
  // This is handled by storageState in context options
}

export async function getAuthToken(page: Page): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem('access_token') || sessionStorage.getItem('access_token'));
}

export async function setAuthToken(page: Page, token: string): Promise<void> {
  await page.evaluate((t) => localStorage.setItem('access_token', t), token);
}

export async function clearAuth(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function isAuthenticated(page: Page): Promise<boolean> {
  const token = await getAuthToken(page);
  return !!token;
}

export const TEST_CREDENTIALS = {
  admin: { email: process.env.ADMIN_EMAIL || 'admin@agentforge.ai', password: process.env.ADMIN_PASSWORD || 'admin123' },
  user: { email: process.env.TEST_EMAIL || 'test@agentforge.ai', password: process.env.TEST_PASSWORD || 'password123' },
  viewer: { email: process.env.VIEWER_EMAIL || 'viewer@agentforge.ai', password: process.env.VIEWER_PASSWORD || 'viewer123' },
};