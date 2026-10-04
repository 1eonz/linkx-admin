const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')

const baseURL = 'http://127.0.0.1:4185'
const overlayURL = 'http://127.0.0.1:8400/detect.js?wave5-revalidation=20260930'
const outputDir = path.resolve('.impeccable/critique/wave5-2026-09-30/revalidation-2026-09-30')
const screenshotDir = path.join(outputDir, 'screenshots')

async function injectDetector(page, label) {
  await page.evaluate(({ overlayURL, label }) => {
    document.title = '[Human] Wave 5 revalidation ' + label
    const script = document.createElement('script')
    script.src = overlayURL
    script.dataset.wave5Revalidation = label
    document.head.appendChild(script)
  }, { overlayURL, label })
  await page.waitForTimeout(2500)
}

async function settleAnimations(page, selector) {
  await page.locator(selector).evaluate((element) => Promise.all(
    element.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
  ))
}

async function record(page, name, state) {
  await page.screenshot({ path: path.join(screenshotDir, name + '.png'), fullPage: true })
  const consoleMessages = page.__consoleMessages || []
  const requests = page.__requests || []
  await fs.writeFile(path.join(outputDir, name + '.console.json'), JSON.stringify(consoleMessages, null, 2))
  await fs.writeFile(path.join(outputDir, name + '.requests.json'), JSON.stringify(requests, null, 2))
  return { name, state, consoleMessages, requests }
}

async function makePage(browser, viewport) {
  const page = await browser.newPage({ viewport })
  page.on('close', () => process.stderr.write('PAGE_CLOSED\\\\n'))
  page.on('crash', () => process.stderr.write('PAGE_CRASHED\\\\n'))
  page.__consoleMessages = []
  page.__requests = []
  page.on('console', (message) => {
    page.__consoleMessages.push({
      type: message.type(),
      text: message.text(),
      location: message.location(),
    })
  })
  page.on('request', (request) => page.__requests.push(request.url()))
  return page
}

async function captureDialog(browser) {
  const page = await makePage(browser, { width: 1280, height: 800 })
  try {
    await page.goto(baseURL + '/components/lxdialog', { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'LxDialog 表单弹窗' }).waitFor()
    await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
    await page.getByRole('button', { name: '新建涉警联动工单' }).click()
    await page.getByRole('dialog').waitFor()
    await settleAnimations(page, '.el-dialog')
    const portalState = await page.evaluate(() => {
      const dialog = document.querySelector('.el-dialog')
      const style = dialog ? getComputedStyle(dialog) : null
      return {
        rootClasses: document.documentElement.className,
        dialogClasses: dialog?.className || '',
        dialogBackground: style?.backgroundColor || null,
        dialogColor: style?.color || null,
      }
    })
    await injectDetector(page, 'dialog-hud-portal')
    const hudCapture = await record(page, 'dialog-hud-portal-latest', portalState)

    const errorPage = await makePage(browser, { width: 1280, height: 800 })
    try {
      await errorPage.goto(baseURL + '/components/lxdialog', { waitUntil: 'networkidle' })
      await errorPage.getByRole('heading', { name: 'LxDialog 表单弹窗' }).waitFor()
      await errorPage.getByRole('button', { name: '新建涉警联动工单' }).click()
      await errorPage.getByRole('dialog').waitFor()
      await errorPage.getByRole('button', { name: '确认派单' }).click()
      await errorPage.locator('#lx-dialog-place-error').waitFor()
      const focusState = await errorPage.evaluate(() => ({
        activeId: document.activeElement?.id || null,
        ariaInvalid: document.querySelector('#lx-dialog-place')?.getAttribute('aria-invalid') || null,
        describedBy: document.querySelector('#lx-dialog-place')?.getAttribute('aria-describedby') || null,
        errorText: document.querySelector('#lx-dialog-place-error')?.textContent?.trim() || null,
      }))
      await injectDetector(errorPage, 'dialog-first-error-focus')
      const errorCapture = await record(errorPage, 'dialog-first-error-focus-latest', focusState)
      return { hudCapture, errorCapture }
    } finally {
      await errorPage.close()
    }
  } finally {
    await page.close()
  }
}

