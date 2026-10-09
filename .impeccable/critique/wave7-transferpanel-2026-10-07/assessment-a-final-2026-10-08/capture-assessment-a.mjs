import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const outputDir = path.dirname(fileURLToPath(import.meta.url))
const browserInfo = await fetch('http://127.0.0.1:9333/json/version').then((r) => r.json())
const socket = new WebSocket(browserInfo.webSocketDebuggerUrl)
const pending = new Map()
const events = []
let nextId = 0

socket.addEventListener('message', (event) => {
  const message = JSON.parse(String(event.data))
  if (message.method === 'Runtime.exceptionThrown') {
    events.push({ type: 'exception', detail: message.params.exceptionDetails?.text })
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    events.push({ type: 'console-error', detail: message.params.args?.map((arg) => arg.value ?? arg.description) })
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

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  }, sessionId)
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result?.value
}

async function waitFor(expression, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await evaluate(expression)) return
    await sleep(250)
  }
  throw new Error(`Timed out waiting for ${expression}`)
}

async function setViewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
    screenWidth: width,
    screenHeight: height,
  }, sessionId)
  await send('Emulation.setTouchEmulationEnabled', {
    enabled: width < 768,
    maxTouchPoints: 1,
  }, sessionId)
  await sleep(200)
}

async function screenshot(name) {
  const result = await send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  }, sessionId)
  fs.writeFileSync(path.join(outputDir, name), Buffer.from(result.data, 'base64'))
}

async function click(selector) {
  const clicked = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) return false; element.click(); return true; })()`)
  if (!clicked) throw new Error(`Missing click target: ${selector}`)
  await sleep(180)
}

async function insertText(selector, value) {
  await evaluate(`(() => { const input = document.querySelector(${JSON.stringify(selector)}); if (!input) return false; input.focus(); return true; })()`)
  await send('Input.insertText', { text: value }, sessionId)
  await sleep(500)
}

async function pressKey(key, code, windowsVirtualKeyCode) {
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key,
    code,
    windowsVirtualKeyCode,
    nativeVirtualKeyCode: windowsVirtualKeyCode,
  }, sessionId)
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key,
    code,
    windowsVirtualKeyCode,
    nativeVirtualKeyCode: windowsVirtualKeyCode,
  }, sessionId)
  await sleep(250)
}

async function tap(selector) {
  const box = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) return null; const r = element.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, width: r.width, height: r.height }; })()`)
  if (!box) throw new Error(`Missing touch target: ${selector}`)
  await send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ id: 1, x: box.x, y: box.y, radiusX: 1, radiusY: 1, force: 1 }],
  }, sessionId)
  await send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [{ id: 1, x: box.x, y: box.y, radiusX: 1, radiusY: 1, force: 0 }],
  }, sessionId)
  await sleep(500)
  return box
}

