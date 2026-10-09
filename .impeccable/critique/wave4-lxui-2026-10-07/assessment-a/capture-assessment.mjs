import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(new URL('../../../../other-admin/admin-vue3/package.json', import.meta.url))
const { chromium } = require('@playwright/test')
const outputDir = resolve(here, 'screenshots')
const baseUrl = 'http://127.0.0.1:4174'
const browserPath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const evidence = { capturedAt: new Date().toISOString(), pages: [] }

await mkdir(outputDir, { recursive: true })

const targets = [
  {
    key: 'lxdatepicker',
    url: `${baseUrl}/components/lxdatepicker`,
    demo: '.lx-date-picker-demo',
    themeControl: '.lx-date-picker-demo__toolbar input[type="checkbox"]',
    themeIndex: 0,
    calendarInput: '#demo-date-control-start',
  },
  {
    key: 'lxdynamicform',
    url: `${baseUrl}/components/lxdynamicform`,
    demo: '.dynamic-form-demo',
    settings: '.dynamic-form-demo__settings > summary',
    themeControl: '.dynamic-form-demo__toolbar input[type="checkbox"]',
    themeIndex: 1,
    themeLabel: '文档站整体深色（HUD）',
  },
  {
    key: 'lxupload',
    url: `${baseUrl}/components/lxupload`,
    demo: '.lx-upload-demo',
    themeControl: '.lx-upload-demo__header input[type="checkbox"]',
    themeIndex: 0,
  },
]

async function waitForDemo(page, target) {
  await page.goto(target.url, { waitUntil: 'networkidle' })
  await page.locator(target.demo).waitFor({ state: 'visible' })
  await page.evaluate(() => document.fonts.ready)
}

async function positionDemo(page, target) {
  await page.locator(target.demo).evaluate((element) => {
    const top = element.getBoundingClientRect().top + window.scrollY
    window.scrollTo(0, Math.max(0, top - 76))
  })
  await page.waitForTimeout(100)
}

async function setTheme(page, target, theme) {
  if (theme === 'hud') {
    const control = page.locator(target.themeControl).nth(target.themeIndex)
    if (target.settings) {
      await page.locator(target.settings).click()
      if (target.themeLabel) {
        await page.getByText(target.themeLabel, { exact: true }).click()
      } else {
        await control.check()
      }
      await page.locator(target.settings).click()
    } else {
      await control.check()
    }
    await page.waitForTimeout(150)
  }
}

async function capture(page, target, viewport, theme, state) {
  const file = `${target.key}-${viewport.key}-${theme}-${state}.png`
  const path = resolve(outputDir, file)
  await positionDemo(page, target)
  await page.screenshot({ path, animations: 'disabled' })
  const metrics = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    pageHeight: document.documentElement.scrollHeight,
    themeClasses: [...document.documentElement.classList],
  }))
  return { viewport: viewport.label, theme, state, screenshot: path, ...metrics }
}

const browser = await chromium.launch({ headless: true, executablePath: browserPath })

