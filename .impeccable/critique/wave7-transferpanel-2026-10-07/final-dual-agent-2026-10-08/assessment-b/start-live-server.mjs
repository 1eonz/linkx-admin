import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(outputDir, '../../../../../linkx-fe');
const serverScript = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs';
const args = [serverScript, '--background'];
const command = [process.execPath, ...args].map((part) => `"${part}"`).join(' ');
const result = spawnSync(process.execPath, args, { cwd: projectRoot, windowsHide: true, maxBuffer: 5 * 1024 * 1024 });
const stdout = result.stdout?.toString('utf8') || '';
const stderr = result.stderr?.toString('utf8') || '';
fs.writeFileSync(path.join(outputDir, 'live-server-start.command.txt'), `cwd: ${projectRoot}\n${command}\n`);
fs.writeFileSync(path.join(outputDir, 'live-server-start.stderr.txt'), stderr);
fs.writeFileSync(path.join(outputDir, 'live-server-start.exit-code.txt'), `${result.status ?? 'null'}${result.signal ? ` (${result.signal})` : ''}\n`);

let serverInfo = null;
let parseError = null;
try {
  serverInfo = JSON.parse(stdout.trim());
} catch (error) {
  parseError = error instanceof Error ? error.message : String(error);
}

const safeInfo = serverInfo ? {
  port: serverInfo.port,
  pid: serverInfo.pid,
  host: '127.0.0.1',
  detectorUrl: `http://127.0.0.1:${serverInfo.port}/detect.js`,
  controlToken: '[redacted; read from temporary live-server state only for stop]',
} : null;
fs.writeFileSync(path.join(outputDir, 'live-server-start.stdout.redacted.json'), JSON.stringify(safeInfo || { rawOutput: stdout, parseError }, null, 2));
fs.writeFileSync(path.join(outputDir, 'live-server-info.json'), JSON.stringify({
  started: result.status === 0 && !!serverInfo,
  exitCode: result.status,
  signal: result.signal,
  pid: serverInfo?.pid ?? null,
  port: serverInfo?.port ?? null,
  parseError,
  spawnError: result.error ? String(result.error) : null,
}, null, 2));

if (result.status !== 0 || !serverInfo?.port) process.exitCode = 1;
