import net from 'node:net'
import { rm, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const outDir = path.resolve(
  '.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-postfix-final-2026-10-08',
)
const metadata = JSON.parse(await readFile(path.join(outDir, 'server-start-verification.json'), 'utf8'))
const tempRoot = path.resolve(metadata.temporaryRoot)
const tempBase = path.resolve(os.tmpdir())
if (!tempRoot.startsWith(`${tempBase}${path.sep}`) || !path.basename(tempRoot).startsWith('impeccable-wave7-agent-b-final-')) {
  throw new Error(`临时根目录校验失败，拒绝清理：${tempRoot}`)
}

const node = process.execPath
const liveServer = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs'
const overlayArgs = [liveServer, 'stop']
const overlayStop = spawnSync(node, overlayArgs, {
  cwd: tempRoot,
  encoding: 'utf8',
  timeout: 30000,
  windowsHide: true,
})
await Promise.all([
  writeFile(path.join(outDir, 'overlay-server.stop.command.txt'), `${JSON.stringify(node)} ${overlayArgs.map((arg) => JSON.stringify(arg)).join(' ')}\n`),
  writeFile(path.join(outDir, 'overlay-server.stop.stdout.txt'), overlayStop.stdout ?? ''),
  writeFile(path.join(outDir, 'overlay-server.stop.stderr.txt'), overlayStop.stderr ?? ''),
  writeFile(path.join(outDir, 'overlay-server.stop.exit-code.txt'), `${overlayStop.status ?? 'null'}\n`),
])

const previewPid = Number(metadata.previewPid)
const killArgs = ['/PID', String(previewPid), '/T', '/F']
const previewStop = spawnSync('taskkill.exe', killArgs, {
  encoding: 'utf8',
  timeout: 30000,
  windowsHide: true,
})
await Promise.all([
  writeFile(path.join(outDir, 'vitepress.stop.command.txt'), `taskkill.exe ${killArgs.join(' ')}\n`),
  writeFile(path.join(outDir, 'vitepress.stop.stdout.txt'), previewStop.stdout ?? ''),
  writeFile(path.join(outDir, 'vitepress.stop.stderr.txt'), previewStop.stderr ?? ''),
  writeFile(path.join(outDir, 'vitepress.stop.exit-code.txt'), `${previewStop.status ?? 'null'}\n`),
])

async function isListening(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port })
    const finish = (value) => {
      socket.destroy()
      resolve(value)
    }
    socket.setTimeout(600)
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(true))
    socket.once('error', () => finish(false))
  })
}

await delay(750)
const ownedPorts = [4184, 8417, 9347, 9348, 9349]
const remainingOwnedPorts = []
for (const port of ownedPorts) {
  if (await isListening(port)) remainingOwnedPorts.push(port)
}
await rm(tempRoot, { recursive: true, force: true })
const verification = {
  overlayStopExitCode: overlayStop.status,
  overlayStopOutput: overlayStop.stdout?.trim() ?? '',
  previewPid,
  previewStopExitCode: previewStop.status,
  previewStopOutput: previewStop.stdout?.trim() ?? '',
  remainingOwnedPorts,
  temporaryRootRemoved: true,
  port4174: 'not used or stopped by this assessment',
}
await writeFile(path.join(outDir, 'server-shutdown-verification.json'), JSON.stringify(verification, null, 2))
process.stdout.write(JSON.stringify(verification))
if (overlayStop.status !== 0 || remainingOwnedPorts.length) process.exitCode = 1
