import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'file:///C:/Users/Administrator/.codex/tmp/pw-assessment/node_modules/playwright-core/index.mjs'

const out = path.resolve('.impeccable/critique/metric-section-wave-2026-10-11/assessment-b-recheck')
const screenshots = path.join(out, 'screenshots')
fs.mkdirSync(screenshots, { recursive: true })

const server = JSON.parse(fs.readFileSync(path.join(out, 'overlay-server-start.json'), 'utf8'))
const detectorUrl = `http://127.0.0.1:${server.port}/detect.js?token=${server.token}`
const views = []
for (const [component, slug, selector] of [
  ['LxMetricCard', 'lxmetriccard', '.lx-metric-card'],
  ['LxSectionTitle', 'lxsectiontitle', '.lx-section-title'],
]) {
  for (const view of [
    { suffix: 'light-desktop', width: 1440, height: 900, dark: false, reducedMotion: false },
    { suffix: 'dark-desktop', width: 1440, height: 900, dark: true, reducedMotion: false },
    { suffix: 'light-320', width: 320, height: 812, dark: false, reducedMotion: false },
    { suffix: 'light-375', width: 375, height: 812, dark: false, reducedMotion: false },
    { suffix: 'light-reduced-motion', width: 1440, height: 900, dark: false, reducedMotion: true },
  ]) {
    views.push({ component, slug, selector, ...view, name: `${slug}-${view.suffix}` })
  }
}

