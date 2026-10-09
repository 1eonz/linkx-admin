import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const evidenceDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(evidenceDir, '../../../../')
const require = createRequire(
  new URL('../../../../other-admin/admin-vue3/package.json', import.meta.url),
)
const { chromium } = require('@playwright/test')

const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel.html'
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const frozenFiles = {
  'linkx-fe/src/components/LxTransferPanel/index.vue':
    '269C91FDF0D6A7812BA6D03C3D5BDEB6B5CB9DED100E560E161C36A8486D544B',
  'linkx-fe/src/components/LxTransferPanel/types.ts':
    '52F961503BBAE51F9DC671A34FF5DBD335C086DB3DE3DE4D4BD1D59A830C99C0',
  'linkx-fe/src/components/LxTransferPanel/demo/basic.vue':
    '644B23CF4173AF7984444546703F97550F010B4EF6CA379FA97423DBE12042E2',
  'linkx-fe/docs/components/lxtransferpanel.md':
    'CCB7A689DD0CA85FB8A82ACBB516A4EABFC06E5B3B96BC8F47E9B344ED3DAC53',
  'design/虚拟滚动树 + 双栏穿梭/code.html':
    'D523F7C5167DDAF3A3DA6BFDA68B9F29773CB4F89AE54A8DF7A413AABD853CEA',
  'other-admin/admin-vue3/tests/unit/lx-transfer-panel.test.ts':
    '14E080AA1D60E3CCC7FD64AA880B31A3FBA06A8DF5181E581435C3403DFF8674',
  'other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts':
    'C987D12BB9F727945384C81A7BACD3368D809E95B91ED95B9339E59D62FB61BC',
}

async function verifyFrozenFiles() {
  const results = {}
  for (const [relativePath, expectedHash] of Object.entries(frozenFiles)) {
    const contents = await readFile(path.join(repoRoot, relativePath))
    const actualHash = createHash('sha256').update(contents).digest('hex').toUpperCase()
    if (actualHash !== expectedHash) {
      throw new Error(`冻结文件哈希不匹配，停止取证：${relativePath} ${actualHash}`)
    }
    results[relativePath] = actualHash
  }
  return results
}

const verifiedHashes = await verifyFrozenFiles()
const browser = await chromium.launch({ headless: true, executablePath: chromePath })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  colorScheme: 'light',
  reducedMotion: 'no-preference',
})
const page = await context.newPage()
const browserMessages = []
const failedResponses = []
page.on('console', (message) => {
  if (message.type() === 'error') browserMessages.push({ type: 'console.error', text: message.text() })
})
page.on('pageerror', (error) => browserMessages.push({ type: 'pageerror', text: error.message }))
page.on('response', (response) => {
  if (response.status() >= 400) {
    failedResponses.push({ status: response.status(), url: response.url() })
  }
})

const response = await page.goto(targetUrl, { waitUntil: 'networkidle' })
if (!response || response.status() !== 200) {
  throw new Error(`目标页不可访问：HTTP ${response?.status() ?? 'no response'}`)
}

const demo = page.locator('.transfer-panel-demo')
await demo.waitFor({ state: 'visible' })
const settings = demo.locator('.transfer-panel-demo__settings')
if (!(await settings.evaluate((element) => element.open))) {
  await settings.locator('summary').click()
}

const evidenceIndex = {
  title: 'LxTransferPanel Assessment A 浏览器证据',
  method: '独立 Assessment A；Playwright 新建 Chromium context 与 page；未运行 detector。',
  targetUrl,
  capturedAt: new Date().toISOString(),
  browser: browser.version(),
  frozenHashes: verifiedHashes,
  captures: [],
  browserErrors: browserMessages,
  failedResponses,
  checks: [],
}

async function capture(fileName, state) {
  await demo.scrollIntoViewIfNeeded()
  await demo.screenshot({ path: path.join(evidenceDir, fileName) })
  const metrics = await page.evaluate((currentState) => {
    const demoElement = document.querySelector('.transfer-panel-demo')
    const content = document.querySelector('.vp-doc')
    const transfer = document.querySelector('.lx-transfer-panel')
    const panels = [...document.querySelectorAll('.lx-transfer-panel__panel')]
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
    const active = document.activeElement
    return {
      state: currentState,
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      documentHasHorizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      contentColumn: rect(content),
      demo: rect(demoElement),
      panelRects: panels.map(rect),
      gridColumns: transfer ? getComputedStyle(transfer).gridTemplateColumns : null,
      prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      focusedElement: active ? `${active.tagName.toLowerCase()}${active.getAttribute('aria-label') ? `[aria-label="${active.getAttribute('aria-label')}"]` : ''}` : null,
      selectedItemCount: document.querySelectorAll('.lx-transfer-panel__selected-item').length,
      truncatedMetadata: [...document.querySelectorAll('.lx-transfer-panel__node-code, .lx-transfer-panel__node-status')]
        .filter((element) => element.scrollWidth > element.clientWidth)
        .slice(0, 8)
        .map((element) => ({
          className: element.className,
          text: element.textContent.trim(),
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        })),
      emptyMessage: document.querySelector('.lx-transfer-panel__empty')?.textContent?.trim() ?? null,
      loadingMessage: document.querySelector('[role="status"]')?.textContent?.trim() ?? null,
      errorMessage: document.querySelector('[role="alert"]')?.textContent?.trim() ?? null,
    }
  }, state)
  evidenceIndex.captures.push({ file: fileName, ...metrics })
  return metrics
}

