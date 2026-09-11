import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly sidebar: Locator;
  readonly sidebarToggle: Locator;
  readonly userMenu: Locator;
  readonly notificationsButton: Locator;
  readonly statsCards: Locator;
  readonly charts: Locator;
  readonly recentActivity: Locator;
  readonly workspaceSelector: Locator;
  readonly loadingSkeleton: Locator;
  readonly errorState: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.sidebar = page.getByTestId('sidebar').or(page.locator('aside, nav[aria-label="Sidebar"]'));
    this.sidebarToggle = page.getByTestId('sidebar-toggle').or(page.locator('button[aria-label*="sidebar" i]'));
    this.userMenu = page.getByTestId('user-menu').or(page.locator('[data-testid="user-menu"], button[aria-label*="user" i]'));
    this.notificationsButton = page.getByTestId('notifications-button').or(page.locator('button[aria-label*="notification" i]'));
    this.statsCards = page.getByTestId('stats-cards').or(page.locator('[data-testid^="stat-"], .stat-card'));
    this.charts = page.getByTestId('charts').or(page.locator('[data-testid="chart"], canvas, .recharts-wrapper'));
    this.recentActivity = page.getByTestId('recent-activity').or(page.locator('[data-testid="recent-activity"], .activity-list'));
    this.workspaceSelector = page.getByTestId('workspace-selector').or(page.locator('[data-testid="workspace-selector"], select[name*="workspace" i]'));
    this.loadingSkeleton = page.getByTestId('loading-skeleton').or(page.locator('.animate-pulse, .skeleton'));
    this.errorState = page.getByTestId('error-state').or(page.locator('[data-testid="error-state"], .error-state'));
    this.emptyState = page.getByTestId('empty-state').or(page.locator('[data-testid="empty-state"], .empty-state'));
  }

  async open(): Promise<void> {
    await this.goto('/dashboard');
    await this.waitForLoadState();
  }

  async verifyStatsVisible(): Promise<void> {
    await expect(this.statsCards.first()).toBeVisible();
  }

  async getStatValue(label: string): Promise<string> {
    const card = this.statsCards.filter({ hasText: label }).first();
    const value = card.locator('[data-testid="stat-value"], .stat-value, [class*="value"]').first();
    return (await value.textContent()) || '';
  }

  async verifyChartsLoaded(): Promise<void> {
    await expect(this.charts.first()).toBeVisible();
  }

  async navigateSidebar(item: string): Promise<void> {
    const link = this.sidebar.getByRole('link', { name: new RegExp(item, 'i') });
    await link.click();
    await this.waitForLoadState();
  }

  async openUserMenu(): Promise<void> {
    await this.userMenu.click();
  }

  async logout(): Promise<void> {
    await this.openUserMenu();
    await this.page.getByRole('menuitem', { name: /logout|sign out/i }).click();
    await this.page.waitForURL('**/login');
  }

  async openNotifications(): Promise<void> {
    await this.notificationsButton.click();
  }

  async selectWorkspace(workspace: string): Promise<void> {
    await this.workspaceSelector.click();
    await this.page.getByRole('option', { name: workspace }).click();
    await this.waitForLoadState();
  }

  async expectLoading(): Promise<void> {
    await expect(this.loadingSkeleton.first()).toBeVisible();
  }

  async expectError(): Promise<void> {
    await expect(this.errorState).toBeVisible();
  }

  async expectEmpty(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }

  async expectDashboardLoaded(): Promise<void> {
    await this.verifyStatsVisible();
    await this.verifyChartsLoaded();
  }
}