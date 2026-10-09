const fs = require('node:fs/promises')
const path = require('node:path')
const { createRequire } = require('node:module')

const repositoryRoot = path.resolve(__dirname, '../../../../..')
const applicationRequire = createRequire(path.join(repositoryRoot, 'other-admin/admin-vue3/package.json'))
const { chromium } = applicationRequire('@playwright/test')
const outputDirectory = __dirname
const targetUrl = 'http://127.0.0.1:4174/components/lxdynamicform.html'
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

function visible(element) {
  const rect = element.getBoundingClientRect()
  const style = getComputedStyle(element)
  return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    && !element.closest('details:not([open])')
    && !element.closest('[hidden], [aria-hidden="true"]')
}

async function snapshot(page, label) {
  return page.evaluate((snapshotLabel) => {
    const visibleElement = (element) => {
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
        && !element.closest('details:not([open])')
        && !element.closest('[hidden], [aria-hidden="true"]')
    }
    const visibleText = (selector) => [...document.querySelectorAll(selector)]
      .filter(visibleElement)
      .map((element) => (element.innerText || '').trim())
      .filter(Boolean)
    const fields = [...document.querySelectorAll('input, textarea, select')]
      .filter(visibleElement)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        type: element.getAttribute('type') || '',
        label: element.labels ? [...element.labels].map((item) => item.innerText.trim()).filter(Boolean).join(' / ') : '',
        ariaLabel: element.getAttribute('aria-label') || '',
        placeholder: element.getAttribute('placeholder') || '',
        readonly: element.readOnly === true,
        disabled: element.disabled === true,
        width: Math.round(element.getBoundingClientRect().width),
      }))
    const actions = [...document.querySelectorAll('.dynamic-form-demo__footer button')]
      .filter(visibleElement)
      .map((button) => {
        const rect = button.getBoundingClientRect()
        return { label: button.innerText.trim(), x: Math.round(rect.x), y: Math.round(rect.y + scrollY), width: Math.round(rect.width), height: Math.round(rect.height) }
      })
    const formGroups = [...document.querySelectorAll('.lx-dynamic-form__section-title')]
      .filter(visibleElement)
      .map((title) => {
        let count = 0
        let sibling = title.nextElementSibling
        while (sibling && !sibling.matches('.lx-dynamic-form__section-title')) {
          if (sibling.matches('.lx-dynamic-form__item')) count += 1
          sibling = sibling.nextElementSibling
        }
        return { title: title.innerText.trim(), fieldCount: count }
      })
    const uploadRows = [...document.querySelectorAll('.lx-upload__file')]
      .filter(visibleElement)
      .map((row) => (row.innerText || '').trim())
    return {
      label: snapshotLabel,
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight },
      document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      headings: visibleText('h1, h2, h3'),
      groups: formGroups,
      buttons: visibleText('button, [role=button]'),
      fields,
      primaryActions: actions,
      uploadRows,
      visibleErrorText: visibleText('[role=alert], .el-form-item__error, .lx-dynamic-form__feedback'),
      bodyStart: (document.querySelector('.dynamic-form-demo')?.innerText || '').slice(0, 2400),
      darkClass: document.documentElement.classList.contains('dark'),
      hudClass: document.documentElement.classList.contains('lx-theme-hud'),
    }
  }, label)
}

async function openDetails(page, selector) {
  const details = page.locator(selector)
  if (!(await details.getAttribute('open'))) await details.locator('summary').click()
  return details
}

