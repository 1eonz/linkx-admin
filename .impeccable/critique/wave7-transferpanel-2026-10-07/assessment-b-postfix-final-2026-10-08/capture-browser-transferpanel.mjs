import { spawn, spawnSync } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const options = Object.fromEntries(
  process.argv.slice(2).map((value, index, args) =>
    value.startsWith('--') ? [value.slice(2), args[index + 1]] : null,
  ).filter(Boolean),
)

const outDir = path.resolve(options.out)
const baseUrl = options.baseUrl
const overlayUrl = options.overlayUrl
const edgePath = options.edge
const debugPort = Number(options.debugPort)

if (!outDir || !baseUrl || !overlayUrl || !edgePath || !debugPort) {
  throw new Error('需要提供 --out、--baseUrl、--overlayUrl、--edge 和 --debugPort')
}

await mkdir(outDir, { recursive: true })

class CDPClient {
  constructor(socket) {
    this.socket = socket
    this.nextId = 0
    this.pending = new Map()
    this.events = []
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data))
      if (message.id) {
        const pending = this.pending.get(message.id)
        if (!pending) return
        this.pending.delete(message.id)
        if (message.error) pending.reject(new Error(message.error.message))
        else pending.resolve(message.result)
        return
      }
      this.events.push({ method: message.method, params: message.params })
    })
  }

  static async connect(url) {
    const socket = new WebSocket(url)
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP WebSocket 连接超时')), 10000)
      socket.addEventListener('open', () => {
        clearTimeout(timer)
        resolve()
      }, { once: true })
      socket.addEventListener('error', () => {
        clearTimeout(timer)
        reject(new Error('CDP WebSocket 连接失败'))
      }, { once: true })
    })
    return new CDPClient(socket)
  }

  send(method, params = {}) {
    const id = ++this.nextId
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`CDP 请求超时：${method}`))
      }, 15000)
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer)
          resolve(value)
        },
        reject: (error) => {
          clearTimeout(timer)
          reject(error)
        },
      })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  close() {
    this.socket.close()
  }
}

async function requestJson(url, init) {
  const response = await fetch(url, init)
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`)
  return response.json()
}

async function waitFor(predicate, label, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await predicate()) return
    await delay(250)
  }
  throw new Error(`等待超时：${label}`)
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || '浏览器表达式执行失败')
  }
  return result.result?.value
}

async function createPage(browserPort, pageName, width, height, mobile, route, readySelector = '.transfer-panel-demo') {
  const target = await requestJson(
    `http://127.0.0.1:${browserPort}/json/new?about:blank`,
    { method: 'PUT' },
  )
  const client = await CDPClient.connect(target.webSocketDebuggerUrl)
  await client.send('Page.enable')
  await client.send('DOM.enable')
  await client.send('Runtime.enable')
  await client.send('Log.enable')
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: width,
    screenHeight: height,
  })
  if (mobile) {
    await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 })
  }
  await client.send('Page.navigate', { url: `${baseUrl}${route}` })
  await waitFor(async () => {
    try {
      const document = await client.send('DOM.getDocument', { depth: 1 })
      const node = await client.send('DOM.querySelector', {
        nodeId: document.root.nodeId,
        selector: readySelector,
      })
      return node.nodeId > 0
    } catch {
      return false
    }
  }, `${pageName} ${readySelector}`)
  await evaluate(client, "const settings = document.querySelector('.transfer-panel-demo__settings'); if (settings) settings.open = true")
  await delay(300)
  return { client, targetId: target.id, pageName, width, height, mobile }
}

async function clickText(client, selector, text) {
  const found = await evaluate(client, `(() => {
    const button = [...document.querySelectorAll(${JSON.stringify(selector)})]
      .find((item) => item.textContent.trim() === ${JSON.stringify(text)});
    if (!button) return false;
    button.click();
    return true;
  })()`)
  if (!found) throw new Error(`找不到按钮：${text}`)
  await delay(350)
}

async function setTheme(client, theme) {
  if (theme === 'dark') {
    await evaluate(client, "document.documentElement.classList.add('dark'); document.documentElement.classList.remove('lx-theme-hud')")
  } else if (theme === 'hud') {
    const changed = await evaluate(client, `(() => {
      const label = [...document.querySelectorAll('.transfer-panel-demo__toolbar-group[aria-label="示例参数"] label')]
        .find((item) => item.textContent.includes('HUD 深色主题'));
      const input = label?.querySelector('input[type="checkbox"]');
      if (!input) return false;
      if (!input.checked) input.click();
      return true;
    })()`)
    if (!changed) throw new Error('找不到 HUD 深色主题开关')
  }
  await delay(300)
}

