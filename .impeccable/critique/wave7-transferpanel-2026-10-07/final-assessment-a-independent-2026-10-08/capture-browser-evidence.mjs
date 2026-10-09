import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const outputDir = fileURLToPath(new URL('.', import.meta.url))
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const profileDir = mkdtempSync(join(tmpdir(), 'wave7-transferpanel-assessment-a-'))
const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ],
  { stdio: 'ignore', windowsHide: true },
)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const evidence = {
  target: targetUrl,
  method: 'Fresh headless Chrome process, temporary user-data directory, CDP-created browser context and page',
  captures: [],
  interactions: [],
  consoleErrors: [],
  runtimeExceptions: [],
}

let socket
let sessionId
let browserContextId
let nextId = 0
const pending = new Map()

function send(method, params = {}, targetSessionId) {
  const id = ++nextId
  const message = { id, method, params }
  if (targetSessionId) message.sessionId = targetSessionId
  socket.send(JSON.stringify(message))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject, method }))
}

function connect(url) {
  return new Promise((resolve, reject) => {
    socket = new WebSocket(url)
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id) {
        const request = pending.get(message.id)
        if (!request) return
        pending.delete(message.id)
        if (message.error) {
          request.reject(new Error(`${request.method}: ${message.error.message}`))
        } else {
          request.resolve(message.result ?? {})
        }
      } else if (message.method === 'Runtime.exceptionThrown') {
        evidence.runtimeExceptions.push(message.params.exceptionDetails?.text ?? '未说明的页面异常')
      } else if (
        message.method === 'Runtime.consoleAPICalled' &&
        message.params.type === 'error'
      ) {
        evidence.consoleErrors.push(
          message.params.args.map((item) => item.value ?? item.description ?? '').join(' '),
        )
      }
    })
  })
}

async function evaluate(expression) {
  const response = await send(
    'Runtime.evaluate',
    { expression, awaitPromise: true, returnByValue: true },
    sessionId,
  )
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text ?? '页面脚本执行失败')
  }
  return response.result?.value
}

async function click(selector, expectedText) {
  const result = await evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return { ok: false, reason: '元素不存在', selector: ${JSON.stringify(selector)} };
    if (element.disabled) return { ok: false, reason: '元素已禁用', selector: ${JSON.stringify(selector)} };
    element.click();
    return { ok: true, text: element.innerText?.trim() || element.getAttribute('aria-label') || '' };
  })()`)
  evidence.interactions.push({ action: 'click', selector, expectedText, ...result })
  await sleep(160)
  return result
}

async function clickButtonText(text) {
  const result = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => item.innerText.trim() === ${JSON.stringify(text)});
    if (!button) return { ok: false, reason: '按钮不存在', text: ${JSON.stringify(text)} };
    if (button.disabled) return { ok: false, reason: '按钮已禁用', text: ${JSON.stringify(text)} };
    button.click();
    return { ok: true, text: button.innerText.trim() };
  })()`)
  evidence.interactions.push({ action: 'click-button-text', expectedText: text, ...result })
  await sleep(160)
  return result
}

async function clickLabelInput(text) {
  const result = await evaluate(`(() => {
    const label = [...document.querySelectorAll('.transfer-panel-demo__toolbar label')].find((item) => item.innerText.includes(${JSON.stringify(text)}));
    const input = label?.querySelector('input');
    if (!input) return { ok: false, reason: '标签复选框不存在', text: ${JSON.stringify(text)} };
    input.click();
    return { ok: true, checked: input.checked };
  })()`)
  evidence.interactions.push({ action: 'click-label-input', expectedText: text, ...result })
  await sleep(160)
  return result
}

async function setInput(selector, value) {
  const result = await evaluate(`(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    if (!input) return { ok: false, reason: '输入框不存在', selector: ${JSON.stringify(selector)} };
    input.focus();
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, value: input.value, active: document.activeElement === input };
  })()`)
  evidence.interactions.push({ action: 'set-input', selector, value, ...result })
  await sleep(220)
  return result
}

