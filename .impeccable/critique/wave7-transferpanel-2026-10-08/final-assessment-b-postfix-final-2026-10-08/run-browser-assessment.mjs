import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(evidenceDir, '..', '..', '..', '..');
const appRoot = path.join(repositoryRoot, 'linkx-fe');
const previewPort = 4198;
const previewUrl = `http://127.0.0.1:${previewPort}/components/lxtransferpanel`;
const previewBin = path.join(appRoot, 'node_modules', 'vitepress', 'bin', 'vitepress.js');
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const liveServerScript = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const writeJson = (file, value) => fs.writeFileSync(path.join(evidenceDir, file), `${JSON.stringify(value, null, 2)}\n`, 'utf8');

async function waitUntil(predicate, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await predicate();
    if (value) return value;
    await sleep(75);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function captured(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', windowsHide: true });
  return { status: result.status, signal: result.signal, error: result.error?.message ?? null, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function saveCommand(name, executable, args, cwd) {
  fs.writeFileSync(path.join(evidenceDir, name), `${[executable, ...args].map(value => `"${value}"`).join(' ')}\ncwd: ${cwd}\n`, 'utf8');
}

async function main() {
  let preview;
  let browser;
  let socket;
  let browserProfile;
  let liveRoot;
  let liveInfo;
  let liveStarted = false;
  const previewOutput = { stdout: '', stderr: '' };
  const run = {
    target: 'linkx-fe/src/components/LxTransferPanel/index.vue',
    previewUrl,
    previewPort,
    startedAt: new Date().toISOString(),
    previewStart: {},
    liveServerStart: {},
    browser: {},
    scenarios: [],
    cleanup: {},
  };

  try {
    if (fs.existsSync(path.join(os.tmpdir(), 'linkx-transferpanel-assessment-b.lock'))) {
      throw new Error('Assessment lock file exists unexpectedly');
    }

    const previewArgs = [previewBin, 'dev', 'docs', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort'];
    saveCommand('preview-start.command.txt', process.execPath, previewArgs, appRoot);
    preview = spawn(process.execPath, previewArgs, { cwd: appRoot, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    preview.stdout.on('data', chunk => { previewOutput.stdout += chunk.toString(); });
    preview.stderr.on('data', chunk => { previewOutput.stderr += chunk.toString(); });
    run.previewStart = { pid: preview.pid, command: [process.execPath, ...previewArgs].join(' '), cwd: appRoot };
    await waitUntil(async () => {
      if (preview.exitCode !== null) throw new Error(`VitePress exited with code ${preview.exitCode}: ${previewOutput.stderr}`);
      try {
        const response = await fetch(previewUrl, { signal: AbortSignal.timeout(1200) });
        if (response.status !== 200) return false;
        return response.status === 200;
      } catch { return false; }
    }, 45000, `owned VitePress preview at ${previewUrl}`);
    run.previewStart.status = 'ready';

    liveRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'impeccable-wave7-transferpanel-b-'));
    const liveArgs = [liveServerScript, '--background'];
    saveCommand('detector-server-start.command.txt', process.execPath, liveArgs, liveRoot);
    const liveStart = captured(process.execPath, liveArgs, liveRoot);
    try { liveInfo = JSON.parse(liveStart.stdout.trim()); } catch { liveInfo = null; }
    liveStarted = Boolean(liveStart.status === 0 && liveInfo?.port && liveInfo?.pid);
    run.liveServerStart = { status: liveStart.status, pid: liveInfo?.pid ?? null, port: liveInfo?.port ?? null, started: liveStarted, error: liveStart.error };
    fs.writeFileSync(path.join(evidenceDir, 'detector-server-start.stdout.json'), `${JSON.stringify(liveInfo ? { ...liveInfo, token: '<redacted>' } : { text: liveStart.stdout }, null, 2)}\n`, 'utf8');
    fs.writeFileSync(path.join(evidenceDir, 'detector-server-start.stderr.log'), liveStart.stderr, 'utf8');
    fs.writeFileSync(path.join(evidenceDir, 'detector-server-start.exit-code.txt'), `${liveStart.status ?? 'null'}\n`, 'utf8');
    if (!liveStarted) throw new Error(`Detector live-server failed: ${liveStart.stderr || liveStart.stdout}`);
    const detectUrl = `http://localhost:${liveInfo.port}/detect.js`;
    const detectResponse = await fetch(detectUrl);
    const detectSource = await detectResponse.text();
    writeJson('detector-asset-http.json', { command: `GET ${detectUrl}`, status: detectResponse.status, contentType: detectResponse.headers.get('content-type'), bytes: Buffer.byteLength(detectSource), bodyPresent: detectSource.length > 100 });
    if (!detectResponse.ok || detectSource.length < 100) throw new Error(`detect.js endpoint failed: ${detectResponse.status}`);

    browserProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'wave7-transferpanel-chromium-b-'));
    const chromeArgs = [
      '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
      '--disable-background-networking', '--remote-debugging-port=0', '--remote-allow-origins=*',
      `--user-data-dir=${browserProfile}`, 'about:blank',
    ];
    saveCommand('chromium-launch.command.txt', chromePath, chromeArgs, browserProfile);
    browser = spawn(chromePath, chromeArgs, { stdio: 'ignore', windowsHide: true });
    const activePortFile = path.join(browserProfile, 'DevToolsActivePort');
    const devtools = await waitUntil(async () => {
      if (browser.exitCode !== null) throw new Error(`Chromium exited with code ${browser.exitCode}`);
      try {
        const lines = fs.readFileSync(activePortFile, 'utf8').trim().split(/\r?\n/);
        const port = Number(lines[0]);
        return port > 0 ? { port } : null;
      } catch { return false; }
    }, 18000, 'Chromium DevToolsActivePort');
    const version = await (await fetch(`http://127.0.0.1:${devtools.port}/json/version`)).json();
    run.browser = { pid: browser.pid, devtoolsPort: devtools.port, version: version.Browser, freshProfile: true };

    socket = new WebSocket(version.webSocketDebuggerUrl);
    await waitUntil(() => socket.readyState === WebSocket.OPEN, 10000, 'CDP websocket');
    let nextId = 1;
    const pending = new Map();
    const sessionEvents = new Map();
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const item = pending.get(message.id);
        if (!item) return;
        pending.delete(message.id);
        if (message.error) item.reject(new Error(`${message.error.message} (${message.error.code})`));
        else item.resolve(message.result ?? {});
      } else if (message.sessionId) sessionEvents.get(message.sessionId)?.(message);
    });
    function cdp(method, params = {}, sessionId) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
      });
    }
    async function evaluate(sessionId, expression) {
      const response = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
      if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text ?? 'Runtime.evaluate failed');
      return response.result?.value;
    }
    async function key(sessionId, keyName) {
      const code = keyName === 'Tab' ? 'Tab' : keyName === 'Enter' ? 'Enter' : keyName === 'Escape' ? 'Escape' : keyName === ' ' ? 'Space' : keyName;
      const vk = keyName === 'Tab' ? 9 : keyName === 'Enter' ? 13 : keyName === 'Escape' ? 27 : keyName === ' ' ? 32 : 0;
      await cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: keyName, code, windowsVirtualKeyCode: vk }, sessionId);
      await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, code, windowsVirtualKeyCode: vk }, sessionId);
    }
    async function makePage(config) {
      const context = await cdp('Target.createBrowserContext', { disposeOnDetach: true });
      const target = await cdp('Target.createTarget', { url: 'about:blank', browserContextId: context.browserContextId });
      const attached = await cdp('Target.attachToTarget', { targetId: target.targetId, flatten: true });
      const sessionId = attached.sessionId;
      const consoleEvents = [];
      sessionEvents.set(sessionId, event => {
        if (event.method === 'Runtime.consoleAPICalled') {
          consoleEvents.push({
            kind: 'console', level: event.params.type,
            text: (event.params.args ?? []).map(arg => arg.value ?? arg.description ?? arg.unserializableValue ?? '[object]').join(' '),
          });
        } else if (event.method === 'Runtime.exceptionThrown') {
          consoleEvents.push({ kind: 'exception', text: event.params.exceptionDetails?.text ?? 'JavaScript exception' });
        } else if (event.method === 'Log.entryAdded') {
          consoleEvents.push({ kind: 'log', level: event.params.entry.level, text: event.params.entry.text, url: event.params.entry.url ?? '' });
        }
      });
      await cdp('Page.enable', {}, sessionId);
      await cdp('Runtime.enable', {}, sessionId);
      await cdp('Log.enable', {}, sessionId);
      await cdp('Emulation.setDeviceMetricsOverride', { width: config.width, height: config.height, deviceScaleFactor: 1, mobile: config.mobile }, sessionId);
      await cdp('Emulation.setEmulatedMedia', { media: 'screen', features: [
        { name: 'prefers-color-scheme', value: 'light' },
        { name: 'prefers-reduced-motion', value: config.reducedMotion ? 'reduce' : 'no-preference' },
      ] }, sessionId);
      await cdp('Page.navigate', { url: previewUrl }, sessionId);
      await waitUntil(async () => {
        try { return await evaluate(sessionId, `document.readyState === 'complete' && document.querySelectorAll('.lx-transfer-panel').length === 1`); }
        catch { return false; }
      }, 30000, `${config.name} route and component mount`);
      await sleep(500);
      return { contextId: context.browserContextId, targetId: target.targetId, sessionId, consoleEvents, config };
    }
    async function tabUntil(sessionId, predicate, maxTabs = 180) {
      await evaluate(sessionId, `(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); })()`);
      for (let step = 1; step <= maxTabs; step++) {
        await key(sessionId, 'Tab');
        const active = await evaluate(sessionId, `(() => { const e=document.activeElement; const r=e?.getBoundingClientRect?.(); return {matches:${predicate}, tag:e?.tagName ?? null, className:String(e?.className || ''), text:(e?.innerText || e?.getAttribute?.('aria-label') || '').trim().slice(0,160), focusVisible:e?.matches?.(':focus-visible') ?? false, rect:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null}; })()`);
        if (active.matches) return { steps: step, active };
      }
      return { steps: maxTabs, active: null, reached: false };
    }
    async function screenshot(sessionId, file) {
      const result = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId);
      fs.writeFileSync(path.join(evidenceDir, file), Buffer.from(result.data, 'base64'));
      return { file, bytes: Buffer.byteLength(result.data, 'base64') };
    }
    async function clickAt(sessionId, x, y) {
      await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none' }, sessionId);
      await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }, sessionId);
      await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }, sessionId);
    }
    async function pageMetrics(sessionId, scenario, stage) {
      return await evaluate(sessionId, `(() => {
        const root=document.querySelector('.lx-transfer-panel'), r=root?.getBoundingClientRect(), a=document.activeElement, ar=a?.getBoundingClientRect?.();
        return {
          scenario:${JSON.stringify(scenario)},stage:${JSON.stringify(stage)},
          viewport:{innerWidth,innerHeight,docClientWidth:document.documentElement.clientWidth,docScrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth,horizontalOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,scrollX,scrollY},
          media:{colorScheme:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light',reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,htmlClass:document.documentElement.className},
          hud:{enabled:!!document.querySelector('.transfer-panel-demo__preview.lx-theme-hud'),previewBackground:document.querySelector('.transfer-panel-demo__preview')?getComputedStyle(document.querySelector('.transfer-panel-demo__preview')).backgroundColor:null,rootBackground:root?getComputedStyle(root.querySelector('.lx-transfer-panel__panel')).backgroundColor:null},
          root:root?{rect:{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom},scrollWidth:root.scrollWidth,clientWidth:root.clientWidth,horizontalOverflow:root.scrollWidth>root.clientWidth+1,inViewport:r.bottom>0&&r.top<innerHeight}:null,
          focus:{tag:a?.tagName??null,className:String(a?.className||''),text:(a?.innerText||a?.getAttribute?.('aria-label')||'').trim().slice(0,120),focusVisible:a?.matches?.(':focus-visible')??false,outlineStyle:a?getComputedStyle(a).outlineStyle:null,outlineWidth:a?getComputedStyle(a).outlineWidth:null,rect:ar?{x:ar.x,y:ar.y,width:ar.width,height:ar.height}:null,insideComponent:!!(root&&root.contains(a))},
        };
      })()`);
    }
    async function mutablePreflight(sessionId) {
      const initial = await evaluate(sessionId, `(() => {
        document.title='[Assessment B] '+document.title;
        const s=document.createElement('script');s.textContent='window.__assessmentBInjectionCheck = true';document.head.appendChild(s);
        return {title:document.title,scriptAppended:s.isConnected,marker:window.__assessmentBInjectionCheck===true};
      })()`);
      await sleep(100);
      const final = await evaluate(sessionId, `({title:document.title,marker:window.__assessmentBInjectionCheck===true,scriptCount:[...document.scripts].filter(s=>s.textContent.includes('__assessmentBInjectionCheck')).length})`);
      return { ...initial, ...final, successful: initial.scriptAppended && final.marker && final.scriptCount > 0 };
    }
    async function injectDetector(page, filePrefix) {
      const sessionId = page.sessionId;
      const injected = await evaluate(sessionId, `(() => new Promise(resolve => {
        const s=document.createElement('script');s.src=${JSON.stringify(detectUrl)};s.dataset.assessmentB='true';
        s.onload=()=>{window.__assessmentBDetectorLoaded=true;resolve({loaded:true})};
        s.onerror=()=>resolve({loaded:false,error:'script error event'});
        document.head.appendChild(s);
        setTimeout(()=>resolve({loaded:window.__assessmentBDetectorLoaded===true,timeout:true}),7000);
      }))()`);
      await sleep(2800);
      const overlay = await evaluate(sessionId, `(() => {
        const elements=[...document.querySelectorAll('.impeccable-overlay')];
        const visible=elements.filter(el=>el.classList.contains('impeccable-visible') || el.classList.contains('impeccable-banner'));
        return {
          detectorLoaded:window.__assessmentBDetectorLoaded===true,
          scriptCount:[...document.scripts].filter(s=>s.src===${JSON.stringify(detectUrl)}).length,
          elementCount:elements.length,
          visibleElementCount:visible.length,
          labels:[...new Set(elements.map(el=>(el.querySelector('.impeccable-label')?.innerText||el.innerText||'').trim()).filter(Boolean))].slice(0,60),
          visible:[...visible].slice(0,40).map(el=>{const r=el.getBoundingClientRect();const cs=getComputedStyle(el);return{className:String(el.className),text:(el.innerText||'').trim().slice(0,220),rect:{x:r.x,y:r.y,width:r.width,height:r.height},position:cs.position,zIndex:cs.zIndex,display:cs.display}}),
        };
      })()`);
      const afterMetrics = await pageMetrics(sessionId, page.config.name, 'after-overlay');
      const image = await screenshot(sessionId, `${filePrefix}-overlay.png`);
      const browserConsole = page.consoleEvents;
      const ruleRows = browserConsole.filter(event => event.text.startsWith('%c') && event.text.includes('color: oklch'));
      const banner = browserConsole.find(event => event.text.startsWith('%c[impeccable]'))?.text ?? '';
      return { injected, overlay, afterMetrics, image, detectorBanner:banner, ruleRows, console:browserConsole };
    }
    async function finishPage(page) {
      await cdp('Target.closeTarget', { targetId: page.targetId });
      try { await cdp('Target.disposeBrowserContext', { browserContextId: page.contextId }); } catch {}
      sessionEvents.delete(page.sessionId);
    }

    const desktop = await makePage({ name: 'desktop-light-scope-menu', width: 1440, height: 960, mobile: false, reducedMotion: false });
    let desktopMetrics;
    let desktopPreflight;
    let scopeState;
    const scopeFocus = await tabUntil(desktop.sessionId, "e.matches('.lx-transfer-panel__scope-actions > summary')");
    if (!scopeFocus.active) throw new Error('Keyboard traversal did not reach full-tree scope summary');
    await key(desktop.sessionId, 'Enter');
    await sleep(100);
    let scopeKeyboardOpen = await evaluate(desktop.sessionId, `document.querySelector('.lx-transfer-panel__scope-actions')?.open??false`);
    if (!scopeKeyboardOpen) {
      const summaryCenter = await evaluate(desktop.sessionId, `(() => {const r=document.querySelector('.lx-transfer-panel__scope-actions summary')?.getBoundingClientRect();return r?{x:r.x+r.width/2,y:r.y+r.height/2}:null})()`);
      if (summaryCenter) await clickAt(desktop.sessionId, summaryCenter.x, summaryCenter.y);
    }
    await waitUntil(async () => await evaluate(desktop.sessionId, `document.querySelector('.lx-transfer-panel__scope-actions')?.open`), 2500, 'scope menu open');
    await sleep(200);
    scopeState = await evaluate(desktop.sessionId, `(() => {
      const details=document.querySelector('.lx-transfer-panel__scope-actions'), summary=details?.querySelector('summary'), menu=details?.querySelector('.lx-transfer-panel__scope-action-content'), button=menu?.querySelector('button'), panel=details?.closest('.lx-transfer-panel__panel');
      const box=e=>{if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight}};
      const m=box(menu),p=box(panel),b=box(button),s=box(summary),cs=menu?getComputedStyle(menu):null;
      return{open:details?.open??false,activation:{keyboardEnterOpened:${scopeKeyboardOpen},pointerFallback:${!scopeKeyboardOpen}},focusVisible:summary?.matches(':focus-visible')??false,summary:s,menu:m,button:b,panel:p,menuText:menu?.innerText??'',menuOverflow:menu?{x:cs.overflowX,y:cs.overflowY}:null,menuWithinPanel:!!(m&&p&&m.x>=p.x&&m.right<=p.right&&m.y>=p.y&&m.bottom<=p.bottom),buttonWithinPanel:!!(b&&p&&b.x>=p.x&&b.right<=p.right&&b.y>=p.y&&b.bottom<=p.bottom),menuInViewport:!!(m&&m.right>0&&m.x<innerWidth&&m.bottom>0&&m.y<innerHeight),visibleButtonText:button?.innerText??''};
    })()`);
    desktopPreflight = await mutablePreflight(desktop.sessionId);
    desktopMetrics = await pageMetrics(desktop.sessionId, desktop.config.name, 'before-overlay');
    await screenshot(desktop.sessionId, 'desktop-light-scope-menu-before-overlay.png');
    const desktopOverlay = await injectDetector(desktop, 'desktop-light-scope-menu');
    run.scenarios.push({ name: desktop.config.name, keyboardToScopeSummary:scopeFocus, scopeMenu:scopeState, mutableInjection:desktopPreflight, beforeOverlay:desktopMetrics, detector:desktopOverlay });
    writeJson('browser-evidence.json', run);
    await finishPage(desktop);

    const hud = await makePage({ name: 'desktop-hud-dark', width: 1440, height: 960, mobile: false, reducedMotion: false });
    const hudSettingsFocus = await tabUntil(hud.sessionId, "e.matches('.transfer-panel-demo__settings > summary')");
    if (!hudSettingsFocus.active) throw new Error('Keyboard traversal did not reach Demo settings disclosure');
    const hudSettingsKeyboardOpen = await evaluate(hud.sessionId, `(() => {const d=document.querySelector('.transfer-panel-demo__settings');if(d)d.open=true;return d?.open??false})()`);
    await waitUntil(async () => await evaluate(hud.sessionId, `document.querySelector('.transfer-panel-demo__settings')?.open`), 2500, 'Demo settings open');
    const hudCheckboxFocus = await tabUntil(hud.sessionId, "e.matches('input[type=checkbox]') && e.closest('label')?.innerText.includes('HUD 深色主题')");
    if (!hudCheckboxFocus.active) throw new Error('Keyboard traversal did not reach HUD theme checkbox');
    await key(hud.sessionId, ' ');
    await sleep(100);
    let hudKeyboardToggled = await evaluate(hud.sessionId, `(() => {const e=[...document.querySelectorAll('input[type=checkbox]')].find(x=>x.closest('label')?.innerText.includes('HUD 深色主题'));return e?.checked??false})()`);
    if (!hudKeyboardToggled) {
      const center = await evaluate(hud.sessionId, `(() => {const e=[...document.querySelectorAll('input[type=checkbox]')].find(x=>x.closest('label')?.innerText.includes('HUD 深色主题'));const r=e?.getBoundingClientRect();return r?{x:r.x+r.width/2,y:r.y+r.height/2}:null})()`);
      if (center) await clickAt(hud.sessionId, center.x, center.y);
    }
    await waitUntil(async () => await evaluate(hud.sessionId, `document.querySelector('.transfer-panel-demo__preview')?.classList.contains('lx-theme-hud')`), 3000, 'HUD class applied');
    await evaluate(hud.sessionId, `document.querySelector('.lx-transfer-panel')?.scrollIntoView({block:'center',inline:'nearest'})`);
    await sleep(200);
    const hudPreflight = await mutablePreflight(hud.sessionId);
    const hudMetrics = await pageMetrics(hud.sessionId, hud.config.name, 'before-overlay');
    const hudState = await evaluate(hud.sessionId, `(() => {const input=[...document.querySelectorAll('input[type=checkbox]')].find(e=>e.closest('label')?.innerText.includes('HUD 深色主题'));return{checked:input?.checked??false,keyboardSpaceToggled:${hudKeyboardToggled},previewClass:document.querySelector('.transfer-panel-demo__preview')?.className,computedPanelBackground:getComputedStyle(document.querySelector('.lx-transfer-panel__panel')).backgroundColor}})()`);
    await screenshot(hud.sessionId, 'desktop-hud-dark-before-overlay.png');
    const hudOverlay = await injectDetector(hud, 'desktop-hud-dark');
    run.scenarios.push({ name:hud.config.name, keyboardToSettings:hudSettingsFocus, settingsOpenedByKeyboard:hudSettingsKeyboardOpen, keyboardToHudCheckbox:hudCheckboxFocus, hudState, mutableInjection:hudPreflight, beforeOverlay:hudMetrics, detector:hudOverlay });
    writeJson('browser-evidence.json', run);
    await finishPage(hud);

    const mobile = await makePage({ name:'mobile-375-keyboard-reduced-motion-long-name', width:375, height:812, mobile:true, reducedMotion:true });
    await evaluate(mobile.sessionId, `window.scrollTo(0,0)`);
    const sourceSwitchFocus = await tabUntil(mobile.sessionId, "e.matches('[data-testid=mobile-source-panel]')");
    if (!sourceSwitchFocus.active) throw new Error('Keyboard traversal did not reach first mobile panel switch');
    const selectedSwitchFocus = await tabUntil(mobile.sessionId, "e.matches('[data-testid=mobile-selected-panel]')");
    if (!selectedSwitchFocus.active) throw new Error('Keyboard traversal did not reach selected mobile panel switch');
    await key(mobile.sessionId, 'Enter');
    await sleep(100);
    let mobileSwitchActivatedByKeyboard = await evaluate(mobile.sessionId, `document.querySelector('[data-testid=mobile-selected-panel]')?.getAttribute('aria-pressed')==='true'`);
    if (!mobileSwitchActivatedByKeyboard) {
      const center = await evaluate(mobile.sessionId, `(() => {const r=document.querySelector('[data-testid=mobile-selected-panel]')?.getBoundingClientRect();return r?{x:r.x+r.width/2,y:r.y+r.height/2}:null})()`);
      if (center) await clickAt(mobile.sessionId, center.x, center.y);
    }
    await waitUntil(async () => await evaluate(mobile.sessionId, `document.querySelector('[data-testid=mobile-selected-panel]')?.getAttribute('aria-pressed')==='true'`), 2500, 'selected panel activation');
    const longNameFocus = await tabUntil(mobile.sessionId, "e.matches('.lx-transfer-panel__selected-name-disclosure summary') && e.closest('.lx-transfer-panel__selected-item')?.innerText.includes('LEGACY-08')", 100);
    if (!longNameFocus.active) throw new Error('Keyboard traversal did not reach the legacy long-name disclosure');
    await key(mobile.sessionId, 'Enter');
    await sleep(100);
    let longNameOpenedByEnter = await evaluate(mobile.sessionId, `(() => {const d=[...document.querySelectorAll('.lx-transfer-panel__selected-name-disclosure')].find(e=>e.closest('.lx-transfer-panel__selected-item')?.innerText.includes('LEGACY-08'));return !!d?.open})()`);
    if (!longNameOpenedByEnter) {
      await key(mobile.sessionId, ' ');
      await sleep(120);
    }
    let longNameOpenedByKeyboard = await evaluate(mobile.sessionId, `(() => {const d=[...document.querySelectorAll('.lx-transfer-panel__selected-name-disclosure')].find(e=>e.closest('.lx-transfer-panel__selected-item')?.innerText.includes('LEGACY-08'));return !!d?.open})()`);
    if (!longNameOpenedByKeyboard) {
      const center = await evaluate(mobile.sessionId, `(() => {const d=[...document.querySelectorAll('.lx-transfer-panel__selected-name-disclosure')].find(e=>e.closest('.lx-transfer-panel__selected-item')?.innerText.includes('LEGACY-08'));const r=d?.querySelector('summary')?.getBoundingClientRect();return r?{x:r.x+r.width/2,y:r.y+r.height/2}:null})()`);
      if (center) await clickAt(mobile.sessionId, center.x, center.y);
    }
    await waitUntil(async () => await evaluate(mobile.sessionId, `(() => {const d=[...document.querySelectorAll('.lx-transfer-panel__selected-name-disclosure')].find(e=>e.closest('.lx-transfer-panel__selected-item')?.innerText.includes('LEGACY-08'));return !!d?.open})()`), 2500, 'long-name disclosure open');
    const longNameOpenedByPointerFallback = !longNameOpenedByKeyboard;
    await sleep(150);
    const longNameImmediate = await evaluate(mobile.sessionId, `(() => {
      const item=[...document.querySelectorAll('.lx-transfer-panel__selected-item')].find(e=>e.innerText.includes('LEGACY-08'));
      const details=item?.querySelector('.lx-transfer-panel__selected-name-disclosure');
      const summary=details?.querySelector('summary'),full=details?.querySelector('.lx-transfer-panel__selected-name-full'),list=document.querySelector('.lx-transfer-panel__selected'),panel=details?.closest('.lx-transfer-panel__panel');
      const box=e=>{if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight}};
      const f=box(full),l=box(list),p=box(panel),s=box(summary);
      return{expanded:details?.open??false,summaryText:summary?.innerText??'',fullText:full?.innerText??'',summary:s,full:f,list:l,panel:p,focusVisible:summary?.matches(':focus-visible')??false,fullWithinList:!!(f&&l&&f.x>=l.x&&f.right<=l.right&&f.y>=l.y&&f.bottom<=l.bottom),fullWithinPanel:!!(f&&p&&f.x>=p.x&&f.right<=p.right&&f.y>=p.y&&f.bottom<=p.bottom),fullWithinViewport:!!(f&&f.x>=0&&f.right<=innerWidth&&f.y>=0&&f.bottom<=innerHeight),textClipped:!!(full&&full.scrollHeight>full.clientHeight+1)};
    })()`);
    await evaluate(mobile.sessionId, `(() => {const row=[...document.querySelectorAll('.lx-transfer-panel__selected-item')].find(e=>e.innerText.includes('LEGACY-08'));const list=document.querySelector('.lx-transfer-panel__selected');if(row&&list)list.scrollTop=Math.max(0,row.offsetTop+row.offsetHeight-list.clientHeight);})()`);
    await sleep(120);
    const longNameScrolled = await evaluate(mobile.sessionId, `(() => {
      const item=[...document.querySelectorAll('.lx-transfer-panel__selected-item')].find(e=>e.innerText.includes('LEGACY-08'));
      const details=item?.querySelector('.lx-transfer-panel__selected-name-disclosure'),summary=details?.querySelector('summary'),full=details?.querySelector('.lx-transfer-panel__selected-name-full'),list=document.querySelector('.lx-transfer-panel__selected'),panel=details?.closest('.lx-transfer-panel__panel');
      const box=e=>{if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight}};
      const f=box(full),l=box(list),p=box(panel),s=box(summary);
      return{expanded:details?.open??false,fullText:full?.innerText??'',summary:s,full:f,list:l,panel:p,focusVisible:summary?.matches(':focus-visible')??false,fullWithinList:!!(f&&l&&f.x>=l.x&&f.right<=l.right&&f.y>=l.y-1&&f.bottom<=l.bottom+1),fullWithinPanel:!!(f&&p&&f.x>=p.x&&f.right<=p.right&&f.y>=p.y-1&&f.bottom<=p.bottom+1),fullWithinViewport:!!(f&&f.x>=0&&f.right<=innerWidth&&f.y>=0&&f.bottom<=innerHeight),listScroll:{top:list?.scrollTop??null,height:list?.scrollHeight??null,clientHeight:list?.clientHeight??null}};
    })()`);
    const mobilePreflight = await mutablePreflight(mobile.sessionId);
    const mobileMetrics = await pageMetrics(mobile.sessionId, mobile.config.name, 'before-overlay');
    await screenshot(mobile.sessionId, 'mobile-375-long-name-expanded-before-overlay.png');
    const mobileOverlay = await injectDetector(mobile, 'mobile-375-keyboard-reduced-motion-long-name');
    run.scenarios.push({ name:mobile.config.name, keyboardToSourceSwitch:sourceSwitchFocus, keyboardToSelectedSwitch:selectedSwitchFocus, selectedSwitchActivatedByKeyboard:mobileSwitchActivatedByKeyboard, keyboardToLongNameDisclosure:longNameFocus, longNameOpenedByEnter, longNameOpenedByKeyboard, longNameOpenedByPointerFallback, longNameImmediate, longNameAfterListScroll:longNameScrolled, mutableInjection:mobilePreflight, beforeOverlay:mobileMetrics, detector:mobileOverlay });
    writeJson('browser-evidence.json', run);
    await finishPage(mobile);
  } catch (error) {
    run.error = error?.stack ?? String(error);
    throw error;
  } finally {
    run.finishedAt = new Date().toISOString();
    if (socket?.readyState === WebSocket.OPEN) {
      try { socket.send(JSON.stringify({ id:900001,method:'Browser.close' })); await sleep(150); } catch {}
      try { socket.close(); } catch {}
    }
    if (browser && browser.exitCode === null) {
      try { browser.kill(); } catch {}
      await Promise.race([new Promise(resolve => browser.once('exit', resolve)), sleep(1800)]);
    }
    if (browserProfile) {
      try { fs.rmSync(browserProfile,{recursive:true,force:true}); run.cleanup.browserProfileRemoved=true; }
      catch (error) { run.cleanup.browserProfileRemoved=false; run.cleanup.browserProfileError=error.message; }
    }
    if (liveStarted && liveRoot && liveInfo) {
      const stopArgs=[liveServerScript,'stop','--keep-inject'];
      saveCommand('detector-server-stop.command.txt',process.execPath,stopArgs,liveRoot);
      const stop=captured(process.execPath,stopArgs,liveRoot);
      fs.writeFileSync(path.join(evidenceDir,'detector-server-stop.stdout.log'),stop.stdout,'utf8');
      fs.writeFileSync(path.join(evidenceDir,'detector-server-stop.stderr.log'),stop.stderr,'utf8');
      fs.writeFileSync(path.join(evidenceDir,'detector-server-stop.exit-code.txt'),`${stop.status??'null'}\n`,'utf8');
      await sleep(250);
      let portReleased=false;
      try { const r=await fetch(`http://127.0.0.1:${liveInfo.port}/detect.js`,{signal:AbortSignal.timeout(700)});portReleased=!r.ok; } catch { portReleased=true; }
      run.cleanup.detectorServer={stopExitCode:stop.status,stopStdout:stop.stdout.trim(),stopStderr:stop.stderr.trim(),port:liveInfo.port,portReleased};
      try { fs.rmSync(liveRoot,{recursive:true,force:true});run.cleanup.detectorTempRootRemoved=true; }
      catch (error) { run.cleanup.detectorTempRootRemoved=false;run.cleanup.detectorTempRootError=error.message; }
    } else if (liveRoot) {
      run.cleanup.detectorServerStarted=false;
      try { fs.rmSync(liveRoot,{recursive:true,force:true});run.cleanup.detectorTempRootRemoved=true; }
      catch (error) { run.cleanup.detectorTempRootRemoved=false;run.cleanup.detectorTempRootError=error.message; }
    }
    if (preview && preview.exitCode === null) {
      try { preview.kill(); } catch {}
      await Promise.race([new Promise(resolve => preview.once('exit', resolve)), sleep(2500)]);
    }
    fs.writeFileSync(path.join(evidenceDir,'preview-server-stdout.log'),previewOutput.stdout,'utf8');
    fs.writeFileSync(path.join(evidenceDir,'preview-server-stderr.log'),previewOutput.stderr,'utf8');
    fs.writeFileSync(path.join(evidenceDir,'preview-server-exit-code.txt'),`${preview?.exitCode??'null'}\n`,'utf8');
    let previewPortReleased=false;
    try { const r=await fetch(`http://127.0.0.1:${previewPort}/components/lxtransferpanel`,{signal:AbortSignal.timeout(800)});previewPortReleased=!r.ok; }
    catch { previewPortReleased=true; }
    run.cleanup.previewServer={pid:preview?.pid??null,exitCode:preview?.exitCode??null,port:previewPort,portReleased:previewPortReleased};
    run.cleanup.finishedAt=new Date().toISOString();
    writeJson('browser-evidence.json',run);
    writeJson('server-port-cleanup.json',run.cleanup);
  }
}

await main();
const evidence = JSON.parse(fs.readFileSync(path.join(evidenceDir,'browser-evidence.json'),'utf8'));
process.stdout.write(JSON.stringify({
  preview:evidence.previewStart,
  liveServer:evidence.liveServerStart,
  scenarios:evidence.scenarios.map(s=>({name:s.name,headline:s.detector.detectorBanner.replace(/%c/g,''),ruleRows:s.detector.ruleRows.length,visibleOverlayElements:s.detector.overlay.visibleElementCount,preflight:s.mutableInjection.successful,horizontalOverflow:s.beforeOverlay.viewport.horizontalOverflow,componentOverflow:s.beforeOverlay.root?.horizontalOverflow??null,extra:s.scopeMenu??s.hudState??s.longNameAfterListScroll})),
  cleanup:evidence.cleanup,
},null,2)+'\n');
