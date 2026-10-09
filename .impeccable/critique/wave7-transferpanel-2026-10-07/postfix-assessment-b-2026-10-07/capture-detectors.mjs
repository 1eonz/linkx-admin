import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const outputDir = path.join(
  root,
  '.impeccable/critique/wave7-transferpanel-2026-10-07/postfix-assessment-b-2026-10-07',
)
const detector = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs'
const targets = [
  ['component', 'linkx-fe/src/components/LxTransferPanel/index.vue'],
  ['demo-basic', 'linkx-fe/src/components/LxTransferPanel/demo/basic.vue'],
  ['docs', 'linkx-fe/docs/components/lxtransferpanel.md'],
]

mkdirSync(outputDir, { recursive: true })
const startedAt = new Date().toISOString()
const results = []

for (const [name, target] of targets) {
  const command = `node "${detector}" --json "${target}"`
  const result = spawnSync(process.execPath, [detector, '--json', target], {
    cwd: root,
    encoding: null,
    windowsHide: true,
  })
  const stdout = result.stdout ?? Buffer.alloc(0)
  const stderr = Buffer.concat([
    result.stderr ?? Buffer.alloc(0),
    result.error ? Buffer.from(`${result.error.message}\n`) : Buffer.alloc(0),
  ])
  const base = path.join(outputDir, `detector-${name}`)

  writeFileSync(`${base}.command.txt`, `${command}\n`)
  writeFileSync(`${base}.stdout.json`, stdout)
  writeFileSync(`${base}.stderr.txt`, stderr)
  writeFileSync(`${base}.exit-code.txt`, `${result.status ?? 'null'}\n`)
  results.push({
    name,
    target,
    command,
    exitCode: result.status,
    spawnError: result.error?.message ?? null,
    stdoutBytes: stdout.length,
    stderrBytes: stderr.length,
  })
}

writeFileSync(
  path.join(outputDir, 'detector-index.json'),
  `${JSON.stringify({ startedAt, completedAt: new Date().toISOString(), results }, null, 2)}\n`,
)
