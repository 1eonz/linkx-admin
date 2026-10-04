export default {
  testDir: 'F:/work/linkx-admin/other-admin/admin-vue3/tests/e2e',
  testMatch: '**/lx-dynamic-form-docs.spec.ts',
  reporter: 'line',
  timeout: 45000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4177',
    launchOptions: {
      executablePath: 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
    },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
};
