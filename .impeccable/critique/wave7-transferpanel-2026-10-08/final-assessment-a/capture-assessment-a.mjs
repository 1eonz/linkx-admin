import { chromium } from '../../../../other-admin/admin-vue3/node_modules/@playwright/test/index.mjs'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const outputDir = path.dirname(fileURLToPath(import.meta.url))
const baseUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})
const context = await browser.newContext({
  viewport: { width: 1440, height: 960 },
  colorScheme: 'light',
  reducedMotion: 'reduce',
})
const page = await context.newPage()
const facts = {
  target: baseUrl,
  browser: 'Playwright Chromium, headless, isolated context',
  context: { viewport: { width: 1440, height: 960 }, colorScheme: 'light', reducedMotion: 'reduce' },
  consoleErrors: [],
  pageErrors: [],
  httpErrors: [],
  actions: [],
  views: {},
}

page.on('console', (message) => {
  if (message.type() === 'error') facts.consoleErrors.push(message.text())
})
page.on('pageerror', (error) => facts.pageErrors.push(error.message))
page.on('response', (response) => {
  if (response.status() >= 400) facts.httpErrors.push({ status: response.status(), url: response.url() })
})

async function visibleText(locator) {
  return locator.isVisible().catch(() => false) ? locator.innerText().catch(() => '') : ''
}

async function takeComponentShot(name) {
  const preview = page.locator('.transfer-panel-demo__preview')
  await preview.scrollIntoViewIfNeeded()
  await preview.screenshot({ path: path.join(outputDir, name), animations: 'disabled' })
}

async function componentSnapshot() {
  return page.locator('.lx-transfer-panel').evaluate((panel) => {
    const rect = (element) => {
      if (!element) return null
      const bounds = element.getBoundingClientRect()
      return { x: Math.round(bounds.x), y: Math.round(bounds.y), width: Math.round(bounds.width), height: Math.round(bounds.height) }
    }
    const source = panel.querySelector('.lx-transfer-panel__panel[aria-labelledby$="source-title"]')
    const selected = panel.querySelector('.lx-transfer-panel__panel[aria-labelledby$="selected-title"]')
    const rows = [...panel.querySelectorAll('[role="treeitem"]')]
    const selectedItems = [...panel.querySelectorAll('.lx-transfer-panel__selected-item')]
    const buttons = [...panel.querySelectorAll('button')].filter((button) => button.getClientRects().length)
    return {
      panel: rect(panel),
      layout: panel.getAttribute('data-lx-transfer-layout'),
      mobileSwitcher: rect(panel.querySelector('.lx-transfer-panel__mobile-switch')),
      mobileSwitcherVisible: getComputedStyle(panel.querySelector('.lx-transfer-panel__mobile-switch')).display !== 'none',
      sourcePanel: {
        rect: rect(source),
        display: getComputedStyle(source).display,
        hiddenClass: source.classList.contains('is-mobile-hidden'),
        focusableDescendants: [...source.querySelectorAll('button,input,[tabindex]')]
          .filter((node) => node.tabIndex >= 0 && node.getClientRects().length)
          .map((node) => node.getAttribute('aria-label') || node.textContent.trim() || node.tagName),
      },
      selectedPanel: {
        rect: rect(selected),
        display: getComputedStyle(selected).display,
        hiddenClass: selected.classList.contains('is-mobile-hidden'),
        focusableDescendants: [...selected.querySelectorAll('button,input,[tabindex]')]
          .filter((node) => node.tabIndex >= 0 && node.getClientRects().length)
          .map((node) => node.getAttribute('aria-label') || node.textContent.trim() || node.tagName),
      },
      treeRows: rows.slice(0, 8).map((row) => ({
        text: row.innerText.replace(/\s+/g, ' ').trim(),
        role: row.getAttribute('role'),
        ariaLevel: row.getAttribute('aria-level'),
        tabIndex: row.tabIndex,
        rect: rect(row),
      })),
      selectedItems: selectedItems.map((item) => item.innerText.replace(/\s+/g, ' ').trim()),
      visibleButtons: buttons.map((button) => ({
        name: button.getAttribute('aria-label') || button.innerText.trim(),
        disabled: button.disabled,
        rect: rect(button),
      })),
      scrollWidth: { panel: panel.scrollWidth, panelClientWidth: panel.clientWidth, document: document.documentElement.scrollWidth, viewport: window.innerWidth },
      inheritDescription: panel.querySelector('.lx-transfer-panel__inherit-description')?.innerText.trim() ?? '',
      selectedScrollHint: panel.querySelector('.lx-transfer-panel__selected-scroll-hint')?.innerText.trim() ?? '',
    }
  })
}

