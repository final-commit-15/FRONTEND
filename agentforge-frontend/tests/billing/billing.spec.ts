import { test, expect } from '@playwright/test';
import { BillingPage, LoginPage } from '../pages';
import { mockAllStripe } from '../mocks';

test.describe('Billing Tests', () => {
  let billingPage: BillingPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    billingPage = new BillingPage(page);
    loginPage = new LoginPage(page);
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await mockAllStripe(page);
  });

  test('billing page loads with pricing cards', async () => {
    await billingPage.open();
    await expect(billingPage.pricingCards.first()).toBeVisible();
  });

  test('current plan is displayed', async () => {
    await billingPage.open();
    const plan = await billingPage.getCurrentPlan();
    expect(plan).toBeTruthy();
  });

  test('plan upgrade works', async () => {
    await billingPage.open();
    await billingPage.upgradePlan('Pro');
    await billingPage.expectPlanActive('Pro');
  });

  test('subscription cancellation works', async () => {
    await billingPage.open();
    await billingPage.cancelSubscription();
    await billingPage.expectSubscriptionCancelled();
  });

  test('invoice list is displayed', async () => {
    await billingPage.open();
    await expect(billingPage.invoiceList).toBeVisible();
    await expect(billingPage.invoiceItems.first()).toBeVisible();
  });

  test('invoice can be downloaded', async () => {
    await billingPage.open();
    await billingPage.downloadInvoice('inv_1');
    // Download should start
  });

  test('usage meter displays correctly', async () => {
    await billingPage.open();
    const usage = await billingPage.getUsagePercentage();
    expect(usage).toBeGreaterThanOrEqual(0);
    expect(usage).toBeLessThanOrEqual(100);
  });

  test('credit balance is displayed', async () => {
    await billingPage.open();
    const credits = await billingPage.getCreditBalance();
    expect(credits).toBeGreaterThanOrEqual(0);
  });

  test('payment method can be added', async () => {
    await billingPage.open();
    await billingPage.addPaymentMethod();
    await expect(billingPage.paymentMethod).toBeVisible();
  });

  test('usage stays within limits', async () => {
    await billingPage.open();
    await billingPage.expectUsageBelow(100);
  });
});