import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const playwrightPath = path.join(
  process.env.TEMP,
  'linkx-wave4-assessment-a-tools',
  'node_modules',
  'playwright-core',
  'index.mjs',
)
const { chromium } = await import(pathToFileURL(playwrightPath).href)

const root = path.resolve(
  '.impeccable/critique/wave4-dynamicform-2026-10-07/final-assessment-a',
)
const browserPath =
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const baseUrl = 'http://127.0.0.1:4174/components/'
const views = [
  { name: 'desktop', viewport: { width: 1365, height: 900 }, mobile: false },
  { name: 'touch', viewport: { width: 375, height: 812 }, mobile: true },
]
const pages = [
  {
    name: 'lxdynamicform',
    url: `${baseUrl}lxdynamicform.html`,
    selector: '.dynamic-form-demo',
  },
  {
    name: 'lxupload',
    url: `${baseUrl}lxupload.html`,
    selector: '.lx-upload-demo',
  },
  {
    name: 'lxdatepicker',
    url: `${baseUrl}lxdatepicker.html`,
    selector: '.lx-date-picker-demo',
  },
]
const evidence = {
  method: 'isolated Assessment A',
  browser: 'Playwright-core + Microsoft Edge (Chromium-based), headless, fresh context per page and viewport',
  server: baseUrl,
  viewports: views.map((view) => view.viewport),
  reducedMotion: 'reduce',
  pages: [],
  runtimeErrors: [],
}

await fs.mkdir(root, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: browserPath,
  args: ['--disable-background-networking', '--disable-features=Translate'],
})
evidence.browserVersion = await browser.version()

async function capture(page, id, fullPage = false) {
  const file = `${id}.png`
  await page.screenshot({ path: path.join(root, file), fullPage })
  return file
}

async function atDemo(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded()
  await page.waitForTimeout(100)
}

async function inspectPage(page, selector) {
  return page.evaluate((targetSelector) => {
    const visible = (element) => element.getClientRects().length > 0
    const demo = document.querySelector(targetSelector)
    const motionTargets = [
      ...document.querySelectorAll(
        '.lx-upload-demo *, .lx-date-picker-demo *, .dynamic-form-demo *',
      ),
    ].filter(visible)
    return {
      title: document.title,
      h1: document.querySelector('h1')?.textContent?.trim() ?? '',
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      hasHorizontalOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth,
      demo: demo
        ? {
            className: demo.className,
            width: Math.round(demo.getBoundingClientRect().width),
            height: Math.round(demo.getBoundingClientRect().height),
            text: demo.innerText.slice(0, 1800),
          }
        : null,
      visibleButtons: [...document.querySelectorAll('button')]
        .filter(visible)
        .map((button) =>
          (button.getAttribute('aria-label') || button.innerText || '').trim(),
        )
        .filter(Boolean)
        .slice(0, 45),
      visibleInputs: [...document.querySelectorAll('input, textarea')]
        .filter(visible)
        .map((input) => ({
          type: input.type || input.tagName.toLowerCase(),
          label:
            input.labels?.[0]?.innerText?.trim() ||
            input.getAttribute('aria-label') ||
            input.placeholder ||
            '',
          value: input.value,
          disabled: input.disabled,
        }))
        .slice(0, 35),
      reducedMotionMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      animatedTargets: motionTargets
        .map((element) => {
          const style = getComputedStyle(element)
          return {
            selector: element.tagName.toLowerCase() +
              (element.className && typeof element.className === 'string'
                ? `.${element.className.trim().split(/\s+/).slice(0, 2).join('.')}`
                : ''),
            transitionDuration: style.transitionDuration,
            animationName: style.animationName,
            animationDuration: style.animationDuration,
          }
        })
        .filter(
          (item) =>
            (item.animationName !== 'none' && item.animationDuration !== '0s') ||
            item.transitionDuration !== '0s',
        )
        .slice(0, 20),
    }
  }, selector)
}