async function injectOverlay(client, pageName) {
  const scriptUrl = `${overlayUrl}/detect.js`
  const result = await evaluate(client, `(() => {
    document.title = '[Assessment B] ' + document.title;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = ${JSON.stringify(scriptUrl)};
      script.dataset.assessmentB = ${JSON.stringify(pageName)};
      script.onload = () => resolve({ loaded: true, src: script.src });
      script.onerror = () => reject(new Error('overlay script load failed'));
      document.head.appendChild(script);
    });
  })()`)
  if (!result?.loaded) throw new Error(`overlay 注入失败：${pageName}`)
  await delay(2600)
  return result
}

async function captureScreenshot(client, name) {
  const result = await client.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  })
  const file = path.join(outDir, name)
  await writeFile(file, Buffer.from(result.data, 'base64'))
  return file
}

async function pageMetrics(client) {
  return evaluate(client, `(() => {
    const rect = (element) => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    };
    const demo = document.querySelector('.transfer-panel-demo');
    const component = document.querySelector('.lx-transfer-panel');
    const doc = document.documentElement;
    const body = document.body;
    const docs = document.querySelector('.vp-doc');
    return {
      viewport: {
        width: innerWidth,
        height: innerHeight,
        visualWidth: visualViewport?.width ?? null,
        visualHeight: visualViewport?.height ?? null,
        documentClientWidth: doc.clientWidth,
        documentClientHeight: doc.clientHeight,
      },
      document: { clientWidth: doc.clientWidth, scrollWidth: doc.scrollWidth, scrollHeight: doc.scrollHeight },
      body: { clientWidth: body.clientWidth, scrollWidth: body.scrollWidth, scrollHeight: body.scrollHeight },
      docsContent: { clientWidth: docs?.clientWidth ?? null, scrollWidth: docs?.scrollWidth ?? null, rect: rect(docs) },
      demo: { rect: rect(demo), clientWidth: demo?.clientWidth ?? null, scrollWidth: demo?.scrollWidth ?? null },
      component: { rect: rect(component), clientWidth: component?.clientWidth ?? null, scrollWidth: component?.scrollWidth ?? null },
      rootClasses: doc.className,
      horizontalOverflow: doc.scrollWidth > doc.clientWidth || body.scrollWidth > body.clientWidth,
      scrollY: scrollY,
    };
  })()`)
}

async function overlayEvidence(client) {
  return evaluate(client, `(() => {
    const keywords = /impeccable|detector|overlay/i;
    const elements = [...document.querySelectorAll('body *')]
      .filter((element) => {
        const identity = [element.id, typeof element.className === 'string' ? element.className : '',
          element.getAttribute('aria-label'), element.getAttribute('title'), element.getAttribute('data-testid')]
          .filter(Boolean).join(' ');
        return keywords.test(identity);
      })
      .slice(-30)
      .map((element) => ({
        tag: element.tagName,
        id: element.id || null,
        className: typeof element.className === 'string' ? element.className : null,
        ariaLabel: element.getAttribute('aria-label'),
        title: element.getAttribute('title'),
        text: (element.innerText || '').trim().slice(0, 180),
        rect: (() => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })(),
      }));
    return {
      scriptPresent: Boolean(document.querySelector('script[data-assessment-b]')),
      overlayNamedElements: elements,
      overlayNamedElementCount: elements.length,
      uniqueOverlayLabels: [...new Set([...document.querySelectorAll('.impeccable-label')]
        .map((element) => (element.innerText || '').trim())
        .filter(Boolean))],
      bodyTextHasOverlay: keywords.test(document.body.innerText),
      globalNames: Object.keys(window).filter((key) => keywords.test(key)).slice(0, 30),
    };
  })()`)
}

async function pageConsole(client) {
  return client.events.flatMap((event) => {
    if (event.method === 'Runtime.consoleAPICalled') {
      const message = (event.params.args || []).map((arg) => arg.value ?? arg.description ?? '').join(' ')
      return [{ type: event.params.type, message }]
    }
    if (event.method === 'Runtime.exceptionThrown') {
      return [{ type: 'exception', message: event.params.exceptionDetails?.text || 'uncaught exception' }]
    }
    if (event.method === 'Log.entryAdded') {
      return [{ type: event.params.entry.level, message: event.params.entry.text }]
    }
    return []
  })
}

