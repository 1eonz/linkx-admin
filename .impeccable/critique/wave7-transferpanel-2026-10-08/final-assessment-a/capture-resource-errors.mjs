import { chromium } from '../../../../other-admin/admin-vue3/node_modules/@playwright/test/index.mjs'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const outputDir = path.dirname(fileURLToPath(import.meta.url))
const evidence = { url: 'http://127.0.0.1:4174/components/lxtransferpanel', responses: [], consoleErrors: [], pageErrors: [] }
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, colorScheme: 'light', reducedMotion: 'reduce' })
const page = await context.newPage()
page.on('response', (response) => {
  if (response.status() >= 400) evidence.responses.push({ status: response.status(), url: response.url() })
})
page.on('console', (message) => {
  if (message.type() === 'error') evidence.consoleErrors.push(message.text())
})
page.on('pageerror', (error) => evidence.pageErrors.push(error.message))
await page.goto(evidence.url, { waitUntil: 'domcontentloaded', timeout: 20000 })
await page.locator('.transfer-panel-demo__preview').waitFor({ state: 'visible', timeout: 10000 })
await page.waitForTimeout(500)
evidence.pageTitle = await page.title()
evidence.actualUrl = page.url()
await writeFile(path.join(outputDir, 'resource-errors.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
await browser.close()
console.log(JSON.stringify(evidence, null, 2))
