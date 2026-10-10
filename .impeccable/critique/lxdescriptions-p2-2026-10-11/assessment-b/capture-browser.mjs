import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

const evidenceDir = path.resolve(
  process.argv[2] ??
    '.impeccable/critique/lxdescriptions-p2-2026-10-11/assessment-b',
)
const route = 'http://127.0.0.1:4174/components/lxdescriptions'
const edgePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const profileDir = fs.mkdtempSync(
  path.join(os.tmpdir(), 'lxdesc-assessment-b-'),
)
const record = {
  route,
  browser: 'Microsoft Edge headless via CDP',
  freshProfile: true,
  temporaryProfilePath: profileDir,
  reducedMotion: 'reduce',
  injection: { attempted: false, success: false },
  consoleMessages: [],
  pageMessages: [],
  states: [],
}

class DevTools {
  constructor(url) {
    this.socket = new WebSocket(url)
    this.nextId = 1
    this.pending = new Map()
    this.listeners = new Map()
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true })
      this.socket.addEventListener(
        'error',
        () => reject(new Error('CDP websocket failed to open')),
        { once: true },
      )
    })
    this.socket.addEventListener('message', (event) => this.receive(event))
    this.socket.addEventListener('close', () => {
      for (const { reject } of this.pending.values()) {
        reject(new Error('CDP websocket closed'))
      }
      this.pending.clear()
    })
  }

  receive(event) {
    let message
    try {
      message = JSON.parse(String(event.data))
    } catch {
      return
    }
    if (message.id) {
      const pending = this.pending.get(message.id)
      if (!pending) return
      clearTimeout(pending.timer)
      this.pending.delete(message.id)
      if (message.error) {
        pending.reject(new Error(message.error.message))
      } else {
        pending.resolve(message.result ?? {})
      }
      return
    }
    for (const listener of this.listeners.get(message.method) ?? []) {
      listener(message.params ?? {})
    }
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? []
    listeners.push(listener)
    this.listeners.set(method, listeners)
  }

  send(method, params = {}) {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`CDP timeout: ${method}`))
      }, 20000)
      this.pending.set(id, { resolve, reject, timer })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  close() {
    if (this.socket.readyState === WebSocket.OPEN) this.socket.close()
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function evaluate(devtools, expression, awaitPromise = false) {
  const response = await devtools.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true,
  })
  if (response.exceptionDetails) {
    throw new Error(
      response.exceptionDetails.exception?.description ??
        response.exceptionDetails.text,
    )
  }
  return response.result?.value
}

async function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null) return true
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeoutMs)
    child.once('exit', () => {
      clearTimeout(timer)
      resolve(true)
    })
  })
}

async function stopStartedBrowser(child) {
  if (!child || child.exitCode !== null) return true
  try {
    await waitForExit(child, 3000)
  } catch {
    // The browser may already be closing after Browser.close.
  }
  if (child.exitCode !== null) return true
  const killer = spawn(
    'taskkill.exe',
    ['/PID', String(child.pid), '/T', '/F'],
    { stdio: 'ignore', windowsHide: true },
  )
  await new Promise((resolve) => killer.once('exit', resolve))
  await waitForExit(child, 3000)
  return child.exitCode !== null
}

async function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : null
      server.close((error) => {
        if (error) reject(error)
        else if (port) resolve(port)
        else reject(new Error('Could not reserve a local CDP port'))
      })
    })
  })
}

let browserProcess
let browserDevTools
let pageDevTools

