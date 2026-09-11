import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class SettingsPage extends BasePage {
  readonly profileTab: Locator;
  readonly securityTab: Locator;
  readonly apiKeysTab: Locator;
  readonly workspaceTab: Locator;
  readonly appearanceTab: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly avatarUpload: Locator;
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly saveProfileButton: Locator;
  readonly savePasswordButton: Locator;
  readonly themeSelector: Locator;
  readonly apiKeysList: Locator;
  readonly createApiKeyButton: Locator;
  readonly apiKeyModal: Locator;
  readonly apiKeyNameInput: Locator;
  readonly apiKeyValue: Locator;
  readonly deleteApiKeyButton: Locator;
  readonly workspaceNameInput: Locator;
  readonly workspaceMembers: Locator;
  readonly inviteMemberButton: Locator;
  readonly memberEmailInput: Locator;
  readonly memberRoleSelect: Locator;

  constructor(page: Page) {
    super(page);
    this.profileTab = page.getByTestId('profile-tab').or(page.getByRole('tab', { name: /profile/i }));
    this.securityTab = page.getByTestId('security-tab').or(page.getByRole('tab', { name: /security|password/i }));
    this.apiKeysTab = page.getByTestId('api-keys-tab').or(page.getByRole('tab', { name: /api keys/i }));
    this.workspaceTab = page.getByTestId('workspace-tab').or(page.getByRole('tab', { name: /workspace/i }));
    this.appearanceTab = page.getByTestId('appearance-tab').or(page.getByRole('tab', { name: /appearance|theme/i }));
    this.nameInput = page.getByTestId('name-input').or(page.locator('input[name="name"]'));
    this.emailInput = page.getByTestId('email-input').or(page.locator('input[name="email"]'));
    this.avatarUpload = page.getByTestId('avatar-upload').or(page.locator('input[type="file"][accept*="image"]'));
    this.currentPasswordInput = page.getByTestId('current-password').or(page.locator('input[name="currentPassword"]'));
    this.newPasswordInput = page.getByTestId('new-password').or(page.locator('input[name="newPassword"]'));
    this.confirmPasswordInput = page.getByTestId('confirm-password').or(page.locator('input[name="confirmPassword"]'));
    this.saveProfileButton = page.getByTestId('save-profile').or(page.getByRole('button', { name: /save profile/i }));
    this.savePasswordButton = page.getByTestId('save-password').or(page.getByRole('button', { name: /save password|update password/i }));
    this.themeSelector = page.getByTestId('theme-selector').or(page.locator('select[name="theme"], [role="radiogroup"][aria-label*="theme"]'));
    this.apiKeysList = page.getByTestId('api-keys-list').or(page.locator('[data-testid="keys"], .api-keys-list'));
    this.createApiKeyButton = page.getByTestId('create-api-key').or(page.getByRole('button', { name: /create|generate.*key/i }));
    this.apiKeyModal = page.getByTestId('api-key-modal').or(page.locator('[role="dialog"][data-testid*="key"]'));
    this.apiKeyNameInput = page.getByTestId('api-key-name').or(page.locator('input[name="keyName"]'));
    this.apiKeyValue = page.getByTestId('api-key-value').or(page.locator('[data-testid="key-value"], .api-key-value'));
    this.deleteApiKeyButton = page.getByTestId('delete-api-key').or(page.locator('button[aria-label*="delete.*key" i]'));
    this.workspaceNameInput = page.getByTestId('workspace-name').or(page.locator('input[name="workspaceName"]'));
    this.workspaceMembers = page.getByTestId('workspace-members').or(page.locator('[data-testid="members"], .members-list'));
    this.inviteMemberButton = page.getByTestId('invite-member').or(page.getByRole('button', { name: /invite/i }));
    this.memberEmailInput = page.getByTestId('member-email').or(page.locator('input[name="email"]'));
    this.memberRoleSelect = page.getByTestId('member-role').or(page.locator('select[name="role"]'));
  }

  async open(): Promise<void> {
    await this.goto('/settings');
    await this.waitForLoadState();
  }

  async updateProfile(name: string, email?: string): Promise<void> {
    await this.profileTab.click();
    await this.nameInput.fill(name);
    if (email) {
      await this.emailInput.fill(email);
    }
    await this.saveProfileButton.click();
    await this.waitForLoadState();
  }

  async uploadAvatar(filePath: string): Promise<void> {
    await this.profileTab.click();
    await this.avatarUpload.setInputFiles(filePath);
    await this.saveProfileButton.click();
    await this.waitForLoadState();
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.securityTab.click();
    await this.currentPasswordInput.fill(currentPassword);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(newPassword);
    await this.savePasswordButton.click();
    await this.waitForLoadState();
  }

  async changeTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await this.appearanceTab.click();
    if (await this.themeSelector.evaluate(el => el.tagName) === 'SELECT') {
      await this.themeSelector.selectOption(theme);
    } else {
      await this.themeSelector.getByRole('radio', { name: theme }).check();
    }
    await this.waitForLoadState();
  }

  async createApiKey(name: string): Promise<string> {
    await this.apiKeysTab.click();
    await this.createApiKeyButton.click();
    await this.apiKeyModal.waitFor({ state: 'visible' });
    await this.apiKeyNameInput.fill(name);
    await this.page.getByRole('button', { name: /create|generate/i }).click();
    await this.apiKeyValue.waitFor({ state: 'visible' });
    const key = await this.apiKeyValue.textContent();
    await this.page.getByRole('button', { name: /done|close/i }).click();
    return key || '';
  }

  async deleteApiKey(name: string): Promise<void> {
    await this.apiKeysTab.click();
    const key = this.apiKeysList.filter({ hasText: name }).first();
    await key.getByRole('button', { name: /delete/i }).click();
    await this.page.getByRole('button', { name: /confirm|delete/i }).click();
    await this.waitForLoadState();
  }

  async updateWorkspaceName(name: string): Promise<void> {
    await this.workspaceTab.click();
    await this.workspaceNameInput.fill(name);
    await this.page.getByRole('button', { name: /save/i }).click();
    await this.waitForLoadState();
  }

  async inviteMember(email: string, role: string): Promise<void> {
    await this.workspaceTab.click();
    await this.inviteMemberButton.click();
    await this.memberEmailInput.fill(email);
    await this.memberRoleSelect.selectOption(role);
    await this.page.getByRole('button', { name: /invite|send/i }).click();
    await this.waitForLoadState();
  }

  async expectProfileSaved(): Promise<void> {
    await expect(this.page.locator('.toast, [role="status"]')).toContainText(/saved|updated/i);
  }

  async expectApiKeyCreated(keyPrefix: string): Promise<void> {
    await expect(this.apiKeysList.filter({ hasText: keyPrefix }).first()).toBeVisible();
  }

  async expectApiKeyDeleted(name: string): Promise<void> {
    await expect(this.apiKeysList.filter({ hasText: name }).first()).toBeHidden();
  }

  async expectThemeApplied(theme: string): Promise<void> {
    const html = this.page.locator('html');
    if (theme === 'dark') {
      await expect(html).toHaveClass(/dark/);
    } else if (theme === 'light') {
      await expect(html).not.toHaveClass(/dark/);
    }
  }
}