async function runStep(record, name, action) {
  try {
    const details = await action()
    record.interactions.push({ name, result: 'completed', ...(details ?? {}) })
  } catch (error) {
    record.interactions.push({
      name,
      result: 'failed',
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

for (const target of pages) {
  for (const view of views) {
    const context = await browser.newContext({
      viewport: view.viewport,
      deviceScaleFactor: 1,
      isMobile: view.mobile,
      hasTouch: view.mobile,
      reducedMotion: 'reduce',
      colorScheme: 'light',
      locale: 'zh-CN',
    })
    const page = await context.newPage()
    const record = {
      name: target.name,
      view: view.name,
      url: target.url,
      contextIsolated: true,
      viewport: view.viewport,
      interactions: [],
      screenshots: [],
      consoleErrors: [],
      pageErrors: [],
      failedRequests: [],
      httpFailures: [],
    }
    const fileKey = `${target.name}-${view.name}`

    page.on('console', (message) => {
      if (message.type() === 'error') {
        record.consoleErrors.push(message.text().slice(0, 400))
      }
    })
    page.on('pageerror', (error) => record.pageErrors.push(error.message.slice(0, 400)))
    page.on('requestfailed', (request) => {
      record.failedRequests.push({
        url: request.url(),
        error: request.failure()?.errorText ?? '',
      })
    })
    page.on('response', (response) => {
      if (response.status() >= 400) {
        record.httpFailures.push({ status: response.status(), url: response.url() })
      }
    })

    try {
      const response = await page.goto(target.url, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      })
      record.httpStatus = response?.status() ?? null
      await page.locator(target.selector).waitFor({ state: 'visible', timeout: 15000 })
      await page.waitForTimeout(700)
      record.initial = await inspectPage(page, target.selector)
      record.screenshots.push(await capture(page, `${fileKey}-00-top`))
      await atDemo(page, target.selector)
      record.screenshots.push(await capture(page, `${fileKey}-01-light`))

      if (target.name === 'lxdynamicform') {
        await runStep(record, '展开演示设置并切换文档 HUD', async () => {
          await page.locator('.dynamic-form-demo__settings > summary').click()
          await page.getByText('文档站整体深色（HUD）', { exact: true }).click()
          await atDemo(page, target.selector)
          record.screenshots.push(await capture(page, `${fileKey}-02-hud`))
          return {
            hudClass: await page.locator('.dynamic-form-demo').evaluate((node) =>
              node.classList.contains('lx-theme-hud'),
            ),
          }
        })
        await runStep(record, '提交空表单检查必填错误与焦点恢复', async () => {
      await page.getByRole('button', { name: '提交校验' }).click()
          await page.waitForTimeout(150)
          await atDemo(page, target.selector)
          record.screenshots.push(await capture(page, `${fileKey}-03-validation`))
          return {
            errorText: await page.locator('.dynamic-form-demo').innerText(),
            alerts: await page.locator('.dynamic-form-demo [role="alert"]').count(),
            activeElement: await page.evaluate(() => {
              const active = document.activeElement
              return {
                tag: active?.tagName,
                label:
                  active?.getAttribute('aria-label') ??
                  (active instanceof HTMLInputElement ? active.placeholder : ''),
                describedBy: active?.getAttribute('aria-describedby') ?? '',
              }
            }),
          }
        })
        await runStep(record, '填写必填项并成功提交', async () => {
          await page.locator('.dynamic-form-demo input[placeholder="输入任务名称"]').fill('夜间巡防任务')
          await page.locator('.dynamic-form-demo input[placeholder="输入访问密码"]').fill('SaferPass42')
          await page.locator('.dynamic-form-demo .el-select').first().click()
          await page.locator('.el-select-dropdown__item').filter({ hasText: '日常巡防' }).last().click()
          await page.getByRole('button', { name: '提交校验' }).click()
          await page.waitForTimeout(180)
          await atDemo(page, target.selector)
          record.screenshots.push(await capture(page, `${fileKey}-04-success`))
          return {
            statusText: await page.locator('.dynamic-form-demo [role="status"]').last().innerText(),
          }
        })
        await runStep(record, '打开字段类型预览', async () => {
          await page.getByRole('link', { name: '浏览全部字段类型' }).click()
          await page.waitForTimeout(150)
          record.screenshots.push(await capture(page, `${fileKey}-05-field-preview`))
          return {
            previewOpen: await page.locator('#dynamic-form-schema-preview').evaluate((node) =>
              node instanceof HTMLDetailsElement ? node.open : false,
            ),
            previewText: await page.locator('#dynamic-form-schema-preview').innerText(),
          }
        })
      }

      if (target.name === 'lxupload') {
        await runStep(record, '切换 HUD 主题', async () => {
          await page.getByLabel('HUD 深色主题').check()
          await page.waitForTimeout(120)
          await atDemo(page, target.selector)
          record.screenshots.push(await capture(page, `${fileKey}-02-hud`))
          return {
            htmlClasses: await page.locator('html').getAttribute('class'),
            demoClasses: await page.locator(target.selector).getAttribute('class'),
          }
        })
        await runStep(record, '用键盘 Enter 启动文件选择', async () => {
          const trigger = page.locator('.lx-upload-demo .el-upload[role="button"]').first()
          const filePayload = {
            name: '周一排班.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from('日期,班次\n2026-10-07,夜班\n'),
          }
          const chooserPromise = page.waitForEvent('filechooser', { timeout: 2500 }).catch(() => null)
          await trigger.focus()
          await page.keyboard.press('Enter')
          const chooser = await chooserPromise
          if (chooser) {
            await chooser.setFiles(filePayload)
            return { fileChooserOpened: true, triggerRole: await trigger.getAttribute('role') }
          }
          await page.locator('.lx-upload-demo input[type="file"]').first().setInputFiles(filePayload)
          return { fileChooserOpened: false, fallback: 'input[type=file].setInputFiles', triggerRole: await trigger.getAttribute('role') }
        })
        await runStep(record, '失败后按建议重试并观察成功状态', async () => {
          await page.getByRole('button', { name: '下一次上传失败' }).click()
          await page.getByRole('button', { name: '开始上传' }).click()
          await page.waitForTimeout(400)
          await atDemo(page, target.selector)
          record.screenshots.push(await capture(page, `${fileKey}-03-progress`))
          await page.locator('.lx-upload-demo .lx-upload__file.is-fail').waitFor({
            state: 'visible',
            timeout: 6000,
          })
          await page.waitForTimeout(100)
          record.screenshots.push(await capture(page, `${fileKey}-04-failure`))
          const failureText = await page.locator('.lx-upload-demo .lx-upload__file.is-fail').innerText()
          const retry = page.locator('.lx-upload-demo .lx-upload__file.is-fail .lx-upload__retry').first()
          await retry.click()
          await page.locator('.lx-upload-demo .lx-upload__file.is-success').waitFor({
            state: 'visible',
            timeout: 6000,
          })
          await page.waitForTimeout(100)
          record.screenshots.push(await capture(page, `${fileKey}-05-success`))
          return {
            failureText,
            successText: await page.locator('.lx-upload-demo').innerText(),
            requestCount: await page.locator('[data-testid="upload-request-count"]').innerText(),
          }
        })
      }

      if (target.name === 'lxdatepicker') {
        await runStep(record, '切换 HUD 并通过 ArrowDown 打开区间日历', async () => {
          await page.getByLabel('HUD 深色主题').check()
          const input = page.locator('[data-testid="range"] input.el-range-input').first()
          await input.focus()
          await page.keyboard.press('ArrowDown')
          await page.waitForTimeout(350)
          const panel = page.locator('.el-picker-panel:visible').last()
          const panelVisible = await panel.count()
          const popper = page.locator('.el-popper:visible').filter({ has: panel }).last()
          const popperClasses = panelVisible
            ? await popper.getAttribute('class')
            : ''
          record.screenshots.push(await capture(page, `${fileKey}-02-hud-calendar-keyboard`))
          return {
            popupCount: panelVisible,
            popperClasses,
            popperHasHudClass: popperClasses?.split(/\s+/).includes('lx-theme-hud') ?? false,
            activeElement: await page.evaluate(() => ({
              tag: document.activeElement?.tagName,
              className:
                typeof document.activeElement?.className === 'string'
                  ? document.activeElement.className
                  : '',
              ariaLabel: document.activeElement?.getAttribute('aria-label') ?? '',
            })),
          }
        })
        await runStep(record, '方向键移动、Enter 选择并 Escape 关闭', async () => {
          const panel = page.locator('.el-picker-panel:visible').last()
          if (await panel.count()) {
            await page.keyboard.press('ArrowRight')
            await page.keyboard.press('Enter')
            await page.waitForTimeout(180)
          }
          const selected = await page.locator('[data-testid="range"] input.el-range-input').evaluateAll((inputs) =>
            inputs.map((input) => input.value),
          )
          const openBeforeEscape = await page.locator('.el-picker-panel:visible').count()
          await page.keyboard.press('Escape')
          await page.waitForTimeout(120)
          record.screenshots.push(await capture(page, `${fileKey}-03-keyboard-selected`))
          return {
            selected,
            openBeforeEscape,
            openAfterEscape: await page.locator('.el-picker-panel:visible').count(),
            liveStatus: await page.locator('.lx-date-picker-demo__status').innerText(),
          }
        })
        await runStep(record, '选择本周快捷范围并检查失败态文案', async () => {
          const input = page.locator('[data-testid="shortcuts"] input.el-range-input').first()
          await input.click()
          await page.waitForTimeout(300)
          const shortcut = page.getByRole('button', { name: '本周', exact: true })
          const shortcutCount = await shortcut.count()
          if (shortcutCount) await shortcut.first().click()
          await page.waitForTimeout(180)
          await atDemo(page, target.selector)
          record.screenshots.push(await capture(page, `${fileKey}-04-shortcut-success`))
          const errorSection = page.locator('[data-testid="error"]')
          const singleInput = page.locator('[data-testid="single"] input').first()
          await singleInput.focus()
          await page.keyboard.press('ArrowDown')
          await page.waitForTimeout(300)
          const singlePanel = page.locator('.el-picker-panel:visible').last()
          const singlePopupCount = await singlePanel.count()
          record.screenshots.push(await capture(page, `${fileKey}-05-single-keyboard-open`))
          await page.keyboard.press('ArrowRight')
          await page.keyboard.press('Enter')
          await page.waitForTimeout(180)
          const keyboardValue = await singleInput.inputValue()
          const popupAfterEnter = await page.locator('.el-picker-panel:visible').count()
          await page.keyboard.press('Escape')
          await page.waitForTimeout(100)
          record.screenshots.push(await capture(page, `${fileKey}-06-single-keyboard-selected`))
          await errorSection.scrollIntoViewIfNeeded()
          await page.waitForTimeout(100)
          record.screenshots.push(await capture(page, `${fileKey}-07-error-state`))
          return {
            shortcutCount,
            shortcutInputs: await page.locator('[data-testid="shortcuts"] input.el-range-input').evaluateAll((inputs) =>
              inputs.map((node) => node.value),
            ),
            errorText: await errorSection.innerText(),
            singleKeyboard: {
              popupCount: singlePopupCount,
              valueAfterArrowRightEnter: keyboardValue,
              valueChanged: keyboardValue !== '2026-09-15',
              popupAfterEnter,
            },
          }
        })
      }

      record.afterInteractions = await inspectPage(page, target.selector)
    } catch (error) {
      record.navigationError = error instanceof Error ? error.message : String(error)
      evidence.runtimeErrors.push({ page: target.name, view: view.name, error: record.navigationError })
    } finally {
      evidence.pages.push(record)
      await context.close()
    }
  }
}

await browser.close()
await fs.writeFile(
  path.join(root, 'browser-evidence.json'),
  `${JSON.stringify(evidence, null, 2)}\n`,
  'utf8',
)
console.log(JSON.stringify({
  captures: evidence.pages.length,
  runtimeErrors: evidence.runtimeErrors,
  screenshots: evidence.pages.reduce((count, page) => count + page.screenshots.length, 0),
  output: root,
}, null, 2))
