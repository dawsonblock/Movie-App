import { defineConfig, devices } from '@playwright/test';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default defineConfig({
  testDir: './e2e/electron',
  fullyParallel: false, // Electron tests should run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for Electron tests
  reporter: 'html',
  timeout: 60000, // Longer timeout for Electron tests
  use: {
    // Don't set default args that might conflict with Playwright's Electron launcher
  },
  projects: [
    {
      name: 'electron',
      use: {
        // Electron-specific launch options
        launchOptions: {
          executablePath: require('electron'),
          args: ['.'],
        },
      },
    },
  ],
});