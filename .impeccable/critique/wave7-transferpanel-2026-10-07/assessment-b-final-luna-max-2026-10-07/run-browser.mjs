import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const reportDir = path.resolve('.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-final-luna-max-2026-10-07');
const script = path.join(reportDir, 'browser-run.mjs');
const result = spawnSync(process.execPath, [script], {
  cwd: process.cwd(),
  encoding: 'utf8',
  maxBuffer: 16 * 1024 * 1024,
  windowsHide: true,
});
const exitCode = result.status ?? 1;
writeFileSync(path.join(reportDir, 'browser-run.stdout.json'), result.stdout || '');
writeFileSync(path.join(reportDir, 'browser-run.stderr.txt'), result.stderr || '');
writeFileSync(path.join(reportDir, 'browser-run.exit-code.txt'), String(exitCode));
process.stdout.write(result.stdout || '');
if (result.stderr) process.stderr.write(result.stderr);
process.exitCode = exitCode;