function selectorFor(element) {
  if (!element) return ''
  const parts = []
  let current = element
  while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 5) {
    let part = current.tagName.toLowerCase()
    if (current.id) {
      part += `#${current.id}`
      parts.unshift(part)
      break
    }
    const classes = [...current.classList].slice(0, 3)
    if (classes.length) part += `.${classes.join('.')}`
    const parent = current.parentElement
    if (parent) {
      const siblings = [...parent.children].filter((sibling) => sibling.tagName === current.tagName)
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`
    }
    parts.unshift(part)
    current = parent
  }
  return parts.join(' > ')
}

function writeJson(name, value) {
  fs.writeFileSync(path.join(out, name), `${JSON.stringify(value, null, 2)}\n`)
}

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})
const startedAt = new Date().toISOString()
const allResults = []

for (const view of views) {
  const context = await browser.newContext({
    viewport: { width: view.width, height: view.height },
    colorScheme: view.dark ? 'dark' : 'light',
    reducedMotion: view.reducedMotion ? 'reduce' : 'no-preference',
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  const pageErrors = []
  const consolePromises = []
  page.on('pageerror', (error) => pageErrors.push(String(error)))
  page.on('console', (message) => {
    consolePromises.push((async () => {
      const args = []
      for (const handle of message.args()) {
        try {
          args.push(await handle.evaluate((value) => {
            if (value instanceof Element) {
              const rect = value.getBoundingClientRect()
              const style = getComputedStyle(value)
              const pathParts = []
              let node = value
              while (node && node.nodeType === Node.ELEMENT_NODE && pathParts.length < 5) {
                let part = node.tagName.toLowerCase()
                if (node.id) {
                  part += `#${node.id}`
                  pathParts.unshift(part)
                  break
                }
                const classes = [...node.classList].slice(0, 3)
                if (classes.length) part += `.${classes.join('.')}`
                pathParts.unshift(part)
                node = node.parentElement
              }
              return {
                kind: 'element',
                selector: pathParts.join(' > '),
                tag: value.tagName,
                className: value.className?.toString() ?? '',
                id: value.id,
                text: value.textContent?.replace(/\s+/g, ' ').trim().slice(0, 220) ?? '',
                bounds: {
                  left: Math.round(rect.left * 100) / 100,
                  top: Math.round(rect.top * 100) / 100,
                  width: Math.round(rect.width * 100) / 100,
                  height: Math.round(rect.height * 100) / 100,
                  right: Math.round(rect.right * 100) / 100,
                },
                scrollWidth: value.scrollWidth,
                clientWidth: value.clientWidth,
                overflowX: style.overflowX,
                textOverflow: style.textOverflow,
                color: style.color,
                backgroundColor: style.backgroundColor,
              }
            }
            return {
              kind: value === null ? 'null' : typeof value,
              value: typeof value === 'string' ? value : String(value),
            }
          }))
        } catch (error) {
          args.push({ kind: 'unreadable', error: String(error) })
        }
      }
      return {
        type: message.type(),
        text: message.text(),
        location: message.location(),
        args,
      }
    })())
  })

  let responseStatus = null
  let navigationError = null
  let preflight = { attempted: false, succeeded: false, result: null, error: null }
  let injection = { attempted: false, succeeded: false, error: null }
  let pageMeasurements = null
  let scanEvidence = { called: false, available: false, findings: [], error: null }
  let overlayEvidence = { confirmed: false, visibleCount: 0, elements: [] }

  try {
    const response = await page.goto(`http://127.0.0.1:4177/components/${view.slug}`, {
      waitUntil: 'networkidle',
      timeout: 45000,
    })
    responseStatus = response?.status() ?? null
    await page.waitForSelector(view.selector, { timeout: 30000 })
    await page.waitForTimeout(350)

    preflight.attempted = true
    try {
      preflight.result = await page.evaluate(({ component, dark }) => {
        document.title = `[Human] ${component} Assessment B final recheck`
        document.documentElement.dataset.assessmentBMutation = 'ready'
        const probe = document.createElement('script')
        probe.id = 'assessment-b-preflight-script'
        probe.textContent = 'document.documentElement.dataset.assessmentBInjected = "ready"'
        document.head.append(probe)
        document.documentElement.classList.toggle('dark', dark)
        document.documentElement.classList.toggle('lx-theme-hud', dark)
        document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
        return {
          title: document.title,
          mutation: document.documentElement.dataset.assessmentBMutation,
          scriptExecuted: document.documentElement.dataset.assessmentBInjected === 'ready',
          scriptTagPresent: Boolean(document.querySelector('#assessment-b-preflight-script')),
          rootClass: document.documentElement.className,
          colorScheme: getComputedStyle(document.documentElement).colorScheme,
          targetCount: document.querySelectorAll(
            component === 'LxMetricCard' ? '.lx-metric-card' : '.lx-section-title',
          ).length,
        }
      }, { component: view.component, dark: view.dark })
      preflight.succeeded = preflight.result.scriptExecuted && preflight.result.targetCount > 0
    } catch (error) {
      preflight.error = String(error)
    }

    pageMeasurements = await page.evaluate(({ selector, reducedMotion }) => {
      const root = document.documentElement
      const describe = (element) => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return {
          selector: element.id
            ? `#${element.id}`
            : `${element.tagName.toLowerCase()}${[...element.classList].map((name) => `.${name}`).join('')}`,
          tag: element.tagName,
          className: element.className?.toString() ?? '',
          text: element.textContent?.replace(/\s+/g, ' ').trim().slice(0, 150) ?? '',
          bounds: {
            left: Math.round(rect.left * 100) / 100,
            top: Math.round(rect.top * 100) / 100,
            width: Math.round(rect.width * 100) / 100,
            height: Math.round(rect.height * 100) / 100,
            right: Math.round(rect.right * 100) / 100,
            bottom: Math.round(rect.bottom * 100) / 100,
          },
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          overflowX: style.overflowX,
          textOverflow: style.textOverflow,
          transition: style.transition,
        }
      }
      const targets = [...document.querySelectorAll(selector)]
      const candidates = [...document.querySelectorAll('body *')]
        .filter((element) => !element.closest('.impeccable-overlay'))
        .map((element) => ({ element, rect: element.getBoundingClientRect() }))
        .filter(({ element, rect }) => {
          const widthOverflow = element.scrollWidth > element.clientWidth + 1
          const outsideViewport = rect.width > 0 && rect.right > window.innerWidth + 1
          return widthOverflow || outsideViewport
        })
        .sort((a, b) => {
          const aOverflow = Math.max(a.element.scrollWidth - a.element.clientWidth, a.rect.right - window.innerWidth)
          const bOverflow = Math.max(b.element.scrollWidth - b.element.clientWidth, b.rect.right - window.innerWidth)
          return bOverflow - aOverflow
        })
        .slice(0, 30)
        .map(({ element }) => describe(element))
      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        document: {
          clientWidth: root.clientWidth,
          scrollWidth: root.scrollWidth,
          horizontalOverflow: root.scrollWidth > root.clientWidth,
        },
        reducedMotionRequested: reducedMotion,
        reducedMotionMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
        colorScheme: getComputedStyle(root).colorScheme,
        targetSelector: selector,
        targetCount: targets.length,
        targets: targets.map(describe),
        overflowCandidates: candidates,
      }
    }, { selector: view.selector, reducedMotion: view.reducedMotion })

    const safeName = view.name
    await page.screenshot({
      path: path.join(screenshots, `${safeName}.baseline.png`),
      fullPage: true,
    })

    injection.attempted = true
    try {
      await page.addScriptTag({ url: detectorUrl })
      injection.succeeded = true
    } catch (error) {
      injection.error = String(error)
    }
    await page.waitForTimeout(2200)

    scanEvidence.called = true
    try {
      const result = await page.evaluate(async () => {
        const scan = window.impeccableScanAsync ?? window.impeccableScan
        if (typeof scan !== 'function') return { available: false, findings: [] }
        const value = await scan()
        const rows = Array.isArray(value) ? value : value == null ? [] : [value]
        return {
          available: true,
          findings: rows.map((row) => {
            const target = row?.el
            const targetInfo = target instanceof Element
              ? {
                  selector: target.id
                    ? `#${target.id}`
                    : `${target.tagName.toLowerCase()}${[...target.classList].map((name) => `.${name}`).join('')}`,
                  tag: target.tagName,
                  className: target.className?.toString() ?? '',
                  text: target.textContent?.replace(/\s+/g, ' ').trim().slice(0, 220) ?? '',
                  bounds: (() => {
                    const rect = target.getBoundingClientRect()
                    return {
                      left: Math.round(rect.left * 100) / 100,
                      top: Math.round(rect.top * 100) / 100,
                      width: Math.round(rect.width * 100) / 100,
                      height: Math.round(rect.height * 100) / 100,
                      right: Math.round(rect.right * 100) / 100,
                    }
                  })(),
                  scrollWidth: target.scrollWidth,
                  clientWidth: target.clientWidth,
                  overflowX: getComputedStyle(target).overflowX,
                  textOverflow: getComputedStyle(target).textOverflow,
                }
              : { kind: target == null ? String(target) : typeof target, value: String(target) }
            const findings = Array.isArray(row?.findings)
              ? row.findings.map((finding) => ({
                  type: finding.type ?? finding.rule ?? '',
                  detail: finding.detail ?? finding.message ?? '',
                }))
              : []
            return { target: targetInfo, findings }
          }),
        }
      })
      scanEvidence.available = result.available
      scanEvidence.findings = result.findings
    } catch (error) {
      scanEvidence.error = String(error)
    }
    await page.waitForTimeout(250)

    overlayEvidence = await page.evaluate(() => {
      const overlays = [...document.querySelectorAll('.impeccable-overlay')].map((element) => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return {
          className: element.className?.toString() ?? '',
          label: element.textContent?.replace(/\s+/g, ' ').trim().slice(0, 180) ?? '',
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
          visible: style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0,
          bounds: {
            left: Math.round(rect.left * 100) / 100,
            top: Math.round(rect.top * 100) / 100,
            width: Math.round(rect.width * 100) / 100,
            height: Math.round(rect.height * 100) / 100,
          },
        }
      })
      return {
        confirmed: overlays.some((item) => item.visible),
        visibleCount: overlays.filter((item) => item.visible).length,
        totalCount: overlays.length,
        detectorScriptPresent: Boolean(document.querySelector('script[src*="detect.js"]')),
        windowScan: typeof window.impeccableScanAsync === 'function' || typeof window.impeccableScan === 'function',
        elements: overlays,
      }
    })
    await page.screenshot({
      path: path.join(screenshots, `${safeName}.overlay.png`),
      fullPage: true,
    })
  } catch (error) {
    navigationError = String(error)
  }

  const consoleLogs = await Promise.all(consolePromises)
  const result = {
    name: view.name,
    component: view.component,
    url: `http://127.0.0.1:4177/components/${view.slug}`,
    viewport: { width: view.width, height: view.height },
    dark: view.dark,
    reducedMotion: view.reducedMotion,
    responseStatus,
    navigationError,
    preflight,
    injection,
    pageMeasurements,
    scanEvidence,
    overlayEvidence,
    consoleFindings: consoleLogs.filter((entry) => /\[impeccable\]|(?:anti-patterns found)|(?:buried-raster|line-length|edge-flush-cards|layout-transition|clipped-overflow-container|text-overflow|cramped-padding|ai-color-palette)/i.test(entry.text)),
    consoleLogs,
    pageErrors,
    screenshots: {
      baseline: `screenshots/${view.name}.baseline.png`,
      overlay: `screenshots/${view.name}.overlay.png`,
    },
    capturedAt: new Date().toISOString(),
  }
  writeJson(`${view.name}.json`, result)
  allResults.push(result)
  await context.close()
}

await browser.close()
writeJson('browser-summary.json', {
  startedAt,
  finishedAt: new Date().toISOString(),
  detectorUrl: `http://127.0.0.1:${server.port}/detect.js?token=<redacted>`,
  viewCount: allResults.length,
  views: allResults.map((result) => ({
    name: result.name,
    component: result.component,
    viewport: result.viewport,
    dark: result.dark,
    reducedMotion: result.reducedMotion,
    responseStatus: result.responseStatus,
    navigationError: result.navigationError,
    preflightSucceeded: result.preflight.succeeded,
    injectionSucceeded: result.injection.succeeded,
    scanAvailable: result.scanEvidence.available,
    scanCount: result.scanEvidence.findings.length,
    overlayConfirmed: result.overlayEvidence.confirmed,
    overlayVisibleCount: result.overlayEvidence.visibleCount,
    horizontalOverflow: result.pageMeasurements?.document.horizontalOverflow ?? null,
    scrollWidth: result.pageMeasurements?.document.scrollWidth ?? null,
    targetRightMax: Math.max(0, ...((result.pageMeasurements?.targets ?? []).map((item) => item.bounds.right))),
    pageErrorCount: result.pageErrors.length,
  })),
})
