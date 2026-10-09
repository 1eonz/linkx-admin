import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const outputDir = path.resolve('.impeccable/critique/wave4-dynamicform-2026-10-06/final-unified-freeze/assessment-b');
const screenshotDir = path.join(outputDir, 'screenshots');
const targetUrl = 'http://127.0.0.1:4174/components/lxdynamicform.html';
const detectorPath = 'C:\\Users\\Administrator\\.codex\\skills\\impeccable\\scripts\\detector\\detect-antipatterns-browser.js';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const lifecycle = {
  targetUrl,
  docsService: { host: '127.0.0.1', port: 4174, startedByAssessment: false, stoppedByAssessment: false },
  overlayService: { started: false, stopped: false, pid: process.pid },
  browser: { started: false, stopped: false, contexts: [], tabs: [] },
  externalRequests: [],
  errors: [],
};
const evidence = { capturedAt: new Date().toISOString(), lifecycle, views: [] };
let chrome;
let browserClient;
let overlayServer;
let profileDir;
const serverRequests = [];

await fs.mkdir(screenshotDir, { recursive: true });

function writeEvidence() {
  return fs.writeFile(path.join(outputDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2), 'utf8');
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve(server.address().port);
    });
  });
}

async function jsonFetch(url, options) {
  const response = await fetch(url, options);
  const body = await response.text();
  return { response, body, json: body ? JSON.parse(body) : null };
}

function connectCdp(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const pending = new Map();
    const eventListeners = new Map();
    let nextId = 0;
    socket.addEventListener('open', () => resolve({
      send(method, params = {}) {
        const id = ++nextId;
        socket.send(JSON.stringify({ id, method, params }));
        return new Promise((sendResolve, sendReject) => pending.set(id, { resolve: sendResolve, reject: sendReject }));
      },
      on(method, listener) {
        if (!eventListeners.has(method)) eventListeners.set(method, new Set());
        eventListeners.get(method).add(listener);
        return () => eventListeners.get(method)?.delete(listener);
      },
      close() {
        socket.close();
      },
    }), { once: true });
    socket.addEventListener('error', reject, { once: true });
    socket.addEventListener('message', event => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (message.id) {
        const waiter = pending.get(message.id);
        if (!waiter) return;
        pending.delete(message.id);
        if (message.error) waiter.reject(new Error(message.error.message));
        else waiter.resolve(message.result || {});
        return;
      }
      for (const listener of eventListeners.get(message.method) || []) listener(message.params || {});
    });
  });
}

async function openPageTarget(browserContextId) {
  const { targetId } = await browserClient.send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { json: targets } = await jsonFetch(`http://127.0.0.1:${debugPort}/json/list`);
  const target = targets.find(item => item.id === targetId);
  if (!target?.webSocketDebuggerUrl) throw new Error(`CDP websocket URL missing for target ${targetId}`);
  const client = await connectCdp(target.webSocketDebuggerUrl);
  lifecycle.browser.tabs.push({ targetId, createdAt: new Date().toISOString() });
  return { targetId, client };
}

async function evaluate(client, expression, awaitPromise = false) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'page evaluation failed');
  return result.result?.value;
}

async function delay(client, milliseconds) {
  await evaluate(client, `new Promise(resolve => setTimeout(resolve, ${milliseconds}))`, true);
}

