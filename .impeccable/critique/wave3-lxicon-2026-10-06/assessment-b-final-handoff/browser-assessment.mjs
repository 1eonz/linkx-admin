import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const outDir = path.resolve(process.argv[2]);
const overlayPort = Number(process.argv[3]);
const targetUrl = 'http://127.0.0.1:4174/components/lxicons.html';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profileDir = path.join(os.tmpdir(), `codex-lxicon-assessment-b-${process.pid}`);
const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--remote-debugging-port=0',
  `--user-data-dir=${profileDir}`,
  'about:blank',
], { stdio: 'ignore', windowsHide: true });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const consoleEvents = [];
const networkEvents = [];
const snapshots = [];
let currentState = 'startup';
let browserCdp;
let pageCdp;
let browserWebSocketUrl;
let pageWebSocketUrl;
let chromeClosedByCdp = false;
let currentEvidence;

function connectCdp(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const pending = new Map();
    const listeners = new Map();
    let nextId = 0;

    ws.addEventListener('open', () => resolve({
      send(method, params = {}) {
        const id = ++nextId;
        return new Promise((sendResolve, sendReject) => {
          pending.set(id, { resolve: sendResolve, reject: sendReject });
          ws.send(JSON.stringify({ id, method, params }));
        });
      },
      on(method, callback) {
        const group = listeners.get(method) ?? [];
        group.push(callback);
        listeners.set(method, group);
      },
      close() {
        ws.close();
      },
    }));
    ws.addEventListener('error', reject);
    ws.addEventListener('message', (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (message.id) {
        const waiting = pending.get(message.id);
        if (!waiting) return;
        pending.delete(message.id);
        if (message.error) waiting.reject(new Error(message.error.message));
        else waiting.resolve(message.result ?? {});
        return;
      }
      for (const listener of listeners.get(message.method) ?? []) listener(message.params ?? {});
    });
  });
}

async function waitFor(predicate, timeoutMs, message) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (await predicate()) return;
    await delay(200);
  }
  throw new Error(message);
}

async function evaluate(expression) {
  const response = await pageCdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
  }
  return response.result?.value;
}

async function setViewport(width, height, mobile = false, reducedMotion = false) {
  await pageCdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  });
  await pageCdp.send('Emulation.setTouchEmulationEnabled', mobile
    ? { enabled: true, maxTouchPoints: 1 }
    : { enabled: false });
  await pageCdp.send('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [
      { name: 'prefers-color-scheme', value: 'light' },
      { name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' },
    ],
  });
}

async function navigateFresh(options) {
  currentState = options.name;
  await setViewport(options.width, options.height, options.mobile, options.reducedMotion);
  await pageCdp.send('Page.navigate', { url: targetUrl });
  await waitFor(
    () => evaluate('Boolean(document.querySelector(".icon-catalog"))'),
    30000,
    `Timed out loading ${targetUrl}`,
  );
  await evaluate(`(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', ${Boolean(options.dark)});
    root.classList.toggle('lx-theme-hud', ${Boolean(options.hud)});
    return true;
  })()`);
  await delay(1000);
}

async function pageFacts() {
  return evaluate(`(() => {
    const visible = (el) => Boolean(el && el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }));
    const active = document.activeElement;
    const activeSummary = active ? {
      tag: active.tagName,
      className: typeof active.className === 'string' ? active.className : '',
      ariaLabel: active.getAttribute?.('aria-label') ?? '',
      text: (active.innerText ?? '').trim().slice(0, 100),
    } : null;
    const focusedIcon = document.querySelector('.icon-tile:focus-visible .lx-icon');
    const motionIcon = document.querySelector('.icon-tile:hover .lx-icon[data-lx-motion]');
    const styleTarget = focusedIcon ?? motionIcon;
    const style = styleTarget ? getComputedStyle(styleTarget) : null;
    return {
      title: document.title,
      url: location.href,
      classes: [...document.documentElement.classList],
      viewportWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      catalogCount: document.querySelectorAll('.icon-catalog').length,
      visibleTileCount: [...document.querySelectorAll('.icon-tile')].filter(visible).length,
      emptyVisible: visible(document.querySelector('.icon-empty')),
      emptyText: visible(document.querySelector('.icon-empty')) ? document.querySelector('.icon-empty').innerText : '',
      searchStatus: document.querySelector('.icon-search-status')?.innerText ?? '',
      searchFocused: active === document.querySelector('.icon-search'),
      active: activeSummary,
      prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      motionStyle: style ? {
        animationName: style.animationName,
        transitionDuration: style.transitionDuration,
        transform: style.transform,
      } : null,
      copyFeedback: document.querySelector('.icon-copy-feedback')?.innerText.trim() ?? '',
      copyFallbackText: document.querySelector('.icon-copy-fallback textarea')?.value ?? '',
    };
  })()`);
}

