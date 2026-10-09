import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const serverPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs';
const port = 8491;
const serverCwd = path.join(os.tmpdir(), `codex-impeccable-wave7-transferpanel-${Date.now()}-${process.pid}`);
fs.mkdirSync(serverCwd, { recursive: true });

const args = [serverPath, '--background', `--port=${port}`];
const command = `node "${serverPath}" --background --port=${port}`;
const result = spawnSync(process.execPath, args, {
  cwd: serverCwd,
  encoding: 'utf8',
  windowsHide: true,
  timeout: 30000,
  maxBuffer: 1024 * 1024,
});
const redact = (value) => String(value ?? '')
  .replace(/("token"\s*:\s*")[^"]+("\s*)/gi, '$1[REDACTED]$2')
  .replace(/(\bToken:\s*)\S+/g, '$1[REDACTED]');
let health = null;
if (result.status === 0) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(5000) });
    health = { status: response.status, body: await response.json() };
  } catch (error) {
    health = { error: error.message };
  }
}

const evidence = {
  command,
  workingDirectory: serverCwd,
  exitCode: result.status,
  signal: result.signal,
  launchError: result.error?.message ?? null,
  stdout: redact(result.stdout),
  stderr: redact(result.stderr),
  health,
  detectorUrl: `http://127.0.0.1:${port}/detect.js`,
  startedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(evidenceDir, 'overlay-server-start.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ command, workingDirectory: serverCwd, exitCode: evidence.exitCode, health, detectorUrl: evidence.detectorUrl }, null, 2)}\n`);
if (result.status !== 0 || health?.status !== 200) process.exitCode = 2;
