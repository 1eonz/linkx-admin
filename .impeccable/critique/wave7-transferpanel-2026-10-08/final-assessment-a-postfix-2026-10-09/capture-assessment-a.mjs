import fs from 'node:fs/promises'

const outputDir = new URL('.', import.meta.url).pathname
  .replace(/^\/(\w):/, '$1:')
  .replaceAll('/', '\\')
  .replace(/\\$/, '')
const screenshotDir = `${outputDir}\\screenshots`
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const cdpPort = 9237

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function json(url, options) {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} ${url}`)
  return response.json()
}

function connect(webSocketUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(webSocketUrl)
    let nextId = 0
    const pending = new Map()
    const events = new Map()

    const connection = {
      call(method, params = {}) {
        const id = ++nextId
        return new Promise((resolveCall, rejectCall) => {
          pending.set(id, { resolve: resolveCall, reject: rejectCall })
          ws.send(JSON.stringify({ id, method, params }))
        })
      },
      waitFor(method, timeout = 15000) {
        return new Promise((resolveWait, rejectWait) => {
          const timer = setTimeout(() => {
            const list = events.get(method) ?? []
            events.set(method, list.filter((entry) => entry.resolve !== resolveWait))
            rejectWait(new Error(`Timed out waiting for ${method}`))
          }, timeout)
          const list = events.get(method) ?? []
          list.push({ resolve: (value) => { clearTimeout(timer); resolveWait(value) } })
          events.set(method, list)
        })
      },
      close() {
        ws.close()
      },
    }

    ws.addEventListener('open', () => resolve(connection))
    ws.addEventListener('error', (event) => reject(event.error ?? new Error('WebSocket error')))
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id) {
        const entry = pending.get(message.id)
        if (!entry) return
        pending.delete(message.id)
        if (message.error) entry.reject(new Error(JSON.stringify(message.error)))
        else entry.resolve(message.result)
        return
      }
      const list = events.get(message.method)
      if (list?.length) {
        const entry = list.shift()
        entry.resolve(message.params)
      }
    })
  })
}

async function evaluate(page, expression) {
  const result = await page.call('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? 'Runtime evaluation failed')
  }
  return result.result?.value
}

async function waitFor(page, expression, timeout = 20000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (await evaluate(page, expression)) return
    await sleep(250)
  }
  throw new Error(`Timed out waiting for expression: ${expression}`)
}

async function screenshot(page, fileName, clip) {
  const params = { format: 'png', fromSurface: true, captureBeyondViewport: Boolean(clip) }
  if (clip) params.clip = { ...clip, scale: 1 }
  const result = await page.call('Page.captureScreenshot', params)
  await fs.writeFile(`${screenshotDir}\\${fileName}.png`, Buffer.from(result.data, 'base64'))
}

async function setViewport(page, width, height) {
  await page.call('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  })
}

async function navigate(page, width, height) {
  await setViewport(page, width, height)
  await page.call('Emulation.setEmulatedMedia', { features: [] })
  await page.call('Page.navigate', { url: targetUrl })
  await waitFor(page, "document.readyState === 'complete' && Boolean(document.querySelector('.transfer-panel-demo__preview .lx-transfer-panel'))")
  await sleep(700)
  await evaluate(page, "document.querySelector('.transfer-panel-demo__preview')?.scrollIntoView({ block: 'center', inline: 'nearest' }); true")
  await sleep(200)
}

async function panelFacts(page, label, extra = {}) {
  const facts = await evaluate(page, `(() => {
    const preview = document.querySelector('.transfer-panel-demo__preview');
    const panel = document.querySelector('.lx-transfer-panel');
    const source = document.querySelector('[data-lx-transfer-layout] .lx-transfer-panel__panel');
    const rows = [...document.querySelectorAll('.lx-transfer-panel .lx-virtual-tree__row')];
    const active = document.activeElement;
    const rect = (node) => node ? (() => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })() : null;
    const css = (selector) => { const node = document.querySelector(selector); if (!node) return null; const style = getComputedStyle(node); return { selector, transitionDuration: style.transitionDuration, animationDuration: style.animationDuration, outline: style.outline, backgroundColor: style.backgroundColor, color: style.color, minHeight: style.minHeight, height: style.height }; };
    return {
      label: ${JSON.stringify(label)},
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      documentTheme: { dark: document.documentElement.classList.contains('dark'), hud: document.documentElement.classList.contains('lx-theme-hud'), reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches },
      previewClass: preview?.className ?? null,
      previewRect: rect(preview),
      panelRect: rect(panel),
      sourcePanelRect: rect(source),
      panelColumns: panel ? getComputedStyle(panel).gridTemplateColumns : null,
      panelRows: panel ? getComputedStyle(panel).gridTemplateRows : null,
      rowCount: rows.length,
      rowHeights: rows.slice(0, 8).map((row) => Math.round(row.getBoundingClientRect().height * 100) / 100),
      visibleTreeLabels: rows.slice(0, 8).map((row) => row.textContent?.replace(/\\s+/g, ' ').trim()),
      mobileSwitch: [...document.querySelectorAll('.lx-transfer-panel__mobile-switch button')].map((button) => ({ text: button.textContent?.replace(/\\s+/g, ' ').trim(), pressed: button.getAttribute('aria-pressed'), rect: rect(button) })),
      visibleButtons: [...document.querySelectorAll('.lx-transfer-panel button')].filter((button) => getComputedStyle(button).display !== 'none').map((button) => ({ text: button.textContent?.replace(/\\s+/g, ' ').trim(), aria: button.getAttribute('aria-label'), disabled: button.disabled, rect: rect(button) })).slice(0, 20),
      activeElement: active ? { tag: active.tagName, role: active.getAttribute('role'), aria: active.getAttribute('aria-label'), text: active.textContent?.replace(/\\s+/g, ' ').trim().slice(0, 100), className: active.className, outline: getComputedStyle(active).outline } : null,
      styles: [css('.lx-transfer-panel__panel'), css('.lx-transfer-panel__selected-item'), css('.lx-virtual-tree__row'), css('.lx-transfer-panel__mobile-switch button')],
      ...${JSON.stringify(extra)},
    };
  })()`)
  await fs.writeFile(`${outputDir}\\${label}.json`, JSON.stringify(facts, null, 2), 'utf8')
  return facts
}

async function clipFor(page, selector) {
  return evaluate(page, `(() => { const r = document.querySelector(${JSON.stringify(selector)})?.getBoundingClientRect(); if (!r) return null; return { x: Math.max(0, r.x - 8), y: Math.max(0, r.y - 8), width: Math.min(innerWidth - Math.max(0, r.x - 8), r.width + 16), height: r.height + 16 }; })()`)
}

async function dispatchKey(page, key, code, keyCode) {
  await page.call('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode })
  await page.call('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode })
}

await fs.mkdir(screenshotDir, { recursive: true })
const version = await json(`http://127.0.0.1:${cdpPort}/json/version`)
const browser = await connect(version.webSocketDebuggerUrl)
const created = await browser.call('Target.createTarget', { url: 'about:blank' })
const targets = await json(`http://127.0.0.1:${cdpPort}/json/list`)
const target = targets.find((entry) => entry.id === created.targetId)
if (!target?.webSocketDebuggerUrl) throw new Error('New CDP target did not expose a WebSocket URL')
const page = await connect(target.webSocketDebuggerUrl)
const consoleMessages = []
page.call('Runtime.enable')
page.call('Page.enable')
page.call('Log.enable')
page.waitFor = page.waitFor

