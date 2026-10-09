import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
const outputDirectory = path.dirname(fileURLToPath(import.meta.url))
const appRequire = createRequire(path.join(root, 'other-admin/admin-vue3/package.json'))
const { chromium } = appRequire('@playwright/test')
const browserPath =
  'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'
const url = 'http://127.0.0.1:4174/components/lxtransferpanel'
const sourcePaths = [
  'linkx-fe/src/components/LxTransferPanel/index.vue',
  'linkx-fe/src/components/LxTransferPanel/demo/basic.vue',
  'linkx-fe/src/components/LxTransferPanel/types.ts',
  'linkx-fe/src/components/LxVirtualTree/index.vue',
  'linkx-fe/src/components/LxConfirm/index.ts',
  'linkx-fe/src/components/LxConfirm/style.css',
  'linkx-fe/src/tokens/variables.css',
  'linkx-fe/src/tokens/theme-hud.css',
  'linkx-fe/docs/components/lxtransferpanel.md',
  'linkx-fe/docs/.vitepress/theme/custom.css',
]

await mkdir(outputDirectory, { recursive: true })

async function sourceHashes() {
  const entries = await Promise.all(
    sourcePaths.map(async (sourcePath) => {
      const contents = await readFile(path.join(root, sourcePath))
      return [
        sourcePath,
        createHash('sha256').update(contents).digest('hex').toUpperCase(),
      ]
    }),
  )
  return Object.fromEntries(entries)
}

async function newPage(width, height, deviceScaleFactor = 1) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor,
    colorScheme: 'light',
  })
  const page = await context.newPage()
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  const response = await page.goto(url, { waitUntil: 'networkidle' })
  if (!response || response.status() !== 200) {
    throw new Error(`Target returned ${response?.status() ?? 'no response'}`)
  }
  await page.locator('.transfer-panel-demo').waitFor()
  return { context, page, pageErrors }
}

async function setSiteTheme(page, theme) {
  const title = theme === 'dark' ? 'Switch to dark theme' : 'Switch to light theme'
  let openedMobileNavigation = false
  let toggle

  async function findVisibleToggle() {
    const toggles = page.locator(`button[title="${title}"]`)
    for (let index = 0; index < (await toggles.count()); index += 1) {
      const candidate = toggles.nth(index)
      if (await candidate.isVisible()) return candidate
    }
    return undefined
  }

  toggle = await findVisibleToggle()
  if (!toggle && (await page.evaluate(() => innerWidth)) <= 960) {
    const navigation = page.locator('button[aria-label="mobile navigation"]')
    if (await navigation.isVisible()) {
      await navigation.click()
      openedMobileNavigation = true
      toggle = await findVisibleToggle()
    }
  }
  if (!toggle) throw new Error(`No visible VitePress theme button titled "${title}"`)
  await toggle.click()
  await page.waitForFunction(
    (shouldBeDark) =>
    document.documentElement.classList.contains('dark') === shouldBeDark,
    theme === 'dark',
  )
  if (openedMobileNavigation) {
    const screen = page.locator('.VPNavScreen')
    if (await screen.isVisible()) {
      await page.locator('button[aria-label="mobile navigation"]').click()
      await screen.waitFor({ state: 'hidden' })
    }
  }
}

async function openSettings(page) {
  const settings = page.locator('.transfer-panel-demo__settings')
  const isOpen = await settings.evaluate((element) => element.open)
  if (!isOpen) await settings.locator('summary').click()
}

async function setHudTheme(page, enabled) {
  await openSettings(page)
  const hudToggle = page.locator(
    '.transfer-panel-demo__toolbar-group[aria-label="示例参数"] input[type="checkbox"]',
  ).nth(1)
  if (enabled) await hudToggle.check()
  else await hudToggle.uncheck()
}

async function scrollToDemo(page) {
  await page.locator('.transfer-panel-demo').scrollIntoViewIfNeeded()
  await page.waitForTimeout(120)
}

