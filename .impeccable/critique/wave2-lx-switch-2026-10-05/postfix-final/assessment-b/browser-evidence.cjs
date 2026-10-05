const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { createRequire } = require('node:module')

const repoRoot = process.cwd()
const evidenceDir = path.join(
  repoRoot,
  '.impeccable/critique/wave2-lx-switch-2026-10-05/postfix-final/assessment-b',
)
const projectRequire = createRequire(path.join(repoRoot, 'other-admin/admin-vue3/package.json'))
const { chromium } = projectRequire('@playwright/test')
const edgeExecutable = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const targetUrl = 'http://127.0.0.1:4195/components/lxswitch.html'
const liveServerScript = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs'

const result = {
  targetUrl,
  browser: { executable: edgeExecutable, headed: true },
  page: {},
  preflight: {},
  states: {},
  screenshots: [],
  requests: [],
  console: [],
  pageErrors: [],
  liveServer: { start: null, stop: null },
  overlay: { injected: false, console: [], domEvidence: null },
  failures: [],
}

function writeJson(name, value) {
  fs.writeFileSync(path.join(evidenceDir, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function runLiveServer(args, name) {
  const command = spawnSync(process.execPath, [liveServerScript, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  })
  const rawStdout = command.stdout || ''
  let safeStdout = rawStdout
  let tokenRedacted = false
  try {
    const parsed = JSON.parse(rawStdout.trim())
    if (typeof parsed.token === 'string') {
      parsed.token = '[redacted]'
      safeStdout = `${JSON.stringify(parsed)}\n`
      tokenRedacted = true
    }
  } catch {}
  const record = {
    args,
    stdout: safeStdout,
    stderr: command.stderr || '',
    exitCode: command.status ?? 1,
    error: command.error?.message || null,
    tokenRedacted,
  }
  fs.writeFileSync(path.join(evidenceDir, `${name}.stdout.txt`), record.stdout, 'utf8')
  fs.writeFileSync(path.join(evidenceDir, `${name}.stderr.txt`), record.stderr, 'utf8')
  fs.writeFileSync(path.join(evidenceDir, `${name}.exit-code.txt`), `${record.exitCode}\n`, 'utf8')
  return record
}

async function savePageScreenshot(page, name, options = {}) {
  const file = path.join(evidenceDir, name)
  await page.screenshot({ path: file, fullPage: true, animations: 'disabled', ...options })
  result.screenshots.push({ file: name, viewport: await page.evaluate(() => window.innerWidth) })
}

let browser
let serverStarted = false

async function main() {
try {
  if (!fs.existsSync(edgeExecutable)) throw new Error(`Edge executable missing: ${edgeExecutable}`)
  browser = await chromium.launch({ executablePath: edgeExecutable, headless: false })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()
  const consoleTasks = []
  page.on('console', (message) => {
    const location = message.location()
    const entry = {
      type: message.type(),
      text: message.text(),
      location,
      detector: location.url.includes('/detect.js'),
    }
    result.console.push(entry)
    if (entry.detector && message.type() === 'log') {
      const targetHandle = message.args().at(-1)
      if (targetHandle) {
        consoleTasks.push(targetHandle.evaluate((element) => {
          if (!(element instanceof Element)) return null
          const selectorParts = []
          for (let current = element; current && selectorParts.length < 7; current = current.parentElement) {
            let part = current.tagName.toLowerCase()
            if (current.id) {
              part += `#${current.id}`
              selectorParts.unshift(part)
              break
            }
            const classes = [...current.classList].slice(0, 2)
            if (classes.length) part += `.${classes.join('.')}`
            const siblings = [...(current.parentElement?.children || [])]
              .filter((sibling) => sibling.tagName === current.tagName)
            if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`
            selectorParts.unshift(part)
            if (current.matches('.VPDoc, .VPSidebar, .VPNav')) break
          }
          const rect = element.getBoundingClientRect()
          const style = getComputedStyle(element)
          return {
            selector: selectorParts.join(' > '),
            tag: element.tagName,
            id: element.id || null,
            className: element.className || null,
            text: (element.innerText || element.textContent || '').trim().slice(0, 240),
            outerHTML: element.outerHTML.slice(0, 500),
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            style: { opacity: style.opacity, backgroundImage: style.backgroundImage, transition: style.transition },
            inComponentDemo: Boolean(element.closest('.lx-switch-demo')),
            inDocsArticle: Boolean(element.closest('.VPDoc')),
            inDocsChrome: Boolean(element.closest('.VPNav, .VPSidebar, .VPDocAside, .VPFooter')),
          }
        }).then((target) => { entry.target = target }).catch((error) => {
          entry.targetError = error.message
        }))
      }
    }
  })
  page.on('pageerror', (error) => result.pageErrors.push(error.message))
  page.on('request', (request) => {
    result.requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
    })
  })

  const response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 })
  await page.locator('body').waitFor({ state: 'visible', timeout: 10000 })
  result.page = await page.evaluate((status) => ({
    responseStatus: status,
    url: location.href,
    title: document.title,
    viewportCssWidth: window.innerWidth,
    documentClientWidth: document.documentElement.clientWidth,
    bodyTextStart: document.body.innerText.slice(0, 1200),
    switchDemoCount: document.querySelectorAll('.lx-switch-demo').length,
    switchCount: document.querySelectorAll('[role="switch"]').length,
  }), response?.status() ?? null)
  if (result.page.responseStatus !== 200 || result.page.switchDemoCount === 0) {
    throw new Error(`Target page did not render the LxSwitch demo: ${JSON.stringify(result.page)}`)
  }

  await page.evaluate(() => {
    document.title = '[Human] LxSwitch Assessment B'
    const script = document.createElement('script')
    script.dataset.assessmentPreflight = 'true'
    script.textContent = 'window.__lxSwitchAssessmentPreflight = true'
    document.head.append(script)
  })
  result.preflight = await page.evaluate(() => ({
    title: document.title,
    scriptTagAppended: Boolean(document.querySelector('script[data-assessment-preflight="true"]')),
    scriptExecuted: window.__lxSwitchAssessmentPreflight === true,
    viewportCssWidth: window.innerWidth,
  }))
  if (!result.preflight.scriptTagAppended || result.preflight.title !== '[Human] LxSwitch Assessment B') {
    throw new Error(`Browser DOM mutation preflight failed: ${JSON.stringify(result.preflight)}`)
  }

  result.liveServer.start = runLiveServer(['--background'], 'live-server-start')
  serverStarted = result.liveServer.start.exitCode === 0
  let detectorUrl = null
  if (serverStarted) {
    try {
      const info = JSON.parse(result.liveServer.start.stdout.trim())
      detectorUrl = `http://localhost:${info.port}/detect.js`
      result.liveServer.start.port = info.port
      result.liveServer.start.pid = info.pid
    } catch (error) {
      result.failures.push(`Could not parse live detector server startup JSON: ${error.message}`)
    }
  } else {
    result.failures.push(`Live detector server failed to start: ${result.liveServer.start.stderr}`)
  }

  await savePageScreenshot(page, 'light-desktop.png')
  result.states.lightDesktop = await page.evaluate(() => ({
    viewportCssWidth: window.innerWidth,
    colorScheme: getComputedStyle(document.documentElement).colorScheme,
    rootClasses: [...document.documentElement.classList],
    demoBackground: getComputedStyle(document.querySelector('.lx-switch-demo')).backgroundColor,
  }))

  const hudToggle = page.locator('.lx-switch-demo__toolbar input[type="checkbox"]')
  await hudToggle.check()
  await page.waitForTimeout(100)
  result.states.hud = await page.evaluate(() => ({
    checked: document.querySelector('.lx-switch-demo__toolbar input[type="checkbox"]').checked,
    rootClasses: [...document.documentElement.classList],
    demoBackground: getComputedStyle(document.querySelector('.lx-switch-demo')).backgroundColor,
  }))
  await savePageScreenshot(page, 'hud-desktop.png')
  await hudToggle.uncheck()

  const disabledSwitch = page.locator('[data-testid="standard-state"] [role="switch"][disabled]')
  result.states.disabled = {
    count: await disabledSwitch.count(),
    disabled: (await disabledSwitch.first().evaluate((element) => element.disabled)),
    ariaChecked: await disabledSwitch.first().getAttribute('aria-checked'),
    label: await disabledSwitch.first().getAttribute('aria-label'),
  }
  await page.locator('[data-testid="standard-state"]').screenshot({
    path: path.join(evidenceDir, 'disabled-desktop.png'),
    animations: 'disabled',
  })
  result.screenshots.push({ file: 'disabled-desktop.png', viewport: 1440 })

  const switches = page.locator('[data-testid="standard-state"] [role="switch"]')
  await switches.first().focus()
  await page.keyboard.press('Tab')
  result.states.keyboardFocus = await page.evaluate(() => {
    const active = document.activeElement
    const style = active instanceof HTMLElement ? getComputedStyle(active) : null
    const core = active instanceof HTMLElement
      ? active.closest('.el-switch')?.querySelector('.el-switch__core')
      : null
    const coreStyle = core ? getComputedStyle(core) : null
    return {
      activeTag: active?.tagName || null,
      role: active?.getAttribute('role') || null,
      ariaLabel: active?.getAttribute('aria-label') || null,
      ariaLabelledBy: active?.getAttribute('aria-labelledby') || null,
      focusVisible: active instanceof HTMLElement && active.matches(':focus-visible'),
      outline: style ? `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}` : null,
      boxShadow: style?.boxShadow || null,
      switchCoreOutline: coreStyle
        ? `${coreStyle.outlineWidth} ${coreStyle.outlineStyle} ${coreStyle.outlineColor}`
        : null,
      switchCoreBoxShadow: coreStyle?.boxShadow || null,
    }
  })
  await page.locator('[data-testid="standard-state"]').screenshot({
    path: path.join(evidenceDir, 'keyboard-focus.png'),
    animations: 'disabled',
  })
  result.screenshots.push({ file: 'keyboard-focus.png', viewport: 1440 })

  const loadingSwitch = page.locator('[data-testid="loading"] .el-switch').first()
  const loadingCore = loadingSwitch.locator('.el-switch__core')
  await loadingCore.click()
  await page.waitForTimeout(200)
  result.states.loading = await loadingSwitch.evaluate((element) => {
    const input = element.querySelector('.el-switch__input')
    return {
      rootClasses: [...element.classList],
      ariaChecked: input?.getAttribute('aria-checked') || null,
      ariaDisabled: input?.getAttribute('aria-disabled') || null,
      inputDisabled: input?.disabled || false,
      coreMarkup: element.querySelector('.el-switch__core')?.outerHTML || '',
      visibleText: element.closest('[data-testid="loading"]')?.innerText || '',
    }
  })
  await page.locator('[data-testid="loading"]').screenshot({
    path: path.join(evidenceDir, 'loading-desktop.png'),
    animations: 'disabled',
  })
  result.screenshots.push({ file: 'loading-desktop.png', viewport: 1440 })
  await page.waitForTimeout(2100)
  result.states.loadingRecoveryText = await page.locator('[data-testid="loading"]').innerText()

  await page.emulateMedia({ reducedMotion: 'reduce' })
  result.states.reducedMotion = await page.evaluate(() => {
    const control = document.querySelector('.el-switch .el-switch__core')
    const style = control ? getComputedStyle(control) : null
    return {
      mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      transitionDuration: style?.transitionDuration || null,
      transitionDelay: style?.transitionDelay || null,
    }
  })
  await savePageScreenshot(page, 'reduced-motion.png')

  await page.setViewportSize({ width: 375, height: 812 })
  await page.waitForTimeout(100)
  result.states.mobile375DesktopEmulation = await page.evaluate(() => ({
    viewportCssWidth: window.innerWidth,
    visualViewportCssWidth: window.visualViewport?.width ?? null,
    documentClientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }))
  await savePageScreenshot(page, 'mobile-375-desktop-emulation.png')

  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'no-preference',
    isMobile: true,
    hasTouch: true,
  })
  const mobilePage = await mobileContext.newPage()
  const mobileResponse = await mobilePage.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 })
  await mobilePage.locator('.lx-switch-demo').waitFor({ state: 'visible', timeout: 10000 })
  await mobilePage.evaluate(() => { document.title = '[Human] LxSwitch Assessment B 375 CSS px' })
  result.states.mobile375 = await mobilePage.evaluate((status) => ({
    responseStatus: status,
    viewportCssWidth: window.innerWidth,
    visualViewportCssWidth: window.visualViewport?.width ?? null,
    documentClientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    isMobile: matchMedia('(pointer: coarse)').matches,
  }), mobileResponse?.status() ?? null)
  await savePageScreenshot(mobilePage, 'mobile-375.png')
  await mobileContext.close()

  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'no-preference', colorScheme: 'light' })
  await page.reload({ waitUntil: 'networkidle' })
  await page.evaluate(() => { document.title = '[Human] LxSwitch Assessment B' })
  await page.evaluate(() => window.scrollTo(0, 0))

  if (!detectorUrl) {
    result.failures.push('Overlay injection skipped because no detector URL was available.')
  } else {
    await page.addScriptTag({ url: detectorUrl })
    await page.waitForTimeout(3000)
    result.overlay.injected = await page.evaluate((src) => {
      const describeTarget = (element) => {
        if (!(element instanceof Element)) return null
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        const path = []
        for (let current = element; current && path.length < 7; current = current.parentElement) {
          let segment = current.tagName.toLowerCase()
          if (current.id) {
            segment += `#${current.id}`
            path.unshift(segment)
            break
          }
          const classes = [...current.classList].slice(0, 2)
          if (classes.length) segment += `.${classes.join('.')}`
          path.unshift(segment)
          if (current.matches('.VPDoc, .VPSidebar, .VPNav')) break
        }
        return {
          selector: path.join(' > '),
          tag: element.tagName,
          id: element.id || null,
          className: element.className || null,
          text: (element.innerText || element.textContent || '').trim().slice(0, 240),
          outerHTML: element.outerHTML.slice(0, 500),
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          style: { opacity: style.opacity, backgroundImage: style.backgroundImage, transition: style.transition },
          inComponentDemo: Boolean(element.closest('.lx-switch-demo')),
          inDocsArticle: Boolean(element.closest('.VPDoc')),
          inDocsChrome: Boolean(element.closest('.VPNav, .VPSidebar, .VPDocAside, .VPFooter')),
        }
      }
      return {
        scriptPresent: [...document.scripts].some((script) => script.src === src),
        detectorScriptCount: [...document.scripts].filter((script) => script.src.includes('/detect.js')).length,
        title: document.title,
        viewportCssWidth: window.innerWidth,
        bannerText: document.querySelector('.impeccable-banner')?.innerText || null,
        overlays: [...document.querySelectorAll('.impeccable-overlay:not(.impeccable-banner)')].map((overlay) => ({
          label: overlay.querySelector('.impeccable-label')?.innerText || null,
          target: describeTarget(overlay._targetEl),
        })),
      }
    }, detectorUrl)
    await Promise.all(consoleTasks)
    result.overlay.domEvidence = result.overlay.injected
    result.overlay.console = result.console.filter((entry) => entry.detector)
    await savePageScreenshot(page, 'overlay-light-desktop.png')
  }

  const targetOrigin = new URL(targetUrl).origin
  result.requests = result.requests.map((request) => ({
    ...request,
    sameOrigin: new URL(request.url).origin === targetOrigin,
  }))
  result.networkSummary = {
    totalRequests: result.requests.length,
    nonDocumentWrites: result.requests.filter((request) =>
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method),
    ),
    localLoopbackAuxiliaryRequests: result.requests.filter((request) => {
      const url = new URL(request.url)
      return !request.sameOrigin && ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
    }),
    externalRequests: result.requests.filter((request) => {
      const url = new URL(request.url)
      return !request.sameOrigin && !['localhost', '127.0.0.1', '::1'].includes(url.hostname)
    }),
  }
} catch (error) {
  result.failures.push(error.stack || error.message)
  process.exitCode = 1
} finally {
  if (serverStarted) {
    result.liveServer.stop = runLiveServer(['stop', '--keep-inject'], 'live-server-stop')
    if (result.liveServer.stop.exitCode !== 0) {
      result.failures.push(`Live detector server stop command exited ${result.liveServer.stop.exitCode}.`)
      process.exitCode = 1
    }
  }
  if (browser) await browser.close().catch((error) => result.failures.push(`Browser close failed: ${error.message}`))
  result.console = result.console.map((entry) => ({
    ...entry,
    impeccable: entry.detector || /impeccable/i.test(entry.text),
  }))
  result.overlay.console = result.console.filter((entry) => entry.detector)
  writeJson('browser-evidence.json', result)
  writeJson('overlay-console.json', result.overlay.console)
  process.stdout.write(`${JSON.stringify({
    page: result.page,
    preflight: result.preflight,
    overlay: result.overlay,
    failures: result.failures,
    serverStop: result.liveServer.stop,
  }, null, 2)}\n`)
}
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`)
  process.exitCode = 1
})
