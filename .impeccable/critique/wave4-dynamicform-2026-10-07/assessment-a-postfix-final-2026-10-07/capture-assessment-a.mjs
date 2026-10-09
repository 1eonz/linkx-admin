import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const root = process.cwd()
const require = createRequire(path.join(root, 'other-admin/admin-vue3/package.json'))
const { chromium } = require('@playwright/test')
const output = path.join(
  root,
  '.impeccable/critique/wave4-dynamicform-2026-10-07/assessment-a-postfix-final-2026-10-07',
)
const screenshots = path.join(output, 'screenshots')
fs.mkdirSync(screenshots, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  colorScheme: 'light',
})
const evidence = []
const consoleErrors = []
const pageErrors = []
const failedRequests = []
context.on('page', (page) => {
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push({ url: page.url(), text: message.text() })
    }
  })
  page.on('pageerror', (error) => {
    pageErrors.push({ url: page.url(), message: error.message })
  })
  page.on('requestfailed', (request) => {
    failedRequests.push({ url: request.url(), error: request.failure()?.errorText })
  })
})

async function capture(page, name, fullPage = false) {
  const file = `${name}.png`
  await page.screenshot({ path: path.join(screenshots, file), fullPage })
  evidence.push({ file, url: page.url(), viewport: page.viewportSize(), fullPage })
}

async function open(page, route, width = 1440, height = 1000) {
  await page.setViewportSize({ width, height })
  await page.goto(`http://127.0.0.1:4174/components/${route}`, {
    waitUntil: 'networkidle',
  })
  await page.locator('h1').first().waitFor()
  await page.waitForTimeout(300)
}

async function setHud(page, label) {
  const checkbox = page.locator('input[type="checkbox"]').filter({ has: page.getByText(label) })
  const target = page.getByText(label, { exact: true }).first()
  if (await checkbox.count()) {
    await checkbox.first().check({ force: true })
  } else {
    await target.click()
  }
  await page.waitForTimeout(200)
}

const dynamic = await context.newPage()
await open(dynamic, 'lxdynamicform')
await capture(dynamic, 'dynamic-desktop-light-top')
await dynamic.getByRole('button', { name: '提交校验' }).click()
await dynamic.waitForTimeout(200)
const validationErrors = await dynamic.locator('.el-form-item__error:visible').allTextContents()
await capture(dynamic, 'dynamic-desktop-light-validation')
await dynamic.getByRole('link', { name: '浏览全部字段类型' }).click()
await dynamic.locator('#dynamic-form-schema-category').waitFor()
await dynamic.evaluate(() => window.scrollBy(0, -180))

const categoryNames = ['文本类字段', '单值选择', '日期与数值', '多值、状态与扩展']
const categoryCounts = []
const categorySelect = dynamic.getByRole('combobox', { name: '字段类别' })
const typeSelect = dynamic.getByRole('combobox', { name: '字段类型' })
for (const [index, category] of categoryNames.entries()) {
  await categorySelect.focus()
  await categorySelect.press('Enter')
  await categorySelect.press('Home')
  for (let arrow = 0; arrow < index; arrow += 1) {
    await categorySelect.press('ArrowDown')
  }
  await categorySelect.press('Enter')
  await typeSelect.focus()
  await typeSelect.press('ArrowDown')
  await dynamic.locator('.el-select-dropdown:visible [role="option"]').first().waitFor()
  await dynamic.waitForTimeout(100)
  const typeListId = await typeSelect.getAttribute('aria-controls')
  const options = await dynamic
    .locator(`[id="${typeListId}"] [role="option"]`)
    .allTextContents()
  categoryCounts.push({ category, count: options.length, options })
  await capture(dynamic, `dynamic-desktop-light-types-${categoryCounts.length}`)
  await dynamic.keyboard.press('Escape')
}
await dynamic.locator('.dynamic-form-demo__settings summary').click()
await setHud(dynamic, '文档站整体深色（HUD）')
await capture(dynamic, 'dynamic-desktop-hud-types')

const dynamicMobile = await context.newPage()
await open(dynamicMobile, 'lxdynamicform', 375, 812)
await capture(dynamicMobile, 'dynamic-mobile-light-top')
await dynamicMobile.getByRole('button', { name: '提交校验' }).click()
await dynamicMobile.waitForTimeout(200)
await capture(dynamicMobile, 'dynamic-mobile-light-validation')
await dynamicMobile.getByRole('link', { name: '浏览全部字段类型' }).click()
const mobileCategorySelect = dynamicMobile.getByRole('combobox', { name: '字段类别' })
await mobileCategorySelect.focus()
await mobileCategorySelect.press('Enter')
await mobileCategorySelect.press('Home')
await mobileCategorySelect.press('ArrowDown')
await mobileCategorySelect.press('ArrowDown')
await mobileCategorySelect.press('ArrowDown')
await mobileCategorySelect.press('Enter')
const mobileTypeSelect = dynamicMobile.getByRole('combobox', { name: '字段类型' })
await mobileTypeSelect.focus()
await mobileTypeSelect.press('ArrowDown')
await dynamicMobile.locator('.el-select-dropdown:visible [role="option"]').first().waitFor()
const mobileTypeListId = await mobileTypeSelect.getAttribute('aria-controls')
const mobileTypeCount = await dynamicMobile
  .locator(`[id="${mobileTypeListId}"] [role="option"]`)
  .count()