await navigate(page, 1280, 900)
await screenshot(page, 'desktop-light-viewport')
await screenshot(page, 'desktop-light-component', await clipFor(page, '.transfer-panel-demo__preview'))
await panelFacts(page, 'desktop-light-facts')

await evaluate(page, "document.querySelector('.transfer-panel-demo__settings summary')?.click(); true")
await sleep(100)
await evaluate(page, "[...document.querySelectorAll('.transfer-panel-demo__settings input[type=checkbox]')][1]?.click(); true")
await waitFor(page, "document.querySelector('.transfer-panel-demo__preview')?.classList.contains('lx-theme-hud')")
await sleep(250)
await screenshot(page, 'desktop-hud-viewport')
await screenshot(page, 'desktop-hud-component', await clipFor(page, '.transfer-panel-demo__preview'))
await panelFacts(page, 'desktop-hud-facts')

await navigate(page, 375, 900)
await screenshot(page, 'mobile375-light-viewport')
await screenshot(page, 'mobile375-light-component', await clipFor(page, '.transfer-panel-demo__preview'))
await panelFacts(page, 'mobile375-light-facts')

await navigate(page, 320, 900)
await screenshot(page, 'mobile320-light-viewport')
await screenshot(page, 'mobile320-light-component', await clipFor(page, '.transfer-panel-demo__preview'))
await panelFacts(page, 'mobile320-light-facts')

