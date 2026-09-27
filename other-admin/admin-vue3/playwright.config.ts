import { existsSync } from 'node:fs';

import { defineConfig, devices } from '@playwright/test';

/** 在本机未安装 Playwright 浏览器时，优先复用已安装的系统 Chrome。 */
function resolveChromiumExecutablePath(): string | undefined {
  const configuredPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (configuredPath && existsSync(configuredPath)) {
    return configuredPath;
  }

  if (process.platform !== 'win32') {
    return undefined;
  }

  const candidates = [
    process.env.PROGRAMFILES ? `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe` : undefined,
    process.env['ProgramFiles(x86)']
      ? `${process.env['ProgramFiles(x86)']}\\Google\\Chrome\\Application\\chrome.exe`
      : undefined,
    process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe` : undefined,
  ];

  return candidates.find((candidate): candidate is string => Boolean(candidate && existsSync(candidate)));
}

const chromiumExecutablePath = resolveChromiumExecutablePath();

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/preview.spec.ts', '**/lx-icon-docs.spec.ts', '**/lx-dialog-docs.spec.ts'],
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:30846',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: chromiumExecutablePath ? { executablePath: chromiumExecutablePath } : undefined,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 30846 --strictPort',
    url: 'http://127.0.0.1:30846',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
