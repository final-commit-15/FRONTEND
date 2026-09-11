import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.test' });

const isCI = !!process.env.CI;
const baseURL = process.env.BASE_URL || 'http://localhost:3000';
const apiURL = process.env.API_URL || 'http://localhost:8000';
const aiURL = process.env.AI_URL || 'http://localhost:8001';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['list'],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
    toMatchSnapshot: {
      threshold: 0.2,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] },
    },
    {
      name: 'chromium-dark',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
      },
    },
    {
      name: 'api',
      use: {
        baseURL: apiURL,
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
        },
      },
    },
    {
      name: 'ai-services',
      use: {
        baseURL: aiURL,
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
        },
      },
    },
  ],
  globalSetup: path.resolve(__dirname, './tests/global.setup.ts'),
  globalTeardown: path.resolve(__dirname, './tests/global.teardown.ts'),
  timeout: 120000,
  outputDir: 'test-results/',
  snapshotDir: 'tests/visual/snapshots/',
  metadata: {
    project: 'AgentForge',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
});