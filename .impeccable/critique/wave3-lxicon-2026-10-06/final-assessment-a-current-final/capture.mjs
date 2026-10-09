import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const targetUrl = 'http://127.0.0.1:4174/components/lxicons.html';
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

class DevTools {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const request = this.pending.get(message.id);
        if (!request) return;
        this.pending.delete(message.id);
        if (message.error) request.reject(new Error(message.error.message));
        else request.resolve(message.result ?? {});
      } else {
        for (const handler of this.handlers.get(message.method) ?? []) handler(message);
      }
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    return new DevTools(socket);
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }

  on(method, handler) {
    const handlers = this.handlers.get(method) ?? [];
    handlers.push(handler);
    this.handlers.set(method, handlers);
  }

  waitFor(method, sessionId, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeout);
      const handler = (message) => {
        if (sessionId && message.sessionId !== sessionId) return;
        clearTimeout(timer);
        const handlers = this.handlers.get(method) ?? [];
        this.handlers.set(method, handlers.filter((candidate) => candidate !== handler));
        resolve(message);
      };
      this.on(method, handler);
    });
  }

  async evaluate(sessionId, expression) {
    const response = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    }, sessionId);
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
    }
    return response.result?.value;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getAvailablePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', resolve).once('error', reject));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function getBrowserEndpoint(port, process) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (process.exitCode !== null) throw new Error(`Chrome exited with ${process.exitCode}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return response.json();
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome DevTools endpoint did not become available');
}

async function createPage(devtools, contextId, width, height, { mobile = false, reducedMotion = false } = {}) {
  const { targetId } = await devtools.send('Target.createTarget', {
    url: 'about:blank',
    browserContextId: contextId,
  });
  const { sessionId } = await devtools.send('Target.attachToTarget', { targetId, flatten: true });
  await devtools.send('Page.enable', {}, sessionId);
  await devtools.send('Runtime.enable', {}, sessionId);
  await devtools.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  }, sessionId);
  await devtools.send('Emulation.setTouchEmulationEnabled', {
    enabled: mobile,
    maxTouchPoints: 1,
  }, sessionId);
  await devtools.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-color-scheme', value: 'light' },
      { name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' },
    ],
  }, sessionId);
  const load = devtools.waitFor('Page.loadEventFired', sessionId);
  await devtools.send('Page.navigate', { url: targetUrl }, sessionId);
  await load;
  await devtools.evaluate(sessionId, 'document.fonts?.ready');
  await sleep(400);
  return { targetId, sessionId, width, height, mobile, reducedMotion };
}

async function capture(devtools, page, name, fullPage = false) {
  let clip;
  if (fullPage) {
    const metrics = await devtools.send('Page.getLayoutMetrics', {}, page.sessionId);
    const size = metrics.cssContentSize ?? metrics.contentSize;
    clip = { x: 0, y: 0, width: Math.ceil(size.width), height: Math.ceil(size.height), scale: 1 };
  }
  const result = await devtools.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: fullPage,
    ...(clip ? { clip } : {}),
  }, page.sessionId);
  const filename = `${name}.png`;
  fs.writeFileSync(path.join(outputDir, filename), Buffer.from(result.data, 'base64'));
  return filename;
}