async function findGeometry(client) {
  return evaluate(client, `(() => {
    const box = (element) => {
      if (!element) return null;
      const r = element.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    };
    const intersects = (a, b) => Boolean(a && b && a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y);
    const row = document.querySelector('[data-lx-tree-key="org-01"]');
    const toggle = row?.querySelector('.lx-virtual-tree__toggle');
    const checkTarget = row?.querySelector('.lx-virtual-tree__checkbox-control');
    const visualBox = checkTarget?.querySelector('input[type="checkbox"]');
    const toggleBox = box(toggle);
    const targetBox = box(checkTarget);
    const visualRect = box(visualBox);
    const disabled = document.querySelector('[data-lx-tree-key="unit-locked"]');
    const disabledCheckbox = disabled?.querySelector('input[type="checkbox"]');
    return {
      row: box(row),
      checkboxTouchTarget: targetBox,
      checkboxVisualBox: visualRect,
      expandTouchTarget: toggleBox,
      checkboxAndExpandOverlap: intersects(targetBox, toggleBox),
      checkboxExpandHorizontalGap: targetBox && toggleBox
        ? Math.max(0, targetBox.x - toggleBox.right, toggleBox.x - targetBox.right)
        : null,
      sizesPass: Boolean(targetBox && visualRect && toggleBox
        && Math.abs(targetBox.width - 44) < 0.5 && Math.abs(targetBox.height - 44) < 0.5
        && Math.abs(visualRect.width - 24) < 0.5 && Math.abs(visualRect.height - 24) < 0.5
        && Math.abs(toggleBox.width - 44) < 0.5 && Math.abs(toggleBox.height - 44) < 0.5),
      nonOverlapPass: Boolean(targetBox && toggleBox && !intersects(targetBox, toggleBox)),
      disabledNode: disabled ? {
        row: box(disabled),
        ariaDisabled: disabled.getAttribute('aria-disabled'),
        checkboxDisabled: disabledCheckbox?.disabled ?? null,
        rowClass: disabled.className,
      } : null,
    };
  })()`)
}

async function tap(client, x, y) {
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y, radiusX: 1, radiusY: 1, force: 1, id: 1 }],
  })
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await delay(250)
}

async function pressKey(client, key, code, windowsVirtualKeyCode) {
  await client.send('Input.dispatchKeyEvent', {
    type: 'keyDown', key, code, windowsVirtualKeyCode, nativeVirtualKeyCode: windowsVirtualKeyCode,
  })
  await client.send('Input.dispatchKeyEvent', {
    type: 'keyUp', key, code, windowsVirtualKeyCode, nativeVirtualKeyCode: windowsVirtualKeyCode,
  })
  await delay(150)
}

async function setViewport(client, width, height = 812) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: width,
    screenHeight: height,
  })
  await delay(250)
}

async function invertWholeTree(client) {
  const readState = () => evaluate(client, `(() => ({
    count: Number((document.querySelector('[data-testid="selected-count"]')?.innerText.match(/\\d+/) || [])[0] ?? 0),
    legacyEcho: document.body.innerText.includes('LEGACY-08'),
    unit01: document.querySelector('[data-lx-tree-key="unit-01"]')?.getAttribute('aria-checked') ?? null,
    unit02: document.querySelector('[data-lx-tree-key="unit-02"]')?.getAttribute('aria-checked') ?? null,
    unit03: document.querySelector('[data-lx-tree-key="unit-03"]')?.getAttribute('aria-checked') ?? null,
    lockedDisabled: document.querySelector('[data-lx-tree-key="unit-locked"] input[type="checkbox"]')?.disabled ?? null,
  }))()`)
  await evaluate(client, `document.querySelector('.lx-transfer-panel__filter--source button[aria-label="清除待选节点筛选"]')?.click()`)
  await delay(350)
  const before = await readState()
  const invert = await evaluate(client, `document.querySelector('[aria-label="反选整棵树"]')?.disabled === false`)
  if (!invert) throw new Error('反选整棵树当前不可用')
  await evaluate(client, `document.querySelector('[aria-label="反选整棵树"]')?.click()`)
  await delay(350)
  const afterFirst = await readState()
  await evaluate(client, `document.querySelector('[aria-label="反选整棵树"]')?.click()`)
  await delay(350)
  const afterSecond = await readState()
  return {
    before,
    afterFirst,
    afterSecond,
    pass: before.count === afterSecond.count
      && before.legacyEcho === afterFirst.legacyEcho
      && before.legacyEcho === afterSecond.legacyEcho
      && before.unit03 !== afterFirst.unit03
      && before.unit03 === afterSecond.unit03
      && afterFirst.lockedDisabled === true
      && afterSecond.lockedDisabled === true,
  }
}

