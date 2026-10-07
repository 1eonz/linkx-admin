import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(
  pathToFileURL(
    'F:/work/linkx-admin/other-admin/admin-vue3/node_modules/@playwright/test/index.mjs',
  ).href,
)

const outDir = path.resolve(
  'F:/work/linkx-admin/.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/assessment-a/browser',
)
await fs.mkdir(outDir, { recursive: true })

const base = 'http://127.0.0.1:5173'
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})
const evidence = []

async function writeJson(name, value) {
  await fs.writeFile(path.join(outDir, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function waitForDocs(page) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForSelector('.vp-doc', { timeout: 20000 })
  await page.waitForTimeout(1200)
}

async function capture(page, id, options = {}) {
  const fullPath = path.join(outDir, `${id}.png`)
  await page.screenshot({ path: fullPath, fullPage: options.fullPage ?? true })
  let componentPath
  if (options.component) {
    const component = page.locator(options.component).first()
    if (await component.count()) {
      componentPath = path.join(outDir, `${id}-component.png`)
      await component.screenshot({ path: componentPath })
    }
  }
  const active = await page.evaluate(() => {
    const element = document.activeElement
    return element
      ? {
          tag: element.tagName,
          role: element.getAttribute('role'),
          ariaLabel: element.getAttribute('aria-label'),
          text: (element.textContent || '').trim().slice(0, 160),
          className: typeof element.className === 'string' ? element.className : '',
        }
      : null
  })
  evidence.push({
    id,
    url: page.url(),
    viewport: page.viewportSize(),
    reducedMotion: await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
    activeElement: active,
    fullScreenshot: fullPath,
    componentScreenshot: componentPath,
    visible: await page.locator(options.component || 'main').first().isVisible().catch(() => false),
  })
}

async function dumpPage(page, id, selectors = []) {
  const data = await page.evaluate((selectors) => {
    const text = (value) => (value || '').replace(/\s+/g, ' ').trim()
    const interactive = [...document.querySelectorAll('button, input, [role="button"], [role="treeitem"]')]
      .filter((element) => {
        const style = getComputedStyle(element)
        return style.display !== 'none' && style.visibility !== 'hidden'
      })
      .slice(0, 160)
      .map((element) => ({
        tag: element.tagName,
        role: element.getAttribute('role'),
        type: element.getAttribute('type'),
        ariaLabel: element.getAttribute('aria-label'),
        ariaPressed: element.getAttribute('aria-pressed'),
        disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
        text: text(element.textContent).slice(0, 120),
        className: typeof element.className === 'string' ? element.className : '',
      }))
    const states = selectors.map((selector) => ({
      selector,
      count: document.querySelectorAll(selector).length,
      visible: [...document.querySelectorAll(selector)].some((element) => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
      }),
      text: text(document.querySelector(selector)?.textContent).slice(0, 240),
    }))
    return { title: document.title, bodyText: text(document.body.textContent).slice(0, 9000), interactive, states }
  }, selectors)
  await writeJson(`${id}.json`, data)
  return data
}

async function descriptions() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
  await page.goto(`${base}/components/lxdescriptions`, { waitUntil: 'domcontentloaded' })
  await waitForDocs(page)
  await dumpPage(page, 'descriptions-desktop-light-dom', ['.lx-descriptions-demo', '.lx-descriptions', '.lx-descriptions-demo__drawer'])
  await capture(page, 'descriptions-desktop-light', { component: '.lx-descriptions-demo' })

  const hudToggle = page.getByLabel('HUD 深色主题').first()
  if (await hudToggle.count()) await hudToggle.check()
  await page.waitForTimeout(250)
  await capture(page, 'descriptions-desktop-hud', { component: '.lx-descriptions-demo' })

  const error = page.getByRole('button', { name: '错误' }).first()
  if (await error.count()) await error.click()
  await page.waitForTimeout(120)
  await capture(page, 'descriptions-desktop-hud-error', { component: '.lx-descriptions-demo' })
  const empty = page.getByRole('button', { name: '空结果' }).first()
  if (await empty.count()) await empty.click()
  await page.waitForTimeout(120)
  await capture(page, 'descriptions-desktop-hud-empty', { component: '.lx-descriptions-demo' })

  await page.emulateMedia({ reducedMotion: 'reduce' })
  const ready = page.getByRole('button', { name: '详情' }).first()
  if (await ready.count()) await ready.click()
  await page.locator('.lx-descriptions-demo button').first().focus()
  await page.keyboard.press('Tab')
  await capture(page, 'descriptions-desktop-hud-reduced-motion-keyboard', { component: '.lx-descriptions-demo' })

  await page.setViewportSize({ width: 375, height: 900 })
  await page.waitForTimeout(250)
  await capture(page, 'descriptions-mobile-375-hud-reduced-motion', { component: '.lx-descriptions-demo' })
  const lightToggle = page.getByLabel('HUD 深色主题').first()
  if (await lightToggle.count()) await lightToggle.uncheck()
  await page.waitForTimeout(250)
  await capture(page, 'descriptions-mobile-375-light-reduced-motion', { component: '.lx-descriptions-demo' })
  await dumpPage(page, 'descriptions-mobile-375-dom', ['.lx-descriptions-demo', '.lx-descriptions', '.lx-descriptions-demo__state'])
  await page.close()
}

