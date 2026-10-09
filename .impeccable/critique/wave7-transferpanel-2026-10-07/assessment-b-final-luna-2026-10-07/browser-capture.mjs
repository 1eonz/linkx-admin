#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(evidenceDir, 'screenshots');
const baseUrl = 'http://127.0.0.1:4174/components/lxtransferpanel';
const require = createRequire(path.resolve('other-admin/admin-vue3/package.json'));
const { chromium } = require('@playwright/test');
const liveHandle = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'live-server.handle.json'), 'utf8'));
const overlayUrl = `http://127.0.0.1:${liveHandle.port}/detect.js`;
const evidence = {
  targetUrl: baseUrl,
  browser: 'Playwright Chromium in a new isolated browser context',
  browserExecutable: 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe',
  viewportChecks: [],
  states: [],
  console: [],
  pageErrors: [],
  failedRequests: [],
  httpErrors: [],
  externalRequests: [],
  preflight: null,
  overlay: null,
  keyboard: null,
  reducedMotion: null,
};

fs.mkdirSync(screenshotDir, { recursive: true });
let browser;
let context;
let page;

function screenshotPath(name) {
  return path.join(screenshotDir, name);
}

async function saveScreenshot(name) {
  await page.screenshot({ path: screenshotPath(name), fullPage: true, animations: 'disabled' });
  return `screenshots/${name}`;
}

async function layoutSnapshot(label) {
  const result = await page.evaluate(() => {
    const transfer = document.querySelector('.lx-transfer-panel');
    const panels = [...document.querySelectorAll('.lx-transfer-panel__panel')];
    return {
      viewportWidth: window.innerWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      transferWidth: transfer ? Math.round(transfer.getBoundingClientRect().width) : null,
      panelWidths: panels.map((panel) => Math.round(panel.getBoundingClientRect().width)),
      panelHeights: panels.map((panel) => Math.round(panel.getBoundingClientRect().height)),
    };
  });
  evidence.viewportChecks.push({ label, ...result });
  return result;
}

async function recordState(name, locator) {
  const details = await locator();
  const screenshot = await saveScreenshot(`${name}.png`);
  evidence.states.push({ name, screenshot, ...details });
}

