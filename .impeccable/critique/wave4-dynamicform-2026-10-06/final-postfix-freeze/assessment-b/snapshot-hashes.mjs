import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.resolve(root, '.impeccable/critique/wave4-dynamicform-2026-10-06/final-postfix-freeze/assessment-b');
const manifestPath = path.resolve(root, '.impeccable/critique/wave4-dynamicform-2026-10-06/final-postfix-freeze/source-hashes-freeze.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const files = Object.entries(manifest.files).map(([relPath, expected]) => {
  const actual = createHash('sha256').update(fs.readFileSync(path.resolve(root, relPath))).digest('hex');
  return { path: relPath, expected, actual, match: actual === expected };
});
const result = {
  phase: 'end',
  capturedAt: new Date().toISOString(),
  freezeFile: path.relative(root, manifestPath).replaceAll(path.sep, '/'),
  expectedFileCount: manifest.fileCount,
  checkedFileCount: files.length,
  allMatch: files.length === manifest.fileCount && files.every(file => file.match),
  files,
};
fs.writeFileSync(path.join(outDir, 'hashes-end.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ allMatch: result.allMatch, checkedFileCount: result.checkedFileCount, mismatches: files.filter(file => !file.match).map(file => file.path) }, null, 2));
if (!result.allMatch) process.exitCode = 2;
