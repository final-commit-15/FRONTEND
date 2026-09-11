import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class IntegrationPage extends BasePage {
  readonly githubConnectButton: Locator;
  readonly slackConnectButton: Locator;
  readonly notionConnectButton: Locator;
  readonly discordConnectButton: Locator;
  readonly gmailConnectButton: Locator;
  readonly webhookAddButton: Locator;
  readonly connectedIntegrations: Locator;
  readonly integrationStatus: Locator;
  readonly disconnectButton: Locator;
  readonly configureButton: Locator;
  readonly webhookUrlInput: Locator;
  readonly webhookEvents: Locator;
  readonly testWebhookButton: Locator;
  readonly oauthPopup: Locator;

  constructor(page: Page) {
    super(page);
    this.githubConnectButton = page.getByTestId('github-connect').or(page.getByRole('button', { name: /connect github/i }));
    this.slackConnectButton = page.getByTestId('slack-connect').or(page.getByRole('button', { name: /connect slack/i }));
    this.notionConnectButton = page.getByTestId('notion-connect').or(page.getByRole('button', { name: /connect notion/i }));
    this.discordConnectButton = page.getByTestId('discord-connect').or(page.getByRole('button', { name: /connect discord/i }));
    this.gmailConnectButton = page.getByTestId('gmail-connect').or(page.getByRole('button', { name: /connect gmail/i }));
    this.webhookAddButton = page.getByTestId('add-webhook').or(page.getByRole('button', { name: /add webhook/i }));
    this.connectedIntegrations = page.getByTestId('connected-integrations').or(page.locator('[data-testid="integrations-list"], .integrations-list'));
    this.integrationStatus = page.getByTestId('integration-status').or(page.locator('[data-testid="status"], .integration-status'));
    this.disconnectButton = page.getByTestId('disconnect').or(page.locator('button[aria-label*="disconnect" i]'));
    this.configureButton = page.getByTestId('configure').or(page.locator('button[aria-label*="configure" i]'));
    this.webhookUrlInput = page.getByTestId('webhook-url').or(page.locator('input[name*="url" i]'));
    this.webhookEvents = page.getByTestId('webhook-events').or(page.locator('[data-testid="events"], input[name*="event" i]'));
    this.testWebhookButton = page.getByTestId('test-webhook').or(page.getByRole('button', { name: /test webhook/i }));
    this.oauthPopup = page.locator('[role="dialog"]').filter({ hasText: /authorize|allow|grant/i });
  }

  async open(): Promise<void> {
    await this.goto('/integrations');
    await this.waitForLoadState();
  }

  async connectGitHub(): Promise<void> {
    await this.githubConnectButton.click();
    await this.handleOAuthPopup();
  }

  async connectSlack(): Promise<void> {
    await this.slackConnectButton.click();
    await this.handleOAuthPopup();
  }

  async connectNotion(): Promise<void> {
    await this.notionConnectButton.click();
    await this.handleOAuthPopup();
  }

  async connectDiscord(): Promise<void> {
    await this.discordConnectButton.click();
    await this.handleOAuthPopup();
  }

  async connectGmail(): Promise<void> {
    await this.gmailConnectButton.click();
    await this.handleOAuthPopup();
  }

  private async handleOAuthPopup(): Promise<void> {
    const popupPromise = this.page.waitForEvent('popup');
    await this.oauthPopup.waitFor({ state: 'visible', timeout: 10000 });
    const popup = await popupPromise;
    await popup.waitForLoadState();
    await popup.getByRole('button', { name: /authorize|allow|grant/i }).click();
    await popup.close();
    await this.waitForLoadState();
  }

  async addWebhook(url: string, events: string[]): Promise<void> {
    await this.webhookAddButton.click();
    await this.webhookUrlInput.fill(url);
    for (const event of events) {
      await this.webhookEvents.getByLabel(event).check();
    }
    await this.page.getByRole('button', { name: /save|create/i }).click();
    await this.waitForLoadState();
  }

  async testWebhook(name: string): Promise<void> {
    const webhook = this.connectedIntegrations.filter({ hasText: name }).first();
    await webhook.getByRole('button', { name: /test/i }).click();
  }

  async disconnectIntegration(name: string): Promise<void> {
    const integration = this.connectedIntegrations.filter({ hasText: name }).first();
    await integration.getByRole('button', { name: /disconnect/i }).click();
    await this.page.getByRole('button', { name: /confirm|disconnect/i }).click();
    await this.waitForLoadState();
  }

  async expectIntegrationConnected(name: string): Promise<void> {
    const integration = this.connectedIntegrations.filter({ hasText: name }).first();
    await expect(integration.locator('[data-status="connected"], .connected')).toBeVisible();
  }

  async expectIntegrationDisconnected(name: string): Promise<void> {
    const integration = this.connectedIntegrations.filter({ hasText: name }).first();
    await expect(integration.locator('[data-status="disconnected"], .disconnected')).toBeVisible();
  }

  async expectWebhookExists(url: string): Promise<void> {
    await expect(this.connectedIntegrations.filter({ hasText: url }).first()).toBeVisible();
  }
}