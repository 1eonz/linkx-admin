import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const outputDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(outputDirectory, '../../../..')
const appRoot = resolve(repositoryRoot, 'linkx-fe')
const pageUrl = 'http://127.0.0.1:4174/components/lxicons.html'
const liveServerPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs'
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const title = '[Human] LxIcon motion assessment B'

mkdirSync(outputDirectory, { recursive: true })

const writeJson = (file, value) =>
  writeFileSync(resolve(outputDirectory, file), `${JSON.stringify(value, null, 2)}\n`)
const writeText = (file, value) => writeFileSync(resolve(outputDirectory, file), `${value}\n`)

class CdpConnection {
  constructor(url) {
    this.socket = new WebSocket(url)
    this.nextId = 1
    this.pending = new Map()
    this.listeners = new Map()
    this.ready = new Promise((resolveReady, rejectReady) => {
      this.socket.addEventListener('open', resolveReady, { once: true })
      this.socket.addEventListener('error', rejectReady, { once: true })
    })
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data))
      if (message.id) {
        const pending = this.pending.get(message.id)
        if (!pending) return
        this.pending.delete(message.id)
        if (message.error) pending.reject(new Error(message.error.message))
        else pending.resolve(message.result ?? {})
        return
      }
      for (const listener of this.listeners.get(message.method) ?? []) {
        listener(message.params ?? {}, message.sessionId)
      }
    })
  }

  async send(method, params = {}, sessionId) {
    await this.ready
    const id = this.nextId++
    const request = { id, method, params }
    if (sessionId) request.sessionId = sessionId
    const response = new Promise((resolveResponse, rejectResponse) => {
      this.pending.set(id, { resolve: resolveResponse, reject: rejectResponse })
    })
    this.socket.send(JSON.stringify(request))
    return response
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? []
    listeners.push(listener)
    this.listeners.set(method, listeners)
  }

  close() {
    this.socket.close()
  }
}

async function freePort() {
  const net = await import('node:net')
  return new Promise((resolvePort, rejectPort) => {
    const server = net.createServer()
    server.once('error', rejectPort)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() => resolvePort(address.port))
    })
  })
}

async function waitForJson(url, timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return response.json()
    } catch {
      await delay(100)
    }
  }
  throw new Error(`Timed out waiting for ${url}`)
}

let liveInfo
let chromeProcess
let browserProfile
let cdp
let sessionId
const evidence = {
  pageUrl,
  browserContext: 'new CDP BrowserContext created with Target.createBrowserContext',
  title,
  viewportThemeViews: [],
  interactionStates: {},
  reducedMotion: {},
  overlayViews: [],
  console: [],
  pageExceptions: [],
  screenshots: [],
}

async function evaluate(expression) {
  const response = await cdp.send(
    'Runtime.evaluate',
    { expression, returnByValue: true, awaitPromise: true, userGesture: true },
    sessionId,
  )
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text)
  }
  return response.result?.value
}

async function setViewport(width, height = 900) {
  await cdp.send(
    'Emulation.setDeviceMetricsOverride',
    {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width <= 500,
      screenWidth: width,
      screenHeight: height,
      ...(width <= 500 ? { screenOrientation: { angle: 0, type: 'portraitPrimary' } } : {}),
    },
    sessionId,
  )
  await delay(150)
}

