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
      const { port } = server.address();
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
      try {
        message = JSON.parse(String(event.data));
      } catch {
        return;
      }
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

  close() {
    this.socket.close();
  }
}

const chromePort = await freePort();
const profilePath = await fs.mkdtemp(path.join(os.tmpdir(), 'linkx-assessment-b-'));
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
const results = [];

try {
  const version = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${chromePort}/json/version`);
    return response.ok ? response.json() : null;
  }, 'isolated Chrome DevTools endpoint');
  cdp = new CDP(version.webSocketDebuggerUrl);
  await cdp.ready;
  const context = await cdp.send('Target.createBrowserContext', { disposeOnDetach: true });
  browserContextId = context.browserContextId;

  const views = [];
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900, mobile: false },
    { name: 'mobile-375', width: 375, height: 812, mobile: true },
  ]) {
    for (const theme of ['light', 'dark']) {
      for (const state of ['directory', 'empty']) {
        views.push({ viewport, theme, state, name: `${viewport.name}-${theme}-${state}` });
      }
    }
  }

  for (const view of views) {
    const { targetId } = await cdp.send('Target.createTarget', {
      url: 'about:blank',
      browserContextId,
    });
    const attached = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    const sessionId = attached.sessionId;
    const consoleEvents = [];
    cdp.listeners.add((message) => {
      if (message.sessionId !== sessionId) return;
      const params = message.params || {};
      if (message.method === 'Runtime.consoleAPICalled') {
        const parts = (params.args || []).map((arg) => arg.value ?? arg.description ?? arg.type ?? '');
        consoleEvents.push({
          source: 'Runtime.consoleAPICalled',
          type: params.type,
          text: parts.join(' ').slice(0, 600),
        });
      } else if (message.method === 'Runtime.exceptionThrown') {
        consoleEvents.push({
          source: 'Runtime.exceptionThrown',
          text: params.exceptionDetails?.text || params.exceptionDetails?.exception?.description || 'JavaScript exception',
        });
      } else if (message.method === 'Log.entryAdded') {
        consoleEvents.push({
          source: 'Log.entryAdded',
          level: params.entry?.level,
          text: params.entry?.text?.slice(0, 600) || '',
        });
      }
    });

    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Log.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: view.viewport.width,
      height: view.viewport.height,
      deviceScaleFactor: 1,
      mobile: view.viewport.mobile,
    }, sessionId);
    await cdp.send('Page.navigate', { url: targetUrl }, sessionId);
    await waitFor(async () => {
      const state = await evaluate(cdp, sessionId, 'document.readyState');
      const mounted = await evaluate(cdp, sessionId, 'Boolean(document.querySelector(".icon-catalog .icon-search"))');
      return state === 'complete' && mounted;
    }, `${view.name} document and Vue mount`);
    await delay(400);

    await evaluate(cdp, sessionId, `(() => {
      document.documentElement.classList.toggle('dark', ${view.theme === 'dark'});
      window.scrollTo(0, 0);
      return document.documentElement.classList.contains('dark');
    })()`);

    const filterBehavior = await evaluate(cdp, sessionId, `(() => {
      const input = document.querySelector('.icon-catalog .icon-search');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      const setQuery = (value) => {
        setter.call(input, value);
        input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
      };
      setQuery('dashboard');
      const first = [...document.querySelectorAll('.icon-catalog details')].map((item) => ({
        title: item.querySelector('summary')?.textContent?.trim() || '',
        open: item.open,
      }));
      setQuery('delete');
      const secondItems = [...document.querySelectorAll('.icon-catalog details')];
      const second = secondItems.map((item) => ({
        title: item.querySelector('summary')?.textContent?.trim() || '',
        open: item.open,
      }));
      return {
        firstQuery: 'dashboard',
        secondQuery: 'delete',
        firstVisibleGroups: first.length,
        firstOpenGroups: first.filter((item) => item.open).length,
        secondVisibleGroups: second.length,
        secondOpenGroups: second.filter((item) => item.open).length,
        changedQueryReopenedMatch: second.length > 0 && second.every((item) => item.open),
        firstGroupTitles: first.map((item) => item.title),
        secondGroupTitles: second.map((item) => item.title),
      };
    })()`);

    if (view.state === 'directory') {
      await evaluate(cdp, sessionId, `(() => {
        const input = document.querySelector('.icon-catalog .icon-search');
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(input, '');
        input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward', data: null }));
        return true;
      })()`);
      await delay(150);
      await evaluate(cdp, sessionId, `(() => {
        document.querySelectorAll('.icon-catalog details:not([open]) > summary').forEach((summary) => summary.click());
        window.scrollTo(0, 0);
        return true;
      })()`);
      await delay(100);
    } else {
      await evaluate(cdp, sessionId, `(() => {
        const input = document.querySelector('.icon-catalog .icon-search');
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(input, '__assessment_b_no_icon_match_20261006__');
        input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '__assessment_b_no_icon_match_20261006__' }));
        window.scrollTo(0, 0);
        return true;
      })()`);
      await delay(150);
    }

    const stateEvidence = await evaluate(cdp, sessionId, `(() => {
      const details = [...document.querySelectorAll('.icon-catalog details')];
      const status = document.querySelector('.icon-catalog [role="status"]');
      const input = document.querySelector('.icon-catalog .icon-search');
      const arrow = document.querySelector('.icon-catalog .icon-group-title .lx-icon');
      const bodyStyle = getComputedStyle(document.body);
      return {
        title: document.title,
        htmlDark: document.documentElement.classList.contains('dark'),
        query: input?.value ?? null,
        groupCount: details.length,
        openGroupCount: details.filter((item) => item.open).length,
        visibleTileCount: document.querySelectorAll('.icon-catalog .icon-tile').length,
        emptyStatus: status ? {
          text: status.textContent.trim(),
          role: status.getAttribute('role'),
          ariaLive: status.getAttribute('aria-live'),
          ariaAtomic: status.getAttribute('aria-atomic'),
        } : null,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        bodyBackground: bodyStyle.backgroundColor,
        bodyColor: bodyStyle.color,
        arrowTransition: arrow ? getComputedStyle(arrow).transition : null,
      };
    })()`);

    let reducedMotionEvidence = null;
    if (view.name === 'desktop-light-directory') {
      await cdp.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
      }, sessionId);
      reducedMotionEvidence = await evaluate(cdp, sessionId, `(() => {
        const arrow = document.querySelector('.icon-catalog .icon-group-title .lx-icon');
        return {
          preference: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduce' : 'no-preference',
          arrowTransition: arrow ? getComputedStyle(arrow).transition : null,
          arrowTransform: arrow ? getComputedStyle(arrow).transform : null,
        };
      })()`);
      await cdp.send('Emulation.setEmulatedMedia', { features: [] }, sessionId);
    }

    const consoleStart = consoleEvents.length;
    const injection = await evaluate(cdp, sessionId, `new Promise((resolve) => {
      const oldTitle = document.title;
      document.title = oldTitle + ' [Assessment B]';
      const sentinel = document.createElement('span');
      sentinel.id = 'assessment-b-injection-preflight';
      document.body.appendChild(sentinel);
      const preflight = document.title.endsWith('[Assessment B]') && sentinel.isConnected;
      sentinel.remove();
      const script = document.createElement('script');
      script.src = 'http://localhost:${detectorPort}/detect.js';
      script.onload = () => resolve({ preflight, scriptLoaded: true, scriptSrc: script.src });
      script.onerror = () => resolve({ preflight, scriptLoaded: false, scriptSrc: script.src, error: 'script error event' });
      document.head.appendChild(script);
    })`);

    await delay(2600);
    const runtimeReady = await evaluate(cdp, sessionId, 'typeof window.impeccableScan === "function"');
    const overlayEvidence = await evaluate(cdp, sessionId, `(() => {
      const nodeLabel = (node) => {
        if (!node) return '';
        if (node.id) return '#' + node.id;
        const classes = typeof node.className === 'string' ? node.className.trim().split(/\\s+/).filter(Boolean) : [];
        return node.tagName.toLowerCase() + classes.slice(0, 3).map((name) => '.' + name).join('');
      };
      const nodes = [...document.querySelectorAll('.impeccable-overlay')];
      const hits = nodes.map((overlay) => {
        const target = overlay._targetEl || null;
        const label = overlay.querySelector('.impeccable-label')?.innerText?.trim() || '';
        const rect = overlay.getBoundingClientRect();
        const targetText = (target?.innerText || target?.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 180);
        const isSelf = Boolean(target?.closest?.('.impeccable-overlay, .impeccable-label, .impeccable-banner, .impeccable-tooltip, [id^="impeccable-live-"]'));
        const scope = overlay.classList.contains('impeccable-banner') ? 'page-level-banner'
          : isSelf ? 'overlay-self'
          : target?.closest?.('.icon-catalog') ? 'component'
          : target?.closest?.('.vp-doc, .VPDoc, .VPContent, .VPNav, .VPSidebar, .VPFooter') ? 'docs-shell'
          : target ? 'outside-component' : 'no-target';
        return {
          overlayClass: overlay.className,
          label,
          target: nodeLabel(target),
          targetClass: typeof target?.className === 'string' ? target.className : '',
          targetText,
          scope,
          visible: getComputedStyle(overlay).display !== 'none' && rect.width > 0 && rect.height > 0,
          rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
        };
      });
      return {
        totalDomNodes: nodes.length,
        visibleCount: hits.filter((hit) => hit.visible).length,
        componentHits: hits.filter((hit) => hit.scope === 'component').length,
        docsShellHits: hits.filter((hit) => hit.scope === 'docs-shell').length,
        overlaySelfHits: hits.filter((hit) => hit.scope === 'overlay-self').length,
        pageLevelBanners: hits.filter((hit) => hit.scope === 'page-level-banner').length,
        hits,
      };
    })()`);

    const screenshot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false,
    }, sessionId);
    const screenshotName = `${view.name}.png`;
    await fs.writeFile(path.join(outDir, screenshotName), Buffer.from(screenshot.data, 'base64'));

    results.push({
      name: view.name,
      url: targetUrl,
      viewport: { width: view.viewport.width, height: view.viewport.height, mobile: view.viewport.mobile },
      theme: view.theme,
      state: view.state,
      screenshot: screenshotName,
      injection: { ...injection, runtimeReady },
      filterBehavior,
      stateEvidence,
      reducedMotionEvidence,
      console: consoleEvents,
      consoleAfterInjection: consoleEvents.slice(consoleStart),
      overlays: overlayEvidence,
    });
  }

  const report = {
    targetUrl,
    source: 'linkx-fe/docs/components/lxicons.md',
    browser: { executable: chromePath, version: version.Browser, isolatedContext: true, viewCount: results.length },
    views: results,
  };
  await fs.writeFile(path.join(outDir, 'browser-evidence.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  const summary = results.map((view) => ({
    name: view.name,
    injection: view.injection.scriptLoaded && view.injection.runtimeReady,
    statusRole: view.stateEvidence.emptyStatus?.role || null,
    reopenedAfterFilter: view.filterBehavior.changedQueryReopenedMatch,
    overlayNodes: view.overlays.totalDomNodes,
    componentHits: view.overlays.componentHits,
    docsShellHits: view.overlays.docsShellHits,
    selfHits: view.overlays.overlaySelfHits,
    consoleEvents: view.console.length,
    screenshot: view.screenshot,
  }));
  await fs.writeFile(path.join(outDir, 'browser-summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({ contextCreated: true, views: summary }, null, 2)}\n`);
} finally {
  if (cdp && browserContextId) {
    try { await cdp.send('Target.disposeBrowserContext', { browserContextId }); } catch {}
  }
  if (cdp) cdp.close();
  if (chrome.exitCode === null) {
    chrome.kill();
    await Promise.race([
      new Promise((resolve) => chrome.once('exit', resolve)),
      delay(2000),
    ]);
  }
  await fs.rm(profilePath, { recursive: true, force: true });
}

async function evaluate(cdpClient, sessionId, expression) {
  const result = await cdpClient.send('Runtime.evaluate', {
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
