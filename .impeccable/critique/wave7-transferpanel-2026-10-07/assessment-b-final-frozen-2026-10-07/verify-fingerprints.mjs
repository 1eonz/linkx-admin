import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(evidenceDir, '..', '..', '..', '..');
const phase = process.argv[2] ?? 'start';
const files = [
  ['linkx-fe/src/components/LxTransferPanel/index.vue', 'DC7BBDEE1CC810B78FF513B83D4A0BEDE3446E984DC14067B9393D177B8CCD85'],
  ['linkx-fe/src/components/LxTransferPanel/types.ts', '934FAAE2D2CA0DF8388BFABD1556E1B67CEB8E0AE930B0E43FB0B7FCC1054AA8'],
  ['linkx-fe/src/components/LxTransferPanel/demo/basic.vue', '2CEA4A141C6A608C09BFB144CFFBE5329E7E03F49113B2934B6844A8FA037D23'],
  ['linkx-fe/docs/components/lxtransferpanel.md', '690687345AEF23036238EED5DAA1FEE448EB5F21BC34576F4F2BB99E95470ED5'],
  ['other-admin/admin-vue3/tests/unit/lx-transfer-panel.test.ts', '09C153628E730DE873D6ED4FFB25C997122F408D598763E2D581F4B108D52ED5'],
  ['other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts', 'F630D6FE6D0B351172626BDA2FA6566A74548DC00148FF9E68284E3C3EAB3EA6'],
  ['design/虚拟滚动树 + 双栏穿梭/code.html', 'D523F7C5167DDAF3A3DA6BFDA68B9F29773CB4F89AE54A8DF7A413AABD853CEA'],
  ['linkx-fe/src/index.ts', '57E7A5854369B38C9AC68045FF8F1C78038218561517516BE0A7EB39BBC3229B'],
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
