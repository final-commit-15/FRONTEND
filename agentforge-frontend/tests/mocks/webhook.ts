import { Page } from '@playwright/test';

export async function mockWebhookEndpoints(page: Page) {
  await page.route('**/api/v1/webhooks**', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'wh_1', name: 'GitHub Webhook', url: 'https://example.com/webhook/github', events: ['push', 'pull_request'], active: true },
          { id: 'wh_2', name: 'Slack Webhook', url: 'https://example.com/webhook/slack', events: ['message', 'reaction'], active: true },
        ]),
      });
    } else if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: `wh_${Date.now()}`, ...body, active: true }),
      });
    }
  });

  await page.route('**/api/v1/webhooks/*/test', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Test webhook delivered successfully' }),
    });
  });

  await page.route('**/api/v1/webhooks/*', async route => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 204 });
    } else if (route.request().method() === 'PATCH') {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...body, updated: true }),
      });
    }
  });
}

export async function mockIncomingWebhook(page: Page, path: string, response: unknown = { received: true }) {
  await page.route(`**${path}`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}