await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.locator('.transfer-panel-demo__preview').waitFor({ state: 'visible', timeout: 15000 })
await page.waitForTimeout(600)
facts.page = {
  title: await page.title(),
  url: page.url(),
  viewport: page.viewportSize(),
  document: await page.locator('body').innerText(),
}
await page.screenshot({ path: path.join(outputDir, '01-doc-page-desktop-light.png'), fullPage: true, animations: 'disabled' })
await takeComponentShot('02-component-desktop-light.png')
facts.views.desktopLight = await componentSnapshot()
facts.views.desktopLight.demoStatus = await visibleText(page.locator('[data-testid="transfer-status"]'))
facts.views.desktopLight.selectedCount = await page.locator('[data-testid="selected-count"]').innerText()
facts.views.desktopLight.treeNodeCount = await page.locator('[data-testid="tree-node-count"]').innerText()
facts.actions.push('新建 Chromium context 打开指定组件文档 URL；保存桌面浅色全页与组件预览截图。')

const settings = page.locator('.transfer-panel-demo__settings')
await settings.locator('summary').click()
facts.views.demoControls = await settings.innerText()
await page.getByRole('button', { name: '加载失败', exact: true }).click()
await page.waitForTimeout(100)
facts.views.hostError = {
  message: await visibleText(page.locator('.transfer-panel-demo__message')),
  retryVisible: await page.getByRole('button', { name: '重试', exact: true }).isVisible().catch(() => false),
  selectedCount: await page.locator('[data-testid="selected-count"]').innerText(),
  busy: await page.locator('.transfer-panel-demo__surface').getAttribute('aria-busy'),
}
await takeComponentShot('03-host-error-state.png')
await page.getByRole('button', { name: '重试', exact: true }).click()
await page.getByRole('button', { name: '空结果', exact: true }).click()
await page.waitForTimeout(100)
facts.views.hostEmpty = {
  message: await visibleText(page.locator('.transfer-panel-demo__status')),
  selectedItems: await page.locator('.lx-transfer-panel__selected-item').count(),
  sourcePanelText: await page.locator('.lx-transfer-panel__panel').first().innerText(),
}
await takeComponentShot('04-host-empty-state.png')
await page.getByRole('button', { name: '加载中', exact: true }).click()
await page.waitForTimeout(100)
facts.views.hostLoading = {
  message: await visibleText(page.locator('.transfer-panel-demo__message')),
  busy: await page.locator('.transfer-panel-demo__surface').getAttribute('aria-busy'),
}
await takeComponentShot('05-host-loading-state.png')

await page.reload({ waitUntil: 'domcontentloaded' })
await page.locator('.transfer-panel-demo__preview').waitFor({ state: 'visible' })
await page.waitForTimeout(400)
await page.locator('.transfer-panel-demo__settings summary').click()
const hudToggle = page.getByLabel('HUD 深色主题')
await hudToggle.check()
await page.waitForTimeout(100)
facts.views.hudDark = { checked: await hudToggle.isChecked(), component: await componentSnapshot() }
await takeComponentShot('06-component-desktop-hud-dark.png')

await hudToggle.uncheck()
const sourceFilter = page.getByRole('textbox', { name: '按机构名称或部门编码筛选待选节点' })
await sourceFilter.fill('待授权特勤支队')
await page.waitForTimeout(150)
facts.views.filteredSource = {
  input: await sourceFilter.inputValue(),
  status: await visibleText(page.locator('.lx-transfer-panel__header-status')),
  visibleRows: await page.getByRole('treeitem').allInnerTexts(),
  filteredSelectEnabled: await page.getByRole('button', { name: '全选筛选结果' }).isEnabled(),
}
const filteredSelect = page.getByRole('button', { name: '全选筛选结果' })
await filteredSelect.click()
await page.waitForTimeout(100)
facts.views.filteredSelection = {
  demoStatus: await page.locator('[data-testid="transfer-status"]').innerText(),
  selectedCount: await page.locator('[data-testid="selected-count"]').innerText(),
  selectedItems: await page.locator('.lx-transfer-panel__selected-item').allInnerTexts(),
  selectAllEnabled: await page.getByRole('button', { name: '全部加入' }).isEnabled(),
  limitHint: await visibleText(page.locator('[data-testid="select-all-compact-hint"]')),
}
await takeComponentShot('07-filtered-batch-selection.png')

