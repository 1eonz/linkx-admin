import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const root = process.cwd();
const runDir = path.join(root, '.impeccable/critique/wave1-lxpasswordinput-2026-10-05/assessment-b-independent-final/run-20261006');
const bundle = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detector/detect-antipatterns-browser.js';
const port = 8401;
const server = http.createServer((request, response) => {
  if (request.method !== 'GET' || request.url !== '/detect.js') {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(fs.readFileSync(bundle));
});

server.listen(port, '127.0.0.1', () => {
  fs.writeFileSync(path.join(runDir, 'overlay-server-start.json'), JSON.stringify({
    command: 'node overlay-server.mjs',
    endpoint: `http://127.0.0.1:${port}/detect.js`,
    pid: process.pid,
    startedAt: new Date().toISOString(),
    source: bundle,
  }, null, 2));
});

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  if (!chunk.includes('stop')) return;
  server.close(() => {
    fs.writeFileSync(path.join(runDir, 'overlay-server-stop.json'), JSON.stringify({
      command: 'stop request via stdin: stop',
      pid: process.pid,
      endedAt: new Date().toISOString(),
      exitCode: 0,
    }, null, 2));
    process.exitCode = 0;
  });
});
