import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(outputDir, 'screenshots');
const [targetUrl, livePortText, sourcePath, documentPath] = process.argv.slice(2);
const livePort = Number(livePortText);
const browserPath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'impeccable-wave7-transferpanel-edge-'));
const browserArgs = [
  '--new-window',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--remote-debugging-port=0',
  `--user-data-dir=${profileDir}`,
  'about:blank',
];
const quote = (value) => `"${value.replaceAll('"', '\\"')}"`;
const command = `${quote(browserPath)} ${browserArgs.map(quote).join(' ')}`;
const cdpEvents = [];
const pending = new Map();
const eventListeners = new Map();
let nextId = 0;
let socket;
let browserProcess;

fs.writeFileSync(path.join(outputDir, 'browser.command.txt'), `${command}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'browser-automation-fallback.txt'),
  'No native browser automation or browser-canvas screenshot tool was exposed in this session; no Playwright/Puppeteer package resolves from this workspace. A fresh isolated Microsoft Edge window and tab were controlled through its built-in Chrome DevTools Protocol using Node WebSocket.\n',
  'utf8');

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

function listen(method, sessionId, callback) {
  const key = `${sessionId || ''}:${method}`;
  const items = eventListeners.get(key) || [];
  items.push(callback);
  eventListeners.set(key, items);
}

function waitForEvent(method, sessionId, timeoutMs = 30_000) {
  const key = `${sessionId || ''}:${method}`;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeoutMs);
    listen(method, sessionId, (event) => {
      clearTimeout(timeout);
      resolve(event);
    });
  });
}

function cdpCall(method, params = {}, sessionId = undefined) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timed out waiting for CDP ${method}`));
    }, 30_000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}

function connectWebSocket(url) {
  return new Promise((resolve, reject) => {
    socket = new WebSocket(url);
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', () => reject(new Error('CDP WebSocket connection failed')), { once: true });
    socket.addEventListener('message', (event) => {
      let message;
      try { message = JSON.parse(String(event.data)); } catch { return; }
      if (message.id) {
        const task = pending.get(message.id);
        if (!task) return;
        clearTimeout(task.timeout);
        pending.delete(message.id);
        if (message.error) task.reject(new Error(message.error.message || `CDP ${message.id} failed`));
        else task.resolve(message.result || {});
        return;
      }
      if (!message.method) return;
      const key = `${message.sessionId || ''}:${message.method}`;
      for (const callback of eventListeners.get(key) || []) callback(message.params || {});
      if (message.sessionId) {
        const rootKey = `:${message.method}`;
        for (const callback of eventListeners.get(rootKey) || []) callback({ ...message.params, sessionId: message.sessionId });
      }
    });
  });
}

function evaluate(sessionId, expression, options = {}) {
  return cdpCall('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    ...options,
  }, sessionId).then((result) => {
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || 'Browser evaluation failed');
    }
    return result.result?.value;
  });
}