try {
  browser = await chromium.launch({
    headless: true,
    executablePath: evidence.browserExecutable,
  });
  context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  page = await context.newPage();
  page.on('console', (message) => {
    evidence.console.push({ type: message.type(), text: message.text() });
  });
  page.on('pageerror', (error) => evidence.pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    evidence.failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? null });
  });
  page.on('request', (request) => {
    try {
      const url = new URL(request.url());
      if (!['127.0.0.1', 'localhost', '::1'].includes(url.hostname)) {
        evidence.externalRequests.push({ host: url.hostname, method: request.method(), path: url.pathname });
      }
    } catch {
      // 忽略 data URL 等非 HTTP 请求。
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400) evidence.httpErrors.push({ status: response.status(), url: response.url() });
  });

  const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  evidence.navigation = {
    responseStatus: response?.status() ?? null,
    finalUrl: page.url(),
  };
  await page.locator('.lx-transfer-panel').first().waitFor({ state: 'visible', timeout: 20000 });
  const settings = page.locator('.transfer-panel-demo__settings');
  const summary = settings.locator('summary');
  if (!(await settings.evaluate((element) => element.open))) await summary.click();
  await page.waitForTimeout(250);

  evidence.preflight = await page.evaluate(() => {
    const originalTitle = document.title;
    document.title = `${originalTitle} [mutable-preflight]`;
    const script = document.createElement('script');
    script.dataset.assessmentBPreflight = 'true';
    script.textContent = "window.__assessmentBPreflight = 'executed'";
    document.head.append(script);
    const result = {
      originalTitle,
      mutatedTitle: document.title,
      titleChanged: document.title !== originalTitle,
      scriptTagPresent: script.isConnected,
      inlineScriptExecuted: window.__assessmentBPreflight === 'executed',
    };
    document.title = originalTitle;
    return result;
  });

  const beforeOverlay = await page.evaluate(() => ({
    elementCount: document.querySelectorAll('*').length,
    bodyChildren: document.body.children.length,
    scriptCount: document.scripts.length,
  }));
  await page.addScriptTag({ url: overlayUrl, timeout: 15000 });
  await page.waitForTimeout(2500);
  const afterOverlay = await page.evaluate((url) => ({
    scriptPresent: [...document.scripts].some((script) => script.src === url),
    elementCount: document.querySelectorAll('*').length,
    bodyChildren: document.body.children.length,
    scriptCount: document.scripts.length,
    impeccableNamedElements: [...document.querySelectorAll('*')]
      .filter((element) => /impeccable/i.test(`${element.id} ${element.className}`))
      .map((element) => ({ tag: element.tagName, id: element.id, className: String(element.className).slice(0, 160) }))
      .slice(0, 30),
  }), overlayUrl);
  evidence.overlay = {
    url: overlayUrl,
    scriptInjected: true,
    scriptRan: afterOverlay.scriptPresent,
    before: beforeOverlay,
    after: afterOverlay,
    consoleMessages: [],
  };
  await layoutSnapshot('desktop-1440-light');
  evidence.states.push({
    name: 'desktop-1440-light-overlay',
    screenshot: await saveScreenshot('desktop-1440-light-overlay.png'),
  });

  await page.getByLabel('HUD 深色主题').check();
  await page.waitForTimeout(150);
  evidence.states.push({ name: 'desktop-1440-hud', screenshot: await saveScreenshot('desktop-1440-hud.png') });

  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByLabel('HUD 深色主题').uncheck();
  await page.waitForTimeout(150);
  await layoutSnapshot('mobile-375-light');
  evidence.states.push({ name: 'mobile-375-light', screenshot: await saveScreenshot('mobile-375-light.png') });
  await page.getByLabel('HUD 深色主题').check();
  await page.waitForTimeout(150);
  await layoutSnapshot('mobile-375-hud');
  evidence.states.push({ name: 'mobile-375-hud', screenshot: await saveScreenshot('mobile-375-hud.png') });

  await page.setViewportSize({ width: 320, height: 780 });
  await page.getByLabel('HUD 深色主题').uncheck();
  await page.waitForTimeout(150);
  await layoutSnapshot('mobile-320-light');
  evidence.states.push({ name: 'mobile-320-light', screenshot: await saveScreenshot('mobile-320-light.png') });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: '正常数据', exact: true }).click();
  await recordState('state-loading', async () => {
    await page.getByRole('button', { name: '加载中', exact: true }).click();
    const status = page.getByRole('status');
    return {
      statusVisible: await status.isVisible(),
      statusText: (await status.innerText()).trim(),
      ariaBusy: await page.locator('.transfer-panel-demo__surface').getAttribute('aria-busy'),
      selectedCount: (await page.getByTestId('selected-count').innerText()).trim(),
    };
  });
  await recordState('state-error', async () => {
    await page.getByRole('button', { name: '加载失败', exact: true }).click();
    const alert = page.getByRole('alert');
    return {
      alertVisible: await alert.isVisible(),
      alertText: (await alert.innerText()).trim(),
      retryVisible: await page.getByRole('button', { name: '重试' }).isVisible(),
      selectedCount: (await page.getByTestId('selected-count').innerText()).trim(),
    };
  });
  await page.getByRole('button', { name: '正常数据', exact: true }).click();
  await recordState('state-empty', async () => {
    await page.getByRole('button', { name: '空结果', exact: true }).click();
    const treeText = (await page.locator('.lx-virtual-tree').innerText()).trim();
    return {
      emptyTextVisible: treeText.includes('暂无数据'),
      treeText,
      selectedCount: (await page.getByTestId('selected-count').innerText()).trim(),
    };
  });

  await page.getByRole('button', { name: '正常数据', exact: true }).click();
  await page.setViewportSize({ width: 375, height: 812 });
  const treeItem = page.getByRole('treeitem', { name: /交警直属特勤一中队/ });
  await treeItem.focus();
  const treeFocus = await treeItem.evaluate((element) => ({
    active: document.activeElement === element,
    role: element.getAttribute('role'),
    tabIndex: element.getAttribute('tabindex'),
  }));
  await page.keyboard.press('Space');
  const selectionAfterSpace = (await page.getByTestId('selected-count').innerText()).trim();
  const reverseButton = page.getByRole('button', { name: '反选', exact: true });
  await reverseButton.focus();
  const reverseFocus = await reverseButton.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      active: document.activeElement === element,
      outlineWidth: style.outlineWidth,
      outlineStyle: style.outlineStyle,
      outlineColor: style.outlineColor,
    };
  });
  const keyboardScreenshot = await saveScreenshot('keyboard-focus-mobile-375.png');
  evidence.keyboard = {
    treeItemFocus: treeFocus,
    spaceActivationSelectionCount: selectionAfterSpace,
    reverseButtonFocus: reverseFocus,
    screenshot: keyboardScreenshot,
  };

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const motion = await page.getByRole('button', { name: '全部加入' }).evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      transitionDuration: style.transitionDuration,
      animationDuration: style.animationDuration,
    };
  });
  evidence.reducedMotion = motion;
  evidence.states.push({ name: 'mobile-375-reduced-motion', screenshot: await saveScreenshot('mobile-375-reduced-motion.png') });

  evidence.overlay.consoleMessages = evidence.console.filter((entry) => /impeccable/i.test(entry.text));
  evidence.finalMetrics = await page.evaluate(() => ({
    title: document.title,
    url: location.href,
    viewport: { width: innerWidth, height: innerHeight },
    componentPresent: !!document.querySelector('.lx-transfer-panel'),
  }));
  await context.close();
  await browser.close();
  fs.writeFileSync(path.join(evidenceDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    navigation: evidence.navigation,
    preflight: evidence.preflight,
    overlay: evidence.overlay,
    viewportChecks: evidence.viewportChecks,
    states: evidence.states.map(({ name, screenshot }) => ({ name, screenshot })),
    keyboard: evidence.keyboard,
    reducedMotion: evidence.reducedMotion,
    consoleCount: evidence.console.length,
    externalRequestCount: evidence.externalRequests.length,
    pageErrorCount: evidence.pageErrors.length,
  }));
} catch (error) {
  evidence.fatalError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  try { await context.close(); } catch {}
  try { await browser.close(); } catch {}
  fs.writeFileSync(path.join(evidenceDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.error(evidence.fatalError);
  process.exitCode = 1;
}
