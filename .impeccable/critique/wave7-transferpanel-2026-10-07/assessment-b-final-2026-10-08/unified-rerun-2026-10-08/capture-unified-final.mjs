import { spawn, spawnSync } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const args = Object.fromEntries(
  process.argv.slice(2).map((value, index, values) =>
    value.startsWith('--') ? [value.slice(2), values[index + 1]] : null,
  ).filter(Boolean),
)

const outDir = path.resolve(args.out)
const baseUrl = args.baseUrl
const overlayUrl = args.overlayUrl
const edgePath = args.edge
const debugPort = Number(args.debugPort)

if (!outDir || !baseUrl || !overlayUrl || !edgePath || !debugPort) {
  throw new Error('需要提供 --out、--baseUrl、--overlayUrl、--edge 和 --debugPort')
}

const screenshotDir = path.join(outDir, 'screenshots')
await mkdir(screenshotDir, { recursive: true })

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
      this.events.push(message)
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
      }, 20000)
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

async function waitFor(predicate, label, timeoutMs = 25000) {
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

async function createPage(name, width, height, mobile, route, readySelector) {
  const target = await requestJson(
    `http://127.0.0.1:${debugPort}/json/new?about:blank`,
    { method: 'PUT' },
  )
  const client = await CDPClient.connect(target.webSocketDebuggerUrl)
  await client.send('Page.enable')
  await client.send('DOM.enable')
  await client.send('Runtime.enable')
  await client.send('Log.enable')
  await client.send('Network.enable')
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  })
  if (mobile) {
    await client.send('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 1,
    })
  }
  await client.send('Page.navigate', { url: `${baseUrl}${route}` })
  await waitFor(
    () => evaluate(client, `Boolean(document.querySelector(${JSON.stringify(readySelector)}))`),
    `${name} ${readySelector}`,
  )
  if (name.includes('transfer')) {
    await evaluate(client, "document.querySelector('.transfer-panel-demo__settings').open = true")
  } else {
    await evaluate(client, "document.querySelector('.virtual-tree-demo__controls').open = true")
  }
  await delay(250)
  return { client, name, targetId: target.id, route, width, height, mobile }
}

async function clickButton(client, selector, text) {
  const clicked = await evaluate(client, `(() => {
    const button = [...document.querySelectorAll(${JSON.stringify(selector)})]
      .find((item) => item.textContent.trim() === ${JSON.stringify(text)});
    if (!button) return false;
    button.click();
    return true;
  })()`)
  if (!clicked) throw new Error(`找不到按钮：${text}`)
  await delay(350)
}

async function setInput(client, selector, value) {
  const result = await evaluate(client, `(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    if (!input) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`)
  if (!result) throw new Error(`找不到输入框：${selector}`)
  await delay(300)
}

async function preflightAndInject(client, pageName) {
  const preflight = await evaluate(client, `(() => {
    document.title = '[Assessment B final] ' + document.title;
    const marker = document.createElement('meta');
    marker.name = 'assessment-b-mutable-injection-preflight';
    marker.content = 'passed';
    document.head.appendChild(marker);
    return {
      title: document.title,
      markerAttached: Boolean(document.head.querySelector('meta[name="assessment-b-mutable-injection-preflight"]')),
    };
  })()`)
  const injection = await evaluate(client, `(() => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = ${JSON.stringify(`${overlayUrl}/detect.js`)};
    script.dataset.assessmentB = ${JSON.stringify(pageName)};
    script.onload = () => resolve({ loaded: true, src: script.src });
    script.onerror = () => reject(new Error('overlay script load failed'));
    document.head.appendChild(script);
  }))()`)
  await delay(2600)
  return { preflight, injection }
}

async function capture(client, fileName) {
  const result = await client.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  })
  await writeFile(path.join(screenshotDir, fileName), Buffer.from(result.data, 'base64'))
  return fileName
}

