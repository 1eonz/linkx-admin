import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const outputDir = path.resolve('F:/work/linkx-admin/.impeccable/critique/wave5-2026-09-30/screenshots')
fs.mkdirSync(outputDir, { recursive: true })

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'content-type': 'text/plain' })
    res.end('ok')
    return
  }
  if (req.method === 'POST' && req.url?.startsWith('/shot?name=')) {
    const name = decodeURIComponent(req.url.slice('/shot?name='.length)).replace(/[^a-zA-Z0-9._-]/g, '_')
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      const filePath = path.join(outputDir, name)
      fs.writeFileSync(filePath, Buffer.concat(chunks))
      res.writeHead(201, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ ok: true, path: filePath, bytes: fs.statSync(filePath).size }))
    })
    return
  }
  if (req.method === 'POST' && req.url?.startsWith('/json?name=')) {
    const name = decodeURIComponent(req.url.slice('/json?name='.length)).replace(/[^a-zA-Z0-9._-]/g, '_')
    const chunks = []
    req.setEncoding('utf8')
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      const filePath = path.join(outputDir, name)
      fs.writeFileSync(filePath, chunks.join(''), 'utf8')
      res.writeHead(201, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ ok: true, path: filePath, bytes: fs.statSync(filePath).size }))
    })
    return
  }
  res.writeHead(404)
  res.end()
})

server.listen(8502, '127.0.0.1', () => {
  console.log(JSON.stringify({ port: 8502, outputDir }))
})

const shutdown = () => server.close(() => process.exit(0))
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
