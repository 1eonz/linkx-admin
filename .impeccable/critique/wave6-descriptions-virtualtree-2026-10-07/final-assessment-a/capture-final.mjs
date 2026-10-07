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
  '.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/final-assessment-a',
)
const browserDir = path.join(outDir, 'browser')
const base = 'http://127.0.0.1:4174'
const targets = [
  'linkx-fe/src/components/LxDescriptions/index.vue',
  'linkx-fe/src/components/LxDescriptions/types.ts',
  'linkx-fe/src/components/LxDescriptions/demo/basic.vue',
  'linkx-fe/src/components/LxVirtualTree/index.vue',
  'linkx-fe/src/components/LxVirtualTree/types.ts',
  'linkx-fe/src/components/LxVirtualTree/demo/basic.vue',
  'linkx-fe/docs/components/lxdescriptions.md',
  'linkx-fe/docs/components/lxvirtualtree.md',
]
const evidence = []
const consoleErrors = []

await fs.mkdir(browserDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})

async function waitForDocs(page) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForSelector('.vp-doc', { timeout: 20000 })
  await page.waitForTimeout(900)
}

async function pageMetrics(page, selector) {
  return page.evaluate((selector) => {
    const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim()
    const demo = document.querySelector(selector)
    const rect = demo?.getBoundingClientRect()
    return {
      title: document.title,
      bodyText: normalize(document.body.textContent).slice(0, 12000),
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        horizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
      },
      theme: {
        dark: document.documentElement.classList.contains('dark'),
        hud: document.documentElement.classList.contains('lx-theme-hud'),
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      },
      demo: rect
        ? {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          }
        : null,
    }
  }, selector)
}

async function capture(page, id, selector) {
  const pagePath = path.join(browserDir, `${id}.png`)
  const componentPath = path.join(browserDir, `${id}-component.png`)
  await page.screenshot({ path: pagePath, fullPage: true })
  const demo = page.locator(selector).first()
  const componentVisible = await demo.isVisible().catch(() => false)
  if (componentVisible) await demo.screenshot({ path: componentPath })
  const active = await page.evaluate(() => {
    const element = document.activeElement
    return element
      ? {
          tag: element.tagName,
          role: element.getAttribute('role'),
          ariaLabel: element.getAttribute('aria-label'),
          text: (element.textContent || '').trim().slice(0, 160),
          treeKey: element.getAttribute('data-lx-tree-key'),
          className:
            typeof element.className === 'string' ? element.className : '',
        }
      : null
  })
  evidence.push({
    id,
    url: page.url(),
    metrics: await pageMetrics(page, selector),
    activeElement: active,
    pageScreenshot: pagePath,
    componentScreenshot: componentVisible ? componentPath : null,
  })
}

async function dump(page, id, selector) {
  const result = await page.evaluate((selector) => {
    const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim()
    const box = (element) => {
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        display: style.display,
        visibility: style.visibility,
      }
    }
    const demo = document.querySelector(selector)
    const active = document.activeElement
    const tree = demo?.querySelector('[role="tree"]')
    const rows = [...(demo?.querySelectorAll('[role="treeitem"]') ?? [])]
    const remarks = [...(demo?.querySelectorAll('.lx-descriptions__item') ?? [])]
      .find((item) => normalize(item.querySelector('dt')?.textContent) === '业务备注')
    const remarkValue = remarks?.querySelector('.lx-descriptions__value-text')
    return {
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      },
      demoText: normalize(demo?.textContent).slice(0, 9000),
      tree: tree
        ? {
            role: tree.getAttribute('role'),
            ariaLabel: tree.getAttribute('aria-label'),
            ariaLabelledBy: tree.getAttribute('aria-labelledby'),
            visibleRows: rows.length,
            treeItemTabStops: rows.filter((row) => row.getAttribute('tabindex') === '0').length,
            activeKey: active?.getAttribute('data-lx-tree-key'),
            activeRole: active?.getAttribute('role'),
            scrollTop: tree.scrollTop,
            scrollHeight: tree.scrollHeight,
            firstRows: rows.slice(0, 5).map((row) => ({
              key: row.getAttribute('data-lx-tree-key'),
              label: normalize(row.querySelector('.lx-virtual-tree__label')?.textContent),
              level: row.getAttribute('aria-level'),
              expanded: row.getAttribute('aria-expanded'),
              checked: row.getAttribute('aria-checked'),
              tabIndex: row.getAttribute('tabindex'),
            })),
            controls: [...tree.querySelectorAll('button, input[type="checkbox"]')]
              .slice(0, 8)
              .map((control) => ({
                tag: control.tagName,
                name: control.getAttribute('aria-label'),
                box: box(control),
                tabIndex: control.tabIndex,
              })),
          }
        : null,
      longValue: remarkValue
        ? {
            text: normalize(remarkValue.textContent),
            title: remarkValue.getAttribute('title'),
            box: box(remarkValue),
            scrollWidth: remarkValue.scrollWidth,
            clientWidth: remarkValue.clientWidth,
            whiteSpace: getComputedStyle(remarkValue).whiteSpace,
            textOverflow: getComputedStyle(remarkValue).textOverflow,
          }
        : null,
      visibleButtons: [...(demo?.querySelectorAll('button') ?? [])]
        .filter((button) => {
          const style = getComputedStyle(button)
          return style.display !== 'none' && style.visibility !== 'hidden'
        })
        .map((button) => normalize(button.textContent)),
    }
  }, selector)
  await fs.writeFile(
    path.join(browserDir, `${id}.json`),
    `${JSON.stringify(result, null, 2)}\n`,
    'utf8',
  )
  return result
}

