import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const serverPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs';
const startEvidence = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'overlay-server-start.json'), 'utf8'));
const args = [serverPath, 'stop', '--keep-inject'];
const command = `node "${serverPath}" stop --keep-inject`;
const result = spawnSync(process.execPath, args, {
  cwd: startEvidence.workingDirectory,
  encoding: 'utf8',
  windowsHide: true,
  timeout: 15000,
  maxBuffer: 1024 * 1024,
});
let healthAfter = null;
try {
  const response = await fetch(startEvidence.detectorUrl.replace(/\/detect\.js$/, '/health'), { signal: AbortSignal.timeout(3000) });
  healthAfter = { status: response.status, body: await response.text() };
} catch (error) {
  healthAfter = { connectionRefusedOrUnavailable: true, error: error.message };
}
const evidence = {
  command,
  workingDirectory: startEvidence.workingDirectory,
  exitCode: result.status,
  signal: result.signal,
  launchError: result.error?.message ?? null,
  stdout: result.stdout ?? '',
  stderr: result.stderr ?? '',
  healthAfter,
  stoppedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(evidenceDir, 'overlay-server-stop.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
if (result.status !== 0 || healthAfter.status === 200) process.exitCode = 2;
