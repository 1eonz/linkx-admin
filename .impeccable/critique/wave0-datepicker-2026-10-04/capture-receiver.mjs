import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const server = http.createServer((request, response) => {
  const filename = new URL(request.url, 'http://127.0.0.1').pathname.slice(1);
  if (request.method !== 'POST' || !/^[a-z0-9-]+\.(?:png|jpg)$/.test(filename)) {
    response.writeHead(404).end();
    return;
  }

  const chunks = [];
  let size = 0;
  request.on('data', (chunk) => {
    size += chunk.length;
    if (size > 15 * 1024 * 1024) {
      response.writeHead(413).end();
      request.destroy();
      return;
    }
    chunks.push(chunk);
  });
  request.on('end', () => {
    const image = Buffer.concat(chunks);
    const png = image.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
    const jpeg = image.subarray(0, 3).toString('hex') === 'ffd8ff';
    if (!png && !jpeg) {
      response.writeHead(415).end();
      return;
    }
    fs.writeFileSync(path.join(outputDir, filename), image);
    response.writeHead(201, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ filename, bytes: image.length }));
  });
});

server.listen(8500, '127.0.0.1', () => process.stdout.write('capture receiver listening on 127.0.0.1:8500\n'));
