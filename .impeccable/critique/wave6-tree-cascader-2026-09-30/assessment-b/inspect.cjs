const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
;(async () => {
  const browser = await chromium.launch({ headless: true })
  for (const route of ['lxtreeselect','lxcascader']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto('http://127.0.0.1:4191/components/' + route, { waitUntil: 'networkidle' })
    console.log(route, await page.locator('input').evaluateAll((els) => els.map((e) => ({type:e.type,placeholder:e.getAttribute('placeholder'),aria:e.getAttribute('aria-label'),value:e.value}))))
    console.log('buttons', await page.locator('button').allTextContents())
    console.log('selects', await page.locator('[role=combobox]').count(), await page.locator('input.el-input__inner').count())
    await page.close()
  }
  await browser.close()
})()