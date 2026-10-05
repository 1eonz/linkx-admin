import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const evidenceDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(evidenceDir, '../../../../../')
const require = createRequire(
  path.join(projectRoot, 'other-admin/admin-vue3/package.json'),
)
const { chromium } = require('@playwright/test')
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const origin = 'http://127.0.0.1:4195'
const detectorUrl = 'http://localhost:8400/detect.js'
const staticDetectorPath =
  'C:\\Users\\Administrator\\.codex\\skills\\impeccable\\scripts\\detect.mjs'
const browserCommand = `node "${fileURLToPath(import.meta.url)}"`
const routes = [
  { key: 'html', path: '/components/lxswitch.html' },
  { key: 'extensionless', path: '/components/lxswitch' },
]

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
})
const result = {
  runAt: new Date().toISOString(),
  targetOrigin: origin,
  detectorUrl,
  browser: {
    name: 'Chrome',
    version: browser.version(),
    executablePath: chromePath,
  },
  server: { expectedOwner: '既有 VitePress 服务；本复验未启动或停止服务' },
  command: browserCommand,
  detectorRuns: [],
  mobile: [],
  desktop: [],
}

await fs.writeFile(
  path.join(evidenceDir, 'recheck-375-browser-command.txt'),
  `${browserCommand}\n`,
)

async function runStaticDetector(name, relativeTarget) {
  const command = `node "${staticDetectorPath}" --json "${relativeTarget}"`
  const child = spawnSync(
    'node',
    [staticDetectorPath, '--json', relativeTarget],
    { cwd: projectRoot, encoding: 'utf8' },
  )
  const stdout = child.stdout ?? ''
  const stderr = child.stderr ?? (child.error ? `${child.error.message}\n` : '')
  const exitCode = child.status ?? 1
  await fs.writeFile(
    path.join(evidenceDir, `recheck-detector-${name}.stdout.json`),
    stdout,
  )
  await fs.writeFile(
    path.join(evidenceDir, `recheck-detector-${name}.stderr.txt`),
    stderr,
  )
  await fs.writeFile(
    path.join(evidenceDir, `recheck-detector-${name}.exit-code.txt`),
    `${exitCode}\n`,
  )
  await fs.writeFile(
    path.join(evidenceDir, `recheck-detector-${name}.command.txt`),
    `${command}\n`,
  )
  return {
    name,
    target: relativeTarget,
    command,
    exitCode,
    stderrBytes: Buffer.byteLength(stderr),
    stdoutBytes: Buffer.byteLength(stdout),
  }
}

