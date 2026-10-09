import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const outputDir = path.dirname(fileURLToPath(import.meta.url))
const version = await fetch('http://127.0.0.1:9333/json/version').then((response) => response.json())
const socket = new WebSocket(version.webSocketDebuggerUrl)
const pending = new Map()
const browserEvents = []
const networkRequests = []
let nextId = 0

socket.addEventListener('message', (event) => {
  const message = JSON.parse(String(event.data))
  if (message.method === 'Runtime.exceptionThrown') {
    browserEvents.push({ type: 'exception', detail: message.params.exceptionDetails?.text })
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    browserEvents.push({ type: 'console-error', detail: message.params.args?.map((arg) => arg.value ?? arg.description) })
  }
  if (message.method === 'Network.requestWillBeSent' && message.sessionId) {
    const url = message.params.request.url
    if (!url.startsWith('http://127.0.0.1:4183/')) networkRequests.push(url)
  }
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) reject(new Error(message.error.message))
    else resolve(message.result)
  }
})

await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

function send(method, params = {}, sessionId) {
  const id = ++nextId
  const message = { id, method, params }
  if (sessionId) message.sessionId = sessionId
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify(message))
  })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const target = await send('Target.createTarget', { url: 'about:blank' })
const attached = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true })
const sessionId = attached.sessionId
const observations = []

await send('Page.enable', {}, sessionId)
await send('Runtime.enable', {}, sessionId)
await send('Log.enable', {}, sessionId)
await send('Network.enable', {}, sessionId)

async function evaluate(expression) {
  const response = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  }, sessionId)
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text)
  return response.result?.value
}

async function waitFor(expression, timeoutMs = 30000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (await evaluate(expression)) return
    await sleep(200)
  }
  throw new Error(`Timed out waiting for ${expression}`)
}

async function setViewport(width, height = 1000) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
    screenWidth: width,
    screenHeight: height,
  }, sessionId)
  await send('Emulation.setTouchEmulationEnabled', { enabled: width < 768, maxTouchPoints: 1 }, sessionId)
  await sleep(350)
}

async function screenshot(name) {
  const response = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, sessionId)
  fs.writeFileSync(path.join(outputDir, name), Buffer.from(response.data, 'base64'))
}

