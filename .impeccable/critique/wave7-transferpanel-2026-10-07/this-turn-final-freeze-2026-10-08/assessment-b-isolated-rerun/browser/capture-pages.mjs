import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { once } from 'node:events'
import net from 'node:net'
import path from 'node:path'

const outputDir = path.resolve(process.argv[2])
const overlayUrl = process.argv[3]
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const targets = [
  {
    slug: 'transferpanel',
    url: 'http://127.0.0.1:4174/components/lxtransferpanel.html',
    demoSelector: '.transfer-panel-demo',
  },
  {
    slug: 'virtualtree',
    url: 'http://127.0.0.1:4174/components/lxvirtualtree.html',
    demoSelector: '.virtual-tree-demo',
  },
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function availablePort() {
  const server = net.createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const { port } = server.address()
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  return port
}

async function waitForJson(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs
  let lastError = 'not ready'
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return await response.json()
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = error.message
    }
    await sleep(150)
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError}`)
}

class CDPClient {
  constructor(socket) {
    this.socket = socket
    this.sequence = 0
    this.pending = new Map()
    this.handlers = new Set()
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(typeof event.data === 'string' ? event.data : Buffer.from(event.data).toString())
      if (message.id) {
        const pending = this.pending.get(message.id)
        if (!pending) return
        clearTimeout(pending.timeout)
        this.pending.delete(message.id)
        if (message.error) pending.reject(new Error(message.error.message))
        else pending.resolve(message.result ?? {})
        return
      }
      for (const handler of this.handlers) handler(message)
    })
  }

  onMessage(handler) {
    this.handlers.add(handler)
  }

  send(method, params = {}, sessionId) {
    const id = ++this.sequence
    const message = { id, method, params }
    if (sessionId) message.sessionId = sessionId
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`Timed out waiting for CDP ${method}`))
      }, 20000)
      this.pending.set(id, { resolve, reject, timeout })
      this.socket.send(JSON.stringify(message))
    })
  }

  async close() {
    if (this.socket.readyState === WebSocket.CLOSED) return
    this.socket.close()
    await new Promise((resolve) => {
      if (this.socket.readyState === WebSocket.CLOSED) resolve()
      else this.socket.addEventListener('close', resolve, { once: true })
    })
  }
}

async function connectCdp(url) {
  const socket = new WebSocket(url)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  return new CDPClient(socket)
}

async function evaluate(client, sessionId, expression, awaitPromise = true) {
  const response = await client.send(
    'Runtime.evaluate',
    { expression, awaitPromise, returnByValue: true, userGesture: true },
    sessionId,
  )
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text || 'Runtime.evaluate failed')
  }
  return response.result?.value
}

async function waitForDemo(client, sessionId, selector) {
  const expression = `Boolean(document.querySelector(${JSON.stringify(selector)}))`
  const deadline = Date.now() + 20000
  while (Date.now() < deadline) {
    if (await evaluate(client, sessionId, expression)) return
    await sleep(200)
  }
  throw new Error(`Timed out waiting for rendered demo ${selector}`)
}

async function setViewport(client, sessionId, width, height, mobile) {
  await client.send(
    'Emulation.setDeviceMetricsOverride',
    { width, height, deviceScaleFactor: 1, mobile, screenOrientation: { type: 'portraitPrimary', angle: 0 } },
    sessionId,
  )
}

async function setHudTheme(client, sessionId, selector, dark) {
  const expression = `(() => {
    const demo = document.querySelector(${JSON.stringify(selector)});
    const details = demo?.querySelector('details');
    if (details) details.open = true;
    const label = [...(demo?.querySelectorAll('label') ?? [])].find((item) => item.textContent.includes('HUD 深色主题'));
    const input = label?.querySelector('input[type="checkbox"]');
    if (!input) return { found: false, hud: demo?.classList.contains('lx-theme-hud') ?? false };
    if (input.checked !== ${dark}) input.click();
    return { found: true, checked: input.checked, hud: demo.classList.contains('lx-theme-hud') };
  })()`
  const result = await evaluate(client, sessionId, expression)
  await sleep(250)
  return evaluate(client, sessionId, `(() => {
    const demo = document.querySelector(${JSON.stringify(selector)});
    const input = [...(demo?.querySelectorAll('label') ?? [])].find((item) => item.textContent.includes('HUD 深色主题'))?.querySelector('input[type="checkbox"]');
    return { found: Boolean(input), checked: input?.checked ?? false, hud: demo?.classList.contains('lx-theme-hud') ?? false };
  })()`)
}

async function measure(client, sessionId, demoSelector) {
  return evaluate(client, sessionId, `(() => {
    const metric = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        rectWidth: Math.round(rect.width * 100) / 100,
        left: Math.round(rect.left * 100) / 100,
        right: Math.round(rect.right * 100) / 100,
      };
    };
    const demo = document.querySelector(${JSON.stringify(demoSelector)});
    const viewportWidth = document.documentElement.clientWidth;
    const documentWidth = document.documentElement.scrollWidth;
    const bodyWidth = document.body.scrollWidth;
    const overlayNodes = [...document.querySelectorAll('[id*="impeccable" i], [class*="impeccable" i]')].map((element) => ({
      tag: element.tagName.toLowerCase(),
      id: element.id || null,
      className: typeof element.className === 'string' ? element.className : null,
      position: getComputedStyle(element).position,
      rect: (() => { const rect = element.getBoundingClientRect(); return { left: Math.round(rect.left), top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) }; })(),
    })).slice(0, 30);
    return {
      viewportWidth,
      viewportHeight: document.documentElement.clientHeight,
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: documentWidth,
      bodyClientWidth: document.body.clientWidth,
      bodyScrollWidth: bodyWidth,
      viewportOverflowPx: Math.max(documentWidth - viewportWidth, bodyWidth - document.body.clientWidth, 0),
      demo: metric(${JSON.stringify(demoSelector)}),
      doc: metric('.VPDoc'),
      docContent: metric('.vp-doc'),
      hudTheme: demo?.classList.contains('lx-theme-hud') ?? false,
      overlayNodes,
    };
  })()`)
}

async function preflight(client, sessionId) {
  return evaluate(client, sessionId, `(() => {
    const originalTitle = document.title;
    document.title = 'Assessment B DOM preflight';
    const script = document.createElement('script');
    script.dataset.assessmentBPreflight = 'true';
    script.textContent = 'window.__assessmentBPreflight = "loaded"';
    document.head.appendChild(script);
    const result = {
      titleMutation: document.title === 'Assessment B DOM preflight',
      scriptAppended: script.isConnected,
      scriptExecuted: window.__assessmentBPreflight === 'loaded',
    };
    script.remove();
    delete window.__assessmentBPreflight;
    document.title = originalTitle;
    result.titleRestored = document.title === originalTitle;
    return result;
  })()`)
}

async function injectOverlay(client, sessionId, url) {
  const expression = `(async () => new Promise((resolve) => {
    const script = document.createElement('script');
    script.dataset.assessmentBOverlay = 'true';
    script.src = ${JSON.stringify(url)};
    const timer = setTimeout(() => resolve({ loaded: false, error: 'load timeout', src: script.src }), 12000);
    script.onload = () => { clearTimeout(timer); resolve({ loaded: true, src: script.src }); };
    script.onerror = () => { clearTimeout(timer); resolve({ loaded: false, error: 'script load error', src: script.src }); };
    document.head.appendChild(script);
  }))()`
  return evaluate(client, sessionId, expression)
}

function valueText(remoteObject) {
  if (remoteObject.value !== undefined) return String(remoteObject.value)
  return remoteObject.description ?? remoteObject.type ?? ''
}

async function main() {
  await mkdir(path.join(outputDir, 'screenshots'), { recursive: true })
  const port = await availablePort()
  const profileDir = path.join(outputDir, 'edge-profile')
  await mkdir(profileDir, { recursive: true })
  const edgeStdout = createWriteStream(path.join(outputDir, 'edge.stdout.txt'))
  const edgeStderr = createWriteStream(path.join(outputDir, 'edge.stderr.txt'))
  const edgeArgs = [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    '--remote-allow-origins=*',
    '--remote-debugging-address=127.0.0.1',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ]
  const command = `"${edgePath}" ${edgeArgs.map((arg) => `"${arg}"`).join(' ')}`
  await writeFile(path.join(outputDir, 'edge.command.txt'), command, 'utf8')
  const edge = spawn(edgePath, edgeArgs, { stdio: ['ignore', edgeStdout, edgeStderr], windowsHide: true })
  let browserClient
  const contexts = []
  const records = []

  try {
    const version = await waitForJson(`http://127.0.0.1:${port}/json/version`)
    browserClient = await connectCdp(version.webSocketDebuggerUrl)
    for (const target of targets) {
      const { browserContextId } = await browserClient.send('Target.createBrowserContext', { disposeOnDetach: true })
      contexts.push(browserContextId)
      const { targetId } = await browserClient.send('Target.createTarget', { url: 'about:blank', browserContextId })
      const { sessionId } = await browserClient.send('Target.attachToTarget', { targetId, flatten: true })
      const consoleLog = []
      browserClient.onMessage((message) => {
        if (message.sessionId !== sessionId) return
        if (message.method === 'Runtime.consoleAPICalled') {
          consoleLog.push({
            kind: message.params.type,
            text: message.params.args.map(valueText).join(' '),
            timestamp: message.params.timestamp,
          })
        } else if (message.method === 'Runtime.exceptionThrown') {
          consoleLog.push({ kind: 'exception', text: message.params.exceptionDetails?.text ?? 'exception' })
        } else if (message.method === 'Log.entryAdded') {
          consoleLog.push({ kind: message.params.entry.level, text: message.params.entry.text })
        }
      })
      await browserClient.send('Page.enable', {}, sessionId)
      await browserClient.send('Runtime.enable', {}, sessionId)
      await browserClient.send('Log.enable', {}, sessionId)
      await browserClient.send('Network.enable', {}, sessionId)
      const states = [
        { viewport: 'desktop', width: 1440, height: 1000, mobile: false, theme: 'light', dark: false },
        { viewport: 'desktop', width: 1440, height: 1000, mobile: false, theme: 'hud-dark', dark: true },
        { viewport: 'mobile', width: 390, height: 844, mobile: true, theme: 'light', dark: false },
        { viewport: 'mobile', width: 390, height: 844, mobile: true, theme: 'hud-dark', dark: true },
      ]

      for (const state of states) {
        await setViewport(browserClient, sessionId, state.width, state.height, state.mobile)
        await browserClient.send('Page.navigate', { url: target.url }, sessionId)
        await waitForDemo(browserClient, sessionId, target.demoSelector)
        const hud = await setHudTheme(browserClient, sessionId, target.demoSelector, state.dark)
        const preflightResult = await preflight(browserClient, sessionId)
        const beforeOverlay = await measure(browserClient, sessionId, target.demoSelector)
        const logStart = consoleLog.length
        const overlay = await injectOverlay(browserClient, sessionId, overlayUrl)
        await sleep(2500)
        const afterOverlay = await measure(browserClient, sessionId, target.demoSelector)
        const pageText = await evaluate(browserClient, sessionId, `document.querySelector('.VPDoc')?.innerText?.slice(0, 1800) ?? ''`)
        const screenshotPath = path.join(outputDir, 'screenshots', `${target.slug}-${state.viewport}-${state.theme}.png`)
        const screenshot = await browserClient.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: true }, sessionId)
        await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'))
        const consoleEntries = consoleLog.slice(logStart)
        records.push({
          target: target.url,
          contextId: browserContextId,
          targetId,
          state: { viewport: state.viewport, width: state.width, height: state.height, theme: state.theme },
          hudControl: hud,
          preflight: preflightResult,
          overlay,
          widthMetrics: { beforeOverlay, afterOverlay },
          overlayGrowthPx: afterOverlay.viewportOverflowPx - beforeOverlay.viewportOverflowPx,
          console: consoleEntries,
          pageText,
          screenshot: path.relative(outputDir, screenshotPath).replaceAll('\\', '/'),
        })
        console.log(`${target.slug} ${state.viewport} ${state.theme}: overlay=${overlay.loaded}, preflight=${preflightResult.scriptExecuted}, overflow=${beforeOverlay.viewportOverflowPx}->${afterOverlay.viewportOverflowPx}`)
      }
      await browserClient.send('Target.disposeBrowserContext', { browserContextId })
      contexts.splice(contexts.indexOf(browserContextId), 1)
    }
    await writeFile(path.join(outputDir, 'browser-evidence.json'), JSON.stringify({ browser: version.Browser, websocketPort: port, overlayUrl, records }, null, 2), 'utf8')
  } finally {
    if (browserClient) {
      for (const browserContextId of contexts) {
        try { await browserClient.send('Target.disposeBrowserContext', { browserContextId }) } catch {}
      }
      try { await browserClient.send('Browser.close') } catch {}
      await browserClient.close().catch(() => {})
    }
    if (edge.exitCode === null) {
      await Promise.race([once(edge, 'exit'), sleep(5000)])
    }
    if (edge.exitCode === null) {
      spawn('taskkill.exe', ['/T', '/F', '/PID', String(edge.pid)], { stdio: 'ignore', windowsHide: true })
    }
    edgeStdout.end()
    edgeStderr.end()
  }
}

main().catch((error) => {
  console.error(error.stack || error.message)
  process.exitCode = 1
})
