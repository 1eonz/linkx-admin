import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const outputDir = dirname(scriptPath)
const rootDir = resolve(outputDir, '../../../../')
const require = createRequire(
  resolve(rootDir, 'other-admin/admin-vue3/package.json'),
)
const { chromium } = require('@playwright/test')
const browserExecutable =
  process.env.LX_REVIEW_BROWSER ??
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const hudLabel = '文档站整体深色（HUD）'
const origin = 'http://localhost:4174'

const targets = [
  {
    id: 'datepicker',
    url: `${origin}/components/lxdatepicker`,
    selector: '.lx-date-picker-demo',
  },
  {
    id: 'dynamicform',
    url: `${origin}/components/lxdynamicform`,
    selector: '.dynamic-form-demo',
  },
  {
    id: 'upload',
    url: `${origin}/components/lxupload`,
    selector: '.lx-upload-demo',
  },
]

const sourceFiles = [
  'linkx-fe/src/components/LxDatePicker/demo/basic.vue',
  'linkx-fe/src/components/LxDatePicker/index.vue',
  'linkx-fe/src/components/LxDatePicker/style.css',
  'linkx-fe/src/components/LxDynamicForm/demo/basic.vue',
  'linkx-fe/src/components/LxDynamicForm/index.vue',
  'linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldUpload.vue',
  'linkx-fe/src/components/LxUpload/demo/basic.vue',
  'linkx-fe/src/components/LxUpload/index.vue',
]

const evidence = {
  capturedAt: new Date().toISOString(),
  browser: null,
  targets: {},
  sourceHashes: {},
  limitations: [
    '截图与操作来自当前 localhost:4174 文档站；上传状态由 demo 的本地内存 Mock 驱动。',
    '当前评审未运行 detector、overlay、单测或文档 E2E。',
  ],
}

function relativePath(path) {
  return relative(rootDir, path).replaceAll('\\', '/')
}

async function capture(target, page, record, label, fullPage = true) {
  const screenshotPath = resolve(
    outputDir,
    'screenshots',
    `${target.id}-${label}.png`,
  )
  await page.screenshot({
    path: screenshotPath,
    fullPage,
    animations: 'disabled',
  })

  const pageState = await page.evaluate((selector) => {
    const demo = document.querySelector(selector)
    const bounds = demo?.getBoundingClientRect()
    const style = demo ? window.getComputedStyle(demo) : undefined
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      htmlClasses: document.documentElement.className,
      hudEnabled: document.documentElement.classList.contains('lx-theme-hud'),
      darkEnabled: document.documentElement.classList.contains('dark'),
      horizontalOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth,
      demo: demo
        ? {
            bounds: bounds
              ? {
                  x: Math.round(bounds.x),
                  y: Math.round(bounds.y),
                  width: Math.round(bounds.width),
                  height: Math.round(bounds.height),
                }
              : null,
            backgroundColor: style?.backgroundColor,
            color: style?.color,
          }
        : null,
    }
  }, target.selector)

  record.screenshots.push({
    label,
    path: relativePath(screenshotPath),
    fullPage,
    ...pageState,
  })
  return pageState
}

async function captureSurface(target, page, record, label) {
  const screenshotPath = resolve(
    outputDir,
    'screenshots',
    `${target.id}-${label}.png`,
  )
  await page.locator(target.selector).screenshot({
    path: screenshotPath,
    animations: 'disabled',
  })
  record.screenshots.push({
    label,
    path: relativePath(screenshotPath),
    fullPage: false,
    targetOnly: true,
    viewport: page.viewportSize(),
    hudEnabled: await page.evaluate(() =>
      document.documentElement.classList.contains('lx-theme-hud'),
    ),
  })
}

async function operation(record, label, run) {
  try {
    const detail = await run()
    record.operations.push({ label, result: 'completed', detail: detail ?? null })
    return detail
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    record.operations.push({ label, result: 'failed', error: message })
    return null
  }
}

async function toggleHud(page, record, enabled) {
  const current = await page.evaluate(() =>
    document.documentElement.classList.contains('lx-theme-hud'),
  )
  if (current === enabled) return { alreadyEnabled: enabled }

  const control = page.getByText(hudLabel, { exact: true }).first()
  await control.click({ timeout: 5000 })
  await page.waitForFunction(
    (expected) =>
      document.documentElement.classList.contains('lx-theme-hud') === expected,
    enabled,
    { timeout: 5000 },
  )
  const result = await page.evaluate(() => ({
    htmlClasses: document.documentElement.className,
    hudEnabled: document.documentElement.classList.contains('lx-theme-hud'),
    darkEnabled: document.documentElement.classList.contains('dark'),
  }))
  record.operations.push({
    label: `切换主题为${enabled ? 'HUD' : 'Light'}`,
    result: 'completed',
    detail: result,
  })
  return result
}

