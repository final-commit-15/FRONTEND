import { Page } from '@playwright/test';

export async function mockSlackOAuth(page: Page) {
  await page.route('**/slack.com/oauth/v2/authorize**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `
        <html>
          <body>
            <form id="slack-form" action="/oauth.v2.authorize" method="post">
              <input name="client_id" value="mock_client_id" />
              <input name="scope" value="channels:read,chat:write,users:read" />
              <input name="redirect_uri" value="${process.env.BASE_URL || 'http://localhost:3000'}/auth/slack/callback" />
              <button type="submit">Allow</button>
            </form>
            <script>document.getElementById('slack-form').submit();</script>
          </body>
        </html>
      `,
    });
  });

  await page.route('**/slack.com/api/oauth.v2.access', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        access_token: 'xoxb-mock-token',
        token_type: 'bot',
        scope: 'channels:read,chat:write,users:read',
        team: { id: 'T12345', name: 'Test Workspace' },
        bot_user_id: 'U12345',
      }),
    });
  });
}

export async function mockSlackApi(page: Page) {
  await page.route('**/slack.com/api/channels.list', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        channels: [
          { id: 'C12345', name: 'general', is_channel: true, is_member: true },
          { id: 'C67890', name: 'random', is_channel: true, is_member: true },
          { id: 'C11111', name: 'dev', is_channel: true, is_member: false },
        ],
      }),
    });
  });

  await page.route('**/slack.com/api/chat.postMessage', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        channel: 'C12345',
        ts: '1234567890.123456',
        message: { text: 'Test message', user: 'U12345' },
      }),
    });
  });
}

export async function mockAllSlack(page: Page) {
  await mockSlackOAuth(page);
  await mockSlackApi(page);
}