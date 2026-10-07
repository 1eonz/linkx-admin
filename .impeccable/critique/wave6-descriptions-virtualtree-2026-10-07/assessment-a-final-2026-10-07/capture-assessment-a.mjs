import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(
  pathToFileURL(
    'F:/work/linkx-admin/other-admin/admin-vue3/node_modules/@playwright/test/index.mjs',
  ).href,
)

const root = 'F:/work/linkx-admin'
const outDir = path.join(
  root,
  '.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/assessment-a-final-2026-10-07',
)
const screenshotDir = path.join(outDir, 'screenshots')
const base = 'http://127.0.0.1:4175'
const routes = {
  cascader: '/components/lxcascader',
  descriptions: '/components/lxdescriptions',
  virtualtree: '/components/lxvirtualtree',
}
const sourceFiles = [
  'linkx-fe/src/components/LxCascader/index.vue',
  'linkx-fe/src/components/LxCascader/style.css',
  'linkx-fe/src/components/LxCascader/demo/basic.vue',
  'linkx-fe/src/components/LxDescriptions/index.vue',
  'linkx-fe/src/components/LxDescriptions/demo/basic.vue',
  'linkx-fe/src/components/LxVirtualTree/index.vue',
  'linkx-fe/src/components/LxVirtualTree/demo/basic.vue',
  'linkx-fe/docs/components/lxcascader.md',
  'linkx-fe/docs/components/lxdescriptions.md',
  'linkx-fe/docs/components/lxvirtualtree.md',
  'linkx-fe/docs/.vitepress/config.ts',
]
const evidence = {
  capturedAt: new Date().toISOString(),
  base,
  browser: null,
  pages: [],
  interactions: [],
  sourceSha256: {},
  screenshots: [],
}

await fs.mkdir(screenshotDir, { recursive: true })

for (const relativePath of sourceFiles) {
  const bytes = await fs.readFile(path.join(root, relativePath))
  evidence.sourceSha256[relativePath] = createHash('sha256')
    .update(bytes)
    .digest('hex')
}

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})
evidence.browser = await browser.version()

async function openPage(route, viewport, reducedMotion = 'reduce') {
  const page = await browser.newPage({
    viewport,
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion,
  })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' })
  await page.locator('.vp-doc').waitFor({ state: 'visible', timeout: 20000 })
  await page.waitForTimeout(800)
  return { page, errors }
}

async function recordViewport(page, id) {
  const file = path.join(screenshotDir, `${id}.png`)
  await page.screenshot({ path: file })
  evidence.screenshots.push(path.relative(outDir, file).replaceAll('\\', '/'))
  return file
}

async function recordDemo(page, id, selector) {
  const demo = page.locator(selector).first()
  await demo.waitFor({ state: 'visible', timeout: 10000 })
  await demo.scrollIntoViewIfNeeded()
  const viewportFile = await recordViewport(page, `${id}-viewport`)
  const file = path.join(screenshotDir, `${id}-component.png`)
  await demo.screenshot({ path: file })
  evidence.screenshots.push(path.relative(outDir, file).replaceAll('\\', '/'))
  const metrics = await page.evaluate((target) => {
    const element = document.querySelector(target)
    const rect = element?.getBoundingClientRect()
    return {
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      },
      horizontalOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth,
      rootTheme: {
        dark: document.documentElement.classList.contains('dark'),
        hud: document.documentElement.classList.contains('lx-theme-hud'),
      },
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      component: rect
        ? {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          }
        : null,
    }
  }, selector)
  evidence.pages.push({ id, url: page.url(), metrics })
  return { viewportFile, componentFile: file, metrics }
}

async function recordSidebar(page, id) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(200)
  const file = await recordViewport(page, `${id}-docs-sidebar`)
  const summary = await page.evaluate(() => ({
    navLinks: [...document.querySelectorAll('.VPSidebar a')]
      .filter((link) => {
        const rect = link.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      })
      .map((link) => ({
        text: (link.textContent || '').replace(/\s+/g, ' ').trim(),
        href: link.getAttribute('href'),
        active: link.classList.contains('is-active'),
      })),
    activeHeading: document.querySelector('.VPDoc h1')?.textContent?.trim(),
  }))
  evidence.pages.push({ id: `${id}-sidebar`, url: page.url(), summary })
  return file
}

