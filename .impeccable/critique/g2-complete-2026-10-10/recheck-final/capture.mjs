import fs from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('F:/work/linkx-admin/other-admin/admin-vue3/node_modules/@playwright/test')

const out = 'F:/work/linkx-admin/.impeccable/critique/g2-complete-2026-10-10/recheck-final'
const detector = fs.readFileSync('C:/Users/Administrator/.codex/skills/impeccable/scripts/detector/detect-antipatterns-browser.js', 'utf8')
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
const context = await browser.newContext()
const page = await context.newPage({ viewport: { width: 1440, height: 1000 } })
const evidence = { generatedAt: new Date().toISOString(), pages: {}, detector: {}, screenshots: [] }
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function injectAndScan() {
  await page.addScriptTag({ content: detector })
  return page.evaluate(() => {
    window.__IMPECCABLE_CONFIG__ = { autoScan: false, visualContrast: false }
    const findings = typeof window.impeccableDetect === 'function' ? window.impeccableDetect({ visualContrast: false }) : []
    if (typeof window.impeccableScan === 'function') window.impeccableScan({ visualContrast: false })
    return { injected: Boolean(window.impeccableDetect), findings, overlayCount: document.querySelectorAll('[class*="impeccable"]').length }
  })
}
async function capture(name, url, viewport) {
  await page.setViewportSize(viewport)
  await page.goto(url, { waitUntil: 'networkidle' })
  await sleep(300)
  const data = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    viewport: { width: innerWidth, height: innerHeight },
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    roleSearch: Boolean(document.querySelector('[role="search"]')),
    bodyText: document.body.innerText.slice(0, 1200),
  }))
  const scan = await injectAndScan()
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: false })
  evidence.pages[name] = data
  evidence.detector[name] = scan
}
await capture('searchbar-desktop-1440', 'http://127.0.0.1:4177/components/lxsearchbar', { width: 1440, height: 1000 })
evidence.pages['searchbar-desktop-1440'].fourFieldRows = await page.evaluate(() => {
  const standard = document.querySelector('.lx-search-demo__standard')
  const fields = [...(standard?.querySelectorAll('.lx-search-bar__field') || [])].slice(0, 4)
  return { found: Boolean(standard), rows: [...new Set(fields.map((el) => Math.round(el.getBoundingClientRect().y)))].length }
})
await capture('searchbar-mobile-375', 'http://127.0.0.1:4177/components/lxsearchbar', { width: 375, height: 900 })
await capture('statusswitch-desktop-1440', 'http://127.0.0.1:4177/components/lxstatusswitch', { width: 1440, height: 1000 })
evidence.pages['statusswitch-desktop-1440'].aria = await page.evaluate(() => [...document.querySelectorAll('[role="switch"], .lx-status-switch__fallback')].map((el) => ({ role: el.getAttribute('role'), labelledby: el.getAttribute('aria-labelledby'), describedby: el.getAttribute('aria-describedby'), label: el.getAttribute('aria-label') })))
const switchButton = page.locator('[data-testid="confirm-row"] .el-switch').first()
if (await switchButton.count()) await switchButton.click()
await sleep(300)
evidence.pages['statusswitch-desktop-1440'].confirm = await page.evaluate(() => ({ dialog: document.querySelector('[role="dialog"]')?.textContent?.trim(), inBody: Boolean(document.querySelector('body [role="dialog"]')) }))
await page.screenshot({ path: `${out}/statusswitch-confirm-1440.png`, fullPage: false })
await capture('statusswitch-mobile-375', 'http://127.0.0.1:4177/components/lxstatusswitch', { width: 375, height: 900 })
await page.emulateMedia({ reducedMotion: 'reduce' })
evidence.pages['statusswitch-mobile-375'].reducedMotion = await page.evaluate(() => ({ matches: matchMedia('(prefers-reduced-motion: reduce)').matches, transitions: [...document.querySelectorAll('[role="switch"]')].map((el) => getComputedStyle(el).transitionDuration) }))
fs.writeFileSync(`${out}/browser-evidence.json`, JSON.stringify(evidence, null, 2))
await browser.close()
console.log(JSON.stringify(evidence, null, 2))
