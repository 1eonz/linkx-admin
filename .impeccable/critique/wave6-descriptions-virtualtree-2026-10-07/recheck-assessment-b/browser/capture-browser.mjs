import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(
  'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs',
).href)
const root = 'F:/work/linkx-admin'
const outDir = path.join(root, '.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/recheck-assessment-b/browser')
const screenshotDir = path.join(outDir, 'screenshots')
const base = 'http://127.0.0.1:4175'
const liveBase = 'http://127.0.0.1:8400'
const routes = [
  { id: 'cascader', route: '/components/lxcascader', selector: '.cascader-demo' },
  { id: 'descriptions', route: '/components/lxdescriptions', selector: '.lx-descriptions-demo' },
  { id: 'virtualtree', route: '/components/lxvirtualtree', selector: '.virtual-tree-demo' },
  { id: 'upload', route: '/components/lxupload', selector: '.lx-upload-demo' },
]

await fs.mkdir(screenshotDir, { recursive: true })
const evidence = {
  capturedAt: new Date().toISOString(),
  base,
  liveBase,
  browser: null,
  pages: [],
  screenshots: [],
  console: [],
  requests: [],
  overlay: [],
  interactions: [],
}
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})
evidence.browser = await browser.version()

async function screenshot(page, id) {
  const file = path.join(screenshotDir, id + '.png')
  await page.screenshot({ path: file, fullPage: false })
  evidence.screenshots.push(path.relative(outDir, file).replaceAll('\\', '/'))
}

async function metrics(page, selector) {
  return page.evaluate((target) => {
    const component = document.querySelector(target)
    const rect = component?.getBoundingClientRect()
    const overlays = [...document.querySelectorAll('.impeccable-overlay')]
    return {
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      },
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      theme: {
        dark: document.documentElement.classList.contains('dark'),
        hud: document.documentElement.classList.contains('lx-theme-hud'),
      },
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      component: rect ? {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        clientWidth: component.clientWidth,
        scrollWidth: component.scrollWidth,
        classes: component.className,
        background: getComputedStyle(component).backgroundColor,
      } : null,
      overlay: {
        total: overlays.length,
        visible: overlays.filter((node) => node.getBoundingClientRect().width > 0).length,
        banners: document.querySelectorAll('.impeccable-banner').length,
        labels: document.querySelectorAll('.impeccable-label').length,
      },
      activeElement: {
        tag: document.activeElement?.tagName || null,
        role: document.activeElement?.getAttribute?.('role') || null,
        text: (document.activeElement?.textContent || '').trim().slice(0, 120),
      },
    }
  }, selector)
}

async function inject(page, id) {
  const result = { id, url: liveBase + '/detect.js', preflight: false, injected: false, findings: [], console: [], overlay: null, error: null }
  try {
    result.preflight = await page.evaluate(() => {
      document.title = document.title + ' [Impeccable B]'
      document.documentElement.dataset.impeccablePreflight = 'ok'
      return document.documentElement.dataset.impeccablePreflight === 'ok'
    })
    await page.addScriptTag({ url: liveBase + '/detect.js' })
    result.injected = true
    await page.waitForTimeout(2200)
    result.findings = await page.evaluate(() => typeof window.impeccableDetect === 'function' ? window.impeccableDetect() : [])
    result.overlay = await page.evaluate(() => ({
      total: document.querySelectorAll('.impeccable-overlay').length,
      visible: [...document.querySelectorAll('.impeccable-overlay')].filter((node) => node.getBoundingClientRect().width > 0).length,
      labels: document.querySelectorAll('.impeccable-label').length,
      banner: document.querySelectorAll('.impeccable-banner').length,
      script: Boolean(document.querySelector('script[src*="/detect.js"]')),
    }))
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error)
  }
  return result
}

