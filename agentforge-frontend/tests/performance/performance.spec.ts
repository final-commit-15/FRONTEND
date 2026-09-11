import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage, ChatPage, WorkflowPage } from '../pages';

test.describe('Performance Tests', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let chatPage: ChatPage;
  let workflowPage: WorkflowPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    chatPage = new ChatPage(page);
    workflowPage = new WorkflowPage(page);
  });

  test('dashboard loads within threshold', async ({ page }) => {
    const startTime = Date.now();
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await dashboardPage.open();
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // 5 seconds
  });

  test('login latency is within threshold', async ({ page }) => {
    const startTime = Date.now();
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    const loginTime = Date.now() - startTime;
    expect(loginTime).toBeLessThan(3000); // 3 seconds
  });

  test('chat response latency is within threshold', async ({ page }) => {
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await chatPage.open();
    await chatPage.startNewChat();

    const startTime = Date.now();
    await chatPage.sendMessage('Test message');
    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(10000); // 10 seconds for AI response
  });

  test('workflow execution latency is within threshold', async ({ page }) => {
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await workflowPage.open();
    await workflowPage.createWorkflow('Performance Test Workflow');
    await workflowPage.addNode('trigger', 200, 200);
    await workflowPage.addNode('action', 500, 200);

    const startTime = Date.now();
    await workflowPage.executeWorkflow();
    await workflowPage.waitForExecutionComplete();
    const executionTime = Date.now() - startTime;
    expect(executionTime).toBeLessThan(30000); // 30 seconds
  });

  test('page load metrics are acceptable', async ({ page }) => {
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await dashboardPage.open();

    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        ttfb: navigation.responseStart - navigation.requestStart,
      };
    });

    expect(metrics.ttfb).toBeLessThan(600); // TTFB < 600ms
    expect(metrics.domContentLoaded).toBeLessThan(1500); // DOMContentLoaded < 1.5s
    expect(metrics.loadComplete).toBeLessThan(3000); // Load complete < 3s
  });

  test('resource loading is optimized', async ({ page }) => {
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await dashboardPage.open();

    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(r => r.initiatorType === 'script' || r.initiatorType === 'link')
        .map(r => ({ name: r.name, duration: r.duration, size: r.transferSize }));
    });

    const totalSize = resources.reduce((sum, r) => sum + (r.size || 0), 0);
    expect(totalSize).toBeLessThan(2000000); // Total resources < 2MB
  });

  test('no long tasks blocking main thread', async ({ page }) => {
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await dashboardPage.open();

    const longTasks = await page.evaluate(() => {
      return new Promise(resolve => {
        const observer = new PerformanceObserver(list => {
          resolve(list.getEntries().filter(entry => entry.duration > 50));
        });
        observer.observe({ entryTypes: ['longtask'] });
        setTimeout(() => resolve([]), 3000);
      });
    });

    expect(longTasks).toHaveLength(0);
  });
});