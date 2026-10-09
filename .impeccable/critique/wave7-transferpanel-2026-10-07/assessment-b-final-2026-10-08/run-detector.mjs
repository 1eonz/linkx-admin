import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repo = process.cwd();
const outputDir = path.join(
  repo,
  '.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-final-2026-10-08',
);
const detector = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const target = path.join(repo, 'linkx-fe/src/components/LxTransferPanel/index.vue');
const command = `node "${detector}" --json "${target}"`;

const result = spawnSync(process.execPath, [detector, '--json', target], {
  cwd: repo,
  encoding: null,
  maxBuffer: 32 * 1024 * 1024,
});

fs.writeFileSync(path.join(outputDir, 'detector.command.txt'), `${command}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'detector.stdout.json'), result.stdout || Buffer.alloc(0));
fs.writeFileSync(path.join(outputDir, 'detector.stderr.txt'), result.stderr || Buffer.alloc(0));
fs.writeFileSync(
  path.join(outputDir, 'detector.exit-code.txt'),
  `${result.status ?? `spawn-error: ${result.error?.message ?? 'unknown'}`}\n`,
  'utf8',
);

process.stdout.write(JSON.stringify({
  exitCode: result.status,
  signal: result.signal,
  spawnError: result.error?.message ?? null,
  stdoutBytes: result.stdout?.length ?? 0,
  stderrBytes: result.stderr?.length ?? 0,
}) + '\n');

if (result.error || result.status === null) process.exitCode = 1;