async function metrics(client) {
  return evaluate(client, `(() => {
    const rect = (element) => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom };
    };
    const visible = (element) => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0;
    };
    const active = document.activeElement;
    const demo = document.querySelector('.transfer-panel-demo, .virtual-tree-demo');
    const tree = document.querySelector('.lx-virtual-tree');
    const component = document.querySelector('.lx-transfer-panel');
    const switcher = document.querySelector('.lx-transfer-panel__mobile-switch');
    const sourcePanel = document.querySelector('.lx-transfer-panel__panel[aria-labelledby*="source"]');
    const selectedPanel = document.querySelector('.lx-transfer-panel__panel[aria-labelledby*="selected"]');
    const vpDoc = document.querySelector('.vp-doc');
    const html = document.documentElement;
    const body = document.body;
    const tables = [...document.querySelectorAll('.vp-doc table')].map((table) => ({
      rect: rect(table),
      clientWidth: table.clientWidth,
      scrollWidth: table.scrollWidth,
      overflowX: getComputedStyle(table).overflowX,
      hasOwnHorizontalOverflow: table.scrollWidth > table.clientWidth,
      scrollLeft: table.scrollLeft,
    }));
    const activeRect = rect(active);
    const demoRect = rect(demo);
    return {
      title: document.title,
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight, visualWidth: visualViewport?.width ?? null },
      document: { clientWidth: html.clientWidth, scrollWidth: html.scrollWidth, horizontalOverflow: html.scrollWidth > html.clientWidth },
      body: { clientWidth: body.clientWidth, scrollWidth: body.scrollWidth, horizontalOverflow: body.scrollWidth > body.clientWidth },
      docs: { rect: rect(vpDoc), clientWidth: vpDoc?.clientWidth ?? null, scrollWidth: vpDoc?.scrollWidth ?? null },
      demo: { rect: demoRect, clientWidth: demo?.clientWidth ?? null, scrollWidth: demo?.scrollWidth ?? null },
      transferPanel: { rect: rect(component), visible: visible(component) },
      virtualTree: { rect: rect(tree), visible: visible(tree) },
      mobileSwitcher: { rect: rect(switcher), visible: visible(switcher), pressed: [...(switcher?.querySelectorAll('button') ?? [])].map((button) => ({ label: button.getAttribute('aria-label'), pressed: button.getAttribute('aria-pressed'), rect: rect(button) })) },
      panels: { source: { rect: rect(sourcePanel), visible: visible(sourcePanel) }, selected: { rect: rect(selectedPanel), visible: visible(selectedPanel) } },
      focus: {
        tag: active?.tagName ?? null,
        type: active?.getAttribute?.('type') ?? null,
        ariaLabel: active?.getAttribute?.('aria-label') ?? null,
        value: active instanceof HTMLInputElement ? active.value : null,
        rect: activeRect,
        topFromDemo: activeRect && demoRect ? activeRect.y - demoRect.y : null,
      },
      tables,
      theme: {
        rootClasses: html.className,
        dark: html.classList.contains('dark'),
        hud: Boolean(demo?.classList.contains('lx-theme-hud')),
        colorScheme: demo ? getComputedStyle(demo).colorScheme : null,
        surfaceBackground: demo ? getComputedStyle(demo).backgroundColor : null,
        primaryToken: demo ? getComputedStyle(demo).getPropertyValue('--lx-color-primary').trim() : null,
      },
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      activeTransitionDuration: active ? getComputedStyle(active).transitionDuration : null,
      scrollY,
    };
  })()`)
}

function browserEvents(client) {
  const requests = []
  const responses = []
  const failures = []
  const consoleMessages = []
  for (const event of client.events) {
    if (event.method === 'Network.requestWillBeSent') {
      requests.push({
        requestId: event.params.requestId,
        url: event.params.request.url,
        method: event.params.request.method,
        resourceType: event.params.type,
      })
    } else if (event.method === 'Network.responseReceived') {
      responses.push({
        requestId: event.params.requestId,
        url: event.params.response.url,
        status: event.params.response.status,
        statusText: event.params.response.statusText,
        mimeType: event.params.response.mimeType,
        fromDiskCache: event.params.response.fromDiskCache,
        fromServiceWorker: event.params.response.fromServiceWorker,
      })
    } else if (event.method === 'Network.loadingFailed') {
      failures.push({
        requestId: event.params.requestId,
        errorText: event.params.errorText,
        canceled: event.params.canceled,
        blockedReason: event.params.blockedReason,
      })
    } else if (event.method === 'Runtime.consoleAPICalled') {
      consoleMessages.push({
        type: event.params.type,
        text: (event.params.args ?? []).map((item) => item.value ?? item.description ?? '').join(' '),
      })
    } else if (event.method === 'Runtime.exceptionThrown') {
      consoleMessages.push({
        type: 'exception',
        text: event.params.exceptionDetails?.text ?? 'uncaught exception',
      })
    } else if (event.method === 'Log.entryAdded') {
      consoleMessages.push({
        type: event.params.entry.level,
        text: event.params.entry.text,
      })
    }
  }
  return {
    requests,
    responses,
    failures,
    consoleMessages,
    impeccableMessages: consoleMessages.filter((item) => /impeccable|detector|overlay/i.test(item.text)),
    httpErrors: responses.filter((item) => item.status >= 400),
    consoleErrors: consoleMessages.filter((item) => ['error', 'exception'].includes(item.type)),
  }
}

