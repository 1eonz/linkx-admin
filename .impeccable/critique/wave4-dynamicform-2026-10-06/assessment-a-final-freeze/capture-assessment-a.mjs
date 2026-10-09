import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

const root = process.cwd()
const outputDir = path.resolve(process.argv[2])
const manifestPath = path.resolve(root, '.impeccable/critique/wave4-dynamicform-2026-10-06/source-hashes-freeze.json')
const url = 'http://127.0.0.1:4174/components/lxdynamicform.html'
const freeze = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
const pairs = Object.entries(freeze.files)
const require = createRequire(import.meta.url)
const playwrightPath = path.resolve(root, 'other-admin/admin-vue3/node_modules/@playwright/test')
const { chromium } = require(playwrightPath)
const evidence = {
  url,
  freezePath: manifestPath,
  frozenAt: freeze.capturedAt,
  fileCount: pairs.length,
  startedAt: new Date().toISOString(),
  sourceHashBefore: {},
  sourceHashAfter: {},
  sourceHashMismatches: [],
  snapshots: [],
  steps: [],
  consoleErrors: [],
  pageErrors: [],
  httpErrors: [],
  failedRequests: [],
  externalRequests: [],
}

await fs.mkdir(outputDir, { recursive: true })

async function hashSources() {
  const hashes = {}
  for (const [relativePath] of pairs) {
    const absolutePath = path.resolve(root, relativePath)
    const bytes = await fs.readFile(absolutePath)
    hashes[relativePath] = createHash('sha256').update(bytes).digest('hex')
  }
  return hashes
}

function mismatches(hashes) {
  return pairs.flatMap(([relativePath, expected]) => {
    const actual = hashes[relativePath] ?? 'MISSING'
    return actual === expected.toLowerCase()
      ? []
      : [{ path: relativePath, expected: expected.toLowerCase(), actual }]
  })
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
  page.on('response', (response) => {
    if (response.status() >= 400) {
      evidence.httpErrors.push({ context: contextName, status: response.status(), url: response.url() })
    }
  })
  page.on('requestfailed', (request) => {
    evidence.failedRequests.push({
      context: contextName,
      url: request.url(),
      failure: request.failure()?.errorText,
    })
  })
  page.on('request', (request) => {
    const requestUrl = request.url()
    if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//i.test(requestUrl)) {
      evidence.externalRequests.push({ context: contextName, url: requestUrl, method: request.method() })
    }
  })
}

async function savePage(page, name, fullPage = false) {
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage, animations: 'disabled' })
}

async function saveDemo(page, name) {
  await page.locator('.dynamic-form-demo').first().screenshot({
    path: path.join(outputDir, `${name}.png`),
    animations: 'disabled',
  })
}

async function snapshot(page, contextName, name) {
  const state = await page.evaluate(() => {
    const demo = document.querySelector('.dynamic-form-demo')
    const form = document.querySelector('.dynamic-form-demo .lx-dynamic-form')
    const main = document.querySelector('main')
    return {
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight },
      pageWidth: { scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth },
      mainWidth: main ? { scroll: main.scrollWidth, client: main.clientWidth } : null,
      theme: {
        dark: document.documentElement.classList.contains('dark'),
        hud: document.documentElement.classList.contains('lx-theme-hud'),
      },
      formText: form?.innerText ?? null,
      demoText: demo?.innerText ?? null,
      fileInputs: [...document.querySelectorAll('.dynamic-form-demo input[type="file"]')]
        .map((input) => ({ accept: input.accept, multiple: input.multiple })),
      visibleButtons: [...document.querySelectorAll('.dynamic-form-demo button')]
        .filter((button) => button.getClientRects().length)
        .map((button) => ({ text: button.innerText.trim(), disabled: button.disabled })),
      focus: document.activeElement instanceof HTMLElement
        ? { tag: document.activeElement.tagName, label: document.activeElement.getAttribute('aria-label'), text: document.activeElement.textContent?.trim() }
        : null,
    }
  })
  evidence.snapshots.push({ context: contextName, state: name, ...state })
}

async function step(name, fn) {
  try {
    await fn()
    evidence.steps.push({ name, ok: true })
  } catch (error) {
    evidence.steps.push({ name, ok: false, error: error instanceof Error ? error.stack ?? error.message : String(error) })
  }
}

