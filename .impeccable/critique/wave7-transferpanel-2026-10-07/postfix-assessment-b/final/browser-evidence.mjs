import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

const outputDir = path.resolve(process.argv[2] ?? '.')
const targetUrl = process.argv[3] ?? 'http://127.0.0.1:4192/components/lxtransferpanel'
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const debugPort = 9243
const profileDir = path.join(outputDir, 'chrome-profile')
const localPorts = new Set(['4192', '8489'])

await fs.mkdir(outputDir, { recursive: true })

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const saveJson = (file, data) =>
  fs.writeFile(path.join(outputDir, file), `${JSON.stringify(data, null, 2)}\n`)

function createCdp(ws) {
  let nextId = 0
  const pending = new Map()
  const events = []
  const listeners = new Set()
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      const waiter = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) waiter.reject(new Error(JSON.stringify(message.error)))
      else waiter.resolve(message.result)
      return
    }
    events.push(message)
    listeners.forEach((listener) => listener(message))
  })
  return {
    events,
    on(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = ++nextId
        pending.set(id, { resolve, reject })
        ws.send(JSON.stringify({ id, method, params }))
      })
    },
  }
}

async function launchChrome() {
  const args = [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-default-apps',
    '--disable-extensions',
    '--window-size=1440,1100',
    'about:blank',
  ]
  const proc = spawn(chromePath, args, { stdio: 'ignore', windowsHide: true })
  let target
  for (let i = 0; i < 80; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`)
      const targets = await response.json()
      target = targets.find((item) => item.type === 'page' && item.url === 'about:blank')
      if (target) break
    } catch {
      // 等待新 Chrome profile 建立 CDP endpoint。
    }
    await sleep(250)
  }
  if (!target) throw new Error('未能取得新 Chrome context 的 about:blank target')
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })
  return { args, proc, target, ws, cdp: createCdp(ws) }
}

const browser = await launchChrome()
const { cdp } = browser
const requests = []
const intercepted = []
const consoleMessages = []
const pageErrors = []
const loadingFailures = []

const evaluate = async (expression) => {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? '页面表达式执行失败')
  }
  return result.result?.value
}

const screenshot = async (name) => {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  await fs.writeFile(path.join(outputDir, name), Buffer.from(result.data, 'base64'))
}

const waitForApp = async () => {
  for (let i = 0; i < 100; i += 1) {
    const visible = await evaluate(`(() => {
      const node = document.querySelector('.lx-transfer-panel');
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    })()`)
    if (visible) return true
    await sleep(350)
  }
  return false
}

const clickButton = async (label, mode = 'exact') =>
  evaluate(`(() => {
    const label = ${JSON.stringify(label)};
    const node = [...document.querySelectorAll('button')].find((button) => {
      const text = (button.innerText || '').trim();
      return ${mode === 'contains' ? 'text.includes(label)' : 'text === label'};
    });
    if (!node) return false;
    node.click();
    return true;
  })()`)

const clickButtonByAria = async (aria) =>
  evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((node) => node.getAttribute('aria-label') === ${JSON.stringify(aria)});
    if (!button) return false;
    button.click();
    return true;
  })()`)

const clickLabel = async (labelText) =>
  evaluate(`(() => {
    const label = [...document.querySelectorAll('label')].find((node) => (node.innerText || '').includes(${JSON.stringify(labelText)}));
    const input = label?.querySelector('input');
    if (!input) return false;
    input.click();
    return true;
  })()`)

const clickSummary = async (text) =>
  evaluate(`(() => {
    const summary = [...document.querySelectorAll('summary')].find((node) => (node.innerText || '').trim() === ${JSON.stringify(text)});
    if (!summary) return false;
    summary.click();
    return true;
  })()`)

const setInput = async (aria, value) =>
  evaluate(`(() => {
    const input = document.querySelector('input[aria-label="' + ${JSON.stringify(aria)} + '"]');
    if (!input) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`)

const inspect = async () => evaluate(`(() => {
  const rect = (node) => {
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  };
  const layout = document.querySelector('.lx-transfer-panel');
  const viewport = document.querySelector('.lx-virtual-tree__viewport');
  const rows = [...document.querySelectorAll('.lx-virtual-tree__row')];
  const panels = [...document.querySelectorAll('.lx-transfer-panel__panel')];
  const selected = [...document.querySelectorAll('.lx-transfer-panel__selected-item')];
  const buttons = [...document.querySelectorAll('.transfer-panel-demo button, .lx-transfer-panel button')];
  const inputs = [...document.querySelectorAll('.transfer-panel-demo input, .lx-transfer-panel input')];
  const overflow = document.documentElement.scrollWidth - window.innerWidth;
  return {
    href: location.href,
    title: document.title,
    readyState: document.readyState,
    viewport: { width: window.innerWidth, height: window.innerHeight, documentWidth: document.documentElement.scrollWidth, horizontalOverflow: overflow, scrollY: window.scrollY },
    layoutRect: rect(layout),
    layoutColumns: layout ? getComputedStyle(layout).gridTemplateColumns : null,
    layoutRows: layout ? getComputedStyle(layout).gridTemplateRows : null,
    panelRects: panels.map(rect),
    panelRows: panels.map((node) => getComputedStyle(node).gridTemplateRows),
    virtualTree: viewport ? {
      rect: rect(viewport), scrollTop: viewport.scrollTop,
      scrollHeight: viewport.scrollHeight, clientHeight: viewport.clientHeight,
      maxScrollTop: Math.max(0, viewport.scrollHeight - viewport.clientHeight),
      totalRows: viewport.querySelectorAll('[role="treeitem"]').length,
      rowKeys: rows.map((row) => row.dataset.lxTreeKey),
      rowLabels: rows.map((row) => row.querySelector('.lx-virtual-tree__label')?.textContent?.trim()),
    } : null,
    selected: selected.map((node) => ({ text: node.innerText.trim(), rect: rect(node) })),
    selectedCount: document.querySelector('[data-testid="selected-count"]')?.innerText?.trim() ?? null,
    hostStatus: document.querySelector('[data-testid="transfer-status"]')?.innerText?.trim() ?? null,
    hostState: document.querySelector('[aria-label="宿主数据状态"]')?.innerText?.trim() ?? null,
    overlayNodes: [...document.querySelectorAll('[class*="impeccable-"]')].map((node) => ({ tag: node.tagName, className: String(node.className) })).slice(-30),
    buttons: buttons.map((node) => ({ text: node.innerText.trim(), aria: node.getAttribute('aria-label'), title: node.title, disabled: node.disabled, rect: rect(node) })),
    inputs: inputs.map((node) => ({ aria: node.getAttribute('aria-label'), value: node.value, rect: rect(node) })),
    activeElement: document.activeElement ? { tag: document.activeElement.tagName, aria: document.activeElement.getAttribute('aria-label'), key: document.activeElement.closest('[data-lx-tree-key]')?.dataset.lxTreeKey, text: document.activeElement.innerText?.trim() } : null,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    hud: Boolean(document.querySelector('.transfer-panel-demo.lx-theme-hud')),
    stateMessage: document.querySelector('.transfer-panel-demo__message')?.innerText?.trim() ?? null,
  };
})()`)

await cdp.send('Page.enable')
await cdp.send('Runtime.enable')
await cdp.send('Network.enable')
await cdp.send('Fetch.enable', { patterns: [{ urlPattern: 'http://*/*' }, { urlPattern: 'https://*/*' }] })
cdp.on((event) => {
  if (event.method !== 'Fetch.requestPaused') return
  const request = event.params.request
  let isLocal = false
  try {
    const parsed = new URL(request.url)
    isLocal = ['127.0.0.1', 'localhost'].includes(parsed.hostname) && localPorts.has(parsed.port)
  } catch {
    // 非 HTTP 形式在此不视为本机请求。
  }
  if (isLocal) {
    void cdp.send('Fetch.continueRequest', { requestId: event.params.requestId })
  } else {
    intercepted.push({ url: request.url, method: request.method, reason: '非本机 HTTP(S) 被浏览器拦截' })
    void cdp.send('Fetch.failRequest', { requestId: event.params.requestId, errorReason: 'BlockedByClient' })
  }
})
cdp.on((event) => {
  if (event.method === 'Network.requestWillBeSent') {
    requests.push({ url: event.params.request.url, method: event.params.request.method, type: event.params.type })
  }
  if (event.method === 'Network.loadingFailed') {
    loadingFailures.push({ requestId: event.params.requestId, errorText: event.params.errorText, blockedReason: event.params.blockedReason ?? null })
  }
  if (event.method === 'Runtime.consoleAPICalled') {
    consoleMessages.push({ type: event.params.type, args: event.params.args?.map((arg) => arg.value ?? arg.description ?? arg.unserializableValue) })
  }
  if (event.method === 'Runtime.exceptionThrown') {
    pageErrors.push({ type: 'exception', details: event.params.exceptionDetails })
  }
})

await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: targetUrl })
const appReady = await waitForApp()
if (!appReady) throw new Error('页面未在规定时间内出现可见 .lx-transfer-panel')
await sleep(500)

