#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = process.cwd();
const detector = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const target = 'linkx-fe/src/components/LxTransferPanel';
const command = `node "${detector}" --json "${target}"`;
const result = spawnSync(process.execPath, [detector, '--json', target], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
});

fs.writeFileSync(path.join(evidenceDir, 'detector.command.txt'), `${command}\n`, 'utf8');
fs.writeFileSync(path.join(evidenceDir, 'detector.stdout.json'), result.stdout ?? '', 'utf8');
fs.writeFileSync(path.join(evidenceDir, 'detector.stderr.txt'), result.stderr ?? '', 'utf8');
fs.writeFileSync(path.join(evidenceDir, 'detector.exit-code.txt'), `${result.status ?? -1}\n`, 'utf8');

let parsed;
try {
  parsed = JSON.parse(result.stdout ?? '');
} catch {
  parsed = null;
}
const summary = {
  command,
  target,
  targetExists: fs.existsSync(path.resolve(repoRoot, target)),
  detectorExists: fs.existsSync(detector),
  exitCode: result.status ?? null,
  spawnError: result.error?.message ?? null,
  stdoutIsJson: parsed !== null,
  topLevelType: Array.isArray(parsed) ? 'array' : parsed === null ? null : typeof parsed,
};
fs.writeFileSync(path.join(evidenceDir, 'detector.summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
if (result.error) process.exitCode = 1;
else process.exitCode = result.status ?? 1;
