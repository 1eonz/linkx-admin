import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require(
  resolve(
    process.cwd(),
    'other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright',
  ),
)

const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const outputDir = resolve(dirname(fileURLToPath(import.meta.url)), 'browser')
const sourcePaths = [
  'linkx-fe/src/components/LxTransferPanel/index.vue',
  'linkx-fe/src/components/LxTransferPanel/demo/basic.vue',
]
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

await mkdir(outputDir, { recursive: true })

async function sourceHashes() {
  return Object.fromEntries(
    await Promise.all(
      sourcePaths.map(async (path) => {
        const contents = await readFile(resolve(process.cwd(), path))
        return [path, createHash('sha256').update(contents).digest('hex')]
      }),
    ),
  )
}

async function capture(page, name, selector = '.transfer-panel-demo') {
  const path = resolve(outputDir, `${name}.png`)
  await page.locator(selector).screenshot({ path })
  return path
}

async function layoutMetrics(page) {
  return page.evaluate(() => {
    const demo = document.querySelector('.transfer-panel-demo')
    const transfer = demo?.querySelector('.lx-transfer-panel')
    const rect = (element) => {
      if (!element) return null
      const box = element.getBoundingClientRect()
      return {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }
    }
    return {
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      },
      demo: rect(demo),
      transfer: rect(transfer),
      panels: [...(transfer?.querySelectorAll('.lx-transfer-panel__panel') ?? [])].map(
        rect,
      ),
    }
  })
}

async function openSettings(page) {
  const details = page.locator('.transfer-panel-demo__settings')
  if (!(await details.evaluate((element) => element.open))) {
    await details.locator('summary').click()
  }
}

const beforeHashes = await sourceHashes()
const screenshots = {}
const observations = {}
const pageErrors = []
let browser
let browserVersion = null

