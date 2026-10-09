import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const root = String.raw`F:\work\linkx-admin`
const out = path.join(root, '.impeccable/critique/wave7-transferpanel-2026-10-09/assessment-b-width-final-v2')
const detectorPath = String.raw`C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs`
const liveServerPath = String.raw`C:\Users\Administrator\.codex\skills\impeccable\scripts\live-server.mjs`
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const chromePath = String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`
const requireFromProject = createRequire(path.join(root, 'other-admin/admin-vue3/package.json'))
const { chromium } = requireFromProject('@playwright/test')
const sourceFiles = [
  'linkx-fe/src/components/LxTransferPanel/index.vue',
  'linkx-fe/src/components/LxTransferPanel/demo/basic.vue',
  'linkx-fe/docs/.vitepress/theme/custom.css',
  'linkx-fe/docs/components/lxtransferpanel.md',
]
const detectorTargets = [
  ['component', 'linkx-fe/src/components/LxTransferPanel/index.vue'],
  ['demo', 'linkx-fe/src/components/LxTransferPanel/demo/basic.vue'],
]
const views = [
  { name: 'desktop-default-1440', width: 1440, height: 1000, hud: false },
  { name: 'desktop-hud-1440', width: 1440, height: 1000, hud: true },
  { name: 'mobile-selected-320', width: 320, height: 844, hud: false, selected: true },
  { name: 'mobile-selected-390', width: 390, height: 844, hud: false, selected: true },
]

for (const directory of ['detector', 'browser', 'browser/screenshots', 'browser/overlay-screenshots', 'browser/views']) {
  fs.mkdirSync(path.join(out, directory), { recursive: true })
}

const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
const hashes = () => Object.fromEntries(sourceFiles.map((file) => [
  file,
  createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex'),
]))
const ping = async (url, timeout = 2000) => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeout) })
    return { status: response.status, ok: response.ok }
  } catch (error) {
    return { error: error.message }
  }
}

function runDetector() {
  const results = []
  for (const [name, target] of detectorTargets) {
    const args = [detectorPath, '--json', path.join(root, target)]
    const result = spawnSync(process.execPath, args, {
      cwd: root,
      encoding: 'utf8',
      windowsHide: true,
      maxBuffer: 4 * 1024 * 1024,
    })
    const base = path.join(out, 'detector', name)
    fs.writeFileSync(`${base}.command.txt`, [process.execPath, ...args].map((arg) => JSON.stringify(arg)).join(' ') + '\n', 'utf8')
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
    const record = {
      target,
      status: result.status,
      signal: result.signal,
      spawnError: result.error?.message ?? null,
      stdoutJsonValid: parseError === null,
      findingCount: Array.isArray(parsed) ? parsed.length : null,
      stderr: result.stderr ?? '',
    }
    writeJson(`${base}.process.json`, record)
    results.push({ name, ...record, parseError })
  }
  writeJson(path.join(out, 'detector', 'summary.json'), results)
  return results
}

async function configureView(page, view) {
  await page.setViewportSize({ width: view.width, height: view.height })
  const settings = page.locator('.transfer-panel-demo__settings')
  if (!(await settings.evaluate((element) => element.open))) await settings.locator('summary').click()
  const hud = page.getByRole('checkbox', { name: 'HUD 深色主题' })
  if (view.hud && !(await hud.isChecked())) await hud.check()
  if (!view.hud && (await hud.isChecked())) await hud.uncheck()
  await page.locator('select[aria-label="面板高度"]').selectOption('240')
  if (view.selected) {
    const selected = page.getByTestId('mobile-selected-panel')
    await selected.waitFor({ state: 'visible' })
    if ((await selected.getAttribute('aria-pressed')) !== 'true') await selected.click()
  }
  await page.locator('.transfer-panel-demo__surface').scrollIntoViewIfNeeded()
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
}

async function captureView(page, view) {
  await configureView(page, view)
  const metrics = await page.evaluate((spec) => {
    const element = (selector) => document.querySelector(selector)
    const measure = (target) => {
      if (!(target instanceof HTMLElement)) return null
      const rect = target.getBoundingClientRect()
      const round = (number) => Math.round(number * 10) / 10
      return {
        left: round(rect.left),
        right: round(rect.right),
        top: round(rect.top),
        bottom: round(rect.bottom),
        width: round(rect.width),
        height: round(rect.height),
        centerX: round(rect.left + rect.width / 2),
      }
    }
    const preview = element('.transfer-panel-demo__preview')
    const surface = element('.transfer-panel-demo__surface')
    const panel = element('.lx-transfer-panel')
    const style = surface instanceof HTMLElement ? getComputedStyle(surface) : null
    const previewRect = measure(preview)
    const surfaceRect = measure(surface)
    const panelRect = measure(panel)
    const centerDelta = previewRect && surfaceRect ? Math.round((surfaceRect.centerX - previewRect.centerX) * 10) / 10 : null
    const surfaceMetrics = surface instanceof HTMLElement ? { clientWidth: surface.clientWidth, scrollWidth: surface.scrollWidth } : null
    const panelMetrics = panel instanceof HTMLElement ? { clientWidth: panel.clientWidth, scrollWidth: panel.scrollWidth } : null
    const mobile = spec.width < 768
    const widthCap = surfaceRect ? surfaceRect.width <= 820.5 : false
    const maxWidth820 = style?.maxWidth === '820px'
    const centered = centerDelta !== null && Math.abs(centerDelta) <= 1
    const documentWidth = {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }
    const mobileNoOverflow = mobile &&
      documentWidth.scrollWidth <= documentWidth.clientWidth &&
      surfaceMetrics?.scrollWidth <= surfaceMetrics?.clientWidth &&
      panelMetrics?.scrollWidth <= panelMetrics?.clientWidth &&
      Boolean(surfaceRect && panelRect && panelRect.left >= surfaceRect.left - 1 && panelRect.right <= surfaceRect.right + 1 && panelRect.left >= -1 && panelRect.right <= window.innerWidth + 1)

    return {
      name: spec.name,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      hudEnabled: Boolean(preview?.classList.contains('lx-theme-hud')),
      preview: previewRect,
      surface: surfaceRect,
      surfaceStyle: style ? {
        width: style.width,
        maxWidth: style.maxWidth,
        marginInlineStart: style.marginInlineStart,
        marginInlineEnd: style.marginInlineEnd,
        boxSizing: style.boxSizing,
      } : null,
      surfaceMetrics,
      centerDelta,
      panel: panelRect,
      panelMetrics,
      document: documentWidth,
      checks: {
        desktopCapAndCentered: !mobile ? maxWidth820 && widthCap && centered : null,
        mobileNoOverflow: mobile ? mobileNoOverflow : null,
      },
    }
  }, view)
  const screenshot = path.join(out, 'browser', 'screenshots', `${view.name}.png`)
  await page.screenshot({ path: screenshot, animations: 'disabled' })
  const capture = { ...metrics, screenshot: path.relative(root, screenshot) }
  writeJson(path.join(out, 'browser', 'views', `${view.name}.json`), capture)
  return capture
}

function startLiveServer() {
  const args = [liveServerPath, '--background']
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 2 * 1024 * 1024 })
  let parsed = null
  try {
    parsed = JSON.parse((result.stdout ?? '').trim().split(/\r?\n/).filter(Boolean).at(-1) ?? '')
  } catch {
    parsed = null
  }
  writeJson(path.join(out, 'browser', 'live-server-start.json'), {
    command: [process.execPath, ...args].map((arg) => JSON.stringify(arg)).join(' '),
    status: result.status,
    signal: result.signal,
    stderr: result.stderr ?? '',
    stdout: result.stdout ?? '',
    server: parsed ? { pid: parsed.pid, port: parsed.port, hasToken: Boolean(parsed.token) } : null,
  })
  return { result, parsed }
}

async function main() {
  const sourceHashesStart = hashes()
  writeJson(path.join(out, 'source-hashes-start.json'), sourceHashesStart)
  const detectorResults = runDetector()
  const targetHealthBefore = await ping(targetUrl, 8000)
  writeJson(path.join(out, 'browser', 'target-health-before.json'), targetHealthBefore)

  let browser = null
  let context = null
  let page = null
  let freshContextPageCount = null
  let targetResponseStatus = null
  let preflightPassed = false
  let overlayInjection = { success: false, reason: 'not attempted' }
  let liveServer = null
  let ownsServer = false
  const viewResults = []
  const overlayResults = []
  const consoleMessages = []
  const pageErrors = []
  const failedRequests = []
  const httpErrors = []

  try {
    browser = await chromium.launch({ headless: true, executablePath: chromePath, args: ['--no-first-run'] })
    context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, colorScheme: 'light' })
    page = await context.newPage()
    freshContextPageCount = context.pages().length
    page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text(), location: message.location() }))
    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? null }))
    page.on('response', (response) => { if (response.status() >= 400) httpErrors.push({ url: response.url(), status: response.status() }) })

    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    targetResponseStatus = response?.status() ?? null
    await page.locator('.transfer-panel-demo__surface').waitFor({ state: 'visible', timeout: 45_000 })
    await page.locator('.lx-transfer-panel').waitFor({ state: 'visible', timeout: 45_000 })
    const originalTitle = await page.title()
    const preflight = await page.evaluate(() => {
      const original = document.title
      document.title = '[Human] LxTransferPanel width v2 Assessment B'
      const script = document.createElement('script')
      script.textContent = 'window.__widthV2Preflight = "executed";'
      document.head.append(script)
      return { original, mutated: document.title, scriptAppended: script.isConnected, scriptExecuted: window.__widthV2Preflight === 'executed' }
    })
    preflightPassed = preflight.scriptAppended && preflight.scriptExecuted && preflight.mutated.includes('[Human]')
    writeJson(path.join(out, 'browser', 'preflight.json'), {
      pageWasNew: true,
      pageCountInFreshContext: context.pages().length,
      targetUrl,
      targetResponseStatus,
      ...preflight,
      passed: preflightPassed,
    })
    await page.evaluate((title) => { document.title = title }, originalTitle)

    for (const view of views) viewResults.push(await captureView(page, view))

    const existingServerHealth = await ping('http://127.0.0.1:8400/health')
    if (existingServerHealth.ok) {
      liveServer = { pid: null, port: 8400, ownedByThisRun: false }
    } else {
      const start = startLiveServer()
      if (start.result.status === 0 && start.parsed?.port) {
        liveServer = { pid: start.parsed.pid, port: start.parsed.port, ownedByThisRun: true }
        ownsServer = true
      }
    }
    if (!liveServer) {
      overlayInjection = { success: false, reason: 'Impeccable live server did not start' }
    } else {
      const endpoint = `http://127.0.0.1:${liveServer.port}/detect.js`
      const endpointHealth = await ping(endpoint, 5000)
      try {
        if (!endpointHealth.ok) throw new Error(`Detector endpoint returned ${JSON.stringify(endpointHealth)}`)
        const tag = await page.addScriptTag({ url: endpoint })
        await page.waitForTimeout(2200)
        overlayInjection = {
          scriptConnected: await tag.evaluate((element) => element.isConnected),
          scanFunction: await page.evaluate(() => typeof window.impeccableScan === 'function'),
          detectFunction: await page.evaluate(() => typeof window.impeccableDetect === 'function'),
          endpoint,
          liveServer,
        }
        overlayInjection.success = overlayInjection.scriptConnected && overlayInjection.scanFunction && overlayInjection.detectFunction
        if (overlayInjection.success) {
          for (const view of views) {
            await configureView(page, view)
            const scan = await page.evaluate(() => {
              const matches = window.impeccableScan()
              const rules = {}
              const entries = matches.map(({ el, findings }) => {
                const chain = []
                let current = el
                for (let depth = 0; current && depth < 4; depth += 1) {
                  const classes = typeof current.className === 'string' ? current.className.trim().split(/\s+/).filter(Boolean).slice(0, 3) : []
                  chain.push(`${current.tagName.toLowerCase()}${current.id ? `#${current.id}` : ''}${classes.map((name) => `.${name}`).join('')}`)
                  current = current.parentElement
                }
                const items = findings.map((finding) => ({ type: finding.type || finding.id, detail: finding.detail || finding.snippet || '' }))
                for (const item of items) rules[item.type] = (rules[item.type] ?? 0) + 1
                return { path: chain, findings: items }
              })
              return { elementCount: matches.length, findingCount: entries.reduce((count, entry) => count + entry.findings.length, 0), rules, entries }
            })
            await page.waitForTimeout(1200)
            const screenshot = path.join(out, 'browser', 'overlay-screenshots', `${view.name}.png`)
            await page.screenshot({ path: screenshot, animations: 'disabled' })
            const result = { name: view.name, viewport: { width: view.width, height: view.height }, scan, screenshot: path.relative(root, screenshot) }
            overlayResults.push(result)
            writeJson(path.join(out, 'browser', 'views', `${view.name}.overlay.json`), result)
          }
        }
      } catch (error) {
        overlayInjection = { success: false, reason: error.message, endpoint, liveServer }
      }
    }
  } catch (error) {
    writeJson(path.join(out, 'browser', 'capture-error.json'), { message: error.message, stack: error.stack })
    process.exitCode = 1
  } finally {
    if (browser) await browser.close().catch(() => {})
    if (ownsServer && liveServer) {
      const args = [liveServerPath, 'stop', '--keep-inject']
      const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 2 * 1024 * 1024 })
      writeJson(path.join(out, 'browser', 'live-server-stop.json'), {
        command: [process.execPath, ...args].map((arg) => JSON.stringify(arg)).join(' '),
        status: result.status,
        signal: result.signal,
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
        healthAfter: await ping(`http://127.0.0.1:${liveServer.port}/health`),
      })
    }
    const sourceHashesEnd = hashes()
    const targetHealthAfter = await ping(targetUrl, 8000)
    writeJson(path.join(out, 'source-hashes-end.json'), sourceHashesEnd)
    writeJson(path.join(out, 'browser', 'console.json'), consoleMessages)
    writeJson(path.join(out, 'browser', 'browser-errors.json'), { pageErrors, failedRequests, httpResponsesAtOrAbove400: httpErrors })
    writeJson(path.join(out, 'browser', 'overlay-injection.json'), overlayInjection)
    writeJson(path.join(out, 'browser', 'target-health-after.json'), targetHealthAfter)
    const desktop = viewResults.filter((view) => view.viewport.width >= 768)
    const mobile = viewResults.filter((view) => view.viewport.width < 768)
    const dimensionsPassed = desktop.length === 2 && desktop.every((view) => view.checks.desktopCapAndCentered) &&
      mobile.length === 2 && mobile.every((view) => view.checks.mobileNoOverflow)
    const detectorsPassed = detectorResults.length === detectorTargets.length && detectorResults.every((result) =>
      result.status === 0 && result.stdoutJsonValid && result.stderr.trim() === '',
    )
    const sourceHashesUnchanged = JSON.stringify(sourceHashesStart) === JSON.stringify(sourceHashesEnd)
    writeJson(path.join(out, 'run-summary.json'), {
      targetUrl,
      targetResponseStatus,
      targetHealthBefore,
      targetHealthAfter,
      freshContextPageCount,
      preflightPassed,
      detectorResults,
      overlayInjection,
      viewCount: viewResults.length,
      views: viewResults,
      overlayViews: overlayResults.map(({ name, viewport, scan }) => ({ name, viewport, findingCount: scan.findingCount, rules: scan.rules })),
      browserErrors: { pageErrors, failedRequests, httpResponsesAtOrAbove400: httpErrors },
      sourceHashesStart,
      sourceHashesEnd,
      sourceHashesUnchanged,
      dimensionsPassed,
      detectorsPassed,
      assessmentPassed: dimensionsPassed && detectorsPassed && sourceHashesUnchanged && preflightPassed && targetResponseStatus === 200 && targetHealthAfter.ok,
    })
  }
}

await main()
