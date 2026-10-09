import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const outputDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(outputDir, '..', '..', '..', '..')
const target = path.join(
  repoRoot,
  'linkx-fe',
  'src',
  'components',
  'LxTransferPanel',
  'index.vue',
)
const detector = process.argv[2]

if (!detector) {
  throw new Error('Pass the absolute path to Impeccable detect.mjs')
}

const hashFile = (filePath) =>
  createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
const sourceHashBefore = hashFile(target)
const args = [detector, '--json', target]
const result = spawnSync(process.execPath, args, {
  cwd: repoRoot,
  encoding: 'utf8',
  windowsHide: true,
  maxBuffer: 32 * 1024 * 1024,
})
const sourceHashAfter = hashFile(target)
const stdout = result.stdout ?? ''
const stderr = result.stderr ?? ''
let parsed
let validJson = false

try {
  parsed = JSON.parse(stdout.trim())
  validJson = true
} catch {}

fs.writeFileSync(
  path.join(outputDir, 'detector-command.txt'),
  `${JSON.stringify({ executable: process.execPath, args, cwd: repoRoot }, null, 2)}\n`,
)
fs.writeFileSync(path.join(outputDir, 'detector-stdout.json'), stdout)
fs.writeFileSync(path.join(outputDir, 'detector-stderr.log'), stderr)
fs.writeFileSync(
  path.join(outputDir, 'detector-exit-code.txt'),
  `${result.status ?? 'null'}\n`,
)
fs.writeFileSync(
  path.join(outputDir, 'detector-metadata.json'),
  `${JSON.stringify(
    {
      target,
      sourceHashBefore,
      sourceHashAfter,
      sourceUnchangedDuringScan: sourceHashBefore === sourceHashAfter,
      exitCode: result.status,
      signal: result.signal,
      spawnError: result.error?.message ?? null,
      validJson,
      emptyArray: validJson && Array.isArray(parsed) && parsed.length === 0,
      finishedAt: new Date().toISOString(),
    },
    null,
    2,
  )}\n`,
)

if (result.error || result.status !== 0 || !validJson || sourceHashBefore !== sourceHashAfter) {
  process.exitCode = 1
}
