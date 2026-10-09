import { spawnSync } from 'node:child_process'
import { spawn } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import net from 'node:net'

const root = 'F:/work/linkx-admin'
const output = path.join(
  root,
  '.impeccable/critique/wave7-transferpanel-2026-10-09/assessment-b-final',
)
const browserOutput = path.join(output, 'browser')
const screenshots = path.join(browserOutput, 'screenshots')
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const liveServerScript =
  'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs'
const sourceFiles = [
  'linkx-fe/src/components/LxTransferPanel/index.vue',
  'linkx-fe/src/components/LxTransferPanel/demo/basic.vue',
]
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

fs.mkdirSync(screenshots, { recursive: true })

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const sha256 = (file) =>
  crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')

class CdpConnection {
  constructor(socket) {
    this.socket = socket
    this.nextId = 1
    this.pending = new Map()
    this.listeners = new Set()
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id)
        this.pending.delete(message.id)
        if (message.error) reject(new Error(message.error.message))
        else resolve(message.result)
      } else {
        for (const listener of this.listeners) listener(message)
      }
    })
    socket.addEventListener('close', () => {
      for (const { reject } of this.pending.values()) {
        reject(new Error('CDP WebSocket closed'))
      }
      this.pending.clear()
    })
  }

  static async connect(url) {
    const socket = new WebSocket(url)
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true })
      socket.addEventListener('error', () => reject(new Error('CDP WebSocket connection failed')), {
        once: true,
      })
    })
    return new CdpConnection(socket)
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++
    const message = { id, method, params }
    if (sessionId) message.sessionId = sessionId
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify(message))
    })
  }

  onEvent(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  close() {
    this.socket.close()
  }
}

async function getFreePort() {
  const server = net.createServer()
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const { port } = server.address()
  await new Promise((resolve) => server.close(resolve))
  return port
}

