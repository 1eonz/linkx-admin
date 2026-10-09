import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = 'F:\\work\\linkx-admin';
const freezePath = path.join(root, '.impeccable', 'critique', 'wave4-dynamicform-2026-10-06', 'final-complete-freeze', 'source-hashes-freeze.json');
const outputDir = path.join(scriptDir, 'detector');
const rawDir = path.join(outputDir, 'raw');
const detector = 'C:\\Users\\Administrator\\.codex\\skills\\impeccable\\scripts\\detect.mjs';
const manifest = JSON.parse(fs.readFileSync(freezePath, 'utf8'));
const targets = Object.keys(manifest.files).filter((file) => path.extname(file).toLowerCase() === '.vue');
const records = [];

fs.mkdirSync(rawDir, { recursive: true });

for (const [index, relativePath] of targets.entries()) {
  const fullPath = path.join(root, relativePath);
  const safeName = relativePath.replace(/[\\/:*?"<>|]/g, '__');
  const prefix = `${String(index + 1).padStart(2, '0')}-${safeName}`;
  const stdoutName = `${prefix}.stdout.json`;
  const stderrName = `${prefix}.stderr.txt`;
  const args = [detector, '--json', fullPath];
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024,
  });
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  fs.writeFileSync(path.join(rawDir, stdoutName), stdout, 'utf8');
  fs.writeFileSync(path.join(rawDir, stderrName), stderr, 'utf8');

  let parsedJson = null;
  let parseError = null;
  try {
    parsedJson = JSON.parse(stdout);
  } catch (error) {
    parseError = String(error);
  }
  const findings = Array.isArray(parsedJson)
    ? parsedJson
    : Array.isArray(parsedJson?.findings)
      ? parsedJson.findings
      : parsedJson == null
        ? []
        : [parsedJson];
  const validJson = parseError === null;
  const record = {
    target: relativePath,
    command: `node "${detector}" --json "${fullPath}"`,
    argv: args,
    exitCode: result.status,
    signal: result.signal,
    spawnError: result.error ? String(result.error) : null,
    stdoutFile: `raw/${stdoutName}`,
    stderrFile: `raw/${stderrName}`,
    stdoutJsonParsed: validJson,
    parseError,
    stderr: stderr.trimEnd(),
    findingCount: findings.length,
    ruleNames: [...new Set(findings.map((finding) => finding?.antipattern ?? finding?.type ?? finding?.id).filter(Boolean))],
    findings,
  };
  records.push(record);
  fs.writeFileSync(path.join(outputDir, `${prefix}.result.json`), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  process.stdout.write(`[${index + 1}/${targets.length}] ${relativePath}: exit=${record.exitCode}; json=${validJson}; findings=${record.findingCount}\n`);
}

const summary = {
  createdAt: new Date().toISOString(),
  targetUrl: 'http://127.0.0.1:4174/components/lxdynamicform.html',
  freezeFile: 'source-hashes-freeze.json',
  freezeFileCount: manifest.fileCount,
  scannedExtension: '.vue',
  excludedFreezeExtensions: ['.md', '.ts', '.css'],
  detector,
  commandPattern: 'node "<detect.mjs>" --json "<frozen .vue file>"',
  targetCount: records.length,
  findingCount: records.reduce((sum, record) => sum + record.findingCount, 0),
  nonzeroExitCount: records.filter((record) => record.exitCode !== 0).length,
  invalidJsonCount: records.filter((record) => !record.stdoutJsonParsed).length,
  nonemptyStderrCount: records.filter((record) => Boolean(record.stderr)).length,
  targets: records,
};
fs.writeFileSync(path.join(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
process.stdout.write(`summary: targets=${summary.targetCount}; findings=${summary.findingCount}; nonzeroExit=${summary.nonzeroExitCount}; invalidJson=${summary.invalidJsonCount}; nonemptyStderr=${summary.nonemptyStderrCount}\n`);
