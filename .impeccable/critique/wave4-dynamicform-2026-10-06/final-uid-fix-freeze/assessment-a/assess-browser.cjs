const fs = require('node:fs/promises')
const path = require('node:path')
const { createRequire } = require('node:module')

const repositoryRoot = path.resolve(__dirname, '../../../../..')
const assessmentDirectory = __dirname
const applicationRequire = createRequire(
  path.join(repositoryRoot, 'other-admin/admin-vue3/package.json'),
)
const { chromium } = applicationRequire('@playwright/test')
const targetUrl = 'http://127.0.0.1:4174/components/lxdynamicform.html'

async function findCachedChromium() {
  const installedBrowsers = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  ]
  for (const executablePath of installedBrowsers) {
    try {
      await fs.access(executablePath)
      return executablePath
    } catch {}
  }

  const cacheDirectory = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright')
  const entries = await fs.readdir(cacheDirectory, { withFileTypes: true }).catch(() => [])
  const candidates = entries
    .filter((entry) => entry.isDirectory() && /^chromium-\d+$/.test(entry.name))
    .sort((left, right) => Number(right.name.slice('chromium-'.length)) - Number(left.name.slice('chromium-'.length)))

  for (const candidate of candidates) {
    const executablePath = path.join(cacheDirectory, candidate.name, 'chrome-win64', 'chrome.exe')
    try {
      await fs.access(executablePath)
      return executablePath
    } catch {}
  }
  return undefined
}