async function setMotionAndScheme(reducedMotion, scheme) {
  await cdp.send(
    'Emulation.setEmulatedMedia',
    {
      features: [
        { name: 'prefers-color-scheme', value: scheme },
        { name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' },
      ],
    },
    sessionId,
  )
}

async function setTheme(theme) {
  const className = theme === 'hud'
    ? "root.classList.remove('light'); root.classList.add('dark', 'lx-theme-hud')"
    : "root.classList.remove('dark', 'lx-theme-hud'); root.classList.add('light')"
  await evaluate(`(() => { const root = document.documentElement; ${className}; window.scrollTo(0, 0); })()`)
  await delay(200)
}

async function collectPageMetrics() {
  return evaluate(`(() => {
    const root = document.documentElement;
    const body = document.body;
    const rootStyle = getComputedStyle(root);
    const overflowNodes = [...document.querySelectorAll('body *')]
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return style.display !== 'none' && style.position !== 'fixed'
          && (rect.left < -1 || rect.right > window.innerWidth + 1);
      })
      .slice(0, 16)
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          className: typeof el.className === 'string' ? el.className.slice(0, 140) : '',
          id: el.id || '',
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
        };
      });
    return {
      title: document.title,
      viewport: { width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio },
      htmlClass: root.className,
      bodyBackground: getComputedStyle(body).backgroundColor,
      pageBackground: rootStyle.backgroundColor,
      iconCardBackground: rootStyle.getPropertyValue('--lx-bg-card').trim(),
      iconTextColor: rootStyle.getPropertyValue('--lx-text-primary').trim(),
      iconTileCount: document.querySelectorAll('.icon-tile').length,
      documentWidth: root.scrollWidth,
      bodyWidth: body.scrollWidth,
      hasHorizontalOverflow: root.scrollWidth > window.innerWidth + 1 || body.scrollWidth > window.innerWidth + 1,
      overflowNodes,
    };
  })()`)
}

async function captureScreenshot(name) {
  const { data } = await cdp.send(
    'Page.captureScreenshot',
    { format: 'png', fromSurface: true, captureBeyondViewport: false },
    sessionId,
  )
  const file = `${name}.png`
  writeFileSync(resolve(outputDirectory, file), Buffer.from(data, 'base64'))
  evidence.screenshots.push(file)
}

async function iconState(name) {
  return evaluate(`(() => {
    const svg = document.querySelector('svg[data-icon-name="${name}"]');
    if (!svg) return { found: false };
    const style = getComputedStyle(svg);
    return {
      found: true,
      name: svg.getAttribute('data-icon-name'),
      className: svg.getAttribute('class'),
      animationName: style.animationName,
      animationDuration: style.animationDuration,
      animationPlayState: style.animationPlayState,
      transform: style.transform,
      filter: style.filter,
      transitionDuration: style.transitionDuration,
      focusVisible: svg.matches(':focus-visible') || Boolean(svg.closest('button')?.matches(':focus-visible')),
      animations: svg.getAnimations().map((animation) => ({
        name: animation.animationName || animation.id,
        playState: animation.playState,
        currentTime: animation.currentTime,
        duration: animation.effect?.getTiming()?.duration,
      })),
    };
  })()`)
}

async function scrollToIcon(name) {
  return evaluate(`(() => {
    const svg = document.querySelector('svg[data-icon-name="${name}"]');
    if (!svg) return null;
    svg.scrollIntoView({ block: 'center', behavior: 'instant' });
    const rect = svg.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`)
}

async function moveMouse(x, y) {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, pointerType: 'mouse' }, sessionId)
}

async function hoverIcon(name, waitMs = 90) {
  const point = await scrollToIcon(name)
  if (!point) throw new Error(`Icon tile not found: ${name}`)
  await moveMouse(point.x, point.y)
  await delay(waitMs)
  return point
}

async function pressTab() {
  await cdp.send('Input.dispatchKeyEvent', {
    type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9,
  }, sessionId)
  await cdp.send('Input.dispatchKeyEvent', {
    type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9,
  }, sessionId)
}

async function collectOverlayView(name, width, theme, media = 'no-preference', interaction = 'none') {
  await setViewport(width)
  await setMotionAndScheme(media === 'reduce', theme === 'hud' ? 'dark' : 'light')
  await setTheme(theme)
  await moveMouse(1, 1)
  if (interaction === 'warning-hover') {
    await hoverIcon('warning')
  } else if (interaction === 'keyboard-focus-email') {
    await evaluate("document.querySelector('.icon-search')?.focus()")
    let tabCount = 0
    let focusedName = null
    while (tabCount < 130 && focusedName !== 'email') {
      await pressTab()
      tabCount += 1
      focusedName = await evaluate("document.activeElement?.querySelector('svg[data-icon-name]')?.getAttribute('data-icon-name') ?? null")
    }
    evidence.keyboardOverlayFocus = { tabCount, focusedName, state: await iconState('email') }
  }
  const scanResultCount = await evaluate(
    "(() => { if (typeof window.impeccableScan !== 'function') return null; return window.impeccableScan().length; })()",
  )
  await delay(500)
  const findings = await evaluate(
    "typeof window.impeccableDetect === 'function' ? window.impeccableDetect() : null",
  )
  const firstTarget = await evaluate(`(() => {
    const node = [...document.querySelectorAll('.impeccable-overlay')].find((item) => item._targetEl);
    if (!node) return null;
    node._targetEl.scrollIntoView({ block: 'center', behavior: 'instant' });
    return node._targetEl.getAttribute('data-icon-name')
      || node._targetEl.className
      || node._targetEl.tagName.toLowerCase();
  })()`)
  if (firstTarget) await delay(250)
  const overlays = await evaluate(`(() => [...document.querySelectorAll(
    '.impeccable-overlay, .impeccable-label, .impeccable-banner, .impeccable-tooltip'
  )].map((node) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return {
      className: node.className,
      text: (node.innerText || node.textContent || '').trim().slice(0, 240),
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      target: node._targetEl?.getAttribute('data-icon-name')
        || node._targetEl?.className
        || null,
    };
  }))()`)
  await captureScreenshot(`overlay-${name}`)
  const metrics = await collectPageMetrics()
  evidence.overlayViews.push({
    name,
    viewport: width,
    theme,
    reducedMotion: media === 'reduce',
    interaction,
    scanResultCount,
    findings,
    overlayCount: overlays.length,
    overlays,
    firstOverlayTarget: firstTarget,
    hasVisibleOverlay: overlays.some((node) => node.display !== 'none' && node.visibility !== 'hidden' && Number(node.opacity) > 0),
    hasHorizontalOverflow: metrics.hasHorizontalOverflow,
    documentWidth: metrics.documentWidth,
    viewportWidth: metrics.viewport.width,
  })
  await evaluate('window.scrollTo(0, 0)')
}

