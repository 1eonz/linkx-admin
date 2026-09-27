import { defineConfig } from '@playwright/test';

import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  timeout: 240_000,
  testIgnore: [],
  testMatch: '**/preview.spec.ts',
  use: {
    ...baseConfig.use,
    baseURL: 'http://127.0.0.1:30847',
  },
  webServer: {
    command: 'pnpm dev:mock',
    url: 'http://127.0.0.1:30847',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