async function inspectViewport(browser, name, viewport, deviceOptions = {}) {
  const context = await browser.newContext({ viewport, ...deviceOptions })
  const page = await context.newPage()
  const consoleMessages = []
  const requestFailures = []
  const httpFailures = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleMessages.push(message.text())
  })
  page.on('requestfailed', (request) => {
    requestFailures.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' })
  })
  page.on('response', (response) => {
    if (response.status() >= 400) httpFailures.push({ url: response.url(), status: response.status() })
  })

  const response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(800)
  const initial = await page.evaluate(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
        && !element.closest('details:not([open])')
        && !element.closest('[hidden], [aria-hidden="true"]')
    }
    const visibleText = (selector) => [...document.querySelectorAll(selector)]
      .filter(visible)
      .map((element) => (element.innerText || element.getAttribute('aria-label') || '').trim())
      .filter(Boolean)
    const fieldList = [...document.querySelectorAll('input, select, textarea')]
      .filter(visible)
      .map((field) => {
        const label = field.labels ? [...field.labels].map((item) => item.innerText.trim()).filter(Boolean).join(' / ') : ''
        return {
          tag: field.tagName.toLowerCase(),
          type: field.type || '',
          name: field.name || '',
          placeholder: field.placeholder || '',
          ariaLabel: field.getAttribute('aria-label') || '',
          label,
          required: field.required,
          disabled: field.disabled,
          width: Math.round(field.getBoundingClientRect().width),
        }
      })
    const uploadElements = [...document.querySelectorAll('input[type=file], [class*=upload], [data-testid*=upload]')]
      .filter(visible)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        text: (element.innerText || '').trim(),
        ariaLabel: element.getAttribute('aria-label') || '',
        className: typeof element.className === 'string' ? element.className : '',
        rect: (() => {
          const rect = element.getBoundingClientRect()
          return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }
        })(),
      }))
    const primaryActions = [...document.querySelectorAll('button')]
      .filter(visible)
      .filter((button) => /提交校验|重置/.test(button.innerText || ''))
      .map((button) => {
        const rect = button.getBoundingClientRect()
        return {
          label: (button.innerText || '').trim(),
          x: Math.round(rect.x),
          y: Math.round(rect.y + scrollY),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        }
      })
    return {
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight },
      document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      headings: visibleText('h1, h2, h3, h4'),
      buttons: visibleText('button, [role=button]'),
      links: visibleText('a'),
      fieldList,
      uploadElements,
      primaryActions,
      bodyText: (document.body.innerText || '').slice(0, 9000),
      imagesWithoutAlt: [...document.querySelectorAll('img:not([alt])')].length,
    }
  })

  await page.screenshot({ path: path.join(assessmentDirectory, `${name}-full.png`), fullPage: true })
  await page.screenshot({ path: path.join(assessmentDirectory, `${name}-viewport.png`) })
  if (name === 'desktop') {
    await page.locator('.dynamic-form-demo').screenshot({ path: path.join(assessmentDirectory, 'desktop-form-initial.png') })
  }
  if (name.startsWith('mobile-')) {
    await page.locator('.dynamic-form-demo').scrollIntoViewIfNeeded()
    await page.screenshot({ path: path.join(assessmentDirectory, `${name}-demo-viewport.png`) })
  }

  const evidence = {
    name,
    url: page.url(),
    httpStatus: response?.status() ?? null,
    initial,
    consoleErrors: consoleMessages,
    requestFailures,
    httpFailures,
    interactions: [],
  }

  const submitCandidates = page.locator('button, [role=button]').filter({ hasText: /提交|保存|校验|验证|submit|validate/i })
  if (await submitCandidates.count()) {
    const submit = submitCandidates.first()
    const submitText = (await submit.innerText()).trim()
    await submit.click()
    await page.waitForTimeout(300)
    const submitState = await page.evaluate(() => ({
      invalidFields: [...document.querySelectorAll(':invalid')].map((element) => ({
        name: element.getAttribute('name') || '',
        ariaLabel: element.getAttribute('aria-label') || '',
        message: element.validationMessage || '',
      })),
      errors: [...document.querySelectorAll('[role=alert], .el-form-item__error, .lx-form-item__error')]
        .filter((element) => element.getBoundingClientRect().width > 0)
        .map((element) => (element.innerText || '').trim()).filter(Boolean),
      bodyText: (document.body.innerText || '').slice(-2500),
    }))
    evidence.interactions.push({ action: 'click-primary-submit', label: submitText, state: submitState })
    await page.screenshot({ path: path.join(assessmentDirectory, `${name}-after-submit.png`), fullPage: true })
    if (name === 'desktop') {
      await page.locator('.dynamic-form-demo').screenshot({ path: path.join(assessmentDirectory, 'desktop-form-after-submit.png') })
    }
  }

  if (name === 'desktop') {
    const fileInput = page.locator('input[type=file]').first()
    if (await fileInput.count()) {
      const inputInfo = await fileInput.evaluate((element) => ({
        accept: element.accept,
        multiple: element.multiple,
        disabled: element.disabled,
      }))
      const fixture = {
        name: '重试-评估封面.png',
        mimeType: 'image/png',
        buffer: Buffer.from('assessment-only mock image fixture'),
      }
      await fileInput.setInputFiles(fixture)
      await page.waitForTimeout(1150)
      const failedUpload = await page.locator('.lx-upload__file').first().innerText()
      evidence.interactions.push({
        action: 'mock-upload-failure',
        input: inputInfo,
        fixtureName: fixture.name,
        state: failedUpload.trim(),
      })
      await page.screenshot({ path: path.join(assessmentDirectory, 'desktop-upload-failure.png'), fullPage: true })
      await page.locator('.dynamic-form-demo').screenshot({ path: path.join(assessmentDirectory, 'desktop-form-upload-failure.png') })

      const retryButton = page.getByRole('button', { name: '重新上传' }).first()
      const retryAvailable = await retryButton.count() > 0
      if (retryAvailable) {
        await retryButton.click()
        await page.waitForTimeout(1150)
      }
      const retriedUpload = await page.locator('.lx-upload__file').first().innerText()
      evidence.interactions.push({
        action: 'mock-upload-retry',
        retryButtonFound: retryAvailable,
        state: retriedUpload.trim(),
      })
      await page.screenshot({ path: path.join(assessmentDirectory, 'desktop-upload-retry-success.png'), fullPage: true })
      await page.locator('.dynamic-form-demo').screenshot({ path: path.join(assessmentDirectory, 'desktop-form-upload-retry-success.png') })
    }

    const settings = page.locator('details.dynamic-form-demo__settings')
    await settings.locator('summary').click()
    await page.getByText('失败', { exact: true }).first().click()
    await page.waitForTimeout(450)
    const candidateFailure = await page.locator('.lx-dynamic-form__feedback').innerText()
    evidence.interactions.push({ action: 'candidate-query-failure', state: candidateFailure.trim() })
    await page.locator('.dynamic-form-demo').screenshot({ path: path.join(assessmentDirectory, 'desktop-candidate-query-failure.png') })

    const candidateRetry = page.locator('.lx-dynamic-form__feedback').getByRole('button', { name: '重试' })
    const retryButtonFound = await candidateRetry.count() > 0
    if (retryButtonFound) {
      await candidateRetry.click()
      await page.waitForTimeout(450)
    }
    const candidateRecovery = await page.locator('.dynamic-form-demo__candidate-controls').innerText()
    const remainingFeedback = await page.locator('.lx-dynamic-form__feedback').count()
    evidence.interactions.push({
      action: 'candidate-query-retry',
      retryButtonFound,
      state: candidateRecovery.trim(),
      remainingFeedback,
    })
    await page.locator('.dynamic-form-demo').screenshot({ path: path.join(assessmentDirectory, 'desktop-candidate-query-retry-success.png') })

    await page.getByPlaceholder('输入任务名称').focus()
    const keyboardSequence = []
    for (let index = 0; index < 7; index += 1) {
      if (index > 0) await page.keyboard.press('Tab')
      keyboardSequence.push(await page.evaluate(() => {
        const element = document.activeElement
        const label = element?.labels ? [...element.labels].map((item) => item.innerText.trim()).filter(Boolean).join(' / ') : ''
        return {
          tag: element?.tagName.toLowerCase() ?? '',
          type: element?.getAttribute('type') ?? '',
          label,
          ariaLabel: element?.getAttribute('aria-label') ?? '',
          placeholder: element?.getAttribute('placeholder') ?? '',
          text: (element?.innerText ?? '').trim(),
          outlineStyle: getComputedStyle(element).outlineStyle,
          outlineWidth: getComputedStyle(element).outlineWidth,
        }
      }))
    }
    evidence.interactions.push({ action: 'keyboard-tab-sequence', sequence: keyboardSequence })
    await page.screenshot({ path: path.join(assessmentDirectory, 'desktop-keyboard-focus.png') })

    const schemaPreview = page.locator('details.dynamic-form-demo__schema-preview')
    await schemaPreview.locator('summary').click()
    const typeSelector = page.getByRole('combobox', { name: '选择字段类型' })
    await typeSelector.click()
    const typeOptions = await page.getByRole('option').allInnerTexts()
    evidence.interactions.push({ action: 'open-schema-type-options', optionCount: typeOptions.length, options: typeOptions.map((option) => option.trim()) })
    await page.screenshot({ path: path.join(assessmentDirectory, 'desktop-schema-type-options.png') })
    await page.getByRole('option', { name: '数字输入' }).click()
    await page.waitForTimeout(150)
    const numericPreviewControls = await schemaPreview.locator('button').evaluateAll((buttons) => buttons
      .filter((button) => button.getBoundingClientRect().width > 0)
      .map((button) => ({
        text: (button.innerText || '').trim(),
        ariaLabel: button.getAttribute('aria-label') || '',
      })))
    evidence.interactions.push({ action: 'numeric-preview-control-names', controls: numericPreviewControls })
    await schemaPreview.screenshot({ path: path.join(assessmentDirectory, 'desktop-schema-number-preview.png') })
  }

  evidence.consoleErrors = consoleMessages
  evidence.requestFailures = requestFailures
  evidence.httpFailures = httpFailures
  await context.close()
  return evidence
}

