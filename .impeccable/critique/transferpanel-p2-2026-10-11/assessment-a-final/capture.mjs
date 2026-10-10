import fs from 'node:fs'
import path from 'node:path'

const debugPort = Number(process.argv[2] || 9235)
const sitePort = Number(process.argv[3] || 4188)
const outDir = path.resolve('.impeccable/critique/transferpanel-p2-2026-10-11/assessment-a-final')
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
fs.mkdirSync(outDir, { recursive: true })

async function getJson(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`)
  return response.json()
}

async function connect(url) {
  const socket = new WebSocket(url)
  const pending = new Map()
  let nextId = 0
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data))
    const waiter = pending.get(message.id)
    if (!waiter) return
    pending.delete(message.id)
    if (message.error) waiter.reject(new Error(message.error.message))
    else waiter.resolve(message.result || {})
  })
  return {
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

async function evaluate(page, expression, options = {}) {
  const result = await page.call('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
    ...options,
  })
  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description || result.exceptionDetails.text,
    )
  }
  return result.result?.value
}

async function waitFor(page, expression, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await evaluate(page, expression)) return
    await sleep(250)
  }
  throw new Error(`Timed out: ${expression}`)
}

async function targetById(id) {
  const deadline = Date.now() + 10000
  while (Date.now() < deadline) {
    const target = (await getJson(`http://127.0.0.1:${debugPort}/json/list`)).find(
      (item) => item.id === id,
    )
    if (target?.webSocketDebuggerUrl) return target
    await sleep(100)
  }
  throw new Error(`Target unavailable: ${id}`)
}

async function setViewport(page, width, height, reduceMotion = false) {
  await page.call('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await page.call('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduceMotion ? 'reduce' : 'no-preference' }],
  })
  await sleep(450)
}

async function screenshot(page, name) {
  const result = await page.call('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  })
  fs.writeFileSync(path.join(outDir, name), Buffer.from(result.data, 'base64'))
}

async function screenshotElement(page, selector, name) {
  const clip = await evaluate(page, `(async () => {
    const element = document.querySelector(${JSON.stringify(selector)})
    if (!element) return null
    element.scrollIntoView({ block: 'center', inline: 'nearest' })
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    const rect = element.getBoundingClientRect()
    return { x: Math.max(0, rect.left), y: Math.max(0, rect.top), width: Math.min(rect.width, innerWidth), height: Math.min(rect.height, innerHeight), scale: 1 }
  })()`)
  if (!clip || clip.width <= 0 || clip.height <= 0) throw new Error(`Cannot capture ${selector}`)
  const result = await page.call('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
    clip,
  })
  fs.writeFileSync(path.join(outDir, name), Buffer.from(result.data, 'base64'))
}

async function screenshotAfterScroll(page, selector, name) {
  const state = await evaluate(page, `(async () => {
    const element = document.querySelector(${JSON.stringify(selector)})
    if (!element) return null
    element.scrollIntoView({ block: 'center', inline: 'nearest' })
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    const rect = element.getBoundingClientRect()
    return { scrollY: window.scrollY, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height }
  })()`)
  if (!state) throw new Error(`Cannot scroll to ${selector}`)
  await screenshot(page, name)
  return state
}

async function navigate(page, url, selector) {
  await page.call('Page.navigate', { url })
  await waitFor(page, `document.readyState === 'complete' && !!document.querySelector(${JSON.stringify(selector)})`)
  await sleep(450)
}

