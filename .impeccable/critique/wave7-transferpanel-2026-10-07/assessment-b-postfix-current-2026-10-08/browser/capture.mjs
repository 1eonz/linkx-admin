import fs from 'node:fs/promises';
import path from 'node:path';

const outputDir = path.resolve(process.argv[2]);
const docsUrl = process.argv[3];
const detectorUrl = process.argv[4];
const cdpBase = process.argv[5] || 'http://127.0.0.1:9222';

if (!outputDir || !docsUrl || !detectorUrl) {
  throw new Error('Usage: node capture.mjs <output-dir> <docs-url> <detector-url> [cdp-base]');
}

const cases = [
  { name: 'desktop-ready-light', width: 1440, height: 1100, state: 'ready', dark: false },
  { name: 'narrow-ready-light', width: 390, height: 844, state: 'ready', dark: false },
  { name: 'desktop-empty-light', width: 1440, height: 1100, state: 'empty', dark: false },
  { name: 'narrow-loading-dark', width: 390, height: 844, state: 'loading', dark: true },
  { name: 'desktop-error-dark', width: 1440, height: 1100, state: 'error', dark: true },
];

await fs.mkdir(path.join(outputDir, 'screenshots'), { recursive: true });
await fs.mkdir(path.join(outputDir, 'pages'), { recursive: true });

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function newTarget() {
  const response = await fetch(`${cdpBase}/json/new?about:blank`, { method: 'PUT' });
  if (!response.ok) throw new Error(`CDP new target failed: HTTP ${response.status}`);
  return response.json();
}

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  const events = [];
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id !== undefined) {
      const entry = pending.get(message.id);
      if (!entry) return;
      pending.delete(message.id);
      clearTimeout(entry.timer);
      if (message.error) entry.reject(new Error(message.error.message));
      else entry.resolve(message.result || {});
      return;
    }
    events.push(message);
  });

  function send(method, params = {}, timeoutMs = 30000) {
    const id = ++nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, timeoutMs);
      pending.set(id, { resolve, reject, timer });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression, options = {}) {
    const response = await send('Runtime.evaluate', {
      expression,
      awaitPromise: options.awaitPromise ?? false,
      returnByValue: options.returnByValue ?? true,
      userGesture: options.userGesture ?? false,
      timeout: options.timeout ?? 20000,
    }, (options.timeout ?? 20000) + 5000);
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
    }
    return response.result?.value;
  }

  function drainEvents() {
    return events.splice(0);
  }

  function close() {
    for (const { timer, reject } of pending.values()) {
      clearTimeout(timer);
      reject(new Error('CDP connection closed'));
    }
    pending.clear();
    ws.close();
  }

  return { send, evaluate, drainEvents, close };
}

async function waitForDocs(page) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const ready = await page.evaluate(`Boolean(document.querySelector('.transfer-panel-demo .lx-transfer-panel'))`);
    if (ready) return;
    await delay(250);
  }
  throw new Error('Docs demo panel did not render within 20 seconds');
}

function consoleRecords(events) {
  return events
    .filter((event) => event.method === 'Runtime.consoleAPICalled' || event.method === 'Log.entryAdded' || event.method === 'Runtime.exceptionThrown')
    .map((event) => {
      if (event.method === 'Runtime.consoleAPICalled') {
        const args = event.params.args || [];
        const text = args.map((arg) => arg.value ?? arg.description ?? '').join(' ');
        return {
          method: event.method,
          type: event.params.type,
          text,
          args: args.map((arg) => ({ type: arg.type, value: arg.value, description: arg.description, subtype: arg.subtype })),
        };
      }
      if (event.method === 'Log.entryAdded') {
        const entry = event.params.entry;
        return { method: event.method, level: entry.level, text: entry.text, url: entry.url, lineNumber: entry.lineNumber };
      }
      return { method: event.method, text: event.params.exceptionDetails?.text, url: event.params.exceptionDetails?.url };
    });
}

