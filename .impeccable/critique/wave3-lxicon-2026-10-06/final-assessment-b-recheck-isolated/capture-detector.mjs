import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.resolve(root, '.impeccable/critique/wave3-lxicon-2026-10-06/final-assessment-b-recheck-isolated');
const detector = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const targets = [
  path.resolve(root, 'linkx-fe/docs/components/lxicons.md'),
  path.resolve(root, 'linkx-fe/src/components/LxIcon/index.vue'),
];
const args = [detector, '--json', ...targets];
const command = [
  JSON.stringify(process.execPath),
  ...args.map((arg) => JSON.stringify(arg)),
].join(' ');
const result = spawnSync(process.execPath, args, {
  cwd: root,
  encoding: 'utf8',
  windowsHide: true,
  maxBuffer: 16 * 1024 * 1024,
});

fs.writeFileSync(path.join(outDir, 'detector.command.txt'), `${command}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'detector.stdout.json'), result.stdout ?? '', 'utf8');
fs.writeFileSync(path.join(outDir, 'detector.stderr.txt'), result.stderr ?? '', 'utf8');
fs.writeFileSync(
  path.join(outDir, 'detector.exit-code.txt'),
  `${result.status ?? 'null'}${result.signal ? ` (signal: ${result.signal})` : ''}${result.error ? ` (spawn error: ${result.error.message})` : ''}\n`,
  'utf8',
);

let findings = null;
let parseError = null;
try {
  findings = JSON.parse(result.stdout ?? '');
} catch (error) {
  parseError = error instanceof Error ? error.message : String(error);
}

const ruleCounts = {};
const locations = [];
if (Array.isArray(findings)) {
  for (const finding of findings) {
    const rule = finding.antipattern ?? finding.rule ?? 'unknown';
    ruleCounts[rule] = (ruleCounts[rule] ?? 0) + 1;
    locations.push({
      rule,
      file: finding.file ?? null,
      line: finding.line ?? null,
      advisory: Boolean(finding.advisory || finding.severity === 'advisory'),
      snippet: finding.snippet ?? null,
      description: finding.description ?? null,
    });
  }
}

fs.writeFileSync(
  path.join(outDir, 'detector-summary.json'),
  `${JSON.stringify({
    command,
    exitCode: result.status,
    signal: result.signal,
    spawnError: result.error?.message ?? null,
    jsonParsed: Array.isArray(findings),
    parseError,
    findingCount: Array.isArray(findings) ? findings.length : null,
    ruleCounts,
    locations,
  }, null, 2)}\n`,
  'utf8',
);

console.log(JSON.stringify({
  exitCode: result.status,
  signal: result.signal,
  parseError,
  findingCount: Array.isArray(findings) ? findings.length : null,
  ruleCounts,
  artifactDirectory: outDir,
}, null, 2));
