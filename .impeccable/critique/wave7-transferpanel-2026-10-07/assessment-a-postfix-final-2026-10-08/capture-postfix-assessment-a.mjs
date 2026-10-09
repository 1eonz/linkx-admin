import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const outputDir = path.dirname(fileURLToPath(import.meta.url))
const version = await fetch('http://127.0.0.1:9333/json/version').then((response) => response.json())
const socket = new WebSocket(version.webSocketDebuggerUrl)
const pending = new Map()
const browserEvents = []
let nextId = 0

socket.addEventListener('message', (event) => {
  const message = JSON.parse(String(event.data))
  if (message.method === 'Runtime.exceptionThrown') {
    browserEvents.push({ type: 'exception', detail: message.params.exceptionDetails?.text })
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    browserEvents.push({ type: 'console-error', detail: message.params.args?.map((arg) => arg.value ?? arg.description) })
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
  await send('Emulation.setTouchEmulationEnabled', { enabled: width < 768, maxTouchPoints: 1 }, sessionId)
  await sleep(250)
}

async function screenshot(name) {
  const response = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, sessionId)
  fs.writeFileSync(path.join(outputDir, name), Buffer.from(response.data, 'base64'))
}

async function click(selector) {
  const clicked = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) return false; element.click(); return true; })()`)
  if (!clicked) throw new Error(`Missing click target: ${selector}`)
  await sleep(250)
}

async function typeText(selector, text) {
  await evaluate(`(() => { const input = document.querySelector(${JSON.stringify(selector)}); if (!input) return false; input.focus(); return true; })()`)
  await send('Input.insertText', { text }, sessionId)
  await sleep(450)
}

async function key(key, code, virtualKey, modifiers = 0) {
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, windowsVirtualKeyCode: virtualKey, nativeVirtualKeyCode: virtualKey, modifiers }, sessionId)
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: virtualKey, nativeVirtualKeyCode: virtualKey, modifiers }, sessionId)
  await sleep(250)
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
    const selectedCount = document.querySelector('[data-testid="selected-count"]')?.innerText.trim();
    const actionStatus = panel?.querySelector('[role="status"]')?.innerText.trim() ?? null;
    const rowKey = document.querySelector('.lx-virtual-tree__row[data-lx-tree-key="archive-unit-01"]');
    const matchCodes = [...(panel?.querySelectorAll('[data-lx-transfer-code]') ?? [])].map((node) => node.getAttribute('data-lx-transfer-code'));
    const invert = panel?.querySelector('button[aria-label="反选整棵树"]');
    const toggler = panel?.querySelector('.lx-virtual-tree__toggle');
    const checkbox = panel?.querySelector('.lx-virtual-tree__checkbox-control');
    const reduced = [...(panel?.querySelectorAll('*') ?? [])].map((node) => ({
      className: node.className?.baseVal ?? node.className ?? node.tagName,
      transition: getComputedStyle(node).transitionDuration,
      animation: getComputedStyle(node).animationDuration,
    })).filter((item) => item.transition !== '0s' || item.animation !== '0s').slice(0, 16);
    return {
      viewport: { width: innerWidth, height: innerHeight },
      document: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth },
      panel: rect(panel),
      theme: { dark: document.documentElement.classList.contains('dark'), hud: document.documentElement.classList.contains('lx-theme-hud') },
      panelText: panel?.innerText.slice(0, 400),
      tree: tree ? { scrollTop: Math.round(tree.scrollTop), scrollHeight: tree.scrollHeight, clientHeight: tree.clientHeight, renderedRows: rows.length, firstKey: rows[0]?.getAttribute('data-lx-tree-key'), emptyText: tree.querySelector('.lx-virtual-tree__empty')?.innerText.trim() ?? null } : null,
      selectedCount,
      demoStatus: document.querySelector('[data-testid="transfer-status"]')?.innerText.trim() ?? null,
      sourceSearch: search?.value ?? null,
      matchingTreeKeys: rows.map((row) => row.getAttribute('data-lx-tree-key')),
      rowStates: rows.map((row) => ({
        key: row.getAttribute('data-lx-tree-key'),
        checked: row.getAttribute('aria-checked'),
        disabled: row.classList.contains('is-disabled'),
      })),
      matchingCodes: matchCodes,
      codeNode: rowKey ? { checked: rowKey.getAttribute('aria-checked'), label: rowKey.querySelector('.lx-virtual-tree__label')?.innerText.trim() } : null,
      invertButton: invert ? { disabled: invert.disabled, rect: rect(invert), focusVisible: invert.matches(':focus-visible'), description: invert.title } : null,
      firstTreeFocus: rows[0] ? { label: rows[0].querySelector('.lx-virtual-tree__label')?.innerText.trim(), checked: rows[0].getAttribute('aria-checked'), outlineStyle: getComputedStyle(rows[0]).outlineStyle, outlineWidth: getComputedStyle(rows[0]).outlineWidth, focusVisible: rows[0].matches(':focus-visible') } : null,
      touchTargets: { expander: rect(toggler), checkbox: rect(checkbox) },
      actionStatus,
      reducedMotionTransitions: reduced,
      activeElement: document.activeElement ? { tag: document.activeElement.tagName, label: document.activeElement.getAttribute('aria-label'), text: document.activeElement.innerText?.trim().slice(0, 80), focusVisible: document.activeElement.matches?.(':focus-visible') ?? false } : null,
      pageHorizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    };
  })()`)
  observations.push({ label, ...value })
  return value
}