async function waitForJson(url, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs
  let lastError = null
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return await response.json()
      lastError = new Error(`HTTP ${response.status} from ${url}`)
    } catch (error) {
      lastError = error
    }
    await sleep(150)
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`)
}

const run = {
  startedAt: new Date().toISOString(),
  targetUrl,
  browser: { name: 'Google Chrome', executable: chromePath, mode: 'headless-new' },
  contextCreated: false,
  pageCreated: false,
  preflight: null,
  liveServer: { started: false, stopped: false },
  views: [],
  keyboardChecks: [],
  consoleMessages: [],
  exceptions: [],
  pageErrors: [],
  completion: 'running',
}

let browser = null
let browserContextId = null
let pageSessionId = null
let liveServerStarted = false
let livePort = null
let profileDir = null
let finalError = null

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function captureProcess(label, result, args, { redactToken = false } = {}) {
  const prefix = path.join(output, label)
  const command = `node "${liveServerScript}" ${args.join(' ')}`
  let stdout = result.stdout ?? ''
  if (redactToken) stdout = stdout.replace(/"token"\s*:\s*"[^"]*"/g, '"token":"[REDACTED]"')
  fs.writeFileSync(`${prefix}.command.txt`, `${command}\n`)
  fs.writeFileSync(`${prefix}.stdout.txt`, stdout)
  fs.writeFileSync(`${prefix}.stderr.txt`, result.stderr ?? '')
  fs.writeFileSync(`${prefix}.exit-code.txt`, `${result.status ?? 'null'}\n`)
}

async function evaluate(expression, awaitPromise = true) {
  const response = await browser.send(
    'Runtime.evaluate',
    { expression, awaitPromise, returnByValue: true, userGesture: true },
    pageSessionId,
  )
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text)
  }
  return response.result.value
}

async function waitForDemo() {
  const deadline = Date.now() + 25_000
  let lastState = null
  while (Date.now() < deadline) {
    lastState = await evaluate(`({
      readyState: document.readyState,
      title: document.title,
      demo: Boolean(document.querySelector('.transfer-panel-demo')),
      component: Boolean(document.querySelector('.lx-transfer-panel')),
      text: document.querySelector('.transfer-panel-demo')?.innerText?.slice(0, 180) ?? null
    })`)
    if (lastState.demo && lastState.component) return lastState
    await sleep(250)
  }
  throw new Error(`Demo did not mount: ${JSON.stringify(lastState)}`)
}

async function setViewport(width, height, mobile) {
  await browser.send(
    'Emulation.setDeviceMetricsOverride',
    { width, height, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: height },
    pageSessionId,
  )
  await sleep(350)
}

async function alignDemo() {
  await evaluate(`(() => {
    const demo = document.querySelector('.transfer-panel-demo')
    if (!demo) return false
    const top = demo.getBoundingClientRect().top + window.scrollY - 72
    window.scrollTo(0, Math.max(0, top))
    return true
  })()`)
  await sleep(200)
}

async function takeScreenshot(name, note) {
  await alignDemo()
  const shot = await browser.send(
    'Page.captureScreenshot',
    { format: 'png', fromSurface: true, captureBeyondViewport: false },
    pageSessionId,
  )
  const file = path.join(screenshots, name)
  fs.writeFileSync(file, Buffer.from(shot.data, 'base64'))
  run.views.push({ name, note, file: path.relative(output, file) })
}

async function snapshot(name, extra = {}) {
  const result = await evaluate(`(() => {
    const panel = document.querySelector('.lx-transfer-panel')
    const sourcePanel = document.querySelector('[id$="-source-panel"]')
    const selectedPanel = document.querySelector('[id$="-selected-panel"]')
    const preview = document.querySelector('.transfer-panel-demo__preview')
    const selectedList = document.querySelector('.lx-transfer-panel__selected')
    const longDisclosure = [...document.querySelectorAll('.lx-transfer-panel__selected-name-disclosure')]
      .find((details) => (details.querySelector('.lx-transfer-panel__selected-name-full')?.textContent?.length ?? 0) > 80)
    const longSummary = longDisclosure?.querySelector('summary')
    const longRow = longDisclosure?.closest('.lx-transfer-panel__selected-item')
    const summaryStyle = longSummary ? getComputedStyle(longSummary) : null
    const box = (element) => {
      if (!element) return null
      const rect = element.getBoundingClientRect()
      return {
        x: Math.round(rect.x * 100) / 100,
        y: Math.round(rect.y * 100) / 100,
        width: Math.round(rect.width * 100) / 100,
        height: Math.round(rect.height * 100) / 100,
        scrollHeight: element.scrollHeight,
        scrollWidth: element.scrollWidth,
        clientHeight: element.clientHeight,
        clientWidth: element.clientWidth,
      }
    }
    const selectedRows = [...document.querySelectorAll('.lx-transfer-panel__selected-item')]
      .map((row) => ({
        text: row.innerText.replace(/\\s+/g, ' ').trim().slice(0, 140),
        box: box(row),
      }))
    const doc = document.documentElement
    const style = panel ? getComputedStyle(panel) : null
    return {
      title: document.title,
      viewport: { innerWidth: window.innerWidth, innerHeight: window.innerHeight },
      document: {
        clientWidth: doc.clientWidth,
        scrollWidth: doc.scrollWidth,
        horizontalOverflowPx: Math.max(0, doc.scrollWidth - doc.clientWidth),
        scrollHeight: doc.scrollHeight,
      },
      demo: box(document.querySelector('.transfer-panel-demo')),
      preview: preview ? {
        className: preview.className,
        backgroundColor: getComputedStyle(preview).backgroundColor,
        color: getComputedStyle(preview).color,
      } : null,
      component: panel ? {
        className: panel.className,
        box: box(panel),
        computedHeight: style.height,
        cssHeightVariable: style.getPropertyValue('--lx-transfer-panel-height').trim(),
        gridTemplateColumns: style.gridTemplateColumns,
      } : null,
      sourcePanel: sourcePanel ? {
        className: sourcePanel.className,
        box: box(sourcePanel),
        display: getComputedStyle(sourcePanel).display,
      } : null,
      selectedPanel: selectedPanel ? {
        className: selectedPanel.className,
        box: box(selectedPanel),
        display: getComputedStyle(selectedPanel).display,
      } : null,
      mobileSwitcher: (() => {
        const switcher = document.querySelector('.lx-transfer-panel__mobile-switch')
        return switcher ? {
          display: getComputedStyle(switcher).display,
          sourcePressed: switcher.querySelector('[data-testid="mobile-source-panel"]')?.getAttribute('aria-pressed'),
          selectedPressed: switcher.querySelector('[data-testid="mobile-selected-panel"]')?.getAttribute('aria-pressed'),
        } : null
      })(),
      disclosure: longDisclosure ? {
        open: longDisclosure.open,
        key: longDisclosure.querySelector('.lx-transfer-panel__selected-name')?.dataset.selectedNameKey ?? null,
        nameLength: longDisclosure.querySelector('.lx-transfer-panel__selected-name-full')?.textContent?.length ?? 0,
        summaryText: longSummary?.innerText ?? null,
        summaryComputed: summaryStyle ? {
          marginTop: summaryStyle.marginTop,
          marginRight: summaryStyle.marginRight,
          marginBottom: summaryStyle.marginBottom,
          marginLeft: summaryStyle.marginLeft,
          display: summaryStyle.display,
          lineHeight: summaryStyle.lineHeight,
          minHeight: summaryStyle.minHeight,
          outlineStyle: summaryStyle.outlineStyle,
          outlineWidth: summaryStyle.outlineWidth,
        } : null,
        summaryBox: box(longSummary),
        fullTextBox: box(longDisclosure.querySelector('.lx-transfer-panel__selected-name-full')),
        rowBox: box(longRow),
      } : null,
      selectedRows,
      selectedList: box(selectedList),
      scopeActions: (() => {
        const details = document.querySelector('.lx-transfer-panel__scope-actions')
        const summary = details?.querySelector('summary')
        const content = details?.querySelector('.lx-transfer-panel__scope-action-content')
        return details ? {
          open: details.open,
          summaryText: summary?.innerText ?? null,
          summaryMargin: summary ? getComputedStyle(summary).margin : null,
          summaryBox: box(summary),
          contentBox: box(content),
          invertButtonDisabled: content?.querySelector('[aria-label="反选本树可选项"]')?.disabled ?? null,
        } : null
      })(),
      focusedElement: (() => {
        const active = document.activeElement
        return active ? {
          tagName: active.tagName,
          className: typeof active.className === 'string' ? active.className : '',
          ariaLabel: active.getAttribute('aria-label'),
          text: active.innerText?.slice(0, 80) ?? null,
        } : null
      })(),
    }
  })()`)
  const outputFile = path.join(browserOutput, `${name}.json`)
  writeJson(outputFile, { ...result, ...extra })
  return result
}

async function dispatchKey(key, code, keyCode) {
  await browser.send(
    'Input.dispatchKeyEvent',
    { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode },
    pageSessionId,
  )
  if (key === ' ') {
    await browser.send(
      'Input.dispatchKeyEvent',
      { type: 'char', key, code, text: ' ', unmodifiedText: ' ' },
      pageSessionId,
    )
  }
  await browser.send(
    'Input.dispatchKeyEvent',
    { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode },
    pageSessionId,
  )
  await sleep(180)
}

async function stopLiveServer() {
  if (!liveServerStarted) return
  const args = ['stop', '--keep-inject']
  const result = spawnSync('node', [liveServerScript, ...args], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  })
  captureProcess('live-server-stop', result, args)
  let endpointStopped = false
  if (livePort) {
    try {
      const response = await fetch(`http://127.0.0.1:${livePort}/health`, {
        signal: AbortSignal.timeout(1500),
      })
      endpointStopped = !response.ok
    } catch {
      endpointStopped = true
    }
  }
  let docsPreviewStatus = null
  try {
    const response = await fetch(targetUrl, { signal: AbortSignal.timeout(3000) })
    docsPreviewStatus = response.status
  } catch (error) {
    docsPreviewStatus = `unavailable: ${error.message}`
  }
  run.liveServer.stopped = result.status === 0 && endpointStopped
  run.liveServer.stop = {
    command: `node "${liveServerScript}" stop --keep-inject`,
    exitCode: result.status,
    stdout: result.stdout?.trim() ?? '',
    stderr: result.stderr?.trim() ?? '',
    overlayEndpointStopped: endpointStopped,
    documentationPreviewStatus: docsPreviewStatus,
  }
}