async function testBreakpointFocus(client) {
  await setViewport(client, 375)
  const focused = await evaluate(client, `(() => {
    const row = document.querySelector('[data-lx-tree-key="unit-03"]');
    if (!row) return null;
    row.scrollIntoView({ block: 'center' });
    row.focus();
    return document.activeElement?.getAttribute('data-lx-tree-key') ?? null;
  })()`)
  if (!focused) throw new Error('断点焦点测试找不到 unit-03 树行')
  const before = await evaluate(client, `(() => ({
    width: innerWidth,
    activeKey: document.activeElement?.getAttribute('data-lx-tree-key') ?? null,
    rowHeight: document.querySelector('[data-lx-tree-key="unit-03"]')?.getBoundingClientRect().height ?? null,
  }))()`)
  await setViewport(client, 359)
  const below = await evaluate(client, `(() => ({
    width: innerWidth,
    activeKey: document.activeElement?.getAttribute('data-lx-tree-key') ?? null,
    rowHeight: document.querySelector('[data-lx-tree-key="unit-03"]')?.getBoundingClientRect().height ?? null,
  }))()`)
  await captureScreenshot(client, 'breakpoint-359-focus.png')
  await setViewport(client, 360)
  const at = await evaluate(client, `(() => ({
    width: innerWidth,
    activeKey: document.activeElement?.getAttribute('data-lx-tree-key') ?? null,
    rowHeight: document.querySelector('[data-lx-tree-key="unit-03"]')?.getBoundingClientRect().height ?? null,
  }))()`)
  await captureScreenshot(client, 'breakpoint-360-focus.png')
  await setViewport(client, 375)
  return { focused, before, below, at, pass: [before, below, at].every((item) => item.activeKey === focused) }
}

async function searchDept03(client) {
  const rect = await evaluate(client, `(() => {
    const input = document.querySelector('.lx-transfer-panel__filter--source input');
    if (!input) return null;
    const r = input.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`)
  if (!rect) throw new Error('找不到待选树的部门编码筛选框')
  await tap(client, rect.x, rect.y)
  await client.send('Input.dispatchKeyEvent', {
    type: 'keyDown', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65,
    nativeVirtualKeyCode: 65, modifiers: 2,
  })
  await client.send('Input.dispatchKeyEvent', {
    type: 'keyUp', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65,
    nativeVirtualKeyCode: 65, modifiers: 2,
  })
  await client.send('Input.insertText', { text: 'DEPT-03' })
  await waitFor(
    () => evaluate(client, `Boolean(document.querySelector('[data-lx-transfer-code="DEPT-03"]'))`),
    'DEPT-03 搜索结果',
  )
  return evaluate(client, `(() => {
    const matches = [...document.querySelectorAll('[data-lx-transfer-code="DEPT-03"]')];
    return {
      query: document.querySelector('.lx-transfer-panel__filter--source input')?.value ?? null,
      matchCount: matches.length,
      matches: matches.map((element) => ({ code: element.getAttribute('data-lx-transfer-code'), text: element.closest('[role="treeitem"]')?.innerText.trim() ?? element.innerText.trim() })),
      status: document.querySelector('.lx-transfer-panel__header-status')?.innerText.trim() ?? null,
      visibleTreeRows: [...document.querySelectorAll('.lx-virtual-tree__row')].map((row) => row.innerText.trim()),
    };
  })()`)
}

