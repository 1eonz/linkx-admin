import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const outDir = path.dirname(fileURLToPath(import.meta.url));
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const sourceRoots = [
  'linkx-fe/src/components/LxDynamicForm',
  'linkx-fe/src/components/LxDatePicker',
  'linkx-fe/src/components/LxUpload',
];
const docs = [
  'linkx-fe/docs/components/lxdynamicform.md',
  'linkx-fe/docs/components/lxdatepicker.md',
  'linkx-fe/docs/components/lxupload.md',
];
const sharedDependencies = ['linkx-fe/src/components/LxForm/LxFormItem.vue'];
const targets = [
  ['01-dynamicform-component', sourceRoots[0]],
  ['02-dynamicform-doc', docs[0]],
  ['03-datepicker-component', sourceRoots[1]],
  ['04-datepicker-doc', docs[1]],
  ['05-upload-component', sourceRoots[2]],
  ['06-upload-doc', docs[2]],
];

function walk(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.posix.join(dir.replaceAll(path.sep, '/'), entry.name);
    return entry.isDirectory() ? walk(relative) : [relative];
  });
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
}

function snapshot() {
  const files = [...new Set([...sourceRoots.flatMap(walk), ...docs, ...sharedDependencies])].sort();
  return Object.fromEntries(files.map((file) => [file, sha256(file)]));
}

function writeManifest(name, files, changedDuringScan = undefined) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify({
    capturedAt: new Date().toISOString(),
    fileCount: Object.keys(files).length,
    files,
    ...(changedDuringScan ? { changedDuringScan } : {}),
  }, null, 2) + '\n');
}

function runTarget([name, target]) {
  const args = [detectorPath, '--json', target];
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
  const prefix = path.join(outDir, name);
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const exitCode = result.status ?? 1;
  fs.writeFileSync(prefix + '.command.txt', `node ${args.map((arg) => JSON.stringify(arg)).join(' ')}\n`);
  fs.writeFileSync(prefix + '.stdout.json', stdout);
  fs.writeFileSync(prefix + '.stderr.txt', stderr);
  fs.writeFileSync(prefix + '.exit-code.txt', String(exitCode) + '\n');

  let parsed;
  let parseError = null;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    parseError = error instanceof Error ? error.message : String(error);
  }
  const findingCount = Array.isArray(parsed)
    ? parsed.length
    : Array.isArray(parsed?.findings) ? parsed.findings.length : null;
  return {
    name,
    target,
    command: `node ${args.map((arg) => JSON.stringify(arg)).join(' ')}`,
    exitCode,
    stdoutValidJson: parseError === null,
    parseError,
    resultShape: parseError !== null ? 'invalid' : Array.isArray(parsed) ? 'array' : typeof parsed,
    findingCount,
    stderrEmpty: stderr.trim() === '',
    spawnError: result.error?.message ?? null,
  };
}

const before = snapshot();
writeManifest('source-hashes-before-detector.json', before);
const results = targets.map(runTarget);
const after = snapshot();
const changed = Object.keys(before).filter((file) => before[file] !== after[file]);
writeManifest('source-hashes-after-detector.json', after, changed);
const summary = {
  complete: results.length === targets.length && results.every((result) => result.exitCode === 0
    && result.stdoutValidJson && result.stderrEmpty && result.findingCount !== null) && changed.length === 0,
  targetCount: targets.length,
  scannedCount: results.length,
  primaryFindingCount: results.reduce((total, result) => total + (result.findingCount ?? 0), 0),
  exitCodeCounts: results.reduce((counts, result) => {
    counts[result.exitCode] = (counts[result.exitCode] ?? 0) + 1;
    return counts;
  }, {}),
  changedDuringScan: changed,
  results,
};
fs.writeFileSync(path.join(outDir, 'detector-summary.json'), JSON.stringify(summary, null, 2) + '\n');
process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
if (!summary.complete) process.exitCode = 1;
