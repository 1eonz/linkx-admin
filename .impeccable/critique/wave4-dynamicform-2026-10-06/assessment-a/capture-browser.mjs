import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(
  new URL('../../../../other-admin/admin-vue3/package.json', import.meta.url),
)
const { chromium } = require('@playwright/test')
const target = 'http://127.0.0.1:4174/components/lxdynamicform.html'
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
})
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  colorScheme: 'light',
  reducedMotion: 'reduce',
})
const evidence = {
  target,
  captureStartedAt: new Date().toISOString(),
  context: '新建 Chromium context；每个视图使用新 page/tab；viewport 为 1440x1000、375x812；reducedMotion=reduce',
  captures: [],
  consoleErrors: [],
  failedRequests: [],
}

await mkdir(here, { recursive: true })

async function openPage(name, viewport) {
  const page = await context.newPage()
  page.setDefaultTimeout(8000)
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('requestfailed', (request) => {
    evidence.failedRequests.push({ view: name, url: request.url(), failure: request.failure()?.errorText })
  })
  if (viewport) await page.setViewportSize(viewport)
  await page.goto(target, { waitUntil: 'domcontentloaded' })
  await page.locator('.dynamic-form-demo').waitFor({ state: 'visible' })
  await page.waitForTimeout(1000)
  evidence.consoleErrors.push({ view: name, errors })
  return page
}

async function measure(page, name) {
  return page.evaluate((view) => {
    const viewport = { width: window.innerWidth, height: window.innerHeight }
    const demo = document.querySelector('.dynamic-form-demo')
    const form = document.querySelector('.lx-dynamic-form')
    const demoRect = demo?.getBoundingClientRect()
    const formRect = form?.getBoundingClientRect()
    const fields = Array.from(document.querySelectorAll('.lx-dynamic-form__item')).map((element) => {
      const rect = element.getBoundingClientRect()
      const input = element.querySelector('input, textarea, [role="combobox"], button')
      const inputRect = input?.getBoundingClientRect()
      return {
        label: element.querySelector('.el-form-item__label')?.textContent?.trim() ?? '',
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        error: element.classList.contains('is-error'),
        inputWidth: inputRect ? Math.round(inputRect.width) : null,
      }
    })
    return {
      view,
      url: location.href,
      title: document.title,
      viewport,
      documentWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > viewport.width,
      demo: demoRect ? { x: Math.round(demoRect.x), y: Math.round(demoRect.y), width: Math.round(demoRect.width), height: Math.round(demoRect.height) } : null,
      form: formRect ? { x: Math.round(formRect.x), y: Math.round(formRect.y), width: Math.round(formRect.width), height: Math.round(formRect.height), columns: getComputedStyle(form).gridTemplateColumns } : null,
      fields,
      errors: Array.from(document.querySelectorAll('.lx-dynamic-form__item.is-error .el-form-item__error')).map((node) => node.textContent?.trim()),
      activeElement: document.activeElement ? {
        tag: document.activeElement.tagName,
        role: document.activeElement.getAttribute('role'),
        label: document.activeElement.closest('.el-form-item')?.querySelector('.el-form-item__label')?.textContent?.trim() ?? '',
        ariaLabel: document.activeElement.getAttribute('aria-label'),
      } : null,
      touchTargets: Array.from(document.querySelectorAll('.dynamic-form-demo button, .dynamic-form-demo summary, .dynamic-form-demo input, .dynamic-form-demo [role="checkbox"]')).map((element) => {
        const rect = element.getBoundingClientRect()
        return {
          label: element.getAttribute('aria-label') ?? element.textContent?.trim() ?? element.getAttribute('placeholder') ?? '',
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        }
      }),
      themeClasses: ['dark', 'lx-theme-hud'].filter((name) => document.documentElement.classList.contains(name)),
      background: demo ? getComputedStyle(demo).backgroundColor : null,
      bodyText: demo?.innerText?.slice(0, 500) ?? '',
    }
  }, name)
}

async function capture(page, name, selector = '.dynamic-form-demo') {
  const path = join(here, `${name}.png`)
  const targetLocator = page.locator(selector)
  await targetLocator.scrollIntoViewIfNeeded()
  await page.waitForTimeout(150)
  await targetLocator.screenshot({ path })
  evidence.captures.push({ name, path, capturedAt: new Date().toISOString() })
}

try {
  const desktop = await openPage('desktop-light', { width: 1440, height: 1000 })
  await capture(desktop, '01-desktop-light')
  evidence.measurements = [await measure(desktop, 'desktop-light')]

  await desktop.locator('.dynamic-form-demo__settings summary').click()
  await desktop.locator('.dynamic-form-demo__settings').waitFor({ state: 'visible' })
  await capture(desktop, '02-desktop-settings-open')
  evidence.measurements.push(await measure(desktop, 'desktop-settings-open'))

  await desktop.locator('.dynamic-form-demo__toolbar').getByText('HUD 深色主题', { exact: true }).click()
  await desktop.waitForTimeout(250)
  await capture(desktop, '03-desktop-hud-dark')
  evidence.measurements.push(await measure(desktop, 'desktop-hud-dark'))

  await desktop.getByRole('button', { name: '提交校验' }).click()
  await desktop.locator('.dynamic-form-demo .el-form-item.is-error').first().waitFor({ state: 'visible' })
  await desktop.waitForTimeout(150)
  await capture(desktop, '04-desktop-hud-field-errors')
  evidence.measurements.push(await measure(desktop, 'desktop-hud-field-errors'))

  const narrow = await openPage('narrow-light', { width: 375, height: 812 })
  await capture(narrow, '05-narrow-375-light')
  const narrowViewportPath = join(here, '07-narrow-375-viewport.png')
  await narrow.screenshot({ path: narrowViewportPath })
  evidence.captures.push({ name: '07-narrow-375-viewport', path: narrowViewportPath, capturedAt: new Date().toISOString() })
  evidence.measurements.push(await measure(narrow, 'narrow-375-light'))
  await narrow.locator('.dynamic-form-demo__settings summary').click()
  await narrow.getByRole('button', { name: '提交校验' }).click()
  await narrow.locator('.dynamic-form-demo .el-form-item.is-error').first().waitFor({ state: 'visible' })
  await capture(narrow, '06-narrow-375-field-errors')
  const narrowErrorsViewportPath = join(here, '08-narrow-375-viewport-errors.png')
  await narrow.screenshot({ path: narrowErrorsViewportPath })
  evidence.captures.push({ name: '08-narrow-375-viewport-errors', path: narrowErrorsViewportPath, capturedAt: new Date().toISOString() })
  evidence.measurements.push(await measure(narrow, 'narrow-375-field-errors'))

  evidence.captureFinishedAt = new Date().toISOString()
  await writeFile(join(here, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
} finally {
  await context.close()
  await browser.close()
}
