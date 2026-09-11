import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string = '') {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForSelector(selector: string, options?: { timeout?: number; state?: 'attached' | 'detached' | 'visible' | 'hidden' }) {
    await this.page.waitForSelector(selector, options);
  }

  async click(selector: string, options?: { force?: boolean; timeout?: number }) {
    await this.page.click(selector, options);
  }

  async fill(selector: string, value: string, options?: { force?: boolean; timeout?: number }) {
    await this.page.fill(selector, value, options);
  }

  async hover(selector: string) {
    await this.page.hover(selector);
  }

  async selectOption(selector: string, value: string) {
    await this.page.selectOption(selector, value);
  }

  async getText(selector: string): Promise<string> {
    const element = await this.page.locator(selector).first();
    return (await element.textContent()) || '';
  }

  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    const element = await this.page.locator(selector).first();
    return element.getAttribute(attribute);
  }

  async isVisible(selector: string): Promise<boolean> {
    return this.page.locator(selector).isVisible();
  }

  async isEnabled(selector: string): Promise<boolean> {
    return this.page.locator(selector).isEnabled();
  }

  async waitForURL(url: string | RegExp, options?: { timeout?: number }) {
    await this.page.waitForURL(url, options);
  }

  async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'networkidle') {
    await this.page.waitForLoadState(state);
  }

  async screenshot(name: string, options?: { fullPage?: boolean }) {
    return this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: options?.fullPage ?? true });
  }

  async expectVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async expectHidden(selector: string) {
    await expect(this.page.locator(selector)).toBeHidden();
  }

  async expectText(selector: string, text: string | RegExp) {
    await expect(this.page.locator(selector)).toContainText(text);
  }

  async expectURL(url: string | RegExp) {
    await expect(this.page).toHaveURL(url);
  }

  async expectTitle(title: string | RegExp) {
    await expect(this.page).toHaveTitle(title);
  }

  locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  getByRole(role: string, options?: { name?: string | RegExp }) {
    return this.page.getByRole(role, options);
  }

  getByText(text: string | RegExp) {
    return this.page.getByText(text);
  }

  getByLabel(label: string | RegExp) {
    return this.page.getByLabel(label);
  }

  getByPlaceholder(placeholder: string | RegExp) {
    return this.page.getByPlaceholder(placeholder);
  }
}