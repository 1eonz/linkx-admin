import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const projectRequire = createRequire(path.resolve(process.cwd(), 'package.json'))
const { chromium } = projectRequire('@playwright/test')
const outputDir = path.resolve(
  process.cwd(),
  '../../.impeccable/critique/wave7-transferpanel-2026-10-09/assessment-a-final-v4/browser',
)
const repoRoot = path.resolve(process.cwd(), '../..')
const sourceFiles = {
  component: path.join(repoRoot, 'linkx-fe/src/components/LxTransferPanel/index.vue'),
  demo: path.join(repoRoot, 'linkx-fe/src/components/LxTransferPanel/demo/basic.vue'),
  docs: path.join(repoRoot, 'linkx-fe/docs/components/lxtransferpanel.md'),
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
const diagnostics = []

async function capture(name, viewport, options = {}) {
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
      diagnostic.consoleErrors.push({
        message: message.text(),
        location: message.location(),
      })
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

    if (options.hud) {
      const summary = page.locator('.transfer-panel-demo__settings summary')
      await summary.click()
      await page.getByLabel('HUD 深色主题').check()
      await summary.click()
    }
    if (options.panelHeight) {
      await page.getByLabel('面板高度').selectOption(String(options.panelHeight))
    }
    if (options.selectedPanel) {
      await page.locator('.lx-transfer-panel__mobile-switch button').nth(1).click()
    }

    await page.evaluate(() => {
      const control = document.querySelector('.transfer-panel-demo__height-control')
      if (!control) return
      const top = control.getBoundingClientRect().top + window.scrollY
      window.scrollTo(0, Math.max(0, top - 58))
    })
    await page.waitForTimeout(100)

    const measurements = await page.evaluate(() => {
      const bounds = (element) => {
        if (!element) return null
        const { x, y, width, height, top, right, bottom, left } =
          element.getBoundingClientRect()
        return { x, y, width, height, top, right, bottom, left }
      }
      const intersects = (first, second) =>
        Boolean(
          first &&
            second &&
            first.left < second.right &&
            first.right > second.left &&
            first.top < second.bottom &&
            first.bottom > second.top,
        )
      const root = document.querySelector('.lx-transfer-panel')
      const surface = document.querySelector('.transfer-panel-demo__surface')
      const preview = document.querySelector('.transfer-panel-demo__preview')
      const sourcePanel = root?.querySelector('.lx-transfer-panel__panel--source') ??
        root?.querySelector('.lx-transfer-panel__panel')
      const selectedPanel = root?.querySelector('.lx-transfer-panel__panel--selected') ??
        root?.querySelectorAll('.lx-transfer-panel__panel')[1]
      const sourceTitle = sourcePanel?.querySelector('.lx-transfer-panel__title')
      const sourceAction = sourcePanel?.querySelector(
        '.lx-transfer-panel__scope-actions summary',
      )
      const selectedTitle = selectedPanel?.querySelector('.lx-transfer-panel__title')
      const heightControl = document.querySelector(
        '.transfer-panel-demo__height-control',
      )
      const heightSelect = heightControl?.querySelector('select')
      const localHostNote = document.querySelector('.transfer-panel-demo__note')
      const persistenceNote = [...document.querySelectorAll('.vp-doc p')].find(
        (element) => element.textContent?.includes('示例中的选择只保存在本地内存中'),
      )
      const selectedList = root?.querySelector('.lx-transfer-panel__selected')
      const selectedListVisible = Boolean(
        selectedList &&
          getComputedStyle(selectedList).display !== 'none' &&
          selectedList.getBoundingClientRect().width > 0,
      )
      const selectedItems = [
        ...(root?.querySelectorAll('.lx-transfer-panel__selected-item') ?? []),
      ]
      const selectedRows = selectedItems.map((item) => ({
        text: item.querySelector('.lx-transfer-panel__selected-name')?.textContent?.trim(),
        bounds: bounds(item),
        fullyVisible: Boolean(
          selectedListVisible &&
            selectedList &&
            item.getBoundingClientRect().top >= selectedList.getBoundingClientRect().top &&
            item.getBoundingClientRect().bottom <= selectedList.getBoundingClientRect().bottom,
        ),
      }))
      const panels = [
        ...(root?.querySelectorAll('.lx-transfer-panel__panel') ?? []),
      ].map((panel) => ({
        visible:
          getComputedStyle(panel).display !== 'none' &&
          panel.getBoundingClientRect().width > 0,
        bounds: bounds(panel),
        title: panel.querySelector('.lx-transfer-panel__title')?.textContent?.trim(),
      }))
      const mobileSwitches = [
        ...(root?.querySelectorAll('.lx-transfer-panel__mobile-switch button') ?? []),
      ].map((button) => ({
        text: button.textContent?.trim(),
        ariaPressed: button.getAttribute('aria-pressed'),
        bounds: bounds(button),
      }))
      const sectionRect = bounds(document.querySelector('.transfer-panel-demo'))
      const sourceTitleRect = bounds(sourceTitle)
      const persistenceRect = bounds(persistenceNote)
      const pageCoordinate = (rect) =>
        rect ? { top: rect.top + scrollY, bottom: rect.bottom + scrollY } : null
      const transitions = [root, sourceTitle, heightSelect]
        .filter(Boolean)
        .map((element) => ({
          selector: element.className?.baseVal ?? element.className,
          duration: getComputedStyle(element).transitionDuration,
          animationDuration: getComputedStyle(element).animationDuration,
        }))

      return {
        url: location.href,
        viewport: { width: innerWidth, height: innerHeight },
        pageScrollY: scrollY,
        document: {
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyClientWidth: document.body.clientWidth,
          bodyScrollWidth: document.body.scrollWidth,
        },
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        preview: {
          bounds: bounds(surface),
          widthCap: getComputedStyle(surface).maxWidth,
          themeClass: preview?.classList.contains('lx-theme-hud') ?? false,
          panelHeightPx: root ? getComputedStyle(root).getPropertyValue('--lx-transfer-panel-height').trim() : null,
          componentBounds: bounds(root),
          componentWithinViewport: Boolean(
            root &&
              root.getBoundingClientRect().left >= 0 &&
              root.getBoundingClientRect().right <= innerWidth,
          ),
          panels,
        },
        heightControl: {
          visible: Boolean(
            heightSelect &&
              getComputedStyle(heightSelect).display !== 'none' &&
              bounds(heightSelect)?.width > 0,
          ),
          label: heightControl?.textContent?.trim(),
          value: heightSelect?.value,
          options: [...(heightSelect?.options ?? [])].map((option) => ({
            label: option.textContent?.trim(),
            value: option.value,
          })),
          controlBounds: bounds(heightControl),
          selectBounds: bounds(heightSelect),
        },
        statusBounds: bounds(document.querySelector('.transfer-panel-demo__status')),
        sourceTitle: {
          text: sourceTitle?.textContent?.trim(),
          includesWaitlistLabel: sourceTitle?.textContent?.includes('待选') ?? false,
          accessibleNameReference: sourcePanel?.getAttribute('aria-labelledby'),
          accessibleNameText: sourceTitle?.textContent?.trim(),
          bounds: sourceTitleRect,
          truncated: Boolean(sourceTitle && sourceTitle.scrollWidth > sourceTitle.clientWidth + 1),
          overlapsScopeAction: intersects(sourceTitleRect, bounds(sourceAction)),
          scopeActionText: sourceAction?.textContent?.trim(),
          scopeActionBounds: bounds(sourceAction),
        },
        selectedTitle: {
          text: selectedTitle?.textContent?.trim(),
          bounds: bounds(selectedTitle),
          truncated: Boolean(selectedTitle && selectedTitle.scrollWidth > selectedTitle.clientWidth + 1),
        },
        selectedList: {
          visible: selectedListVisible,
          bounds: bounds(selectedList),
          clientHeight: selectedList?.clientHeight ?? 0,
          scrollHeight: selectedList?.scrollHeight ?? 0,
          itemCount: selectedItems.length,
          fullyVisibleRows: selectedRows.filter((row) => row.fullyVisible).length,
          rows: selectedRows,
        },
        mobileSwitches,
        persistence: {
          localHostNote: localHostNote?.textContent?.trim(),
          localHostNoteBounds: bounds(localHostNote),
          docsNote: persistenceNote?.textContent?.trim(),
          docsNoteBounds: persistenceRect,
          docsNotePageCoordinates: pageCoordinate(persistenceRect),
          sourceTitlePageCoordinates: pageCoordinate(sourceTitleRect),
          gapFromSourceTitleToDocsNote:
            persistenceRect && sourceTitleRect
              ? persistenceRect.top + scrollY - (sourceTitleRect.bottom + scrollY)
              : null,
          demoBounds: sectionRect,
        },
        reducedMotionTransitions: transitions,
      }
    })

    await page.screenshot({ path: path.join(outputDir, name), animations: 'disabled' })
    if (options.captureDemo) {
      await page.locator('.transfer-panel-demo').screenshot({
        path: path.join(outputDir, options.captureDemo),
        animations: 'disabled',
      })
    }
    return measurements
  } finally {
    diagnostics.push(diagnostic)
    await page.close()
  }
}

