import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const outDir = path.dirname(fileURLToPath(import.meta.url));
const targetUrl = 'http://127.0.0.1:4174/components/lxicons.html';
const detectorPort = Number(process.argv[2]);
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!Number.isInteger(detectorPort) || detectorPort < 1) throw new Error('Missing detector server port');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function waitFor(predicate, label, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await predicate();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label}${lastError ? `: ${lastError.message}` : ''}`);
}

class CDP {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 0;
    this.pending = new Map();
    this.listeners = new Set();
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
    });
    this.socket.addEventListener('message', (event) => {
      let message;
      try { message = JSON.parse(String(event.data)); } catch { return; }
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result || {});
        return;
      }
      for (const listener of this.listeners) listener(message);
    });
  }

  async send(method, params = {}, sessionId) {
    await this.ready;
    const id = ++this.nextId;
    const message = { id, method, params };
    if (sessionId) message.sessionId = sessionId;
    const result = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.socket.send(JSON.stringify(message));
    return result;
  }

  close() { this.socket.close(); }
}

async function evaluate(cdp, sessionId, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  }, sessionId);
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime.evaluate failed');
  }
  return result.result?.value;
}

const chromePort = await freePort();
const profilePath = await fs.mkdtemp(path.join(os.tmpdir(), 'linkx-postfix-b-'));
const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${chromePort}`,
  '--remote-allow-origins=*',
  `--user-data-dir=${profilePath}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-component-update',
  '--disable-gpu',
], { stdio: 'ignore', windowsHide: true });

let cdp;
let browserContextId;
const viewResults = [];
let interactionResults = null;

try {
  const version = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${chromePort}/json/version`);
    return response.ok ? response.json() : null;
  }, 'isolated Chrome DevTools endpoint');
  cdp = new CDP(version.webSocketDebuggerUrl);
  await cdp.ready;
  const context = await cdp.send('Target.createBrowserContext', { disposeOnDetach: true });
  browserContextId = context.browserContextId;

  const views = [
    { name: 'desktop-light', width: 1440, height: 900, mobile: false, theme: 'light', hud: false },
    { name: 'desktop-dark', width: 1440, height: 900, mobile: false, theme: 'dark', hud: false },
    { name: 'mobile-375-hud', width: 375, height: 812, mobile: true, theme: 'hud', hud: true },
    { name: 'mobile-320-light', width: 320, height: 780, mobile: true, theme: 'light', hud: false },
  ];

  for (const view of views) {
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank', browserContextId });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    const consoleEvents = [];
    cdp.listeners.add((message) => {
      if (message.sessionId !== sessionId) return;
      const params = message.params || {};
      if (message.method === 'Runtime.consoleAPICalled') {
        const args = (params.args || []).map((arg) => arg.value ?? arg.description ?? arg.type ?? '');
        consoleEvents.push({ source: 'Runtime.consoleAPICalled', type: params.type, text: args.join(' ').slice(0, 700) });
      } else if (message.method === 'Runtime.exceptionThrown') {
        consoleEvents.push({ source: 'Runtime.exceptionThrown', text: params.exceptionDetails?.text || params.exceptionDetails?.exception?.description || 'JavaScript exception' });
      } else if (message.method === 'Log.entryAdded') {
        consoleEvents.push({ source: 'Log.entryAdded', level: params.entry?.level, text: params.entry?.text?.slice(0, 700) || '', url: params.entry?.url || '' });
      }
    });

    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Log.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: view.width,
      height: view.height,
      deviceScaleFactor: 1,
      mobile: view.mobile,
    }, sessionId);
    await cdp.send('Page.navigate', { url: targetUrl }, sessionId);
    await waitFor(async () => {
      const ready = await evaluate(cdp, sessionId, 'document.readyState');
      const mounted = await evaluate(cdp, sessionId, 'Boolean(document.querySelector(".icon-catalog .icon-search"))');
      return ready === 'complete' && mounted;
    }, `${view.name} page mount`);
    await delay(300);

    await evaluate(cdp, sessionId, `(() => {
      document.documentElement.classList.toggle('dark', ${view.theme === 'dark'});
      document.documentElement.classList.toggle('lx-theme-hud', ${view.hud});
      window.scrollTo(0, 0);
      return true;
    })()`);

    const initialState = await evaluate(cdp, sessionId, `(() => {
      const groups = [...document.querySelectorAll('.icon-catalog details')];
      const p0 = groups.find((group) => group.querySelector('summary')?.textContent.includes('P0 高频核心'));
      const searchStatus = document.querySelector('.icon-search-status');
      const copyStatus = document.querySelector('.icon-copy-feedback');
      const arrow = p0?.querySelector('.icon-group-title .lx-icon');
      const catalog = document.querySelector('.icon-catalog');
      const checklist = document.querySelector('.icon-checklist');
      return {
        documentTitle: document.title,
        htmlDark: document.documentElement.classList.contains('dark'),
        htmlHud: document.documentElement.classList.contains('lx-theme-hud'),
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        catalogWidth: catalog?.getBoundingClientRect().width ?? null,
        p0: {
          exists: Boolean(p0),
          open: Boolean(p0?.open),
          tileCount: p0?.querySelectorAll('.icon-tile').length ?? 0,
          otherGroupsInitiallyOpen: groups.filter((group) => group !== p0 && group.open).length,
        },
        searchStatus: searchStatus ? {
          present: searchStatus.isConnected,
          role: searchStatus.getAttribute('role'),
          ariaLive: searchStatus.getAttribute('aria-live'),
          ariaAtomic: searchStatus.getAttribute('aria-atomic'),
          text: searchStatus.textContent.trim(),
          display: getComputedStyle(searchStatus).display,
          rect: { width: searchStatus.getBoundingClientRect().width, height: searchStatus.getBoundingClientRect().height },
        } : null,
        copyStatus: copyStatus ? {
          present: copyStatus.isConnected,
          role: copyStatus.getAttribute('role'),
          ariaLive: copyStatus.getAttribute('aria-live'),
          ariaAtomic: copyStatus.getAttribute('aria-atomic'),
          text: copyStatus.textContent.trim(),
          className: copyStatus.className,
        } : null,
        arrowTransition: arrow ? getComputedStyle(arrow).transition : null,
        tileTransition: p0?.querySelector('.icon-tile') ? getComputedStyle(p0.querySelector('.icon-tile')).transition : null,
        catalogBackground: catalog ? getComputedStyle(catalog).backgroundColor : null,
        hudPageToken: getComputedStyle(document.documentElement).getPropertyValue('--lx-bg-page').trim(),
        checklist: checklist ? {
          present: true,
          clientWidth: checklist.clientWidth,
          scrollWidth: checklist.scrollWidth,
          rows: [...checklist.querySelectorAll('.icon-checklist__row')].map((row) => ({
            title: row.querySelector('dt')?.textContent.trim() || '',
            width: Math.round(row.getBoundingClientRect().width),
            scrollWidth: row.scrollWidth,
            codeWidth: row.querySelector('code')?.getBoundingClientRect().width ?? null,
            codeScrollWidth: row.querySelector('code')?.scrollWidth ?? null,
          })),
        } : null,
      };
    })()`);

    let motionReduced = null;
    if (view.name === 'desktop-light') {
      await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);
      motionReduced = await evaluate(cdp, sessionId, `(() => {
        const p0 = [...document.querySelectorAll('.icon-catalog details')].find((group) => group.querySelector('summary')?.textContent.includes('P0 高频核心'));
        const arrow = p0?.querySelector('.icon-group-title .lx-icon');
        const tile = p0?.querySelector('.icon-tile');
        return {
          preference: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduce' : 'no-preference',
          arrowTransition: arrow ? getComputedStyle(arrow).transition : null,
          tileTransition: tile ? getComputedStyle(tile).transition : null,
        };
      })()`);
      await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] }, sessionId);
    }

    const consoleStart = consoleEvents.length;
    const injection = await evaluate(cdp, sessionId, `new Promise((resolve) => {
      const oldTitle = document.title;
      document.title = oldTitle + ' [Postfix Assessment B]';
      const marker = document.createElement('span');
      marker.id = 'postfix-assessment-b-preflight';
      document.body.appendChild(marker);
      const preflight = document.title.endsWith('[Postfix Assessment B]') && marker.isConnected;
      marker.remove();
      const script = document.createElement('script');
      script.src = 'http://localhost:${detectorPort}/detect.js';
      script.onload = () => resolve({ preflight, scriptLoaded: true, scriptSrc: script.src });
      script.onerror = () => resolve({ preflight, scriptLoaded: false, scriptSrc: script.src, error: 'script error event' });
      document.head.appendChild(script);
    })`);
    await delay(2600);
    const detectorReady = await evaluate(cdp, sessionId, 'typeof window.impeccableScan === "function"');

    const overlays = await evaluate(cdp, sessionId, `(() => {
      const nodes = [...document.querySelectorAll('.impeccable-overlay')];
      const summarizeTarget = (node) => {
        if (!node) return null;
        const text = (node.innerText || node.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 160);
        const path = [];
        let current = node;
        for (let i = 0; current && i < 6; i += 1, current = current.parentElement) {
          const classes = typeof current.className === 'string' ? current.className.trim().split(/\\s+/).filter(Boolean).slice(0, 2) : [];
          path.push(current.tagName.toLowerCase() + classes.map((name) => '.' + name).join(''));
        }
        return {
          tag: node.tagName.toLowerCase(),
          id: node.id || '',
          className: typeof node.className === 'string' ? node.className : '',
          text,
          ancestry: path.join(' < '),
        };
      };
      const hits = nodes.map((overlay) => {
        const target = overlay._targetEl || null;
        const rect = overlay.getBoundingClientRect();
        const selfTarget = Boolean(target?.closest?.('.impeccable-overlay, .impeccable-label, .impeccable-banner, .impeccable-tooltip, [id^="impeccable-live-"]'));
        const scope = overlay.classList.contains('impeccable-banner') ? 'page-level-banner'
          : selfTarget ? 'overlay-self'
          : target?.closest?.('.icon-catalog') ? 'component'
          : target === document.body || target === document.documentElement ? 'page-level'
          : target?.closest?.('.vp-doc') ? 'docs-content'
          : target ? 'outside-target' : 'no-target';
        return {
          overlayClass: overlay.className,
          visible: getComputedStyle(overlay).display !== 'none' && rect.width > 0 && rect.height > 0,
          labelText: overlay.querySelector('.impeccable-label')?.innerText?.trim() || '',
          scope,
          target: summarizeTarget(target),
        };
      });
      return {
        count: nodes.length,
        countsByScope: hits.reduce((counts, hit) => { counts[hit.scope] = (counts[hit.scope] || 0) + 1; return counts; }, {}),
        hits,
      };
    })()`);

    const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, sessionId);
    const screenshotName = `${view.name}.png`;
    await fs.writeFile(path.join(outDir, screenshotName), Buffer.from(screenshot.data, 'base64'));

    viewResults.push({
      name: view.name,
      url: targetUrl,
      viewport: { width: view.width, height: view.height, mobile: view.mobile },
      theme: view.theme,
      initialState,
      motionReduced,
      injection: { ...injection, detectorReady },
      overlay: overlays,
      screenshot: screenshotName,
      console: consoleEvents,
      consoleAfterInjection: consoleEvents.slice(consoleStart),
    });

    if (view.name === 'desktop-light') {
      interactionResults = await runInteractions(cdp, sessionId);
    }
  }

  const evidence = {
    targetUrl,
    source: 'linkx-fe/docs/components/lxicons.md',
    browser: { executable: chromePath, version: version.Browser, isolatedBrowserContext: true, newTabs: viewResults.length },
    interactions: interactionResults,
    views: viewResults,
  };
  await fs.writeFile(path.join(outDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  const summary = viewResults.map((view) => ({
    name: view.name,
    width: view.viewport.width,
    theme: view.theme,
    p0InitiallyOpen: view.initialState.p0.open,
    searchStatusPresent: view.initialState.searchStatus.present,
    checklistWidth: view.initialState.checklist?.clientWidth ?? null,
    checklistScrollWidth: view.initialState.checklist?.scrollWidth ?? null,
    injectionSucceeded: view.injection.preflight && view.injection.scriptLoaded && view.injection.detectorReady,
    overlayCount: view.overlay.count,
    overlayScopes: view.overlay.countsByScope,
    screenshot: view.screenshot,
  }));
  await fs.writeFile(path.join(outDir, 'browser-summary.json'), `${JSON.stringify({ views: summary, interactions: interactionResults }, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({ viewCount: summary.length, injectionCount: summary.filter((view) => view.injectionSucceeded).length, views: summary, interactions: interactionResults }, null, 2)}\n`);
} finally {
  if (cdp && browserContextId) {
    try { await cdp.send('Target.disposeBrowserContext', { browserContextId }); } catch {}
  }
  if (cdp) cdp.close();
  if (chrome.exitCode === null) {
    chrome.kill();
    await Promise.race([new Promise((resolve) => chrome.once('exit', resolve)), delay(2000)]);
  }
  await fs.rm(profilePath, { recursive: true, force: true });
}

async function runInteractions(cdp, sessionId) {
  const initial = await evaluate(cdp, sessionId, `(() => {
    const searchStatus = document.querySelector('.icon-search-status');
    const copyStatus = document.querySelector('.icon-copy-feedback');
    return {
      searchStatusConnectedBeforeSearch: Boolean(searchStatus?.isConnected),
      searchStatusRoleBeforeSearch: searchStatus?.getAttribute('role') || null,
      searchStatusAriaLiveBeforeSearch: searchStatus?.getAttribute('aria-live') || null,
      copyStatusConnectedBeforeCopy: Boolean(copyStatus?.isConnected),
      copyStatusRoleBeforeCopy: copyStatus?.getAttribute('role') || null,
      copyStatusAriaLiveBeforeCopy: copyStatus?.getAttribute('aria-live') || null,
      copyStatusInitiallyEmpty: copyStatus?.textContent.trim() === '',
    };
  })()`);

  await evaluate(cdp, sessionId, `(() => {
    const groups = [...document.querySelectorAll('.icon-catalog details')];
    const p0 = groups.find((group) => group.querySelector('summary')?.textContent.includes('P0 高频核心'));
    const tiles = p0?.querySelectorAll('.icon-tile') || [];
    const installClipboard = (writeText) => Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    window.__postfixClipboardWrites = [];
    installClipboard((text) => { window.__postfixClipboardWrites.push(text); return Promise.resolve(); });
    tiles[0]?.click();
    return { clicked: Boolean(tiles[0]) };
  })()`);
  await delay(160);
  const success = await evaluate(cdp, sessionId, `(() => {
    const feedback = document.querySelector('.icon-copy-feedback');
    return {
      message: feedback?.textContent.trim() || '',
      role: feedback?.getAttribute('role') || null,
      ariaLive: feedback?.getAttribute('aria-live') || null,
      className: feedback?.className || '',
      clipboardWrites: window.__postfixClipboardWrites || [],
      fallbackVisible: Boolean(document.querySelector('.icon-copy-fallback')),
      outsideNotifications: collectOutsideNotifications(),
    };
    function collectOutsideNotifications() {
      return [...document.querySelectorAll('[role="alert"], .el-message, .lx-message, [class*="toast"], [class*="notification"]')]
        .filter((node) => !node.closest('.icon-catalog'))
        .filter((node) => getComputedStyle(node).display !== 'none' && node.getBoundingClientRect().width > 0)
        .map((node) => ({ tag: node.tagName.toLowerCase(), className: typeof node.className === 'string' ? node.className : '', text: (node.innerText || node.textContent || '').trim().slice(0, 160), position: getComputedStyle(node).position, top: Math.round(node.getBoundingClientRect().top) }));
    }
  })()`);

  await evaluate(cdp, sessionId, `(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError')) },
    });
    const p0 = [...document.querySelectorAll('.icon-catalog details')].find((group) => group.querySelector('summary')?.textContent.includes('P0 高频核心'));
    p0?.querySelectorAll('.icon-tile')[1]?.click();
    return true;
  })()`);
  await delay(220);
  const failure = await evaluate(cdp, sessionId, `(() => {
    const feedback = document.querySelector('.icon-copy-feedback');
    const fallback = document.querySelector('.icon-copy-fallback textarea');
    const notices = [...document.querySelectorAll('[role="alert"], .el-message, .lx-message, [class*="toast"], [class*="notification"]')]
      .filter((node) => !node.closest('.icon-catalog'))
      .filter((node) => getComputedStyle(node).display !== 'none' && node.getBoundingClientRect().width > 0)
      .map((node) => ({ tag: node.tagName.toLowerCase(), className: typeof node.className === 'string' ? node.className : '', text: (node.innerText || node.textContent || '').trim().slice(0, 160), position: getComputedStyle(node).position, top: Math.round(node.getBoundingClientRect().top) }));
    return {
      message: feedback?.textContent.trim() || '',
      role: feedback?.getAttribute('role') || null,
      ariaLive: feedback?.getAttribute('aria-live') || null,
      className: feedback?.className || '',
      fallbackVisible: Boolean(fallback),
      fallbackValue: fallback?.value || '',
      fallbackFocused: document.activeElement === fallback,
      fallbackSelected: Boolean(fallback && fallback.selectionStart === 0 && fallback.selectionEnd === fallback.value.length),
      outsideNotifications: notices,
    };
  })()`);

  const search = await setSearch(cdp, sessionId, 'dashboard');
  const empty = await setSearch(cdp, sessionId, '__postfix_assessment_no_match__');
  return { initial, copySuccess: success, copyFailure: failure, searchResult: search, searchEmpty: empty };
}

async function setSearch(cdp, sessionId, query) {
  await evaluate(cdp, sessionId, `(() => {
    const input = document.querySelector('.icon-catalog .icon-search');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(query)});
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ${JSON.stringify(query)} }));
    return true;
  })()`);
  await delay(120);
  return evaluate(cdp, sessionId, `(() => {
    const status = document.querySelector('.icon-search-status');
    return {
      query: document.querySelector('.icon-catalog .icon-search')?.value || '',
      statusConnected: Boolean(status?.isConnected),
      statusRole: status?.getAttribute('role') || null,
      statusAriaLive: status?.getAttribute('aria-live') || null,
      statusText: status?.textContent.trim() || '',
      groupCount: document.querySelectorAll('.icon-catalog details').length,
      openGroupCount: document.querySelectorAll('.icon-catalog details[open]').length,
      tileCount: document.querySelectorAll('.icon-catalog .icon-tile').length,
      emptyVisual: {
        visible: Boolean(document.querySelector('.icon-empty')),
        ariaHidden: document.querySelector('.icon-empty')?.getAttribute('aria-hidden') || null,
        text: document.querySelector('.icon-empty')?.textContent.trim() || '',
      },
    };
  })()`);
}
