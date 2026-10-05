import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const outputDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(outputDir, '../../../..');
const liveServer = 'C:\\Users\\Administrator\\.codex\\skills\\impeccable\\scripts\\live-server.mjs';
const mode = process.argv[2];

if (mode !== 'start' && mode !== 'stop') {
  process.stderr.write('Usage: node run-live-server.mjs <start|stop>\n');
  process.exit(2);
}

const args = mode === 'start' ? ['--background'] : ['stop'];
const command = `node "${liveServer}" ${args.map((arg) => `"${arg}"`).join(' ')}`;
const result = spawnSync(process.execPath, [liveServer, ...args], {
  cwd: repoRoot,
  encoding: 'utf8',
  windowsHide: true,
});
const redact = (value) => (value ?? '')
  .replace(/("token"\s*:\s*")[^"]*(")/gi, '$1<redacted>$2')
  .replace(/(Token:\s*)\S+/gi, '$1<redacted>');
const prefix = resolve(outputDir, `live-server-${mode}`);

mkdirSync(outputDir, { recursive: true });
writeFileSync(`${prefix}-command.txt`, `${command}\n`, 'utf8');
writeFileSync(`${prefix}.stdout.redacted.txt`, redact(result.stdout), 'utf8');
writeFileSync(`${prefix}.stderr.txt`, redact(result.stderr), 'utf8');
writeFileSync(`${prefix}.exit-code.txt`, `${result.status ?? 'null'}\n`, 'utf8');

process.stdout.write(`${mode}: exit=${result.status ?? 'null'}\n`);
if (result.error) process.stderr.write(`${mode}: ${result.error.message}\n`);
if (result.status !== 0) process.exitCode = result.status ?? 1;
