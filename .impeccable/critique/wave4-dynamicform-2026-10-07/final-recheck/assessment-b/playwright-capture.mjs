import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const baseUrl = 'http://127.0.0.1:4174'
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detector/detect-antipatterns-browser.js'
const browserExecutablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const outputDirectory = 'F:/work/linkx-admin/.impeccable/critique/wave4-dynamicform-2026-10-07/final-recheck/assessment-b'

const targets = [
  {
    id: 'lxdynamicform',
    path: '/components/lxdynamicform.html',
    hudLabel: '深色主题（HUD）',
    componentRoots: ['.dynamic-form-demo', '.lx-dynamic-form-demo', '.lx-dynamic-form-container'],
  },
  {
    id: 'lxupload',
    path: '/components/lxupload.html',
    hudLabel: 'HUD 深色主题',
    componentRoots: ['.lx-upload-demo', '.lx-upload'],
  },
  {
    id: 'lxdatepicker',
    path: '/components/lxdatepicker.html',
    hudLabel: 'HUD 深色主题',
    componentRoots: ['.lx-date-picker-demo', '.lx-date-picker'],
  },
]

const shellSelectors = [
  '.VPNav',
  '.VPNavBar',
  '.VPSidebar',
  '.VPDocFooter',
  '.VPFooter',
  '.VPContent',
  '.VPLocalNav',
  '.VPDocAside',
  '.VPDocAsideOutline',
]

function widthMetrics(page) {
  return page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentElementClientWidth: document.documentElement.clientWidth,
    documentElementScrollWidth: document.documentElement.scrollWidth,
    bodyClientWidth: document.body?.clientWidth ?? null,
    bodyScrollWidth: document.body?.scrollWidth ?? null,
    horizontalOverflow: Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth ?? 0,
    ) > document.documentElement.clientWidth,
  }))
}

function serializableFindings(page, target) {
  return page.evaluate(
    async ({ targetId, componentRoots: roots, shellRoots }) => {
      const result = await window.impeccableScan()
      const makeCssPath = (element) => {
        if (!(element instanceof Element)) return null
        if (element.id) return `#${CSS.escape(element.id)}`
        const parts = []
        let current = element
        while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 6) {
          let part = current.tagName.toLowerCase()
          if (current.classList.length) {
            part += `.${Array.from(current.classList).slice(0, 2).map((name) => CSS.escape(name)).join('.')}`
          }
          const parent = current.parentElement
          if (parent) {
            const peers = Array.from(parent.children).filter((peer) => peer.tagName === current.tagName)
            if (peers.length > 1) part += `:nth-of-type(${peers.indexOf(current) + 1})`
          }
          parts.unshift(part)
          current = parent
        }
        return parts.join(' > ')
      }
      const candidates = []
      const seen = new Set()
      const add = (value, source) => {
        if (!Array.isArray(value) || seen.has(value)) return
        seen.add(value)
        candidates.push({ value, source })
      }
      add(result, 'return')
      add(result?.findings, 'return.findings')
      add(result?.issues, 'return.issues')
      add(result?.results, 'return.results')
      add(window.impeccableFindings, 'window.impeccableFindings')
      add(window.__impeccableFindings, 'window.__impeccableFindings')
      add(window.impeccableResults, 'window.impeccableResults')

      const safeValue = (value, depth = 0) => {
        if (value == null || ['string', 'number', 'boolean'].includes(typeof value)) return value
        if (typeof value === 'function') return '[function]'
        if (value instanceof Element) {
          return {
            tag: value.tagName.toLowerCase(),
            id: value.id || null,
            className: typeof value.className === 'string' ? value.className : null,
            text: value.textContent?.trim().replace(/\s+/g, ' ').slice(0, 180) ?? '',
            selector: makeCssPath(value),
          }
        }
        if (depth > 2) return Object.prototype.toString.call(value)
        if (Array.isArray(value)) return value.slice(0, 30).map((item) => safeValue(item, depth + 1))
        if (typeof value === 'object') {
          const resultObject = {}
          for (const [key, nested] of Object.entries(value).slice(0, 40)) {
            if (key === 'element' || key === 'el' || key === 'node' || key === 'target') {
              resultObject[key] = safeValue(nested, depth + 1)
            } else if (typeof nested !== 'function') {
              resultObject[key] = safeValue(nested, depth + 1)
            }
          }
          return resultObject
        }
        return String(value)
      }

      const elementFor = (finding) => {
        for (const key of ['element', 'el', 'node', 'target']) {
          const value = finding?.[key]
          if (value instanceof Element) return value
        }
        return null
      }

      const classify = (element) => {
        if (!element) return '未定位'
        if (element.closest('[data-impeccable-overlay], [data-impeccable], [class*="impeccable-overlay"], [id*="impeccable-overlay"]')) {
          return 'overlay 自身'
        }
        if (roots.some((selector) => element.closest(selector))) return '目标组件'
        if (targetId === 'lxdynamicform' && element.closest('.lx-select__popper, .el-select__popper, .el-select-dropdown')) {
          return '目标组件'
        }
        if (targetId === 'lxdatepicker' && element.closest('.lx-date-picker__popper, .el-date-editor, .el-picker-panel, .el-date-table')) {
          return '目标组件'
        }
        if (element === document.body || element === document.documentElement) return 'VitePress 壳层'
        if (element.closest('.vp-doc, .VPDoc')) return '文档正文'
        if (shellRoots.some((selector) => element.closest(selector))) return 'VitePress 壳层'
        return '未定位'
      }

      const chooseElement = (finding) => {
        const direct = elementFor(finding)
        if (direct) return direct
        const selector = finding?.selector ?? finding?.elementSelector ?? finding?.targetSelector
        if (typeof selector === 'string') {
          try {
            return document.querySelector(selector)
          } catch {
            return null
          }
        }
        return null
      }

      const selected = candidates.find((candidate) => candidate.value.length > 0)
      if (!selected) {
        return {
          source: candidates.map(({ source, value }) => ({ source, count: value.length })),
          findings: [],
          rawReturn: safeValue(result),
          globalKeys: Object.keys(window).filter((key) => /impeccable/i.test(key)),
        }
      }

      return {
        source: selected.source,
        findings: selected.value.map((finding, index) => {
          const element = chooseElement(finding)
          return {
            index,
            category: classify(element),
            selector: element ? makeCssPath(element) : finding?.selector ?? finding?.elementSelector ?? null,
            tag: element?.tagName?.toLowerCase() ?? null,
            className: element && typeof element.className === 'string' ? element.className : null,
            text: element?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 180) ?? null,
            finding: safeValue(finding),
          }
        }),
        globalKeys: Object.keys(window).filter((key) => /impeccable/i.test(key)),
      }
    },
    { targetId: target.id, componentRoots: target.componentRoots, shellRoots: shellSelectors },
  )
}

