import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(outputDir, '../../../../');
const skillBase = 'C:/Users/Administrator/.codex/skills/impeccable';
const detector = path.join(skillBase, 'scripts/detect.mjs');
const targets = [
  { name: 'dynamicform', target: 'linkx-fe/src/components/LxDynamicForm', type: 'directory' },
  { name: 'lxupload', target: 'linkx-fe/src/components/LxUpload', type: 'directory' },
  { name: 'dynamicform-doc', target: 'linkx-fe/docs/components/lxdynamicform.md', type: 'file' },
  { name: 'lxupload-doc', target: 'linkx-fe/docs/components/lxupload.md', type: 'file' },
];

function listFiles(target) {
  const absolute = path.join(repoRoot, target);
  if (!existsSync(absolute)) throw new Error(`目标不存在: ${target}`);
  const stat = statSync(absolute);
  if (!stat.isDirectory()) return [target];
  const result = [];
  const visit = (relativeDir) => {
    for (const entry of readdirSync(path.join(repoRoot, relativeDir), { withFileTypes: true })) {
      const child = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) visit(child);
      else if (entry.isFile()) result.push(child);
    }
  };
  visit(target);
  return result.sort((a, b) => a.localeCompare(b));
}

import { statSync } from 'node:fs';

function snapshotHashes() {
  const files = targets.flatMap((item) => listFiles(item.target));
  return Object.fromEntries(files.map((relative) => {
    const bytes = readFileSync(path.join(repoRoot, relative));
    return [relative.replaceAll('\\', '/'), createHash('sha256').update(bytes).digest('hex')];
  }));
}

function saveSnapshot(filename) {
  const snapshot = {
    capturedAt: new Date().toISOString(),
    scope: targets.map(({ name, target }) => ({ name, target })),
    sha256: snapshotHashes(),
  };
  writeFileSync(path.join(outputDir, filename), `${JSON.stringify(snapshot, null, 2)}\n`);
  return snapshot;
}

function runDetector(item) {
  const absoluteTarget = path.join(repoRoot, item.target);
  const command = `node "${detector}" --json "${absoluteTarget}"`;
  const result = spawnSync(process.execPath, [detector, '--json', absoluteTarget], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  const prefix = path.join(outputDir, `detector-${item.name}`);
  writeFileSync(`${prefix}.command.txt`, `${command}\n`);
  writeFileSync(`${prefix}.stdout.json`, result.stdout ?? '');
  writeFileSync(`${prefix}.stderr.txt`, result.stderr ?? '');
  writeFileSync(`${prefix}.exit-code.txt`, `${result.status ?? 'null'}\n`);
  const record = {
    name: item.name,
    target: item.target,
    command,
    exitCode: result.status,
    signal: result.signal,
    error: result.error?.message ?? null,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
  return record;
}

mkdirSync(outputDir, { recursive: true });
const before = saveSnapshot('target-hashes-before.json');
const scans = targets.map(runDetector);
const after = saveSnapshot('target-hashes-after-detector.json');
const summary = {
  capturedAt: new Date().toISOString(),
  targets: scans.map((record) => ({
    ...record,
    parsedJson: (() => {
      try { return JSON.parse(record.stdout); } catch { return null; }
    })(),
  })),
  hashStability: {
    sameFileSet: Object.keys(before.sha256).sort().join('\n') === Object.keys(after.sha256).sort().join('\n'),
    changed: Object.keys(before.sha256).filter((file) => before.sha256[file] !== after.sha256[file]),
  },
};
writeFileSync(path.join(outputDir, 'detector-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({
  outputDir,
  filesHashed: Object.keys(before.sha256).length,
  detectorExitCodes: scans.map(({ name, exitCode }) => ({ name, exitCode })),
  changed: summary.hashStability.changed,
}, null, 2)}\n`);
