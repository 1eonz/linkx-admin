import { defineConfig } from '@playwright/test';

import baseConfig from './playwright.config';

const mockPreviewPort = Number(process.env.MOCK_PREVIEW_PORT ?? 30847);
if (!Number.isInteger(mockPreviewPort) || mockPreviewPort < 1 || mockPreviewPort > 65_535) {
  throw new Error('MOCK_PREVIEW_PORT 必须是有效的 TCP 端口号');
}
const mockPreviewUrl = `http://127.0.0.1:${mockPreviewPort}`;

export default defineConfig({
  ...baseConfig,
  timeout: 240_000,
  testIgnore: [],
  testMatch: ['**/preview.spec.ts', '**/col-form-search-race.spec.ts', '**/navbar-preview.spec.ts'],
  use: {
    ...baseConfig.use,
    baseURL: mockPreviewUrl,
  },
  webServer: {
    command: `pnpm dev:mock --port ${mockPreviewPort}`,
    url: mockPreviewUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
