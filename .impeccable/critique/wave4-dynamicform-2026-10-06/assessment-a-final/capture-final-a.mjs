import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'

const require = createRequire(resolve(process.cwd(), 'other-admin/admin-vue3/package.json'))
const { chromium } = require('@playwright/test')

const root = process.cwd()
const outputDir = resolve(root, '.impeccable/critique/wave4-dynamicform-2026-10-06/assessment-a-final')
const targetUrl = 'http://127.0.0.1:4181/components/lxdynamicform.html'
const browserPath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const sourcePaths = [
  'linkx-fe/src/components/LxDynamicForm/index.vue',
  'linkx-fe/src/components/LxDynamicForm/demo/basic.vue',
  'linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldUpload.vue',
  'linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldPassword.vue',
  'linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldRemoteSelect.vue',
  'linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldDateRange.vue',
  'linkx-fe/src/components/LxUpload/index.vue',
  'linkx-fe/docs/components/lxdynamicform.md',
]
const schemaTypes = [
  ['文本输入', 'input'],
  ['密码输入', 'password'],
  ['多行文本', 'textarea'],
  ['数字输入', 'number'],
  ['下拉选择', 'select'],
  ['远程选择', 'remote-select'],
  ['树形选择', 'tree-select'],
  ['日期选择', 'date'],
  ['日期范围', 'daterange'],
  ['开关', 'switch'],
  ['单选组', 'radio'],
  ['多选组', 'checkbox'],
  ['文件上传', 'upload'],
  ['自定义插槽', 'slot'],
]

async function hashFile(path) {
  return createHash('sha256').update(await readFile(resolve(root, path))).digest('hex')
}

async function fieldSnapshot(field) {
  return field.evaluate((rootElement) => {
    const label = rootElement.querySelector('.el-form-item__label')
    const control = rootElement.querySelector('input, textarea, button, [role="combobox"]')
    const feedback = rootElement.querySelector('[data-lx-field-feedback]')
    const rect = rootElement.getBoundingClientRect()
    return {
      label: label?.textContent?.trim(),
      rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
      control: control
        ? {
            tag: control.tagName.toLowerCase(),
            type: control.getAttribute('type'),
            role: control.getAttribute('role'),
            expanded: control.getAttribute('aria-expanded'),
            ariaLabel: control.getAttribute('aria-label'),
            labelledBy: control.getAttribute('aria-labelledby'),
            describedBy: control.getAttribute('aria-describedby'),
            placeholder: control.getAttribute('placeholder'),
            value: control instanceof HTMLInputElement ? control.value : undefined,
          }
        : null,
      componentClasses: Array.from(
        rootElement.querySelectorAll('.lx-input, .lx-select, .lx-upload, .lx-date-picker, .lx-checkbox-group, .lx-radio-group, .lx-tree-select, .lx-switch, .lx-input-number, .lx-textarea, .lx-password-input'),
      ).map((node) => Array.from(node.classList).join(' ')),
      feedback: feedback
        ? {
            text: feedback.textContent?.trim(),
            role: feedback.getAttribute('role'),
            live: feedback.getAttribute('aria-live'),
            id: feedback.id,
            className: feedback.className,
          }
        : null,
    }
  })
}

async function pageMetrics(page) {
  return page.evaluate(() => {
    const rect = (element) => {
      if (!element) return null
      const box = element.getBoundingClientRect()
      return {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      }
    }
    const demo = document.querySelector('.dynamic-form-demo')
    const form = document.querySelector('.dynamic-form-demo > .lx-dynamic-form-container > .lx-dynamic-form')
    const preview = document.querySelector('.dynamic-form-demo__schema-preview')
    const button = demo?.querySelector('button')
    const demoStyle = demo ? getComputedStyle(demo) : null
    const buttonStyle = button ? getComputedStyle(button) : null
    const fields = Array.from(demo?.querySelectorAll('.lx-dynamic-form__item') ?? [])
    return {
      viewport: { width: innerWidth, height: innerHeight },
      scrollY: Math.round(window.scrollY),
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      },
      theme: {
        rootClasses: document.documentElement.className,
        demoClasses: demo?.className,
        demoBackground: demoStyle?.backgroundColor,
        demoColor: demoStyle?.color,
        pageBackground: getComputedStyle(document.body).backgroundColor,
        designCardToken: demoStyle?.getPropertyValue('--lx-bg-card').trim(),
        primaryToken: demoStyle?.getPropertyValue('--lx-color-primary').trim(),
      },
      reducedMotion: {
        requested: matchMedia('(prefers-reduced-motion: reduce)').matches,
        buttonTransitionDuration: buttonStyle?.transitionDuration,
        buttonAnimationDuration: buttonStyle?.animationDuration,
      },
      docsContent: rect(document.querySelector('.vp-doc')),
      demo: rect(demo),
      form: rect(form),
      formColumns: form ? getComputedStyle(form).gridTemplateColumns.split(/\s+/).length : null,
      formFields: fields.length,
      previewOpen: preview?.hasAttribute('open') ?? false,
      docNav: rect(document.querySelector('.VPDocAside, .VPLocalNav, .VPNavBar')),
      fieldControls: fields.map((field) => {
        const label = field.querySelector('.el-form-item__label')
        const control = field.querySelector('input:not([type="file"]):not([type="hidden"]), textarea, button, [role="combobox"], [role="switch"]')
        const controlRect = rect(control)
        return {
          label: label?.textContent?.trim(),
          tag: control?.tagName.toLowerCase(),
          height: controlRect?.height,
          width: controlRect?.width,
        }
      }),
    }
  })
}

