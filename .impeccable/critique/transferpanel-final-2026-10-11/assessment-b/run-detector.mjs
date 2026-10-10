import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const evidenceDir = path.dirname(fileURLToPath(import.meta.url))
const [, , name, target] = process.argv
if (!name || !target) {
  throw new Error('Usage: node run-detector.mjs <name> <target>')
}

const scriptPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs'
const result = spawnSync(process.execPath, [scriptPath, '--json', target], {
  cwd: process.cwd(),
  encoding: 'utf8',
})
const stderr = (result.stderr || '') + (result.error ? `\n${result.error.message}` : '')
const exitCode = Number.isInteger(result.status) ? result.status : 1

fs.writeFileSync(path.join(evidenceDir, `detector-${name}.stdout.json`), result.stdout || '', 'utf8')
fs.writeFileSync(path.join(evidenceDir, `detector-${name}.stderr.txt`), stderr, 'utf8')
fs.writeFileSync(path.join(evidenceDir, `detector-${name}.exit-code.txt`), `${exitCode}\n`, 'utf8')

process.stdout.write(
  JSON.stringify({
    target,
    exitCode,
    signal: result.signal || null,
    stdoutBytes: Buffer.byteLength(result.stdout || ''),
    stderrBytes: Buffer.byteLength(stderr),
  }) + '\n',
)