try {
  for (const target of targets) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: 'light',
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()
    const pageEvidence = { key: target.key, url: target.url, captures: [], interactions: [], pageErrors: [] }
    page.on('pageerror', (error) => pageEvidence.pageErrors.push(error.message))

    for (const viewport of [
      { key: 'desktop', width: 1440, height: 1000, label: '1440x1000 desktop' },
      { key: 'mobile-375', width: 375, height: 900, label: '375x900 mobile' },
    ]) {
      for (const theme of ['light', 'hud']) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await waitForDemo(page, target)
        await setTheme(page, target, theme)
        pageEvidence.captures.push(await capture(page, target, viewport, theme, 'overview'))

        if (target.key === 'lxdatepicker') {
          await page.locator(target.calendarInput).click()
          await page.locator('.el-picker-panel:visible').first().waitFor({ state: 'visible' })
          await page.waitForTimeout(100)
          pageEvidence.captures.push(await capture(page, target, viewport, theme, 'range-calendar-open'))
          pageEvidence.interactions.push({ viewport: viewport.label, theme, action: '打开专项布控日期区间', result: '日历弹层显示' })
        }

        if (target.key === 'lxdynamicform') {
          await page.getByRole('button', { name: '提交校验' }).click()
          await page.getByText('请检查各字段旁的错误提示。', { exact: true }).waitFor({ state: 'visible' })
          await page.waitForTimeout(100)
          pageEvidence.captures.push(await capture(page, target, viewport, theme, 'required-validation'))
          pageEvidence.interactions.push({ viewport: viewport.label, theme, action: '空表单提交校验', result: '必填字段出现错误反馈' })
          if (viewport.key === 'desktop' && theme === 'light') {
            await page.getByRole('link', { name: '浏览全部字段类型' }).click()
            await page.locator('#dynamic-form-schema-preview').waitFor({ state: 'visible' })
            await page.locator('#dynamic-form-schema-preview').evaluate((element) => {
              const top = element.getBoundingClientRect().top + window.scrollY
              window.scrollTo(0, Math.max(0, top - 76))
            })
            await page.waitForTimeout(100)
            pageEvidence.captures.push(await capture(page, target, viewport, theme, 'schema-preview-expanded'))
            pageEvidence.interactions.push({ viewport: viewport.label, theme, action: '浏览全部字段类型', result: '分组字段类型预览展开并滚动到预览区' })
          }
        }
      }
    }

    if (target.key === 'lxupload') {
      await page.setViewportSize({ width: 1440, height: 1000 })
      await waitForDemo(page, target)
      await page.locator('input[type="file"]').setInputFiles({
        name: '排班数据.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('姓名,日期\n示例,2026-10-07\n'),
      })
      await page.getByText('排班数据.csv').waitFor({ state: 'visible' })
      pageEvidence.captures.push(await capture(page, target, { key: 'desktop', label: '1440x1000 desktop' }, 'light', 'queued-upload'))
      pageEvidence.interactions.push({ viewport: '1440x1000 desktop', theme: 'light', action: '选择 CSV 文件', result: '文件进入排队待上传状态' })
      await page.getByRole('button', { name: '开始上传' }).click()
      await page.waitForFunction(() => document.querySelector('[data-testid="upload-last-action"]')?.textContent?.trim() === '排班数据.csv 上传成功', { timeout: 5000 })
      pageEvidence.captures.push(await capture(page, target, { key: 'desktop', label: '1440x1000 desktop' }, 'light', 'upload-success'))
      pageEvidence.interactions.push({ viewport: '1440x1000 desktop', theme: 'light', action: '提交排队文件', result: '本地 Mock 上传成功并显示状态' })
      await page.getByRole('button', { name: '清空文件' }).click()
      await page.getByRole('button', { name: '下一次上传失败' }).click()
      await page.locator('input[type="file"]').setInputFiles({
        name: '排班数据.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('姓名,日期\n示例,2026-10-07\n'),
      })
      await page.getByRole('button', { name: '开始上传' }).click()
      await page.waitForFunction(() => document.querySelector('[data-testid="upload-last-action"]')?.textContent?.trim() === '排班数据.csv 上传失败', { timeout: 5000 })
      pageEvidence.captures.push(await capture(page, target, { key: 'desktop', label: '1440x1000 desktop' }, 'light', 'upload-failure'))
      pageEvidence.interactions.push({ viewport: '1440x1000 desktop', theme: 'light', action: '触发下一次上传失败', result: '本地 Mock 失败后显示可重试提示' })
    }

    evidence.pages.push(pageEvidence)
    await writeFile(resolve(here, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
    await context.close()
  }
} finally {
  await browser.close()
}

const evidencePath = resolve(here, 'browser-evidence.json')
await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({ evidencePath, pages: evidence.pages.map(({ key, captures, interactions, pageErrors }) => ({ key, captures: captures.length, interactions: interactions.length, pageErrors })) }, null, 2))
