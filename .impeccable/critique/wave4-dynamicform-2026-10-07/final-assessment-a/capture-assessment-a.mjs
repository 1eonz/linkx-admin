import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(
  'F:/work/linkx-admin/other-admin/admin-vue3/package.json',
)
const { chromium } = require('@playwright/test')

const root = 'F:/work/linkx-admin'
const outputDir =
  'F:/work/linkx-admin/.impeccable/critique/wave4-dynamicform-2026-10-07/final-assessment-a'
const baseUrl = 'http://127.0.0.1:4174'
const sources = [
  'linkx-fe/src/components/LxDynamicForm/index.vue',
  'linkx-fe/src/components/LxDynamicForm/style.css',
  'linkx-fe/src/components/LxDynamicForm/demo/basic.vue',
  'linkx-fe/src/components/LxDynamicForm/types.ts',
  'linkx-fe/src/components/LxDatePicker/index.vue',
  'linkx-fe/src/components/LxDatePicker/style.css',
  'linkx-fe/src/components/LxDatePicker/demo/basic.vue',
  'linkx-fe/src/components/LxUpload/index.vue',
  'linkx-fe/src/components/LxUpload/demo/basic.vue',
  'linkx-fe/docs/components/lxdynamicform.md',
  'linkx-fe/docs/components/lxdatepicker.md',
  'linkx-fe/docs/components/lxupload.md',
]

await mkdir(outputDir, { recursive: true })

async function fingerprint() {
  const capturedAt = new Date().toISOString()
  const files = await Promise.all(
    sources.map(async (source) => {
      const absolutePath = path.join(root, source)
      const [contents, metadata] = await Promise.all([
        readFile(absolutePath),
        stat(absolutePath),
      ])
      return {
        path: source.replaceAll('\\', '/'),
        modifiedAt: metadata.mtime.toISOString(),
        bytes: metadata.size,
        sha256: createHash('sha256').update(contents).digest('hex'),
      }
    }),
  )
  return { capturedAt, files }
}

const before = await fingerprint()
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
})
const evidence = {
  method: 'isolated Assessment A, fresh Edge/Playwright contexts',
  target: baseUrl,
  browserVersion: browser.version(),
  startedAt: before.capturedAt,
  screenshots: [],
  pages: [],
  interactions: [],
}
const errors = []

async function newPage({ width, height, mobile = false, colorScheme = 'light' }) {
  const context = await browser.newContext({
    viewport: { width, height },
    screen: { width, height },
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: 1,
    colorScheme,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  page.on('pageerror', (error) => errors.push({ url: page.url(), message: error.message }))
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push({ url: page.url(), type: 'console', message: message.text() })
    }
  })
  return { context, page }
}

async function openRoute(page, route) {
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  return response?.status() ?? null
}

async function toggleTheme(page, route) {
  if (route === '/components/lxdynamicform') {
    const settings = page.locator('details.dynamic-form-demo__settings')
    if (!(await settings.evaluate((element) => element.open))) {
      await settings.locator('summary').click()
    }
    const themeLabel = page.locator('label').filter({ hasText: '文档站整体深色（HUD）' })
    await themeLabel.scrollIntoViewIfNeeded()
    await themeLabel.click({ force: true })
  } else if (route === '/components/lxdatepicker') {
    await page.locator('.lx-date-picker-demo__toolbar input[type="checkbox"]')
      .check({ force: true })
  } else {
    await page.locator('.lx-upload-demo__header input[type="checkbox"]')
      .check({ force: true })
  }
  await page.waitForTimeout(100)
}

async function capture(page, name, { fullPage = true } = {}) {
  const file = `${name}.png`
  await page.screenshot({ path: path.join(outputDir, file), fullPage })
  evidence.screenshots.push(file)
}

async function clickNativeControl(locator) {
  await locator.evaluate((element) => element.click())
}

async function recordBase(route, slug) {
  for (const viewport of [
    { label: 'desktop', width: 1440, height: 1000, mobile: false },
    { label: 'mobile375', width: 375, height: 812, mobile: true },
  ]) {
    const { context, page } = await newPage(viewport)
    try {
      const status = await openRoute(page, route)
      await capture(page, `${slug}-${viewport.label}-light`)
      await page.evaluate(() => window.scrollTo(0, 0))
      await capture(page, `${slug}-${viewport.label}-light-viewport`, { fullPage: false })
      await toggleTheme(page, route)
      await capture(page, `${slug}-${viewport.label}-hud`)
      await page.evaluate(() => window.scrollTo(0, 0))
      await capture(page, `${slug}-${viewport.label}-hud-viewport`, { fullPage: false })
      const dimensions = await page.evaluate(() => ({
        viewport: { width: innerWidth, height: innerHeight },
        document: {
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
        },
      }))
      evidence.pages.push({
        route,
        viewport: viewport.label,
        status,
        dimensions,
        screenshots: [
          `${slug}-${viewport.label}-light.png`,
          `${slug}-${viewport.label}-hud.png`,
        ],
      })
    } finally {
      await context.close()
    }
  }
}

