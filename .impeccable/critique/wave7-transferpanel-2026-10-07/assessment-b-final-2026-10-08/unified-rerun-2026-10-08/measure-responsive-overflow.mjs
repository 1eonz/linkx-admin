import { spawn, spawnSync } from 'node:child_process'
import { mkdir, open, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const outDir = path.resolve(process.argv[2])
const repoRoot = process.cwd()
const docsPort = 8421
const overlayPort = 9356
const debugPort = 9357
const baseUrl = `http://127.0.0.1:${docsPort}`
const overlayUrl = `http://127.0.0.1:${overlayPort}`
const nodeExe = process.execPath
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const vitepressScript = path.join(repoRoot, 'linkx-fe', 'node_modules', 'vitepress', 'bin', 'vitepress.js')
const liveScript = 'C:\\Users\\Administrator\\.codex\\skills\\impeccable\\scripts\\live-server.mjs'
const overlayRoot = path.join(outDir, 'overflow-measure-overlay-root')
const profileDir = path.join(outDir, `overflow-measure-edge-profile-${process.pid}`)

await mkdir(outDir, { recursive: true })
await mkdir(overlayRoot, { recursive: true })

function delayHandle(filePath) {
  return open(filePath, 'w')
}

async function waitFor(predicate, label, timeoutMs = 25000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await predicate()) return
    await delay(250)
  }
  throw new Error(`等待超时：${label}`)
}

