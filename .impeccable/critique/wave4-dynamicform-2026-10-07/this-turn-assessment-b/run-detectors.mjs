import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const outDir = path.dirname(fileURLToPath(import.meta.url));
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const targets = [
  { key: 'dynamicform-source', path: 'linkx-fe/src/components/LxDynamicForm' },
  { key: 'upload-source', path: 'linkx-fe/src/components/LxUpload' },
  { key: 'dynamicform-docs', path: 'linkx-fe/docs/components/lxdynamicform.md' },
  { key: 'upload-docs', path: 'linkx-fe/docs/components/lxupload.md' },
];

const quote = (value) => '"' + String(value).replaceAll('"', '\\"') + '"';
const commandText = (args) => 'node ' + args.map(quote).join(' ') + '\n';
const digest = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function walkMarkup(entry) {
  const absolute = path.join(root, entry);
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return /\.(?:vue|md|html|tsx|jsx)$/i.test(entry) ? [entry] : [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((item) => {
    const relative = path.join(entry, item.name);
    return item.isDirectory() ? walkMarkup(relative) : /\.(?:vue|md|html|tsx|jsx)$/i.test(item.name) ? [relative] : [];
  });
}

const files = [
  ...walkMarkup('linkx-fe/src/components/LxDynamicForm'),
  ...walkMarkup('linkx-fe/src/components/LxUpload'),
  'linkx-fe/src/components/LxUpload/uid.ts',
  'linkx-fe/docs/components/lxdynamicform.md',
  'linkx-fe/docs/components/lxupload.md',
].sort();

fs.writeFileSync(path.join(outDir, 'source-hashes-before.json'), JSON.stringify({
  capturedAt: new Date().toISOString(),
  fileCount: files.length,
  files: Object.fromEntries(files.map((file) => [file.replaceAll(path.sep, '/'), digest(path.join(root, file))])),
}, null, 2) + '\n');

const results = [];
for (const target of targets) {
  const args = [detectorPath, '--json', target.path];
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', windowsHide: true });
  const dirName = String(results.length + 1).padStart(2, '0') + '-' + target.key;
  const targetDir = path.join(outDir, 'detector', dirName);
  fs.mkdirSync(targetDir, { recursive: true });
  const stdout = result.stdout ?? '';
  const stderr = (result.stderr ?? '') + (result.error ? result.error.message + '\n' : '');
  const exitCode = result.status ?? (result.error ? 1 : 0);
  let parsed;
  let parseError = null;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    parseError = error instanceof Error ? error.message : String(error);
  }
  fs.writeFileSync(path.join(targetDir, 'command.txt'), commandText(args));
  fs.writeFileSync(path.join(targetDir, 'stdout.json'), stdout);
  fs.writeFileSync(path.join(targetDir, 'stderr.txt'), stderr);
  fs.writeFileSync(path.join(targetDir, 'exit-code.txt'), String(exitCode) + '\n');
  const findingCount = Array.isArray(parsed)
    ? parsed.reduce((total, item) => total + (Array.isArray(item?.findings) ? item.findings.length : 1), 0)
    : Array.isArray(parsed?.findings)
      ? parsed.findings.length
      : null;
  const summary = {
    target: target.path,
    command: commandText(args),
    exitCode,
    stdoutValidJson: parseError === null,
    parseError,
    resultShape: Array.isArray(parsed) ? 'array' : parsed === undefined ? 'unparsed' : typeof parsed,
    findingCount,
    stderrEmpty: stderr.length === 0,
    error: result.error?.message ?? null,
  };
  fs.writeFileSync(path.join(targetDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  results.push(summary);
}

const hashesAfter = Object.fromEntries(files.map((file) => [file.replaceAll(path.sep, '/'), digest(path.join(root, file))]));
const hashesBefore = JSON.parse(fs.readFileSync(path.join(outDir, 'source-hashes-before.json'), 'utf8'));
const changedDuringScan = Object.entries(hashesAfter)
  .filter(([file, hash]) => hashesBefore.files[file] !== hash)
  .map(([file]) => file);
fs.writeFileSync(path.join(outDir, 'source-hashes-after-detector.json'), JSON.stringify({
  capturedAt: new Date().toISOString(),
  fileCount: files.length,
  files: hashesAfter,
  changedDuringScan,
}, null, 2) + '\n');

const aggregate = {
  complete: results.length === targets.length && results.every((item) => item.stdoutValidJson && item.exitCode !== 1),
  targetCount: targets.length,
  scannedCount: results.filter((item) => item.stdoutValidJson && item.exitCode !== 1).length,
  primaryFindingCount: results.reduce((sum, item) => sum + (item.findingCount ?? 0), 0),
  exitCodeCounts: results.reduce((counts, item) => {
    const key = String(item.exitCode);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {}),
  changedDuringScan,
  results,
};
fs.writeFileSync(path.join(outDir, 'detector-summary.json'), JSON.stringify(aggregate, null, 2) + '\n');
process.stdout.write(JSON.stringify(aggregate) + '\n');
if (!aggregate.complete || changedDuringScan.length) process.exitCode = 1;
