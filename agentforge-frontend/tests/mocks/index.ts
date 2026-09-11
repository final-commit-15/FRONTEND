export { mockAiResponses, mockStreamingAiResponse, mockAiModels, mockAiHealth, mockAllAiServices } from './ai';
export { mockGitHubOAuth, mockGitHubApi, mockAllGitHub } from './github';
export { mockSlackOAuth, mockSlackApi, mockAllSlack } from './slack';
export { mockStripeCheckout, mockStripePortal, mockStripeSubscriptions, mockStripeInvoices, mockStripePaymentMethods, mockAllStripe } from './stripe';
export { mockWebhookEndpoints, mockIncomingWebhook } from './webhook';
export { mockBillingApi } from './billing';

export async function mockAllServices(page: Page) {
  const { mockAllAiServices } = await import('./ai');
  const { mockAllGitHub } = await import('./github');
  const { mockAllSlack } = await import('./slack');
  const { mockAllStripe } = await import('./stripe');
  const { mockWebhookEndpoints } = await import('./webhook');
  const { mockBillingApi } = await import('./billing');

  await mockAllAiServices(page);
  await mockAllGitHub(page);
  await mockAllSlack(page);
  await mockAllStripe(page);
  await mockWebhookEndpoints(page);
  await mockBillingApi(page);
}