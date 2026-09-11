# AgentForge Playwright Testing Guide

## Overview

This document provides comprehensive documentation for the Playwright E2E testing infrastructure in the AgentForge frontend repository.

## Table of Contents

1. [Installation](#installation)
2. [Running Tests Locally](#running-tests-locally)
3. [Running Specific Test Suites](#running-specific-test-suites)
4. [Debugging Failures](#debugging-failures)
5. [Updating Visual Snapshots](#updating-visual-snapshots)
6. [Writing New Tests](#writing-new-tests)
7. [CI/CD Workflow](#cicd-workflow)
8. [Docker Workflow](#docker-workflow)
9. [Best Practices](#best-practices)

## Installation

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Docker (for containerized testing)

### Install Dependencies

```bash
npm ci --legacy-peer-deps
npm run playwright:install
```

This installs:
- Playwright test runner
- Chromium, Firefox, and WebKit browsers
- All required dependencies

## Running Tests Locally

### Run All Tests

```bash
npm run playwright:test
```

### Run in Headed Mode (with browser UI)

```bash
npm run playwright:headed
```

### Run with Playwright UI

```bash
npm run playwright:ui
```

### Debug Mode

```bash
npm run playwright:debug
```

## Running Specific Test Suites

### Smoke Tests (Fast, ~2 minutes)

```bash
npm run playwright:smoke
```

### E2E Tests by Feature

```bash
# Authentication
npx playwright test tests/auth

# Dashboard
npx playwright test tests/dashboard

# Chat
npx playwright test tests/chat

# Workflows
npx playwright test tests/workflows

# Agents
npx playwright test tests/agents

# Integrations
npx playwright test tests/integrations

# Billing
npx playwright test tests/billing

# Settings
npx playwright test tests/settings

# Admin
npx playwright test tests/admin
```

### API Tests

```bash
npm run playwright:api
```

### Visual Regression Tests

```bash
npm run playwright:visual
```

### Accessibility Tests

```bash
npm run playwright:accessibility
```

### Performance Tests

```bash
npm run playwright:performance
```

### Run on Specific Browser

```bash
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# WebKit only
npx playwright test --project=webkit

# Mobile Chrome
npx playwright test --project=mobile-chrome

# Mobile Safari
npx playwright test --project=mobile-safari
```

## Debugging Failures

### View HTML Report

```bash
npm run playwright:report
```

### Analyze Traces

```bash
npx playwright show-trace test-results/**/*.trace.zip
```

### Common Debugging Steps

1. **Run in headed mode** to see what's happening:
   ```bash
   npx playwright test tests/auth --headed
   ```

2. **Use debug mode** to step through:
   ```bash
   npx playwright test tests/auth --debug
   ```

3. **Check screenshots/videos** in `test-results/`

4. **Review console logs** in test output

5. **Inspect network requests** in trace viewer

### Debug Specific Test

```bash
npx playwright test tests/auth/auth.spec.ts -g "login with valid credentials" --debug
```

## Updating Visual Snapshots

When UI changes are intentional:

```bash
npm run playwright:update-snapshots
```

Or manually:

```bash
npx playwright test tests/visual --project=chromium --update-snapshots
```

This will:
1. Run all visual tests
2. Update snapshot images in `tests/visual/snapshots/`
3. Commit the updated snapshots

## Writing New Tests

### Test Structure

```
tests/
├── {feature}/
│   └── {feature}.spec.ts
├── pages/
│   └── {Feature}Page.ts
├── fixtures/
│   └── {feature}.ts
├── data/
│   └── fake{Feature}.ts
├── mocks/
│   └── {service}.ts
└── utils/
    └── {utility}.ts
```

### Creating a Page Object

```typescript
// tests/pages/FeaturePage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class FeaturePage extends BasePage {
  readonly element: Locator;

  constructor(page: Page) {
    super(page);
    this.element = page.getByTestId('element-id');
  }

  async doSomething(): Promise<void> {
    await this.element.click();
  }
}
```

### Creating a Test

```typescript
// tests/feature/feature.spec.ts
import { test, expect } from '@playwright/test';
import { FeaturePage, LoginPage } from '../pages';

test.describe('Feature Tests', () => {
  let featurePage: FeaturePage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    featurePage = new FeaturePage(page);
    loginPage = new LoginPage(page);
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
  });

  test('should do something', async () => {
    await featurePage.open();
    await featurePage.doSomething();
    await expect(featurePage.element).toBeVisible();
  });
});
```

### Using Fixtures

```typescript
// tests/fixtures/pages.ts
import { test as base } from '@playwright/test';
import { FeaturePage } from '../pages';

type FeatureFixtures = {
  featurePage: FeaturePage;
};

export const test = base.extend<FeatureFixtures>({
  featurePage: async ({ page }, use) => {
    await use(new FeaturePage(page));
  },
});

export const expect = test.expect;
```

### Using Mocks

```typescript
// tests/mocks/feature.ts
import { Page } from '@playwright/test';

export async function mockFeatureApi(page: Page) {
  await page.route('**/api/v1/feature/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: 'mocked' }),
    });
  });
}
```

### Using Data Factories

```typescript
// tests/data/fakeFeature.ts
import { faker } from '@faker-js/faker';

export interface Feature {
  id: string;
  name: string;
  // ...
}

export function createFakeFeature(overrides: Partial<Feature> = {}): Feature {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    ...overrides,
  };
}
```

### Test Best Practices

1. **Use data-testid attributes** for reliable selectors
2. **Never hardcode test data** - use factories
3. **Mock external services** - don't rely on real APIs
4. **Use Page Object Model** - encapsulate page logic
4. **Keep tests independent** - no shared state between tests
5. **Use descriptive test names** - explain what is being tested
6. **Clean up after tests** - use beforeEach/afterEach

## CI/CD Workflow

The GitHub Actions workflow (`.github/workflows/playwright.yml`) runs:

1. **Install & Build** - Installs dependencies and builds the app
2. **Smoke Tests** - Quick validation on every PR
3. **E2E Tests** - Full test suite on Chromium, Firefox, WebKit
4. **Visual Regression** - Snapshot comparison
5. **Accessibility** - Axe-core compliance
6. **Performance** - Load time benchmarks
6. **API Tests** - Backend API validation
7. **AI Services Tests** - AI gateway validation

### Required GitHub Secrets

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VITE_API_URL`
- `VITE_APP_NAME`
- `VITE_APP_VERSION`
- `TEST_EMAIL`
- `TEST_PASSWORD`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `HF_TOKEN` (for AI services)

### Workflow Triggers

- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Manual workflow dispatch

## Docker Workflow

### Run Tests in Docker

```bash
docker compose -f docker-compose.testing.yml up playwright
```

This will:
1. Start all services (frontend, backend, AI, DB, Redis)
2. Wait for health checks
3. Run Playwright tests
4. Output results to `test-results/` and `playwright-report/`

### Build Playwright Image

```bash
docker build -f Dockerfile.playwright -t agentforge-playwright .
```

### Run Specific Tests in Docker

```bash
docker run --rm -v $(pwd)/test-results:/app/test-results \
  agentforge-playwright npx playwright test tests/smoke
```

## Best Practices

### Selectors

```typescript
// Good - stable, semantic
page.getByTestId('submit-button')
page.getByRole('button', { name: /submit/i })
page.getByLabel('Email')

// Avoid - brittle
page.locator('.btn.btn-primary')
page.locator('#submit-button')
page.locator('div > button:nth-child(2)')
```

### Async/Await

```typescript
// Good - proper async handling
await page.click('button');
await expect(page.locator('.result')).toBeVisible();

// Avoid - missing awaits
page.click('button');
expect(page.locator('.result')).toBeVisible();
```

### Test Isolation

```typescript
// Good - each test sets up its own state
test('creates workflow', async ({ page }) => {
  await workflowPage.createWorkflow('Test');
  await expect(page).toHaveURL(/.*workflows/);
});

// Avoid - tests depending on each other
test('creates workflow', async () => { ... });
test('edits workflow', async () => { ... }); // Depends on previous test
```

### Mocking

```typescript
// Good - mock at network level
await page.route('**/api/v1/users', route =>
  route.fulfill({ json: [{ id: 1, name: 'Test' }] })
);

// Avoid - mocking at application level
vi.mock('../api/users');
```

### Waiting

```typescript
// Good - wait for specific condition
await expect(page.locator('.result')).toBeVisible();
await page.waitForResponse('**/api/data');

// Avoid - arbitrary timeouts
await page.waitForTimeout(5000);
```

### Test Data

```typescript
// Good - generated unique data
const user = createFakeUser({ email: `test-${Date.now()}@example.com` });

// Avoid - hardcoded data
const user = { email: 'test@example.com' };
```

## Troubleshooting

### Tests Timeout

- Increase timeout in `playwright.config.ts`
- Check for infinite loops or deadlocks
- Verify selectors are correct

### Flaky Tests

- Add proper waits instead of timeouts
- Ensure test data is unique
- Check for race conditions

### Visual Test Failures

- Update snapshots if changes are intentional
- Check for dynamic content (dates, random IDs)
- Mask dynamic areas in snapshots

### Authentication Issues

- Verify test credentials in environment
- Check session storage state
- Ensure global setup runs correctly

## Support

- **Documentation**: This guide
- **Issues**: GitHub Issues in agentforge-frontend
- **Playwright Docs**: https://playwright.dev/docs/intro
- **Axe Core**: https://github.com/dequelabs/axe-core