async function saveScreenshot(name) {
  const result = await pageCdp.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    fromSurface: true,
  });
  const file = path.join(outDir, `${name}.png`);
  fs.writeFileSync(file, Buffer.from(result.data, 'base64'));
  return file;
}

async function injectOverlay(name) {
  const consoleStart = consoleEvents.length;
  const networkStart = networkEvents.length;
  let injectionError = '';
  let scriptLoaded = false;
  try {
    scriptLoaded = await evaluate(`new Promise((resolve) => {
      document.querySelectorAll('script[data-b-final-overlay]').forEach((script) => script.remove());
      const script = document.createElement('script');
      script.src = 'http://localhost:${overlayPort}/detect.js';
      script.dataset.bFinalOverlay = 'true';
      const timer = setTimeout(() => resolve(false), 10000);
      script.addEventListener('load', () => { clearTimeout(timer); resolve(true); }, { once: true });
      script.addEventListener('error', () => { clearTimeout(timer); resolve(false); }, { once: true });
      document.head.appendChild(script);
    })`);
  } catch (error) {
    injectionError = error.message;
  }
  if (scriptLoaded) await delay(2500);
  const scriptPresent = await evaluate("Boolean(document.querySelector('script[data-b-final-overlay]'))").catch(() => false);
  const relevantRequests = networkEvents.slice(networkStart).filter((event) => event.url.includes('/detect.js'));
  const overlayConsole = consoleEvents.slice(consoleStart).filter((event) =>
    /impeccable|detector|anti.?pattern|overlay|issue|finding|rule|occlusion|font|palette|layout|hairline|contrast|touch|overflow/i.test(event.text),
  );
  return {
    injected: scriptLoaded && scriptPresent,
    scriptLoaded,
    scriptPresent,
    injectionError,
    detectRequests: relevantRequests,
    console: overlayConsole,
    consoleAll: consoleEvents.slice(consoleStart),
    elementCountAfter: await evaluate('document.body.querySelectorAll("*").length').catch(() => null),
    screenshot: await saveScreenshot(`${name}-overlay`),
  };
}

async function screenshotState(name, { baseline = false } = {}) {
  const factsBefore = await pageFacts();
  const baselineScreenshot = baseline ? await saveScreenshot(name) : undefined;
  const overlay = await injectOverlay(name);
  const factsAfter = await pageFacts();
  snapshots.push({ name, factsBefore, factsAfter, baselineScreenshot, overlay });
  return { factsBefore, factsAfter, overlay };
}

async function dispatchTab() {
  await pageCdp.send('Input.dispatchKeyEvent', {
    type: 'rawKeyDown',
    key: 'Tab',
    code: 'Tab',
    windowsVirtualKeyCode: 9,
  });
  await pageCdp.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Tab',
    code: 'Tab',
    windowsVirtualKeyCode: 9,
  });
}

async function dispatchClick(selector) {
  const point = await evaluate(`(() => {
    const candidates = [...document.querySelectorAll(${JSON.stringify(selector)})];
    const element = candidates.find((item) => item.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }));
    if (!element) return null;
    element.scrollIntoView({ block: 'center', inline: 'center' });
    const rect = element.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2,
      label: element.getAttribute('aria-label') ?? element.innerText ?? '' };
  })()`);
  if (!point) throw new Error(`No visible element found for ${selector}`);
  await pageCdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
  await pageCdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
  await pageCdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1 });
  return point;
}