async function overlayEvidence(client, injection) {
  return evaluate(client, `(() => {
    const named = [...document.querySelectorAll('body *')].filter((element) => {
      const identity = [element.id, typeof element.className === 'string' ? element.className : '', element.getAttribute('aria-label'), element.getAttribute('title')].filter(Boolean).join(' ');
      return /impeccable|detector|overlay/i.test(identity);
    }).slice(-40).map((element) => ({
      tag: element.tagName,
      id: element.id || null,
      className: typeof element.className === 'string' ? element.className : null,
      text: (element.innerText || '').trim().slice(0, 160),
      rect: (() => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })(),
    }));
    return {
      scriptPresent: Boolean(document.querySelector('script[data-assessment-b]')),
      scriptLoaded: ${JSON.stringify(injection.loaded)},
      overlayNamedElements: named,
      detectorLabels: [...document.querySelectorAll('.impeccable-label')].map((element) => (element.innerText || '').trim()).filter(Boolean),
      detectorGlobals: Object.keys(window).filter((key) => /impeccable|detector/i.test(key)).slice(0, 30),
    };
  })()`)
}

async function setTheme(client, mode) {
  if (mode === 'dark') {
    await evaluate(client, "document.documentElement.classList.add('dark')")
  } else if (mode === 'light') {
    await evaluate(client, "document.documentElement.classList.remove('dark')")
  } else if (mode === 'hud') {
    const selector = '.transfer-panel-demo__toolbar-group[aria-label="示例参数"] input[type="checkbox"]'
    const changed = await evaluate(client, `(() => {
      const input = [...document.querySelectorAll(${JSON.stringify(selector)})]
        .find((item) => item.parentElement?.textContent.includes('HUD 深色主题'));
      if (!input) return false;
      if (!input.checked) input.click();
      return true;
    })()`)
    if (!changed) throw new Error('找不到 TransferPanel HUD 主题开关')
  }
  await delay(300)
}

async function transferSelectionSnapshot(client) {
  return evaluate(client, `(() => {
    const selected = [...document.querySelectorAll('.lx-transfer-panel__selected-item')];
    const selectedCodes = selected.flatMap((item) => [...item.querySelectorAll('[data-lx-transfer-code]')].map((node) => node.getAttribute('data-lx-transfer-code')));
    const rowState = (key) => {
      const row = document.querySelector('.lx-transfer-panel__tree [data-lx-tree-key="' + key + '"]');
      return row ? { key, checked: row.getAttribute('aria-checked'), visible: row.getBoundingClientRect().height > 0 } : { key, checked: null, visible: false };
    };
    return {
      selectedCodes,
      selectedText: selected.map((item) => item.innerText.trim()),
      selectedCount: selected.length,
      rows: [rowState('org-01'), rowState('unit-01'), rowState('unit-02')],
    };
  })()`)
}

async function transferAccessibility(client) {
  return evaluate(client, `(() => {
    const resolveDescription = (element) => {
      const ids = (element?.getAttribute('aria-describedby') || '').split(/\\s+/).filter(Boolean);
      return { ids, text: ids.map((id) => document.getElementById(id)?.innerText.trim() ?? null), allResolve: ids.length > 0 && ids.every((id) => Boolean(document.getElementById(id))) };
    };
    const inheritDescription = document.querySelector('.lx-transfer-panel__inherit-description');
    const inheritContainer = inheritDescription?.closest('.lx-transfer-panel__inherit-control');
    const inheritInput = inheritContainer?.querySelector('input[type="checkbox"]');
    const invertButton = document.querySelector('[aria-label="反选本树可选项"]');
    const filteredButton = document.querySelector('[aria-label="反选筛选结果"]');
    return {
      inherit: {
        inputFound: Boolean(inheritInput),
        describedBy: inheritInput?.getAttribute('aria-describedby') ?? null,
        descriptionId: inheritDescription?.id ?? null,
        relation: resolveDescription(inheritInput),
      },
      invertAll: { describedBy: invertButton?.getAttribute('aria-describedby') ?? null, relation: resolveDescription(invertButton) },
      invertFiltered: { found: Boolean(filteredButton), describedBy: filteredButton?.getAttribute('aria-describedby') ?? null, relation: resolveDescription(filteredButton) },
    };
  })()`)
}