try {
  if (!fs.existsSync(chromePath)) throw new Error(`Chrome not found: ${chromePath}`)

  const port = await getFreePort()
  profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assessment-b-transferpanel-'))
  const chromeArgs = [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ]
  const chrome = spawn(chromePath, chromeArgs, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  })
  chrome.unref()

  const version = await waitForJson(`http://127.0.0.1:${port}/json/version`)
  browser = await CdpConnection.connect(version.webSocketDebuggerUrl)
  const context = await browser.send('Target.createBrowserContext', { disposeOnDetach: true })
  browserContextId = context.browserContextId
  run.contextCreated = true
  const target = await browser.send('Target.createTarget', {
    url: 'about:blank',
    browserContextId,
    background: true,
  })
  run.pageCreated = true
  const attached = await browser.send('Target.attachToTarget', {
    targetId: target.targetId,
    flatten: true,
  })
  pageSessionId = attached.sessionId
  const consoleUnsubscribe = browser.onEvent((event) => {
    if (event.sessionId !== pageSessionId) return
    if (event.method === 'Runtime.consoleAPICalled') {
      const text = (event.params.args ?? [])
        .map((arg) => arg.value ?? arg.description ?? '')
        .join(' ')
      run.consoleMessages.push({ type: event.params.type, text })
    }
    if (event.method === 'Runtime.exceptionThrown') {
      run.exceptions.push({
        text: event.params.exceptionDetails?.text ?? '',
        description: event.params.exceptionDetails?.exception?.description ?? '',
      })
    }
    if (event.method === 'Log.entryAdded') {
      const entry = event.params.entry
      run.pageErrors.push({ level: entry.level, text: entry.text, url: entry.url })
    }
  })

  await browser.send('Page.enable', {}, pageSessionId)
  await browser.send('Runtime.enable', {}, pageSessionId)
  await browser.send('Log.enable', {}, pageSessionId)
  await browser.send(
    'Emulation.setDeviceMetricsOverride',
    { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false },
    pageSessionId,
  )
  await browser.send('Page.navigate', { url: targetUrl }, pageSessionId)
  run.documentReady = await waitForDemo()

  run.preflight = await evaluate(`(() => {
    document.title = '[Human] LxTransferPanel Assessment B'
    const script = document.createElement('script')
    script.dataset.assessmentBPreflight = 'true'
    script.textContent = 'window.__assessmentBPreflight = "executed"'
    document.head.appendChild(script)
    return {
      title: document.title,
      scriptAppended: document.head.contains(script),
      marker: window.__assessmentBPreflight ?? null,
      mutableInjectionAvailable: document.head.contains(script) && window.__assessmentBPreflight === 'executed',
    }
  })()`)
  writeJson(path.join(browserOutput, 'injection-preflight.json'), run.preflight)
  if (!run.preflight.mutableInjectionAvailable) {
    run.completion = 'preflight-failed; live-server and overlay skipped'
    throw new Error('Mutable injection preflight failed; live overlay was not started')
  }

  const startArgs = ['--background']
  const start = spawnSync('node', [liveServerScript, ...startArgs], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  })
  captureProcess('live-server-start', start, startArgs, { redactToken: true })
  run.liveServer.startExitCode = start.status
  if (start.status !== 0) {
    throw new Error(`live-server start failed: ${(start.stderr ?? '').trim()}`)
  }
  const liveInfo = JSON.parse((start.stdout ?? '').trim())
  livePort = liveInfo.port
  liveServerStarted = true
  run.liveServer.started = true
  run.liveServer.start = {
    command: `node "${liveServerScript}" --background`,
    exitCode: start.status,
    pid: liveInfo.pid,
    port: liveInfo.port,
    baseUrl: `http://localhost:${liveInfo.port}`,
    tokenRedacted: true,
  }

  const injection = await evaluate(`(() => new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = ${JSON.stringify(`http://localhost:${livePort}/detect.js`)}
    script.dataset.assessmentBDetector = 'true'
    script.onload = () => resolve({ loaded: true, src: script.src, present: document.head.contains(script) })
    script.onerror = () => resolve({ loaded: false, src: script.src, present: document.head.contains(script) })
    document.head.appendChild(script)
    setTimeout(() => resolve({ loaded: false, timeout: true, src: script.src, present: document.head.contains(script) }), 6000)
  }))()`)
  run.overlayInjection = injection
  await sleep(2800)
  run.overlayEvidence = await evaluate(`({
    detectorScript: [...document.scripts].some((script) => script.dataset.assessmentBDetector === 'true'),
    loadedScriptEntries: performance.getEntriesByType('resource').filter((entry) => entry.name.includes('/detect.js')).map((entry) => ({ name: entry.name, duration: Math.round(entry.duration), transferSize: entry.transferSize })),
    overlayNodes: document.querySelectorAll('[data-impeccable], [id*="impeccable"], [class*="impeccable"]').length,
    title: document.title,
  })`)
  run.liveServer.healthBeforeStop = await fetch(`http://127.0.0.1:${livePort}/health`)
    .then((response) => ({ status: response.status, ok: response.ok }))
    .catch((error) => ({ error: error.message }))

  await setViewport(1440, 1050, false)
  run.desktopDefault = await snapshot('desktop-default', { state: 'desktop-default' })
  await takeScreenshot('01-desktop-default-overlay.png', '桌面默认状态；面板默认高度应为 300px')

  const keyboardOpen = await evaluate(`(() => {
    const details = [...document.querySelectorAll('.lx-transfer-panel__selected-name-disclosure')]
      .find((item) => (item.querySelector('.lx-transfer-panel__selected-name-full')?.textContent?.length ?? 0) > 80)
    const summary = details?.querySelector('summary')
    if (!details || !summary) return { found: false }
    details.open = false
    summary.focus()
    return { found: true, beforeOpen: details.open, focused: document.activeElement === summary }
  })()`)
  if (keyboardOpen.found) {
    await dispatchKey(' ', 'Space', 32)
    const keyboardResult = await evaluate(`(() => {
      const details = [...document.querySelectorAll('.lx-transfer-panel__selected-name-disclosure')]
        .find((item) => (item.querySelector('.lx-transfer-panel__selected-name-full')?.textContent?.length ?? 0) > 80)
      return { open: details?.open ?? false, focused: document.activeElement === details?.querySelector('summary'), activeText: document.activeElement?.innerText ?? null }
    })()`)
    run.keyboardChecks.push({ control: '超长已选名称 disclosure', key: 'Space', before: keyboardOpen, after: keyboardResult })
    if (!keyboardResult.open) {
      await evaluate(`(() => {
        const details = [...document.querySelectorAll('.lx-transfer-panel__selected-name-disclosure')]
          .find((item) => (item.querySelector('.lx-transfer-panel__selected-name-full')?.textContent?.length ?? 0) > 80)
        if (details) details.open = true
      })()`)
    }
  } else {
    run.keyboardChecks.push({ control: '超长已选名称 disclosure', key: 'Space', found: false })
  }
  run.longNameExpanded = await snapshot('long-name-expanded', { state: 'long-name-expanded-by-keyboard' })
  await takeScreenshot('02-long-name-expanded.png', '超长已选名称 disclosure 展开')

  const scopeFocus = await evaluate(`(() => {
    const details = document.querySelector('.lx-transfer-panel__scope-actions')
    const summary = details?.querySelector('summary')
    if (!details || !summary) return { found: false }
    const longDisclosure = [...document.querySelectorAll('.lx-transfer-panel__selected-name-disclosure')]
      .find((item) => (item.querySelector('.lx-transfer-panel__selected-name-full')?.textContent?.length ?? 0) > 80)
    if (longDisclosure) longDisclosure.open = false
    details.open = false
    summary.focus()
    return { found: true, beforeOpen: details.open, focused: document.activeElement === summary }
  })()`)
  if (scopeFocus.found) {
    await dispatchKey('Enter', 'Enter', 13)
    const scopeResult = await evaluate(`(() => {
      const details = document.querySelector('.lx-transfer-panel__scope-actions')
      return { open: details?.open ?? false, focused: document.activeElement === details?.querySelector('summary') }
    })()`)
    run.keyboardChecks.push({ control: '更多反选选项 disclosure', key: 'Enter', before: scopeFocus, after: scopeResult })
    if (!scopeResult.open) {
      await evaluate(`(() => { const item = document.querySelector('.lx-transfer-panel__scope-actions'); if (item) item.open = true })()`)
    }
  } else {
    run.keyboardChecks.push({ control: '更多反选选项 disclosure', key: 'Enter', found: false })
  }
  run.reverseOptionsExpanded = await snapshot('reverse-options-expanded', { state: 'more-reverse-options-expanded' })
  await takeScreenshot('03-more-reverse-options-expanded.png', '更多反选选项 disclosure 展开')

  await evaluate(`(() => {
    const scope = document.querySelector('.lx-transfer-panel__scope-actions')
    if (scope) scope.open = false
    const settings = document.querySelector('.transfer-panel-demo__settings')
    if (!settings?.open) settings?.querySelector('summary')?.click()
    const label = [...(settings?.querySelectorAll('label') ?? [])].find((item) => item.innerText.includes('HUD 深色主题'))
    const checkbox = label?.querySelector('input[type="checkbox"]')
    if (checkbox && !checkbox.checked) checkbox.click()
  })()`)
  await sleep(300)
  run.hudDark = await snapshot('hud-dark', { state: 'HUD-dark-theme' })
  await takeScreenshot('04-hud-dark-theme.png', 'HUD 深色主题代表状态')

  await setViewport(390, 844, true)
  await evaluate(`(() => {
    const settings = document.querySelector('.transfer-panel-demo__settings')
    if (settings?.open) settings.open = false
    const label = [...(settings?.querySelectorAll('label') ?? [])].find((item) => item.innerText.includes('HUD 深色主题'))
    const checkbox = label?.querySelector('input[type="checkbox"]')
    if (checkbox?.checked) checkbox.click()
    const mobileSelected = document.querySelector('[data-testid="mobile-selected-panel"]')
    mobileSelected?.click()
    const longDisclosure = [...document.querySelectorAll('.lx-transfer-panel__selected-name-disclosure')]
      .find((item) => (item.querySelector('.lx-transfer-panel__selected-name-full')?.textContent?.length ?? 0) > 80)
    if (longDisclosure) longDisclosure.open = true
  })()`)
  await sleep(300)
  run.mobile390 = await snapshot('mobile-390-selected-expanded', { state: '390px-selected-panel-long-name-expanded' })
  await takeScreenshot('05-mobile-390-selected-panel.png', '390px 窄屏，切到已选面板并展开超长名称')

  const consoleFiltered = run.consoleMessages.filter((message) => /impeccable/i.test(message.text))
  run.consoleImpeccable = consoleFiltered
  run.completion = 'captured'
  consoleUnsubscribe()
} catch (error) {
  finalError = error
  run.completion = `failed: ${error.message}`
} finally {
  try {
    await stopLiveServer()
  } catch (error) {
    run.liveServer.stopError = error.message
  }

  if (browser) {
    try {
      if (browserContextId) await browser.send('Target.disposeBrowserContext', { browserContextId })
      await browser.send('Browser.close')
    } catch {}
    browser.close()
  }
  if (profileDir) {
    try {
      const tempRoot = path.resolve(os.tmpdir())
      const resolvedProfile = path.resolve(profileDir)
      if (
        path.dirname(resolvedProfile) !== tempRoot ||
        !path.basename(resolvedProfile).startsWith('assessment-b-transferpanel-')
      ) {
        throw new Error(`Refusing to remove unexpected browser profile path: ${resolvedProfile}`)
      }
      fs.rmSync(resolvedProfile, { recursive: true, force: true })
    } catch (error) {
      run.browserProfileCleanupError = error.message
    }
  }

  run.finishedAt = new Date().toISOString()
  run.sourceSha256AtEnd = Object.fromEntries(sourceFiles.map((file) => [file, sha256(file)]))
  writeJson(path.join(browserOutput, 'browser-evidence.json'), run)
  fs.writeFileSync(
    path.join(output, 'source-sha256-after.json'),
    `${JSON.stringify({ finishedAt: run.finishedAt, files: run.sourceSha256AtEnd }, null, 2)}\n`,
  )
  if (finalError) fs.writeFileSync(path.join(browserOutput, 'browser-error.txt'), `${finalError.stack ?? finalError.message}\n`)
}

if (finalError) {
  process.stderr.write(`${finalError.stack ?? finalError.message}\n`)
  process.exitCode = 1
} else {
  process.stdout.write(`Browser evidence captured; live server stopped=${run.liveServer.stopped}; documentation preview=${run.liveServer.stop?.documentationPreviewStatus ?? 'not checked'}\n`)
}
