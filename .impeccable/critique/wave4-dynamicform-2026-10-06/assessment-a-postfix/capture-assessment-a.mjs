import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'

const require = createRequire(resolve(process.cwd(), 'other-admin/admin-vue3/package.json'))
const { chromium } = require('@playwright/test')

const root = process.cwd()
const outputDir = resolve(
  root,
  '.impeccable/critique/wave4-dynamicform-2026-10-06/assessment-a-postfix',
)
const targetUrl = 'http://127.0.0.1:4181/components/lxdynamicform.html'
const browserPath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const sourcePaths = [
  'linkx-fe/src/components/LxDynamicForm/index.vue',
  'linkx-fe/src/components/LxDynamicForm/demo/basic.vue',
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

async function sha256(path) {
  const bytes = await readFile(resolve(root, path))
  return createHash('sha256').update(bytes).digest('hex')
}

async function capturePage(page, name, includeDemo = true) {
  const pagePath = join(outputDir, `${name}-page.png`)
  await page.screenshot({ path: pagePath, fullPage: true, animations: 'disabled' })

  let demoPath
  if (includeDemo) {
    demoPath = join(outputDir, `${name}-demo.png`)
    await page.locator('.dynamic-form-demo').first().screenshot({
      path: demoPath,
      animations: 'disabled',
    })
  }

  const measurements = await page.evaluate(() => {
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
    const preview = document.querySelector('.dynamic-form-demo__schema-preview')
    const vpDoc = document.querySelector('.vp-doc')
    const activeForm = document.querySelector('.dynamic-form-demo .lx-dynamic-form')
    const mainFields = demo?.querySelectorAll('.lx-dynamic-form__item') ?? []

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        horizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
      },
      docsContent: rect(vpDoc),
      demo: rect(demo),
      preview: {
        open: preview?.hasAttribute('open') ?? false,
        rect: rect(preview),
      },
      visibleFormFieldCount: Array.from(mainFields).filter((field) => {
        const box = field.getBoundingClientRect()
        return box.width > 0 && box.height > 0
      }).length,
      formGridColumns: activeForm
        ? getComputedStyle(activeForm).gridTemplateColumns.split(/\s+/).length
        : null,
    }
  })

  return { pagePath, demoPath, measurements }
}

async function selectSchemaType(page, label) {
  const preview = page.locator('.dynamic-form-demo__schema-preview')
  await preview.locator('.lx-select .el-select__wrapper').first().click()
  await page.getByRole('option', { name: label, exact: true }).click()
  await page.waitForTimeout(80)
  return preview
}

async function fieldSnapshot(field) {
  return field.evaluate((rootElement) => {
    const label = rootElement.querySelector('.el-form-item__label')
    const controls = Array.from(
      rootElement.querySelectorAll('input, textarea, button, [role="combobox"]'),
    ).map((control) => ({
      tag: control.tagName.toLowerCase(),
      type: control.getAttribute('type'),
      role: control.getAttribute('role'),
      label: control.getAttribute('aria-label'),
      labelledBy: control.getAttribute('aria-labelledby'),
      describedBy: control.getAttribute('aria-describedby'),
      placeholder: control.getAttribute('placeholder'),
      text: control.textContent?.trim().slice(0, 80),
    }))
    const feedback = rootElement.querySelector('[data-lx-field-feedback]')

    return {
      label: label?.textContent?.trim(),
      controlClasses: Array.from(rootElement.querySelectorAll('.lx-input, .lx-select, .lx-upload, .lx-date-picker, .lx-checkbox-group, .lx-radio-group, .lx-tree-select, .lx-switch, .lx-input-number, .lx-textarea, .lx-password-input')).map((node) =>
        Array.from(node.classList).join(' '),
      ),
      controls,
      feedback: feedback
        ? {
            text: feedback.textContent?.trim(),
            role: feedback.getAttribute('role'),
            live: feedback.getAttribute('aria-live'),
            id: feedback.id,
          }
        : null,
    }
  })
}

