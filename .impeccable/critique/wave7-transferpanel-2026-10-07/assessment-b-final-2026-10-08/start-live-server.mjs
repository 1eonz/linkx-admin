import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repo = process.cwd();
const outputDir = path.join(
  repo,
  '.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-final-2026-10-08',
);
const server = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs';
const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'impeccable-wave7-transferpanel-b-'));
const command = `node "${server}" --background`;
const result = spawnSync(process.execPath, [server, '--background'], {
  cwd: runtimeRoot,
  encoding: 'utf8',
  timeout: 20_000,
  maxBuffer: 2 * 1024 * 1024,
});

fs.writeFileSync(path.join(outputDir, 'live-server-start.command.txt'), `${command}\nWorking directory: ${runtimeRoot}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'live-server-start.stderr.txt'), result.stderr || '', 'utf8');
fs.writeFileSync(
  path.join(outputDir, 'live-server-start.exit-code.txt'),
  `${result.status ?? `spawn-error: ${result.error?.message ?? 'unknown'}`}\n`,
  'utf8',
);

let started = null;
try {
  const lines = (result.stdout || '').trim().split(/\r?\n/).filter(Boolean);
  const info = JSON.parse(lines.at(-1) || '{}');
  if (result.status === 0 && Number.isInteger(info.pid) && Number.isInteger(info.port)) {
    started = {
      runtimeRoot,
      pid: info.pid,
      port: info.port,
      startedAt: new Date().toISOString(),
      detectorUrl: `http://127.0.0.1:${info.port}/detect.js`,
    };
  }
} catch {
  // The sanitized record below marks malformed startup output as unavailable.
}

if (started) {
  fs.writeFileSync(path.join(outputDir, 'live-server-start.json'), `${JSON.stringify(started, null, 2)}\n`, 'utf8');
  process.stdout.write(JSON.stringify({ pid: started.pid, port: started.port, runtimeRoot }) + '\n');
} else {
  fs.writeFileSync(path.join(outputDir, 'live-server-start.json'), `${JSON.stringify({
    runtimeRoot,
    pid: null,
    port: null,
    startedAt: new Date().toISOString(),
    unavailable: true,
  }, null, 2)}\n`, 'utf8');
  process.stdout.write(JSON.stringify({
    pid: null,
    port: null,
    runtimeRoot,
    startupOutputBytes: Buffer.byteLength(result.stdout || ''),
    spawnError: result.error?.message ?? null,
  }) + '\n');
  process.exitCode = 1;
}
