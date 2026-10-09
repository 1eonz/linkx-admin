import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.resolve(root, '.impeccable/critique/wave4-dynamicform-2026-10-06/final-postfix-freeze/assessment-b');
const scriptPath = path.join(outDir, 'capture-browser.mjs');
const port = process.argv[2] || '';
const mode = process.argv[3] || '';
const command = `node "${path.relative(root, scriptPath).replaceAll(path.sep, '/')}" ${port}${mode ? ` ${mode}` : ''}`;
const result = spawnSync(process.execPath, [scriptPath, port, mode], {
  cwd: root,
  encoding: 'utf8',
  windowsHide: true,
  maxBuffer: 16 * 1024 * 1024,
});
const base = path.join(outDir, mode === '--mobile-only' ? 'browser-mobile-control' : 'browser-capture');
const exitCode = Number.isInteger(result.status) ? result.status : 1;

fs.writeFileSync(`${base}.command.txt`, `${command}\n`, 'utf8');
fs.writeFileSync(`${base}.stdout.json`, result.stdout ?? '', 'utf8');
fs.writeFileSync(`${base}.stderr.txt`, result.stderr ?? '', 'utf8');
fs.writeFileSync(`${base}.exit-code.txt`, `${exitCode}\n`, 'utf8');

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) process.stderr.write(`${result.error.message}\n`);
process.exitCode = exitCode;
