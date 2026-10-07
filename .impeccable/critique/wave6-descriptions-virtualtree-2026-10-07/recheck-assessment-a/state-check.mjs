import { writeFile } from 'node:fs/promises'
import { chromium } from 'file:///F:/work/linkx-admin/other-admin/admin-vue3/node_modules/@playwright/test/index.mjs'

const outDir = 'F:/work/linkx-admin/.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/recheck-assessment-a'
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})
const baseUrl = 'http://127.0.0.1:4175'
const result = {}

{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${baseUrl}/components/lxcascader`, { waitUntil: 'networkidle' })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('.cascader-demo__settings summary').click()
  const loadingButton = page.getByRole('button', { name: '加载中', exact: true })
  const loadingErrorButton = page.getByRole('button', { name: '加载中且失败', exact: true })
  const errorButton = page.getByRole('button', { name: '失败', exact: true })
  await loadingButton.click()
  const loading = await page.evaluate(() => ({
    busy: document.querySelector('.lx-cascader-field')?.getAttribute('aria-busy'),
    invalid: document.querySelector('.lx-cascader input')?.getAttribute('aria-invalid'),
    feedback: document.querySelector('.lx-cascader__feedback')?.textContent?.replace(/\s+/g, ' ').trim(),
    retryCount: document.querySelectorAll('.lx-cascader__retry').length,
    inputDisabled: document.querySelector('.lx-cascader input')?.hasAttribute('disabled'),
  }))
  await loadingErrorButton.click()
  const loadingError = await page.evaluate(() => ({
    busy: document.querySelector('.lx-cascader-field')?.getAttribute('aria-busy'),
    invalid: document.querySelector('.lx-cascader input')?.getAttribute('aria-invalid'),
    feedback: document.querySelector('.lx-cascader__feedback')?.textContent?.replace(/\s+/g, ' ').trim(),
    retryCount: document.querySelectorAll('.lx-cascader__retry').length,
  }))
  await errorButton.click()
  const errorInput = page.locator('.lx-cascader input')
  await errorInput.focus()
  await page.waitForTimeout(150)
  const error = await page.evaluate(() => {
    const input = document.querySelector('.lx-cascader input')
    const wrapper = document.querySelector('.lx-cascader .el-input__wrapper')
    const errorText = document.querySelector('.lx-cascader__feedback span')
    return {
      ariaInvalid: input?.getAttribute('aria-invalid'),
      ariaDescribedBy: input?.getAttribute('aria-describedby'),
      errorId: errorText?.id,
      focusClass: wrapper?.className,
      focusBorder: wrapper ? getComputedStyle(wrapper).boxShadow : null,
      transition: wrapper ? getComputedStyle(wrapper).transitionDuration : null,
    }
  })
  await page.getByRole('checkbox', { name: '控件英文' }).check()
  const english = await page.locator('.lx-cascader__feedback').innerText()
  await page.getByRole('button', { name: '禁用', exact: true }).click()
  const disabled = await page.evaluate(() => ({
    inputDisabled: document.querySelector('.lx-cascader input')?.hasAttribute('disabled'),
    triggerClass: document.querySelector('.lx-cascader .el-input')?.className,
    feedback: document.querySelector('.cascader-demo__status')?.textContent?.replace(/\s+/g, ' ').trim(),
  }))
  result.cascader = { loading, loadingError, error, english, disabled }
  await page.close()
}

{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${baseUrl}/components/lxdescriptions`, { waitUntil: 'networkidle' })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const controls = page.locator('.lx-descriptions-demo__controls')
  await controls.getByRole('button', { name: '错误', exact: true }).click()
  const errorBefore = await page.evaluate(() => ({
    role: document.querySelector('.lx-descriptions-demo__state')?.getAttribute('role'),
    text: document.querySelector('.lx-descriptions-demo__state')?.textContent?.replace(/\s+/g, ' ').trim(),
    visibleDescriptions: document.querySelectorAll('.lx-descriptions-demo__main .lx-descriptions').length,
  }))
  await page.getByRole('button', { name: '重试', exact: true }).click()
  const afterRetry = await page.locator('.lx-descriptions-demo__main .lx-descriptions').count()
  await controls.getByRole('button', { name: '读取中', exact: true }).click()
  const loading = await page.evaluate(() => ({
    role: document.querySelector('.lx-descriptions-demo__state')?.getAttribute('role'),
    busy: document.querySelector('.lx-descriptions-demo__state')?.getAttribute('aria-busy'),
  }))
  await controls.getByRole('button', { name: '空结果', exact: true }).click()
  const empty = await page.evaluate(() => ({
    role: document.querySelector('.lx-descriptions-demo__state')?.getAttribute('role'),
    text: document.querySelector('.lx-descriptions-demo__state')?.textContent?.replace(/\s+/g, ' ').trim(),
  }))
  await controls.getByRole('button', { name: '详情', exact: true }).click()
  const copy = page.locator('.lx-descriptions-demo .lx-code-slot--copyable').first()
  await copy.focus()
  const copyFocus = await copy.evaluate((el) => ({ focused: document.activeElement === el, outline: getComputedStyle(el).outlineStyle, label: el.getAttribute('aria-label') }))
  await controls.getByRole('checkbox', { name: 'HUD 深色主题（整页）' }).check()
  const theme = await page.evaluate(() => ({ htmlDark: document.documentElement.classList.contains('dark'), htmlHud: document.documentElement.classList.contains('lx-theme-hud') }))
  const motion = await page.locator('.lx-descriptions__item').first().evaluate((el) => getComputedStyle(el).transitionDuration)
  result.descriptions = { errorBefore, afterRetry, loading, empty, copyFocus, theme, reducedMotionTransition: motion }
  await page.close()
}

