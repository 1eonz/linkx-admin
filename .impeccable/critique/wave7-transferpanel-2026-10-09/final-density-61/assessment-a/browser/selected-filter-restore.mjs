import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('F:/work/linkx-admin/other-admin/admin-vue3/node_modules/@playwright/test')
const out = new URL('../', import.meta.url)
const b = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'})
const p = await b.newPage({viewport:{width:390,height:844}})
await p.goto('http://127.0.0.1:4174/components/lxtransferpanel',{waitUntil:'networkidle'}); await p.waitForTimeout(500)
await p.getByTestId('mobile-selected-panel').click(); await p.waitForTimeout(200)
const long=p.locator('.lx-transfer-panel__selected-item').filter({hasText:'历史授权单位'}).first(); await long.locator('summary').focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(300)
const input=p.locator('input[placeholder*="已选"]').first(); await input.fill('历史授权单位'); await p.waitForTimeout(300)
const hidden=await p.locator('.lx-transfer-panel__selected-item').evaluateAll(es=>es.map(e=>({text:e.innerText.slice(0,30),display:getComputedStyle(e).display,open:!!e.querySelector('details[open]')})))
await input.fill(''); await p.waitForTimeout(300)
const restored=await p.locator('.lx-transfer-panel__selected-item').filter({hasText:'历史授权单位'}).first().evaluate(e=>({open:!!e.querySelector('details[open]'),height:e.getBoundingClientRect().height,remove:(()=>{const r=e.querySelector('button').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()}))
await p.screenshot({path:fileURLToPath(new URL('browser/selected-filter-restore.png',out)),fullPage:true})
await fs.writeFile(new URL('browser/selected-filter-restore.json',out),JSON.stringify({hidden,restored},null,2))
await b.close()
