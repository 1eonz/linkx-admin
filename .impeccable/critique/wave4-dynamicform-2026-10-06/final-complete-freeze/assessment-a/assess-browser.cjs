const fs = require('node:fs/promises')
const path = require('node:path')
const { createRequire } = require('node:module')

const root = path.resolve(__dirname, '../../../../..')
const requireFromApp = createRequire(path.join(root, 'other-admin/admin-vue3/package.json'))
const { chromium } = requireFromApp('@playwright/test')
const output = __dirname
const target = 'http://127.0.0.1:4174/components/lxdynamicform.html'
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

async function pageSnapshot(page, name) {
  return page.evaluate((snapshotName) => {
    const shown = (element) => {
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
        && !element.closest('details:not([open])')
        && !element.closest('[hidden], [aria-hidden="true"]')
    }
    const readText = (selector) => [...document.querySelectorAll(selector)].filter(shown)
      .map((element) => (element.innerText || '').trim()).filter(Boolean)
    const groups = [...document.querySelectorAll('.lx-dynamic-form__section-title')].filter(shown).map((heading) => {
      let count = 0
      let sibling = heading.nextElementSibling
      while (sibling && !sibling.matches('.lx-dynamic-form__section-title')) {
        if (sibling.matches('.lx-dynamic-form__item') && shown(sibling)) count += 1
        sibling = sibling.nextElementSibling
      }
      return { title: heading.innerText.trim(), visibleFieldCount: count }
    })
    const fields = [...document.querySelectorAll('.lx-dynamic-form__item input, .lx-dynamic-form__item textarea, .lx-dynamic-form__item select')]
      .filter(shown).map((element) => ({
        tag: element.tagName.toLowerCase(),
        type: element.getAttribute('type') || '',
        label: element.labels ? [...element.labels].map((label) => label.innerText.trim()).filter(Boolean).join(' / ') : '',
        ariaLabel: element.getAttribute('aria-label') || '',
        placeholder: element.getAttribute('placeholder') || '',
        readonly: element.readOnly === true,
        disabled: element.disabled === true,
        width: Math.round(element.getBoundingClientRect().width),
      }))
    const actions = [...document.querySelectorAll('.dynamic-form-demo__footer button')].filter(shown).map((button) => {
      const rect = button.getBoundingClientRect()
      return { label: button.innerText.trim(), x: Math.round(rect.x), y: Math.round(rect.y + scrollY), width: Math.round(rect.width), height: Math.round(rect.height) }
    })
    return {
      name: snapshotName,
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight },
      document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      groups,
      fields,
      visibleButtons: readText('button, [role=button]'),
      primaryActions: actions,
      errors: readText('[role=alert], .el-form-item__error, .lx-dynamic-form__feedback'),
      uploadRows: readText('.lx-upload__file'),
      darkClass: document.documentElement.classList.contains('dark'),
      hudClass: document.documentElement.classList.contains('lx-theme-hud'),
    }
  }, name)
}

async function toggleDetails(page, selector) {
  const details = page.locator(selector)
  if (await details.getAttribute('open') === null) await details.locator('summary').click()
  return details
}

async function captureForm(page, fileName) {
  await page.locator('.dynamic-form-demo').screenshot({ path: path.join(output, fileName) })
}

