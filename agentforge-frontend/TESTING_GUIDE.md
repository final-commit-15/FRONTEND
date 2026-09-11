# AgentForge Testing Guide

## Overview

This guide covers all testing strategies for the AgentForge platform, including unit tests, integration tests, and end-to-end tests.

## Testing Pyramid

```
        E2E Tests (Playwright)
       /                        \
  Integration Tests (API)    Visual/Accessibility
     /                            \
Unit Tests (Vitest)          Performance Tests
```

## Test Types

### 1. Unit Tests (Vitest)

**Location**: `src/**/__tests__/*.test.tsx` or `src/**/*.test.ts`

**Run**:
```bash
npm run test
npm run test:watch
```

**Coverage**:
- Components
- Hooks
- Utilities
- State management

### 2. API Tests (Playwright)

**Location**: `tests/api/*.spec.ts`

**Run**:
```bash
npm run playwright:api
```

**Coverage**:
- REST endpoints
- Authentication
- Validation
- Error handling

### 3. E2E Tests (Playwright)

**Location**: `tests/{feature}/*.spec.ts`

**Run**:
```bash
npm run playwright:test
npm run playwright:smoke
```

**Coverage**:
- User flows
- Feature functionality
- Cross-browser compatibility

### 4. Visual Regression Tests (Playwright)

**Location**: `tests/visual/*.spec.ts`

**Run**:
```bash
npm run playwright:visual
npm run playwright:update-snapshots
```

**Coverage**:
- UI consistency
- Theme variations
- Responsive layouts

### 5. Accessibility Tests (Playwright + Axe)

**Location**: `tests/accessibility/*.spec.ts`

**Run**:
```bash
npm run playwright:accessibility
```

**Coverage**:
- WCAG 2.1 AA compliance
- Keyboard navigation
- ARIA attributes
- Color contrast

### 6. Performance Tests (Playwright)

**Location**: `tests/performance/*.spec.ts`

**Run**:
```bash
npm run playwright:performance
```

**Coverage**:
- Load times
- Core Web Vitals
- Resource optimization

## Running Tests

### Local Development

```bash
# All unit tests
npm run test

# All E2E tests
npm run playwright:test

# Specific suite
npm run playwright:smoke
npm run playwright:visual
npm run playwright:accessibility
npm run playwright:performance
npm run playwright:api
```

### CI/CD Pipeline

Tests run automatically on:
- Push to main/develop
- Pull requests
- Manual dispatch

See `.github/workflows/playwright.yml` and `.github/workflows/frontend-check.yml`

## Test Data Management

### Factories

Use Faker.js factories in `tests/data/`:
- `fakeUsers.ts` - User accounts
- `fakeAgents.ts` - Agent marketplace
- `fakeWorkflows.ts` - Workflow builder
- `fakeMessages.ts` - Chat conversations

### Fixtures

Reusable test fixtures in `tests/fixtures/`:
- `auth.ts` - Authentication states
- `pages.ts` - Page objects

## Mocking Strategy

### External Services

Mock all external dependencies in `tests/mocks/`:
- `ai.ts` - AI service responses
- `github.ts` - GitHub OAuth
- `slack.ts` - Slack integration
- `stripe.ts` - Billing
- `webhook.ts` - Webhook endpoints
- `billing.ts` - Billing API

### Usage

```typescript
import { mockAllServices } from '../mocks';

test.beforeEach(async ({ page }) => {
  await mockAllServices(page);
});
```

## Best Practices

### Test Organization

1. **One test file per feature**
2. **Descriptive test names**: `test('should allow user to login with valid credentials')`
3. **Use Page Object Model** for UI interactions
4. **Keep tests independent** - no shared state
5. **Mock external services** - no real API calls

### Selectors

```typescript
// Preferred
page.getByTestId('submit-button')
page.getByRole('button', { name: /submit/i })
page.getByLabel('Email')

// Avoid
page.locator('.btn-primary')
page.locator('#submit')
page.locator('div > button')
```

### Assertions

```typescript
// Use Playwright's built-in assertions
await expect(locator).toBeVisible();
await expect(locator).toContainText('Expected');
await expect(page).toHaveURL(/.*dashboard/);
```

### Async Handling

```typescript
// Always await
await page.click('button');
await expect(page.locator('.result')).toBeVisible();

// Never forget await
page.click('button'); // BAD - missing await
```

## Debugging

### Local Debugging

```bash
# Headed mode
npx playwright test --headed

# Debug mode
npx playwright test --debug

# UI mode
npx playwright test --ui

# Specific test
npx playwright test tests/auth -g "login with valid credentials"
```

### CI Debugging

1. Check GitHub Actions logs
2. Download test artifacts (screenshots, videos, traces)
3. Use trace viewer: `npx playwright show-trace trace.zip`

## Reporting

### HTML Report

```bash
npm run playwright:report
```

### CI Reports

- HTML report uploaded as artifact
- JUnit XML for test summaries
- JSON for programmatic analysis

## Continuous Integration

### Required Secrets

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel deployment token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `VITE_API_URL` | Production API URL |
| `VITE_APP_NAME` | Application name |
| `VITE_APP_VERSION` | Application version |
| `TEST_EMAIL` | Test user email |
| `TEST_PASSWORD` | Test user password |
| `ADMIN_EMAIL` | Admin user email |
| `ADMIN_PASSWORD` | Admin user password |
| `HF_TOKEN` | Hugging Face token (AI) |

### Workflow Files

- `.github/workflows/frontend-check.yml` - Lint, typecheck, build, unit tests
- `.github/workflows/playwright.yml` - E2E, visual, accessibility, performance, API tests

## Docker Testing

```bash
# Full test suite in containers
docker compose -f docker-compose.testing.yml up playwright

# Individual services
docker compose -f docker-compose.testing.yml up frontend backend
```

## Maintenance

### Updating Snapshots

```bash
npm run playwright:update-snapshots
```

### Updating Dependencies

```bash
npm update @playwright/test playwright @axe-core/playwright
npm run playwright:install
```

### Adding New Test Suites

1. Create directory in `tests/`
2. Add test files
3. Update `playwright.config.ts` if needed
4. Add to CI workflow if required

## Support

- Playwright: https://playwright.dev/docs/intro
- Vitest: https://vitest.dev/guide/
- Axe Core: https://github.com/dequelabs/axe-core
- Faker.js: https://fakerjs.dev/