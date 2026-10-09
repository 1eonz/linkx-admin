import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const outDir = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(root, '.impeccable/critique/wave4-dynamicform-2026-10-06/source-hashes-freeze.json');
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const checked = Object.entries(manifest.files).map(([relativePath, expected]) => {
  const absolutePath = path.join(root, relativePath);
  const actual = crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
  return { path: relativePath, expected, actual, status: actual === expected ? 'MATCH' : 'MISMATCH' };
});
const verification = {
  manifest: path.relative(root, manifestPath).replaceAll(path.sep, '/'),
  capturedAt: manifest.capturedAt,
  fileCount: manifest.fileCount,
  checkedCount: checked.length,
  allMatch: checked.length === manifest.fileCount && checked.every((entry) => entry.status === 'MATCH'),
  files: checked,
};
fs.writeFileSync(path.join(outDir, 'freeze-verification.json'), `${JSON.stringify(verification, null, 2)}\n`);
if (!verification.allMatch) {
  fs.writeFileSync(path.join(outDir, 'detector-command.txt'), 'Detector not run: frozen file hash mismatch.\n');
  fs.writeFileSync(path.join(outDir, 'detector.stdout.json'), '');
  fs.writeFileSync(path.join(outDir, 'detector.stderr.txt'), 'Detector not run because the frozen file hashes did not match.\n');
  fs.writeFileSync(path.join(outDir, 'detector.exit-code.txt'), 'not-run\n');
  process.exit(2);
}

const files = Object.keys(manifest.files);
const args = [detectorPath, '--json', ...files];
const quote = (value) => `"${value.replaceAll('"', '\\"')}"`;
const command = `node ${args.map(quote).join(' ')}\n`;
fs.writeFileSync(path.join(outDir, 'detector-command.txt'), command);
const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', windowsHide: true });
const stdout = result.stdout ?? '';
const stderr = result.stderr ?? '';
const code = result.status ?? (result.error ? 1 : 0);
fs.writeFileSync(path.join(outDir, 'detector.stdout.json'), stdout);
fs.writeFileSync(path.join(outDir, 'detector.stderr.txt'), stderr);
fs.writeFileSync(path.join(outDir, 'detector.exit-code.txt'), `${code}\n`);

let parsed = null;
let parseError = null;
try {
  parsed = JSON.parse(stdout);
} catch (error) {
  parseError = error instanceof Error ? error.message : String(error);
}
const summarize = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  for (const key of ['findings', 'primaryFindings', 'primary', 'results']) {
    if (Array.isArray(value[key])) return value[key];
  }
  return [];
};
const findings = summarize(parsed);
const byRule = {};
const byFile = {};
for (const finding of findings) {
  const rule = finding.rule ?? finding.ruleId ?? finding.id ?? 'unknown';
  const file = finding.file ?? finding.path ?? finding.target ?? 'unknown';
  byRule[rule] = (byRule[rule] ?? 0) + 1;
  byFile[file] = (byFile[file] ?? 0) + 1;
}
const summary = {
  command,
  exitCode: code,
  stdoutValidJson: parsed !== null,
  parseError,
  resultShape: Array.isArray(parsed) ? 'array' : parsed && typeof parsed === 'object' ? Object.keys(parsed) : typeof parsed,
  primaryFindingCount: findings.length,
  advisoryFindingCount: Array.isArray(parsed?.advisories) ? parsed.advisories.length : Array.isArray(parsed?.advisory) ? parsed.advisory.length : 0,
  byRule,
  byFile,
};
fs.writeFileSync(path.join(outDir, 'detector-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
if (result.error) process.stderr.write(`${result.error.message}\n`);
process.exit(code);
