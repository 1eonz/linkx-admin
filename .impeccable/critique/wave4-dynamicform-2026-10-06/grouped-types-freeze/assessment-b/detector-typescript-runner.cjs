const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const assessmentDir = __dirname;
const repoRoot = path.resolve(assessmentDir, '../../../../../');
const freezePath = path.resolve(assessmentDir, '../source-hashes-freeze.json');
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const freeze = JSON.parse(fs.readFileSync(freezePath, 'utf8'));
const tsFiles = Object.keys(freeze.files).filter(file => file.endsWith('.ts'));
const results = [];

for (const relativePath of tsFiles) {
  const targetPath = path.resolve(repoRoot, relativePath);
  const outputKey = relativePath.replace(/[\\/]+/g, '--').replace(/[^a-zA-Z0-9._-]/g, '_');
  const outputDir = path.join(assessmentDir, 'detector-results', outputKey);
  fs.mkdirSync(outputDir, { recursive: true });
  const startedAt = new Date().toISOString();
  const result = spawnSync(process.execPath, [detectorPath, '--json', targetPath], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    windowsHide: true,
  });
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  fs.writeFileSync(path.join(outputDir, 'stdout.json'), stdout, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'stderr.txt'), stderr, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'exit-code.txt'), result.status === null ? 'null\n' : `${result.status}\n`, 'utf8');
  let parsed;
  let parseStatus = 'valid-json';
  let parseError = null;
  try { parsed = JSON.parse(stdout); }
  catch (error) { parseStatus = 'invalid-json'; parseError = String(error.message || error); }
  const topLevelArrayCount = parseStatus === 'valid-json' && Array.isArray(parsed) ? parsed.length : null;
  const metadata = {
    source: relativePath,
    targetPath,
    startedAt,
    finishedAt: new Date().toISOString(),
    processExitCode: result.status,
    processSignal: result.signal,
    processError: result.error ? String(result.error.message || result.error) : null,
    parseStatus,
    parsedSummary: parseStatus === 'valid-json'
      ? { rootType: Array.isArray(parsed) ? 'array' : typeof parsed, topLevelKeys: parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? Object.keys(parsed) : [], topLevelArrayCount }
      : { error: parseError },
    evidence: {
      stdout: path.relative(assessmentDir, path.join(outputDir, 'stdout.json')),
      stderr: path.relative(assessmentDir, path.join(outputDir, 'stderr.txt')),
      exitCode: path.relative(assessmentDir, path.join(outputDir, 'exit-code.txt')),
    },
  };
  fs.writeFileSync(path.join(outputDir, 'parse-status.json'), JSON.stringify(metadata, null, 2) + '\n', 'utf8');
  results.push(metadata);
}

const summary = {
  capturedAt: new Date().toISOString(),
  frozenFileCount: freeze.fileCount,
  scannedCount: results.length,
  scannedTypeScriptFiles: results.map(result => result.source),
  detector: detectorPath,
  results,
};
fs.writeFileSync(path.join(assessmentDir, 'typescript-detector-summary.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');
process.stdout.write(JSON.stringify({ scannedCount: results.length, summaryPath: 'typescript-detector-summary.json' }) + '\n');
