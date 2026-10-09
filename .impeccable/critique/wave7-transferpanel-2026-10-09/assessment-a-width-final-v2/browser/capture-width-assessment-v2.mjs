import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const projectRequire = createRequire(path.resolve(process.cwd(), 'package.json'))
const { chromium } = projectRequire('@playwright/test')
const outputDir = path.resolve(
  process.cwd(),
  '../../.impeccable/critique/wave7-transferpanel-2026-10-09/assessment-a-width-final-v2/browser',
)
const repoRoot = path.resolve(process.cwd(), '../..')
const sourceFiles = {
  component: path.join(repoRoot, 'linkx-fe/src/components/LxTransferPanel/index.vue'),
  demo: path.join(repoRoot, 'linkx-fe/src/components/LxTransferPanel/demo/basic.vue'),
}
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'

async function sourceHashes() {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(sourceFiles).map(async ([name, file]) => [
        name,
        createHash('sha256')
          .update(await readFile(file))
          .digest('hex')
          .toUpperCase(),
      ]),
    ),
  )
}

const browser = await chromium.launch({
  headless: true,
  executablePath:
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
})
const context = await browser.newContext({
  colorScheme: 'light',
  reducedMotion: 'reduce',
})
const pageErrors = []
const diagnostics = []

async function capture(name, viewport, selectedPanel) {
  const page = await context.newPage()
  const diagnostic = {
    name,
    pageErrors: [],
    consoleErrors: [],
    failedResponses: [],
    failedRequests: [],
  }
  page.on('pageerror', (error) => diagnostic.pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') {
      diagnostic.consoleErrors.push(message.text())
    }
  })
  page.on('response', (response) => {
    if (response.status() >= 400) {
      diagnostic.failedResponses.push({
        status: response.status(),
        url: response.url(),
        resourceType: response.request().resourceType(),
      })
    }
  })
  page.on('requestfailed', (request) => {
    diagnostic.failedRequests.push({
      url: request.url(),
      error: request.failure()?.errorText ?? 'unknown',
    })
  })
  try {
    await page.setViewportSize(viewport)
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 })
    await page.evaluate(() => document.fonts.ready)
    const component = page.locator('.lx-transfer-panel').first()
    await component.waitFor({ state: 'visible', timeout: 15000 })
    if (selectedPanel) {
      await page.locator('.lx-transfer-panel__mobile-switch button').nth(1).click()
    }
    await component.scrollIntoViewIfNeeded()
    await page.waitForTimeout(200)
    const measurements = await page.evaluate(() => {
      const bounds = (element) => {
        if (!element) return null
        const { x, y, width, height, top, right, bottom, left } =
          element.getBoundingClientRect()
        return { x, y, width, height, top, right, bottom, left }
      }
      const intersects = (first, second) =>
        first &&
        second &&
        first.left < second.right &&
        first.right > second.left &&
        first.top < second.bottom &&
        first.bottom > second.top
      const root = document.querySelector('.lx-transfer-panel')
      const surface = document.querySelector('.transfer-panel-demo__surface')
      const panels = [...(root?.querySelectorAll('.lx-transfer-panel__panel') ?? [])]
      const selectedList = root?.querySelector('.lx-transfer-panel__selected')
      const selectedListVisible = Boolean(
        selectedList &&
          getComputedStyle(selectedList).display !== 'none' &&
          selectedList.getBoundingClientRect().width > 0,
      )
      const selectedItems = [
        ...(root?.querySelectorAll('.lx-transfer-panel__selected-item') ?? []),
      ]
      const titles = panels.map((panel) => {
        const title = panel.querySelector('.lx-transfer-panel__title')
        const actions = panel.querySelector('.lx-transfer-panel__header-actions')
        const scopeAction = panel.querySelector(
          '.lx-transfer-panel__scope-actions summary',
        )
        const titleBox = bounds(title)
        const actionsBox = bounds(actions)
        const scopeActionBox = bounds(scopeAction)
        return {
          text: title?.textContent?.trim(),
          visible: getComputedStyle(panel).display !== 'none' && panel.getBoundingClientRect().width > 0,
          truncated: Boolean(title && title.scrollWidth > title.clientWidth + 1),
          clientWidth: title?.clientWidth ?? 0,
          scrollWidth: title?.scrollWidth ?? 0,
          whiteSpace: title ? getComputedStyle(title).whiteSpace : null,
          textOverflow: title ? getComputedStyle(title).textOverflow : null,
          titleBounds: titleBox,
          actionsBounds: actionsBox,
          scopeActionBounds: scopeActionBox,
          overlapsActions: intersects(titleBox, actionsBox),
          overlapsScopeAction: intersects(titleBox, scopeActionBox),
        }
      })
      const rows = selectedItems.map((item) => {
        const name = item.querySelector('.lx-transfer-panel__selected-name')
        return {
          text: name?.textContent?.trim(),
          bounds: bounds(item),
          nameBounds: bounds(name),
          nameLineHeight: name ? getComputedStyle(name).lineHeight : null,
          fullyVisible: Boolean(
            selectedListVisible &&
              item.getBoundingClientRect().top >= selectedList.getBoundingClientRect().top &&
              item.getBoundingClientRect().bottom <= selectedList.getBoundingClientRect().bottom,
          ),
        }
      })
      const rootBox = bounds(root)
      const surfaceBox = bounds(surface)
      const visiblePanels = panels.filter(
        (panel) => getComputedStyle(panel).display !== 'none' && panel.getBoundingClientRect().width > 0,
      )
      const mobileButtons = [
        ...(root?.querySelectorAll('.lx-transfer-panel__mobile-switch button') ?? []),
      ]
      return {
        url: location.href,
        viewport: { width: innerWidth, height: innerHeight },
        document: {
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyClientWidth: document.body.clientWidth,
          bodyScrollWidth: document.body.scrollWidth,
        },
        surface: surfaceBox,
        component: rootBox,
        componentWithinViewport: Boolean(
          rootBox && rootBox.left >= 0 && rootBox.right <= innerWidth,
        ),
        visiblePanelWidths: visiblePanels.map((panel) => bounds(panel)?.width),
        titleAndActionLayout: titles,
        selectedList: {
          visible: selectedListVisible,
          bounds: bounds(selectedList),
          clientHeight: selectedList?.clientHeight ?? 0,
          scrollHeight: selectedList?.scrollHeight ?? 0,
          itemCount: selectedItems.length,
          fullyVisibleRows: rows.filter((row) => row.fullyVisible).length,
          rows,
        },
        mobileSwitches: mobileButtons.map((button) => ({
          text: button.textContent?.trim(),
          ariaPressed: button.getAttribute('aria-pressed'),
          bounds: bounds(button),
          height: button.getBoundingClientRect().height,
        })),
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      }
    })
    await page.screenshot({ path: path.join(outputDir, name), animations: 'disabled' })
    return measurements
  } finally {
    diagnostics.push(diagnostic)
    pageErrors.push(...diagnostic.pageErrors.map((message) => `${name}: ${message}`))
    await page.close()
  }
}

