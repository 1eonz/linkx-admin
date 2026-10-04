import { spawn } from 'node:child_process'
import { appendFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const outputDir = dirname(fileURLToPath(import.meta.url))
const cwd = 'F:/work/linkx-admin/linkx-fe'
const vitepress = 'F:/work/linkx-admin/linkx-fe/node_modules/vitepress/bin/vitepress.js'
const args = [vitepress, 'dev', 'docs', '--host', '127.0.0.1', '--port', '4176', '--strictPort']
const command = `node ${args.map((value) => JSON.stringify(value)).join(' ')}`
const lifecycle = {
  cwd,
  port: 4176,
  command,
  wrapperPid: process.pid,
  serverPid: null,
  startOutput: '',
  startExitCode: null,
  stopCommand: null,
  stopOutput: null,
  stopExitCode: null,
  finalPortListening: null,
}
let stopping = false
let exitResolve
const childExited = new Promise((resolve) => { exitResolve = resolve })
const child = spawn(process.execPath, args, {
  cwd,
  windowsHide: true,
  stdio: ['ignore', 'pipe', 'pipe'],
})
lifecycle.serverPid = child.pid
await writeFile(join(outputDir, 'vitepress-4176-lifecycle.json'), `${JSON.stringify(lifecycle, null, 2)}\n`)

child.stdout.on('data', (chunk) => {
  const text = chunk.toString()
  lifecycle.startOutput += text
  void appendFile(join(outputDir, 'vitepress-4176.stdout.log'), text)
  process.stdout.write(chunk)
})
child.stderr.on('data', (chunk) => {
  const text = chunk.toString()
  lifecycle.startOutput += text
  void appendFile(join(outputDir, 'vitepress-4176.stderr.log'), text)
  process.stderr.write(chunk)
})
child.on('exit', (code, signal) => {
  lifecycle.startExitCode = code
  lifecycle.stopOutput = `VitePress process exited with code ${code} and signal ${signal ?? 'none'}.`
  lifecycle.finalPortListening = false
  void writeFile(join(outputDir, 'vitepress-4176-lifecycle.json'), `${JSON.stringify(lifecycle, null, 2)}\n`)
  exitResolve({ code, signal })
  if (!stopping && code !== 0) process.exitCode = code ?? 1
})

async function waitUntilReady() {
  const deadline = Date.now() + 45000
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`VitePress exited before readiness: ${child.exitCode}`)
    try {
      const response = await fetch('http://127.0.0.1:4176/components/lxdatepicker')
      if (response.status === 200) {
        lifecycle.startExitCode = 0
        lifecycle.startOutput += `Ready: HTTP ${response.status} /components/lxdatepicker\n`
        await writeFile(join(outputDir, 'vitepress-4176-lifecycle.json'), `${JSON.stringify(lifecycle, null, 2)}\n`)
        return
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('VitePress did not serve /components/lxdatepicker within 45 seconds.')
}

async function stop(signal) {
  if (stopping) return childExited
  stopping = true
  lifecycle.stopCommand = `child.kill(${JSON.stringify(signal)})`
  if (child.exitCode === null) child.kill(signal)
  const result = await childExited
  lifecycle.stopExitCode = result.code ?? 0
  lifecycle.stopOutput = `VitePress stopped by ${signal}; child exit code ${result.code}, signal ${result.signal ?? 'none'}.`
  lifecycle.finalPortListening = false
  await writeFile(join(outputDir, 'vitepress-4176-lifecycle.json'), `${JSON.stringify(lifecycle, null, 2)}\n`)
  return result
}

process.once('SIGTERM', () => { void stop('SIGTERM').then(() => process.exit(0)) })
process.once('SIGINT', () => { void stop('SIGINT').then(() => process.exit(0)) })

try {
  await waitUntilReady()
} catch (error) {
  lifecycle.startOutput += `${error.message}\n`
  await writeFile(join(outputDir, 'vitepress-4176-lifecycle.json'), `${JSON.stringify(lifecycle, null, 2)}\n`)
  await stop('SIGTERM')
  process.stderr.write(`${error.stack || error}\n`)
  process.exitCode = 1
}
