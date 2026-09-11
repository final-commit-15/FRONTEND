import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminPage extends BasePage {
  readonly usersTable: Locator;
  readonly inviteUserButton: Locator;
  readonly userEmailInput: Locator;
  readonly userRoleSelect: Locator;
  readonly userSearchInput: Locator;
  readonly workspacesList: Locator;
  readonly createWorkspaceButton: Locator;
  readonly workspaceNameInput: Locator;
  readonly auditLogs: Locator;
  readonly auditLogFilters: Locator;
  readonly organizationSettings: Locator;
  readonly deleteWorkspaceButton: Locator;
  readonly changeRoleButton: Locator;
  readonly removeUserButton: Locator;

  constructor(page: Page) {
    super(page);
    this.usersTable = page.getByTestId('users-table').or(page.locator('[data-testid="users"], table.users'));
    this.inviteUserButton = page.getByTestId('invite-user').or(page.getByRole('button', { name: /invite user/i }));
    this.userEmailInput = page.getByTestId('user-email').or(page.locator('input[name="email"]'));
    this.userRoleSelect = page.getByTestId('user-role').or(page.locator('select[name="role"]'));
    this.userSearchInput = page.getByTestId('user-search').or(page.locator('input[placeholder*="search" i]'));
    this.workspacesList = page.getByTestId('workspaces-list').or(page.locator('[data-testid="workspaces"], .workspaces-list'));
    this.createWorkspaceButton = page.getByTestId('create-workspace').or(page.getByRole('button', { name: /create workspace/i }));
    this.workspaceNameInput = page.getByTestId('workspace-name').or(page.locator('input[name="workspaceName"]'));
    this.auditLogs = page.getByTestId('audit-logs').or(page.locator('[data-testid="audit"], .audit-logs'));
    this.auditLogFilters = page.getByTestId('audit-filters').or(page.locator('[data-testid="filters"], .audit-filters'));
    this.organizationSettings = page.getByTestId('org-settings').or(page.locator('[data-testid="organization"], .org-settings'));
    this.deleteWorkspaceButton = page.getByTestId('delete-workspace').or(page.locator('button[aria-label*="delete workspace" i]'));
    this.changeRoleButton = page.getByTestId('change-role').or(page.locator('button[aria-label*="change role" i]'));
    this.removeUserButton = page.getByTestId('remove-user').or(page.locator('button[aria-label*="remove user" i]'));
  }

  async open(): Promise<void> {
    await this.goto('/admin');
    await this.waitForLoadState();
  }

  async inviteUser(email: string, role: string): Promise<void> {
    await this.inviteUserButton.click();
    await this.userEmailInput.fill(email);
    await this.userRoleSelect.selectOption(role);
    await this.page.getByRole('button', { name: /invite|send/i }).click();
    await this.waitForLoadState();
  }

  async searchUser(email: string): Promise<void> {
    await this.userSearchInput.fill(email);
    await this.page.waitForTimeout(500);
  }

  async changeUserRole(email: string, newRole: string): Promise<void> {
    await this.searchUser(email);
    const userRow = this.usersTable.locator('tr').filter({ hasText: email }).first();
    await userRow.getByRole('button', { name: /role|change/i }).click();
    await this.page.getByRole('option', { name: newRole }).click();
    await this.waitForLoadState();
  }

  async removeUser(email: string): Promise<void> {
    await this.searchUser(email);
    const userRow = this.usersTable.locator('tr').filter({ hasText: email }).first();
    await userRow.getByRole('button', { name: /remove|delete/i }).click();
    await this.page.getByRole('button', { name: /confirm|remove/i }).click();
    await this.waitForLoadState();
  }

  async createWorkspace(name: string): Promise<void> {
    await this.createWorkspaceButton.click();
    await this.workspaceNameInput.fill(name);
    await this.page.getByRole('button', { name: /create/i }).click();
    await this.waitForLoadState();
  }

  async deleteWorkspace(name: string): Promise<void> {
    const workspace = this.workspacesList.filter({ hasText: name }).first();
    await workspace.getByRole('button', { name: /delete/i }).click();
    await this.page.getByRole('button', { name: /confirm|delete/i }).click();
    await this.waitForLoadState();
  }

  async filterAuditLogs(filters: { action?: string; user?: string; dateFrom?: string; dateTo?: string }): Promise<void> {
    if (filters.action) {
      await this.auditLogFilters.locator('select[name="action"]').selectOption(filters.action);
    }
    if (filters.user) {
      await this.auditLogFilters.locator('input[name="user"]').fill(filters.user);
    }
    if (filters.dateFrom) {
      await this.auditLogFilters.locator('input[name="dateFrom"]').fill(filters.dateFrom);
    }
    if (filters.dateTo) {
      await this.auditLogFilters.locator('input[name="dateTo"]').fill(filters.dateTo);
    }
    await this.page.waitForTimeout(500);
  }

  async expectUserExists(email: string): Promise<void> {
    await expect(this.usersTable.locator('tr').filter({ hasText: email }).first()).toBeVisible();
  }

  async expectUserNotExists(email: string): Promise<void> {
    await expect(this.usersTable.locator('tr').filter({ hasText: email }).first()).toBeHidden();
  }

  async expectWorkspaceExists(name: string): Promise<void> {
    await expect(this.workspacesList.filter({ hasText: name }).first()).toBeVisible();
  }

  async expectAuditLogEntry(action: string): Promise<void> {
    await expect(this.auditLogs.locator('tr').filter({ hasText: action }).first()).toBeVisible();
  }
}