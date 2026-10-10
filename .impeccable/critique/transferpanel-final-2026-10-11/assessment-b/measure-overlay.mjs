import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const evidenceDir = path.dirname(fileURLToPath(import.meta.url))
const debugPort = Number(process.argv[2])
const livePort = Number(process.argv[3])
const debugUrl = `http://127.0.0.1:${debugPort}`
const pageUrl = 'http://127.0.0.1:43620/components/lxtransferpanel'
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

async function evaluate(cdp, expression, options = {}) {
  const response = await cdp.call('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
    ...options,
  })
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text)
  return response.result?.value
}

const context = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'browser-context.json'), 'utf8'))
const version = await (await fetch(`${debugUrl}/json/version`)).json()
const browser = await connect(version.webSocketDebuggerUrl)
const targets = await (await fetch(`${debugUrl}/json/list`)).json()
const target = targets.find((item) => item.id === context.targetId)
if (!target?.webSocketDebuggerUrl) throw new Error('Isolated browser target is unavailable')
const page = await connect(target.webSocketDebuggerUrl)
await page.call('Page.enable')
await page.call('Runtime.enable')
await page.call('Emulation.setDeviceMetricsOverride', {
  width: 1280,
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
await sleep(300)

const measure = () =>
  evaluate(
    page,
    `(() => {
      const selectors = {
        documentElement: document.documentElement,
        body: document.body,
        app: document.querySelector('#app'),
        doc: document.querySelector('.vp-doc'),
        demo: document.querySelector('.transfer-panel-demo'),
        preview: document.querySelector('.transfer-panel-demo__preview'),
        component: document.querySelector('.lx-transfer-panel'),
      };
      const box = (element) => {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName,
          id: element.id || null,
          className: typeof element.className === 'string' ? element.className : '',
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height },
          overflowX: style.overflowX,
          position: style.position,
          zIndex: style.zIndex,
        };
      };
      const locatorMatches = [...document.querySelectorAll('[id*="impeccable" i],[class*="impeccable" i],[data-impeccable],[data-impeccable-rule],[data-rule]')]
        .map((element) => ({ ...box(element), text: element.innerText?.trim().replace(/\s+/g, ' ').slice(0, 120) || '' }));
      const fixedLayers = [...document.querySelectorAll('body *')]
        .filter((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && ['fixed', 'absolute'].includes(style.position) && (Number(style.zIndex) >= 100 || /impeccable/i.test([element.id, element.className].join(' ')));
        })
        .slice(0, 40)
        .map((element) => ({ ...box(element), text: element.innerText?.trim().replace(/\s+/g, ' ').slice(0, 120) || '' }));
      const hits = [[2, 2], [10, 25], [160, 12], [315, 12]].map(([x, y]) => ({
        point: [x, y],
        stack: document.elementsFromPoint(x, y).slice(0, 4).map((element) => ({
          tag: element.tagName,
          id: element.id || null,
          className: typeof element.className === 'string' ? element.className : '',
          text: element.innerText?.trim().replace(/\s+/g, ' ').slice(0, 60) || '',
        })),
      }));
      return {
        viewport: { innerWidth, innerHeight, visualWidth: visualViewport?.width ?? null, documentClientWidth: document.documentElement.clientWidth, documentScrollWidth: document.documentElement.scrollWidth },
        elements: Object.fromEntries(Object.entries(selectors).map(([name, element]) => [name, box(element)])),
        transferPanelTitles: [...document.querySelectorAll('.lx-transfer-panel__title')].map((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            id: element.id || null,
            text: element.innerText?.trim() || '',
            title: element.getAttribute('title'),
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
            rect: { left: rect.left, right: rect.right, width: rect.width },
            overflow: style.overflow,
            textOverflow: style.textOverflow,
            whiteSpace: style.whiteSpace,
          };
        }),
        locatorMatches,
        fixedLayers,
        pointHits: hits,
      };
    })()`,
  )
const screenshot = async (name) => {
  const result = await page.call('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false })
  fs.writeFileSync(path.join(evidenceDir, name), Buffer.from(result.data, 'base64'))
}

await evaluate(page, `(() => {
  window.__assessmentBMutationLog = [];
  window.__assessmentBAddedElements = [];
  window.__assessmentBObserver = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element) {
          window.__assessmentBAddedElements.push(node);
          window.__assessmentBMutationLog.push({
            tag: node.tagName,
            id: node.id || null,
            className: typeof node.className === 'string' ? node.className : '',
            text: node.innerText?.trim().replace(/\\s+/g, ' ').slice(0, 100) || '',
          });
        }
      }
    }
  });
  window.__assessmentBObserver.observe(document.documentElement, { childList: true, subtree: true });
  return true;
})()`)
const desktopBaseline = await measure()
await page.call('Emulation.setDeviceMetricsOverride', {
  width: 320,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
})
await sleep(300)
const before = await measure()
await screenshot('mobile-overlay-before.png')
const injection = await evaluate(
  page,
  `(async () => {
    const script = document.createElement('script');
    script.src = 'http://localhost:${livePort}/detect.js';
    script.async = true;
    const status = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve('timeout'), 10000);
      script.onload = () => { clearTimeout(timeout); resolve('loaded'); };
      script.onerror = () => { clearTimeout(timeout); resolve('error'); };
      (document.head || document.documentElement).appendChild(script);
    });
    return { status, src: script.src, appended: script.isConnected };
  })()`,
)
await sleep(2700)
const after = await measure()
const mutationAdded = await evaluate(page, `(() => {
  window.__assessmentBObserver.disconnect();
  return window.__assessmentBMutationLog;
})()`)
await screenshot('mobile-overlay-after.png')
const cleanup = await evaluate(page, `(() => {
  const added = window.__assessmentBAddedElements || [];
  const overlayNodes = [...new Set(added.filter((node) => node.matches?.('.impeccable-overlay, .impeccable-label') || node.matches?.('style, script[src*="/detect.js"]')))];
  for (const node of overlayNodes) node.remove();
  const remaining = [...document.querySelectorAll('.impeccable-overlay, .impeccable-label, [class*="impeccable" i], [id*="impeccable" i]')]
    .map((node) => ({ tag: node.tagName, id: node.id || null, className: typeof node.className === 'string' ? node.className : '' }));
  return { removedCount: overlayNodes.length, removed: overlayNodes.map((node) => ({ tag: node.tagName, className: typeof node.className === 'string' ? node.className : '', src: node.getAttribute('src') })), remaining };
})()`)
const afterCleanup = await measure()
await screenshot('mobile-overlay-removed.png')
const demoControlProbe = await evaluate(page, `(() => {
  const details = document.querySelector('.transfer-panel-demo__settings');
  const heightSelect = document.querySelector('.transfer-panel-demo__height-control select');
  const describe = (element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const x = Math.round(rect.left + rect.width / 2);
    const y = Math.round(rect.top + rect.height / 2);
    const hit = rect.width && rect.height ? document.elementFromPoint(x, y) : null;
    return {
      text: element.innerText?.trim() || element.getAttribute('aria-label') || '',
      rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height },
      display: style.display,
      visibility: style.visibility,
      centerHit: hit ? { tag: hit.tagName, className: typeof hit.className === 'string' ? hit.className : '' } : null,
    };
  };
  const closed = {
    open: details?.open ?? null,
    buttons: [...(details?.querySelectorAll('button') || [])].map(describe),
    heightSelect: heightSelect ? describe(heightSelect) : null,
  };
  if (details) {
    details.open = true;
    details.scrollIntoView({ block: 'center' });
  }
  const expanded = {
    open: details?.open ?? null,
    buttons: [...(details?.querySelectorAll('button') || [])].map(describe),
    heightSelect: heightSelect ? describe(heightSelect) : null,
  };
  return { viewport: { innerWidth, innerHeight }, closed, expanded };
})()`)
await sleep(100)
await screenshot('mobile-demo-settings-open-no-overlay.png')
await evaluate(page, `(() => {
  const details = document.querySelector('.transfer-panel-demo__settings');
  if (details) details.open = false;
  window.scrollTo(0, 0);
  return true;
})()`)
const overlayNodes = {
  injection,
  desktopBaseline,
  before,
  after,
  cleanup,
  afterCleanup,
  demoControlProbe,
  rootWidthDelta: after.viewport.documentScrollWidth - before.viewport.documentScrollWidth,
  cleanupWidthDelta: afterCleanup.viewport.documentScrollWidth - before.viewport.documentScrollWidth,
  mutationAdded,
}
writeJson('browser-overlay-bounds.json', overlayNodes)
process.stdout.write(`${JSON.stringify({ injection, desktop: desktopBaseline.viewport, desktopTitles: desktopBaseline.transferPanelTitles, before: before.viewport, mobileTitlesBefore: before.transferPanelTitles, after: after.viewport, afterCleanup: afterCleanup.viewport, rootWidthDelta: overlayNodes.rootWidthDelta, cleanupWidthDelta: overlayNodes.cleanupWidthDelta, cleanup, demoControlProbe, locatorMatches: after.locatorMatches, fixedLayers: after.fixedLayers.map(({ tag, id, className, rect, position, zIndex }) => ({ tag, id, className, rect, position, zIndex })) })}\n`)
page.close()
browser.close()