async function testKeyboardAndEmptyState() {
  const options = { name: 'mobile-320-empty-focus', width: 320, height: 800, mobile: true };
  await navigateFresh(options);
  let focused = false;
  let tabs = 0;
  const focusPath = [];
  while (!focused && tabs < 60) {
    await dispatchTab();
    tabs++;
    const active = await evaluate(`(() => {
      const el = document.activeElement;
      return { search: el === document.querySelector('.icon-search'), tag: el?.tagName,
        label: el?.getAttribute?.('aria-label') ?? '', className: typeof el?.className === 'string' ? el.className : '' };
    })()`);
    if (focusPath.length < 8 || active.search) focusPath.push(active);
    focused = active.search;
  }
  const inputPoint = await evaluate(`(() => {
    const input = document.querySelector('.icon-search');
    input.focus();
    const rect = input.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  })()`);
  await pageCdp.send('Input.insertText', { text: 'no-such-icon-b-final' });
  await waitFor(() => evaluate("Boolean(document.querySelector('.icon-empty'))"), 4000, 'Empty result did not render');
  await pageCdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: inputPoint.x, y: inputPoint.y });
  const { factsBefore, factsAfter, overlay } = await screenshotState('mobile-320-empty-focus');
  snapshots.at(-1).keyboardPath = { tabsToSearch: tabs, reachedWithTab: focused, focusPath };
  return { factsBefore, factsAfter, overlay, keyboardPath: snapshots.at(-1).keyboardPath };
}

async function testReducedMotion() {
  await navigateFresh({ name: 'mobile-375-reduced-motion', width: 375, height: 812, mobile: true, reducedMotion: true });
  const point = await evaluate(`(() => {
    const icon = document.querySelector('.icon-tile .lx-icon[data-icon-name="delete"]');
    const button = icon?.closest('button');
    if (!button) return null;
    button.scrollIntoView({ block: 'center' });
    const rect = icon.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  })()`);
  if (point) await pageCdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
  await delay(500);
  return screenshotState('mobile-375-reduced-motion');
}

async function testCopy(name, forceFailure) {
  await navigateFresh({ name, width: 1440, height: 1000, mobile: false });
  if (forceFailure) {
    await evaluate(`Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => { throw new DOMException('Forced denial for failure-state evidence', 'NotAllowedError'); } },
    })`);
  } else {
    try {
      await browserCdp.send('Browser.grantPermissions', {
        origin: 'http://127.0.0.1:4174',
        permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
      });
    } catch (error) {
      snapshots.push({ name: `${name}-permission`, permissionError: error.message });
    }
  }
  const clickTarget = await dispatchClick('.icon-tile');
  await delay(250);
  const clickDiagnostic = await evaluate(`(() => ({
    feedback: document.querySelector('.icon-copy-feedback')?.innerText.trim() ?? '',
    buttonText: document.querySelector('.icon-tile')?.innerText.trim() ?? '',
    activeTag: document.activeElement?.tagName ?? '',
    activeLabel: document.activeElement?.getAttribute?.('aria-label') ?? '',
    searchVueReady: Boolean(document.querySelector('.icon-search')?.__vueParentComponent),
    buttonVueReady: Boolean(document.querySelector('.icon-tile')?.__vueParentComponent),
  }))()`);
  console.log(JSON.stringify({ stage: 'copy-click', name, clickTarget, clickDiagnostic }));
  try {
    await waitFor(() => evaluate("Boolean(document.querySelector('.icon-copy-feedback')?.innerText.trim())"), 5000, `${name} copy feedback did not render`);
  } catch {
    throw new Error(`${name} copy feedback did not render: ${JSON.stringify({ clickTarget, clickDiagnostic, console: consoleEvents.slice(-20) })}`);
  }
  await delay(200);
  const facts = await pageFacts();
  let clipboardText = null;
  if (!forceFailure) {
    clipboardText = await evaluate('navigator.clipboard?.readText?.().catch((error) => `read failed: ${error.name}`) ?? null').catch((error) => `read failed: ${error.message}`);
  }
  const screenshot = await saveScreenshot(name);
  const injection = await injectOverlay(name);
  const finalFacts = await pageFacts();
  snapshots.push({ name, factsBeforeOverlay: facts, factsAfterOverlay: finalFacts, clickTarget, clipboardText, screenshot, overlay: injection, forcedFailure: forceFailure });
}

