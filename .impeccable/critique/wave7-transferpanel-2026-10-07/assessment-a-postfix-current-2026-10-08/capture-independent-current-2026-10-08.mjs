import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const outputDir = dirname(fileURLToPath(import.meta.url))
const sourcePath = resolve(outputDir, '../../../../linkx-fe/src/components/LxTransferPanel/index.vue')
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const pageUrl = 'http://127.0.0.1:4175/components/lxtransferpanel.html'
const profileDir = await mkdtemp(resolve(tmpdir(), 'lx-transferpanel-assessment-a-'))
const sleep = (duration) => new Promise((resolvePromise) => setTimeout(resolvePromise, duration))
const hashSource = async () =>
  createHash('sha256').update(await readFile(sourcePath)).digest('hex').toUpperCase()

await mkdir(outputDir, { recursive: true })
const sourceSha256Before = await hashSource()
const browser = spawn(
  chromePath,
  [
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--remote-debugging-address=127.0.0.1',
    '--remote-debugging-port=0',
    '--window-size=1440,900',
    '--user-data-dir=' + profileDir,
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true },
)
const browserExit = new Promise((resolvePromise) => browser.once('exit', resolvePromise))

let browserStderr = ''
browser.stderr.setEncoding('utf8')
browser.stderr.on('data', (chunk) => {
  browserStderr += chunk
})

let devtoolsPort
for (let attempt = 0; attempt < 80 && !devtoolsPort; attempt += 1) {
  const match = browserStderr.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//)
  if (match) devtoolsPort = Number(match[1])
  else await sleep(250)
}

if (!devtoolsPort) {
  browser.kill()
  await rm(profileDir, { recursive: true, force: true })
  throw new Error('Chrome DevTools did not start: ' + browserStderr)
}

const tab = await fetch('http://127.0.0.1:' + devtoolsPort + '/json/new?about:blank', {
  method: 'PUT',
}).then((response) => response.json())
const socket = new WebSocket(tab.webSocketDebuggerUrl)
await new Promise((resolvePromise, rejectPromise) => {
  socket.addEventListener('open', resolvePromise, { once: true })
  socket.addEventListener('error', rejectPromise, { once: true })
})

let commandId = 0
const pending = new Map()
const browserEvents = []
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.id && pending.has(message.id)) {
    const waiter = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) waiter.reject(new Error(message.error.message))
    else waiter.resolve(message.result ?? {})
    return
  }
  if (message.method === 'Runtime.exceptionThrown') {
    browserEvents.push({
      kind: 'exception',
      text: message.params.exceptionDetails.text,
      description: message.params.exceptionDetails.exception?.description ?? '',
    })
  }
  if (message.method === 'Runtime.consoleAPICalled') {
    browserEvents.push({
      kind: 'console',
      type: message.params.type,
      text: message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '),
    })
  }
})

const call = (method, params = {}) =>
  new Promise((resolvePromise, rejectPromise) => {
    const id = ++commandId
    pending.set(id, { resolve: resolvePromise, reject: rejectPromise })
    socket.send(JSON.stringify({ id, method, params }))
  })

const evaluate = async (expression) => {
  const response = await call('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  })
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text)
  }
  return response.result?.value
}

