import { Page } from '@playwright/test';

export async function mockGitHubOAuth(page: Page) {
  await page.route('**/github.com/login/oauth/authorize**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `
        <html>
          <body>
            <form id="oauth-form" action="/login/oauth/authorize" method="post">
              <input name="client_id" value="mock_client_id" />
              <input name="redirect_uri" value="${process.env.BASE_URL || 'http://localhost:3000'}/auth/github/callback" />
              <input name="scope" value="repo,user" />
              <button type="submit">Authorize</button>
            </form>
            <script>document.getElementById('oauth-form').submit();</script>
          </body>
        </html>
      `,
    });
  });

  await page.route('**/github.com/login/oauth/access_token', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock_github_token',
        token_type: 'bearer',
        scope: 'repo,user',
      }),
    });
  });
}

export async function mockGitHubApi(page: Page) {
  await page.route('**/api.github.com/user', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        login: 'testuser',
        id: 12345,
        name: 'Test User',
        email: 'test@agentforge.ai',
        avatar_url: 'https://github.com/images/error/testuser_happy.gif',
        html_url: 'https://github.com/testuser',
      }),
    });
  });

  await page.route('**/api.github.com/user/repos', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'repo1', full_name: 'testuser/repo1', private: false },
        { id: 2, name: 'repo2', full_name: 'testuser/repo2', private: true },
      ]),
    });
  });

  await page.route('**/api.github.com/repos/*/issues', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, number: 1, title: 'Issue 1', state: 'open' },
        { id: 2, number: 2, title: 'Issue 2', state: 'closed' },
      ]),
    });
  });
}

export async function mockAllGitHub(page: Page) {
  await mockGitHubOAuth(page);
  await mockGitHubApi(page);
}