async function scanAndCapture(page, target, state, screenshotIndex) {
  const normalized = await serializableFindings(page, target)
  await page.waitForTimeout(2500)
  const filename = `${target.id}--${state}.png`
  const fullPath = path.join(outputDirectory, 'screenshots', filename)
  await page.screenshot({ path: fullPath, fullPage: true, animations: 'disabled' })
  screenshotIndex.push({ target: target.id, state, file: `screenshots/${filename}` })
  return normalized
}

async function setHudTheme(page, target, enabled) {
  const checkbox = page.getByLabel(target.hudLabel, { exact: true }).first()
  const current = await checkbox.isChecked()
  if (current !== enabled) await checkbox.setChecked(enabled, { force: true })
  await page.waitForTimeout(300)
  const [checked, themeState] = await Promise.all([
    checkbox.isChecked(),
    page.evaluate(() => ({
      documentClasses: document.documentElement.className,
      htmlDark: document.documentElement.classList.contains('dark'),
      htmlHud: document.documentElement.classList.contains('lx-theme-hud'),
      hudElementCount: document.querySelectorAll('.lx-theme-hud').length,
    })),
  ])
  return { checked, ...themeState }
}

async function captureDynamicFormInteraction(page, target, screenshots) {
  const button = page.getByRole('button', { name: '提交校验', exact: true })
  await button.click()
  await page.waitForFunction(() => {
    const alert = document.querySelector('[role="alert"]')
    return Boolean(alert?.textContent?.trim())
  }, null, { timeout: 5000 })
  const alertText = await page.locator('[role="alert"]').first().textContent()
  const errors = await page.locator('.is-error, [aria-invalid="true"]').count()
  return {
    state: 'empty-submit-error',
    alertText: alertText?.trim() ?? '',
    invalidControlCount: errors,
    findings: await scanAndCapture(page, target, 'empty-submit-error', screenshots),
  }
}

