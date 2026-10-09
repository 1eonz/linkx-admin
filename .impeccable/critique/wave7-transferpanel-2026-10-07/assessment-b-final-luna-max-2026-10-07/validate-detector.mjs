import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const reportDir = path.resolve('.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-final-luna-max-2026-10-07');
const stdout = readFileSync(path.join(reportDir, 'detector.stdout.json'), 'utf8');
const stderr = readFileSync(path.join(reportDir, 'detector.stderr.txt'), 'utf8');
const exitCode = Number(readFileSync(path.join(reportDir, 'detector.exit-code.txt'), 'utf8'));
let parsed;
let parseError = null;
try { parsed = JSON.parse(stdout); } catch (error) { parseError = error.message; }
const result = {
  command: readFileSync(path.join(reportDir, 'detector.command.txt'), 'utf8').trim(),
  jsonValid: parseError === null,
  parseError,
  jsonType: Array.isArray(parsed) ? 'array' : typeof parsed,
  findingCount: Array.isArray(parsed) ? parsed.length : null,
  stderrBytes: Buffer.byteLength(stderr),
  exitCode,
  resultInterpretation: '仅表示该文件的静态 detector 规则命中数；需结合浏览器 overlay 证据，不单独作为正式评审通过。',
};
writeFileSync(path.join(reportDir, 'detector-validation.json'), `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.jsonValid || exitCode !== 0 || stderr.length !== 0 || !Array.isArray(parsed)) process.exitCode = 1;
