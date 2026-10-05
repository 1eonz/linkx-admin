import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outputDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(outputDirectory, '..', '..', '..', '..');
const screenshotsDirectory = path.join(outputDirectory, 'screenshots');
const reportPath = path.join(outputDirectory, 'browser-evidence.json');
const baseUrl = process.env.LINKX_PREVIEW_URL || 'http://127.0.0.1:4177';
const overlayUrl = process.env.IMPECCABLE_DETECT_URL || null;
const edgePath = process.env.BROWSER_EXECUTABLE
  || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outputEncoding = 'utf8';

const targets = [
  { name: 'LxCheckbox', route: '/components/lxcheckbox', selector: '[data-testid="group"]', kind: 'checkbox' },
  { name: 'LxCheckboxGroup', route: '/components/lxcheckbox', selector: '[data-testid="group"]', kind: 'checkbox' },
  { name: 'LxRadio', route: '/components/lxradio', selector: '[data-testid="horizontal"]', kind: 'radio' },
  { name: 'LxRadioGroup', route: '/components/lxradio', selector: '[data-testid="vertical"]', kind: 'radio' },
];
const requestedTargetNames = new Set((process.env.LINKX_TARGET_NAMES || '')
  .split(',').map((name) => name.trim()).filter(Boolean));
const selectedTargets = requestedTargetNames.size
  ? targets.filter((target) => requestedTargetNames.has(target.name))
  : targets;
if (requestedTargetNames.size && selectedTargets.length !== requestedTargetNames.size) {
  throw new Error(`未知目标：${[...requestedTargetNames].filter((name) => !selectedTargets.some((target) => target.name === name)).join(', ')}`);
}

const views = [
  { name: 'light-desktop', width: 1440, height: 960, colorScheme: 'light', section: 'primary' },
  { name: 'hud-dark-desktop', width: 1440, height: 960, colorScheme: 'dark', hud: true, section: 'primary' },
  { name: 'touch-375', width: 375, height: 812, colorScheme: 'light', touch: true, section: 'primary' },
  { name: 'disabled-light-desktop', width: 1440, height: 960, colorScheme: 'light', disabled: true },
  { name: 'disabled-hud-desktop', width: 1440, height: 960, colorScheme: 'dark', hud: true, disabled: true },
  { name: 'keyboard-focus-light-desktop', width: 1440, height: 960, colorScheme: 'light', keyboardFocus: true, section: 'primary' },
  { name: 'keyboard-focus-hud-desktop', width: 1440, height: 960, colorScheme: 'dark', hud: true, keyboardFocus: true, section: 'primary' },
  { name: 'reduced-motion-desktop', width: 1440, height: 960, colorScheme: 'light', reducedMotion: true, section: 'primary' },
];

const previousReport = await readFile(reportPath, 'utf8').then(JSON.parse).catch(() => null);
const report = {
  ...(previousReport || {}),
  method: 'Edge headless over the Chrome DevTools Protocol; each target used a fresh Edge process and temporary user-data directory.',
  nativeBrowserAttempt: 'CUA refused IAB visibility in the sub-agent thread and the Edge connector was unavailable; isolated headless Edge over CDP was used as fallback.',
  originalPort: { url: 'http://127.0.0.1:4174', result: 'connection refused; no listener or PID 26412 was present when checked.' },
  previewUrl: baseUrl,
  overlayUrl: overlayUrl ? overlayUrl.replace(/([?&]token=)[^&]+/g, '$1[redacted]') : null,
  overlayClaim: 'An overlay is reported only for views whose detector script load completed and whose script node remained in the page.',
  scope: selectedTargets.map((target) => target.name),
  checkboxEvidencePreserved: Boolean(requestedTargetNames.size && previousReport?.targets?.some((target) => target.name === 'LxCheckbox')),
  startedAt: new Date().toISOString(),
  targets: requestedTargetNames.size
    ? (previousReport?.targets || []).filter((target) => !requestedTargetNames.has(target.name))
    : [],
};