async function measure(label) {
  const result = await evaluate(`(() => {
    const rect = (element) => {
      if (!element) return null;
      const r = element.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
    };
    const panel = document.querySelector('.lx-transfer-panel');
    const sourceInput = document.querySelector('input[aria-label="按机构名称或部门编码筛选待选节点"]');
    const selectedInput = document.querySelector('input[aria-label="在已选项中检索"]');
    const tree = document.querySelector('.lx-virtual-tree__viewport');
    const selected = document.querySelector('.lx-transfer-panel__selected');
    const root = document.querySelector('.lx-virtual-tree__row[data-lx-tree-key="org-01"]');
    const toggle = root?.querySelector('.lx-virtual-tree__toggle');
    const checkbox = root?.querySelector('.lx-virtual-tree__checkbox-control');
    const mobileButtons = [...document.querySelectorAll('.lx-transfer-panel__mobile-switch button')];
    const buttons = [...(panel?.querySelectorAll('button') ?? [])];
    const namedButtons = buttons.map((button) => ({
      name: button.getAttribute('aria-label') || button.innerText.trim() || button.title || '',
      disabled: button.disabled,
      inInertRegion: Boolean(button.closest('[inert]')),
    }));
    const rows = [...(panel?.querySelectorAll('[role="treeitem"]') ?? [])];
    const unnamedInputs = [...(panel?.querySelectorAll('input') ?? [])]
      .filter((input) => !input.getAttribute('aria-label') && !input.labels?.length)
      .map((input) => input.outerHTML.slice(0, 120));
    const transitions = [...(panel?.querySelectorAll('*') ?? [])]
      .map((element) => ({
        selector: element.className?.baseVal ?? element.className ?? element.tagName,
        transition: getComputedStyle(element).transitionDuration,
        animation: getComputedStyle(element).animationDuration,
      }))
      .filter((item) => item.transition !== '0s' || item.animation !== '0s')
      .slice(0, 12);
    return {
      viewport: { width: innerWidth, height: innerHeight },
      document: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth },
      panel: rect(panel),
      panelInert: panel?.hasAttribute('inert') ?? false,
      hostBusy: document.querySelector('.transfer-panel-demo__surface')?.getAttribute('aria-busy'),
      hostMessage: document.querySelector('.transfer-panel-demo__message')?.innerText.trim() ?? null,
      theme: { dark: document.documentElement.classList.contains('dark'), hud: document.documentElement.classList.contains('lx-theme-hud') },
      sourceSearch: sourceInput?.value ?? null,
      selectedSearch: selectedInput?.value ?? null,
      tree: tree ? { scrollTop: Math.round(tree.scrollTop), scrollHeight: tree.scrollHeight, clientHeight: tree.clientHeight, renderedRows: rows.length, firstVisibleKey: rows[0]?.getAttribute('data-lx-tree-key') ?? null } : null,
      selectedList: selected ? { scrollTop: Math.round(selected.scrollTop), scrollHeight: selected.scrollHeight, clientHeight: selected.clientHeight, itemCount: selected.querySelectorAll('.lx-transfer-panel__selected-item').length, hint: document.querySelector('.lx-transfer-panel__selected-scroll-hint')?.innerText.trim() ?? null } : null,
      rootRow: root ? { rect: rect(root), expanded: root.getAttribute('aria-expanded'), checked: root.getAttribute('aria-checked'), focusOutline: getComputedStyle(root).outlineStyle } : null,
      touchTargets: { toggle: rect(toggle), checkbox: rect(checkbox), mobileSource: rect(mobileButtons[0]), mobileSelected: rect(mobileButtons[1]) },
      namedButtons,
      unnamedInputs,
      pageHorizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      reducedMotionTransitions: transitions,
      activeElement: document.activeElement ? { tag: document.activeElement.tagName, label: document.activeElement.getAttribute('aria-label'), text: document.activeElement.innerText?.trim().slice(0, 80) } : null,
    };
  })()`)
  observations.push({ label, ...result })
  return result
}

