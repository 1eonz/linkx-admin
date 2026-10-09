import { chromium } from '../../../other-admin/admin-vue3/node_modules/@playwright/test/index.mjs'

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.goto('http://127.0.0.1:4174/components/lxtransferpanel', {
  waitUntil: 'networkidle',
})
await page.screenshot({
  path: 'F:/work/linkx-admin/.impeccable/critique/wave7-transferpanel-2026-10-08/measure-checkbox-1440.png',
  fullPage: true,
})
await page.locator('.transfer-panel-demo__preview').screenshot({
  path: 'F:/work/linkx-admin/.impeccable/critique/wave7-transferpanel-2026-10-08/measure-checkbox-component-1440.png',
})

const measure = async (viewport) => {
  await page.setViewportSize(viewport)
  await page.reload({ waitUntil: 'networkidle' })
  if (viewport.width === 375) {
    await page.screenshot({
      path: 'F:/work/linkx-admin/.impeccable/critique/wave7-transferpanel-2026-10-08/measure-checkbox-375.png',
      fullPage: true,
    })
    await page.locator('.transfer-panel-demo__preview').screenshot({
      path: 'F:/work/linkx-admin/.impeccable/critique/wave7-transferpanel-2026-10-08/measure-checkbox-component-375.png',
    })
  }
  return page.locator('.lx-transfer-panel__panel').first().locator('.lx-virtual-tree__row').first().evaluate((row) => {
    const read = (selector) => {
      const element = row.querySelector(selector)
      if (!element) return null
      const bounds = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return {
        selector,
        rect: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
        css: { width: style.width, height: style.height, boxSizing: style.boxSizing, appearance: style.appearance },
      }
    }
    return {
      viewport,
      row: read('.lx-virtual-tree__row') ?? {
        rect: (() => { const r = row.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } })(),
      },
      control: read('.lx-virtual-tree__checkbox-control'),
      input: read('.lx-virtual-tree__checkbox'),
      rowStyle: (() => { const s = getComputedStyle(row); return { display: s.display, gridTemplateColumns: s.gridTemplateColumns, gap: s.gap } })(),
    }
  })
}

const desktop = await measure({ width: 1440, height: 1000 })
await page.setViewportSize({ width: 1440, height: 1000 })
await page.reload({ waitUntil: 'networkidle' })
const desktopDisclosure = page.locator('.lx-transfer-panel__selected-name-disclosure').filter({
  hasText: '历史授权单位（记录中）',
})
const desktopDisclosureCount = await desktopDisclosure.count()
let expandedDesktopDisclosure = null
if (desktopDisclosureCount) {
  const list = page.locator('.lx-transfer-panel__selected')
  const before = await list.evaluate((element) => element.scrollTop)
  await desktopDisclosure.locator('summary').focus()
  await desktopDisclosure.locator('summary').press('Enter')
  await page.waitForTimeout(100)
  expandedDesktopDisclosure = await desktopDisclosure.evaluate((details) => {
    const list = details.closest('.lx-transfer-panel__selected')
    const item = details.closest('.lx-transfer-panel__selected-item')
    const main = details.closest('.lx-transfer-panel__selected-main')
    const summary = details.querySelector('summary')
    const name = details.querySelector('.lx-transfer-panel__selected-name-full')
    const read = (element) => {
      const r = element.getBoundingClientRect()
      return { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, bottom: r.bottom }
    }
    return {
      details: read(details), item: read(item), main: read(main), summary: read(summary), name: read(name), list: read(list), scrollTop: list.scrollTop,
      styles: Object.fromEntries([details, main, summary].map((element) => [element.className, {
        display: getComputedStyle(element).display,
        flex: getComputedStyle(element).flex,
        minWidth: getComputedStyle(element).minWidth,
        width: getComputedStyle(element).width,
      }])),
    }
  })
  expandedDesktopDisclosure.before = before
}
desktop.selectedItems = await page.locator('.lx-transfer-panel__selected-item').evaluateAll((items) => items.slice(0, 4).map((item) => {
  const name = item.querySelector('.lx-transfer-panel__selected-name')
  const code = item.querySelector('.lx-transfer-panel__node-code')
  const status = item.querySelector('.lx-transfer-panel__node-status')
  return {
    height: item.getBoundingClientRect().height,
    nameTop: name?.getBoundingClientRect().top,
    codeTop: code?.getBoundingClientRect().top,
    statusTop: status?.getBoundingClientRect().top,
  }
}))
const mobile = await measure({ width: 390, height: 844 })
await page.getByTestId('mobile-selected-panel').click()
mobile.longName = await page.locator('.lx-transfer-panel__selected-name').filter({
  hasText: '历史授权单位（记录中）',
}).evaluate((element) => {
  const range = document.createRange()
  const textNode = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE)
  if (textNode) range.selectNodeContents(textNode)
  const bounds = element.getBoundingClientRect()
  const main = element.closest('.lx-transfer-panel__selected-main')
  const item = element.closest('.lx-transfer-panel__selected-item')
  return {
    box: { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom, width: bounds.width, height: bounds.height },
    scroll: { clientWidth: element.clientWidth, scrollWidth: element.scrollWidth },
    textRects: [...range.getClientRects()].map((rect) => ({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom })),
    style: { display: getComputedStyle(element).display, overflow: getComputedStyle(element).overflow, whiteSpace: getComputedStyle(element).whiteSpace },
    parents: [main, item].map((parent) => ({ className: parent.className, width: parent.getBoundingClientRect().width, clientWidth: parent.clientWidth, flex: getComputedStyle(parent).flex, flexWrap: getComputedStyle(parent).flexWrap })),
  }
})
console.log(JSON.stringify({ desktop, desktopDisclosureCount, expandedDesktopDisclosure, mobile }, null, 2))
await browser.close()