async function captureUploadInteraction(page, target, screenshots) {
  await page.getByRole('button', { name: '下一次上传失败', exact: true }).click()
  await page.locator('.lx-upload input[type="file"]').setInputFiles({
    name: 'assessment-b-mock-failure.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('name,shift\nMock,local'),
  })
  await page.getByRole('button', { name: '开始上传', exact: true }).click()
  await page.waitForFunction(() => Boolean(document.querySelector('.lx-upload__file-error')?.textContent?.trim()), null, {
    timeout: 7000,
  })
  const errorText = await page.locator('.lx-upload__file-error').first().textContent()
  const status = await page.getByTestId('upload-last-action').textContent()
  const requestCount = await page.getByTestId('upload-request-count').textContent()
  return {
    state: 'mock-upload-failure',
    errorText: errorText?.trim() ?? '',
    status: status?.trim() ?? '',
    mockRequestCount: requestCount?.trim() ?? '',
    findings: await scanAndCapture(page, target, 'mock-upload-failure', screenshots),
  }
}

async function captureDatePickerInteractions(page, target, screenshots) {
  const range = page.locator('.lx-date-picker-demo [data-testid="range"]')
  const start = range.getByLabel('专项布控日期区间开始日期', { exact: true })
  await start.focus()
  await page.keyboard.press('ArrowDown')
  await page.waitForFunction(() => Boolean(document.querySelector('.lx-date-picker__popper[aria-hidden="false"]')), null, {
    timeout: 5000,
  })
  const popper = page.locator('.lx-date-picker__popper[aria-hidden="false"]')
  const focusedCalendarCells = await popper.locator('.el-date-range-picker td:focus').count()
  const keyboardOpenFindings = await scanAndCapture(page, target, 'keyboard-calendar-open', screenshots)

  await page.keyboard.press('Escape')
  await page.waitForFunction(() => !document.querySelector('.lx-date-picker__popper[aria-hidden="false"]'), null, {
    timeout: 5000,
  })
  const escapeReturnedFocus = await start.evaluate((element) => document.activeElement === element)
  const escapeClosedFindings = await scanAndCapture(page, target, 'keyboard-escape-closed', screenshots)

  const shortcuts = page.locator('.lx-date-picker-demo [data-testid="shortcuts"]')
  const shortcutStart = shortcuts.getByLabel('研判时间范围开始日期', { exact: true })
  await shortcutStart.click()
  const shortcutPopper = page.locator('.lx-date-picker-demo__shortcuts-popper')
  await shortcutPopper.waitFor({ state: 'visible', timeout: 5000 })
  const shortcutNames = await shortcutPopper.locator('.el-picker-panel__shortcut').allTextContents()
  const shortcutOpenFindings = await scanAndCapture(page, target, 'shortcut-preset-open', screenshots)
  await shortcutPopper.locator('.el-picker-panel__shortcut', { hasText: '本周' }).click()
  await page.waitForFunction(() => {
    const panel = document.querySelector('.lx-date-picker-demo__shortcuts-popper')
    return !panel || !panel.getClientRects().length
  }, null, { timeout: 5000 })
  const shortcutValues = {
    start: await shortcutStart.inputValue(),
    end: await shortcuts.getByLabel('研判时间范围结束日期', { exact: true }).inputValue(),
  }
  const shortcutClosedFindings = await scanAndCapture(page, target, 'shortcut-preset-closed', screenshots)

  return {
    keyboardCalendar: {
      opened: true,
      focusedCalendarCells,
      escapeClosed: true,
      focusReturnedToStart: escapeReturnedFocus,
      openFindings: keyboardOpenFindings,
      closedFindings: escapeClosedFindings,
    },
    shortcutPreset: {
      availableOptions: shortcutNames.map((name) => name.trim()).filter(Boolean),
      selected: '本周',
      closedAfterSelect: true,
      values: shortcutValues,
      openFindings: shortcutOpenFindings,
      closedFindings: shortcutClosedFindings,
    },
  }
}

