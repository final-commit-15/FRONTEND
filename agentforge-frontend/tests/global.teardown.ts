import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');

  const authDir = path.join(__dirname, '.auth');
  const reportDir = path.join(__dirname, '../playwright-report');
  const resultsDir = path.join(__dirname, '../test-results');

  if (fs.existsSync(authDir)) {
    fs.rmSync(authDir, { recursive: true, force: true });
    console.log('🗑️ Cleaned up authentication state');
  }

  console.log('✅ Global teardown completed');
}

export default globalTeardown;