function collectBrowserErrors(page, record) {
  page.on('pageerror', (error) => {
    record.pageErrors.push(error.message)
  })
  page.on('console', (message) => {
    if (message.type() === 'error') {
      record.consoleErrors.push({
        text: message.text(),
        location: message.location(),
      })
    }
  })
  page.on('requestfailed', (request) => {
    record.failedRequests.push({
      url: request.url(),
      error: request.failure()?.errorText ?? 'unknown',
    })
  })
  page.on('response', (response) => {
    if (response.status() >= 400) {
      record.httpErrors.push({ url: response.url(), status: response.status() })
    }
  })
}

async function captureDatePickerOperations(target, page, record) {
  await operation(record, '短高度桌面打开日期区间日历并测量弹层', async () => {
    await page.setViewportSize({ width: 1280, height: 540 })
    await page.evaluate(() => window.scrollTo(0, 0))
    const trigger = page
      .locator('[data-testid="range"] .lx-date-picker')
      .first()
    await trigger.click()
    await page.waitForTimeout(450)

    const popper = page.locator(
      '.lx-date-picker__popper[aria-hidden="false"]',
    )
    const triggerBox = await trigger.boundingBox()
    const popperBox = await popper.first().boundingBox()
    const visiblePopperCount = await popper.count()
    const details = await page.evaluate(() => {
      const popper = document.querySelector(
        '.lx-date-picker__popper[aria-hidden="false"]',
      )
      if (!(popper instanceof HTMLElement)) return null
      const rect = popper.getBoundingClientRect()
      return {
        className: popper.className,
        top: Math.round(rect.top),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        maxHeight: getComputedStyle(popper).maxHeight,
        panelHeight: Math.round(
          popper.querySelector('.el-picker-panel')?.getBoundingClientRect()
            .height ?? 0,
        ),
      }
    })
    const overlapY = Boolean(
      triggerBox &&
        popperBox &&
        popperBox.y < triggerBox.y + triggerBox.height &&
        popperBox.y + popperBox.height > triggerBox.y,
    )
    await capture(target, page, record, 'short-desktop-light-popper', false)
    await page.keyboard.press('Escape')
    return {
      trigger: triggerBox,
      popper: details,
      overlapsTrigger: overlapY,
      visiblePopperCount,
      viewport: { width: 1280, height: 540 },
    }
  })

  await operation(record, '选择本周快捷范围并测量日期反馈距离', async () => {
    const trigger = page
      .locator('[data-testid="shortcuts"] .lx-date-picker')
      .first()
    await trigger.click()
    const popper = page.locator(
      '.lx-date-picker__popper[aria-hidden="false"]',
    )
    await popper.first().waitFor({ state: 'visible', timeout: 5000 })
    const shortcut = popper.locator('.el-picker-panel__shortcut').filter({
      hasText: '本周',
    })
    await shortcut.first().click()
    const status = page.getByTestId('date-action-analysis')
    await status.waitFor({ state: 'visible', timeout: 5000 })
    await trigger.scrollIntoViewIfNeeded()
    const measurements = await page.evaluate(() => {
      const trigger = document.querySelector(
        '[data-testid="shortcuts"] .lx-date-picker',
      )
      const status = document.querySelector('[data-testid="date-action-analysis"]')
      const triggerRect = trigger?.getBoundingClientRect()
      const statusRect = status?.getBoundingClientRect()
      return {
        statusText: status?.textContent?.trim() ?? '',
        triggerBottom: triggerRect ? Math.round(triggerRect.bottom) : null,
        statusTop: statusRect ? Math.round(statusRect.top) : null,
        gapPx:
          triggerRect && statusRect
            ? Math.round(statusRect.top - triggerRect.bottom)
            : null,
      }
    })
    await capture(target, page, record, 'date-feedback-near-field-light', false)
    return measurements
  })

  await operation(record, '窄屏 HUD 日历弹层打开与布局检查', async () => {
    await page.setViewportSize({ width: 375, height: 812 })
    await toggleHud(page, record, true)
    await page.evaluate(() => window.scrollTo(0, 0))
    const trigger = page
      .locator('[data-testid="range"] .lx-date-picker')
      .first()
    await trigger.click()
    await page.waitForTimeout(450)
    const popper = page.locator(
      '.lx-date-picker__popper[aria-hidden="false"]',
    )
    const details = await page.evaluate(() => {
      const popper = document.querySelector(
        '.lx-date-picker__popper[aria-hidden="false"]',
      )
      if (!(popper instanceof HTMLElement)) return null
      const rect = popper.getBoundingClientRect()
      return {
        top: Math.round(rect.top),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        className: popper.className,
      }
    })
    await capture(target, page, record, 'mobile-hud-popper', false)
    await page.keyboard.press('Escape')
    await toggleHud(page, record, false)
    return details
  })
}

