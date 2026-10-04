import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { defineConfig, devices } = require('F:/work/linkx-admin/other-admin/admin-vue3/node_modules/@playwright/test');
export default defineConfig({
  testDir: 'F:/work/linkx-admin/other-admin/admin-vue3/tests/e2e',
  testMatch: ['lx-status-switch-docs.spec.ts', 'lx-upload-docs.spec.ts'],
  fullyParallel: false,
  workers: 1,
  timeout: 15000,
  expect: { timeout: 3000 },
  reporter: [['list'], ['json', { outputFile: 'F:/work/linkx-admin/.impeccable/critique/wave2-browser-2026-09-30/playwright-runner.json' }]],
  outputDir: 'F:/work/linkx-admin/.impeccable/critique/wave2-browser-2026-09-30/test-results',
  use: {
    baseURL: 'http://127.0.0.1:4177',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
