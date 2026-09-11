import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export async function takeScreenshot(page: Page, name: string, options: { fullPage?: boolean; animations?: 'disabled' | 'allow' } = {}): Promise<Buffer> {
  const screenshotDir = path.join(process.cwd(), 'test-results', 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const filepath = path.join(screenshotDir, `${name}.png`);
  const buffer = await page.screenshot({
    path: filepath,
    fullPage: options.fullPage ?? true,
    animations: options.animations ?? 'disabled',
  });

  return buffer;
}

export async function takeElementScreenshot(page: Page, selector: string, name: string): Promise<Buffer> {
  const screenshotDir = path.join(process.cwd(), 'test-results', 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const filepath = path.join(screenshotDir, `${name}.png`);
  const element = page.locator(selector);
  const buffer = await element.screenshot({ path: filepath });

  return buffer;
}

export async function compareScreenshots(
  page: Page,
  name: string,
  options: { threshold?: number; maxDiffPixels?: number } = {}
): Promise<boolean> {
  const { expect } = await import('@playwright/test');
  await expect(page).toHaveScreenshot(`${name}.png`, {
    threshold: options.threshold ?? 0.2,
    maxDiffPixels: options.maxDiffPixels ?? 100,
  });
  return true;
}

export async function captureFullPageScreenshot(page: Page, name: string): Promise<Buffer> {
  return takeScreenshot(page, name, { fullPage: true });
}

export async function captureViewportScreenshot(page: Page, name: string): Promise<Buffer> {
  return takeScreenshot(page, name, { fullPage: false });
}