const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { chromium } = require('playwright')

const outputDir = __dirname
const base = 'http://127.0.0.1:4174/components'
const observations = {
  target: [
    `${base}/lxtransferpanel`,
    `${base}/lxvirtualtree`,
  ],
  browser: '独立 Playwright Chrome 实例与全新 browser context',
  checks: [],
  screenshots: [],
}

;(async () => {
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  colorScheme: 'light',
  reducedMotion: 'no-preference',
})
context.setDefaultTimeout(8000)

async function pause() {
  await new Promise((resolve) => setTimeout(resolve, 250))
}

async function screenshot(page, name, selector) {
  const destination = path.join(outputDir, name)
  if (selector) {
    await page.locator(selector).screenshot({ path: destination, animations: 'disabled' })
  } else {
    await page.screenshot({ path: destination, animations: 'disabled' })
  }
  observations.screenshots.push(destination)
}

async function openPage(name, route, componentSelector) {
  const page = await context.newPage()
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  const response = await page.goto(`${base}/${route}`, { waitUntil: 'domcontentloaded' })
  await page.locator(componentSelector).waitFor({ state: 'visible', timeout: 20000 })
  await pause()
  observations.checks.push({
    name: `${name} 页面加载`,
    status: response?.status(),
    title: await page.title(),
    pageErrors,
  })
  return page
}

async function metrics(page, name, selector) {
  const result = await page.evaluate(({ name, selector }) => {
    const target = document.querySelector(selector)
    const row = target?.querySelector('.lx-virtual-tree__row')
    const rect = target?.getBoundingClientRect()
    const panels = target?.querySelectorAll('.lx-transfer-panel__panel')
    return {
      name,
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
      },
      component: rect
        ? {
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            clientWidth: target.clientWidth,
            scrollWidth: target.scrollWidth,
          }
        : null,
      transferPanels: panels
        ? Array.from(panels).map((panel) => ({
            width: Math.round(panel.getBoundingClientRect().width),
            hidden: panel.classList.contains('is-mobile-hidden'),
          }))
        : [],
      treeRowHeight: row ? Math.round(row.getBoundingClientRect().height) : null,
      treeRowKey: row?.dataset.lxTreeKey ?? null,
      rootClasses: document.documentElement.className,
      hudClassInDemo: Boolean(target?.closest('.lx-theme-hud')),
      focus: document.activeElement
        ? {
            tag: document.activeElement.tagName,
            role: document.activeElement.getAttribute('role'),
            treeKey: document.activeElement.closest('[role="treeitem"]')?.getAttribute('data-lx-tree-key') ?? null,
            ariaLabel: document.activeElement.getAttribute('aria-label'),
          }
        : null,
    }
  }, { name, selector })
  observations.checks.push(result)
  return result
}

async function clickButton(page, name, exact = true) {
  await page.getByRole('button', { name, exact }).click()
  await pause()
}

async function openDetails(page, summary) {
  const details = page.locator('details').filter({ has: page.getByText(summary, { exact: true }) }).first()
  if (!(await details.getAttribute('open'))) await details.locator('summary').click()
  await pause()
}

