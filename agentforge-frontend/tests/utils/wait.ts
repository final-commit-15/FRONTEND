import { Page, Locator, expect } from '@playwright/test';

export async function waitForApiResponse(page: Page, urlPattern: string | RegExp, timeout: number = 30000) {
  return page.waitForResponse(urlPattern, { timeout });
}

export async function waitForApiResponses(page: Page, urlPatterns: (string | RegExp)[], timeout: number = 30000) {
  const promises = urlPatterns.map(pattern => page.waitForResponse(pattern, { timeout }));
  return Promise.all(promises);
}

export async function waitForNetworkIdle(page: Page, timeout: number = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

export async function waitForElementVisible(locator: Locator, timeout: number = 10000) {
  await locator.waitFor({ state: 'visible', timeout });
}

export async function waitForElementHidden(locator: Locator, timeout: number = 10000) {
  await locator.waitFor({ state: 'hidden', timeout });
}

export async function waitForElementCount(locator: Locator, count: number, timeout: number = 10000) {
  await expect(locator).toHaveCount(count, { timeout });
}

export async function waitForText(locator: Locator, text: string | RegExp, timeout: number = 10000) {
  await expect(locator).toContainText(text, { timeout });
}

export async function waitForUrl(page: Page, url: string | RegExp, timeout: number = 10000) {
  await page.waitForURL(url, { timeout });
}

export async function waitForLoadState(page: Page, state: 'load' | 'domcontentloaded' | 'networkidle' = 'networkidle', timeout: number = 30000) {
  await page.waitForLoadState(state, { timeout });
}

export async function waitForSelector(page: Page, selector: string, options?: { timeout?: number; state?: 'attached' | 'detached' | 'visible' | 'hidden' }) {
  await page.waitForSelector(selector, options);
}

export async function waitForFunction(page: Page, fn: () => Promise<boolean>, timeout: number = 10000) {
  await page.waitForFunction(fn, undefined, { timeout });
}

export async function waitForAnimationComplete(page: Page, timeout: number = 5000) {
  await page.waitForFunction(
    () => document.getAnimations().every(animation => animation.playState === 'finished'),
    undefined,
    { timeout }
  );
}

export async function waitForMutation(locator: Locator, timeout: number = 5000) {
  await locator.waitFor({ state: 'attached', timeout });
}