import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from '../../../../other-admin/admin-vue3/node_modules/@playwright/test/index.mjs'

const baseUrl = 'http://127.0.0.1:5187/components/lxtransferpanel'
const overlayUrl = 'http://127.0.0.1:8400/detect.js'
const outputDir = fileURLToPath(new URL('./', import.meta.url))
const screenshotDir = `${outputDir}screenshots/`
mkdirSync(screenshotDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
})
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const requests = []
const failedRequests = []
const consoleMessages = []
const pageErrors = []

page.on('request', (request) => {
  requests.push({
    url: request.url(),
    method: request.method(),
    resourceType: request.resourceType(),
  })
})
page.on('requestfailed', (request) => {
  failedRequests.push({ url: request.url(), failure: request.failure() })
})
page.on('console', (message) => {
  consoleMessages.push({
    type: message.type(),
    text: message.text(),
    location: message.location(),
  })
})
page.on('pageerror', (error) => {
  pageErrors.push(String(error))
})

function localRequest(url) {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'data:' ||
      parsed.protocol === 'blob:' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === 'localhost' ||
      parsed.hostname === '[::1]'
    )
  } catch {
    return true
  }
}

async function waitForPage() {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('.transfer-panel-demo__toolbar')
  await page.waitForTimeout(250)
}

async function preflightAndInject(viewName) {
  const preflight = await page.evaluate(() => {
    document.querySelectorAll('.impeccable-overlay').forEach((element) => element.remove())
    const baseTitle = document.title.replace(/^(?:\[Assessment B\]\s*)+/, '')
    document.title = `[Assessment B] ${baseTitle}`
    const probe = document.createElement('script')
    probe.dataset.assessmentBProbe = 'mutation'
    probe.textContent = 'window.__assessmentBMutationProbe = true'
    document.head.appendChild(probe)
    const result = {
      title: document.title,
      scriptAppended: document.head.contains(probe),
      mutationProbe: window.__assessmentBMutationProbe === true,
    }
    probe.remove()
    return result
  })

  let addScriptError = null
  try {
    await page.addScriptTag({ url: overlayUrl })
  } catch (error) {
    addScriptError = String(error)
  }
  await page.waitForTimeout(2600)
  const overlay = await page.evaluate(async (name) => {
    let findings = null
    let scanError = null
    try {
      if (typeof window.impeccableScanAsync === 'function') {
        findings = await window.impeccableScanAsync()
      } else if (typeof window.impeccableScan === 'function') {
        findings = window.impeccableScan()
      }
    } catch (error) {
      scanError = String(error)
    }
    const scriptTags = [...document.scripts].map((script) => script.src)
    return {
      scriptTagPresent: scriptTags.some((src) => src.startsWith('http://127.0.0.1:8400/detect.js')),
      detectorFunction: typeof window.impeccableScan === 'function',
      detectorRan: findings !== null,
      scanError,
      findings: Array.isArray(findings) ? findings : null,
      overlayCount: document.querySelectorAll('.impeccable-overlay').length,
      findingOverlayCount: document.querySelectorAll('.impeccable-overlay:not(.impeccable-banner)').length,
      bannerText: document.querySelector('.impeccable-banner')?.textContent?.trim() ?? null,
      viewName: name,
    }
  }, viewName)
  return { preflight, addScriptError, overlay }
}

async function rectOf(selector) {
  return page.evaluate((target) => {
    const element = document.querySelector(target)
    if (!element) return null
    const box = element.getBoundingClientRect()
    return {
      x: Math.round(box.x * 100) / 100,
      y: Math.round(box.y * 100) / 100,
      width: Math.round(box.width * 100) / 100,
      height: Math.round(box.height * 100) / 100,
    }
  }, selector)
}

async function runtimeSnapshot(viewName) {
  return page.evaluate((name) => {
    const root = document.querySelector('.lx-transfer-panel')
    const panels = [...document.querySelectorAll('.lx-transfer-panel__panel')]
    const firstFocusable = document.activeElement
    const rootBox = root?.getBoundingClientRect()
    const firstPanelBox = panels[0]?.getBoundingClientRect()
    const secondPanelBox = panels[1]?.getBoundingClientRect()
    const style = root ? getComputedStyle(root) : null
    return {
      viewName: name,
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      },
      layout: {
        root: rootBox
          ? { width: rootBox.width, height: rootBox.height }
          : null,
        gridTemplateColumns: style?.gridTemplateColumns ?? null,
        gap: style?.gap ?? null,
        panels: [firstPanelBox, secondPanelBox].map((box) =>
          box ? { width: box.width, height: box.height } : null,
        ),
      },
      state: {
        status: document.querySelector('[data-testid="transfer-status"]')?.textContent?.trim() ?? null,
        message: document.querySelector('.transfer-panel-demo__message')?.textContent?.trim() ?? null,
        messageRole: document.querySelector('.transfer-panel-demo__message')?.getAttribute('role') ?? null,
        selectedCount: document.querySelector('[data-testid="selected-count"]')?.textContent?.trim() ?? null,
        selectedItems: [...document.querySelectorAll('.lx-transfer-panel__selected-item')].map((item) => item.textContent?.trim() ?? ''),
        selectedEmpty: document.querySelector('.lx-transfer-panel__empty')?.textContent?.trim() ?? null,
        treeEmpty: document.querySelector('.lx-virtual-tree__empty')?.textContent?.trim() ?? null,
      },
      theme: {
        hud: document.querySelector('.transfer-panel-demo')?.classList.contains('lx-theme-hud') ?? false,
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        panelBackground: panels[0] ? getComputedStyle(panels[0]).backgroundColor : null,
        rootColor: root ? getComputedStyle(root).color : null,
        transitions: [...document.querySelectorAll('.lx-transfer-panel__controls button, .lx-transfer-panel__selected-item')]
          .slice(0, 4)
          .map((element) => getComputedStyle(element).transitionDuration),
      },
      focus: firstFocusable
        ? {
            tag: firstFocusable.tagName,
            role: firstFocusable.getAttribute('role'),
            ariaLabel: firstFocusable.getAttribute('aria-label'),
            text: firstFocusable.textContent?.trim() ?? '',
            outline: getComputedStyle(firstFocusable).outline,
          }
        : null,
    }
  }, viewName)
}