async function capture(page, evidence, name, options = {}) {
  const pagePath = join(outputDir, `${name}-page.png`)
  const demoPath = join(outputDir, `${name}-demo.png`)
  const viewportPath = options.viewport ? join(outputDir, `${name}-viewport.png`) : undefined
  await page.screenshot({ path: pagePath, fullPage: true, animations: 'disabled' })
  if (viewportPath) await page.screenshot({ path: viewportPath, animations: 'disabled' })
  if (options.demo !== false) {
    await page.locator('.dynamic-form-demo').first().screenshot({ path: demoPath, animations: 'disabled' })
  }
  const record = { name, pagePath, demoPath: options.demo === false ? undefined : demoPath, viewportPath, measurements: await pageMetrics(page) }
  evidence.screenshots.push(record)
  return record
}

async function setTheme(page, enabled) {
  const themeToggle = page.getByRole('checkbox', { name: 'HUD 深色主题' })
  if ((await themeToggle.isChecked()) !== enabled) {
    await page.getByText('HUD 深色主题', { exact: true }).click()
  }
  await page.waitForTimeout(80)
}

async function selectType(page, label) {
  const preview = page.locator('.dynamic-form-demo__schema-preview')
  await preview.locator('.lx-select .el-select__wrapper').first().scrollIntoViewIfNeeded()
  await preview.locator('.lx-select .el-select__wrapper').first().click()
  await page.getByRole('option', { name: label, exact: true }).click()
  await page.waitForTimeout(60)
  return preview
}

async function closeSelectDropdown(page, combobox) {
  await combobox.press('Escape').catch(() => {})
  await page.locator('.el-select-dropdown').waitFor({ state: 'hidden', timeout: 1500 }).catch(() => {})
  return {
    expanded: await combobox.getAttribute('aria-expanded'),
    visibleDropdownCount: await page.locator('.el-select-dropdown:visible').count(),
  }
}

async function observeVisible(locator, timeout = 1500) {
  try {
    await locator.waitFor({ state: 'visible', timeout })
    return true
  } catch {
    return false
  }
}

async function observeHidden(locator, timeout = 5000) {
  try {
    await locator.waitFor({ state: 'hidden', timeout })
    return true
  } catch {
    return false
  }
}

async function installNetworkFence(page, evidence, contextName) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.origin === 'http://127.0.0.1:4181' || url.protocol === 'data:' || url.protocol === 'blob:') {
      await route.continue()
      return
    }
    evidence.capture.blockedExternalRequests.push({ context: contextName, method: route.request().method(), url: route.request().url() })
    await route.abort()
  })
  await page.routeWebSocket('**/*', async (webSocket) => {
    const url = new URL(webSocket.url())
    if (url.protocol === 'ws:' && url.hostname === '127.0.0.1' && url.port === '4181') {
      webSocket.connectToServer()
      return
    }
    evidence.capture.blockedExternalRequests.push({ context: contextName, method: 'WS', url: webSocket.url() })
    await webSocket.close({ code: 1008, reason: '仅允许本地文档服务' })
  })
}

async function makeContext(browser, name, viewport, isMobile = false) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile,
    hasTouch: isMobile,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  return { context, page, name }
}

async function openTarget(page) {
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'LxDynamicForm 动态表单' }).waitFor()
  await page.locator('.dynamic-form-demo').waitFor()
  await page.waitForTimeout(300)
}

