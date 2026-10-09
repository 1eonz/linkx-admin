import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.resolve(root, '.impeccable/critique/wave3-lxicon-2026-10-06/final-assessment-b-recheck-isolated');
const script = path.join(outDir, 'capture-browser.mjs');
const overlayUrl = process.argv[2];
if (!overlayUrl) throw new Error('Usage: node run-browser.mjs <detect.js URL>');

const args = [script, overlayUrl];
const command = [JSON.stringify(process.execPath), ...args.map((arg) => JSON.stringify(arg))].join(' ');
const result = spawnSync(process.execPath, args, {
  cwd: root,
  encoding: 'utf8',
  windowsHide: true,
  maxBuffer: 16 * 1024 * 1024,
});

fs.writeFileSync(path.join(outDir, 'browser.command.txt'), `${command}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'browser.stdout.json'), result.stdout ?? '', 'utf8');
fs.writeFileSync(path.join(outDir, 'browser.stderr.txt'), result.stderr ?? '', 'utf8');
fs.writeFileSync(
  path.join(outDir, 'browser.exit-code.txt'),
  `${result.status ?? 'null'}${result.signal ? ` (signal: ${result.signal})` : ''}${result.error ? ` (spawn error: ${result.error.message})` : ''}\n`,
  'utf8',
);

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) process.exitCode = result.status ?? 1;