async function main() {
  await fs.mkdir(assessmentDirectory, { recursive: true })
  const executablePath = await findCachedChromium()
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) })
  try {
    const desktop = await inspectViewport(browser, 'desktop', { width: 1440, height: 1000 })
    const mobile = await inspectViewport(browser, 'mobile-375', { width: 375, height: 812 }, { isMobile: true, hasTouch: true })
    const narrow = await inspectViewport(browser, 'mobile-320', { width: 320, height: 720 }, { isMobile: true, hasTouch: true })
    const evidence = {
      capturedAt: new Date().toISOString(),
      browser: browser.version(),
      executablePath: executablePath ?? 'Playwright default',
      targetUrl,
      contexts: ['desktop', 'mobile-375', 'mobile-320'],
      views: [desktop, mobile, narrow],
    }
    await fs.writeFile(path.join(assessmentDirectory, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
    console.log(JSON.stringify({
      browser: evidence.browser,
      targetUrl,
      views: evidence.views.map((view) => ({
        name: view.name,
        httpStatus: view.httpStatus,
        title: view.initial.title,
        viewport: view.initial.viewport,
        document: view.initial.document,
        headings: view.initial.headings,
        buttons: view.initial.buttons,
        fields: view.initial.fieldList.length,
        interactions: view.interactions.map((interaction) => interaction.action),
        consoleErrors: view.consoleErrors,
        requestFailures: view.requestFailures,
        httpFailures: view.httpFailures,
      })),
      evidence: path.join(assessmentDirectory, 'browser-evidence.json'),
    }, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error.stack || error)
  process.exitCode = 1
})
