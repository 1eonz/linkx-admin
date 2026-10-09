import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const skillBase = 'C:/Users/Administrator/.codex/skills/impeccable';
const liveServerScript = path.join(skillBase, 'scripts', 'live-server.mjs');
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const targetUrl = 'http://127.0.0.1:4177/components/lxtransferpanel';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const writeJson = (file, value) => fs.writeFileSync(path.join(evidenceDir, file), `${JSON.stringify(value, null, 2)}\n`, 'utf8');

function runCaptured(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', windowsHide: true });
  return { status: result.status, signal: result.signal, error: result.error?.message ?? null, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function saveCommand(name, executable, args, cwd) {
  fs.writeFileSync(path.join(evidenceDir, name), `${[executable, ...args].map(value => `"${value}"`).join(' ')}\ncwd: ${cwd}\n`, 'utf8');
}

async function waitUntil(predicate, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await predicate();
    if (result) return result;
    await sleep(50);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function readBody(response) {
  return await response.text();
}

async function main() {
  let serverRoot;
  let serverInfo;
  let chrome;
  let ws;
  let profileDir;
  let serverStarted = false;
  const run = {
    targetUrl,
    startedAt: new Date().toISOString(),
    launch: {},
    scenarios: [],
    cleanup: {},
  };

  try {
    serverRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'impeccable-assessment-b-'));
    const startArgs = [liveServerScript, '--background'];
    saveCommand('live-server-start.command.txt', process.execPath, startArgs, serverRoot);
    const start = runCaptured(process.execPath, startArgs, serverRoot);
    const rawStart = start.stdout.trim();
    try { serverInfo = JSON.parse(rawStart); } catch { serverInfo = null; }
    serverStarted = Boolean(start.status === 0 && serverInfo?.port && serverInfo?.pid);
    const safeStart = serverInfo ? { ...serverInfo, token: '<redacted>' } : rawStart;
    fs.writeFileSync(path.join(evidenceDir, 'live-server-start.stdout.json'), `${JSON.stringify(safeStart, null, 2)}\n`, 'utf8');
    fs.writeFileSync(path.join(evidenceDir, 'live-server-start.stderr.log'), start.stderr, 'utf8');
    fs.writeFileSync(path.join(evidenceDir, 'live-server-start.exit-code.txt'), `${start.status ?? 'null'}\n`, 'utf8');
    run.launch.liveServer = { status: start.status, signal: start.signal, error: start.error, pid: serverInfo?.pid ?? null, port: serverInfo?.port ?? null, started: serverStarted };
    if (!serverStarted) throw new Error(`Live server did not start (exit ${start.status}): ${start.stderr || rawStart}`);

    const detectUrl = `http://127.0.0.1:${serverInfo.port}/detect.js`;
    const detectResponse = await fetch(detectUrl);
    const detectSource = await readBody(detectResponse);
    writeJson('detector-asset-http.json', {
      command: `GET ${detectUrl}`,
      status: detectResponse.status,
      contentType: detectResponse.headers.get('content-type'),
      bytes: Buffer.byteLength(detectSource),
      hasScriptBody: detectSource.length > 100,
    });
    if (!detectResponse.ok || detectSource.length < 100) throw new Error(`Detector asset request failed with status ${detectResponse.status}`);

    profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assessment-b-chromium-'));
    const chromeArgs = [
      '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
      '--disable-background-networking', '--disable-features=Translate,MediaRouter',
      '--remote-debugging-port=0', '--remote-allow-origins=*', `--user-data-dir=${profileDir}`, 'about:blank',
    ];
    saveCommand('chromium-launch.command.txt', chromePath, chromeArgs, profileDir);
    chrome = spawn(chromePath, chromeArgs, { stdio: 'ignore', windowsHide: true });
    run.launch.chromiumPid = chrome.pid;

    const activePortFile = path.join(profileDir, 'DevToolsActivePort');
    const activePort = await waitUntil(async () => {
      if (chrome.exitCode !== null) throw new Error(`Chromium exited during startup with code ${chrome.exitCode}`);
      try {
        const lines = fs.readFileSync(activePortFile, 'utf8').trim().split(/\r?\n/);
        const port = Number(lines[0]);
        return port > 0 ? { port, browserPath: lines[1] } : null;
      } catch { return null; }
    }, 15000, 'Chromium DevToolsActivePort');

    const version = await (await fetch(`http://127.0.0.1:${activePort.port}/json/version`)).json();
    ws = new WebSocket(version.webSocketDebuggerUrl);
    await waitUntil(() => ws.readyState === WebSocket.OPEN, 10000, 'Chromium CDP websocket');

    let nextId = 1;
    const pending = new Map();
    const sessionEvents = new Map();
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const entry = pending.get(message.id);
        if (!entry) return;
        pending.delete(message.id);
        if (message.error) entry.reject(new Error(`${message.error.message} (${message.error.code})`));
        else entry.resolve(message.result ?? {});
      } else if (message.sessionId) {
        sessionEvents.get(message.sessionId)?.(message);
      }
    });
    function cdp(method, params = {}, sessionId) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
      });
    }
    async function evaluate(sessionId, expression, options = {}) {
      const result = await cdp('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
        ...(options.userGesture ? { userGesture: true } : {}),
        ...(options.timeout ? { timeout: options.timeout } : {}),
      }, sessionId);
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text ?? 'Runtime.evaluate failed');
      return result.result?.value;
    }
    async function createScenario(config) {
      const context = await cdp('Target.createBrowserContext', { disposeOnDetach: true });
      const target = await cdp('Target.createTarget', { url: 'about:blank', browserContextId: context.browserContextId });
      const attached = await cdp('Target.attachToTarget', { targetId: target.targetId, flatten: true });
      const sessionId = attached.sessionId;
      const consoleEvents = [];
      sessionEvents.set(sessionId, message => {
        if (message.method === 'Runtime.consoleAPICalled') {
          const args = message.params.args ?? [];
          consoleEvents.push({
            kind: 'console',
            level: message.params.type,
            text: args.map(arg => arg.value ?? arg.description ?? arg.unserializableValue ?? '[object]').join(' '),
          });
        } else if (message.method === 'Runtime.exceptionThrown') {
          consoleEvents.push({ kind: 'exception', text: message.params.exceptionDetails?.text ?? 'JavaScript exception' });
        } else if (message.method === 'Log.entryAdded') {
          consoleEvents.push({ kind: 'log', level: message.params.entry.level, text: message.params.entry.text });
        }
      });
      await cdp('Page.enable', {}, sessionId);
      await cdp('Runtime.enable', {}, sessionId);
      await cdp('Log.enable', {}, sessionId);
      await cdp('Emulation.setDeviceMetricsOverride', {
        width: config.width, height: config.height, deviceScaleFactor: 1, mobile: config.mobile,
      }, sessionId);
      await cdp('Emulation.setEmulatedMedia', {
        media: 'screen',
        features: [
          { name: 'prefers-color-scheme', value: config.colorScheme },
          { name: 'prefers-reduced-motion', value: config.reducedMotion ? 'reduce' : 'no-preference' },
        ],
      }, sessionId);
      await cdp('Page.navigate', { url: targetUrl }, sessionId);
      await waitUntil(async () => {
        try {
          return await evaluate(sessionId, `document.readyState === 'complete' && !!document.querySelector('.lx-transfer-panel')`);
        } catch { return false; }
      }, 20000, `${config.name} route render`);
      await sleep(700);
      return { contextId: context.browserContextId, targetId: target.targetId, sessionId, consoleEvents, config };
    }
    async function screenshot(sessionId, filename) {
      const result = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId);
      fs.writeFileSync(path.join(evidenceDir, filename), Buffer.from(result.data, 'base64'));
      return { filename, bytes: Buffer.byteLength(result.data, 'base64') };
    }
    async function saveMetrics(sessionId, scenario, stage) {
      return await evaluate(sessionId, `(() => {
        const root = document.querySelector('.lx-transfer-panel');
        const rect = root?.getBoundingClientRect();
        const focused = document.activeElement;
        const focusRect = focused?.getBoundingClientRect?.();
        const textOverlaps = [];
        if (root) {
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          const textBoxes = [];
          while (walker.nextNode()) {
            const node = walker.currentNode;
            if (!node.textContent.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(node);
            const box = range.getBoundingClientRect();
            if (box.width > 1 && box.height > 1) textBoxes.push({ text: node.textContent.trim().slice(0, 70), box });
          }
          for (let i = 0; i < textBoxes.length; i++) {
            for (let j = i + 1; j < textBoxes.length; j++) {
              const a = textBoxes[i].box, b = textBoxes[j].box;
              const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
              const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
              if (overlapX > 2 && overlapY > 2) textOverlaps.push({ a: textBoxes[i].text, b: textBoxes[j].text, overlapX, overlapY });
            }
          }
        }
        const clipping = root ? [...root.querySelectorAll('button,[role=button],input,.lx-transfer-panel__title,.lx-transfer-panel__caption')]
          .map(el => ({ tag: el.tagName, className: String(el.className || ''), text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 60), clientWidth: el.clientWidth, scrollWidth: el.scrollWidth, clientHeight: el.clientHeight, scrollHeight: el.scrollHeight }))
          .filter(el => el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) : [];
        return {
          scenario: ${JSON.stringify(scenario)}, stage: ${JSON.stringify(stage)},
          viewport: { innerWidth, innerHeight, visualWidth: visualViewport?.width ?? null, docClientWidth: document.documentElement.clientWidth, docScrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth, horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, scrollX },
          theme: { htmlClass: document.documentElement.className, bodyBackground: getComputedStyle(document.body).backgroundColor, colorScheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light', reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches },
          component: root ? { rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom }, scrollWidth: root.scrollWidth, clientWidth: root.clientWidth, overflowX: root.scrollWidth > root.clientWidth + 1, inViewport: rect.bottom > 0 && rect.top < innerHeight } : null,
          focus: { tag: focused?.tagName ?? null, className: String(focused?.className || ''), text: (focused?.innerText || focused?.getAttribute?.('aria-label') || focused?.getAttribute?.('placeholder') || '').trim().slice(0, 90), focusVisible: focused?.matches?.(':focus-visible') ?? false, outlineStyle: focused ? getComputedStyle(focused).outlineStyle : null, rect: focusRect ? { x: focusRect.x, y: focusRect.y, width: focusRect.width, height: focusRect.height } : null, inViewport: focusRect ? focusRect.bottom > 0 && focusRect.top < innerHeight : null, insideComponent: !!(root && focused && root.contains(focused)) },
          clippedControls: clipping,
          overlappingTextRuns: textOverlaps.slice(0, 20),
        };
      })()`);
    }
    async function prepareScenario(config) {
      const scenario = await createScenario(config);
      const { sessionId } = scenario;
      const targetInfo = await evaluate(sessionId, `(() => {
        const root = document.querySelector('.lx-transfer-panel');
        root?.scrollIntoView({ block: 'center', inline: 'nearest' });
        return { title: document.title, componentCount: document.querySelectorAll('.lx-transfer-panel').length, themeButton: [...document.querySelectorAll('button')].filter(b => /appearance|theme|dark|light/i.test((b.getAttribute('aria-label') || '') + ' ' + b.className)).map(b => ({ label: b.getAttribute('aria-label'), title: b.title, className: String(b.className), text: b.innerText.trim() })).slice(0, 8), rootRect: root ? (() => { const r=root.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; })() : null };
      })()`);

      if (config.dark) {
        const before = await evaluate(sessionId, `document.documentElement.classList.contains('dark')`);
        if (!before) {
          await evaluate(sessionId, `(() => { const b = document.querySelector('button.VPSwitchAppearance') || [...document.querySelectorAll('button')].find(x => /switch.*dark|dark.*theme|appearance/i.test((x.getAttribute('aria-label') || '') + ' ' + x.title)); if (!b) return false; b.click(); return true; })()`, { userGesture: true });
          await sleep(400);
        }
        targetInfo.darkMode = await evaluate(sessionId, `({ classDark: document.documentElement.classList.contains('dark'), themeButton: document.querySelector('button.VPSwitchAppearance')?.getAttribute('aria-label') ?? null })`);
      }

      if (config.keyboard) {
        await evaluate(sessionId, `(() => { window.scrollTo(0, 0); document.activeElement?.blur?.(); })()`);
        let focusSteps = 0;
        let focused = null;
        for (; focusSteps < 80; focusSteps++) {
          await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }, sessionId);
          await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }, sessionId);
          focused = await evaluate(sessionId, `(() => { const e=document.activeElement; const r=e?.getBoundingClientRect?.(); return {tag:e?.tagName ?? null, className:String(e?.className || ''), text:(e?.innerText || e?.getAttribute?.('aria-label') || e?.getAttribute?.('placeholder') || '').trim().slice(0,90), inside:!!document.querySelector('.lx-transfer-panel')?.contains(e), focusVisible:e?.matches?.(':focus-visible') ?? false, rect:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null}; })()`);
          if (focused?.inside) break;
        }
        targetInfo.keyboard = { steps: focusSteps + 1, reachedComponent: Boolean(focused?.inside), focused };
      }

      if (!config.keyboard) {
        await evaluate(sessionId, `document.querySelector('.lx-transfer-panel')?.scrollIntoView({ block: 'center', inline: 'nearest' })`);
      }

      const mutable = await evaluate(sessionId, `(() => {
        document.title = '[Assessment B] ' + document.title;
        const script = document.createElement('script');
        script.textContent = 'window.__assessmentBMutableInjection = true';
        document.head.appendChild(script);
        return { title: document.title, scriptAppended: script.isConnected, scriptType: script.type || 'classic', marker: window.__assessmentBMutableInjection === true };
      })()`);
      await sleep(120);
      const afterMutable = await evaluate(sessionId, `({ title: document.title, marker: window.__assessmentBMutableInjection === true, inlineScriptCount: [...document.scripts].filter(s => s.textContent.includes('__assessmentBMutableInjection')).length })`);
      const preflight = { ...mutable, ...afterMutable, successful: mutable.scriptAppended && afterMutable.marker && afterMutable.inlineScriptCount > 0 };
      if (!preflight.successful) throw new Error(`${config.name}: mutable document injection preflight failed`);

      const beforeOverlayMetrics = await saveMetrics(sessionId, config.name, 'before-overlay');
      const beforeShot = await screenshot(sessionId, `${config.name}-before-overlay.png`);
      await evaluate(sessionId, `(() => {
        window.__assessmentBBeforeNodes = new Set(document.querySelectorAll('*'));
        window.__assessmentBAddedNodes = [];
        window.__assessmentBObserver = new MutationObserver(records => {
          for (const record of records) for (const node of record.addedNodes) if (node.nodeType === Node.ELEMENT_NODE) window.__assessmentBAddedNodes.push({tag: node.tagName, id: node.id || '', className: String(node.className || ''), text: (node.innerText || '').trim().slice(0, 180)});
        });
        window.__assessmentBObserver.observe(document.documentElement, { childList: true, subtree: true });
      })()`);

      const script = await evaluate(sessionId, `(() => new Promise(resolve => {
        const existing = [...document.scripts].find(s => s.src === ${JSON.stringify(detectUrl)});
        if (existing) { resolve({ reused: true, loaded: window.__assessmentBDetectorLoaded === true }); return; }
        const tag = document.createElement('script');
        tag.src = ${JSON.stringify(detectUrl)};
        tag.dataset.assessmentB = 'true';
        tag.onload = () => { window.__assessmentBDetectorLoaded = true; resolve({ reused: false, loaded: true }); };
        tag.onerror = () => resolve({ reused: false, loaded: false, error: 'script error event' });
        document.head.appendChild(tag);
        setTimeout(() => resolve({ reused: false, loaded: window.__assessmentBDetectorLoaded === true, timeout: true }), 5000);
      }))()`);
      await sleep(2700);
      const overlay = await evaluate(sessionId, `(() => {
        window.__assessmentBObserver?.disconnect();
        const all = [...document.querySelectorAll('*')];
        const before = window.__assessmentBBeforeNodes || new Set();
        const added = all.filter(el => !before.has(el)).map(el => {
          const style = getComputedStyle(el), r=el.getBoundingClientRect();
          return {tag:el.tagName,id:el.id||'',className:String(el.className||''),role:el.getAttribute('role'),aria:el.getAttribute('aria-label'),text:(el.innerText||el.textContent||'').trim().slice(0,220),position:style.position,zIndex:style.zIndex,rect:{x:r.x,y:r.y,width:r.width,height:r.height},html:el.outerHTML.slice(0,800)};
        });
        const candidates = all.filter(el => /impeccable|detector|antipattern|anti-pattern|overlay|issue/i.test(String(el.id||'') + ' ' + String(el.className||'')))
          .map(el => { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return {tag:el.tagName,id:el.id||'',className:String(el.className||''),role:el.getAttribute('role'),text:(el.innerText||el.textContent||'').trim().slice(0,300),position:s.position,zIndex:s.zIndex,rect:{x:r.x,y:r.y,width:r.width,height:r.height},html:el.outerHTML.slice(0,800)}; }).slice(0,60);
        const newOverlay = added.filter(x => x.tag !== 'SCRIPT' && (x.position === 'fixed' || x.position === 'absolute' || /overlay|impeccable|detector|antipattern|issue/i.test(x.id+' '+x.className)));
        return { scriptLoaded: window.__assessmentBDetectorLoaded === true, scriptCount: [...document.scripts].filter(s => s.src === ${JSON.stringify(detectUrl)}).length, globalNames: Object.keys(window).filter(k => /impeccable|detect|anti.?pattern/i.test(k)).slice(0,80), addedElementCount: added.length, addedNodes: added.slice(0,100), overlayCandidates: candidates, likelyOverlayCount: newOverlay.length, likelyOverlay: newOverlay.slice(0,40), htmlOverflowAfter: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
      })()`);
      const afterOverlayMetrics = await saveMetrics(sessionId, config.name, 'after-overlay');
      const afterShot = await screenshot(sessionId, `${config.name}-overlay.png`);
      const consoleMessages = scenario.consoleEvents;
      const detectorConsole = consoleMessages.filter(event => /impeccable|detect|anti.?pattern|issue|finding/i.test(event.text));
      const result = {
        name: config.name,
        viewport: { width: config.width, height: config.height, mobile: config.mobile },
        preferences: { colorScheme: config.colorScheme, reducedMotion: config.reducedMotion },
        targetInfo,
        mutableInjection: preflight,
        detectorScript: { url: detectUrl, loaded: script?.loaded ?? false, onloadResult: script, runtimeOverlay: overlay },
        metrics: { beforeOverlay: beforeOverlayMetrics, afterOverlay: afterOverlayMetrics },
        screenshots: [beforeShot, afterShot],
        console: { all: consoleMessages, detectorRelated: detectorConsole },
      };
      run.scenarios.push(result);
      writeJson('browser-evidence.json', run);
      await cdp('Target.closeTarget', { targetId: scenario.targetId });
      await cdp('Target.disposeBrowserContext', { browserContextId: scenario.contextId });
      sessionEvents.delete(sessionId);
      return result;
    }

    const configs = [
      { name: 'desktop-light', width: 1440, height: 960, mobile: false, colorScheme: 'light', reducedMotion: false, dark: false, keyboard: false },
      { name: 'dark-hud', width: 1440, height: 960, mobile: false, colorScheme: 'dark', reducedMotion: false, dark: true, keyboard: false },
      { name: 'mobile-375-keyboard-reduced-motion', width: 375, height: 812, mobile: true, colorScheme: 'light', reducedMotion: true, dark: false, keyboard: true },
    ];
    run.launch.debugPort = activePort.port;
    run.launch.chromiumVersion = version.Browser;
    for (const config of configs) await prepareScenario(config);
  } catch (error) {
    run.error = error?.stack ?? String(error);
    throw error;
  } finally {
    run.finishedAt = new Date().toISOString();
    if (ws?.readyState === WebSocket.OPEN) {
      try {
        const id = 999999;
        ws.send(JSON.stringify({ id, method: 'Browser.close' }));
        await sleep(200);
      } catch {}
      try { ws.close(); } catch {}
    }
    if (chrome && chrome.exitCode === null) {
      try { chrome.kill(); } catch {}
      await Promise.race([new Promise(resolve => chrome.once('exit', resolve)), sleep(1500)]);
    }
    if (profileDir) {
      try { fs.rmSync(profileDir, { recursive: true, force: true }); run.cleanup.chromiumProfileRemoved = true; }
      catch (error) { run.cleanup.chromiumProfileRemoved = false; run.cleanup.chromiumProfileError = error.message; }
    }
    if (serverStarted && serverInfo) {
      const stopArgs = [liveServerScript, 'stop'];
      saveCommand('live-server-stop.command.txt', process.execPath, stopArgs, serverRoot);
      const stop = runCaptured(process.execPath, stopArgs, serverRoot);
      fs.writeFileSync(path.join(evidenceDir, 'live-server-stop.stdout.log'), stop.stdout, 'utf8');
      fs.writeFileSync(path.join(evidenceDir, 'live-server-stop.stderr.log'), stop.stderr, 'utf8');
      fs.writeFileSync(path.join(evidenceDir, 'live-server-stop.exit-code.txt'), `${stop.status ?? 'null'}\n`, 'utf8');
      await sleep(300);
      let portReleased = false;
      try { portReleased = !(await fetch(`http://127.0.0.1:${serverInfo.port}/detect.js`, { signal: AbortSignal.timeout(700) })).ok; }
      catch { portReleased = true; }
      run.cleanup.liveServerStop = { status: stop.status, stdout: stop.stdout.trim(), stderr: stop.stderr.trim(), port: serverInfo.port, portReleased };
      try { fs.rmSync(serverRoot, { recursive: true, force: true }); run.cleanup.liveServerTempRootRemoved = true; }
      catch (error) { run.cleanup.liveServerTempRootRemoved = false; run.cleanup.liveServerTempRootError = error.message; }
    } else if (serverRoot) {
      run.cleanup.liveServerStarted = false;
      try { fs.rmSync(serverRoot, { recursive: true, force: true }); run.cleanup.liveServerTempRootRemoved = true; }
      catch (error) { run.cleanup.liveServerTempRootRemoved = false; run.cleanup.liveServerTempRootError = error.message; }
    }
    try {
      const preview = await fetch(targetUrl, { signal: AbortSignal.timeout(2500) });
      run.cleanup.preview4177StillAvailable = preview.status === 200;
      run.cleanup.preview4177Status = preview.status;
    } catch (error) {
      run.cleanup.preview4177StillAvailable = false;
      run.cleanup.preview4177Error = error.message;
    }
    writeJson('browser-evidence.json', run);
    writeJson('live-server-port-cleanup.json', run.cleanup);
  }
}

try {
  await main();
  process.stdout.write(JSON.stringify({
    scenarios: 3,
    outcomes: JSON.parse(fs.readFileSync(path.join(evidenceDir, 'browser-evidence.json'), 'utf8')).scenarios.map(s => ({
      name: s.name,
      injection: s.mutableInjection.successful,
      detectorLoaded: s.detectorScript.loaded,
      likelyOverlayCount: s.detectorScript.runtimeOverlay.likelyOverlayCount,
      consoleMessages: s.console.detectorRelated,
      horizontalOverflow: s.metrics.beforeOverlay.viewport.horizontalOverflow,
      componentVisible: s.metrics.beforeOverlay.component?.inViewport,
      focus: s.metrics.beforeOverlay.focus,
    })),
    cleanup: JSON.parse(fs.readFileSync(path.join(evidenceDir, 'live-server-port-cleanup.json'), 'utf8')),
  }, null, 2) + '\n');
} catch (error) {
  process.stderr.write(`${error?.stack ?? error}\n`);
  process.exitCode = 1;
}
