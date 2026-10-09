import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const evidenceDir = path.dirname(fileURLToPath(import.meta.url))
const browserOutputDir = path.join(evidenceDir, 'browser')
const scenarioOutputDir = path.join(browserOutputDir, 'scenarios')
const playwrightPath = 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
const require = createRequire(import.meta.url)
const { chromium } = require(playwrightPath)
const startRecord = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'live-server-start.json'), 'utf8'))
const detectorServerUrl = `http://127.0.0.1:${startRecord.server.port}`

const scenarios = [
  {
    id: 'transferpanel-light-ready-desktop',
    page: 'TransferPanel',
    route: 'http://127.0.0.1:4174/components/lxtransferpanel',
    selector: '.transfer-panel-demo',
    settingsSelector: '.transfer-panel-demo__settings',
    theme: 'light',
    state: 'ready',
    stateButton: '正常数据',
    viewport: { width: 1440, height: 1000 },
    mobile: false,
  },
  {
    id: 'transferpanel-hud-ready-desktop',
    page: 'TransferPanel',
    route: 'http://127.0.0.1:4174/components/lxtransferpanel',
    selector: '.transfer-panel-demo',
    settingsSelector: '.transfer-panel-demo__settings',
    theme: 'HUD',
    state: 'ready',
    stateButton: '正常数据',
    viewport: { width: 1440, height: 1000 },
    mobile: false,
  },
  {
    id: 'transferpanel-hud-ready-mobile',
    page: 'TransferPanel',
    route: 'http://127.0.0.1:4174/components/lxtransferpanel',
    selector: '.transfer-panel-demo',
    settingsSelector: '.transfer-panel-demo__settings',
    theme: 'HUD',
    state: 'ready',
    stateButton: '正常数据',
    viewport: { width: 390, height: 844 },
    mobile: true,
  },
  {
    id: 'transferpanel-hud-loading-desktop',
    page: 'TransferPanel',
    route: 'http://127.0.0.1:4174/components/lxtransferpanel',
    selector: '.transfer-panel-demo',
    settingsSelector: '.transfer-panel-demo__settings',
    theme: 'HUD',
    state: 'loading',
    stateButton: '加载中',
    viewport: { width: 1440, height: 1000 },
    mobile: false,
  },
  {
    id: 'transferpanel-hud-error-desktop',
    page: 'TransferPanel',
    route: 'http://127.0.0.1:4174/components/lxtransferpanel',
    selector: '.transfer-panel-demo',
    settingsSelector: '.transfer-panel-demo__settings',
    theme: 'HUD',
    state: 'error',
    stateButton: '加载失败',
    viewport: { width: 1440, height: 1000 },
    mobile: false,
  },
  {
    id: 'virtualtree-light-ready-desktop',
    page: 'VirtualTree',
    route: 'http://127.0.0.1:4174/components/lxvirtualtree',
    selector: '.virtual-tree-demo',
    settingsSelector: '.virtual-tree-demo__controls',
    theme: 'light',
    state: 'ready',
    stateButton: '正常数据',
    viewport: { width: 1440, height: 1000 },
    mobile: false,
  },
  {
    id: 'virtualtree-hud-ready-desktop',
    page: 'VirtualTree',
    route: 'http://127.0.0.1:4174/components/lxvirtualtree',
    selector: '.virtual-tree-demo',
    settingsSelector: '.virtual-tree-demo__controls',
    theme: 'HUD',
    state: 'ready',
    stateButton: '正常数据',
    viewport: { width: 1440, height: 1000 },
    mobile: false,
  },
  {
    id: 'virtualtree-hud-ready-mobile',
    page: 'VirtualTree',
    route: 'http://127.0.0.1:4174/components/lxvirtualtree',
    selector: '.virtual-tree-demo',
    settingsSelector: '.virtual-tree-demo__controls',
    theme: 'HUD',
    state: 'ready',
    stateButton: '正常数据',
    viewport: { width: 390, height: 844 },
    mobile: true,
  },
  {
    id: 'virtualtree-hud-empty-desktop',
    page: 'VirtualTree',
    route: 'http://127.0.0.1:4174/components/lxvirtualtree',
    selector: '.virtual-tree-demo',
    settingsSelector: '.virtual-tree-demo__controls',
    theme: 'HUD',
    state: 'empty',
    stateButton: '空结果',
    viewport: { width: 1440, height: 1000 },
    mobile: false,
  },
  {
    id: 'virtualtree-hud-error-desktop',
    page: 'VirtualTree',
    route: 'http://127.0.0.1:4174/components/lxvirtualtree',
    selector: '.virtual-tree-demo',
    settingsSelector: '.virtual-tree-demo__controls',
    theme: 'HUD',
    state: 'error',
    stateButton: '加载失败',
    viewport: { width: 1440, height: 1000 },
    mobile: false,
  },
]

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function measurePage(page) {
  return page.evaluate(() => {
    const html = document.documentElement
    const body = document.body
    const width = html.clientWidth
    const elements = Array.from(body.querySelectorAll('*'))
      .filter((element) => !element.closest('.impeccable-overlay'))
      .filter((element) => !element.closest('.vp-doc-aside, .VPDocAside, .aside-container, .aside-curtain'))
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return style.display !== 'none' && style.visibility !== 'hidden'
          && (rect.right > width + 1 || rect.left < -1 || rect.width > width + 1)
      })
      .map((element) => {
        const rect = element.getBoundingClientRect()
        return {
          tag: element.tagName.toLowerCase(),
          className: element.className?.toString?.() ?? '',
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          overflowX: getComputedStyle(element).overflowX,
          text: element.textContent?.trim?.().replace(/\s+/g, ' ').slice(0, 100) ?? '',
        }
      })
      .sort((first, second) => second.right - first.right)
      .slice(0, 12)
    return {
      viewportClientWidth: width,
      windowInnerWidth: window.innerWidth,
      visualViewportWidth: window.visualViewport?.width ?? null,
      viewportHeight: window.innerHeight,
      documentClientWidth: html.clientWidth,
      documentScrollWidth: html.scrollWidth,
      bodyClientWidth: body.clientWidth,
      bodyScrollWidth: body.scrollWidth,
      horizontalOverflow: html.scrollWidth > width + 1 || body.scrollWidth > width + 1,
      pageScrollX: window.scrollX,
      pageScrollY: window.scrollY,
      overflowingElements: elements,
      faviconLinks: Array.from(document.querySelectorAll('link[rel~="icon"]')).map((link) => ({
        href: link.href,
        rel: link.rel,
        type: link.type,
      })),
      horizontalOverflowInspectionScope: 'body content excluding VitePress right outline navigation and Impeccable overlays',
    }
  })
}