async function click(selector) {
  const clicked = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) return false; element.click(); return true; })()`)
  if (!clicked) throw new Error(`Missing click target: ${selector}`)
  await sleep(300)
}

async function clickText(containerSelector, text) {
  const clicked = await evaluate(`(() => { const root = document.querySelector(${JSON.stringify(containerSelector)}); const element = [...(root?.querySelectorAll('button') ?? [])].find((item) => item.innerText.trim() === ${JSON.stringify(text)}); if (!element) return false; element.click(); return true; })()`)
  if (!clicked) throw new Error(`Missing button text in ${containerSelector}: ${text}`)
  await sleep(300)
}

async function fill(selector, value) {
  const changed = await evaluate(`(() => { const input = document.querySelector(${JSON.stringify(selector)}); if (!(input instanceof HTMLInputElement)) return false; const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`)
  if (!changed) throw new Error(`Missing input: ${selector}`)
  await sleep(450)
}

async function key(key, code, virtualKey, modifiers = 0) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: virtualKey, nativeVirtualKeyCode: virtualKey, modifiers }, sessionId)
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: virtualKey, nativeVirtualKeyCode: virtualKey, modifiers }, sessionId)
  await sleep(200)
}

async function measure(label) {
  const value = await evaluate(`(() => {
    const rect = (element) => {
      if (!element) return null;
      const r = element.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
    };
    const panel = document.querySelector('.lx-transfer-panel');
    const tree = document.querySelector('.lx-virtual-tree__viewport');
    const rows = [...(panel?.querySelectorAll('[role="treeitem"]') ?? [])];
    const search = document.querySelector('input[aria-label="按机构名称或部门编码筛选待选节点"]');
    const invert = panel?.querySelector('button[aria-label="反选本树可选项"]');
    const describedBy = invert?.getAttribute('aria-describedby') ?? '';
    const describedByIds = describedBy.trim() ? describedBy.trim().split(' ') : [];
    const description = describedByIds.map((id) => document.getElementById(id)?.innerText.trim()).filter(Boolean);
    const activeElement = document.activeElement;
    const activeRow = activeElement?.closest?.('[role="treeitem"]');
    const docs = document.querySelector('.vp-doc');
    const propsHeading = [...(docs?.querySelectorAll('h2') ?? [])].find((heading) => heading.innerText.trim() === 'Props');
    const propsTable = [...(docs?.querySelectorAll('table') ?? [])].find((table) => table.innerText.includes('treeData') && table.innerText.includes('panelHeight')) ?? null;
    const activeStyle = activeRow && tree ? activeRow.getBoundingClientRect().top - tree.getBoundingClientRect().top : null;
    const mediaTransitions = [panel, tree, ...rows.slice(0, 3)].filter(Boolean).map((node) => ({
      name: node.className?.baseVal ?? node.className ?? node.tagName,
      transitionDuration: getComputedStyle(node).transitionDuration,
      animationDuration: getComputedStyle(node).animationDuration,
    }));
    const details = document.querySelector('.transfer-panel-demo__settings');
    const surface = document.querySelector('.transfer-panel-demo__surface');
    const hostMessage = surface?.querySelector('.transfer-panel-demo__message');
    return {
      viewport: { width: innerWidth, height: innerHeight },
      page: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth, horizontalOverflow: document.documentElement.scrollWidth > innerWidth },
      docs: docs ? { rect: rect(docs), clientWidth: docs.clientWidth, scrollWidth: docs.scrollWidth, horizontalOverflow: docs.scrollWidth > docs.clientWidth + 1 } : null,
      propsTable: propsTable ? { rect: rect(propsTable), clientWidth: propsTable.clientWidth, scrollWidth: propsTable.scrollWidth, overflowX: getComputedStyle(propsTable).overflowX, display: getComputedStyle(propsTable).display, horizontallyScrollable: propsTable.scrollWidth > propsTable.clientWidth + 1 } : null,
      panel: rect(panel), panelText: panel?.innerText.slice(0, 280),
      theme: { dark: document.documentElement.classList.contains('dark'), hud: document.querySelector('.transfer-panel-demo')?.classList.contains('lx-theme-hud') ?? false },
      host: { busy: surface?.getAttribute('aria-busy'), inert: panel?.hasAttribute('inert') ?? false, alert: hostMessage?.getAttribute('role') === 'alert' ? hostMessage.innerText.trim() : null, message: hostMessage?.innerText.trim() ?? null, hostStateButtons: [...(document.querySelector('[role="group"][aria-label="宿主数据状态"]')?.querySelectorAll('button') ?? [])].map((button) => ({ label: button.innerText.trim(), pressed: button.getAttribute('aria-pressed') })) },
      tree: tree ? { scrollTop: Math.round(tree.scrollTop), scrollHeight: tree.scrollHeight, clientHeight: tree.clientHeight, itemSize: getComputedStyle(rows[0] ?? tree).getPropertyValue('--lx-tree-row-height').trim(), renderedRows: rows.length, emptyText: tree.querySelector('.lx-virtual-tree__empty')?.innerText.trim() ?? null, activeKey: activeRow?.getAttribute('data-lx-tree-key') ?? null, activeRowTopOffset: activeStyle === null ? null : Math.round(activeStyle), rows: rows.map((row) => ({ key: row.getAttribute('data-lx-tree-key'), checked: row.getAttribute('aria-checked'), disabled: row.getAttribute('aria-disabled') === 'true' })) } : null,
      selectedCount: document.querySelector('[data-testid="selected-count"]')?.innerText.trim() ?? null,
      sourceSearch: search?.value ?? null,
      filteredActionStatus: panel?.querySelector('.lx-transfer-panel__header-status')?.innerText.trim() ?? null,
      invertButton: invert ? { label: invert.innerText.trim(), ariaLabel: invert.getAttribute('aria-label'), describedBy, describedByIds, description, disabled: invert.disabled, focusVisible: invert.matches(':focus-visible'), title: invert.title, rect: rect(invert) } : null,
      activeElement: activeElement ? { tag: activeElement.tagName, label: activeElement.getAttribute('aria-label'), text: activeElement.innerText?.trim().slice(0, 80), focusVisible: activeElement.matches?.(':focus-visible') ?? false } : null,
      settingsOpen: details?.open ?? null,
      reducedMotion: { matches: matchMedia('(prefers-reduced-motion: reduce)').matches, computed: mediaTransitions },
    };
  })()`)
  observations.push({ label, ...value })
  return value
}

try {
  await setViewport(1440)
  await send('Page.navigate', { url: 'http://127.0.0.1:4183/components/lxtransferpanel.html' }, sessionId)
  await waitFor("document.querySelector('.lx-transfer-panel') && document.querySelector('.vp-doc h2')")
  await sleep(900)
  await evaluate("document.querySelector('.transfer-panel-demo').scrollIntoView({block:'start'})")
  await measure('desktop-1440-light-default')
  await screenshot('current-desktop-1440-light-default.png')

  const sourceSearch = 'input[aria-label="按机构名称或部门编码筛选待选节点"]'
  await click('.transfer-panel-demo__settings summary')
  const ariaRange = await measure('invert-label-and-aria-range')
  await clickText('.lx-transfer-panel', '反选本树可选项')
  const invertedAll = await measure('invert-whole-eligible-tree')
  await screenshot('current-full-tree-inverted.png')
  await clickText('.lx-transfer-panel', '反选本树可选项')
  const restoredAll = await measure('restore-whole-tree-selection')

  await fill(sourceSearch, 'unit-pending-01')
  await waitFor("document.querySelector('.lx-virtual-tree__row[data-lx-tree-key=\"archive-unit-01\"]')")
  const lowerCode = await measure('lowercase-code-filter')
  await screenshot('current-code-filter-lowercase.png')
  await click('button[aria-label="清除待选节点筛选"]')
  await fill(sourceSearch, 'UNIT-PENDING-01')
  await waitFor("document.querySelector('.lx-virtual-tree__row[data-lx-tree-key=\"archive-unit-01\"]')")
  const upperCode = await measure('uppercase-code-filter')
  await clickText('.lx-transfer-panel', '反选筛选结果')
  const invertedFiltered = await measure('invert-filtered-result')
  await screenshot('current-filtered-tree-inverted.png')
  await clickText('.lx-transfer-panel', '反选筛选结果')
  await click('button[aria-label="清除待选节点筛选"]')
  observations.push({ label: 'case-insensitive-code-filter-summary', lowercase: { keys: lowerCode.tree?.rows.map((row) => row.key), status: lowerCode.filteredActionStatus }, uppercase: { keys: upperCode.tree?.rows.map((row) => row.key), status: upperCode.filteredActionStatus }, filteredInvert: { before: upperCode.selectedCount, after: invertedFiltered.selectedCount, matchedRowCheckedAfter: invertedFiltered.tree?.rows.find((row) => row.key === 'archive-unit-01')?.checked } })

  await fill(sourceSearch, 'NO-SUCH-UNIT')
  await waitFor("document.querySelector('.lx-virtual-tree__empty')")
  const noMatch = await measure('tree-no-filter-match')
  await screenshot('current-tree-no-match.png')
  await click('button[aria-label="清除待选节点筛选"]')
  const statusGroup = '[role="group"][aria-label="宿主数据状态"]'
  await click(`${statusGroup} button:nth-child(2)`)
  await waitFor("document.querySelector('.lx-virtual-tree__empty')?.innerText.trim() === '暂无数据'")
  const emptyTree = await measure('host-empty-tree')
  await screenshot('current-host-empty-tree.png')
  await click(`${statusGroup} button:nth-child(3)`)
  const loading = await measure('host-loading')
  await screenshot('current-host-loading.png')
  await click(`${statusGroup} button:nth-child(4)`)
  const error = await measure('host-error')
  await screenshot('current-host-error.png')
  await click(`${statusGroup} button:first-child`)
  await waitFor("document.querySelector('.lx-virtual-tree__row[data-lx-tree-key=\"org-01\"]')")
  observations.push({ label: 'distinct-empty-states', filterNoMatch: noMatch.tree?.emptyText, hostEmptyTree: emptyTree.tree?.emptyText, selectedOnEmpty: emptyTree.selectedCount, loading: { busy: loading.host.busy, inert: loading.host.inert, status: loading.host.status }, error: { busy: error.host.busy, inert: error.host.inert, alert: error.host.alert, status: error.host.status } })

  await evaluate(`document.querySelector(${JSON.stringify(sourceSearch)}).focus()`)
  await key('Tab', 'Tab', 9, 8)
  const keyboardFocus = await measure('keyboard-shift-tab-invert-focus')
  await screenshot('current-keyboard-invert-focus.png')
  observations.push({ label: 'keyboard-focus-check', activeElement: keyboardFocus.activeElement, button: keyboardFocus.invertButton, pageTabEventDispatched: true })

  const hudThemeToggle = '.transfer-panel-demo__toolbar-group[aria-label="示例参数"] label:nth-child(2) input'
  await evaluate("document.documentElement.classList.remove('dark', 'lx-theme-hud')")
  await sleep(150)
  if (await evaluate(`document.querySelector(${JSON.stringify(hudThemeToggle)})?.checked`)) await click(hudThemeToggle)
  const lightDefault = await measure('theme-light-default')
  await screenshot('current-desktop-1440-light-default.png')
  await click(hudThemeToggle)
  await waitFor("document.documentElement.classList.contains('dark') && document.documentElement.classList.contains('lx-theme-hud')")
  const hudTheme = await measure('theme-hud-dark')
  await screenshot('current-desktop-hud-theme.png')
  await click(hudThemeToggle)
  await waitFor("!document.documentElement.classList.contains('dark') && !document.documentElement.classList.contains('lx-theme-hud')")
  await evaluate("document.documentElement.classList.add('dark')")
  await waitFor("document.documentElement.classList.contains('dark')")
  const darkDefault = await measure('theme-dark-default')
  await screenshot('current-desktop-dark-default.png')
  await click(hudThemeToggle)
  await waitFor("document.documentElement.classList.contains('dark') && document.documentElement.classList.contains('lx-theme-hud')")
  const darkHud = await measure('theme-dark-hud')
  await screenshot('current-desktop-hud-dark.png')
  await click(hudThemeToggle)
  await waitFor("document.documentElement.classList.contains('dark') && !document.documentElement.classList.contains('lx-theme-hud')")
  await evaluate("document.documentElement.classList.remove('dark')")
  await waitFor("!document.documentElement.classList.contains('dark')")
  observations.push({ label: 'theme-contrast-matrix', method: '设置文档根节点主题类，并用 Demo HUD 开关驱动组件主题', lightDefault: lightDefault.theme, hudDarkTheme: hudTheme.theme, darkDefault: darkDefault.theme, darkHud: darkHud.theme, restoredLightDefault: await evaluate("({ dark: document.documentElement.classList.contains('dark'), hud: document.documentElement.classList.contains('lx-theme-hud') })") })

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId)
  const reduced = await measure('desktop-reduced-motion')
  await send('Emulation.setEmulatedMedia', { features: [] }, sessionId)
  observations.push({ label: 'reduced-motion-check', matches: reduced.reducedMotion.matches, computed: reduced.reducedMotion.computed })

  await fill(sourceSearch, '')
  await click('.transfer-panel-demo__settings summary')
  await setViewport(1440, 1000)
  const anchorKey = 'archive-unit-09'
  await evaluate(`document.querySelector('[data-lx-tree-key="${anchorKey}"]')?.focus()`)
  await waitFor(`document.activeElement?.closest('[role="treeitem"]')?.getAttribute('data-lx-tree-key') === '${anchorKey}'`)
  const anchorAt1440 = await measure('breakpoint-anchor-at-1440')
  await setViewport(375, 812)
  await evaluate("document.querySelector('.transfer-panel-demo').scrollIntoView({block:'start'})")
  const mobile375Source = await measure('mobile-375-source-panel')
  await screenshot('current-mobile-375-source.png')
  await click('[data-testid="mobile-selected-panel"]')
  const mobile375Selected = await measure('mobile-375-selected-panel')
  await screenshot('current-mobile-375-selected.png')
  await click('[data-testid="mobile-source-panel"]')
  const anchorAt375 = await measure('breakpoint-anchor-at-375')

  await setViewport(320, 812)
  await evaluate("document.querySelector('.transfer-panel-demo').scrollIntoView({block:'start'})")
  const mobile320Source = await measure('mobile-320-source-panel')
  await screenshot('current-mobile-320-source.png')
  const anchorAt320 = await measure('breakpoint-anchor-at-320')
  await click('[data-testid="mobile-selected-panel"]')
  const mobile320Selected = await measure('mobile-320-selected-panel')
  await screenshot('current-mobile-320-selected.png')

  await evaluate("(() => { const docs = document.querySelector('.vp-doc'); const heading = [...(docs?.querySelectorAll('h2') ?? [])].find((element) => element.innerText.trim() === 'Props'); heading?.scrollIntoView({block:'start'}); })()")
  await sleep(350)
  const docs320 = await measure('docs-props-at-320')
  await screenshot('current-docs-props-320.png')

  await setViewport(1440, 1000)
  await evaluate("(() => { const docs = document.querySelector('.vp-doc'); const heading = [...(docs?.querySelectorAll('h2') ?? [])].find((element) => element.innerText.trim() === 'Props'); heading?.scrollIntoView({block:'start'}); })()")
  const docs1440 = await measure('docs-props-at-1440')
  observations.push({
    label: 'responsive-and-anchor-summary',
    mobile375: { page: mobile375Source.page, docs: mobile375Source.docs, panel: mobile375Source.panel, sourcePressed: mobile375Source.activeElement, selectedPanel: mobile375Selected.panel },
    mobile320: { page: mobile320Source.page, docs: mobile320Source.docs, panel: mobile320Source.panel, selectedPanel: mobile320Selected.panel },
    anchor: { key: anchorKey, at1440: { itemSize: anchorAt1440.tree?.itemSize, scrollTop: anchorAt1440.tree?.scrollTop, rowOffset: anchorAt1440.tree?.activeRowTopOffset, activeKey: anchorAt1440.tree?.activeKey }, at375: { itemSize: anchorAt375.tree?.itemSize, scrollTop: anchorAt375.tree?.scrollTop, rowOffset: anchorAt375.tree?.activeRowTopOffset, activeKey: anchorAt375.tree?.activeKey }, at320: { itemSize: anchorAt320.tree?.itemSize, scrollTop: anchorAt320.tree?.scrollTop, rowOffset: anchorAt320.tree?.activeRowTopOffset, activeKey: anchorAt320.tree?.activeKey } },
    propsTableAt320: docs320.propsTable,
    propsTableAt1440: docs1440.propsTable,
    pageOverflowAt320: docs320.page.horizontalOverflow,
    docsOverflowAt320: docs320.docs?.horizontalOverflow,
  })

  fs.writeFileSync(path.join(outputDir, 'current-browser-evidence.json'), `${JSON.stringify({
    target: 'linkx-fe/src/components/LxTransferPanel/index.vue + linkx-fe/src/components/LxVirtualTree/index.vue; http://127.0.0.1:4183/components/lxtransferpanel.html',
    browser: version.Browser,
    captureMethod: '新建 Chrome 标签，经 Chrome DevTools Protocol 采集；本地交互示例，无后端写请求',
    browserEvents,
    nonLocalRequests: [...new Set(networkRequests)],
    observations,
  }, null, 2)}\n`)
} finally {
  try { await send('Target.closeTarget', { targetId: target.targetId }) } catch {}
  socket.close()
}