await navigate(page, 375, 900)
await evaluate(page, "document.querySelector('.lx-transfer-panel__mobile-switch button')?.focus(); true")
const focusSequence = []
for (let index = 0; index < 12; index += 1) {
  await dispatchKey(page, 'Tab', 'Tab', 9)
  focusSequence.push(await evaluate(page, `(() => { const el = document.activeElement; return { index: ${index + 1}, tag: el?.tagName, role: el?.getAttribute('role'), aria: el?.getAttribute('aria-label'), text: el?.textContent?.replace(/\\s+/g, ' ').trim().slice(0, 80), className: el?.className, focusVisible: el ? el.matches(':focus-visible') : false, outline: el ? getComputedStyle(el).outline : null }; })()`))
}
await fs.writeFile(`${outputDir}\\keyboard-focus-sequence.json`, JSON.stringify({ viewport: await evaluate(page, '({ width: innerWidth, height: innerHeight })'), sequence: focusSequence }, null, 2), 'utf8')
await screenshot(page, 'mobile375-keyboard-focus-viewport')
await screenshot(page, 'mobile375-keyboard-focus-component', await clipFor(page, '.transfer-panel-demo__preview'))
await panelFacts(page, 'mobile375-keyboard-focus-facts', { focusSequence })

await navigate(page, 375, 900)
await evaluate(page, "document.querySelector('.lx-transfer-panel__mobile-switch button')?.focus(); true")
for (let index = 0; index < 4; index += 1) await dispatchKey(page, 'Tab', 'Tab', 9)
await evaluate(page, "document.activeElement?.scrollIntoView({ block: 'center', inline: 'nearest' }); true")
await sleep(150)
await screenshot(page, 'mobile375-keyboard-focus-target-viewport')
await screenshot(page, 'mobile375-keyboard-focus-target-component', await clipFor(page, '.transfer-panel-demo__preview'))
await panelFacts(page, 'mobile375-keyboard-focus-target-facts')

await page.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
await evaluate(page, "document.querySelector('.transfer-panel-demo__preview')?.scrollIntoView({ block: 'center', inline: 'nearest' }); true")
await sleep(200)
await screenshot(page, 'mobile375-reduced-motion-viewport')
await screenshot(page, 'mobile375-reduced-motion-component', await clipFor(page, '.transfer-panel-demo__preview'))
await panelFacts(page, 'mobile375-reduced-motion-facts')

await fs.writeFile(`${outputDir}\\capture-meta.json`, JSON.stringify({ targetUrl, cdpPort, targetId: created.targetId, browser: version.Browser, generatedAt: new Date().toISOString(), note: 'Assessment A 独立浏览器证据；未读取 Assessment B 目录。' }, null, 2), 'utf8')
page.close()
browser.close()