async function captureDynamicStates() {
  const { context, page } = await newPage({ width: 1440, height: 1000 })
  try {
    await openRoute(page, '/components/lxdynamicform')
    const settings = page.locator('details.dynamic-form-demo__settings')
    await settings.locator('summary').click()
    await clickNativeControl(page.getByRole('radio', { name: '空结果' }))
    await page.waitForTimeout(450)
    await page
      .getByText('暂无候选人员', { exact: true })
      .first()
      .waitFor({ state: 'visible', timeout: 4000 })
    await page
      .locator('.lx-dynamic-form__item')
      .filter({ hasText: '负责人' })
      .scrollIntoViewIfNeeded()
    await capture(page, 'dynamicform-desktop-remote-empty', { fullPage: false })
    evidence.interactions.push({
      route: '/components/lxdynamicform',
      state: 'remote-select-empty',
      observed: '暂无候选人员',
      screenshot: 'dynamicform-desktop-remote-empty.png',
    })
  } catch (error) {
    errors.push({ url: page.url(), state: 'remote-select-empty', message: String(error) })
  } finally {
    await context.close()
  }

  for (const viewport of [
    { label: 'desktop', width: 1440, height: 1000, mobile: false },
    { label: 'mobile375', width: 375, height: 812, mobile: true },
  ]) {
    const { context, page } = await newPage(viewport)
    try {
      await openRoute(page, '/components/lxdynamicform')
      const submit = page.getByRole('button', { name: '提交校验' })
      await submit.scrollIntoViewIfNeeded()
      await submit.click()
      await page.locator('.el-form-item__error').first().waitFor({
        state: 'visible',
        timeout: 4000,
      })
      await capture(page, `dynamicform-${viewport.label}-required-error`, { fullPage: false })
      evidence.interactions.push({
        route: '/components/lxdynamicform',
        state: 'required-validation-error',
        viewport: viewport.label,
        screenshot: `dynamicform-${viewport.label}-required-error.png`,
      })
      await page.getByRole('button', { name: '重置' }).click()
    } catch (error) {
      errors.push({ url: page.url(), state: `required-error-${viewport.label}`, message: String(error) })
    }
    try {
      await page.getByPlaceholder('输入任务名称').scrollIntoViewIfNeeded()
      await page.locator('.lx-dynamic-form input[type="file"]').first().setInputFiles({
        name: '重试-Assessment-A.png',
        mimeType: 'image/png',
        buffer: Buffer.from('assessment-a-memory-mock'),
      })
      const uploadError = page.locator('.lx-upload__file-error').first()
      await uploadError.waitFor({ state: 'visible', timeout: 5000 })
      await uploadError.scrollIntoViewIfNeeded()
      await capture(page, `dynamicform-${viewport.label}-upload-failure`, { fullPage: false })
      evidence.interactions.push({
        route: '/components/lxdynamicform',
        state: 'upload-failure-and-retry',
        viewport: viewport.label,
        screenshot: `dynamicform-${viewport.label}-upload-failure.png`,
      })
      await page.locator('.lx-upload__retry').first().click()
      await page.locator('.lx-upload__file-status.is-success').first().waitFor({
        state: 'visible',
        timeout: 5000,
      })
      const successName = `dynamicform-${viewport.label}-upload-retry-success`
      await capture(page, successName, { fullPage: false })
      evidence.interactions.push({
        route: '/components/lxdynamicform',
        state: 'upload-retry-success',
        viewport: viewport.label,
        screenshot: `${successName}.png`,
      })
    } catch (error) {
      errors.push({ url: page.url(), state: `upload-failure-${viewport.label}`, message: String(error) })
    }
    await context.close()
  }
}

