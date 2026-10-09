#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const liveServer = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs';
const handlePath = path.join(evidenceDir, 'live-server.handle.json');
const commandName = process.argv[2];
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function write(name, value) {
  fs.writeFileSync(path.join(evidenceDir, name), value, 'utf8');
}

if (commandName === 'start') {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-wave7-transferpanel-live-'));
  const command = `node "${liveServer}" --background (cwd: ${tempRoot})`;
  const result = spawnSync(process.execPath, [liveServer, '--background'], {
    cwd: tempRoot,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  let rawInfo = null;
  try {
    rawInfo = JSON.parse((result.stdout ?? '').trim());
  } catch {
    rawInfo = null;
  }
  const safeInfo = rawInfo
    ? { pid: rawInfo.pid, port: rawInfo.port, host: '127.0.0.1' }
    : null;
  write('live-server.start.command.txt', `${command}\n`);
  write('live-server.start.stdout.json', `${JSON.stringify(safeInfo, null, 2)}\n`);
  write('live-server.start.stderr.txt', result.stderr ?? '');
  write('live-server.start.exit-code.txt', `${result.status ?? -1}\n`);

  let probe = { reachable: false, status: null };
  if (safeInfo?.port) {
    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        const response = await fetch(`http://127.0.0.1:${safeInfo.port}/detect.js`);
        probe = { reachable: response.ok, status: response.status };
        if (response.ok) break;
      } catch {
        // 后台子进程可能还需要一点时间监听端口。
      }
      await delay(100);
    }
  }
  const handle = { ...safeInfo, tempRoot };
  fs.writeFileSync(handlePath, `${JSON.stringify(handle, null, 2)}\n`, 'utf8');
  const startResult = { ...safeInfo, probe, started: result.status === 0 && probe.reachable };
  write('live-server.start.result.json', `${JSON.stringify(startResult, null, 2)}\n`);
  console.log(JSON.stringify(startResult));
  if (!startResult.started) process.exitCode = 1;
} else if (commandName === 'stop') {
  if (!fs.existsSync(handlePath)) throw new Error('No recorded Assessment B live-server handle.');
  const handle = JSON.parse(fs.readFileSync(handlePath, 'utf8'));
  const tempRoot = path.resolve(handle.tempRoot);
  const tempBase = path.resolve(os.tmpdir()) + path.sep;
  if (!tempRoot.startsWith(tempBase) || !path.basename(tempRoot).startsWith('codex-wave7-transferpanel-live-')) {
    throw new Error(`Refusing cleanup outside this run temp directory: ${tempRoot}`);
  }
  const command = `node "${liveServer}" stop --keep-inject (cwd: ${tempRoot})`;
  const result = spawnSync(process.execPath, [liveServer, 'stop', '--keep-inject'], {
    cwd: tempRoot,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  write('live-server.stop.command.txt', `${command}\n`);
  write('live-server.stop.stdout.txt', result.stdout ?? '');
  write('live-server.stop.stderr.txt', result.stderr ?? '');
  write('live-server.stop.exit-code.txt', `${result.status ?? -1}\n`);

  let portClosed = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      await fetch(`http://127.0.0.1:${handle.port}/detect.js`);
    } catch {
      portClosed = true;
      break;
    }
    await delay(100);
  }
  let tempStateRemoved = false;
  if (portClosed && result.status === 0) {
    fs.rmSync(tempRoot, { recursive: true, force: false });
    tempStateRemoved = !fs.existsSync(tempRoot);
  }
  const verification = {
    port: handle.port,
    pid: handle.pid,
    stopExitCode: result.status ?? null,
    portClosed,
    tempStateRemoved,
    userPreview4174Touched: false,
    existingVitePress4177Touched: false,
  };
  write('live-server.stop.verification.json', `${JSON.stringify(verification, null, 2)}\n`);
  console.log(JSON.stringify(verification));
  if (!portClosed || result.status !== 0 || !verification.tempStateRemoved) process.exitCode = 1;
} else {
  throw new Error('Usage: live-service-lifecycle.mjs start|stop');
}
