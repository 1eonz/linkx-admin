import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const repoRoot = process.cwd();
const outputDir = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(outputDir, 'source-hashes-freeze.json');
const action = process.argv[2];

function hashFile(relativePath) {
  return createHash('sha256').update(fs.readFileSync(path.join(repoRoot, relativePath))).digest('hex');
}

function verify(phase) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const results = Object.entries(manifest.files).map(([relativePath, expected]) => {
    try {
      const actual = hashFile(relativePath);
      return { path: relativePath, expected, actual, matches: expected === actual };
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
    manifestEntryCount: results.length,
    matchedCount,
    allMatch: manifest.fileCount === 41 && results.length === 41 && matchedCount === 41,
    results,
  };
  const outputPath = path.join(outputDir, `freeze-${phase}.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ ...report, results: undefined, outputPath }, null, 2)}\n`);
  return report.allMatch ? 0 : 2;
}

if (action === 'create') {
  const previousPath = path.join(
    repoRoot,
    '.impeccable/critique/wave4-dynamicform-2026-10-07/post-fix-recheck/freeze/source-hashes-freeze.json',
  );
  const previous = JSON.parse(fs.readFileSync(previousPath, 'utf8'));
  const relativePaths = [
    ...Object.keys(previous.files),
    'other-admin/admin-vue3/tests/e2e/lx-date-picker-docs.spec.ts',
  ].sort();
  const files = Object.fromEntries(relativePaths.map((relativePath) => [relativePath, hashFile(relativePath)]));
  const manifest = {
    purpose: 'LxDynamicForm、LxUpload 与 DatePicker 建议修复后的最终独立复核冻结',
    capturedAt: new Date().toISOString(),
    fileCount: relativePaths.length,
    files,
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ manifestPath, fileCount: manifest.fileCount, capturedAt: manifest.capturedAt }, null, 2)}\n`);
  process.exitCode = verify('start');
} else if (action === 'verify-start' || action === 'verify-end') {
  process.exitCode = verify(action === 'verify-start' ? 'start' : 'end');
} else {
  process.stderr.write('用法：node manage-freeze.mjs create|verify-start|verify-end\n');
  process.exitCode = 64;
}