const detectorCommand = `node "${liveServerPath}" --background --target "${appRoot}"`
writeText('live-server-start.command.txt', detectorCommand)
const serverStart = spawnSync(
  process.execPath,
  [liveServerPath, '--background', '--target', appRoot],
  { cwd: repositoryRoot, windowsHide: true, maxBuffer: 1024 * 1024 },
)
writeFileSync(resolve(outputDirectory, 'live-server-start.stderr.txt'), serverStart.stderr ?? Buffer.alloc(0))
writeText('live-server-start.exit-code.txt', String(serverStart.status ?? 'null'))
const serverStdout = (serverStart.stdout ?? Buffer.alloc(0)).toString('utf8')
let serverJson
try {
  serverJson = JSON.parse(serverStdout.trim().split(/\r?\n/).filter(Boolean).at(-1))
} catch {
  serverJson = null
}
writeJson('live-server-start.stdout.redacted.json', {
  rawStdoutWasValidJson: serverJson !== null,
  ...(serverJson ? { pid: serverJson.pid, port: serverJson.port, token: '[redacted]' } : { stdout: serverStdout }),
})
if (serverStart.error || serverStart.status !== 0 || !serverJson?.port) {
  throw new Error(`Impeccable live-server failed to start: ${serverStart.error?.message ?? serverStdout}`)
}
liveInfo = { port: serverJson.port, pid: serverJson.pid }

const browserPort = await freePort()
browserProfile = mkdtempSync(join(tmpdir(), 'lxicon-assessment-b-'))
writeText(
  'browser-command.txt',
  `"${chromePath}" --headless=new --remote-debugging-port=${browserPort} --user-data-dir="[temporary isolated profile]" --no-first-run --disable-default-apps`,
)
chromeProcess = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${browserPort}`,
  '--remote-allow-origins=*',
  `--user-data-dir=${browserProfile}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-default-apps',
  '--disable-extensions',
  '--window-size=1280,900',
], { stdio: 'ignore', windowsHide: true })

