import { createServer } from 'node:http';
import { createWriteStream, mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const screenshots = join(root, 'screenshots');
mkdirSync(screenshots, { recursive: true });

const server = createServer((request, response) => {
  const name = basename(new URL(request.url, 'http://127.0.0.1').pathname);
  if (request.method !== 'POST' || !/^[a-z0-9-]+\.png$/.test(name)) {
    response.writeHead(404).end('not found');
    return;
  }

  const file = createWriteStream(join(screenshots, name));
  let bytes = 0;
  request.on('data', (chunk) => {
    bytes += chunk.length;
    if (bytes > 5_000_000) request.destroy(new Error('capture too large'));
  });
  request.pipe(file);
  file.on('finish', () => response.writeHead(201, { 'content-type': 'text/plain' }).end(`${name} ${bytes}`));
  file.on('error', () => response.writeHead(500).end('write failed'));
});

server.listen(4175, '127.0.0.1', () => {
  process.stdout.write(`capture receiver listening on 127.0.0.1:4175 (pid ${process.pid})\n`);
});
