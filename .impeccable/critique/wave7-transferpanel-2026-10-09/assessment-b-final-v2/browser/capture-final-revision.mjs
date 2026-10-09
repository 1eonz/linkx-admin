import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const root = String.raw`F:\work\linkx-admin`
const outputDir = path.join(
  root,
  '.impeccable/critique/wave7-transferpanel-2026-10-09/assessment-b-final-v2/browser/attempt-5',
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
const responseErrors = []
const capturedViews = []
let browser
let page
let liveServerStarted = false
let liveServerInfo = null

fs.mkdirSync(path.join(outputDir, 'screenshots'), { recursive: true })
fs.mkdirSync(path.join(outputDir, 'views'), { recursive: true })

function sha256(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function recordProcess(name, executable, args, result, extra = {}) {
  fs.mkdirSync(path.join(outputDir, 'processes'), { recursive: true })
  writeJson(path.join(outputDir, 'processes', `${name}.json`), {
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

async function collectView(name, description, { width, height }, overlay) {
  await page.setViewportSize({ width, height })
  await page.locator('.lx-transfer-panel').scrollIntoViewIfNeeded()
  let scanSummary = null
  let viewConsole = []

  if (overlay) {
    const consoleStart = consoleMessages.length
    scanSummary = await page.evaluate(() => {
      const matches = window.impeccableScan()
      const rules = {}
      const entries = matches.map(({ el, findings }) => {
        const path = []
        let current = el
        for (let depth = 0; current && depth < 4; depth += 1) {
          const classes =
            typeof current.className === 'string'
              ? current.className.trim().split(/\s+/).filter(Boolean).slice(0, 3)
              : []
          path.push(
            `${current.tagName.toLowerCase()}${current.id ? `#${current.id}` : ''}${classes.map((name) => `.${name}`).join('')}`,
          )
          current = current.parentElement
        }
        const normalized = findings.map((finding) => ({
          type: finding.type || finding.id,
          detail: finding.detail || finding.snippet || '',
        }))
        normalized.forEach((finding) => {
          rules[finding.type] = (rules[finding.type] || 0) + 1
        })
        return { path, findings: normalized }
      })
      return {
        elementCount: matches.length,
        findingCount: entries.reduce(
          (count, entry) => count + entry.findings.length,
          0,
        ),
        rules,
        entries,
      }
    })
    await page.waitForTimeout(1600)
    viewConsole = consoleMessages.slice(consoleStart)
  }

  const dom = await page.evaluate(() => {
    const rect = (element) => {
      if (!(element instanceof HTMLElement)) return null
      const box = element.getBoundingClientRect()
      return {
        x: Math.round(box.x * 10) / 10,
        y: Math.round(box.y * 10) / 10,
        right: Math.round(box.right * 10) / 10,
        bottom: Math.round(box.bottom * 10) / 10,
        width: Math.round(box.width * 10) / 10,
        height: Math.round(box.height * 10) / 10,
      }
    }
    const component = document.querySelector('.lx-transfer-panel')
    const selectedList = component?.querySelector('.lx-transfer-panel__selected')
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
    const summaryRect = rect(scopeSummary)
    const contentRect = rect(scopeContent)
    const headerRect = rect(componentHeader)
    const contentStyle = scopeContent ? getComputedStyle(scopeContent) : null
    const overlays = Array.from(
      document.querySelectorAll('.impeccable-overlay'),
    ).map((element) => {
      const box = element.getBoundingClientRect()
      return {
        classes: element.className,
        visible: element.classList.contains('impeccable-visible'),
        rect: {
          x: Math.round(box.x * 10) / 10,
          y: Math.round(box.y * 10) / 10,
          width: Math.round(box.width * 10) / 10,
          height: Math.round(box.height * 10) / 10,
        },
        text: (element.textContent ?? '').trim().slice(0, 100),
      }
    })
    const tab = document.querySelector(
      '[data-testid="mobile-selected-panel"]',
    )

    return {
      url: location.href,
      title: document.title,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      },
      component: {
        exists: Boolean(component),
        rect: rect(component),
        clientWidth: component?.clientWidth ?? null,
        scrollWidth: component?.scrollWidth ?? null,
        heightToken:
          component &&
          getComputedStyle(component)
            .getPropertyValue('--lx-transfer-panel-height')
            .trim(),
        classes: component?.className ?? null,
      },
      selectedList: {
        exists: Boolean(selectedList),
        rect: rect(selectedList),
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
            ? Math.round((contentRect.y - summaryRect.bottom) * 10) / 10
            : null,
        offsetFromHeaderBottom:
          headerRect && contentRect
            ? Math.round((contentRect.y - headerRect.bottom) * 10) / 10
            : null,
        computed: contentStyle
          ? {
              display: contentStyle.display,
              visibility: contentStyle.visibility,
              position: contentStyle.position,
              insetBlockStart: contentStyle.insetBlockStart,
              insetInlineEnd: contentStyle.insetInlineEnd,
              transform: contentStyle.transform,
              maxHeight: contentStyle.maxHeight,
              overflowY: contentStyle.overflowY,
            }
          : null,
        text: (scopeContent?.textContent ?? '').trim().slice(0, 240),
      },
      selectedTabPressed: tab?.getAttribute('aria-pressed') ?? null,
      liveStatus:
        document.querySelector('[data-testid="transfer-status"]')?.textContent ??
        null,
      selectedCount:
        document.querySelector('[data-testid="selected-count"]')?.textContent ??
        null,
      overlayCount: overlays.length,
      visibleOverlayCount: overlays.filter((item) => item.visible).length,
      overlays,
      componentDom: component?.outerHTML ?? null,
    }
  })

  const screenshot = path.join(outputDir, 'screenshots', `${name}.png`)
  await page.screenshot({ path: screenshot, animations: 'disabled' })
  const view = {
    name,
    description,
    overlay,
    scanSummary,
    console: viewConsole.filter((message) =>
      message.text.includes('[impeccable]'),
    ),
    screenshot: path.relative(root, screenshot),
    dom,
  }
  writeJson(path.join(outputDir, 'views', `${name}.json`), view)
  fs.writeFileSync(
    path.join(outputDir, 'views', `${name}.dom.html`),
    dom.componentDom ?? '<!-- component DOM unavailable -->',
    'utf8',
  )
  capturedViews.push({
    name,
    description,
    overlay,
    screenshot: view.screenshot,
    viewport: dom.viewport,
    component: dom.component,
    selectedList: dom.selectedList,
    scopePopover: dom.scopePopover,
    scanSummary,
    overlayCount: dom.overlayCount,
    visibleOverlayCount: dom.visibleOverlayCount,
  })
}

async function main() {
  try {
  const sourceHashesStart = Object.fromEntries(
    sources.map((file) => [file, sha256(path.join(root, file))]),
  )
  writeJson(path.join(outputDir, 'source-hashes-start.json'), sourceHashesStart)
  const targetHealthBefore = await ping(targetUrl)
  writeJson(path.join(outputDir, 'target-health-before.json'), targetHealthBefore)

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
  page.on('console', (message) =>
    consoleMessages.push({
      type: message.type(),
      text: message.text(),
      location: message.location(),
    }),
  )
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('requestfailed', (request) =>
    failedRequests.push({
      url: request.url(),
      error: request.failure()?.errorText ?? null,
    }),
  )
  page.on('response', (response) => {
    if (response.status() >= 400) {
      responseErrors.push({ url: response.url(), status: response.status() })
    }
  })

  const response = await page.goto(targetUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  })
  await page.locator('.transfer-panel-demo').waitFor({
    state: 'attached',
    timeout: 45_000,
  })
  await page.evaluate(() => window.scrollTo(0, 0))
  const originalTitle = await page.title()
  const preflight = await page.evaluate(() => {
    const original = document.title
    document.title = '[Human] LxTransferPanel final Assessment B'
    const script = document.createElement('script')
    script.dataset.assessmentBPreflight = 'true'
    script.textContent = 'window.__assessmentBPreflight = "executed";'
    document.head.append(script)
    return {
      originalTitle: original,
      mutatedTitle: document.title,
      scriptAppended: script.isConnected,
      scriptExecuted: window.__assessmentBPreflight === 'executed',
    }
  })
  writeJson(path.join(outputDir, 'browser-preflight.json'), {
    pageWasNew: true,
    pageCountInFreshContext: context.pages().length,
    targetUrl,
    responseStatus: response?.status() ?? null,
    originalTitle,
    ...preflight,
    passed:
      preflight.scriptAppended &&
      preflight.scriptExecuted &&
      preflight.mutatedTitle.includes('[Human]'),
  })

  const settings = page.locator('.transfer-panel-demo__settings')
  if (!(await settings.evaluate((element) => element.open))) {
    await settings.locator('summary').click()
  }
  const heightSelect = page.locator('select[aria-label="面板高度"]')
  const scopeDetails = page.locator('.lx-transfer-panel__scope-actions')
  const scopeSummary = scopeDetails.locator('summary')

  await heightSelect.selectOption('240')
  if (!(await scopeDetails.evaluate((element) => element.open))) {
    await scopeSummary.click()
  }
  await collectView(
    '01-clean-desktop-invert-popover-240',
    '无 overlay：桌面 240px 默认高度与展开的反选说明浮层',
    { width: 1440, height: 1000 },
    false,
  )
  await scopeSummary.click()
  await heightSelect.selectOption('300')
  await collectView(
    '02-clean-desktop-compact-300',
    '无 overlay：桌面 300px 紧凑档',
    { width: 1440, height: 1000 },
    false,
  )

  await heightSelect.selectOption('240')
  await page.setViewportSize({ width: 320, height: 844 })
  const selectedTab = page.getByTestId('mobile-selected-panel')
  await selectedTab.waitFor({ state: 'visible' })
  await selectedTab.click()
  await collectView(
    '03-clean-mobile-320-selected',
    '无 overlay：320x844 窄屏已选面板',
    { width: 320, height: 844 },
    false,
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByTestId('mobile-selected-panel').click()
  await collectView(
    '04-clean-mobile-390-selected',
    '无 overlay：390x844 窄屏已选面板',
    { width: 390, height: 844 },
    false,
  )

  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.evaluate(() => window.scrollTo(0, 0))
  const server = runLiveServer('start', ['--background'])
  if (!liveServerStarted || !liveServerInfo) {
    throw new Error(`Impeccable live server failed to start (exit ${server.result.status}).`)
  }
  const script = await page.addScriptTag({
    url: `http://127.0.0.1:${liveServerInfo.port}/detect.js`,
  })
  await page.waitForTimeout(2400)
  const injection = {
    scriptConnected: await script.evaluate((element) => element.isConnected),
    scriptSrc: await script.getAttribute('src'),
    scanFunction: await page.evaluate(
      () => typeof window.impeccableScan === 'function',
    ),
    detectFunction: await page.evaluate(
      () => typeof window.impeccableDetect === 'function',
    ),
    initialConsoleFindings: consoleMessages.filter((message) =>
      message.text.includes('[impeccable]'),
    ),
  }
  injection.success = Boolean(
    injection.scriptConnected &&
    injection.scanFunction &&
    injection.detectFunction,
  )
  writeJson(path.join(outputDir, 'overlay-injection.json'), {
    ...injection,
    liveServer: liveServerInfo,
    endpoint: `http://127.0.0.1:${liveServerInfo.port}/detect.js`,
  })

  if (injection.success) {
    if (!(await scopeDetails.evaluate((element) => element.open))) {
      await scopeSummary.click()
    }
    await heightSelect.selectOption('240')
    await collectView(
      '05-overlay-desktop-invert-popover-240',
      'overlay：桌面 240px 默认高度与展开的反选说明浮层',
      { width: 1440, height: 1000 },
      true,
    )
    await scopeSummary.click()
    await heightSelect.selectOption('300')
    await collectView(
      '06-overlay-desktop-compact-300',
      'overlay：桌面 300px 紧凑档',
      { width: 1440, height: 1000 },
      true,
    )

    await heightSelect.selectOption('240')
    await page.setViewportSize({ width: 320, height: 844 })
    await page.getByTestId('mobile-selected-panel').click()
    await collectView(
      '07-overlay-mobile-320-selected',
      'overlay：320x844 窄屏已选面板',
      { width: 320, height: 844 },
      true,
    )
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByTestId('mobile-selected-panel').click()
    await collectView(
      '08-overlay-mobile-390-selected',
      'overlay：390x844 窄屏已选面板',
      { width: 390, height: 844 },
      true,
    )
  }

  writeJson(path.join(outputDir, 'console-all.json'), consoleMessages)
  writeJson(path.join(outputDir, 'page-errors.json'), {
    pageErrors,
    failedRequests,
    httpResponsesAtOrAbove400: responseErrors,
  })
  writeJson(path.join(outputDir, 'views-index.json'), capturedViews)
  const sourceHashesEnd = Object.fromEntries(
    sources.map((file) => [file, sha256(path.join(root, file))]),
  )
  writeJson(path.join(outputDir, 'source-hashes-end.json'), sourceHashesEnd)
  writeJson(path.join(outputDir, 'run-summary.json'), {
    pageWasNew: true,
    pageCountInFreshContext: context.pages().length,
    targetUrl,
    targetResponseStatus: response?.status() ?? null,
    originalTitle,
    preflightPassed:
      preflight.scriptAppended && preflight.scriptExecuted,
    overlayInjectionSucceeded: injection.success,
    liveServer: liveServerInfo,
    viewCount: capturedViews.length,
    views: capturedViews.map((view) => view.name),
    pageErrors,
    failedRequests,
    httpResponsesAtOrAbove400: responseErrors,
    sourceHashesStart,
    sourceHashesEnd,
    sourceHashesUnchanged:
      JSON.stringify(sourceHashesStart) === JSON.stringify(sourceHashesEnd),
  })
} catch (error) {
  writeJson(path.join(outputDir, 'capture-error.json'), {
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
    writeJson(path.join(outputDir, 'live-server-after-stop.json'), {
      info: liveServerInfo,
      health: await ping(`http://127.0.0.1:${liveServerInfo.port}/health`),
    })
  }
  writeJson(path.join(outputDir, 'target-health-after.json'), await ping(targetUrl))
}

}

await main()
