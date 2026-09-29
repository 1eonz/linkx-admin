import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const server = http.createServer(async (request, response) => {
  if (request.method !== 'POST') {
    response.writeHead(405).end();
    return;
  }
  const name = new URL(request.url || '/', 'http://127.0.0.1').searchParams.get('name') || '';
  if (!/^[a-z0-9-]+\.(png|json)$/.test(name)) {
    response.writeHead(400).end('Invalid evidence name');
    return;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 20 * 1024 * 1024) {
      response.writeHead(413).end('Evidence too large');
      return;
    }
    chunks.push(chunk);
  }
  await fs.writeFile(path.join(directory, name), Buffer.concat(chunks));
  response.writeHead(201, { 'content-type': 'text/plain' }).end(String(size));
});

server.listen(30942, '127.0.0.1', () => console.log(`evidence receiver pid=${process.pid} port=30942 directory=${directory}`));

process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
