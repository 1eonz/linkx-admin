import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('F:/work/linkx-admin/other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright')
import fs from 'node:fs'
import path from 'node:path'

const out = path.resolve('.impeccable/critique/g2-complete-2026-10-10/assessment-b')
const shot = path.join(out, 'screenshots')
fs.mkdirSync(shot, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
const views = [
  {name:'searchbar-desktop-light', url:'http://127.0.0.1:4174/components/lxsearchbar', w:1440,h:1000, dark:false, reduced:false},
  {name:'searchbar-mobile-light-reduced', url:'http://127.0.0.1:4174/components/lxsearchbar', w:375,h:900, dark:false, reduced:true},
  {name:'statusswitch-desktop-hud', url:'http://127.0.0.1:4174/components/lxstatusswitch', w:1440,h:1000, dark:true, reduced:false},
  {name:'statusswitch-mobile-light-reduced', url:'http://127.0.0.1:4174/components/lxstatusswitch', w:375,h:900, dark:false, reduced:true},
]
const evidence=[]
for (const v of views) {
  const context = await browser.newContext({ viewport:{width:v.w,height:v.h}, colorScheme:v.dark?'dark':'light', reducedMotion:v.reduced?'reduce':'no-preference' })
  const page = await context.newPage()
  const consoleLogs=[]
  page.on('console', m=>consoleLogs.push({type:m.type(),text:m.text()}))
  await page.goto(v.url, {waitUntil:'networkidle', timeout:30000})
  await page.evaluate(()=>{ document.title='[Human] Assessment B'; window.__impeccableInjectionPreflight=true })
  let overlayInjected = false
  try { const detectSource = await (await fetch('http://127.0.0.1:8400/detect.js')).text(); await page.addScriptTag({content:detectSource}); overlayInjected = true; await page.waitForTimeout(2200) } catch (e) { consoleLogs.push({type:'error',text:'overlay injection failed: '+e.message}) }
  await page.screenshot({path:path.join(shot,v.name+'-initial.png'), fullPage:true})
  const body = await page.locator('body').innerText().catch(()=> '')
  const metrics = await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth, focus:document.activeElement?.outerHTML?.slice(0,200)}))
  const buttons = await page.locator('button').allTextContents().catch(()=>[])
  if (v.name.startsWith('searchbar')) {
    const triggers=page.locator('button').filter({hasText:/展开|检索|查询|搜索/})
    if (await triggers.count()) { await triggers.first().click().catch(()=>{}); await page.screenshot({path:path.join(shot,v.name+'-expanded.png'),fullPage:true}) }
    await page.keyboard.press('Tab'); await page.screenshot({path:path.join(shot,v.name+'-focus.png'),fullPage:true})
  } else {
    const switches=page.locator('button,[role="switch"],input[type="checkbox"]')
    if (await switches.count()) { await switches.first().focus().catch(()=>{}); await page.screenshot({path:path.join(shot,v.name+'-focus.png'),fullPage:true}) }
  }
  evidence.push({name:v.name,url:v.url,viewport:{w:v.w,h:v.h},dark:v.dark,reduced:v.reduced,metrics,buttons,bodySnippet:body.slice(0,1200),console:consoleLogs, injection:await page.evaluate(()=>window.__impeccableInjectionPreflight===true),overlayInjected,overlayText:await page.locator('body').innerText().catch(()=> '')})
  await context.close()
}
await browser.close()
fs.writeFileSync(path.join(out,'browser-evidence.json'), JSON.stringify(evidence,null,2))
console.log(JSON.stringify(evidence,null,2))