async function screenshot(sessionId, name) {
  const result = await cdpCall('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  }, sessionId);
  const filePath = path.join(screenshotsDir, name);
  fs.writeFileSync(filePath, Buffer.from(result.data, 'base64'));
  return { path: filePath, sha256: sha256(fs.readFileSync(filePath)) };
}

function describeConsoleArg(arg) {
  if (Object.hasOwn(arg, 'value')) return arg.value;
  return arg.description || arg.className || arg.type || '';
}

async function waitForDocument(sessionId) {
  const start = Date.now();
  while (Date.now() - start < 30_000) {
    const state = await evaluate(sessionId, 'document.readyState');
    if (state === 'complete') return;
    await delay(100);
  }
  throw new Error('Document did not reach readyState=complete within 30 seconds');
}

async function main() {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  browserProcess = spawn(browserPath, browserArgs, { stdio: ['ignore', 'ignore', 'ignore'], windowsHide: false });
  fs.writeFileSync(path.join(outputDir, 'browser-process.json'), `${JSON.stringify({ pid: browserProcess.pid, profileDir, windowMode: 'visible', keptOpenForHumanReview: true }, null, 2)}\n`, 'utf8');
  browserProcess.once('error', (error) => {
    fs.writeFileSync(path.join(outputDir, 'browser-launch-error.txt'), `${error.message}\n`, 'utf8');
  });

  const activePortFile = path.join(profileDir, 'DevToolsActivePort');
  let port;
  const portDeadline = Date.now() + 20_000;
  while (Date.now() < portDeadline) {
    try {
      port = Number(fs.readFileSync(activePortFile, 'utf8').split(/\r?\n/, 1)[0]);
      if (Number.isInteger(port) && port > 0) break;
    } catch { /* wait for Edge's DevTools endpoint */ }
    await delay(100);
  }
  if (!Number.isInteger(port) || port <= 0) throw new Error('Edge did not publish a DevTools port within 20 seconds');

  const version = await fetch(`http://127.0.0.1:${port}/json/version`).then((response) => response.json());
  await connectWebSocket(version.webSocketDebuggerUrl);
  const { targetId } = await cdpCall('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdpCall('Target.attachToTarget', { targetId, flatten: true });
  await cdpCall('Page.enable', {}, sessionId);
  await cdpCall('Runtime.enable', {}, sessionId);
  await cdpCall('Log.enable', {}, sessionId);
  await cdpCall('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 960,
    deviceScaleFactor: 1,
    mobile: false,
  }, sessionId);
  await cdpCall('Page.bringToFront', {}, sessionId);

  listen('Runtime.consoleAPICalled', sessionId, (event) => {
    cdpEvents.push({
      source: 'console',
      type: event.type,
      text: (event.args || []).map(describeConsoleArg).map(String).join(' '),
      timestamp: event.timestamp,
      url: event.stackTrace?.callFrames?.[0]?.url || null,
    });
  });
  listen('Runtime.exceptionThrown', sessionId, (event) => {
    cdpEvents.push({
      source: 'exception',
      type: 'error',
      text: event.exceptionDetails?.text || 'Uncaught browser exception',
      url: event.exceptionDetails?.url || null,
      lineNumber: event.exceptionDetails?.lineNumber ?? null,
    });
  });
  listen('Log.entryAdded', sessionId, (event) => {
    const entry = event.entry || {};
    cdpEvents.push({
      source: 'log',
      type: entry.level || 'log',
      text: entry.text || '',
      url: entry.url || null,
      lineNumber: entry.lineNumber ?? null,
    });
  });

  const response = await fetch(targetUrl);
  const responseBytes = Buffer.from(await response.arrayBuffer());
  const responseHash = sha256(responseBytes);
  const loadEvent = waitForEvent('Page.loadEventFired', sessionId);
  await cdpCall('Page.navigate', { url: targetUrl }, sessionId);
  await loadEvent;
  await waitForDocument(sessionId);
  await delay(900);
  await evaluate(sessionId, 'window.scrollTo(0, 0)');

  const baseline = await evaluate(sessionId, `(() => ({
    title: document.title,
    url: location.href,
    html: document.documentElement.outerHTML,
    text: document.body.innerText.slice(0, 5000),
    headings: Array.from(document.querySelectorAll('h1,h2,h3')).slice(0, 30).map((node) => node.innerText.trim()),
    buttonCount: document.querySelectorAll('button').length,
    inputCount: document.querySelectorAll('input').length,
  }))()`);
  const sourceBytes = fs.readFileSync(sourcePath);
  const documentBytes = fs.readFileSync(documentPath);
  const baselineHtmlHash = sha256(Buffer.from(baseline.html, 'utf8'));
  const before = await screenshot(sessionId, 'desktop-before-injection.png');

  const preflight = await evaluate(sessionId, `(() => {
    document.title = '[Human] LxTransferPanel Assessment B';
    const probe = document.createElement('script');
    probe.dataset.assessmentBPreflight = 'true';
    probe.textContent = 'window.__assessmentBInlineScriptExecuted = true';
    document.head.appendChild(probe);
    return {
      titleChanged: document.title === '[Human] LxTransferPanel Assessment B',
      scriptAppended: probe.isConnected && probe.tagName === 'SCRIPT',
      scriptExecuted: window.__assessmentBInlineScriptExecuted === true,
      headMutable: document.head.contains(probe),
    };
  })()`);

  const detectorUrl = `http://127.0.0.1:${livePort}/detect.js`;
  const detectorResourceResponse = await fetch(detectorUrl);
  const detectorResourceBytes = Buffer.from(await detectorResourceResponse.arrayBuffer());
  const detectorResourceHash = sha256(detectorResourceBytes);
  const injection = await evaluate(sessionId, `(() => {
    const script = document.createElement('script');
    script.src = ${JSON.stringify(detectorUrl)};
    script.async = true;
    script.dataset.assessmentBDetector = 'true';
    script.addEventListener('load', () => { window.__assessmentBDetectorLoaded = true; }, { once: true });
    script.addEventListener('error', () => { window.__assessmentBDetectorLoadError = true; }, { once: true });
    document.head.appendChild(script);
    window.scrollTo(0, 0);
    return { scriptAppended: script.isConnected, src: script.src, title: document.title };
  })()`);

  await delay(2_800);
  const scan = await evaluate(sessionId, `(() => {
    const available = typeof window.impeccableScan === 'function'
      && typeof window.impeccableDetect === 'function';
    if (!available) return { available: false, reason: 'window.impeccableScan or window.impeccableDetect missing' };
    const findings = window.impeccableDetect();
    window.impeccableScan();
    return {
      available: true,
      loadEvent: window.__assessmentBDetectorLoaded === true,
      loadError: window.__assessmentBDetectorLoadError === true,
      findings: Array.isArray(findings) ? findings : [],
      overlayCount: document.querySelectorAll('.impeccable-overlay').length,
      overlayLabels: Array.from(document.querySelectorAll('.impeccable-label')).map((node) => node.innerText.trim()),
    };
  })()`);
  await delay(400);
  const desktop = await screenshot(sessionId, 'desktop-after-injection.png');

  await cdpCall('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: 390,
    screenHeight: 844,
  }, sessionId);
  await evaluate(sessionId, 'window.scrollTo(0, 0)');
  await delay(500);
  const mobileState = await evaluate(sessionId, `(() => ({
    width: innerWidth,
    height: innerHeight,
    documentWidth: document.documentElement.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
  }))()`);
  const mobile = await screenshot(sessionId, 'mobile-after-injection.png');

  await cdpCall('Emulation.clearDeviceMetricsOverride', {}, sessionId);
  await evaluate(sessionId, 'window.scrollTo(0, 0)');
  await cdpCall('Page.bringToFront', {}, sessionId);
  const browserFindings = cdpEvents.filter((entry) => (
    /\[impeccable\]/i.test(entry.text)
    || entry.type === 'error'
    || entry.type === 'warning'
  ));
  const pageStateAfterScan = await evaluate(sessionId, `(() => ({
    title: document.title,
    url: location.href,
    detectorLoaded: window.__assessmentBDetectorLoaded === true,
    detectorAvailable: typeof window.impeccableScan === 'function',
    overlayCount: document.querySelectorAll('.impeccable-overlay').length,
    scrollTop: window.scrollY,
  }))()`);

  fs.writeFileSync(path.join(outputDir, 'browser-console.json'), `${JSON.stringify({ all: cdpEvents, findings: browserFindings }, null, 2)}\n`, 'utf8');
  const evidence = {
    browser: {
      name: 'Microsoft Edge',
      version: version.Browser || null,
      executable: browserPath,
      windowMode: 'visible',
      processId: browserProcess.pid,
      profileDir,
      targetId,
      tabTitle: pageStateAfterScan.title,
      keptOpenForHumanReview: true,
    },
    target: {
      url: targetUrl,
      httpStatus: response.status,
      responseBytes: responseBytes.length,
      responseSha256: responseHash,
      loadedTitleBeforeMutation: baseline.title,
      loadedUrl: baseline.url,
      documentDomSha256BeforeMutation: baselineHtmlHash,
      visibleTextExcerpt: baseline.text,
      headings: baseline.headings,
      buttonCount: baseline.buttonCount,
      inputCount: baseline.inputCount,
    },
    hashes: {
      componentSource: { path: sourcePath, sha256: sha256(sourceBytes) },
      documentSource: { path: documentPath, sha256: sha256(documentBytes) },
      servedDocumentResponse: { url: targetUrl, sha256: responseHash, bytes: responseBytes.length },
      browserDomBeforeMutation: { sha256: baselineHtmlHash, note: 'document.documentElement.outerHTML after page load and before title/script preflight mutations' },
    },
    preflight,
    injection: {
      scriptUrl: detectorUrl,
      scriptAppended: injection.scriptAppended,
      responseStatus: detectorResourceResponse.status,
      responseBytes: detectorResourceBytes.length,
      responseSha256: detectorResourceHash,
      loadEvent: scan.loadEvent === true,
      loadError: scan.loadError === true,
      detectorAvailable: scan.available === true,
      detectorRan: scan.available === true,
      findings: scan.findings || [],
      overlayCount: scan.overlayCount ?? null,
      overlayLabels: scan.overlayLabels || [],
    },
    pageStateAfterScan,
    mobileState,
    console: {
      totalEvents: cdpEvents.length,
      findingCount: browserFindings.length,
      findingsFile: path.join(outputDir, 'browser-console.json'),
    },
    screenshots: { desktopBefore: before, desktopAfter: desktop, mobileAfter: mobile },
    automation: {
      method: 'Fresh Edge tab controlled using built-in CDP over Node WebSocket',
      fallback: 'Native browser automation interface and workspace Playwright/Puppeteer packages were unavailable.',
      userVisibleOverlay: scan.available === true && scan.loadEvent === true && (scan.overlayCount || 0) > 0,
    },
  };
  fs.writeFileSync(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'browser-runner.exit-code.txt'), '0\n', 'utf8');
  process.stdout.write(JSON.stringify({
    pid: browserProcess.pid,
    targetId,
    pageStatus: response.status,
    preflight,
    injection: {
      scriptAppended: injection.scriptAppended,
      loadEvent: scan.loadEvent === true,
      detectorAvailable: scan.available === true,
      findingCount: (scan.findings || []).length,
      overlayCount: scan.overlayCount ?? null,
    },
    consoleFindings: browserFindings,
    screenshots: [before.path, desktop.path, mobile.path],
  }) + '\n');
  // Keep this isolated visible Edge window open so the [Human] tab remains reviewable.
}

main().catch((error) => {
  try { browserProcess?.kill(); } catch { /* leave no browser process after a failed capture */ }
  fs.writeFileSync(path.join(outputDir, 'browser-runner.error.txt'), `${error.stack || error.message}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'browser-runner.exit-code.txt'), '1\n', 'utf8');
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