async function run() {
  await mkdir(outputDir, { recursive: true })
  const sourceSha256Before = Object.fromEntries(
    await Promise.all(sourcePaths.map(async (path) => [path, await sha256(path)])),
  )
  const evidence = {
    target: {
      source: sourcePaths[0],
      url: targetUrl,
      critiqueSlug: 'linkx-fe-src-components-lxdynamicform-index-vue',
    },
    capture: {
      startedAt: new Date().toISOString(),
      browser: 'Microsoft Edge via Playwright Chromium driver',
      browserPath,
      serverCommand: 'pnpm dev --host 127.0.0.1 --port 4181 --strictPort',
      serverStopMethod: 'Ctrl+C on the dedicated exec session after capture',
      contexts: [],
      sourceSha256Before,
    },
    observations: {},
    screenshots: [],
  }

  const browser = await chromium.launch({ executablePath: browserPath, headless: true })
  evidence.capture.browserVersion = browser.version()

  try {
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    const desktop = await desktopContext.newPage()
    desktop.setDefaultTimeout(8000)
    const desktopErrors = []
    desktop.on('pageerror', (error) => desktopErrors.push(error.message))
    desktop.on('console', (message) => {
      if (message.type() === 'error') desktopErrors.push(message.text())
    })
    await desktop.goto(targetUrl, { waitUntil: 'domcontentloaded' })
    await desktop.getByRole('heading', { name: 'LxDynamicForm 动态表单' }).waitFor()
    await desktop.waitForTimeout(500)

    evidence.capture.contexts.push({ name: 'desktop', viewport: { width: 1440, height: 1000 } })
    evidence.observations.desktop = {
      title: await desktop.title(),
      pageErrors: desktopErrors,
      initialPreviewOpen: await desktop
        .locator('.dynamic-form-demo__schema-preview')
        .evaluate((element) => element.hasAttribute('open')),
      initialFieldCount: await desktop.locator('.dynamic-form-demo .lx-dynamic-form__item').count(),
      primaryFields: await Promise.all(
        await desktop.locator('.dynamic-form-demo .lx-dynamic-form__item').all().then((items) =>
          items.map((item) => fieldSnapshot(item)),
        ),
      ),
    }

    const initial = await capturePage(desktop, 'desktop-default-collapsed')
    evidence.screenshots.push({ name: 'desktop-default-collapsed', ...initial })

    await desktop.getByRole('button', { name: '提交校验' }).click()
    await desktop.getByText('请输入任务名称', { exact: true }).waitFor()
    const validationField = desktop
      .locator('.lx-dynamic-form__item')
      .filter({ hasText: '任务名称' })
    evidence.observations.validationError = {
      message: await validationField.locator('.el-form-item__error').innerText(),
      focusedPlaceholder: await desktop.evaluate(() =>
        document.activeElement?.getAttribute('placeholder'),
      ),
      invalid: await validationField.locator('input').getAttribute('aria-invalid'),
      describedBy: await validationField.locator('input').getAttribute('aria-describedby'),
    }
    const validationError = await capturePage(desktop, 'desktop-validation-error')
    evidence.screenshots.push({ name: 'desktop-validation-error', ...validationError })

    await desktop.getByPlaceholder('输入任务名称').fill('夜间巡防任务')
    await desktop.getByPlaceholder('输入访问密码').fill('StrongPass123!')
    await desktop.getByPlaceholder('输入访问密码').blur()
    await desktop.getByRole('button', { name: '提交校验' }).click()
    await desktop.getByText('表单已校验：夜间巡防任务', { exact: true }).waitFor()
    evidence.observations.validationSuccess = await desktop
      .locator('.dynamic-form-demo__footer')
      .innerText()
    const validationSuccess = await capturePage(desktop, 'desktop-validation-success')
    evidence.screenshots.push({ name: 'desktop-validation-success', ...validationSuccess })

    const preview = desktop.locator('.dynamic-form-demo__schema-preview')
    await preview.getByText('字段类型预览', { exact: true }).click()
    const defaultPreview = await capturePage(desktop, 'desktop-preview-number')
    evidence.screenshots.push({ name: 'desktop-preview-number', ...defaultPreview })

    evidence.observations.schemaTypes = []
    for (const [label, value] of schemaTypes) {
      await selectSchemaType(desktop, label)
      const field = preview.locator('.lx-dynamic-form__item')
      const snapshot = await fieldSnapshot(field)
      evidence.observations.schemaTypes.push({ label, value, ...snapshot })
      const imagePath = join(outputDir, `desktop-schema-${value}.png`)
      await preview.screenshot({ path: imagePath, animations: 'disabled' })
      evidence.screenshots.push({ name: `desktop-schema-${value}`, panelPath: imagePath })
    }

    await selectSchemaType(desktop, '远程选择')
    const remoteField = preview.locator('.lx-dynamic-form__item')
    const remoteSearch = remoteField.getByRole('combobox')
    await desktop.getByText('演示设置', { exact: true }).click()
    await desktop.getByRole('button', { name: '失败', exact: true }).click()
    await remoteSearch.fill('警官')
    await remoteField.getByText('候选人员读取失败', { exact: true }).waitFor()

    const errorFeedback = remoteField.locator('[data-lx-field-feedback]')
    const feedbackId = await errorFeedback.getAttribute('id')
    evidence.observations.remotePreviewFailure = {
      feedback: await fieldSnapshot(remoteField),
      controlDescribedBy: await remoteSearch.getAttribute('aria-describedby'),
      feedbackId,
      retryVisible: await remoteField.getByRole('button', { name: '重试' }).isVisible(),
      optionsVisible: await desktop.getByRole('option').count(),
    }
    const remoteError = await capturePage(desktop, 'desktop-remote-preview-error')
    evidence.screenshots.push({ name: 'desktop-remote-preview-error', ...remoteError })

    await remoteField.getByRole('button', { name: '重试' }).click()
    await desktop.waitForTimeout(50)
    const retryClickSnapshot = await fieldSnapshot(remoteField)
    evidence.observations.remotePreviewLoading = {
      feedback: retryClickSnapshot,
      loadingFeedbackVisible: retryClickSnapshot.feedback?.text?.includes('候选人员加载中') ?? false,
      successModePressed: await desktop
        .getByRole('button', { name: '成功', exact: true })
        .getAttribute('aria-pressed'),
      selectLoadingTextVisible: await desktop
        .getByText('正在搜索候选人员', { exact: true })
        .isVisible()
        .catch(() => false),
    }
    if (evidence.observations.remotePreviewLoading.loadingFeedbackVisible) {
      const remoteLoading = await capturePage(desktop, 'desktop-remote-preview-loading')
      evidence.screenshots.push({ name: 'desktop-remote-preview-loading', ...remoteLoading })
    }

    await desktop.waitForTimeout(400)
    evidence.observations.remotePreviewSettled = {
      field: await fieldSnapshot(remoteField),
      successModePressed: await desktop
        .getByRole('button', { name: '成功', exact: true })
        .getAttribute('aria-pressed'),
    }
    evidence.observations.remotePreviewRetryRecovered = !(
      evidence.observations.remotePreviewSettled.field.feedback?.text?.includes('读取失败')
    )
    if (!evidence.observations.remotePreviewRetryRecovered) {
      const retryNoOp = await capturePage(desktop, 'desktop-remote-preview-retry-noop')
      evidence.screenshots.push({ name: 'desktop-remote-preview-retry-noop', ...retryNoOp })
      await desktop.getByRole('button', { name: '成功', exact: true }).click()
      await remoteSearch.fill('')
      await remoteSearch.fill('警官')
      await desktop.waitForTimeout(400)
    }
    await remoteSearch.click()
    await desktop.getByRole('option', { name: '李警官 · 指挥中心', exact: true }).waitFor()
    await remoteField.getByText('候选人员加载中', { exact: true }).waitFor({ state: 'hidden' })
    evidence.observations.remotePreviewRecovery = {
      feedbackVisible: await remoteField.locator('[data-lx-field-feedback]').isVisible().catch(() => false),
      options: await desktop.getByRole('option').allTextContents(),
      selectedValueText: await remoteField.innerText(),
    }
    const remoteRecovery = await capturePage(desktop, 'desktop-remote-preview-recovered')
    evidence.screenshots.push({ name: 'desktop-remote-preview-recovered', ...remoteRecovery })

    await desktop.getByRole('button', { name: '空结果', exact: true }).click()
    await remoteSearch.fill('不存在')
    await remoteField.getByText('暂无候选人员', { exact: true }).waitFor()
    evidence.observations.remotePreviewEmpty = await fieldSnapshot(remoteField)
    const remoteEmpty = await capturePage(desktop, 'desktop-remote-preview-empty')
    evidence.screenshots.push({ name: 'desktop-remote-preview-empty', ...remoteEmpty })

    await desktopContext.close()

    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    })
    const mobile = await mobileContext.newPage()
    mobile.setDefaultTimeout(8000)
    const mobileErrors = []
    mobile.on('pageerror', (error) => mobileErrors.push(error.message))
    mobile.on('console', (message) => {
      if (message.type() === 'error') mobileErrors.push(message.text())
    })
    await mobile.goto(targetUrl, { waitUntil: 'domcontentloaded' })
    await mobile.getByRole('heading', { name: 'LxDynamicForm 动态表单' }).waitFor()
    await mobile.waitForTimeout(300)
    evidence.capture.contexts.push({ name: 'mobile-375', viewport: { width: 375, height: 812 } })
    evidence.observations.mobile = { pageErrors: mobileErrors }
    const mobileDefault = await capturePage(mobile, 'mobile-375-default-collapsed')
    evidence.screenshots.push({ name: 'mobile-375-default-collapsed', ...mobileDefault })

    const mobilePreview = mobile.locator('.dynamic-form-demo__schema-preview')
    await mobilePreview.getByText('字段类型预览', { exact: true }).click()
    const mobileNumber = await capturePage(mobile, 'mobile-375-preview-number')
    evidence.screenshots.push({ name: 'mobile-375-preview-number', ...mobileNumber })
    await selectSchemaType(mobile, '日期范围')
    const mobileDateRange = await capturePage(mobile, 'mobile-375-schema-daterange')
    evidence.screenshots.push({ name: 'mobile-375-schema-daterange', ...mobileDateRange })

    await selectSchemaType(mobile, '远程选择')
    const mobileRemoteField = mobilePreview.locator('.lx-dynamic-form__item')
    const mobileRemoteSearch = mobileRemoteField.getByRole('combobox')
    await mobile.getByText('演示设置', { exact: true }).click()
    await mobile.getByRole('button', { name: '失败', exact: true }).click()
    await mobileRemoteSearch.fill('警官')
    await mobileRemoteField.getByText('候选人员读取失败', { exact: true }).waitFor()
    const mobileRemoteError = await capturePage(mobile, 'mobile-375-remote-preview-error')
    evidence.screenshots.push({ name: 'mobile-375-remote-preview-error', ...mobileRemoteError })

    await mobileRemoteField.getByRole('button', { name: '重试' }).click()
    await mobile.waitForTimeout(400)
    evidence.observations.mobile.remotePreviewRetry = {
      field: await fieldSnapshot(mobileRemoteField),
      successModePressed: await mobile
        .getByRole('button', { name: '成功', exact: true })
        .getAttribute('aria-pressed'),
    }
    evidence.observations.mobile.remotePreviewRetryRecovered = !(
      evidence.observations.mobile.remotePreviewRetry.field.feedback?.text?.includes('读取失败')
    )
    if (!evidence.observations.mobile.remotePreviewRetryRecovered) {
      const mobileRetryNoOp = await capturePage(mobile, 'mobile-375-remote-preview-retry-noop')
      evidence.screenshots.push({ name: 'mobile-375-remote-preview-retry-noop', ...mobileRetryNoOp })
      await mobile.getByRole('button', { name: '成功', exact: true }).click()
      await mobileRemoteSearch.fill('')
      await mobileRemoteSearch.fill('警官')
      await mobile.waitForTimeout(400)
    }
    await mobileRemoteSearch.click()
    await mobile.getByRole('option', { name: '李警官 · 指挥中心', exact: true }).waitFor()
    const mobileRemoteRecovery = await capturePage(mobile, 'mobile-375-remote-preview-recovered')
    evidence.screenshots.push({ name: 'mobile-375-remote-preview-recovered', ...mobileRemoteRecovery })

    evidence.observations.mobile.remoteFeedback = await fieldSnapshot(mobileRemoteField)
    await mobileContext.close()
  } finally {
    await browser.close()
  }

  evidence.capture.sourceSha256After = Object.fromEntries(
    await Promise.all(sourcePaths.map(async (path) => [path, await sha256(path)])),
  )
  evidence.capture.completedAt = new Date().toISOString()
  evidence.capture.sourceHashesStable = JSON.stringify(sourceSha256Before) === JSON.stringify(evidence.capture.sourceSha256After)
  await writeFile(join(outputDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  process.stdout.write(`${JSON.stringify({ screenshots: evidence.screenshots.length, evidencePath: join(outputDir, 'browser-evidence.json'), sourceHashesStable: evidence.capture.sourceHashesStable }, null, 2)}\n`)
}

run().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`)
  process.exitCode = 1
})
