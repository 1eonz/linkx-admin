import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outputDir = path.resolve(root, '.impeccable/critique/wave7-transferpanel-2026-10-07/final-dual-agent-2026-10-08/assessment-b');
const sourceRoot = path.resolve(root, 'linkx-fe');
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const targets = [
  ['transferpanel', path.join(sourceRoot, 'src/components/LxTransferPanel')],
  ['virtualtree', path.join(sourceRoot, 'src/components/LxVirtualTree')],
];

for (const [name, target] of targets) {
  const args = [detectorPath, '--json', target];
  const command = [process.execPath, ...args].map((part) => `"${part}"`).join(' ');
  const result = spawnSync(process.execPath, args, {
    cwd: sourceRoot,
    windowsHide: true,
    maxBuffer: 50 * 1024 * 1024,
  });
  const base = path.join(outputDir, `detector-${name}`);
  const stdout = result.stdout ?? Buffer.alloc(0);
  const stderr = result.stderr ?? Buffer.alloc(0);
  fs.writeFileSync(`${base}.stdout.json`, stdout);
  fs.writeFileSync(`${base}.stderr.txt`, stderr);
  fs.writeFileSync(`${base}.command.txt`, `cwd: ${sourceRoot}\n${command}\n`);
  fs.writeFileSync(`${base}.exit-code.txt`, `${result.status ?? 'null'}${result.signal ? ` (${result.signal})` : ''}\n`);

  let parsed;
  let parseError = null;
  try {
    parsed = JSON.parse(stdout.toString('utf8'));
  } catch (error) {
    parseError = error instanceof Error ? error.message : String(error);
  }
  const findings = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.findings)
      ? parsed.findings
      : Array.isArray(parsed?.results)
        ? parsed.results
        : null;
  fs.writeFileSync(`${base}.summary.json`, JSON.stringify({
    target,
    exitCode: result.status,
    signal: result.signal,
    jsonParsed: parseError === null,
    parseError,
    topLevelType: Array.isArray(parsed) ? 'array' : typeof parsed,
    topLevelKeys: parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? Object.keys(parsed) : [],
    findingCount: findings?.length ?? null,
    findings: findings?.map((finding) => ({
      rule: finding.rule ?? finding.ruleId ?? finding.id ?? finding.name ?? null,
      file: finding.file ?? finding.path ?? finding.location?.file ?? null,
      line: finding.line ?? finding.location?.line ?? null,
    })) ?? null,
    stderrByteCount: stderr.byteLength,
    stdoutByteCount: stdout.byteLength,
    spawnError: result.error ? String(result.error) : null,
  }, null, 2));
}
