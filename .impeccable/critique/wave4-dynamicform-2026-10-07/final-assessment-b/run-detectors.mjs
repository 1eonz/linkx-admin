import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(evidenceDir, '../../../../');
const detector = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const targets = [
  { name: 'lxdynamicform-component', target: 'linkx-fe/src/components/LxDynamicForm' },
  { name: 'lxdynamicform-doc', target: 'linkx-fe/docs/components/lxdynamicform.md' },
  { name: 'lxupload-component', target: 'linkx-fe/src/components/LxUpload' },
  { name: 'lxupload-doc', target: 'linkx-fe/docs/components/lxupload.md' },
  { name: 'lxdatepicker-component', target: 'linkx-fe/src/components/LxDatePicker' },
  { name: 'lxdatepicker-doc', target: 'linkx-fe/docs/components/lxdatepicker.md' },
];

function filesUnder(targetPath) {
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) return [targetPath];
  return fs.readdirSync(targetPath, { withFileTypes: true })
    .flatMap((entry) => {
      const absolute = path.join(targetPath, entry.name);
      if (entry.isDirectory()) return filesUnder(absolute);
      return entry.isFile() ? [absolute] : [];
    })
    .sort();
}

function snapshot(targetPath) {
  const files = filesUnder(targetPath).map((absolute) => {
    const relative = path.relative(repoRoot, absolute).split(path.sep).join('/');
    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
    return { path: relative, sha256 };
  });
  const sha256 = crypto.createHash('sha256');
  for (const file of files) sha256.update(`${file.path}\0${file.sha256}\n`);
  return { targetPath: path.relative(repoRoot, targetPath).split(path.sep).join('/'), fileCount: files.length, sha256: sha256.digest('hex'), files };
}

function writeJson(name, value) {
  fs.writeFileSync(path.join(evidenceDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

const results = [];
for (const entry of targets) {
  const absoluteTarget = path.resolve(repoRoot, entry.target);
  const outputStem = entry.name;
  const command = `node "${detector}" --json "${entry.target}"`;
  if (!fs.existsSync(absoluteTarget)) {
    const result = { ...entry, command, accessible: false, status: 'fail', reason: 'target not accessible' };
    fs.writeFileSync(path.join(evidenceDir, `${outputStem}.command.txt`), `${command}\n`);
    fs.writeFileSync(path.join(evidenceDir, `${outputStem}.stdout.json`), '');
    fs.writeFileSync(path.join(evidenceDir, `${outputStem}.stderr.txt`), 'target not accessible\n');
    fs.writeFileSync(path.join(evidenceDir, `${outputStem}.exit-code.txt`), 'not-run\n');
    writeJson(`${outputStem}.hashes.json`, { before: null, after: null, unchanged: false });
    writeJson(`${outputStem}.validation.json`, result);
    results.push(result);
    continue;
  }

  const before = snapshot(absoluteTarget);
  fs.writeFileSync(path.join(evidenceDir, `${outputStem}.command.txt`), `${command}\n`);
  const startedAt = new Date().toISOString();
  const child = spawnSync('node', [detector, '--json', entry.target], { cwd: repoRoot, encoding: null, windowsHide: true });
  const finishedAt = new Date().toISOString();
  const stdout = child.stdout ?? Buffer.alloc(0);
  const stderr = child.stderr ?? Buffer.alloc(0);
  fs.writeFileSync(path.join(evidenceDir, `${outputStem}.stdout.json`), stdout);
  fs.writeFileSync(path.join(evidenceDir, `${outputStem}.stderr.txt`), stderr);
  fs.writeFileSync(path.join(evidenceDir, `${outputStem}.exit-code.txt`), `${child.status ?? 'null'}\n`);
  const after = snapshot(absoluteTarget);
  writeJson(`${outputStem}.hashes.json`, { before, after, unchanged: before.sha256 === after.sha256 });

  const stdoutText = stdout.toString('utf8').replace(/^\uFEFF/, '').trim();
  const stderrText = stderr.toString('utf8');
  let parsedJson = null;
  let jsonValid = false;
  let jsonError = null;
  try {
    parsedJson = JSON.parse(stdoutText);
    jsonValid = true;
  } catch (error) {
    jsonError = String(error);
  }
  const zeroHits = Array.isArray(parsedJson) && parsedJson.length === 0;
  const stderrError = /\b(error|failed|failure|exception|cannot|unable|ENOENT|MODULE_NOT_FOUND)\b/i.test(stderrText);
  const reasons = [];
  if (child.error) reasons.push(`spawn error: ${child.error.message}`);
  if (child.status !== 0) reasons.push(`non-zero exit code: ${child.status}`);
  if (!jsonValid) reasons.push(`invalid JSON: ${jsonError}`);
  if (stderrError) reasons.push('stderr contains error text');
  if (!before.fileCount) reasons.push('target contains no scannable files');
  const result = {
    ...entry,
    command,
    accessible: true,
    startedAt,
    finishedAt,
    exitCode: child.status,
    spawnError: child.error?.message ?? null,
    jsonValid,
    jsonTopLevel: Array.isArray(parsedJson) ? 'array' : typeof parsedJson,
    zeroHits,
    findingCount: Array.isArray(parsedJson) ? parsedJson.length : null,
    stderrNonEmpty: stderr.length > 0,
    stderrError,
    hashesUnchanged: before.sha256 === after.sha256,
    status: reasons.length ? 'fail' : zeroHits ? 'static-zero-hit' : 'scan-complete-with-output',
    reasons,
  };
  writeJson(`${outputStem}.validation.json`, result);
  results.push(result);
}

writeJson('detector-run-summary.json', results);
process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
