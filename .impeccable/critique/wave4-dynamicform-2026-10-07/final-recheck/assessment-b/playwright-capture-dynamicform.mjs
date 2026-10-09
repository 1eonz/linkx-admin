import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const baseUrl = 'http://127.0.0.1:4174'
const targetPath = '/components/lxdynamicform.html'
const targetId = 'lxdynamicform'
const hudLabel = '深色主题（HUD）'
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detector/detect-antipatterns-browser.js'
const browserExecutablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const outputDirectory = 'F:/work/linkx-admin/.impeccable/critique/wave4-dynamicform-2026-10-07/final-recheck/assessment-b'
const screenshotDirectory = path.join(outputDirectory, 'screenshots')

function messageOf(error) {
  return error instanceof Error ? error.stack ?? error.message : String(error)
}

async function widthMetrics(page) {
  return page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    documentElementClientWidth: document.documentElement.clientWidth,
    documentElementScrollWidth: document.documentElement.scrollWidth,
    bodyClientWidth: document.body?.clientWidth ?? null,
    bodyScrollWidth: document.body?.scrollWidth ?? null,
    horizontalOverflow:
      Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0) >
      document.documentElement.clientWidth,
  }))
}

async function scanSummary(page) {
  return page.evaluate(async () => {
    const result = await window.impeccableScan()
    const arrays = []
    const add = (value, source) => {
      if (Array.isArray(value)) arrays.push({ source, value })
    }
    add(result, 'return')
    add(result?.findings, 'return.findings')
    add(result?.issues, 'return.issues')
    add(result?.results, 'return.results')
    add(window.impeccableFindings, 'window.impeccableFindings')
    add(window.__impeccableFindings, 'window.__impeccableFindings')
    add(window.impeccableResults, 'window.impeccableResults')

    const cssPath = (element) => {
      if (!(element instanceof Element)) return null
      if (element.id) return `#${CSS.escape(element.id)}`
      const parts = []
      let current = element
      while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 6) {
        let part = current.tagName.toLowerCase()
        if (current.classList.length) {
          part += `.${Array.from(current.classList)
            .slice(0, 2)
            .map((name) => CSS.escape(name))
            .join('.')}`
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

    const safe = (value, depth = 0, seen = new WeakSet()) => {
      if (value == null || ['string', 'number', 'boolean'].includes(typeof value)) return value
      if (typeof value === 'function') return '[function]'
      if (value instanceof Element) {
        return {
          tag: value.tagName.toLowerCase(),
          id: value.id || null,
          className: typeof value.className === 'string' ? value.className : null,
          text: value.textContent?.trim().replace(/\s+/g, ' ').slice(0, 180) ?? '',
          selector: cssPath(value),
        }
      }
      if (typeof value !== 'object') return String(value)
      if (seen.has(value)) return '[circular]'
      if (depth > 3) return Object.prototype.toString.call(value)
      seen.add(value)
      if (Array.isArray(value)) return value.slice(0, 30).map((item) => safe(item, depth + 1, seen))
      const output = {}
      for (const [key, nested] of Object.entries(value).slice(0, 40)) {
        output[key] = safe(nested, depth + 1, seen)
      }
      return output
    }

    const elementFor = (finding) => {
      for (const key of ['element', 'el', 'node', 'target']) {
        if (finding?.[key] instanceof Element) return finding[key]
      }
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

    const classify = (element) => {
      if (!element) return '未定位'
      if (
        element.closest(
          '[data-impeccable-overlay], [data-impeccable], [class*="impeccable-overlay"], [id*="impeccable-overlay"]',
        )
      ) {
        return 'overlay 自身'
      }
      if (element.closest('.dynamic-form-demo, .lx-dynamic-form-demo, .lx-dynamic-form-container')) {
        return '目标组件'
      }
      if (element === document.body || element === document.documentElement) return 'VitePress 壳层'
      if (element.closest('.vp-doc pre, .vp-doc code, .vp-doc .shiki, .vp-doc [class*="language-"]')) {
        return '文档代码块'
      }
      if (element.closest('.vp-doc, .VPDoc')) return '文档正文'
      if (
        element.closest(
          '.VPNav, .VPNavBar, .VPSidebar, .VPDocFooter, .VPFooter, .VPContent, .VPLocalNav, .VPDocAside, .VPDocAsideOutline',
        )
      ) {
        return 'VitePress 壳层'
      }
      return '未定位'
    }

    const selected = arrays.find(({ value }) => value.length > 0) ?? arrays[0]
    const findings = selected?.value ?? []
    return {
      source: selected?.source ?? 'none',
      candidateCounts: arrays.map(({ source, value }) => ({ source, count: value.length })),
      findings: findings.map((finding, index) => {
        const element = elementFor(finding)
        return {
          index,
          category: classify(element),
          selector: element ? cssPath(element) : finding?.selector ?? finding?.elementSelector ?? null,
          tag: element?.tagName?.toLowerCase() ?? null,
          className: element && typeof element.className === 'string' ? element.className : null,
          text: element?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 180) ?? null,
          finding: safe(finding),
        }
      }),
      overlayElementCount: document.querySelectorAll(
        '[data-impeccable-overlay], [data-impeccable], [class*="impeccable-overlay"], [id*="impeccable-overlay"]',
      ).length,
      globalKeys: Object.keys(window).filter((key) => /impeccable/i.test(key)),
    }
  })
}

async function setHudTheme(page, enabled) {
  const checkbox = page.getByLabel(hudLabel, { exact: true }).first()
  const current = await checkbox.isChecked()
  if (current !== enabled) {
    const visibleLabel = page
      .locator('.dynamic-form-demo__toolbar')
      .getByText(hudLabel, { exact: true })
      .first()
    await visibleLabel.scrollIntoViewIfNeeded()
    await visibleLabel.click()
  }
  await page.waitForFunction(
    (expected) => {
      const control = document.querySelector('.dynamic-form-demo__toolbar input[type="checkbox"]:checked')
      const formRoot = document.querySelector('.dynamic-form-demo')
      return Boolean(control) === expected && Boolean(formRoot?.classList.contains('lx-theme-hud')) === expected
    },
    enabled,
    { timeout: 5000 },
  )
  return page.evaluate(() => ({
    checkboxChecked: Boolean(
      Array.from(document.querySelectorAll('.dynamic-form-demo__toolbar label')).find((label) =>
        label.textContent?.includes('深色主题（HUD）'),
      )?.querySelector('input[type="checkbox"]')?.checked,
    ),
    htmlDark: document.documentElement.classList.contains('dark'),
    htmlHud: document.documentElement.classList.contains('lx-theme-hud'),
    componentHud: Boolean(document.querySelector('.dynamic-form-demo')?.classList.contains('lx-theme-hud')),
  }))
}

async function capture(page, state, theme, screenshots) {
  const findings = await scanSummary(page)
  await page.waitForTimeout(2500)
  const filename = `${targetId}--${state}.png`
  await page.screenshot({
    path: path.join(screenshotDirectory, filename),
    fullPage: true,
    animations: 'disabled',
  })
  const entry = {
    target: targetId,
    state,
    theme,
    viewport: page.viewportSize(),
    widthMetrics: await widthMetrics(page),
    screenshot: `screenshots/${filename}`,
    findings,
  }
  screenshots.push(entry)
  return entry
}

export async function run(chromium) {
  await mkdir(screenshotDirectory, { recursive: true })
  const report = {
    baseUrl,
    targetPath,
    browser: 'Headless Google Chrome launched by Playwright Chromium',
    browserExecutablePath,
    detectorPath,
    context: '本轮新建的独立 BrowserContext 与 Page',
    pageResults: [],
    screenshotIndex: [],
    errors: [],
  }

  let browser
  try {
    browser = await chromium.launch({ headless: true, executablePath: browserExecutablePath })
  } catch (error) {
    report.errors.push({ target: 'browser-launch', error: messageOf(error) })
    await writeReport(report)
    process.exitCode = 1
    return
  }

  try {
    const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    const pageResult = {
      target: targetId,
      url: `${baseUrl}${targetPath}`,
      console: [],
      pageErrors: [],
      requests: [],
      failedRequests: [],
      injection: {},
      themeTransitions: [],
      views: [],
      interaction: {},
    }
    report.pageResults.push(pageResult)
    page.on('console', (message) => pageResult.console.push({ type: message.type(), text: message.text() }))
    page.on('pageerror', (error) => pageResult.pageErrors.push(messageOf(error)))
    page.on('request', (request) => pageResult.requests.push({ url: request.url(), method: request.method() }))
    page.on('requestfailed', (request) => {
      pageResult.failedRequests.push({ url: request.url(), failure: request.failure()?.errorText ?? 'unknown' })
    })

    try {
      const response = await page.goto(`${baseUrl}${targetPath}`, { waitUntil: 'load', timeout: 20000 })
      pageResult.httpStatus = response?.status() ?? null
      await page.waitForTimeout(500)
      pageResult.titleBeforePreflight = await page.title()
      pageResult.preflight = await page.evaluate((id) => {
        document.title = `Assessment B preflight: ${id}`
        const script = document.createElement('script')
        script.dataset.assessmentBPreflight = id
        script.textContent = `window.__assessmentBPreflight = ${JSON.stringify(id)};`
        document.head.append(script)
        return {
          title: document.title,
          scriptAppended: script.isConnected,
          scriptExecuted: window.__assessmentBPreflight === id,
        }
      }, targetId)
      await page.addScriptTag({ path: detectorPath })
      pageResult.injection = await page.evaluate(() => ({
        impeccableScan: typeof window.impeccableScan,
        impeccableDetect: typeof window.impeccableDetect,
        globalsPresent:
          typeof window.impeccableScan === 'function' && typeof window.impeccableDetect === 'function',
      }))
      if (!pageResult.preflight.scriptExecuted) throw new Error('DOM mutation preflight did not execute')
      if (!pageResult.injection.globalsPresent) throw new Error('Browser detector injection did not expose expected functions')

      pageResult.themeTransitions.push({
        state: 'desktop-light',
        viewport: page.viewportSize(),
        theme: await setHudTheme(page, false),
      })
      pageResult.themeTransitions.push({
        state: 'desktop-hud-dark',
        viewport: page.viewportSize(),
        theme: await setHudTheme(page, true),
      })
      pageResult.views.push(await capture(page, 'desktop-hud-dark', 'HUD 深色', report.screenshotIndex))

      await page.setViewportSize({ width: 375, height: 812 })
      pageResult.themeTransitions.push({
        state: 'mobile-light',
        viewport: page.viewportSize(),
        theme: await setHudTheme(page, false),
      })
      pageResult.views.push(await capture(page, 'mobile-light', '浅色', report.screenshotIndex))
      pageResult.themeTransitions.push({
        state: 'mobile-hud-dark',
        viewport: page.viewportSize(),
        theme: await setHudTheme(page, true),
      })
      pageResult.views.push(await capture(page, 'mobile-hud-dark', 'HUD 深色', report.screenshotIndex))

      await page.setViewportSize({ width: 1365, height: 900 })
      pageResult.themeTransitions.push({
        state: 'validation-light',
        viewport: page.viewportSize(),
        theme: await setHudTheme(page, false),
      })
      await page.getByRole('button', { name: '提交校验', exact: true }).click()
      await page.waitForFunction(() => Boolean(document.querySelector('[role="alert"]')?.textContent?.trim()), null, {
        timeout: 7000,
      })
      pageResult.interaction = await page.evaluate(() => ({
        state: 'empty-submit-error',
        alertText: document.querySelector('[role="alert"]')?.textContent?.trim() ?? '',
        invalidControlCount: document.querySelectorAll('.is-error, [aria-invalid="true"]').length,
      }))
      pageResult.views.push(await capture(page, 'empty-submit-error', '浅色，空表单提交后', report.screenshotIndex))
    } catch (error) {
      const message = messageOf(error)
      pageResult.error = message
      report.errors.push({ target: targetId, error: message })
    } finally {
      await context.close()
    }
  } finally {
    await browser.close()
  }

  const originHostname = new URL(baseUrl).hostname
  for (const pageResult of report.pageResults) {
    pageResult.requestDomains = [
      ...new Set(
        pageResult.requests
          .map(({ url }) => {
            try {
              return new URL(url).hostname
            } catch {
              return null
            }
          })
          .filter(Boolean),
      ),
    ].sort()
    pageResult.externalRequests = pageResult.requests.filter((request) => {
      try {
        const url = new URL(request.url)
        return !['data:', 'blob:'].includes(url.protocol) && url.hostname !== originHostname
      } catch {
        return false
      }
    })
    pageResult.noExternalRequests = pageResult.externalRequests.length === 0
  }
  if (report.errors.length) process.exitCode = 1
  await writeReport(report)
}

async function writeReport(report) {
  const output = `${JSON.stringify(report, null, 2)}\n`
  await writeFile(path.join(outputDirectory, 'dynamicform-browser-runtime-recovery.json'), output, 'utf8')
  process.stdout.write(output)
}