async function runTransferDesktop(client, record) {
  await evaluate(client, "document.querySelector('.transfer-panel-demo').scrollIntoView({ block: 'center' })")
  record.initialMetrics = await metrics(client)
  record.overlayEvidence = await overlayEvidence(client, record.injection)
  record.screenshots = [await capture(client, 'transfer-desktop-light-overlay.png')]
  record.accessibility = await transferAccessibility(client)

  const input = '.lx-transfer-panel__filter--source input'
  const lowerQuery = 'dept-03'
  const mixedQuery = 'dEpT-03'
  const getMatches = () => evaluate(client, `(() => [...document.querySelectorAll('.lx-transfer-panel__tree [data-lx-transfer-code="DEPT-03"]')]
    .map((element) => ({ code: element.getAttribute('data-lx-transfer-code'), treeKey: element.closest('[role="treeitem"]')?.getAttribute('data-lx-tree-key') ?? null }))
  )()`)
  await setInput(client, input, lowerQuery)
  record.searchLowercase = { query: lowerQuery, matches: await getMatches(), emptyText: await evaluate(client, "document.querySelector('.lx-virtual-tree__empty')?.innerText.trim() ?? null") }
  await setInput(client, input, mixedQuery)
  record.searchMixedCase = { query: mixedQuery, matches: await getMatches(), emptyText: await evaluate(client, "document.querySelector('.lx-virtual-tree__empty')?.innerText.trim() ?? null") }
  await setInput(client, input, 'DEPT-03')
  record.selectionBeforeFilteredInvert = await transferSelectionSnapshot(client)
  record.filteredInvertAccessibility = await transferAccessibility(client)
  await clickButton(client, '[aria-label="反选筛选结果"]', '反选筛选结果')
  record.selectionAfterFilteredInvert = await transferSelectionSnapshot(client)
  const before = record.selectionBeforeFilteredInvert
  const after = record.selectionAfterFilteredInvert
  record.filteredInvertRangePass = before.selectedCodes.includes('DEPT-03')
    && !after.selectedCodes.includes('DEPT-03')
    && ['ORG-01', 'TRF-101'].every((code) => after.selectedCodes.includes(code))
    && after.selectedCount === before.selectedCount - 1
  record.screenshots.push(await capture(client, 'transfer-desktop-filtered-invert.png'))

  await setInput(client, input, 'NO-MATCH-UNIFIED-2026')
  record.noMatches = await evaluate(client, `(() => ({
    query: document.querySelector(${JSON.stringify(input)})?.value ?? null,
    emptyText: document.querySelector('.lx-virtual-tree__empty')?.innerText.trim() ?? null,
    visibleRows: [...document.querySelectorAll('.lx-transfer-panel__tree [role="treeitem"]')].filter((item) => item.getBoundingClientRect().height > 0).length,
    documentHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }))()`)
  record.screenshots.push(await capture(client, 'transfer-desktop-no-matches.png'))

  await setInput(client, input, '')
  await clickButton(client, '.transfer-panel-demo__toolbar-group[aria-label="宿主数据状态"] button', '空结果')
  record.emptyTree = {
    metrics: await metrics(client),
    emptyText: await evaluate(client, "document.querySelector('.lx-transfer-panel__tree .lx-virtual-tree__empty')?.innerText.trim() ?? document.querySelector('.lx-transfer-panel__empty')?.innerText.trim() ?? null"),
    treeNodeCount: await evaluate(client, "document.querySelectorAll('.lx-transfer-panel__tree [role=\\\"treeitem\\\"]').length"),
  }
  record.screenshots.push(await capture(client, 'transfer-desktop-empty-tree.png'))

  await clickButton(client, '.transfer-panel-demo__toolbar-group[aria-label="宿主数据状态"] button', '加载中')
  record.loading = await evaluate(client, `(() => ({
    ariaBusy: document.querySelector('.transfer-panel-demo__surface')?.getAttribute('aria-busy') ?? null,
    messageRole: document.querySelector('.transfer-panel-demo__message')?.getAttribute('role') ?? null,
    message: document.querySelector('.transfer-panel-demo__message')?.innerText.trim() ?? null,
    treeInert: document.querySelector('.transfer-panel-demo__surface')?.hasAttribute('inert') ?? false,
  }))()`)
  record.screenshots.push(await capture(client, 'transfer-desktop-loading.png'))

  await clickButton(client, '.transfer-panel-demo__toolbar-group[aria-label="宿主数据状态"] button', '加载失败')
  record.error = await evaluate(client, `(() => ({
    messageRole: document.querySelector('.transfer-panel-demo__message')?.getAttribute('role') ?? null,
    message: document.querySelector('.transfer-panel-demo__message')?.innerText.trim() ?? null,
    retryText: document.querySelector('.transfer-panel-demo__message button')?.innerText.trim() ?? null,
    treeInert: document.querySelector('.transfer-panel-demo__surface')?.hasAttribute('inert') ?? false,
  }))()`)
  record.screenshots.push(await capture(client, 'transfer-desktop-error.png'))
  await clickButton(client, '.transfer-panel-demo__message button', '重试')
  record.retry = await evaluate(client, `(() => ({
    state: [...document.querySelectorAll('.transfer-panel-demo__toolbar-group[aria-label="宿主数据状态"] button')].find((button) => button.getAttribute('aria-pressed') === 'true')?.innerText.trim() ?? null,
    dataRowCount: document.querySelectorAll('.lx-transfer-panel__tree [role="treeitem"]').length,
    messagePresent: Boolean(document.querySelector('.transfer-panel-demo__message')),
  }))()`)
  record.screenshots.push(await capture(client, 'transfer-desktop-after-retry.png'))

  await setTheme(client, 'dark')
  record.darkTheme = await metrics(client)
  record.screenshots.push(await capture(client, 'transfer-desktop-dark.png'))
  await setTheme(client, 'light')
  await setTheme(client, 'hud')
  record.hudTheme = await metrics(client)
  record.screenshots.push(await capture(client, 'transfer-desktop-hud.png'))

  await client.send('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
  record.reducedMotion = await metrics(client)
  record.screenshots.push(await capture(client, 'transfer-desktop-reduced-motion.png'))
  record.browser = browserEvents(client)
}

async function runTransferMobile(client, record) {
  await evaluate(client, "document.querySelector('.transfer-panel-demo').scrollIntoView({ block: 'center' })")
  record.overlayEvidence = await overlayEvidence(client, record.injection)
  record.screenshots = [await capture(client, 'transfer-mobile-375-overlay.png')]
  record.at375 = await metrics(client)

  const selectedButton = '.lx-transfer-panel__mobile-switch button[data-testid="mobile-selected-panel"]'
  await evaluate(client, `(() => { const button = document.querySelector(${JSON.stringify(selectedButton)}); button?.focus(); button?.click(); })()`)
  await delay(250)
  record.selectedPanelAt375 = await metrics(client)
  record.screenshots.push(await capture(client, 'transfer-mobile-375-selected-panel.png'))

  await evaluate(client, `(() => {
    const button = document.querySelector('.lx-transfer-panel__mobile-switch button[data-testid="mobile-source-panel"]');
    button?.focus(); button?.click();
    document.querySelector('.lx-transfer-panel__filter--source input')?.focus();
  })()`)
  await delay(250)
  record.focusAnchorAt375 = await metrics(client)
  record.screenshots.push(await capture(client, 'transfer-mobile-375-focus-anchor.png'))

  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 320,
    height: 812,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: 320,
    screenHeight: 812,
  })
  await delay(250)
  record.at320 = await metrics(client)
  record.screenshots.push(await capture(client, 'transfer-mobile-320-focus-anchor.png'))
  await client.send('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
  record.reducedMotionAt320 = await metrics(client)
  record.screenshots.push(await capture(client, 'transfer-mobile-320-reduced-motion.png'))
  record.browser = browserEvents(client)
}

