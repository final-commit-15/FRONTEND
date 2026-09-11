/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars, react-hooks/rules-of-hooks */
import { test as base, Page, BrowserContext } from '@playwright/test';
import { LoginPage } from '../pages';

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  viewerPage: Page;
};

export const authTest = base.extend<AuthFixtures>({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'tests/.auth/user.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'tests/.auth/admin.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  viewerPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'tests/.auth/viewer.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export const createAuthContext = async (
  browser: import('@playwright/test').Browser,
  email: string,
  password: string,
  baseURL: string
): Promise<BrowserContext> => {
  const context = await browser.newContext();
  const page = await context.newPage();

  const loginPage = new LoginPage(page);
  await loginPage.goto('/login');
  await loginPage.loginAndWaitForDashboard(email, password);

  await context.storageState({ path: `tests/.auth/${email.replace('@', '-').replace('.', '-')}.json` });
  return context;
};

export const setupAuthStates = async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { chromium } = require('@playwright/test');
  const browser = await chromium.launch();
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';

  const testEmail = process.env.TEST_EMAIL || 'test@agentforge.ai';
  const testPassword = process.env.TEST_PASSWORD || 'password123';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@agentforge.ai';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const viewerEmail = process.env.VIEWER_EMAIL || 'viewer@agentforge.ai';
  const viewerPassword = process.env.VIEWER_PASSWORD || 'viewer123';

  await createAuthContext(browser, testEmail, testPassword, baseURL);
  await createAuthContext(browser, adminEmail, adminPassword, baseURL);
  await createAuthContext(browser, viewerEmail, viewerPassword, baseURL);

  await browser.close();
};