import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const evidenceDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(evidenceDir, '../../../..')
const projectRoot = path.join(repoRoot, 'linkx-fe')
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs'
const targets = [
  ['01-transferpanel-index', 'src/components/LxTransferPanel/index.vue'],
  ['02-transferpanel-demo', 'src/components/LxTransferPanel/demo/basic.vue'],
  ['03-transferpanel-docs', 'docs/components/lxtransferpanel.md'],
  ['04-virtualtree-index', 'src/components/LxVirtualTree/index.vue'],
  ['05-virtualtree-demo', 'src/components/LxVirtualTree/demo/basic.vue'],
  ['06-virtualtree-docs', 'docs/components/lxvirtualtree.md'],
]

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function quote(value) {
  return `"${value.replaceAll('"', '\\"')}"`
}

function countFindings(value) {
  if (Array.isArray(value)) return value.length
  if (!value || typeof value !== 'object') return null
  for (const key of ['findings', 'results', 'matches', 'issues']) {
    if (Array.isArray(value[key])) return value[key].length
  }
  return null
}

const summary = []

for (const [id, relativeTarget] of targets) {
  const targetPath = path.join(projectRoot, relativeTarget)
  const targetDirectory = path.join(evidenceDir, 'detector', id)
  fs.mkdirSync(targetDirectory, { recursive: true })

  let targetReadable = false
  try {
    fs.accessSync(targetPath, fs.constants.R_OK)
    targetReadable = true
  } catch {}

  const args = [detectorPath, '--json', targetPath]
  const displayCommand = `${quote(process.execPath)} ${args.map(quote).join(' ')}`
  const commandRecord = {
    displayCommand,
    executable: process.execPath,
    arguments: args,
    workingDirectory: projectRoot,
    target: targetPath,
    targetReadable,
  }
  const run = spawnSync(process.execPath, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  })
  const stdout = run.stdout ?? ''
  const stderr = run.stderr ?? ''
  const exitCode = run.status
  let parsed = null
  let jsonError = null

  try {
    parsed = JSON.parse(stdout)
  } catch (error) {
    jsonError = error instanceof Error ? error.message : String(error)
  }

  const stderrHasError = /\b(error|exception|failed|not found|cannot|timed out)\b/i.test(stderr)
  const processSucceeded = targetReadable && exitCode === 0 && jsonError === null && !stderrHasError
  const findingCount = parsed === null ? null : countFindings(parsed)
  const result = {
    id,
    target: relativeTarget,
    targetPath,
    targetReadable,
    exitCode,
    signal: run.signal ?? null,
    spawnError: run.error ? String(run.error) : null,
    jsonValid: jsonError === null,
    jsonError,
    findingCount,
    stderrHasError,
    processSucceeded,
    zeroHit: processSucceeded && findingCount === 0,
    stdoutBytes: Buffer.byteLength(stdout),
    stderrBytes: Buffer.byteLength(stderr),
  }

  const files = {
    'command.json': `${JSON.stringify(commandRecord, null, 2)}\n`,
    'stdout.json': stdout,
    'stderr.txt': stderr,
    'exit-code.txt': `${exitCode === null ? 'null' : exitCode}\n`,
    'result.json': `${JSON.stringify(result, null, 2)}\n`,
  }
  for (const [name, contents] of Object.entries(files)) {
    fs.writeFileSync(path.join(targetDirectory, name), contents, 'utf8')
  }

  const hashes = Object.fromEntries(
    Object.entries(files).map(([name, contents]) => [name, sha256(contents)]),
  )
  fs.writeFileSync(
    path.join(targetDirectory, 'sha256.json'),
    `${JSON.stringify(hashes, null, 2)}\n`,
    'utf8',
  )
  summary.push(result)
}

fs.writeFileSync(
  path.join(evidenceDir, 'detector-index.json'),
  `${JSON.stringify(summary, null, 2)}\n`,
  'utf8',
)
process.stdout.write('Detector evidence capture complete.\n')