async function jsonResponse(url, init) {
  const response = await fetch(url, init)
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`)
  return response.json()
}

class CDPClient {
  constructor(socket) {
    this.socket = socket
    this.nextId = 0
    this.pending = new Map()
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data))
      if (!message.id) return
      const pending = this.pending.get(message.id)
      if (!pending) return
      this.pending.delete(message.id)
      if (message.error) pending.reject(new Error(message.error.message))
      else pending.resolve(message.result)
    })
  }

  static async connect(url) {
    const socket = new WebSocket(url)
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP WebSocket 连接超时')), 10000)
      socket.addEventListener('open', () => { clearTimeout(timer); resolve() }, { once: true })
      socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP WebSocket 连接失败')) }, { once: true })
    })
    return new CDPClient(socket)
  }

  send(method, params = {}) {
    const id = ++this.nextId
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`CDP 请求超时：${method}`))
      }, 15000)
      this.pending.set(id, {
        resolve: (value) => { clearTimeout(timer); resolve(value) },
        reject: (error) => { clearTimeout(timer); reject(error) },
      })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  close() { this.socket.close() }
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || '浏览器表达式执行失败')
  return result.result?.value
}

async function metrics(client) {
  return evaluate(client, `(() => {
    const box = (element) => {
      if (!element) return null;
      const r = element.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    };
    const visible = (element) => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const r = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    };
    const tables = [...document.querySelectorAll('.vp-doc table')].map((element, index) => ({
      index,
      rect: box(element),
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      overflowX: getComputedStyle(element).overflowX,
    }));
    const codeBlocks = [...document.querySelectorAll('.vp-doc div[class*="language-"]')].map((element, index) => ({
      index,
      className: element.className,
      visible: visible(element),
      rect: box(element),
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      overflowX: getComputedStyle(element).overflowX,
    }));
    const html = document.documentElement;
    const body = document.body;
    const docs = document.querySelector('.vp-doc');
    const demo = document.querySelector('.transfer-panel-demo, .virtual-tree-demo');
    const overflowCandidates = [...document.querySelectorAll('body *')].map((element) => {
      const r = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        tag: element.tagName,
        className: typeof element.className === 'string' ? element.className : '',
        id: element.id || null,
        x: r.x,
        right: r.right,
        width: r.width,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        overflowX: style.overflowX,
        position: style.position,
        visible: visible(element),
      };
    }).filter((item) => item.visible && (item.right > html.clientWidth + 1 || item.scrollWidth > item.clientWidth + 1))
      .sort((a, b) => b.right - a.right)
      .slice(0, 20);
    return {
      viewport: {
        configuredCssWidth: innerWidth,
        documentClientWidth: html.clientWidth,
        visualViewportWidth: visualViewport?.width ?? null,
        devicePixelRatio,
        height: innerHeight,
      },
      documentElement: { clientWidth: html.clientWidth, scrollWidth: html.scrollWidth, overflowX: getComputedStyle(html).overflowX },
      body: { clientWidth: body.clientWidth, scrollWidth: body.scrollWidth, overflowX: getComputedStyle(body).overflowX },
      vpDoc: { rect: box(docs), clientWidth: docs?.clientWidth ?? null, scrollWidth: docs?.scrollWidth ?? null },
      demo: { rect: box(demo), clientWidth: demo?.clientWidth ?? null, scrollWidth: demo?.scrollWidth ?? null },
      tables,
      codeBlocks,
      overflowCandidates,
    };
  })()`)
}

async function measurePage(browserPort, spec) {
  const target = await jsonResponse(`http://127.0.0.1:${browserPort}/json/new?about:blank`, { method: 'PUT' })
  const client = await CDPClient.connect(target.webSocketDebuggerUrl)
  await client.send('Page.enable')
  await client.send('Runtime.enable')
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: spec.width,
    height: 812,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: spec.width,
    screenHeight: 812,
  })
  await client.send('Page.navigate', { url: `${baseUrl}${spec.route}` })
  await waitFor(() => evaluate(client, `Boolean(document.querySelector(${JSON.stringify(spec.selector)}))`), spec.name)
  await evaluate(client, `(() => {
    for (const details of document.querySelectorAll('.vp-doc details')) {
      if (details.querySelector('div[class*="language-"]')) details.open = true;
    }
    return true;
  })()`)
  await delay(250)
  const beforeInjection = await metrics(client)
  const injection = await evaluate(client, `(() => new Promise((resolve, reject) => {
    document.title = '[Overflow supplement] ' + document.title;
    const script = document.createElement('script');
    script.src = ${JSON.stringify(`${overlayUrl}/detect.js`)};
    script.dataset.assessmentBMeasure = ${JSON.stringify(spec.name)};
    script.onload = () => resolve({ loaded: true, src: script.src });
    script.onerror = () => reject(new Error('overlay script load failed'));
    document.head.appendChild(script);
  }))()`)
  await delay(2600)
  const afterInjection = await metrics(client)
  const overlayRects = await evaluate(client, `(() => [...document.querySelectorAll('.impeccable-overlay, .impeccable-label')].map((element) => {
    const r = element.getBoundingClientRect();
    return { className: element.className, text: (element.innerText || '').trim(), x: r.x, right: r.right, width: r.width, height: r.height };
  }))()`)
  client.close()
  return {
    name: spec.name,
    route: `${baseUrl}${spec.route}`,
    targetId: target.id,
    cdpSettings: { width: spec.width, height: 812, deviceScaleFactor: 1, mobile: true },
    codeDetailsExpandedForMeasurement: true,
    overlayInjection: injection,
    beforeInjection,
    afterInjection,
    overlayGeometry: {
      elementCount: overlayRects.length,
      maximumRight: Math.max(0, ...overlayRects.map((item) => item.right)),
      beyondDocumentClientWidth: overlayRects.filter((item) => item.right > afterInjection.documentElement.clientWidth + 1).length,
    },
    overlayDelta: {
      documentClientWidth: afterInjection.documentElement.clientWidth - beforeInjection.documentElement.clientWidth,
      documentScrollWidth: afterInjection.documentElement.scrollWidth - beforeInjection.documentElement.scrollWidth,
      bodyScrollWidth: afterInjection.body.scrollWidth - beforeInjection.body.scrollWidth,
      vpDocClientWidth: afterInjection.vpDoc.clientWidth - beforeInjection.vpDoc.clientWidth,
      vpDocScrollWidth: afterInjection.vpDoc.scrollWidth - beforeInjection.vpDoc.scrollWidth,
      tableWidthsStable: JSON.stringify(beforeInjection.tables.map((item) => [item.clientWidth, item.scrollWidth])) === JSON.stringify(afterInjection.tables.map((item) => [item.clientWidth, item.scrollWidth])),
      codeBlockWidthsStable: JSON.stringify(beforeInjection.codeBlocks.map((item) => [item.clientWidth, item.scrollWidth])) === JSON.stringify(afterInjection.codeBlocks.map((item) => [item.clientWidth, item.scrollWidth])),
    },
  }
}

const docsStdoutPath = path.join(outDir, 'overflow-supplement-vitepress.stdout.log')
const docsStderrPath = path.join(outDir, 'overflow-supplement-vitepress.stderr.log')
const docsStdout = await delayHandle(docsStdoutPath)
const docsStderr = await delayHandle(docsStderrPath)
const vitepress = spawn(nodeExe, [vitepressScript, 'dev', 'docs', '--host', '127.0.0.1', '--port', String(docsPort), '--strictPort'], {
  cwd: path.join(repoRoot, 'linkx-fe'),
  stdio: ['ignore', docsStdout.fd, docsStderr.fd],
  windowsHide: true,
})
await docsStdout.close()
await docsStderr.close()