await page.getByRole('button', { name: '全部移除', exact: true }).click()
await page.getByRole('button', { name: '确认清空', exact: true }).waitFor({ state: 'visible', timeout: 5000 })
facts.views.clearConfirmation = {
  dialogText: await visibleText(page.getByRole('dialog')),
  selectedCountBeforeDecision: await page.locator('[data-testid="selected-count"]').innerText(),
}
await page.screenshot({ path: path.join(outputDir, '08-clear-confirmation.png'), animations: 'disabled' })
await page.getByRole('button', { name: '取消', exact: true }).click()
facts.views.clearCancelled = { selectedCount: await page.locator('[data-testid="selected-count"]').innerText() }
await page.getByRole('button', { name: '全部移除', exact: true }).click()
await page.getByRole('button', { name: '确认清空', exact: true }).click()
await page.waitForTimeout(200)
facts.views.clearAccepted = {
  selectedCount: await page.locator('[data-testid="selected-count"]').innerText(),
  emptyMessage: await page.locator('.lx-transfer-panel__selected-empty').innerText().catch(() => ''),
  undoVisible: await page.getByRole('button', { name: '撤销清空', exact: true }).isVisible().catch(() => false),
  activeElement: await page.evaluate(() => ({ tag: document.activeElement?.tagName, role: document.activeElement?.getAttribute('role'), label: document.activeElement?.getAttribute('aria-label') })),
}
await takeComponentShot('09-clear-empty-state.png')
if (facts.views.clearAccepted.undoVisible) {
  await page.getByRole('button', { name: '撤销清空', exact: true }).click()
  facts.views.clearUndone = await page.locator('[data-testid="selected-count"]').innerText()
}

await page.reload({ waitUntil: 'domcontentloaded' })
await page.locator('.transfer-panel-demo__preview').waitFor({ state: 'visible' })
await page.waitForTimeout(400)
await page.setViewportSize({ width: 390, height: 844 })
await page.waitForTimeout(250)
await page.locator('.transfer-panel-demo__preview').scrollIntoViewIfNeeded()
facts.context.mobileViewport = page.viewportSize()
facts.views.mobile390Source = await componentSnapshot()
await takeComponentShot('10-component-mobile-390-source.png')
await page.getByTestId('mobile-selected-panel').focus()
await page.keyboard.press('Enter')
await page.waitForTimeout(100)
facts.views.mobile390Selected = await componentSnapshot()
await takeComponentShot('11-component-mobile-390-selected.png')

await page.setViewportSize({ width: 320, height: 740 })
await page.getByTestId('mobile-source-panel').focus()
await page.keyboard.press('Enter')
await page.waitForTimeout(250)
facts.context.smallViewport = page.viewportSize()
facts.views.mobile320Source = await componentSnapshot()
await takeComponentShot('12-component-mobile-320-source.png')

await page.getByTestId('mobile-source-panel').focus()
await page.keyboard.press('Enter')
const narrowFilter = page.getByRole('textbox', { name: '按机构名称或部门编码筛选待选节点' })
await narrowFilter.fill('站前路派出所综合作战室')
await page.waitForTimeout(100)
const keyboardTarget = page.getByRole('treeitem').filter({ hasText: '站前路派出所综合作战室' }).first()
await keyboardTarget.focus()
const focusOutline = await keyboardTarget.evaluate((element) => ({ outlineStyle: getComputedStyle(element).outlineStyle, outlineWidth: getComputedStyle(element).outlineWidth, outlineColor: getComputedStyle(element).outlineColor }))
await page.keyboard.press('Space')
await page.waitForTimeout(100)
facts.views.keyboardSelection = {
  focusedText: await keyboardTarget.innerText(),
  activeElementIsTreeItem: await keyboardTarget.evaluate((element) => element === document.activeElement),
  focusOutline,
  selectedCount: await page.locator('[data-testid="selected-count"]').innerText(),
  demoStatus: await page.locator('[data-testid="transfer-status"]').innerText(),
  component: await componentSnapshot(),
}
await takeComponentShot('13-keyboard-tree-selection-mobile.png')

await writeFile(path.join(outputDir, 'browser-facts.json'), `${JSON.stringify(facts, null, 2)}\n`, 'utf8')
await browser.close()
await mkdir(outputDir, { recursive: true })
console.log(JSON.stringify({ url: facts.page.url, screenshots: 13, consoleErrors: facts.consoleErrors.length, pageErrors: facts.pageErrors.length, outputDir }, null, 2))