function writeJson(name, value) {
  fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const browserInfo = await getJson(`http://127.0.0.1:${debugPort}/json/version`)
const browser = await connect(browserInfo.webSocketDebuggerUrl)
const contextResult = await browser.call('Target.createBrowserContext', { disposeOnDetach: false })
const contextId = contextResult.browserContextId

async function createPage() {
  const targetResult = await browser.call('Target.createTarget', {
    url: 'about:blank',
    browserContextId: contextId,
  })
  const target = await targetById(targetResult.targetId)
  const page = await connect(target.webSocketDebuggerUrl)
  await page.call('Page.enable')
  await page.call('Runtime.enable')
  await page.call('Log.enable')
  return { page, targetId: targetResult.targetId }
}

const transfer = await createPage()
const transferUrl = `http://127.0.0.1:${sitePort}/components/lxtransferpanel.html`
await navigate(transfer.page, transferUrl, '.transfer-panel-demo')

const transferProbe = () =>
  evaluate(
    transfer.page,
    `(() => {
      const box = (element) => {
        if (!element) return null
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return {
          text: element.innerText?.trim().replace(/\\s+/g, ' ').slice(0, 180) || '',
          rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          clientHeight: element.clientHeight,
          scrollHeight: element.scrollHeight,
          overflowX: style.overflowX,
          overflowY: style.overflowY,
          transitionDuration: style.transitionDuration,
        }
      }
      const root = document.documentElement
      const component = document.querySelector('.lx-transfer-panel')
      const selected = document.querySelector('.lx-transfer-panel__selected')
      const summary = [...document.querySelectorAll('.lx-transfer-panel__selected-name-disclosure')].map((details) => ({
        open: details.open,
        text: details.innerText.trim().replace(/\\s+/g, ' ').slice(0, 120),
        summary: box(details.querySelector('summary')),
        actionText: details.querySelector('.lx-transfer-panel__selected-name-action')?.innerText.trim() || null,
        ariaLabel: details.querySelector('summary')?.getAttribute('aria-label') || null,
      }))
      const selectedItems = [...document.querySelectorAll('.lx-transfer-panel__selected-item')].map((item) => ({
        text: item.innerText.trim().replace(/\\s+/g, ' ').slice(0, 180),
        box: box(item),
        remove: box(item.querySelector('button')),
      }))
      const controlActions = [...document.querySelectorAll('.lx-transfer-panel__controls-action')].map((item) => ({
        box: box(item),
        button: box(item.querySelector('button')),
        text: item.innerText.trim().replace(/\\s+/g, ' '),
        disabled: item.querySelector('button')?.disabled ?? null,
        title: item.querySelector('button')?.getAttribute('title') || null,
      }))
      const panels = [...document.querySelectorAll('.lx-transfer-panel__panel')].map((item) => ({
        hidden: item.classList.contains('is-mobile-hidden'),
        box: box(item),
      }))
      const longName = [...document.querySelectorAll('.lx-transfer-panel__selected-name')].find((item) => item.innerText.includes('历史授权单位'))
      const allVisible = [...document.querySelectorAll('body *')].map((item) => {
        const rect = item.getBoundingClientRect()
        return { item, rect }
      }).filter(({ item, rect }) => rect.width > 0 && rect.right > root.clientWidth + 1 && getComputedStyle(item).display !== 'none')
      return {
        url: location.href,
        viewport: { innerWidth, innerHeight, documentClientWidth: root.clientWidth, documentScrollWidth: root.scrollWidth, bodyClientWidth: document.body.clientWidth, bodyScrollWidth: document.body.scrollWidth },
        darkShell: root.classList.contains('dark'),
        hudPreview: !!document.querySelector('.transfer-panel-demo__preview.lx-theme-hud'),
        panelHeight: component ? component.getBoundingClientRect().height : null,
        component: box(component),
        selectedList: box(selected),
        selectedListAria: selected?.getAttribute('aria-label') || null,
        selectedScrollHint: box(document.querySelector('[data-testid="selected-scroll-hint"]')),
        selectedItems,
        longName: longName ? box(longName) : null,
        longNameDisclosure: summary,
        controlActions,
        panels,
        mobileSwitch: [...document.querySelectorAll('.lx-transfer-panel__mobile-switch button')].map((item) => ({ text: item.innerText.trim().replace(/\\s+/g, ' '), pressed: item.getAttribute('aria-pressed'), box: box(item) })),
        heightValue: document.querySelector('.transfer-panel-demo__height-control select')?.value || null,
        settingsOpen: document.querySelector('.transfer-panel-demo__settings')?.open ?? null,
        focus: document.activeElement ? { tag: document.activeElement.tagName, className: typeof document.activeElement.className === 'string' ? document.activeElement.className : '', text: document.activeElement.innerText?.trim().slice(0, 120) || '', ariaLabel: document.activeElement.getAttribute?.('aria-label') || null } : null,
        overflowOffenders: allVisible.slice(0, 20).map(({ item, rect }) => ({ tag: item.tagName, className: typeof item.className === 'string' ? item.className : '', text: item.innerText?.trim().replace(/\\s+/g, ' ').slice(0, 80) || '', right: rect.right, width: rect.width })),
      }
    })()`,
  )

const transferStates = {}
await setViewport(transfer.page, 1440, 900)
await evaluate(transfer.page, 'window.scrollTo(0, 0)')
transferStates.desktop380 = await transferProbe()
await screenshot(transfer.page, 'transfer-desktop-380.png')
await screenshotElement(transfer.page, '.transfer-panel-demo__preview', 'transfer-preview-desktop-380.png')

const heightSelect = `document.querySelector('.transfer-panel-demo__height-control select')`
async function setHeight(value) {
  await evaluate(
    transfer.page,
    `(() => { const select = ${heightSelect}; select.value = '${value}'; select.dispatchEvent(new Event('change', { bubbles: true })); return select.value })()`,
    { userGesture: true },
  )
  await sleep(350)
}
await setHeight(300)
transferStates.desktop300 = await transferProbe()
await screenshot(transfer.page, 'transfer-desktop-300.png')
await setHeight(240)
transferStates.desktop240 = await transferProbe()
await screenshot(transfer.page, 'transfer-desktop-240.png')
await screenshotElement(transfer.page, '.transfer-panel-demo__preview', 'transfer-preview-desktop-240.png')
await setHeight(380)

await evaluate(transfer.page, `(() => {
  const details = document.querySelector('.lx-transfer-panel__selected-name-disclosure')
  if (!details) return false
  details.open = true
  return true
})()`)
await sleep(250)
transferStates.desktopLongNameExpanded = await transferProbe()
await screenshot(transfer.page, 'transfer-desktop-long-name-expanded.png')

await evaluate(transfer.page, `(() => { const details = document.querySelector('.lx-transfer-panel__selected-name-disclosure'); if (details) details.open = false; return true })()`)
await setViewport(transfer.page, 390, 844)
await evaluate(transfer.page, 'window.scrollTo(0, 0)')
transferStates.mobile390Source = await transferProbe()
await screenshot(transfer.page, 'transfer-mobile-390-source.png')
await screenshotElement(transfer.page, '.transfer-panel-demo__preview', 'transfer-preview-mobile-390-source.png')
transferStates.mobile390SourceScreenshot = await screenshotAfterScroll(transfer.page, '.transfer-panel-demo__preview', 'transfer-mobile-390-source-scrolled.png')
await evaluate(transfer.page, `document.querySelector('[data-testid="mobile-selected-panel"]').click()`)
await sleep(250)
transferStates.mobile390Selected = await transferProbe()
await screenshot(transfer.page, 'transfer-mobile-390-selected.png')
await screenshotElement(transfer.page, '.transfer-panel-demo__preview', 'transfer-preview-mobile-390-selected.png')
transferStates.mobile390SelectedScreenshot = await screenshotAfterScroll(transfer.page, '.transfer-panel-demo__preview', 'transfer-mobile-390-selected-scrolled.png')
await setViewport(transfer.page, 320, 844)
await evaluate(transfer.page, 'window.scrollTo(0, 0)')
transferStates.mobile320Selected = await transferProbe()
await screenshot(transfer.page, 'transfer-mobile-320-selected.png')
await screenshotElement(transfer.page, '.transfer-panel-demo__preview', 'transfer-preview-mobile-320-selected.png')
transferStates.mobile320SelectedScreenshot = await screenshotAfterScroll(transfer.page, '.transfer-panel-demo__preview', 'transfer-mobile-320-selected-scrolled.png')

await evaluate(transfer.page, `(() => {
  const settings = document.querySelector('.transfer-panel-demo__settings')
  if (settings) settings.open = true
  return true
})()`)
await sleep(200)
transferStates.mobile320SettingsOpen = await transferProbe()
await screenshot(transfer.page, 'transfer-mobile-320-settings-open.png')
await screenshotElement(transfer.page, '.transfer-panel-demo__preview', 'transfer-preview-mobile-320-settings-open.png')
transferStates.mobile320SettingsScreenshot = await screenshotAfterScroll(transfer.page, '.transfer-panel-demo__preview', 'transfer-mobile-320-settings-open-scrolled.png')
await evaluate(transfer.page, `(() => { const settings = document.querySelector('.transfer-panel-demo__settings'); if (settings) settings.open = false; return true })()`)

await evaluate(transfer.page, `(() => {
  const button = document.querySelector('[data-testid="mobile-selected-panel"]')
  button?.focus()
  return document.activeElement?.getAttribute('data-testid')
})()`)
await evaluate(transfer.page, `(() => {
  const item = document.querySelector('.lx-transfer-panel__selected-item')
  item?.querySelector('button')?.focus()
  return document.activeElement?.getAttribute('aria-label')
})()`)
await transfer.page.call('Input.dispatchKeyEvent', {
  type: 'keyDown',
  key: 'Enter',
  code: 'Enter',
  windowsVirtualKeyCode: 13,
  nativeVirtualKeyCode: 13,
})
await transfer.page.call('Input.dispatchKeyEvent', {
  type: 'keyUp',
  key: 'Enter',
  code: 'Enter',
  windowsVirtualKeyCode: 13,
  nativeVirtualKeyCode: 13,
})
await sleep(300)
transferStates.keyboardAfterRemove = await transferProbe()
await screenshot(transfer.page, 'transfer-mobile-320-keyboard-after-remove.png')
await screenshotElement(transfer.page, '.transfer-panel-demo__preview', 'transfer-preview-mobile-320-keyboard-after-remove.png')

await setViewport(transfer.page, 1440, 900, true)
await evaluate(transfer.page, 'window.scrollTo(0, 0)')
transferStates.desktopReducedMotion = await evaluate(transfer.page, `(() => {
  const nodes = [...document.querySelectorAll('.lx-transfer-panel, .lx-transfer-panel *')]
  const durations = nodes.map((node) => getComputedStyle(node).transitionDuration).filter(Boolean)
  return { mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches, durations: [...new Set(durations)].slice(0, 20), selected: !!document.querySelector('.lx-transfer-panel') }
})()`)
await screenshot(transfer.page, 'transfer-desktop-reduced-motion.png')

await evaluate(transfer.page, `(() => {
  const settings = document.querySelector('.transfer-panel-demo__settings')
  if (settings) settings.open = true
  const input = [...document.querySelectorAll('label')]
    .find((item) => item.innerText.includes('HUD 深色主题'))
    ?.querySelector('input[type="checkbox"]')
  input?.click()
  return input?.checked ?? null
})()`, { userGesture: true })
await sleep(250)
transferStates.desktopHud = await transferProbe()
await screenshot(transfer.page, 'transfer-desktop-hud.png')
transferStates.desktopHudScreenshot = await screenshotAfterScroll(transfer.page, '.transfer-panel-demo__preview', 'transfer-desktop-hud-scrolled.png')

writeJson('transfer-evidence.json', transferStates)

const virtual = await createPage()
const virtualUrl = `http://127.0.0.1:${sitePort}/components/lxvirtualtree.html`
await navigate(virtual.page, virtualUrl, '.virtual-tree-demo')
await setViewport(virtual.page, 1440, 900)
await evaluate(virtual.page, 'window.scrollTo(0, 0)')
const virtualInitial = await evaluate(virtual.page, `(() => {
  const summaries = [...document.querySelectorAll('.virtual-tree-demo__controls > summary, .virtual-tree-demo__advanced > summary')]
  const describe = (item) => ({ text: item.innerText.trim().replace(/\\s+/g, ' '), box: (() => { const r=item.getBoundingClientRect(); return {left:r.left,top:r.top,width:r.width,height:r.height} })(), icons: [...item.querySelectorAll('.virtual-tree-demo__summary-icon')].map((icon) => ({ html: icon.outerHTML.slice(0, 260), box: (() => { const r=icon.getBoundingClientRect(); return {left:r.left,top:r.top,width:r.width,height:r.height} })(), transform: getComputedStyle(icon).transform, transition: getComputedStyle(icon).transitionDuration })) })
  return { viewport: { innerWidth, innerHeight, documentClientWidth: document.documentElement.clientWidth, documentScrollWidth: document.documentElement.scrollWidth }, controlsOpen: document.querySelector('.virtual-tree-demo__controls')?.open ?? null, advancedOpen: [...document.querySelectorAll('.virtual-tree-demo__advanced')].map((item) => item.open), summaries: summaries.map(describe), preview: (() => { const r=document.querySelector('.virtual-tree-demo__preview')?.getBoundingClientRect(); return r ? {left:r.left,top:r.top,width:r.width,height:r.height} : null })(), treeItems: document.querySelectorAll('[role="treeitem"]').length }
})()`)
await screenshot(virtual.page, 'virtualtree-desktop-collapsed.png')
await evaluate(virtual.page, `(() => { const details = document.querySelector('.virtual-tree-demo__controls'); if (details) details.open = true; return true })()`)
await sleep(150)
const virtualControlsOpen = await evaluate(virtual.page, `(() => ({ controlsOpen: document.querySelector('.virtual-tree-demo__controls')?.open ?? null, advancedOpen: [...document.querySelectorAll('.virtual-tree-demo__advanced')].map((item) => item.open), summaries: [...document.querySelectorAll('.virtual-tree-demo__controls > summary, .virtual-tree-demo__advanced > summary')].map((item) => ({ text:item.innerText.trim().replace(/\\s+/g,' '), iconVisible: !!item.querySelector('.virtual-tree-demo__summary-icon') })) }))()`)
await screenshot(virtual.page, 'virtualtree-desktop-controls-open.png')
await evaluate(virtual.page, `(() => { const details = document.querySelector('.virtual-tree-demo__controls'); if (details) details.open = false; return true })()`)
await setViewport(virtual.page, 390, 844)
await evaluate(virtual.page, 'window.scrollTo(0, 0)')
const virtualMobile = await evaluate(virtual.page, `(() => ({ viewport: { innerWidth, innerHeight, documentClientWidth: document.documentElement.clientWidth, documentScrollWidth: document.documentElement.scrollWidth }, controlsOpen: document.querySelector('.virtual-tree-demo__controls')?.open ?? null, summaries: [...document.querySelectorAll('.virtual-tree-demo__controls > summary, .virtual-tree-demo__advanced > summary')].map((item) => ({ text:item.innerText.trim().replace(/\\s+/g,' '), iconVisible: !!item.querySelector('.virtual-tree-demo__summary-icon'), box:(() => {const r=item.getBoundingClientRect(); return {left:r.left,top:r.top,width:r.width,height:r.height}})() })), treeItems: document.querySelectorAll('[role="treeitem"]').length }))()`)
await screenshot(virtual.page, 'virtualtree-mobile-collapsed.png')
await setViewport(virtual.page, 1440, 900, true)
const virtualReducedMotion = await evaluate(virtual.page, `(() => ({ mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches, transitions: [...document.querySelectorAll('.virtual-tree-demo__summary-icon')].map((item) => getComputedStyle(item).transitionDuration) }))()`)
await screenshot(virtual.page, 'virtualtree-desktop-reduced-motion.png')
writeJson('virtualtree-evidence.json', { initial: virtualInitial, controlsOpen: virtualControlsOpen, mobile: virtualMobile, reducedMotion: virtualReducedMotion })

const logs = await evaluate(transfer.page, `(() => ({ title: document.title, url: location.href }))()`).catch(() => null)
await browser.call('Target.closeTarget', { targetId: transfer.targetId })
await browser.call('Target.closeTarget', { targetId: virtual.targetId })
await browser.call('Target.disposeBrowserContext', { browserContextId: contextId })
browser.close()
writeJson('run-meta.json', { debugPort, sitePort, transferUrl, virtualUrl, logs, completedAt: new Date().toISOString() })
console.log(JSON.stringify({ output: outDir, transferStates: Object.keys(transferStates), virtual: { initial: virtualInitial, controlsOpen: virtualControlsOpen, mobile: virtualMobile, reducedMotion: virtualReducedMotion } }, null, 2))