const descriptionSelector = '.lx-descriptions-demo'
const description = await openPage(routes.descriptions, {
  width: 1440,
  height: 1100,
})
await recordSidebar(description.page, 'descriptions-desktop-light')
await recordDemo(
  description.page,
  'descriptions-desktop-light',
  descriptionSelector,
)
await description.page.getByRole('button', { name: '双列', exact: true }).click()
await description.page.getByLabel('网格边框').check()
await recordDemo(
  description.page,
  'descriptions-desktop-grid-bordered',
  descriptionSelector,
)
await description.page.getByLabel('HUD 深色主题').check()
await recordDemo(
  description.page,
  'descriptions-desktop-hud',
  descriptionSelector,
)
evidence.interactions.push({
  id: 'descriptions-theme-scope',
  rootDark: await description.page.evaluate(() =>
    document.documentElement.classList.contains('dark'),
  ),
  rootHud: await description.page.evaluate(() =>
    document.documentElement.classList.contains('lx-theme-hud'),
  ),
  note: '记录 HUD 示例开关对 VitePress 根节点的影响。',
})
for (const [state, label] of [
  ['loading', '读取中'],
  ['empty', '空结果'],
  ['error', '错误'],
]) {
  await description.page.getByRole('button', { name: label, exact: true }).click()
  await recordDemo(
    description.page,
    `descriptions-desktop-${state}`,
    descriptionSelector,
  )
}
evidence.interactions.push({
  id: 'descriptions-copy-control',
  controls: await description.page
    .locator(`${descriptionSelector} [aria-label^="复制"]`)
    .count(),
  note: 'DOM 中标注复制动作的可操作项数量。',
})
await description.page.close()

const descriptionsMobile = await openPage(
  routes.descriptions,
  { width: 375, height: 844 },
  'reduce',
)
await recordDemo(
  descriptionsMobile.page,
  'descriptions-mobile-375-light-reduced-motion',
  descriptionSelector,
)
await descriptionsMobile.page
  .getByRole('button', { name: '错误', exact: true })
  .click()
await recordDemo(
  descriptionsMobile.page,
  'descriptions-mobile-375-error-reduced-motion',
  descriptionSelector,
)
const mobileMenu = descriptionsMobile.page.getByRole('button', {
  name: '菜单',
  exact: true,
})
if (await mobileMenu.count()) {
  await mobileMenu.click()
  await descriptionsMobile.page.waitForTimeout(250)
  await recordViewport(descriptionsMobile.page, 'descriptions-mobile-375-sidebar-open')
}
evidence.pages.push({
  id: 'descriptions-mobile-runtime',
  url: descriptionsMobile.page.url(),
  errors: descriptionsMobile.errors,
  metrics: await descriptionsMobile.page.evaluate((selector) => {
    const demo = document.querySelector(selector)
    const copyControl = demo?.querySelector('[aria-label^="复制"]')
    const transitionTarget = demo?.querySelector('.lx-descriptions__item')
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      horizontalOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      descriptionTransition: transitionTarget
        ? getComputedStyle(transitionTarget).transitionDuration
        : null,
      copyControl: copyControl
        ? {
            tag: copyControl.tagName,
            role: copyControl.getAttribute('role'),
            tabIndex: copyControl.tabIndex,
            ariaLabel: copyControl.getAttribute('aria-label'),
          }
        : null,
    }
  }, descriptionSelector),
})
await descriptionsMobile.page.close()