async function startBrowser() {
  await waitFor(() => fs.existsSync(path.join(profileDir, 'DevToolsActivePort')), 20000, 'Chrome did not expose a DevTools endpoint');
  const [portText, browserPath] = fs.readFileSync(path.join(profileDir, 'DevToolsActivePort'), 'utf8').trim().split(/\r?\n/);
  browserWebSocketUrl = `ws://127.0.0.1:${portText}${browserPath}`;
  browserCdp = await connectCdp(browserWebSocketUrl);
  const { targetId } = await browserCdp.send('Target.createTarget', { url: 'about:blank' });
  const targets = await (await fetch(`http://127.0.0.1:${portText}/json/list`)).json();
  const target = targets.find((item) => item.id === targetId);
  if (!target) throw new Error('New Chrome page target was not listed');
  pageWebSocketUrl = target.webSocketDebuggerUrl;
  pageCdp = await connectCdp(pageWebSocketUrl);
  await Promise.all([
    pageCdp.send('Page.enable'),
    pageCdp.send('Runtime.enable'),
    pageCdp.send('Network.enable'),
    pageCdp.send('Log.enable'),
  ]);
  pageCdp.on('Runtime.consoleAPICalled', (event) => {
    const text = (event.args ?? []).map((arg) => arg.value ?? arg.description ?? arg.type).join(' ');
    consoleEvents.push({ state: currentState, type: event.type, text: text.slice(0, 3000), timestamp: event.timestamp });
  });
  pageCdp.on('Runtime.exceptionThrown', (event) => {
    consoleEvents.push({ state: currentState, type: 'exception', text: event.exceptionDetails?.text ?? '', timestamp: event.timestamp });
  });
  pageCdp.on('Log.entryAdded', (event) => {
    const entry = event.entry ?? {};
    consoleEvents.push({ state: currentState, type: `log:${entry.level ?? 'unknown'}`, text: String(entry.text ?? '').slice(0, 3000), timestamp: entry.timestamp });
  });
  pageCdp.on('Network.requestWillBeSent', (event) => {
    const url = event.request?.url ?? '';
    networkEvents.push({ state: currentState, type: 'request', url, resourceType: event.type ?? '' });
  });
  pageCdp.on('Network.responseReceived', (event) => {
    const url = event.response?.url ?? '';
    networkEvents.push({ state: currentState, type: 'response', url, status: event.response?.status, resourceType: event.type ?? '' });
  });
  pageCdp.on('Network.loadingFailed', (event) => {
    networkEvents.push({ state: currentState, type: 'failed', url: event.requestId, error: event.errorText ?? '' });
  });
  return { debugPort: Number(portText), browserPath, pageTargetId: targetId };
}

