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
  isolation: '为本轮创建独立 BrowserContext 与页面 target；未复用既有浏览器标签。',
  capturedAt: new Date().toISOString(),
  viewports: {},
  checks: {},
  screenshots: [],
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

async function waitJson(url, timeout = 20000) {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    try {
      const response = await fetch(url)
      if (response.ok) return response.json()
    } catch {}
    await wait(200)
  }
  throw new Error(`DevTools endpoint timeout: ${url}`)
}

class Cdp {
  constructor(url) {
    this.socket = new WebSocket(url)
    this.id = 0
    this.pending = new Map()
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true })
      this.socket.addEventListener('error', reject, { once: true })
    })
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data))
      const pending = this.pending.get(message.id)
      if (!pending) return
      this.pending.delete(message.id)
      clearTimeout(pending.timer)
      if (message.error) pending.reject(new Error(message.error.message))
      else pending.resolve(message.result)
    })
  }

  async send(method, params = {}, sessionId) {
    await this.ready
    const id = ++this.id
    const request = { id, method, params, ...(sessionId ? { sessionId } : {}) }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`DevTools command timeout: ${method}`))
      }, 15000)
      this.pending.set(id, { resolve, reject, timer })
      this.socket.send(JSON.stringify(request))
    })
  }

  close() {
    this.socket.close()
  }
}