const cascaderSelector = '.cascader-demo'
const cascader = await openPage(routes.cascader, {
  width: 1440,
  height: 1100,
})
await recordSidebar(cascader.page, 'cascader-desktop-light')
await recordDemo(cascader.page, 'cascader-desktop-light', cascaderSelector)
await cascader.page.locator('.cascader-demo__settings summary').click()
await cascader.page.getByLabel('HUD 深色主题').check()
await cascader.page.locator('.lx-cascader .el-input__wrapper').click()
await cascader.page.waitForTimeout(300)
await recordDemo(cascader.page, 'cascader-desktop-hud-open', cascaderSelector)
evidence.interactions.push({
  id: 'cascader-hud-popper',
  rootHud: await cascader.page.evaluate(() =>
    document.documentElement.classList.contains('lx-theme-hud'),
  ),
  popper: await cascader.page.evaluate(() => {
    const element = document.querySelector('.lx-cascader__popper')
    if (!element) return null
    const rect = element.getBoundingClientRect()
    return {
      className: element.className,
      visible: rect.width > 0 && rect.height > 0,
      rect: {
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
      },
    }
  }),
})
await cascader.page.keyboard.press('Escape')
const cascaderInput = cascader.page.locator('.lx-cascader input').first()
await cascaderInput.focus()
await cascaderInput.press('ArrowDown')
await cascader.page.waitForTimeout(200)
const keyboardOpened = await cascader.page
  .locator('.lx-cascader__popper')
  .isVisible()
  .catch(() => false)
await cascader.page.keyboard.press('Escape')
evidence.interactions.push({
  id: 'cascader-keyboard',
  openedByArrowDown: keyboardOpened,
  focusReturnedToInput: await cascaderInput.evaluate(
    (element) => element === document.activeElement,
  ),
})
await cascader.page.keyboard.press('Escape')
for (const [state, label] of [
  ['error', '失败'],
  ['disabled', '禁用'],
]) {
  await cascader.page.getByRole('button', { name: label, exact: true }).click()
  await recordDemo(cascader.page, `cascader-desktop-${state}`, cascaderSelector)
}
evidence.interactions.push({
  id: 'cascader-demo-empty-state',
  emptyStateControlPresent: await cascader.page
    .getByRole('button', { name: '空结果', exact: true })
    .count()
    .then((count) => count > 0),
  currentOptionCount: await cascader.page.locator('.cascader-demo__field').evaluate(
    (field) => field.querySelectorAll('.el-cascader-node').length,
  ),
  note: 'Demo 未提供空数据状态切换；未通过脚本篡改 Vue 状态模拟。',
})
await cascader.page.close()

const cascaderMobile = await openPage(
  routes.cascader,
  { width: 375, height: 844 },
  'reduce',
)
await recordDemo(
  cascaderMobile.page,
  'cascader-mobile-375-light-reduced-motion',
  cascaderSelector,
)
await cascaderMobile.page.locator('.cascader-demo__settings summary').click()
await cascaderMobile.page.getByLabel('HUD 深色主题').check()
await cascaderMobile.page.locator('.lx-cascader .el-input__wrapper').click()
await cascaderMobile.page.waitForTimeout(300)
await recordDemo(
  cascaderMobile.page,
  'cascader-mobile-375-hud-open-reduced-motion',
  cascaderSelector,
)
evidence.interactions.push({
  id: 'cascader-mobile-popper-bounds',
  bounds: await cascaderMobile.page.evaluate(() => {
    const element = document.querySelector('.lx-cascader__popper')
    if (!element) return null
    const rect = element.getBoundingClientRect()
    return {
      left: Math.round(rect.left),
      right: Math.round(rect.right),
      width: Math.round(rect.width),
      viewportWidth: innerWidth,
      insideViewport: rect.left >= 0 && rect.right <= innerWidth,
    }
  }),
  reducedMotion: await cascaderMobile.page.evaluate(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  ),
})
await cascaderMobile.page.close()

