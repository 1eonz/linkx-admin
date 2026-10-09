import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = process.cwd();
const target = path.join(repositoryRoot, 'linkx-fe', 'src', 'components', 'LxTransferPanel', 'index.vue');
const detector = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const args = [detector, '--json', target];
const quote = value => `"${value.replaceAll('"', '\\"')}"`;
const command = `${quote(process.execPath)} ${args.map(quote).join(' ')}`;
const result = spawnSync(process.execPath, args, { cwd: repositoryRoot, encoding: 'utf8', windowsHide: true });

fs.writeFileSync(path.join(evidenceDir, 'detector-command.txt'), `${command}\ncwd: ${repositoryRoot}\n`, 'utf8');
fs.writeFileSync(path.join(evidenceDir, 'detector-stdout.json'), result.stdout ?? '', 'utf8');
fs.writeFileSync(path.join(evidenceDir, 'detector-stderr.log'), result.stderr ?? '', 'utf8');
fs.writeFileSync(path.join(evidenceDir, 'detector-exit-code.txt'), `${result.status ?? 'null'}\n`, 'utf8');
process.stdout.write(JSON.stringify({ command, cwd: repositoryRoot, target, exitCode: result.status, signal: result.signal, error: result.error?.message ?? null }, null, 2) + '\n');
