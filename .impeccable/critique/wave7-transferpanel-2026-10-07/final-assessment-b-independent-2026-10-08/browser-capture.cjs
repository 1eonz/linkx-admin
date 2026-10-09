const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require(process.argv[2])

const evidenceDir = __dirname
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const chromeExecutable = process.argv[3]
const detectBaseUrl = process.argv[4] || ''
const mode = process.argv[5] || 'capture'
const screenshotsDir = path.join(evidenceDir, 'screenshots')
fs.mkdirSync(screenshotsDir, { recursive: true })

function writeJson(file, value) {
  fs.writeFileSync(path.join(evidenceDir, file), `${JSON.stringify(value, null, 2)}\n`)
}

async function attachPageLogs(context, page) {
  const logs = { console: [], pageErrors: [], failedRequests: [], badResponses: [], cdpLog: [], cdpNetworkErrors: [] }
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Log.enable')
  cdp.on('Network.responseReceived', ({ response, type }) => {
    if (response.status >= 400) {
      logs.cdpNetworkErrors.push({
        at: new Date().toISOString(),
        source: 'CDP Network.responseReceived',
        status: response.status,
        type,
        url: response.url,
      })
    }
  })
  cdp.on('Network.loadingFailed', (event) => {
    logs.cdpNetworkErrors.push({
      at: new Date().toISOString(),
      source: 'CDP Network.loadingFailed',
      error: event.errorText,
      canceled: event.canceled,
      blockedReason: event.blockedReason,
      type: event.type,
    })
  })
  cdp.on('Log.entryAdded', ({ entry }) => {
    if (entry.level === 'error' || entry.level === 'warning') {
      logs.cdpLog.push({
        at: new Date().toISOString(),
        level: entry.level,
        source: entry.source,
        text: entry.text,
        url: entry.url,
        lineNumber: entry.lineNumber,
      })
    }
  })
  page.on('console', (message) => {
    logs.console.push({
      at: new Date().toISOString(),
      type: message.type(),
      text: message.text(),
    })
  })
  page.on('pageerror', (error) => {
    logs.pageErrors.push({ at: new Date().toISOString(), message: error.message })
  })
  page.on('requestfailed', (request) => {
    logs.failedRequests.push({
      at: new Date().toISOString(),
      url: request.url(),
      error: request.failure()?.errorText || 'unknown',
    })
  })
  page.on('response', (response) => {
    if (response.status() >= 400) {
      logs.badResponses.push({
        at: new Date().toISOString(),
        status: response.status(),
        url: response.url(),
      })
    }
  })
  return logs
}

async function openTarget(page) {
  const response = await page.goto(targetUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  })
  await page.waitForSelector('.lx-transfer-panel', { timeout: 20000 })
  await page.waitForTimeout(500)
  await page.evaluate(() => document.fonts?.ready)
  return {
    status: response?.status() ?? null,
    finalUrl: page.url(),
    title: await page.title(),
    panelCount: await page.locator('.lx-transfer-panel').count(),
  }
}

async function mutableInjectionPreflight(page) {
  return page.evaluate(() => {
    const before = document.title
    const marker = `assessment-b-${Date.now()}`
    document.title = `${before} [${marker}]`
    const script = document.createElement('script')
    script.dataset.assessmentBPreflight = marker
    script.textContent = `window.__assessmentBPreflight = ${JSON.stringify(marker)}`
    ;(document.head || document.documentElement).appendChild(script)
    const titleChanged = document.title !== before
    const scriptAppended = script.isConnected
    const scriptExecuted = window.__assessmentBPreflight === marker
    script.remove()
    document.title = before
    delete window.__assessmentBPreflight
    return {
      titleChanged,
      scriptAppended,
      scriptExecuted,
      titleRestored: document.title === before,
      scriptRemoved: !script.isConnected,
    }
  })
}

async function setDocumentDark(page, enabled) {
  const current = await page.evaluate(() => document.documentElement.classList.contains('dark'))
  if (current === enabled) return { requested: enabled, method: 'already-set', actual: current }

  const candidate = await page.evaluate(() => {
    const elements = [...document.querySelectorAll('button, [role="button"]')]
    const names = elements.map((element) => ({
      element,
      label: [
        element.getAttribute('aria-label'),
        element.getAttribute('title'),
        element.textContent,
        element.className,
      ].filter(Boolean).join(' '),
    }))
    const selected = names.find(({ label }) => /dark|light|appearance|theme|主题|外观/i.test(label))
    if (selected) selected.element.setAttribute('data-assessment-b-theme-toggle', 'true')
    return {
      selected: Boolean(selected),
      label: selected?.label || null,
      candidates: names
        .filter(({ label }) => /dark|light|appearance|theme|主题|外观/i.test(label))
        .map(({ label }) => label.trim().slice(0, 120)),
    }
  })

  let method = 'document-theme-control'
  if (candidate.selected) {
    try {
      await page.locator('[data-assessment-b-theme-toggle="true"]').click({ timeout: 4000 })
    } catch (error) {
      method = `root-class-fallback: ${error.message}`
      await page.evaluate((value) => document.documentElement.classList.toggle('dark', value), enabled)
    }
  } else {
    method = 'root-class-fallback: no theme control found'
    await page.evaluate((value) => document.documentElement.classList.toggle('dark', value), enabled)
  }
  await page.waitForTimeout(250)
  return {
    requested: enabled,
    method,
    candidate,
    actual: await page.evaluate(() => document.documentElement.classList.contains('dark')),
  }
}