async function captureDatePickerStates() {
  for (const viewport of [
    { label: 'desktop', width: 1440, height: 1000, mobile: false, colorScheme: 'dark' },
    { label: 'mobile375', width: 375, height: 812, mobile: true, colorScheme: 'light' },
  ]) {
    const { context, page } = await newPage(viewport)
    try {
      await openRoute(page, '/components/lxdatepicker')
      if (viewport.colorScheme === 'dark') {
        await clickNativeControl(
          page.locator('.lx-date-picker-demo__toolbar input[type="checkbox"]'),
        )
      }
      const errorSection = page.locator('[data-testid="error"]')
      await errorSection.scrollIntoViewIfNeeded()
      await capture(page, `datepicker-${viewport.label}-${viewport.colorScheme}-error-empty`, {
        fullPage: false,
      })
      evidence.interactions.push({
        route: '/components/lxdatepicker',
        state: 'empty-value-validation-error',
        viewport: viewport.label,
        colorScheme: viewport.colorScheme,
        screenshot: `datepicker-${viewport.label}-${viewport.colorScheme}-error-empty.png`,
      })
      await page.locator('[data-testid="range"] input').first().scrollIntoViewIfNeeded()
      await page.locator('[data-testid="range"] input').first().click()
      await page.locator('.el-date-range-picker:visible').waitFor({ state: 'visible', timeout: 4000 })
      const overflow = await page.evaluate(() => ({
        viewportWidth: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        picker: (() => {
          const element = document.querySelector('.el-date-range-picker')
          if (!element) return null
          const rect = element.getBoundingClientRect()
          return { left: rect.left, right: rect.right, width: rect.width }
        })(),
      }))
      await capture(page, `datepicker-${viewport.label}-${viewport.colorScheme}-range-open`, {
        fullPage: false,
      })
      evidence.interactions.push({
        route: '/components/lxdatepicker',
        state: 'range-calendar-open',
        viewport: viewport.label,
        colorScheme: viewport.colorScheme,
        overflow,
        screenshot: `datepicker-${viewport.label}-${viewport.colorScheme}-range-open.png`,
      })
    } catch (error) {
      errors.push({ url: page.url(), state: `datepicker-${viewport.label}`, message: String(error) })
    } finally {
      await context.close()
    }
  }
}

async function captureUploadFailure() {
  for (const viewport of [
    { label: 'desktop', width: 1440, height: 1000, mobile: false, colorScheme: 'light' },
    { label: 'mobile375', width: 375, height: 812, mobile: true, colorScheme: 'dark' },
  ]) {
    const { context, page } = await newPage(viewport)
    try {
      await openRoute(page, '/components/lxupload')
      if (viewport.colorScheme === 'dark') {
        await page.locator('.lx-upload-demo__header input[type="checkbox"]')
          .check({ force: true })
      }
      await page.getByRole('button', { name: '下一次上传失败' }).click()
      await page.locator('.lx-upload__trigger input[type="file"]').setInputFiles({
        name: '排班数据.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('姓名,班次\n测试,早班'),
      })
      await page.getByRole('button', { name: '开始上传' }).click()
      await page.locator('.lx-upload__file-error').first().waitFor({
        state: 'visible',
        timeout: 5000,
      })
      const name = `upload-${viewport.label}-${viewport.colorScheme}-failure`
      await page.locator('.lx-upload-demo__field').scrollIntoViewIfNeeded()
      await capture(page, name, { fullPage: false })
      evidence.interactions.push({
        route: '/components/lxupload',
        state: 'upload-failure-with-retry',
        viewport: viewport.label,
        colorScheme: viewport.colorScheme,
        screenshot: `${name}.png`,
      })
      await page.locator('.lx-upload__retry').first().click()
      await page.locator('.lx-upload__file-status.is-success').first().waitFor({
        state: 'visible',
        timeout: 5000,
      })
      const successName = `upload-${viewport.label}-${viewport.colorScheme}-retry-success`
      await capture(page, successName, { fullPage: false })
      evidence.interactions.push({
        route: '/components/lxupload',
        state: 'upload-retry-success',
        viewport: viewport.label,
        colorScheme: viewport.colorScheme,
        screenshot: `${successName}.png`,
      })
    } catch (error) {
      errors.push({ url: page.url(), state: `upload-failure-${viewport.label}`, message: String(error) })
    } finally {
      await context.close()
    }
  }
}

try {
  await recordBase('/components/lxdynamicform', 'dynamicform')
  await recordBase('/components/lxdatepicker', 'datepicker')
  await recordBase('/components/lxupload', 'upload')
  await captureDynamicStates()
  await captureDatePickerStates()
  await captureUploadFailure()
} finally {
  await browser.close()
}

const after = await fingerprint()
evidence.finishedAt = after.capturedAt
evidence.sourceFingerprintBefore = before
evidence.sourceFingerprintAfter = after
evidence.sourceFingerprintChanged = before.files.some((file, index) => {
  return file.sha256 !== after.files[index].sha256
})
evidence.browserErrors = errors
await writeFile(
  path.join(outputDir, 'assessment-a-current-evidence.json'),
  JSON.stringify(evidence, null, 2),
)
console.log(JSON.stringify(evidence, null, 2))