function getPreviewMode(page, modeName) {
  return page.getByRole('group', { name: '预览候选模拟结果' }).getByRole('button', { name: modeName, exact: true })
}

function getMainMode(page, modeName) {
  return page.getByRole('group', { name: '候选人员模拟结果' }).getByRole('button', { name: modeName, exact: true })
}

async function run() {
  await mkdir(outputDir, { recursive: true })
  const hashesBefore = Object.fromEntries(await Promise.all(sourcePaths.map(async (path) => [path, await hashFile(path)])))
  const evidence = {
    target: { source: sourcePaths[0], demo: sourcePaths[1], docs: sourcePaths[2], url: targetUrl, slug: 'linkx-fe-src-components-lxdynamicform-index-vue' },
    capture: {
      startedAt: new Date().toISOString(),
      browserPath,
      serverCommand: 'pnpm dev --host 127.0.0.1 --port 4181 --strictPort',
      serverStopMethod: '采集完成后向独立 exec session 发送 Ctrl+C',
      sourceHashesBefore: hashesBefore,
      contexts: [],
      blockedExternalRequests: [],
    },
    observations: {},
    screenshots: [],
  }

  let browser
  try {
    browser = await chromium.launch({ executablePath: browserPath, headless: true })
    evidence.capture.browserVersion = browser.version()
    const desktop = await makeContext(browser, '桌面 1440×1000', { width: 1440, height: 1000 })
    evidence.capture.contexts.push({ name: desktop.name, viewport: { width: 1440, height: 1000 }, reducedMotion: true })
    const desktopErrors = []
    desktop.page.on('pageerror', (error) => desktopErrors.push(error.message))
    desktop.page.on('console', (message) => { if (message.type() === 'error') desktopErrors.push(message.text()) })
    await installNetworkFence(desktop.page, evidence, desktop.name)
    await openTarget(desktop.page)
    const demo = desktop.page.locator('.dynamic-form-demo')
    const mainForm = demo.locator('> .lx-dynamic-form-container')
    evidence.observations.desktopLightEntry = {
      pageTitle: await desktop.page.title(),
      previewCollapsed: !(await demo.locator('.dynamic-form-demo__schema-preview').evaluate((node) => node.hasAttribute('open'))),
      pageErrors: desktopErrors,
    }
    await capture(desktop.page, evidence, 'desktop-1440-light-default')

    await desktop.page.getByRole('button', { name: '提交校验' }).click()
    const nameField = mainForm.locator('.lx-dynamic-form__item').filter({ hasText: '任务名称' })
    await nameField.getByText('请输入任务名称', { exact: true }).waitFor()
    evidence.observations.validationError = {
      field: await fieldSnapshot(nameField),
      focusedPlaceholder: await desktop.page.evaluate(() => document.activeElement?.getAttribute('placeholder')),
    }
    await capture(desktop.page, evidence, 'desktop-validation-error-light')
    await desktop.page.getByPlaceholder('输入任务名称').fill('夜间巡防任务')
    await desktop.page.getByPlaceholder('输入访问密码').fill('StrongPass123!')
    await desktop.page.getByPlaceholder('输入访问密码').blur()
    await desktop.page.getByRole('button', { name: '提交校验' }).click()
    await desktop.page.getByText('表单已校验：夜间巡防任务', { exact: true }).waitFor()
    evidence.observations.validationSuccess = await demo.locator('.dynamic-form-demo__footer').innerText()
    await capture(desktop.page, evidence, 'desktop-validation-success-light')

    const coverField = mainForm.locator('.lx-dynamic-form__item').filter({ hasText: '任务封面' })
    await coverField.locator('input[type="file"]').setInputFiles({
      name: '巡防封面.png',
      mimeType: 'image/png',
      buffer: Buffer.from('local mock image'),
    })
    await coverField.getByText('巡防封面.png', { exact: true }).waitFor()
    evidence.observations.uploadProgress = await fieldSnapshot(coverField)
    await capture(desktop.page, evidence, 'desktop-upload-progress-light')
    await coverField.getByText('上传成功', { exact: true }).waitFor()
    evidence.observations.uploadSuccess = await fieldSnapshot(coverField)
    await capture(desktop.page, evidence, 'desktop-upload-success-light')

    await desktop.page.getByText('演示设置', { exact: true }).click()
    await setTheme(desktop.page, true)
    evidence.observations.desktopHud = await pageMetrics(desktop.page)
    await capture(desktop.page, evidence, 'desktop-1440-hud-default')
    await setTheme(desktop.page, false)

    const preview = demo.locator('.dynamic-form-demo__schema-preview')
    await preview.getByText('字段类型预览', { exact: true }).click()
    evidence.observations.schemaTypes = []
    for (const [label, value] of schemaTypes) {
      await selectType(desktop.page, label)
      const field = preview.locator('.lx-dynamic-form__item')
      const snapshot = await fieldSnapshot(field)
      evidence.observations.schemaTypes.push({ label, value, ...snapshot })
      const panelPath = join(outputDir, `desktop-schema-${value}.png`)
      await preview.screenshot({ path: panelPath, animations: 'disabled' })
      evidence.screenshots.push({ name: `desktop-schema-${value}`, panelPath, measurements: await pageMetrics(desktop.page) })
    }

    await selectType(desktop.page, '远程选择')
    const previewField = preview.locator('.lx-dynamic-form__item')
    const previewSearch = previewField.getByRole('combobox')
    const mainOfficerField = mainForm.locator('.lx-dynamic-form__item').filter({ hasText: '负责人' })
    const mainSearch = mainOfficerField.getByRole('combobox')

    await getMainMode(desktop.page, '失败').click()
    await mainOfficerField.getByText('候选人员读取失败', { exact: true }).waitFor()
    await mainSearch.fill('警官')
    await mainOfficerField.getByText('候选人员读取失败', { exact: true }).waitFor()
    evidence.observations.mainFailureBeforePreview = {
      field: await fieldSnapshot(mainOfficerField),
      failureModePressed: await getMainMode(desktop.page, '失败').getAttribute('aria-pressed'),
    }
    await capture(desktop.page, evidence, 'desktop-main-failure-light')

    await preview.getByRole('group', { name: '预览候选模拟结果' }).getByRole('button', { name: '失败', exact: true }).click()
    await previewField.getByText('候选人员读取失败', { exact: true }).waitFor()
    await previewSearch.fill('警官')
    await desktop.page.waitForTimeout(400)
    evidence.observations.previewFailureTrigger = {
      field: await fieldSnapshot(previewField),
      errorModePressed: await getPreviewMode(desktop.page, '失败').getAttribute('aria-pressed'),
      roleAlertCount: await previewField.locator('[role="alert"]').count(),
      retryButtonCount: await previewField.getByRole('button', { name: '重试' }).count(),
    }
    if (!evidence.observations.previewFailureTrigger.field.feedback?.text?.includes('候选人员读取失败')) {
      await preview.getByRole('group', { name: '预览候选模拟结果' }).getByRole('button', { name: '失败', exact: true }).click()
      await desktop.page.waitForTimeout(400)
    }
    evidence.observations.previewFailureTrigger.retriggeredField = await fieldSnapshot(previewField)
    evidence.observations.previewFailure = {
      field: await fieldSnapshot(previewField),
      failureModePressed: await getPreviewMode(desktop.page, '失败').getAttribute('aria-pressed'),
      mainFailureStillVisible: await mainOfficerField.getByText('候选人员读取失败', { exact: true }).isVisible(),
      mainFailureModePressed: await getMainMode(desktop.page, '失败').getAttribute('aria-pressed'),
    }
    await capture(desktop.page, evidence, 'desktop-preview-failure-light')

    await selectType(desktop.page, '文本输入')
    await selectType(desktop.page, '远程选择')
    evidence.observations.previewAfterTypeRoundTrip = {
      field: await fieldSnapshot(previewField),
      successModePressed: await getPreviewMode(desktop.page, '成功').getAttribute('aria-pressed'),
      emptyModePressed: await getPreviewMode(desktop.page, '空结果').getAttribute('aria-pressed'),
      errorModePressed: await getPreviewMode(desktop.page, '失败').getAttribute('aria-pressed'),
    }
    await capture(desktop.page, evidence, 'desktop-preview-after-type-roundtrip-light')
    await getPreviewMode(desktop.page, '失败').click()
    await previewField.getByText('候选人员读取失败', { exact: true }).waitFor()
    await previewSearch.fill('警官')
    await previewField.getByText('候选人员读取失败', { exact: true }).waitFor()

    await setTheme(desktop.page, true)
    await capture(desktop.page, evidence, 'desktop-preview-failure-hud')
    await previewField.getByRole('button', { name: '重试' }).click()
    await previewField.getByText('候选人员加载中', { exact: true }).waitFor()
    evidence.observations.previewRetryLoading = {
      field: await fieldSnapshot(previewField),
      modeSuccessPressed: await getPreviewMode(desktop.page, '成功').getAttribute('aria-pressed'),
      searchValue: await previewSearch.inputValue(),
    }
    await capture(desktop.page, evidence, 'desktop-preview-retry-loading-hud')
    await previewField.getByText('候选人员加载中', { exact: true }).waitFor({ state: 'hidden' })
    await previewSearch.click()
    await desktop.page.getByRole('option', { name: '李警官 · 指挥中心', exact: true }).waitFor()
    evidence.observations.previewRetryRecovery = {
      field: await fieldSnapshot(previewField),
      successModePressed: await getPreviewMode(desktop.page, '成功').getAttribute('aria-pressed'),
      failureModePressed: await getPreviewMode(desktop.page, '失败').getAttribute('aria-pressed'),
      searchValue: await previewSearch.inputValue(),
      options: await desktop.page.getByRole('option').allTextContents(),
      mainFailureStillVisible: await mainOfficerField.getByText('候选人员读取失败', { exact: true }).isVisible(),
      mainFailureModePressed: await getMainMode(desktop.page, '失败').getAttribute('aria-pressed'),
    }
    await capture(desktop.page, evidence, 'desktop-preview-recovered-main-still-failed-hud')

    await mainOfficerField.getByRole('button', { name: '重试' }).click()
    await mainOfficerField.getByText('候选人员加载中', { exact: true }).waitFor()
    await mainOfficerField.getByText('候选人员加载中', { exact: true }).waitFor({ state: 'hidden' })
    await mainSearch.click()
    await desktop.page.getByRole('option', { name: '李警官 · 指挥中心', exact: true }).waitFor()
    evidence.observations.mainOwnRetryRecovery = {
      field: await fieldSnapshot(mainOfficerField),
      successModePressed: await getMainMode(desktop.page, '成功').getAttribute('aria-pressed'),
      previewFeedbackVisible: await previewField.locator('[data-lx-field-feedback]').isVisible().catch(() => false),
      previewModeSuccessPressed: await getPreviewMode(desktop.page, '成功').getAttribute('aria-pressed'),
    }
    await capture(desktop.page, evidence, 'desktop-both-recovered-hud')

    await desktop.context.close()

    const mobile = await makeContext(browser, '移动 375×812', { width: 375, height: 812 }, true)
    evidence.capture.contexts.push({ name: mobile.name, viewport: { width: 375, height: 812 }, reducedMotion: true })
    const mobileErrors = []
    mobile.page.on('pageerror', (error) => mobileErrors.push(error.message))
    mobile.page.on('console', (message) => { if (message.type() === 'error') mobileErrors.push(message.text()) })
    await installNetworkFence(mobile.page, evidence, mobile.name)
    await openTarget(mobile.page)
    const mobileDemo = mobile.page.locator('.dynamic-form-demo')
    evidence.observations.mobileLightEntry = { pageErrors: mobileErrors }
    await capture(mobile.page, evidence, 'mobile-375-light-default', { viewport: true })
    await mobile.page.getByText('演示设置', { exact: true }).click()
    await setTheme(mobile.page, true)
    evidence.observations.mobileHud = await pageMetrics(mobile.page)
    await capture(mobile.page, evidence, 'mobile-375-hud-default', { viewport: true })

    const mobilePreview = mobileDemo.locator('.dynamic-form-demo__schema-preview')
    await mobilePreview.getByText('字段类型预览', { exact: true }).click()
    await selectType(mobile.page, '日期范围')
    const mobileDateRange = mobilePreview.locator('.lx-dynamic-form__item')
    evidence.observations.mobileDateRange = await fieldSnapshot(mobileDateRange)
    await capture(mobile.page, evidence, 'mobile-375-hud-daterange', { viewport: true })

    await selectType(mobile.page, '远程选择')
    const mobilePreviewField = mobilePreview.locator('.lx-dynamic-form__item')
    const mobilePreviewSearch = mobilePreviewField.getByRole('combobox')
    const mobileMainField = mobileDemo.locator('> .lx-dynamic-form-container .lx-dynamic-form__item').filter({ hasText: '负责人' })
    await getMainMode(mobile.page, '失败').click()
    await mobileMainField.getByText('候选人员读取失败', { exact: true }).waitFor()
    await mobilePreview.getByRole('group', { name: '预览候选模拟结果' }).getByRole('button', { name: '失败', exact: true }).click()
    await mobilePreviewField.getByText('候选人员读取失败', { exact: true }).waitFor()
    await mobilePreviewSearch.fill('警官')
    await mobilePreviewField.getByText('候选人员读取失败', { exact: true }).waitFor()
    evidence.observations.mobilePreviewFailure = {
      field: await fieldSnapshot(mobilePreviewField),
      errorModePressed: await getPreviewMode(mobile.page, '失败').getAttribute('aria-pressed'),
      mainFailureVisible: await mobileMainField.getByText('候选人员读取失败', { exact: true }).isVisible(),
      mainFailureModePressed: await getMainMode(mobile.page, '失败').getAttribute('aria-pressed'),
      dropdown: await closeSelectDropdown(mobile.page, mobilePreviewSearch),
    }
    await capture(mobile.page, evidence, 'mobile-375-hud-preview-failure', { viewport: true })
    const mobileLoading = mobilePreviewField.getByText('候选人员加载中', { exact: true })
    const mobileLoadingObservedPromise = observeVisible(mobileLoading)
    await mobilePreviewField.getByRole('button', { name: '重试' }).click()
    const mobileLoadingObserved = await mobileLoadingObservedPromise
    evidence.observations.mobilePreviewRetryLoading = {
      field: await fieldSnapshot(mobilePreviewField),
      loadingObserved: mobileLoadingObserved,
      successModePressed: await getPreviewMode(mobile.page, '成功').getAttribute('aria-pressed'),
      searchValue: await mobilePreviewSearch.inputValue(),
    }
    if (mobileLoadingObserved) await capture(mobile.page, evidence, 'mobile-375-hud-preview-retry-loading', { viewport: true })
    const mobileLoadingCleared = await observeHidden(mobileLoading)
    if (mobileLoadingCleared && await mobilePreviewField.locator('[data-lx-field-feedback]').count() === 0) {
      await mobilePreviewSearch.click()
    }
    const mobileCandidateOption = mobile.page.getByRole('option', { name: '李警官 · 指挥中心', exact: true })
    const mobileCandidateAvailable = await observeVisible(mobileCandidateOption, 2500)
    evidence.observations.mobilePreviewRecovery = {
      field: await fieldSnapshot(mobilePreviewField),
      retryCompleted: mobileLoadingCleared,
      candidateAvailable: mobileCandidateAvailable,
      mainFailureStillVisible: await mobileMainField.getByText('候选人员读取失败', { exact: true }).isVisible(),
      mainFailureModePressed: await getMainMode(mobile.page, '失败').getAttribute('aria-pressed'),
      previewSuccessModePressed: await getPreviewMode(mobile.page, '成功').getAttribute('aria-pressed'),
      options: await mobile.page.getByRole('option').allTextContents(),
    }
    await closeSelectDropdown(mobile.page, mobilePreviewSearch)
    await capture(mobile.page, evidence, 'mobile-375-hud-preview-recovered-main-still-failed', { viewport: true })
    await mobile.context.close()
  } catch (error) {
    evidence.capture.status = 'failed'
    evidence.capture.failure = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }
    evidence.capture.sourceHashesAfter = Object.fromEntries(await Promise.all(sourcePaths.map(async (path) => [path, await hashFile(path)])))
    evidence.capture.sourceHashesStable = JSON.stringify(evidence.capture.sourceHashesBefore) === JSON.stringify(evidence.capture.sourceHashesAfter)
    evidence.capture.completedAt = new Date().toISOString()
    await writeFile(join(outputDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
    throw error
  } finally {
    await browser?.close()
  }

  evidence.capture.sourceHashesAfter = Object.fromEntries(await Promise.all(sourcePaths.map(async (path) => [path, await hashFile(path)])))
  evidence.capture.sourceHashesStable = JSON.stringify(evidence.capture.sourceHashesBefore) === JSON.stringify(evidence.capture.sourceHashesAfter)
  evidence.capture.status = 'completed'
  evidence.capture.completedAt = new Date().toISOString()
  await writeFile(join(outputDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  process.stdout.write(`${JSON.stringify({ screenshotScenarios: evidence.screenshots.length, evidencePath: join(outputDir, 'browser-evidence.json'), sourceHashesStable: evidence.capture.sourceHashesStable, previewRetryDesktop: evidence.observations.previewRetryRecovery?.successModePressed, previewRetryMobile: evidence.observations.mobilePreviewRecovery?.previewSuccessModePressed }, null, 2)}\n`)
}

run().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`)
  process.exitCode = 1
})