evidence.sourceHashBefore = await hashSources()
evidence.sourceHashMismatches = mismatches(evidence.sourceHashBefore)
await fs.writeFile(path.join(outputDir, 'source-hashes-before.json'), `${JSON.stringify(evidence.sourceHashBefore, null, 2)}\n`)
if (pairs.length !== freeze.fileCount || evidence.sourceHashMismatches.length) {
  await fs.writeFile(path.join(outputDir, 'source-hash-comparison.json'), `${JSON.stringify({ fileCount: pairs.length, beforeMismatches: evidence.sourceHashMismatches }, null, 2)}\n`)
  throw new Error(`Frozen source mismatch before browser inspection: ${JSON.stringify(evidence.sourceHashMismatches)}`)
}

let browser
const contexts = []
try {
  browser = await chromium.launch({ headless: true, channel: 'msedge' })
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  contexts.push(desktopContext)
  const desktop = await desktopContext.newPage()
  desktop.setDefaultTimeout(6000)
  watchPage(desktop, 'desktop-1440')
  const desktopResponse = await desktop.goto(url, { waitUntil: 'networkidle', timeout: 20000 })
  evidence.steps.push({ name: 'desktop navigation', ok: desktopResponse?.status() === 200, status: desktopResponse?.status() })
  await desktop.locator('.dynamic-form-demo').waitFor()
  await desktop.waitForTimeout(1400)
  await snapshot(desktop, 'desktop-1440', 'light-default')
  await savePage(desktop, 'desktop-light-page', true)
  await saveDemo(desktop, 'desktop-light-demo')

  await step('open progressive demo sections', async () => {
    await desktop.locator('details.dynamic-form-demo__settings').evaluate((node) => { node.open = true })
    await desktop.locator('details.dynamic-form-demo__schema-preview').evaluate((node) => { node.open = true })
    await desktop.waitForTimeout(150)
    await snapshot(desktop, 'desktop-1440', 'settings-and-preview-open')
    await saveDemo(desktop, 'desktop-settings-and-preview')
  })

  await step('required validation and focus', async () => {
    await desktop.getByRole('button', { name: '提交校验' }).click()
    await desktop.locator('.dynamic-form-demo .lx-dynamic-form__item.is-error').first().waitFor({ timeout: 8000 })
    await desktop.waitForTimeout(200)
    await snapshot(desktop, 'desktop-1440', 'required-validation-error')
    await savePage(desktop, 'desktop-validation-error-page', true)
    await saveDemo(desktop, 'desktop-validation-error-demo')
  })

  await step('complete form and success feedback', async () => {
    const nameField = desktop.locator('.dynamic-form-demo .lx-dynamic-form__item').filter({ hasText: '任务名称' }).locator('input').first()
    const passwordField = desktop.locator('.dynamic-form-demo .lx-dynamic-form__item').filter({ hasText: '访问密码' }).locator('input').first()
    await nameField.fill('东城巡防任务')
    await passwordField.fill('Safe-Example-123')
    await desktop.getByRole('button', { name: '提交校验' }).click()
    await desktop.locator('.dynamic-form-demo [role="status"]').getByText(/表单已校验/).waitFor({ timeout: 6000 })
    await snapshot(desktop, 'desktop-1440', 'complete-form')
    await saveDemo(desktop, 'desktop-validation-success-demo')
  })

  await step('HUD theme', async () => {
    await desktop.getByRole('checkbox', { name: 'HUD 深色主题' }).check({ force: true })
    await desktop.waitForTimeout(250)
    await snapshot(desktop, 'desktop-1440', 'hud-theme')
    await savePage(desktop, 'desktop-hud-page', true)
    await saveDemo(desktop, 'desktop-hud-demo')
  })

  const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/nZcAAAAASUVORK5CYII=', 'base64')
  await step('single upload cancellation', async () => {
    const inputs = desktop.locator('.dynamic-form-demo input[type="file"]')
    await inputs.first().setInputFiles({ name: '取消-单图.png', mimeType: 'image/png', buffer: tinyPng })
    await desktop.getByText('取消-单图.png', { exact: true }).waitFor({ timeout: 5000 })
    await desktop.waitForTimeout(160)
    await snapshot(desktop, 'desktop-1440', 'upload-in-progress')
    await saveDemo(desktop, 'desktop-upload-in-progress')
    const cancel = desktop.locator('.dynamic-form-demo').getByRole('button', { name: /取消上传/ }).first()
    if (await cancel.count()) {
      await cancel.click()
      await desktop.waitForTimeout(160)
      await snapshot(desktop, 'desktop-1440', 'upload-cancelled')
      await saveDemo(desktop, 'desktop-upload-cancelled')
    }
  })

  await step('single upload retry then success', async () => {
    const clearButtons = desktop.locator('.dynamic-form-demo .lx-dynamic-form__item').filter({ hasText: '任务封面（单张）' }).getByRole('button', { name: /全部清空/ })
    if (await clearButtons.count()) await clearButtons.first().click()
    const input = desktop.locator('.dynamic-form-demo input[type="file"]').first()
    await input.setInputFiles({ name: '重试-单图.png', mimeType: 'image/png', buffer: tinyPng })
    await desktop.getByText('重试-单图.png', { exact: true }).waitFor({ timeout: 5000 })
    await desktop.getByText('文档 Mock 上传失败', { exact: true }).waitFor({ timeout: 5000 })
    await snapshot(desktop, 'desktop-1440', 'upload-failed')
    await saveDemo(desktop, 'desktop-upload-failed')
    const retry = desktop.locator('.dynamic-form-demo .lx-dynamic-form__item').filter({ hasText: '任务封面（单张）' }).getByRole('button', { name: /重新上传/ })
    await retry.first().click()
    await desktop.locator('.dynamic-form-demo .lx-dynamic-form__item').filter({ hasText: '任务封面（单张）' }).getByText('上传成功', { exact: true }).waitFor({ timeout: 6000 })
    await snapshot(desktop, 'desktop-1440', 'upload-retry-success')
    await saveDemo(desktop, 'desktop-upload-retry-success')
  })

  await step('multiple upload append', async () => {
    const inputs = desktop.locator('.dynamic-form-demo input[type="file"]')
    if (await inputs.count() > 1) {
      await inputs.nth(1).setInputFiles({ name: '附加现场.png', mimeType: 'image/png', buffer: tinyPng })
      await desktop.getByText('附加现场.png', { exact: true }).waitFor({ timeout: 5000 })
      await desktop.waitForTimeout(950)
      await snapshot(desktop, 'desktop-1440', 'multiple-upload-success')
      await saveDemo(desktop, 'desktop-multiple-upload-success')
    }
  })

  await step('remote candidate preview error and retry', async () => {
    await desktop.locator('#dynamic-form-schema-type').press('Enter')
    await desktop.getByRole('option', { name: '远程选择' }).click()
    await desktop.waitForTimeout(350)
    const preview = desktop.locator('.dynamic-form-demo__schema-preview')
    await snapshot(desktop, 'desktop-1440', 'remote-select-preview')
    await saveDemo(desktop, 'desktop-remote-select-preview')
    await preview.getByRole('group', { name: '预览候选模拟结果' }).getByRole('button', { name: '失败' }).click()
    await preview.getByText('候选人员读取失败', { exact: true }).waitFor({ timeout: 5000 })
    await snapshot(desktop, 'desktop-1440', 'candidate-preview-error')
    await saveDemo(desktop, 'desktop-candidate-preview-error')
    await preview.getByRole('button', { name: '重试' }).click()
    await desktop.waitForTimeout(400)
    await snapshot(desktop, 'desktop-1440', 'candidate-preview-recovered')
    await saveDemo(desktop, 'desktop-candidate-preview-recovered')
  })

  await step('main remote candidate failure and empty state', async () => {
    const settings = desktop.locator('details.dynamic-form-demo__settings')
    await settings.getByRole('radio', { name: '失败' }).check({ force: true })
    await desktop.locator('.dynamic-form-demo .lx-dynamic-form__item').filter({ hasText: '负责人' }).getByText('候选人员读取失败', { exact: true }).waitFor({ timeout: 5000 })
    await snapshot(desktop, 'desktop-1440', 'main-candidate-error')
    await saveDemo(desktop, 'desktop-main-candidate-error')
    await settings.getByRole('radio', { name: '空结果' }).check({ force: true })
    await desktop.locator('.dynamic-form-demo .lx-dynamic-form__item').filter({ hasText: '负责人' }).getByText('暂无候选人员', { exact: true }).waitFor({ timeout: 5000 })
    await snapshot(desktop, 'desktop-1440', 'main-candidate-empty')
    await saveDemo(desktop, 'desktop-main-candidate-empty')
  })

  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  contexts.push(mobileContext)
  const mobile = await mobileContext.newPage()
  mobile.setDefaultTimeout(6000)
  watchPage(mobile, 'mobile-375-touch')
  const mobileResponse = await mobile.goto(url, { waitUntil: 'networkidle', timeout: 20000 })
  evidence.steps.push({ name: 'mobile navigation', ok: mobileResponse?.status() === 200, status: mobileResponse?.status() })
  await mobile.locator('.dynamic-form-demo').waitFor()
  await mobile.waitForTimeout(900)
  await snapshot(mobile, 'mobile-375-touch', 'light-default')
  await savePage(mobile, 'mobile-375-light-page', true)
  await saveDemo(mobile, 'mobile-375-light-demo')
  await step('mobile HUD and field preview', async () => {
    await mobile.locator('details.dynamic-form-demo__settings').evaluate((node) => { node.open = true })
    await mobile.locator('details.dynamic-form-demo__schema-preview').evaluate((node) => { node.open = true })
    await mobile.getByRole('checkbox', { name: 'HUD 深色主题' }).check({ force: true })
    await mobile.locator('#dynamic-form-schema-type').press('Enter')
    await mobile.getByRole('option', { name: '日期范围' }).click()
    await mobile.waitForTimeout(150)
    await snapshot(mobile, 'mobile-375-touch', 'hud-date-range-preview')
    await saveDemo(mobile, 'mobile-375-hud-date-range')
    await savePage(mobile, 'mobile-375-hud-page', true)
    const rangeInputs = mobile.locator('.dynamic-form-demo__schema-preview .el-date-editor--daterange input')
    if (await rangeInputs.count() === 2) {
      await rangeInputs.first().click()
      await snapshot(mobile, 'mobile-375-touch', 'date-range-calendar-open')
      await saveDemo(mobile, 'mobile-375-date-range-calendar')
      const dayEight = mobile.locator('.el-date-picker__table td.available:not(.prev-month):not(.next-month)').filter({ hasText: /^8$/ }).first()
      const dayTwelve = mobile.locator('.el-date-picker__table td.available:not(.prev-month):not(.next-month)').filter({ hasText: /^12$/ }).first()
      if (await dayEight.count() && await dayTwelve.count()) {
        await dayEight.click()
        await dayTwelve.click()
        await mobile.waitForTimeout(100)
        await snapshot(mobile, 'mobile-375-touch', 'date-range-selected')
        await saveDemo(mobile, 'mobile-375-date-range-selected')
      }
    }
  })

  await step('touch target measurements', async () => {
    const details = await mobile.evaluate(() => {
      const selectors = [
        '.dynamic-form-demo__footer button',
        '.dynamic-form-demo input[type="file"]',
        '.lx-upload__clear',
        '.lx-upload__remove',
      ]
      return selectors.flatMap((selector) => [...document.querySelectorAll(selector)].map((element) => {
        const rect = element.getBoundingClientRect()
        return { selector, width: Math.round(rect.width), height: Math.round(rect.height), visible: rect.width > 0 && rect.height > 0 }
      }))
    })
    evidence.steps.push({ name: 'touch target measurements', ok: true, measurements: details })
  })

  evidence.finishedAt = new Date().toISOString()
} catch (error) {
  evidence.captureFailure = error instanceof Error ? error.stack ?? error.message : String(error)
  evidence.finishedAt = new Date().toISOString()
} finally {
  for (const context of contexts) await context.close().catch(() => {})
  if (browser) await browser.close().catch(() => {})
  evidence.sourceHashAfter = await hashSources()
  const beforeMismatches = mismatches(evidence.sourceHashBefore)
  const afterMismatches = mismatches(evidence.sourceHashAfter)
  evidence.sourceHashMismatches = [...beforeMismatches, ...afterMismatches]
  evidence.sourceHashStable = beforeMismatches.length === 0 && afterMismatches.length === 0
  await fs.writeFile(path.join(outputDir, 'source-hashes-after.json'), `${JSON.stringify(evidence.sourceHashAfter, null, 2)}\n`)
  await fs.writeFile(path.join(outputDir, 'source-hash-comparison.json'), `${JSON.stringify({
    freezePath: manifestPath,
    capturedAt: freeze.capturedAt,
    fileCount: pairs.length,
    beforeMatchesFreeze: beforeMismatches.length === 0,
    afterMatchesFreeze: afterMismatches.length === 0,
    stableDuringAssessment: evidence.sourceHashStable,
    beforeMismatches,
    afterMismatches,
  }, null, 2)}\n`)
  await fs.writeFile(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
}

if (evidence.captureFailure || !evidence.sourceHashStable) {
  process.stderr.write(`${evidence.captureFailure ?? 'Source hash changed during assessment.'}\n`)
  process.exitCode = 1
}