await mkdir(outputDir, { recursive: true })
const evidence = {}
try {
  evidence.browser = { engine: 'Microsoft Edge', version: browser.version() }
  evidence.target = targetUrl
  evidence.sourceHashesBefore = await sourceHashes()
  evidence.capturePlan = {
    viewports: ['1440x900', '1024x900', '390x844', '320x844'],
    themes: ['light', 'HUD dark'],
    reducedMotion: 'reduce',
    freshPagePerCapture: true,
  }
  evidence.desktop1440Light = await capture('desktop-1440-light.png', {
    width: 1440,
    height: 900,
  })
  evidence.desktop1440Hud = await capture(
    'desktop-1440-hud.png',
    { width: 1440, height: 900 },
    { hud: true },
  )
  evidence.desktop1440Height300 = await capture(
    'desktop-1440-height-300.png',
    { width: 1440, height: 900 },
    { panelHeight: 300 },
  )
  evidence.desktop1440Height380 = await capture(
    'desktop-1440-height-380.png',
    { width: 1440, height: 900 },
    { panelHeight: 380 },
  )
  evidence.mobile390Height380Selected = await capture(
    'mobile-390-height-380-selected.png',
    { width: 390, height: 844 },
    { panelHeight: 380, selectedPanel: true },
  )
  evidence.mobile390Height300Selected = await capture(
    'mobile-390-height-300-selected.png',
    { width: 390, height: 844 },
    { panelHeight: 300, selectedPanel: true },
  )
  evidence.desktop1024Light = await capture('desktop-1024-light.png', {
    width: 1024,
    height: 900,
  })
  evidence.mobile390Source = await capture(
    'mobile-390-source-light.png',
    { width: 390, height: 844 },
    { captureDemo: 'mobile-390-demo-light.png' },
  )
  evidence.mobile390Selected = await capture(
    'mobile-390-selected-light.png',
    { width: 390, height: 844 },
    { selectedPanel: true },
  )
  evidence.mobile390HudSelected = await capture(
    'mobile-390-selected-hud.png',
    { width: 390, height: 844 },
    { hud: true, selectedPanel: true },
  )
  evidence.mobile320Source = await capture(
    'mobile-320-source-light.png',
    { width: 320, height: 844 },
    { captureDemo: 'mobile-320-demo-light.png' },
  )
  evidence.mobile320Selected = await capture(
    'mobile-320-selected-light.png',
    { width: 320, height: 844 },
    { selectedPanel: true },
  )
  evidence.diagnostics = diagnostics
  evidence.sourceHashesAfter = await sourceHashes()
  if (
    JSON.stringify(evidence.sourceHashesBefore) !==
    JSON.stringify(evidence.sourceHashesAfter)
  ) {
    throw new Error('源码在浏览器采集期间发生变化')
  }
  evidence.capturedAt = new Date().toISOString()
  await writeFile(
    path.join(outputDir, 'browser-evidence.json'),
    `${JSON.stringify(evidence, null, 2)}\n`,
  )
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`)
} finally {
  await context.close()
  await browser.close()
}