async function metrics(page) {
  return page.evaluate(() => {
    const demo = document.querySelector('.transfer-panel-demo')
    const panels = [...(demo?.querySelectorAll('.lx-transfer-panel__panel') ?? [])]
    const rect = (element) => {
      if (!element) return null
      const box = element.getBoundingClientRect()
      return {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      }
    }
    const settings = demo?.querySelector('.transfer-panel-demo__settings')
    const settingsElements = [
      ...(settings?.querySelectorAll('summary, label, button') ?? []),
    ].map((element) => ({
      text: element.textContent?.trim() ?? '',
      width: Math.round(element.getBoundingClientRect().width),
      height: Math.round(element.getBoundingClientRect().height),
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      clippedX: element.scrollWidth > element.clientWidth + 1,
      clippedY: element.scrollHeight > element.clientHeight + 1,
    }))
    const primaryPanel = panels[0]
    const demoShell = demo?.closest('.demo')
    const sourceCount = demo?.querySelectorAll('[role="treeitem"]').length ?? 0
    const selectedCountText =
      demo?.querySelector('[data-testid="selected-count"]')?.textContent?.trim() ?? ''
    const selectedMatch = selectedCountText.match(/\d+/)
    const surface = demo?.querySelector('.transfer-panel-demo__surface')
    const lxBackground = demo
      ? getComputedStyle(demo).getPropertyValue('--lx-bg-card').trim()
      : ''

    return {
      title: document.title,
      siteDark: document.documentElement.classList.contains('dark'),
      hudDark: demo?.classList.contains('lx-theme-hud') ?? false,
      viewport: {
        innerWidth,
        innerHeight,
        devicePixelRatio,
        visualViewportScale: visualViewport?.scale ?? null,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      },
      colors: {
        page: getComputedStyle(document.querySelector('.VPContent') ?? document.body)
          .backgroundColor,
        document: getComputedStyle(document.querySelector('.VPDoc') ?? document.body)
          .backgroundColor,
        demoShell: getComputedStyle(demoShell ?? demo ?? document.body).backgroundColor,
        demoText: demo ? getComputedStyle(demo).color : '',
        panel: getComputedStyle(primaryPanel ?? document.body).backgroundColor,
        panelText: getComputedStyle(primaryPanel ?? document.body).color,
        lxBackgroundToken: lxBackground,
        colorScheme: demo ? getComputedStyle(demo).colorScheme : '',
      },
      layout: {
        demo: rect(demo),
        panels: panels.map(rect),
        transferLayout:
          demo?.querySelector('.lx-transfer-panel')?.getAttribute('data-lx-transfer-layout') ??
          '',
        transferControls: [
          ...(demo?.querySelectorAll('.lx-transfer-panel__controls button') ?? []),
        ].map((button) => rect(button)),
      },
      selectedCount: selectedMatch ? Number(selectedMatch[0]) : null,
      selectedCountText,
      treeRowCount: sourceCount,
      treeSummary:
        demo?.querySelector('[data-testid="tree-node-count"]')?.textContent?.trim() ?? '',
      busy: surface?.getAttribute('aria-busy') ?? null,
      alert: demo?.querySelector('[role="alert"]')?.textContent?.trim() ?? '',
      emptyText:
        demo?.querySelector('.lx-virtual-tree__empty, .lx-transfer-panel__empty')
          ?.textContent?.trim() ?? '',
      panelInert:
        demo?.querySelector('.lx-transfer-panel')?.hasAttribute('inert') ?? false,
      settingsOpen: settings?.hasAttribute('open') ?? false,
      settingsElements,
    }
  })
}

const captures = []
const checks = []
const runtimeErrors = []
const browser = await chromium.launch({
  headless: true,
  executablePath: browserPath,
})

function check(name, passed, evidence) {
  checks.push({ name, passed, evidence })
}

async function capture(name, page, pageErrors, { demoCrop = false } = {}) {
  await scrollToDemo(page)
  const screenshotPath = path.join(outputDirectory, `${name}.png`)
  await page.screenshot({ path: screenshotPath, animations: 'disabled' })
  let demoScreenshotPath = null
  if (demoCrop) {
    demoScreenshotPath = path.join(outputDirectory, `${name}-demo.png`)
    await page.locator('.transfer-panel-demo').screenshot({
      path: demoScreenshotPath,
      animations: 'disabled',
    })
  }
  const state = await metrics(page)
  captures.push({
    name,
    screenshot: path.basename(screenshotPath),
    demoScreenshot: demoScreenshotPath ? path.basename(demoScreenshotPath) : null,
    state,
  })
  runtimeErrors.push(...pageErrors.map((message) => ({ capture: name, message })))
  return state
}

const hashesBefore = await sourceHashes()
const browserVersion = await browser.version()

