import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'file:///F:/work/linkx-admin/other-admin/admin-vue3/node_modules/@playwright/test/index.mjs'

const baseUrl = 'http://127.0.0.1:4175'
const outDir = new URL('./', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]):)/, '$1:')

await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})
const results = []

async function safeText(locator) {
  try {
    return (await locator.innerText()).trim()
  } catch {
    return null
  }
}

async function capturePage(slug, path) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const url = `${baseUrl}${path}`
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.screenshot({ path: `${outDir}/${slug}-desktop.png`, fullPage: true })
  const data = await page.evaluate(() => ({
    title: document.title,
    url: location.href,
    viewport: { width: innerWidth, height: innerHeight },
    document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
    heading: document.querySelector('h1')?.textContent?.trim() ?? null,
    bodyText: document.body.innerText.slice(0, 10000),
  }))
  await writeFile(`${outDir}/${slug}-desktop.json`, JSON.stringify(data, null, 2))
  results.push({ slug, phase: 'desktop', ...data })
  return page
}

async function closePage(page) {
  await page.close()
}

const cascader = await capturePage('cascader', '/components/lxcascader')
const cascaderInput = cascader.locator('.lx-cascader input').first()
const cascaderStateButtons = cascader.locator('.cascader-demo__toolbar button')
const cascaderButtonTexts = await cascaderStateButtons.allTextContents()
const cascaderReadyInput = await cascaderInput.getAttribute('aria-label')
const cascaderReadyDescribedBy = await cascaderInput.getAttribute('aria-describedby')
await cascader.locator('.cascader-demo__settings summary').click()
await cascader.getByRole('button', { name: '失败', exact: true }).click()
await cascaderInput.focus()
await cascader.waitForTimeout(200)
const cascaderError = await cascader.evaluate(() => {
  const input = document.querySelector('.lx-cascader input')
  const wrapper = document.querySelector('.lx-cascader .el-input__wrapper')
  const feedback = document.querySelector('.lx-cascader__feedback')
  const retry = document.querySelector('.lx-cascader__feedback .lx-cascader__retry')
  return {
    input: input ? {
      ariaInvalid: input.getAttribute('aria-invalid'),
      describedBy: input.getAttribute('aria-describedby'),
      focused: document.activeElement === input,
    } : null,
    wrapperClass: wrapper?.className ?? null,
    wrapper: wrapper ? getComputedStyle(wrapper).boxShadow : null,
    feedback: feedback?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
    feedbackRole: feedback?.getAttribute('role') ?? null,
    retryMinHeight: retry ? getComputedStyle(retry).minHeight : null,
  }
})
await cascader.screenshot({ path: `${outDir}/cascader-error-focused.png`, fullPage: true })
await cascader.getByRole('checkbox', { name: '控件英文' }).check()
await cascader.getByRole('button', { name: '失败', exact: true }).click()
const cascaderEnglish = await cascader.locator('.lx-cascader__feedback').innerText()
await cascader.setViewportSize({ width: 375, height: 812 })
await cascader.reload({ waitUntil: 'networkidle' })
await cascader.screenshot({ path: `${outDir}/cascader-mobile.png`, fullPage: true })
const cascaderMobile = await cascader.evaluate(() => ({
  viewport: { width: innerWidth, height: innerHeight },
  documentWidth: document.documentElement.scrollWidth,
  bodyWidth: document.body.scrollWidth,
  inputHeight: (() => { const el = document.querySelector('.lx-cascader .el-input__wrapper'); return el ? Math.round(el.getBoundingClientRect().height) : null })(),
  toolbarButtons: [...document.querySelectorAll('.cascader-demo__toolbar button')].map((el) => ({ text: el.textContent?.trim(), height: Math.round(el.getBoundingClientRect().height) })),
}))
results.push({ slug: 'cascader', phase: 'interactions', stateButtons: cascaderButtonTexts, readyInputAriaLabel: cascaderReadyInput, readyDescribedBy: cascaderReadyDescribedBy, error: cascaderError, englishFeedback: cascaderEnglish, mobile: cascaderMobile })
await closePage(cascader)

