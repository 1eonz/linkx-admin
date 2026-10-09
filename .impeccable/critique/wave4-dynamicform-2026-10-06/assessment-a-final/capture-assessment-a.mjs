import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

const outputDir = path.resolve(process.argv[2])
const url = 'http://127.0.0.1:4174/components/lxdynamicform.html'
const require = createRequire(import.meta.url)
const playwrightPath = path.resolve(process.cwd(), 'other-admin/admin-vue3/node_modules/@playwright/test')
const { chromium } = require(playwrightPath)
const freezePath = path.resolve(process.cwd(), '.impeccable/critique/wave4-dynamicform-2026-10-06/source-hashes-freeze.json')
const freeze = JSON.parse(await fs.readFile(freezePath, 'utf8'))
const browser = await chromium.launch({ headless: true })
const evidence = {
  url,
  freezePath,
  frozenAt: freeze.capturedAt,
  startedAt: new Date().toISOString(),
  sourceHashBefore: {},
  sourceHashAfter: {},
  sourceHashMismatches: [],
  contexts: [],
  consoleErrors: [],
  pageErrors: [],
  externalRequests: [],
  actions: [],
}

function watchPage(page, contextName) {
  page.on('console', (message) => {
    if (message.type() === 'error') {
      evidence.consoleErrors.push({ context: contextName, text: message.text() })
    }
  })
  page.on('pageerror', (error) => {
    evidence.pageErrors.push({ context: contextName, text: error.message })
  })
  page.on('request', (request) => {
    const requestUrl = request.url()
    if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//i.test(requestUrl)) {
      evidence.externalRequests.push({
        context: contextName,
        url: requestUrl,
        method: request.method(),
      })
    }
  })
}

async function waitForUpdate(page, timeout = 1200) {
  await page.waitForTimeout(timeout)
}

async function hashSources() {
  const result = {}
  for (const [relativePath, expected] of Object.entries(freeze.files)) {
    const absolutePath = path.resolve(process.cwd(), relativePath)
    const bytes = await fs.readFile(absolutePath)
    const { createHash } = await import('node:crypto')
    result[relativePath] = createHash('sha256').update(bytes).digest('hex')
  }
  return result
}

function compareHashes(actual) {
  return Object.entries(freeze.files)
    .filter(([relativePath, expected]) => actual[relativePath] !== expected.toLowerCase())
    .map(([relativePath, expected]) => ({
      path: relativePath,
      expected: expected.toLowerCase(),
      actual: actual[relativePath] ?? 'MISSING',
    }))
}

async function savePage(page, name, fullPage = false) {
  await page.screenshot({
    path: path.join(outputDir, `${name}.png`),
    fullPage,
    animations: 'disabled',
  })
}

async function saveDemo(page, name) {
  const demo = page.locator('.dynamic-form-demo').first()
  await demo.screenshot({
    path: path.join(outputDir, `${name}.png`),
    animations: 'disabled',
  })
}

async function snapshot(page, contextName, name) {
  const state = await page.evaluate(() => {
    const demo = document.querySelector('.dynamic-form-demo')
    const form = document.querySelector('.lx-dynamic-form')
    return {
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
      },
      theme: {
        dark: document.documentElement.classList.contains('dark'),
        hud: document.documentElement.classList.contains('lx-theme-hud'),
      },
      demoText: demo?.innerText ?? null,
      fieldText: form?.innerText ?? null,
      uploadInputs: [...document.querySelectorAll('.dynamic-form-demo input[type="file"]')]
        .map((input) => ({ accept: input.accept, multiple: input.multiple })),
      visibleButtons: [...document.querySelectorAll('.dynamic-form-demo button')]
        .filter((button) => button.getClientRects().length)
        .map((button) => ({ text: button.innerText.trim(), disabled: button.disabled })),
    }
  })
  evidence.contexts.push({ context: contextName, state: name, ...state })
}