const browser = await chromium.launch({ headless: true })
const index = {
  capturedAt: new Date().toISOString(),
  browserVersion: browser.version(),
  browserEngine: 'Playwright Chromium',
  humanTabAvailable: false,
  humanTabOverlayStatement: '无用户可见 overlay；检测脚本仅注入到独立 Playwright BrowserContext。',
  detectorServerUrl,
  targetServer: 'http://127.0.0.1:4174',
  expectedIndependentContexts: scenarios.length,
  scenarios: [],
}

for (let position = 0; position < scenarios.length; position += 1) {
  const scenario = scenarios[position]
  const scenarioDir = path.join(scenarioOutputDir, scenario.id)
  const screenshotDir = path.join(browserOutputDir, 'screenshots')
  fs.mkdirSync(scenarioDir, { recursive: true })
  fs.mkdirSync(screenshotDir, { recursive: true })

  const context = await browser.newContext({
    viewport: scenario.viewport,
    deviceScaleFactor: 1,
    isMobile: scenario.mobile,
    hasTouch: scenario.mobile,
    colorScheme: 'light',
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  const consoleEvents = []
  const networkEvents = []
  const pageErrors = []
  const scenarioResult = {
    id: scenario.id,
    contextOrdinal: position + 1,
    independentContext: true,
    page: scenario.page,
    route: scenario.route,
    requestedTheme: scenario.theme,
    requestedState: scenario.state,
    viewport: scenario.viewport,
    mobileContext: scenario.mobile,
    detectorServerUrl,
    startedAt: new Date().toISOString(),
    succeeded: false,
    error: null,
  }

  page.on('console', (message) => {
    consoleEvents.push({
      type: message.type(),
      text: message.text(),
      location: message.location(),
      at: new Date().toISOString(),
    })
  })
  page.on('pageerror', (error) => {
    pageErrors.push({ message: error.message, stack: error.stack, at: new Date().toISOString() })
  })
  page.on('request', (request) => {
    networkEvents.push({
      event: 'request',
      method: request.method(),
      url: request.url(),
      resourceType: request.resourceType(),
      at: new Date().toISOString(),
    })
  })
  page.on('requestfailed', (request) => {
    networkEvents.push({
      event: 'requestfailed',
      method: request.method(),
      url: request.url(),
      resourceType: request.resourceType(),
      failure: request.failure(),
      at: new Date().toISOString(),
    })
  })
  page.on('response', (response) => {
    networkEvents.push({
      event: 'response',
      url: response.url(),
      status: response.status(),
      ok: response.ok(),
      resourceType: response.request().resourceType(),
      at: new Date().toISOString(),
    })
  })

  try {
    const mainResponse = await page.goto(scenario.route, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    })
    scenarioResult.mainDocumentStatus = mainResponse?.status() ?? null
    await page.locator(scenario.selector).waitFor({ state: 'visible', timeout: 30000 })
    await page.evaluate(() => document.fonts.ready.then(() => true))

    if (scenario.theme === 'HUD' || scenario.state !== 'ready') {
      const details = page.locator(scenario.settingsSelector)
      if (!(await details.evaluate((node) => node.open))) {
        await details.locator('summary').click()
      }
      if (scenario.theme === 'HUD') {
        await page
          .locator(scenario.selector)
          .locator('label')
          .filter({ hasText: 'HUD 深色主题' })
          .locator('input[type="checkbox"]')
          .check()
      }
      if (scenario.state !== 'ready') {
        await page
          .locator(scenario.selector)
          .getByRole('button', { name: scenario.stateButton, exact: true })
          .click()
      }
      await page.waitForTimeout(300)
      await details.locator('summary').click()
    }

    scenarioResult.renderedState = await page.locator(scenario.selector).evaluate((root) => {
      const pressed = Array.from(root.querySelectorAll('button[aria-pressed="true"]'))
        .map((button) => button.textContent?.trim())
        .filter(Boolean)
      return {
        hudClassApplied: root.classList.contains('lx-theme-hud'),
        pressedButtons: pressed,
        visibleStatus: root.querySelector('[role="status"], [role="alert"]')?.textContent?.trim() ?? null,
        backgroundColor: getComputedStyle(root).backgroundColor,
      }
    })

    scenarioResult.preflight = await page.evaluate(() => {
      const originalTitle = document.title
      document.title = `${originalTitle} [Assessment B preflight]`
      const script = document.createElement('script')
      script.id = 'assessment-b-mutation-preflight'
      script.textContent = 'window.__assessmentBPreflight = { injected: true, at: Date.now() };'
      document.body.appendChild(script)
      return {
        originalTitle,
        mutatedTitle: document.title,
        scriptTagConnected: script.isConnected,
        scriptExecuted: window.__assessmentBPreflight?.injected === true,
        scriptCount: document.querySelectorAll('#assessment-b-mutation-preflight').length,
      }
    })
    await page.evaluate(() => window.scrollTo(0, 0))
    scenarioResult.baselinePageMetrics = await measurePage(page)
    scenarioResult.faviconProbe = await page.evaluate(async () => {
      const link = document.querySelector('link[rel~="icon"]')
      if (!link) return { linkFound: false }
      try {
        const response = await fetch(link.href, { cache: 'no-store' })
        const body = await response.arrayBuffer()
        return {
          linkFound: true,
          href: link.href,
          status: response.status,
          ok: response.ok,
          contentType: response.headers.get('content-type'),
          bytes: body.byteLength,
        }
      } catch (error) {
        return {
          linkFound: true,
          href: link.href,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    })

    const detectorScriptUrl = `${detectorServerUrl}/detect.js`
    scenarioResult.overlayInjection = {
      requestedUrl: detectorScriptUrl,
      scriptTagReturned: false,
      scriptResponseStatuses: [],
      apiReady: false,
      scanInvoked: false,
      scanResult: null,
      error: null,
    }
    try {
      await page.addScriptTag({ url: detectorScriptUrl })
      scenarioResult.overlayInjection.scriptTagReturned = true
      await page.waitForFunction(
        () => typeof window.impeccableScan === 'function' && typeof window.impeccableDetect === 'function',
        undefined,
        { timeout: 15000 },
      )
      scenarioResult.overlayInjection.apiReady = true
      scenarioResult.overlayInjection.scanResult = await page.evaluate(() => {
        const run = window.impeccableScan({})
        return {
          scanInvoked: true,
          scanReturnType: Array.isArray(run) ? 'array' : typeof run,
          scanReturnCount: Array.isArray(run) ? run.length : null,
          detectorResults: window.impeccableDetect(),
        }
      })
      scenarioResult.overlayInjection.scanInvoked = true
      await page.waitForTimeout(3000)
    } catch (error) {
      scenarioResult.overlayInjection.error = error instanceof Error ? error.message : String(error)
    }

    await page.locator(scenario.selector).scrollIntoViewIfNeeded()
    await page.waitForTimeout(250)
    scenarioResult.pageMetrics = await measurePage(page)
    scenarioResult.pageMetrics.injectedDetectorNodes = await page
      .locator('script[src*="/detect.js"], #assessment-b-mutation-preflight')
      .count()
    scenarioResult.pageMetrics.documentScrollWidthBeforeOverlay = scenarioResult.baselinePageMetrics.documentScrollWidth
    scenarioResult.pageMetrics.pageOwnsHorizontalOverflow = scenarioResult.baselinePageMetrics.horizontalOverflow
    scenarioResult.overlayInjection.overlayNodes = await page.locator('.impeccable-overlay').evaluateAll((nodes) =>
      nodes.map((node) => {
        const target = node._targetEl
        if (!(target instanceof Element)) {
          return {
            className: node.className,
            text: node.textContent?.trim() ?? '',
            target: null,
            display: getComputedStyle(node).display,
          }
        }
        const scopeRoot = target.closest(
          '.lx-transfer-panel, .lx-virtual-tree, .transfer-panel-demo, .virtual-tree-demo',
        )
        const component = target.closest('.lx-transfer-panel, .lx-virtual-tree')
        const demo = target.closest('.transfer-panel-demo, .virtual-tree-demo')
        const scope = component
          ? { kind: 'component', tag: component.tagName.toLowerCase(), className: component.className.toString() }
          : demo
            ? { kind: 'demo', tag: demo.tagName.toLowerCase(), className: demo.className.toString() }
            : target.closest('.vp-doc')
              ? { kind: 'docs-content', tag: 'div', className: 'vp-doc' }
              : { kind: 'docs-shell', tag: 'page-chrome', className: '' }
        const pathParts = []
        let current = target
        while (current && pathParts.length < 12) {
          const tag = current.tagName.toLowerCase()
          const classes = Array.from(current.classList || []).slice(0, 3)
          const siblings = current.parentElement
            ? Array.from(current.parentElement.children).filter((child) => child.tagName === current.tagName)
            : []
          const nth = siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(current) + 1})` : ''
          pathParts.unshift(`${tag}${classes.length ? `.${classes.join('.')}` : ''}${nth}`)
          if (current === scopeRoot || current === document.body) break
          current = current.parentElement
        }
        const rect = target.getBoundingClientRect()
        const style = getComputedStyle(target)
        const details = target.closest('details')
        return {
          className: node.className,
          text: node.textContent?.trim() ?? '',
          targetTag: target.tagName.toLowerCase(),
          targetClass: target.className?.toString?.() ?? '',
          targetText: target.textContent?.trim?.().slice(0, 180) ?? '',
          target: {
            scope,
            selector: pathParts.join(' > '),
            visible: style.display !== 'none'
              && style.visibility !== 'hidden'
              && rect.width > 0
              && rect.height > 0
              && (!details || details.open),
            rect: {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            },
          },
          display: getComputedStyle(node).display,
        }
      }),
    ).catch(() => [])
    scenarioResult.overlayInjection.scriptResponseStatuses = networkEvents
      .filter((entry) => entry.event === 'response' && entry.url === scenarioResult.overlayInjection.requestedUrl)
      .map((entry) => ({ status: entry.status, ok: entry.ok }))

    const screenshotPath = path.join(screenshotDir, `${scenario.id}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: false, animations: 'disabled' })
    scenarioResult.screenshot = path.relative(evidenceDir, screenshotPath).replaceAll('\\', '/')
    scenarioResult.screenshotSha256 = sha256(fs.readFileSync(screenshotPath))
    scenarioResult.faviconResponses = networkEvents
      .filter((entry) => entry.event === 'response' && /\/favicon(?:\.[a-z0-9]+)?(?:\?|$)/i.test(entry.url))
    scenarioResult.favicon404s = scenarioResult.faviconResponses.filter((entry) => entry.status === 404)
    scenarioResult.failedRequests = networkEvents.filter((entry) => entry.event === 'requestfailed')
    scenarioResult.httpErrors = networkEvents.filter((entry) => entry.event === 'response' && entry.status >= 400)
    scenarioResult.consoleErrorCount = consoleEvents.filter((entry) => entry.type === 'error').length
    scenarioResult.pageErrorCount = pageErrors.length
    scenarioResult.finishedAt = new Date().toISOString()
    scenarioResult.succeeded = scenarioResult.mainDocumentStatus === 200
      && scenarioResult.preflight.scriptExecuted
      && scenarioResult.overlayInjection.scriptTagReturned
      && scenarioResult.overlayInjection.scriptResponseStatuses.some((entry) => entry.status === 200)
      && scenarioResult.overlayInjection.apiReady
      && scenarioResult.overlayInjection.scanInvoked

    fs.writeFileSync(path.join(scenarioDir, 'console.json'), `${JSON.stringify(consoleEvents, null, 2)}\n`, 'utf8')
    fs.writeFileSync(path.join(scenarioDir, 'network.json'), `${JSON.stringify(networkEvents, null, 2)}\n`, 'utf8')
    fs.writeFileSync(path.join(scenarioDir, 'page-errors.json'), `${JSON.stringify(pageErrors, null, 2)}\n`, 'utf8')
    writeJson(path.join(scenarioDir, 'preflight.json'), scenarioResult.preflight)
    writeJson(path.join(scenarioDir, 'overlay-injection.json'), scenarioResult.overlayInjection)
    writeJson(path.join(scenarioDir, 'favicon-probe.json'), scenarioResult.faviconProbe)
    writeJson(path.join(scenarioDir, 'baseline-page-metrics.json'), scenarioResult.baselinePageMetrics)
    writeJson(path.join(scenarioDir, 'page-metrics.json'), scenarioResult.pageMetrics)
    writeJson(path.join(scenarioDir, 'scenario-result.json'), scenarioResult)
    index.scenarios.push(scenarioResult)
  } catch (error) {
    scenarioResult.error = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error)
    scenarioResult.finishedAt = new Date().toISOString()
    scenarioResult.consoleErrorCount = consoleEvents.filter((entry) => entry.type === 'error').length
    scenarioResult.pageErrorCount = pageErrors.length
    fs.writeFileSync(path.join(scenarioDir, 'console.json'), `${JSON.stringify(consoleEvents, null, 2)}\n`, 'utf8')
    fs.writeFileSync(path.join(scenarioDir, 'network.json'), `${JSON.stringify(networkEvents, null, 2)}\n`, 'utf8')
    fs.writeFileSync(path.join(scenarioDir, 'page-errors.json'), `${JSON.stringify(pageErrors, null, 2)}\n`, 'utf8')
    writeJson(path.join(scenarioDir, 'scenario-result.json'), scenarioResult)
    index.scenarios.push(scenarioResult)
  } finally {
    await context.close()
  }
}

await browser.close()

index.finishedAt = new Date().toISOString()
index.completedIndependentContexts = index.scenarios.filter((scenario) => scenario.independentContext).length
index.successfulScenarios = index.scenarios.filter((scenario) => scenario.succeeded).length
index.favicon404Count = index.scenarios.reduce((sum, scenario) => sum + (scenario.favicon404s?.length ?? 0), 0)
index.faviconResponseCount = index.scenarios.reduce((sum, scenario) => sum + (scenario.faviconResponses?.length ?? 0), 0)
index.faviconProbeFailures = index.scenarios
  .filter((scenario) => scenario.faviconProbe?.status !== 200 || scenario.faviconProbe?.ok !== true)
  .map((scenario) => ({ id: scenario.id, probe: scenario.faviconProbe ?? null }))
index.horizontalOverflowScenarios = index.scenarios
  .filter((scenario) => scenario.baselinePageMetrics?.horizontalOverflow)
  .map((scenario) => scenario.id)
index.horizontalOverflowAfterOverlayScenarios = index.scenarios
  .filter((scenario) => scenario.pageMetrics?.horizontalOverflow)
  .map((scenario) => scenario.id)
index.failedScenarios = index.scenarios
  .filter((scenario) => !scenario.succeeded)
  .map((scenario) => ({ id: scenario.id, error: scenario.error ?? scenario.overlayInjection?.error ?? null }))

writeJson(path.join(browserOutputDir, 'browser-evidence-index.json'), index)
process.stdout.write('Browser evidence capture complete.\n')
