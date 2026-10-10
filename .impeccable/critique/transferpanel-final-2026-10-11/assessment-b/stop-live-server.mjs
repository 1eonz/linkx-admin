import fs from 'node:fs'
import path from 'node:path'
import net from 'node:net'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const evidenceDir = path.dirname(fileURLToPath(import.meta.url))
const startInfo = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'live-server-start.json'), 'utf8'))
const scriptPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs'
const result = spawnSync(process.execPath, [scriptPath, 'stop'], {
  cwd: startInfo.serverRoot,
  encoding: 'utf8',
  timeout: 15000,
})
const stderr = (result.stderr || '') + (result.error ? `\n${result.error.message}` : '')

const portClosed = () =>
  new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port: startInfo.port })
    socket.setTimeout(1000)
    socket.once('connect', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', (error) => resolve(error.code === 'ECONNREFUSED'))
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
  })

let closed = false
for (let attempt = 1; attempt <= 20; attempt += 1) {
  closed = await portClosed()
  if (closed) break
  await new Promise((resolve) => setTimeout(resolve, 250))
}

const stopInfo = {
  port: startInfo.port,
  pid: startInfo.pid,
  stopMethod: `node ${scriptPath} stop`,
  exitCode: Number.isInteger(result.status) ? result.status : 1,
  stdout: result.stdout || '',
  stderr,
  portClosed: closed,
  checks: closed ? 'port refused a TCP connection after stop' : 'port remained reachable after stop attempt',
}
fs.writeFileSync(path.join(evidenceDir, 'live-server-stop.json'), `${JSON.stringify(stopInfo, null, 2)}\n`, 'utf8')
process.stdout.write(`${JSON.stringify({ exitCode: stopInfo.exitCode, port: stopInfo.port, portClosed: stopInfo.portClosed, stdout: stopInfo.stdout, stderr: stopInfo.stderr })}\n`)
if (stopInfo.exitCode !== 0 || !closed) process.exitCode = 1
