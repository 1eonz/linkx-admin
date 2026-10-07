import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(outputDir, '../../../../');
const detector = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const targets = [
  'linkx-fe/docs/components/lxdatepicker.md',
  'linkx-fe/docs/components/lxdynamicform.md',
  'linkx-fe/docs/components/lxupload.md',
];

function writeJson(name, value) {
  fs.writeFileSync(path.join(outputDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

const startedAt = new Date().toISOString();
const scans = [];
for (const target of targets) {
  const slug = `docs-${path.basename(target, '.md')}`;
  const command = `node "${detector}" --json "${target}"`;
  const result = spawnSync(process.execPath, [detector, '--json', target], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 32 * 1024 * 1024,
  });
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const exitCode = Number.isInteger(result.status) ? result.status : null;
  fs.writeFileSync(path.join(outputDir, `${slug}.command.txt`), `${command}\n`);
  fs.writeFileSync(path.join(outputDir, `${slug}.stdout.json`), stdout);
  fs.writeFileSync(path.join(outputDir, `${slug}.stderr.txt`), stderr);
  fs.writeFileSync(path.join(outputDir, `${slug}.exit-code.txt`), `${exitCode ?? `null (${result.signal ?? 'unknown signal'})`}\n`);

  let parsed = null;
  let parseError = null;
  try { parsed = JSON.parse(stdout); } catch (error) { parseError = error.message; }
  const findings = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.findings) ? parsed.findings : null;
  const integrityClean = exitCode === 0 && stderr.length === 0 && parseError === null && findings !== null;
  scans.push({
    target,
    command,
    exitCode,
    stdoutBytes: Buffer.byteLength(stdout),
    stderrBytes: Buffer.byteLength(stderr),
    parseError,
    findingsCount: findings?.length ?? null,
    staticZeroFindings: integrityClean && findings.length === 0,
    scanIntegrity: integrityClean ? 'valid' : 'failed-or-unverifiable',
  });
}

writeJson('docs-detector-summary.json', {
  startedAt,
  completedAt: new Date().toISOString(),
  repoRoot,
  detector,
  scans,
});
console.log(JSON.stringify({ scans }, null, 2));
