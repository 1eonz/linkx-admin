import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const items = [
  ['linkx-fe/src/components/LxTransferPanel/index.vue', '269C91FDF0D6A7812BA6D03C3D5BDEB6B5CB9DED100E560E161C36A8486D544B'],
  ['linkx-fe/src/components/LxTransferPanel/types.ts', '52F961503BBAE51F9DC671A34FF5DBD335C086DB3DE3DE4D4BD1D59A830C99C0'],
  ['linkx-fe/src/components/LxTransferPanel/demo/basic.vue', '644B23CF4173AF7984444546703F97550F010B4EF6CA379FA97423DBE12042E2'],
  ['linkx-fe/docs/components/lxtransferpanel.md', 'CCB7A689DD0CA85FB8A82ACBB516A4EABFC06E5B3B96BC8F47E9B344ED3DAC53'],
  ['design/虚拟滚动树 + 双栏穿梭/code.html', 'D523F7C5167DDAF3A3DA6BFDA68B9F29773CB4F89AE54A8DF7A413AABD853CEA'],
  ['other-admin/admin-vue3/tests/unit/lx-transfer-panel.test.ts', '14E080AA1D60E3CCC7FD64AA880B31A3FBA06A8DF5181E581435C3403DFF8674'],
  ['other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts', 'C987D12BB9F727945384C81A7BACD3368D809E95B91ED95B9339E59D62FB61BC7'],
];

const results = items.map(([path, expected]) => {
  const actual = createHash('sha256').update(readFileSync(path)).digest('hex').toUpperCase();
  return {
    path,
    expected,
    expectedLength: expected.length,
    actual,
    actualLength: actual.length,
    match: actual === expected,
  };
});

process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
process.exitCode = results.some(({ match }) => !match) ? 2 : 0;
