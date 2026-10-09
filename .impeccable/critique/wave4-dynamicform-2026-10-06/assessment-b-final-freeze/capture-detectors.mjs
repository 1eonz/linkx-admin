import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const outDir = path.dirname(fileURLToPath(import.meta.url));
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const manifestPath = path.join(root, '.impeccable/critique/wave4-dynamicform-2026-10-06/source-hashes-freeze.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

function hashFile(relativePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relativePath))).digest('hex');
}

function verifyFreeze() {
  const files = Object.entries(manifest.files).map(([file, expected]) => {
    const actual = hashFile(file);
    return { path: file, expected, actual, status: actual === expected ? 'MATCH' : 'MISMATCH' };
  });
  return {
    manifest: path.relative(root, manifestPath).replaceAll(path.sep, '/'),
    capturedAt: manifest.capturedAt,
    expectedCount: manifest.fileCount,
    checkedCount: files.length,
    allMatch: files.length === manifest.fileCount && files.every((file) => file.status === 'MATCH'),
    files,
  };
}

function stringifyCommand(args) {
  const quote = (value) => `"${String(value).replaceAll('"', '\\"')}"`;
  return `node ${args.map(quote).join(' ')}\n`;
}

function extractFindings(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  for (const key of ['findings', 'primaryFindings', 'primary', 'results']) {
    if (Array.isArray(value[key])) return value[key];
  }
  return [];
}

const initialFreeze = verifyFreeze();
fs.writeFileSync(path.join(outDir, 'freeze-verification.json'), `${JSON.stringify(initialFreeze, null, 2)}\n`);
if (!initialFreeze.allMatch) {
  fs.writeFileSync(path.join(outDir, 'detector-summary.json'), `${JSON.stringify({ complete: false, reason: 'frozen hash mismatch', initialFreeze }, null, 2)}\n`);
  process.exit(2);
}

const detectorRoot = path.join(outDir, 'detector');
fs.mkdirSync(detectorRoot, { recursive: true });
const results = [];

for (const [index, relativePath] of Object.keys(manifest.files).entries()) {
  const currentHash = hashFile(relativePath);
  const expectedHash = manifest.files[relativePath];
  if (currentHash !== expectedHash) {
    results.push({ path: relativePath, status: 'NOT_SCANNED_HASH_MISMATCH', expectedHash, currentHash });
    break;
  }

  const name = `${String(index + 1).padStart(2, '0')}-${relativePath.replaceAll('\\', '/').replaceAll('/', '--').replace(/[^a-zA-Z0-9._-]/g, '-')}`;
  const targetDir = path.join(detectorRoot, name);
  fs.mkdirSync(targetDir, { recursive: true });
  const args = [detectorPath, '--json', relativePath];
  const command = stringifyCommand(args);
  fs.writeFileSync(path.join(targetDir, 'command.txt'), command);
  const run = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', windowsHide: true });
  const stdout = run.stdout ?? '';
  const stderr = `${run.stderr ?? ''}${run.error ? `${run.error.message}\n` : ''}`;
  const exitCode = run.status ?? (run.error ? 1 : 0);
  fs.writeFileSync(path.join(targetDir, 'stdout.json'), stdout);
  fs.writeFileSync(path.join(targetDir, 'stderr.txt'), stderr);
  fs.writeFileSync(path.join(targetDir, 'exit-code.txt'), `${exitCode}\n`);

  let parsed = null;
  let parseError = null;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    parseError = error instanceof Error ? error.message : String(error);
  }
  const findings = extractFindings(parsed);
  const rules = {};
  for (const finding of findings) {
    const rule = finding.rule ?? finding.ruleId ?? finding.id ?? 'unknown';
    rules[rule] = (rules[rule] ?? 0) + 1;
  }
  const validExit = exitCode === 0 || exitCode === 2;
  const entry = {
    path: relativePath,
    expectedHash,
    hashAtScan: currentHash,
    command,
    exitCode,
    stdoutValidJson: parsed !== null,
    parseError,
    resultShape: Array.isArray(parsed) ? 'array' : parsed && typeof parsed === 'object' ? Object.keys(parsed) : typeof parsed,
    findingCount: findings.length,
    rules,
    status: validExit && parsed !== null ? 'SCANNED' : 'SCAN_FAILED',
  };
  fs.writeFileSync(path.join(targetDir, 'summary.json'), `${JSON.stringify(entry, null, 2)}\n`);
  results.push(entry);
}

const finalFreeze = verifyFreeze();
fs.writeFileSync(path.join(outDir, 'freeze-verification-after.json'), `${JSON.stringify(finalFreeze, null, 2)}\n`);
const failures = results.filter((entry) => entry.status !== 'SCANNED');
const summary = {
  complete: results.length === manifest.fileCount && failures.length === 0 && finalFreeze.allMatch,
  manifest: path.relative(root, manifestPath).replaceAll(path.sep, '/'),
  targetCount: manifest.fileCount,
  scannedCount: results.filter((entry) => entry.status === 'SCANNED').length,
  primaryFindingCount: results.reduce((sum, entry) => sum + (entry.findingCount ?? 0), 0),
  exitCodeCounts: results.reduce((counts, entry) => {
    if (Number.isInteger(entry.exitCode)) counts[entry.exitCode] = (counts[entry.exitCode] ?? 0) + 1;
    return counts;
  }, {}),
  failures,
  results,
  finalFreezeAllMatch: finalFreeze.allMatch,
};
fs.writeFileSync(path.join(outDir, 'detector-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ complete: summary.complete, scannedCount: summary.scannedCount, primaryFindingCount: summary.primaryFindingCount, failures: failures.length, finalFreezeAllMatch: finalFreeze.allMatch })}\n`);
if (!summary.complete) process.exitCode = 2;