async function captureDynamicFormOperations(target, page, record) {
  await operation(record, '打开演示设置并查看候选人员失败态', async () => {
    const settings = page.locator('.dynamic-form-demo__settings')
    const settingsOpen = await settings.evaluate((element) =>
      element.hasAttribute('open'),
    )
    if (!settingsOpen) await settings.locator('summary').click()
    const failureChoice = page
      .locator('.dynamic-form-demo__candidate-modes .el-radio')
      .filter({ hasText: '失败' })
      .first()
    await failureChoice.click()
    await page.waitForTimeout(400)
    const requestStatus = await page
      .getByTestId('candidate-request-status')
      .innerText()
    const demoText = await page.locator('.dynamic-form-demo').innerText()
    await capture(target, page, record, 'candidate-failure-light')
    await captureSurface(target, page, record, 'surface-candidate-failure-light')
    return {
      requestStatus,
      visibleFailure: demoText.includes('读取失败'),
      settingsOpen: await settings.evaluate((element) =>
        element.hasAttribute('open'),
      ),
    }
  })

  await operation(record, '重置并提交主表单校验', async () => {
    await page.getByRole('button', { name: '重置' }).click()
    await page.getByRole('button', { name: '提交校验' }).click()
    await page.waitForTimeout(350)
    const validationMessages = await page
      .locator('.el-form-item__error')
      .allTextContents()
    const lastAction = await page
      .locator('.dynamic-form-demo__footer [role="status"]')
      .innerText()
    await capture(target, page, record, 'validation-after-submit-light')
    await captureSurface(target, page, record, 'surface-validation-after-submit-light')
    return { validationMessages, lastAction }
  })

  await operation(record, '打开全部字段类型预览', async () => {
    await page
      .getByRole('link', { name: '浏览全部字段类型' })
      .click()
    const preview = page.locator('#dynamic-form-schema-preview')
    await preview.waitFor({ state: 'visible', timeout: 3000 })
    await page.waitForTimeout(150)
    await capture(target, page, record, 'schema-preview-open-light')
    return { open: await preview.evaluate((element) => element.hasAttribute('open')) }
  })
}

async function captureUploadOperations(target, page, record) {
  await operation(record, '本地 Mock 队列、进度与成功上传', async () => {
    const fileInput = page.locator('.lx-upload-demo input[type="file"]').first()
    const inputCount = await page.locator('.lx-upload-demo input[type="file"]').count()
    await fileInput.setInputFiles({
      name: 'roster.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('name,shift\nExample,day\n', 'utf8'),
    })
    await page.waitForTimeout(200)
    const queuedText = await page.locator('.lx-upload-demo').innerText()
    await capture(target, page, record, 'queued-file-light')

    await page.getByRole('button', { name: '上传全部待传文件' }).click()
    await page.waitForTimeout(350)
    const progressText = await page.locator('.lx-upload-demo').innerText()
    await capture(target, page, record, 'upload-progress-light')
    await captureSurface(target, page, record, 'surface-upload-progress-light')
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-testid="upload-last-action"]')
          ?.textContent?.includes('上传成功'),
      null,
      { timeout: 6000 },
    )
    const successText = await page
      .getByTestId('upload-last-action')
      .innerText()
    await capture(target, page, record, 'upload-success-light')
    await captureSurface(target, page, record, 'surface-upload-success-light')
    return { inputCount, queued: queuedText.includes('roster.csv'), progressVisible: progressText.includes('上传中'), successText }
  })

  await operation(record, '本地 Mock 失败上传和错误反馈', async () => {
    await page.getByRole('button', { name: '清空文件' }).click()
    await page.getByRole('button', { name: '下一次上传失败' }).click()
    const fileInput = page.locator('.lx-upload-demo input[type="file"]').first()
    await fileInput.setInputFiles({
      name: 'rejected.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('name,shift\nRejected,night\n', 'utf8'),
    })
    await page.getByRole('button', { name: '上传全部待传文件' }).click()
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-testid="upload-last-action"]')
          ?.textContent?.includes('上传失败'),
      null,
      { timeout: 6000 },
    )
    const failureText = await page.getByTestId('upload-last-action').innerText()
    await capture(target, page, record, 'upload-failure-light')
    await captureSurface(target, page, record, 'surface-upload-failure-light')
    return { failureText, requestCount: await page.getByTestId('upload-request-count').innerText() }
  })
}

