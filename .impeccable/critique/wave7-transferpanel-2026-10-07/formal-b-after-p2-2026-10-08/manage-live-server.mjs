import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const evidenceDir = path.dirname(fileURLToPath(import.meta.url))
const liveServerPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs'
const mode = process.argv[2]

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function quote(value) {
  return `"${value.replaceAll('"', '\\"')}"`
}

function commandText(args) {
  return `${quote(process.execPath)} ${[liveServerPath, ...args].map(quote).join(' ')}`
}

async function getHealth(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(2500) })
    return {
      reachable: true,
      status: response.status,
      body: await response.text(),
    }
  } catch (error) {
    return {
      reachable: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error?.code !== 'ESRCH'
  }
}

if (mode === 'start') {
  const args = ['--background']
  const startedAt = new Date().toISOString()
  const run = spawnSync(process.execPath, [liveServerPath, ...args], {
    cwd: evidenceDir,
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true,
  })
  const stdout = run.stdout ?? ''
  const stderr = run.stderr ?? ''
  fs.writeFileSync(path.join(evidenceDir, 'live-server-start.command.txt'), `${commandText(args)}\n`, 'utf8')
  fs.writeFileSync(path.join(evidenceDir, 'live-server-start.stdout.json'), stdout, 'utf8')
  fs.writeFileSync(path.join(evidenceDir, 'live-server-start.stderr.txt'), stderr, 'utf8')
  fs.writeFileSync(path.join(evidenceDir, 'live-server-start.exit-code.txt'), `${run.status ?? 'null'}\n`, 'utf8')

  let info = null
  let parseError = null
  try {
    info = JSON.parse(stdout.trim().split(/\r?\n/).filter(Boolean).at(-1))
  } catch (error) {
    parseError = error instanceof Error ? error.message : String(error)
  }
  const health = info?.port ? await getHealth(`http://127.0.0.1:${info.port}`) : null
  const lifecycle = {
    mode,
    startedAt,
    endedAt: new Date().toISOString(),
    workingDirectory: evidenceDir,
    command: commandText(args),
    exitCode: run.status,
    signal: run.signal ?? null,
    spawnError: run.error ? String(run.error) : null,
    stdoutSha256: sha256(stdout),
    stderrSha256: sha256(stderr),
    parseError,
    server: info,
    health,
    pidAlive: info?.pid ? isProcessAlive(info.pid) : false,
  }
  fs.writeFileSync(path.join(evidenceDir, 'live-server-start.json'), `${JSON.stringify(lifecycle, null, 2)}\n`, 'utf8')
  process.stdout.write(lifecycle.exitCode === 0 && health?.status === 200
    ? 'Live server start evidence saved.\n'
    : 'Live server start failed; details saved.\n')
  process.exitCode = lifecycle.exitCode === 0 && health?.status === 200 ? 0 : 1
} else if (mode === 'stop') {
  const start = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'live-server-start.json'), 'utf8'))
  const args = ['stop', '--keep-inject']
  const stoppedAt = new Date().toISOString()
  const run = spawnSync(process.execPath, [liveServerPath, ...args], {
    cwd: evidenceDir,
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true,
  })
  const stdout = run.stdout ?? ''
  const stderr = run.stderr ?? ''
  fs.writeFileSync(path.join(evidenceDir, 'live-server-stop.command.txt'), `${commandText(args)}\n`, 'utf8')
  fs.writeFileSync(path.join(evidenceDir, 'live-server-stop.stdout.txt'), stdout, 'utf8')
  fs.writeFileSync(path.join(evidenceDir, 'live-server-stop.stderr.txt'), stderr, 'utf8')
  fs.writeFileSync(path.join(evidenceDir, 'live-server-stop.exit-code.txt'), `${run.status ?? 'null'}\n`, 'utf8')

  const baseUrl = `http://127.0.0.1:${start.server.port}`
  let health = await getHealth(baseUrl)
  const deadline = Date.now() + 5000
  while ((health.reachable || isProcessAlive(start.server.pid)) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 250))
    health = await getHealth(baseUrl)
  }

  const lifecycle = {
    mode,
    startedAt: start.startedAt,
    stoppedAt,
    workingDirectory: evidenceDir,
    startCommand: start.command,
    startExitCode: start.exitCode,
    stopCommand: commandText(args),
    stopExitCode: run.status,
    stopSignal: run.signal ?? null,
    stopSpawnError: run.error ? String(run.error) : null,
    stopStdoutSha256: sha256(stdout),
    stopStderrSha256: sha256(stderr),
    server: start.server,
    healthAfterStop: health,
    pidAliveAfterStop: isProcessAlive(start.server.pid),
    stopSucceeded: run.status === 0 && !health.reachable && !isProcessAlive(start.server.pid),
  }
  fs.writeFileSync(path.join(evidenceDir, 'live-server-lifecycle.json'), `${JSON.stringify(lifecycle, null, 2)}\n`, 'utf8')
  process.stdout.write(lifecycle.stopSucceeded
    ? 'Live server stop evidence saved.\n'
    : 'Live server stop verification failed; details saved.\n')
  process.exitCode = lifecycle.stopSucceeded ? 0 : 1
} else {
  process.stderr.write('Usage: node manage-live-server.mjs <start|stop>\n')
  process.exitCode = 2
}
