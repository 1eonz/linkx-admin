import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const outputDir = path.dirname(fileURLToPath(import.meta.url))
const browserPort = 9339
const detectorUrl = 'http://localhost:8417/detect.js'
const targetUrl = 'http://127.0.0.1:4185/components/lxtransferpanel'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

class CDP {
  constructor(url) {
    this.url = url
    this.nextId = 0
    this.pending = new Map()
    this.events = []
  }

  async connect() {
    this.socket = new WebSocket(this.url)
    this.socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data)
      if (message.id) {
        const pending = this.pending.get(message.id)
        if (!pending) return
        this.pending.delete(message.id)
        if (message.error) pending.reject(new Error(message.error.message))
        else pending.resolve(message.result)
        return
      }
      this.events.push(message)
    })
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true })
      this.socket.addEventListener('error', reject, { once: true })
    })
  }

  send(method, params = {}) {
    const id = ++this.nextId
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  async evaluate(expression, awaitPromise = false) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue: true,
      userGesture: true,
    })
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
    }
    return result.result?.value
  }

  async screenshot(name) {
    const result = await this.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false,
    })
    await fs.writeFile(path.join(outputDir, name), Buffer.from(result.data, 'base64'))
  }
}

const targets = await fetch(`http://localhost:${browserPort}/json/list`).then((response) => response.json())
let target = targets.find((entry) => entry.type === 'page' && entry.url === targetUrl)
if (!target) {
  target = await fetch(`http://localhost:${browserPort}/json/new?${encodeURIComponent(targetUrl)}`, {
    method: 'PUT',
  }).then((response) => response.json())
}
if (!target?.webSocketDebuggerUrl) throw new Error(`No fresh page target found for ${targetUrl}`)

const cdp = new CDP(target.webSocketDebuggerUrl)
await cdp.connect()
await cdp.send('Page.enable')
await cdp.send('Runtime.enable')
await cdp.send('Log.enable')
await cdp.send('Page.navigate', { url: targetUrl })

let mountStatus = null
for (let attempt = 0; attempt < 60; attempt += 1) {
  mountStatus = await cdp.evaluate(`({
    demoMounted: Boolean(document.querySelector('.transfer-panel-demo')),
    componentMounted: Boolean(document.querySelector('.lx-transfer-panel')),
    componentText: document.querySelector('.lx-transfer-panel')?.innerText?.trim().slice(0, 220) || '',
  })`)
  if (mountStatus.demoMounted && mountStatus.componentMounted && mountStatus.componentText) break
  await sleep(500)
}
if (!mountStatus?.demoMounted || !mountStatus?.componentMounted || !mountStatus?.componentText) {
  const failure = {
    capturedAt: new Date().toISOString(),
    method: 'headless Chrome CDP; no Playwright/Puppeteer package available',
    targetUrl,
    targetId: target.id,
    reason: 'The docs page did not mount both .transfer-panel-demo and .lx-transfer-panel with content within 30 seconds; overlay injection was not attempted.',
    mountStatus,
    page: await cdp.evaluate(`({
      url: location.href,
      title: document.title,
      readyState: document.readyState,
      bodyText: document.body?.innerText?.trim().slice(0, 1200) || '',
      innerWidth: window.innerWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    })`),
    consoleMessages: cdp.events
      .filter((event) => event.method === 'Runtime.consoleAPICalled')
      .map((event) => ({
        type: event.params.type,
        text: event.params.args.map((argument) => argument.value ?? argument.description ?? '').join(' '),
      })),
    exceptions: cdp.events
      .filter((event) => event.method === 'Runtime.exceptionThrown')
      .map((event) => event.params.exceptionDetails.exception?.description || event.params.exceptionDetails.text),
    logEntries: cdp.events
      .filter((event) => event.method === 'Log.entryAdded')
      .map((event) => ({ level: event.params.entry.level, text: event.params.entry.text })),
  }
  await cdp.screenshot('browser-target-failure.png')
  await fs.writeFile(path.join(outputDir, 'browser-failure.json'), `${JSON.stringify(failure, null, 2)}\n`)
  console.log(JSON.stringify(failure, null, 2))
  cdp.socket.close()
  process.exitCode = 2
  process.exit()
}

await cdp.evaluate("window.scrollTo(0, 0)")
await cdp.evaluate("(() => { const details = document.querySelector('.transfer-panel-demo__settings'); if (details) details.open = true; return true })()")
await sleep(500)
const beforeInjection = await cdp.evaluate(`({
  url: location.href,
  title: document.title,
  innerWidth: window.innerWidth,
  clientWidth: document.documentElement.clientWidth,
  scrollWidth: document.documentElement.scrollWidth,
  viewportHeight: window.innerHeight,
  demoMounted: Boolean(document.querySelector('.transfer-panel-demo')),
  heading: document.querySelector('h1')?.innerText || null,
})`)
await cdp.screenshot('desktop-light-ready-before-injection.png')

