import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(outDir, '..', '..', '..', '..');
const skillRoot = 'C:/Users/Administrator/.codex/skills/impeccable';
const [name, target] = process.argv.slice(2);

if (!name || !target) {
  process.stderr.write('用法：node capture-detector.mjs <名称> <目标路径>\n');
  process.exit(64);
}

const detectorPath = path.join(skillRoot, 'scripts', 'detect.mjs');
const targetPath = path.resolve(repoRoot, target);
const args = [detectorPath, '--json', targetPath];
const displayCommand = `node "${detectorPath}" --json "${targetPath}"`;
const result = spawnSync(process.execPath, args, { cwd: repoRoot, encoding: null, maxBuffer: 32 * 1024 * 1024, windowsHide: true });
const stem = `detector-${name}`;
const stdout = result.stdout ?? Buffer.alloc(0);
const stderr = result.stderr ?? Buffer.alloc(0);
const stdoutText = stdout.toString('utf8').replace(/^\uFEFF/, '').trim();
let jsonParseable = false;
let findingsCount = null;
let findingsShape = null;

try {
  const parsed = JSON.parse(stdoutText);
  jsonParseable = true;
  findingsCount = Array.isArray(parsed) ? parsed.length : null;
  findingsShape = Array.isArray(parsed) ? 'array' : typeof parsed;
} catch {
  jsonParseable = false;
}

fs.writeFileSync(path.join(outDir, `${stem}.stdout.json`), stdout);
fs.writeFileSync(path.join(outDir, `${stem}.stderr.txt`), stderr);
fs.writeFileSync(path.join(outDir, `${stem}.command.txt`), `${displayCommand}\n`);
fs.writeFileSync(path.join(outDir, `${stem}.exit-code.txt`), `${result.status ?? 'null'}\n`);

const summary = {
  name,
  target: path.relative(repoRoot, targetPath).replaceAll(path.sep, '/'),
  command: displayCommand,
  exitCode: result.status,
  signal: result.signal,
  jsonParseable,
  findingsShape,
  findingsCount,
  validForZeroExitRequirement: result.status === 0 && jsonParseable,
  spawnError: result.error?.message ?? null,
  stderr: stderr.toString('utf8'),
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