try {
  const transfer = await openPage('LxTransferPanel', 'lxtransferpanel', '.lx-transfer-panel')
  const tree = await openPage('LxVirtualTree', 'lxvirtualtree', '.virtual-tree-demo .lx-virtual-tree')

  await transfer.locator('.lx-transfer-panel').scrollIntoViewIfNeeded()
  await screenshot(transfer, 'transfer-desktop-light.png')
  await screenshot(transfer, 'transfer-component-light.png', '.lx-transfer-panel')
  await metrics(transfer, 'TransferPanel 桌面浅色', '.lx-transfer-panel')

  await tree.locator('.virtual-tree-demo .lx-virtual-tree').scrollIntoViewIfNeeded()
  await screenshot(tree, 'tree-desktop-light.png')
  await screenshot(tree, 'tree-component-light.png', '.virtual-tree-demo .lx-virtual-tree')
  await metrics(tree, 'VirtualTree 桌面浅色', '.virtual-tree-demo .lx-virtual-tree')

  await openDetails(transfer, '示例状态与主题')
  await transfer.locator('.transfer-panel-demo__toolbar-group label').filter({ hasText: 'HUD 深色主题' }).locator('input').check()
  await pause()
  await transfer.locator('.lx-transfer-panel').scrollIntoViewIfNeeded()
  await screenshot(transfer, 'transfer-desktop-hud.png')
  await screenshot(transfer, 'transfer-component-hud.png', '.lx-transfer-panel')
  await metrics(transfer, 'TransferPanel 桌面 HUD', '.lx-transfer-panel')
  await transfer.locator('.transfer-panel-demo__toolbar-group[aria-label="示例参数"]').getByRole('checkbox').nth(1).uncheck()
  await pause()

  await openDetails(tree, '演示状态和更多操作')
  await tree.locator('.virtual-tree-demo__action-group').filter({ hasText: 'HUD 深色主题' }).locator('input').check()
  await pause()
  await tree.locator('.virtual-tree-demo .lx-virtual-tree').scrollIntoViewIfNeeded()
  await screenshot(tree, 'tree-desktop-hud.png')
  await screenshot(tree, 'tree-component-hud.png', '.virtual-tree-demo .lx-virtual-tree')
  await metrics(tree, 'VirtualTree 桌面 HUD', '.virtual-tree-demo .lx-virtual-tree')
  await tree.locator('.virtual-tree-demo__action-group').filter({ hasText: 'HUD 深色主题' }).locator('input').uncheck()
  await pause()

  const design = await context.newPage()
  const designResponse = await design.goto(
    pathToFileURL(path.resolve('design/虚拟滚动树 + 双栏穿梭/code.html')).href,
    { waitUntil: 'domcontentloaded' },
  )
  await pause()
  await screenshot(design, 'design-desktop.png')
  await screenshot(design, 'design-virtual-tree-spec.png', '#virtual-tree-section')
  await screenshot(design, 'design-transfer-panel-spec.png', '#transfer-panel-section')
  observations.checks.push({
    name: '设计稿页面渲染',
    status: designResponse?.status(),
    title: await design.title(),
    viewport: await design.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth })),
  })

  await transfer.locator('.transfer-panel-demo__toolbar-group[aria-label="宿主数据状态"]').getByRole('button', { name: '空结果' }).click()
  await pause()
  await screenshot(transfer, 'transfer-empty.png', '.lx-transfer-panel')
  observations.checks.push({
    name: 'TransferPanel 空结果',
    emptyTreeText: await transfer.locator('.lx-transfer-panel__tree .lx-virtual-tree__empty').textContent().catch(() => null),
    selectedItems: await transfer.locator('.lx-transfer-panel__selected-item').count(),
    status: await transfer.locator('.transfer-panel-demo__status').innerText(),
  })

  await transfer.locator('.transfer-panel-demo__toolbar-group[aria-label="宿主数据状态"]').getByRole('button', { name: '加载中' }).click()
  await pause()
  await screenshot(transfer, 'transfer-loading.png', '.transfer-panel-demo__surface')
  observations.checks.push({
    name: 'TransferPanel 加载中',
    busy: await transfer.locator('.transfer-panel-demo__surface').getAttribute('aria-busy'),
    message: await transfer.locator('.transfer-panel-demo__message').innerText(),
  })

  await transfer.locator('.transfer-panel-demo__toolbar-group[aria-label="宿主数据状态"]').getByRole('button', { name: '加载失败' }).click()
  await pause()
  await screenshot(transfer, 'transfer-error.png', '.transfer-panel-demo__surface')
  observations.checks.push({
    name: 'TransferPanel 加载失败',
    alert: await transfer.getByRole('alert').innerText(),
    retryButton: await transfer.getByRole('button', { name: '重试' }).count(),
    busy: await transfer.locator('.transfer-panel-demo__surface').getAttribute('aria-busy'),
  })

  await clickButton(transfer, '重试')
  await transfer.locator('.transfer-panel-demo__toolbar-group[aria-label="示例参数"]').getByRole('checkbox').nth(2).uncheck()
  await pause()
  await screenshot(transfer, 'transfer-inherit-disabled.png', '.lx-transfer-panel__footer')
  observations.checks.push({
    name: 'TransferPanel 缺少继承说明',
    checkboxDisabled: await transfer.locator('.lx-transfer-panel__inherit-control input[type="checkbox"]').isDisabled(),
    description: await transfer.locator('.lx-transfer-panel__inherit-description').innerText(),
  })
  await transfer.locator('.transfer-panel-demo__toolbar-group[aria-label="示例参数"]').getByRole('checkbox').nth(2).check()
  await pause()

  await tree.locator('.virtual-tree-demo__toolbar').getByRole('button', { name: '空结果' }).click()
  await pause()
  await screenshot(tree, 'tree-empty.png', '.virtual-tree-demo .lx-virtual-tree')
  observations.checks.push({
    name: 'VirtualTree 空结果',
    emptyText: await tree.locator('.lx-virtual-tree__empty').innerText(),
    rowCount: await tree.locator('.virtual-tree-demo .lx-virtual-tree__row').count(),
  })

  await tree.locator('.virtual-tree-demo__toolbar').getByRole('button', { name: '加载中' }).click()
  await pause()
  await screenshot(tree, 'tree-loading.png', '.virtual-tree-demo__message')
  observations.checks.push({
    name: 'VirtualTree 加载中',
    messageRole: await tree.locator('.virtual-tree-demo__message').getAttribute('role'),
    message: await tree.locator('.virtual-tree-demo__message').innerText(),
    treeUnmounted: (await tree.locator('.virtual-tree-demo .lx-virtual-tree').count()) === 0,
  })

  await tree.locator('.virtual-tree-demo__toolbar').getByRole('button', { name: '加载失败' }).click()
  await pause()
  await screenshot(tree, 'tree-error.png', '.virtual-tree-demo__message')
  observations.checks.push({
    name: 'VirtualTree 加载失败',
    alert: await tree.getByRole('alert').innerText(),
    retryButton: await tree.getByRole('button', { name: '重试' }).count(),
  })

  await tree.locator('.virtual-tree-demo__toolbar').getByRole('button', { name: '正常数据' }).click()
  await pause()
  await tree.emulateMedia({ reducedMotion: 'reduce' })
  await tree.locator('.virtual-tree-demo .lx-virtual-tree').scrollIntoViewIfNeeded()
  await screenshot(tree, 'tree-reduced-motion.png', '.virtual-tree-demo .lx-virtual-tree')
  observations.checks.push(await tree.evaluate(() => ({
    name: 'VirtualTree 减少动效',
    mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    rowTransition: getComputedStyle(document.querySelector('.lx-virtual-tree__row')).transitionDuration,
    rowAnimation: getComputedStyle(document.querySelector('.lx-virtual-tree__row')).animationDuration,
  })))

  await transfer.emulateMedia({ reducedMotion: 'reduce' })
  await transfer.locator('.transfer-panel-demo__toolbar-group[aria-label="宿主数据状态"]').getByRole('button', { name: '正常数据' }).click()
  await pause()
  await transfer.locator('.lx-transfer-panel').scrollIntoViewIfNeeded()
  await screenshot(transfer, 'transfer-reduced-motion.png', '.lx-transfer-panel')
  observations.checks.push(await transfer.evaluate(() => ({
    name: 'TransferPanel 减少动效',
    mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    rowTransition: getComputedStyle(document.querySelector('.lx-virtual-tree__row')).transitionDuration,
    rowAnimation: getComputedStyle(document.querySelector('.lx-virtual-tree__row')).animationDuration,
  })))
  await transfer.emulateMedia({ reducedMotion: 'no-preference' })

  for (const width of [375, 320]) {
    await transfer.setViewportSize({ width, height: 850 })
    await pause()
    await transfer.locator('.lx-transfer-panel').scrollIntoViewIfNeeded()
    await screenshot(transfer, `transfer-${width}.png`, '.lx-transfer-panel')
    const current = await metrics(transfer, `TransferPanel ${width}px`, '.lx-transfer-panel')
    observations.checks.push({
      name: `TransferPanel ${width}px 内容溢出`,
      horizontalOverflow: current.document.scrollWidth > current.document.clientWidth,
      activePanelScrollWidth: await transfer.locator('.lx-transfer-panel__panel:not(.is-mobile-hidden)').evaluate((el) => el.scrollWidth - el.clientWidth),
      treeRowHeight: current.treeRowHeight,
    })
    await transfer.locator('[data-testid="mobile-selected-panel"]').click()
    await pause()
    await screenshot(transfer, `transfer-selected-${width}.png`, '.lx-transfer-panel')
    const selectedPanel = transfer.locator('.lx-transfer-panel__panel:not(.is-mobile-hidden)')
    observations.checks.push({
      name: `TransferPanel 已选列表 ${width}px`,
      panelScrollWidth: await selectedPanel.evaluate((el) => el.scrollWidth - el.clientWidth),
      listScrollWidth: await selectedPanel.locator('.lx-transfer-panel__selected').evaluate((el) => el.scrollWidth - el.clientWidth),
      itemCount: await selectedPanel.locator('.lx-transfer-panel__selected-item').count(),
      longItemVisible: await selectedPanel.getByText('历史授权单位（记录中）：跨区域应急联动研判与协同处置权限', { exact: true }).count(),
    })
    await transfer.locator('[data-testid="mobile-source-panel"]').click()
    await pause()
  }

  await transfer.setViewportSize({ width: 375, height: 850 })
  await pause()
  const visibleTree = transfer.locator('.lx-transfer-panel__panel:not(.is-mobile-hidden) .lx-virtual-tree__row')
  await visibleTree.first().focus()
  await transfer.keyboard.press('ArrowDown')
  await pause()
  const beforeResizeFocus = await transfer.evaluate(() => ({
    role: document.activeElement.getAttribute('role'),
    key: document.activeElement.getAttribute('data-lx-tree-key'),
    rowHeight: Math.round(document.activeElement.getBoundingClientRect().height),
  }))
  await transfer.setViewportSize({ width: 320, height: 850 })
  let rowHeightSettled = true
  await transfer.waitForFunction(
    () => Math.round(document.querySelector('.lx-transfer-panel__panel:not(.is-mobile-hidden) .lx-virtual-tree__row')?.getBoundingClientRect().height ?? 0) === 80,
    { timeout: 2500 },
  ).catch(() => { rowHeightSettled = false })
  const afterResizeFocus = await transfer.evaluate(() => {
    const row = document.activeElement.closest('[role="treeitem"]')
    const firstRow = document.querySelector('.lx-transfer-panel__panel:not(.is-mobile-hidden) .lx-virtual-tree__row')
    return {
      viewportWidth: innerWidth,
      role: document.activeElement.getAttribute('role'),
      key: row?.getAttribute('data-lx-tree-key') ?? null,
      activeRowHeight: row ? Math.round(row.getBoundingClientRect().height) : null,
      firstRowHeight: firstRow ? Math.round(firstRow.getBoundingClientRect().height) : null,
      rowStyleHeight: row?.style.getPropertyValue('--lx-tree-row-height') ?? null,
    }
  })
  await transfer.keyboard.press('ArrowDown')
  await pause()
  const afterArrowFocus = await transfer.evaluate(() => ({
    role: document.activeElement.getAttribute('role'),
    key: document.activeElement.getAttribute('data-lx-tree-key'),
    rowHeight: Math.round(document.activeElement.getBoundingClientRect().height),
  }))
  observations.checks.push({
    name: 'TransferPanel 跨断点后方向键',
    beforeResizeFocus,
    afterResizeFocus,
    afterArrowFocus,
    rowHeightSettled,
    focusRestoredToTreeitem: afterResizeFocus.role === 'treeitem',
    arrowMoved: beforeResizeFocus.key !== afterArrowFocus.key,
  })
  await screenshot(transfer, 'transfer-320-keyboard-focus.png', '.lx-transfer-panel')

  for (const width of [375, 320]) {
    await tree.setViewportSize({ width, height: 850 })
    await pause()
    await tree.locator('.virtual-tree-demo .lx-virtual-tree').scrollIntoViewIfNeeded()
    await screenshot(tree, `tree-${width}.png`, '.virtual-tree-demo .lx-virtual-tree')
    const current = await metrics(tree, `VirtualTree ${width}px`, '.virtual-tree-demo .lx-virtual-tree')
    observations.checks.push({
      name: `VirtualTree ${width}px 内容溢出`,
      horizontalOverflow: current.document.scrollWidth > current.document.clientWidth,
      componentOverflow: current.component?.scrollWidth > current.component?.clientWidth,
      treeRowHeight: current.treeRowHeight,
    })
  }

  await tree.locator('.virtual-tree-demo .lx-virtual-tree__row').first().focus()
  await tree.keyboard.press('ArrowDown')
  await pause()
  await screenshot(tree, 'tree-320-keyboard-focus.png', '.virtual-tree-demo .lx-virtual-tree')
  observations.checks.push(await tree.evaluate(() => ({
    name: 'VirtualTree 方向键焦点',
    activeRole: document.activeElement.getAttribute('role'),
    activeKey: document.activeElement.getAttribute('data-lx-tree-key'),
    visibleFocus: document.activeElement.matches(':focus-visible'),
  })))
  await tree.emulateMedia({ reducedMotion: 'no-preference' })

  await transfer.setViewportSize({ width: 1440, height: 1000 })
  await pause()
  await transfer.getByRole('button', { name: '全部移除', exact: true }).click()
  const confirm = transfer.getByRole('dialog')
  await confirm.waitFor({ state: 'visible' })
  await screenshot(transfer, 'transfer-clear-confirm.png')
  observations.checks.push({
    name: 'TransferPanel 清空确认',
    message: await confirm.innerText(),
    selectionBeforeConfirmation: await transfer.locator('.transfer-panel-demo__summary').getByTestId('selected-count').innerText(),
    confirmButton: await confirm.getByRole('button', { name: '确认清空' }).count(),
    cancelButton: await confirm.getByRole('button', { name: '取消' }).count(),
  })
  await confirm.getByRole('button', { name: '取消' }).click()
  await pause()
  observations.checks.push({
    name: 'TransferPanel 取消清空',
    selectedCount: await transfer.locator('.transfer-panel-demo__summary').getByTestId('selected-count').innerText(),
    dialogClosed: (await transfer.getByRole('dialog').count()) === 0,
  })
  await transfer.getByRole('button', { name: '全部移除', exact: true }).click()
  await transfer.getByRole('dialog').getByRole('button', { name: '确认清空' }).click()
  await pause()
  await screenshot(transfer, 'transfer-cleared.png', '.lx-transfer-panel')
  observations.checks.push({
    name: 'TransferPanel 清空后',
    selectedCount: await transfer.locator('.transfer-panel-demo__summary').getByTestId('selected-count').innerText(),
    emptyText: await transfer.locator('.lx-transfer-panel__empty').innerText(),
    undoButton: await transfer.getByRole('button', { name: '撤销清空' }).count(),
  })
  await transfer.getByRole('button', { name: '撤销清空' }).click()
  await pause()
  observations.checks.push({
    name: 'TransferPanel 撤销清空',
    selectedCount: await transfer.locator('.transfer-panel-demo__summary').getByTestId('selected-count').innerText(),
    undoButton: await transfer.getByRole('button', { name: '撤销清空' }).count(),
  })

  await fs.writeFile(path.join(outputDir, 'observations.json'), `${JSON.stringify(observations, null, 2)}\n`)
  console.log(JSON.stringify(observations, null, 2))
} finally {
  await context.close()
  await browser.close()
}
})().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