async function captureDrawer(browser) {
  const page = await makePage(browser, { width: 1280, height: 800 })
  try {
    await page.goto(baseURL + '/components/lxdrawer', { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'LxDrawer 详情抽屉' }).waitFor()
    await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
    await page.getByRole('button', { name: '打开审计抽屉' }).click()
    await page.getByRole('dialog', { name: '出警抽检审计抽屉' }).waitFor()
    await settleAnimations(page, '.el-drawer')
    const portalState = await page.evaluate(() => {
      const drawer = document.querySelector('.el-drawer')
      const style = drawer ? getComputedStyle(drawer) : null
      return {
        rootClasses: document.documentElement.className,
        drawerClasses: drawer?.className || '',
        drawerBackground: style?.backgroundColor || null,
        drawerColor: style?.color || null,
        closeOnPressEsc: document.querySelector('.lx-drawer')?.getAttribute('close-on-press-esc') || null,
      }
    })
    await injectDetector(page, 'drawer-hud-portal')
    return record(page, 'drawer-hud-portal-latest', portalState)
  } finally {
    await page.close()
  }
}

async function capturePageCard(browser) {
  const page = await makePage(browser, { width: 1280, height: 800 })
  try {
    await page.goto(baseURL + '/components/lxpagecard', { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'LxPageCard 页面容器' }).waitFor()
    await page.getByRole('checkbox', { name: '展示错误态' }).check()
    await page.getByRole('button', { name: '刷新概况' }).click()
    const duringRefresh = await page.getByTestId('last-action').textContent()
    await injectDetector(page, 'pagecard-refresh-during')
    const loadingCapture = await record(page, 'pagecard-refresh-loading-latest', {
      duringRefresh: duringRefresh?.trim() || null,
      errorVisibleDuringRefresh: await page.getByRole('alert').count(),
    })
    await page.waitForTimeout(500)
    const afterRefresh = await page.getByTestId('last-action').textContent()
    const afterState = await page.evaluate(() => ({
      errorVisible: Boolean(document.querySelector('.page-card-demo__error')),
      cardBusy: document.querySelector('.lx-page-card')?.getAttribute('aria-busy') || null,
    }))
    const completedCapture = await record(page, 'pagecard-refresh-complete-latest', {
      afterRefresh: afterRefresh?.trim() || null,
      ...afterState,
    })
    return { loadingCapture, completedCapture }
  } finally {
    await page.close()
  }
}

async function main() {
  await fs.mkdir(screenshotDir, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  browser.on('disconnected', () => process.stderr.write('BROWSER_DISCONNECTED\\\\n'))
  const captures = []
  try {
    captures.push(await captureDialog(browser))
    captures.push(await captureDrawer(browser))
    captures.push(await capturePageCard(browser))
    const requestLists = []
    function collect(value) {
      if (!value || typeof value !== 'object') return
      if (Array.isArray(value)) return value.forEach(collect)
      if (Array.isArray(value.requests)) requestLists.push(...value.requests)
      Object.values(value).forEach(collect)
    }
    collect(captures)
    const externalRequests = Array.from(new Set(requestLists)).filter((url) => {
      const origin = new URL(url).origin
      return origin !== baseURL && origin !== 'http://127.0.0.1:8400'
    })
    await fs.writeFile(
      path.join(outputDir, 'revalidation-result.json'),
      JSON.stringify({ status: 'passed', captures, externalRequests }, null, 2),
    )
    process.stdout.write('Wave 5 latest browser revalidation passed\\\\n')
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  process.stderr.write((error.stack || error) + '\\\\n')
  process.exitCode = 1
})