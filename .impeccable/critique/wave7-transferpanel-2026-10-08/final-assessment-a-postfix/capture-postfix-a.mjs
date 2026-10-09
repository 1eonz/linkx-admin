import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { chromium } from '../../../../other-admin/admin-vue3/node_modules/@playwright/test/index.mjs'

const outputDir = path.dirname(fileURLToPath(import.meta.url))
const targetPath = path.resolve(outputDir, '../../../../linkx-fe/src/components/LxTransferPanel/index.vue')
const sourceHash = createHash('sha256').update(await readFile(targetPath)).digest('hex').toUpperCase()
const url = 'http://127.0.0.1:4174/components/lxtransferpanel'
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
const evidence = {
  target: url,
  browser: `Google Chrome ${browser.version()} controlled by Playwright Chromium API; headless; new isolated context per viewport`,
  source: { path: 'linkx-fe/src/components/LxTransferPanel/index.vue', sha256: sourceHash },
  reducedMotion: 'reduce',
  contexts: {},
  pageErrors: [],
  consoleErrors: [],
  httpErrors: [],
}

async function makePage(name, viewport) {
  const context = await browser.newContext({ viewport, colorScheme: 'light', reducedMotion: 'reduce' })
  const page = await context.newPage()
  page.on('pageerror', (error) => evidence.pageErrors.push({ viewport, message: error.message }))
  page.on('console', (message) => {
    if (message.type() === 'error') evidence.consoleErrors.push({ viewport, message: message.text() })
  })
  page.on('response', (response) => {
    if (response.status() >= 400) evidence.httpErrors.push({ viewport, status: response.status(), url: response.url() })
  })
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.locator('.transfer-panel-demo__preview').waitFor({ state: 'visible', timeout: 15000 })
  await page.waitForTimeout(400)
  await page.locator('.transfer-panel-demo__preview').scrollIntoViewIfNeeded()
  return { context, page, name }
}

async function baseSnapshot(page, width) {
  return page.locator('.lx-transfer-panel').evaluate((panel, targetWidth) => {
    const rect = (element) => {
      const box = element.getBoundingClientRect()
      return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) }
    }
    const sourceButton = panel.querySelector('[data-testid="mobile-source-panel"]')
    const selectedButton = panel.querySelector('[data-testid="mobile-selected-panel"]')
    const count = panel.querySelector('.lx-transfer-panel__selected-count')
    const selected = panel.querySelector('.lx-transfer-panel__panel[aria-labelledby$="selected-title"]')
    const hint = panel.querySelector('.lx-transfer-panel__keyboard-hint')
    const css = getComputedStyle(count)
    const lineHeight = Number.parseFloat(css.lineHeight)
    const countRect = count.getBoundingClientRect()
    const sourceShort = sourceButton.querySelector('.lx-transfer-panel__mobile-short-title')
    const selectedShort = selectedButton.querySelector('.lx-transfer-panel__mobile-short-title')
    return {
      viewport: { width: targetWidth, height: window.innerHeight },
      panel: rect(panel),
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      switcherVisible: getComputedStyle(panel.querySelector('.lx-transfer-panel__mobile-switch')).display !== 'none',
      switcher: {
        source: { visibleText: sourceButton.innerText.replace(/\s+/g, ' ').trim(), ariaLabel: sourceButton.getAttribute('aria-label'), title: sourceButton.title, shortLabelVisible: getComputedStyle(sourceShort).display !== 'none' },
        selected: { visibleText: selectedButton.innerText.replace(/\s+/g, ' ').trim(), ariaLabel: selectedButton.getAttribute('aria-label'), title: selectedButton.title, shortLabelVisible: getComputedStyle(selectedShort).display !== 'none' },
      },
      selectedCount: { text: count.innerText.replace(/\s+/g, ' ').trim(), whiteSpace: css.whiteSpace, rect: rect(count), oneLine: countRect.height <= lineHeight + 1, lineHeight },
      keyboardHint: { text: hint.innerText.trim(), display: getComputedStyle(hint).display, rect: rect(hint), visible: getComputedStyle(hint).display !== 'none' && hint.getClientRects().length > 0 },
      selectedPanel: { rect: rect(selected), display: getComputedStyle(selected).display, hiddenClass: selected.classList.contains('is-mobile-hidden') },
      background: getComputedStyle(panel).backgroundColor,
    }
  }, width)
}

async function componentShot(page, filename) {
  await page.locator('.transfer-panel-demo__preview').screenshot({ path: path.join(outputDir, filename), animations: 'disabled' })
}