await mkdir(outputDir, { recursive: true })
const captures = {}
try {
  captures.browser = { engine: 'Microsoft Edge', version: browser.version() }
  captures.target = targetUrl
  captures.sourceHashesBefore = await sourceHashes()
  captures.desktop1440 = await capture('desktop-1440x900.png', {
    width: 1440,
    height: 900,
  })
  captures.desktop1024 = await capture('desktop-1024x900.png', {
    width: 1024,
    height: 900,
  })
  captures.mobile390Source = await capture(
    'mobile-390x844-source.png',
    { width: 390, height: 844 },
  )
  captures.mobile390Selected = await capture(
    'mobile-390x844-selected.png',
    { width: 390, height: 844 },
    true,
  )
  captures.mobile320Source = await capture(
    'mobile-320x844-source.png',
    { width: 320, height: 844 },
  )
  captures.mobile320Selected = await capture(
    'mobile-320x844-selected.png',
    { width: 320, height: 844 },
    true,
  )
  captures.pageErrors = pageErrors
  captures.diagnostics = diagnostics
  captures.sourceHashesAfter = await sourceHashes()
  if (
    JSON.stringify(captures.sourceHashesBefore) !==
    JSON.stringify(captures.sourceHashesAfter)
  ) {
    throw new Error('源码在浏览器采集期间发生变化')
  }
  captures.capturedAt = new Date().toISOString()
  await writeFile(
    path.join(outputDir, 'browser-evidence.json'),
    `${JSON.stringify(captures, null, 2)}\n`,
  )
  process.stdout.write(`${JSON.stringify(captures, null, 2)}\n`)
} finally {
  await context.close()
  await browser.close()
}
