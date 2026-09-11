import { test, expect } from '@playwright/test';
import { IntegrationPage, LoginPage } from '../pages';
import { mockAllGitHub, mockAllSlack, mockAllStripe } from '../mocks';

test.describe('Integration Tests', () => {
  let integrationPage: IntegrationPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    integrationPage = new IntegrationPage(page);
    loginPage = new LoginPage(page);
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await mockAllGitHub(page);
    await mockAllSlack(page);
  });

  test('integrations page loads', async () => {
    await integrationPage.open();
    await expect(integrationPage.connectedIntegrations).toBeVisible();
  });

  test('GitHub OAuth connection works', async () => {
    await integrationPage.open();
    await integrationPage.connectGitHub();
    await integrationPage.expectIntegrationConnected('GitHub');
  });

  test('Slack OAuth connection works', async () => {
    await integrationPage.open();
    await integrationPage.connectSlack();
    await integrationPage.expectIntegrationConnected('Slack');
  });

  test('Notion OAuth connection works', async () => {
    await integrationPage.open();
    await integrationPage.connectNotion();
    await integrationPage.expectIntegrationConnected('Notion');
  });

  test('Discord OAuth connection works', async () => {
    await integrationPage.open();
    await integrationPage.connectDiscord();
    await integrationPage.expectIntegrationConnected('Discord');
  });

  test('Gmail OAuth connection works', async () => {
    await integrationPage.open();
    await integrationPage.connectGmail();
    await integrationPage.expectIntegrationConnected('Gmail');
  });

  test('webhook can be added', async () => {
    await integrationPage.open();
    await integrationPage.addWebhook('https://example.com/webhook', ['push', 'pull_request']);
    await integrationPage.expectWebhookExists('https://example.com/webhook');
  });

  test('webhook can be tested', async () => {
    await integrationPage.open();
    await integrationPage.addWebhook('https://example.com/webhook/test', ['push']);
    await integrationPage.testWebhook('https://example.com/webhook/test');
    // Test should succeed
  });

  test('integration can be disconnected', async () => {
    await integrationPage.open();
    await integrationPage.connectGitHub();
    await integrationPage.disconnectIntegration('GitHub');
    await integrationPage.expectIntegrationDisconnected('GitHub');
  });

  test('OAuth error handling works', async ({ page }) => {
    await page.route('**/github.com/login/oauth/access_token', async route => {
      await route.fulfill({ status: 400, body: JSON.stringify({ error: 'invalid_grant' }) });
    });
    await integrationPage.open();
    await integrationPage.connectGitHub();
    await integrationPage.expectIntegrationDisconnected('GitHub');
  });
});