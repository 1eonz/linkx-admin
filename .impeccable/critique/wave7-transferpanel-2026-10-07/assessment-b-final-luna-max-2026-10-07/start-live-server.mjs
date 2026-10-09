import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const reportDir = path.resolve('.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-final-luna-max-2026-10-07');
const serverRoot = path.join(os.tmpdir(), `codex-wave7-transferpanel-assessment-b-final-${randomUUID()}`);
const script = 'C:\\Users\\Administrator\\.codex\\skills\\impeccable\\scripts\\live-server.mjs';
mkdirSync(serverRoot, { recursive: true });

const result = spawnSync(process.execPath, [script, '--background', '--port=8512'], {
  cwd: serverRoot,
  encoding: 'utf8',
  windowsHide: true,
});

let summary = null;
let exitCode = result.status ?? 1;
if (exitCode === 0) {
  try {
    const info = JSON.parse(result.stdout.trim());
    summary = {
      serverRoot,
      port: info.port,
      pid: info.pid,
      url: `http://127.0.0.1:${info.port}`,
      token: 'redacted',
      started: true,
    };
  } catch (error) {
    exitCode = 3;
    result.stderr = `${result.stderr || ''}Unable to parse live-server launcher output: ${error.message}\n`;
  }
}

writeFileSync(path.join(reportDir, 'live-server-root.txt'), serverRoot);
writeFileSync(path.join(reportDir, 'live-server-start.stdout.json'), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(path.join(reportDir, 'live-server-start.stderr.txt'), result.stderr || '');
writeFileSync(path.join(reportDir, 'live-server-start.exit-code.txt'), String(exitCode));
process.stdout.write(`${JSON.stringify({ summary, stderr: result.stderr || '', exitCode }, null, 2)}\n`);
process.exitCode = exitCode;
