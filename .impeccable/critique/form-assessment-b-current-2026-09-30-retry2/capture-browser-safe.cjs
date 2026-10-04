const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const outputDir = path.join(__dirname, 'browser-safe')
const overlayUrl = 'http://127.0.0.1:8400/detect.js'
const cases = [
  { key:'lxform-desktop', route:'lxform', width:1280, height:800 },
  { key:'lxform-375', route:'lxform', width:375, height:812 },
  { key:'lxdynamicform-desktop', route:'lxdynamicform', width:1280, height:800 },
  { key:'lxdynamicform-375', route:'lxdynamicform', width:375, height:812 },
  { key:'lxdynamicform-hud-reduced-desktop', route:'lxdynamicform', width:1280, height:800, hud:true, reducedMotion:true },
  { key:'lxdynamicform-hud-reduced-375', route:'lxdynamicform', width:375, height:812, hud:true, reducedMotion:true },
]
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
async function main(){
  await fs.mkdir(outputDir,{recursive:true})
  const browser=await chromium.launch({headless:true})
  const records=[]
  try{
    for(const item of cases){
      const page=await browser.newPage({viewport:{width:item.width,height:item.height},reducedMotion:item.reducedMotion?'reduce':'no-preference',colorScheme:item.hud?'dark':'light'})
      page.setDefaultTimeout(5000)
      const consoleMessages=[],pageErrors=[],failedRequests=[],requestedOrigins=new Set()
      page.on('console',message=>consoleMessages.push({type:message.type(),text:message.text()}))
      page.on('pageerror',error=>pageErrors.push(String(error)))
      page.on('request',request=>{try{requestedOrigins.add(new URL(request.url()).origin)}catch{}})
      page.on('requestfailed',request=>failedRequests.push({url:request.url(),error:request.failure()?.errorText??'unknown'}))
      const url=`http://127.0.0.1:4174/components/${item.route}.html`
      let response=null; let navigationError=null
      try{response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:15000}); await page.locator('.vp-doc').waitFor({state:'visible',timeout:10000}); await sleep(300)}catch(error){navigationError=String(error)}
      if(navigationError){records.push({case:item.key,url,httpStatus:response?.status()??null,navigationError,viewport:{width:item.width,height:item.height},failedRequests,pageErrors,consoleMessages}); await page.close(); continue}
      await page.evaluate(()=>{document.title=`[Human] ${document.title}`; window.scrollTo(0,0)})
      let injectionError=null
      try{await page.addScriptTag({url:overlayUrl}); await sleep(1800)}catch(error){injectionError=String(error)}
      let hudClickError=null
      if(item.hud){
        try{const hud=page.locator('.dynamic-form-demo__toolbar label').filter({hasText:'HUD 深色主题'}); if(await hud.count()){await hud.first().click({timeout:3000}); await sleep(800)} else hudClickError='HUD 深色主题 control not found'}catch(error){hudClickError=String(error)}
      }
      const demoRoot=item.route==='lxform'?page.locator('.demo-box').first():page.locator('.dynamic-form-demo').first()
      try{await demoRoot.evaluate(element=>element.scrollIntoView({block:'start'})); await sleep(250)}catch{}
      let invalidState=null
      if(item.route==='lxform' && item.key==='lxform-desktop'){
        try{const button=page.getByRole('button',{name:'提交校验'}).first(); if(await button.count()){await button.click({timeout:3000}); await sleep(250); invalidState=await page.locator('.el-form-item.is-error').count(); await page.screenshot({path:path.join(outputDir,'lxform-desktop-invalid-overlay.png'),animations:'disabled'})}}catch(error){invalidState={error:String(error)}}
      }
      const overlayEvidence=await page.evaluate(()=>{
        const nodes=[...document.querySelectorAll('.impeccable-overlay')]
        const visible=nodes.filter(node=>{const style=getComputedStyle(node); return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>0})
        const labels=visible.slice(0,40).map(node=>({text:(node.textContent||'').trim().slice(0,240),className:node.className,html:node.outerHTML.slice(0,600)}))
        return {detectorScriptPresent:[...document.scripts].some(script=>script.src.includes('/detect.js')),overlayNodeCount:nodes.length,visibleOverlayNodeCount:visible.length,labels,reducedMotionMatches:matchMedia('(prefers-reduced-motion: reduce)').matches,hudThemeApplied:Boolean(document.querySelector('.dynamic-form-demo.lx-theme-hud'))}
      })
      const screenshotPath=path.join(outputDir,`${item.key}-overlay.png`); await page.screenshot({path:screenshotPath,animations:'disabled'})
      records.push({case:item.key,url,httpStatus:response?.status()??null,title:await page.title(),viewport:{width:item.width,height:item.height},emulatedReducedMotion:item.reducedMotion===true,emulatedColorScheme:item.hud?'dark':'light',injectionError,hudClickError,overlayEvidence,invalidFormItemCountAfterEmptySubmit:invalidState,screenshot:path.basename(screenshotPath),requestedOrigins:[...requestedOrigins].sort(),failedRequests,pageErrors,consoleMessages})
      await fs.writeFile(path.join(outputDir,`${item.key}.overlay.json`),JSON.stringify(records[records.length-1],null,2)+'\n')
      await page.close()
    }
  } finally {await browser.close()}
  await fs.writeFile(path.join(outputDir,'browser-overlay-evidence.json'),JSON.stringify(records,null,2)+'\n')
  process.stdout.write(JSON.stringify(records.map(({case:name,httpStatus,navigationError,injectionError,hudClickError,overlayEvidence,screenshot,invalidFormItemCountAfterEmptySubmit})=>({name,httpStatus,navigationError,injectionError,hudClickError,detectorScriptPresent:overlayEvidence?.detectorScriptPresent??false,overlayNodeCount:overlayEvidence?.overlayNodeCount??null,visibleOverlayNodeCount:overlayEvidence?.visibleOverlayNodeCount??null,screenshot,invalidFormItemCountAfterEmptySubmit})),null,2)+'\n')
}
main().catch(error=>{process.stderr.write((error?.stack||error)+'\n');process.exitCode=1})
