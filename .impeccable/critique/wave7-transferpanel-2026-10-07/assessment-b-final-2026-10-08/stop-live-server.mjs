import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repo = process.cwd();
const outputDir = path.join(
  repo,
  '.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-final-2026-10-08',
);
const server = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs';
const record = JSON.parse(fs.readFileSync(path.join(outputDir, 'live-server-start.json'), 'utf8'));
const command = `node "${server}" stop`;

fs.writeFileSync(path.join(outputDir, 'live-server-stop.command.txt'), `${command}\nWorking directory: ${record.runtimeRoot}\n`, 'utf8');
if (!record.pid || !record.runtimeRoot) {
  fs.writeFileSync(path.join(outputDir, 'live-server-stop.stdout.txt'), 'Skipped: live server did not start.\n', 'utf8');
  fs.writeFileSync(path.join(outputDir, 'live-server-stop.stderr.txt'), '', 'utf8');
  fs.writeFileSync(path.join(outputDir, 'live-server-stop.exit-code.txt'), 'not-run\n', 'utf8');
  process.stdout.write('live-server stop skipped; startup unavailable\n');
} else {
  const result = spawnSync(process.execPath, [server, 'stop'], {
    cwd: record.runtimeRoot,
    encoding: 'utf8',
    timeout: 20_000,
    maxBuffer: 2 * 1024 * 1024,
  });
  fs.writeFileSync(path.join(outputDir, 'live-server-stop.stdout.txt'), result.stdout || '', 'utf8');
  fs.writeFileSync(path.join(outputDir, 'live-server-stop.stderr.txt'), result.stderr || '', 'utf8');
  fs.writeFileSync(
    path.join(outputDir, 'live-server-stop.exit-code.txt'),
    `${result.status ?? `spawn-error: ${result.error?.message ?? 'unknown'}`}\n`,
    'utf8',
  );
  process.stdout.write(JSON.stringify({ exitCode: result.status, stderr: result.stderr || '' }) + '\n');
  if (result.error || result.status !== 0) process.exitCode = 1;
}
