import { defineConfig, devices } from '@playwright/test';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default defineConfig({
  testDir: './e2e/electron',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    launchOptions: {
      args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
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