try {
  evidence.sourceHashBefore = await hashSources()
  evidence.sourceHashMismatches = compareHashes(evidence.sourceHashBefore)
  if (Object.keys(freeze.files).length !== freeze.fileCount || evidence.sourceHashMismatches.length) {
    throw new Error(`Frozen source mismatch before browser inspection: ${JSON.stringify(evidence.sourceHashMismatches)}`)
  }
  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(path.join(outputDir, 'source-hashes-before.json'), `${JSON.stringify(evidence.sourceHashBefore, null, 2)}\n`)

  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const desktop = await desktopContext.newPage()
  watchPage(desktop, 'desktop')
  const response = await desktop.goto(url, { waitUntil: 'networkidle', timeout: 45000 })
  evidence.actions.push({ context: 'desktop', action: 'navigate', status: response?.status() })
  await desktop.locator('.dynamic-form-demo').waitFor()
  await waitForUpdate(desktop, 1800)
  await snapshot(desktop, 'desktop', 'default-light')
  await savePage(desktop, 'desktop-light-page', true)
  await saveDemo(desktop, 'desktop-light-demo')

  const settings = desktop.locator('details.dynamic-form-demo__settings')
  await settings.evaluate((element) => { element.open = true })
  const schema = desktop.locator('details.dynamic-form-demo__schema-preview')
  await schema.evaluate((element) => { element.open = true })
  await desktop.getByRole('button', { name: '提交校验' }).click()
  await desktop.getByText('请输入访问密码', { exact: true }).waitFor({ timeout: 8000 })
  await waitForUpdate(desktop, 250)
  await snapshot(desktop, 'desktop', 'required-validation-error')
  await savePage(desktop, 'desktop-validation-error-page', true)
  await saveDemo(desktop, 'desktop-validation-error-demo')
  evidence.actions.push({ context: 'desktop', action: 'submit-empty-form', result: 'required-errors-visible' })

  const password = desktop.locator('.dynamic-form-demo .lx-dynamic-form__item').filter({ hasText: '访问密码' }).locator('input').first()
  await password.fill('Safe-Example-123')
  await desktop.locator('.dynamic-form-demo .lx-dynamic-form__item').filter({ hasText: '任务名称' }).locator('input').first().fill('东城巡防任务')
  await desktop.getByRole('button', { name: '提交校验' }).click()
  await desktop.getByText(/表单已校验/).waitFor({ timeout: 8000 })
  await snapshot(desktop, 'desktop', 'valid-form')
  await saveDemo(desktop, 'desktop-validation-success-demo')
  evidence.actions.push({ context: 'desktop', action: 'submit-complete-form', result: 'success-feedback-visible' })

  const themeCheckbox = desktop.getByRole('checkbox', { name: 'HUD 深色主题' })
  await themeCheckbox.check()
  await waitForUpdate(desktop, 300)
  await snapshot(desktop, 'desktop', 'hud-theme')
  await savePage(desktop, 'desktop-hud-page', true)
  await saveDemo(desktop, 'desktop-hud-demo')

  const uploadFields = desktop.locator('.dynamic-form-demo .lx-dynamic-form__item').filter({ hasText: '任务封面（单张）' })
  const uploadInput = desktop.locator('.dynamic-form-demo input[type="file"]').first()
  const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/nZcAAAAASUVORK5CYII=', 'base64')
  await uploadInput.setInputFiles({ name: '巡防现场.png', mimeType: 'image/png', buffer: tinyPng })
  await waitForUpdate(desktop, 150)
  await snapshot(desktop, 'desktop', 'upload-in-progress')
  await saveDemo(desktop, 'desktop-upload-in-progress')
  evidence.actions.push({ context: 'desktop', action: 'select-single-image', result: 'upload-in-progress-state' })
  const cancelUpload = desktop.locator('.dynamic-form-demo').getByRole('button', { name: /取消上传/ })
  if (await cancelUpload.count()) {
    await cancelUpload.click()
    await waitForUpdate(desktop, 200)
    await snapshot(desktop, 'desktop', 'upload-cancelled')
    await saveDemo(desktop, 'desktop-upload-cancelled')
    evidence.actions.push({ context: 'desktop', action: 'cancel-upload', result: 'cancel-control-used' })
  }
  await uploadInput.setInputFiles({ name: '巡防现场.png', mimeType: 'image/png', buffer: tinyPng })
  await desktop.getByText('巡防现场.png', { exact: true }).waitFor({ timeout: 5000 })
  await waitForUpdate(desktop, 1100)
  await snapshot(desktop, 'desktop', 'upload-success')
  await saveDemo(desktop, 'desktop-upload-success')
  evidence.actions.push({ context: 'desktop', action: 'complete-single-image-upload', result: 'success-state-observed' })

  const previewSelect = desktop.locator('#dynamic-form-schema-type')
  if (await previewSelect.count()) {
    await previewSelect.click()
    await desktop.getByRole('option', { name: '远程选择' }).click()
  } else {
    await desktop.locator('.dynamic-form-demo__schema-preview .el-select').click()
    await desktop.getByText('远程选择', { exact: true }).last().click()
  }
  await waitForUpdate(desktop, 550)
  await snapshot(desktop, 'desktop', 'remote-select-preview')
  await saveDemo(desktop, 'desktop-remote-select-preview')
  const previewModes = desktop.getByRole('group', { name: '预览候选模拟结果' })
  await previewModes.getByRole('button', { name: '失败' }).click()
  await desktop.locator('.dynamic-form-demo__schema-preview').getByText('候选人员读取失败', { exact: true }).waitFor({ timeout: 5000 })
  await snapshot(desktop, 'desktop', 'candidate-preview-error')
  await saveDemo(desktop, 'desktop-candidate-preview-error')
  await desktop.locator('.dynamic-form-demo__schema-preview').getByRole('button', { name: '重试' }).click()
  await waitForUpdate(desktop, 450)
  await snapshot(desktop, 'desktop', 'candidate-preview-recovered')
  await saveDemo(desktop, 'desktop-candidate-preview-recovered')
  evidence.actions.push({ context: 'desktop', action: 'candidate-preview-error-and-retry', result: 'error-and-recovery-observed' })

  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  const mobile = await mobileContext.newPage()
  watchPage(mobile, 'mobile-375')
  const mobileResponse = await mobile.goto(url, { waitUntil: 'networkidle', timeout: 45000 })
  evidence.actions.push({ context: 'mobile-375', action: 'navigate', status: mobileResponse?.status() })
  await mobile.locator('.dynamic-form-demo').waitFor()
  await waitForUpdate(mobile, 1000)
  await snapshot(mobile, 'mobile-375', 'default-light')
  await savePage(mobile, 'mobile-375-light-page', true)
  await saveDemo(mobile, 'mobile-375-light-demo')
  await mobile.locator('details.dynamic-form-demo__schema-preview').evaluate((element) => { element.open = true })
  await mobile.locator('#dynamic-form-schema-type').click()
  await mobile.getByRole('option', { name: '日期范围' }).click().catch(async () => {
    await mobile.getByText('日期范围', { exact: true }).last().click()
  })
  await waitForUpdate(mobile, 200)
  await snapshot(mobile, 'mobile-375', 'date-range-preview')
  await saveDemo(mobile, 'mobile-375-date-range-preview')
  const rangeInputs = mobile.locator('.dynamic-form-demo__schema-preview .el-date-editor--daterange input')
  if (await rangeInputs.count() === 2) {
    await rangeInputs.first().click()
    const dateEight = mobile.locator('.el-date-picker__table td.available:not(.prev-month):not(.next-month)').filter({ hasText: /^8$/ }).first()
    const dateTwelve = mobile.locator('.el-date-picker__table td.available:not(.prev-month):not(.next-month)').filter({ hasText: /^12$/ }).first()
    if (await dateEight.count() && await dateTwelve.count()) {
      await dateEight.click()
      await dateTwelve.click()
      await waitForUpdate(mobile, 150)
      await snapshot(mobile, 'mobile-375', 'date-range-selected')
      await saveDemo(mobile, 'mobile-375-date-range-selected')
      evidence.actions.push({ context: 'mobile-375', action: 'select-date-range', result: 'two-calendar-days-selected' })
    }
  }
  const mobileTheme = mobile.getByRole('checkbox', { name: 'HUD 深色主题' })
  await mobileTheme.check()
  await waitForUpdate(mobile, 250)
  await snapshot(mobile, 'mobile-375', 'hud-theme')
  await saveDemo(mobile, 'mobile-375-hud-demo')
  await savePage(mobile, 'mobile-375-hud-page', true)

  await desktopContext.close()
  await mobileContext.close()
  evidence.finishedAt = new Date().toISOString()
} catch (error) {
  evidence.captureFailure = error instanceof Error ? error.stack ?? error.message : String(error)
  evidence.finishedAt = new Date().toISOString()
} finally {
  evidence.sourceHashAfter = await hashSources()
  const afterMismatches = compareHashes(evidence.sourceHashAfter)
  evidence.sourceHashMismatches = [...evidence.sourceHashMismatches, ...afterMismatches]
  evidence.sourceHashStable = evidence.sourceHashMismatches.length === 0
  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(path.join(outputDir, 'source-hashes-after.json'), `${JSON.stringify(evidence.sourceHashAfter, null, 2)}\n`)
  await fs.writeFile(path.join(outputDir, 'source-hash-comparison.json'), `${JSON.stringify({
    freezePath,
    capturedAt: freeze.capturedAt,
    fileCount: freeze.fileCount,
    beforeMatchesFreeze: compareHashes(evidence.sourceHashBefore).length === 0,
    afterMatchesFreeze: afterMismatches.length === 0,
    stableDuringAssessment: evidence.sourceHashStable,
    beforeMismatches: compareHashes(evidence.sourceHashBefore),
    afterMismatches,
  }, null, 2)}\n`)
  await fs.writeFile(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  await browser.close()
}

if (evidence.captureFailure) {
  process.stderr.write(`${evidence.captureFailure}\n`)
  process.exitCode = 1
}