async function desktopAssessment(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' })
  const page = await context.newPage()
  const consoleErrors = []
  const failedResponses = []
  const requestLog = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push({ text: message.text(), location: message.location() })
  })
  page.on('response', (response) => {
    requestLog.push({ url: response.url(), status: response.status() })
    if (response.status() >= 400) failedResponses.push({ url: response.url(), status: response.status() })
  })
  const response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(350)
  const evidence = { name: 'desktop', httpStatus: response?.status() ?? null, snapshots: [], interactions: [], consoleErrors, failedResponses, requestLog }
  evidence.snapshots.push(await snapshot(page, 'desktop-light-initial'))
  await page.screenshot({ path: path.join(outputDirectory, 'desktop-light-viewport.png') })
  await page.locator('.dynamic-form-demo').screenshot({ path: path.join(outputDirectory, 'desktop-light-form.png') })

  const settings = await openDetails(page, 'details.dynamic-form-demo__settings')
  await page.getByRole('checkbox', { name: '深色主题（HUD）' }).check()
  await page.waitForTimeout(150)
  evidence.snapshots.push(await snapshot(page, 'desktop-hud'))
  await page.locator('.dynamic-form-demo').screenshot({ path: path.join(outputDirectory, 'desktop-hud-form.png') })
  await page.getByRole('checkbox', { name: '深色主题（HUD）' }).uncheck()

  await page.getByRole('button', { name: '提交校验' }).click()
  await page.waitForTimeout(100)
  evidence.interactions.push({
    action: 'submit-empty-form',
    errors: await page.locator('.lx-dynamic-form__item .el-form-item__error').allInnerTexts(),
    actionStatus: await page.locator('.dynamic-form-demo__footer').innerText(),
  })
  await page.locator('.dynamic-form-demo').screenshot({ path: path.join(outputDirectory, 'desktop-form-errors.png') })

  await page.getByPlaceholder('输入任务名称').fill('严格冻结评估任务')
  await page.getByPlaceholder('输入访问密码').fill('assessment-password')
  await page.getByRole('button', { name: '提交校验' }).click()
  await page.waitForTimeout(100)
  evidence.interactions.push({
    action: 'correct-required-fields',
    errors: await page.locator('.lx-dynamic-form__item .el-form-item__error').allInnerTexts(),
    actionStatus: await page.locator('.dynamic-form-demo__footer').innerText(),
    fieldValues: {
      name: await page.getByPlaceholder('输入任务名称').inputValue(),
      passwordPresent: Boolean(await page.getByPlaceholder('输入访问密码').inputValue()),
    },
  })
  await page.locator('.dynamic-form-demo').screenshot({ path: path.join(outputDirectory, 'desktop-form-recovered.png') })

  const coverInput = page.locator('.lx-dynamic-form__item input[type=file]').first()
  const mockFile = { name: '失败后重试-严格评估.png', mimeType: 'image/png', buffer: Buffer.from('assessment-only mock upload') }
  await coverInput.setInputFiles(mockFile)
  await page.waitForTimeout(1050)
  evidence.interactions.push({ action: 'upload-failure', row: (await page.locator('.lx-upload__file').first().innerText()).trim() })
  await page.locator('.dynamic-form-demo').screenshot({ path: path.join(outputDirectory, 'desktop-upload-failure.png') })
  const uploadRetry = page.getByRole('button', { name: '重新上传' }).first()
  const retryAvailable = await uploadRetry.count() > 0
  if (retryAvailable) {
    await uploadRetry.click()
    await page.waitForTimeout(1050)
  }
  evidence.interactions.push({ action: 'upload-retry', retryAvailable, row: (await page.locator('.lx-upload__file').first().innerText()).trim() })
  await page.locator('.dynamic-form-demo').screenshot({ path: path.join(outputDirectory, 'desktop-upload-retry-success.png') })

  const schemaPreview = await openDetails(page, 'details.dynamic-form-demo__schema-preview')
  const typeSelector = page.getByRole('combobox', { name: '选择字段类型' })
  await typeSelector.scrollIntoViewIfNeeded()
  await typeSelector.evaluate((element) => element.focus())
  await page.keyboard.press('Enter')
  await page.waitForTimeout(150)
  const allOptions = await page.getByRole('option').allInnerTexts()
  evidence.interactions.push({ action: 'open-type-selector-by-keyboard', optionCount: allOptions.length, options: allOptions.map((option) => option.trim()) })
  await page.screenshot({ path: path.join(outputDirectory, 'desktop-type-selector-open.png') })

  await typeSelector.evaluate((element) => element.focus())
  await page.keyboard.type('密码')
  await page.waitForTimeout(150)
  const filteredOptions = await page.getByRole('option').allInnerTexts()
  evidence.interactions.push({ action: 'filter-type-options-by-keyboard', query: '密码', optionCount: filteredOptions.length, options: filteredOptions.map((option) => option.trim()) })
  await page.screenshot({ path: path.join(outputDirectory, 'desktop-type-selector-filtered.png') })
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(120)
  evidence.interactions.push({
    action: 'select-password-type-by-keyboard',
    selectedLabel: await schemaPreview.locator('.lx-dynamic-form__item .el-form-item__label').innerText(),
    inputType: await schemaPreview.locator('input').first().getAttribute('type'),
    placeholder: await schemaPreview.locator('input').first().getAttribute('placeholder'),
  })
  await schemaPreview.screenshot({ path: path.join(outputDirectory, 'desktop-type-password-selected.png') })

  await page.getByRole('combobox', { name: '选择字段类型' }).evaluate((element) => element.focus())
  await page.keyboard.press('Control+A')
  await page.keyboard.type('文件上传')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(150)
  evidence.interactions.push({
    action: 'select-upload-type-by-keyboard',
    previewLabel: await schemaPreview.locator('.lx-dynamic-form__item .el-form-item__label').innerText(),
    uploadInputs: await schemaPreview.locator('input[type=file]').count(),
    visibleActions: await schemaPreview.locator('button').evaluateAll((buttons) => buttons.filter(visible).map((button) => (button.innerText || button.getAttribute('aria-label') || '').trim())),
  })
  await schemaPreview.screenshot({ path: path.join(outputDirectory, 'desktop-type-upload-selected.png') })
  await page.getByRole('checkbox', { name: '深色主题（HUD）' }).check()
  await page.screenshot({ path: path.join(outputDirectory, 'desktop-hud-full.png'), fullPage: true })
  await settings.locator('summary').evaluate((element) => element.focus())
  await page.keyboard.press('Escape')
  evidence.interactions.push({ action: 'escape-focus-check', activeElement: await page.evaluate(() => ({ tag: document.activeElement?.tagName, text: (document.activeElement?.textContent || '').trim() })) })

  evidence.consoleErrors = consoleErrors
  evidence.failedResponses = failedResponses
  await fs.writeFile(path.join(outputDirectory, 'browser-evidence-desktop.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  await context.close()
  return evidence
}

async function mobileAssessment(browser) {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, colorScheme: 'light' })
  const page = await context.newPage()
  const response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(300)
  const evidence = { name: 'mobile-375', httpStatus: response?.status() ?? null, snapshots: [], interactions: [] }
  evidence.snapshots.push(await snapshot(page, 'mobile-375-initial'))
  await page.screenshot({ path: path.join(outputDirectory, 'mobile-375-initial-viewport.png') })
  await page.locator('.dynamic-form-demo').scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(outputDirectory, 'mobile-375-form-viewport.png') })
  await page.getByRole('button', { name: '提交校验' }).click()
  await page.waitForTimeout(100)
  evidence.interactions.push({
    action: 'mobile-submit-empty-form',
    errors: await page.locator('.lx-dynamic-form__item .el-form-item__error').allInnerTexts(),
    actions: await page.locator('.dynamic-form-demo__footer button').evaluateAll((buttons) => buttons.map((button) => {
      const rect = button.getBoundingClientRect()
      return { label: button.innerText.trim(), x: Math.round(rect.x), y: Math.round(rect.y + scrollY), width: Math.round(rect.width), height: Math.round(rect.height) }
    })),
  })
  await page.screenshot({ path: path.join(outputDirectory, 'mobile-375-form-errors.png') })
  await fs.writeFile(path.join(outputDirectory, 'browser-evidence-mobile.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  await context.close()
  return evidence
}

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: chromePath })
  try {
    const desktop = await desktopAssessment(browser)
    const mobile = await mobileAssessment(browser)
    const summary = {
      browser: browser.version(),
      targetUrl,
      desktop: {
        httpStatus: desktop.httpStatus,
        interactions: desktop.interactions,
        consoleErrors: desktop.consoleErrors,
        failedResponses: desktop.failedResponses,
      },
      mobile: {
        httpStatus: mobile.httpStatus,
        viewport: mobile.snapshots[0].viewport,
        document: mobile.snapshots[0].document,
        interactions: mobile.interactions,
      },
    }
    await fs.writeFile(path.join(outputDirectory, 'browser-evidence-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
    console.log(JSON.stringify(summary, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error.stack || error)
  process.exitCode = 1
})