async function measure(page, phase) {
  return page.evaluate((phaseName) => {
    const root = document.documentElement
    const detectorSelector =
      '.impeccable-overlay, .impeccable-label, .impeccable-tooltip, [id^="impeccable-live-"]'
    const pathFor = (element) => {
      const parts = []
      let current = element
      while (
        current &&
        current.nodeType === Node.ELEMENT_NODE &&
        parts.length < 7
      ) {
        let part = current.tagName.toLowerCase()
        if (current.id) {
          part += `#${current.id}`
          parts.unshift(part)
          break
        }
        if (typeof current.className === 'string' && current.className.trim()) {
          part += `.${current.className.trim().split(/\s+/).slice(0, 3).join('.')}`
        }
        if (current.parentElement) {
          const siblings = Array.from(current.parentElement.children).filter(
            (sibling) => sibling.tagName === current.tagName,
          )
          if (siblings.length > 1)
            part += `:nth-of-type(${siblings.indexOf(current) + 1})`
        }
        parts.unshift(part)
        current = current.parentElement
      }
      return parts.join(' > ')
    }
    const elements = Array.from(document.querySelectorAll('*'))
    const overflowNodes = elements
      .filter((element) => element.scrollWidth > element.clientWidth)
      .map((element) => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return {
          selector: pathFor(element),
          tag: element.tagName.toLowerCase(),
          id: element.id || null,
          className:
            typeof element.className === 'string' ? element.className : '',
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          excessWidth: element.scrollWidth - element.clientWidth,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          overflowX: style.overflowX,
          position: style.position,
          rect: {
            left: Math.round(rect.left * 100) / 100,
            right: Math.round(rect.right * 100) / 100,
            width: Math.round(rect.width * 100) / 100,
          },
          extendsPastDocumentClientWidth: rect.right > root.clientWidth + 1,
          detectorOwned: Boolean(
            element.matches(detectorSelector) ||
            element.closest(detectorSelector),
          ),
          visible:
            element.getClientRects().length > 0 &&
            style.visibility !== 'hidden' &&
            style.display !== 'none',
          text: (element.innerText || element.textContent || '')
            .trim()
            .replace(/\s+/g, ' ')
            .slice(0, 100),
          html: element.outerHTML.slice(0, 280),
        }
      })
    const outOfBounds = elements
      .map((element) => {
        const rect = element.getBoundingClientRect()
        if (
          rect.width === 0 ||
          rect.height === 0 ||
          rect.right <= root.clientWidth + 1
        )
          return null
        const style = getComputedStyle(element)
        return {
          selector: pathFor(element),
          tag: element.tagName.toLowerCase(),
          id: element.id || null,
          className:
            typeof element.className === 'string' ? element.className : '',
          rect: {
            left: Math.round(rect.left * 100) / 100,
            right: Math.round(rect.right * 100) / 100,
            width: Math.round(rect.width * 100) / 100,
          },
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          overflowX: style.overflowX,
          detectorOwned: Boolean(
            element.matches(detectorSelector) ||
            element.closest(detectorSelector),
          ),
          text: (element.innerText || element.textContent || '')
            .trim()
            .replace(/\s+/g, ' ')
            .slice(0, 100),
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.rect.right - a.rect.right)

    return {
      phase: phaseName,
      url: location.href,
      viewport: { innerWidth, innerHeight, outerWidth, outerHeight },
      visualViewport: window.visualViewport
        ? {
            width: visualViewport.width,
            height: visualViewport.height,
            scale: visualViewport.scale,
          }
        : null,
      screen: { width: screen.width, height: screen.height },
      devicePixelRatio,
      mobileSignals: {
        coarsePointer: matchMedia('(pointer: coarse)').matches,
        maxTouchPoints: navigator.maxTouchPoints,
      },
      viewportMeta:
        document.querySelector('meta[name="viewport"]')?.content ?? null,
      documentElement: {
        clientWidth: root.clientWidth,
        scrollWidth: root.scrollWidth,
        scrollHeight: root.scrollHeight,
      },
      body: {
        clientWidth: document.body.clientWidth,
        scrollWidth: document.body.scrollWidth,
        scrollHeight: document.body.scrollHeight,
      },
      overlay: {
        bannerCount: document.querySelectorAll('.impeccable-banner').length,
        markerCount: document.querySelectorAll(
          '.impeccable-overlay:not(.impeccable-banner)',
        ).length,
        hiddenClass: document.body.classList.contains('impeccable-hidden'),
      },
      hasHorizontalPageOverflow: root.scrollWidth > root.clientWidth,
      overflowingNodeCount: overflowNodes.length,
      overflowingNodes: overflowNodes,
      beyondDocumentClientWidthCount: outOfBounds.length,
      beyondDocumentClientWidthNodes: outOfBounds,
    }
  }, phase)
}

async function saveScreenshot(page, name) {
  await page.screenshot({ path: path.join(evidenceDir, name), fullPage: false })
}

async function runMobile(route) {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    colorScheme: 'light',
  })
  const page = await context.newPage()
  const consoleEvents = []
  page.on('console', (message) =>
    consoleEvents.push({ type: message.type(), text: message.text() }),
  )
  const response = await page.goto(`${origin}${route.path}`, {
    waitUntil: 'domcontentloaded',
    timeout: 20000,
  })
  await page
    .locator('.lx-switch-demo')
    .waitFor({ state: 'visible', timeout: 15000 })
  await page.evaluate(() => document.fonts.ready)

  const phases = []
  phases.push(await measure(page, 'before-injection'))
  await saveScreenshot(page, `recheck-375-${route.key}-01-before.png`)

  await page.addScriptTag({ url: detectorUrl, timeout: 15000 })
  phases.push(await measure(page, 'injection-immediate'))
  await page.waitForTimeout(2500)
  phases.push(await measure(page, 'injection-settled-2500ms'))
  await saveScreenshot(page, `recheck-375-${route.key}-02-settled.png`)

  const toggle = page.locator(
    '.impeccable-banner button[title="Toggle overlay visibility"]',
  )
  const toggleCount = await toggle.count()
  if (toggleCount !== 1)
    throw new Error(
      `${route.path}: expected one detector overlay visibility control, found ${toggleCount}`,
    )
  await toggle.click()
  phases.push(await measure(page, 'overlay-hidden-via-detector-toggle'))
  await saveScreenshot(page, `recheck-375-${route.key}-03-overlay-hidden.png`)

  await toggle.click()
  const dismiss = page.locator(
    '.impeccable-banner button[title="Dismiss banner"]',
  )
  const dismissCount = await dismiss.count()
  if (dismissCount !== 1)
    throw new Error(
      `${route.path}: expected one detector banner dismiss control, found ${dismissCount}`,
    )
  await dismiss.click()
  phases.push(await measure(page, 'banner-dismissed-via-detector-close'))
  await saveScreenshot(page, `recheck-375-${route.key}-04-banner-dismissed.png`)

  result.mobile.push({
    route: route.path,
    requestedContext: {
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    },
    httpStatus: response?.status() ?? null,
    finalUrl: page.url(),
    screenshotFiles: [
      `recheck-375-${route.key}-01-before.png`,
      `recheck-375-${route.key}-02-settled.png`,
      `recheck-375-${route.key}-03-overlay-hidden.png`,
      `recheck-375-${route.key}-04-banner-dismissed.png`,
    ],
    phases,
    consoleEvents,
  })
  await context.close()
}

