import { spawn, spawnSync } from 'node:child_process'
import { closeSync, openSync } from 'node:fs'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const root = process.cwd()
const outDir = path.resolve(
  '.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-postfix-final-2026-10-08',
)
const skillDir = 'C:/Users/Administrator/.codex/skills/impeccable/scripts'
const overlayScript = path.join(skillDir, 'live-server.mjs')
const previewPort = 4184
const overlayPort = 8417
const tempRoot = await mkdtemp(path.join(tmpdir(), 'impeccable-wave7-agent-b-final-'))
const previewScript = path.join(root, 'linkx-fe/node_modules/vitepress/bin/vitepress.js')
const previewArgs = [previewScript, 'dev', 'docs', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort']
const overlayArgs = [overlayScript, '--background', `--port=${overlayPort}`]

const overlayStart = spawnSync(process.execPath, overlayArgs, {
  cwd: tempRoot,
  encoding: 'utf8',
  timeout: 45000,
  windowsHide: true,
})
let overlayStartSummary = overlayStart.stdout?.trim() ?? ''
try {
  const parsed = JSON.parse(overlayStartSummary)
  overlayStartSummary = JSON.stringify({
    pid: parsed.pid ?? null,
    port: parsed.port ?? overlayPort,
    credentialValueStored: false,
  })
} catch {}
await Promise.all([
  writeFile(path.join(outDir, 'overlay-server.start.command.txt'), `${JSON.stringify(process.execPath)} ${overlayArgs.map((arg) => JSON.stringify(arg)).join(' ')}\n`),
  writeFile(path.join(outDir, 'overlay-server.start.cwd.txt'), `${tempRoot}\n`),
  writeFile(path.join(outDir, 'overlay-server.start.stdout.json'), overlayStartSummary),
  writeFile(path.join(outDir, 'overlay-server.start.stderr.txt'), overlayStart.stderr ?? ''),
  writeFile(path.join(outDir, 'overlay-server.start.exit-code.txt'), `${overlayStart.status ?? 'null'}\n`),
  writeFile(path.join(outDir, 'overlay-server-root.path.txt'), `${tempRoot}\n`),
])
if (overlayStart.status !== 0) {
  throw new Error(`overlay live-server 未成功启动，exit=${overlayStart.status} signal=${overlayStart.signal ?? 'none'}`)
}

const stdoutPath = path.join(outDir, 'vitepress.stdout.log')
const stderrPath = path.join(outDir, 'vitepress.stderr.log')
const stdoutFd = openSync(stdoutPath, 'a')
const stderrFd = openSync(stderrPath, 'a')
const preview = spawn(process.execPath, previewArgs, {
  cwd: path.join(root, 'linkx-fe'),
  detached: true,
  stdio: ['ignore', stdoutFd, stderrFd],
  windowsHide: true,
})
closeSync(stdoutFd)
closeSync(stderrFd)
preview.unref()
await Promise.all([
  writeFile(path.join(outDir, 'vitepress.start.command.txt'), `${JSON.stringify(process.execPath)} ${previewArgs.map((arg) => JSON.stringify(arg)).join(' ')}\n`),
  writeFile(path.join(outDir, 'vitepress.start.cwd.txt'), `${path.join(root, 'linkx-fe')}\n`),
  writeFile(path.join(outDir, 'vitepress.pid.txt'), `${preview.pid}\n`),
])

const deadline = Date.now() + 45000
let previewStatus = null
while (Date.now() < deadline) {
  try {
    const response = await fetch(`http://127.0.0.1:${previewPort}/components/lxtransferpanel.html`)
    previewStatus = response.status
    if (response.ok) break
  } catch {}
  await delay(250)
}
const overlayCheck = await fetch(`http://127.0.0.1:${overlayPort}/detect.js`).then((response) => response.status).catch(() => null)
const verification = {
  previewPid: preview.pid,
  previewPort,
  previewHttpStatus: previewStatus,
  overlayPort,
  overlayScriptHttpStatus: overlayCheck,
  overlayStartExitCode: overlayStart.status,
  overlayStartSummary,
  overlayStartStderrLength: overlayStart.stderr?.length ?? 0,
  temporaryRoot: tempRoot,
  untouched4174: 'not queried for mutation and not used by this assessment',
}
await writeFile(path.join(outDir, 'server-start-verification.json'), JSON.stringify(verification, null, 2))
process.stdout.write(JSON.stringify(verification))
if (previewStatus !== 200 || overlayCheck !== 200) process.exitCode = 1