async function inspectPage(devtools, page) {
  return devtools.evaluate(page.sessionId, `(() => {
    const input = document.querySelector('.icon-search');
    const grid = document.querySelector('.icon-grid');
    const catalog = document.querySelector('.icon-catalog');
    const alias = document.querySelector('.icon-alias-table-region');
    const groups = [...document.querySelectorAll('.icon-group')].map((group) => ({
      title: group.querySelector('summary')?.innerText.trim(),
      count: group.querySelectorAll('.icon-tile').length,
      open: group.open,
    }));
    const overflowing = [...document.querySelectorAll('body *')]
      .filter((el) => el.clientWidth && el.scrollWidth > el.clientWidth + 1)
      .slice(0, 12)
      .map((el) => ({ selector: el.className?.baseVal ?? el.className ?? el.tagName.toLowerCase(), clientWidth: el.clientWidth, scrollWidth: el.scrollWidth }));
    return {
      title: document.title,
      heading: document.querySelector('.vp-doc h1')?.innerText.trim() ?? null,
      readyState: document.readyState,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      documentWidth: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth },
      catalog: catalog ? { width: catalog.getBoundingClientRect().width, visibleTiles: [...document.querySelectorAll('.icon-tile')].filter((el) => el.getClientRects().length).length } : null,
      search: input ? { placeholder: input.placeholder, value: input.value, width: input.getBoundingClientRect().width, height: input.getBoundingClientRect().height } : null,
      grid: grid ? { columns: getComputedStyle(grid).gridTemplateColumns, width: grid.getBoundingClientRect().width } : null,
      groupCount: groups.length,
      groups,
      aliasRegion: alias ? { clientWidth: alias.clientWidth, scrollWidth: alias.scrollWidth, tableWidth: alias.querySelector('table')?.getBoundingClientRect().width } : null,
      internalOverflowCandidates: overflowing,
      h1FontSize: document.querySelector('.vp-doc h1') ? getComputedStyle(document.querySelector('.vp-doc h1')).fontSize : null,
    };
  })()`);
}

async function setTheme(devtools, page, theme) {
  const result = await devtools.evaluate(page.sessionId, `(() => {
    const expected = ${JSON.stringify(theme)} === 'dark';
    const isDark = document.documentElement.classList.contains('dark');
    const button = document.querySelector('.VPNavBarAppearance button, button[aria-label*="dark" i], button[aria-label*="theme" i]');
    if (isDark !== expected && button) button.click();
    return { before: isDark ? 'dark' : 'light', button: button ? { label: button.getAttribute('aria-label'), title: button.title, className: button.className } : null };
  })()`);
  await sleep(300);
  const current = await devtools.evaluate(page.sessionId, "document.documentElement.classList.contains('dark') ? 'dark' : 'light'");
  if (current !== theme) {
    await devtools.evaluate(page.sessionId, `(() => {
      const isDark = ${JSON.stringify(theme)} === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      localStorage.setItem('vitepress-theme-appearance', isDark ? 'dark' : 'light');
    })()`);
  }
  return { ...result, final: theme, uiToggleReachedTarget: current === theme };
}

async function pressKey(devtools, sessionId, key, code, virtualKeyCode) {
  const normalizedKey = key === 'Space' ? ' ' : key;
  const event = { key: normalizedKey, code, windowsVirtualKeyCode: virtualKeyCode, nativeVirtualKeyCode: virtualKeyCode };
  await devtools.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...event }, sessionId);
  if (key === 'Enter' || key === 'Space') {
    const text = key === 'Enter' ? '\r' : ' ';
    await devtools.send('Input.dispatchKeyEvent', { type: 'char', ...event, text, unmodifiedText: text }, sessionId);
  }
  await devtools.send('Input.dispatchKeyEvent', { type: 'keyUp', ...event }, sessionId);
}

const report = {
  target: targetUrl,
  browser: {},
  viewports: {},
  interactions: {},
  consoleErrors: [],
  screenshots: [],
};
const tempProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'linkx-lxicons-assessment-a-'));
let chrome;
let devtools;
let contextId;