const descriptions = await capturePage('descriptions', '/components/lxdescriptions')
const descContent = await descriptions.locator('.lx-descriptions').first().evaluate((root) => ({
  rect: (() => { const r = root.getBoundingClientRect(); return { width: Math.round(r.width), height: Math.round(r.height) } })(),
  text: root.textContent?.replace(/\s+/g, ' ').trim(),
  rows: [...root.querySelectorAll('.lx-descriptions__item')].map((el) => ({
    text: el.textContent?.replace(/\s+/g, ' ').trim(),
    height: Math.round(el.getBoundingClientRect().height),
    labelWidth: getComputedStyle(el).getPropertyValue('--lx-descriptions-label-width'),
  })),
  buttons: [...root.querySelectorAll('button')].map((el) => ({ text: el.textContent?.trim(), aria: el.getAttribute('aria-label') })),
}))
const descButtons = descriptions.locator('.lx-descriptions button')
const descButtonCount = await descButtons.count()
let descCopyResult = null
if (descButtonCount > 0) {
  await descButtons.first().focus()
  const before = await descButtons.first().getAttribute('aria-label')
  await descButtons.first().press('Enter')
  descCopyResult = { count: descButtonCount, ariaLabel: before, focused: await descButtons.first().evaluate((el) => document.activeElement === el) }
}
await descriptions.setViewportSize({ width: 375, height: 812 })
await descriptions.reload({ waitUntil: 'networkidle' })
await descriptions.screenshot({ path: `${outDir}/descriptions-mobile.png`, fullPage: true })
const descMobile = await descriptions.evaluate(() => ({
  viewport: { width: innerWidth, height: innerHeight },
  documentWidth: document.documentElement.scrollWidth,
  bodyWidth: document.body.scrollWidth,
  drawers: [...document.querySelectorAll('[role="dialog"]')].map((el) => ({ width: Math.round(el.getBoundingClientRect().width), height: Math.round(el.getBoundingClientRect().height), text: el.textContent?.replace(/\s+/g, ' ').trim().slice(0, 500) })),
  descriptions: [...document.querySelectorAll('.lx-descriptions')].map((el) => ({ width: Math.round(el.getBoundingClientRect().width), height: Math.round(el.getBoundingClientRect().height) })),
}))
results.push({ slug: 'descriptions', phase: 'interactions', content: descContent, copy: descCopyResult, mobile: descMobile })
await closePage(descriptions)

const virtualTree = await capturePage('virtualtree', '/components/lxvirtualtree')
const details = virtualTree.locator('summary').filter({ hasText: '演示状态和更多操作' })
if (await details.count()) await details.click()
const tree = virtualTree.getByRole('tree', { name: '组织结构' })
const treeData = await tree.evaluate((root) => ({
  rect: (() => { const r = root.getBoundingClientRect(); return { width: Math.round(r.width), height: Math.round(r.height) } })(),
  treeitems: [...root.querySelectorAll('[role="treeitem"]')].slice(0, 12).map((el) => ({ text: el.textContent?.replace(/\s+/g, ' ').trim(), tabindex: el.getAttribute('tabindex'), ariaExpanded: el.getAttribute('aria-expanded'), ariaSelected: el.getAttribute('aria-selected') })),
  buttons: [...root.querySelectorAll('button')].slice(0, 12).map((el) => ({ text: el.textContent?.trim(), aria: el.getAttribute('aria-label'), tabindex: el.getAttribute('tabindex') })),
  checkboxes: [...root.querySelectorAll('input[type="checkbox"]')].slice(0, 8).map((el) => ({ checked: el.checked, tabindex: el.getAttribute('tabindex') })),
}))
const firstRow = tree.getByRole('treeitem').first()
await firstRow.focus()
await firstRow.press('ArrowRight')
const focusedTree = await virtualTree.evaluate(() => ({ active: document.activeElement?.getAttribute('role'), activeText: document.activeElement?.textContent?.replace(/\s+/g, ' ').trim(), treeitemCount: document.querySelectorAll('[role="treeitem"]').length }))
const filter = virtualTree.getByRole('searchbox', { name: '过滤节点' })
await filter.fill('执勤单元 01')
const clear = virtualTree.getByRole('button', { name: '清除过滤' })
const clearBox = await clear.boundingBox()
await clear.click()
await virtualTree.setViewportSize({ width: 375, height: 812 })
await virtualTree.reload({ waitUntil: 'networkidle' })
const mobileDetails = virtualTree.locator('summary').filter({ hasText: '演示状态和更多操作' })
if (await mobileDetails.count()) await mobileDetails.click()
await virtualTree.screenshot({ path: `${outDir}/virtualtree-mobile.png`, fullPage: true })
const virtualMobile = await virtualTree.evaluate(() => ({
  viewport: { width: innerWidth, height: innerHeight },
  documentWidth: document.documentElement.scrollWidth,
  bodyWidth: document.body.scrollWidth,
  treeRect: (() => { const el = document.querySelector('[role="tree"]'); if (!el) return null; const r = el.getBoundingClientRect(); return { width: Math.round(r.width), height: Math.round(r.height) } })(),
  expandTarget: (() => { const el = document.querySelector('[role="tree"] button'); if (!el) return null; const r = el.getBoundingClientRect(); return { width: Math.round(r.width), height: Math.round(r.height), aria: el.getAttribute('aria-label') } })(),
  checkboxTarget: (() => { const el = document.querySelector('[role="tree"] input[type="checkbox"]'); if (!el) return null; const r = el.getBoundingClientRect(); return { width: Math.round(r.width), height: Math.round(r.height), tabindex: el.getAttribute('tabindex') } })(),
}))
results.push({ slug: 'virtualtree', phase: 'interactions', tree: treeData, focused: focusedTree, clearBox, mobile: virtualMobile })
await closePage(virtualTree)