async function reviewTarget(browser, target) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  const record = {
    url: target.url,
    title: null,
    heading: null,
    initialStatus: null,
    screenshots: [],
    operations: [],
    pageErrors: [],
    consoleErrors: [],
    failedRequests: [],
    httpErrors: [],
  }
  collectBrowserErrors(page, record)

  try {
    const response = await page.goto(target.url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    record.initialStatus = response?.status() ?? null
    await page.locator(target.selector).waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(350)
    record.title = await page.title()
    record.heading = await page.locator('h1').first().innerText()

    await capture(target, page, record, 'desktop-light')
    await captureSurface(target, page, record, 'surface-desktop-light')
    if (target.id === 'dynamicform') {
      await operation(record, '展开演示设置以暴露主题与状态控件', async () => {
        const settings = page.locator('.dynamic-form-demo__settings')
        await settings.locator('summary').click()
        return { open: await settings.evaluate((element) => element.hasAttribute('open')) }
      })
      await captureSurface(target, page, record, 'surface-settings-open-light')
    }
    await operation(record, '主题开关切换 HUD', () => toggleHud(page, record, true))
    await capture(target, page, record, 'desktop-hud')
    await captureSurface(target, page, record, 'surface-desktop-hud')
    await operation(record, '主题开关恢复 Light', () => toggleHud(page, record, false))

    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(200)
    await capture(target, page, record, 'mobile-light')
    await operation(record, '窄屏主题开关切换 HUD', () => toggleHud(page, record, true))
    await capture(target, page, record, 'mobile-hud')
    await operation(record, '窄屏主题开关恢复 Light', () => toggleHud(page, record, false))

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.evaluate(() => window.scrollTo(0, 0))
    if (target.id === 'datepicker') {
      await captureDatePickerOperations(target, page, record)
    } else if (target.id === 'dynamicform') {
      await captureDynamicFormOperations(target, page, record)
    } else if (target.id === 'upload') {
      await captureUploadOperations(target, page, record)
    }
  } catch (error) {
    record.fatalError = error instanceof Error ? error.stack ?? error.message : String(error)
  } finally {
    await context.close()
  }

  evidence.targets[target.id] = record
}

async function main() {
  await mkdir(resolve(outputDir, 'screenshots'), { recursive: true })
  for (const file of sourceFiles) {
    const content = await readFile(resolve(rootDir, file))
    evidence.sourceHashes[file] = createHash('sha256')
      .update(content)
      .digest('hex')
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath: browserExecutable,
  })
  evidence.browser = {
    name: 'Microsoft Edge',
    version: browser.version(),
    executable: browserExecutable,
  }

  try {
    for (const target of targets) await reviewTarget(browser, target)
  } finally {
    await browser.close()
  }

  await writeFile(
    resolve(outputDir, 'browser-evidence.json'),
    `${JSON.stringify(evidence, null, 2)}\n`,
    'utf8',
  )
  await writeFile(
    resolve(outputDir, 'source-sha256.json'),
    `${JSON.stringify(evidence.sourceHashes, null, 2)}\n`,
    'utf8',
  )
  console.log(JSON.stringify({
    output: relativePath(resolve(outputDir, 'browser-evidence.json')),
    browser: evidence.browser,
    targets: Object.fromEntries(
      Object.entries(evidence.targets).map(([id, record]) => [id, {
        status: record.initialStatus,
        screenshots: record.screenshots.length,
        operations: record.operations,
        pageErrors: record.pageErrors,
        consoleErrors: record.consoleErrors,
        failedRequests: record.failedRequests,
        httpErrors: record.httpErrors,
        fatalError: record.fatalError ?? null,
      }]),
    ),
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
