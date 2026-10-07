import { pathToFileURL } from 'node:url'

const { chromium } = await import(
  pathToFileURL(
    'F:/work/linkx-admin/other-admin/admin-vue3/node_modules/@playwright/test/index.mjs',
  ).href,
)

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.goto('http://127.0.0.1:4175/components/lxcascader', {
  waitUntil: 'domcontentloaded',
})
await page.waitForSelector('.vp-doc')
await page.locator('.cascader-demo__settings summary').click()
await page.getByLabel('HUD 深色主题').check()
await page.locator('.lx-cascader .el-input__wrapper').click()
await page.waitForTimeout(300)
const result = await page.evaluate(() => {
  const element = document.querySelector('.lx-cascader__popper')
  const style = element ? getComputedStyle(element) : null
  const variables = [
    '--el-bg-color',
    '--el-bg-color-overlay',
    '--el-fill-color-blank',
    '--el-fill-color-light',
    '--el-border-color',
    '--el-border-color-light',
    '--el-text-color-primary',
    '--lx-bg-card',
    '--lx-bg-page',
  ]
  return {
    className: element?.className,
    variables: Object.fromEntries(
      variables.map((name) => [name, style?.getPropertyValue(name).trim()]),
    ),
    background: style?.backgroundColor,
    color: style?.color,
    borderColor: style?.borderColor,
    rootClasses: document.documentElement.className,
  }
})
console.log(JSON.stringify(result, null, 2))
await browser.close()