const sidebar = await capturePage('sidebar', '/components/lxsidebar')
const basic = sidebar.locator('.demo-box').first()
const group = basic.getByRole('button', { name: '协同岗管理' })
await group.focus()
const focusOutline = await group.evaluate((el) => getComputedStyle(el).outlineStyle)
await group.press('Enter')
const expanded = await group.getAttribute('aria-expanded')
const child = basic.getByRole('button', { name: '协同岗设置' })
await child.click()
const selectionCount = await safeText(basic.getByTestId('sidebar-selection-count'))
const controlled = sidebar.locator('.demo-box').nth(1)
await controlled.getByRole('button', { name: '收起导航' }).click()
const railGroup = controlled.getByRole('button', { name: '协同岗管理' })
await railGroup.focus()
await railGroup.press('Enter')
const popper = sidebar.locator('.lx-sidebar-popper')
const railChild = popper.getByRole('button', { name: '协同岗设置' })
const railChildFocused = await railChild.evaluate((el) => document.activeElement === el)
await sidebar.keyboard.press('Escape')
const popperCountAfterEscape = await popper.count()
const railGroupFocusedAfterEscape = await railGroup.evaluate((el) => document.activeElement === el)
await sidebar.setViewportSize({ width: 375, height: 780 })
await sidebar.reload({ waitUntil: 'networkidle' })
const controlledMobile = sidebar.locator('.demo-box').nth(1)
const openButton = controlledMobile.getByRole('button', { name: '打开移动端导航' })
await openButton.focus()
await openButton.press('Enter')
const drawer = sidebar.getByRole('dialog', { name: '移动端主导航' })
const drawerVisible = await drawer.isVisible()
const closeButton = drawer.getByRole('button', { name: '关闭导航' })
const closeFocused = await closeButton.evaluate((el) => document.activeElement === el)
await sidebar.keyboard.press('Escape')
const drawerAfterEscape = await sidebar.getByRole('dialog', { name: '移动端主导航' }).count()
const openFocusedAfterEscape = await openButton.evaluate((el) => document.activeElement === el)
await sidebar.screenshot({ path: `${outDir}/sidebar-mobile.png`, fullPage: true })
const sidebarMobile = await sidebar.evaluate(() => ({
  viewport: { width: innerWidth, height: innerHeight },
  documentWidth: document.documentElement.scrollWidth,
  bodyWidth: document.body.scrollWidth,
}))
results.push({ slug: 'sidebar', phase: 'interactions', expanded, focusOutline, selectionCount, railChildFocused, popperCountAfterEscape, railGroupFocusedAfterEscape, mobile: { drawerVisible, closeFocused, drawerAfterEscape, openFocusedAfterEscape, ...sidebarMobile } })
await closePage(sidebar)

await writeFile(`${outDir}/runtime-results.json`, JSON.stringify(results, null, 2))
await browser.close()
console.log(JSON.stringify(results, null, 2))
