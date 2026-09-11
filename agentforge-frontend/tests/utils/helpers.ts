import { Page, Locator, expect } from '@playwright/test';

export async function waitForElement(locator: Locator, timeout: number = 10000): Promise<void> {
  await locator.waitFor({ state: 'visible', timeout });
}

export async function waitForElementHidden(locator: Locator, timeout: number = 10000): Promise<void> {
  await locator.waitFor({ state: 'hidden', timeout });
}

export async function waitForNetworkIdle(page: Page, timeout: number = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

export async function waitForResponse(page: Page, urlPattern: string | RegExp, timeout: number = 10000) {
  return page.waitForResponse(urlPattern, { timeout });
}

export async function waitForRequest(page: Page, urlPattern: string | RegExp, timeout: number = 10000) {
  return page.waitForRequest(urlPattern, { timeout });
}

export async function scrollToElement(page: Page, selector: string): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

export async function hoverAndClick(page: Page, hoverSelector: string, clickSelector: string): Promise<void> {
  await page.hover(hoverSelector);
  await page.click(clickSelector);
}

export async function dragAndDrop(
  page: Page,
  sourceSelector: string,
  targetSelector: string,
  options?: { sourcePosition?: { x: number; y: number }; targetPosition?: { x: number; y: number } }
): Promise<void> {
  const source = page.locator(sourceSelector);
  const target = page.locator(targetSelector);
  await source.dragTo(target, options);
}

export async function fillForm(page: Page, fields: Record<string, string>): Promise<void> {
  for (const [selector, value] of Object.entries(fields)) {
    await page.fill(selector, value);
  }
}

export async function selectOptions(page: Page, fields: Record<string, string>): Promise<void> {
  for (const [selector, value] of Object.entries(fields)) {
    await page.selectOption(selector, value);
  }
}

export async function checkCheckboxes(page: Page, selectors: string[]): Promise<void> {
  for (const selector of selectors) {
    await page.check(selector);
  }
}

export async function uncheckCheckboxes(page: Page, selectors: string[]): Promise<void> {
  for (const selector of selectors) {
    await page.uncheck(selector);
  }
}

export async function uploadFile(page: Page, selector: string, filePath: string): Promise<void> {
  await page.setInputFiles(selector, filePath);
}

export async function getTableData(page: Page, tableSelector: string): Promise<string[][]> {
  const rows = page.locator(`${tableSelector} tbody tr`);
  const count = await rows.count();
  const data: string[][] = [];

  for (let i = 0; i < count; i++) {
    const cells = rows.nth(i).locator('td');
    const cellCount = await cells.count();
    const rowData: string[] = [];
    for (let j = 0; j < cellCount; j++) {
      rowData.push((await cells.nth(j).textContent()) || '');
    }
    data.push(rowData);
  }
  return data;
}

export async function expectToast(page: Page, message: string | RegExp, type: 'success' | 'error' | 'info' = 'success'): Promise<void> {
  const toast = page.locator(`[data-testid="toast"], .toast, [role="status"]`).filter({ hasText: message });
  await expect(toast.first()).toBeVisible({ timeout: 5000 });
}

export async function expectModalOpen(page: Page, title?: string): Promise<void> {
  const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]').first();
  await expect(modal).toBeVisible();
  if (title) {
    await expect(modal).toContainText(title);
  }
}

export async function expectModalClosed(page: Page): Promise<void> {
  const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]').first();
  await expect(modal).toBeHidden();
}

export async function takeScreenshot(page: Page, name: string, fullPage: boolean = true): Promise<Buffer> {
  return page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage });
}

export async function measurePerformance(page: Page, name: string): Promise<PerformanceEntry[]> {
  await page.evaluate((n) => performance.mark(`${n}-start`), name);
  await page.waitForLoadState('networkidle');
  await page.evaluate((n) => performance.mark(`${n}-end`), name);
  await page.evaluate((n) => performance.measure(n, `${n}-start`, `${n}-end`), name);
  return page.evaluate((n) => performance.getEntriesByName(n), name);
}

export async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function getConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}