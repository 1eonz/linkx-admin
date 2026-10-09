import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const root = String.raw`F:\work\linkx-admin`
const evidenceDir = path.join(
  root,
  '.impeccable/critique/wave7-transferpanel-2026-10-09/assessment-b-final-v2/browser/attempt-4',
)
const liveServer = String.raw`C:\Users\Administrator\.codex\skills\impeccable\scripts\live-server.mjs`
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const chromePath = String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`
const packageRequire = createRequire(
  path.join(root, 'other-admin/admin-vue3/package.json'),
)
const { chromium } = packageRequire('@playwright/test')
const sources = [
  'linkx-fe/src/components/LxTransferPanel/index.vue',
  'linkx-fe/src/components/LxTransferPanel/demo/basic.vue',
]
const consoleMessages = []
const pageErrors = []
const failedRequests = []
const viewResults = []
let browser
let page
let liveServerStarted = false
let liveServerInfo = null

fs.mkdirSync(path.join(evidenceDir, 'views'), { recursive: true })
fs.mkdirSync(path.join(evidenceDir, 'screenshots'), { recursive: true })

function sha256(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function recordProcess(name, executable, args, result, extra = {}) {
  const directory = path.join(evidenceDir, 'processes')
  fs.mkdirSync(directory, { recursive: true })
  writeJson(path.join(directory, `${name}.json`), {
    command: [executable, ...args].map((part) => JSON.stringify(part)).join(' '),
    status: result.status,
    signal: result.signal,
    spawnError: result.error?.message ?? null,
    stderr: result.stderr ?? '',
    ...extra,
  })
}

function runLiveServer(name, args) {
  const commandArgs = [liveServer, ...args]
  const result = spawnSync(process.execPath, commandArgs, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 2 * 1024 * 1024,
  })
  let parsed = null

  if (name === 'start' && result.status === 0 && !result.error) {
    const line = (result.stdout ?? '')
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .at(-1)
    try {
      parsed = line ? JSON.parse(line) : null
    } catch {
      parsed = null
    }
  }

  recordProcess(`live-server-${name}`, process.execPath, commandArgs, result, {
    stdoutSummary:
      name === 'start' && parsed
        ? { pid: parsed.pid, port: parsed.port, hasToken: Boolean(parsed.token) }
        : result.stdout ?? '',
  })

  if (name === 'start' && result.status === 0 && parsed?.port) {
    liveServerStarted = true
    liveServerInfo = { pid: parsed.pid, port: parsed.port }
  }

  return { result, parsed }
}

async function ping(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
    return { status: response.status, ok: response.ok }
  } catch (error) {
    return { error: error.message }
  }
}

async function collectView(name, description, viewport) {
  if (viewport) await page.setViewportSize(viewport)
  await page.locator('.transfer-panel-demo').scrollIntoViewIfNeeded()

  const consoleStart = consoleMessages.length
  const scanResult = await page.evaluate(() => {
    if (typeof window.impeccableScan === 'function') {
      return window.impeccableScan()
    }
    return null
  })
  await page.waitForTimeout(1800)

  const domEvidence = await page.evaluate(() => {
    const rectOf = (element) => {
      if (!(element instanceof HTMLElement)) return null
      const rect = element.getBoundingClientRect()
      return {
        x: Math.round(rect.x * 10) / 10,
        y: Math.round(rect.y * 10) / 10,
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
      }
    }
    const styleOf = (element) => {
      if (!(element instanceof HTMLElement)) return null
      const style = getComputedStyle(element)
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        margin: style.margin,
        padding: style.padding,
        border: style.border,
        borderRadius: style.borderRadius,
        width: style.width,
        maxWidth: style.maxWidth,
        overflowX: style.overflowX,
      }
    }
    const demo = document.querySelector('.transfer-panel-demo')
    const component = document.querySelector('.lx-transfer-panel')
    const selectedList = document.querySelector('.lx-transfer-panel__selected')
    const scopeDetails = component?.querySelector(
      '.lx-transfer-panel__scope-actions',
    )
    const scopeSummary = scopeDetails?.querySelector('summary')
    const scopeContent = scopeDetails?.querySelector(
      '.lx-transfer-panel__scope-action-content',
    )
    const componentHeader = component?.querySelector(
      '.lx-transfer-panel__header--source',
    )
    const scopeContentStyle = scopeContent
      ? getComputedStyle(scopeContent)
      : null
    const summaryRect = rectOf(scopeSummary)
    const contentRect = rectOf(scopeContent)
    const headerRect = rectOf(componentHeader)
    const findings =
      typeof window.impeccableDetect === 'function'
        ? window.impeccableDetect()
        : null
    const findingAttributions = Array.isArray(findings)
      ? findings.map((entry) => {
          const element = entry.selector
            ? document.querySelector(entry.selector)
            : null
          const ancestors = []
          let ancestor = element
          for (let depth = 0; ancestor && depth < 5; depth += 1) {
            ancestors.push({
              tag: ancestor.tagName.toLowerCase(),
              id: ancestor.id || null,
              className:
                typeof ancestor.className === 'string'
                  ? ancestor.className
                  : null,
              text: (ancestor.textContent ?? '').trim().slice(0, 180),
              rect: rectOf(ancestor),
              style: styleOf(ancestor),
            })
            ancestor = ancestor.parentElement
          }
          return { ...entry, ancestors }
        })
      : []
    const overlays = Array.from(
      document.querySelectorAll('.impeccable-overlay'),
    ).map((element) => ({
      classes: element.className,
      visible: element.classList.contains('impeccable-visible'),
      rect: rectOf(element),
      title: element.getAttribute('title'),
      text: (element.textContent ?? '').trim().slice(0, 180),
    }))

    return {
      title: document.title,
      url: location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        scrollY: window.scrollY,
      },
      demo: {
        exists: Boolean(demo),
        rect: rectOf(demo),
        classes: demo?.className ?? null,
      },
      component: {
        exists: Boolean(component),
        rect: rectOf(component),
        clientWidth: component?.clientWidth ?? null,
        scrollWidth: component?.scrollWidth ?? null,
        panelHeightToken:
          component &&
          getComputedStyle(component)
            .getPropertyValue('--lx-transfer-panel-height')
            .trim(),
        classes: component?.className ?? null,
        themeClass:
          component?.closest('.transfer-panel-demo__preview')?.className ??
          null,
      },
      selectedList: {
        exists: Boolean(selectedList),
        rect: rectOf(selectedList),
        clientWidth: selectedList?.clientWidth ?? null,
        scrollWidth: selectedList?.scrollWidth ?? null,
        clientHeight: selectedList?.clientHeight ?? null,
        scrollHeight: selectedList?.scrollHeight ?? null,
      },
      scopePopover: {
        exists: Boolean(scopeContent),
        open: scopeDetails?.open ?? false,
        summaryRect,
        headerRect,
        contentRect,
        offsetFromSummaryBottom:
          summaryRect && contentRect
            ? Math.round((contentRect.y - summaryRect.y - summaryRect.height) * 10) / 10
            : null,
        offsetFromHeaderBottom:
          headerRect && contentRect
            ? Math.round((contentRect.y - headerRect.y - headerRect.height) * 10) / 10
            : null,
        computed: scopeContentStyle
          ? {
              display: scopeContentStyle.display,
              visibility: scopeContentStyle.visibility,
              position: scopeContentStyle.position,
              insetBlockStart: scopeContentStyle.insetBlockStart,
              insetInlineEnd: scopeContentStyle.insetInlineEnd,
              transform: scopeContentStyle.transform,
              maxHeight: scopeContentStyle.maxHeight,
              overflowY: scopeContentStyle.overflowY,
            }
          : null,
        text: (scopeContent?.textContent ?? '').trim().slice(0, 240),
      },
      activeDemoControls: Array.from(
        document.querySelectorAll('.transfer-panel-demo__toolbar button'),
      ).map((button) => ({
        text: (button.textContent ?? '').trim(),
        pressed: button.getAttribute('aria-pressed'),
        disabled: button.disabled,
      })),
      selectedCount:
        document.querySelector('[data-testid="selected-count"]')?.textContent ??
        null,
      liveStatus:
        document.querySelector('[data-testid="transfer-status"]')?.textContent ??
        null,
      selectedPanelTabPressed:
        document
          .querySelector('[data-testid="mobile-selected-panel"]')
          ?.getAttribute('aria-pressed') ?? null,
      findings,
      findingAttributions,
      overlayCount: overlays.length,
      visibleOverlayCount: overlays.filter((overlay) => overlay.visible).length,
      overlays,
      targetDom: demo?.outerHTML ?? null,
      hostDom: component?.outerHTML ?? null,
    }
  })

  const consoleForView = consoleMessages.slice(consoleStart)
  const screenshotPath = path.join(evidenceDir, 'screenshots', `${name}.png`)
  await page.screenshot({
    path: screenshotPath,
    fullPage: false,
    animations: 'disabled',
  })

  const result = {
    name,
    description,
    viewport,
    scanReturned: Array.isArray(scanResult) ? scanResult.length : null,
    overlayInjected: typeof scanResult !== 'undefined' && scanResult !== null,
    browserFindings:
      Array.isArray(domEvidence.findings)
        ? domEvidence.findings.reduce(
            (count, group) => count + (group.findings?.length ?? 0),
            0,
          )
        : null,
    findingElementCount: domEvidence.findings?.length ?? null,
    overlayCount: domEvidence.overlayCount,
    visibleOverlayCount: domEvidence.visibleOverlayCount,
    screenshot: path.relative(root, screenshotPath),
    console: consoleForView,
    dom: domEvidence,
  }

  writeJson(path.join(evidenceDir, 'views', `${name}.json`), result)
  fs.writeFileSync(
    path.join(evidenceDir, 'views', `${name}.dom.html`),
    domEvidence.targetDom ?? '<!-- demo DOM unavailable -->',
    'utf8',
  )
  viewResults.push({
    name,
    description,
    browserFindings: result.browserFindings,
    findingElementCount: result.findingElementCount,
    overlayCount: result.overlayCount,
    visibleOverlayCount: result.visibleOverlayCount,
    screenshot: result.screenshot,
    viewport: domEvidence.viewport,
    document: domEvidence.document,
    component: domEvidence.component,
    selectedList: domEvidence.selectedList,
  })
}

async function main() {
  const sourceHashesStart = Object.fromEntries(
    sources.map((file) => [file, sha256(path.join(root, file))]),
  )
  writeJson(path.join(evidenceDir, 'source-hashes-browser-start.json'), sourceHashesStart)

  const beforeTarget = await ping(targetUrl)
  writeJson(path.join(evidenceDir, 'target-health-before.json'), beforeTarget)

  browser = await chromium.launch({
    headless: true,
    executablePath: chromePath,
    args: ['--no-first-run'],
  })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
  })
  page = await context.newPage()
  page.on('console', (message) => {
    consoleMessages.push({
      type: message.type(),
      text: message.text(),
      location: message.location(),
    })
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('requestfailed', (request) =>
    failedRequests.push({
      url: request.url(),
      error: request.failure()?.errorText ?? null,
    }),
  )

  const response = await page.goto(targetUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  })
  await page.locator('.transfer-panel-demo').waitFor({
    state: 'attached',
    timeout: 45_000,
  })
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))

  const originalTitle = await page.title()
  const preflight = await page.evaluate(() => {
    const priorTitle = document.title
    document.title = '[Human] LxTransferPanel Assessment B'
    const script = document.createElement('script')
    script.dataset.assessmentBPreflight = 'true'
    script.textContent =
      'window.__assessmentBPreflight = "script-executed";'
    document.head.append(script)
    return {
      priorTitle,
      titleAfterMutation: document.title,
      scriptAppended: script.isConnected,
      scriptMarker: script.dataset.assessmentBPreflight,
      inlineScriptExecuted: window.__assessmentBPreflight ?? null,
    }
  })
  writeJson(path.join(evidenceDir, 'browser-preflight.json'), {
    pageCountInFreshContext: context.pages().length,
    targetUrl,
    responseStatus: response?.status() ?? null,
    originalTitle,
    ...preflight,
    mutationPassed:
      preflight.titleAfterMutation === '[Human] LxTransferPanel Assessment B' &&
      preflight.scriptAppended &&
      preflight.inlineScriptExecuted === 'script-executed',
  })

  if (!preflight.scriptAppended) {
    throw new Error('Browser injection preflight could not mutate the document.')
  }

  const start = runLiveServer('start', ['--background'])
  if (!liveServerStarted || !liveServerInfo) {
    throw new Error(
      `Impeccable live server failed to start (exit ${start.result.status}).`,
    )
  }

  const details = page.locator('.transfer-panel-demo__settings')
  if (!(await details.evaluate((element) => element.open))) {
    await details.locator('summary').click()
  }

  let injection = { attempted: true, loaded: false, error: null, scanFunction: false }
  try {
    const script = await page.addScriptTag({
      url: `http://127.0.0.1:${liveServerInfo.port}/detect.js`,
    })
    await page.waitForTimeout(2500)
    injection = {
      attempted: true,
      loaded: await script.evaluate((element) => element.isConnected),
      error: null,
      scriptSrc: await script.getAttribute('src'),
      scanFunction: await page.evaluate(
        () => typeof window.impeccableScan === 'function',
      ),
      detectFunction: await page.evaluate(
        () => typeof window.impeccableDetect === 'function',
      ),
      consoleFindings: consoleMessages.filter((message) =>
        message.text.includes('[impeccable]'),
      ),
    }
  } catch (error) {
    injection = {
      attempted: true,
      loaded: false,
      error: error.message,
      scanFunction: false,
      consoleFindings: consoleMessages.filter((message) =>
        message.text.includes('[impeccable]'),
      ),
    }
  }
  injection.success = Boolean(
    injection.loaded && injection.scanFunction && injection.detectFunction,
  )
  writeJson(path.join(evidenceDir, 'overlay-injection.json'), {
    ...injection,
    liveServer: liveServerInfo,
    scriptEndpoint: `http://127.0.0.1:${liveServerInfo.port}/detect.js`,
    success: injection.success,
  })

  if (injection.success) {
    await collectView(
      '01-desktop-default-light',
      '桌面默认数据、浅色主题、默认选择状态',
      { width: 1440, height: 1000 },
    )

    const darkTheme = page.getByRole('checkbox', { name: 'HUD 深色主题' })
    await darkTheme.check()
    await collectView(
      '02-desktop-hud-dark',
      '桌面 HUD 深色主题',
      { width: 1440, height: 1000 },
    )

    await darkTheme.uncheck()
    await page.getByRole('button', { name: '空结果', exact: true }).click()
    await collectView(
      '03-desktop-empty-result',
      '桌面空树结果，既有选中项仍可见',
      { width: 1440, height: 1000 },
    )

    await page.getByRole('button', { name: '加载失败', exact: true }).click()
    await collectView(
      '04-desktop-load-error',
      '桌面加载失败，宿主错误消息与重试操作',
      { width: 1440, height: 1000 },
    )

    await page.getByRole('button', { name: '正常数据', exact: true }).click()
    await page.setViewportSize({ width: 390, height: 844 })
    const mobileSelectedPanel = page.getByTestId('mobile-selected-panel')
    await mobileSelectedPanel.waitFor({ state: 'visible' })
    await mobileSelectedPanel.click()
    await collectView(
      '05-mobile-selected-panel',
      '390x844 窄屏已选面板',
      { width: 390, height: 844 },
    )

    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.locator('select[aria-label="面板高度"]').selectOption('240')
    const scopeSummary = page.locator(
      '.lx-transfer-panel__scope-actions > summary',
    )
    await scopeSummary.click()
    await collectView(
      '06-desktop-invert-popover-240',
      '桌面 240px 默认高度下展开整棵树反选说明浮层',
      { width: 1440, height: 1000 },
    )

    await scopeSummary.click()
    await page.locator('select[aria-label="面板高度"]').selectOption('300')
    await collectView(
      '07-desktop-compact-300',
      '桌面 300px 紧凑档',
      { width: 1440, height: 1000 },
    )
  }

  writeJson(path.join(evidenceDir, 'console-all.json'), consoleMessages)
  writeJson(path.join(evidenceDir, 'page-errors.json'), {
    pageErrors,
    failedRequests,
  })
  writeJson(path.join(evidenceDir, 'views-index.json'), viewResults)

  const sourceHashesEnd = Object.fromEntries(
    sources.map((file) => [file, sha256(path.join(root, file))]),
  )
  writeJson(path.join(evidenceDir, 'source-hashes-browser-end.json'), sourceHashesEnd)

  writeJson(path.join(evidenceDir, 'run-summary.json'), {
    pageWasNew: true,
    pageCountInFreshContext: context.pages().length,
    targetUrl,
    targetResponseStatus: response?.status() ?? null,
    originalTitle,
    preflightPassed: preflight.mutationPassed,
    overlayInjectionSucceeded: Boolean(
      injection.loaded && injection.scanFunction && injection.detectFunction,
    ),
    liveServer: liveServerInfo,
    viewCount: viewResults.length,
    viewNames: viewResults.map((view) => view.name),
    pageErrors,
    failedRequests,
    sourceHashesStart,
    sourceHashesEnd,
    sourceHashesUnchanged: JSON.stringify(sourceHashesStart) === JSON.stringify(sourceHashesEnd),
  })
}

try {
  await main()
} catch (error) {
  writeJson(path.join(evidenceDir, 'capture-error.json'), {
    message: error.message,
    stack: error.stack,
    liveServerStarted,
    liveServer: liveServerInfo,
  })
  process.exitCode = 1
} finally {
  if (browser) await browser.close().catch(() => {})
  if (liveServerStarted) {
    runLiveServer('stop', ['stop', '--keep-inject'])
    writeJson(path.join(evidenceDir, 'live-server-after-stop.json'), {
      info: liveServerInfo,
      health: await ping(`http://127.0.0.1:${liveServerInfo.port}/health`),
    })
  }
  writeJson(path.join(evidenceDir, 'target-health-after.json'), await ping(targetUrl))
}
