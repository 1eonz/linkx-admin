import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const evidenceDir = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.join(evidenceDir, 'live-root')
const scriptPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs'
const result = spawnSync(process.execPath, [scriptPath, '--background'], {
  cwd: serverRoot,
  encoding: 'utf8',
  timeout: 15000,
})
const stderr = (result.stderr || '') + (result.error ? `\n${result.error.message}` : '')
fs.writeFileSync(path.join(evidenceDir, 'live-server-start.stderr.txt'), stderr, 'utf8')
if (result.status !== 0) {
  fs.writeFileSync(path.join(evidenceDir, 'live-server-start.stdout.txt'), result.stdout || '', 'utf8')
  process.exitCode = Number.isInteger(result.status) ? result.status : 1
  process.stdout.write(JSON.stringify({ exitCode: process.exitCode, stderr }) + '\n')
} else {
  const info = JSON.parse((result.stdout || '').trim())
  const safeInfo = {
    pid: info.pid,
    port: info.port,
    serverRoot,
    scriptUrl: `http://localhost:${info.port}/detect.js`,
    stopMethod: `node ${scriptPath} stop`,
  }
  fs.writeFileSync(path.join(evidenceDir, 'live-server-start.json'), `${JSON.stringify(safeInfo, null, 2)}\n`, 'utf8')
  process.stdout.write(`${JSON.stringify({ exitCode: 0, ...safeInfo })}\n`)
}
