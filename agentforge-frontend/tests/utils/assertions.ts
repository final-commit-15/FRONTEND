import { Page, Locator, expect } from '@playwright/test';

export async function expectVisible(locator: Locator, timeout: number = 5000) {
  await expect(locator).toBeVisible({ timeout });
}

export async function expectHidden(locator: Locator, timeout: number = 5000) {
  await expect(locator).toBeHidden({ timeout });
}

export async function expectEnabled(locator: Locator, timeout: number = 5000) {
  await expect(locator).toBeEnabled({ timeout });
}

export async function expectDisabled(locator: Locator, timeout: number = 5000) {
  await expect(locator).toBeDisabled({ timeout });
}

export async function expectChecked(locator: Locator, timeout: number = 5000) {
  await expect(locator).toBeChecked({ timeout });
}

export async function expectUnchecked(locator: Locator, timeout: number = 5000) {
  await expect(locator).not.toBeChecked({ timeout });
}

export async function expectText(locator: Locator, text: string | RegExp, timeout: number = 5000) {
  await expect(locator).toContainText(text, { timeout });
}

export async function expectExactText(locator: Locator, text: string, timeout: number = 5000) {
  await expect(locator).toHaveText(text, { timeout });
}

export async function expectAttribute(locator: Locator, name: string, value: string | RegExp, timeout: number = 5000) {
  await expect(locator).toHaveAttribute(name, value, { timeout });
}

export async function expectClass(locator: Locator, className: string, timeout: number = 5000) {
  await expect(locator).toHaveClass(new RegExp(className), { timeout });
}

export async function expectCount(locator: Locator, count: number, timeout: number = 5000) {
  await expect(locator).toHaveCount(count, { timeout });
}

export async function expectUrl(page: Page, url: string | RegExp, timeout: number = 5000) {
  await expect(page).toHaveURL(url, { timeout });
}

export async function expectTitle(page: Page, title: string | RegExp, timeout: number = 5000) {
  await expect(page).toHaveTitle(title, { timeout });
}

export async function expectToast(page: Page, message: string | RegExp, type: 'success' | 'error' | 'info' | 'warning' = 'success') {
  const toast = page.locator(`[data-testid="toast"], .toast, [role="status"], .alert`).filter({ hasText: message });
  await expect(toast.first()).toBeVisible({ timeout: 10000 });
  if (type !== 'success') {
    await expect(toast.first()).toHaveClass(new RegExp(type));
  }
}

export async function expectErrorMessage(page: Page, message: string | RegExp) {
  await expectToast(page, message, 'error');
}

export async function expectSuccessMessage(page: Page, message: string | RegExp) {
  await expectToast(page, message, 'success');
}

export async function expectFormFieldError(page: Page, fieldName: string, message: string | RegExp) {
  const field = page.locator(`[name="${fieldName}"], #${fieldName}`).first();
  const error = field.locator('..').locator('[data-testid="error"], .error, [role="alert"]').first();
  await expect(error).toContainText(message);
}

export async function expectNoConsoleErrors(page: Page, ignoredPatterns: RegExp[] = []) {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!ignoredPatterns.some(p => p.test(text))) {
        errors.push(text);
      }
    }
  });
  await page.waitForLoadState('networkidle');
  expect(errors).toHaveLength(0);
}

export async function expectApiResponse(response: { status: number; data?: unknown }, expectedStatus: number = 200) {
  expect(response.status).toBe(expectedStatus);
}

export async function expectApiSchema(response: { data?: unknown }, schema: Record<string, unknown>) {
  if (response.data && typeof response.data === 'object') {
    for (const [key, expectedType] of Object.entries(schema)) {
      expect(response.data).toHaveProperty(key);
      const value = (response.data as Record<string, unknown>)[key];
      if (expectedType === 'string') expect(typeof value).toBe('string');
      else if (expectedType === 'number') expect(typeof value).toBe('number');
      else if (expectedType === 'boolean') expect(typeof value).toBe('boolean');
      else if (expectedType === 'array') expect(Array.isArray(value)).toBe(true);
      else if (expectedType === 'object') expect(typeof value).toBe('object');
    }
  }
}