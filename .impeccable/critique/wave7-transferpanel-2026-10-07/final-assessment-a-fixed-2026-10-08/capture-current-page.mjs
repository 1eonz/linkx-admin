import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import net from 'node:net'

const outputDir = path.dirname(fileURLToPath(import.meta.url))
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const evidence = {
  targetUrl,
  browser: 'Microsoft Edge headless via Chrome DevTools Protocol',
  context: '新建 Target.createBrowserContext + 独立页面 target',
  capturedAt: new Date().toISOString(),
  views: {},
  interactions: {},
}

function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() => resolve(address.port))
    })
  })
}

async function waitForJson(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return response.json()
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`等待 DevTools 超时：${url}`)
}

class DevTools {
  constructor(url) {
    this.socket = new WebSocket(url)
    this.nextId = 0
    this.pending = new Map()
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true })
      this.socket.addEventListener('error', reject, { once: true })
    })
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data))
      if (!message.id) return
      const item = this.pending.get(message.id)
      if (!item) return
      this.pending.delete(message.id)
      clearTimeout(item.timer)
      if (message.error) item.reject(new Error(message.error.message))
      else item.resolve(message.result)
    })
  }

  async send(method, params = {}, sessionId) {
    await this.ready
    const id = ++this.nextId
    const request = { id, method, params }
    if (sessionId) request.sessionId = sessionId
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`DevTools 命令超时：${method}`))
      }, 15000)
      this.pending.set(id, { resolve, reject, timer })
      this.socket.send(JSON.stringify(request))
    })
  }

  close() {
    this.socket.close()
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  const debugPort = await reservePort()
  const tempRoot = path.resolve(os.tmpdir())
  const userDataDir = await fs.mkdtemp(path.join(tempRoot, 'lxtransferpanel-critique-'))
  const edge = spawn(
    edgePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-allow-origins=*',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ],
    { stdio: 'ignore', windowsHide: true },
  )
  let browser
  let browserContextId
  let targetId
  let sessionId

  try {
    const version = await waitForJson(`http://127.0.0.1:${debugPort}/json/version`)
    browser = new DevTools(version.webSocketDebuggerUrl)
    await browser.ready
    const context = await browser.send('Target.createBrowserContext', {
      disposeOnDetach: true,
    })
    browserContextId = context.browserContextId
    const target = await browser.send('Target.createTarget', {
      url: 'about:blank',
      browserContextId,
    })
    targetId = target.targetId
    const attached = await browser.send('Target.attachToTarget', {
      targetId,
      flatten: true,
    })
    sessionId = attached.sessionId

    const command = (method, params = {}) => browser.send(method, params, sessionId)
    const evaluate = async (expression) => {
      const result = await command('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      })
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.text ?? '页面脚本执行失败')
      }
      return result.result.value
    }
    const navigate = async () => {
      await command('Page.navigate', { url: targetUrl })
      const deadline = Date.now() + 30000
      while (Date.now() < deadline) {
        const ready = await evaluate(
          "document.readyState === 'complete' && !!document.querySelector('.vp-doc .lx-transfer-panel')",
        )
        if (ready) break
        await sleep(250)
      }
      await sleep(900)
      const url = await evaluate('location.href')
      if (!url.startsWith(targetUrl)) throw new Error(`目标页未加载：${url}`)
    }
    const setViewport = async (width, height) => {
      await command('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 600,
        screenWidth: width,
        screenHeight: height,
      })
      await sleep(300)
    }
    const click = async (selector, index = 0) => {
      const didClick = await evaluate(`(() => {
        const element = document.querySelectorAll(${JSON.stringify(selector)})[${index}];
        if (!element || element.disabled) return false;
        element.click();
        return true;
      })()`)
      if (!didClick) throw new Error(`无法点击或控件不可用：${selector}[${index}]`)
      await sleep(350)
    }
    const clickText = async (selector, text) => {
      const didClick = await evaluate(`(() => {
        const element = [...document.querySelectorAll(${JSON.stringify(selector)})]
          .find((item) => item.textContent.trim() === ${JSON.stringify(text)});
        if (!element || element.disabled) return false;
        element.click();
        return true;
      })()`)
      if (!didClick) throw new Error(`无法点击“${text}”`)
      await sleep(350)
    }
    const setCheckbox = async (index, checked) => {
      const changed = await evaluate(`(() => {
        const inputs = document.querySelectorAll('.transfer-panel-demo__toolbar-group input[type="checkbox"]');
        const input = inputs[${index}];
        if (!input) return false;
        if (input.checked !== ${checked}) input.click();
        return true;
      })()`)
      if (!changed) throw new Error(`找不到示例复选框 ${index}`)
      await sleep(400)
    }
    const fill = async (selector, value) => {
      const ok = await evaluate(`(() => {
        const input = document.querySelector(${JSON.stringify(selector)});
        if (!input) return false;
        input.focus();
        input.value = ${JSON.stringify(value)};
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`)
      if (!ok) throw new Error(`找不到输入框：${selector}`)
      await sleep(400)
    }
    const record = async (name, expression) => {
      evidence.interactions[name] = await evaluate(expression)
    }
    const saveScreenshot = async (name) => {
      const clip = await evaluate(`({
        width: document.documentElement.clientWidth,
        height: Math.min(document.documentElement.scrollHeight, 12000),
      })`)
      const shot = await command('Page.captureScreenshot', {
        format: 'png',
        fromSurface: true,
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: clip.width, height: clip.height, scale: 1 },
      })
      const filename = `${name}.png`
      await fs.writeFile(path.join(outputDir, filename), Buffer.from(shot.data, 'base64'))
      evidence.screenshots ??= []
      evidence.screenshots.push(filename)
    }
    const viewEvidence = async (name) => evaluate(`(() => {
      const panel = document.querySelector('.lx-transfer-panel');
      const rect = panel.getBoundingClientRect();
      const labels = [...panel.querySelectorAll('.lx-transfer-panel__controls-label')];
      const description = panel.querySelector('.lx-transfer-panel__inherit-description');
      const checkbox = panel.querySelector('.lx-transfer-panel__inherit-control input[type="checkbox"]');
      return {
        viewport: { width: innerWidth, height: innerHeight },
        page: { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth },
        panel: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scrollWidth: panel.scrollWidth },
        fullTransferLabels: labels.map((item) => ({ text: item.textContent.trim(), visible: !!item.getClientRects().length, display: getComputedStyle(item).display })),
        inheritDescription: {
          text: description?.textContent.trim() ?? null,
          id: description?.id ?? null,
          describedBy: checkbox?.getAttribute('aria-describedby') ?? null,
        },
        selectedCount: document.querySelector('.transfer-panel-demo [data-testid="selected-count"]')?.textContent.trim() ?? null,
        pageHasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    })()`)

    await navigate()
    await setViewport(1440, 1080)
    evidence.views.desktopLight = await viewEvidence('desktop-light')
    await record('baseline', `(() => ({
      selectedCount: document.querySelector('[data-testid="selected-count"]').textContent.trim(),
      treeNodeCount: document.querySelector('[data-testid="tree-node-count"]').textContent.trim(),
      fullActionTexts: [...document.querySelectorAll('.lx-transfer-panel__controls-label')].map((e) => e.textContent.trim()),
      leftQuickActionsVisibleInitially: [...document.querySelectorAll('.lx-transfer-panel__header-actions button')].length,
      unloadedMarker: [...document.querySelectorAll('.lx-transfer-panel__node-unloaded')].some((e) => e.textContent.includes('节点未加载')),
      mediaReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    }))()`)
    await saveScreenshot('desktop-light')

    await setViewport(375, 812)
    evidence.views.mobile375Light = await viewEvidence('mobile-375-light')
    await saveScreenshot('mobile-375-light')
    await setViewport(320, 760)
    evidence.views.mobile320Light = await viewEvidence('mobile-320-light')
    await saveScreenshot('mobile-320-light')

    await setViewport(1440, 1080)
    await click('details.transfer-panel-demo__settings summary')
    await setCheckbox(1, true)
    evidence.views.desktopHud = await viewEvidence('desktop-hud')
    await record('hudTheme', `(() => ({
      rootClasses: [...document.documentElement.classList],
      docBackground: getComputedStyle(document.querySelector('.lx-transfer-panel__panel')).backgroundColor,
      selectedListBackground: getComputedStyle(document.querySelector('.lx-transfer-panel__selected')).backgroundColor,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
    }))()`)
    await saveScreenshot('desktop-hud')

    await click('.lx-transfer-panel__controls button[aria-label="全部移除"]')
    const dialogDeadline = Date.now() + 5000
    while (Date.now() < dialogDeadline) {
      if (await evaluate("!!document.querySelector('.el-message-box.lx-confirm--danger')")) break
      await sleep(100)
    }
    await record('hudDangerConfirmation', `(() => {
      const dialog = document.querySelector('.el-message-box.lx-confirm--danger');
      if (!dialog) return { visible: false };
      const title = dialog.querySelector('.el-message-box__title');
      const message = dialog.querySelector('.el-message-box__message');
      const confirm = dialog.querySelector('.el-message-box__btns .lx-confirm__btn-danger');
      const cancel = dialog.querySelector('.el-message-box__btns .el-button:not(.lx-confirm__btn-danger)');
      const style = (element) => element ? {
        color: getComputedStyle(element).color,
        backgroundColor: getComputedStyle(element).backgroundColor,
        borderColor: getComputedStyle(element).borderColor,
      } : null;
      return {
        visible: true,
        rootClasses: [...document.documentElement.classList],
        dialogClasses: [...dialog.classList],
        dialog: style(dialog),
        title: style(title),
        message: style(message),
        confirmButton: { text: confirm?.textContent.trim() ?? null, ...style(confirm) },
        cancelButton: { text: cancel?.textContent.trim() ?? null, ...style(cancel) },
        messageText: message?.innerText.trim() ?? null,
      };
    })()`)
    await saveScreenshot('hud-danger-confirmation')
    await clickText('.el-message-box__btns button', '取消')
    await record('dangerConfirmationCancel', `(() => ({
      dialogClosed: !document.querySelector('.el-message-box.lx-confirm--danger'),
      selectedCount: document.querySelector('[data-testid="selected-count"]').textContent.trim(),
    }))()`)

    await clickText('.transfer-panel-demo__toolbar-group button', '空结果')
    evidence.interactions.emptyTree = await evaluate(`(() => ({
      state: document.querySelector('[data-testid="transfer-status"]').innerText.trim(),
      treeNodeCount: document.querySelector('[data-testid="tree-node-count"]').innerText.trim(),
      treeText: document.querySelector('.lx-transfer-panel__tree').innerText.trim(),
      selectedCount: document.querySelector('[data-testid="selected-count"]').innerText.trim(),
    }))()`)
    await saveScreenshot('empty-tree')

    await clickText('.transfer-panel-demo__toolbar-group button', '加载中')
    evidence.interactions.loading = await evaluate(`(() => ({
      status: document.querySelector('[role="status"]').innerText.trim(),
      ariaBusy: document.querySelector('.transfer-panel-demo__surface').getAttribute('aria-busy'),
      inert: document.querySelector('.transfer-panel-demo__surface').inert,
      panelOpacity: getComputedStyle(document.querySelector('.transfer-panel-demo__surface')).opacity,
      messageVisible: !![...document.querySelectorAll('.transfer-panel-demo__message')].find((e) => e.innerText.includes('加载中')),
    }))()`)
    await saveScreenshot('loading-state')

    await clickText('.transfer-panel-demo__toolbar-group button', '加载失败')
    evidence.interactions.error = await evaluate(`(() => ({
      alert: document.querySelector('[role="alert"]')?.innerText.trim() ?? null,
      ariaBusy: document.querySelector('.transfer-panel-demo__surface').getAttribute('aria-busy'),
      inert: document.querySelector('.transfer-panel-demo__surface').inert,
      retryVisible: [...document.querySelectorAll('.transfer-panel-demo__message button')].some((e) => e.innerText.trim() === '重试'),
      selectedCount: document.querySelector('[data-testid="selected-count"]').innerText.trim(),
    }))()`)
    await saveScreenshot('error-state')
    await clickText('.transfer-panel-demo__message button', '重试')
    await record('errorRecovery', `(() => ({
      ready: document.querySelector('[data-testid="transfer-status"]').innerText.trim() === '已载入组织权限数据',
      selectedCount: document.querySelector('[data-testid="selected-count"]').innerText.trim(),
    }))()`)

    await clickText('.transfer-panel-demo__toolbar-group button', '正常数据')
    await fill('.lx-transfer-panel__filter--source input', '待授权特勤支队')
    await record('selectionLimit', `(() => {
      const all = document.querySelector('.lx-transfer-panel__controls button[aria-label="全部加入"]');
      const filtered = [...document.querySelectorAll('.lx-transfer-panel__header-actions button')]
        .find((e) => e.textContent.trim() === '全选筛选结果');
      const statusId = filtered?.getAttribute('aria-describedby');
      return {
        selectedCount: document.querySelector('[data-testid="selected-count"]').innerText.trim(),
        allAddDisabled: all?.disabled ?? null,
        allAddVisibleHint: document.querySelector('[data-testid="select-all-compact-hint"]')?.innerText.trim() ?? null,
        allAddFullReason: document.querySelector('[data-testid="select-all-disabled-reason"]')?.innerText.trim() ?? null,
        filteredAddDisabled: filtered?.disabled ?? null,
        filteredStatus: statusId ? document.getElementById(statusId)?.innerText.trim() ?? null : null,
      };
    })()`)
    await saveScreenshot('selection-limit')
    await fill('.lx-transfer-panel__filter--source input', '')

    await evaluate(`(() => document.querySelector('.lx-transfer-panel__filter input[aria-label="在已选项中检索"]').focus())()`)
    await command('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Tab',
      code: 'Tab',
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
    })
    await command('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Tab',
      code: 'Tab',
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
    })
    await record('keyboardFocusSelectedList', `(() => {
      const active = document.activeElement;
      const list = document.querySelector('.lx-transfer-panel__selected');
      const style = getComputedStyle(list);
      return {
        activeElement: { tag: active.tagName, className: active.className, ariaLabel: active.getAttribute('aria-label') },
        selectedListFocused: active === list,
        focusOutline: { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor, boxShadow: style.boxShadow },
        tabIndex: list.tabIndex,
        scrollable: list.scrollHeight > list.clientHeight,
      };
    })()`)
    await saveScreenshot('selected-list-keyboard-focus')

    await command('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    })
    await record('reducedMotion', `(() => {
      const list = document.querySelector('.lx-transfer-panel__selected');
      const panel = document.querySelector('.lx-transfer-panel');
      const values = (element) => ({
        transitionDuration: getComputedStyle(element).transitionDuration,
        animationDuration: getComputedStyle(element).animationDuration,
        animationName: getComputedStyle(element).animationName,
      });
      return {
        mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
        panel: values(panel),
        selectedList: values(list),
      };
    })()`)
    await saveScreenshot('reduced-motion')

    evidence.capturedAtEnd = new Date().toISOString()
    await fs.writeFile(
      path.join(outputDir, 'browser-evidence.json'),
      `${JSON.stringify(evidence, null, 2)}\n`,
      'utf8',
    )
    process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`)
  } finally {
    if (browser && sessionId) {
      try {
        await browser.send('Target.detachFromTarget', { sessionId })
      } catch {}
    }
    if (browser && browserContextId) {
      try {
        await browser.send('Target.disposeBrowserContext', { browserContextId })
      } catch {}
    }
    if (browser) browser.close()
    if (!edge.killed) edge.kill()
    const resolvedTempRoot = path.resolve(tempRoot)
    const resolvedUserDataDir = path.resolve(userDataDir)
    if (resolvedUserDataDir.startsWith(`${resolvedTempRoot}${path.sep}`)) {
      await fs.rm(resolvedUserDataDir, { recursive: true, force: true })
    }
  }
}

await main()
