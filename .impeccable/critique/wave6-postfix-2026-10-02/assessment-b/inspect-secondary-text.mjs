import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '../../../../other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright/index.mjs'

const outputPath = fileURLToPath(new URL('./secondary-text-elements-postcontrast.json', import.meta.url))
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const results = []

for (const path of ['/components/lxtreeselect.html', '/components/lxcascader.html']) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(`http://127.0.0.1:4174${path}`, { waitUntil: 'networkidle' })
  await page.locator(path.includes('tree') ? '.lx-tree-select-demo' : '.cascader-demo').scrollIntoViewIfNeeded()
  results.push(await page.evaluate(() => ({
    url: location.pathname,
    matches: [...document.querySelectorAll('body *')]
      .map((element) => {
        const style = getComputedStyle(element)
        if (style.color !== 'rgb(134, 144, 156)') return undefined
        const bounds = element.getBoundingClientRect()
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === 'string' ? element.className : '',
          text: element.textContent?.trim().slice(0, 160),
          color: style.color,
          background: style.backgroundColor,
          fontSize: style.fontSize,
          rect: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
        }
      })
      .filter(Boolean),
  })))
  await page.close()
}

await writeFile(outputPath, JSON.stringify(results, null, 2), 'utf8')
await browser.close()
console.log(JSON.stringify(results.map(({ url, matches }) => ({ url, matches: matches.length })), null, 2))
