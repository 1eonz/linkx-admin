import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(evidenceDir, '../../../..');
const liveInfoPath = path.join(projectRoot, '.impeccable', 'live', 'server.json');
const liveInfo = JSON.parse(fs.readFileSync(liveInfoPath, 'utf8'));
const injectionTemplate = fs.readFileSync(path.join(evidenceDir, 'overlay-injection.js'), 'utf8');
const injection = injectionTemplate.replace('__IMPECCABLE_TOKEN__', encodeURIComponent(liveInfo.token));
const upstream = { hostname: '127.0.0.1', port: 4195 };
const listenPort = 4194;

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url ?? '/', `http://127.0.0.1:${listenPort}`);

  if (requestUrl.pathname.startsWith('/__evidence/') && req.method === 'POST') {
    const name = path.basename(requestUrl.pathname);
    if (!/^[a-z0-9-]+\.png$/.test(name)) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'invalid_name' }));
      return;
    }

    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 20_000_000) req.destroy(new Error('screenshot_too_large'));
      else chunks.push(chunk);
    });
    req.on('end', () => {
      fs.writeFileSync(path.join(evidenceDir, name), Buffer.concat(chunks));
      res.writeHead(201, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, name, bytes: size }));
    });
    req.on('error', () => {
      if (!res.headersSent) res.writeHead(413);
      res.end();
    });
    return;
  }

  const proxyReq = http.request({
    ...upstream,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `${upstream.hostname}:${upstream.port}`, 'accept-encoding': 'identity' },
  }, (proxyRes) => {
    const responseHeaders = { ...proxyRes.headers };
    delete responseHeaders['content-length'];
    delete responseHeaders['content-encoding'];
    delete responseHeaders['transfer-encoding'];

    if (String(proxyRes.headers['content-type'] ?? '').includes('text/html')) {
      const chunks = [];
      proxyRes.on('data', (chunk) => chunks.push(chunk));
      proxyRes.on('end', () => {
        const html = Buffer.concat(chunks).toString('utf8');
        const scriptTag = `<script>${injection.replace(/<\/script/gi, '<\\/script')}</script>`;
        const output = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${scriptTag}</body>`) : `${html}${scriptTag}`;
        res.writeHead(proxyRes.statusCode ?? 200, {
          ...responseHeaders,
          'content-length': Buffer.byteLength(output),
        });
        res.end(output);
      });
    } else {
      res.writeHead(proxyRes.statusCode ?? 200, responseHeaders);
      proxyRes.pipe(res);
    }
  });

  proxyReq.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' });
    res.end('Local documentation proxy unavailable.');
  });
  req.pipe(proxyReq);
});

server.listen(listenPort, '127.0.0.1', () => {
  process.stdout.write(`Assessment B proxy listening on http://127.0.0.1:${listenPort}\n`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