const injection = await cdp.evaluate(`new Promise((resolve) => {
  document.title = '[Human] Wave7 LxTransferPanel Assessment B'
  const script = document.createElement('script')
  script.id = 'assessment-b-impeccable-detector'
  script.dataset.assessment = 'B'
  script.src = ${JSON.stringify(detectorUrl)}
  script.onload = () => resolve({ status: 'loaded', src: script.src })
  script.onerror = () => resolve({ status: 'error', src: script.src })
  document.head.appendChild(script)
})`, true)
await sleep(3000)

async function stateSnapshot(name) {
  return cdp.evaluate(`({
    name: ${JSON.stringify(name)},
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    viewportHeight: window.innerHeight,
    dark: document.documentElement.classList.contains('dark') || Boolean(document.querySelector('.transfer-panel-demo.lx-theme-hud')),
    hostState: [...document.querySelectorAll('[aria-label="宿主数据状态"] button')].find((button) => button.getAttribute('aria-pressed') === 'true')?.innerText || null,
    status: document.querySelector('[data-testid="transfer-status"]')?.innerText || null,
    overlayCount: document.querySelectorAll('.impeccable-overlay:not(.impeccable-banner)').length,
    bannerCount: document.querySelectorAll('.impeccable-banner').length,
    labelCount: document.querySelectorAll('.impeccable-label').length,
    overlays: [...document.querySelectorAll('.impeccable-overlay')].map((element) => ({
      className: element.className,
      text: element.innerText?.trim().slice(0, 180) || '',
      display: getComputedStyle(element).display,
      visibility: getComputedStyle(element).visibility,
    })),
  })`)
}

async function clickButton(text) {
  const clicked = await cdp.evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((element) => element.innerText.trim() === ${JSON.stringify(text)})
    if (!button) return false
    button.click()
    return true
  })()`)
  if (!clicked) throw new Error(`Could not click demo button: ${text}`)
  await sleep(500)
}

const desktopLight = await stateSnapshot('desktop-light-ready')
const afterInjection = { ...desktopLight, name: 'desktop-light-ready-after-injection' }
await cdp.screenshot('desktop-light-ready-overlay.png')

await cdp.evaluate(`(() => {
  const label = [...document.querySelectorAll('.transfer-panel-demo__toolbar-group label')].find((element) => element.innerText.includes('HUD 深色主题'))
  const input = label?.querySelector('input')
  if (input && !input.checked) input.click()
})()`)
await sleep(500)
const desktopDark = await stateSnapshot('desktop-dark-ready')
await cdp.screenshot('desktop-dark-ready-overlay.png')

await clickButton('加载失败')
const desktopError = await stateSnapshot('desktop-error')
await cdp.screenshot('desktop-error-overlay.png')

await clickButton('空结果')
const desktopEmpty = await stateSnapshot('desktop-empty')
await cdp.screenshot('desktop-empty-overlay.png')

await cdp.send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
})
await cdp.evaluate("window.scrollTo(0, 0)")
await clickButton('正常数据')
await cdp.evaluate(`(() => {
  const label = [...document.querySelectorAll('.transfer-panel-demo__toolbar-group label')].find((element) => element.innerText.includes('HUD 深色主题'))
  const input = label?.querySelector('input')
  if (input?.checked) input.click()
})()`)
await sleep(500)
const mobileReady = await stateSnapshot('mobile-light-ready')
await cdp.screenshot('mobile-light-ready-overlay.png')

const consoleMessages = cdp.events
  .filter((event) => event.method === 'Runtime.consoleAPICalled')
  .map((event) => ({
    type: event.params.type,
    text: event.params.args.map((argument) => argument.value ?? argument.description ?? '').join(' '),
  }))
  .filter((entry) => /impeccable/i.test(entry.text))
const exceptions = cdp.events
  .filter((event) => event.method === 'Runtime.exceptionThrown')
  .map((event) => event.params.exceptionDetails.exception?.description || event.params.exceptionDetails.text)
const logEntries = cdp.events
  .filter((event) => event.method === 'Log.entryAdded')
  .map((event) => ({ level: event.params.entry.level, text: event.params.entry.text }))
  .filter((entry) => /impeccable|error/i.test(entry.text))

const evidence = {
  capturedAt: new Date().toISOString(),
  method: 'headless Chrome CDP; no Playwright/Puppeteer package available',
  targetUrl,
  targetId: target.id,
  mountStatus,
  detectorUrl,
  injection,
  beforeInjection,
  afterInjection,
  states: [desktopLight, desktopDark, desktopError, desktopEmpty, mobileReady],
  consoleMessages,
  exceptions,
  logEntries,
}
await fs.writeFile(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)

console.log(JSON.stringify({
  targetId: target.id,
  injection,
  beforeInjection,
  afterInjection: evidence.afterInjection,
  states: evidence.states,
  consoleMessages,
  exceptions,
  logEntries,
}, null, 2))

cdp.socket.close()
