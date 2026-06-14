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
    // Don't set any launch options that might conflict
  },
  projects: [
    {
      name: 'electron',
      testMatch: '**/security.spec.ts',
      use: {
        // Web-based tests provide Electron-compatible security validation
      },
    },
  ],
});