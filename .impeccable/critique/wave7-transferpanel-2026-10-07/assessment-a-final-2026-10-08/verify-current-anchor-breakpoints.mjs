import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const outputDir = path.dirname(fileURLToPath(import.meta.url))
const version = await fetch('http://127.0.0.1:9333/json/version').then((response) => response.json())
const socket = new WebSocket(version.webSocketDebuggerUrl)
const pending = new Map()
let nextId = 0

socket.addEventListener('message', (event) => {
  const message = JSON.parse(String(event.data))
  if (!message.id || !pending.has(message.id)) return
  const { resolve, reject } = pending.get(message.id)
  pending.delete(message.id)
  if (message.error) reject(new Error(message.error.message))
  else resolve(message.result)
})

await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

function send(method, params = {}, sessionId) {
  const id = ++nextId
  const message = { id, method, params }
  if (sessionId) message.sessionId = sessionId
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify(message))
  })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const target = await send('Target.createTarget', { url: 'about:blank' })
const attached = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true })
const sessionId = attached.sessionId
const observations = []

async function evaluate(expression) {
  const response = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  }, sessionId)
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text)
  return response.result?.value
}

async function waitFor(expression) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < 30000) {
    if (await evaluate(expression)) return
    await sleep(200)
  }
  throw new Error(`Timed out waiting for ${expression}`)
}

async function setViewport(width) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: width < 768,
    screenWidth: width,
    screenHeight: 1000,
  }, sessionId)
  await send('Emulation.setTouchEmulationEnabled', { enabled: width < 768, maxTouchPoints: 1 }, sessionId)
  await sleep(500)
}

async function screenshot(name) {
  const response = await send('Page.captureScreenshot', { format: 'png', fromSurface: true }, sessionId)
  fs.writeFileSync(path.join(outputDir, name), Buffer.from(response.data, 'base64'))
}

async function measure(label) {
  const value = await evaluate(`(() => {
    const key = 'archive-unit-09';
    const row = document.querySelector('[data-lx-tree-key="' + key + '"]');
    const tree = document.querySelector('.lx-virtual-tree__viewport');
    const active = document.activeElement;
    const activeRow = active?.closest?.('[role="treeitem"]');
    const rowRect = row?.getBoundingClientRect();
    const treeRect = tree?.getBoundingClientRect();
    return {
      viewportWidth: innerWidth,
      activeElement: active ? { tag: active.tagName, role: active.getAttribute('role'), key: active.getAttribute('data-lx-tree-key'), connected: active.isConnected, focusVisible: active.matches?.(':focus-visible') ?? false } : null,
      focusedKey: activeRow?.getAttribute('data-lx-tree-key') ?? null,
      anchorRow: row ? { key: row.getAttribute('data-lx-tree-key'), connected: row.isConnected, focused: row === active || row.contains(active), offset: treeRect ? Math.round(rowRect.top - treeRect.top) : null, bounds: { top: Math.round(rowRect.top), bottom: Math.round(rowRect.bottom) } } : null,
      tree: tree ? { scrollTop: Math.round(tree.scrollTop), scrollHeight: tree.scrollHeight, clientHeight: tree.clientHeight, itemSize: getComputedStyle(row ?? tree).getPropertyValue('--lx-tree-row-height').trim() } : null,
    };
  })()`)
  observations.push({ label, ...value })
}

try {
  await send('Page.enable', {}, sessionId)
  await send('Runtime.enable', {}, sessionId)
  await send('Page.navigate', { url: 'http://127.0.0.1:4183/components/lxtransferpanel.html' }, sessionId)
  await waitFor("document.querySelector('.lx-transfer-panel') && document.querySelector('.lx-virtual-tree__viewport')")
  await evaluate("document.querySelector('.transfer-panel-demo').scrollIntoView({block:'start'})")
  await setViewport(1440)
  await evaluate("document.querySelector('[data-lx-tree-key=archive-unit-09]')?.focus()")
  await waitFor("document.activeElement?.getAttribute('data-lx-tree-key') === 'archive-unit-09'")
  await measure('anchor-at-1440-before-resize')
  await screenshot('current-anchor-1440.png')
  await setViewport(375)
  await measure('anchor-at-375-after-resize')
  await screenshot('current-anchor-375.png')
  await setViewport(320)
  await measure('anchor-at-320-after-resize')
  await screenshot('current-anchor-320.png')
  fs.writeFileSync(path.join(outputDir, 'current-anchor-breakpoint-evidence.json'), `${JSON.stringify({
    target: 'http://127.0.0.1:4183/components/lxtransferpanel.html',
    browser: version.Browser,
    procedure: '在 1440px 聚焦 archive-unit-09 后，不执行面板切换或其它 DOM 操作，直接依次调整到 375px、320px。',
    observations,
  }, null, 2)}\n`)
} finally {
  try { await send('Target.closeTarget', { targetId: target.targetId }) } catch {}
  socket.close()
}