async function desktop(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' })
  const page = await context.newPage()
  const consoleErrors = []
  const httpFailures = []
  const pageResponse = await page.goto(target, { waitUntil: 'networkidle', timeout: 30000 })
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push({ text: message.text(), location: message.location() }) })
  page.on('response', (response) => { if (response.status() >= 400) httpFailures.push({ url: response.url(), status: response.status() }) })
  await page.waitForTimeout(250)
  const evidence = { name: 'desktop', httpStatus: pageResponse?.status() ?? null, snapshots: [], interactions: [], consoleErrors, httpFailures }
  evidence.snapshots.push(await pageSnapshot(page, 'light-initial'))
  await page.screenshot({ path: path.join(output, 'desktop-light-viewport.png') })
  await captureForm(page, 'desktop-light-form.png')

  const settings = await toggleDetails(page, 'details.dynamic-form-demo__settings')
  const hudLabel = page.locator('label').filter({ hasText: '深色主题（HUD）' }).first()
  await hudLabel.click()
  await page.waitForTimeout(120)
  evidence.snapshots.push(await pageSnapshot(page, 'hud-theme'))
  await captureForm(page, 'desktop-hud-form.png')
  await hudLabel.click()
  await settings.locator('summary').click()

  await page.getByRole('button', { name: '提交校验' }).click()
  await page.waitForTimeout(100)
  evidence.interactions.push({
    action: 'empty-form-submit',
    fieldErrors: await page.locator('.lx-dynamic-form__item .el-form-item__error').allInnerTexts(),
    footer: await page.locator('.dynamic-form-demo__footer').innerText(),
  })
  await captureForm(page, 'desktop-form-errors.png')

  await page.getByPlaceholder('输入任务名称').fill('完整冻结评估任务')
  await page.getByPlaceholder('输入访问密码').fill('assessment-password')
  await page.getByRole('button', { name: '提交校验' }).click()
  await page.waitForTimeout(100)
  evidence.interactions.push({
    action: 'required-fields-recovery',
    fieldErrors: await page.locator('.lx-dynamic-form__item .el-form-item__error').allInnerTexts(),
    footer: await page.locator('.dynamic-form-demo__footer').innerText(),
    nameValue: await page.getByPlaceholder('输入任务名称').inputValue(),
    passwordRetained: Boolean(await page.getByPlaceholder('输入访问密码').inputValue()),
  })
  await captureForm(page, 'desktop-form-recovered.png')

  const uploadInput = page.locator('.lx-dynamic-form__item input[type=file]').first()
  await uploadInput.setInputFiles({ name: '重试-严格冻结评估.png', mimeType: 'image/png', buffer: Buffer.from('local mock fixture') })
  await page.waitForTimeout(1100)
  evidence.interactions.push({ action: 'upload-failure', fileRow: (await page.locator('.lx-upload__file').first().innerText()).trim() })
  await captureForm(page, 'desktop-upload-failure.png')
  const retry = page.getByRole('button', { name: '重新上传' }).first()
  const retryFound = await retry.count() > 0
  if (retryFound) {
    await retry.click()
    await page.waitForTimeout(1100)
  }
  evidence.interactions.push({ action: 'upload-retry', retryFound, fileRow: (await page.locator('.lx-upload__file').first().innerText()).trim() })
  await captureForm(page, 'desktop-upload-retry-success.png')

  const preview = await toggleDetails(page, 'details.dynamic-form-demo__schema-preview')
  const typeInput = page.locator('#dynamic-form-schema-type')
  await typeInput.scrollIntoViewIfNeeded()
  await typeInput.evaluate((element) => element.focus())
  await page.keyboard.press('Enter')
  await page.waitForTimeout(150)
  const allTypes = await page.getByRole('option').allInnerTexts()
  evidence.interactions.push({ action: 'type-list-open-by-keyboard', count: allTypes.length, options: allTypes.map((value) => value.trim()) })
  await page.screenshot({ path: path.join(output, 'desktop-type-search-open.png') })

  let inputCanType = false
  try {
    await typeInput.fill('密码')
    inputCanType = true
  } catch (error) {
    evidence.interactions.push({ action: 'type-search-input-error', message: error.message.split('\n')[0] })
  }
  if (!inputCanType) {
    await typeInput.evaluate((element) => element.focus())
    await page.keyboard.type('密码')
  }
  await page.waitForTimeout(120)
  const filtered = await page.getByRole('option').allInnerTexts()
  evidence.interactions.push({ action: 'type-list-filter', query: '密码', count: filtered.length, options: filtered.map((value) => value.trim()) })
  await page.screenshot({ path: path.join(output, 'desktop-type-search-filtered.png') })
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(120)
  evidence.interactions.push({
    action: 'keyboard-select-password-type',
    previewLabel: await preview.locator('.lx-dynamic-form__item .el-form-item__label').innerText(),
    inputType: await preview.locator('.lx-dynamic-form__item input').first().getAttribute('type'),
  })
  await preview.screenshot({ path: path.join(output, 'desktop-type-password-selected.png') })

  await typeInput.evaluate((element) => element.focus())
  await typeInput.fill('文件上传')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(150)
  evidence.interactions.push({
    action: 'keyboard-select-upload-type',
    previewLabel: await preview.locator('.lx-dynamic-form__item .el-form-item__label').innerText(),
    fileInputCount: await preview.locator('input[type=file]').count(),
    uploadButtonCount: await preview.getByRole('button', { name: /上传/ }).count(),
  })
  await preview.screenshot({ path: path.join(output, 'desktop-type-upload-selected.png') })

  await fs.writeFile(path.join(output, 'browser-evidence-desktop.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  await context.close()
  return evidence
}

async function mobile(browser) {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, colorScheme: 'light' })
  const page = await context.newPage()
  const response = await page.goto(target, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(250)
  const evidence = { name: 'mobile-375', httpStatus: response?.status() ?? null, snapshots: [], interactions: [] }
  evidence.snapshots.push(await pageSnapshot(page, 'mobile-375-initial'))
  await page.screenshot({ path: path.join(output, 'mobile-375-initial-viewport.png') })
  await page.locator('.dynamic-form-demo').scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(output, 'mobile-375-form-viewport.png') })
  await page.getByRole('button', { name: '提交校验' }).click()
  await page.waitForTimeout(100)
  evidence.interactions.push({
    action: 'mobile-empty-submit',
    fieldErrors: await page.locator('.lx-dynamic-form__item .el-form-item__error').allInnerTexts(),
    actions: await page.locator('.dynamic-form-demo__footer button').evaluateAll((buttons) => buttons.map((button) => {
      const rect = button.getBoundingClientRect()
      return { label: button.innerText.trim(), x: Math.round(rect.x), y: Math.round(rect.y + scrollY), width: Math.round(rect.width), height: Math.round(rect.height) }
    })),
  })
  await page.screenshot({ path: path.join(output, 'mobile-375-form-errors.png') })
  await fs.writeFile(path.join(output, 'browser-evidence-mobile.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  await context.close()
  return evidence
}

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: chrome })
  try {
    const desktopResult = await desktop(browser)
    const mobileResult = await mobile(browser)
    const summary = {
      browser: browser.version(),
      target,
      desktop: { httpStatus: desktopResult.httpStatus, interactions: desktopResult.interactions, consoleErrors: desktopResult.consoleErrors, httpFailures: desktopResult.httpFailures },
      mobile: { httpStatus: mobileResult.httpStatus, viewport: mobileResult.snapshots[0].viewport, document: mobileResult.snapshots[0].document, interactions: mobileResult.interactions },
    }
    await fs.writeFile(path.join(output, 'browser-evidence-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
    console.log(JSON.stringify(summary, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch((error) => { console.error(error.stack || error); process.exitCode = 1 })
