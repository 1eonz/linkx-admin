import { chromium } from 'file:///C:/Users/Administrator/.codex/tmp/pw-assessment/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';
const out='F:/work/linkx-admin/.impeccable/critique/wave8-searchbar-2026-10-10/assessment-b/browser'; fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const views=[['light-desktop',1440,900,false],['light-mobile',375,900,false],['hud-desktop',1440,900,true],['hud-mobile',375,900,true],['reduced-motion',1440,900,false]];
for(const [name,w,h,dark] of views){
 const context=await browser.newContext({viewport:{width:w,height:h}, colorScheme:dark?'dark':'light', reducedMotion:name==='reduced-motion'?'reduce':'no-preference'});
 const page=await context.newPage(); const logs=[]; page.on('console',m=>logs.push({type:m.type(),text:m.text()}));
 await page.goto('http://127.0.0.1:4173/components/lxsearchbar',{waitUntil:'networkidle'});
 if(dark){const btn=page.locator('button').filter({hasText:/深色|dark/i}).first(); if(await btn.count()) await btn.click().catch(()=>{}); else await page.evaluate(()=>document.documentElement.classList.add('dark'))}
 await page.waitForTimeout(500);
 const pre=await page.evaluate(()=>{document.title='[Human] LxSearchBar'; return {title:document.title,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,inputs:document.querySelectorAll('input').length,buttons:[...document.querySelectorAll('button')].map(b=>b.innerText).slice(0,20)}});
 let inject='failed'; try { await page.addScriptTag({url:'http://127.0.0.1:8400/detect.js?token=2718fa3b-ae0b-4082-84ef-9dadc2027201'}); inject='succeeded'; } catch(e){logs.push({type:'error',text:'inject '+e.message})}
 await page.waitForTimeout(2500);
 await page.screenshot({path:`${out}/${name}.png`,fullPage:true});
 fs.writeFileSync(`${out}/${name}.json`,JSON.stringify({name,viewport:{w,h},dark,reducedMotion:name==='reduced-motion',preflight:pre,injection:inject,logs},null,2));
 await context.close();
}
await browser.close();
