import { defineConfig, devices } from '@playwright/test';

import baseConfig from './playwright.config';

const lxuiDocsPort = process.env.LXUI_DOCS_PORT ?? '4177';

export default defineConfig({
  ...baseConfig,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  testIgnore: [],
  testMatch: '**/lx-*-docs.spec.ts',
  use: {
    ...baseConfig.use,
    baseURL: `http://127.0.0.1:${lxuiDocsPort}`,
  },
  webServer: {
    command: `pnpm --dir ../../linkx-fe dev --host 127.0.0.1 --port ${lxuiDocsPort} --strictPort`,
    url: `http://127.0.0.1:${lxuiDocsPort}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
