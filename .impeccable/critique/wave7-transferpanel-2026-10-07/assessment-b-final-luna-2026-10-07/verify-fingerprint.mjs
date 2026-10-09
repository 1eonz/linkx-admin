#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = process.cwd();
const aggregateExpected = 'B09D9EED0568C60EF0527B95B36187B28F91DF449D59E2B49CB22B601C14B3C5';
const expected = [
  ['linkx-fe/docs/components/lxtransferpanel.md', '6C31BCF9FE8BAE472824339EC93614AD5E422E63DD608AA2212134C4CFE14DB0'],
  ['linkx-fe/src/components/LxTransferPanel/demo/basic.vue', '7160C3AA30596456D9BAA62331F4CE532A8A9C5706B4E14ADA7F0CCBB8A39B41'],
  ['linkx-fe/src/components/LxTransferPanel/index.vue', '178A662D9C3D17E33DFCF4B7769ACA4171BF201DB0CAD02F4C77A36ED99DFD76'],
  ['linkx-fe/src/components/LxTransferPanel/types.ts', '61B999E7CB9AFE0DB8AD51461AD0C69B5CEF84D612AA28BBEE71B0FD0B86C198'],
  ['other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts', 'C32D8AE03550FFBDE39FF741879D990B8F297EEAE552C646EE7CBD82046EAFE7'],
  ['other-admin/admin-vue3/tests/unit/lx-transfer-panel.test.ts', '39510F935E00BF5A2F97BD23872A87C258DD4C6031C1CFB3631402AB85D1B251'],
];
const sha256 = (input) => crypto.createHash('sha256').update(input).digest('hex').toUpperCase();
const files = expected.map(([relativePath, expectedSha256]) => {
  const fullPath = path.resolve(repoRoot, relativePath);
  const actualSha256 = sha256(fs.readFileSync(fullPath));
  return { path: relativePath, expectedSha256, actualSha256, match: actualSha256 === expectedSha256 };
}).sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
const aggregateInput = Buffer.from(files.map(({ path: relativePath, actualSha256 }) => `${relativePath}:${actualSha256}`).join('\n'), 'utf8');
const aggregateActual = sha256(aggregateInput);
const result = {
  algorithm: 'Ordinal-sort relative paths; join path:uppercaseSha256 lines with LF and no trailing LF; SHA-256 UTF-8 bytes.',
  files,
  aggregateExpected,
  aggregateActual,
  aggregateMatch: aggregateActual === aggregateExpected,
  allFilesMatch: files.every((file) => file.match),
};
fs.writeFileSync(path.join(evidenceDir, 'source-fingerprint-check.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ aggregateActual, aggregateMatch: result.aggregateMatch, allFilesMatch: result.allFilesMatch }));
if (!result.aggregateMatch || !result.allFilesMatch) process.exitCode = 1;