async function runPage(definition) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 860 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
  })
  const consoleItems = []
  const requestItems = []
  page.on('console', (message) => {
    const item = { type: message.type(), text: message.text(), url: page.url() }
    consoleItems.push(item)
    evidence.console.push({ id: definition.id, ...item })
  })
  page.on('pageerror', (error) => {
    const item = { type: 'pageerror', text: error.message, url: page.url() }
    consoleItems.push(item)
    evidence.console.push({ id: definition.id, ...item })
  })
  page.on('request', (request) => {
    const item = { method: request.method(), url: request.url(), kind: 'request' }
    requestItems.push(item)
    evidence.requests.push({ id: definition.id, ...item })
  })
  page.on('requestfailed', (request) => {
    const item = { method: request.method(), url: request.url(), kind: 'failed', failure: request.failure()?.errorText || 'unknown' }
    requestItems.push(item)
    evidence.requests.push({ id: definition.id, ...item })
  })
  const pageEvidence = { id: definition.id, route: definition.route, url: null, status: 'started', console: consoleItems, requests: requestItems, overlay: null, metrics: [] }
  try {
    await page.goto(base + definition.route, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.locator(definition.selector).first().waitFor({ state: 'visible', timeout: 20000 })
    await page.waitForTimeout(700)
    pageEvidence.url = page.url()
    pageEvidence.status = 'loaded'
    const overlay = await inject(page, definition.id)
    pageEvidence.overlay = overlay
    evidence.overlay.push(overlay)
    await page.locator(definition.selector).first().scrollIntoViewIfNeeded()
    await screenshot(page, definition.id + '-desktop-light-overlay')
    pageEvidence.metrics.push({ state: 'desktop-light-overlay', ...(await metrics(page, definition.selector)) })

    if (definition.id === 'descriptions') {
      await page.getByRole('button', { name: '双列', exact: true }).click()
      await page.getByRole('checkbox', { name: '网格边框', exact: true }).check()
      await page.getByRole('checkbox', { name: 'HUD 深色主题（整页）', exact: true }).check()
      await page.waitForTimeout(300)
      await screenshot(page, 'descriptions-desktop-hud-bordered')
      pageEvidence.metrics.push({ state: 'desktop-hud-bordered', ...(await metrics(page, definition.selector)) })
      const copy = page.getByRole('button', { name: /复制/ }).first()
      if (await copy.count()) {
        await copy.focus()
        evidence.interactions.push({ id: definition.id, action: 'copy-button-focus', focused: await copy.evaluate((el) => document.activeElement === el) })
      }
      await page.getByRole('button', { name: '空结果', exact: true }).click()
      await screenshot(page, 'descriptions-desktop-empty')
      pageEvidence.metrics.push({ state: 'desktop-empty', ...(await metrics(page, definition.selector)) })
      await page.setViewportSize({ width: 375, height: 812 })
      await page.waitForTimeout(300)
      await screenshot(page, 'descriptions-mobile-375-empty')
      pageEvidence.metrics.push({ state: 'mobile-375-empty', ...(await metrics(page, definition.selector)) })
    }

    if (definition.id === 'virtualtree') {
      await page.getByText('演示状态和更多操作', { exact: true }).click()
      await page.getByRole('checkbox', { name: 'HUD 深色主题', exact: true }).check()
      await page.getByRole('button', { name: '展开全部', exact: true }).click()
      const tree = page.locator('[role="tree"]').first()
      const firstTreeItem = tree.locator('[role="treeitem"]').first()
      await firstTreeItem.focus()
      const keyboardStates = []
      const readKeyboardState = async (step) => {
        keyboardStates.push({
          step,
          ...(await page.evaluate(() => {
            const active = document.activeElement
            const row = active?.closest?.('[role="treeitem"]')
            return {
              activeTag: active?.tagName || null,
              activeRole: active?.getAttribute?.('role') || null,
              treeKey: row?.getAttribute('data-lx-tree-key') || null,
              treeKeyType: row?.getAttribute('data-lx-tree-key-type') || null,
              level: row?.getAttribute('aria-level') || null,
              expanded: row?.getAttribute('aria-expanded') || null,
              checked: row?.getAttribute('aria-checked') || null,
              tabIndex: row?.getAttribute('tabindex') || null,
            }
          })),
        })
      }
      await readKeyboardState('initial')
      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(50)
      await readKeyboardState('ArrowDown')
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(50)
      await readKeyboardState('ArrowRight')
      await page.keyboard.press('Space')
      await page.waitForTimeout(50)
      await readKeyboardState('Space')
      evidence.interactions.push({
        id: definition.id,
        action: 'tree-keyboard',
        states: keyboardStates,
        selectedItems: await page.locator('[role="treeitem"][aria-checked="true"]').count(),
      })
      await screenshot(page, 'virtualtree-desktop-hud-keyboard')
      pageEvidence.metrics.push({ state: 'desktop-hud-keyboard', ...(await metrics(page, definition.selector)) })
      await page.getByRole('button', { name: '加载失败', exact: true }).click()
      await screenshot(page, 'virtualtree-desktop-error')
      pageEvidence.metrics.push({ state: 'desktop-error', ...(await metrics(page, definition.selector)) })
      await page.setViewportSize({ width: 375, height: 812 })
      await page.waitForTimeout(300)
      await screenshot(page, 'virtualtree-mobile-375-error-hud')
      pageEvidence.metrics.push({ state: 'mobile-375-error-hud', ...(await metrics(page, definition.selector)) })
    }

    if (definition.id === 'cascader') {
      await page.getByText('演示状态', { exact: true }).click()
      await page.getByRole('checkbox', { name: 'HUD 深色主题', exact: true }).check()
      await page.locator('input.el-input__inner').first().click()
      await page.waitForTimeout(300)
      await screenshot(page, 'cascader-desktop-hud-open')
      pageEvidence.metrics.push({ state: 'desktop-hud-open', ...(await metrics(page, definition.selector)) })
      await page.keyboard.press('Escape')
      await page.getByRole('button', { name: '失败', exact: true }).click()
      await screenshot(page, 'cascader-desktop-error')
      pageEvidence.metrics.push({ state: 'desktop-error', ...(await metrics(page, definition.selector)) })
      await page.setViewportSize({ width: 375, height: 812 })
      await page.waitForTimeout(300)
      await screenshot(page, 'cascader-mobile-375-error-hud')
      pageEvidence.metrics.push({ state: 'mobile-375-error-hud', ...(await metrics(page, definition.selector)) })
    }

    if (definition.id === 'upload') {
      await page.getByRole('checkbox', { name: '文档站整体深色（HUD）', exact: true }).check()
      await page.getByRole('button', { name: '紧凑标签', exact: true }).click()
      await page.locator('input[type="file"]').first().setInputFiles({
        name: 'schedule.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('unit,date\nA,2026-10-07\n'),
      })
      await page.getByRole('button', { name: '上传全部待传文件', exact: true }).click()
      await page.waitForTimeout(1800)
      await screenshot(page, 'upload-desktop-hud-success')
      pageEvidence.metrics.push({ state: 'desktop-hud-success', ...(await metrics(page, definition.selector)) })
      await page.setViewportSize({ width: 375, height: 812 })
      await page.waitForTimeout(300)
      await screenshot(page, 'upload-mobile-375-hud-success')
      pageEvidence.metrics.push({ state: 'mobile-375-hud-success', ...(await metrics(page, definition.selector)) })
    }
    pageEvidence.status = 'complete'
  } catch (error) {
    pageEvidence.status = 'failed'
    pageEvidence.error = error instanceof Error ? error.stack || error.message : String(error)
    try { await screenshot(page, definition.id + '-failure') } catch {}
  } finally {
    evidence.pages.push(pageEvidence)
    await page.close()
  }
}

try {
  for (const definition of routes) await runPage(definition)
} finally {
  await fs.writeFile(path.join(outDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  await fs.writeFile(path.join(outDir, 'browser-console.json'), JSON.stringify(evidence.console, null, 2) + '\n', 'utf8')
  await fs.writeFile(path.join(outDir, 'browser-requests.json'), JSON.stringify(evidence.requests, null, 2) + '\n', 'utf8')
  await fs.writeFile(path.join(outDir, 'overlay-results.json'), JSON.stringify(evidence.overlay, null, 2) + '\n', 'utf8')
  await browser.close()
}

console.log(JSON.stringify({
  browser: evidence.browser,
  pages: evidence.pages.map((page) => ({ id: page.id, status: page.status, error: page.error || null })),
  overlay: evidence.overlay.map((item) => ({ id: item.id, injected: item.injected, error: item.error, findings: item.findings.length, overlay: item.overlay })),
  screenshots: evidence.screenshots.length,
  failedRequests: evidence.requests.filter((item) => item.kind === 'failed').length,
}, null, 2))
