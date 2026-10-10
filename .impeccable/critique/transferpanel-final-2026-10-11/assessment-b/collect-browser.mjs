import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const evidenceDir = path.dirname(fileURLToPath(import.meta.url))
const mode = process.argv[2]
const port = Number(process.argv[3])
const livePort = Number(process.argv[4])
const pageUrl = 'http://127.0.0.1:43620/components/lxtransferpanel'
const debugUrl = `http://127.0.0.1:${port}`

if (!['preflight', 'overlay', 'close'].includes(mode) || !Number.isInteger(port)) {
  throw new Error('Usage: node collect-browser.mjs <preflight|overlay|close> <debug-port>')
}
if (mode === 'overlay' && !Number.isInteger(livePort)) {
  throw new Error('Overlay mode requires the Impeccable live-server port as the fourth argument')
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const writeJson = (name, value) =>
  fs.writeFileSync(path.join(evidenceDir, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8')
const getJson = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`)
  return response.json()
}

async function connect(url) {
  const socket = new WebSocket(url)
  const pending = new Map()
  const events = []
  let nextId = 0
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data))
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) reject(new Error(`${message.error.message} (${message.error.code})`))
      else resolve(message.result || {})
      return
    }
    events.push(message)
  })
  return {
    events,
    call(method, params = {}) {
      const id = ++nextId
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject })
        socket.send(JSON.stringify({ id, method, params }))
      })
    },
    close() {
      socket.close()
    },
  }
}

async function evaluate(cdp, expression, options = {}) {
  const response = await cdp.call('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
    ...options,
  })
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text)
  }
  return response.result?.value
}

async function getTarget(targetId) {
  const deadline = Date.now() + 10000
  while (Date.now() < deadline) {
    const targets = await getJson(`${debugUrl}/json/list`)
    const target = targets.find((item) => item.id === targetId)
    if (target?.webSocketDebuggerUrl) return target
    await sleep(100)
  }
  throw new Error(`Could not resolve DevTools target ${targetId}`)
}

async function waitFor(cdp, expression, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const value = await evaluate(cdp, expression)
    if (value) return value
    await sleep(250)
  }
  throw new Error(`Timed out waiting for page condition: ${expression}`)
}

async function connectBrowser() {
  const version = await getJson(`${debugUrl}/json/version`)
  return connect(version.webSocketDebuggerUrl)
}

if (mode === 'preflight') {
  const browser = await connectBrowser()
  const contextResult = await browser.call('Target.createBrowserContext', { disposeOnDetach: false })
  const targetResult = await browser.call('Target.createTarget', {
    url: 'about:blank',
    browserContextId: contextResult.browserContextId,
  })
  const target = await getTarget(targetResult.targetId)
  const page = await connect(target.webSocketDebuggerUrl)
  await page.call('Page.enable')
  await page.call('Runtime.enable')
  await page.call('Page.navigate', { url: pageUrl })
  await waitFor(page, `document.readyState === 'complete' && !!document.querySelector('.transfer-panel-demo')`)

  const probe = await evaluate(
    page,
    `(() => {
      const titleBefore = document.title;
      const probeTitle = '__assessment_b_title_probe__';
      document.title = probeTitle;
      const titleChanged = document.title === probeTitle;
      const script = document.createElement('script');
      script.textContent = 'window.__assessmentBInlineScriptRan = true;';
      (document.head || document.documentElement).appendChild(script);
      const result = {
        titleBefore,
        titleChanged,
        scriptAppended: script.isConnected,
        scriptExecuted: window.__assessmentBInlineScriptRan === true,
        scriptParent: script.parentElement?.tagName || null,
      };
      document.title = titleBefore;
      script.remove();
      delete window.__assessmentBInlineScriptRan;
      return result;
    })()`,
  )
  writeJson('browser-context.json', {
    browserDebugPort: port,
    browserContextId: contextResult.browserContextId,
    targetId: targetResult.targetId,
    pageUrl,
  })
  writeJson('browser-preflight.json', {
    pageUrl,
    title: probe.titleBefore,
    documentTitleChanged: probe.titleChanged,
    scriptElementAppended: probe.scriptAppended,
    inlineScriptExecuted: probe.scriptExecuted,
    scriptParent: probe.scriptParent,
    probeScriptRemoved: true,
  })
  page.close()
  browser.close()
  process.stdout.write(`${JSON.stringify({ mode, ...probe })}\n`)
} else {
  const context = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'browser-context.json'), 'utf8'))
  const browser = await connectBrowser()
  if (mode === 'close') {
    const target = await getTarget(context.targetId)
    await browser.call('Target.closeTarget', { targetId: context.targetId })
    await browser.call('Target.disposeBrowserContext', { browserContextId: context.browserContextId })
    writeJson('browser-context-closed.json', { targetId: context.targetId, url: target.url, closed: true })
    await browser.call('Browser.close')
    browser.close()
    process.stdout.write(`${JSON.stringify({ mode, closed: true })}\n`)
  } else {
    const target = await getTarget(context.targetId)
    const page = await connect(target.webSocketDebuggerUrl)
    await page.call('Page.enable')
    await page.call('Runtime.enable')
    await page.call('Log.enable')
    await page.call('Page.navigate', { url: pageUrl })
    await waitFor(page, `document.readyState === 'complete' && !!document.querySelector('.transfer-panel-demo')`)

    const viewport = async (width, height, mobile) => {
      await page.call('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile,
      })
      await sleep(500)
    }
    const controlState = async () =>
      evaluate(
        page,
        `(() => {
          const label = [...document.querySelectorAll('label')].find((item) => item.textContent.includes('HUD 深色主题'));
          const input = label?.querySelector('input[type="checkbox"]');
          return { found: !!input, checked: input?.checked ?? null, label: label?.textContent.trim() ?? null };
        })()`,
      )
    const setHud = async (enabled) => {
      const before = await controlState()
      if (!before.found) return { ...before, requested: enabled, changed: false }
      if (before.checked !== enabled) {
        await evaluate(
          page,
          `(() => {
            const label = [...document.querySelectorAll('label')].find((item) => item.textContent.includes('HUD 深色主题'));
            label.querySelector('input[type="checkbox"]').click();
            return true;
          })()`,
          { userGesture: true },
        )
        await sleep(350)
      }
      const after = await controlState()
      return { ...after, requested: enabled, changed: before.checked !== after.checked }
    }
    const screenshot = async (name) => {
      const result = await page.call('Page.captureScreenshot', {
        format: 'png',
        fromSurface: true,
        captureBeyondViewport: false,
      })
      fs.writeFileSync(path.join(evidenceDir, name), Buffer.from(result.data, 'base64'))
    }
    const pageSummary = async () =>
      evaluate(
        page,
        `(() => {
          const doc = document.documentElement;
          const tables = [...document.querySelectorAll('.vp-doc table')].map((table, index) => {
            const headers = [...table.querySelectorAll('thead th')].map((item) => item.innerText.trim());
            const heading = [...document.querySelectorAll('.vp-doc h1,.vp-doc h2,.vp-doc h3,.vp-doc h4')]
              .filter((item) => item.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING)
              .at(-1)?.innerText.replace(/[\u200B-\u200D\uFEFF]/g, '').trim() || null;
            const chain = [];
            for (let item = table.parentElement; item && item !== document.body; item = item.parentElement) {
              const style = getComputedStyle(item);
              if (item.scrollWidth > item.clientWidth + 1 || /auto|scroll/.test(style.overflowX)) {
                chain.push({
                  tag: item.tagName,
                  className: typeof item.className === 'string' ? item.className : '',
                  clientWidth: item.clientWidth,
                  scrollWidth: item.scrollWidth,
                  overflowX: style.overflowX,
                  scrollable: item.scrollWidth > item.clientWidth + 1 && /auto|scroll/.test(style.overflowX),
                });
              }
            }
            return { index, heading, headers, text: table.innerText.slice(0, 240), clientWidth: table.clientWidth, scrollWidth: table.scrollWidth, overflowX: getComputedStyle(table).overflowX, ancestors: chain };
          });
          const headings = [...document.querySelectorAll('.vp-doc h1,.vp-doc h2,.vp-doc h3,.vp-doc h4')].map((item) => item.innerText.replace(/[\u200B-\u200D\uFEFF]/g, '').trim());
          const codeNodes = [...document.querySelectorAll('.lx-transfer-panel__node-code')].slice(0, 12).map((item) => ({
            text: item.innerText.trim(),
            title: item.getAttribute('title'),
            clientWidth: item.clientWidth,
            scrollWidth: item.scrollWidth,
            clipped: item.scrollWidth > item.clientWidth + 1,
            display: getComputedStyle(item).display,
          }));
          const propsIndex = tables.findIndex((table) => /^props?$/i.test(table.heading || '') || /^(?:属性|参数)$/.test(table.heading || ''));
          return {
            title: document.title,
            viewportWidth: innerWidth,
            viewportHeight: innerHeight,
            documentClientWidth: doc.clientWidth,
            documentScrollWidth: doc.scrollWidth,
            bodyClientWidth: document.body.clientWidth,
            bodyScrollWidth: document.body.scrollWidth,
            darkShell: document.documentElement.classList.contains('dark'),
            hudPreviewEnabled: !!document.querySelector('.transfer-panel-demo__preview.lx-theme-hud'),
            headings,
            tables,
            propsTableIndex: propsIndex,
            codeNodes,
          };
        })()`,
      )
    const allEntries = []
    const observeEvents = () => {
      for (const event of page.events.splice(0)) {
        if (event.method === 'Runtime.consoleAPICalled') {
          const text = (event.params.args || []).map((arg) => arg.value ?? arg.description ?? '').join(' ')
          allEntries.push({ source: 'console', type: event.params.type, text })
        } else if (event.method === 'Log.entryAdded') {
          allEntries.push({
            source: 'log',
            level: event.params.entry.level,
            text: event.params.entry.text,
            url: event.params.entry.url || null,
          })
        } else if (event.method === 'Runtime.exceptionThrown') {
          allEntries.push({ source: 'exception', text: event.params.exceptionDetails.text })
        }
      }
    }

    await viewport(1280, 900, false)
    await evaluate(page, 'window.scrollTo(0, 0)')
    const overlayResult = await evaluate(
      page,
      `(async () => {
        const src = 'http://localhost:${livePort}/detect.js';
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        const result = await new Promise((resolve) => {
          const timeout = setTimeout(() => resolve({ status: 'timeout', src }), 10000);
          script.onload = () => { clearTimeout(timeout); resolve({ status: 'loaded', src: script.src }); };
          script.onerror = () => { clearTimeout(timeout); resolve({ status: 'error', src: script.src }); };
          (document.head || document.documentElement).appendChild(script);
        });
        return { ...result, appended: script.isConnected, globalType: typeof window.impeccable };
      })()`,
    )
    await sleep(2700)
    observeEvents()
    const desktopLightState = await setHud(false)
    await evaluate(page, 'window.scrollTo(0, 0)')
    const desktopLight = await pageSummary()
    await screenshot('desktop-light-overlay.png')
    const desktopHudState = await setHud(true)
    await evaluate(page, 'window.scrollTo(0, 0)')
    const desktopHud = await pageSummary()
    await screenshot('desktop-hud-overlay.png')

    await viewport(320, 900, false)
    await evaluate(page, 'window.scrollTo(0, 0)')
    const mobileHudState = await setHud(true)
    const mobileHud = await pageSummary()
    await screenshot('mobile-hud-overlay.png')
    const mobileLightState = await setHud(false)
    await evaluate(page, 'window.scrollTo(0, 0)')
    const mobileLight = await pageSummary()
    await screenshot('mobile-light-overlay.png')

    const propsIndex = mobileLight.propsTableIndex >= 0 ? mobileLight.propsTableIndex : null
    let propsCapture = { found: false }
    if (propsIndex !== null) {
      propsCapture = await evaluate(
        page,
        `(() => {
          const table = [...document.querySelectorAll('.vp-doc table')][${propsIndex}];
          if (!table) return { found: false };
          table.scrollIntoView({ block: 'center' });
          const chain = [];
          for (let item = table.parentElement; item && item !== document.body; item = item.parentElement) {
            const style = getComputedStyle(item);
            if (item.scrollWidth > item.clientWidth + 1 || /auto|scroll/.test(style.overflowX)) {
              chain.push({ className: typeof item.className === 'string' ? item.className : '', clientWidth: item.clientWidth, scrollWidth: item.scrollWidth, overflowX: style.overflowX, scrollLeft: item.scrollLeft });
            }
          }
          const tableStyle = getComputedStyle(table);
          return {
            found: true,
            heading: [...document.querySelectorAll('.vp-doc h1,.vp-doc h2,.vp-doc h3,.vp-doc h4')]
              .filter((item) => item.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING)
              .at(-1)?.innerText.replace(/[\u200B-\u200D\uFEFF]/g, '').trim() || null,
            headers: [...table.querySelectorAll('thead th')].map((item) => item.innerText.trim()),
            tableClientWidth: table.clientWidth,
            tableScrollWidth: table.scrollWidth,
            tableOverflowX: tableStyle.overflowX,
            tableSelfScrollable: table.scrollWidth > table.clientWidth + 1 && /auto|scroll/.test(tableStyle.overflowX),
            ancestors: chain,
            ancestorScrollable: chain.some((item) => item.scrollWidth > item.clientWidth + 1 && /auto|scroll/.test(item.overflowX)),
          };
        })()`,
      )
      await sleep(200)
      await screenshot('mobile-props-table-overlay.png')
    }
    observeEvents()
    const impeccableConsole = allEntries.filter((entry) => /impeccable/i.test(entry.text || ''))
    writeJson('browser-overlay.json', {
      pageUrl,
      injection: overlayResult,
      consoleEntries: allEntries,
      impeccableConsole,
      viewportStates: {
        desktopLight: { hudControl: desktopLightState, ...desktopLight },
        desktopHud: { hudControl: desktopHudState, ...desktopHud },
        mobileLight: { hudControl: mobileLightState, ...mobileLight },
        mobileHud: { hudControl: mobileHudState, ...mobileHud },
      },
      propsTableCapture: propsCapture,
    })
    page.close()
    browser.close()
    process.stdout.write(
      `${JSON.stringify({
        mode,
        injection: overlayResult,
        impeccableConsoleCount: impeccableConsole.length,
        mobileDocumentWidth: mobileLight.documentClientWidth,
        mobileDocumentScrollWidth: mobileLight.documentScrollWidth,
        propsTableCapture: propsCapture,
        desktopCodeNodes: desktopLight.codeNodes,
      })}\n`,
    )
  }
}
