import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const outDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(outDir, '..', '..', '..', '..');
const expected = [
  ['linkx-fe/src/components/LxTransferPanel/index.vue', '62CF72427C198510CED0DB78CF1B8E1A5134D24D992CC782FA7D70CAB808B01C'],
  ['linkx-fe/src/components/LxTransferPanel/types.ts', '084DCC00F96E05089A280293321919C82BB615E8D0AF81E297895677658FABEE'],
  ['linkx-fe/src/components/LxTransferPanel/demo/basic.vue', '51DBE7D25AE7961BA188CB213DFB90F606F2ED3FD4A046DFCCDBBCC723866161'],
  ['linkx-fe/src/components/LxVirtualTree/index.vue', 'F64C13326CECCF28BC1F47791F73861745F87911B910A32B5AF2780B72095E54'],
  ['linkx-fe/src/components/LxVirtualTree/types.ts', 'A58EB2EAC624780EF2C7F68831227BAAE19AFBB0FEAE5433CE215D821CD646B2'],
  ['linkx-fe/src/components/LxVirtualTree/demo/basic.vue', '04A97D62CCD7B5F571095483949B5C611D2CF65E6BE6BB2DEAC3F3974AE0B923'],
  ['linkx-fe/docs/components/lxtransferpanel.md', 'D9A2588D62F2932DF89CFFED41327EBFF6D2074BA64C73AAB724D590ACB1FE42'],
  ['linkx-fe/docs/components/lxvirtualtree.md', 'B9DEB7A855CF737B434DC7AD0A6C0727589D3632E69F68222591DCCB2F67F7B3'],
  ['other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts', '9AE74B3B1FA09A07C845405DC80FF09EEF78D7FCD19F8CF847ACB5ED4C0FE1BC'],
];

const results = expected.map(([relativePath, expectedSha256]) => {
  const filePath = path.join(repoRoot, relativePath);
  const actualSha256 = fs.existsSync(filePath)
    ? createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').toUpperCase()
    : null;
  return {
    path: relativePath,
    expectedSha256,
    actualSha256,
    matches: actualSha256 === expectedSha256,
  };
});

const report = {
  checkedAt: new Date().toISOString(),
  repoRoot,
  results,
  allMatch: results.every((result) => result.matches),
};
fs.writeFileSync(path.join(outDir, 'hash-verification.json'), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
