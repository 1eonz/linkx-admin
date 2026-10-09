import { chromium } from 'file:///C:/Users/Administrator/.codex/tmp/pw-assessment/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';
const out='F:/work/linkx-admin/.impeccable/critique/wave8-searchbar-2026-10-10/assessment-b/browser';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const ctx=await browser.newContext({viewport:{width:1440,height:900}}); const p=await ctx.newPage(); const logs=[]; p.on('console',m=>logs.push({type:m.type(),text:m.text()}));
await p.goto('http://127.0.0.1:4173/components/lxsearchbar',{waitUntil:'networkidle'}); await p.addScriptTag({url:'http://127.0.0.1:8400/detect.js?token=2718fa3b-ae0b-4082-84ef-9dadc2027201'}); await p.waitForTimeout(1200);
const states={};
async function snap(name){await p.screenshot({path:`${out}/${name}.png`,fullPage:true}); states[name]=await p.evaluate(()=>({status:[...document.querySelectorAll('[role=status]')].map(x=>x.textContent?.trim()),expanded:document.querySelector('.lx-search-bar__collapse')?.getAttribute('aria-expanded'),focused:document.activeElement?.outerHTML?.slice(0,180),scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));}
await snap('state-default');
await p.getByRole('button',{name:'空结果'}).click(); await p.getByRole('button',{name:'查询'}).click(); await p.waitForTimeout(400); await snap('state-empty');
await p.getByRole('button',{name:'失败'}).click(); await p.getByRole('button',{name:'查询'}).click(); await p.waitForTimeout(400); await snap('state-error');
await p.getByRole('button',{name:'成功'}).click(); await p.getByRole('button',{name:'查询'}).click(); await p.waitForTimeout(400); await snap('state-recovered');
await p.getByRole('button',{name:'展开'}).click(); await snap('state-expanded'); await p.getByRole('button',{name:'收起'}).click(); await snap('state-collapsed');
const input=p.locator('input').first(); await input.focus(); await snap('state-keyboard-focus'); await input.press('Escape'); await p.waitForTimeout(100); states.escape=await p.evaluate(()=>[...document.querySelectorAll('[role=status]')].map(x=>x.textContent?.trim()));
fs.writeFileSync(`${out}/interaction.json`,JSON.stringify({states,logs},null,2)); await ctx.close(); await browser.close();
