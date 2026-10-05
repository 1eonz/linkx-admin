import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const port = Number(process.env.LX_DETECTOR_PORT || 4178)
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detector/detect-antipatterns-browser.js'
const detector = await readFile(detectorPath, 'utf8')

const server = createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('ok')
    return
  }

  if (request.url !== '/detect.js') {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('not found')
    return
  }

  response.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/javascript; charset=utf-8',
  })
  response.end(detector)
})

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Detector resource service listening on http://127.0.0.1:${port}\n`)
})

function stop() {
  server.close(() => process.exit(0))
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
