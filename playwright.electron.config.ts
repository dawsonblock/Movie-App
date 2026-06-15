import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 60000,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'electron-security',
      testMatch: '**/electron-security.spec.ts',
      use: {
        // These tests use custom Electron launcher via CDP
        // No standard browser launch options needed
        // No webServer needed - Electron launches its own Next.js server
        baseURL: 'http://127.0.0.1:45876',
      },
    },
  ],
});