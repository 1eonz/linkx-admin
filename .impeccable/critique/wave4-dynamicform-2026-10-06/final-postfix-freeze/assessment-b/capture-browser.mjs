import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const outDir = path.resolve(root, '.impeccable/critique/wave4-dynamicform-2026-10-06/final-postfix-freeze/assessment-b');
const screenshotsDir = path.join(outDir, 'screenshots');
const serverPort = Number(process.argv[2]);
const pageUrl = 'http://127.0.0.1:4174/components/lxdynamicform.html';
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const liveScriptUrl = `http://127.0.0.1:${serverPort}/detect.js`;

if (!Number.isInteger(serverPort) || serverPort < 1 || serverPort > 65535) {
  throw new Error('Pass the running Impeccable live-server port as the first argument.');
}
if (!fs.existsSync(chromePath)) throw new Error(`Chrome executable not found: ${chromePath}`);
fs.mkdirSync(screenshotsDir, { recursive: true });

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

class DevTools {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    socket.addEventListener('message', event => {
      let message;
      try { message = JSON.parse(event.data); } catch { return; }
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result ?? {});
        return;
      }
      const key = `${message.sessionId || ''}::${message.method || ''}`;
      for (const listener of this.listeners.get(key) || []) listener(message.params || {});
    });
    socket.addEventListener('close', () => {
      for (const pending of this.pending.values()) pending.reject(new Error('CDP socket closed'));
      this.pending.clear();
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP WebSocket open timed out')), 8000);
      socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP WebSocket failed to open')); }, { once: true });
    });
    return new DevTools(socket);
  }

  on(sessionId, method, listener) {
    const key = `${sessionId || ''}::${method}`;
    if (!this.listeners.has(key)) this.listeners.set(key, []);
    this.listeners.get(key).push(listener);
  }

  call(method, params = {}, sessionId = null) {
    const id = this.nextId++;
    const command = { id, method, params };
    if (sessionId) command.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify(command));
    });
  }

  close() {
    try { this.socket.close(); } catch {}
  }
}

async function evaluate(devtools, sessionId, expression) {
  const result = await devtools.call('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  }, sessionId);
  if (result.exceptionDetails) {
    const text = result.exceptionDetails.text || result.exceptionDetails.exception?.description || 'Runtime evaluation failed';
    throw new Error(text);
  }
  return result.result?.value;
}

function rectOf(element) {
  const rect = element.getBoundingClientRect();
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom };
}

function collectPageEvidence() {
  const rectOf = element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom };
  };
  const visible = element => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
  };
  const plain = element => (element?.innerText || element?.getAttribute?.('aria-label') || element?.getAttribute?.('title') || '').trim().replace(/\s+/g, ' ').slice(0, 180);
  const overlays = [...document.querySelectorAll('.impeccable-overlay, .impeccable-label, .impeccable-banner, .impeccable-tooltip')]
    .filter(visible)
    .map(overlay => {
      const target = overlay._targetEl || overlay.__targetEl || null;
      const targetRect = target ? rectOf(target) : null;
      const rect = rectOf(overlay);
      const cx = targetRect ? targetRect.x + targetRect.width / 2 : rect.x + rect.width / 2;
      const cy = targetRect ? targetRect.y + targetRect.height / 2 : rect.y + rect.height / 2;
      const hit = document.elementFromPoint(cx, cy);
      return {
        className: String(overlay.className || ''),
        text: plain(overlay),
        rect,
        target: target ? {
          tag: target.tagName,
          className: String(target.className || ''),
          text: plain(target),
          rect: targetRect,
          centerHitTag: hit?.tagName || null,
          centerHitClass: String(hit?.className || ''),
          centerHitIsOverlay: !!hit?.closest?.('.impeccable-overlay, .impeccable-label, .impeccable-banner, .impeccable-tooltip'),
        } : null,
        pointerEvents: getComputedStyle(overlay).pointerEvents,
        zIndex: getComputedStyle(overlay).zIndex,
      };
    });
  const controls = [...document.querySelectorAll('button, input, select, textarea, a[href], [role="button"]')]
    .filter(visible)
    .map(control => {
      const rect = rectOf(control);
      const cx = rect.x + rect.width / 2;
      const cy = rect.y + rect.height / 2;
      const hit = document.elementFromPoint(cx, cy);
      const overlappedBy = overlays.filter(item => {
        const r = item.rect;
        return r.x < rect.right && r.right > rect.x && r.y < rect.bottom && r.bottom > rect.y;
      }).map(item => item.className);
      return {
        tag: control.tagName,
        role: control.getAttribute('role'),
        label: plain(control),
        className: String(control.className || ''),
        rect,
        centerHitTag: hit?.tagName || null,
        centerHitClass: String(hit?.className || ''),
        centerHitIsOverlay: !!hit?.closest?.('.impeccable-overlay, .impeccable-label, .impeccable-banner, .impeccable-tooltip'),
        overlappedBy,
      };
    });
  const overflowingElements = [...document.querySelectorAll('body *')]
    .filter(element => !element.closest('.impeccable-overlay, .impeccable-label, .impeccable-banner, .impeccable-tooltip') && visible(element))
    .map(element => {
      const rect = rectOf(element);
      const style = getComputedStyle(element);
      return {
        tag: element.tagName,
        className: String(element.className || ''),
        text: plain(element),
        rect,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        overflowX: style.overflowX,
      };
    })
    .filter(element => element.rect.right > document.documentElement.clientWidth + 1 || element.rect.x < -1)
    .sort((left, right) => right.rect.right - left.rect.right)
    .slice(0, 30);
  const style = getComputedStyle(document.body);
  return {
    title: document.title,
    readyState: document.readyState,
    viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
    document: {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      clientHeight: document.documentElement.clientHeight,
      scrollHeight: document.documentElement.scrollHeight,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      overflowingElements,
    },
    theme: {
      prefersColorScheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      htmlClass: document.documentElement.className,
      htmlDataTheme: document.documentElement.getAttribute('data-theme'),
      bodyBackground: style.backgroundColor,
      bodyColor: style.color,
    },
    headings: [...document.querySelectorAll('h1, h2, h3')].filter(visible).slice(0, 30).map(plain),
    overlayApi: {
      detect: typeof window.impeccableDetect,
      scan: typeof window.impeccableScan,
      injected: window.__assessmentBInjected || null,
      preflight: window.__assessmentBPreflight || null,
    },
    overlays,
    controls,
  };
}