const result = {
  scope: '只读补充尺寸测量；不重复 detector 或业务状态交互',
  services: {
    vitepress: { pid: vitepress.pid, port: docsPort, command: `node "${vitepressScript}" dev docs --host 127.0.0.1 --port ${docsPort} --strictPort`, stopMethod: `taskkill /PID ${vitepress.pid} /T /F` },
    overlay: null,
  },
  pages: [],
  errors: [],
  cleanup: { attempted: false, browserStopped: false, overlayStopped: false, vitepressStopped: false, profileRemoved: false, overlayRootRemoved: false, portsClosed: false },
}

let browser
let overlayInfo
try {
  await waitFor(async () => {
    try { return (await fetch(`${baseUrl}/components/lxtransferpanel.html`)).ok } catch { return false }
  }, 'VitePress', 30000)
  const start = spawnSync(nodeExe, [liveScript, '--background', `--port=${overlayPort}`], {
    cwd: overlayRoot,
    encoding: 'utf8',
    timeout: 20000,
  })
  const startLines = start.stdout.trim().split(/\r?\n/).filter(Boolean)
  overlayInfo = JSON.parse(startLines.at(-1) || '{}')
  if (start.status !== 0 || !overlayInfo.pid || !overlayInfo.port) throw new Error(`overlay startup failed (${start.status}): ${start.stderr}`)
  result.services.overlay = { pid: overlayInfo.pid, port: overlayInfo.port, detectorUrl: `${overlayUrl}/detect.js`, command: `node "${liveScript}" --background --port=${overlayPort}`, workingDirectory: overlayRoot, stopMethod: `node "${liveScript}" stop` }
  await waitFor(async () => {
    try { return (await fetch(`${overlayUrl}/detect.js`)).ok } catch { return false }
  }, 'detector overlay server')

  await mkdir(profileDir, { recursive: true })
  browser = spawn(edgePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ], { stdio: 'ignore', windowsHide: true })
  result.browser = { pid: browser.pid, executable: edgePath, debugPort, mode: '独立 Edge CDP' }
  await waitFor(async () => {
    try { return (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).ok } catch { return false }
  }, 'Edge CDP endpoint')

  const specs = [
    { name: 'transferpanel-375', width: 375, route: '/components/lxtransferpanel.html', selector: '.transfer-panel-demo' },
    { name: 'transferpanel-320', width: 320, route: '/components/lxtransferpanel.html', selector: '.transfer-panel-demo' },
    { name: 'virtualtree-375', width: 375, route: '/components/lxvirtualtree.html', selector: '.virtual-tree-demo' },
    { name: 'virtualtree-320', width: 320, route: '/components/lxvirtualtree.html', selector: '.virtual-tree-demo' },
  ]
  for (const spec of specs) result.pages.push(await measurePage(debugPort, spec))
} catch (error) {
  result.errors.push(String(error?.stack || error))
  throw error
} finally {
  result.cleanup.attempted = true
  if (browser?.pid) {
    spawnSync('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true })
    result.cleanup.browserStopped = true
  }
  if (overlayInfo?.pid) {
    const stopped = spawnSync(nodeExe, [liveScript, 'stop'], { cwd: overlayRoot, encoding: 'utf8', timeout: 20000 })
    result.cleanup.overlayStopStatus = stopped.status
    result.cleanup.overlayStopStdout = stopped.stdout.trim()
    result.cleanup.overlayStopStderr = stopped.stderr.trim()
    result.cleanup.overlayStopped = true
  }
  if (vitepress.pid) {
    spawnSync('taskkill', ['/PID', String(vitepress.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true })
    result.cleanup.vitepressStopped = true
  }
  await delay(400)
  result.cleanup.portsClosed = true
  for (const port of [docsPort, overlayPort, debugPort]) {
    try {
      await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(250) })
      result.cleanup.portsClosed = false
    } catch {}
  }
  for (const directory of [profileDir, overlayRoot]) {
    const resolved = path.resolve(directory)
    if (!resolved.startsWith(`${outDir}${path.sep}`)) throw new Error(`拒绝清理证据目录外路径：${resolved}`)
    await rm(resolved, { recursive: true, force: true, maxRetries: 6, retryDelay: 300 })
  }
  result.cleanup.profileRemoved = true
  result.cleanup.overlayRootRemoved = true
  await writeFile(path.join(outDir, 'overflow-dimensions-supplement.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8')
}

process.stdout.write(JSON.stringify({ pages: result.pages.length, errors: result.errors, cleanup: result.cleanup }))
