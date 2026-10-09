import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const reportDir = path.resolve('.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-final-luna-max-2026-10-07');
const serverRoot = readFileSync(path.join(reportDir, 'live-server-root.txt'), 'utf8');
const script = 'C:\\Users\\Administrator\\.codex\\skills\\impeccable\\scripts\\live-server.mjs';
const result = spawnSync(process.execPath, [script, 'stop', '--keep-inject'], {
  cwd: serverRoot,
  encoding: 'utf8',
  windowsHide: true,
});
const exitCode = result.status ?? 1;
writeFileSync(path.join(reportDir, 'live-server-stop.stdout.txt'), result.stdout || '');
writeFileSync(path.join(reportDir, 'live-server-stop.stderr.txt'), result.stderr || '');
writeFileSync(path.join(reportDir, 'live-server-stop.exit-code.txt'), String(exitCode));
process.stdout.write(result.stdout || '');
if (result.stderr) process.stderr.write(result.stderr);
process.exitCode = exitCode;
