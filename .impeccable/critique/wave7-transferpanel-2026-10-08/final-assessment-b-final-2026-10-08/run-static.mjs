import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(evidenceDir, '..', '..', '..', '..');
const target = path.join(root, 'linkx-fe', 'src', 'components', 'LxTransferPanel', 'index.vue');
const detector = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const args = [detector, '--json', target];
const command = `"${process.execPath}" ${args.map(arg => `"${arg}"`).join(' ')}`;
const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });

fs.writeFileSync(path.join(evidenceDir, 'detector-command.txt'), `${command}\ncwd: ${root}\n`, 'utf8');
fs.writeFileSync(path.join(evidenceDir, 'detector-stdout.json'), result.stdout ?? '', 'utf8');
fs.writeFileSync(path.join(evidenceDir, 'detector-stderr.log'), result.stderr ?? '', 'utf8');
fs.writeFileSync(path.join(evidenceDir, 'detector-exit-code.txt'), `${result.status ?? 'null'}\n`, 'utf8');

process.stdout.write(JSON.stringify({
  command,
  cwd: root,
  exitCode: result.status,
  signal: result.signal,
  error: result.error?.message ?? null,
  stdoutBytes: Buffer.byteLength(result.stdout ?? ''),
  stderrBytes: Buffer.byteLength(result.stderr ?? ''),
}, null, 2) + '\n');
