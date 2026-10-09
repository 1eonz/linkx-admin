import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const outputDir = path.join(
  process.cwd(),
  '.impeccable/critique/wave7-transferpanel-2026-10-07/final-dual-agent-2026-10-08/assessment-a',
)
const screenshotDir = path.join(outputDir, 'screenshots')
const profileDir = path.join(
  os.tmpdir(),
  `codex-wave7-assessment-a-${process.pid}`,
)
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const debugPort = 9457

mkdirSync(screenshotDir, { recursive: true })

const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-proxy-server',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ],
  { stdio: 'ignore', windowsHide: true },
)

let socket
let nextId = 0
const pending = new Map()
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function connectWebSocket(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url)
    const timeout = setTimeout(() => reject(new Error('WebSocket open timeout')), 10000)
    ws.addEventListener('open', () => {
      clearTimeout(timeout)
      resolve(ws)
    }, { once: true })
    ws.addEventListener('error', () => {
      clearTimeout(timeout)
      reject(new Error('WebSocket connection failed'))
    }, { once: true })
  })
}

function send(method, params = {}, sessionId) {
  const id = ++nextId
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id)
      reject(new Error(`CDP timeout: ${method}`))
    }, 15000)
    pending.set(id, { resolve, reject, timeout })
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
}

async function waitForBrowser() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`)
      if (response.ok) return response.json()
    } catch {}
    await delay(250)
  }
  throw new Error('Chrome DevTools endpoint did not become ready')
}

function evaluate(expression, sessionId) {
  return send(
    'Runtime.evaluate',
    { expression, awaitPromise: true, returnByValue: true },
    sessionId,
  ).then((result) => result.result?.value)
}

async function capturePage(sessionId, target, viewport) {
  await send(
    'Emulation.setDeviceMetricsOverride',
    {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.width < 600,
    },
    sessionId,
  )
  const navigation = await send(
    'Page.navigate',
    { url: target.url },
    sessionId,
  )

  const targetSelector = target.name === 'LxTransferPanel'
    ? '.transfer-panel-demo'
    : '.virtual-tree-demo'
  for (let attempt = 0; attempt < 24; attempt += 1) {
    if (await evaluate(`Boolean(document.querySelector(${JSON.stringify(targetSelector)}))`, sessionId)) break
    await delay(400)
  }
  await evaluate('document.fonts?.ready ?? Promise.resolve()', sessionId)
  const visibleState = await evaluate(`(() => {
    const target = document.querySelector(${JSON.stringify(targetSelector)})
    if (target) target.scrollIntoView({ block: 'center', inline: 'nearest' })
    return {
      title: document.title,
      readyState: document.readyState,
      navigationError: ${JSON.stringify(navigation.errorText ?? null)},
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      targetFound: Boolean(target),
      targetRect: target ? (() => { const r = target.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) } })() : null,
      excerpt: document.body.innerText.slice(0, 900),
    }
  })()`, sessionId)
  await delay(300)

  const image = await send(
    'Page.captureScreenshot',
    { format: 'png', captureBeyondViewport: false, fromSurface: true },
    sessionId,
  )
  const filename = `${target.slug}-${viewport.name}.png`
  const screenshotPath = path.join(screenshotDir, filename)
  writeFileSync(screenshotPath, Buffer.from(image.data, 'base64'))
  return { ...visibleState, screenshotPath }
}

async function main() {
  const version = await waitForBrowser()
  socket = await connectWebSocket(version.webSocketDebuggerUrl)
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (!message.id) return
    const request = pending.get(message.id)
    if (!request) return
    pending.delete(message.id)
    clearTimeout(request.timeout)
    if (message.error) request.reject(new Error(message.error.message))
    else request.resolve(message.result ?? {})
  })

  const { browserContextId } = await send('Target.createBrowserContext', {
    disposeOnDetach: true,
  })
  const { targetId } = await send('Target.createTarget', {
    url: 'about:blank',
    browserContextId,
  })
  const { sessionId } = await send('Target.attachToTarget', {
    targetId,
    flatten: true,
  })
  await send('Page.enable', {}, sessionId)
  await send('Runtime.enable', {}, sessionId)

  const targets = [
    {
      name: 'LxTransferPanel',
      slug: 'lxtransferpanel',
      url: 'http://127.0.0.1:8177/components/lxtransferpanel.html',
    },
    {
      name: 'LxVirtualTree',
      slug: 'lxvirtualtree',
      url: 'http://127.0.0.1:8177/components/lxvirtualtree.html',
    },
  ]
  const viewports = [
    { name: 'desktop-1440', width: 1440, height: 1000 },
    { name: 'mobile-375', width: 375, height: 812 },
  ]
  const captures = []
  for (const target of targets) {
    for (const viewport of viewports) {
      captures.push({
        target: target.name,
        ...await capturePage(sessionId, target, viewport),
      })
    }
  }

  const metadata = {
    method: 'Chrome DevTools Protocol; isolated profile, browser context, and new page',
    browser: version.Browser,
    browserProcessId: chrome.pid,
    profileDir,
    viewportCapture: '1440x1000 and 375x812; component demo centered in each screenshot',
    captures,
  }
  writeFileSync(
    path.join(outputDir, 'browser-capture.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
  )
  process.stdout.write(`${JSON.stringify(metadata, null, 2)}\n`)
}

try {
  await main()
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    try {
      await send('Browser.close')
    } catch {}
  }
  socket?.close()
  if (chrome.exitCode === null && chrome.signalCode === null) chrome.kill()
}
