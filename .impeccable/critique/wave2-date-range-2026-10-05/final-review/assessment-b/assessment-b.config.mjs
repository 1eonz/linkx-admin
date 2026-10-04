import { defineConfig } from 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/test.mjs'

const outputDir = 'F:/work/linkx-admin/.impeccable/critique/wave2-date-range-2026-10-05/final-review/assessment-b'

export default defineConfig({
  testDir: outputDir,
  testMatch: 'assessment-b.spec.mjs',
  timeout: 180000,
  workers: 1,
  reporter: [['list']],
  webServer: {
    command: 'node "F:/work/linkx-admin/.impeccable/critique/wave2-date-range-2026-10-05/final-review/assessment-b/start-vitepress.mjs"',
    cwd: 'F:/work/linkx-admin',
    url: 'http://127.0.0.1:4176/components/lxdatepicker',
    reuseExistingServer: false,
    timeout: 60000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
