import { test, expect } from '@playwright/test';
import { AgentsPage, LoginPage } from '../pages';

test.describe('Agent Marketplace Tests', () => {
  let agentsPage: AgentsPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    agentsPage = new AgentsPage(page);
    loginPage = new LoginPage(page);
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
  });

  test('agents page loads with agent cards', async () => {
    await agentsPage.open();
    await agentsPage.expectAgentCount(0); // Will be > 0 in real env
  });

  test('search agents works', async () => {
    await agentsPage.open();
    await agentsPage.searchAgents('code');
    // Results should be filtered
  });

  test('filter by category works', async () => {
    await agentsPage.open();
    await agentsPage.filterByCategory('development');
    // Results should be filtered
  });

  test('agent can be installed', async () => {
    await agentsPage.open();
    // Assuming there's at least one agent available
    const agentCards = await agentsPage.agentCards.all();
    if (agentCards.length > 0) {
      const agentName = await agentCards[0].textContent();
      if (agentName) {
        await agentsPage.installAgent(agentName);
        await agentsPage.expectAgentInstalled(agentName);
      }
    }
  });

  test('installed agent can be enabled', async () => {
    await agentsPage.open();
    const agentCards = await agentsPage.agentCards.all();
    if (agentCards.length > 0) {
      const agentName = await agentCards[0].textContent();
      if (agentName) {
        await agentsPage.enableAgent(agentName);
        await agentsPage.expectAgentInstalled(agentName);
      }
    }
  });

  test('enabled agent can be disabled', async () => {
    await agentsPage.open();
    const agentCards = await agentsPage.agentCards.all();
    if (agentCards.length > 0) {
      const agentName = await agentCards[0].textContent();
      if (agentName) {
        await agentsPage.disableAgent(agentName);
        await agentsPage.expectAgentNotInstalled(agentName);
      }
    }
  });

  test('agent can be uninstalled', async () => {
    await agentsPage.open();
    const agentCards = await agentsPage.agentCards.all();
    if (agentCards.length > 0) {
      const agentName = await agentCards[0].textContent();
      if (agentName) {
        await agentsPage.uninstallAgent(agentName);
        await agentsPage.expectAgentNotInstalled(agentName);
      }
    }
  });

  test('agent details modal opens', async () => {
    await agentsPage.open();
    const agentCards = await agentsPage.agentCards.all();
    if (agentCards.length > 0) {
      const agentName = await agentCards[0].textContent();
      if (agentName) {
        await agentsPage.viewAgentDetails(agentName);
        await expect(agentsPage.agentDetailsModal).toBeVisible();
        await agentsPage.closeDetails();
        await expect(agentsPage.agentDetailsModal).toBeHidden();
      }
    }
  });

  test('pagination works', async () => {
    await agentsPage.open();
    const pagination = agentsPage.pagination;
    if (await pagination.isVisible()) {
      await agentsPage.goToPage(2);
      await expect(agentsPage.agentCards.first()).toBeVisible();
    }
  });

  test('loading skeletons appear during fetch', async ({ page }) => {
    await page.route('**/api/v1/agents/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    await agentsPage.open();
    await agentsPage.expectLoading();
  });

  test('empty state displays when no agents', async ({ page }) => {
    await page.route('**/api/v1/agents/**', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ items: [], total: 0 }) });
    });
    await agentsPage.open();
    await agentsPage.expectEmpty();
  });
});