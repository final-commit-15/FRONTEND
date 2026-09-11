import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly passwordToggle: Locator;
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByTestId('email-input').or(page.locator('input[type="email"]'));
    this.passwordInput = page.getByTestId('password-input').or(page.locator('input[type="password"]'));
    this.loginButton = page.getByTestId('login-button').or(page.locator('button[type="submit"]'));
    this.forgotPasswordLink = page.getByTestId('forgot-password-link').or(page.getByRole('link', { name: /forgot password/i }));
    this.registerLink = page.getByTestId('register-link').or(page.getByRole('link', { name: /sign up|register/i }));
    this.passwordToggle = page.getByTestId('password-toggle').or(page.locator('button[aria-label*="password" i]'));
    this.errorMessage = page.getByTestId('error-message').or(page.locator('[role="alert"]'));
    this.loadingSpinner = page.getByTestId('loading-spinner').or(page.locator('.animate-spin'));
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async loginAndWaitForDashboard(email: string, password: string): Promise<void> {
    await this.login(email, password);
    await this.page.waitForURL('**/dashboard', { timeout: 30000 });
  }

  async forgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToRegister(): Promise<void> {
    await this.registerLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.passwordToggle.click();
  }

  async getErrorMessage(): Promise<string> {
    return this.errorMessage.textContent() || '';
  }

  async expectError(message: string | RegExp): Promise<void> {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectNoError(): Promise<void> {
    await expect(this.errorMessage).toBeHidden();
  }

  async expectLoginFormVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  async expectLoading(): Promise<void> {
    await expect(this.loadingSpinner).toBeVisible();
  }
}