try {
  {
    const { context, page, pageErrors } = await newPage(1440, 1050)
    await openSettings(page)
    const state = await capture('desktop-light', page, pageErrors)
    check('light-theme-surface', !state.siteDark && !state.hudDark && state.colors.panel === 'rgb(255, 255, 255)', state.colors)
    await context.close()
  }

  {
    const { context, page, pageErrors } = await newPage(1440, 1050)
    await setSiteTheme(page, 'dark')
    await openSettings(page)
    const state = await capture('desktop-global-dark', page, pageErrors)
    check(
      'global-dark-demo-surface',
      state.siteDark && !state.hudDark && state.colors.panel !== 'rgb(255, 255, 255)',
      { page: state.colors.page, panel: state.colors.panel, panelText: state.colors.panelText },
    )
    await context.close()
  }

  {
    const { context, page, pageErrors } = await newPage(1440, 1050)
    await setHudTheme(page, true)
    const state = await capture('desktop-hud-dark', page, pageErrors)
    check(
      'hud-dark-demo-surface',
      state.hudDark && state.colors.panel !== 'rgb(255, 255, 255)',
      { page: state.colors.page, panel: state.colors.panel, panelText: state.colors.panelText },
    )
    await context.close()
  }

  {
    const { context, page, pageErrors } = await newPage(1440, 1050)
    await setSiteTheme(page, 'dark')
    await setHudTheme(page, true)
    const state = await capture('desktop-global-and-hud-dark', page, pageErrors)
    check('combined-dark-theme', state.siteDark && state.hudDark, state.colors)
    await context.close()
  }

  {
    const { context, page, pageErrors } = await newPage(375, 812)
    await openSettings(page)
    const state = await capture('mobile-375-light', page, pageErrors, { demoCrop: true })
    check(
      'mobile-375-layout',
      !state.viewport.horizontalOverflow &&
        state.layout.panels.every((panel) => panel.width <= 375) &&
        state.layout.transferControls.every((control) => control.width >= 44 && control.height >= 44),
      { viewport: state.viewport, panels: state.layout.panels, controls: state.layout.transferControls },
    )
    await context.close()
  }

  {
    const { context, page, pageErrors } = await newPage(375, 812)
    await setSiteTheme(page, 'dark')
    await openSettings(page)
    const state = await capture('mobile-375-global-dark', page, pageErrors, { demoCrop: true })
    check(
      'mobile-375-dark-reflow',
      state.siteDark && !state.viewport.horizontalOverflow && state.colors.panel !== 'rgb(255, 255, 255)',
      { viewport: state.viewport, colors: state.colors, panels: state.layout.panels },
    )
    await context.close()
  }

  for (const [name, dpr] of [
    ['viewport-320-light', 1],
    ['viewport-320-global-dark', 1],
    ['viewport-320-dpr4-dark', 4],
  ]) {
    const { context, page, pageErrors } = await newPage(320, 812, dpr)
    if (name !== 'viewport-320-light') {
      await setSiteTheme(page, 'dark')
    }
    await openSettings(page)
    const state = await capture(name, page, pageErrors, { demoCrop: true })
    const clippedSettings = state.settingsElements.filter((element) => element.clippedX || element.clippedY)
    check(
      `${name}-reflow-and-settings`,
      !state.viewport.horizontalOverflow && clippedSettings.length === 0,
      {
        viewport: state.viewport,
        dpr,
        clippedSettings,
        panels: state.layout.panels,
      },
    )
    await context.close()
  }

  for (const [name, stateName] of [
    ['desktop-loading', '加载中'],
    ['desktop-error', '加载失败'],
    ['desktop-empty', '空结果'],
  ]) {
    const { context, page, pageErrors } = await newPage(1440, 1050)
    await openSettings(page)
    await page
      .locator('.transfer-panel-demo__toolbar-group[aria-label="宿主数据状态"]')
      .getByRole('button', { name: stateName })
      .click()
    const state = await capture(name, page, pageErrors)
    if (stateName === '加载中') {
      check('loading-state-preserves-selection-and-locks-panel', state.busy === 'true' && state.panelInert && state.selectedCount === 5, state)
    } else if (stateName === '加载失败') {
      check('error-state-preserves-selection-and-offers-retry', Boolean(state.alert) && state.panelInert && state.selectedCount === 5, state)
    } else {
      check('empty-tree-keeps-existing-selection', state.treeRowCount === 0 && state.selectedCount === 5 && Boolean(state.emptyText), state)
    }
    await context.close()
  }

  {
    const { context, page, pageErrors } = await newPage(1440, 1050)
    const rows = page.locator('.lx-virtual-tree__row[role="treeitem"]')
    await rows.nth(0).focus()
    const firstFocus = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')
    await page.keyboard.press('ArrowDown')
    const secondFocus = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')
    await page.keyboard.press('Space')
    await page.waitForTimeout(100)
    const deselectedCount = await metrics(page)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(100)
    const restoredCount = await metrics(page)
    const state = await capture('desktop-keyboard-tree', page, pageErrors)
    check(
      'tree-keyboard-navigation-and-selection',
      Boolean(firstFocus) && Boolean(secondFocus) && firstFocus !== secondFocus &&
        deselectedCount.selectedCount === 4 && restoredCount.selectedCount === 5,
      { firstFocus, secondFocus, deselected: deselectedCount.selectedCount, restored: restoredCount.selectedCount },
    )
    await context.close()
  }

  {
    const { context, page, pageErrors } = await newPage(1440, 1050)
    await page.getByRole('button', { name: '全部移除' }).click()
    const dialog = page.locator('.el-message-box')
    await dialog.waitFor({ state: 'visible' })
    const dialogEvidence = await dialog.evaluate((element) => ({
      title: element.querySelector('.el-message-box__title')?.textContent?.trim() ?? '',
      message: element.querySelector('.el-message-box__message')?.textContent?.trim() ?? '',
      confirmColor: getComputedStyle(element.querySelector('.lx-confirm__btn-danger') ?? element).backgroundColor,
      confirmText: element.querySelector('.lx-confirm__btn-danger')?.textContent?.trim() ?? '',
    }))
    const state = await capture('desktop-clear-confirm', page, pageErrors)
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'hidden' })
    const afterEscape = await metrics(page)

    await page.getByRole('button', { name: '全部移除' }).click()
    await dialog.waitFor({ state: 'visible' })
    await dialog.getByRole('button', { name: '清空全部授权' }).click()
    await page.getByRole('button', { name: '撤销清空' }).waitFor({ state: 'visible' })
    const afterClear = await metrics(page)
    await page.getByRole('button', { name: '撤销清空' }).click()
    const afterUndo = await metrics(page)
    check(
      'clear-confirm-escape-and-undo',
      Boolean(dialogEvidence.title) && afterEscape.selectedCount === 5 &&
        afterClear.selectedCount === 0 && afterUndo.selectedCount === 5,
      { dialog: dialogEvidence, escapeCount: afterEscape.selectedCount, clearCount: afterClear.selectedCount, undoCount: afterUndo.selectedCount },
    )

    const unloadedRemove = page.locator(
      '.lx-transfer-panel__selected-item button[aria-label*="历史授权单位"]',
    )
    await unloadedRemove.click()
    await dialog.waitFor({ state: 'visible' })
    const unloadedDialog = await dialog.evaluate((element) => ({
      title: element.querySelector('.el-message-box__title')?.textContent?.trim() ?? '',
      message: element.querySelector('.el-message-box__message')?.textContent?.trim() ?? '',
      confirmText: element.querySelector('.lx-confirm__btn-danger')?.textContent?.trim() ?? '',
    }))
    await capture('desktop-unloaded-remove-confirm', page, pageErrors)
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'hidden' })
    const afterRemoveCancel = await metrics(page)
    check(
      'unloaded-remove-confirm-cancel-preserves-selection',
      Boolean(unloadedDialog.title) && afterRemoveCancel.selectedCount === 5,
      { dialog: unloadedDialog, selectedCount: afterRemoveCancel.selectedCount },
    )
    await context.close()
  }
} finally {
  await browser.close()
}

