import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      testMatch: '**/security.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testMatch: '**/security.spec.ts',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testMatch: '**/security.spec.ts',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      testMatch: '**/security.spec.ts',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      testMatch: '**/security.spec.ts',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});