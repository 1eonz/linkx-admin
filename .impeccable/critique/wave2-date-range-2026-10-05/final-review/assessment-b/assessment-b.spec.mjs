import { spawnSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { test, expect } from 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/test.mjs'

const outputDir = 'F:/work/linkx-admin/.impeccable/critique/wave2-date-range-2026-10-05/final-review/assessment-b'
const repoRoot = 'F:/work/linkx-admin'
const runnerPath = join(outputDir, 'assessment-b.mjs')

test('captures current-source DatePicker browser evidence', async () => {
  const portCheck = spawnSync('powershell.exe', [
    '-NoProfile',
    '-Command',
    "(Get-NetTCPConnection -State Listen -LocalPort 4176 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess) -join ','",
  ], { encoding: 'utf8', timeout: 10000 })
  const listenerPid = portCheck.status === 0 ? portCheck.stdout.trim() : `check failed: ${portCheck.stderr.trim()}`
  await writeFile(join(outputDir, 'vitepress-4176-listener-pid.txt'), `${listenerPid}\n`)
  expect(portCheck.status).toBe(0)
  expect(listenerPid.length).toBeGreaterThan(0)

  const result = spawnSync(process.execPath, [runnerPath], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 150000,
  })
  await writeFile(join(outputDir, 'browser-runner.stdout.txt'), result.stdout ?? '')
  await writeFile(join(outputDir, 'browser-runner.stderr.txt'), result.stderr ?? '')
  await writeFile(join(outputDir, 'browser-runner.exit-code.txt'), `${result.status ?? 1}`)
  expect(result.error).toBeUndefined()
  expect(result.status).toBe(0)
})
