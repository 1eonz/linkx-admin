import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '../../../../other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright/index.mjs'

const outputDir = fileURLToPath(new URL('./', import.meta.url))
const baseUrl = 'http://127.0.0.1:4174'
const liveUrl = process.argv[2]
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})

await mkdir(outputDir, { recursive: true })
const evidence = { views: [], requests: [], console: [] }

async function capture(name, path, viewport, setup) {
  const page = await browser.newPage({ viewport })
  page.on('request', (request) =>
    evidence.requests.push({
      view: name,
      method: request.method(),
      url: request.url(),
    }),
  )
  page.on('console', (message) =>
    evidence.console.push({
      view: name,
      type: message.type(),
      text: message.text(),
    }),
  )
  page.on('pageerror', (error) =>
    evidence.console.push({
      view: name,
      type: 'pageerror',
      text: error.message,
    }),
  )
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' })
  await setup(page)
  if (liveUrl) {
    try {
      await page.addScriptTag({ url: `${liveUrl}/detect.js` })
      await page.waitForTimeout(2500)
    } catch (error) {
      evidence.console.push({
        view: name,
        type: 'injection-error',
        text: String(error),
      })
    }
  }
  await page.screenshot({
    path: `${outputDir}/${name}-final.png`,
    fullPage: false,
  })
  evidence.views.push(
    await page.evaluate(
      (view) => ({
        name: view,
        title: document.title,
        viewport: { width: innerWidth, height: innerHeight },
        documentWidth: document.documentElement.scrollWidth,
        visibleText: document.body.innerText.slice(0, 8000),
        overlayElements: document.querySelectorAll(
          '[data-impeccable], .impeccable-overlay, [id*="impeccable"]',
        ).length,
        cascaderState:
          view === 'cascader-loading-error-mobile'
            ? {
                feedback: document
                  .querySelector('.lx-cascader__feedback')
                  ?.textContent?.trim(),
                busy: document
                  .querySelector('.lx-cascader-field')
                  ?.getAttribute('aria-busy'),
                invalid: document
                  .querySelector('.lx-cascader input')
                  ?.getAttribute('aria-invalid'),
                retryVisible: Boolean(
                  document.querySelector(
                    '.lx-cascader__feedback .lx-cascader__retry',
                  ),
                ),
              }
            : undefined,
      }),
      name,
    ),
  )
  await page.close()
}

const desktop = { width: 1280, height: 900 }
const mobile = { width: 375, height: 812 }

await capture(
  'treeselect-final-desktop-overlay',
  '/components/lxtreeselect.html',
  desktop,
  async (page) => {
    await page.locator('.lx-tree-select-demo').scrollIntoViewIfNeeded()
    await page.locator('.lx-tree-select-demo__settings summary').click()
    await page.getByRole('checkbox', { name: 'English footer' }).check()
  },
)
await capture(
  'treeselect-final-open-overlay',
  '/components/lxtreeselect.html',
  desktop,
  async (page) => {
    await page.locator('.lx-tree-select-demo').scrollIntoViewIfNeeded()
    await page.locator('.lx-tree-select-demo__settings summary').click()
    await page.locator('.lx-tree-select').first().click()
    await page
      .locator('.lx-tree-select__popper')
      .last()
      .waitFor({ state: 'visible' })
  },
)
await capture(
  'treeselect-final-error-mobile-overlay',
  '/components/lxtreeselect.html',
  mobile,
  async (page) => {
    await page.locator('.lx-tree-select-demo').scrollIntoViewIfNeeded()
    await page.locator('.lx-tree-select-demo__settings summary').click()
    await page.getByRole('button', { name: '模拟加载失败' }).click()
  },
)
await capture(
  'cascader-final-desktop-overlay',
  '/components/lxcascader.html',
  desktop,
  async (page) => {
    await page.locator('.cascader-demo').scrollIntoViewIfNeeded()
  },
)
await capture(
  'cascader-final-open-overlay',
  '/components/lxcascader.html',
  desktop,
  async (page) => {
    await page.locator('.cascader-demo').scrollIntoViewIfNeeded()
    await page.locator('.cascader-demo__settings summary').click()
    await page.locator('.cascader-demo input').first().click()
    await page
      .locator('.lx-cascader__popper')
      .last()
      .waitFor({ state: 'visible' })
  },
)
await capture(
  'cascader-loading-error-mobile',
  '/components/lxcascader.html',
  mobile,
  async (page) => {
    await page.locator('.cascader-demo').scrollIntoViewIfNeeded()
    await page.locator('.cascader-demo__settings summary').click()
    await page
      .getByRole('button', { name: '加载中且失败', exact: true })
      .click()
  },
)

await writeFile(
  `${outputDir}/final-browser-evidence.json`,
  JSON.stringify(evidence, null, 2),
  'utf8',
)
await browser.close()
console.log(
  JSON.stringify(
    {
      views: evidence.views.map(
        ({
          name,
          viewport,
          documentWidth,
          overlayElements,
          cascaderState,
        }) => ({
          name,
          viewport,
          documentWidth,
          overlayElements,
          cascaderState,
        }),
      ),
      requests: evidence.requests.length,
      console: evidence.console.length,
    },
    null,
    2,
  ),
)
