import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = 'F:/work/linkx-admin';
const outputDir = path.join(root, '.impeccable/critique/wave7-transferpanel-2026-10-07/this-turn-final-luna/assessment-b/detector');
const detector = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const targets = [
  ['virtualtree-index', 'linkx-fe/src/components/LxVirtualTree/index.vue'],
  ['virtualtree-basic', 'linkx-fe/src/components/LxVirtualTree/demo/basic.vue'],
  ['virtualtree-doc', 'linkx-fe/docs/components/lxvirtualtree.md'],
  ['transferpanel-index', 'linkx-fe/src/components/LxTransferPanel/index.vue'],
  ['transferpanel-basic', 'linkx-fe/src/components/LxTransferPanel/demo/basic.vue'],
  ['transferpanel-doc', 'linkx-fe/docs/components/lxtransferpanel.md'],
];

function runNode(args) {
  return new Promise((resolve) => {
    const child = spawn('node', args, { cwd: root, windowsHide: true });
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', (error) => resolve({ stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr), error }));
    child.on('close', (code, signal) => resolve({ stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr), code, signal }));
  });
}

const results = [];
for (const [name, target] of targets) {
  const base = path.join(outputDir, name);
  const command = `node "${detector}" --json "${target}"`;
  fs.writeFileSync(`${base}.command.txt`, `cwd: ${root}\n${command}\n`, 'utf8');

  const result = await runNode([detector, '--json', target]);
  fs.writeFileSync(`${base}.stdout.json`, result.stdout);
  fs.writeFileSync(`${base}.stderr.txt`, result.stderr);
  fs.writeFileSync(`${base}.exit-code.txt`, result.code === undefined ? 'null\n' : `${result.code}\n`, 'utf8');

  let validation;
  try {
    const parsed = JSON.parse(result.stdout.toString('utf8'));
    const findings = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.findings) ? parsed.findings : null;
    validation = {
      validJson: true,
      topLevelType: Array.isArray(parsed) ? 'array' : typeof parsed,
      findingCount: findings?.length ?? null,
      findingRules: findings?.map((finding) => finding?.rule || finding?.ruleId || finding?.id || null) ?? null,
      stderrBytes: result.stderr.length,
      exitCode: result.code ?? null,
      signal: result.signal ?? null,
      spawnError: result.error?.message ?? null,
    };
  } catch (error) {
    validation = {
      validJson: false,
      parseError: error.message,
      stdoutBytes: result.stdout.length,
      stderrBytes: result.stderr.length,
      exitCode: result.code ?? null,
      signal: result.signal ?? null,
      spawnError: result.error?.message ?? null,
    };
  }

  fs.writeFileSync(`${base}.json-validation.json`, `${JSON.stringify(validation, null, 2)}\n`, 'utf8');
  results.push({ name, target, ...validation });
}

fs.writeFileSync(path.join(outputDir, 'summary.json'), `${JSON.stringify(results, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
