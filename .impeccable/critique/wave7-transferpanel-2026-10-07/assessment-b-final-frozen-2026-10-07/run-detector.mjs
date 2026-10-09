import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(evidenceDir, '..', '..', '..', '..');
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const targets = [
  ['component-index-vue', 'linkx-fe/src/components/LxTransferPanel/index.vue'],
  ['demo-basic-vue', 'linkx-fe/src/components/LxTransferPanel/demo/basic.vue'],
  ['docs-lxtransferpanel-md', 'linkx-fe/docs/components/lxtransferpanel.md'],
];

const quote = (value) => `"${value.replaceAll('"', '\\"')}"`;
const resultSummary = [];

for (const [name, target] of targets) {
  const args = [detectorPath, '--json', target];
  const command = `node ${args.map(quote).join(' ')}`;
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 24 * 1024 * 1024,
  });
  const stdout = result.stdout ?? '';
  const stderr = `${result.stderr ?? ''}${result.error ? `${result.error.message}\n` : ''}`;
  const targetDir = path.join(evidenceDir, 'detector');

  fs.writeFileSync(path.join(targetDir, `${name}.command.txt`), `${command}\n`, 'utf8');
  fs.writeFileSync(path.join(targetDir, `${name}.stdout.json`), stdout, 'utf8');
  fs.writeFileSync(path.join(targetDir, `${name}.stderr.txt`), stderr, 'utf8');
  fs.writeFileSync(path.join(targetDir, `${name}.exit-code.txt`), `${result.status ?? 'null'}\n`, 'utf8');

  let parsed = null;
  let jsonParseError = null;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    jsonParseError = error.message;
  }
  resultSummary.push({
    name,
    target,
    command,
    exitCode: result.status,
    signal: result.signal,
    launchError: result.error?.message ?? null,
    stderrBytes: Buffer.byteLength(stderr),
    stdoutBytes: Buffer.byteLength(stdout),
    stdoutJsonParsed: parsed !== null,
    jsonParseError,
    topLevelType: parsed === null ? null : Array.isArray(parsed) ? 'array' : typeof parsed,
    topLevelCount: Array.isArray(parsed)
      ? parsed.length
      : Array.isArray(parsed?.findings)
        ? parsed.findings.length
        : null,
  });
}

fs.writeFileSync(
  path.join(evidenceDir, 'detector', 'summary.json'),
  `${JSON.stringify({ completedAt: new Date().toISOString(), targets: resultSummary }, null, 2)}\n`,
  'utf8',
);
process.stdout.write(`${JSON.stringify(resultSummary, null, 2)}\n`);
