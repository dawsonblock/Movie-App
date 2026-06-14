import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/electron',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    launchOptions: {
      args: ['--disable-gpu', '--disable-dev-shm-usage'],
    },
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