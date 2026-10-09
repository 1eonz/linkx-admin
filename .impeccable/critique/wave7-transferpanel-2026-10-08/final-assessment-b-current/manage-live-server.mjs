import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = 'C:/Users/Administrator/.codex/skills/impeccable';
const serverPath = path.join(skillRoot, 'scripts', 'live-server.mjs');
const action = process.argv[2];
if (action === 'redact') {
  const startPath = path.join(outDir, 'live-server-start.json');
  const report = JSON.parse(fs.readFileSync(startPath, 'utf8'));
  const response = report.response && typeof report.response === 'object' ? { ...report.response } : null;
  if (response && 'token' in response) response.token = '[redacted]';
  report.response = response;
  try {
    const parsedStdout = JSON.parse(report.stdout.trim());
    if ('token' in parsedStdout) parsedStdout.token = '[redacted]';
    report.stdout = `${JSON.stringify(parsedStdout)}\n`;
  } catch {
    report.stdout = '[unavailable]\n';
  }
  fs.writeFileSync(startPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, 'live-server-start.stdout.txt'), report.stdout);
  process.stdout.write(JSON.stringify({ action, redacted: true, port: response?.port ?? null, pid: response?.pid ?? null }) + '\n');
  process.exit(0);
}
const isStart = action === 'start';
const args = isStart ? [serverPath, '--background'] : action === 'stop' ? [serverPath, 'stop', '--keep-inject'] : null;

if (!args) {
  process.stderr.write('用法：node manage-live-server.mjs <start|stop>\n');
  process.exit(64);
}

const command = `node "${serverPath}" ${isStart ? '--background' : 'stop --keep-inject'}`;
const result = spawnSync(process.execPath, args, { cwd: process.cwd(), encoding: null, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
const stdout = result.stdout ?? Buffer.alloc(0);
const stderr = result.stderr ?? Buffer.alloc(0);
const stem = isStart ? 'live-server-start' : 'live-server-stop';
fs.writeFileSync(path.join(outDir, `${stem}.command.txt`), `${command}\n`);
fs.writeFileSync(path.join(outDir, `${stem}.stdout.txt`), stdout);
fs.writeFileSync(path.join(outDir, `${stem}.stderr.txt`), stderr);
fs.writeFileSync(path.join(outDir, `${stem}.exit-code.txt`), `${result.status ?? 'null'}\n`);

let response = null;
try {
  response = JSON.parse(stdout.toString('utf8').trim());
} catch {
  response = null;
}

const report = {
  action,
  command,
  exitCode: result.status,
  signal: result.signal,
  stdout: stdout.toString('utf8'),
  stderr: stderr.toString('utf8'),
  response,
  stopMethod: isStart ? null : 'node live-server.mjs stop --keep-inject',
  spawnError: result.error?.message ?? null,
};
fs.writeFileSync(path.join(outDir, `${stem}.json`), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
