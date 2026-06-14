import { defineConfig, devices } from '@playwright/test';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

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
      testMatch: '**/electron-security.spec.ts',
      use: {
        launchOptions: {
          executablePath: require('electron'),
          args: ['.'],
        },
      },
    },
  ],
});