const setViewport = async (width, height, mobile) => {
  await call('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  })
  await sleep(250)
}

const pauseInPage = (milliseconds) =>
  evaluate('new Promise((resolvePromise) => setTimeout(resolvePromise, ' + milliseconds + '))')

const capture = async (name) => {
  const result = await call('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  })
  await writeFile(resolve(outputDir, name), Buffer.from(result.data, 'base64'))
  return name
}

const setInput = async (selector, value) => {
  await evaluate(
    '(() => { const input = document.querySelector(' +
      JSON.stringify(selector) +
      '); if (!input) return false; const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; setter.call(input, ' +
      JSON.stringify(value) +
      '); input.dispatchEvent(new Event("input", { bubbles: true })); return true })()',
  )
  await pauseInPage(180)
}

const clickText = async (text) =>
  evaluate(
    '(() => { const button = Array.from(document.querySelectorAll("button")).find((item) => item.innerText.trim() === ' +
      JSON.stringify(text) +
      '); if (!button) return false; button.click(); return true })()',
  )

const clickSelector = async (selector) =>
  evaluate(
    '(() => { const element = document.querySelector(' +
      JSON.stringify(selector) +
      '); if (!element) return false; element.click(); return true })()',
  )

const visibleRows = () =>
  evaluate('Array.from(document.querySelectorAll(".lx-virtual-tree__row")).map((row) => row.innerText.replace(/\\s+/g, " ").trim())')

const evidence = {
  method: '独立 Chromium 新标签；CDP 浏览器自动化和可视截图；本轮不运行 detector。',
  pageUrl,
  capturedAt: new Date().toISOString(),
  browser: { chromePath, version: null, targetId: tab.id },
  sourceSha256Before,
  sourceSha256After: null,
  screenshots: [],
  desktop: {},
  filters: {},
  limits: {},
  focusAndConfirmation: {},
  mobile: {},
  states: {},
  theme: {},
  reducedMotion: {},
  browserEvents,
}

try {
  const version = await fetch('http://127.0.0.1:' + devtoolsPort + '/json/version').then((response) => response.json())
  evidence.browser.version = version.Browser
  await call('Page.enable')
  await call('Runtime.enable')
  await setViewport(1440, 900, false)
  await call('Page.navigate', { url: pageUrl })
  const deadline = Date.now() + 20000
  while (Date.now() < deadline) {
    const ready = await evaluate('document.readyState === "complete" && Boolean(document.querySelector(".lx-transfer-panel"))').catch(() => false)
    if (ready) break
    await sleep(250)
  }
  if (!(await evaluate('Boolean(document.querySelector(".lx-transfer-panel"))'))) {
    throw new Error('LxTransferPanel did not mount at ' + pageUrl)
  }
  await evaluate('(() => { const settings = document.querySelector(".transfer-panel-demo__settings"); if (settings) settings.open = true; document.querySelector(".lx-transfer-panel")?.scrollIntoView({ block: "center" }) })()')
  await sleep(400)

  evidence.desktop = await evaluate('(() => { const rect = (element) => { if (!element) return null; const value = element.getBoundingClientRect(); return { x: Math.round(value.x), y: Math.round(value.y), width: Math.round(value.width), height: Math.round(value.height) } }; const root = document.querySelector(".lx-transfer-panel"); const style = root ? getComputedStyle(root) : null; const panels = Array.from(document.querySelectorAll(".lx-transfer-panel__panel")); const sourceTree = document.querySelector(".lx-virtual-tree__viewport"); const selectedList = document.querySelector(".lx-transfer-panel__selected"); const hint = document.querySelector("[data-testid=selected-scroll-hint]"); const gridTracks = style ? style.gridTemplateColumns.split(" ").map((value) => Number.parseFloat(value)) : []; return { viewport: { width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth }, root: rect(root), gridTemplateColumns: style?.gridTemplateColumns ?? null, gridTracks, gap: style?.columnGap ?? null, panels: panels.map((panel) => rect(panel)), panelHeightsEqual: panels.length === 2 && rect(panels[0]).height === rect(panels[1]).height, treeScroll: sourceTree ? { clientHeight: sourceTree.clientHeight, scrollHeight: sourceTree.scrollHeight } : null, selectedScroll: selectedList ? { clientHeight: selectedList.clientHeight, scrollHeight: selectedList.scrollHeight, describedBy: selectedList.getAttribute("aria-describedby") } : null, scrollHint: hint ? { text: hint.innerText, role: hint.getAttribute("role"), live: hint.getAttribute("aria-live"), id: hint.id } : null, titles: Array.from(document.querySelectorAll(".lx-transfer-panel__title")).map((item) => item.innerText.trim()) } })()')
  evidence.screenshots.push(await capture('independent-desktop-default-2026-10-08.png'))

  evidence.limits = await evaluate('(() => { const button = document.querySelector(".lx-transfer-panel__controls-action button"); const describedBy = button?.getAttribute("aria-describedby"); return { buttonText: button?.getAttribute("aria-label"), disabled: button?.disabled ?? null, title: button?.title ?? null, visibleHint: document.querySelector("[data-testid=select-all-compact-hint]")?.innerText ?? null, accessibleReason: describedBy ? document.getElementById(describedBy)?.innerText ?? null : null, initialSelectedCount: document.querySelectorAll(".lx-transfer-panel__selected-item").length } })()')
  evidence.screenshots.push(await capture('independent-desktop-limit-2026-10-08.png'))

  await setInput('input[aria-label="按名称筛选待选节点"]', 'UNIT-PENDING-01')
  evidence.filters.leftByCode = {
    query: 'UNIT-PENDING-01',
    visibleRows: await visibleRows(),
    viewportText: await evaluate('document.querySelector(".lx-virtual-tree__viewport")?.innerText ?? ""'),
  }
  await setInput('input[aria-label="按名称筛选待选节点"]', '待授权特勤支队')
  evidence.filters.leftByName = {
    query: '待授权特勤支队',
    visibleRows: await visibleRows(),
    viewportText: await evaluate('document.querySelector(".lx-virtual-tree__viewport")?.innerText ?? ""'),
  }
  await clickSelector('button[aria-label="清除待选节点筛选"]')
  evidence.filters.leftClearRestoresFocus = await evaluate('document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.tagName ?? null')

  await setInput('input[aria-label="在已选项中检索"]', 'LEGACY-08')
  evidence.filters.rightByCode = await evaluate('(() => ({ labels: Array.from(document.querySelectorAll(".lx-transfer-panel__selected-item")).map((item) => item.innerText.replace(/\\s+/g, " ").trim()), count: document.querySelectorAll(".lx-transfer-panel__selected-item").length }))()')
  await clickSelector('button[aria-label="清除已选项筛选"]')
  evidence.filters.rightClearRestoresFocus = await evaluate('document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.tagName ?? null')

  await evaluate('(() => { const maxCount = document.querySelectorAll(".transfer-panel-demo__toolbar-group input")[0]; if (maxCount?.checked) maxCount.click() })()')
  await clickSelector('.lx-transfer-panel__controls-action button[aria-label="全部加入"]')
  await pauseInPage(350)
  evidence.desktop.selectedOverflowAtTop = await evaluate('(() => ({ list: { clientHeight: document.querySelector(".lx-transfer-panel__selected")?.clientHeight ?? null, scrollHeight: document.querySelector(".lx-transfer-panel__selected")?.scrollHeight ?? null, describedBy: document.querySelector(".lx-transfer-panel__selected")?.getAttribute("aria-describedby") ?? null }, hint: document.querySelector("[data-testid=selected-scroll-hint]") ? { text: document.querySelector("[data-testid=selected-scroll-hint]").innerText, role: document.querySelector("[data-testid=selected-scroll-hint]").getAttribute("role"), live: document.querySelector("[data-testid=selected-scroll-hint]").getAttribute("aria-live"), atomic: document.querySelector("[data-testid=selected-scroll-hint]").getAttribute("aria-atomic") } : null, selectedCount: document.querySelectorAll(".lx-transfer-panel__selected-item").length }))()')
  evidence.screenshots.push(await capture('independent-desktop-selected-overflow-2026-10-08.png'))
  await evaluate('document.querySelector(".lx-transfer-panel__selected")?.scrollTo({ top: document.querySelector(".lx-transfer-panel__selected").scrollHeight })')
  await pauseInPage(150)
  evidence.desktop.scrollHintAtBottom = await evaluate('(() => ({ describedBy: document.querySelector(".lx-transfer-panel__selected")?.getAttribute("aria-describedby") ?? null, hintText: document.querySelector("[data-testid=selected-scroll-hint]")?.innerText ?? null, scrollTop: document.querySelector(".lx-transfer-panel__selected")?.scrollTop ?? null }))()')

  await evaluate('(() => { const button = Array.from(document.querySelectorAll(".lx-transfer-panel__selected-item button")).find((item) => item.getAttribute("aria-label")?.startsWith("移除 交警直属特勤一中队")); button?.click() })()')
  await sleep(220)
  evidence.focusAndConfirmation.loadedRemovalFocus = await evaluate('(() => { const active = document.activeElement; return { tag: active?.tagName ?? null, label: active?.getAttribute("aria-label") ?? null, text: active?.innerText?.trim() ?? null } })()')
  await evaluate('(() => { const button = Array.from(document.querySelectorAll(".lx-transfer-panel__selected-item button")).find((item) => item.getAttribute("aria-label")?.startsWith("移除 历史授权单位")); button?.click() })()')
  await sleep(250)
  evidence.focusAndConfirmation.dialog = await evaluate('(() => { const dialog = document.querySelector(".el-message-box"); return { visible: Boolean(dialog), text: dialog?.innerText.replace(/\\s+/g, " ").trim() ?? null, buttons: Array.from(dialog?.querySelectorAll("button") ?? []).map((button) => button.innerText.trim()) } })()')
  evidence.focusAndConfirmation.sameValueArrayAccepted = await evaluate('(() => { const host = document.querySelector(".transfer-panel-demo")?.__vueParentComponent; const keys = host?.setupState?.selectedKeys; if (!Array.isArray(keys)) return { available: false }; host.setupState.selectedKeys = [...keys]; return { available: true, keys: [...host.setupState.selectedKeys] } })()')
  await pauseInPage(100)
  await evaluate('document.querySelector(".el-message-box__btns button.el-button--primary")?.click()')
  await pauseInPage(300)
  evidence.focusAndConfirmation.afterConfirm = await evaluate('(() => ({ dialogVisible: Boolean(document.querySelector(".el-message-box")), selectedCount: document.querySelectorAll(".lx-transfer-panel__selected-item").length, selectedLabels: Array.from(document.querySelectorAll(".lx-transfer-panel__selected-name")).map((item) => item.innerText.trim()), activeLabel: document.activeElement?.getAttribute("aria-label") ?? null, warningText: document.querySelector(".el-message__content")?.innerText ?? null }))()')

  await clickSelector('.lx-transfer-panel__controls-action button[aria-label="全部移除"]')
  await pauseInPage(220)
  evidence.desktop.selectedEmptyState = await evaluate('(() => ({ emptyText: document.querySelector(".lx-transfer-panel__empty")?.innerText.trim() ?? null, selectedCount: document.querySelectorAll(".lx-transfer-panel__selected-item").length, undoAvailable: Array.from(document.querySelectorAll(".transfer-panel-demo__status button")).some((button) => button.innerText.trim() === "撤销清空") }))()')
  evidence.screenshots.push(await capture('independent-desktop-selected-empty-2026-10-08.png'))
  await clickText('撤销清空')
  await pauseInPage(160)

  await clickText('正常数据')
  await pauseInPage(120)
  await clickText('空结果')
  await pauseInPage(250)
  evidence.states.empty = await evaluate('(() => ({ treeText: document.querySelector(".lx-transfer-panel__tree")?.innerText.replace(/\\s+/g, " ").trim() ?? null, selectedEmptyText: document.querySelector(".lx-transfer-panel__empty")?.innerText.trim() ?? null, selectedCount: document.querySelectorAll(".lx-transfer-panel__selected-item").length }))()')
  evidence.screenshots.push(await capture('independent-desktop-empty-2026-10-08.png'))
  await clickText('加载中')
  await pauseInPage(200)
  evidence.states.loading = await evaluate('(() => ({ message: document.querySelector(".transfer-panel-demo__message")?.innerText.replace(/\\s+/g, " ").trim() ?? null, role: document.querySelector(".transfer-panel-demo__message")?.getAttribute("role") ?? null, inert: document.querySelector(".lx-transfer-panel")?.hasAttribute("inert") ?? false, ariaBusy: document.querySelector(".transfer-panel-demo__surface")?.getAttribute("aria-busy") ?? null }))()')
  evidence.screenshots.push(await capture('independent-desktop-loading-2026-10-08.png'))
  await clickText('加载失败')
  await pauseInPage(200)
  evidence.states.error = await evaluate('(() => ({ message: document.querySelector(".transfer-panel-demo__message")?.innerText.replace(/\\s+/g, " ").trim() ?? null, role: document.querySelector(".transfer-panel-demo__message")?.getAttribute("role") ?? null, retryLabel: Array.from(document.querySelectorAll(".transfer-panel-demo__message button")).map((button) => button.innerText.trim()), selectedCount: document.querySelectorAll(".lx-transfer-panel__selected-item").length }))()')
  evidence.screenshots.push(await capture('independent-desktop-error-2026-10-08.png'))

  await clickText('正常数据')
  await pauseInPage(180)
  await evaluate('document.querySelector(".transfer-panel-demo__settings summary")?.focus()')
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
  evidence.desktop.keyboardFocus = await evaluate('(() => { const active = document.activeElement; const style = active ? getComputedStyle(active) : null; return { tag: active?.tagName ?? null, text: active?.innerText?.trim() ?? null, label: active?.getAttribute("aria-label") ?? null, focusVisible: active?.matches(":focus-visible") ?? false, outline: style ? style.outline : null } })()')

  await setViewport(375, 812, true)
  await evaluate('document.querySelector(".lx-transfer-panel")?.scrollIntoView({ block: "center" })')
  await pauseInPage(250)
  evidence.mobile.source = await evaluate('(() => { const rect = (element) => { if (!element) return null; const value = element.getBoundingClientRect(); return { x: Math.round(value.x), y: Math.round(value.y), width: Math.round(value.width), height: Math.round(value.height) } }; const panels = Array.from(document.querySelectorAll(".lx-transfer-panel__panel")); return { viewportWidth: innerWidth, documentWidth: document.documentElement.scrollWidth, root: rect(document.querySelector(".lx-transfer-panel")), panels: panels.map((panel) => ({ rect: rect(panel), hidden: panel.classList.contains("is-mobile-hidden") })), switchTargets: Array.from(document.querySelectorAll(".lx-transfer-panel__mobile-switch button")).map(rect), operationTargets: Array.from(document.querySelectorAll(".lx-transfer-panel__controls button")).map(rect), removeTargets: Array.from(document.querySelectorAll(".lx-transfer-panel__selected-item button")).slice(0, 2).map(rect), sourceTreeRow: rect(document.querySelector(".lx-virtual-tree__row")), sourceCheckbox: rect(document.querySelector(".lx-virtual-tree__checkbox")), sourceFilterClear: rect(document.querySelector(".lx-transfer-panel__filter--source button")) } })()')
  evidence.screenshots.push(await capture('independent-mobile-source-375-2026-10-08.png'))
  await clickSelector('[data-testid="mobile-selected-panel"]')
  await pauseInPage(180)
  evidence.mobile.selected = await evaluate('(() => ({ selectedPressed: document.querySelector("[data-testid=mobile-selected-panel]")?.getAttribute("aria-pressed") ?? null, sourcePressed: document.querySelector("[data-testid=mobile-source-panel]")?.getAttribute("aria-pressed") ?? null, panels: Array.from(document.querySelectorAll(".lx-transfer-panel__panel")).map((panel) => ({ hidden: panel.classList.contains("is-mobile-hidden"), height: Math.round(panel.getBoundingClientRect().height) })), documentWidth: document.documentElement.scrollWidth }))()')
  evidence.screenshots.push(await capture('independent-mobile-selected-375-2026-10-08.png'))
  await setViewport(320, 740, true)
  await pauseInPage(200)
  evidence.mobile.narrow320 = await evaluate('(() => ({ viewportWidth: innerWidth, documentWidth: document.documentElement.scrollWidth, selectedPressed: document.querySelector("[data-testid=mobile-selected-panel]")?.getAttribute("aria-pressed") ?? null, rootWidth: Math.round(document.querySelector(".lx-transfer-panel")?.getBoundingClientRect().width ?? 0), visibleLabelWidths: Array.from(document.querySelectorAll(".lx-transfer-panel__selected-name")).map((item) => ({ clientWidth: item.clientWidth, scrollWidth: item.scrollWidth })) }))()')
  evidence.screenshots.push(await capture('independent-mobile-selected-320-2026-10-08.png'))

  await setViewport(1440, 900, false)
  await pauseInPage(180)
  await evaluate('(() => { const settings = document.querySelector(".transfer-panel-demo__settings"); if (settings) settings.open = true; const inputs = Array.from(document.querySelectorAll(".transfer-panel-demo__toolbar-group input")); if (inputs[1] && !inputs[1].checked) inputs[1].click(); document.querySelector(".lx-transfer-panel")?.scrollIntoView({ block: "center" }) })()')
  await pauseInPage(260)
  evidence.theme.hud = await evaluate('(() => { const panel = document.querySelector(".lx-transfer-panel__panel"); const action = document.querySelector(".lx-transfer-panel__controls button"); return { rootHasHud: document.documentElement.classList.contains("lx-theme-hud"), demoHasHud: document.querySelector(".transfer-panel-demo")?.classList.contains("lx-theme-hud") ?? false, panelBackground: panel ? getComputedStyle(panel).backgroundColor : null, actionBackground: action ? getComputedStyle(action).backgroundColor : null } })()')
  evidence.screenshots.push(await capture('independent-desktop-hud-2026-10-08.png'))
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await pauseInPage(100)
  evidence.reducedMotion = await evaluate('(() => { const action = document.querySelector(".lx-transfer-panel__controls button"); const selected = document.querySelector(".lx-transfer-panel__selected-item"); const style = (element) => element ? getComputedStyle(element) : null; return { mediaMatches: matchMedia("(prefers-reduced-motion: reduce)").matches, actionTransitionDuration: style(action)?.transitionDuration ?? null, selectedTransitionDuration: style(selected)?.transitionDuration ?? null, actionAnimationDuration: style(action)?.animationDuration ?? null } })()')
  evidence.screenshots.push(await capture('independent-desktop-reduced-motion-2026-10-08.png'))

  evidence.sourceSha256After = await hashSource()
  evidence.completedAt = new Date().toISOString()
  await writeFile(resolve(outputDir, 'assessment-a-independent-evidence-2026-10-08.json'), JSON.stringify(evidence, null, 2) + '\n', 'utf8')
} catch (error) {
  evidence.captureError = error instanceof Error ? error.stack : String(error)
  evidence.sourceSha256After = await hashSource()
  evidence.completedAt = new Date().toISOString()
  await writeFile(resolve(outputDir, 'assessment-a-independent-evidence-2026-10-08.json'), JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  throw error
} finally {
  socket.close()
  browser.kill()
  await Promise.race([browserExit, sleep(2500)])
  await sleep(250)
  await rm(profileDir, { recursive: true, force: true }).catch(() => {})
}
