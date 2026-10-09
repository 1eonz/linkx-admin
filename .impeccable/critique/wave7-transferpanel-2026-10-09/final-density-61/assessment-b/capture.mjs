import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'

const root = 'F:/work/linkx-admin'
const out = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'))
const require = createRequire(`${root}/other-admin/admin-vue3/package.json`)
const { chromium } = require('@playwright/test')
const skill = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs'
const files = ['linkx-fe/src/components/LxTransferPanel/index.vue', 'linkx-fe/src/components/LxTransferPanel/demo/basic.vue', 'linkx-fe/docs/components/lxtransferpanel.md']
const hash = () => Object.fromEntries(files.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]))
const write = (name, data) => fs.writeFileSync(path.join(out, name), typeof data === 'string' ? data : JSON.stringify(data, null, 2))
fs.mkdirSync(path.join(out, 'screenshots'), { recursive: true })
write('source-before.json', hash())
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
let started = false
const summary = { started: new Date().toISOString(), views: [], console: [], errors: [] }
try {
  const preflightPage = await browser.newPage()
  await preflightPage.goto('http://127.0.0.1:4174/components/lxtransferpanel')
  await preflightPage.locator('.lx-transfer-panel').waitFor()
  summary.preflight = await preflightPage.evaluate(() => {
    document.title = '[Human] Assessment B - 注入预检'
    const script = document.createElement('script')
    script.id = 'assessment-b-preflight'
    script.textContent = 'window.__assessmentBInjected = true;'
    document.head.append(script)
    return { title: document.title, tag: !!document.querySelector('#assessment-b-preflight'), executed: window.__assessmentBInjected === true }
  })
  if (!summary.preflight.executed) throw Error('浏览器注入预检失败')
  const server = spawnSync(process.execPath, [skill, '--background', '--port=8461'], { cwd: out, encoding: 'utf8' })
  write('overlay-server-start.json', { command: [process.execPath, skill, '--background', '--port=8461'], cwd: out, stdout: server.stdout, stderr: server.stderr, exitCode: server.status })
  if (server.status !== 0) throw Error('独立 overlay 服务启动失败')
  started = true
  const info = JSON.parse(server.stdout.trim())
  summary.overlayServer = { pid: info.pid, port: info.port, stopCommand: `node "${skill}" stop --keep-inject (cwd: ${out})` }
  await preflightPage.close()
  for (const theme of ['light', 'hud']) for (const width of [1440, 390, 320]) {
    const name = `${theme}-${width}`
    const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 1000 : 900 }, reducedMotion: 'reduce' })
    const consoleRows = []
    page.on('console', message => consoleRows.push({ type: message.type(), text: message.text() }))
    page.on('pageerror', error => summary.errors.push({ view: name, error: error.message }))
    await page.goto('http://127.0.0.1:4174/components/lxtransferpanel')
    await page.locator('.lx-transfer-panel').waitFor()
    await page.evaluate(label => { document.title = `[Human] ${label} Assessment B` }, name)
    if (theme === 'hud') {
      await page.locator('.transfer-panel-demo__settings summary').click()
      await page.getByLabel('HUD 深色主题').check()
      await page.locator('.transfer-panel-demo__settings summary').click()
    }
    if (width < 768) await page.getByTestId('mobile-selected-panel').click()
    const history = page.locator('.lx-transfer-panel__selected-item').filter({ has: page.locator('[data-lx-transfer-code="LEGACY-08"]') })
    await history.waitFor()
    await history.scrollIntoViewIfNeeded()
    await page.waitForTimeout(200)
    const view = { name, theme, width, baseline: [], overlay: [] }
    const measure = async state => {
      const data = await page.evaluate(() => {
        const history = document.querySelector('[data-lx-transfer-code="LEGACY-08"]').closest('.lx-transfer-panel__selected-item')
        const list = history.closest('ul')
        const box = el => { const r = el.getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height, top:r.top, bottom:r.bottom, left:r.left, right:r.right } }
        const remove = history.querySelector('button')
        const full = history.querySelector('.lx-transfer-panel__selected-name-full')
        const text = history.querySelector('.lx-transfer-panel__selected-name')
        const listBox = box(list), removeBox = box(remove), fullBox = full ? box(full) : null
        const hitAt = (x,y) => { const target=document.elementFromPoint(x,y); return { x,y, hit: !!target && (target===remove || remove.contains(target)), tag:target?.tagName, class:target?.className?.baseVal ?? target?.className } }
        const hits = [[.5,.5],[.12,.12],[.88,.12],[.12,.88],[.88,.88]].map(([x,y]) => hitAt(removeBox.x+removeBox.width*x,removeBox.y+removeBox.height*y))
        const style = full ? getComputedStyle(full) : null
        const range = full ? document.createRange() : null; if (range) range.selectNodeContents(full)
        const lines = range ? [...range.getClientRects()].map(r=>({top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height})) : []
        return {
          viewport:{width:innerWidth,height:innerHeight}, page:{clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth},
          history:box(history), list:{...listBox,clientHeight:list.clientHeight,scrollHeight:list.scrollHeight,scrollTop:list.scrollTop,maxScroll:list.scrollHeight-list.clientHeight},
          expanded:history.querySelector('details')?.open, summary:{...box(history.querySelector('summary')),label:history.querySelector('summary')?.getAttribute('aria-label')},
          collapsedName:{...box(text),clientHeight:text.clientHeight,scrollHeight:text.scrollHeight,lineHeight:getComputedStyle(text).lineHeight,display:getComputedStyle(text).display},
          full:full ? {...fullBox,text:full.textContent.trim(),display:style.display,lineHeight:style.lineHeight,lines,visibleLines:lines.filter(r=>r.top>=Math.max(0,listBox.top)-.5 && r.bottom<=Math.min(innerHeight,listBox.bottom)+.5).length} : {present:false,lines:[]},
          remove:{...removeBox,label:remove.getAttribute('aria-label'),withinList:removeBox.top>=listBox.top-.5 && removeBox.bottom<=listBox.bottom+.5,withinViewport:removeBox.top>=0 && removeBox.bottom<=innerHeight,hits},
          componentBackground:getComputedStyle(document.querySelector('.lx-transfer-panel')).backgroundColor,
          sourceVisible:getComputedStyle(document.querySelector('.lx-transfer-panel__panel')).display,
        }
      })
      write(`${name}-${state}-baseline.json`, data)
      await page.screenshot({ path:path.join(out,'screenshots',`${name}-${state}-baseline.png`) })
      view.baseline.push({state,...data})
    }
    await measure('collapsed-bottom')
    await history.locator('summary').click()
    await history.locator('summary').scrollIntoViewIfNeeded()
    await page.waitForTimeout(200)
    await measure('expanded-top')
    await page.locator('.lx-transfer-panel__selected').evaluate(el=>{el.scrollTop=el.scrollHeight})
    await page.waitForTimeout(200)
    await measure('expanded-bottom')
    await page.evaluate(() => scrollTo(0,0))
    await page.addScriptTag({ url:`http://127.0.0.1:${info.port}/detect.js` })
    await page.waitForTimeout(3000)
    view.injection = await page.evaluate(() => ({ script:!!document.querySelector('script[src$="/detect.js"]'),scan:typeof window.impeccableScan,detect:typeof window.impeccableDetect,title:document.title }))
    const overlay = async state => {
      const data = await page.evaluate(async () => {
        const raw = await window.impeccableScanAsync()
        const box = el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}}
        return { groups:raw.map(({el,findings})=>({tag:el.tagName,class:el.className?.baseVal??el.className,text:el.textContent.trim().slice(0,160),component:!!el.closest('.lx-transfer-panel'),demo:!!el.closest('.transfer-panel-demo'),rect:box(el),visible:!!(el.offsetWidth||el.offsetHeight||el.getClientRects().length),hiddenAncestor:!!el.closest('.is-mobile-hidden'),findings})),overlayCount:document.querySelectorAll('.impeccable-overlay').length,bannerCount:document.querySelectorAll('.impeccable-banner').length }
      })
      await page.waitForTimeout(1000)
      write(`${name}-${state}-overlay.json`,data)
      await page.screenshot({path:path.join(out,'screenshots',`${name}-${state}-overlay.png`)})
      view.overlay.push({state,...data})
    }
    await history.locator('summary').click()
    await history.scrollIntoViewIfNeeded()
    await overlay('collapsed-bottom')
    await history.locator('summary').click()
    await history.locator('summary').scrollIntoViewIfNeeded()
    await overlay('expanded-top')
    await page.locator('.lx-transfer-panel__selected').evaluate(el=>{el.scrollTop=el.scrollHeight})
    await overlay('expanded-bottom')
    write(`${name}-console.json`,consoleRows)
    summary.views.push(view)
    write('browser-evidence.json',summary)
    await page.close()
  }
} catch(error) {
  summary.failure = { message:error.message,stack:error.stack }
  process.exitCode = 1
} finally {
  if(started){
    const stopped=spawnSync(process.execPath,[skill,'stop','--keep-inject'],{cwd:out,encoding:'utf8'})
    write('overlay-server-stop.json',{stdout:stopped.stdout,stderr:stopped.stderr,exitCode:stopped.status})
  }
  write('source-after.json',hash())
  summary.sourceUnchanged = JSON.stringify(hash())===fs.readFileSync(path.join(out,'source-before.json'),'utf8').replace(/\s/g,'')
  summary.finished = new Date().toISOString()
  write('browser-evidence.json',summary)
  await browser.close()
  console.log(JSON.stringify({ views:summary.views.length,preflight:summary.preflight,failure:summary.failure,errors:summary.errors,sourceBefore:JSON.parse(fs.readFileSync(path.join(out,'source-before.json'),'utf8')),sourceAfter:hash() }))
}