{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${baseUrl}/components/lxvirtualtree`, { waitUntil: 'networkidle' })
  await page.locator('summary').filter({ hasText: '演示状态和更多操作' }).click()
  const controls = page.locator('.virtual-tree-demo__controls')
  await controls.getByRole('button', { name: '加载失败', exact: true }).click()
  const error = await page.evaluate(() => ({
    role: document.querySelector('.virtual-tree-demo__message')?.getAttribute('role'),
    text: document.querySelector('.virtual-tree-demo__message')?.textContent?.replace(/\s+/g, ' ').trim(),
  }))
  await page.getByRole('button', { name: '重试', exact: true }).click()
  const retryTree = await page.getByRole('tree', { name: '组织结构' }).count()
  await controls.getByRole('button', { name: '空结果', exact: true }).click()
  const empty = await page.evaluate(() => ({
    treeCount: document.querySelectorAll('[role="tree"]').length,
    emptyText: document.querySelector('.lx-virtual-tree__empty')?.textContent?.trim(),
    status: document.querySelector('.virtual-tree-demo__status')?.textContent?.trim(),
  }))
  await controls.getByRole('button', { name: '正常数据', exact: true }).click()
  await controls.getByRole('button', { name: '展开全部', exact: true }).click()
  const expandedAll = await page.getByRole('tree').getByRole('treeitem').count()
  await controls.getByRole('button', { name: '收起全部', exact: true }).click()
  const collapsedAll = await page.getByRole('tree').getByRole('treeitem').count()
  result.virtualTree = { error, retryTree, empty, expandedAll, collapsedAll }
  await page.close()
}

{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${baseUrl}/components/lxsidebar`, { waitUntil: 'networkidle' })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const basic = page.locator('.demo-box').first()
  const group = basic.getByRole('button', { name: '协同岗管理' })
  await group.focus()
  await group.press('Enter')
  await group.press('Space')
  const groupKeyboard = { expandedAfterSpace: await group.getAttribute('aria-expanded'), outline: await group.evaluate((el) => getComputedStyle(el).outlineStyle) }
  const controlled = page.locator('.demo-box').nth(1)
  await controlled.getByRole('button', { name: '收起导航' }).click()
  const railGroup = controlled.getByRole('button', { name: '协同岗管理' })
  await railGroup.focus()
  await railGroup.press('Enter')
  const rail = page.locator('.lx-sidebar-popper')
  const railChild = rail.getByRole('button', { name: '协同岗设置' })
  const railFocus = await railChild.evaluate((el) => ({ focused: document.activeElement === el, outline: getComputedStyle(el).outlineStyle }))
  await page.keyboard.press('Escape')
  const railEscape = { popper: await rail.count(), triggerFocused: await railGroup.evaluate((el) => document.activeElement === el) }
  const brandMotion = await basic.locator('.lx-sidebar-brand__ring').evaluate((el) => ({ animation: getComputedStyle(el).animationName, duration: getComputedStyle(el).animationDuration }))
  result.sidebar = { groupKeyboard, railFocus, railEscape, brandMotion }
  await page.close()
}

await writeFile(`${outDir}/state-results.json`, JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
await browser.close()
