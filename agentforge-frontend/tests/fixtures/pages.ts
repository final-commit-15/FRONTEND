/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars, react-hooks/rules-of-hooks */
import { test as base, Page } from '@playwright/test';
import { LoginPage, DashboardPage, ChatPage, WorkflowPage, AgentsPage, IntegrationPage, BillingPage, SettingsPage, AdminPage } from '../pages';

type Pages = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  chatPage: ChatPage;
  workflowPage: WorkflowPage;
  agentsPage: AgentsPage;
  integrationPage: IntegrationPage;
  billingPage: BillingPage;
  settingsPage: SettingsPage;
  adminPage: AdminPage;
};

export const test = base.extend<Pages>({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  chatPage: async ({ page }, use) => {
    await use(new ChatPage(page));
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  workflowPage: async ({ page }, use) => {
    await use(new WorkflowPage(page));
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  agentsPage: async ({ page }, use) => {
    await use(new AgentsPage(page));
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  integrationPage: async ({ page }, use) => {
    await use(new IntegrationPage(page));
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  billingPage: async ({ page }, use) => {
    await use(new BillingPage(page));
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  settingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page));
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  adminPage: async ({ page }, use) => {
    await use(new AdminPage(page));
  },
});

export const expect = test.expect;