function isExternal(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) && !['127.0.0.1', 'localhost'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

async function captureView(view) {
  const result = {
    name: view.name,
    viewport: view.viewport,
    colorScheme: view.colorScheme,
    createdAt: new Date().toISOString(),
    console: [],
    network: [],
    injection: {},
    screenshots: [],
  };
  evidence.views.push(result);
  let page;
  let removeNetworkListener;
  let removeConsoleListener;
  try {
    const { browserContextId } = await browserClient.send('Target.createBrowserContext', { disposeOnDetach: true });
    lifecycle.browser.contexts.push({ id: browserContextId, view: view.name, createdAt: new Date().toISOString() });
    const created = await openPageTarget(browserContextId);
    page = created.client;
    result.tabId = created.targetId;
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Network.enable');
    await page.send('Log.enable');
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: view.viewport.width,
      height: view.viewport.height,
      deviceScaleFactor: 1,
      mobile: view.mobile,
    });
    await page.send('Emulation.setTouchEmulationEnabled', {
      enabled: view.mobile,
      configuration: view.mobile ? 'mobile' : 'desktop',
    });
    await page.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: view.colorScheme }],
    });
    removeNetworkListener = page.on('Network.requestWillBeSent', event => {
      const record = { url: event.request.url, type: event.type || null };
      result.network.push(record);
      if (isExternal(record.url)) lifecycle.externalRequests.push({ view: view.name, ...record });
    });
    removeConsoleListener = page.on('Runtime.consoleAPICalled', event => {
      const record = {
        type: event.type,
        text: (event.args || []).map(arg => arg.value ?? arg.description ?? '').join(' '),
      };
      result.console.push(record);
    });

    await page.send('Page.navigate', { url: targetUrl });
    await delay(page, 2800);
    const pageState = await evaluate(page, `(() => ({
      title: document.title,
      readyState: document.readyState,
      htmlClass: document.documentElement.className,
      bodyClass: document.body.className,
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
      background: getComputedStyle(document.body).backgroundColor,
      media: {
        hoverNone: matchMedia('(hover: none)').matches,
        pointerCoarse: matchMedia('(pointer: coarse)').matches,
        preferredColorSchemeDark: matchMedia('(prefers-color-scheme: dark)').matches,
        maxTouchPoints: navigator.maxTouchPoints,
      },
      buttons: [...document.querySelectorAll('button,[role="button"],[aria-expanded]')].slice(0, 80).map(el => ({
        text: (el.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 100),
        label: el.getAttribute('aria-label'),
        expanded: el.getAttribute('aria-expanded'),
        className: typeof el.className === 'string' ? el.className : '',
      })),
    }))()`);
    result.pageState = pageState;

    const preflight = await evaluate(page, `new Promise(resolve => {
      document.title = ${JSON.stringify(`Assessment B injection preflight: ${view.name}`)};
      window.__assessmentBMessages = [];
      window.addEventListener('message', event => {
        if (event.source === window && event.data && typeof event.data.source === 'string' && event.data.source.startsWith('impeccable-')) {
          window.__assessmentBMessages.push(event.data);
        }
      });
      const script = document.createElement('script');
      script.src = ${JSON.stringify(`${overlayBaseUrl}/preflight.js`)};
      script.dataset.assessmentB = 'preflight';
      const timer = setTimeout(() => resolve({ loaded: false, reason: 'timeout', title: document.title }), 5000);
      script.onload = () => { clearTimeout(timer); resolve({ loaded: true, marker: window.__assessmentBInjectionPreflight, title: document.title }); };
      script.onerror = () => { clearTimeout(timer); resolve({ loaded: false, reason: 'script-error', title: document.title }); };
      document.head.append(script);
    })`, true);
    result.injection.preflight = preflight;

    const overlay = await evaluate(page, `new Promise(resolve => {
      const script = document.createElement('script');
      script.src = ${JSON.stringify(`${overlayBaseUrl}/detect.js`)};
      script.dataset.assessmentB = 'detector';
      const timer = setTimeout(() => resolve({ loaded: false, reason: 'timeout' }), 8000);
      script.onload = () => { clearTimeout(timer); resolve({ loaded: true, scriptCount: document.querySelectorAll('script[data-assessment-b="detector"]').length }); };
      script.onerror = () => { clearTimeout(timer); resolve({ loaded: false, reason: 'script-error' }); };
      document.head.append(script);
    })`, true);
    result.injection.detectorScript = overlay;
    await delay(page, 3200);
    result.injection.postScan = await evaluate(page, `({
      scannerAvailable: typeof window.impeccableScan === 'function',
      overlays: document.querySelectorAll('.impeccable-overlay').length,
      banners: document.querySelectorAll('.impeccable-banner').length,
      messages: window.__assessmentBMessages || [],
      title: document.title,
    })`);

    const initialShot = path.join(screenshotDir, `${view.name}-page.png`);
    const initialCapture = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await fs.writeFile(initialShot, Buffer.from(initialCapture.data, 'base64'));
    result.screenshots.push(path.relative(outputDir, initialShot).replaceAll('\\', '/'));

    if (view.mobile) {
      const geometry = await evaluate(page, `(() => {
        const visibleRect = el => {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          return { selector: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/).join('.') : ''), text: (el.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 80), position: s.position, top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height, visible: r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' };
        };
        const demoRoots = [...document.querySelectorAll('[class*="demo" i],[data-demo]')].filter(el => el.querySelector('input,textarea,select,[role="combobox"],[role="checkbox"],[role="switch"]'));
        const root = demoRoots.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0] || document.querySelector('.vp-doc article,.vp-doc');
        const fields = root ? [...root.querySelectorAll('input,textarea,select,[role="combobox"],[role="checkbox"],[role="switch"],.lx-upload__clear')].filter(el => el.getBoundingClientRect().width > 0).slice(0, 24).map(visibleRect) : [];
        const clearButtons = [...document.querySelectorAll('.lx-upload__clear')].map(visibleRect);
        const directorySelector = '.VPLocalNav,.VPLocalNavOutlineDropdown,.VPDocAsideOutline,[class*="LocalNav"],[class*="OutlineDropdown"],nav[aria-label*="page" i],nav[aria-label*="目录"]';
        const bars = [...new Set(document.querySelectorAll(directorySelector))].map(visibleRect).filter(item => item.visible);
        const overlap = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
        return {
          documentHeight: document.documentElement.scrollHeight,
          demoRoot: root ? visibleRect(root) : null,
          demoRootCount: demoRoots.length,
          fields,
          uploadClearCount: clearButtons.length,
          uploadClearBounds: clearButtons,
          directoryBars: bars,
          intersections: bars.flatMap(bar => fields.filter(field => overlap(bar, field)).map(field => ({ directory: bar.selector, field: field.selector, directoryBounds: bar, fieldBounds: field }))),
          tocCandidates: [...document.querySelectorAll('button,[role="button"],[aria-expanded]')].map(el => ({ element: visibleRect(el), expanded: el.getAttribute('aria-expanded'), label: el.getAttribute('aria-label') })).filter(item => /outline|toc|contents|on this page|目录|本页|大纲/i.test([item.element.text, item.label, item.element.selector].join(' '))),
        };
      })()`);
      result.mobileGeometry = { normalScroll: null, tocExpanded: null, expandedControl: null };
      const rootTop = geometry.demoRoot?.top ?? 400;
      const scrollY = await evaluate(page, `(() => { window.scrollTo({ top: Math.max(0, ${rootTop} + window.scrollY - 150), behavior: 'instant' }); return window.scrollY; })()`);
      await delay(page, 350);
      result.mobileGeometry.normalScroll = await evaluate(page, `(() => {
        const box = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return { selector: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/).join('.') : ''), text: (el.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 80), position: s.position, top:r.top,left:r.left,right:r.right,bottom:r.bottom,width:r.width,height:r.height,visible:r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden' }; };
        const root = [...document.querySelectorAll('[class*="demo" i],[data-demo]')].find(el => el.querySelector('input,textarea,select,[role="combobox"],[role="checkbox"],[role="switch"]')) || document.querySelector('.vp-doc article,.vp-doc');
        const fields = root ? [...root.querySelectorAll('input,textarea,select,[role="combobox"],[role="checkbox"],[role="switch"],.lx-upload__clear')].filter(el => el.getBoundingClientRect().width>0).slice(0,24).map(box) : [];
        const bars = [...new Set(document.querySelectorAll('.VPLocalNav,.VPLocalNavOutlineDropdown,.VPDocAsideOutline,[class*="LocalNav"],[class*="OutlineDropdown"],nav[aria-label*="page" i],nav[aria-label*="目录"]'))].map(box).filter(item=>item.visible);
        const overlap=(a,b)=>!(a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom);
        return { scrollY:window.scrollY, documentHeight:document.documentElement.scrollHeight, demoRoot:root?box(root):null, fields, directoryBars:bars, intersections:bars.flatMap(bar=>fields.filter(field=>overlap(bar,field)).map(field=>({directory:bar.selector,field:field.selector,directoryBounds:bar,fieldBounds:field}))), uploadClear:[...document.querySelectorAll('.lx-upload__clear')].map(box) };
      })()`);
      result.mobileGeometry.normalScroll.requestedScrollY = scrollY;

      const expandResult = await evaluate(page, `(() => {
        const candidates = [...document.querySelectorAll('button,[role="button"],[aria-expanded]')];
        const button = candidates.find(el => /outline|toc|contents|on this page|目录|本页|大纲/i.test([el.innerText || '',el.getAttribute('aria-label') || '',typeof el.className === 'string' ? el.className : ''].join(' ')));
        if (!button) return { found: false };
        const before = button.getAttribute('aria-expanded');
        button.click();
        return { found: true, selector: button.tagName.toLowerCase() + (typeof button.className === 'string' && button.className.trim() ? '.' + button.className.trim().split(/\\s+/).join('.') : ''), text: (button.innerText || '').trim().replace(/\\s+/g,' ').slice(0,80), before, after: button.getAttribute('aria-expanded') };
      })()`);
      result.mobileGeometry.expandedControl = expandResult;
      await delay(page, 400);
      result.mobileGeometry.tocExpanded = await evaluate(page, `(() => {
        const box = el => { const r=el.getBoundingClientRect(); const s=getComputedStyle(el); return {selector:el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(typeof el.className==='string'&&el.className.trim()?'.'+el.className.trim().split(/\\s+/).join('.'):'') ,text:(el.innerText||'').trim().replace(/\\s+/g,' ').slice(0,80),position:s.position,top:r.top,left:r.left,right:r.right,bottom:r.bottom,width:r.width,height:r.height,visible:r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'}; };
        const root=[...document.querySelectorAll('[class*="demo" i],[data-demo]')].find(el=>el.querySelector('input,textarea,select,[role="combobox"],[role="checkbox"],[role="switch"]'))||document.querySelector('.vp-doc article,.vp-doc');
        const fields=root?[...root.querySelectorAll('input,textarea,select,[role="combobox"],[role="checkbox"],[role="switch"],.lx-upload__clear')].filter(el=>el.getBoundingClientRect().width>0).slice(0,24).map(box):[];
        const bars=[...new Set(document.querySelectorAll('.VPLocalNav,.VPLocalNavOutlineDropdown,.VPDocAsideOutline,[class*="LocalNav"],[class*="OutlineDropdown"],nav[aria-label*="page" i],nav[aria-label*="目录"]'))].map(box).filter(item=>item.visible);
        const overlap=(a,b)=>!(a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom);
        return {scrollY:window.scrollY,documentHeight:document.documentElement.scrollHeight,demoRoot:root?box(root):null,fields,directoryBars:bars,intersections:bars.flatMap(bar=>fields.filter(field=>overlap(bar,field)).map(field=>({directory:bar.selector,field:field.selector,directoryBounds:bar,fieldBounds:field}))),uploadClear:[...document.querySelectorAll('.lx-upload__clear')].map(box),openOutlineElements:[...document.querySelectorAll('[aria-expanded="true"],[class*="Outline"],[class*="outline"]')].map(box).filter(item=>item.visible).slice(0,20)};
      })()`);
      const mobileShot = path.join(screenshotDir, `${view.name}-scrolled-toc.png`);
      const mobileCapture = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await fs.writeFile(mobileShot, Buffer.from(mobileCapture.data, 'base64'));
      result.screenshots.push(path.relative(outputDir, mobileShot).replaceAll('\\', '/'));
    } else {
      result.componentGeometry = await evaluate(page, `(() => {
        const box = el => { const r=el.getBoundingClientRect(); const s=getComputedStyle(el); return {selector:el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(typeof el.className==='string'&&el.className.trim()?'.'+el.className.trim().split(/\\s+/).join('.'):'') ,text:(el.innerText||'').trim().replace(/\\s+/g,' ').slice(0,80),position:s.position,top:r.top,left:r.left,right:r.right,bottom:r.bottom,width:r.width,height:r.height,visible:r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'}; };
        const buttons=[...document.querySelectorAll('.lx-upload__clear')].map(box);
        const root=[...document.querySelectorAll('[class*="demo" i],[data-demo]')].find(el=>el.querySelector('input,textarea,select,[role="combobox"],[role="checkbox"],[role="switch"]'))||document.querySelector('.vp-doc article,.vp-doc');
        return {demoRoot:root?box(root):null,demoFieldCount:root?[...root.querySelectorAll('input,textarea,select,[role="combobox"],[role="checkbox"],[role="switch"]')].length:0,uploadClearCount:buttons.length,uploadClearBounds:buttons};
      })()`);
    }

    result.overlayConsole = result.console.filter(entry => /impeccable/i.test(entry.text));
    result.externalRequests = result.network.filter(entry => isExternal(entry.url));
    await writeEvidence();
  } catch (error) {
    result.error = error.stack || String(error);
    lifecycle.errors.push({ view: view.name, message: String(error) });
  } finally {
    removeNetworkListener?.();
    removeConsoleListener?.();
    if (page) page.close();
    await writeEvidence();
  }
}