const completed = [];
for (const item of cases) {
  const target = await newTarget();
  const page = await connect(target.webSocketDebuggerUrl);
  try {
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Log.enable');
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: item.width,
      height: item.height,
      deviceScaleFactor: 1,
      mobile: item.width < 600,
      screenWidth: item.width,
      screenHeight: item.height,
    });

    const loaded = new Promise((resolve) => {
      const check = setInterval(async () => {
        try {
          const value = await page.evaluate(`document.readyState === 'complete'`);
          if (value) {
            clearInterval(check);
            resolve();
          }
        } catch {}
      }, 200);
      setTimeout(() => {
        clearInterval(check);
        resolve();
      }, 30000);
    });
    await page.send('Page.navigate', { url: docsUrl });
    await loaded;
    await waitForDocs(page);

    const preflight = await page.evaluate(`(() => {
      document.title = '[Human] Assessment B ${item.name}';
      const script = document.createElement('script');
      script.dataset.impeccablePreflight = '${item.name}';
      document.head.appendChild(script);
      return {
        title: document.title,
        scriptAttached: script.parentElement === document.head,
        scriptCount: document.head.querySelectorAll('script[data-impeccable-preflight]').length,
      };
    })()`);

    await page.evaluate(`(() => {
      const details = document.querySelector('.transfer-panel-demo__settings');
      if (details) details.open = true;
      const desired = ${JSON.stringify(item.state)};
      const stateLabels = { ready: '正常数据', empty: '空结果', loading: '加载中', error: '加载失败' };
      const stateButton = [...document.querySelectorAll('.transfer-panel-demo__toolbar-group button')]
        .find((button) => button.textContent.trim() === stateLabels[desired]);
      if (stateButton && desired !== 'ready') stateButton.click();
      const darkLabel = [...document.querySelectorAll('.transfer-panel-demo label')]
        .find((label) => label.textContent.includes('HUD 深色主题'));
      const darkInput = darkLabel?.querySelector('input');
      if (darkInput && darkInput.checked !== ${item.dark}) darkInput.click();
      const demo = document.querySelector('.transfer-panel-demo');
      demo?.scrollIntoView({ block: 'start', behavior: 'instant' });
      if (demo) window.scrollTo(0, Math.max(0, demo.getBoundingClientRect().top + window.scrollY - 62));
      return { state: desired, dark: darkInput?.checked ?? false, demoFound: Boolean(demo) };
    })()`);
    await delay(400);
    const baseline = await page.evaluate(`(() => {
      const root = document.documentElement;
      const body = document.body;
      const candidates = [...document.querySelectorAll('body *')]
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
            && style.position !== 'fixed' && (rect.left < -1 || rect.right > root.clientWidth + 1);
        })
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const className = typeof element.className === 'string' ? element.className.trim().split(/\\s+/).slice(0, 4).join('.') : '';
          return {
            tag: element.tagName.toLowerCase(),
            className,
            id: element.id,
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            text: element.children.length === 0 ? element.textContent.trim().replace(/\\s+/g, ' ').slice(0, 90) : '',
          };
        })
        .sort((a, b) => Math.max(b.right - root.clientWidth, -b.left) - Math.max(a.right - root.clientWidth, -a.left))
        .slice(0, 15);
      return {
        viewport: { innerWidth, innerHeight, visualWidth: visualViewport?.width, visualHeight: visualViewport?.height, screenWidth: screen.width, screenHeight: screen.height, devicePixelRatio },
        pageWidth: { client: root.clientWidth, scroll: root.scrollWidth, overflow: root.scrollWidth > root.clientWidth + 1, bodyScroll: body.scrollWidth },
        viewportMeta: document.querySelector('meta[name="viewport"]')?.content || null,
        overflowCandidates: candidates,
      };
    })()`);

    const injection = await page.evaluate(`new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = ${JSON.stringify(detectorUrl)};
      script.dataset.assessment = '${item.name}';
      script.onload = () => resolve({ loaded: true, src: script.src });
      script.onerror = () => reject(new Error('Detector script load failed: ' + script.src));
      document.head.appendChild(script);
    })`, { awaitPromise: true, timeout: 25000 });
    await delay(2700);
    const forcedScan = await page.evaluate(`(() => {
      if (typeof window.impeccableScan !== 'function') return { available: false, overlays: 0 };
      const findings = window.impeccableScan();
      return {
        available: true,
        scanResultCount: Array.isArray(findings) ? findings.length : null,
        overlays: document.querySelectorAll('.impeccable-overlay').length,
        banners: document.querySelectorAll('.impeccable-banner').length,
      };
    })()`);
    await delay(1200);

    const evidence = await page.evaluate(`(() => {
      const demo = document.querySelector('.transfer-panel-demo');
      const panel = document.querySelector('.transfer-panel-demo .lx-transfer-panel');
      const rect = (element) => element?.getBoundingClientRect().toJSON() ?? null;
      const chain = (element) => {
        const values = [];
        for (let node = element; node && values.length < 7; node = node.parentElement) {
          const className = typeof node.className === 'string' ? node.className.trim().split(/\\s+/).slice(0, 3).join('.') : '';
          values.push(node.tagName.toLowerCase() + (node.id ? '#' + node.id : '') + (className ? '.' + className : ''));
        }
        return values;
      };
      const overlays = [...document.querySelectorAll('.impeccable-overlay')].map((overlay) => {
        const target = overlay._targetEl;
        const label = overlay.querySelector('.impeccable-label')?.textContent?.trim() || '';
        return {
          label,
          targetTag: target?.tagName?.toLowerCase() || null,
          targetClass: typeof target?.className === 'string' ? target.className : '',
          targetId: target?.id || '',
          targetText: target?.textContent?.trim().replace(/\\s+/g, ' ').slice(0, 150) || '',
          targetRect: rect(target),
          ancestorChain: chain(target),
          insideTransferDemo: Boolean(target?.closest('.transfer-panel-demo')),
          insideDocsShell: Boolean(target?.closest('.VPDoc, .VPContent, .VPNav, .VPSidebar, .VPDocAside')),
        };
      });
      const status = document.querySelector('[data-testid="transfer-status"]');
      const root = document.documentElement;
      const body = document.body;
      const demoRect = rect(demo);
      const panelRect = rect(panel);
      return {
        title: document.title,
        location: location.href,
        viewport: { innerWidth, innerHeight, visualWidth: visualViewport?.width, visualHeight: visualViewport?.height, screenWidth: screen.width, screenHeight: screen.height, devicePixelRatio },
        pageWidth: { client: root.clientWidth, scroll: root.scrollWidth, overflow: root.scrollWidth > root.clientWidth + 1, bodyScroll: body.scrollWidth },
        theme: {
          htmlClasses: [...root.classList],
          demoClasses: demo?.className || '',
          darkCheckbox: [...document.querySelectorAll('.transfer-panel-demo label')].find((label) => label.textContent.includes('HUD 深色主题'))?.querySelector('input')?.checked ?? false,
        },
        hostState: [...document.querySelectorAll('.transfer-panel-demo__toolbar-group[aria-label="宿主数据状态"] button')]
          .filter((button) => button.getAttribute('aria-pressed') === 'true')
          .map((button) => button.textContent.trim()),
        actionStatus: status?.textContent?.trim().replace(/\\s+/g, ' ') || '',
        selectedSummary: document.querySelector('[data-testid="selected-count"]')?.textContent?.trim() || '',
        demoRect,
        panelRect,
        panelScroll: panel ? { scroll: panel.scrollWidth, client: panel.clientWidth, overflow: panel.scrollWidth > panel.clientWidth + 1 } : null,
        overlayCount: overlays.length,
        overlays,
      };
    })()`);

    const screenshot = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
    const screenshotPath = path.join('screenshots', `${item.name}.png`);
    await fs.writeFile(path.join(outputDir, screenshotPath), Buffer.from(screenshot.data, 'base64'));
    const record = {
      case: item,
      targetId: target.id,
      preflight,
      baseline,
      injection,
      forcedScan,
      evidence,
      screenshot: screenshotPath,
      console: consoleRecords(page.drainEvents()),
    };
    await fs.writeFile(path.join(outputDir, 'pages', `${item.name}.json`), `${JSON.stringify(record, null, 2)}\n`);
    completed.push({ name: item.name, targetId: target.id, screenshot: screenshotPath, preflight, baseline, injection, forcedScan, overlayCount: evidence.overlayCount, overflow: evidence.pageWidth.overflow, panelOverflow: evidence.panelScroll?.overflow, state: evidence.hostState, theme: evidence.theme });
    page.close();
  } catch (error) {
    const record = {
      case: item,
      targetId: target.id,
      error: String(error?.stack || error),
      console: consoleRecords(page.drainEvents()),
    };
    await fs.writeFile(path.join(outputDir, 'pages', `${item.name}.failure.json`), `${JSON.stringify(record, null, 2)}\n`);
    completed.push({ name: item.name, targetId: target.id, failed: record.error });
    page.close();
  }
}

await fs.writeFile(path.join(outputDir, 'capture-index.json'), `${JSON.stringify({ docsUrl, detectorUrl, cdpBase, completed }, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(completed, null, 2)}\n`);
