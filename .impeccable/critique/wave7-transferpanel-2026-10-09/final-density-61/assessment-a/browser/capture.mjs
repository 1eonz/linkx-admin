import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('F:/work/linkx-admin/other-admin/admin-vue3/node_modules/@playwright/test')

const out = new URL('../', import.meta.url)
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
const context = await browser.newContext({ locale: 'zh-CN' })
const page = await context.newPage()
const base = 'http://127.0.0.1:4174/components/lxtransferpanel'

async function settle() { await page.waitForTimeout(700) }
async function snap(name) {
  await page.screenshot({ path: fileURLToPath(new URL(`browser/${name}.png`, out)), fullPage: true })
}
async function report(name, data) {
  await fs.writeFile(new URL(`browser/${name}.json`, out), JSON.stringify(data, null, 2))
}
async function geometry(label) {
  return await page.evaluate((label) => {
    const q = (s) => document.querySelector(s)
    const rect = (s) => { const r = q(s)?.getBoundingClientRect(); return r ? { x:r.x,y:r.y,width:r.width,height:r.height, right:r.right,bottom:r.bottom } : null }
    const list = q('.lx-transfer-panel__selected')
    return {
      label, viewport: { width: innerWidth, height: innerHeight },
      scrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth,
      panels: [...document.querySelectorAll('.lx-transfer-panel__panel')].map((e) => ({ hidden: e.classList.contains('is-mobile-hidden'), rect: (()=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()})),
      selectedList: rect('.lx-transfer-panel__selected'), selectedItems: [...document.querySelectorAll('.lx-transfer-panel__selected-item')].map((e)=>({ text:e.innerText.slice(0,120), rect:(()=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}})(), expanded: !!e.querySelector('details[open]'), remove: (()=>{const r=e.querySelector('button')?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}:null})() })),
      longName: (()=>{const e=[...document.querySelectorAll('.lx-transfer-panel__selected-name')].find(e=>e.textContent?.includes('历史授权单位')); if(!e)return null; const r=e.getBoundingClientRect(); return {text:e.textContent, width:r.width,height:r.height, scrollWidth:e.scrollWidth, scrollHeight:e.scrollHeight, tabIndex:e.closest('summary')?.getAttribute('tabindex')}})(),
      selectedHint: q('.lx-transfer-panel__selected-scroll-hint')?.textContent?.trim() || null,
      active: document.activeElement?.outerHTML?.slice(0,240) || null,
      sourceFilter: q('input[placeholder*="机构"]')?.value || '', selectedFilter: q('input[placeholder*="已选"]')?.value || ''
    }
  }, label)
}

async function viewportRun(width, height) {
  await page.setViewportSize({ width, height })
  await page.goto(base, { waitUntil: 'networkidle' }); await settle()
  await snap(`initial-${width}`)
  const initial = await geometry('initial')
  await page.locator('.transfer-panel-demo__settings > summary').click(); await settle()
  const hudToggle = page.getByLabel('HUD 深色主题')
  if (await hudToggle.count()) { await hudToggle.check(); await settle(); await snap(`hud-${width}`) }
  const hud = await geometry('hud')
  if (await hudToggle.count()) { await hudToggle.uncheck(); await settle() }
  return { initial, hud }
}

const data = {}
data.desktop1440 = await viewportRun(1440, 900)
data.desktop1024 = await viewportRun(1024, 800)
data.mobile390 = await viewportRun(390, 844)
data.mobile320 = await viewportRun(320, 780)

await page.setViewportSize({ width: 390, height: 844 }); await page.goto(base, { waitUntil: 'networkidle' }); await settle()
const selectedTab = page.getByTestId('mobile-selected-panel'); await selectedTab.click(); await settle()
const long = page.locator('.lx-transfer-panel__selected-item').filter({ hasText: '历史授权单位' }).first()
const longSummary = long.locator('summary')
await long.scrollIntoViewIfNeeded(); await settle()
const beforeExpand = await geometry('long-before-expand')
await longSummary.focus(); const keyStart = await geometry('long-focused')
await page.keyboard.press('Enter'); await settle(); const enterExpanded = await geometry('long-enter-expanded')
await page.keyboard.press('Space'); await settle(); const spaceCollapsed = await geometry('long-space-collapsed')
await page.keyboard.press('Enter'); await settle(); const enterExpandedAgain = await geometry('long-enter-expanded-again')
const list = page.locator('.lx-transfer-panel__selected')
await list.evaluate((e) => { e.scrollTop = e.scrollHeight })
await page.waitForTimeout(300); const bottom = await geometry('selected-bottom')
await snap('mobile390-selected-bottom-expanded')
const removeRects = await page.locator('.lx-transfer-panel__selected-item button').evaluateAll((els) => els.map((e)=>{const r=e.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom, text:e.getAttribute('aria-label')}}))
const centerHit = await page.evaluate(() => { const b=[...document.querySelectorAll('.lx-transfer-panel__selected-item button')].find(e=>e.getAttribute('aria-label')?.includes('移除')); if(!b)return null; const r=b.getBoundingClientRect(); const t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2); return {target:t?.tagName, aria:t?.getAttribute('aria-label'), rect:{x:r.x,y:r.y,width:r.width,height:r.height}} })
const sourceTab = page.getByTestId('mobile-source-panel'); await sourceTab.click(); await settle()
const sourceInput = page.locator('input[placeholder*="机构"]').first(); await sourceInput.fill('历史归档单位 01'); await settle(); const filtered = await geometry('filtered')
await sourceInput.fill(''); await settle(); const cleared = await geometry('cleared-filter')
await report('interaction-evidence', { beforeExpand, keyStart, enterExpanded, spaceCollapsed, enterExpandedAgain, bottom, removeRects, centerHit, filtered, cleared })
await snap('mobile390-cleared-filter')

await page.setViewportSize({ width: 320, height: 780 }); await page.goto(base, { waitUntil: 'networkidle' }); await settle(); await page.getByTestId('mobile-selected-panel').click(); await settle(); await snap('mobile320-selected')
data.interactions = { viewport:{width:390,height:844}, ...await geometry('final') }
await report('viewport-evidence', data)

await context.close(); await browser.close()
const files = await fs.readdir(new URL('browser/', out))
const hashes=[]
for (const f of files.filter((f)=>f.endsWith('.png')||f.endsWith('.json'))) { const b=await fs.readFile(new URL(`browser/${f}`,out)); hashes.push(`${crypto.createHash('sha256').update(b).digest('hex')}  ${f}`) }
await fs.writeFile(new URL('browser/evidence-sha256.txt', out), hashes.join('\n')+'\n')
