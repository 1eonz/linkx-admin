const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')

const baseURL = 'http://127.0.0.1:4180'
const outputDir = path.join(__dirname, 'form-focus-postfix-2026-09-30')

async function inspectForm(page, view, width) {
  await page.setViewportSize({ width, height: width < 500 ? 812 : 800 })
  await page.goto(`${baseURL}/components/lxform.html`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: '提交校验' }).click()
  await page.waitForTimeout(120)
  const state = await page.evaluate(() => ({
    activeTag: document.activeElement?.tagName ?? null,
    activeClass: document.activeElement?.className ?? null,
    activeInvalid: document.activeElement?.getAttribute('aria-invalid') ?? null,
    activeLabel:
      document.activeElement?.closest('.el-form-item')?.querySelector('.el-form-item__label')
        ?.textContent ?? null,
    invalidCount: document.querySelectorAll('.el-form-item.is-error').length,
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }))
  await page.screenshot({
    path: path.join(outputDir, `${view}.png`),
    fullPage: true,
  })
  return state
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true })
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const requests = []
  page.on('request', (request) => requests.push(request.url()))

  try {
    const desktop = await inspectForm(page, 'lxform-desktop', 1280)
    const mobile = await inspectForm(page, 'lxform-mobile', 375)
    const externalRequests = requests.filter(
      (url) => new URL(url).origin !== new URL(baseURL).origin,
    )
    const result = {
      status: 'passed',
      desktop,
      mobile,
      externalRequests,
      focusContract:
        desktop.activeLabel === '任务名称' &&
        mobile.activeLabel === '任务名称' &&
        desktop.activeInvalid === 'true' &&
        mobile.activeInvalid === 'true',
    }
    await fs.writeFile(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(result, null, 2)}\n`)
    if (!result.focusContract) throw new Error(`首错焦点契约失败：${JSON.stringify(result)}`)
    if (externalRequests.length) throw new Error(`发现非本地请求：${externalRequests.join(', ')}`)
    process.stdout.write('LxForm focus browser verification passed\n')
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`)
  process.exitCode = 1
})