const preflight = await evaluate(`(() => {
  document.title = '[Human] LxTransferPanel final Assessment B';
  const script = document.createElement('script');
  script.setAttribute('data-assessment-b-preflight', 'true');
  script.textContent = 'window.__assessmentBPreflight = "script-appended"';
  document.head.appendChild(script);
  return { title: document.title, appended: Boolean(document.querySelector('script[data-assessment-b-preflight]')), marker: window.__assessmentBPreflight };
})()`)
const loadedBeforeOverlay = await inspect()

const overlayInjection = await evaluate(`new Promise((resolve, reject) => {
  const script = document.createElement('script');
  script.src = 'http://127.0.0.1:8489/detect.js';
  script.onload = () => resolve({ loaded: true, src: script.src });
  script.onerror = () => reject(new Error('Impeccable overlay script failed to load'));
  document.head.appendChild(script);
})`)
await sleep(2600)
await evaluate('window.scrollTo(0, 0)')
const desktopLight = await inspect()
await screenshot('desktop-1440-light-overlay.png')

await clickSummary('示例状态与主题')
await sleep(200)
const hudToggled = await clickLabel('HUD 深色主题')
await sleep(350)
const desktopHud = await inspect()
await screenshot('desktop-1440-hud.png')
await clickLabel('HUD 深色主题')
await sleep(250)

