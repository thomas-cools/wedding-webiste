import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for wedding website responsive testing.
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  /* Configure projects for desktop and mobile viewports */
  projects: [
    // ═══════════════════════════════════════════════════════════════
    // Desktop Browsers
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Desktop Edge',
      use: { ...devices['Desktop Edge'] },
    },

    // ═══════════════════════════════════════════════════════════════
    // Mobile Devices
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'Mobile Chrome (Android)',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari (iPhone)',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'Mobile Safari (iPhone SE)',
      use: { ...devices['iPhone SE'] },
    },

    // ═══════════════════════════════════════════════════════════════
    // Tablet Devices (iPad / iOS)
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'iPad',
      use: { ...devices['iPad (gen 7)'] },
    },
    {
      name: 'iPad Pro',
      use: { ...devices['iPad Pro 11'] },
    },
    {
      name: 'iPad Mini',
      use: { ...devices['iPad Mini'] },
    },
    {
      name: 'iPad Landscape',
      use: { 
        ...devices['iPad (gen 7) landscape'],
      },
    },
  ],

  /* Run Vite dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
