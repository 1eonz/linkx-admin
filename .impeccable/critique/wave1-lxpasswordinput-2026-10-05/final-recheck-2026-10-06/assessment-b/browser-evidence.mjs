import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const outDir = path.join(
  root,
  '.impeccable/critique/wave1-lxpasswordinput-2026-10-05/final-recheck-2026-10-06/assessment-b',
);
const url = 'http://127.0.0.1:4182/components/lxpasswordinput';
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detector/detect-antipatterns-browser.js';
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const playwrightEntry = path.join(
  root,
  'other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright/index.mjs',
);
const { chromium } = await import(pathToFileURL(playwrightEntry).href);
const evidence = {
  url,
  browser: 'Google Chrome',
  freshBrowserProcess: true,
  freshContext: true,
  freshPage: true,
  captures: {},
  interactions: {},
  errors: [],
  console: [],
  detectorEndpoint: {},
};

fs.mkdirSync(outDir, { recursive: true });
const detectorSource = fs.readFileSync(detectorPath, 'utf8');
const detectorServer = http.createServer((req, res) => {
  if (req.url !== '/detect.js') {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, {
    'content-type': 'application/javascript; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
  });
  res.end(detectorSource);
});

let browser;
let endpointPort;
try {
  await new Promise((resolve, reject) => {
    detectorServer.once('error', reject);
    detectorServer.listen(0, '127.0.0.1', resolve);
  });
  endpointPort = detectorServer.address().port;
  evidence.detectorEndpoint = {
    url: `http://127.0.0.1:${endpointPort}/detect.js`,
    scriptPath: detectorPath,
    started: true,
  };

  browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--disable-background-networking', '--disable-component-update'],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    hasTouch: true,
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  page.on('console', (message) => {
    evidence.console.push({
      type: message.type(),
      text: message.text(),
      location: message.location(),
    });
  });
  page.on('pageerror', (error) => evidence.errors.push({ type: 'pageerror', text: error.message }));
  page.on('requestfailed', (request) => evidence.errors.push({
    type: 'requestfailed',
    url: request.url(),
    error: request.failure()?.errorText,
  }));

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.locator('.password-input-demo').waitFor({ timeout: 20000 });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.locator('.password-input-demo').waitFor({ timeout: 20000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(500);

  const pageMetrics = () => page.evaluate(() => {
    const rect = (el) => {
      const box = el?.getBoundingClientRect();
      if (!box) return null;
      return {
        x: Math.round(box.x * 100) / 100,
        y: Math.round(box.y * 100) / 100,
        width: Math.round(box.width * 100) / 100,
        height: Math.round(box.height * 100) / 100,
      };
    };
    const demo = document.querySelector('.password-input-demo');
    const overflowers = [...document.querySelectorAll('body *')]
      .map((el) => ({ el, box: el.getBoundingClientRect() }))
      .filter(({ el, box }) => box.width > 0 && box.right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed')
      .slice(0, 15)
      .map(({ el, box }) => ({
        tag: el.tagName.toLowerCase(),
        id: el.id,
        className: typeof el.className === 'string' ? el.className : '',
        text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 70),
        right: Math.round(box.right * 100) / 100,
        width: Math.round(box.width * 100) / 100,
      }));
    return {
      url: location.href,
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight },
      widths: {
        documentElement: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        demo: rect(demo),
        documentRightOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      },
      theme: {
        darkClass: document.documentElement.classList.contains('dark'),
        appearanceButtons: [...document.querySelectorAll('button')]
          .filter((el) => /appearance|theme|dark|light|深色|浅色/i.test(`${el.className} ${el.getAttribute('aria-label')} ${el.title}`))
          .map((el) => ({
            className: el.className,
            ariaLabel: el.getAttribute('aria-label'),
            title: el.title,
            rect: rect(el),
          })),
      },
      localAnchors: [...document.querySelectorAll('a[href^="#"]')]
        .map((el) => ({
          text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 80),
          href: el.getAttribute('href'),
          className: el.className,
          visible: !!(el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none'),
          rect: rect(el),
          owner: el.closest('nav, aside, .VPDocAsideOutline, .VPDocAside, .VPDocFooter')?.className || null,
        }))
        .filter((el) => el.text || el.href),
      headings: [...document.querySelectorAll('.vp-doc h1, .vp-doc h2, .vp-doc h3')]
        .map((el) => ({ id: el.id, text: el.innerText.trim(), rect: rect(el) })),
      toolbar: [...document.querySelectorAll('.password-input-demo__toolbar label')]
        .map((el) => ({ text: el.innerText.trim(), rect: rect(el) })),
      toolbarTargets: [...document.querySelectorAll('.password-input-demo__toolbar select, .password-input-demo__toolbar input')]
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute('type'),
          ariaLabel: el.getAttribute('aria-label'),
          rect: rect(el),
        })),
      passwordToggleTargets: [...document.querySelectorAll('.password-input-demo .lx-password-input__toggle')]
        .map((el) => ({ ariaLabel: el.getAttribute('aria-label'), disabled: el.disabled, rect: rect(el) })),
      advanced: {
        open: !!document.querySelector('.password-input-demo__advanced')?.open,
        summary: rect(document.querySelector('.password-input-demo__advanced summary')),
        labels: [...document.querySelectorAll('.password-input-demo__advanced-controls label')]
          .map((el) => ({ text: el.innerText.trim(), rect: rect(el), minHeight: getComputedStyle(el).minHeight })),
      },
      inputStates: [...document.querySelectorAll('.password-input-demo input')]
        .filter((el) => el.type !== 'checkbox')
        .map((el) => ({ id: el.id, type: el.type, disabled: el.disabled, readOnly: el.readOnly, valueLength: el.value.length })),
      overflowers,
    };
  });

  const shot = async (name, fullPage = true) => page.screenshot({
    path: path.join(outDir, name),
    fullPage,
    animations: 'disabled',
  });

  evidence.captures.light1280BeforeOverlay = await pageMetrics();
  await shot('browser-1280-light.png');

  const appearance = page.locator('button.VPSwitchAppearance').first();
  if (await appearance.count()) {
    const label = await appearance.getAttribute('aria-label');
    const beforeDark = await page.locator('html').evaluate((el) => el.classList.contains('dark'));
    await appearance.click();
    await page.waitForTimeout(350);
    const afterDark = await page.locator('html').evaluate((el) => el.classList.contains('dark'));
    evidence.interactions.themeToggle = { found: true, ariaLabel: label, beforeDark, afterDark };
  } else {
    evidence.interactions.themeToggle = { found: false };
  }
  evidence.captures.dark1280BeforeOverlay = await pageMetrics();
  await shot('browser-1280-dark.png');

  if (await page.locator('html').evaluate((el) => el.classList.contains('dark')) && await appearance.count()) {
    await appearance.click();
    await page.waitForTimeout(250);
  }

  const details = page.locator('.password-input-demo__advanced');
  const summary = page.locator('.password-input-demo__advanced summary');
  if (!(await details.evaluate((el) => el.open))) await summary.click();
  const hudCheckbox = page.getByLabel('HUD 深色主题', { exact: false });
  if (await hudCheckbox.count()) await hudCheckbox.first().check();
  await page.waitForTimeout(100);
  evidence.captures.hud1280BeforeOverlay = await pageMetrics();
  await shot('browser-1280-hud.png');

  const passwordInput = page.locator('#password-input-demo');
  const mainField = page.locator('.password-input-demo__field').filter({ has: passwordInput });
  const initialType = await passwordInput.getAttribute('type');
  const showToggle = mainField.getByRole('button', { name: '显示密码', exact: true });
  await passwordInput.focus();
  if (await showToggle.count()) {
    await showToggle.focus();
    await page.keyboard.press('Enter');
  }
  const enterToggle = {
    inputType: await passwordInput.getAttribute('type'),
    pressed: await mainField.getByRole('button', { name: '隐藏密码', exact: true }).getAttribute('aria-pressed').catch(() => null),
  };
  const hideToggle = mainField.getByRole('button', { name: '隐藏密码', exact: true });
  if (await hideToggle.count()) {
    await hideToggle.focus();
    await page.keyboard.press('Space');
  }
  evidence.interactions.keyboard = {
    initialType,
    enter: enterToggle,
    spaceResultType: await passwordInput.getAttribute('type'),
    toggleVisible: await mainField.getByRole('button', { name: '显示密码', exact: true }).count(),
  };

  await passwordInput.focus();
  await mainField.getByRole('button', { name: '显示密码', exact: true }).click();
  const visibleBeforeInternalFocus = await passwordInput.getAttribute('type');
  await mainField.getByRole('button', { name: '隐藏密码', exact: true }).focus();
  const visibleAfterInternalFocus = await passwordInput.getAttribute('type');
  const focusCss = await mainField.getByRole('button', { name: '隐藏密码', exact: true }).evaluate((el) => ({
    active: document.activeElement === el,
    outlineStyle: getComputedStyle(el).outlineStyle,
    outlineWidth: getComputedStyle(el).outlineWidth,
    outlineColor: getComputedStyle(el).outlineColor,
  }));
  await page.getByRole('button', { name: '聚焦输入框' }).click();
  evidence.interactions.maskOnBlur = {
    visibleBeforeInternalFocus,
    visibleAfterInternalFocus,
    afterLeavingComponent: await passwordInput.getAttribute('type'),
    focusCss,
  };

  const showPasswordCheckbox = page.getByLabel('允许切换明文', { exact: false });
  if (await showPasswordCheckbox.count()) await showPasswordCheckbox.first().uncheck();
  evidence.interactions.showPasswordDisabled = {
    toggleCount: await page.locator('.lx-password-input__toggle').count(),
    inputType: await passwordInput.getAttribute('type'),
  };
  if (await showPasswordCheckbox.count()) await showPasswordCheckbox.first().check();

  const readOnly = page.locator('#password-input-readonly');
  const disabled = page.locator('#password-input-disabled');
  evidence.interactions.readonlyDisabled = {
    readonly: { readOnly: await readOnly.evaluate((el) => el.readOnly), disabled: await readOnly.evaluate((el) => el.disabled) },
    disabled: { readOnly: await disabled.evaluate((el) => el.readOnly), disabled: await disabled.evaluate((el) => el.disabled) },
  };

  const clipboardCheckbox = page.getByLabel('阻止剪贴板操作', { exact: false });
  if (await clipboardCheckbox.count()) await clipboardCheckbox.first().check();
  const clipboard = await passwordInput.evaluate((el) => {
    const event = new ClipboardEvent('copy', { bubbles: true, cancelable: true });
    const dispatchResult = el.dispatchEvent(event);
    return { dispatchResult, defaultPrevented: event.defaultPrevented };
  });
  evidence.interactions.preventClipboard = clipboard;
  if (await clipboardCheckbox.count()) await clipboardCheckbox.first().uncheck();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  evidence.interactions.reducedMotion = await page.evaluate(() => ({
    mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    eyeToggleTransitionDuration: getComputedStyle(document.querySelector('.lx-password-input__toggle')).transitionDuration,
    advancedIconTransitionDuration: getComputedStyle(document.querySelector('.password-input-demo__advanced-icon')).transitionDuration,
    actionStatus: document.querySelector('[data-testid="last-action"]')?.innerText.trim(),
  }));
  await shot('browser-reduced-motion.png', false);
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  await page.setViewportSize({ width: 320, height: 844 });
  await page.waitForTimeout(150);
  evidence.captures.mobile320BeforeOverlay = await pageMetrics();
  await shot('browser-320-light.png', false);

  if (!(await details.evaluate((el) => el.open))) await summary.tap();
  await page.waitForTimeout(100);
  evidence.captures.mobile320AdvancedExpandedBeforeOverlay = await pageMetrics();
  evidence.interactions.mobileAdvancedTargetSize = {
    expanded: await details.evaluate((el) => el.open),
    labels: await page.locator('.password-input-demo__advanced-controls label').evaluateAll((nodes) => nodes.map((el) => {
      const rect = el.getBoundingClientRect();
      const input = el.querySelector('input');
      const inputRect = input?.getBoundingClientRect();
      return {
        text: el.innerText.trim(),
        width: Math.round(rect.width * 100) / 100,
        height: Math.round(rect.height * 100) / 100,
        minHeight: getComputedStyle(el).minHeight,
        checkbox: inputRect ? { width: Math.round(inputRect.width * 100) / 100, height: Math.round(inputRect.height * 100) / 100 } : null,
      };
    })),
  };
  await shot('browser-320-advanced-expanded.png', false);

  let localLink = page.locator('.VPDocAsideOutline a[href^="#"], .VPDocOutlineDropdown a[href^="#"]:visible').first();
  if (!(await localLink.count()) || !(await localLink.isVisible().catch(() => false))) {
    const outlineButton = page.locator('button.VPDocOutlineDropdown, .VPDocOutlineDropdown button, button[aria-label*="outline" i], button[aria-label*="目录"]').first();
    if (await outlineButton.count() && await outlineButton.isVisible().catch(() => false)) {
      await outlineButton.tap().catch(() => outlineButton.click());
      await page.waitForTimeout(100);
      localLink = page.locator('.VPDocAsideOutline a[href^="#"], .VPDocOutlineDropdown a[href^="#"]:visible').first();
    }
  }
  const localNavigation = { foundVisibleLocalLink: false };
  if (!(await localLink.count()) || !(await localLink.isVisible().catch(() => false))) {
    const onThisPage = page.getByText('On this page', { exact: true }).first();
    if (await onThisPage.count() && await onThisPage.isVisible().catch(() => false)) {
      localNavigation.onThisPageControlFound = true;
      await onThisPage.tap().catch(() => onThisPage.click());
      await page.waitForTimeout(150);
      localLink = page.locator('.VPDocAsideOutline a[href^="#"], .VPDocOutlineDropdown a[href^="#"], a.outline-link[href^="#"]').filter({ hasText: 'Props' }).first();
      localNavigation.onThisPageControlExpanded = await localLink.isVisible().catch(() => false);
    } else {
      localNavigation.onThisPageControlFound = false;
    }
  }
  if (await localLink.count() && await localLink.isVisible().catch(() => false)) {
    const href = await localLink.getAttribute('href');
    const text = (await localLink.innerText()).trim();
    const before = await page.evaluate(() => location.hash);
    await localLink.tap().catch(() => localLink.click());
    await page.waitForTimeout(250);
    const after = await page.evaluate(() => location.hash);
    const targetId = href?.startsWith('#') ? decodeURIComponent(href.slice(1)) : '';
    const targetData = targetId ? await page.evaluate((id) => {
      const el = document.getElementById(id);
      return el ? { found: true, top: Math.round(el.getBoundingClientRect().top * 100) / 100 } : { found: false, top: null };
    }, targetId) : { found: false, top: null };
    localNavigation.foundVisibleLocalLink = true;
    localNavigation.href = href;
    localNavigation.text = text;
    localNavigation.beforeHash = before;
    localNavigation.afterHash = after;
    localNavigation.targetId = targetId;
    localNavigation.targetVisible = targetData.found;
    localNavigation.targetTop = targetData.top;
    localNavigation.metricsAfterNavigation = await pageMetrics();
    await shot('browser-320-local-anchor-navigation.png', false);
  } else {
    localNavigation.inventory = evidence.captures.mobile320BeforeOverlay.localAnchors;
    const headingAnchor = page.locator('a.header-anchor[href="#props"]').first();
    if (await headingAnchor.count()) {
      const before = await page.evaluate(() => location.hash);
      await headingAnchor.tap().catch(() => headingAnchor.click({ force: true }));
      await page.waitForTimeout(250);
      const after = await page.evaluate(() => location.hash);
      const targetData = await page.evaluate(() => {
        const el = document.getElementById('props');
        return el ? { found: true, top: Math.round(el.getBoundingClientRect().top * 100) / 100 } : { found: false, top: null };
      });
      localNavigation.headingAnchorTap = {
        href: await headingAnchor.getAttribute('href'),
        visibleLink: await headingAnchor.isVisible().catch(() => false),
        beforeHash: before,
        afterHash: after,
        targetVisible: targetData.found,
        targetTop: targetData.top,
      };
    }
    const skipLink = page.locator('a.VPSkipLink[href="#VPContent"]').first();
    if (await skipLink.count()) {
      await skipLink.focus();
      const focusedRect = await skipLink.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return { x: Math.round(rect.x * 100) / 100, y: Math.round(rect.y * 100) / 100, width: Math.round(rect.width * 100) / 100, height: Math.round(rect.height * 100) / 100 };
      });
      const before = await page.evaluate(() => location.hash);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      localNavigation.skipToContentKeyboard = {
        focusedRect,
        beforeHash: before,
        afterHash: await page.evaluate(() => location.hash),
        targetExists: await page.locator('#VPContent').count() > 0,
      };
    }
    localNavigation.outlineVisibleAt320 = false;
    localNavigation.outlineReason = 'VitePress .VPDocAsideOutline links had zero layout box at 320px.';
    localNavigation.metricsAfterNavigation = await pageMetrics();
    await shot('browser-320-local-anchor-navigation.png', false);
  }
  evidence.interactions.mobileLocalAnchorNavigation = localNavigation;

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator('.password-input-demo').scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, 0));
  const beforeInject = await pageMetrics();
  await page.addScriptTag({ url: `http://127.0.0.1:${endpointPort}/detect.js` });
  await page.waitForFunction(() => typeof window.impeccableScan === 'function', { timeout: 5000 });
  await page.waitForTimeout(300);
  const scanSummary = await page.evaluate(() => {
    const findings = window.impeccableScan();
    const serialized = window.impeccableDetect();
    const overlays = [...document.querySelectorAll('.impeccable-overlay')].map((overlay) => {
      const target = overlay._targetEl || null;
      const targetBox = target?.getBoundingClientRect();
      return {
        overlayClass: overlay.className,
        labelText: overlay.querySelector('.impeccable-label')?.innerText.trim() || overlay.innerText.trim(),
        target: target ? {
          tag: target.tagName.toLowerCase(),
          id: target.id,
          className: typeof target.className === 'string' ? target.className : '',
          ariaLabel: target.getAttribute('aria-label'),
          text: (target.innerText || target.getAttribute('aria-label') || '').trim().slice(0, 120),
          rect: targetBox ? { x: targetBox.x, y: targetBox.y, width: targetBox.width, height: targetBox.height } : null,
          withinPasswordDemo: !!target.closest('.password-input-demo'),
          withinVitepressShell: !!target.closest('.VPNav, .VPNavBar, .VPSidebar, .VPDocAside'),
          ancestry: (() => {
            const parts = [];
            let el = target;
            for (let i = 0; el && i < 6; i++, el = el.parentElement) {
              const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
              parts.push(`${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls ? `.${cls}` : ''}`);
            }
            return parts;
          })(),
        } : null,
      };
    });
    return {
      scanReturnCount: findings.length,
      serialized,
      overlays,
      overlayNodes: document.querySelectorAll('.impeccable-overlay').length,
      labels: document.querySelectorAll('.impeccable-label').length,
    };
  });
  await page.waitForTimeout(2200);
  evidence.detector = {
    injected: true,
    endpoint: `http://127.0.0.1:${endpointPort}/detect.js`,
    sourceBytes: detectorSource.length,
    findings: scanSummary,
    beforeInjectionWidths: beforeInject.widths,
    afterInjection1280: await pageMetrics(),
    consoleAfterInjection: evidence.console.filter((item) => item.text.includes('[impeccable]')),
  };
  await shot('browser-1280-detector-overlay.png', false);

  await page.setViewportSize({ width: 320, height: 844 });
  await page.waitForTimeout(200);
  evidence.detector.afterInjection320 = await pageMetrics();
  await shot('browser-320-detector-overlay.png', false);
  evidence.detector.mobileWidthDelta = {
    before: evidence.captures.mobile320BeforeOverlay.widths,
    after: evidence.detector.afterInjection320.widths,
    documentScrollWidthDelta:
      evidence.detector.afterInjection320.widths.documentElement
      - evidence.captures.mobile320BeforeOverlay.widths.documentElement,
    bodyScrollWidthDelta:
      evidence.detector.afterInjection320.widths.body
      - evidence.captures.mobile320BeforeOverlay.widths.body,
  };

  await page.close();
  await context.close();
} catch (error) {
  evidence.errors.push({ type: 'script', text: error.stack || error.message });
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => {});
  await new Promise((resolve) => {
    if (!detectorServer.listening) return resolve();
    detectorServer.close(resolve);
  });
  evidence.detectorEndpoint.closed = !detectorServer.listening;
  evidence.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(outDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, 'detector-endpoint-lifecycle.json'), `${JSON.stringify(evidence.detectorEndpoint, null, 2)}\n`);
}
