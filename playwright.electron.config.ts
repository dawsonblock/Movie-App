import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 60000,
  use: {
    // Don't set default args that might conflict with Playwright's Electron launcher
  },
  projects: [
    {
      name: 'electron',
      testMatch: '**/electron-security.spec.ts', // Dedicated Electron security tests
      use: {
        // Electron-specific launch options
        launchOptions: {
          args: ['.'],
        },
      },
    },
  ],
});