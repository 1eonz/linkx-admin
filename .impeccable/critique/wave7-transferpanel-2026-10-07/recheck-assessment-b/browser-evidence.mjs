import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

const root = path.resolve(process.argv[2] ?? '.')
const url = process.argv[3] ?? 'http://127.0.0.1:4187/components/lxtransferpanel'
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const debugPort = 9237
const profilePath = path.join(root, 'chrome-profile')

await fs.mkdir(root, { recursive: true })

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const writeJson = (name, value) =>
  fs.writeFile(path.join(root, name), `${JSON.stringify(value, null, 2)}\n`)

function createCdpClient(ws) {
  let nextId = 0
  const pending = new Map()
  const events = []
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) reject(new Error(JSON.stringify(message.error)))
      else resolve(message.result)
      return
    }
    events.push(message)
  })
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId
      pending.set(id, { resolve, reject })
      ws.send(JSON.stringify({ id, method, params }))
    })
  return { send, events }
}

async function openCdp() {
  const proc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profilePath}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-default-apps',
    '--disable-extensions',
    '--window-size=1440,1100',
    'about:blank',
  ], { stdio: 'ignore', windowsHide: true })

  let target
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`)
      const targets = await response.json()
      target = targets.find((item) => item.type === 'page')
      if (target) break
    } catch {
      // Chrome may need a few hundred milliseconds to open the debugging endpoint.
    }
    await wait(250)
  }
  if (!target) throw new Error('Chrome CDP target did not become available')
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })
  return { proc, target, client: createCdpClient(ws), ws }
}

const browser = await openCdp()
const { send, events } = browser.client
const pageErrors = []
const consoleMessages = []
const requests = []

await send('Page.enable')
await send('Runtime.enable')
await send('Network.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 1100,
  deviceScaleFactor: 1,
  mobile: false,
})

const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? 'Runtime evaluation failed')
  }
  return result.result?.value
}

const clickButton = async (text, exact = true) =>
  evaluate(`(() => {
    const wanted = ${JSON.stringify(text)};
    const button = [...document.querySelectorAll('button')].find((node) => {
      const value = (node.textContent || '').trim();
      return ${exact ? 'value === wanted' : 'value.includes(wanted)'};
    });
    if (!button) return false;
    button.click();
    return true;
  })()`)

const clickByAria = async (ariaLabel) =>
  evaluate(`(() => {
    const wanted = ${JSON.stringify(ariaLabel)};
    const button = document.querySelector('button[aria-label="' + wanted + '"]');
    if (!button) return false;
    button.click();
    return true;
  })()`)

const clickLabelContaining = async (text) =>
  evaluate(`(() => {
    const wanted = ${JSON.stringify(text)};
    const label = [...document.querySelectorAll('label')].find((node) => (node.textContent || '').includes(wanted));
    const input = label?.querySelector('input');
    if (!input) return false;
    input.click();
    return true;
  })()`)

const setInput = async (ariaLabel, value) =>
  evaluate(`(() => {
    const input = document.querySelector(${JSON.stringify(`input[aria-label="${ariaLabel}"]`)});
    if (!input) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`)

const focusInput = async (ariaLabel) =>
  evaluate(`(() => {
    const input = document.querySelector(${JSON.stringify(`input[aria-label="${ariaLabel}"]`)});
    if (!input) return false;
    input.focus();
    return document.activeElement === input;
  })()`)

const pageSummary = async () => evaluate(`(() => {
  const rect = (node) => {
    if (!node) return null;
    const box = node.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  };
  const layout = document.querySelector('.lx-transfer-panel');
  const panels = [...document.querySelectorAll('.lx-transfer-panel__panel')];
  const controls = [...document.querySelectorAll('.lx-transfer-panel__controls button')];
  const selectedItems = [...document.querySelectorAll('.lx-transfer-panel__selected-item')];
  const overlay = [...document.querySelectorAll('body *')].filter((node) => {
    const value = (node.id || '') + ' ' + (node.className || '');
    return /impeccable|detect/i.test(value);
  }).slice(-12).map((node) => ({ tag: node.tagName, id: node.id, className: String(node.className || '') }));
  return {
    title: document.title,
    readyState: document.readyState,
    bodyText: document.body.innerText.slice(0, 8000),
    layoutRect: rect(layout),
    gridTemplateColumns: layout ? getComputedStyle(layout).gridTemplateColumns : null,
    gridTemplateRows: layout ? getComputedStyle(layout).gridTemplateRows : null,
    panelRects: panels.map(rect),
    panelRows: panels.map((node) => getComputedStyle(node).gridTemplateRows),
    controls: controls.map((node) => ({
      aria: node.getAttribute('aria-label'),
      title: node.getAttribute('title'),
      disabled: node.disabled,
      rect: rect(node),
    })),
    selectedItems: selectedItems.map((node) => ({ text: node.innerText.trim(), rect: rect(node) })),
    buttons: [...document.querySelectorAll('button')].map((node) => ({ text: node.innerText.trim(), aria: node.getAttribute('aria-label'), disabled: node.disabled, rect: rect(node) })),
    inputs: [...document.querySelectorAll('input')].map((node) => ({ aria: node.getAttribute('aria-label'), value: node.value, rect: rect(node) })),
    status: document.querySelector('[data-testid="transfer-status"]')?.textContent?.trim() ?? null,
    selectedCount: document.querySelector('[data-testid="selected-count"]')?.textContent?.trim() ?? null,
    activeElement: document.activeElement ? { tag: document.activeElement.tagName, aria: document.activeElement.getAttribute('aria-label'), text: document.activeElement.textContent?.trim() } : null,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    overlayCandidates: overlay,
  };
})()`)

const screenshot = async (name) => {
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  await fs.writeFile(path.join(root, name), Buffer.from(result.data, 'base64'))
}

const waitForRender = () => wait(550)

const waitForApp = async () => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (await evaluate("Boolean(document.querySelector('.lx-transfer-panel'))")) return true
    await wait(500)
  }
  return false
}

await send('Page.navigate', { url })
const appReady = await waitForApp()
if (!appReady) throw new Error('LxTransferPanel demo did not render before timeout')
await waitForRender()
await evaluate(`document.title = '[Human] LxTransferPanel recheck B'`)
const beforeOverlay = await pageSummary()
await fs.writeFile(path.join(root, 'target-loaded.html'), await evaluate('document.documentElement.outerHTML'))

await evaluate(`new Promise((resolve, reject) => {
  const script = document.createElement('script');
  script.src = 'http://127.0.0.1:8487/detect.js';
  script.onload = () => resolve('loaded');
  script.onerror = () => reject(new Error('overlay script failed to load'));
  document.head.appendChild(script);
})`)
await wait(2500)
const afterOverlay = await pageSummary()
await screenshot('desktop-light-overlay.png')

await writeJson('desktop-light.json', { beforeOverlay, afterOverlay })

await clickLabelContaining('HUD 深色主题')
await waitForRender()
await screenshot('desktop-hud.png')
const hud = await pageSummary()
await writeJson('desktop-hud.json', hud)

await clickLabelContaining('HUD 深色主题')
await waitForRender()
await clickButton('加载中')
await waitForRender()
await screenshot('state-loading.png')
const loading = await pageSummary()

await clickButton('加载失败')
await waitForRender()
await screenshot('state-error.png')
const error = await pageSummary()

await clickButton('正常数据')
await waitForRender()
await clickButton('空结果')
await waitForRender()
await screenshot('state-empty.png')
const empty = await pageSummary()

await clickButton('正常数据')
await waitForRender()

const keyboardBefore = await pageSummary()
const focused = await focusInput('筛选待选节点')
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 })
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 })
await wait(250)
const keyboardAfter = await pageSummary()
await screenshot('keyboard-focus.png')

await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
await waitForRender()
const reducedMotion = await pageSummary()
await screenshot('reduced-motion.png')
await send('Emulation.setEmulatedMedia', { features: [] })

await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 900, deviceScaleFactor: 1, mobile: false })
await waitForRender()
await screenshot('mobile-375-light.png')
const mobileInitial = await pageSummary()

const mobileActions = {}
mobileActions.selectAllBefore = await pageSummary()
mobileActions.selectAllClicked = await clickButton('全选')
await waitForRender()
mobileActions.afterSelectAll = await pageSummary()

await setInput('在已选项中检索', '正常')
await waitForRender()
mobileActions.rightStatusFilter = await pageSummary()
const rightClear = await evaluate(`Boolean(document.querySelector('button[aria-label="清除已选项筛选"]'))`)
mobileActions.rightClearPresent = rightClear
if (rightClear) {
  await evaluate(`document.querySelector('button[aria-label="清除已选项筛选"]').click()`)
  await waitForRender()
}
mobileActions.afterRightClear = await pageSummary()

mobileActions.invertClicked = await clickButton('反选')
await waitForRender()
mobileActions.afterInvert = await pageSummary()
mobileActions.clearClicked = await clickByAria('全部移除')
await waitForRender()
mobileActions.afterClear = await pageSummary()

await clickButton('正常数据')
await waitForRender()
await setInput('筛选待选节点', '情指行')
await waitForRender()
mobileActions.sourceFilter = await pageSummary()
const sourceClear = await evaluate(`Boolean(document.querySelector('button[aria-label="清除待选节点筛选"]'))`)
mobileActions.sourceClearPresent = sourceClear
if (sourceClear) {
  await evaluate(`document.querySelector('button[aria-label="清除待选节点筛选"]').click()`)
  await waitForRender()
}
mobileActions.afterSourceClear = await pageSummary()

await screenshot('mobile-375-interactions.png')
await writeJson('mobile-375.json', { mobileInitial, mobileActions })

const desktop = await (async () => {
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false })
  await waitForRender()
  return pageSummary()
})()

const finalLocation = await evaluate('location.href')

for (const event of events) {
  if (event.method === 'Runtime.consoleAPICalled') {
    consoleMessages.push({
      type: event.params.type,
      args: event.params.args?.map((arg) => arg.value ?? arg.description ?? arg.unserializableValue),
      timestamp: event.params.timestamp,
    })
  }
  if (event.method === 'Runtime.exceptionThrown') {
    pageErrors.push({ type: 'exceptionThrown', details: event.params.exceptionDetails })
  }
  if (event.method === 'Network.requestWillBeSent') {
    requests.push({ url: event.params.request.url, method: event.params.request.method, type: event.params.type })
  }
}

const externalRequests = requests.filter((request) => {
  try {
    const parsed = new URL(request.url)
    return !['127.0.0.1', 'localhost'].includes(parsed.hostname)
  } catch {
    return false
  }
})
const overlayConsole = consoleMessages.filter((entry) => entry.args?.some((value) => /impeccable|detector|overlay/i.test(String(value))))
await writeJson('browser-evidence.json', {
  url,
  finalLocation,
  appReady,
  target: browser.target,
  beforeOverlay,
  afterOverlay,
  hud,
  loading,
  error,
  empty,
  keyboard: { focused, before: keyboardBefore, after: keyboardAfter },
  reducedMotion,
  desktop,
  mobileInitial,
  mobileActions,
  overlay: { injection: 'script-load-resolved', candidates: afterOverlay.overlayCandidates, console: overlayConsole },
  consoleMessages,
  pageErrors,
  requests,
  externalRequests,
  eventsCount: events.length,
})

await browser.ws.close()
browser.proc.kill()
await fs.writeFile(path.join(root, 'browser.exitcode.txt'), '0\n')
