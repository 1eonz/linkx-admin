const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')

const outputDir = __dirname
const baseURL = 'http://127.0.0.1:4176'
const results = []

async function captureDialog(page) {
  await page.goto(baseURL + '/components/lxdialog', { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'LxDialog 表单弹窗' }).waitFor()
  await page.screenshot({ path: path.join(outputDir, 'dialog-light-desktop.png'), fullPage: true })
  await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
  await page.screenshot({ path: path.join(outputDir, 'dialog-hud-desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 375, height: 812 })
  await page.getByRole('button', { name: '新建涉警联动工单' }).click()
  const dialog = page.getByRole('dialog')
  const panelBox = await page.locator('.el-dialog').boundingBox()
  const closeBox = await dialog.locator('.lx-dialog__close').boundingBox()
  const columns = await page.locator('.lx-dialog-form-grid').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(/\s+/).filter(Boolean).length)
  await page.screenshot({ path: path.join(outputDir, 'dialog-hud-mobile.png'), fullPage: true })
  results.push({ component: 'LxDialog', panelBox, closeBox, columns })
}

async function captureDrawer(page) {
  await page.goto(baseURL + '/components/lxdrawer', { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'LxDrawer 详情抽屉' }).waitFor()
  await page.screenshot({ path: path.join(outputDir, 'drawer-light-desktop.png'), fullPage: true })
  await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
  await page.getByRole('button', { name: '打开审计抽屉' }).click()
  const drawer = page.getByRole('dialog', { name: '出警抽检审计抽屉' })
  await drawer.waitFor()
  await page.locator('.el-drawer').evaluate((element) => {
    return Promise.all(
      element.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
    )
  })
  await page.screenshot({ path: path.join(outputDir, 'drawer-hud-desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 375, height: 812 })
  await page.waitForTimeout(600)
  await page.locator('.el-drawer').evaluate((element) => {
    return Promise.all(
      element.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
    )
  })
  const box = await page.locator('.el-drawer').boundingBox()
  await page.screenshot({ path: path.join(outputDir, 'drawer-hud-mobile.png'), fullPage: true })
  results.push({ component: 'LxDrawer', drawerBox: box, scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth) })
}

async function captureEmpty(page) {
  await page.goto(baseURL + '/components/lxempty', { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'LxEmpty 空态' }).waitFor()
  await page.screenshot({ path: path.join(outputDir, 'empty-light-desktop.png'), fullPage: true })
  await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
  await page.setViewportSize({ width: 375, height: 812 })
  await page.screenshot({ path: path.join(outputDir, 'empty-hud-mobile.png'), fullPage: true })
  results.push({ component: 'LxEmpty', scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth) })
}

async function capturePageCard(page) {
  await page.goto(baseURL + '/components/lxpagecard', { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'LxPageCard 页面容器' }).waitFor()
  await page.screenshot({ path: path.join(outputDir, 'page-card-light-desktop.png'), fullPage: true })
  await page.getByRole('checkbox', { name: '展示错误态' }).check()
  await page.getByRole('checkbox', { name: '加载遮罩' }).check()
  await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
  await page.setViewportSize({ width: 375, height: 812 })
  await page.screenshot({ path: path.join(outputDir, 'page-card-hud-mobile.png'), fullPage: true })
  const region = page.getByRole('region', { name: '接口运行概况' })
  results.push({ component: 'LxPageCard', busy: await region.getAttribute('aria-busy'), scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth) })
}

async function captureBanner(page) {
  await page.goto(baseURL + '/components/lxformerrorbanner', { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'LxFormErrorBanner 校验横幅' }).waitFor()
  await page.screenshot({ path: path.join(outputDir, 'form-error-light-desktop.png'), fullPage: true })
  await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
  await page.getByRole('button', { name: '查看受影响字段' }).click()
  await page.setViewportSize({ width: 375, height: 812 })
  await page.screenshot({ path: path.join(outputDir, 'form-error-hud-mobile.png'), fullPage: true })
  const alert = page.getByRole('alert')
  results.push({ component: 'LxFormErrorBanner', ariaLive: await alert.getAttribute('aria-live'), ariaAtomic: await alert.getAttribute('aria-atomic'), scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth) })
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const requests = []
  page.on('request', (request) => requests.push(request.url()))
  try {
    await captureDialog(page)
    await captureDrawer(page)
    await captureEmpty(page)
    await capturePageCard(page)
    await captureBanner(page)
    const externalRequests = requests.filter((url) => new URL(url).origin !== baseURL)
    await fs.writeFile(path.join(outputDir, 'browser-result.json'), JSON.stringify({ status: 'passed', results, externalRequests }, null, 2))
    process.stdout.write('Wave 5 browser verification passed\n')
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  process.stderr.write((error.stack || error) + '\n')
  process.exitCode = 1
})
