import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const outputDir = dirname(fileURLToPath(import.meta.url));
const detector = 'C:\\Users\\Administrator\\.codex\\skills\\impeccable\\scripts\\detect.mjs';
const targets = [
  ['component', 'linkx-fe/src/components/LxPasswordInput/index.vue'],
  ['demo', 'linkx-fe/src/components/LxPasswordInput/demo/basic.vue'],
  ['docs', 'linkx-fe/docs/components/lxpasswordinput.md'],
];

mkdirSync(outputDir, { recursive: true });

for (const [name, target] of targets) {
  const command = `node "${detector}" --json "${target}"`;
  const result = spawnSync(process.execPath, [detector, '--json', target], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  const prefix = resolve(outputDir, `detector-${name}`);

  writeFileSync(`${prefix}-command.txt`, `${command}\n`, 'utf8');
  writeFileSync(`${prefix}.stdout.json`, result.stdout ?? '', 'utf8');
  writeFileSync(`${prefix}.stderr.txt`, result.stderr ?? '', 'utf8');
  writeFileSync(`${prefix}.exit-code.txt`, `${result.status ?? 'null'}\n`, 'utf8');

  process.stdout.write(
    `${name}: exit=${result.status ?? 'null'}, stdout=${(result.stdout ?? '').length} chars, stderr=${(result.stderr ?? '').length} chars\n`,
  );
  if (result.error) {
    process.stderr.write(`${name}: ${result.error.message}\n`);
  }
}