const profileDir = path.join(tmpdir(), `linkx-wave7-assessment-b-${process.pid}-${Date.now()}`)
await mkdir(profileDir, { recursive: true })
const browserProcess = spawn(edgePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profileDir}`,
  'about:blank',
], { stdio: 'ignore', windowsHide: true })

const evidence = {
    browser: { executable: edgePath, pid: browserProcess.pid, profileDir, debugPort, mode: 'headless Chromium through CDP', cleanup: { attempted: false, completed: false } },
  server: { baseUrl, overlayUrl },
  pages: [],
  errors: [],
}
try {
  await waitFor(async () => {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`)
      return response.ok
    } catch {
      return false
    }
  }, 'Chromium CDP endpoint', 20000)

  const version = await requestJson(`http://127.0.0.1:${debugPort}/json/version`)
  evidence.browser.version = version.Browser

  const pages = [
    { name: 'desktop-light-ready', width: 1280, height: 900, mobile: false, theme: 'light', state: 'ready', screenshot: 'desktop-light-ready.png' },
    { name: 'desktop-dark-ready', width: 1280, height: 900, mobile: false, theme: 'dark', state: 'ready', screenshot: 'desktop-dark-ready.png' },
    { name: 'desktop-hud-ready', width: 1280, height: 900, mobile: false, theme: 'hud', state: 'ready', screenshot: 'desktop-hud-ready.png' },
    { name: 'desktop-loading', width: 1280, height: 900, mobile: false, theme: 'light', state: 'loading', screenshot: 'desktop-loading.png' },
    { name: 'mobile-375-empty', width: 375, height: 812, mobile: true, theme: 'light', state: 'empty', screenshot: 'mobile-375-empty.png' },
    { name: 'mobile-320-error', width: 320, height: 812, mobile: true, theme: 'light', state: 'error', screenshot: 'mobile-320-error.png' },
  ]

  for (const config of pages) {
      const page = await createPage(
      debugPort,
      config.name,
      config.width,
      config.height,
      config.mobile,
      '/components/lxtransferpanel.html',
    )
    const { client } = page
    await setTheme(client, config.theme)
    if (config.state === 'empty') {
      await clickText(client, '.transfer-panel-demo__toolbar-group[aria-label="宿主数据状态"] button', '空结果')
    } else if (config.state === 'loading') {
      await clickText(client, '.transfer-panel-demo__toolbar-group[aria-label="宿主数据状态"] button', '加载中')
    } else if (config.state === 'error') {
      await clickText(client, '.transfer-panel-demo__toolbar-group[aria-label="宿主数据状态"] button', '加载失败')
    }

    const titlePreflight = await evaluate(client, `(() => {
      document.title = '[Assessment B preflight] ' + document.title;
      const marker = document.createElement('meta');
      marker.name = 'assessment-b-mutable-injection-preflight';
      marker.content = 'passed';
      document.head.appendChild(marker);
      return { title: document.title, markerAttached: Boolean(document.head.querySelector('meta[name="assessment-b-mutable-injection-preflight"]')) };
    })()`)
    const injection = await injectOverlay(client, config.name)
    const overlay = await overlayEvidence(client)

    await evaluate(client, "document.querySelector('.transfer-panel-demo').scrollIntoView({ block: 'center' })")
    await delay(250)
    const screenshot = await captureScreenshot(client, config.screenshot)
    const item = {
      ...config,
      url: `${baseUrl}/components/lxtransferpanel.html`,
      targetId: page.targetId,
      titlePreflight,
      injection,
      overlay,
      initialMetrics: await pageMetrics(client),
      initialScreenshot: path.basename(screenshot),
      consoleMessages: await pageConsole(client),
    }
    item.hostState = await evaluate(client, `(() => ({
      state: ${JSON.stringify(config.state)},
      message: document.querySelector('.transfer-panel-demo__message')?.innerText.trim() ?? null,
      messageRole: document.querySelector('.transfer-panel-demo__message')?.getAttribute('role') ?? null,
      busy: document.querySelector('.transfer-panel-demo__surface')?.getAttribute('aria-busy') ?? null,
      componentInert: document.querySelector('.lx-transfer-panel')?.hasAttribute('inert') ?? false,
      emptyText: document.querySelector('.lx-virtual-tree__empty')?.innerText.trim() ?? null,
      selectedCount: document.querySelector('[data-testid="selected-count"]')?.innerText.trim() ?? null,
    }))()`)

    if (config.name === 'desktop-light-ready') {
      item.search = await searchDept03(client)
      item.searchScreenshot = path.basename(await captureScreenshot(client, 'desktop-light-search-DEPT-03.png'))
      item.searchMetrics = await pageMetrics(client)
      item.fullTreeInvert = await invertWholeTree(client)
      item.fullTreeInvertScreenshot = path.basename(await captureScreenshot(client, 'desktop-light-full-tree-invert.png'))
    }

      if (config.name === 'mobile-375-empty' || config.name === 'mobile-320-error') {
      const recoveryButton = config.name === 'mobile-375-empty' ? '正常数据' : '重试'
      const selector = config.name === 'mobile-375-empty'
        ? '.transfer-panel-demo__toolbar-group[aria-label="宿主数据状态"] button'
        : '.transfer-panel-demo__message button'
      await clickText(client, selector, recoveryButton)
      await evaluate(client, "document.querySelector('.transfer-panel-demo').scrollIntoView({ block: 'center' })")
      await delay(250)
      item.recoveredScreenshot = path.basename(await captureScreenshot(client, `${config.name}-ready-after-recovery.png`))
      item.recoveredMetrics = await pageMetrics(client)
      item.geometry = await findGeometry(client)

      if (item.geometry.checkboxTouchTarget && item.geometry.expandTouchTarget) {
        await evaluate(client, "document.querySelector('[data-lx-tree-key=\"org-01\"]')?.scrollIntoView({ block: 'center' })")
        await delay(250)
        item.geometry = await findGeometry(client)
        const toggle = await evaluate(client, `(() => {
          const element = document.querySelector('[data-lx-tree-key="org-01"] .lx-virtual-tree__toggle');
          const r = element?.getBoundingClientRect();
          return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
        })()`)
        if (!toggle) throw new Error('展开控件在滚动后不可见')
        item.expandedTouchTarget = toggle
        await tap(client, toggle.x, toggle.y)
        item.expandTapCollapsed = await evaluate(client, `document.querySelector('[data-lx-tree-key="org-01"]')?.getAttribute('aria-expanded') === 'false'`)
        const reopenedToggle = await evaluate(client, `(() => {
          const element = document.querySelector('[data-lx-tree-key="org-01"] .lx-virtual-tree__toggle');
          const r = element?.getBoundingClientRect();
          return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
        })()`)
        if (reopenedToggle) await tap(client, reopenedToggle.x, reopenedToggle.y)
        item.expandTapReopened = await evaluate(client, `document.querySelector('[data-lx-tree-key="org-01"]')?.getAttribute('aria-expanded') === 'true'`)
      }

      if (item.geometry.checkboxTouchTarget) {
        const box = item.geometry.checkboxTouchTarget
        const unitRow = await evaluate(client, `(() => {
          const row = document.querySelector('[data-lx-tree-key="unit-03"]');
          if (!row) return null;
          row.scrollIntoView({ block: 'center' });
          const target = row.querySelector('.lx-virtual-tree__checkbox-control');
          if (!target) return null;
          const r = target.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2, top: r.top, bottom: r.bottom, viewportHeight: innerHeight };
        })()`)
        if (unitRow) {
          await delay(250)
          await tap(client, unitRow.x, unitRow.y)
          item.checkboxTapTarget = unitRow
          item.checkboxTapSelectedUnit = await evaluate(client, `document.querySelector('[data-lx-tree-key="unit-03"]')?.getAttribute('aria-checked') === 'true'`)
        } else {
          item.checkboxTapSelectedUnit = null
          item.geometryNote = 'unit-03 行未处于当前虚拟窗口内，未执行该控件点击'
        }
        item.checkboxTapTarget = box
      }

      item.disabledNode = await evaluate(client, `(() => {
        const viewport = document.querySelector('.lx-virtual-tree__viewport');
        const rows = [...document.querySelectorAll('.lx-virtual-tree__row')];
        const rowIndex = rows.findIndex((row) => row.dataset.lxTreeKey === 'unit-locked');
        if (viewport && rowIndex >= 0) viewport.scrollTop = rowIndex * Number.parseFloat(getComputedStyle(rows[rowIndex]).height);
        const disabled = document.querySelector('[data-lx-tree-key="unit-locked"]');
        return disabled ? {
          present: true,
          ariaDisabled: disabled.getAttribute('aria-disabled'),
          checkboxDisabled: disabled.querySelector('input[type="checkbox"]')?.disabled ?? null,
          className: disabled.className,
        } : { present: false };
      })()`)
      item.finalMetrics = await pageMetrics(client)
      if (config.name === 'mobile-375-empty') {
        item.breakpointFocus = await testBreakpointFocus(client)
        item.afterBreakpointMetrics = await pageMetrics(client)
        await client.send('Emulation.setEmulatedMedia', {
          features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        })
        await delay(200)
        item.reducedMotion = await evaluate(client, `(() => ({
          mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
          rowTransitionDuration: getComputedStyle(document.querySelector('.lx-virtual-tree__row')).transitionDuration,
          panelTransitionDuration: getComputedStyle(document.querySelector('.lx-transfer-panel__panel')).transitionDuration,
          activeAnimations: document.getAnimations().length,
        }))()`)
        item.reducedMotionScreenshot = path.basename(await captureScreenshot(client, 'mobile-375-reduced-motion.png'))
      }
    }

    item.consoleAfterActions = await pageConsole(client)
    evidence.pages.push(item)
    client.close()
  }

  evidence.virtualTreeDocRoute = {
    url: `${baseUrl}/components/lxvirtualtree.html`,
    coveredBy: '与 TransferPanel 页面共用组件契约，独立打开并注入 overlay 后采集 DOM/异常证据',
  }
  const virtualTreePage = await createPage(
    debugPort,
    'virtual-tree-doc',
    1280,
    900,
    false,
    '/components/lxvirtualtree.html',
    '.vp-doc',
  )
  evidence.virtualTreeDocRoute.titlePreflight = await evaluate(virtualTreePage.client, `(() => {
    document.title = '[Assessment B preflight] ' + document.title;
    const marker = document.createElement('meta');
    marker.name = 'assessment-b-mutable-injection-preflight';
    marker.content = 'passed';
    document.head.appendChild(marker);
    return { title: document.title, markerAttached: Boolean(document.head.querySelector('meta[name="assessment-b-mutable-injection-preflight"]')) };
  })()`)
  const treeInjection = await injectOverlay(virtualTreePage.client, 'virtual-tree-doc')
  evidence.virtualTreeDocRoute.injection = treeInjection
  evidence.virtualTreeDocRoute.metrics = await evaluate(virtualTreePage.client, `(() => ({
    title: document.title,
    pageHeading: document.querySelector('.vp-doc h1')?.innerText ?? null,
    treeCount: document.querySelectorAll('.lx-virtual-tree').length,
    document: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth },
    body: { clientWidth: document.body.clientWidth, scrollWidth: document.body.scrollWidth },
  }))()`)
  evidence.virtualTreeDocRoute.overlay = await overlayEvidence(virtualTreePage.client)
  evidence.virtualTreeDocRoute.consoleMessages = await pageConsole(virtualTreePage.client)
  evidence.virtualTreeDocRoute.screenshot = path.basename(await captureScreenshot(virtualTreePage.client, 'virtual-tree-doc-desktop-light.png'))
  virtualTreePage.client.close()

  const virtualTreeDemoPage = await createPage(
    debugPort,
    'virtual-tree-demo-desktop',
    1280,
    900,
    false,
    '/components/lxvirtualtree.html',
    '.virtual-tree-demo',
  )
  const virtualDemo = {
    url: `${baseUrl}/components/lxvirtualtree.html`,
    targetId: virtualTreeDemoPage.targetId,
    titlePreflight: await evaluate(virtualTreeDemoPage.client, `(() => {
      document.title = '[Assessment B] ' + document.title;
      const marker = document.createElement('meta');
      marker.name = 'assessment-b-mutable-injection-preflight';
      marker.content = 'passed';
      document.head.appendChild(marker);
      document.querySelector('.virtual-tree-demo__controls').open = true;
      return { title: document.title, markerAttached: Boolean(document.head.querySelector('meta[name="assessment-b-mutable-injection-preflight"]')) };
    })()`),
  }
  virtualDemo.injection = await injectOverlay(virtualTreeDemoPage.client, 'virtual-tree-demo-desktop')
  virtualDemo.overlay = await overlayEvidence(virtualTreeDemoPage.client)
  virtualDemo.initialMetrics = await evaluate(virtualTreeDemoPage.client, `(() => ({
    viewport: { width: innerWidth, height: innerHeight },
    document: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth },
    body: { clientWidth: document.body.clientWidth, scrollWidth: document.body.scrollWidth },
    treeCount: document.querySelectorAll('.lx-virtual-tree').length,
    visibleRows: document.querySelectorAll('.lx-virtual-tree__row').length,
  }))()`)
  virtualDemo.initialScreenshot = path.basename(await captureScreenshot(virtualTreeDemoPage.client, 'virtual-tree-demo-desktop-light.png'))
  virtualDemo.hostStates = []
  for (const state of ['加载中', '加载失败']) {
    await clickText(virtualTreeDemoPage.client, '.virtual-tree-demo__toolbar button', state)
    await delay(200)
    const item = await evaluate(virtualTreeDemoPage.client, `(() => ({
      requested: ${JSON.stringify(state)},
      status: document.querySelector('.virtual-tree-demo__message')?.innerText.trim() ?? null,
      role: document.querySelector('.virtual-tree-demo__message')?.getAttribute('role') ?? null,
      emptyText: document.querySelector('.lx-virtual-tree__empty')?.innerText.trim() ?? null,
      treeCount: document.querySelectorAll('.lx-virtual-tree').length,
    }))()`)
    item.screenshot = path.basename(await captureScreenshot(virtualTreeDemoPage.client, `virtual-tree-${state === '加载中' ? 'loading' : state === '加载失败' ? 'error' : 'empty'}.png`))
    virtualDemo.hostStates.push(item)
  }
  await clickText(virtualTreeDemoPage.client, '.virtual-tree-demo__message button', '重试')
  await clickText(virtualTreeDemoPage.client, '.virtual-tree-demo__toolbar button', '空结果')
  const emptyState = await evaluate(virtualTreeDemoPage.client, `(() => ({
    requested: '空结果',
    status: document.querySelector('.virtual-tree-demo__message')?.innerText.trim() ?? null,
    role: document.querySelector('.virtual-tree-demo__message')?.getAttribute('role') ?? null,
    emptyText: document.querySelector('.lx-virtual-tree__empty')?.innerText.trim() ?? null,
    treeCount: document.querySelectorAll('.lx-virtual-tree').length,
  }))()`)
  emptyState.screenshot = path.basename(await captureScreenshot(virtualTreeDemoPage.client, 'virtual-tree-empty.png'))
  virtualDemo.hostStates.push(emptyState)
  await clickText(virtualTreeDemoPage.client, '.virtual-tree-demo__toolbar button', '正常数据')
  await clickText(virtualTreeDemoPage.client, '.virtual-tree-demo__actions button', '按编码筛选第二个辖区')
  virtualDemo.codeFilter = await evaluate(virtualTreeDemoPage.client, `(() => ({
    rows: [...document.querySelectorAll('.lx-virtual-tree__row')].map((row) => ({
      key: row.getAttribute('data-lx-tree-key'),
      text: row.innerText.trim(),
    })),
    emptyText: document.querySelector('.lx-virtual-tree__empty')?.innerText.trim() ?? null,
  }))()`)
  await clickText(virtualTreeDemoPage.client, '.virtual-tree-demo__actions button', '清除筛选')
  await evaluate(virtualTreeDemoPage.client, `(() => {
    const row = document.querySelector('[data-lx-tree-key="region-1"]');
    row?.focus();
  })()`)
  await pressKey(virtualTreeDemoPage.client, 'ArrowDown', 'ArrowDown', 40)
  const afterFirstArrow = await evaluate(virtualTreeDemoPage.client, `document.activeElement?.getAttribute('data-lx-tree-key') ?? null`)
  await pressKey(virtualTreeDemoPage.client, 'ArrowDown', 'ArrowDown', 40)
  const beforeSpace = await evaluate(virtualTreeDemoPage.client, `document.activeElement?.getAttribute('data-lx-tree-key') ?? null`)
  await pressKey(virtualTreeDemoPage.client, ' ', 'Space', 32)
  const afterSpace = await evaluate(virtualTreeDemoPage.client, `(() => ({
    activeKey: document.activeElement?.getAttribute('data-lx-tree-key') ?? null,
    ariaChecked: document.activeElement?.getAttribute('aria-checked') ?? null,
    status: document.querySelector('.virtual-tree-demo__status')?.innerText.trim() ?? null,
  }))()`)
  virtualDemo.keyboard = {
    afterFirstArrow,
    beforeSpace,
    afterSpace,
    pass: afterFirstArrow === 'unit-1-1' && beforeSpace === 'unit-1-2'
      && afterSpace.activeKey === 'unit-1-2' && afterSpace.ariaChecked === 'true',
  }
  await virtualTreeDemoPage.client.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
  await delay(200)
  virtualDemo.reducedMotion = await evaluate(virtualTreeDemoPage.client, `(() => ({
    mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    rowTransitionDuration: getComputedStyle(document.querySelector('.lx-virtual-tree__row')).transitionDuration,
    viewportTransitionDuration: getComputedStyle(document.querySelector('.lx-virtual-tree__viewport')).transitionDuration,
    activeAnimations: document.getAnimations().length,
  }))()`)
  virtualDemo.reducedMotionScreenshot = path.basename(await captureScreenshot(virtualTreeDemoPage.client, 'virtual-tree-demo-reduced-motion.png'))
  await evaluate(virtualTreeDemoPage.client, `(() => {
    const label = [...document.querySelectorAll('.virtual-tree-demo__actions label')]
      .find((item) => item.innerText.includes('HUD 深色主题'));
    const input = label?.querySelector('input[type="checkbox"]');
    if (!input) return false;
    if (!input.checked) input.click();
    return true;
  })()`)
  await delay(300)
  virtualDemo.hudThemeEnabled = await evaluate(virtualTreeDemoPage.client, `document.querySelector('.virtual-tree-demo')?.classList.contains('lx-theme-hud') ?? false`)
  virtualDemo.hudScreenshot = path.basename(await captureScreenshot(virtualTreeDemoPage.client, 'virtual-tree-demo-hud.png'))
  virtualDemo.consoleMessages = await pageConsole(virtualTreeDemoPage.client)
  evidence.virtualTreeDemo = virtualDemo
  virtualTreeDemoPage.client.close()

  await writeFile(path.join(outDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2), 'utf8')
  process.stdout.write(JSON.stringify({
    pageCount: evidence.pages.length,
    virtualTreeDoc: evidence.virtualTreeDocRoute.url,
    screenshots: [...evidence.pages.map((page) => page.initialScreenshot), ...evidence.pages.map((page) => page.recoveredScreenshot).filter(Boolean), evidence.virtualTreeDocRoute.screenshot, evidence.virtualTreeDemo.initialScreenshot, ...evidence.virtualTreeDemo.hostStates.map((state) => state.screenshot), evidence.virtualTreeDemo.reducedMotionScreenshot, evidence.virtualTreeDemo.hudScreenshot],
    overlayLoads: evidence.pages.filter((page) => page.injection.loaded).length + Number(evidence.virtualTreeDocRoute.injection.loaded) + Number(evidence.virtualTreeDemo.injection.loaded),
    errors: evidence.errors,
  }))
} catch (error) {
  evidence.errors.push(String(error?.stack || error))
  await writeFile(path.join(outDir, 'browser-evidence.partial.json'), JSON.stringify(evidence, null, 2), 'utf8')
  throw error
} finally {
  if (browserProcess.pid) {
    spawnSync('taskkill', ['/PID', String(browserProcess.pid), '/T', '/F'], { stdio: 'ignore' })
  }
  evidence.browser.cleanup.attempted = true
  await delay(750)
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      await rm(profileDir, { recursive: true, force: true })
      evidence.browser.cleanup.completed = true
      break
    } catch (error) {
      evidence.browser.cleanup.lastError = String(error?.message || error)
      await delay(500)
    }
  }
  try {
    await writeFile(path.join(outDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2), 'utf8')
  } catch {
    if (evidence.errors.length) {
      await writeFile(path.join(outDir, 'browser-evidence.partial.json'), JSON.stringify(evidence, null, 2), 'utf8')
    }
  }
}