for (const [name, viewport] of [['mobile320', { width: 320, height: 740 }], ['mobile390', { width: 390, height: 844 }], ['desktop1440', { width: 1440, height: 960 }]]) {
  const { context, page } = await makePage(name, viewport)
  const data = { url: page.url(), title: await page.title(), initial: await baseSnapshot(page, viewport.width) }
  if (name === 'desktop1440') {
    await page.screenshot({ path: path.join(outputDir, '01-desktop-page-smoke.png'), fullPage: true, animations: 'disabled' })
    await componentShot(page, '02-desktop-component-light.png')
    const desktopTree = page.getByRole('treeitem')
    data.initial.desktop = {
      sourceCount: await desktopTree.count(),
      fullPanelTitles: await page.locator('.lx-transfer-panel__panel').allInnerTexts().then((texts) => texts.map((text) => text.split('\n')[0])),
      noDocumentOverflow: data.initial.documentWidth === data.initial.viewportWidth,
    }
  } else {
    await componentShot(page, `${name === 'mobile320' ? '03' : '06'}-${name}-light-source.png`)
    data.initial.keyboardHint.visible = await page.getByText('键盘：方向键移动或展开，Space / Enter 选择', { exact: true }).isVisible()

    const sourceButton = page.getByTestId('mobile-source-panel')
    const selectedButton = page.getByTestId('mobile-selected-panel')
    const sourceLabel = await sourceButton.getAttribute('aria-label')
    const selectedLabel = await selectedButton.getAttribute('aria-label')
    const visibleLabels = await panelVisibleLabels(page)
    data.accessibleNames = {
      source: sourceLabel,
      selected: selectedLabel,
      sourceContainsFullTitle: sourceLabel?.includes('组织与数据权限树（待选）') ?? false,
      selectedContainsFullTitle: selectedLabel?.includes('已选数据权限清单') ?? false,
      visibleShortLabels: visibleLabels,
    }

    await selectedButton.click()
    await page.waitForTimeout(100)
    data.selectedView = await baseSnapshot(page, viewport.width)
    data.selectedView.hiddenSourcePanelDisplay = await page.locator('.lx-transfer-panel__panel').first().evaluate((panel) => getComputedStyle(panel).display)
    await componentShot(page, `${name === 'mobile320' ? '04' : '07'}-${name}-light-selected.png`)

    await sourceButton.click()
    const filter = page.getByRole('textbox', { name: '按机构名称或部门编码筛选待选节点' })
    await filter.fill('站前路派出所综合作战室')
    const rows = page.getByRole('treeitem')
    const rowCount = await rows.count()
    await rows.first().focus()
    await page.keyboard.press('ArrowDown')
    const focusedAfterArrow = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.innerText ?? '')
    const selectedBeforeKey = await page.locator('.lx-transfer-panel__selected-count').innerText()
    await page.keyboard.press(name === 'mobile320' ? 'Enter' : 'Space')
    await page.waitForTimeout(100)
    const selectedAfterKey = await page.locator('.lx-transfer-panel__selected-count').innerText()
    data.keyboardCheck = {
      filteredVisibleTreeRows: rowCount,
      focusedRowAfterArrowDown: focusedAfterArrow.replace(/\s+/g, ' ').trim(),
      expectedRowFocused: focusedAfterArrow.includes('站前路派出所综合作战室'),
      selectionBeforeKey: selectedBeforeKey,
      selectionAfterKey: selectedAfterKey,
      selectionChanged: selectedBeforeKey !== selectedAfterKey,
      testedSelectionKey: name === 'mobile320' ? 'Enter' : 'Space',
      hintVisibleDuringTreeUse: await page.getByText('键盘：方向键移动或展开，Space / Enter 选择', { exact: true }).isVisible(),
      focusOutline: await page.evaluate(() => ({ style: getComputedStyle(document.activeElement).outlineStyle, width: getComputedStyle(document.activeElement).outlineWidth })),
    }
    await componentShot(page, `${name === 'mobile320' ? '05' : '08'}-${name}-keyboard-selection.png`)

    const controls = page.locator('.transfer-panel-demo__settings')
    await controls.locator('summary').click()
    const hud = page.getByLabel('HUD 深色主题')
    await hud.check()
    await page.waitForTimeout(80)
    data.darkTheme = {
      checked: await hud.isChecked(),
      classPresent: await page.locator('.transfer-panel-demo__preview').evaluate((preview) => preview.classList.contains('lx-theme-hud')),
      component: await baseSnapshot(page, viewport.width),
      noDocumentOverflow: await page.evaluate(() => document.documentElement.scrollWidth === window.innerWidth),
    }
    await componentShot(page, `${name === 'mobile320' ? '09' : '10'}-${name}-hud-dark.png`)
  }
  evidence.contexts[name] = data
  await context.close()
}

async function panelVisibleLabels(page) {
  return page.locator('.lx-transfer-panel__mobile-switch button').evaluateAll((buttons) => buttons.map((button) => [...button.querySelectorAll('.lx-transfer-panel__mobile-short-title')].filter((node) => getComputedStyle(node).display !== 'none').map((node) => node.innerText).join('')))
}

await writeFile(path.join(outputDir, 'source-sha256.txt'), `${sourceHash}  linkx-fe/src/components/LxTransferPanel/index.vue\n`, 'utf8')
await writeFile(path.join(outputDir, 'browser-facts.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
await browser.close()
console.log(JSON.stringify({ contexts: Object.keys(evidence.contexts), sourceSha256: sourceHash, pageErrors: evidence.pageErrors.length, httpErrors: evidence.httpErrors.length, outputDir }, null, 2))