async function closeBrowser() {
  try {
    if (browserCdp) {
      await browserCdp.send('Browser.close');
      chromeClosedByCdp = true;
    }
  } catch {
    // The browser may already have exited after Browser.close.
  }
  await Promise.race([
    new Promise((resolve) => chrome.once('exit', resolve)),
    delay(5000),
  ]);
  if (chrome.exitCode === null && chrome.signalCode === null) {
    chrome.kill();
    await Promise.race([
      new Promise((resolve) => chrome.once('exit', resolve)),
      delay(3000),
    ]);
  }
  pageCdp?.close();
  browserCdp?.close();
  fs.rmSync(profileDir, { recursive: true, force: true });
  if (currentEvidence) {
    currentEvidence.browser.browserClosedByCdp = chromeClosedByCdp;
    currentEvidence.browser.processExited = chrome.exitCode !== null || chrome.signalCode !== null;
    currentEvidence.browser.profileRemoved = !fs.existsSync(profileDir);
    fs.writeFileSync(path.join(outDir, 'browser-evidence.json'), JSON.stringify(currentEvidence, null, 2));
  }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browserInfo = await startBrowser();
  await navigateFresh({ name: 'desktop-light', width: 1440, height: 1000, mobile: false });
  const preflight = await evaluate(`(() => {
    const originalTitle = document.title;
    document.title = 'Assessment B injection preflight';
    const probe = document.createElement('script');
    probe.dataset.bFinalPreflight = 'true';
    probe.textContent = 'window.__lxiconAssessmentBMutable = true';
    document.head.appendChild(probe);
    const passed = window.__lxiconAssessmentBMutable === true
      && Boolean(document.querySelector('script[data-b-final-preflight]'));
    document.title = originalTitle;
    probe.remove();
    return { passed, titleRestored: document.title === originalTitle };
  })()`);
  await screenshotState('desktop-light', { baseline: true });

  await navigateFresh({ name: 'desktop-dark', width: 1440, height: 1000, mobile: false, dark: true });
  await screenshotState('desktop-dark');

  await navigateFresh({ name: 'desktop-hud', width: 1440, height: 1000, mobile: false, hud: true });
  await screenshotState('desktop-hud');

  const emptyAndFocus = await testKeyboardAndEmptyState();
  const reducedMotion = await testReducedMotion();
  await testCopy('copy-success', false);
  await testCopy('copy-failure', true);

  const externalOrigins = [...new Set(networkEvents
    .filter((event) => event.type === 'request')
    .map((event) => {
      try {
        const url = new URL(event.url);
        if (!['http:', 'https:'].includes(url.protocol)) return null;
        return ['127.0.0.1', 'localhost', '::1'].includes(url.hostname) ? null : url.origin;
      } catch {
        return null;
      }
    })
    .filter(Boolean))];
  const evidence = {
    targetUrl,
    method: 'custom CDP fallback in a fresh isolated headless Chrome profile; no Playwright or native inspect/evaluate browser tool was exposed',
    mutableInjectionPreflight: preflight,
    browser: {
      executable: chromePath,
      processId: chrome.pid,
      debugPort: browserInfo.debugPort,
      pageTargetId: browserInfo.pageTargetId,
      browserClosedByCdp: chromeClosedByCdp,
      userProfileDirectory: profileDir,
      profileRemoved: !fs.existsSync(profileDir),
      stopMethod: 'Browser.close over the spawned Chrome DevTools Protocol connection; child process fallback kill was only sent to the spawned Chrome PID',
    },
    overlayServer: { port: overlayPort, injectionUrl: `http://localhost:${overlayPort}/detect.js`, stoppedByCaller: false },
    summary: {
      viewportOverflow: snapshots.map(({ name, factsBefore, factsAfter, factsAfterOverlay }) => ({
        name,
        width: factsBefore?.viewportWidth,
        documentScrollWidthBeforeOverlay: factsBefore?.documentScrollWidth,
        documentScrollWidthAfterOverlay: (factsAfterOverlay ?? factsAfter)?.documentScrollWidth,
        applicationOverflowBeforeOverlay: factsBefore?.documentScrollWidth > factsBefore?.viewportWidth,
        overlayOverflowAfterInjection: (factsAfterOverlay ?? factsAfter)?.documentScrollWidth > (factsAfterOverlay ?? factsAfter)?.viewportWidth,
      })),
      emptyState: emptyAndFocus.factsAfter,
      keyboardPath: emptyAndFocus.keyboardPath,
      reducedMotion: reducedMotion.factsAfter,
      copyStates: snapshots.filter((entry) => entry.name === 'copy-success' || entry.name === 'copy-failure'),
      externalOrigins,
      overlayInjections: snapshots.filter((entry) => entry.overlay).map((entry) => ({
        name: entry.name,
        injected: entry.overlay.injected,
        scriptLoaded: entry.overlay.scriptLoaded,
        injectionError: entry.overlay.injectionError,
        detectRequests: entry.overlay.detectRequests,
        console: entry.overlay.console,
      })),
    },
    states: snapshots,
    console: consoleEvents,
    network: networkEvents,
  };
  currentEvidence = evidence;
  fs.writeFileSync(path.join(outDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2));
  fs.writeFileSync(path.join(outDir, 'browser-console.ndjson'), consoleEvents.map((entry) => JSON.stringify(entry)).join('\n') + '\n');
  fs.writeFileSync(path.join(outDir, 'browser-network.ndjson'), networkEvents.map((entry) => JSON.stringify(entry)).join('\n') + '\n');
  console.log(JSON.stringify({
    browser: evidence.browser,
    externalOrigins,
    states: snapshots.map((entry) => ({ name: entry.name, overlayInjected: entry.overlay?.injected, screenshot: entry.overlay?.screenshot ?? entry.screenshot ?? entry.baselineScreenshot })),
    copy: evidence.summary.copyStates.map((entry) => ({ name: entry.name, feedback: entry.factsBeforeOverlay?.copyFeedback, fallback: entry.factsBeforeOverlay?.copyFallbackText, clipboardText: entry.clipboardText })),
    keyboard: evidence.summary.keyboardPath,
    empty: { visible: emptyAndFocus.factsAfter.emptyVisible, text: emptyAndFocus.factsAfter.emptyText, tiles: emptyAndFocus.factsAfter.visibleTileCount },
    reducedMotion: { prefersReducedMotion: reducedMotion.factsAfter.prefersReducedMotion, motionStyle: reducedMotion.factsAfter.motionStyle },
  }, null, 2));
}

main()
  .catch((error) => {
    fs.writeFileSync(path.join(outDir, 'browser-failure-diagnostic.json'), JSON.stringify({
      error: error.stack ?? error.message ?? String(error),
      snapshots,
      console: consoleEvents,
      network: networkEvents,
    }, null, 2));
    console.error(error.stack ?? error.message ?? String(error));
    process.exitCode = 1;
  })
  .finally(closeBrowser);
