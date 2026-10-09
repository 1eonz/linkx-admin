import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const root = String.raw`F:\work\linkx-admin`
const outputDir = path.join(
  root,
  '.impeccable/critique/wave7-transferpanel-2026-10-09/assessment-b-width-final',
)
const detectorScript = String.raw`C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs`
const liveServerScript = String.raw`C:\Users\Administrator\.codex\skills\impeccable\scripts\live-server.mjs`
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const chromePath = String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`
const packageRequire = createRequire(
  path.join(root, 'other-admin/admin-vue3/package.json'),
)
const { chromium } = packageRequire('@playwright/test')
const sources = [
  'linkx-fe/src/components/LxTransferPanel/index.vue',
  'linkx-fe/src/components/LxTransferPanel/demo/basic.vue',
  'linkx-fe/docs/.vitepress/theme/custom.css',
  'linkx-fe/docs/components/lxtransferpanel.md',
]
const detectors = [
  ['component', 'linkx-fe/src/components/LxTransferPanel/index.vue'],
  ['demo', 'linkx-fe/src/components/LxTransferPanel/demo/basic.vue'],
]
const viewSpecs = [
  { name: 'desktop-default-1440', width: 1440, height: 1000, hud: false },
  { name: 'desktop-hud-1440', width: 1440, height: 1000, hud: true },
  { name: 'mobile-selected-320', width: 320, height: 844, hud: false, selected: true },
  { name: 'mobile-selected-390', width: 390, height: 844, hud: false, selected: true },
]

fs.mkdirSync(path.join(outputDir, 'detector'), { recursive: true })
fs.mkdirSync(path.join(outputDir, 'browser', 'screenshots'), { recursive: true })
fs.mkdirSync(path.join(outputDir, 'browser', 'overlay-screenshots'), { recursive: true })
fs.mkdirSync(path.join(outputDir, 'browser', 'views'), { recursive: true })

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function sourceHashes() {
  return Object.fromEntries(
    sources.map((file) => [
      file,
      createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex'),
    ]),
  )
}

function ping(url, timeout = 1500) {
  return fetch(url, { signal: AbortSignal.timeout(timeout) })
    .then((response) => ({ status: response.status, ok: response.ok }))
    .catch((error) => ({ error: error.message }))
}

function runDetectors() {
  const results = []
  for (const [name, target] of detectors) {
    const args = [detectorScript, '--json', path.join(root, target)]
    const result = spawnSync(process.execPath, args, {
      cwd: root,
      encoding: 'utf8',
      windowsHide: true,
      maxBuffer: 4 * 1024 * 1024,
    })
    const base = path.join(outputDir, 'detector', name)
    fs.writeFileSync(`${base}.command.txt`, [process.execPath, ...args].map(JSON.stringify).join(' ') + '\n', 'utf8')
    fs.writeFileSync(`${base}.stdout.json`, result.stdout ?? '', 'utf8')
    fs.writeFileSync(`${base}.stderr.txt`, result.stderr ?? '', 'utf8')
    fs.writeFileSync(`${base}.exit-code.txt`, `${result.status ?? 'null'}\n`, 'utf8')
    let parsed = null
    let parseError = null
    try {
      parsed = JSON.parse(result.stdout ?? '')
    } catch (error) {
      parseError = error.message
    }
    const processInfo = {
      target,
      status: result.status,
      signal: result.signal,
      spawnError: result.error?.message ?? null,
      stdoutJsonValid: parseError === null,
      findingCount: Array.isArray(parsed) ? parsed.length : null,
      stderr: result.stderr ?? '',
    }
    writeJson(`${base}.process.json`, processInfo)
    results.push({ name, ...processInfo, parseError })
  }
  writeJson(path.join(outputDir, 'detector', 'summary.json'), results)
  return results
}

function rect(element) {
  if (!(element instanceof HTMLElement)) return null
  const box = element.getBoundingClientRect()
  const rounded = (value) => Math.round(value * 10) / 10
  return {
    left: rounded(box.left),
    top: rounded(box.top),
    right: rounded(box.right),
    bottom: rounded(box.bottom),
    width: rounded(box.width),
    height: rounded(box.height),
    centerX: rounded(box.left + box.width / 2),
  }
}

async function applyView(page, spec) {
  await page.setViewportSize({ width: spec.width, height: spec.height })
  const hud = page.getByRole('checkbox', { name: 'HUD 深色主题' })
  if (spec.hud && !(await hud.isChecked())) await hud.check()
  if (!spec.hud && (await hud.isChecked())) await hud.uncheck()
  const heightSelect = page.locator('select[aria-label="面板高度"]')
  await heightSelect.selectOption('240')
  if (spec.selected) {
    const selectedTab = page.getByTestId('mobile-selected-panel')
    await selectedTab.waitFor({ state: 'visible' })
    if ((await selectedTab.getAttribute('aria-pressed')) !== 'true') {
      await selectedTab.click()
    }
  }
  await page.locator('.transfer-panel-demo__surface').scrollIntoViewIfNeeded()
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  )
}

async function measureView(page, spec) {
  return page.evaluate((view) => {
    const get = (selector) => document.querySelector(selector)
    const measure = (element) => {
      if (!(element instanceof HTMLElement)) return null
      const box = element.getBoundingClientRect()
      return {
        left: Math.round(box.left * 10) / 10,
        top: Math.round(box.top * 10) / 10,
        right: Math.round(box.right * 10) / 10,
        bottom: Math.round(box.bottom * 10) / 10,
        width: Math.round(box.width * 10) / 10,
        height: Math.round(box.height * 10) / 10,
        centerX: Math.round((box.left + box.width / 2) * 10) / 10,
      }
    }
    const style = (element) => {
      if (!(element instanceof HTMLElement)) return null
      const computed = getComputedStyle(element)
      return {
        width: computed.width,
        maxWidth: computed.maxWidth,
        marginInlineStart: computed.marginInlineStart,
        marginInlineEnd: computed.marginInlineEnd,
        boxSizing: computed.boxSizing,
      }
    }
    const demo = get('.transfer-panel-demo')
    const preview = get('.transfer-panel-demo__preview')
    const surface = get('.transfer-panel-demo__surface')
    const component = get('.lx-transfer-panel')
    const tree = component?.querySelector('.lx-transfer-panel__tree')
    const selectedList = component?.querySelector('.lx-transfer-panel__selected')
    const previewRect = measure(preview)
    const surfaceRect = measure(surface)
    const componentRect = measure(component)
    const centerDelta =
      previewRect && surfaceRect
        ? Math.round((surfaceRect.centerX - previewRect.centerX) * 10) / 10
        : null
    const documentWidth = {
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
      bodyClient: document.body.clientWidth,
      bodyScroll: document.body.scrollWidth,
    }
    const surfaceMetrics = surface
      ? { clientWidth: surface.clientWidth, scrollWidth: surface.scrollWidth }
      : null
    const componentMetrics = component
      ? { clientWidth: component.clientWidth, scrollWidth: component.scrollWidth }
      : null
    const selectedTab = get('[data-testid="mobile-selected-panel"]')
    const panelWidthWithinSurface = Boolean(
      surfaceRect && componentRect && componentRect.left >= surfaceRect.left - 1 && componentRect.right <= surfaceRect.right + 1,
    )
    const panelWithinViewport = Boolean(
      componentRect && componentRect.left >= -1 && componentRect.right <= window.innerWidth + 1,
    )
    const mobile = view.width < 768
    const noDocumentOverflow = documentWidth.scroll <= documentWidth.client
    const noSurfaceOverflow = Boolean(
      surfaceMetrics && surfaceMetrics.scrollWidth <= surfaceMetrics.clientWidth,
    )
    const noComponentOverflow = Boolean(
      componentMetrics && componentMetrics.scrollWidth <= componentMetrics.clientWidth,
    )
    const centeredInPreview = centerDelta !== null && Math.abs(centerDelta) <= 1
    const widthCap = surfaceRect ? surfaceRect.width <= 760.5 : false
    const maxWidthIs760 = style(surface)?.maxWidth === '760px'

    return {
      name: view.name,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      hudEnabled: Boolean(preview?.classList.contains('lx-theme-hud')),
      mobileSelectedTabPressed: selectedTab?.getAttribute('aria-pressed') ?? null,
      document: documentWidth,
      viewportShell: measure(get('.VPDoc .container')),
      contentContainer: measure(get('.VPDoc .content-container')),
      article: measure(get('.VPDoc .vp-doc')),
      demo: measure(demo),
      preview: previewRect,
      surface: surfaceRect,
      surfaceStyle: style(surface),
      surfaceMetrics,
      centeredInPreview,
      centerDelta,
      widthCap,
      maxWidthIs760,
      component: componentRect,
      componentMetrics,
      panelWidthWithinSurface,
      panelWithinViewport,
      treeClientWidth: tree?.clientWidth ?? null,
      treeScrollWidth: tree?.scrollWidth ?? null,
      selectedListClientWidth: selectedList?.clientWidth ?? null,
      selectedListScrollWidth: selectedList?.scrollWidth ?? null,
      checks: {
        desktopWidthCapAndCenter: !mobile ? maxWidthIs760 && widthCap && centeredInPreview : null,
        mobileDocumentNoOverflow: mobile ? noDocumentOverflow : null,
        mobileSurfaceNoOverflow: mobile ? noSurfaceOverflow : null,
        mobileComponentNoOverflow: mobile ? noComponentOverflow : null,
        mobilePanelInsideSurfaceAndViewport: mobile
          ? panelWidthWithinSurface && panelWithinViewport
          : null,
      },
    }
  }, spec)
}

function runLiveServerStart() {
  const args = [liveServerScript, '--background']
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 2 * 1024 * 1024,
  })
  const lines = (result.stdout ?? '').trim().split(/\r?\n/).filter(Boolean)
  let parsed = null
  try {
    parsed = lines.length ? JSON.parse(lines.at(-1)) : null
  } catch {
    parsed = null
  }
  writeJson(path.join(outputDir, 'browser', 'live-server-start.json'), {
    command: [process.execPath, ...args].map(JSON.stringify).join(' '),
    status: result.status,
    signal: result.signal,
    spawnError: result.error?.message ?? null,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    parsed: parsed ? { pid: parsed.pid, port: parsed.port, hasToken: Boolean(parsed.token) } : null,
  })
  return { result, parsed }
}

async function main() {
  const sourceHashesStart = sourceHashes()
  writeJson(path.join(outputDir, 'source-hashes-start.json'), sourceHashesStart)
  const detectorResults = runDetectors()
  const targetHealthBefore = await ping(targetUrl, 8000)
  writeJson(path.join(outputDir, 'browser', 'target-health-before.json'), targetHealthBefore)

  let browser = null
  let context = null
  let page = null
  let liveServerStarted = false
  let liveServerInfo = null
  let overlayInjection = null
  const captures = []
  const browserErrors = []
  const pageErrors = []
  const failedRequests = []
  const httpErrors = []
  let targetResponseStatus = null
  let pageCountInFreshContext = null
  let preflight = null

  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: chromePath,
      args: ['--no-first-run'],
    })
    context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
      colorScheme: 'light',
    })
    page = await context.newPage()
    page.on('console', (message) => {
      const record = { type: message.type(), text: message.text(), location: message.location() }
      browserErrors.push(record)
    })
    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('requestfailed', (request) =>
      failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? null }),
    )
    page.on('response', (response) => {
      if (response.status() >= 400) httpErrors.push({ url: response.url(), status: response.status() })
    })

    const response = await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    targetResponseStatus = response?.status() ?? null
    await page.locator('.transfer-panel-demo__surface').waitFor({ state: 'visible', timeout: 45_000 })
    await page.locator('.lx-transfer-panel').waitFor({ state: 'visible', timeout: 45_000 })
    pageCountInFreshContext = context.pages().length
    const originalTitle = await page.title()
    preflight = await page.evaluate(() => {
      const oldTitle = document.title
      document.title = '[Human] LxTransferPanel width Assessment B'
      const script = document.createElement('script')
      script.dataset.widthAssessmentPreflight = 'true'
      script.textContent = 'window.__widthAssessmentPreflight = "executed";'
      document.head.append(script)
      return {
        originalTitle: oldTitle,
        mutatedTitle: document.title,
        scriptAppended: script.isConnected,
        scriptExecuted: window.__widthAssessmentPreflight === 'executed',
      }
    })
    preflight.passed =
      preflight.scriptAppended &&
      preflight.scriptExecuted &&
      preflight.mutatedTitle.includes('[Human]')
    writeJson(path.join(outputDir, 'browser', 'preflight.json'), {
      pageWasNew: true,
      pageCountInFreshContext,
      targetUrl,
      responseStatus: targetResponseStatus,
      originalTitle,
      ...preflight,
    })
    await page.evaluate((title) => { document.title = title }, originalTitle)

    const settings = page.locator('.transfer-panel-demo__settings')
    if (!(await settings.evaluate((element) => element.open))) {
      await settings.locator('summary').click()
    }

    for (const spec of viewSpecs) {
      await applyView(page, spec)
      const measurement = await measureView(page, spec)
      const screenshotPath = path.join(outputDir, 'browser', 'screenshots', `${spec.name}.png`)
      await page.screenshot({ path: screenshotPath, animations: 'disabled' })
      const capture = {
        ...measurement,
        screenshot: path.relative(root, screenshotPath),
        clean: true,
      }
      captures.push(capture)
      writeJson(path.join(outputDir, 'browser', 'views', `${spec.name}.json`), capture)
    }

    const existingHealth = await ping('http://127.0.0.1:8400/health')
    let ownsLiveServer = false
    if (existingHealth.ok) {
      liveServerInfo = { pid: null, port: 8400, ownedByThisRun: false }
    } else {
      const started = runLiveServerStart()
      if (started.result.status !== 0 || !started.parsed?.port) {
        throw new Error(`Impeccable live server failed to start (exit ${started.result.status}).`)
      }
      liveServerStarted = true
      ownsLiveServer = true
      liveServerInfo = {
        pid: started.parsed.pid,
        port: started.parsed.port,
        ownedByThisRun: true,
      }
    }

    const detectorScriptUrl = `http://127.0.0.1:${liveServerInfo.port}/detect.js`
    const detectorHealth = await ping(detectorScriptUrl, 5000)
    if (!detectorHealth.ok) throw new Error(`Detector script endpoint unavailable: ${JSON.stringify(detectorHealth)}`)
    const detectorTag = await page.addScriptTag({ url: detectorScriptUrl })
    await page.waitForTimeout(2200)
    overlayInjection = {
      scriptConnected: await detectorTag.evaluate((element) => element.isConnected),
      scriptUrl: detectorScriptUrl,
      scanFunction: await page.evaluate(() => typeof window.impeccableScan === 'function'),
      detectFunction: await page.evaluate(() => typeof window.impeccableDetect === 'function'),
      liveServer: liveServerInfo,
    }
    overlayInjection.success = Boolean(
      overlayInjection.scriptConnected && overlayInjection.scanFunction && overlayInjection.detectFunction,
    )
    writeJson(path.join(outputDir, 'browser', 'overlay-injection.json'), overlayInjection)

    if (overlayInjection.success) {
      for (const spec of viewSpecs) {
        await applyView(page, spec)
        const scan = await page.evaluate(() => {
          const matches = window.impeccableScan()
          const rules = {}
          const entries = matches.map(({ el, findings }) => {
            const path = []
            let current = el
            for (let depth = 0; current && depth < 4; depth += 1) {
              const classes = typeof current.className === 'string'
                ? current.className.trim().split(/\s+/).filter(Boolean).slice(0, 3)
                : []
              path.push(`${current.tagName.toLowerCase()}${current.id ? `#${current.id}` : ''}${classes.map((name) => `.${name}`).join('')}`)
              current = current.parentElement
            }
            const normalized = findings.map((finding) => ({
              type: finding.type || finding.id,
              detail: finding.detail || finding.snippet || '',
            }))
            for (const finding of normalized) rules[finding.type] = (rules[finding.type] ?? 0) + 1
            return { path, findings: normalized }
          })
          return {
            elementCount: matches.length,
            findingCount: entries.reduce((count, entry) => count + entry.findings.length, 0),
            rules,
            entries,
          }
        })
        await page.waitForTimeout(1400)
        const overlayScreenshot = path.join(outputDir, 'browser', 'overlay-screenshots', `${spec.name}.png`)
        await page.screenshot({ path: overlayScreenshot, animations: 'disabled' })
        writeJson(path.join(outputDir, 'browser', 'views', `${spec.name}.overlay.json`), {
          name: spec.name,
          viewport: { width: spec.width, height: spec.height },
          scan,
          overlayElementCount: await page.locator('.impeccable-overlay').count(),
          screenshot: path.relative(root, overlayScreenshot),
        })
      }
    }

    writeJson(path.join(outputDir, 'browser', 'console.json'), browserErrors)
    writeJson(path.join(outputDir, 'browser', 'browser-errors.json'), {
      pageErrors,
      failedRequests,
      httpResponsesAtOrAbove400: httpErrors,
    })
    writeJson(path.join(outputDir, 'browser', 'views-index.json'), captures)
  } catch (error) {
    writeJson(path.join(outputDir, 'browser', 'capture-error.json'), {
      message: error.message,
      stack: error.stack,
      liveServerStarted,
      liveServer: liveServerInfo,
    })
    process.exitCode = 1
  } finally {
    if (browser) await browser.close().catch(() => {})
    if (liveServerStarted && liveServerInfo) {
      const args = [liveServerScript, 'stop', '--keep-inject']
      const stopped = spawnSync(process.execPath, args, {
        cwd: root,
        encoding: 'utf8',
        windowsHide: true,
        maxBuffer: 2 * 1024 * 1024,
      })
      const healthAfter = await ping(`http://127.0.0.1:${liveServerInfo.port}/health`)
      writeJson(path.join(outputDir, 'browser', 'live-server-stop.json'), {
        command: [process.execPath, ...args].map(JSON.stringify).join(' '),
        status: stopped.status,
        signal: stopped.signal,
        spawnError: stopped.error?.message ?? null,
        stdout: stopped.stdout ?? '',
        stderr: stopped.stderr ?? '',
        healthAfter,
      })
    }
    const sourceHashesEnd = sourceHashes()
    writeJson(path.join(outputDir, 'source-hashes-end.json'), sourceHashesEnd)
    const targetHealthAfter = await ping(targetUrl, 8000)
    writeJson(path.join(outputDir, 'browser', 'target-health-after.json'), targetHealthAfter)
    const mobileCaptures = captures.filter((capture) => capture.viewport.width < 768)
    const desktopCaptures = captures.filter((capture) => capture.viewport.width >= 768)
    const dimensionsPassed =
      desktopCaptures.length === 2 &&
      desktopCaptures.every((capture) => capture.checks.desktopWidthCapAndCenter) &&
      mobileCaptures.length === 2 &&
      mobileCaptures.every((capture) =>
        capture.checks.mobileDocumentNoOverflow &&
        capture.checks.mobileSurfaceNoOverflow &&
        capture.checks.mobileComponentNoOverflow &&
        capture.checks.mobilePanelInsideSurfaceAndViewport,
      )
    writeJson(path.join(outputDir, 'run-summary.json'), {
      targetUrl,
      targetResponseStatus,
      targetHealthBefore,
      targetHealthAfter,
      pageWasNew: true,
      pageCountInFreshContext,
      preflightPassed: preflight?.passed ?? false,
      detectorResults,
      overlayInjection,
      viewCount: captures.length,
      views: captures.map(({ name, viewport, surface, component, checks }) => ({
        name,
        viewport,
        surface,
        component,
        checks,
      })),
      pageErrors,
      failedRequests,
      httpResponsesAtOrAbove400: httpErrors,
      sourceHashesStart,
      sourceHashesEnd,
      sourceHashesUnchanged: JSON.stringify(sourceHashesStart) === JSON.stringify(sourceHashesEnd),
      dimensionsPassed,
    })
  }
}

await main()
