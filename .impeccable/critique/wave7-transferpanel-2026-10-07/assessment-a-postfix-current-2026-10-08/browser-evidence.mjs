import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const outputDir = fileURLToPath(new URL('.', import.meta.url))
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const profileDir = resolve(outputDir, 'chrome-profile')
const sourcePath = 'F:\\work\\linkx-admin\\linkx-fe\\src\\components\\LxTransferPanel\\index.vue'
const sourceSha256Before = 'B168DEBA31A595473B9BD4DCEF524300CEC9F8361AA92E6094473FA362397D7D'
const pageUrl = 'http://127.0.0.1:4174/components/lxtransferpanel.html'
const screenshots = []
const observations = []
const runtimeMessages = []

await mkdir(outputDir, { recursive: true })

const browser = spawn(
  chromePath,
  [
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--remote-debugging-address=127.0.0.1',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true },
)

let browserStderr = ''
browser.stderr.setEncoding('utf8')
browser.stderr.on('data', (chunk) => {
  browserStderr += chunk
})

let devtoolsPort
for (let attempt = 0; attempt < 80 && !devtoolsPort; attempt += 1) {
  const match = browserStderr.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//)
  if (match) devtoolsPort = Number(match[1])
  else await new Promise((resolvePromise) => setTimeout(resolvePromise, 250))
}

if (!devtoolsPort) {
  browser.kill()
  throw new Error(`Chrome DevTools did not start: ${browserStderr}`)
}

const version = await fetch(`http://127.0.0.1:${devtoolsPort}/json/version`).then(
  (response) => response.json(),
)
const socket = new WebSocket(version.webSocketDebuggerUrl)
await new Promise((resolvePromise, rejectPromise) => {
  socket.addEventListener('open', resolvePromise, { once: true })
  socket.addEventListener('error', rejectPromise, { once: true })
})

let commandId = 0
const pending = new Map()
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.id && pending.has(message.id)) {
    const { resolve: resolvePromise, reject: rejectPromise } = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) rejectPromise(new Error(message.error.message))
    else resolvePromise(message.result ?? {})
    return
  }

  if (message.method === 'Runtime.consoleAPICalled') {
    runtimeMessages.push({
      kind: 'console',
      type: message.params.type,
      text: message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '),
    })
  }
  if (message.method === 'Runtime.exceptionThrown') {
    runtimeMessages.push({
      kind: 'exception',
      text: message.params.exceptionDetails.text,
      description: message.params.exceptionDetails.exception?.description ?? '',
    })
  }
  if (message.method === 'Log.entryAdded') {
    runtimeMessages.push({
      kind: 'log',
      level: message.params.entry.level,
      text: message.params.entry.text,
      url: message.params.entry.url,
    })
  }
})

function cdp(method, params = {}, sessionId) {
  const id = ++commandId
  const packet = { id, method, params }
  if (sessionId) packet.sessionId = sessionId
  socket.send(JSON.stringify(packet))
  return new Promise((resolvePromise, rejectPromise) => {
    pending.set(id, { resolve: resolvePromise, reject: rejectPromise })
  })
}

const { targetId } = await cdp('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await cdp('Target.attachToTarget', { targetId, flatten: true })
await cdp('Page.enable', {}, sessionId)
await cdp('Runtime.enable', {}, sessionId)
await cdp('Log.enable', {}, sessionId)

async function evaluate(expression) {
  const result = await cdp(
    'Runtime.evaluate',
    { expression, awaitPromise: true, returnByValue: true },
    sessionId,
  )
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text)
  }
  return result.result?.value
}

async function waitForPage() {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const state = await evaluate(`({
      readyState: document.readyState,
      componentReady: Boolean(document.querySelector('.lx-transfer-panel')),
    })`)
    if (state.readyState === 'complete' && state.componentReady) return state
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250))
  }
  throw new Error('LxTransferPanel did not render within 22.5 seconds')
}

async function inspect(label) {
  const state = await evaluate(`(() => {
    const component = document.querySelector('.lx-transfer-panel')
    const rect = component?.getBoundingClientRect()
    const visible = (element) => {
      const style = getComputedStyle(element)
      const box = element.getBoundingClientRect()
      return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0
    }
    return {
      title: document.title,
      readyState: document.readyState,
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      document: {
        documentElementWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > innerWidth,
      },
      component: rect ? {
        x: Math.round(rect.x), y: Math.round(rect.y),
        width: Math.round(rect.width), height: Math.round(rect.height),
        scrollWidth: Math.round(component.scrollWidth), clientWidth: Math.round(component.clientWidth),
      } : null,
      headings: [...document.querySelectorAll('.lx-transfer-panel__title')].map((el) => el.innerText.trim()),
      sourceRows: document.querySelectorAll('.lx-transfer-panel__tree .lx-virtual-tree__row').length,
      selectedRows: document.querySelectorAll('.lx-transfer-panel__selected-item').length,
      visibleButtons: [...(component?.querySelectorAll('button') ?? [])]
        .filter(visible)
        .map((button) => ({ text: button.innerText.trim(), label: button.getAttribute('aria-label'), disabled: button.disabled })),
      inputs: [...(component?.querySelectorAll('input') ?? [])]
        .filter(visible)
        .map((input) => ({ label: input.getAttribute('aria-label'), placeholder: input.placeholder, value: input.value })),
      status: document.querySelector('[data-testid="transfer-status"]')?.innerText.trim() ?? '',
      hostMessage: document.querySelector('.transfer-panel-demo__message')?.innerText.trim() ?? '',
      selectedCount: document.querySelector('[data-testid="selected-count"]')?.innerText.trim() ?? '',
    }
  })()`)
  observations.push({ label, ...state })
  return state
}

