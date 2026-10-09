import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../');
const outputDir = path.dirname(fileURLToPath(import.meta.url));
const detector = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const targets = [
  'linkx-fe/src/components/LxDatePicker',
  'linkx-fe/src/components/LxDynamicForm',
  'linkx-fe/src/components/LxUpload',
];

function filesUnder(target) {
  const absolute = path.join(repoRoot, target);
  const entries = fs.readdirSync(absolute, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(absolute, entry.name);
    if (entry.isDirectory()) return filesUnder(path.relative(repoRoot, entryPath));
    if (!entry.isFile()) return [];
    return [entryPath];
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
const baseline = Object.fromEntries(targets.map((target) => [target, hashTarget(target)]));
writeJson('source-hashes-before.json', { capturedAt: startedAt, targets: baseline });

const summaries = [];
for (const target of targets) {
  const slug = path.basename(target).toLowerCase();
  const args = [detector, '--json', target];
  const command = `node "${detector}" --json "${target}"`;
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true,
  });
  const exitCode = Number.isInteger(result.status) ? result.status : null;
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  fs.writeFileSync(path.join(outputDir, `${slug}.command.txt`), `${command}\n`);
  fs.writeFileSync(path.join(outputDir, `${slug}.stdout.json`), stdout);
  fs.writeFileSync(path.join(outputDir, `${slug}.stderr.txt`), stderr);
  fs.writeFileSync(path.join(outputDir, `${slug}.exit-code.txt`), `${exitCode ?? `null (${result.signal ?? 'unknown signal'})`}\n`);
  let parsed = null;
  let parseError = null;
  try { parsed = JSON.parse(stdout); } catch (error) { parseError = error.message; }
  const integrityClean = exitCode === 0 && stderr.trim() === '' && parseError === null;
  const findings = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.findings) ? parsed.findings : null;
  const summary = {
    target,
    command,
    exitCode,
    stderrBytes: Buffer.byteLength(stderr),
    stdoutBytes: Buffer.byteLength(stdout),
    parseError,
    integrityClean,
    findingsCount: findings?.length ?? null,
    interpretation: integrityClean && findings?.length === 0
      ? 'static-zero-findings-only'
      : integrityClean && findings
        ? 'static-findings'
        : 'scan-failed-or-unverifiable',
  };
  summaries.push(summary);
}

const after = Object.fromEntries(targets.map((target) => [target, hashTarget(target)]));
writeJson('source-hashes-after-detector.json', {
  capturedAt: new Date().toISOString(),
  targets: after,
});
const integrity = targets.map((target) => ({
  target,
  unchanged: JSON.stringify(baseline[target]) === JSON.stringify(after[target]),
}));
writeJson('detector-summary.json', {
  startedAt,
  completedAt: new Date().toISOString(),
  repoRoot,
  detector,
  targets: summaries,
  sourceIntegrity: integrity,
});
console.log(JSON.stringify({ targets: summaries, sourceIntegrity: integrity }, null, 2));