const treeSelector = '.virtual-tree-demo'
const tree = await openPage(routes.virtualtree, {
  width: 1440,
  height: 1100,
})
await recordSidebar(tree.page, 'virtualtree-desktop-light')
await recordDemo(tree.page, 'virtualtree-desktop-light', treeSelector)
await tree.page.locator('.virtual-tree-demo__controls summary').click()
await recordDemo(tree.page, 'virtualtree-desktop-controls-open', treeSelector)
evidence.interactions.push({
  id: 'virtualtree-tab-sequence',
  tree: await tree.page.evaluate(() => {
    const root = document.querySelector('[role="tree"]')
    if (!root) return null
    const shown = (element) => {
      const rect = element.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    }
    const tabbables = [...root.querySelectorAll('button:not(:disabled), input:not(:disabled), [role="treeitem"][tabindex="0"]')]
      .filter(shown)
      .map((element) => ({
        tag: element.tagName,
        role: element.getAttribute('role'),
        ariaLabel: element.getAttribute('aria-label'),
        className: typeof element.className === 'string' ? element.className : '',
        tabIndex: element.tabIndex,
      }))
    return {
      renderedRows: root.querySelectorAll('[role="treeitem"]').length,
      visibleSequentialFocusTargets: tabbables.length,
      targets: tabbables.slice(0, 45),
    }
  }),
})
const firstTreeItem = tree.page.locator('[role="treeitem"]').first()
await firstTreeItem.focus()
const tabFocusTrace = []
for (let index = 0; index < 4; index += 1) {
  tabFocusTrace.push(
    await tree.page.evaluate(() => {
      const element = document.activeElement
      return {
        tag: element?.tagName,
        role: element?.getAttribute('role'),
        ariaLabel: element?.getAttribute('aria-label'),
        className:
          typeof element?.className === 'string' ? element.className : '',
        treeKey: element?.getAttribute('data-lx-tree-key'),
      }
    }),
  )
  await tree.page.keyboard.press('Tab')
}
evidence.interactions.push({ id: 'virtualtree-tab-focus-trace', tabFocusTrace })
await recordDemo(tree.page, 'virtualtree-desktop-keyboard-focus', treeSelector)
await tree.page.keyboard.press('Escape')
await tree.page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
await recordDemo(tree.page, 'virtualtree-desktop-hud', treeSelector)
for (const [state, label] of [
  ['loading', '加载中'],
  ['empty', '空结果'],
  ['error', '加载失败'],
]) {
  await tree.page.getByRole('button', { name: label, exact: true }).click()
  await recordDemo(tree.page, `virtualtree-desktop-${state}`, treeSelector)
}
await tree.page.close()

const treeMobile = await openPage(
  routes.virtualtree,
  { width: 375, height: 844 },
  'reduce',
)
await recordDemo(
  treeMobile.page,
  'virtualtree-mobile-375-light-reduced-motion',
  treeSelector,
)
await treeMobile.page.locator('.virtual-tree-demo__controls summary').click()
await recordDemo(
  treeMobile.page,
  'virtualtree-mobile-375-controls-open-reduced-motion',
  treeSelector,
)
evidence.interactions.push({
  id: 'virtualtree-mobile-control-targets',
  controls: await treeMobile.page.evaluate(() =>
    [...document.querySelectorAll('.virtual-tree-demo__actions button, .virtual-tree-demo__actions label')]
      .map((element) => ({
        text: (element.textContent || '').replace(/\s+/g, ' ').trim(),
        height: Math.round(element.getBoundingClientRect().height),
      })),
  ),
  horizontalOverflow: await treeMobile.page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  ),
  reducedMotion: await treeMobile.page.evaluate(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  ),
})
await treeMobile.page.close()

evidence.errors = [
  ...description.errors.map((message) => ({ page: 'descriptions-desktop', message })),
  ...descriptionsMobile.errors.map((message) => ({ page: 'descriptions-mobile', message })),
  ...cascader.errors.map((message) => ({ page: 'cascader-desktop', message })),
  ...cascaderMobile.errors.map((message) => ({ page: 'cascader-mobile', message })),
  ...tree.errors.map((message) => ({ page: 'virtualtree-desktop', message })),
  ...treeMobile.errors.map((message) => ({ page: 'virtualtree-mobile', message })),
]

await fs.writeFile(
  path.join(outDir, 'browser-evidence.json'),
  `${JSON.stringify(evidence, null, 2)}\n`,
)
await browser.close()
