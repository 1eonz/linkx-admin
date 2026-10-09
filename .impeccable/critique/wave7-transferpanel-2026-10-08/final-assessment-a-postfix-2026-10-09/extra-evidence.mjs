import fs from 'node:fs/promises'

const outputDir = new URL('.', import.meta.url).pathname.replace(/^\/(\w):/, '$1:').replaceAll('/', '\\').replace(/\\$/, '')
const screenshotDir = `${outputDir}\\screenshots`
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function getJson(url, options) {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return response.json()
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url)
    let id = 0
    const pending = new Map()
    const api = {
      call(method, params = {}) {
        const callId = ++id
        return new Promise((resolveCall, rejectCall) => {
          pending.set(callId, { resolve: resolveCall, reject: rejectCall })
          ws.send(JSON.stringify({ id: callId, method, params }))
        })
      },
      close() { ws.close() },
    }
    ws.addEventListener('open', () => resolve(api))
    ws.addEventListener('error', (event) => reject(event.error ?? new Error('WebSocket error')))
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (!message.id) return
      const entry = pending.get(message.id)
      if (!entry) return
      pending.delete(message.id)
      if (message.error) entry.reject(new Error(JSON.stringify(message.error)))
      else entry.resolve(message.result)
    })
  })
}

async function evaluate(page, expression) {
  const result = await page.call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? 'Runtime evaluation failed')
  return result.result?.value
}

async function waitFor(page, expression) {
  const deadline = Date.now() + 20000
  while (Date.now() < deadline) {
    if (await evaluate(page, expression)) return
    await sleep(200)
  }
  throw new Error(`Timed out waiting for ${expression}`)
}

async function screenshot(page, name) {
  const result = await page.call('Page.captureScreenshot', { format: 'png', fromSurface: true })
  await fs.writeFile(`${screenshotDir}\\${name}.png`, Buffer.from(result.data, 'base64'))
}

async function facts(page, name, expression) {
  const value = await evaluate(page, expression)
  await fs.writeFile(`${outputDir}\\${name}.json`, JSON.stringify(value, null, 2), 'utf8')
}

async function openPage(page, width = 375) {
  await page.call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 })
  await page.call('Emulation.setEmulatedMedia', { features: [] })
  await page.call('Page.navigate', { url: targetUrl })
  await waitFor(page, "document.readyState === 'complete' && Boolean(document.querySelector('.transfer-panel-demo__preview .lx-transfer-panel'))")
  await sleep(500)
  await evaluate(page, "document.querySelector('.transfer-panel-demo__preview')?.scrollIntoView({block:'center'}); true")
}

await fs.mkdir(screenshotDir, { recursive: true })
const version = await getJson('http://127.0.0.1:9237/json/version')
const browser = await connect(version.webSocketDebuggerUrl)
const created = await browser.call('Target.createTarget', { url: 'about:blank' })
const targets = await getJson('http://127.0.0.1:9237/json/list')
const target = targets.find((entry) => entry.id === created.targetId)
const page = await connect(target.webSocketDebuggerUrl)
await page.call('Runtime.enable')
await page.call('Page.enable')

await openPage(page)
await evaluate(page, "document.querySelector('[data-testid=mobile-selected-panel]')?.click(); true")
await sleep(250)
await screenshot(page, 'mobile375-selected-panel-viewport')
await facts(page, 'mobile375-selected-panel-facts', `(() => ({
  viewport: { width: innerWidth, height: innerHeight },
  overflow: { documentScrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth, innerWidth },
  activePanel: [...document.querySelectorAll('.lx-transfer-panel__panel')].filter((node) => getComputedStyle(node).display !== 'none').map((node) => ({ id: node.id, rect: (() => { const r = node.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height} })(), ariaHidden: node.getAttribute('aria-hidden') })),
  selectedItems: [...document.querySelectorAll('.lx-transfer-panel__selected-item')].map((node) => ({ text: node.textContent?.replace(/\\s+/g, ' ').trim(), rect: (() => { const r = node.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height} })() })),
  selectedEmpty: document.querySelector('.lx-transfer-panel__empty')?.textContent?.trim() ?? null,
}))()`)