try {
  await setViewport(1440, 980)
  await send('Page.navigate', { url: 'http://127.0.0.1:4183/components/lxtransferpanel.html' }, sessionId)
  await waitFor("document.querySelector('.lx-transfer-panel') && document.querySelector('.transfer-panel-demo__settings summary')")
  await sleep(1000)
  await evaluate("document.querySelector('.transfer-panel-demo').scrollIntoView({ block: 'start' })")
  await sleep(250)
  await click('.transfer-panel-demo__settings summary')
  await measure('desktop-light-default')
  await screenshot('desktop-light-default.png')

  const sourceSelector = 'input[aria-label="按机构名称或部门编码筛选待选节点"]'
  await insertText(sourceSelector, 'UNIT-PENDING-01')
  await waitFor("document.querySelector('.lx-virtual-tree__row[data-lx-tree-key=\"archive-unit-01\"]')")
  await evaluate("document.querySelector('.lx-virtual-tree__row[data-lx-tree-key=\"archive-unit-01\"]').focus()")
  await pressKey(' ', 'Space', 32)
  const keyboardSelection = await measure('keyboard-code-search-space-select')
  await click('.lx-transfer-panel__filter--source button[aria-label="清除待选节点筛选"]')
  await waitFor("document.querySelector('.lx-virtual-tree__row[data-lx-tree-key=\"org-01\"]')")
  await evaluate("document.querySelector('.lx-virtual-tree__row[data-lx-tree-key=\"org-01\"]').focus()")
  await pressKey('ArrowLeft', 'ArrowLeft', 37)
  const keyboardCollapsed = await evaluate("document.querySelector('.lx-virtual-tree__row[data-lx-tree-key=\"org-01\"]')?.getAttribute('aria-expanded')")
  await pressKey('ArrowRight', 'ArrowRight', 39)
  const keyboardExpanded = await evaluate("document.querySelector('.lx-virtual-tree__row[data-lx-tree-key=\"org-01\"]')?.getAttribute('aria-expanded')")
  observations.push({ label: 'keyboard-expand-collapse', collapsed: keyboardCollapsed, expanded: keyboardExpanded, selection: keyboardSelection.selectedList?.itemCount })

  await click('.transfer-panel-demo__toolbar-group[aria-label="示例参数"] label:nth-child(2) input')
  await sleep(350)
  await measure('desktop-dark-hud')
  await screenshot('desktop-dark-hud.png')

  await setViewport(375, 812)
  await evaluate("document.querySelector('.transfer-panel-demo').scrollIntoView({ block: 'start' })")
  await sleep(300)
  await measure('mobile-375-source')
  await screenshot('mobile-375-source.png')

  await setViewport(320, 812)
  await evaluate("document.querySelector('.transfer-panel-demo').scrollIntoView({ block: 'start' })")
  await sleep(300)
  await measure('mobile-320-source')
  await screenshot('mobile-320-source.png')

  const archivedSearch = '归档机构 02'
  await insertText(sourceSelector, archivedSearch)
  await waitFor("document.querySelector('.lx-virtual-tree__row[data-lx-tree-key=\"division-02\"]')")
  await evaluate("document.querySelector('.lx-virtual-tree__viewport').scrollTop = 160")
  await sleep(300)
  const scrollBeforeSwitch = await measure('mobile-320-before-panel-switch')
  const rootToggleBefore = await evaluate("document.querySelector('.lx-virtual-tree__row[data-lx-tree-key=\"org-01\"]')?.getAttribute('aria-expanded')")
  await tap('.lx-transfer-panel__mobile-switch button[data-testid="mobile-selected-panel"]')
  const sourceSearchOnSelected = await evaluate(`document.querySelector(${JSON.stringify(sourceSelector)})?.value`)
  await insertText('input[aria-label="在已选项中检索"]', 'LEGACY-08')
  await measure('mobile-320-selected-search')
  await screenshot('mobile-320-selected.png')
  await tap('.lx-transfer-panel__mobile-switch button[data-testid="mobile-source-panel"]')
  const scrollAfterSwitch = await measure('mobile-320-after-panel-switch')
  observations.push({ label: 'mobile-panel-state-retention', sourceSearchBefore: archivedSearch, sourceSearchAfter: sourceSearchOnSelected, treeScrollBefore: scrollBeforeSwitch.tree?.scrollTop, treeScrollAfter: scrollAfterSwitch.tree?.scrollTop, rootExpanded: rootToggleBefore })

  await click('.lx-transfer-panel__filter:not(.lx-transfer-panel__filter--source) button[aria-label="清除已选项筛选"]')
  await click('.lx-transfer-panel__filter--source button[aria-label="清除待选节点筛选"]')
  await click('.transfer-panel-demo__toolbar-group[aria-label="示例参数"] label:first-child input')
  await insertText(sourceSelector, 'SUB-22')
  await waitFor("document.querySelector('.lx-virtual-tree__row[data-lx-tree-key=\"unit-03\"]')")
  const touchCheckbox = await tap('.lx-virtual-tree__row[data-lx-tree-key="unit-03"] .lx-virtual-tree__checkbox-control')
  const mobileTouchSelection = await measure('mobile-320-touch-checkbox')
  observations.push({ label: 'mobile-touch-control', checkboxTapBox: touchCheckbox, rootToggleBefore: rootToggleBefore, selectedAfterTap: mobileTouchSelection.selectedList?.itemCount })
  await click('.lx-transfer-panel__filter--source button[aria-label="清除待选节点筛选"]')
  await waitFor("document.querySelector('.lx-virtual-tree__row[data-lx-tree-key=\"org-01\"]')")
  await click('.lx-virtual-tree__row[data-lx-tree-key="org-01"] .lx-virtual-tree__toggle')
  const touchToggleBefore = await evaluate("document.querySelector('.lx-virtual-tree__row[data-lx-tree-key=\"org-01\"]')?.getAttribute('aria-expanded')")
  await tap('.lx-virtual-tree__row[data-lx-tree-key="org-01"] .lx-virtual-tree__toggle')
  const touchToggleAfter = await evaluate("document.querySelector('.lx-virtual-tree__row[data-lx-tree-key=\"org-01\"]')?.getAttribute('aria-expanded')")
  observations.push({ label: 'mobile-touch-expand', before: touchToggleBefore, after: touchToggleAfter })

  await tap('.lx-transfer-panel__mobile-switch button[data-testid="mobile-selected-panel"]')
  await evaluate("(() => { const list = document.querySelector('.lx-transfer-panel__selected'); if (list) list.scrollTop = list.scrollHeight; })()")
  await sleep(400)
  const selectedScrollBeforeState = await measure('mobile-selected-list-at-bottom')
  await setViewport(1440, 980)
  await evaluate("document.querySelector('.transfer-panel-demo').scrollIntoView({ block: 'start' })")
  await sleep(300)
  await click('.transfer-panel-demo__toolbar-group[aria-label="示例参数"] label:first-child input')
  await click('.transfer-panel-demo__toolbar-group[aria-label="示例参数"] label:nth-child(2) input')
  await insertText(sourceSelector, archivedSearch)
  await waitFor("document.querySelector('.lx-virtual-tree__row[data-lx-tree-key=\"division-02\"]')")
  await evaluate("document.querySelector('.lx-virtual-tree__viewport').scrollTop = 160; const list = document.querySelector('.lx-transfer-panel__selected'); if (list) list.scrollTop = Math.min(80, list.scrollHeight)")
  await sleep(300)
  const beforeState = await measure('desktop-before-host-states')

  await click('.transfer-panel-demo__toolbar-group button[aria-pressed][type="button"]:nth-child(3)')
  await measure('host-loading')
  await screenshot('state-loading.png')
  await click('.transfer-panel-demo__toolbar-group button[aria-pressed][type="button"]:nth-child(4)')
  const errorState = await measure('host-error')
  await screenshot('state-error.png')
  await click('.transfer-panel-demo__toolbar-group button[aria-pressed][type="button"]:nth-child(2)')
  const emptyState = await measure('host-empty')
  await screenshot('state-empty.png')
  await click('.transfer-panel-demo__toolbar-group button[aria-pressed][type="button"]:first-child')
  const afterState = await measure('host-ready-after-state-cycle')
  observations.push({
    label: 'host-state-retention',
    before: { search: beforeState.sourceSearch, treeScroll: beforeState.tree?.scrollTop, selectedScroll: beforeState.selectedList?.scrollTop },
    error: { search: errorState.sourceSearch, treeScroll: errorState.tree?.scrollTop, selectedScroll: errorState.selectedList?.scrollTop, inert: errorState.panelInert, message: errorState.hostMessage },
    empty: { search: emptyState.sourceSearch, treeScroll: emptyState.tree?.scrollTop, selectedScroll: emptyState.selectedList?.scrollTop, message: emptyState.tree?.renderedRows ? null : emptyState.hostMessage },
    after: { search: afterState.sourceSearch, treeScroll: afterState.tree?.scrollTop, selectedScroll: afterState.selectedList?.scrollTop },
    selectedScrollBeforeState: selectedScrollBeforeState.selectedList?.scrollTop,
  })

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId)
  const reducedMotion = await measure('desktop-reduced-motion')
  observations.push({ label: 'reduced-motion-media', matches: await evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches"), transitions: reducedMotion.reducedMotionTransitions })
  await evaluate("window.scrollTo(0, 0)")
  await measure('desktop-final-accessibility-snapshot')

  fs.writeFileSync(path.join(outputDir, 'browser-observations.json'), `${JSON.stringify({
    target: 'http://127.0.0.1:4183/components/lxtransferpanel.html',
    browser: browserInfo.Browser,
    captureMethod: 'Chrome DevTools Protocol; fresh tab; screenshots are direct PNG captures',
    events,
    observations,
  }, null, 2)}\n`)
} finally {
  try { await send('Target.closeTarget', { targetId: target.targetId }) } catch {}
  socket.close()
}