try {
  const browserVersion = await waitForJson(`http://127.0.0.1:${browserPort}/json/version`)
  cdp = new CdpConnection(browserVersion.webSocketDebuggerUrl)
  await cdp.ready
  const context = await cdp.send('Target.createBrowserContext', { disposeOnDetach: true })
  evidence.browserContextId = context.browserContextId
  const target = await cdp.send('Target.createTarget', { url: 'about:blank', browserContextId: context.browserContextId })
  const attached = await cdp.send('Target.attachToTarget', { targetId: target.targetId, flatten: true })
  sessionId = attached.sessionId
  cdp.on('Runtime.consoleAPICalled', (event, eventSession) => {
    if (eventSession !== sessionId) return
    evidence.console.push({
      type: event.type,
      args: (event.args ?? []).map((arg) => arg.value ?? arg.description ?? arg.type ?? '').map(String),
      timestamp: event.timestamp,
    })
  })
  cdp.on('Runtime.exceptionThrown', (event, eventSession) => {
    if (eventSession === sessionId) {
      evidence.pageExceptions.push(event.exceptionDetails?.exception?.description ?? event.exceptionDetails?.text ?? 'unknown exception')
    }
  })
  await cdp.send('Page.enable', {}, sessionId)
  await cdp.send('Runtime.enable', {}, sessionId)
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 900, deviceScaleFactor: 1, mobile: false, screenWidth: 1280, screenHeight: 900,
  }, sessionId)
  await setMotionAndScheme(false, 'light')
  await cdp.send('Page.navigate', { url: pageUrl }, sessionId)

  const deadline = Date.now() + 60000
  while (Date.now() < deadline) {
    const ready = await evaluate("document.readyState === 'complete' && document.querySelectorAll('.icon-tile').length > 0")
    if (ready) break
    await delay(250)
  }
  await evaluate(`document.title = ${JSON.stringify(title)}`)
  evidence.pageReady = await evaluate("({ readyState: document.readyState, title: document.title, url: location.href })")

  const viewSpecs = [
    { name: 'desktop-1280-light', width: 1280, theme: 'light' },
    { name: 'desktop-1280-hud', width: 1280, theme: 'hud' },
    { name: 'mobile-375-light', width: 375, theme: 'light' },
    { name: 'mobile-375-hud', width: 375, theme: 'hud' },
  ]
  for (const view of viewSpecs) {
    await setViewport(view.width)
    await setMotionAndScheme(false, view.theme === 'hud' ? 'dark' : 'light')
    await setTheme(view.theme)
    const metrics = await collectPageMetrics()
    await captureScreenshot(view.name)
    evidence.viewportThemeViews.push({ name: view.name, theme: view.theme, ...metrics })
  }

  await setViewport(1280)
  await setMotionAndScheme(false, 'light')
  await setTheme('light')
  await moveMouse(1, 1)
  const loadingPoint = await scrollToIcon('loading')
  await delay(100)
  const loadingBefore = await iconState('loading')
  await captureScreenshot('motion-loading-running')
  await delay(240)
  const loadingAfter = await iconState('loading')
  evidence.interactionStates.loading = {
    point: loadingPoint,
    before: loadingBefore,
    after: loadingAfter,
    transformChanged: loadingBefore.transform !== loadingAfter.transform,
  }

  await hoverIcon('warning')
  evidence.interactionStates.warningHover = { immediate: await iconState('warning') }
  await captureScreenshot('motion-warning-hover')
  await delay(650)
  evidence.interactionStates.warningHover.afterAnimation = await iconState('warning')

  await hoverIcon('email')
  evidence.interactionStates.emailHover = { immediate: await iconState('email') }
  await captureScreenshot('motion-email-hover')
  await delay(650)
  evidence.interactionStates.emailHover.afterAnimation = await iconState('email')

  await moveMouse(1, 1)
  await evaluate("document.querySelector('.icon-search')?.focus()")
  let emailTabCount = 0
  let focusedName = null
  while (emailTabCount < 130 && focusedName !== 'email') {
    await pressTab()
    emailTabCount += 1
    focusedName = await evaluate("document.activeElement?.querySelector('svg[data-icon-name]')?.getAttribute('data-icon-name') ?? null")
  }
  evidence.interactionStates.keyboardFocusEmail = {
    tabCount: emailTabCount,
    focusedName,
    state: await iconState('email'),
    activeElement: await evaluate("({ tag: document.activeElement?.tagName, ariaLabel: document.activeElement?.getAttribute('aria-label'), focusVisible: document.activeElement?.matches(':focus-visible') })"),
  }
  await captureScreenshot('interaction-keyboard-focus-email')

  for (const view of viewSpecs) {
    await setViewport(view.width)
    await setMotionAndScheme(false, view.theme === 'hud' ? 'dark' : 'light')
    await setTheme(view.theme)
  }
  await setViewport(1280)
  await setMotionAndScheme(true, 'light')
  await setTheme('light')
  await moveMouse(1, 1)
  await scrollToIcon('loading')
  await delay(200)
  evidence.reducedMotion.loading = await iconState('loading')
  await hoverIcon('warning')
  evidence.reducedMotion.warningHover = await iconState('warning')
  await captureScreenshot('reduced-motion-warning-hover')
  await hoverIcon('email')
  evidence.reducedMotion.emailHover = await iconState('email')
  evidence.reducedMotion.preferenceMatched = await evaluate(
    "matchMedia('(prefers-reduced-motion: reduce)').matches",
  )

  await setMotionAndScheme(false, 'light')
  await setTheme('light')
  await evaluate(`document.title = ${JSON.stringify(title)}; window.scrollTo(0, 0)`)
  evidence.injectionPreflight = await evaluate(`(() => {
    const marker = document.createElement('script');
    marker.textContent = 'window.__assessmentBMutationPreflight = true;';
    document.head.appendChild(marker);
    return { title: document.title, scriptAttached: marker.isConnected, executed: window.__assessmentBMutationPreflight === true };
  })()`)
  evidence.detectorScript = await evaluate(`new Promise((resolveLoad) => {
    const script = document.createElement('script');
    script.src = 'http://127.0.0.1:${liveInfo.port}/detect.js';
    script.onload = () => resolveLoad({ loaded: true, src: script.src, scriptAttached: script.isConnected });
    script.onerror = () => resolveLoad({ loaded: false, src: script.src, scriptAttached: script.isConnected });
    document.head.appendChild(script);
    setTimeout(() => resolveLoad({ loaded: false, timedOut: true, src: script.src, scriptAttached: script.isConnected }), 8000);
  })`)
  if (evidence.detectorScript.loaded) {
    await delay(3000)
    const overlayViewSpecs = [
      { name: 'desktop-1280-light', width: 1280, theme: 'light' },
      { name: 'desktop-1280-hud', width: 1280, theme: 'hud' },
      { name: 'mobile-375-light', width: 375, theme: 'light' },
      { name: 'mobile-375-hud', width: 375, theme: 'hud' },
    ]
    for (const view of overlayViewSpecs) {
      await collectOverlayView(view.name, view.width, view.theme)
    }
    await collectOverlayView('reduced-motion-warning-hover', 1280, 'light', 'reduce', 'warning-hover')
    await setMotionAndScheme(false, 'light')
    await collectOverlayView('warning-hover', 1280, 'light', 'no-preference', 'warning-hover')
    await collectOverlayView('keyboard-focus-email', 1280, 'light', 'no-preference', 'keyboard-focus-email')
    evidence.overlayInjectionSucceeded = evidence.injectionPreflight.scriptAttached
      && evidence.injectionPreflight.executed
      && evidence.detectorScript.loaded
    evidence.finalDetectorFindings = await evaluate(
      "typeof window.impeccableDetect === 'function' ? window.impeccableDetect() : null",
    )
    evidence.finalDetectorFindingsCount = Array.isArray(evidence.finalDetectorFindings)
      ? evidence.finalDetectorFindings.length
      : null
  }

  await setViewport(1280)
  await setMotionAndScheme(false, 'light')
  await setTheme('light')
  await evaluate('window.scrollTo(0, 0)')
  evidence.finalPageMetrics = await collectPageMetrics()
  evidence.consoleImpeccable = evidence.console.filter((entry) =>
    entry.args.some((arg) => arg.toLowerCase().includes('impeccable')),
  )
  writeJson('browser-console.json', evidence.console)
  writeJson('browser-evidence.json', evidence)
} catch (error) {
  evidence.error = error.stack ?? String(error)
  writeJson('browser-evidence.json', evidence)
  throw error
} finally {
  if (cdp && liveInfo) {
    try {
      await cdp.send('Target.disposeBrowserContext', { browserContextId: evidence.browserContextId })
    } catch {
      // Context disposal can fail after a browser-side crash; Browser.close remains the fallback.
    }
    try { await cdp.send('Browser.close') } catch { /* browser may already be gone */ }
    cdp.close()
  }
  if (chromeProcess && chromeProcess.exitCode === null) {
    await Promise.race([
      new Promise((resolveExit) => chromeProcess.once('exit', resolveExit)),
      delay(3000),
    ])
    if (chromeProcess.exitCode === null) chromeProcess.kill()
  }
  if (browserProfile?.startsWith(join(tmpdir(), 'lxicon-assessment-b-'))) {
    rmSync(browserProfile, { recursive: true, force: true })
  }
  if (liveInfo) {
    const stopCommand = `node "${liveServerPath}" stop --keep-inject --target "${appRoot}"`
    writeText('live-server-stop.command.txt', stopCommand)
    const stopped = spawnSync(
      process.execPath,
      [liveServerPath, 'stop', '--keep-inject', '--target', appRoot],
      { cwd: repositoryRoot, windowsHide: true, maxBuffer: 1024 * 1024 },
    )
    writeFileSync(resolve(outputDirectory, 'live-server-stop.stdout.txt'), stopped.stdout ?? Buffer.alloc(0))
    writeFileSync(resolve(outputDirectory, 'live-server-stop.stderr.txt'), stopped.stderr ?? Buffer.alloc(0))
    writeText('live-server-stop.exit-code.txt', String(stopped.status ?? 'null'))
  }
}

console.log(JSON.stringify({
  viewportThemeViews: evidence.viewportThemeViews,
  interactionStates: evidence.interactionStates,
  reducedMotion: evidence.reducedMotion,
  detectorScript: evidence.detectorScript,
  overlayViews: evidence.overlayViews.map((view) => ({
    name: view.name,
    scanResultCount: view.scanResultCount,
    overlayCount: view.overlayCount,
    hasVisibleOverlay: view.hasVisibleOverlay,
    hasHorizontalOverflow: view.hasHorizontalOverflow,
  })),
  consoleImpeccable: evidence.consoleImpeccable,
  screenshots: evidence.screenshots,
}, null, 2))