async function capture(label, width, height, mobile) {
  await cdp(
    'Emulation.setDeviceMetricsOverride',
    { width, height, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: height },
    sessionId,
  )
  await evaluate(`document.querySelector('.lx-transfer-panel')?.scrollIntoView({ block: 'start', behavior: 'instant' })`)
  await evaluate('document.fonts.ready')
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 300))
  const state = await inspect(label)
  const screenshot = await cdp(
    'Page.captureScreenshot',
    { format: 'png', fromSurface: true, captureBeyondViewport: false },
    sessionId,
  )
  const filename = `${label}.png`
  await writeFile(resolve(outputDir, filename), Buffer.from(screenshot.data, 'base64'))
  screenshots.push({ label, filename, width, height, mobile })
  return state
}

async function clickButton(label) {
  return evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) =>
      item.innerText.trim() === ${JSON.stringify(label)} || item.getAttribute('aria-label') === ${JSON.stringify(label)}
    )
    if (!button) return { found: false }
    const disabled = button.disabled
    if (!disabled) button.click()
    return { found: true, disabled, text: button.innerText.trim(), ariaLabel: button.getAttribute('aria-label') }
  })()`)
}

try {
  await cdp('Page.navigate', { url: pageUrl }, sessionId)
  await waitForPage()
  await capture('desktop-1440x960-default', 1440, 960, false)

  await evaluate(`document.querySelector('.transfer-panel-demo__settings summary')?.click()`)
  const errorActivation = await clickButton('加载失败')
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 250))
  await capture('desktop-error-state', 1440, 960, false)
  const retryActivation = await clickButton('重试')
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 250))
  const retryState = await inspect('desktop-after-error-retry')

  const filterAction = await evaluate(`(() => {
    const input = document.querySelector('input[aria-label="筛选待选节点"]')
    if (!input) return { found: false }
    input.focus()
    input.value = '待授权特勤'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    return { found: true, value: input.value }
  })()`)
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 350))
  const filteredState = await inspect('desktop-filtered-results')
  const filteredSelection = await clickButton('全选筛选结果')
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 300))
  await capture('desktop-filtered-selection-added', 1440, 960, false)

  await cdp('Page.navigate', { url: pageUrl }, sessionId)
  await waitForPage()
  await capture('mobile-375x812-default', 375, 812, true)
  await capture('mobile-320x740-default', 320, 740, true)

  const sourceSha256After = createHash('sha256')
    .update(await (await import('node:fs/promises')).readFile(sourcePath))
    .digest('hex')
    .toUpperCase()

  const evidence = {
    assessment: 'A: independent design review in dual-agent critique',
    url: pageUrl,
    browser: { product: version.Browser, protocolVersion: version['Protocol-Version'], executable: chromePath },
    method: 'Fresh headless Chromium target over Chrome DevTools Protocol; desktop and mobile viewport emulation; screenshots captured from the rendered page.',
    browserStopMethod: 'CDP Browser.close, followed by child-process termination if the browser does not exit.',
    screenshots,
    observations,
    interactions: {
      hostErrorState: errorActivation,
      retry: retryActivation,
      stateAfterRetry: retryState,
      sourceFilter: filterAction,
      filteredResults: filteredState,
      selectFilteredResults: filteredSelection,
    },
    runtimeMessages,
    sourceHash: {
      path: sourcePath,
      algorithm: 'SHA-256',
      before: sourceSha256Before,
      after: sourceSha256After,
      unchanged: sourceSha256Before === sourceSha256After,
    },
  }
  await writeFile(resolve(outputDir, 'assessment-a-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(JSON.stringify(evidence, null, 2))
} finally {
  try {
    await cdp('Browser.close')
  } catch {}
  socket.close()
  if (browser.exitCode === null) browser.kill()
  await new Promise((resolvePromise) => {
    if (browser.exitCode !== null) resolvePromise()
    else {
      const timeout = setTimeout(resolvePromise, 2500)
      browser.once('close', () => {
        clearTimeout(timeout)
        resolvePromise()
      })
    }
  })
}
