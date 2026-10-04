const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const targets = [
  ['lxform-index', 'linkx-fe/src/components/LxForm/index.vue'],
  ['lxform-item', 'linkx-fe/src/components/LxForm/LxFormItem.vue'],
  ['lxdynamicform-index', 'linkx-fe/src/components/LxDynamicForm/index.vue'],
  ['lxdynamicform-fields', 'linkx-fe/src/components/LxDynamicForm/fields/'],
];
const results = targets.map(([name, target]) => {
  const stdout = fs.readFileSync(path.join(root, `${name}.stdout.json`));
  const stderr = fs.readFileSync(path.join(root, `${name}.stderr.txt`));
  const exitCode = Number(fs.readFileSync(path.join(root, `${name}.exit-code.txt`), 'utf8').trim());
  const parsed = JSON.parse(stdout.toString('utf8'));
  const count = Array.isArray(parsed) ? parsed.length : null;
  return {
    target,
    stdoutPath: `${name}.stdout.json`,
    stderrPath: `${name}.stderr.txt`,
    exitCodePath: `${name}.exit-code.txt`,
    exitCode,
    stdoutBytes: stdout.length,
    stderrBytes: stderr.length,
    jsonValid: true,
    jsonType: Array.isArray(parsed) ? 'array' : typeof parsed,
    findingCount: count,
    emptyResult: Array.isArray(parsed) && count === 0,
  };
});
const evidence = {
  command: 'node C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs --json <target>',
  results,
  interpretation: '空数组表示对应源码目标的静态规则零命中，不代表浏览器运行状态零问题，也不构成完整 Critique 通过。',
};
fs.writeFileSync(path.join(root, 'validation.json'), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
if (results.some((result) => result.exitCode !== 0 || result.stderrBytes !== 0 || !result.emptyResult)) process.exitCode = 1;
