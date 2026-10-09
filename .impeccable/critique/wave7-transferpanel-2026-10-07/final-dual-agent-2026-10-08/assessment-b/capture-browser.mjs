import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const edgePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const livePort = Number(process.argv[2]);
const siteBase = process.argv[3] || 'http://localhost:5173';
const targets = [
  { key: 'lxtransferpanel', path: '/components/lxtransferpanel.html', expectedHeading: 'LxTransferPanel' },
  { key: 'lxvirtualtree', path: '/components/lxvirtualtree.html', expectedHeading: 'LxVirtualTree' },
];
const profilePath = fs.mkdtempSync(path.join(os.tmpdir(), 'linkx-wave7-assessment-b-'));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = spawn(edgePath, [
  '--headless=new',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--disable-background-networking',
  '--no-sandbox',
  '--remote-debugging-port=0',
  `--user-data-dir=${profilePath}`,
  '--window-size=1440,1000',
], { stdio: 'ignore', windowsHide: true });
let browserSpawnError = null;
browser.on('error', (error) => { browserSpawnError = error; });
let cdp = null;
let browserContextId = null;

class CdpConnection {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async ready() {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP websocket open timeout')), 10000);
      this.socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      this.socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP websocket failed to open')); }, { once: true });
    });
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result || {});
        return;
      }
      for (const listener of this.listeners.get(message.method) || []) listener(message);
    });
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) || [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 15000);
      this.pending.set(id, {
        resolve: (value) => { clearTimeout(timer); resolve(value); },
        reject: (error) => { clearTimeout(timer); reject(error); },
      });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }

  close() {
    this.socket.close();
  }
}

async function waitFor(predicate, timeoutMs, description) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = await predicate();
    if (value) return value;
    await delay(200);
  }
  throw new Error(`Timed out waiting for ${description}`);
}

async function evaluate(cdp, sessionId, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  }, sessionId);
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Runtime.evaluate failed');
  }
  return result.result?.value;
}

