import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const evidenceDir = path.dirname(fileURLToPath(import.meta.url))
const debugPort = Number(process.argv[2])
const pageUrl = 'http://127.0.0.1:43620/components/lxtransferpanel'
const debugUrl = `http://127.0.0.1:${debugPort}`
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const writeJson = (name, value) =>
  fs.writeFileSync(path.join(evidenceDir, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8')

async function connect(url) {
  const socket = new WebSocket(url)
  const pending = new Map()
  let nextId = 0
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data))
    const wait = pending.get(message.id)
    if (!wait) return
    pending.delete(message.id)
    if (message.error) wait.reject(new Error(message.error.message))
    else wait.resolve(message.result || {})
  })
  return {
    call(method, params = {}) {
      const id = ++nextId
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject })
        socket.send(JSON.stringify({ id, method, params }))
      })
    },
    close() {
      socket.close()
    },
  }
}

async function evaluate(cdp, expression) {
  const result = await cdp.call('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
  return result.result?.value
}

const context = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'browser-context.json'), 'utf8'))
const browserInfo = await (await fetch(`${debugUrl}/json/version`)).json()
const browser = await connect(browserInfo.webSocketDebuggerUrl)
const targets = await (await fetch(`${debugUrl}/json/list`)).json()
const target = targets.find((item) => item.id === context.targetId)
if (!target?.webSocketDebuggerUrl) throw new Error('Isolated browser target is unavailable')
const page = await connect(target.webSocketDebuggerUrl)
await page.call('Page.enable')
await page.call('Runtime.enable')
await page.call('Emulation.setDeviceMetricsOverride', {
  width: 320,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
})
await page.call('Page.navigate', { url: pageUrl })

const deadline = Date.now() + 20000
while (Date.now() < deadline) {
  if (await evaluate(page, `document.readyState === 'complete' && !!document.querySelector('.transfer-panel-demo')`)) break
  await sleep(250)
}
await sleep(500)

const summary = await evaluate(
  page,
  `(() => {
    const root = document.documentElement;
    const metaViewport = document.querySelector('meta[name="viewport"]')?.content || null;
    const headings = [...document.querySelectorAll('.vp-doc h1,.vp-doc h2,.vp-doc h3,.vp-doc h4')];
    const tables = [...document.querySelectorAll('.vp-doc table')].map((table, index) => {
      const heading = headings
        .filter((item) => item.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING)
        .at(-1)?.innerText.replace(/[\u200B-\u200D\uFEFF]/g, '').trim() || null;
      return {
        index,
        heading,
        headers: [...table.querySelectorAll('thead th')].map((item) => item.innerText.trim()),
        clientWidth: table.clientWidth,
        scrollWidth: table.scrollWidth,
        overflowX: getComputedStyle(table).overflowX,
      };
    });
    const offenders = [...document.body.querySelectorAll('*')]
      .map((item) => {
        const rect = item.getBoundingClientRect();
        const style = getComputedStyle(item);
        return {
          tag: item.tagName,
          id: item.id || null,
          className: typeof item.className === 'string' ? item.className : '',
          text: item.innerText?.trim().replace(/\s+/g, ' ').slice(0, 72) || '',
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
          scrollWidth: item.scrollWidth,
          clientWidth: item.clientWidth,
          overflowX: style.overflowX,
          position: style.position,
          display: style.display,
          visibility: style.visibility,
        };
      })
      .filter((item) => item.width > 0 && item.right > root.clientWidth + 1 && item.display !== 'none' && item.visibility !== 'hidden')
      .sort((a, b) => b.right - a.right)
      .slice(0, 25);
    return {
      url: location.href,
      title: document.title,
      viewport: {
        innerWidth,
        innerHeight,
        visualWidth: visualViewport?.width ?? null,
        visualScale: visualViewport?.scale ?? null,
        metaViewport,
        documentClientWidth: root.clientWidth,
        documentScrollWidth: root.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
      },
      propsTable: tables.find((item) => item.heading === 'Props') || null,
      tables,
      overflowElements: offenders,
    };
  })()`,
)
const screenshot = await page.call('Page.captureScreenshot', {
  format: 'png',
  fromSurface: true,
  captureBeyondViewport: false,
})
fs.writeFileSync(path.join(evidenceDir, 'mobile-narrow-no-overlay.png'), Buffer.from(screenshot.data, 'base64'))
if (summary.propsTable) {
  await evaluate(page, `(() => {
    const table = [...document.querySelectorAll('.vp-doc table')][${summary.propsTable.index}];
    table.scrollIntoView({ block: 'start' });
    return true;
  })()`)
  await sleep(200)
  const propsScreenshot = await page.call('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  })
  fs.writeFileSync(path.join(evidenceDir, 'mobile-props-table-no-overlay.png'), Buffer.from(propsScreenshot.data, 'base64'))
}
writeJson('browser-narrow-probe.json', summary)
page.close()
browser.close()
process.stdout.write(`${JSON.stringify(summary.viewport)}\n`)
