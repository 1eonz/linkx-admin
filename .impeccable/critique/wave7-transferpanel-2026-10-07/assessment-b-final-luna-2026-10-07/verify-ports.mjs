#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const relativeScript = path.relative(process.cwd(), fileURLToPath(import.meta.url)).replaceAll(path.sep, '/');
const command = `node "${relativeScript}"`;
const targets = [
  { name: 'user-preview-4174', url: 'http://127.0.0.1:4174/components/lxtransferpanel', expected: 'available' },
  { name: 'existing-vitepress-4177', url: 'http://127.0.0.1:4177/', expected: 'untouched-by-assessment' },
  { name: 'assessment-live-server-8400', url: 'http://127.0.0.1:8400/detect.js', expected: 'stopped' },
];
const results = [];
for (const target of targets) {
  try {
    const response = await fetch(target.url, { signal: AbortSignal.timeout(5000) });
    const content = await response.text();
    results.push({
      ...target,
      reachable: true,
      status: response.status,
      pageRootPresent: content.includes('id="app"'),
      title: content.match(/<title>(.*?)<\/title>/is)?.[1] ?? null,
    });
  } catch (error) {
    results.push({
      ...target,
      reachable: false,
      status: null,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
const checks = {
  userPreviewPreserved: results.find((result) => result.name === 'user-preview-4174')?.reachable === true,
  assessmentServerStopped: results.find((result) => result.name === 'assessment-live-server-8400')?.reachable === false,
};
const externalServiceObservation = {
  port: 4177,
  initiallyObservedListenerPid: 24920,
  finalReachable: results.find((result) => result.name === 'existing-vitepress-4177')?.reachable === true,
  assessmentInvokedStartOrStop: false,
};
const record = { command, results, checks, externalServiceObservation, allChecksPass: Object.values(checks).every(Boolean) };
fs.writeFileSync(path.join(evidenceDir, 'ports-after-stop.json'), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(evidenceDir, 'ports-after-stop.command.txt'), `${command}\n`, 'utf8');
console.log(JSON.stringify({ checks, allChecksPass: record.allChecksPass }));
if (!record.allChecksPass) process.exitCode = 1;