async function openTarget(slug, selector) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  page.on('console', (message) => {
    if (message.type() === 'error')
      consoleErrors.push({ target: slug, type: message.type(), text: message.text() })
  })
  page.on('pageerror', (error) =>
    consoleErrors.push({ target: slug, type: 'pageerror', text: error.message }),
  )
  const response = await page.goto(`${base}/components/${slug}.html`, {
    waitUntil: 'domcontentloaded',
  })
  await waitForDocs(page)
  return { context, page, selector, status: response?.status() ?? null }
}

try {
  const descriptions = await openTarget(
    'lxdescriptions',
    '.lx-descriptions-demo',
  )
  const { page: descriptionsPage, selector: descriptionsSelector } = descriptions
  evidence.push({ id: 'descriptions-http', status: descriptions.status })
  await dump(descriptionsPage, 'descriptions-desktop-light-dom', descriptionsSelector)
  await capture(descriptionsPage, 'descriptions-desktop-light', descriptionsSelector)

  await descriptionsPage.getByLabel('HUD 深色主题').check()
  await capture(descriptionsPage, 'descriptions-desktop-hud', descriptionsSelector)
  await descriptionsPage.getByRole('button', { name: '读取中' }).click()
  await capture(descriptionsPage, 'descriptions-desktop-loading', descriptionsSelector)
  await descriptionsPage.getByRole('button', { name: '错误' }).click()
  await capture(descriptionsPage, 'descriptions-desktop-error', descriptionsSelector)
  await descriptionsPage.getByRole('button', { name: '重试' }).click()
  await descriptionsPage.getByRole('button', { name: '空结果' }).click()
  await capture(descriptionsPage, 'descriptions-desktop-empty', descriptionsSelector)
  await descriptionsPage.getByRole('button', { name: '详情' }).click()
  await descriptionsPage.getByLabel('HUD 深色主题').uncheck()
  await descriptionsPage.setViewportSize({ width: 375, height: 812 })
  await capture(descriptionsPage, 'descriptions-mobile-375-light', descriptionsSelector)
  await dump(descriptionsPage, 'descriptions-mobile-375-dom', descriptionsSelector)
  await descriptionsPage.getByLabel('HUD 深色主题').check()
  await capture(descriptionsPage, 'descriptions-mobile-375-hud', descriptionsSelector)
  const copyControl = descriptionsPage.locator('[aria-label^="复制警号"]')
  await copyControl.focus()
  await descriptionsPage.keyboard.press('Enter')
  await capture(descriptionsPage, 'descriptions-mobile-375-keyboard-copy', descriptionsSelector)
  await descriptions.context.close()

  const virtualTree = await openTarget('lxvirtualtree', '.virtual-tree-demo')
  const { page: treePage, selector: treeSelector } = virtualTree
  evidence.push({ id: 'virtualtree-http', status: virtualTree.status })
  await dump(treePage, 'virtualtree-desktop-light-dom', treeSelector)
  await capture(treePage, 'virtualtree-desktop-light', treeSelector)

  await treePage.getByText('演示状态和更多操作', { exact: true }).click()
  await dump(treePage, 'virtualtree-desktop-expanded-controls-dom', treeSelector)
  await treePage.getByLabel('HUD 深色主题').check()
  await capture(treePage, 'virtualtree-desktop-hud', treeSelector)
  await treePage.getByRole('button', { name: '加载中' }).click()
  await capture(treePage, 'virtualtree-desktop-loading', treeSelector)
  await treePage.getByRole('button', { name: '加载失败' }).click()
  await capture(treePage, 'virtualtree-desktop-error', treeSelector)
  await treePage.getByRole('button', { name: '重试' }).click()
  await treePage.getByRole('button', { name: '空结果' }).click()
  await capture(treePage, 'virtualtree-desktop-empty', treeSelector)
  await treePage.getByRole('button', { name: '正常数据' }).click()
  const viewport = treePage.locator('[role="tree"]')
  const initialRow = viewport.locator('[role="treeitem"]').first()
  await initialRow.focus()
  await treePage.keyboard.press('ArrowDown')
  await treePage.keyboard.press('ArrowRight')
  await treePage.keyboard.press('Space')
  await dump(treePage, 'virtualtree-desktop-keyboard-dom', treeSelector)
  await capture(treePage, 'virtualtree-desktop-keyboard', treeSelector)
  await treePage.setViewportSize({ width: 375, height: 812 })
  await capture(treePage, 'virtualtree-mobile-375-hud', treeSelector)
  await dump(treePage, 'virtualtree-mobile-375-dom', treeSelector)
  await treePage.getByLabel('HUD 深色主题').uncheck()
  await capture(treePage, 'virtualtree-mobile-375-light', treeSelector)
  await treePage.context().close()

  const fingerprints = []
  for (const relativePath of targets) {
    const content = await fs.readFile(path.join(root, relativePath))
    fingerprints.push({
      path: relativePath,
      sha256: createHash('sha256').update(content).digest('hex'),
    })
  }
  await fs.writeFile(
    path.join(outDir, 'source-baseline.sha256'),
    `${fingerprints.map(({ path: file, sha256 }) => `${sha256}  ${file}`).join('\n')}\n`,
    'utf8',
  )
  await fs.writeFile(
    path.join(browserDir, 'evidence.json'),
    `${JSON.stringify({ evidence, consoleErrors }, null, 2)}\n`,
    'utf8',
  )
  console.log(JSON.stringify({ evidence, consoleErrors }, null, 2))
} finally {
  await browser.close()
}
