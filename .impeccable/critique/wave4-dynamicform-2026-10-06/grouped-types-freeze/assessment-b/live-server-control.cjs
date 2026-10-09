const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const evidenceDir = __dirname;
const workDirName = fs.readFileSync(path.join(evidenceDir, 'live-server-workdir.txt'), 'utf8').trim();
const workDir = path.resolve(evidenceDir, workDirName);
const liveServer = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs';
const mode = process.argv[2];

function run(args) {
  const child = spawnSync(process.execPath, [liveServer, ...args], {
    cwd: workDir,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
  });
  let serverInfo = null;
  let stdout = child.stdout || '';
  if (mode === 'start') {
    try {
      serverInfo = JSON.parse(stdout.trim());
      stdout = JSON.stringify({
        pid: serverInfo.pid,
        port: serverInfo.port,
        token: '[redacted]',
        tokenRedacted: true,
      }, null, 2) + '\n';
    } catch { /* Preserve non-secret diagnostic text when startup was not JSON. */ }
  }
  const stderr = (child.stderr || '').replace(serverInfo?.token || '\u0000', '[redacted]');
  const record = {
    mode,
    capturedAt: new Date().toISOString(),
    workDir,
    exitCode: child.status,
    signal: child.signal,
    processError: child.error ? String(child.error.message || child.error) : null,
    info: serverInfo ? { pid: serverInfo.pid, port: serverInfo.port, tokenRedacted: true } : null,
    stdoutEvidence: mode === 'start' ? 'server-start.stdout.redacted.json' : 'server-stop.stdout.txt',
    stderrEvidence: mode === 'start' ? 'server-start.stderr.txt' : 'server-stop.stderr.txt',
  };
  const prefix = mode === 'start' ? 'server-start' : 'server-stop';
  fs.writeFileSync(path.join(evidenceDir, `${prefix}.stdout${mode === 'start' ? '.redacted.json' : '.txt'}`), stdout, 'utf8');
  fs.writeFileSync(path.join(evidenceDir, `${prefix}.stderr.txt`), stderr, 'utf8');
  fs.writeFileSync(path.join(evidenceDir, `${prefix}.json`), JSON.stringify(record, null, 2) + '\n', 'utf8');
  process.stdout.write(JSON.stringify(record) + '\n');
  if (child.status !== 0) process.exitCode = child.status ?? 1;
  return serverInfo;
}

if (mode === 'start') {
  const serverInfo = run(['--background', '--target', workDir]);
  if (serverInfo?.port) fs.writeFileSync(path.join(evidenceDir, 'detector-server-port.txt'), `${serverInfo.port}\n`, 'utf8');
} else if (mode === 'stop') {
  run(['stop', '--keep-inject', '--target', workDir]);
} else {
  process.stderr.write('Usage: node live-server-control.cjs <start|stop>\n');
  process.exitCode = 2;
}
