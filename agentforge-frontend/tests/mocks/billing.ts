import { Page } from '@playwright/test';

export async function mockBillingApi(page: Page) {
  await page.route('**/api/v1/billing/plans', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'free', name: 'Free', price: 0, features: ['1 workspace', '100 executions/month'], popular: false },
        { id: 'pro', name: 'Pro', price: 29, features: ['Unlimited workspaces', '10,000 executions/month', 'Priority support'], popular: true },
        { id: 'enterprise', name: 'Enterprise', price: 99, features: ['Everything in Pro', 'Custom limits', 'Dedicated support', 'SLA'], popular: false },
      ]),
    });
  });

  await page.route('**/api/v1/billing/subscription', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          plan: 'pro',
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 86400000 * 30).toISOString(),
          cancelAtPeriodEnd: false,
        }),
      });
    }
  });

  await page.route('**/api/v1/billing/usage', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        executions: { used: 1250, limit: 10000, percentage: 12.5 },
        workspaces: { used: 3, limit: 10, percentage: 30 },
        apiCalls: { used: 50000, limit: 100000, percentage: 50 },
      }),
    });
  });

  await page.route('**/api/v1/billing/invoices', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        invoices: [
          { id: 'inv_1', amount: 2900, currency: 'usd', status: 'paid', date: '2024-01-15', downloadUrl: '/api/v1/billing/invoices/inv_1/download' },
          { id: 'inv_2', amount: 2900, currency: 'usd', status: 'paid', date: '2024-02-15', downloadUrl: '/api/v1/billing/invoices/inv_2/download' },
        ],
      }),
    });
  });

  await page.route('**/api/v1/billing/credits', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ balance: 1500, currency: 'usd' }),
    });
  });
}