async function runVirtualTreeDesktop(client, record) {
  await evaluate(client, "document.querySelector('.virtual-tree-demo').scrollIntoView({ block: 'center' })")
  record.overlayEvidence = await overlayEvidence(client, record.injection)
  record.screenshots = [await capture(client, 'virtualtree-desktop-light-overlay.png')]
  record.initialMetrics = await metrics(client)
  const input = '.lx-virtual-tree__filter input'
  await setInput(client, input, 'region-02')
  record.searchLowercase = await evaluate(client, `(() => ({
    query: document.querySelector(${JSON.stringify(input)})?.value ?? null,
    matchingRegion: Boolean(document.querySelector('.lx-virtual-tree__row[data-lx-tree-key="region-2"]')),
    visibleRows: [...document.querySelectorAll('.lx-virtual-tree__row')].map((row) => row.getAttribute('data-lx-tree-key')),
  }))()`)
  await setInput(client, input, 'ReGiOn-02')
  record.searchMixedCase = await evaluate(client, `(() => ({
    query: document.querySelector(${JSON.stringify(input)})?.value ?? null,
    matchingRegion: Boolean(document.querySelector('.lx-virtual-tree__row[data-lx-tree-key="region-2"]')),
    visibleRows: [...document.querySelectorAll('.lx-virtual-tree__row')].map((row) => row.getAttribute('data-lx-tree-key')),
  }))()`)
  await setInput(client, input, 'NO-MATCH-UNIFIED-2026')
  record.noMatches = await evaluate(client, `(() => ({
    emptyText: document.querySelector('.lx-virtual-tree__empty')?.innerText.trim() ?? null,
    visibleRows: document.querySelectorAll('.lx-virtual-tree__row').length,
  }))()`)
  record.screenshots.push(await capture(client, 'virtualtree-desktop-no-matches.png'))
  await setInput(client, input, '')

  await clickButton(client, '.virtual-tree-demo__toolbar[aria-label="树状态示例"] button', '空结果')
  record.emptyTree = {
    message: await evaluate(client, "document.querySelector('.virtual-tree-demo .lx-virtual-tree__empty')?.innerText.trim() ?? null"),
    treeNodeCount: await evaluate(client, "document.querySelectorAll('.virtual-tree-demo .lx-virtual-tree__row').length"),
  }
  record.screenshots.push(await capture(client, 'virtualtree-desktop-empty-tree.png'))
  await clickButton(client, '.virtual-tree-demo__toolbar[aria-label="树状态示例"] button', '加载中')
  record.loading = await evaluate(client, `(() => ({ role: document.querySelector('.virtual-tree-demo__message')?.getAttribute('role') ?? null, message: document.querySelector('.virtual-tree-demo__message')?.innerText.trim() ?? null, treePresent: Boolean(document.querySelector('.virtual-tree-demo .lx-virtual-tree')) }))()`)
  record.screenshots.push(await capture(client, 'virtualtree-desktop-loading.png'))
  await clickButton(client, '.virtual-tree-demo__toolbar[aria-label="树状态示例"] button', '加载失败')
  record.error = await evaluate(client, `(() => ({ role: document.querySelector('.virtual-tree-demo__message')?.getAttribute('role') ?? null, retryText: document.querySelector('.virtual-tree-demo__message button')?.innerText.trim() ?? null, treePresent: Boolean(document.querySelector('.virtual-tree-demo .lx-virtual-tree')) }))()`)
  record.screenshots.push(await capture(client, 'virtualtree-desktop-error.png'))
  await clickButton(client, '.virtual-tree-demo__message button', '重试')
  record.retry = await evaluate(client, `(() => ({ state: [...document.querySelectorAll('.virtual-tree-demo__toolbar[aria-label="树状态示例"] button')].find((button) => button.getAttribute('aria-pressed') === 'true')?.innerText.trim() ?? null, treePresent: Boolean(document.querySelector('.virtual-tree-demo .lx-virtual-tree')), rowCount: document.querySelectorAll('.virtual-tree-demo .lx-virtual-tree__row').length }))()`)
  record.screenshots.push(await capture(client, 'virtualtree-desktop-after-retry.png'))

  const hud = await evaluate(client, `(() => {
    const input = [...document.querySelectorAll('.virtual-tree-demo__strict input[type="checkbox"]')]
      .find((item) => item.parentElement?.textContent.includes('HUD 深色主题'));
    if (!input) return false;
    input.click();
    return true;
  })()`)
  if (!hud) throw new Error('找不到 VirtualTree HUD 主题开关')
  await delay(300)
  record.hudTheme = await metrics(client)
  record.screenshots.push(await capture(client, 'virtualtree-desktop-hud.png'))
  await client.send('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
  record.reducedMotion = await metrics(client)
  record.browser = browserEvents(client)
}

async function runVirtualTreeMobile(client, record) {
  await evaluate(client, "document.querySelector('.virtual-tree-demo').scrollIntoView({ block: 'center' })")
  record.overlayEvidence = await overlayEvidence(client, record.injection)
  record.at375 = await metrics(client)
  record.screenshots = [await capture(client, 'virtualtree-mobile-375-overlay.png')]
  await evaluate(client, "document.querySelector('.lx-virtual-tree__filter input')?.focus()")
  record.focusAt375 = await metrics(client)
  record.screenshots.push(await capture(client, 'virtualtree-mobile-375-focus.png'))
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 320,
    height: 812,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: 320,
    screenHeight: 812,
  })
  await delay(250)
  record.at320 = await metrics(client)
  record.screenshots.push(await capture(client, 'virtualtree-mobile-320.png'))
  record.browser = browserEvents(client)
}