async function inspect(name) {
  return evaluate(`(() => {
    const rect = (element) => {
      if (!element) return null;
      const value = element.getBoundingClientRect();
      return { x: Math.round(value.x), y: Math.round(value.y), width: Math.round(value.width), height: Math.round(value.height) };
    };
    const text = (selector) => document.querySelector(selector)?.innerText?.trim() ?? '';
    const demo = document.querySelector('.transfer-panel-demo');
    const panel = document.querySelector('.lx-transfer-panel');
    const selected = [...document.querySelectorAll('.lx-transfer-panel__selected-item')].map((item) => item.innerText.trim());
    const buttons = [...document.querySelectorAll('.lx-transfer-panel button')].map((button) => ({
      text: button.innerText.trim(),
      label: button.getAttribute('aria-label'),
      disabled: button.disabled,
      rect: rect(button),
    }));
    return {
      name: ${JSON.stringify(name)},
      title: document.title,
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight },
      document: { scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, bodyBackground: getComputedStyle(document.body).backgroundColor },
      rootClasses: document.documentElement.className,
      demo: {
        rect: rect(demo),
        className: demo?.className ?? '',
        settingsOpen: document.querySelector('.transfer-panel-demo__settings')?.open ?? false,
        status: text('[data-testid="transfer-status"]'),
        summary: text('.transfer-panel-demo__summary'),
        hostMessage: text('.transfer-panel-demo__message'),
        hostMessageRole: document.querySelector('.transfer-panel-demo__message')?.getAttribute('role') ?? null,
        blocked: document.querySelector('.transfer-panel-demo__surface')?.classList.contains('is-blocked') ?? false,
        maxCountEnabled: document.querySelector('label')?.innerText.includes('最多 5') ? document.querySelector('label input')?.checked : null,
        hudThemeEnabled: [...document.querySelectorAll('.transfer-panel-demo__toolbar label')].find((label) => label.innerText.includes('HUD 深色主题'))?.querySelector('input')?.checked ?? false,
      },
      transferPanel: {
        rect: rect(panel),
        scrollWidth: panel?.scrollWidth ?? null,
        clientWidth: panel?.clientWidth ?? null,
        panels: [...document.querySelectorAll('.lx-transfer-panel__panel')].map((item) => rect(item)),
        controls: rect(document.querySelector('.lx-transfer-panel__controls')),
        sourceFilter: document.querySelector('input[aria-label="筛选待选节点"]')?.value ?? '',
        selectedFilter: document.querySelector('input[aria-label="在已选项中检索"]')?.value ?? '',
        sourceStatus: text('.lx-transfer-panel__header-status'),
        selectedListLabel: document.querySelector('.lx-transfer-panel__selected')?.getAttribute('aria-label') ?? '',
        selectedItems: selected,
        selectedCount: text('.lx-transfer-panel__footer > span'),
        emptyState: text('.lx-transfer-panel__empty'),
        compactHint: text('[data-testid="select-all-compact-hint"]'),
        dialogText: [...document.querySelectorAll('[role="dialog"], .el-message-box')].map((item) => item.innerText.trim()),
        buttons,
        primaryTargets: [...document.querySelectorAll('.lx-transfer-panel__controls button, .lx-transfer-panel__selected-item button, .lx-transfer-panel__filter button, .lx-transfer-panel__header-actions button')].map((item) => ({ label: item.getAttribute('aria-label') || item.title || item.innerText.trim(), rect: rect(item) })),
      },
      focused: document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName || '',
      visibleMainText: document.querySelector('.vp-doc')?.innerText.slice(0, 1800) ?? document.body.innerText.slice(0, 1800),
    };
  })()`)
}

async function capture(name) {
  const snapshot = await inspect(name)
  const html = await evaluate(`document.querySelector('.transfer-panel-demo')?.outerHTML ?? ''`)
  const height = Math.min(Math.max(snapshot.document.scrollHeight, snapshot.viewport.height), 18000)
  const screenshot = await send(
    'Page.captureScreenshot',
    {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: snapshot.viewport.width, height, scale: 1 },
    },
    sessionId,
  )
  const screenshotPath = join(outputDir, `${name}.png`)
  const domPath = join(outputDir, `${name}.dom.json`)
  const htmlPath = join(outputDir, `${name}.demo.html`)
  writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'))
  writeFileSync(domPath, JSON.stringify(snapshot, null, 2), 'utf8')
  writeFileSync(htmlPath, html, 'utf8')
  evidence.captures.push({ name, screenshot: screenshotPath, dom: domPath, demoHtml: htmlPath, viewport: snapshot.viewport, state: snapshot.demo.status })
}

async function waitForPage() {
  const deadline = Date.now() + 25000
  while (Date.now() < deadline) {
    const ready = await evaluate(`document.readyState === 'complete' && !!document.querySelector('.transfer-panel-demo .lx-transfer-panel')`)
    if (ready) return
    await sleep(300)
  }
  throw new Error('文档页未在 25 秒内渲染出 LxTransferPanel Demo')
}