class CdpConnection {
  constructor(webSocketUrl) {
    this.socket = new WebSocket(webSocketUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.opened = new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
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
      const handlers = this.listeners.get(message.method) || [];
      for (const handler of handlers) handler(message.params || {}, message.sessionId || null);
    });
  }

  async send(method, params = {}, sessionId = null) {
    await this.opened;
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    const response = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.socket.send(JSON.stringify(payload));
    return response;
  }

  on(method, handler) {
    const handlers = this.listeners.get(method) || [];
    handlers.push(handler);
    this.listeners.set(method, handlers);
    return () => this.listeners.set(method, (this.listeners.get(method) || []).filter((item) => item !== handler));
  }

  waitFor(method, predicate = () => true, timeoutMs = 15000, sessionId = null) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error(`等待 DevTools 事件超时：${method}`));
      }, timeoutMs);
      const unsubscribe = this.on(method, (params, eventSessionId) => {
        if (sessionId && eventSessionId !== sessionId) return;
        if (!predicate(params)) return;
        clearTimeout(timer);
        unsubscribe();
        resolve(params);
      });
    });
  }

  close() {
    try { this.socket.close(); } catch {}
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function findFreePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function waitForDevTools(port, child, stderrLines) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Edge 在 DevTools 启动前退出（${child.exitCode}）：${stderrLines.join('').slice(-1200)}`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return await response.json();
    } catch {}
    await delay(200);
  }
  throw new Error(`Edge DevTools 端口 ${port} 未就绪。`);
}

async function evaluate(connection, sessionId, expression, awaitPromise = false) {
  const response = await connection.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true,
  }, sessionId);
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
  }
  return response.result?.value;
}

function sectionSelector(target, view) {
  if (view.disabled) return target.kind === 'checkbox' ? '[data-testid="disabled-states"]' : '[data-testid="vertical"]';
  return target.selector;
}

async function configurePage(connection, sessionId, target, view) {
  await connection.send('Emulation.setDeviceMetricsOverride', {
    width: view.width,
    height: view.height,
    deviceScaleFactor: 1,
    mobile: Boolean(view.touch),
    screenWidth: view.width,
    screenHeight: view.height,
  }, sessionId);
  const touchOptions = { enabled: Boolean(view.touch) };
  if (view.touch) touchOptions.maxTouchPoints = 1;
  await connection.send('Emulation.setTouchEmulationEnabled', touchOptions, sessionId);
  await connection.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-color-scheme', value: view.colorScheme },
      { name: 'prefers-reduced-motion', value: view.reducedMotion ? 'reduce' : 'no-preference' },
    ],
  }, sessionId);

  const selector = sectionSelector(target, view);
  const state = await evaluate(connection, sessionId, `(() => {
    const root = document.documentElement;
    const themeToggle = [...document.querySelectorAll('input[type="checkbox"]')]
      .find((input) => input.closest('label')?.textContent?.includes('HUD 深色主题'));
    if (themeToggle && themeToggle.checked !== ${Boolean(view.hud)}) themeToggle.click();
    if (!${Boolean(view.hud)}) root.classList.remove('lx-theme-hud', 'dark');
    const section = document.querySelector(${JSON.stringify(selector)});
    section?.scrollIntoView({ block: 'center', inline: 'nearest' });
    const disabledSelector = ${JSON.stringify(target.kind === 'checkbox'
    ? '[data-testid="disabled-states"] .lx-checkbox.is-disabled .el-checkbox__label'
    : '[data-testid="vertical"] .lx-radio.is-disabled .el-radio__label')};
    const disabledLabel = document.querySelector(disabledSelector);
    const secondaryText = document.querySelector('.lx-checkbox-demo__tip, .lx-radio-demo__tip');
    return {
      title: document.title,
      href: location.href,
      routeReady: Boolean(document.querySelector('.lx-checkbox-demo, .lx-radio-demo')),
      sectionFound: Boolean(section),
      hudChecked: Boolean(themeToggle?.checked),
      htmlClasses: [...root.classList],
      disabledLabelText: disabledLabel?.textContent?.trim() || null,
      disabledLabelColor: disabledLabel ? getComputedStyle(disabledLabel).color : null,
      secondaryTextColor: secondaryText ? getComputedStyle(secondaryText).color : null,
      secondaryToken: getComputedStyle(root).getPropertyValue('--lx-text-secondary').trim(),
      regularToken: getComputedStyle(root).getPropertyValue('--lx-text-regular').trim(),
      reducedMotionMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      viewport: { width: innerWidth, height: innerHeight, maxTouchPoints: navigator.maxTouchPoints, coarsePointer: matchMedia('(pointer: coarse)').matches },
      sectionText: section?.innerText?.slice(0, 320) || null,
    };
  })()`);
  await delay(350);

  let focus = null;
  if (view.keyboardFocus) {
    await connection.send('Input.dispatchKeyEvent', {
      type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9,
    }, sessionId);
    await connection.send('Input.dispatchKeyEvent', {
      type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9,
    }, sessionId);
    focus = await evaluate(connection, sessionId, `(() => {
      const section = document.querySelector(${JSON.stringify(selector)});
      const inputSelector = ${JSON.stringify(target.kind === 'checkbox'
    ? '.el-checkbox__input input:not([disabled])'
    : '.el-radio__input input:not([disabled])')};
      const input = section?.querySelector(inputSelector)
        || document.querySelector(inputSelector);
      input?.focus();
      const active = document.activeElement;
      const visual = active?.closest('.el-checkbox, .el-radio');
      const control = visual?.querySelector('.el-checkbox__inner, .el-radio__inner');
      return {
        activeTag: active?.tagName || null,
        activeType: active?.getAttribute('type') || null,
        activeLabel: visual?.textContent?.trim() || null,
        activeIsTargetControl: Boolean(input && active === input),
        focusVisible: Boolean(active?.matches?.(':focus-visible')),
        componentFocusClass: visual?.className || null,
        outline: control ? getComputedStyle(control).outline : null,
        boxShadow: control ? getComputedStyle(control).boxShadow : null,
      };
    })()`);
  }

  return { ...state, focus };
}

async function preflightInjection(connection, sessionId) {
  return evaluate(connection, sessionId, `(() => {
    const oldTitle = document.title;
    const oldScriptCount = document.scripts.length;
    const probe = document.createElement('script');
    probe.dataset.impeccablePreflight = 'assessment-b';
    document.title = '__impeccable_assessment_b_preflight__';
    document.head.appendChild(probe);
    const titleChanged = document.title === '__impeccable_assessment_b_preflight__';
    const scriptAppended = probe.isConnected && document.scripts.length === oldScriptCount + 1;
    document.title = oldTitle;
    probe.remove();
    return { titleChanged, scriptAppended, titleRestored: document.title === oldTitle, scriptRemoved: !probe.isConnected };
  })()`);
}

async function injectOverlay(connection, sessionId) {
  if (!overlayUrl) return { attempted: false, reason: '未提供 IMPECCABLE_DETECT_URL。' };
  return evaluate(connection, sessionId, `new Promise((resolve) => {
    const script = document.createElement('script');
    script.dataset.impeccableAssessmentB = 'detector-overlay';
    script.src = ${JSON.stringify(overlayUrl)};
    const timer = setTimeout(() => resolve({ attempted: true, loaded: false, reason: '等待脚本加载超过 5 秒。' }), 5000);
    script.addEventListener('load', () => {
      clearTimeout(timer);
      resolve({ attempted: true, loaded: true, scriptPresent: script.isConnected, src: script.src });
    }, { once: true });
    script.addEventListener('error', () => {
      clearTimeout(timer);
      resolve({ attempted: true, loaded: false, scriptPresent: script.isConnected, src: script.src, reason: '脚本加载事件失败。' });
    }, { once: true });
    document.head.appendChild(script);
  })`, true);
}

async function screenshot(connection, sessionId, filePath) {
  const result = await connection.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  }, sessionId);
  await writeFile(filePath, Buffer.from(result.data, 'base64'));
}

async function collectTarget(target) {
  const targetRecord = {
    name: target.name,
    route: target.route,
    contextIsolation: '独立 Edge 进程 + 临时 user-data-dir；每个目标不复用 Cookie、LocalStorage 或浏览器 context。',
    browser: null,
    views: [],
    consoleErrors: [],
    runtimeExceptions: [],
    failedRequests: [],
    externalRequests: [],
    browserProcessStderr: '',
  };
  const profilePath = await mkdtemp(path.join(tmpdir(), `impeccable-${target.name}-`));
  const stderrLines = [];
  const port = await findFreePort();
  const child = spawn(edgePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profilePath}`,
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => stderrLines.push(chunk));

  let connection = null;
  try {
    const browserVersion = await waitForDevTools(port, child, stderrLines);
    targetRecord.browser = {
      product: browserVersion.Browser,
      protocolVersion: browserVersion['Protocol-Version'],
      remoteDebuggingPort: port,
    };
    connection = new CdpConnection(browserVersion.webSocketDebuggerUrl);
    await connection.opened;
    const created = await connection.send('Target.createTarget', { url: 'about:blank' });
    const attached = await connection.send('Target.attachToTarget', { targetId: created.targetId, flatten: true });
    const sessionId = attached.sessionId;
    const pageEvents = { consoleMessages: [], consoleErrors: [], runtimeExceptions: [], failedRequests: [], externalRequests: [] };
    connection.on('Runtime.consoleAPICalled', (params, eventSessionId) => {
      if (eventSessionId !== sessionId) return;
      const message = (params.args || []).map((item) => item.value ?? item.description ?? '').join(' ');
      const record = { type: params.type, text: message, timestamp: params.timestamp };
      if (['error', 'assert'].includes(params.type)) pageEvents.consoleErrors.push(record);
      if (/impeccable/i.test(message)) pageEvents.consoleMessages.push(record);
    });
    connection.on('Runtime.exceptionThrown', (params, eventSessionId) => {
      if (eventSessionId !== sessionId) return;
      pageEvents.runtimeExceptions.push({ text: params.exceptionDetails?.exception?.description || params.exceptionDetails?.text || '未知脚本异常' });
    });
    connection.on('Network.requestWillBeSent', (params, eventSessionId) => {
      if (eventSessionId !== sessionId) return;
      let parsed;
      try { parsed = new URL(params.request.url); } catch { return; }
      if (!['127.0.0.1', 'localhost', '::1'].includes(parsed.hostname) && !['data:', 'blob:', 'devtools:'].includes(parsed.protocol)) {
        pageEvents.externalRequests.push({ url: params.request.url, resourceType: params.type || null });
      }
    });
    connection.on('Network.loadingFailed', (params, eventSessionId) => {
      if (eventSessionId !== sessionId) return;
      pageEvents.failedRequests.push({ requestId: params.requestId, errorText: params.errorText, canceled: Boolean(params.canceled), blockedReason: params.blockedReason || null, resourceType: params.type || null });
    });
    await connection.send('Page.enable', {}, sessionId);
    await connection.send('Runtime.enable', {}, sessionId);
    await connection.send('Network.enable', {}, sessionId);
    await connection.send('Log.enable', {}, sessionId);
    await connection.send('Network.setCacheDisabled', { cacheDisabled: true }, sessionId);

    for (const view of views) {
      const viewRecord = {
        name: view.name,
        viewport: { width: view.width, height: view.height, touch: Boolean(view.touch) },
        colorScheme: view.colorScheme,
        reducedMotionRequested: Boolean(view.reducedMotion),
        screenshot: path.relative(outputDirectory, path.join(screenshotsDirectory, target.name, `${view.name}.png`)).replaceAll('\\', '/'),
        impeccableConsoleMessages: [],
      };
      const firstConsoleMessage = pageEvents.consoleMessages.length;
      const url = new URL(target.route, baseUrl).toString();
      try {
        const loadEvent = connection.waitFor('Page.loadEventFired', () => true, 20000, sessionId);
        const navigation = await connection.send('Page.navigate', { url }, sessionId);
        viewRecord.url = url;
        viewRecord.navigationError = navigation.errorText || null;
        await loadEvent;
        await delay(650);
        await configurePage(connection, sessionId, target, view).then((result) => { viewRecord.pageState = result; });
        viewRecord.injectionPreflight = await preflightInjection(connection, sessionId);
        viewRecord.overlay = await injectOverlay(connection, sessionId);
        if (viewRecord.overlay.loaded) await delay(2200);
        const domEvidence = await evaluate(connection, sessionId, `(() => {
          const root = document.documentElement;
          const demo = document.querySelector('.lx-checkbox-demo, .lx-radio-demo');
          const target = document.querySelector(${JSON.stringify(sectionSelector(target, view))});
          const disabledSelector = ${JSON.stringify(target.kind === 'checkbox'
    ? '[data-testid="disabled-states"] .lx-checkbox.is-disabled .el-checkbox__label'
    : '[data-testid="vertical"] .lx-radio.is-disabled .el-radio__label')};
          const disabledLabel = document.querySelector(disabledSelector);
          const secondaryText = document.querySelector('.lx-checkbox-demo__tip, .lx-radio-demo__tip');
          const checkedDisabled = document.querySelector('[data-testid="checked-disabled"] .el-radio');
          const checkedDisabledInput = checkedDisabled?.querySelector('input[type="radio"]');
          const selectedGroupLabel = document.querySelector('[data-testid="vertical"] .el-radio.is-checked .el-radio__label');
          const selectedGroupInput = document.querySelector('[data-testid="vertical"] .el-radio.is-checked input[type="radio"]');
          return {
            title: document.title,
            scriptCount: document.scripts.length,
            overlayScriptPresent: Boolean(document.querySelector('script[data-impeccable-assessment-b="detector-overlay"]')),
            overlayNodes: [...document.querySelectorAll('[id*="impeccable"], [class*="impeccable"]')].map((node) => ({ tag: node.tagName, id: node.id, className: String(node.className).slice(0, 180) })).slice(0, 20),
            overlayLabels: [...document.querySelectorAll('.impeccable-label')].map((node) => node.textContent?.trim()).filter(Boolean),
            overlayBannerText: document.querySelector('.impeccable-banner')?.textContent?.trim() || null,
            demoPresent: Boolean(demo),
            targetPresent: Boolean(target),
            targetText: target?.innerText?.slice(0, 320) || null,
            disabledLabelText: disabledLabel?.textContent?.trim() || null,
            disabledLabelColor: disabledLabel ? getComputedStyle(disabledLabel).color : null,
            selectedGroup: {
              value: selectedGroupInput?.value || null,
              checked: Boolean(selectedGroupInput?.checked),
              label: selectedGroupLabel?.textContent?.trim() || null,
            },
            checkedDisabled: {
              present: Boolean(checkedDisabled),
              value: checkedDisabledInput?.value || null,
              checked: Boolean(checkedDisabledInput?.checked),
              disabled: Boolean(checkedDisabledInput?.disabled),
              label: checkedDisabled?.querySelector('.el-radio__label')?.textContent?.trim() || null,
            },
            secondaryTextColor: secondaryText ? getComputedStyle(secondaryText).color : null,
            secondaryToken: getComputedStyle(root).getPropertyValue('--lx-text-secondary').trim(),
            regularToken: getComputedStyle(root).getPropertyValue('--lx-text-regular').trim(),
            htmlClasses: [...root.classList],
            pageOverflowX: document.documentElement.scrollWidth > innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            viewportWidth: innerWidth,
            reducedMotionMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
            activeFocus: viewRecordFocus(),
          };
          function viewRecordFocus() {
            const active = document.activeElement;
            const component = active?.closest('.el-checkbox, .el-radio');
            const control = component?.querySelector('.el-checkbox__inner, .el-radio__inner');
            return active && active !== document.body ? {
              tag: active.tagName,
              type: active.getAttribute('type'),
              label: component?.textContent?.trim() || null,
              focusVisible: active.matches?.(':focus-visible') || false,
              componentClass: component?.className || null,
              outline: control ? getComputedStyle(control).outline : null,
              boxShadow: control ? getComputedStyle(control).boxShadow : null,
            } : null;
          }
        })()`);
        viewRecord.domEvidence = domEvidence;
        viewRecord.impeccableConsoleMessages = pageEvents.consoleMessages.slice(firstConsoleMessage);
        const directory = path.join(screenshotsDirectory, target.name);
        await mkdir(directory, { recursive: true });
        await screenshot(connection, sessionId, path.join(directory, `${view.name}.png`));
        viewRecord.screenshotWritten = true;
        if (target.name === 'LxRadio' && view.name === 'light-desktop') {
          await evaluate(connection, sessionId, `document.querySelector('[data-testid="checked-disabled"]')?.scrollIntoView({ block: 'center' })`);
          viewRecord.checkedDisabledScreenshot = path.relative(outputDirectory,
            path.join(directory, 'checked-disabled-light-desktop.png')).replaceAll('\\', '/');
          await screenshot(connection, sessionId, path.join(directory, 'checked-disabled-light-desktop.png'));
          viewRecord.checkedDisabledScreenshotWritten = true;
          viewRecord.interactionEvidence = await evaluate(connection, sessionId, `new Promise((resolve) => {
            const group = document.querySelector('[data-testid="horizontal"]');
            const option = [...(group?.querySelectorAll('input[type="radio"]') || [])]
              .find((input) => input.value === 'emergency');
            if (!option) return resolve({ selected: false, reason: '未找到 emergency 单选项。' });
            option.click();
            requestAnimationFrame(() => requestAnimationFrame(() => {
              const status = document.querySelector('.lx-radio-demo__status');
              const selectedLabel = group?.querySelector('.el-radio.is-checked .el-radio__label');
              resolve({
                selected: option.checked,
                selectedValue: option.value,
                selectedLabel: selectedLabel?.textContent?.trim() || null,
                ariaLive: status?.getAttribute('aria-live') || null,
                statusText: status?.textContent?.trim() || null,
              });
              status?.scrollIntoView({ block: 'center' });
            }));
          })`, true);
          viewRecord.interactionScreenshot = path.relative(outputDirectory,
            path.join(directory, 'interaction-live-status.png')).replaceAll('\\', '/');
          await screenshot(connection, sessionId, path.join(directory, 'interaction-live-status.png'));
          viewRecord.interactionScreenshotWritten = true;
        }
      }
      catch (error) {
        viewRecord.error = error.message;
        viewRecord.screenshotWritten = false;
      }
      targetRecord.views.push(viewRecord);
      report.targets = [...report.targets.filter((item) => item.name !== target.name), targetRecord];
      await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, outputEncoding);
    }

    targetRecord.consoleErrors = pageEvents.consoleErrors;
    targetRecord.consoleMessages = pageEvents.consoleMessages;
    targetRecord.runtimeExceptions = pageEvents.runtimeExceptions;
    targetRecord.failedRequests = pageEvents.failedRequests;
    targetRecord.externalRequests = pageEvents.externalRequests;
  }
  catch (error) {
    targetRecord.contextError = error.message;
  }
  finally {
    targetRecord.browserProcessStderr = stderrLines.join('').slice(-4000);
    connection?.close();
    if (child.exitCode === null) {
      child.kill();
      await new Promise((resolve) => child.once('exit', resolve));
    }
    await rm(profilePath, { recursive: true, force: true });
    report.targets = [...report.targets.filter((item) => item.name !== target.name), targetRecord];
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, outputEncoding);
  }
}

await mkdir(screenshotsDirectory, { recursive: true });
for (const target of selectedTargets) {
  await collectTarget(target);
  const saved = report.targets.find((item) => item.name === target.name);
  process.stdout.write(`${target.name}: ${saved.views.filter((view) => view.screenshotWritten).length}/${views.length} 截图完成\n`);
}
report.finishedAt = new Date().toISOString();
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, outputEncoding);
