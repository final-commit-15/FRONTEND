import { test, expect } from '@playwright/test';
import { SettingsPage, LoginPage } from '../pages';

test.describe('Settings Tests', () => {
  let settingsPage: SettingsPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page);
    loginPage = new LoginPage(page);
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
  });

  test('settings page loads with tabs', async () => {
    await settingsPage.open();
    await expect(settingsPage.profileTab).toBeVisible();
    await expect(settingsPage.securityTab).toBeVisible();
    await expect(settingsPage.apiKeysTab).toBeVisible();
    await expect(settingsPage.workspaceTab).toBeVisible();
    await expect(settingsPage.appearanceTab).toBeVisible();
  });

  test('profile can be updated', async () => {
    await settingsPage.open();
    await settingsPage.updateProfile('Updated Name', 'updated@test.com');
    await settingsPage.expectProfileSaved();
  });

  test('avatar can be uploaded', async () => {
    await settingsPage.open();
    // Create a test file
    await settingsPage.uploadAvatar('tests/fixtures/test-avatar.png');
    await settingsPage.expectProfileSaved();
  });

  test('password can be changed', async () => {
    await settingsPage.open();
    await settingsPage.changePassword('password123', 'newpassword123');
    await settingsPage.expectProfileSaved();
  });

  test('theme can be changed to dark', async () => {
    await settingsPage.open();
    await settingsPage.changeTheme('dark');
    await settingsPage.expectThemeApplied('dark');
  });

  test('theme can be changed to light', async () => {
    await settingsPage.open();
    await settingsPage.changeTheme('light');
    await settingsPage.expectThemeApplied('light');
  });

  test('theme can be changed to system', async () => {
    await settingsPage.open();
    await settingsPage.changeTheme('system');
    await settingsPage.expectThemeApplied('system');
  });

  test('API key can be created', async () => {
    await settingsPage.open();
    const key = await settingsPage.createApiKey('Test API Key');
    expect(key).toBeTruthy();
    await settingsPage.expectApiKeyCreated(key.substring(0, 10));
  });

  test('API key can be deleted', async () => {
    await settingsPage.open();
    const key = await settingsPage.createApiKey('Test API Key to Delete');
    await settingsPage.deleteApiKey('Test API Key to Delete');
    await settingsPage.expectApiKeyDeleted('Test API Key to Delete');
  });

  test('workspace name can be updated', async () => {
    await settingsPage.open();
    await settingsPage.updateWorkspaceName('Updated Workspace');
    await settingsPage.expectProfileSaved();
  });

  test('member can be invited', async () => {
    await settingsPage.open();
    await settingsPage.inviteMember('newmember@test.com', 'member');
    await settingsPage.expectProfileSaved();
  });
});