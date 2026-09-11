import { test, expect } from '@playwright/test';
import { AdminPage, LoginPage } from '../pages';

test.describe('Admin Tests', () => {
  let adminPage: AdminPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPage(page);
    loginPage = new LoginPage(page);
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.ADMIN_EMAIL || 'admin@agentforge.ai',
      process.env.ADMIN_PASSWORD || 'admin123'
    );
  });

  test('admin page loads with users table', async () => {
    await adminPage.open();
    await expect(adminPage.usersTable).toBeVisible();
  });

  test('user can be invited', async () => {
    await adminPage.open();
    await adminPage.inviteUser('newuser@test.com', 'member');
    await adminPage.expectUserExists('newuser@test.com');
  });

  test('user search works', async () => {
    await adminPage.open();
    await adminPage.searchUser('test@');
    await adminPage.expectUserExists('test@agentforge.ai');
  });

  test('user role can be changed', async () => {
    await adminPage.open();
    await adminPage.changeUserRole('test@agentforge.ai', 'admin');
    // Role should be updated
  });

  test('user can be removed', async () => {
    await adminPage.open();
    await adminPage.inviteUser('toremove@test.com', 'viewer');
    await adminPage.removeUser('toremove@test.com');
    await adminPage.expectUserNotExists('toremove@test.com');
  });

  test('workspace can be created', async () => {
    await adminPage.open();
    await adminPage.createWorkspace('Test Workspace');
    await adminPage.expectWorkspaceExists('Test Workspace');
  });

  test('workspace can be deleted', async () => {
    await adminPage.open();
    await adminPage.createWorkspace('Workspace to Delete');
    await adminPage.deleteWorkspace('Workspace to Delete');
    // Workspace should be removed
  });

  test('audit logs are displayed', async () => {
    await adminPage.open();
    await expect(adminPage.auditLogs).toBeVisible();
  });

  test('audit log filters work', async () => {
    await adminPage.open();
    await adminPage.filterAuditLogs({ action: 'login', dateFrom: '2024-01-01' });
    await adminPage.expectAuditLogEntry('login');
  });

  test('organization settings are accessible', async () => {
    await adminPage.open();
    await expect(adminPage.organizationSettings).toBeVisible();
  });
});