async function capture(viewName, fileName) {
  const injection = await preflightAndInject(viewName)
  const runtime = await runtimeSnapshot(viewName)
  await page.screenshot({ path: `${screenshotDir}${fileName}`, fullPage: true })
  return { viewName, fileName, injection, runtime }
}

const evidence = {
  route: baseUrl,
  overlayUrl,
  startedAt: new Date().toISOString(),
  views: [],
  keyboard: null,
  requests: null,
  console: null,
  pageErrors,
}

await waitForPage()
evidence.views.push(await capture('desktop-light-initial', 'desktop-light-initial.png'))

const hudToggle = page.getByLabel('HUD 深色主题')
await hudToggle.check()
await page.waitForTimeout(250)
evidence.views.push(await capture('desktop-hud', 'desktop-hud.png'))

const keyboard = await page.evaluate(() => {
  const focusables = [...document.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])')]
  const results = []
  for (let index = 0; index < Math.min(focusables.length, 14); index += 1) {
    const element = focusables[index]
    element.focus()
    const box = element.getBoundingClientRect()
    results.push({
      index,
      tag: element.tagName,
      ariaLabel: element.getAttribute('aria-label'),
      text: element.textContent?.trim() ?? '',
      focused: document.activeElement === element,
      outline: getComputedStyle(element).outline,
      rect: { width: box.width, height: box.height },
    })
  }
  return { focusableCount: focusables.length, sequence: results }
})
evidence.keyboard = keyboard
await page.screenshot({ path: `${screenshotDir}desktop-keyboard-focus.png`, fullPage: true })

await page.getByRole('button', { name: '加载中' }).click()
await page.waitForTimeout(120)
evidence.views.push(await capture('state-loading', 'state-loading.png'))

await page.getByRole('button', { name: '加载失败' }).click()
await page.waitForTimeout(120)
evidence.views.push(await capture('state-error', 'state-error.png'))

await page.getByRole('button', { name: '重试' }).click()
await page.getByRole('button', { name: '空结果' }).click()
await page.waitForTimeout(120)
evidence.views.push(await capture('state-empty', 'state-empty.png'))

await page.getByRole('button', { name: '正常数据' }).click()
await page.setViewportSize({ width: 375, height: 812 })
await waitForPage()
evidence.views.push(await capture('mobile-375-light', 'mobile-375-light.png'))

await page.emulateMedia({ reducedMotion: 'reduce' })
await page.waitForTimeout(120)
evidence.views.push(await capture('mobile-375-reduced-motion', 'mobile-375-reduced-motion.png'))

const externalRequests = requests.filter((entry) => !localRequest(entry.url))
evidence.requests = {
  total: requests.length,
  externalCount: externalRequests.length,
  external: externalRequests,
  failed: failedRequests,
}
evidence.console = {
  total: consoleMessages.length,
  impeccable: consoleMessages.filter((entry) => entry.text.includes('[impeccable]')),
  all: consoleMessages,
}
evidence.finishedAt = new Date().toISOString()
writeFileSync(`${outputDir}browser-evidence.json`, JSON.stringify(evidence, null, 2))
writeFileSync(`${outputDir}runtime.json`, JSON.stringify({
  route: baseUrl,
  viewportFinal: { width: 375, height: 812 },
  viewCount: evidence.views.length,
  overlayInjections: evidence.views.map((view) => ({
    viewName: view.viewName,
    preflight: view.injection.preflight,
    addScriptError: view.injection.addScriptError,
    overlay: view.injection.overlay,
  })),
  keyboard,
  requests: evidence.requests,
  console: evidence.console,
  pageErrors,
}, null, 2))
await browser.close()
console.log(JSON.stringify({
  route: baseUrl,
  viewCount: evidence.views.length,
  findingsByView: evidence.views.map((view) => ({
    view: view.viewName,
    detectorRan: view.injection.overlay.detectorRan,
    count: view.injection.overlay.findings?.length ?? null,
    overlays: view.injection.overlay.findingOverlayCount,
  })),
  externalRequestCount: evidence.requests.externalCount,
  pageErrors: pageErrors.length,
}, null, 2))