try {
  browser = await chromium.launch({
    headless: true,
    executablePath: chromePath,
  })
  browserVersion = await browser.version()

  // 每次评估从新浏览器上下文进入目标页面，不沿用应用状态或存储。
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()
  page.on('pageerror', (error) => pageErrors.push(error.message))
  const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded' })
  await page.locator('.transfer-panel-demo').waitFor({ state: 'visible' })
  await openSettings(page)
  await page.waitForTimeout(250)

  observations.navigation = {
    status: response?.status() ?? null,
    title: await page.title(),
    context: 'new Playwright BrowserContext; no prior cookies or local storage',
  }
  screenshots.desktopLight = await capture(page, 'desktop-light-1440')
  observations.desktop = await layoutMetrics(page)

  observations.limit = await page.evaluate(() => {
    const button = document.querySelector(
      '.lx-transfer-panel__controls button[aria-label="全部加入"]',
    )
    const reasonId = button?.getAttribute('aria-describedby')
    const reason = reasonId ? document.getElementById(reasonId) : null
    return {
      selectedCount: document.querySelectorAll(
        '.lx-transfer-panel__selected-item',
      ).length,
      compactHint: document.querySelector(
        '[data-testid="select-all-compact-hint"]',
      )?.textContent?.trim(),
      buttonDisabled: Boolean(button?.disabled),
      buttonTitle: button?.getAttribute('title'),
      describedBy: reason?.textContent?.trim(),
      describedByRole: reason?.getAttribute('role'),
    }
  })
  screenshots.limitHint = await capture(page, 'limit-hint-5-of-5')

  const sourceFilter = page.locator('input[aria-label="筛选待选节点"]')
  await sourceFilter.fill('待授权特勤支队')
  await page.waitForTimeout(200)
  observations.limit.filteredNodeFound =
    (await page.getByText('待授权特勤支队', { exact: true }).count()) > 0
  const candidateCheckbox = page.locator(
    'input[aria-label="选择 待授权特勤支队"]',
  )
  if (await candidateCheckbox.count()) {
    await candidateCheckbox.click()
    await page.waitForTimeout(100)
    observations.limit.rejectedSelection =
      (await page.getByText('最多可选择 5 项', { exact: true }).count()) > 0
    observations.limit.selectionAfterAttempt = await page
      .getByTestId('selected-count')
      .innerText()
    const warning = page.locator('.el-message--warning').last()
    if (await warning.count()) {
      screenshots.limitWarning = await capture(
        page,
        'limit-warning-toast',
        '.el-message--warning',
      )
    }
  } else {
    observations.limit.rejectedSelection = null
    observations.limit.selectionAfterAttempt = null
  }
  await sourceFilter.fill('')

  observations.inheritDescription = await page.evaluate(() => {
    const checkbox = document.querySelector(
      '.lx-transfer-panel__inherit-control input[type="checkbox"]',
    )
    const id = checkbox?.getAttribute('aria-describedby')
    const description = id ? document.getElementById(id) : null
    return {
      visibleText: description?.textContent?.trim() ?? null,
      visible: Boolean(description && description.getClientRects().length),
      describedBy: id,
      resolved: Boolean(description),
    }
  })
  screenshots.inheritDescription = await capture(
    page,
    'inherit-child-description',
    '.lx-transfer-panel__inherit-control',
  )

  const summary = page.locator('.transfer-panel-demo__settings > summary')
  await summary.focus()
  for (let index = 0; index < 24; index += 1) {
    await page.keyboard.press('Tab')
    const isSourceFilterFocused = await sourceFilter.evaluate(
      (element) => document.activeElement === element,
    )
    if (isSourceFilterFocused) break
  }
  observations.keyboard = await page.evaluate(() => {
    const active = document.activeElement
    const style = active instanceof HTMLElement ? getComputedStyle(active) : null
    const container = active?.closest('.lx-transfer-panel__filter')
    const containerStyle = container ? getComputedStyle(container) : null
    return {
      activeTag: active?.tagName ?? null,
      activeLabel: active?.getAttribute('aria-label') ?? null,
      focusVisible: active?.matches(':focus-visible') ?? false,
      outlineStyle: style?.outlineStyle ?? null,
      outlineWidth: style?.outlineWidth ?? null,
      outlineOffset: style?.outlineOffset ?? null,
      focusContainerBoxShadow: containerStyle?.boxShadow ?? null,
      focusContainerBackground: containerStyle?.backgroundColor ?? null,
    }
  })
  screenshots.keyboardFocus = await capture(page, 'keyboard-focus-filter')
  await page.keyboard.press('Tab')
  observations.keyboard.treeItem = await page.evaluate(() => {
    const active = document.activeElement
    const style = active instanceof HTMLElement ? getComputedStyle(active) : null
    return {
      role: active?.getAttribute('role') ?? null,
      label: active?.getAttribute('aria-label') ?? active?.textContent?.trim() ?? null,
      focusVisible: active?.matches(':focus-visible') ?? false,
      outlineStyle: style?.outlineStyle ?? null,
      outlineWidth: style?.outlineWidth ?? null,
    }
  })
  screenshots.keyboardTree = await capture(page, 'keyboard-focus-tree-item')

  await page.setViewportSize({ width: 375, height: 900 })
  await page.waitForTimeout(150)
  screenshots.mobile375 = await capture(page, 'mobile-375-light')
  observations.mobile375 = await layoutMetrics(page)

  await page.setViewportSize({ width: 320, height: 900 })
  await page.waitForTimeout(150)
  screenshots.mobile320 = await capture(page, 'mobile-320-light')
  observations.mobile320 = await layoutMetrics(page)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.getByLabel('HUD 深色主题').check()
  await page.waitForTimeout(150)
  screenshots.desktopHud = await capture(page, 'desktop-hud-1440')
  observations.hud = {
    active: await page.getByLabel('HUD 深色主题').isChecked(),
    ...await layoutMetrics(page),
  }
  await page.getByLabel('HUD 深色主题').uncheck()

  await page.getByRole('button', { name: '空结果' }).click()
  await page.waitForTimeout(150)
  screenshots.empty = await capture(page, 'state-empty')
  observations.empty = {
    treeText: await page.locator('.lx-transfer-panel__tree').innerText(),
    treeNodeCount: await page.getByTestId('tree-node-count').innerText(),
    selectedCount: await page.getByTestId('selected-count').innerText(),
  }

  await page.getByRole('button', { name: '加载中' }).click()
  await page.waitForTimeout(150)
  screenshots.loading = await capture(page, 'state-loading')
  observations.loading = {
    ariaBusy: await page
      .locator('.transfer-panel-demo__surface')
      .getAttribute('aria-busy'),
    message: await page.getByRole('status').filter({ hasText: '组织权限数据加载中' }).innerText(),
  }

  await page.getByRole('button', { name: '加载失败' }).click()
  await page.waitForTimeout(150)
  screenshots.error = await capture(page, 'state-error')
  observations.error = {
    alert: await page.getByRole('alert').innerText(),
    retryVisible: await page.getByRole('button', { name: '重试' }).isVisible(),
    panelInert: await page
      .locator('.transfer-panel-demo__surface .lx-transfer-panel')
      .evaluate((element) => element.hasAttribute('inert')),
    selectionRetained: await page.getByTestId('selected-count').innerText(),
  }
  await page.getByRole('button', { name: '重试' }).click()
  observations.error.retryResult = await page.getByTestId('transfer-status').innerText()

  const reducedContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
  })
  const reducedPage = await reducedContext.newPage()
  await reducedPage.goto(targetUrl, { waitUntil: 'domcontentloaded' })
  await reducedPage.locator('.transfer-panel-demo').waitFor({ state: 'visible' })
  await openSettings(reducedPage)
  await reducedPage.waitForTimeout(150)
  screenshots.reducedMotion = await capture(
    reducedPage,
    'prefers-reduced-motion',
  )
  observations.reducedMotion = await reducedPage.evaluate(() => {
    const selectors = [
      '.lx-transfer-panel',
      '.lx-transfer-panel__panel',
      '.lx-transfer-panel__controls button',
      '.lx-transfer-panel__selected-item',
    ]
    return {
      mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      components: selectors.map((selector) => {
        const element = document.querySelector(selector)
        if (!element) return { selector, present: false }
        const style = getComputedStyle(element)
        return {
          selector,
          present: true,
          transitionDuration: style.transitionDuration,
          animationDuration: style.animationDuration,
          animationName: style.animationName,
        }
      }),
    }
  })

  await reducedContext.close()
  await context.close()
} finally {
  if (browser) await browser.close()
}

const afterHashes = await sourceHashes()
const evidence = {
  targetUrl,
  browser: { name: 'Google Chrome', version: browserVersion },
  hashes: { before: beforeHashes, after: afterHashes },
  hashesStable: JSON.stringify(beforeHashes) === JSON.stringify(afterHashes),
  screenshots,
  observations,
  pageErrors,
}
await writeFile(
  resolve(outputDir, 'browser-evidence.json'),
  `${JSON.stringify(evidence, null, 2)}\n`,
)
console.log(JSON.stringify(evidence, null, 2))
