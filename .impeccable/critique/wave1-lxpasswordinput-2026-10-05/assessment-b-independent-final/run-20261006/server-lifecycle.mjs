import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const root = process.cwd();
const runDir = path.join(root, '.impeccable/critique/wave1-lxpasswordinput-2026-10-05/assessment-b-independent-final/run-20261006');
const appDir = path.join(root, 'linkx-fe');
const cli = path.join(appDir, 'node_modules/vitepress/bin/vitepress.js');
const port = 4195;
const stdout = fs.createWriteStream(path.join(runDir, 'vitepress.stdout.log'));
const stderr = fs.createWriteStream(path.join(runDir, 'vitepress.stderr.log'));
const child = spawn(process.execPath, [cli, 'dev', 'docs', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: appDir,
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});

child.stdout.pipe(stdout);
child.stderr.pipe(stderr);
fs.writeFileSync(path.join(runDir, 'vitepress-start.json'), JSON.stringify({
  command: `node ${cli} dev docs --host 127.0.0.1 --port ${port} --strictPort`,
  cwd: appDir,
  host: '127.0.0.1',
  port,
  pid: child.pid,
  startedAt: new Date().toISOString(),
}, null, 2));

let stopRequested = false;
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  if (!chunk.includes('stop')) return;
  stopRequested = true;
  child.kill('SIGTERM');
});

child.on('error', (error) => {
  fs.writeFileSync(path.join(runDir, 'vitepress-error.txt'), `${error.name}: ${error.message}\n`);
});

child.on('exit', async (code, signal) => {
  stdout.end();
  stderr.end();
  await Promise.all([
    new Promise((resolve) => stdout.on('finish', resolve)),
    new Promise((resolve) => stderr.on('finish', resolve)),
  ]);
  let stillResponding = false;
  let status = null;
  try {
    const response = await fetch(`http://127.0.0.1:${port}/components/lxpasswordinput.html`);
    status = response.status;
    stillResponding = response.ok;
    await response.body?.cancel();
  } catch {}
  fs.writeFileSync(path.join(runDir, 'vitepress-stop.json'), JSON.stringify({
    command: 'stop request via stdin: stop',
    pid: child.pid,
    stopRequested,
    endedAt: new Date().toISOString(),
    exitCode: code,
    signal,
    wrapperExitCode: stillResponding ? 1 : 0,
    finalProbe: { url: `http://127.0.0.1:${port}/components/lxpasswordinput.html`, status, stillResponding },
  }, null, 2));
  process.exitCode = stillResponding ? 1 : 0;
});

let ready = false;
for (let attempt = 0; attempt < 60; attempt += 1) {
  if (child.exitCode !== null) break;
  try {
    const response = await fetch(`http://127.0.0.1:${port}/components/lxpasswordinput.html`);
    if (response.ok) {
      ready = true;
      await response.body?.cancel();
      break;
    }
  } catch {}
  await delay(500);
}
fs.writeFileSync(path.join(runDir, 'vitepress-ready.json'), JSON.stringify({
  url: `http://127.0.0.1:${port}/components/lxpasswordinput.html`,
  ready,
  checkedAt: new Date().toISOString(),
}, null, 2));
if (!ready) process.exitCode = 1;