const hashesAfter = await sourceHashes()
check(
  'source-stable-during-capture',
  JSON.stringify(hashesBefore) === JSON.stringify(hashesAfter),
  { hashesBefore, hashesAfter },
)

const result = {
  target: url,
  method: 'Fresh Chromium browser with an isolated new context/page per scenario; no detector or Assessment B input.',
  browser: { version: browserVersion, executablePath: browserPath },
  sourceHashes: { before: hashesBefore, after: hashesAfter },
  captures,
  checks,
  runtimeErrors,
  zoomMethodNote:
    'Headless browser Ctrl+Equal did not alter DPR or viewport. The zoom reflow proxy uses a 320 CSS-pixel layout viewport at deviceScaleFactor 4; it models 1280/4 effective CSS width but is not actual browser zoom.',
}

await writeFile(
  path.join(outputDirectory, 'capture-evidence.json'),
  `${JSON.stringify(result, null, 2)}\n`,
  'utf8',
)

console.log(JSON.stringify({
  captureCount: captures.length,
  checks: checks.map(({ name, passed }) => ({ name, passed })),
  runtimeErrors,
  hashesStable: JSON.stringify(hashesBefore) === JSON.stringify(hashesAfter),
  evidence: path.join(outputDirectory, 'capture-evidence.json'),
}, null, 2))

if (checks.some(({ passed }) => !passed) || runtimeErrors.length) process.exitCode = 2
