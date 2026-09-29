import http from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const allowedPrefix = 'colform-assessment-b-final-';
const server = http.createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  if (request.method === 'OPTIONS') {
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.writeHead(204).end();
    return;
  }

  const name = new URL(request.url, 'http://127.0.0.1').pathname.slice('/upload/'.length);
  if (request.method !== 'POST' || !name.startsWith(allowedPrefix) || !name.endsWith('.png') || name.includes('/')) {
    response.writeHead(404).end('Not found');
    return;
  }

  try {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const base64 = Buffer.concat(chunks).toString('utf8');
    const png = Buffer.from(base64, 'base64');
    if (png.length < 8 || !png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      response.writeHead(400).end('Invalid PNG');
      return;
    }
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, name), png, { flag: 'wx' });
    response.writeHead(201, { 'Content-Type': 'text/plain' }).end(String(png.length));
  } catch (error) {
    response.writeHead(500).end(String(error));
  }
});

server.listen(8766, '127.0.0.1', () => process.stdout.write('SCREENSHOT_SERVER_READY 127.0.0.1:8766\n'));

process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