let debugPort = 0;
let overlayBaseUrl = '';
try {
  const detectorSource = await fs.readFile(detectorPath, 'utf8');
  const detectorHash = await import('node:crypto').then(({ createHash }) => createHash('sha256').update(detectorSource).digest('hex'));
  evidence.detector = { path: detectorPath, sha256: detectorHash, bytes: Buffer.byteLength(detectorSource) };
  overlayServer = http.createServer((request, response) => {
    serverRequests.push({ url: request.url, method: request.method, at: new Date().toISOString() });
    if (request.url === '/preflight.js') {
      response.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' });
      response.end('window.__assessmentBInjectionPreflight = { loaded: true, marker: "assessment-b-preflight" };');
      return;
    }
    if (request.url === '/detect.js') {
      response.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' });
      response.end(detectorSource);
      return;
    }
    response.writeHead(404);
    response.end('not found');
  });
  const overlayPort = await listen(overlayServer);
  overlayBaseUrl = `http://127.0.0.1:${overlayPort}`;
  lifecycle.overlayService = { started: true, stopped: false, host: '127.0.0.1', port: overlayPort, pid: process.pid, startedAt: new Date().toISOString(), servedPaths: ['/preflight.js', '/detect.js'] };

  profileDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-assessment-b-'));
  const portServer = http.createServer();
  debugPort = await listen(portServer);
  await new Promise(resolve => portServer.close(resolve));
  chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--disable-extensions',
    'about:blank',
  ], { stdio: 'ignore', windowsHide: true });
  lifecycle.browser = { ...lifecycle.browser, started: true, stopped: false, pid: chrome.pid, debugPort, profileCreatedInTemp: true, startedAt: new Date().toISOString() };
  let version;
  const readyDeadline = Date.now() + 15000;
  while (Date.now() < readyDeadline) {
    try {
      version = (await jsonFetch(`http://127.0.0.1:${debugPort}/json/version`)).json;
      break;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }
  if (!version?.webSocketDebuggerUrl) throw new Error('Chrome DevTools endpoint did not become ready');
  browserClient = await connectCdp(version.webSocketDebuggerUrl);
  for (const view of [
    { name: 'desktop-1280-light', viewport: { width: 1280, height: 900 }, colorScheme: 'light', mobile: false },
    { name: 'desktop-1280-dark', viewport: { width: 1280, height: 900 }, colorScheme: 'dark', mobile: false },
    { name: 'mobile-375-light', viewport: { width: 375, height: 844 }, colorScheme: 'light', mobile: true },
  ]) {
    await captureView(view);
  }
} catch (error) {
  lifecycle.errors.push({ phase: 'startup', message: error.stack || String(error) });
} finally {
  lifecycle.overlayRequests = serverRequests;
  if (browserClient) {
    try { await browserClient.send('Browser.close'); } catch { /* browser may already have exited */ }
    browserClient.close();
  }
  if (chrome && chrome.exitCode === null) {
    await new Promise(resolve => {
      const timeout = setTimeout(() => { chrome.kill(); resolve(); }, 5000);
      chrome.once('exit', () => { clearTimeout(timeout); resolve(); });
    });
  }
  lifecycle.browser.stopped = true;
  lifecycle.browser.stoppedAt = new Date().toISOString();
  if (overlayServer?.listening) {
    await new Promise(resolve => overlayServer.close(resolve));
  }
  lifecycle.overlayService.stopped = true;
  lifecycle.overlayService.stoppedAt = new Date().toISOString();
  if (profileDir && path.dirname(profileDir) === os.tmpdir() && path.basename(profileDir).startsWith('codex-assessment-b-')) {
    await fs.rm(profileDir, { recursive: true, force: true });
    lifecycle.browser.temporaryProfileRemoved = true;
  }
  await writeEvidence();
  process.stdout.write(JSON.stringify({ views: evidence.views.map(view => ({ name: view.name, error: view.error || null, injection: view.injection, overlayConsoleCount: view.overlayConsole?.length || 0, screenshots: view.screenshots })), externalRequestCount: lifecycle.externalRequests.length, errors: lifecycle.errors }, null, 2) + '\n');
}
