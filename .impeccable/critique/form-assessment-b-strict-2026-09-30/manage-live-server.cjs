const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const skillScript = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs';
const action = process.argv[2];
if (!['start', 'stop'].includes(action)) throw new Error('Expected start or stop.');
const args = action === 'start' ? [skillScript, '--background'] : [skillScript, 'stop', '--keep-inject'];
const result = spawnSync(process.execPath, args, { cwd: process.cwd(), encoding: 'utf8', timeout: 20000 });
const evidence = {
  command: [process.execPath, ...args].join(' '),
  exitCode: result.status ?? (result.error ? 1 : null),
  signal: result.signal ?? null,
  stdout: result.stdout?.trim() ?? '',
  stderr: result.stderr?.trim() ?? '',
};
if (action === 'start' && evidence.stdout) {
  try {
    const server = JSON.parse(evidence.stdout);
    evidence.stdout = JSON.stringify({ pid: server.pid, port: server.port });
    evidence.serverPid = server.pid;
    evidence.serverPort = server.port;
    evidence.tokenSaved = false;
  } catch {
    evidence.stdout = '[non-JSON stdout omitted]';
  }
}
const file = path.join(__dirname, `live-server-${action}.json`);
fs.writeFileSync(file, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ file, ...evidence }, null, 2));
if (result.error) console.error(String(result.error));
process.exitCode = evidence.exitCode ?? 1;