await openPage(page)
await evaluate(page, "[...document.querySelectorAll('.transfer-panel-demo__settings button')].find((button) => button.textContent?.includes('空结果'))?.click(); true")
await sleep(250)
await screenshot(page, 'mobile375-empty-state-viewport')
await facts(page, 'mobile375-empty-state-facts', `(() => ({
  hostStatus: document.querySelector('[data-testid=transfer-status]')?.textContent?.replace(/\\s+/g, ' ').trim(),
  message: document.querySelector('.transfer-panel-demo__message')?.textContent?.replace(/\\s+/g, ' ').trim() ?? null,
  treeEmpty: document.querySelector('.lx-virtual-tree__empty')?.textContent?.trim() ?? null,
  selectedEmpty: document.querySelector('.lx-transfer-panel__empty')?.textContent?.trim() ?? null,
  overflow: { documentScrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth, innerWidth },
}))()`)

await openPage(page)
await evaluate(page, "[...document.querySelectorAll('.transfer-panel-demo__settings button')].find((button) => button.textContent?.includes('加载失败'))?.click(); true")
await sleep(250)
await screenshot(page, 'mobile375-error-state-viewport')
await facts(page, 'mobile375-error-state-facts', `(() => ({
  hostStatus: document.querySelector('[data-testid=transfer-status]')?.textContent?.replace(/\\s+/g, ' ').trim(),
  message: document.querySelector('.transfer-panel-demo__message')?.textContent?.replace(/\\s+/g, ' ').trim() ?? null,
  messageRole: document.querySelector('.transfer-panel-demo__message')?.getAttribute('role') ?? null,
  inert: document.querySelector('.transfer-panel-demo__surface')?.getAttribute('inert') !== null,
  overflow: { documentScrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth, innerWidth },
}))()`)

await openPage(page)
await evaluate(page, "document.querySelector('.transfer-panel-demo__settings summary')?.click(); true")
await evaluate(page, "[...document.querySelectorAll('.transfer-panel-demo__settings input[type=checkbox]')][1]?.click(); true")
await sleep(250)
await facts(page, 'mobile375-hud-color-facts', `(() => { const selectors = ['.lx-transfer-panel__panel', '.lx-transfer-panel__title', '.lx-transfer-panel__selected-item', '.lx-transfer-panel__node-status', '.lx-transfer-panel__node-code']; return { previewClass: document.querySelector('.transfer-panel-demo__preview')?.className, colors: selectors.map((selector) => { const node = document.querySelector(selector); if (!node) return {selector, missing:true}; const style = getComputedStyle(node); return {selector, color:style.color, backgroundColor:style.backgroundColor, borderColor:style.borderColor}; }) } })()`)
await screenshot(page, 'mobile375-hud-viewport')

await openPage(page)
await evaluate(page, "document.querySelector('.lx-transfer-panel__scope-actions summary')?.click(); true")
await sleep(150)
await screenshot(page, 'mobile375-scope-popover-viewport')
await facts(page, 'mobile375-scope-popover-facts', `(() => { const details = document.querySelector('.lx-transfer-panel__scope-actions'); const content = document.querySelector('.lx-transfer-panel__scope-action-content'); const r = content?.getBoundingClientRect(); return { open: details?.hasAttribute('open'), content: content ? { text: content.textContent?.replace(/\\s+/g, ' ').trim(), x:r.x, y:r.y, width:r.width, height:r.height, overflow:getComputedStyle(content).overflow } : null } })()`)