export async function run(chromium) {
  await mkdir(path.join(outputDirectory, 'screenshots'), { recursive: true })
  const report = {
    baseUrl,
    browser: 'Headless Google Chrome launched by Playwright Chromium',
    browserExecutablePath,
    detectorPath,
    pageResults: [],
    screenshotIndex: [],
    errors: [],
  }

  let browser
  try {
    browser = await chromium.launch({ headless: true, executablePath: browserExecutablePath })
  } catch (error) {
    const message = error instanceof Error ? error.stack ?? error.message : String(error)
    report.errors.push({ target: 'browser-launch', error: message })
    await writeFile(path.join(outputDirectory, 'browser-runtime.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
    process.exitCode = 1
    return
  }
  try {
    for (const target of targets) {
      const context = await browser.newContext({
        viewport: { width: 1365, height: 900 },
        deviceScaleFactor: 1,
      })
      const page = await context.newPage()
      const pageResult = {
        target: target.id,
        url: `${baseUrl}${target.path}`,
        console: [],
        pageErrors: [],
        requests: [],
        failedRequests: [],
        injection: {},
        views: {},
        interactions: {},
      }
      report.pageResults.push(pageResult)

      page.on('console', (message) => {
        pageResult.console.push({ type: message.type(), text: message.text() })
      })
      page.on('pageerror', (error) => pageResult.pageErrors.push(error.stack ?? error.message))
      page.on('request', (request) => {
        let hostname = null
        try {
          hostname = new URL(request.url()).hostname
        } catch {
          hostname = request.url().split(':', 1)[0]
        }
        pageResult.requests.push({ url: request.url(), method: request.method(), hostname })
      })
      page.on('requestfailed', (request) => {
        pageResult.failedRequests.push({ url: request.url(), failure: request.failure()?.errorText ?? 'unknown' })
      })

      try {
        const response = await page.goto(`${baseUrl}${target.path}`, { waitUntil: 'load', timeout: 20000 })
        pageResult.httpStatus = response?.status() ?? null
        await page.waitForTimeout(500)
        pageResult.titleBeforePreflight = await page.title()
        pageResult.widthBeforeDetectorInjection = await widthMetrics(page)

        pageResult.preflight = await page.evaluate((targetId) => {
          document.title = `Assessment B preflight: ${targetId}`
          const script = document.createElement('script')
          script.dataset.assessmentBPreflight = targetId
          script.textContent = `window.__assessmentBPreflight = ${JSON.stringify(targetId)};`
          document.head.append(script)
          return {
            title: document.title,
            scriptAppended: script.isConnected,
            scriptExecuted: window.__assessmentBPreflight === targetId,
          }
        }, target.id)

        await page.addScriptTag({ path: detectorPath })
        pageResult.injection.globalsPresent = await page.evaluate(
          () => typeof window.impeccableScan === 'function' && typeof window.impeccableDetect === 'function',
        )
        pageResult.injection.globalTypes = await page.evaluate(() => ({
          impeccableScan: typeof window.impeccableScan,
          impeccableDetect: typeof window.impeccableDetect,
        }))
        pageResult.widthAfterDetectorInjection = await widthMetrics(page)
        if (!pageResult.injection.globalsPresent) throw new Error('Browser detector globals were not available after script injection')

        pageResult.views['desktop-light'] = await scanAndCapture(page, target, 'desktop-light', report.screenshotIndex)

        pageResult.themeDesktopHud = await setHudTheme(page, target, true)
        pageResult.views['desktop-hud-dark'] = await scanAndCapture(page, target, 'desktop-hud-dark', report.screenshotIndex)

        await page.setViewportSize({ width: 375, height: 812 })
        pageResult.viewport375 = await widthMetrics(page)
        pageResult.views['mobile-hud-dark'] = await scanAndCapture(page, target, 'mobile-hud-dark', report.screenshotIndex)

        pageResult.themeMobileLight = await setHudTheme(page, target, false)
        pageResult.views['mobile-light'] = await scanAndCapture(page, target, 'mobile-light', report.screenshotIndex)

        if (target.id === 'lxdynamicform') {
          pageResult.interactions.emptySubmit = await captureDynamicFormInteraction(page, target, report.screenshotIndex)
        } else if (target.id === 'lxupload') {
          pageResult.interactions.mockFailure = await captureUploadInteraction(page, target, report.screenshotIndex)
        } else if (target.id === 'lxdatepicker') {
          pageResult.interactions.keyboardAndShortcut = await captureDatePickerInteractions(page, target, report.screenshotIndex)
        }
      } catch (error) {
        const message = error instanceof Error ? error.stack ?? error.message : String(error)
        pageResult.error = message
        report.errors.push({ target: target.id, error: message })
      } finally {
        await context.close()
      }
    }
  } finally {
    await browser.close()
  }

  const originHostname = new URL(baseUrl).hostname
  for (const pageResult of report.pageResults) {
    const hostnames = [...new Set(pageResult.requests.map((request) => request.hostname).filter(Boolean))].sort()
    pageResult.requestDomains = hostnames
    pageResult.externalRequests = pageResult.requests.filter((request) => {
      if (request.url.startsWith('data:') || request.url.startsWith('blob:')) return false
      return request.hostname && request.hostname !== originHostname && request.hostname !== 'localhost'
    })
    pageResult.externalRequestDomains = [...new Set(pageResult.externalRequests.map((request) => request.hostname))].sort()
    pageResult.noExternalRequests = pageResult.externalRequests.length === 0
  }

  await writeFile(path.join(outputDirectory, 'browser-runtime.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  if (report.errors.length) process.exitCode = 1
}