try {
  await setViewport(1440, 1000)
  await send('Page.navigate', { url: 'http://127.0.0.1:4183/components/lxtransferpanel.html' }, sessionId)
  await waitFor("document.querySelector('.lx-transfer-panel') && document.querySelector('.transfer-panel-demo__settings summary')")
  await sleep(1000)
  await evaluate("document.querySelector('.transfer-panel-demo').scrollIntoView({block:'start'})")
  await click('.transfer-panel-demo__settings summary')
  await measure('desktop-default')
  await screenshot('desktop-default.png')

  const sourceSearch = 'input[aria-label="按机构名称或部门编码筛选待选节点"]'
  await evaluate(`document.querySelector(${JSON.stringify(sourceSearch)}).focus()`)
  await evaluate("window.__assessmentKeyboardEvents = []; document.addEventListener('keydown', (event) => window.__assessmentKeyboardEvents.push({ type: event.type, key: event.key, trusted: event.isTrusted, target: event.target?.getAttribute?.('aria-label') } ), true); document.addEventListener('keyup', (event) => window.__assessmentKeyboardEvents.push({ type: event.type, key: event.key, trusted: event.isTrusted, target: event.target?.getAttribute?.('aria-label') } ), true); document.addEventListener('click', (event) => { if (event.target?.closest?.('button[aria-label=\"反选整棵树\"]')) window.__assessmentKeyboardEvents.push({ type: event.type, trusted: event.isTrusted, label: event.target.closest('button').getAttribute('aria-label') }); }, true)")
  await key('Tab', 'Tab', 9, 8)
  const focusedInvert = await measure('keyboard-shift-tab-focus-invert')
  await key('Enter', 'Enter', 13)
  const inverted = await measure('keyboard-enter-invert-whole-tree')
  const keyboardEvents = await evaluate('window.__assessmentKeyboardEvents')
  await screenshot('keyboard-focus-enter-no-activation.png')
  await click('button[aria-label="反选整棵树"]')
  const afterMouseClick = await measure('mouse-click-invert-whole-tree')
  await click('button[aria-label="反选整棵树"]')
  const restored = await measure('mouse-click-restore-whole-tree')
  observations.push({ label: 'keyboard-whole-tree-inversion', focus: focusedInvert.activeElement, keyboardEvents, before: focusedInvert.rowStates.filter((row) => row.checked === 'true').map((row) => row.key), afterKey: inverted.rowStates.filter((row) => row.checked === 'true').map((row) => row.key), afterMouseClick: afterMouseClick.rowStates.filter((row) => row.checked === 'true').map((row) => row.key), afterRestoreClick: restored.rowStates.filter((row) => row.checked === 'true').map((row) => row.key), beforeCount: focusedInvert.selectedCount, afterKeyCount: inverted.selectedCount, afterMouseClickCount: afterMouseClick.selectedCount, afterRestoreCount: restored.selectedCount, beforeDemoStatus: focusedInvert.demoStatus, afterKeyDemoStatus: inverted.demoStatus, afterMouseClickDemoStatus: afterMouseClick.demoStatus, afterRestoreDemoStatus: restored.demoStatus })

  await typeText(sourceSearch, 'unit-pending-01')
  await waitFor("document.querySelector('.lx-virtual-tree__row[data-lx-tree-key=\"archive-unit-01\"]')")
  const lowerMatch = await measure('filter-lowercase-department-code')
  await screenshot('filter-code-lowercase.png')
  await click('.lx-transfer-panel__filter--source button[aria-label="清除待选节点筛选"]')
  await typeText(sourceSearch, 'UNIT-PENDING-01')
  await waitFor("document.querySelector('.lx-virtual-tree__row[data-lx-tree-key=\"archive-unit-01\"]')")
  const upperMatch = await measure('filter-uppercase-department-code')
  observations.push({ label: 'case-insensitive-code-filter', lowercase: { keys: lowerMatch.matchingTreeKeys, visibleCode: lowerMatch.matchingCodes }, uppercase: { keys: upperMatch.matchingTreeKeys, visibleCode: upperMatch.matchingCodes } })

  await click('.lx-transfer-panel__filter--source button[aria-label="清除待选节点筛选"]')
  await typeText(sourceSearch, 'NO-SUCH-UNIT')
  await waitFor("document.querySelector('.lx-virtual-tree__empty')")
  const noMatch = await measure('tree-no-search-match')
  await screenshot('state-search-no-match.png')
  await click('.lx-transfer-panel__filter--source button[aria-label="清除待选节点筛选"]')
  await click('.transfer-panel-demo__toolbar-group[aria-label="宿主数据状态"] button:nth-child(2)')
  await waitFor("document.querySelector('.lx-virtual-tree__empty')")
  const empty = await measure('host-empty-tree')
  await screenshot('state-empty-tree.png')
  observations.push({ label: 'empty-vs-no-match-copy', searchNoMatch: noMatch.tree?.emptyText, emptyData: empty.tree?.emptyText, searchAfterClear: empty.sourceSearch, emptyTreeHeight: empty.tree?.clientHeight })
  await click('.transfer-panel-demo__toolbar-group[aria-label="宿主数据状态"] button:first-child')

  await click('.transfer-panel-demo__toolbar-group[aria-label="示例参数"] label:nth-child(2) input')
  await measure('desktop-hud-dark')
  await screenshot('desktop-hud-dark.png')
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId)
  const reduced = await measure('desktop-reduced-motion')
  observations.push({ label: 'prefers-reduced-motion', mediaMatches: await evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches"), reducedTransitions: reduced.reducedMotionTransitions })

  await click('.transfer-panel-demo__settings summary')
  await setViewport(375, 812)
  await evaluate("document.querySelector('.transfer-panel-demo').scrollIntoView({block:'start'})")
  await measure('mobile-375-default-settings-closed')
  await screenshot('mobile-375-default-settings-closed.png')
  await click('.transfer-panel-demo__settings summary')
  await measure('mobile-375-settings-open')
  await screenshot('mobile-375.png')
  await setViewport(320, 812)
  await evaluate("document.querySelector('.transfer-panel-demo').scrollIntoView({block:'start'})")
  const mobile320 = await measure('mobile-320')
  await screenshot('mobile-320.png')

  fs.writeFileSync(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify({
    target: 'http://127.0.0.1:4183/components/lxtransferpanel.html',
    browser: version.Browser,
    captureMethod: 'Chrome DevTools Protocol, independent fresh tab, direct PNG viewport captures',
    browserEvents,
    observations,
    viewportSummary: {
      desktop: observations.find((item) => item.label === 'desktop-default')?.viewport,
      mobile375: observations.find((item) => item.label === 'mobile-375-default-settings-closed')?.viewport,
      mobile320: mobile320.viewport,
    },
  }, null, 2)}\n`)
} finally {
  try { await send('Target.closeTarget', { targetId: target.targetId }) } catch {}
  socket.close()
}
