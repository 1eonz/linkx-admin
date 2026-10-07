import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(outputDir, '../../../../');
const detector = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const targets = [
  'linkx-fe/src/components/LxDatePicker',
  'linkx-fe/src/components/LxDynamicForm',
  'linkx-fe/src/components/LxUpload',
];

function filesUnder(target) {
  const absolute = path.join(repoRoot, target);
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(absolute, entry.name);
    if (entry.isDirectory()) return filesUnder(path.relative(repoRoot, entryPath));
    return entry.isFile() ? [entryPath] : [];
  }).sort();
}

function hashTarget(target) {
  return filesUnder(target).map((absolute) => ({
    path: path.relative(repoRoot, absolute).replaceAll(path.sep, '/'),
    sha256: crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex'),
  }));
}

function writeJson(name, value) {
  fs.writeFileSync(path.join(outputDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

const startedAt = new Date().toISOString();
const hashesStart = Object.fromEntries(targets.map((target) => [target, hashTarget(target)]));
writeJson('source-hashes-start.json', { capturedAt: startedAt, targets: hashesStart });

const scans = [];
for (const target of targets) {
  const slug = path.basename(target).toLowerCase();
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

const hashesAfter = Object.fromEntries(targets.map((target) => [target, hashTarget(target)]));
writeJson('source-hashes-after-detector.json', { capturedAt: new Date().toISOString(), targets: hashesAfter });
const sourceIntegrity = targets.map((target) => ({
  target,
  unchanged: JSON.stringify(hashesStart[target]) === JSON.stringify(hashesAfter[target]),
}));
writeJson('detector-summary.json', {
  startedAt,
  completedAt: new Date().toISOString(),
  repoRoot,
  detector,
  scans,
  sourceIntegrity,
});
console.log(JSON.stringify({ scans, sourceIntegrity }, null, 2));
