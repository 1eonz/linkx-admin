import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.resolve(root, '.impeccable/critique/wave4-dynamicform-2026-10-06/final-postfix-freeze/assessment-b');
const manifestPath = path.resolve(root, '.impeccable/critique/wave4-dynamicform-2026-10-06/final-postfix-freeze/source-hashes-freeze.json');
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const entries = Object.entries(manifest.files);

function hashFile(relPath) {
  return createHash('sha256').update(fs.readFileSync(path.resolve(root, relPath))).digest('hex');
}

function hashSnapshot(phase) {
  const files = entries.map(([relPath, expected]) => {
    const actual = hashFile(relPath);
    return { path: relPath, expected, actual, match: actual === expected };
  });
  return {
    phase,
    capturedAt: new Date().toISOString(),
    freezeFile: path.relative(root, manifestPath).replaceAll(path.sep, '/'),
    expectedFileCount: manifest.fileCount,
    checkedFileCount: files.length,
    allMatch: files.length === manifest.fileCount && files.every(file => file.match),
    files,
  };
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const start = hashSnapshot('start');
writeJson(path.join(outDir, 'hashes-start.json'), start);
if (!start.allMatch) {
  console.error(`Frozen-source baseline mismatch: ${start.files.filter(file => !file.match).map(file => file.path).join(', ')}`);
  process.exit(2);
}

const targets = entries
  .map(([relPath]) => relPath)
  .filter(relPath => /\.(?:vue|md|html?|astro|svelte|jsx|tsx)$/i.test(relPath));
const targetDir = path.join(outDir, 'detector');
fs.mkdirSync(targetDir, { recursive: true });
const results = [];

for (const target of targets) {
  const safeName = target.replaceAll('/', '__').replaceAll(/[^a-zA-Z0-9_.-]/g, '_');
  const command = `node "${detectorPath}" --json "${target}"`;
  const result = spawnSync(process.execPath, [detectorPath, '--json', target], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
  });
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const exitCode = Number.isInteger(result.status) ? result.status : 1;
  const base = path.join(targetDir, safeName);

  fs.writeFileSync(`${base}.command.txt`, `${command}\n`, 'utf8');
  fs.writeFileSync(`${base}.stdout.json`, stdout, 'utf8');
  fs.writeFileSync(`${base}.stderr.txt`, stderr, 'utf8');
  fs.writeFileSync(`${base}.exit-code.txt`, `${exitCode}\n`, 'utf8');

  let parsed = null;
  let parseError = null;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    parseError = String(error?.message || error);
  }
  results.push({
    target,
    command,
    exitCode,
    stdoutBytes: Buffer.byteLength(stdout),
    stderrBytes: Buffer.byteLength(stderr),
    jsonParsed: parsed !== null,
    parseError,
    findings: Array.isArray(parsed) ? parsed.length : Array.isArray(parsed?.findings) ? parsed.findings.length : null,
    advisoryFindings: Array.isArray(parsed?.advisories) ? parsed.advisories.length : null,
    status: result.error ? String(result.error.message || result.error) : null,
  });
}

writeJson(path.join(outDir, 'detector-summary.json'), {
  capturedAt: new Date().toISOString(),
  detectorPath,
  targetCount: targets.length,
  targets: results,
});

console.log(JSON.stringify({
  startHashCheck: start.allMatch,
  markupTargetCount: targets.length,
  detectorSummary: path.relative(root, path.join(outDir, 'detector-summary.json')).replaceAll(path.sep, '/'),
  failures: results.filter(result => result.exitCode !== 0 || !result.jsonParsed).length,
}, null, 2));
