import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class BillingPage extends BasePage {
  readonly pricingCards: Locator;
  readonly currentPlan: Locator;
  readonly upgradeButton: Locator;
  readonly cancelSubscriptionButton: Locator;
  readonly invoiceList: Locator;
  readonly invoiceItems: Locator;
  readonly downloadInvoiceButton: Locator;
  readonly usageMeter: Locator;
  readonly creditBalance: Locator;
  readonly paymentMethod: Locator;
  readonly addPaymentMethodButton: Locator;
  readonly billingHistory: Locator;
  readonly stripeElement: Locator;

  constructor(page: Page) {
    super(page);
    this.pricingCards = page.getByTestId('pricing-card').or(page.locator('[data-testid="pricing"], .pricing-card'));
    this.currentPlan = page.getByTestId('current-plan').or(page.locator('[data-testid="plan"], .current-plan'));
    this.upgradeButton = page.getByTestId('upgrade-button').or(page.getByRole('button', { name: /upgrade|change plan/i }));
    this.cancelSubscriptionButton = page.getByTestId('cancel-subscription').or(page.getByRole('button', { name: /cancel subscription/i }));
    this.invoiceList = page.getByTestId('invoice-list').or(page.locator('[data-testid="invoices"], .invoice-list'));
    this.invoiceItems = page.getByTestId('invoice-item').or(page.locator('[data-testid="invoice"], .invoice-item'));
    this.downloadInvoiceButton = page.getByTestId('download-invoice').or(page.locator('button[aria-label*="download" i]'));
    this.usageMeter = page.getByTestId('usage-meter').or(page.locator('[data-testid="usage"], .usage-meter'));
    this.creditBalance = page.getByTestId('credit-balance').or(page.locator('[data-testid="credits"], .credit-balance'));
    this.paymentMethod = page.getByTestId('payment-method').or(page.locator('[data-testid="payment"], .payment-method'));
    this.addPaymentMethodButton = page.getByTestId('add-payment-method').or(page.getByRole('button', { name: /add payment/i }));
    this.billingHistory = page.getByTestId('billing-history').or(page.locator('[data-testid="history"], .billing-history'));
    this.stripeElement = page.locator('iframe[name^="__privateStripeFrame"]').or(page.locator('[data-testid="stripe-element"]'));
  }

  async open(): Promise<void> {
    await this.goto('/billing');
    await this.waitForLoadState();
  }

  async getCurrentPlan(): Promise<string> {
    return (await this.currentPlan.textContent()) || '';
  }

  async upgradePlan(planName: string): Promise<void> {
    const card = this.pricingCards.filter({ hasText: planName }).first();
    await card.getByRole('button', { name: /upgrade|select/i }).click();
    await this.handleStripeCheckout();
    await this.waitForLoadState();
  }

  private async handleStripeCheckout(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    const stripeFrame = this.page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
    await stripeFrame.locator('input[name="cardnumber"]').fill('4242 4242 4242 4242');
    await stripeFrame.locator('input[name="exp-date"]').fill('12/30');
    await stripeFrame.locator('input[name="cvc"]').fill('123');
    await stripeFrame.locator('input[name="postal"]').fill('12345');
    await this.page.getByRole('button', { name: /pay|subscribe/i }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async cancelSubscription(): Promise<void> {
    await this.cancelSubscriptionButton.click();
    await this.page.getByRole('button', { name: /confirm|cancel/i }).click();
    await this.waitForLoadState();
  }

  async downloadInvoice(invoiceNumber: string): Promise<void> {
    const invoice = this.invoiceItems.filter({ hasText: invoiceNumber }).first();
    await invoice.getByRole('button', { name: /download/i }).click();
  }

  async getUsagePercentage(): Promise<number> {
    const text = await this.usageMeter.textContent();
    const match = text?.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async getCreditBalance(): Promise<number> {
    const text = await this.creditBalance.textContent();
    const match = text?.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  }

  async addPaymentMethod(cardNumber: string = '4242 4242 4242 4242'): Promise<void> {
    await this.addPaymentMethodButton.click();
    const stripeFrame = this.page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
    await stripeFrame.locator('input[name="cardnumber"]').fill(cardNumber);
    await stripeFrame.locator('input[name="exp-date"]').fill('12/30');
    await stripeFrame.locator('input[name="cvc"]').fill('123');
    await this.page.getByRole('button', { name: /save|add/i }).click();
    await this.waitForLoadState();
  }

  async expectPlanActive(planName: string): Promise<void> {
    await expect(this.currentPlan).toContainText(planName);
  }

  async expectSubscriptionCancelled(): Promise<void> {
    await expect(this.currentPlan).toContainText(/cancelled|free/i);
  }

  async expectInvoiceVisible(invoiceNumber: string): Promise<void> {
    await expect(this.invoiceItems.filter({ hasText: invoiceNumber }).first()).toBeVisible();
  }

  async expectUsageBelow(percentage: number): Promise<void> {
    const usage = await this.getUsagePercentage();
    expect(usage).toBeLessThan(percentage);
  }
}