async function main() {
  const port = await reservePort()
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lxtransferpanel-postfix-'))
  const edge = spawn(
    edgePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--disable-background-mode',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-allow-origins=*',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ],
    { stdio: 'ignore', windowsHide: true },
  )
  const sessions = new Map()
  let cdp

  async function openPage(browserContextId, initScript) {
    const target = await cdp.send('Target.createTarget', {
      url: 'about:blank',
      browserContextId,
    })
    const attached = await cdp.send('Target.attachToTarget', {
      targetId: target.targetId,
      flatten: true,
    })
    const sessionId = attached.sessionId
    const command = (method, params = {}) => cdp.send(method, params, sessionId)
    sessions.set(sessionId, command)
    await command('Page.enable')
    await command('Runtime.enable')
    if (initScript) {
      await command('Page.addScriptToEvaluateOnNewDocument', { source: initScript })
    }

    const evaluate = async (expression) => {
      const response = await command('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      })
      if (response.exceptionDetails) {
        throw new Error(response.exceptionDetails.text ?? 'Page evaluation failed')
      }
      return response.result.value
    }
    const navigate = async (url = targetUrl) => {
      await command('Page.navigate', { url })
      const end = Date.now() + 30000
      while (Date.now() < end) {
        const ready = await evaluate(
          "document.readyState === 'complete' && !!document.querySelector('.vp-doc .lx-transfer-panel')",
        )
        if (ready) break
        await wait(250)
      }
      await wait(500)
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
      await wait(250)
    }
    const click = async (selector, index = 0) => {
      const result = await evaluate(`(() => {
        const element = document.querySelectorAll(${JSON.stringify(selector)})[${index}];
        if (!element || element.disabled) return false;
        element.click();
        return true;
      })()`)
      if (!result) throw new Error(`Control unavailable: ${selector}[${index}]`)
      await wait(350)
    }
    const clickText = async (selector, text) => {
      const result = await evaluate(`(() => {
        const item = [...document.querySelectorAll(${JSON.stringify(selector)})]
          .find((element) => element.textContent.trim() === ${JSON.stringify(text)});
        if (!item || item.disabled) return false;
        item.click();
        return true;
      })()`)
      if (!result) throw new Error(`Control unavailable: ${text}`)
      await wait(350)
    }
    const setTheme = async (enabled) => {
      const result = await evaluate(`(() => {
        const inputs = document.querySelectorAll('.transfer-panel-demo__toolbar-group input[type="checkbox"]');
        const input = inputs[1];
        if (!input) return false;
        if (input.checked !== ${enabled}) input.click();
        return true;
      })()`)
      if (!result) throw new Error('HUD theme control is missing')
      await wait(450)
    }
    const fill = async (selector, value) => {
      const result = await evaluate(`(() => {
        const input = document.querySelector(${JSON.stringify(selector)});
        if (!input) return false;
        input.focus();
        input.value = ${JSON.stringify(value)};
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`)
      if (!result) throw new Error(`Input missing: ${selector}`)
      await wait(400)
    }
    const screenshot = async (name) => {
      const size = await evaluate(`({
        width: document.documentElement.clientWidth,
        height: Math.min(document.documentElement.scrollHeight, 12000),
      })`)
      const shot = await command('Page.captureScreenshot', {
        format: 'png',
        fromSurface: true,
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: size.width, height: size.height, scale: 1 },
      })
      const filename = `current-${name}.png`
      await fs.writeFile(path.join(outputDir, filename), Buffer.from(shot.data, 'base64'))
      evidence.screenshots.push(filename)
    }
    return { targetId: target.targetId, sessionId, command, evaluate, navigate, setViewport, click, clickText, setTheme, fill, screenshot }
  }

  try {
    const version = await waitJson(`http://127.0.0.1:${port}/json/version`)
    cdp = new Cdp(version.webSocketDebuggerUrl)
    await cdp.ready
    const context = await cdp.send('Target.createBrowserContext', { disposeOnDetach: true })
    const page = await openPage(context.browserContextId)
    await page.navigate()
    await page.setViewport(1440, 1080)

    const metrics = () => page.evaluate(`(() => {
      const panel = document.querySelector('.lx-transfer-panel');
      const rect = panel.getBoundingClientRect();
      const desc = panel.querySelector('.lx-transfer-panel__inherit-description');
      const checkbox = panel.querySelector('.lx-transfer-panel__inherit-control input[type="checkbox"]');
      return {
        viewport: { width: innerWidth, height: innerHeight },
        rootClasses: [...document.documentElement.classList],
        document: { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth },
        panel: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scrollWidth: panel.scrollWidth },
        fullTransferLabels: [...panel.querySelectorAll('.lx-transfer-panel__controls-label')].map((item) => ({ text: item.textContent.trim(), visible: !!item.getClientRects().length, display: getComputedStyle(item).display })),
        inheritDescription: { text: desc?.innerText.trim() ?? null, id: desc?.id ?? null, describedBy: checkbox?.getAttribute('aria-describedby') ?? null },
        selectedCount: document.querySelector('[data-testid="selected-count"]')?.innerText.trim() ?? null,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    })()`)

    evidence.checks.baseline = await page.evaluate(`(() => ({
      selectedCount: document.querySelector('[data-testid="selected-count"]').innerText.trim(),
      treeCount: document.querySelector('[data-testid="tree-node-count"]').innerText.trim(),
      visibleTransferLabels: [...document.querySelectorAll('.lx-transfer-panel__controls-label')].map((e) => e.innerText.trim()),
      unloadedMarkerVisible: [...document.querySelectorAll('.lx-transfer-panel__node-unloaded')].some((e) => e.getClientRects().length > 0),
      settingsCollapsed: !document.querySelector('.transfer-panel-demo__settings').open,
      rootClasses: [...document.documentElement.classList],
    }))()`)
    evidence.viewports.desktopLight = await metrics()
    await page.screenshot('desktop-light')

    await page.setViewport(375, 812)
    evidence.viewports.mobile375 = await metrics()
    await page.screenshot('mobile-375-light')
    await page.setViewport(320, 760)
    evidence.viewports.mobile320 = await metrics()
    evidence.checks.mobile320TextFit = await page.evaluate(`(() => ({
      panelWidth: document.querySelector('.lx-transfer-panel').getBoundingClientRect().width,
      selectedItems: [...document.querySelectorAll('.lx-transfer-panel__selected-item')].map((item) => ({
        height: item.getBoundingClientRect().height,
        scrollWidth: item.scrollWidth,
        clientWidth: item.clientWidth,
        label: item.querySelector('.lx-transfer-panel__selected-name')?.innerText.trim() ?? '',
        whiteSpace: getComputedStyle(item.querySelector('.lx-transfer-panel__selected-name')).whiteSpace,
        overflowWrap: getComputedStyle(item.querySelector('.lx-transfer-panel__selected-name')).overflowWrap,
      })),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }))()`)
    await page.screenshot('mobile-320-light')
    await page.setViewport(1440, 1080)

    await page.click('details.transfer-panel-demo__settings summary')
    await page.setTheme(true)
    evidence.checks.hudToggleOn = await page.evaluate(`(() => ({
      rootClasses: [...document.documentElement.classList],
      demoHasHudClass: document.querySelector('.transfer-panel-demo').classList.contains('lx-theme-hud'),
      panelBackground: getComputedStyle(document.querySelector('.lx-transfer-panel__panel')).backgroundColor,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
    }))()`)
    evidence.viewports.desktopHud = await metrics()
    await page.screenshot('desktop-hud')

    await page.click('.lx-transfer-panel__controls button[aria-label="全部移除"]')
    await wait(500)
    evidence.checks.hudDangerDialog = await page.evaluate(`(() => {
      const dialog = document.querySelector('.el-message-box.lx-confirm--danger');
      if (!dialog) return { visible: false };
      const style = (item) => ({ color: getComputedStyle(item).color, background: getComputedStyle(item).backgroundColor, border: getComputedStyle(item).borderColor });
      const title = dialog.querySelector('.el-message-box__title');
      const message = dialog.querySelector('.el-message-box__message');
      const confirm = dialog.querySelector('.lx-confirm__btn-danger');
      const cancel = dialog.querySelector('.el-message-box__btns .el-button:not(.lx-confirm__btn-danger)');
      return { visible: true, rootClasses: [...document.documentElement.classList], dialog: style(dialog), title: style(title), message: style(message), confirm: { text: confirm?.innerText.trim(), ...style(confirm) }, cancel: { text: cancel?.innerText.trim(), ...style(cancel) }, messageText: message?.innerText.trim() };
    })()`)
    await page.screenshot('hud-danger-confirmation')
    await page.clickText('.el-message-box__btns button', '取消')
    evidence.checks.confirmCancel = await page.evaluate(`(() => ({
      dialogClosed: !document.querySelector('.el-message-box.lx-confirm--danger'),
      selectedCount: document.querySelector('[data-testid="selected-count"]').innerText.trim(),
    }))()`)

    await page.clickText('.transfer-panel-demo__toolbar-group button', '空结果')
    evidence.checks.emptyTree = await page.evaluate(`(() => ({
      treeText: document.querySelector('.lx-transfer-panel__tree').innerText.trim(),
      treeCount: document.querySelector('[data-testid="tree-node-count"]').innerText.trim(),
      retainedSelection: document.querySelector('[data-testid="selected-count"]').innerText.trim(),
    }))()`)
    await page.screenshot('empty-tree')

    await page.clickText('.transfer-panel-demo__toolbar-group button', '加载中')
    evidence.checks.loading = await page.evaluate(`(() => ({
      message: document.querySelector('.transfer-panel-demo__message[role="status"]')?.innerText.trim() ?? null,
      ariaBusy: document.querySelector('.transfer-panel-demo__surface').getAttribute('aria-busy'),
      componentInert: document.querySelector('.lx-transfer-panel').inert,
      componentOpacity: getComputedStyle(document.querySelector('.lx-transfer-panel')).opacity,
      messageVisible: !!document.querySelector('.transfer-panel-demo__message[role="status"]')?.getClientRects().length,
    }))()`)
    await page.screenshot('loading')

    await page.clickText('.transfer-panel-demo__toolbar-group button', '加载失败')
    evidence.checks.error = await page.evaluate(`(() => ({
      alert: document.querySelector('.transfer-panel-demo__message[role="alert"]')?.innerText.trim() ?? null,
      retryVisible: !![...document.querySelectorAll('.transfer-panel-demo__message button')].find((item) => item.innerText.trim() === '重试')?.getClientRects().length,
      selectedCount: document.querySelector('[data-testid="selected-count"]').innerText.trim(),
      componentInert: document.querySelector('.lx-transfer-panel').inert,
      componentOpacity: getComputedStyle(document.querySelector('.lx-transfer-panel')).opacity,
    }))()`)
    await page.screenshot('error')
    await page.clickText('.transfer-panel-demo__message button', '重试')
    evidence.checks.errorRecovery = await page.evaluate(`(() => ({
      status: document.querySelector('[data-testid="transfer-status"]').innerText.trim(),
      selectedCount: document.querySelector('[data-testid="selected-count"]').innerText.trim(),
    }))()`)

    await page.clickText('.transfer-panel-demo__toolbar-group button', '正常数据')
    await page.fill('.lx-transfer-panel__filter--source input', '待授权特勤支队')
    evidence.checks.selectionLimit = await page.evaluate(`(() => {
      const full = document.querySelector('.lx-transfer-panel__controls button[aria-label="全部加入"]');
      const filtered = [...document.querySelectorAll('.lx-transfer-panel__header-actions button')].find((item) => item.innerText.trim() === '全选筛选结果');
      const reasonId = filtered?.getAttribute('aria-describedby');
      return {
        selectedCount: document.querySelector('[data-testid="selected-count"]').innerText.trim(),
        fullAddDisabled: full?.disabled ?? null,
        compactHint: document.querySelector('[data-testid="select-all-compact-hint"]')?.innerText.trim() ?? null,
        fullReason: document.querySelector('[data-testid="select-all-disabled-reason"]')?.innerText.trim() ?? null,
        filteredAddDisabled: filtered?.disabled ?? null,
        filteredReason: reasonId ? document.getElementById(reasonId)?.innerText.trim() ?? null : null,
      };
    })()`)
    await page.screenshot('selection-limit')
    await page.fill('.lx-transfer-panel__filter--source input', '')

    await page.evaluate(`document.querySelector('.lx-transfer-panel__filter input[aria-label="在已选项中检索"]').focus()`)
    for (const type of ['keyDown', 'keyUp']) {
      await page.command('Input.dispatchKeyEvent', {
        type,
        key: 'Tab',
        code: 'Tab',
        windowsVirtualKeyCode: 9,
        nativeVirtualKeyCode: 9,
      })
    }
    evidence.checks.keyboardSelectedList = await page.evaluate(`(() => {
      const list = document.querySelector('.lx-transfer-panel__selected');
      const style = getComputedStyle(list);
      return {
        focused: document.activeElement === list,
        ariaLabel: list.getAttribute('aria-label'),
        tabIndex: list.tabIndex,
        scrollable: list.scrollHeight > list.clientHeight,
        outline: { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor },
      };
    })()`)
    await page.screenshot('keyboard-selected-list')

    await page.command('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    })
    evidence.checks.reducedMotion = await page.evaluate(`(() => {
      const values = (element) => ({ transition: getComputedStyle(element).transitionDuration, animation: getComputedStyle(element).animationDuration, animationName: getComputedStyle(element).animationName });
      return { matches: matchMedia('(prefers-reduced-motion: reduce)').matches, panel: values(document.querySelector('.lx-transfer-panel')), selectedList: values(document.querySelector('.lx-transfer-panel__selected')) };
    })()`)
    await page.screenshot('reduced-motion')

    const rootBeforeUnmount = await page.evaluate(`(() => [...document.documentElement.classList])()`)
    const routeLink = await page.evaluate(`(() => {
      const link = [...document.querySelectorAll('a[href]')].find((item) => item.href.includes('/components/lxvirtualtree') || item.href.includes('/components/lxselectpagination'));
      return link ? { href: link.href, text: link.innerText.trim() } : null;
    })()`)
    if (routeLink) {
      await page.evaluate(`(() => {
        const link = [...document.querySelectorAll('a[href]')].find((item) => item.href.includes('/components/lxvirtualtree') || item.href.includes('/components/lxselectpagination'));
        link?.click();
      })()`)
      const end = Date.now() + 10000
      while (Date.now() < end) {
        if (await page.evaluate('location.pathname') !== '/components/lxtransferpanel') break
        await wait(100)
      }
      await wait(500)
      evidence.checks.themeUnmount = {
        routeLink,
        pathAfterNavigation: await page.evaluate('location.pathname'),
        rootClassesBeforeUnmount: rootBeforeUnmount,
        rootClassesAfterNavigation: await page.evaluate(`(() => [...document.documentElement.classList])()`),
        componentUnmounted: await page.evaluate('!document.querySelector(".transfer-panel-demo")'),
      }
    } else {
      evidence.checks.themeUnmount = { skipped: '未找到可用于 VitePress 客户端导航的站内组件链接。' }
    }

    await page.evaluate(`document.documentElement.classList.add('dark', 'lx-theme-hud')`)
    await page.evaluate(`(() => {
      const link = [...document.querySelectorAll('a[href]')].find((item) => item.href.includes('/components/lxtransferpanel'));
      link?.click();
    })()`)
    const remountEnd = Date.now() + 10000
    while (Date.now() < remountEnd) {
      if ((await page.evaluate('location.pathname')).includes('/components/lxtransferpanel')) break
      await wait(100)
    }
    await wait(450)
    evidence.checks.preexistingTheme = await page.evaluate(`(() => ({
      beforeToggle: [...document.documentElement.classList],
      demoHudSwitch: document.querySelectorAll('.transfer-panel-demo__toolbar-group input[type="checkbox"]')[1]?.checked ?? null,
      targetMounted: !!document.querySelector('.transfer-panel-demo'),
    }))()`)
    await page.click('details.transfer-panel-demo__settings summary')
    await page.setTheme(true)
    await page.setTheme(false)
    evidence.checks.preexistingTheme.afterToggleOff = await page.evaluate(`(() => [...document.documentElement.classList])()`)
    await page.evaluate(`(() => {
      const link = [...document.querySelectorAll('a[href]')].find((item) => item.href.includes('/components/lxvirtualtree') || item.href.includes('/components/lxselectpagination'));
      link?.click();
    })()`)
    const preserveEnd = Date.now() + 10000
    while (Date.now() < preserveEnd) {
      if (!(await page.evaluate('location.pathname')).includes('/components/lxtransferpanel')) break
      await wait(100)
    }
    await wait(400)
    evidence.checks.preexistingTheme.afterUnmount = await page.evaluate(`(() => ({
      rootClasses: [...document.documentElement.classList],
      componentUnmounted: !document.querySelector('.transfer-panel-demo'),
    }))()`)

    evidence.capturedAtEnd = new Date().toISOString()
    evidence.contexts = 1
    await fs.writeFile(
      path.join(outputDir, 'current-browser-evidence.json'),
      `${JSON.stringify(evidence, null, 2)}\n`,
      'utf8',
    )
    process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`)

    await cdp.send('Target.disposeBrowserContext', { browserContextId: context.browserContextId }).catch(() => {})
  } finally {
    for (const sessionId of sessions.keys()) {
      await cdp?.send('Target.detachFromTarget', { sessionId }).catch(() => {})
    }
    if (cdp) {
      await cdp.send('Browser.close').catch(() => {})
      cdp.close()
    }
    if (!edge.killed && edge.pid) edge.kill()
  }
}

await main()
