import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(evidenceDir, '..', '..', '..', '..');
const phase = process.argv[2] ?? 'start';
const files = [
  ['linkx-fe/src/components/LxTransferPanel/index.vue', '677EB94E29E72E93C6319CFE5F1F06B2AF38942FF1B2616B680FBC4BDA66B96D'],
  ['linkx-fe/src/components/LxTransferPanel/types.ts', '934FAAE2D2CA0DF8388BFABD1556E1B67CEB8E0AE930B0E43FB0B7FCC1054AA8'],
  ['linkx-fe/src/components/LxTransferPanel/demo/basic.vue', '2CEA4A141C6A608C09BFB144CFFBE5329E7E03F49113B2934B6844A8FA037D23'],
  ['linkx-fe/docs/components/lxtransferpanel.md', 'C363101C88F882A17A1F32A528CD987FB98E25A3E4CA3567BC32E231853CEB2A'],
  ['other-admin/admin-vue3/tests/unit/lx-transfer-panel.test.ts', '09C153628E730DE873D6ED4FFB25C997122F408D598763E2D581F4B108D52ED5'],
  ['other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts', 'AAE0F49C3894179F01346A11D2B68014E074C2F935FBF6B4F9097528493C05F5'],
  ['design/虚拟滚动树 + 双栏穿梭/code.html', 'D523F7C5167DDAF3A3DA6BFDA68B9F29773CB4F89AE54A8DF7A413AABD853CEA'],
];

const results = files.map(([relativePath, expected]) => {
  const absolutePath = path.join(repoRoot, relativePath);
  const actual = fs.existsSync(absolutePath)
    ? createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex').toUpperCase()
    : null;
  return { path: relativePath, expected, actual, match: actual === expected };
});

const evidence = {
  phase,
  checkedAt: new Date().toISOString(),
  allMatch: results.every((result) => result.match),
  results,
};
const outputPath = path.join(evidenceDir, `fingerprints-${phase}.json`);
fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
if (!evidence.allMatch) process.exitCode = 2;