async function runDesktop(route) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  })
  const page = await context.newPage()
  const consoleEvents = []
  page.on('console', (message) =>
    consoleEvents.push({ type: message.type(), text: message.text() }),
  )
  const response = await page.goto(`${origin}${route.path}`, {
    waitUntil: 'domcontentloaded',
    timeout: 20000,
  })
  await page
    .locator('.lx-switch-demo')
    .waitFor({ state: 'visible', timeout: 15000 })
  await page.evaluate(() => document.fonts.ready)
  const phases = [await measure(page, 'desktop-before-injection')]
  await page.addScriptTag({ url: detectorUrl, timeout: 15000 })
  await page.waitForTimeout(2500)
  phases.push(await measure(page, 'desktop-injection-settled-2500ms'))
  await saveScreenshot(page, `recheck-1280-${route.key}-detector.png`)
  result.desktop.push({
    route: route.path,
    requestedContext: {
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
    },
    httpStatus: response?.status() ?? null,
    finalUrl: page.url(),
    screenshotFile: `recheck-1280-${route.key}-detector.png`,
    phases,
    consoleEvents,
  })
  await context.close()
}

try {
  for (const [name, target] of [
    ['component', 'linkx-fe/src/components/LxSwitch/index.vue'],
    ['demo', 'linkx-fe/src/components/LxSwitch/demo/basic.vue'],
    ['doc', 'linkx-fe/docs/components/lxswitch.md'],
  ]) {
    result.detectorRuns.push(await runStaticDetector(name, target))
  }
  for (const route of routes) await runMobile(route)
  for (const route of routes) await runDesktop(route)
  await fs.writeFile(
    path.join(evidenceDir, 'recheck-375-dom-measurements.json'),
    `${JSON.stringify(result, null, 2)}\n`,
  )
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
} catch (error) {
  result.error =
    error instanceof Error
      ? { message: error.message, stack: error.stack }
      : String(error)
  await fs.writeFile(
    path.join(evidenceDir, 'recheck-375-dom-measurements.json'),
    `${JSON.stringify(result, null, 2)}\n`,
  )
  process.stderr.write(`${JSON.stringify(result.error, null, 2)}\n`)
  process.exitCode = 1
} finally {
  await browser.close()
}

await fs.writeFile(
  path.join(evidenceDir, 'recheck-375-browser.exit-code.txt'),
  `${process.exitCode ?? 0}\n`,
)
