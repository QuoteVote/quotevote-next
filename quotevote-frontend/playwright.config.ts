import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env.e2e.local') });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const authorStorageState = path.join(__dirname, 'e2e/.auth/authorUser.json');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    storageState: fs.existsSync(authorStorageState) ? authorStorageState : undefined,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'pnpm dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
