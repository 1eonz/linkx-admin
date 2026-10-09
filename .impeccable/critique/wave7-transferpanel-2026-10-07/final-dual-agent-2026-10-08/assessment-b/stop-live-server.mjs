import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(outputDir, '../../../../../linkx-fe');
const serverScript = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs';
const args = [serverScript, 'stop', '--keep-inject'];
const command = [process.execPath, ...args].map((part) => `"${part}"`).join(' ');
const result = spawnSync(process.execPath, args, { cwd: projectRoot, windowsHide: true, maxBuffer: 5 * 1024 * 1024 });
fs.writeFileSync(path.join(outputDir, 'live-server-stop.command.txt'), `cwd: ${projectRoot}\n${command}\n`);
fs.writeFileSync(path.join(outputDir, 'live-server-stop.stdout.txt'), result.stdout?.toString('utf8') || '');
fs.writeFileSync(path.join(outputDir, 'live-server-stop.stderr.txt'), result.stderr?.toString('utf8') || '');
fs.writeFileSync(path.join(outputDir, 'live-server-stop.exit-code.txt'), `${result.status ?? 'null'}${result.signal ? ` (${result.signal})` : ''}\n`);
fs.writeFileSync(path.join(outputDir, 'live-server-stop.summary.json'), JSON.stringify({
  stopCommand: command,
  exitCode: result.status,
  signal: result.signal,
  spawnError: result.error ? String(result.error) : null,
}, null, 2));
if (result.status !== 0) process.exitCode = 1;
