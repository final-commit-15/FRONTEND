import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AgentsPage extends BasePage {
  readonly installAgentButton: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly agentCards: Locator;
  readonly agentDetailsModal: Locator;
  readonly enableButton: Locator;
  readonly disableButton: Locator;
  readonly uninstallButton: Locator;
  readonly pagination: Locator;
  readonly loadingSkeleton: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.installAgentButton = page.getByTestId('install-agent-button').or(page.getByRole('button', { name: /install agent|add agent/i }));
    this.searchInput = page.getByTestId('agent-search').or(page.locator('input[placeholder*="search" i]'));
    this.categoryFilter = page.getByTestId('category-filter').or(page.locator('select[name*="category" i]'));
    this.agentCards = page.getByTestId('agent-card').or(page.locator('[data-testid="agent-card"], .agent-card'));
    this.agentDetailsModal = page.getByTestId('agent-details').or(page.locator('[role="dialog"][data-testid*="agent"]'));
    this.enableButton = page.getByTestId('enable-agent').or(page.locator('button[aria-label*="enable" i]'));
    this.disableButton = page.getByTestId('disable-agent').or(page.locator('button[aria-label*="disable" i]'));
    this.uninstallButton = page.getByTestId('uninstall-agent').or(page.locator('button[aria-label*="uninstall" i]'));
    this.pagination = page.getByTestId('pagination').or(page.locator('[data-testid="pagination"], nav[aria-label="Pagination"]'));
    this.loadingSkeleton = page.getByTestId('loading-skeleton').or(page.locator('.animate-pulse, .skeleton'));
    this.emptyState = page.getByTestId('empty-state').or(page.locator('[data-testid="empty-state"], .empty-state'));
  }

  async open(): Promise<void> {
    await this.goto('/agents');
    await this.waitForLoadState();
  }

  async searchAgents(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  async filterByCategory(category: string): Promise<void> {
    await this.categoryFilter.selectOption(category);
    await this.page.waitForTimeout(500);
  }

  async installAgent(name: string): Promise<void> {
    const card = this.agentCards.filter({ hasText: name }).first();
    const installBtn = card.getByRole('button', { name: /install|add/i });
    await installBtn.click();
    await this.page.getByRole('button', { name: /confirm|install/i }).click();
    await this.waitForLoadState();
  }

  async enableAgent(name: string): Promise<void> {
    const card = this.agentCards.filter({ hasText: name }).first();
    await card.getByRole('button', { name: /enable/i }).click();
    await this.waitForLoadState();
  }

  async disableAgent(name: string): Promise<void> {
    const card = this.agentCards.filter({ hasText: name }).first();
    await card.getByRole('button', { name: /disable/i }).click();
    await this.waitForLoadState();
  }

  async uninstallAgent(name: string): Promise<void> {
    const card = this.agentCards.filter({ hasText: name }).first();
    await card.getByRole('button', { name: /uninstall|remove/i }).click();
    await this.page.getByRole('button', { name: /confirm|uninstall/i }).click();
    await this.waitForLoadState();
  }

  async viewAgentDetails(name: string): Promise<void> {
    const card = this.agentCards.filter({ hasText: name }).first();
    await card.getByRole('button', { name: /details|view/i }).click();
    await this.agentDetailsModal.waitFor({ state: 'visible' });
  }

  async closeDetails(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.agentDetailsModal.waitFor({ state: 'hidden' });
  }

  async goToPage(pageNumber: number): Promise<void> {
    await this.pagination.getByRole('link', { name: String(pageNumber) }).click();
    await this.waitForLoadState();
  }

  async expectAgentInstalled(name: string): Promise<void> {
    const card = this.agentCards.filter({ hasText: name }).first();
    await expect(card.getByText(/installed|enabled/i)).toBeVisible();
  }

  async expectAgentNotInstalled(name: string): Promise<void> {
    const card = this.agentCards.filter({ hasText: name }).first();
    await expect(card.getByText(/install|add/i)).toBeVisible();
  }

  async expectLoading(): Promise<void> {
    await expect(this.loadingSkeleton.first()).toBeVisible();
  }

  async expectEmpty(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }

  async expectAgentCount(count: number): Promise<void> {
    await expect(this.agentCards).toHaveCount(count);
  }
}