async function virtualTree() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
  await page.goto(`${base}/components/lxvirtualtree`, { waitUntil: 'domcontentloaded' })
  await waitForDocs(page)
  await dumpPage(page, 'virtualtree-desktop-light-dom', ['.virtual-tree-demo', '.lx-virtual-tree', '[role="tree"]', '[role="treeitem"]'])
  await capture(page, 'virtualtree-desktop-light', { component: '.virtual-tree-demo' })

  const hudToggle = page.getByLabel('HUD 深色主题').first()
  if (await hudToggle.count()) await hudToggle.check()
  await page.waitForTimeout(250)
  await capture(page, 'virtualtree-desktop-hud', { component: '.virtual-tree-demo' })

  const empty = page.getByRole('button', { name: '空结果' }).first()
  if (await empty.count()) await empty.click()
  await page.waitForTimeout(150)
  await capture(page, 'virtualtree-desktop-hud-empty', { component: '.virtual-tree-demo' })
  const ready = page.getByRole('button', { name: '正常数据' }).first()
  if (await ready.count()) await ready.click()
  const error = page.getByRole('button', { name: '加载失败' }).first()
  if (await error.count()) await error.click()
  await page.waitForTimeout(150)
  await capture(page, 'virtualtree-desktop-hud-error', { component: '.virtual-tree-demo' })

  if (await ready.count()) await ready.click()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const tree = page.locator('[role="treeitem"]').first()
  if (await tree.count()) {
    await tree.focus()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Space')
  }
  await capture(page, 'virtualtree-desktop-hud-reduced-motion-keyboard', { component: '.virtual-tree-demo' })

  await page.setViewportSize({ width: 375, height: 900 })
  await page.waitForTimeout(250)
  await capture(page, 'virtualtree-mobile-375-hud-reduced-motion', { component: '.virtual-tree-demo' })
  if (await hudToggle.count()) await hudToggle.uncheck()
  await page.waitForTimeout(250)
  await capture(page, 'virtualtree-mobile-375-light-reduced-motion', { component: '.virtual-tree-demo' })
  await dumpPage(page, 'virtualtree-mobile-375-dom', ['.virtual-tree-demo', '.lx-virtual-tree', '[role="tree"]', '[role="treeitem"]'])
  await page.close()
}

async function upload() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
  await page.goto(`${base}/components/lxupload`, { waitUntil: 'domcontentloaded' })
  await waitForDocs(page)
  await dumpPage(page, 'upload-desktop-light-dom', ['.lx-upload-demo', '.lx-upload', '.lx-upload__dropzone', '.lx-upload__cancel'])
  await capture(page, 'upload-desktop-light', { component: '.lx-upload-demo' })

  const hudToggle = page.getByLabel('文档站整体深色（HUD）').first()
  if (await hudToggle.count()) await hudToggle.check()
  await page.waitForTimeout(250)
  await capture(page, 'upload-desktop-hud', { component: '.lx-upload-demo' })

  const disabled = page.getByLabel('禁用上传').first()
  if (await disabled.count()) await disabled.check()
  await page.waitForTimeout(150)
  await capture(page, 'upload-desktop-hud-disabled', { component: '.lx-upload-demo' })
  if (await disabled.count()) await disabled.uncheck()
  const auto = page.getByLabel('选择后立即上传').first()
  if (await auto.count()) await auto.check()
  const input = page.locator('input[type="file"]').first()
  if (await input.count()) {
    await input.setInputFiles({ name: 'fallback-abort.csv', mimeType: 'text/csv', buffer: Buffer.from('id,name\n1,测试\n') })
  }
  await page.waitForTimeout(450)
  await dumpPage(page, 'upload-desktop-hud-uploading-dom', ['.lx-upload.is-uploading', '.lx-upload__panel', '.lx-upload__cancel', '.lx-upload__file'])
  await capture(page, 'upload-desktop-hud-uploading-before-abort', { component: '.lx-upload-demo' })
  const cancel = page.getByRole('button', { name: '取消上传' }).first()
  if (await cancel.count()) await cancel.click()
  await page.waitForTimeout(250)
  await capture(page, 'upload-desktop-hud-uploading-after-abort', { component: '.lx-upload-demo' })
  await dumpPage(page, 'upload-desktop-hud-after-abort-dom', ['.lx-upload.is-uploading', '.lx-upload__panel', '.lx-upload__file', '.lx-upload__announcement'])

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 375, height: 900 })
  await page.waitForTimeout(250)
  await capture(page, 'upload-mobile-375-hud-reduced-motion', { component: '.lx-upload-demo' })
  if (await hudToggle.count()) await hudToggle.uncheck()
  await page.waitForTimeout(250)
  await capture(page, 'upload-mobile-375-light-reduced-motion', { component: '.lx-upload-demo' })
  await page.close()
}

try {
  await descriptions()
  await virtualTree()
  await upload()
  await writeJson('evidence.json', evidence)
} finally {
  await browser.close()
}

console.log(JSON.stringify({ screenshotCount: evidence.length, output: outDir, evidence }, null, 2))