const allViews = [
  { id: 'desktop-light', width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false, colorScheme: 'light' },
  { id: 'desktop-dark', width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false, colorScheme: 'dark' },
  { id: 'mobile-375-touch', width: 375, height: 812, deviceScaleFactor: 2, mobile: true, colorScheme: 'light' },
];
const mobileOnly = process.argv[3] === '--mobile-only';
const views = mobileOnly ? allViews.filter(view => view.mobile) : allViews;

let chrome = null;
let devtools = null;
let userDataDir = null;
const evidence = {
  startedAt: new Date().toISOString(),
  pageUrl,
  overlayScriptUrl: liveScriptUrl,
  browser: { executable: chromePath, version: null, pid: null },
  views: [],
  lifecycle: { contextsCreated: [], chromeStopped: false, profileRemoved: false },
};

try {
  userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'linkx-dynamicform-assessment-b-chrome-'));
  chrome = spawn(chromePath, [
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-sync',
    '--metrics-recording-only',
    '--no-service-autorun',
    '--remote-allow-origins=*',
    '--remote-debugging-port=0',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1440,1000',
  ], { stdio: 'ignore', windowsHide: true });
  evidence.browser.pid = chrome.pid;

  const activePortPath = path.join(userDataDir, 'DevToolsActivePort');
  const deadline = Date.now() + 15000;
  let wsUrl = null;
  while (Date.now() < deadline) {
    if (chrome.exitCode !== null) throw new Error(`Chrome exited during startup with code ${chrome.exitCode}`);
    if (fs.existsSync(activePortPath)) {
      const [portText] = fs.readFileSync(activePortPath, 'utf8').split(/\r?\n/);
      const version = await fetch(`http://127.0.0.1:${portText}/json/version`).then(response => response.json());
      evidence.browser.version = version.Browser || null;
      wsUrl = version.webSocketDebuggerUrl;
      break;
    }
    await wait(100);
  }
  if (!wsUrl) throw new Error('Chrome did not publish a DevTools endpoint within 15 seconds.');
  devtools = await DevTools.connect(wsUrl);

  for (const view of views) {
    const context = await devtools.call('Target.createBrowserContext', { disposeOnDetach: true });
    evidence.lifecycle.contextsCreated.push(context.browserContextId);
    const target = await devtools.call('Target.createTarget', {
      url: 'about:blank',
      browserContextId: context.browserContextId,
      width: view.width,
      height: view.height,
    });
    const attached = await devtools.call('Target.attachToTarget', { targetId: target.targetId, flatten: true });
    const sessionId = attached.sessionId;
    const consoleMessages = [];
    const exceptions = [];
    const requests = [];
    const responses = [];
    const failedRequests = [];
    const ownOrigin = new URL(pageUrl).origin;
    const overlayOrigin = new URL(liveScriptUrl).origin;

    devtools.on(sessionId, 'Runtime.consoleAPICalled', event => {
      const message = (event.args || []).map(arg => arg.value ?? arg.description ?? '').filter(Boolean).join(' ').trim();
      const item = { type: event.type, message, timestamp: event.timestamp || null };
      consoleMessages.push(item);
    });
    devtools.on(sessionId, 'Runtime.exceptionThrown', event => {
      exceptions.push({
        text: event.exceptionDetails?.text || null,
        message: event.exceptionDetails?.exception?.description || event.exceptionDetails?.exception?.value || null,
        url: event.exceptionDetails?.url || null,
        line: event.exceptionDetails?.lineNumber ?? null,
        column: event.exceptionDetails?.columnNumber ?? null,
      });
    });
    devtools.on(sessionId, 'Network.requestWillBeSent', event => {
      let origin = null;
      let protocol = '';
      try {
        const parsedUrl = new URL(event.request.url);
        origin = parsedUrl.origin;
        protocol = parsedUrl.protocol;
      } catch {}
      requests.push({
        url: event.request.url,
        method: event.request.method,
        resourceType: event.type || null,
        initiator: event.initiator?.type || null,
        external: (protocol === 'http:' || protocol === 'https:') && !!origin && origin !== ownOrigin && origin !== overlayOrigin,
      });
    });
    devtools.on(sessionId, 'Network.responseReceived', event => {
      if (event.response.status >= 400) responses.push({ url: event.response.url, status: event.response.status, resourceType: event.type || null });
    });
    devtools.on(sessionId, 'Network.loadingFailed', event => {
      failedRequests.push({ requestId: event.requestId, errorText: event.errorText, canceled: event.canceled || false, blockedReason: event.blockedReason || null });
    });

    await Promise.all([
      devtools.call('Page.enable', {}, sessionId),
      devtools.call('Runtime.enable', {}, sessionId),
      devtools.call('Network.enable', {}, sessionId),
      devtools.call('Emulation.setDeviceMetricsOverride', {
        width: view.width,
        height: view.height,
        deviceScaleFactor: view.deviceScaleFactor,
        mobile: view.mobile,
        screenWidth: view.width,
        screenHeight: view.height,
        screenOrientation: { type: view.mobile ? 'portraitPrimary' : 'landscapePrimary', angle: view.mobile ? 0 : 90 },
      }, sessionId),
      devtools.call('Emulation.setTouchEmulationEnabled', { enabled: view.mobile, maxTouchPoints: view.mobile ? 5 : 1 }, sessionId),
      devtools.call('Emulation.setEmulatedMedia', {
        media: 'screen',
        features: [{ name: 'prefers-color-scheme', value: view.colorScheme }],
      }, sessionId),
    ]);

    await devtools.call('Page.navigate', { url: pageUrl }, sessionId);
    for (let i = 0; i < 80; i++) {
      try {
        const ready = await evaluate(devtools, sessionId, 'document.readyState');
        if (ready === 'complete') break;
      } catch {}
      await wait(150);
    }
    await wait(1200);

    const preflight = await evaluate(devtools, sessionId, `(() => {
      const previousTitle = document.title;
      document.title = '[Assessment B preflight] ' + previousTitle;
      const script = document.createElement('script');
      script.src = 'data:text/javascript,window.__assessmentBPreflight%3D%7Bloaded%3Atrue%7D';
      script.dataset.assessmentBPreflight = 'true';
      (document.head || document.documentElement).appendChild(script);
      window.__assessmentBPreflightAppend = true;
      return { titleChanged: document.title.startsWith('[Assessment B preflight] '), scriptAppended: script.isConnected, previousTitle };
    })()`);
    await wait(200);
    const preflightRun = await evaluate(devtools, sessionId, `({
      appendSucceeded: !!window.__assessmentBPreflightAppend,
      dataScriptExecuted: !!window.__assessmentBPreflight?.loaded,
      title: document.title,
    })`);
    const preOverlayLayout = await evaluate(devtools, sessionId, `(() => {
      const viewportWidth = document.documentElement.clientWidth;
      const overflowing = [...document.querySelectorAll('body *')]
        .filter(element => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
            && (rect.right > viewportWidth + 1 || rect.left < -1);
        })
        .map(element => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            tag: element.tagName,
            className: String(element.className || ''),
            text: (element.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 180),
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom },
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
            overflowX: style.overflowX,
          };
        })
        .sort((left, right) => right.rect.right - left.rect.right)
        .slice(0, 30);
      return {
        viewportWidth,
        documentClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        overflowingElements: overflowing,
      };
    })()`);
    let noOverlayScreenshot = null;
    if (view.mobile) {
      const controlImage = await devtools.call('Page.captureScreenshot', {
        format: 'png',
        fromSurface: true,
        captureBeyondViewport: false,
      }, sessionId);
      noOverlayScreenshot = 'screenshots/mobile-375-touch-no-overlay.png';
      fs.writeFileSync(path.join(outDir, noOverlayScreenshot), Buffer.from(controlImage.data, 'base64'));
    }

    const injection = await evaluate(devtools, sessionId, `(() => {
      const script = document.createElement('script');
      script.src = ${JSON.stringify(`${liveScriptUrl}?assessment=b&view=${view.id}`)};
      script.dataset.assessmentBOverlay = ${JSON.stringify(view.id)};
      script.onload = () => { window.__assessmentBInjected = { loaded: true, src: script.src }; };
      script.onerror = () => { window.__assessmentBInjected = { loaded: false, src: script.src }; };
      (document.head || document.documentElement).appendChild(script);
      return { scriptAppended: script.isConnected, src: script.src };
    })()`);
    await wait(3000);
    await evaluate(devtools, sessionId, 'window.scrollTo(0, 0)');
    await wait(250);
    const pageEvidence = await evaluate(devtools, sessionId, `(${collectPageEvidence.toString()})()`);
    const screenshot = await devtools.call('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false,
    }, sessionId);
    const screenshotName = `${view.id}.png`;
    fs.writeFileSync(path.join(screenshotsDir, screenshotName), Buffer.from(screenshot.data, 'base64'));

    evidence.views.push({
      ...view,
      contextId: context.browserContextId,
      targetId: target.targetId,
      preflight,
      preflightRun,
      preOverlayLayout,
      noOverlayScreenshot,
      injection,
      page: pageEvidence,
      console: {
        impeccable: consoleMessages.filter(item => /impeccable/i.test(item.message)),
        errors: consoleMessages.filter(item => item.type === 'error' || item.type === 'warning'),
        allCount: consoleMessages.length,
        allMessages: consoleMessages,
      },
      exceptions,
      network: {
        requestCount: requests.length,
        externalRequests: requests.filter(item => item.external),
        requests,
        httpErrors: responses,
        failedRequests,
      },
      screenshot: `screenshots/${screenshotName}`,
    });

    await devtools.call('Target.closeTarget', { targetId: target.targetId });
    await devtools.call('Target.disposeBrowserContext', { browserContextId: context.browserContextId });
  }
} catch (error) {
  evidence.fatalError = String(error?.stack || error);
} finally {
  evidence.finishedAt = new Date().toISOString();
  if (devtools) {
    try { await devtools.call('Browser.close'); } catch {}
    devtools.close();
  }
  if (chrome && chrome.exitCode === null) {
    await Promise.race([
      new Promise(resolve => chrome.once('exit', resolve)),
      wait(2000),
    ]);
  }
  if (chrome && chrome.exitCode === null && Number.isInteger(chrome.pid)) {
    const killer = spawn('taskkill.exe', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    await new Promise(resolve => killer.once('exit', resolve));
  }
  evidence.lifecycle.chromeStopped = !chrome || chrome.exitCode !== null;
  if (userDataDir && fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
    evidence.lifecycle.profileRemoved = !fs.existsSync(userDataDir);
  }
  const evidenceName = mobileOnly ? 'browser-mobile-control-evidence.json' : 'browser-evidence.json';
  fs.writeFileSync(path.join(outDir, evidenceName), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
}

console.log(JSON.stringify({
  startedAt: evidence.startedAt,
  finishedAt: evidence.finishedAt,
  browser: evidence.browser,
  fatalError: evidence.fatalError || null,
  views: evidence.views.map(view => ({
    id: view.id,
    preflightRun: view.preflightRun,
    injectionLoaded: view.page.overlayApi.injected?.loaded || false,
    overlayConsole: view.console.impeccable.map(item => item.message),
    exceptionCount: view.exceptions.length,
    consoleErrorCount: view.console.errors.filter(item => item.type === 'error').length,
    overlayCount: view.page.overlays.length,
    documentWidthBeforeOverlay: view.preOverlayLayout.documentScrollWidth,
    documentWidthAfterOverlay: view.page.document.scrollWidth,
    horizontalOverflowBeforeOverlay: view.preOverlayLayout.horizontalOverflow,
    horizontalOverflowAfterOverlay: view.page.document.horizontalOverflow,
    bodyWidthBeforeOverlay: view.preOverlayLayout.bodyScrollWidth,
    bodyWidthAfterOverlay: view.page.document.bodyScrollWidth,
    screenshot: view.screenshot,
    noOverlayScreenshot: view.noOverlayScreenshot,
  })),
  lifecycle: evidence.lifecycle,
}, null, 2));
if (evidence.fatalError || evidence.views.length !== views.length) process.exitCode = 1;