async function setHudDark(page) {
  const settings = page.locator('.transfer-panel-demo__settings')
  const isOpen = await settings.evaluate((element) => element.open)
  if (!isOpen) await settings.locator('summary').click()

  const toggle = await page.evaluate(() => {
    const label = [...document.querySelectorAll('.transfer-panel-demo__settings label')]
      .find((element) => element.textContent.includes('HUD 深色主题'))
    const input = label?.querySelector('input[type="checkbox"]')
    input?.setAttribute('data-assessment-b-hud-toggle', 'true')
    return { found: Boolean(input), checked: Boolean(input?.checked) }
  })
  if (!toggle.found) throw new Error('HUD theme checkbox not found')
  if (!toggle.checked) await page.locator('input[data-assessment-b-hud-toggle="true"]').click()
  await page.waitForTimeout(250)
  return {
    ...toggle,
    rootDark: await page.evaluate(() => document.documentElement.classList.contains('dark')),
    rootHud: await page.evaluate(() => document.documentElement.classList.contains('lx-theme-hud')),
    demoHud: await page.locator('.transfer-panel-demo').evaluate((element) => element.classList.contains('lx-theme-hud')),
  }
}

async function readVisualState(page) {
  return page.evaluate(() => {
    const viewport = { width: innerWidth, height: innerHeight }
    const panel = document.querySelector('.lx-transfer-panel')
    const panelRect = panel?.getBoundingClientRect()
    const selectorFor = (element) => {
      if (!element) return null
      const classes = typeof element.className === 'string'
        ? element.className.split(/\s+/).filter(Boolean).slice(0, 4)
        : []
      return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${classes.map((name) => `.${name}`).join('')}`
    }
    const overlayElements = [...document.querySelectorAll('.impeccable-overlay:not(.impeccable-banner)')]
    const overlays = overlayElements.map((overlay) => {
      const target = overlay._targetEl
      const rect = overlay.getBoundingClientRect()
      return {
        label: overlay.querySelector('.impeccable-label')?.textContent?.trim() || '',
        visible: getComputedStyle(overlay).display !== 'none' && rect.width > 0 && rect.height > 0,
        className: overlay.className,
        target: target ? {
          selector: selectorFor(target),
          text: target.textContent?.trim().replace(/\s+/g, ' ').slice(0, 180) || '',
          componentAncestor: Boolean(target.closest('.lx-transfer-panel')),
          demoAncestor: Boolean(target.closest('.transfer-panel-demo')),
          docsAncestor: Boolean(target.closest('.VPDoc, .VPContent, .vp-doc, main')),
        } : null,
        rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
      }
    })
    const banner = document.querySelector('.impeccable-banner')
    const bannerRect = banner?.getBoundingClientRect()
    const scripts = [...document.scripts]
      .filter((script) => script.src.includes('/detect.js'))
      .map((script) => script.src)
    return {
      title: document.title,
      rootClasses: [...document.documentElement.classList],
      demoHud: Boolean(document.querySelector('.transfer-panel-demo')?.classList.contains('lx-theme-hud')),
      viewport,
      documentWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      panel: panel && panelRect ? {
        selector: selectorFor(panel),
        x: Math.round(panelRect.x),
        y: Math.round(panelRect.y),
        width: Math.round(panelRect.width),
        height: Math.round(panelRect.height),
      } : null,
      detectorScripts: scripts,
      overlayCount: overlayElements.length,
      visibleOverlayCount: overlays.filter((overlay) => overlay.visible).length,
      overlayLabels: [...document.querySelectorAll('.impeccable-label')].map((label) => label.textContent.trim()),
      overlays,
      banner: banner ? {
        text: banner.textContent.trim().replace(/\s+/g, ' ').slice(0, 500),
        visible: getComputedStyle(banner).display !== 'none' && (bannerRect?.height || 0) > 0,
      } : null,
    }
  })
}

async function runPreflight(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'light',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  const logs = await attachPageLogs(context, page)
  const pageLoad = await openTarget(page)
  const mutation = await mutableInjectionPreflight(page)
  const result = {
    createdAt: new Date().toISOString(),
    isolation: { newBrowserProcess: true, newBrowserContext: true, newPage: true, reusedUserTab: false },
    browser: { name: 'Chromium', version: browser.version(), executablePath: chromeExecutable },
    pageLoad,
    mutation,
    console: logs.console,
    pageErrors: logs.pageErrors,
    failedRequests: logs.failedRequests,
    badResponses: logs.badResponses,
    cdpLog: logs.cdpLog,
    cdpNetworkErrors: logs.cdpNetworkErrors,
  }
  await context.close()
  writeJson('browser-mutation-preflight.json', result)
  return result
}

async function runView(browser, view) {
  const context = await browser.newContext({
    viewport: view.viewport,
    colorScheme: 'light',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  const logs = await attachPageLogs(context, page)
  const record = {
    name: view.name,
    requestedState: view,
    createdAt: new Date().toISOString(),
    isolation: { newBrowserContext: true, newPage: true, reusedUserTab: false },
  }

  try {
    record.pageLoad = await openTarget(page)
    record.mutationPreflight = await mutableInjectionPreflight(page)
    if (view.docDark) record.documentTheme = await setDocumentDark(page, true)
    if (view.hudDark) record.hudTheme = await setHudDark(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    const detectionStart = logs.console.length
    const detectUrl = `${detectBaseUrl.replace(/\/$/, '')}/detect.js`
    const scriptHandle = await page.addScriptTag({ url: detectUrl })
    record.scriptInjection = {
      succeeded: Boolean(scriptHandle),
      url: detectUrl,
      scriptSrc: await scriptHandle.evaluate((script) => script.src),
    }
    await page.waitForTimeout(2800)
    await page.locator('.lx-transfer-panel').scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    record.visualState = await readVisualState(page)
    record.impeccableConsole = logs.console
      .slice(detectionStart)
      .filter((message) => message.text.toLowerCase().includes('impeccable'))
    record.console = logs.console
    record.pageErrors = logs.pageErrors
    record.failedRequests = logs.failedRequests
    record.badResponses = logs.badResponses
    record.cdpLog = logs.cdpLog
    record.cdpNetworkErrors = logs.cdpNetworkErrors
    const screenshotFile = path.join(screenshotsDir, `${view.name}.png`)
    await page.screenshot({ path: screenshotFile, fullPage: false, animations: 'disabled' })
    record.screenshot = {
      path: path.relative(evidenceDir, screenshotFile).replaceAll('\\', '/'),
      width: view.viewport.width,
      height: view.viewport.height,
    }
  } catch (error) {
    record.error = error.stack || error.message
    record.console = logs.console
    record.pageErrors = logs.pageErrors
    record.failedRequests = logs.failedRequests
    record.badResponses = logs.badResponses
    record.cdpLog = logs.cdpLog
    record.cdpNetworkErrors = logs.cdpNetworkErrors
  } finally {
    record.endedAt = new Date().toISOString()
    await context.close()
  }
  return record
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: chromeExecutable,
    args: ['--no-first-run', '--disable-background-networking'],
  })
  try {
    if (mode === 'preflight-only') {
      const result = await runPreflight(browser)
      console.log(JSON.stringify(result, null, 2))
      if (result.pageLoad.status !== 200 || !result.mutation.titleChanged || !result.mutation.scriptAppended || !result.mutation.scriptExecuted) {
        process.exitCode = 2
      }
      return
    }

    if (!detectBaseUrl) throw new Error('detect server URL is required for capture mode')
    const views = [
      { name: 'light-desktop', viewport: { width: 1440, height: 1000 }, docDark: false, hudDark: false },
      { name: 'docs-dark-desktop', viewport: { width: 1440, height: 1000 }, docDark: true, hudDark: false },
      { name: 'hud-dark-desktop', viewport: { width: 1440, height: 1000 }, docDark: false, hudDark: true },
      { name: 'mobile-375', viewport: { width: 375, height: 900 }, docDark: false, hudDark: false },
    ]
    const results = []
    for (const view of views) results.push(await runView(browser, view))
    const report = {
      createdAt: new Date().toISOString(),
      targetUrl,
      browser: { name: 'Chromium', version: browser.version(), executablePath: chromeExecutable },
      detectorUrl: `${detectBaseUrl.replace(/\/$/, '')}/detect.js`,
      requiredStates: views.map((view) => view.name),
      views: results,
    }
    writeJson('browser-evidence.json', report)
    console.log(JSON.stringify(report, null, 2))
    if (results.some((result) => result.error || result.pageLoad?.status !== 200 || !result.scriptInjection?.succeeded)) {
      process.exitCode = 1
    }
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  writeJson('browser-run-error.json', {
    createdAt: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
  })
  console.error(error.stack || error.message)
  process.exitCode = 1
})