const desktopReady = await capture('01-desktop-1440-content-688-ready.png', '桌面正常态')
evidenceIndex.checks.push({
  name: '桌面内容列宽度',
  result: desktopReady.contentColumn?.width === 688 ? '通过：实测 688px' : `实际 ${desktopReady.contentColumn?.width ?? '缺失'}px`,
})

await page.getByLabel('HUD 深色主题').check()
await capture('02-desktop-1440-content-688-hud.png', '桌面 HUD 深色主题')
await page.getByLabel('HUD 深色主题').uncheck()

await page.setViewportSize({ width: 375, height: 812 })
await page.waitForTimeout(150)
const mobileReady = await capture('03-mobile-375-ready.png', '375px 正常态')
evidenceIndex.checks.push({
  name: '375px 横向溢出',
  result: mobileReady.documentHasHorizontalOverflow ? `发现：文档宽 ${mobileReady.documentWidth}px` : '未发现',
})
await page.getByLabel('HUD 深色主题').check()
await capture('04-mobile-375-hud.png', '375px HUD 深色主题')
await page.getByLabel('HUD 深色主题').uncheck()

await page.setViewportSize({ width: 1440, height: 1000 })
await page.waitForTimeout(150)
await page.getByRole('button', { name: '空结果', exact: true }).click()
await capture('05-desktop-empty.png', '空结果')

await page.getByRole('button', { name: '正常数据', exact: true }).click()
await page.getByRole('button', { name: '加载中', exact: true }).click()
await capture('06-desktop-loading.png', '加载中')

await page.getByRole('button', { name: '加载失败', exact: true }).click()
await capture('07-desktop-error.png', '加载失败')
await page.getByRole('button', { name: '重试', exact: true }).click()

const invertButton = page.getByRole('button', { name: '反选', exact: true })
await settings.locator('summary').focus()
for (let tab = 0; tab < 7; tab += 1) await page.keyboard.press('Tab')
const focusEvidence = await invertButton.evaluate((element) => {
  const style = getComputedStyle(element)
  return {
    focused: document.activeElement === element,
    focusVisible: element.matches(':focus-visible'),
    outlineWidth: style.outlineWidth,
    outlineStyle: style.outlineStyle,
    outlineColor: style.outlineColor,
  }
})
if (!focusEvidence.focused || !focusEvidence.focusVisible) {
  throw new Error(`键盘 Tab 未聚焦反选按钮：${JSON.stringify(focusEvidence)}`)
}
evidenceIndex.checks.push({ name: '键盘焦点环', ...focusEvidence })
await capture('08-desktop-keyboard-focus.png', '反选按钮键盘焦点')

await page.emulateMedia({ reducedMotion: 'reduce' })
const motionEvidence = await page
  .getByRole('button', { name: '全部加入' })
  .evaluate((element) => ({
    prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    transitionDuration: getComputedStyle(element).transitionDuration,
    animationDuration: getComputedStyle(element).animationDuration,
  }))
evidenceIndex.checks.push({ name: '减少动效偏好', ...motionEvidence })
await capture('09-desktop-reduced-motion.png', '减少动效偏好')

evidenceIndex.browserErrors = browserMessages
evidenceIndex.failedResponses = failedResponses
evidenceIndex.frozenHashes = await verifyFrozenFiles()
await writeFile(
  path.join(evidenceDir, 'evidence-index.json'),
  `${JSON.stringify(evidenceIndex, null, 2)}\n`,
  'utf8',
)

await context.close()
await browser.close()
console.log(JSON.stringify({
  captures: evidenceIndex.captures.map(({ file, viewport, contentColumn, documentHasHorizontalOverflow, prefersReducedMotion }) => ({
    file,
    viewport,
    contentWidth: contentColumn?.width,
    horizontalOverflow: documentHasHorizontalOverflow,
    prefersReducedMotion,
  })),
  checks: evidenceIndex.checks,
  browserErrors: browserMessages,
  failedResponses,
}, null, 2))