try {
  const port = await getAvailablePort();
  chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-background-networking',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-address=127.0.0.1',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    'about:blank',
  ], { stdio: 'ignore', windowsHide: true });
  const endpoint = await getBrowserEndpoint(port, chrome);
  devtools = await DevTools.connect(endpoint.webSocketDebuggerUrl);
  const version = await devtools.send('Browser.getVersion');
  report.browser = {
    product: version.product,
    protocolVersion: version.protocolVersion,
    userAgent: version.userAgent,
    freshTemporaryProfile: true,
    isolatedBrowserContext: true,
    captureTool: 'Chrome DevTools Protocol over a new headless Chrome process',
  };
  ({ browserContextId: contextId } = await devtools.send('Target.createBrowserContext', { disposeOnDetach: true }));
  try {
    await devtools.send('Browser.grantPermissions', {
      origin: new URL(targetUrl).origin,
      browserContextId: contextId,
      permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
    });
    report.browser.clipboardPermissionsGranted = true;
  } catch (error) {
    report.browser.clipboardPermissionsGranted = false;
    report.browser.clipboardPermissionNote = error.message;
  }

  async function newPage(width, height, options) {
    const page = await createPage(devtools, contextId, width, height, options);
    devtools.on('Runtime.exceptionThrown', (event) => {
      if (event.sessionId && event.sessionId !== page.sessionId) return;
      report.consoleErrors.push({ viewport: `${width}x${height}`, message: event.params?.exceptionDetails?.text ?? 'Runtime exception' });
    });
    devtools.on('Runtime.consoleAPICalled', (event) => {
      if (event.sessionId !== page.sessionId || event.params?.type !== 'error') return;
      report.consoleErrors.push({ viewport: `${width}x${height}`, message: event.params.args?.map((arg) => arg.value ?? arg.description).join(' ') });
    });
    return page;
  }

  const desktopLight = await newPage(1440, 1000, { mobile: false });
  report.viewports.desktop1440Light = await inspectPage(devtools, desktopLight);
  report.screenshots.push(await capture(devtools, desktopLight, 'desktop-1440-light'));
  report.screenshots.push(await capture(devtools, desktopLight, 'desktop-1440-light-full', true));

  const desktopDark = await newPage(1440, 1000, { mobile: false });
  report.interactions.themeToggle = await setTheme(devtools, desktopDark, 'dark');
  report.viewports.desktop1440Dark = await inspectPage(devtools, desktopDark);
  report.screenshots.push(await capture(devtools, desktopDark, 'desktop-1440-dark'));
  report.screenshots.push(await capture(devtools, desktopDark, 'desktop-1440-dark-full', true));

  const mobile375 = await newPage(375, 812, { mobile: true });
  report.interactions.mobile375Theme = await setTheme(devtools, mobile375, 'light');
  report.viewports.mobile375 = await inspectPage(devtools, mobile375);
  report.screenshots.push(await capture(devtools, mobile375, 'mobile-375-light'));
  report.screenshots.push(await capture(devtools, mobile375, 'mobile-375-light-full', true));

  const mobile320 = await newPage(320, 720, { mobile: true });
  report.interactions.mobile320Theme = await setTheme(devtools, mobile320, 'light');
  report.viewports.mobile320 = await inspectPage(devtools, mobile320);
  report.screenshots.push(await capture(devtools, mobile320, 'mobile-320-light'));
  report.screenshots.push(await capture(devtools, mobile320, 'mobile-320-light-full', true));

  const interactions = await newPage(1440, 1000, { mobile: false });
  const typeInSearch = async (text) => {
    await devtools.evaluate(interactions.sessionId, "document.querySelector('.icon-search').focus()");
    await devtools.send('Input.insertText', { text }, interactions.sessionId);
    await sleep(200);
    return devtools.evaluate(interactions.sessionId, `(() => ({
      value: document.querySelector('.icon-search').value,
      groups: [...document.querySelectorAll('.icon-group')].map(group => ({ title: group.querySelector('summary').innerText.trim(), count: group.querySelectorAll('.icon-tile').length })),
      visibleTiles: [...document.querySelectorAll('.icon-tile')].filter(tile => tile.getClientRects().length).length,
      emptyText: document.querySelector('.icon-empty')?.innerText.trim() ?? null,
      statusText: document.querySelector('.icon-search-status')?.innerText.trim() ?? null,
    }))()`);
  };

  report.interactions.searchEnglish = await typeInSearch('undo');
  report.screenshots.push(await capture(devtools, interactions, 'search-english-undo'));
  await devtools.evaluate(interactions.sessionId, "document.querySelector('.icon-search').value = ''; document.querySelector('.icon-search').dispatchEvent(new Event('input', { bubbles: true }))");
  await typeInSearch('登出');
  report.interactions.searchChinese = await inspectPage(devtools, interactions);
  report.screenshots.push(await capture(devtools, interactions, 'search-chinese-logout'));
  await devtools.evaluate(interactions.sessionId, "document.querySelector('.icon-search').value = ''; document.querySelector('.icon-search').dispatchEvent(new Event('input', { bubbles: true }))");
  await typeInSearch('no-such-icon-xyz');
  report.interactions.searchEmpty = await devtools.evaluate(interactions.sessionId, `(() => ({
    value: document.querySelector('.icon-search').value,
    groupCount: document.querySelectorAll('.icon-group').length,
    emptyText: document.querySelector('.icon-empty')?.innerText.trim() ?? null,
    liveText: document.querySelector('.icon-search-status')?.innerText.trim() ?? null,
    explicitEmptyVisible: Boolean(document.querySelector('.icon-empty')?.getClientRects().length),
  }))()`);
  report.screenshots.push(await capture(devtools, interactions, 'search-empty'));
  await devtools.evaluate(interactions.sessionId, "document.querySelector('.icon-search').value = ''; document.querySelector('.icon-search').dispatchEvent(new Event('input', { bubbles: true }))");
  await sleep(250);

  await devtools.evaluate(interactions.sessionId, `(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (value) => { window.__assessedClipboard = value; } },
    });
  })()`);
  await devtools.evaluate(interactions.sessionId, "document.querySelector('button[aria-label^=\"复制 delete\"]').click()");
  await sleep(250);
  report.interactions.copySuccess = await devtools.evaluate(interactions.sessionId, `(() => ({
    feedback: document.querySelector('.icon-copy-feedback')?.innerText.trim(),
    isError: document.querySelector('.icon-copy-feedback')?.classList.contains('is-error'),
    fallbackVisible: Boolean(document.querySelector('.icon-copy-fallback')?.getClientRects().length),
    clipboard: window.__assessedClipboard ?? null,
  }))()`);
  report.screenshots.push(await capture(devtools, interactions, 'copy-success'));

  await devtools.evaluate(interactions.sessionId, `(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => { throw new Error('Assessment A forced clipboard denial'); } },
    });
  })()`);
  await devtools.evaluate(interactions.sessionId, "document.querySelector('button[aria-label^=\"复制 edit\"]').click()");
  await sleep(250);
  report.interactions.copyFailure = await devtools.evaluate(interactions.sessionId, `(() => ({
    feedback: document.querySelector('.icon-copy-feedback')?.innerText.trim(),
    isError: document.querySelector('.icon-copy-feedback')?.classList.contains('is-error'),
    fallbackVisible: Boolean(document.querySelector('.icon-copy-fallback')?.getClientRects().length),
    fallbackValue: document.querySelector('.icon-copy-fallback textarea')?.value ?? null,
    fallbackFocused: document.activeElement === document.querySelector('.icon-copy-fallback textarea'),
    fallbackSelected: document.querySelector('.icon-copy-fallback textarea')?.selectionStart === 0 && document.querySelector('.icon-copy-fallback textarea')?.selectionEnd === document.querySelector('.icon-copy-fallback textarea')?.value.length,
  }))()`);
  report.screenshots.push(await capture(devtools, interactions, 'copy-failure'));

  // Exercise native keyboard activation without relying on mouse hover state.
  await devtools.evaluate(interactions.sessionId, "document.querySelector('.icon-search').focus()");
  await devtools.send('Input.insertText', { text: 'undo' }, interactions.sessionId);
  await pressKey(devtools, interactions.sessionId, 'Tab', 'Tab', 9);
  report.interactions.keyboardClearFocus = await devtools.evaluate(interactions.sessionId, "({ label: document.activeElement?.getAttribute('aria-label'), tag: document.activeElement?.tagName })");
  await pressKey(devtools, interactions.sessionId, 'Enter', 'Enter', 13);
  await sleep(200);
  report.interactions.keyboardClearResult = await devtools.evaluate(interactions.sessionId, "({ value: document.querySelector('.icon-search').value, focusedSearch: document.activeElement === document.querySelector('.icon-search') })");
  await pressKey(devtools, interactions.sessionId, 'Tab', 'Tab', 9);
  report.interactions.keyboardSummaryFocus = await devtools.evaluate(interactions.sessionId, "({ label: document.activeElement?.innerText?.trim(), tag: document.activeElement?.tagName })");
  await pressKey(devtools, interactions.sessionId, 'Space', 'Space', 32);
  await sleep(100);
  report.interactions.keyboardDisclosure = await devtools.evaluate(interactions.sessionId, `(() => ({
    label: document.activeElement?.innerText?.trim(),
    groupOpen: document.activeElement?.parentElement?.open ?? null,
  }))()`);
  await pressKey(devtools, interactions.sessionId, 'Tab', 'Tab', 9);
  report.interactions.keyboardTileFocus = await devtools.evaluate(interactions.sessionId, `(() => ({
    label: document.activeElement?.getAttribute('aria-label'),
    tag: document.activeElement?.tagName,
    outlineStyle: getComputedStyle(document.activeElement).outlineStyle,
    outlineWidth: getComputedStyle(document.activeElement).outlineWidth,
    backgroundColor: getComputedStyle(document.activeElement).backgroundColor,
  }))()`);
  await devtools.evaluate(interactions.sessionId, 'document.activeElement?.scrollIntoView({ block: "center" })');
  await sleep(100);
  report.screenshots.push(await capture(devtools, interactions, 'keyboard-focus'));
  await devtools.evaluate(interactions.sessionId, `(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (value) => { window.__assessedClipboard = value; } },
    });
  })()`);
  await pressKey(devtools, interactions.sessionId, 'Enter', 'Enter', 13);
  await sleep(250);
  report.interactions.keyboardActivation = await devtools.evaluate(interactions.sessionId, "({ feedback: document.querySelector('.icon-copy-feedback')?.innerText.trim(), focusRemainsOnTile: document.activeElement?.classList.contains('icon-tile') })");

  const reduced = await newPage(1440, 1000, { mobile: false, reducedMotion: true });
  report.interactions.reducedMotion = await devtools.evaluate(reduced.sessionId, `(() => {
    const tile = document.querySelector('button[aria-label^="复制 loading"]');
    const icon = tile?.querySelector('.lx-icon');
    const tileStyle = tile ? getComputedStyle(tile) : null;
    const iconStyle = icon ? getComputedStyle(icon) : null;
    tile?.focus();
    tile?.scrollIntoView({ block: 'center' });
    return {
      mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      tileFound: Boolean(tile),
      tileTransitionDuration: tileStyle?.transitionDuration ?? null,
      iconClasses: icon?.getAttribute('class') ?? null,
      iconAnimationName: iconStyle?.animationName ?? null,
      iconAnimationDuration: iconStyle?.animationDuration ?? null,
      iconTransitionDuration: iconStyle?.transitionDuration ?? null,
    };
  })()`);
  await sleep(100);
  report.screenshots.push(await capture(devtools, reduced, 'reduced-motion-focus'));

  report.capturedAt = new Date().toISOString();
  fs.writeFileSync(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(report, null, 2)}\n`);
} finally {
  if (contextId && devtools) {
    try { await devtools.send('Target.disposeBrowserContext', { browserContextId: contextId }); } catch {}
  }
  if (devtools?.socket.readyState === WebSocket.OPEN) devtools.socket.close();
  if (chrome && chrome.exitCode === null) {
    chrome.kill();
    await Promise.race([
      new Promise((resolve) => chrome.once('exit', resolve)),
      sleep(3000),
    ]);
  }
  fs.rmSync(tempProfile, { recursive: true, force: true });
}

console.log(JSON.stringify({
  browser: report.browser,
  viewports: Object.fromEntries(Object.entries(report.viewports).map(([key, value]) => [key, {
    heading: value.heading,
    theme: value.theme,
    viewport: value.viewport,
    documentWidth: value.documentWidth,
    visibleTiles: value.catalog?.visibleTiles,
    aliasRegion: value.aliasRegion,
  }])),
  interactions: report.interactions,
  consoleErrors: report.consoleErrors,
  screenshots: report.screenshots,
  capturedAt: report.capturedAt,
}, null, 2));
