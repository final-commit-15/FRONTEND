import { Page } from '@playwright/test';

export async function mockStripeCheckout(page: Page) {
  await page.route('**/api.stripe.com/v1/checkout/sessions', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'cs_mock_session',
        object: 'checkout.session',
        url: `${process.env.BASE_URL || 'http://localhost:3000'}/billing/success?session_id=cs_mock_session`,
        payment_status: 'paid',
        subscription: 'sub_mock',
      }),
    });
  });
}

export async function mockStripePortal(page: Page) {
  await page.route('**/api.stripe.com/v1/billing_portal/sessions', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        url: `${process.env.BASE_URL || 'http://localhost:3000'}/billing/portal`,
      }),
    });
  });
}

export async function mockStripeSubscriptions(page: Page) {
  await page.route('**/api.stripe.com/v1/subscriptions**', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          object: 'list',
          data: [{
            id: 'sub_mock',
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
            items: {
              data: [{ price: { id: 'price_pro', unit_amount: 2900, currency: 'usd', recurring: { interval: 'month' } } }],
            },
          }],
        }),
      });
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'sub_mock', status: 'canceled' }),
      });
    }
  });
}

export async function mockStripeInvoices(page: Page) {
  await page.route('**/api.stripe.com/v1/invoices**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        object: 'list',
        data: [
          { id: 'in_mock_1', amount_paid: 2900, currency: 'usd', status: 'paid', created: Date.now() - 86400000 * 30 },
          { id: 'in_mock_2', amount_paid: 2900, currency: 'usd', status: 'paid', created: Date.now() - 86400000 * 60 },
        ],
      }),
    });
  });
}

export async function mockStripePaymentMethods(page: Page) {
  await page.route('**/api.stripe.com/v1/payment_methods**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        object: 'list',
        data: [{
          id: 'pm_mock',
          type: 'card',
          card: { brand: 'Visa', last4: '4242', exp_month: 12, exp_year: 2030 },
        }],
      }),
    });
  });
}

export async function mockAllStripe(page: Page) {
  await mockStripeCheckout(page);
  await mockStripePortal(page);
  await mockStripeSubscriptions(page);
  await mockStripeInvoices(page);
  await mockStripePaymentMethods(page);
}