const stateControlOpened = true
const stateActions = {}
stateActions.loadingClicked = await clickButton('加载中')
await sleep(250)
stateActions.loading = await inspect()
await screenshot('state-loading.png')
stateActions.errorClicked = await clickButton('加载失败')
await sleep(250)
stateActions.error = await inspect()
await screenshot('state-error.png')
stateActions.emptyClicked = await clickButton('空结果')
await sleep(250)
stateActions.empty = await inspect()
await screenshot('state-empty.png')
stateActions.readyClicked = await clickButton('正常数据')
await sleep(400)

const keyboard = {}
keyboard.focusFilter = await evaluate(`(() => { const input=document.querySelector('input[aria-label="筛选待选节点"]'); if(!input)return false; input.focus(); return document.activeElement===input; })()`)
await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 })
await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 })
await sleep(150)
keyboard.afterTab = await inspect()
await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40, nativeVirtualKeyCode: 40 })
await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40, nativeVirtualKeyCode: 40 })
await sleep(200)
keyboard.afterArrowDown = await inspect()
await screenshot('keyboard-tree-focus.png')

await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
await sleep(300)
const reducedMotion = await inspect()
await screenshot('reduced-motion-desktop.png')
await cdp.send('Emulation.setEmulatedMedia', { features: [] })

const scrollBefore = await inspect()
const viewportRect = scrollBefore.virtualTree.rect
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: viewportRect.x + viewportRect.width / 2, y: viewportRect.y + viewportRect.height / 2 })
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: viewportRect.x + viewportRect.width / 2, y: viewportRect.y + viewportRect.height / 2, deltaX: 0, deltaY: 1320 })
await sleep(450)
const scrollAfterWheel = await inspect()
await screenshot('virtual-tree-scrolled.png')
await evaluate(`(() => { const node=document.querySelector('.lx-virtual-tree__viewport'); if(node){node.scrollTop=0;node.dispatchEvent(new Event('scroll',{bubbles:true}));} })()`)
await sleep(250)
const scrollRestored = await inspect()
await screenshot('virtual-tree-top-restored.png')

const undo = {}
undo.before = await inspect()
undo.selectAllClicked = await clickButton('全选')
await sleep(400)
undo.afterSelectAll = await inspect()
undo.clearClicked = await clickButton('清空')
await sleep(400)
undo.afterClear = await inspect()
undo.undoButtonPresent = Boolean(undo.afterClear.buttons.find((button) => button.text === '撤销清空'))
undo.undoClicked = await clickButton('撤销清空')
await sleep(450)
undo.afterUndo = await inspect()
await screenshot('undo-restored-selection.png')

const responsive = {}
for (const width of [375, 320]) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height: 1100, deviceScaleFactor: 1, mobile: false })
  await sleep(350)
  await evaluate(`(() => { const target=document.querySelector('.lx-transfer-panel'); if(target) window.scrollTo(0, Math.max(0, target.getBoundingClientRect().top + window.scrollY - 110)); })()`)
  await sleep(200)
  responsive[String(width)] = await inspect()
  await screenshot(`mobile-${width}-light.png`)
}

await cdp.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 1100, deviceScaleFactor: 1, mobile: false })
await clickLabel('HUD 深色主题')
await sleep(350)
responsive['375Hud'] = await inspect()
await screenshot('mobile-375-hud.png')

await evaluate('window.scrollTo(0, 0)')
const finalLocation = await evaluate('location.href')
const documentTitle = await evaluate('document.title')
const externalRequests = requests.filter((request) => {
  try {
    const parsed = new URL(request.url)
    return !(['127.0.0.1', 'localhost'].includes(parsed.hostname) && localPorts.has(parsed.port))
  } catch {
    return false
  }
})
const overlayConsole = consoleMessages.filter((entry) => entry.args?.some((value) => /impeccable|anti-pattern|cramped|easing|transition/i.test(String(value))))

await saveJson('browser-evidence.json', {
  targetUrl,
  finalLocation,
  appReady,
  documentTitle,
  chrome: { pid: browser.proc.pid, debugPort, freshProfile: profileDir, initialTarget: browser.target.url },
  preflight,
  overlayInjection,
  loadedBeforeOverlay,
  desktopLight,
  desktopHud: { hudToggled, ...desktopHud },
  stateControlOpened,
  stateActions,
  keyboard,
  reducedMotion,
  virtualTreeScroll: { before: scrollBefore.virtualTree, afterWheel: scrollAfterWheel.virtualTree, restored: scrollRestored.virtualTree },
  undo,
  responsive,
  requests,
  externalRequests,
  interceptedRequests: intercepted,
  consoleMessages,
  overlayConsole,
  pageErrors,
  loadingFailures,
  eventCount: cdp.events.length,
})

await fs.writeFile(path.join(outputDir, 'browser.exitcode.txt'), '0\n')
await browser.ws.close()
browser.proc.kill()
