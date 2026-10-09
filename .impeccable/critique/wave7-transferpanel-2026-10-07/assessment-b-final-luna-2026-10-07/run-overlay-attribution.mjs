#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = process.cwd();
const script = path.join(evidenceDir, 'overlay-attribution.mjs');
const relativeScript = path.relative(repoRoot, script).replaceAll(path.sep, '/');
const command = `node "${relativeScript}"`;
const result = spawnSync(process.execPath, [script], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 16 * 1024 * 1024,
});
fs.writeFileSync(path.join(evidenceDir, 'overlay-attribution.command.txt'), `${command}\n`, 'utf8');
fs.writeFileSync(path.join(evidenceDir, 'overlay-attribution.stdout.json'), result.stdout ?? '', 'utf8');
fs.writeFileSync(path.join(evidenceDir, 'overlay-attribution.stderr.txt'), result.stderr ?? '', 'utf8');
fs.writeFileSync(path.join(evidenceDir, 'overlay-attribution.exit-code.txt'), `${result.status ?? -1}\n`, 'utf8');
process.stdout.write(JSON.stringify({ exitCode: result.status ?? null, command }) + '\n');
if (result.status !== 0) process.exitCode = result.status ?? 1;
