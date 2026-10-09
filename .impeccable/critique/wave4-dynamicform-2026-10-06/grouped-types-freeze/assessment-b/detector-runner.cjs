const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const assessmentDir = __dirname;
const repoRoot = path.resolve(assessmentDir, '../../../../../');
const freezePath = path.resolve(assessmentDir, '../source-hashes-freeze.json');
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs';
const freeze = JSON.parse(fs.readFileSync(freezePath, 'utf8'));
const frozenFiles = Object.keys(freeze.files);
const vueFiles = frozenFiles.filter(file => file.endsWith('.vue'));
const extensions = [...new Set(frozenFiles.map(file => path.extname(file) || '[no extension]'))].sort();
const results = [];

function collectFindingRecords(value, trail = [], records = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectFindingRecords(item, trail, records);
    return records;
  }
  if (!value || typeof value !== 'object') return records;
  const keys = Object.keys(value);
  const rule = value.rule || value.ruleId || value.id || value.type;
  const location = value.file || value.filePath || value.path || value.selector || value.location;
  if (rule && location) records.push({ rule: String(rule), location: String(location), trail: trail.join('.') });
  for (const [key, child] of Object.entries(value)) collectFindingRecords(child, [...trail, key], records);
  return records;
}

for (const relativePath of vueFiles) {
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
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    parseStatus = 'invalid-json';
    parseError = String(error.message || error);
  }
  const records = parseStatus === 'valid-json' ? collectFindingRecords(parsed) : [];
  const parsedSummary = parseStatus === 'valid-json'
    ? {
        rootType: Array.isArray(parsed) ? 'array' : typeof parsed,
        topLevelKeys: parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? Object.keys(parsed) : [],
        findingRecords: records,
        findingRecordCount: records.length,
      }
    : { error: parseError };
  const metadata = {
    source: relativePath,
    targetPath,
    startedAt,
    finishedAt: new Date().toISOString(),
    processExitCode: result.status,
    processSignal: result.signal,
    processError: result.error ? String(result.error.message || result.error) : null,
    parseStatus,
    parsedSummary,
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
  targetUrl: 'http://127.0.0.1:4174/components/lxdynamicform.html',
  freezePath: path.relative(repoRoot, freezePath),
  frozenFileCount: frozenFiles.length,
  extensionCounts: Object.fromEntries(extensions.map(extension => [extension, frozenFiles.filter(file => path.extname(file) === extension).length])),
  scannedCount: results.length,
  scannedVueFiles: results.map(result => result.source),
  detector: detectorPath,
  results,
};
fs.writeFileSync(path.join(assessmentDir, 'detector-summary.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');
process.stdout.write(JSON.stringify({ scannedCount: results.length, summaryPath: 'detector-summary.json' }) + '\n');
