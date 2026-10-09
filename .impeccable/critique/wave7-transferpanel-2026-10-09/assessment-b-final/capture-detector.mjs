import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const root = 'F:/work/linkx-admin'
const output = path.join(
  root,
  '.impeccable/critique/wave7-transferpanel-2026-10-09/assessment-b-final',
)
const detector =
  'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs'
const targets = [
  {
    name: 'component-index',
    file: 'linkx-fe/src/components/LxTransferPanel/index.vue',
  },
  {
    name: 'demo-basic',
    file: 'linkx-fe/src/components/LxTransferPanel/demo/basic.vue',
  },
]

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')
}

const startedAt = new Date().toISOString()
const before = Object.fromEntries(targets.map(({ file }) => [file, sha256(file)]))
fs.writeFileSync(
  path.join(output, 'source-sha256-before.json'),
  `${JSON.stringify({ startedAt, files: before }, null, 2)}\n`,
)

const summaries = []
for (const target of targets) {
  const args = [detector, '--json', target.file]
  const command = `node "${detector}" --json "${target.file}"`
  const result = spawnSync('node', args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  })
  const prefix = path.join(output, 'detector', target.name)
  fs.mkdirSync(path.dirname(prefix), { recursive: true })
  fs.writeFileSync(`${prefix}.command.txt`, `${command}\n`)
  fs.writeFileSync(`${prefix}.stdout.json`, result.stdout ?? '')
  fs.writeFileSync(`${prefix}.stderr.txt`, result.stderr ?? '')
  fs.writeFileSync(
    `${prefix}.exit-code.txt`,
    `${result.status ?? `null (signal ${result.signal ?? 'unknown'})`}\n`,
  )

  let parsed
  let parseError = null
  try {
    parsed = JSON.parse(result.stdout ?? '')
  } catch (error) {
    parseError = error.message
  }
  const summary = {
    name: target.name,
    file: target.file,
    command,
    exitCode: result.status,
    signal: result.signal,
    spawnError: result.error?.message ?? null,
    stderrBytes: Buffer.byteLength(result.stderr ?? ''),
    stdoutBytes: Buffer.byteLength(result.stdout ?? ''),
    jsonParsed: parseError === null,
    parseError,
    json: parsed ?? null,
  }
  fs.writeFileSync(`${prefix}.summary.json`, `${JSON.stringify(summary, null, 2)}\n`)
  summaries.push(summary)
}

fs.writeFileSync(
  path.join(output, 'detector', 'summary.json'),
  `${JSON.stringify({ startedAt, scans: summaries }, null, 2)}\n`,
)
process.stdout.write(
  summaries
    .map(
      (item) =>
        `${item.file}: exit=${item.exitCode ?? `signal:${item.signal}`} stdout=${item.stdoutBytes}B stderr=${item.stderrBytes}B json=${item.jsonParsed}`,
    )
    .join('\n') + '\n',
)

