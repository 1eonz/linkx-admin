import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] || 4175);
const maxBytes = 12 * 1024 * 1024;

http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'content-type': 'text/plain' }).end('ok');
    return;
  }

  const match = /^\/([a-z0-9][a-z0-9.-]*\.png)$/i.exec(req.url || '');
  if (req.method !== 'PUT' || !match || req.headers['content-type'] !== 'image/png') {
    res.writeHead(404).end();
    return;
  }

  let bytes = 0;
  req.on('data', (chunk) => {
    bytes += chunk.length;
    if (bytes > maxBytes) req.destroy(new Error('PNG exceeds size limit'));
  });
  req.on('error', () => {
    if (!res.headersSent) res.writeHead(413).end('PNG too large or incomplete');
  });
  const output = fs.createWriteStream(path.join(root, match[1]), { flags: 'wx' });
  req.pipe(output);
  output.on('finish', () => res.writeHead(201).end(String(bytes)));
  output.on('error', () => {
    if (!res.headersSent) res.writeHead(500).end('Could not save PNG');
  });
}).listen(port, '127.0.0.1');