async function main() {
  if (!Number.isInteger(livePort)) throw new Error('Missing live-server port argument');
  try {
    const profilePortFile = path.join(profilePath, 'DevToolsActivePort');
    const debugPort = await waitFor(() => {
      if (browserSpawnError) throw browserSpawnError;
      if (browser.exitCode !== null) throw new Error(`Edge exited with code ${browser.exitCode}`);
      if (!fs.existsSync(profilePortFile)) return null;
      return Number(fs.readFileSync(profilePortFile, 'utf8').split(/\r?\n/)[0]);
    }, 15000, 'Edge remote-debugging port');
    const versionResponse = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
    if (!versionResponse.ok) throw new Error(`Edge CDP discovery returned HTTP ${versionResponse.status}`);
    const version = await versionResponse.json();
    cdp = new CdpConnection(version.webSocketDebuggerUrl);
    await cdp.ready();
    const context = await cdp.send('Target.createBrowserContext', { disposeOnDetach: true });
    browserContextId = context.browserContextId;
    const evidence = {
      browser: {
        product: version.Browser,
        protocolVersion: version['Protocol-Version'],
        headless: true,
        isolatedUserDataDirectory: true,
        isolatedBrowserContextId: browserContextId,
        launchArgs: ['--headless=new', '--remote-debugging-port=0', '--window-size=1440,1000'],
      },
      siteBase,
      detectorUrl: `http://127.0.0.1:${livePort}/detect.js`,
      pages: [],
      mutationPreflight: null,
      notes: [
        '本次没有可用的 Codex 原生浏览器自动化接口；通过单独启动的 Edge 与 CDP 创建新 BrowserContext 和页面。',
        '页面为 headless，因此不能在 Codex 的 [Human] 标签中展示；标题使用 [Human] 前缀，截图和控制台数据记录在本目录。',
      ],
    };
    const saveEvidence = () => fs.writeFileSync(path.join(outputDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2));
    const detectorResponse = await fetch(evidence.detectorUrl);
    evidence.detectorAsset = {
      status: detectorResponse.status,
      contentType: detectorResponse.headers.get('content-type'),
      bytes: (await detectorResponse.arrayBuffer()).byteLength,
    };

    for (let index = 0; index < targets.length; index += 1) {
      const target = targets[index];
      const created = await cdp.send('Target.createTarget', {
        url: 'about:blank',
        browserContextId: context.browserContextId,
      });
      const attached = await cdp.send('Target.attachToTarget', { targetId: created.targetId, flatten: true });
      const sessionId = attached.sessionId;
      const consoleMessages = [];
      const runtimeErrors = [];
      const networkResponses = [];
      const failedRequests = [];
      cdp.on('Runtime.consoleAPICalled', (event) => {
        if (event.sessionId !== sessionId) return;
        const values = (event.params.args || []).map((arg) => arg.value ?? arg.description ?? arg.unserializableValue ?? '');
        const text = values.map((value) => typeof value === 'string' ? value : JSON.stringify(value)).join(' ');
        consoleMessages.push({ type: event.params.type, text });
      });
      cdp.on('Runtime.exceptionThrown', (event) => {
        if (event.sessionId !== sessionId) return;
        runtimeErrors.push(event.params.exceptionDetails?.text || event.params.exceptionDetails?.exception?.description || 'unknown runtime exception');
      });
      cdp.on('Network.responseReceived', (event) => {
        if (event.sessionId !== sessionId) return;
        if (event.params.response.url.includes('/components/') || event.params.response.url.includes('/detect.js')) {
          networkResponses.push({ url: event.params.response.url, status: event.params.response.status, mimeType: event.params.response.mimeType });
        }
      });
      cdp.on('Network.loadingFailed', (event) => {
        if (event.sessionId !== sessionId) return;
        failedRequests.push({ requestId: event.params.requestId, errorText: event.params.errorText, blockedReason: event.params.blockedReason || null });
      });
      await cdp.send('Page.enable', {}, sessionId);
      await cdp.send('Runtime.enable', {}, sessionId);
      await cdp.send('Network.enable', {}, sessionId);
      await cdp.send('Page.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
      const url = `${siteBase}${target.path}`;
      const navigation = await cdp.send('Page.navigate', { url }, sessionId);
      let pageReadiness;
      try {
        pageReadiness = await waitFor(async () => {
          try {
            const state = await evaluate(cdp, sessionId, `(() => ({
            readyState: document.readyState,
            heading: document.querySelector('.vp-doc h1')?.innerText?.trim() || document.querySelector('h1')?.innerText?.trim() || '',
            bodyTextLength: document.body?.innerText?.trim().length || 0,
            route: location.href
          }))()`);
            return state.heading && state.bodyTextLength >= 80 ? state : null;
          } catch {
            return null;
          }
        }, 25000, `${target.key} VitePress content`);
      } catch (error) {
        const currentState = await evaluate(cdp, sessionId, `(() => ({
          readyState: document.readyState,
          heading: document.querySelector('.vp-doc h1')?.innerText?.trim() || document.querySelector('h1')?.innerText?.trim() || '',
          bodyTextLength: document.body?.innerText?.trim().length || 0,
          route: location.href,
          title: document.title
        }))()`).catch(() => null);
        const failedScreenshot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true }, sessionId).catch(() => null);
        const screenshotPath = path.join(outputDir, `${target.key}-boot-failure.png`);
        if (failedScreenshot?.data) fs.writeFileSync(screenshotPath, Buffer.from(failedScreenshot.data, 'base64'));
        evidence.pages.push({
          key: target.key,
          targetUrl: url,
          targetPresent: false,
          navigationError: navigation.errorText || null,
          pageBootError: error instanceof Error ? error.message : String(error),
          currentState,
          consoleMessages,
          runtimeErrors,
          relevantNetworkResponses: networkResponses,
          failedRequests,
          screenshot: failedScreenshot?.data ? path.basename(screenshotPath) : null,
        });
        saveEvidence();
        throw new Error(`${target.key} route did not hydrate; diagnostic evidence was saved`);
      }

      let preflight = null;
      if (index === 0) {
        preflight = await evaluate(cdp, sessionId, `(() => {
          const originalTitle = document.title;
          document.title = '[Human] ' + originalTitle;
          const probe = document.createElement('script');
          probe.dataset.assessmentBPreflight = 'mutation-check';
          probe.textContent = 'window.__assessmentBMutationPreflight = true;';
          document.head.appendChild(probe);
          return {
            titleBefore: originalTitle,
            titleAfter: document.title,
            titleWritable: document.title.startsWith('[Human] '),
            scriptAppended: probe.parentNode === document.head,
            inlineScriptExecuted: window.__assessmentBMutationPreflight === true,
            probeId: probe.dataset.assessmentBPreflight
          };
        })()`);
        evidence.mutationPreflight = preflight;
        if (!preflight.titleWritable || !preflight.scriptAppended || !preflight.inlineScriptExecuted) {
          throw new Error(`Page mutation preflight failed: ${JSON.stringify(preflight)}`);
        }
      } else {
        await evaluate(cdp, sessionId, `document.title = '[Human] ' + document.title.replace(/^\\[Human\\]\\s*/, ''); true`);
      }

      const injection = await evaluate(cdp, sessionId, `(() => {
        const script = document.createElement('script');
        script.id = 'assessment-b-detector-script';
        script.src = ${JSON.stringify(evidence.detectorUrl)};
        script.onload = () => { script.dataset.assessmentStatus = 'loaded'; };
        script.onerror = () => { script.dataset.assessmentStatus = 'error'; };
        document.head.appendChild(script);
        return { appended: script.parentNode === document.head, src: script.src };
      })()`);
      const scriptStatus = await waitFor(async () => evaluate(cdp, sessionId, `document.getElementById('assessment-b-detector-script')?.dataset.assessmentStatus || ''`), 10000, `${target.key} detector script load`);
      await delay(3000);
      await evaluate(cdp, sessionId, 'window.scrollTo(0, 0); true');
      const domEvidence = await evaluate(cdp, sessionId, `(() => {
        const visible = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
        };
        const overlays = [...document.querySelectorAll('.impeccable-overlay')].map((overlay) => {
          const rect = overlay.getBoundingClientRect();
          const target = overlay._targetEl;
          return {
            className: overlay.className,
            label: overlay.innerText?.trim() || '',
            visible: visible(overlay),
            bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            target: target ? {
              tag: target.tagName.toLowerCase(),
              id: target.id || '',
              className: typeof target.className === 'string' ? target.className : '',
              text: target.innerText?.trim().slice(0, 180) || '',
              html: target.outerHTML?.slice(0, 450) || ''
            } : null
          };
        });
        return {
          title: document.title,
          route: location.href,
          heading: document.querySelector('.vp-doc h1')?.innerText?.trim() || document.querySelector('h1')?.innerText?.trim() || '',
          mainVisible: !!document.querySelector('.vp-doc') && visible(document.querySelector('.vp-doc')),
          bodyTextLength: document.body?.innerText?.trim().length || 0,
          viewport: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight },
          detectorScript: {
            exists: !!document.getElementById('assessment-b-detector-script'),
            status: document.getElementById('assessment-b-detector-script')?.dataset.assessmentStatus || 'pending',
            readyState: document.getElementById('assessment-b-detector-script')?.readyState || null
          },
          overlayCount: overlays.length,
          visibleOverlayCount: overlays.filter((overlay) => overlay.visible).length,
          overlays,
          firstViewportText: document.body?.innerText?.trim().slice(0, 1600) || ''
        };
      })()`);
      const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, sessionId);
      const screenshotPath = path.join(outputDir, `${target.key}-overlay.png`);
      fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
      const pageConsole = consoleMessages.filter((message) => message.text.toLowerCase().includes('impeccable'));
      evidence.pages.push({
        key: target.key,
        expectedHeading: target.expectedHeading,
        targetUrl: url,
        targetPresent: pageReadiness.heading.includes(target.expectedHeading),
        navigationError: navigation.errorText || null,
        heading: pageReadiness.heading,
        bodyTextLength: pageReadiness.bodyTextLength,
        preflight: index === 0 ? preflight : '在首个目标页通过后，本页使用同一隔离 BrowserContext 的新页面。',
        detectorInjection: { ...injection, scriptStatus, consoleMessages: pageConsole },
        runtimeErrors,
        relevantNetworkResponses: networkResponses,
        failedRequests,
        visualEvidence: { screenshot: path.basename(screenshotPath), ...domEvidence },
      });
      saveEvidence();
    }
    saveEvidence();
  } finally {
    if (cdp && browserContextId) {
      try { await cdp.send('Target.disposeBrowserContext', { browserContextId }); } catch {}
    }
    cdp?.close();
    if (browser.exitCode === null && browser.pid) browser.kill();
    await new Promise((resolve) => {
      if (browser.exitCode !== null) return resolve();
      browser.once('exit', resolve);
      setTimeout(resolve, 3000);
    });
    const resolvedProfile = path.resolve(profilePath);
    const tempRoot = path.resolve(os.tmpdir());
    if (resolvedProfile.startsWith(`${tempRoot}${path.sep}`)) fs.rmSync(resolvedProfile, { recursive: true, force: true });
  }

}

main().catch((error) => {
  const output = {
    failed: true,
    message: error instanceof Error ? error.message : String(error),
  };
  fs.writeFileSync(path.join(outputDir, 'browser-evidence.failure.json'), JSON.stringify(output, null, 2));
  process.exitCode = 1;
});