async function main() {
  const profileDir = path.join(outDir, `edge-profile-${process.pid}`)
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
    sourceState: 'frozen before collection; hashes stored in source-hashes-before.json and rechecked after collection',
    browser: {
      executable: edgePath,
      pid: browserProcess.pid,
      profileDir,
      debugPort,
      mode: '独立 headless Edge，通过 CDP 创建全新页签',
      cleanup: { attempted: false, completed: false },
    },
    servers: { baseUrl, overlayUrl },
    pages: [],
    errors: [],
  }
  const pages = []
  try {
    await waitFor(async () => {
      try {
        const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`)
        return response.ok
      } catch {
        return false
      }
    }, 'Edge CDP endpoint', 25000)
    const version = await requestJson(`http://127.0.0.1:${debugPort}/json/version`)
    evidence.browser.version = version.Browser

    const specs = [
      { name: 'transfer-desktop', width: 1280, height: 960, mobile: false, route: '/components/lxtransferpanel.html', selector: '.transfer-panel-demo' },
      { name: 'transfer-mobile', width: 375, height: 812, mobile: true, route: '/components/lxtransferpanel.html', selector: '.transfer-panel-demo' },
      { name: 'virtualtree-desktop', width: 1280, height: 900, mobile: false, route: '/components/lxvirtualtree.html', selector: '.virtual-tree-demo' },
      { name: 'virtualtree-mobile', width: 375, height: 812, mobile: true, route: '/components/lxvirtualtree.html', selector: '.virtual-tree-demo' },
    ]

    for (const spec of specs) {
      const page = await createPage(
        spec.name,
        spec.width,
        spec.height,
        spec.mobile,
        spec.route,
        spec.selector,
      )
      pages.push(page)
      const { preflight, injection } = await preflightAndInject(page.client, spec.name)
      const record = {
        name: spec.name,
        targetId: page.targetId,
        url: `${baseUrl}${spec.route}`,
        viewport: { width: spec.width, height: spec.height, mobile: spec.mobile },
        titlePreflight: preflight,
        injection,
      }
      if (spec.name === 'transfer-desktop') await runTransferDesktop(page.client, record)
      else if (spec.name === 'transfer-mobile') await runTransferMobile(page.client, record)
      else if (spec.name === 'virtualtree-desktop') await runVirtualTreeDesktop(page.client, record)
      else await runVirtualTreeMobile(page.client, record)
      record.browser = browserEvents(page.client)
      evidence.pages.push(record)
      page.client.close()
    }

    await writeFile(path.join(outDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
  } catch (error) {
    evidence.errors.push(String(error?.stack || error))
    await writeFile(path.join(outDir, 'browser-evidence.partial.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
    throw error
  } finally {
    for (const page of pages) {
      try { page.client.close() } catch {}
    }
    evidence.browser.cleanup.attempted = true
    if (browserProcess.pid) {
      spawnSync('taskkill', ['/PID', String(browserProcess.pid), '/T', '/F'], { stdio: 'ignore' })
    }
    await delay(750)
    try {
      await rm(profileDir, { recursive: true, force: true, maxRetries: 6, retryDelay: 350 })
      evidence.browser.cleanup.completed = true
    } catch (error) {
      evidence.browser.cleanup.error = String(error?.message || error)
    }
    try {
      await writeFile(path.join(outDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
    } catch {}
  }
}

await main()