await capture(dynamicMobile, 'dynamic-mobile-light-category-options')
await dynamicMobile.keyboard.press('Escape')
await dynamicMobile.locator('.dynamic-form-demo__settings summary').click()
await setHud(dynamicMobile, '文档站整体深色（HUD）')
await capture(dynamicMobile, 'dynamic-mobile-hud')

const date = await context.newPage()
await open(date, 'lxdatepicker')
await capture(date, 'date-desktop-light-overview', true)
await date.locator('input[placeholder="开始日期"]').first().click()
await date.locator('.el-picker-panel:visible').first().waitFor()
await date.waitForTimeout(500)
const desktopPanelCount = await date.locator('.el-picker-panel:visible').count()
await capture(date, 'date-desktop-light-range-open')
await date.keyboard.press('Escape')
await setHud(date, 'HUD 深色主题')
await date.locator('input[placeholder="开始日期"]').first().click()
await date.locator('.el-picker-panel:visible').first().waitFor()
await date.waitForTimeout(500)
await capture(date, 'date-desktop-hud-range-open')

const dateMobile = await context.newPage()
await open(dateMobile, 'lxdatepicker', 375, 812)
await capture(dateMobile, 'date-mobile-light-overview')
await dateMobile.locator('input[placeholder="开始日期"]').first().click()
await dateMobile.locator('.el-picker-panel:visible').first().waitFor()
await dateMobile.waitForTimeout(500)
const mobilePanelCount = await dateMobile.locator('.el-picker-panel:visible').count()
await capture(dateMobile, 'date-mobile-light-range-open')
await dateMobile.keyboard.press('Escape')
await setHud(dateMobile, 'HUD 深色主题')
await dateMobile.locator('input[placeholder="开始日期"]').first().click()
await dateMobile.locator('.el-picker-panel:visible').first().waitFor()
await dateMobile.waitForTimeout(500)
await capture(dateMobile, 'date-mobile-hud-range-open')
await dateMobile.keyboard.press('Escape')
await capture(dateMobile, 'date-mobile-hud-validation')

const upload = await context.newPage()
await open(upload, 'lxupload')
await capture(upload, 'upload-desktop-light-idle')
await upload.getByRole('button', { name: '下一次上传失败' }).click()
await upload.locator('input[type="file"]').setInputFiles({
  name: '排班导入.csv',
  mimeType: 'text/csv',
  buffer: Buffer.from('date,shift\n2026-10-07,day\n'),
})
await upload.getByRole('button', { name: '开始上传' }).click()
await upload.getByRole('button', { name: '重新上传' }).waitFor({ timeout: 10000 })
const failureText = await upload.locator('.lx-upload__file-error:visible').allTextContents()
await capture(upload, 'upload-desktop-light-failure')
await upload.getByRole('button', { name: '重新上传' }).click()
await upload.locator('.lx-upload__file-status.is-success').waitFor({ timeout: 10000 })
await upload.getByText('排班导入.csv', { exact: true }).waitFor()
const recoveryStatus = await upload.locator('[data-testid="upload-last-action"]').innerText()
await capture(upload, 'upload-desktop-light-recovered')
await setHud(upload, 'HUD 深色主题')
await capture(upload, 'upload-desktop-hud-recovered')

const uploadMobile = await context.newPage()
await open(uploadMobile, 'lxupload', 375, 812)
await capture(uploadMobile, 'upload-mobile-light-idle')
await uploadMobile.getByRole('button', { name: '下一次上传失败' }).click()
await uploadMobile.locator('input[type="file"]').setInputFiles({
  name: '周末超长文件名排班明细2026年最终版.csv',
  mimeType: 'text/csv',
  buffer: Buffer.from('date,shift\n2026-10-10,night\n'),
})
await uploadMobile.getByRole('button', { name: '开始上传' }).click()
await uploadMobile.getByRole('button', { name: '重新上传' }).waitFor({ timeout: 10000 })
await capture(uploadMobile, 'upload-mobile-light-failure')
await uploadMobile.getByRole('button', { name: '重新上传' }).click()
await uploadMobile.locator('.lx-upload__file-status.is-success').waitFor({ timeout: 10000 })
await capture(uploadMobile, 'upload-mobile-light-recovered')
await setHud(uploadMobile, 'HUD 深色主题')
await capture(uploadMobile, 'upload-mobile-hud-recovered')

for (const [route, key] of [
  ['lxdynamicform', 'dynamic'],
  ['lxdatepicker', 'date'],
  ['lxupload', 'upload'],
]) {
  const page = await context.newPage()
  await open(page, route)
  await capture(page, `doc-${key}-desktop-light-full`, true)
  await open(page, route, 375, 812)
  await capture(page, `doc-${key}-mobile-light-top`)
  await page.close()
}

const result = {
  assessedAt: new Date().toISOString(),
  browser: 'Google Chrome via Playwright, independent new browser context',
  server: 'http://127.0.0.1:4174 (owned and kept alive by parent task)',
  categoryCounts,
  mobileTypeCount,
  validationErrors,
  desktopPanelCount,
  mobilePanelCount,
  failureText,
  recoveryStatus,
  consoleErrors,
  pageErrors,
  failedRequests,
  screenshotCount: evidence.length,
  screenshots: evidence,
}
fs.writeFileSync(path.join(output, 'browser-evidence.json'), `${JSON.stringify(result, null, 2)}\n`)
await browser.close()
console.log(JSON.stringify({
  screenshotCount: result.screenshotCount,
  categoryCounts,
  mobileTypeCount,
  validationErrors,
  desktopPanelCount,
  mobilePanelCount,
  failureText,
  recoveryStatus,
}))