try {
  if (!fs.existsSync(edgePath)) throw new Error(`Edge not found at ${edgePath}`)

  const cdpPort = await reservePort()

  browserProcess = spawn(
    edgePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-sync',
      '--remote-debugging-address=127.0.0.1',
      `--remote-debugging-port=${cdpPort}`,
      '--remote-allow-origins=*',
      `--user-data-dir=${profileDir}`,
      'about:blank',
    ],
    { stdio: 'ignore', windowsHide: true },
  )
  record.browserPid = browserProcess.pid

  let port
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${cdpPort}/json/version`)
      if (response.ok) {
        port = cdpPort
        break
      }
    } catch {
      // Edge may need several hundred milliseconds to bind its DevTools port.
    }
    if (browserProcess.exitCode !== null) {
      throw new Error(`Edge exited during startup: ${browserProcess.exitCode}`)
    }
    await sleep(200)
  }
  if (!port) throw new Error('Timed out waiting for Edge DevToolsActivePort')

  const devtoolsBase = `http://127.0.0.1:${port}`
  const version = await (await fetch(`${devtoolsBase}/json/version`)).json()
  record.browserVersion = version.Browser
  record.protocol = 'Chrome DevTools Protocol'
  browserDevTools = new DevTools(version.webSocketDebuggerUrl)
  await browserDevTools.connect()

  const { targetId } = await browserDevTools.send('Target.createTarget', {
    url: 'about:blank',
  })
  let pageTarget
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const targets = await (await fetch(`${devtoolsBase}/json/list`)).json()
    pageTarget = targets.find((target) => target.id === targetId)
    if (pageTarget?.webSocketDebuggerUrl) break
    await sleep(100)
  }
  if (!pageTarget?.webSocketDebuggerUrl) {
    throw new Error('Could not resolve the new Edge page target')
  }

  pageDevTools = new DevTools(pageTarget.webSocketDebuggerUrl)
  await pageDevTools.connect()
  pageDevTools.on('Runtime.consoleAPICalled', (event) => {
    record.consoleMessages.push({
      type: event.type,
      args: (event.args ?? []).map((arg) =>
        String(arg.value ?? arg.description ?? arg.type).slice(0, 1600),
      ),
    })
  })
  pageDevTools.on('Runtime.exceptionThrown', (event) => {
    record.consoleMessages.push({
      type: 'exception',
      text: event.exceptionDetails?.text ?? 'Unknown page exception',
      description: event.exceptionDetails?.exception?.description,
    })
  })

  await pageDevTools.send('Page.enable')
  await pageDevTools.send('Runtime.enable')
  await pageDevTools.send('Log.enable')
  pageDevTools.on('Log.entryAdded', (event) => {
    record.consoleMessages.push({
      type: `log:${event.entry.level}`,
      text: String(event.entry.text ?? '').slice(0, 1600),
    })
  })

  const setViewport = async (width, height, colorScheme) => {
    await pageDevTools.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await pageDevTools.send('Emulation.setEmulatedMedia', {
      media: 'screen',
      features: [
        { name: 'prefers-color-scheme', value: colorScheme },
        { name: 'prefers-reduced-motion', value: 'reduce' },
      ],
    })
  }

  await setViewport(1440, 1000, 'light')
  const loadEvent = new Promise((resolve) => {
    pageDevTools.on('Page.loadEventFired', resolve)
  })
  await pageDevTools.send('Page.navigate', { url: route })
  await Promise.race([loadEvent, sleep(20000)])
  const ready = await evaluate(
    pageDevTools,
    `new Promise((resolve) => {
      const deadline = Date.now() + 20000;
      const check = () => {
        if (document.querySelector('.lx-descriptions-demo')) {
          Promise.resolve(document.fonts?.ready).then(() => resolve(true));
        } else if (Date.now() >= deadline) {
          resolve(false);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    })`,
    true,
  )
  record.pageReady = ready
  record.pageTitle = await evaluate(pageDevTools, 'document.title')
  record.pageHasDescriptions = await evaluate(
    pageDevTools,
    `Boolean(document.querySelector('.lx-descriptions-demo .lx-descriptions'))`,
  )
  if (!ready) {
    record.pageText = await evaluate(
      pageDevTools,
      'document.body?.innerText?.slice(0, 1200) ?? ""',
    )
    throw new Error('The rendered docs route did not expose the descriptions demo')
  }

  record.mutableInjectionPreflight = await evaluate(
    pageDevTools,
    `(() => {
      const previousTitle = document.title;
      document.title = previousTitle + ' [assessment-b-preflight]';
      const probe = document.createElement('script');
      probe.textContent = 'window.__lxdescAssessmentBProbe = "executed"';
      document.head.appendChild(probe);
      const result = {
        titleChanged: document.title.endsWith('[assessment-b-preflight]'),
        inlineScriptExecuted: window.__lxdescAssessmentBProbe === 'executed',
        scriptConnected: probe.isConnected,
      };
      probe.remove();
      delete window.__lxdescAssessmentBProbe;
      document.title = previousTitle;
      return result;
    })()`,
  )

  record.injection.attempted = true
  const liveBase = process.env.IMPECCABLE_LIVE_URL
  if (!liveBase) throw new Error('IMPECCABLE_LIVE_URL is required for overlay injection')
  record.injection.scriptUrl = `${liveBase.replace(/\/$/, '')}/detect.js`
  const scriptResult = await evaluate(
    pageDevTools,
    `new Promise((resolve) => {
      const bag = { messages: [], load: null };
      window.__lxdescAssessmentBResults = bag;
      window.addEventListener('message', (event) => {
        if (event.source === window && event.data &&
            ['impeccable-results', 'impeccable-ready', 'impeccable-error'].includes(event.data.source)) {
          bag.messages.push(event.data);
        }
      });
      const script = document.createElement('script');
      script.src = ${JSON.stringify(record.injection.scriptUrl)};
      script.addEventListener('load', () => {
        bag.load = { success: true };
        setTimeout(() => resolve(bag.load), 2600);
      }, { once: true });
      script.addEventListener('error', () => {
        bag.load = { success: false, reason: 'script error event' };
        resolve(bag.load);
      }, { once: true });
      setTimeout(() => {
        if (!bag.load) {
          bag.load = { success: false, reason: 'script load timeout' };
          resolve(bag.load);
        }
      }, 15000);
      document.head.appendChild(script);
    })`,
    true,
  )
  record.injection.success = scriptResult?.success === true
  record.injection.result = scriptResult
  record.pageMessages = await evaluate(
    pageDevTools,
    'window.__lxdescAssessmentBResults?.messages ?? []',
  )
  record.injection.overlayElementCount = await evaluate(
    pageDevTools,
    'document.querySelectorAll(".impeccable-overlay").length',
  )
  record.injection.detectResultCount = record.pageMessages
    .filter((message) => message.source === 'impeccable-results')
    .at(-1)?.count

  const setHudTheme = async (enabled) => {
    return evaluate(
      pageDevTools,
      `(() => {
        const label = [...document.querySelectorAll('.lx-descriptions-demo__toggle')]
          .find((item) => item.textContent.includes('HUD 深色主题'));
        const input = label?.querySelector('input[type="checkbox"]');
        if (!input) return { found: false };
        if (input.checked !== ${JSON.stringify(enabled)}) input.click();
        return {
          found: true,
          checked: input.checked,
          dark: document.documentElement.classList.contains('dark'),
          hud: document.documentElement.classList.contains('lx-theme-hud'),
        };
      })()`,
    )
  }

  const capture = async (name, width, height, colorScheme, hud) => {
    await setViewport(width, height, colorScheme)
    record.states.push({ name, hudToggle: await setHudTheme(hud) })
    await sleep(250)
    await evaluate(
      pageDevTools,
      'window.scrollTo(0, 0); new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
      true,
    )
    await sleep(250)
    const conditions = await evaluate(
      pageDevTools,
      `(() => ({
        title: document.title,
        viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
        media: {
          colorSchemeDark: matchMedia('(prefers-color-scheme: dark)').matches,
          reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        },
        htmlClasses: [...document.documentElement.classList],
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        demoWidth: document.querySelector('.lx-descriptions-demo')?.getBoundingClientRect().width ?? null,
        overlayElements: document.querySelectorAll('.impeccable-overlay').length,
        visibleOverlayElements: [...document.querySelectorAll('.impeccable-overlay')]
          .filter((node) => getComputedStyle(node).display !== 'none').length,
      }))()`,
    )
    const screenshot = await pageDevTools.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false,
    })
    const fileName = `${name}.png`
    fs.writeFileSync(path.join(evidenceDir, fileName), Buffer.from(screenshot.data, 'base64'))
    record.states.at(-1).conditions = conditions
    record.states.at(-1).screenshot = fileName
  }

  await capture('desktop-light-overlay', 1440, 1000, 'light', false)
  await capture('desktop-hud-dark-overlay', 1440, 1000, 'dark', true)
  await capture('narrow-light-overlay', 390, 844, 'light', false)
} catch (error) {
  record.error = error instanceof Error ? error.stack ?? error.message : String(error)
} finally {
  pageDevTools?.close()
  try {
    if (browserDevTools && browserProcess?.exitCode === null) {
      await browserDevTools.send('Browser.close')
    }
  } catch {
    // The browser may close the CDP socket before acknowledging the command.
  }
  browserDevTools?.close()
  record.browserStopped = await stopStartedBrowser(browserProcess)

  const tempRoot = path.resolve(os.tmpdir())
  if (
    path.dirname(path.resolve(profileDir)) === tempRoot &&
    path.basename(profileDir).startsWith('lxdesc-assessment-b-')
  ) {
    try {
      fs.rmSync(profileDir, { recursive: true, force: true })
      record.temporaryProfileCleaned = true
    } catch (error) {
      record.temporaryProfileCleaned = false
      record.profileCleanupError = String(error)
    }
  } else {
    record.temporaryProfileCleaned = false
    record.profileCleanupError = 'Safety check rejected the temporary profile path'
  }

  fs.mkdirSync(evidenceDir, { recursive: true })
  fs.writeFileSync(
    path.join(evidenceDir, 'browser-conditions.json'),
    `${JSON.stringify(record, null, 2)}\n`,
  )
}

if (record.error || !record.injection.success || !record.browserStopped) {
  process.exitCode = 1
}
