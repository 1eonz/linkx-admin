import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require(
  'C:/Users/Administrator/AppData/Local/OpenAI/Codex/runtimes/cua_node/cfb32733c877621e/bin/node_modules/playwright',
)

const browser = await chromium.launch({
  headless: true,
  executablePath:
    'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe',
})
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const navigation = await page.goto(
  'http://127.0.0.1:4189/components/lxtransferpanel.html?assessmentB=compact-hint',
  { waitUntil: 'networkidle' },
)
await page.waitForTimeout(400)
const result = await page.evaluate(() => {
  const element = document.querySelector('[data-testid="select-all-compact-hint"]')
  const button = document.querySelector('[aria-label="全部加入"]')
  const box = element?.getBoundingClientRect()
  return {
    text: element?.textContent?.trim() ?? null,
    visible: Boolean(element && box && box.width > 0 && box.height > 0),
    ariaHidden: element?.getAttribute('aria-hidden') ?? null,
    buttonDisabled: button?.hasAttribute('disabled') ?? false,
    buttonTitle: button?.getAttribute('title') ?? null,
  }
})
result.navigationStatus = navigation?.status() ?? null
console.log(JSON.stringify(result, null, 2))
await browser.close()
