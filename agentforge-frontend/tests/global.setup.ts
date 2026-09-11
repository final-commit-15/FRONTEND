import { FullConfig } from '@playwright/test';
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  const apiURL = process.env.API_URL || 'http://localhost:8000';
  const aiURL = process.env.AI_URL || 'http://localhost:8001';
  const testEmail = process.env.TEST_EMAIL || 'test@agentforge.ai';
  const testPassword = process.env.TEST_PASSWORD || 'password123';

  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔐 Authenticating test user...');
    try {
      await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      await page.fill('[data-testid="email-input"], input[type="email"]', testEmail);
      await page.fill('[data-testid="password-input"], input[type="password"]', testPassword);
      await page.click('[data-testid="login-button"], button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 30000 });

      await context.storageState({ path: path.join(authDir, 'user.json') });
      console.log('✅ Authentication state saved');
    } catch (authError) {
      console.warn('⚠️ Frontend not available, skipping authentication setup:', authError instanceof Error ? authError.message : String(authError));
      console.log('📝 Tests will need to handle authentication individually');
    }

    console.log('🏥 Checking API health...');
    try {
      const apiResponse = await page.request.get(`${apiURL}/health`, { timeout: 5000 });
      if (apiResponse.ok()) {
        console.log('✅ API health check passed');
      } else {
        console.warn('⚠️ API health check failed, but continuing...');
      }
    } catch {
      console.warn('⚠️ API not reachable, but continuing...');
    }

    console.log('🏥 Checking AI services health...');
    try {
      const aiResponse = await page.request.get(`${aiURL}/v1/health`, { timeout: 5000 });
      if (aiResponse.ok()) {
        console.log('✅ AI services health check passed');
      } else {
        console.warn('⚠️ AI services health check failed, but continuing...');
      }
    } catch {
      console.warn('⚠️ AI services not reachable, but continuing...');
    }

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('✅ Global setup completed');
}

export default globalSetup;