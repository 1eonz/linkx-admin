import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const puppeteer = require('C:/Users/Administrator/AppData/Local/Temp/linkx-wave7-puppeteer-20261008/node_modules/puppeteer')
const browser = await puppeteer.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--no-sandbox'],
})
const context = await browser.createBrowserContext()
const page = await context.newPage()
await page.setViewport({ width: 1440, height: 1000 })
const response = await page.goto('http://127.0.0.1:4174/components/lxtransferpanel', {
  waitUntil: 'domcontentloaded',
  timeout: 30000,
})
await page.waitForSelector('.transfer-panel-demo', { timeout: 15000 })
const evidence = await page.evaluate(() => ({
  title: document.title,
  url: location.href,
  viewport: { width: innerWidth, height: innerHeight },
  scrollWidth: {
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  },
  hasDemo: Boolean(document.querySelector('.transfer-panel-demo')),
  selectedCount: document.querySelector('[data-testid="selected-count"]')?.textContent.trim() ?? null,
}))
process.stdout.write(`${JSON.stringify({ status: response.status(), evidence }, null, 2)}\n`)
await context.close()
await browser.close()