await openPage(page, 1280)
await evaluate(page, "document.querySelectorAll('.lx-transfer-panel__panel').forEach((node) => node.style.setProperty('height', '240px', 'important')); window.dispatchEvent(new Event('resize')); true")
await sleep(300)
await screenshot(page, 'desktop-panel-height-240-viewport')
await facts(page, 'desktop-panel-height-240-facts', `(() => { const root = document.querySelector('.lx-transfer-panel'); const source = root?.querySelector('.lx-transfer-panel__panel'); const tree = root?.querySelector('.lx-transfer-panel__tree'); const viewport = root?.querySelector('.lx-virtual-tree__viewport'); const header = root?.querySelector('.lx-transfer-panel__panel .lx-transfer-panel__header'); const filter = root?.querySelector('.lx-transfer-panel__filter--source'); const footer = root?.querySelector('.lx-transfer-panel__caption'); const rect = (node) => { if (!node) return null; const r = node.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; }; return { root:rect(root), sourcePanel:rect(source), header:rect(header), filter:rect(filter), tree:rect(tree), treeViewport:rect(viewport), footer:rect(footer), treeInlineHeight:viewport?.style.height ?? null, treeRows:[...root.querySelectorAll('.lx-virtual-tree__row')].slice(0,4).map((node) => rect(node)), sourcePanelRows:source ? getComputedStyle(source).gridTemplateRows : null, overflow:{documentScrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth,innerWidth} }; })()`)

await openPage(page, 320)
await evaluate(page, "document.querySelectorAll('.lx-transfer-panel__panel').forEach((node) => node.style.setProperty('height', '240px', 'important')); window.dispatchEvent(new Event('resize')); true")
await sleep(300)
await screenshot(page, 'mobile320-panel-height-240-viewport')
await facts(page, 'mobile320-panel-height-240-facts', `(() => { const root = document.querySelector('.lx-transfer-panel'); const source = root?.querySelector('.lx-transfer-panel__panel'); const tree = root?.querySelector('.lx-transfer-panel__tree'); const viewport = root?.querySelector('.lx-virtual-tree__viewport'); const header = root?.querySelector('.lx-transfer-panel__panel .lx-transfer-panel__header'); const filter = root?.querySelector('.lx-transfer-panel__filter--source'); const footer = root?.querySelector('.lx-transfer-panel__caption'); const rect = (node) => { if (!node) return null; const r = node.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; }; return { root:rect(root), sourcePanel:rect(source), header:rect(header), filter:rect(filter), tree:rect(tree), treeViewport:rect(viewport), footer:rect(footer), treeRows:[...root.querySelectorAll('.lx-virtual-tree__row')].slice(0,3).map((node) => rect(node)), sourcePanelRows:source ? getComputedStyle(source).gridTemplateRows : null, overflow:{documentScrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth,innerWidth} }; })()`)

await openPage(page, 320)
await evaluate(page, "(() => { const input = document.querySelector('.lx-transfer-panel__filter--source input'); if (!input) return false; const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, '公安'); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); return true; })()")
await sleep(350)
await screenshot(page, 'mobile320-filter-active-viewport')
await facts(page, 'mobile320-filter-active-facts', `(() => { const root = document.querySelector('.lx-transfer-panel'); const panel = root?.querySelector('.lx-transfer-panel__panel'); const header = panel?.querySelector('.lx-transfer-panel__header'); const title = panel?.querySelector('.lx-transfer-panel__title'); const headerMain = panel?.querySelector('.lx-transfer-panel__header-main'); const actions = panel?.querySelector('.lx-transfer-panel__header-actions'); const status = panel?.querySelector('.lx-transfer-panel__header-status'); const filter = panel?.querySelector('.lx-transfer-panel__filter--source input'); const rect = (node) => { if (!node) return null; const r = node.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; }; return { inputValue:filter?.value ?? null, titleText:title?.textContent?.replace(/\\s+/g, ' ').trim() ?? null, titleRect:rect(title), titleScrollWidth:title?.scrollWidth ?? null, titleClientWidth:title?.clientWidth ?? null, headerRect:rect(header), headerMainRect:rect(headerMain), actionsText:actions?.textContent?.replace(/\\s+/g, ' ').trim() ?? null, actionsRect:rect(actions), statusText:status?.textContent?.replace(/\\s+/g, ' ').trim() ?? null, statusRect:rect(status), sourcePanelRows:panel ? getComputedStyle(panel).gridTemplateRows : null, overflow:{documentScrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth,innerWidth} }; })()`)

page.close()
browser.close()
