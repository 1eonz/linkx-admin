import { defineConfig, devices } from '@playwright/test';

import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  testIgnore: [],
  testMatch: '**/lx-*-docs.spec.ts',
  use: {
    ...baseConfig.use,
    baseURL: 'http://127.0.0.1:4176',
  },
  webServer: {
    command: 'pnpm --dir ../../linkx-fe dev --host 127.0.0.1 --port 4176 --strictPort',
    url: 'http://127.0.0.1:4176',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
