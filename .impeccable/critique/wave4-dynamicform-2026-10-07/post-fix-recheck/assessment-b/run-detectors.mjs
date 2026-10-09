import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = process.cwd();
const outputDir = path.dirname(fileURLToPath(import.meta.url));
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const targets = [
  ['vue-lxdynamicform', 'linkx-fe/src/components/LxDynamicForm/demo/basic.vue'],
  ['vue-lxupload', 'linkx-fe/src/components/LxUpload/demo/basic.vue'],
  ['vue-lxdatepicker', 'linkx-fe/src/components/LxDatePicker/demo/basic.vue'],
  ['markdown-lxdynamicform', 'linkx-fe/docs/components/lxdynamicform.md'],
  ['markdown-lxupload', 'linkx-fe/docs/components/lxupload.md'],
  ['markdown-lxdatepicker', 'linkx-fe/docs/components/lxdatepicker.md'],
];

const results = targets.map(([name, relativeTarget]) => {
  const target = path.resolve(repoRoot, relativeTarget);
  const command = `node "${detectorPath}" --json "${target}"`;
  const run = spawnSync('node', [detectorPath, '--json', target], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  const base = path.join(outputDir, `detector-${name}`);
  fs.writeFileSync(`${base}.command.txt`, `${command}\n`);
  fs.writeFileSync(`${base}.stdout.json`, run.stdout ?? '');
  fs.writeFileSync(`${base}.stderr.txt`, run.stderr ?? '');
  fs.writeFileSync(`${base}.exit-code.txt`, `${run.status ?? 'null'}\n`);

  let parsed = null;
  let parseError = null;
  try {
    parsed = JSON.parse(run.stdout ?? '');
  } catch (error) {
    parseError = error.message;
  }
  return {
    name,
    target: relativeTarget,
    command,
    exitCode: run.status,
    signal: run.signal,
    error: run.error?.message ?? null,
    stderr: run.stderr ?? '',
    stdoutJsonParsed: parsed !== null,
    parseError,
    result: parsed,
  };
});

const summaryPath = path.join(outputDir, 'detector-summary.json');
fs.writeFileSync(`${summaryPath}`, `${JSON.stringify(results, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(results.map((item) => ({
  name: item.name,
  target: item.target,
  exitCode: item.exitCode,
  signal: item.signal,
  error: item.error,
  stderrLength: item.stderr.length,
  stdoutJsonParsed: item.stdoutJsonParsed,
  resultType: Array.isArray(item.result) ? 'array' : typeof item.result,
  findingCount: Array.isArray(item.result) ? item.result.length : null,
})), null, 2)}\n`);
if (results.some((item) => item.exitCode !== 0 || !item.stdoutJsonParsed)) {
  process.exitCode = 2;
}