try {
  const activePortFile = join(profileDir, 'DevToolsActivePort')
  const deadline = Date.now() + 20000
  while (Date.now() < deadline) {
    if (chrome.exitCode !== null) throw new Error(`Chrome 提前退出，状态码 ${chrome.exitCode}`)
    try {
      readFileSync(activePortFile, 'utf8')
      break
    } catch {
      await sleep(200)
    }
  }
  const [port, browserPath] = readFileSync(activePortFile, 'utf8').trim().split(/\r?\n/)
  const version = await fetch(`http://127.0.0.1:${port}/json/version`).then((response) => response.json())
  await connect(version.webSocketDebuggerUrl)
  const context = await send('Target.createBrowserContext', { disposeOnDetach: true })
  browserContextId = context.browserContextId
  const target = await send('Target.createTarget', { url: 'about:blank', browserContextId })
  const attached = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true })
  sessionId = attached.sessionId
  await send('Page.enable', {}, sessionId)
  await send('Runtime.enable', {}, sessionId)
  await send('DOM.enable', {}, sessionId)
  await send('Page.navigate', { url: targetUrl }, sessionId)
  await waitForPage()

  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId)
  await capture('desktop-light-initial')
  await click('.transfer-panel-demo__settings summary', '打开示例状态与主题')
  await capture('desktop-light-controls-open')

  await clickLabelInput('最多 5 项')
  await setInput('input[aria-label="筛选待选节点"]', '待授权')
  await capture('desktop-light-source-filter')
  await click('button[aria-label="全选筛选结果"]', '全选筛选结果')
  await capture('desktop-light-filtered-selection')
  await clickLabelInput('最多 5 项')
  await capture('desktop-light-max-count')

  await setInput('input[aria-label="在已选项中检索"]', 'LEGACY-08')
  await capture('desktop-light-selected-filter-unloaded')
  await click('button[aria-label="清除已选项筛选"]', '清除已选项筛选')
  await capture('desktop-light-selected-filter-cleared')

  const removeUnloaded = await evaluate(`(() => {
    const item = [...document.querySelectorAll('.lx-transfer-panel__selected-item')].find((node) => node.querySelector('.lx-transfer-panel__node-unloaded'));
    const button = item?.querySelector('button');
    if (!button) return { ok: false, reason: '未加载项移除按钮不存在' };
    button.click();
    return { ok: true, item: item.innerText.trim() };
  })()`)
  evidence.interactions.push({ action: 'remove-unloaded-item', ...removeUnloaded })
  await sleep(250)
  await capture('desktop-light-remove-unloaded-confirm')
  await clickButtonText('取消')
  await capture('desktop-light-remove-unloaded-cancelled')

  await click('button[aria-label="全部移除"]', '清空全部授权')
  await capture('desktop-light-clear-all-confirm')
  await clickButtonText('清空全部授权')
  await capture('desktop-light-cleared')
  await clickButtonText('撤销清空')
  await capture('desktop-light-clear-undone')

  await clickButtonText('空结果')
  await capture('desktop-light-empty-host-state')
  await clickButtonText('加载中')
  await capture('desktop-light-loading-host-state')
  await clickButtonText('加载失败')
  await capture('desktop-light-error-host-state')
  await clickButtonText('重试')
  await capture('desktop-light-retry-recovered')

  await clickLabelInput('HUD 深色主题')
  await capture('desktop-hud-dark')

  await send('Page.reload', { ignoreCache: true }, sessionId)
  await waitForPage()
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 844, deviceScaleFactor: 1, mobile: true, screenWidth: 375, screenHeight: 844 }, sessionId)
  await sleep(350)
  await capture('mobile-375-light-initial')
  await click('.transfer-panel-demo__settings summary', '打开示例状态与主题')
  await capture('mobile-375-light-controls-open')
  await clickLabelInput('HUD 深色主题')
  await capture('mobile-375-hud-dark')
  await clickButtonText('空结果')
  await capture('mobile-375-hud-empty-state')

  evidence.browser = {
    product: version.Browser,
    browserPath,
    contextCreated: Boolean(browserContextId),
    isolatedProfile: profileDir,
    pageTargetId: target.targetId,
  }
  writeFileSync(join(outputDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2), 'utf8')
  console.log(`Captured ${evidence.captures.length} screenshots and DOM records in ${outputDir}`)
} catch (error) {
  evidence.failure = error instanceof Error ? error.stack ?? error.message : String(error)
  writeFileSync(join(outputDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2), 'utf8')
  console.error(evidence.failure)
  process.exitCode = 1
} finally {
  try {
    if (browserContextId) await send('Target.disposeBrowserContext', { browserContextId })
  } catch {}
  try {
    socket?.close()
  } catch {}
  chrome.kill()
  await new Promise((resolve) => chrome.once('exit', resolve))
  if (profileDir.startsWith(join(tmpdir(), 'wave7-transferpanel-assessment-a-'))) {
    rmSync(profileDir, { recursive: true, force: true })
  }
}
