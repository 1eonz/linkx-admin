import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const repoRoot = process.cwd();
const outputDir = path.dirname(fileURLToPath(import.meta.url));
const phase = process.argv[2];
if (!['start', 'end'].includes(phase)) {
  console.error('Usage: node verify-freeze.mjs <start|end>');
  process.exit(64);
}

const manifestPath = path.join(
  repoRoot,
  '.impeccable/critique/wave4-dynamicform-2026-10-07/post-fix-recheck/freeze/source-hashes-freeze.json',
);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const entries = Object.entries(manifest.files);
const results = entries.map(([relativePath, expected]) => {
  const absolutePath = path.join(repoRoot, relativePath);
  try {
    const actual = createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
    return { path: relativePath, expected, actual, matches: actual === expected };
  } catch (error) {
    return { path: relativePath, expected, actual: null, matches: false, error: error.message };
  }
});

const matchedCount = results.filter((item) => item.matches).length;
const report = {
  phase,
  checkedAt: new Date().toISOString(),
  manifestPath: path.relative(repoRoot, manifestPath),
  expectedCount: manifest.fileCount,
  manifestEntryCount: entries.length,
  matchedCount,
  allMatch: manifest.fileCount === 40 && entries.length === 40 && matchedCount === 40,
  results,
};
const outputPath = path.join(outputDir, `freeze-${phase}.json`);
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ ...report, results: undefined, outputPath }, null, 2)}\n`);
process.exitCode = report.allMatch ? 0 : 2;
