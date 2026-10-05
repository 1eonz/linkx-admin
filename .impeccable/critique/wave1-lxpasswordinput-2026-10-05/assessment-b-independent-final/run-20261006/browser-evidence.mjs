import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = process.cwd();
const outDir = path.join(root, '.impeccable/critique/wave1-lxpasswordinput-2026-10-05/assessment-b-independent-final/run-20261006');
const targetUrl = 'http://127.0.0.1:4195/components/lxpasswordinput.html';
const overlayUrl = 'http://127.0.0.1:8401/detect.js';
const localRequire = createRequire(path.join(root, 'other-admin/admin-vue3/package.json'));
const { chromium } = localRequire('@playwright/test');
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const requests = [];
const responses = [];
const consoleMessages = [];
const pageErrors = [];
const states = [];

page.on('request', (request) => {
  let url = request.url();
  try {
    const parsed = new URL(url);
    url = `${parsed.origin}${parsed.pathname}`;
  } catch {}
  requests.push({ url, method: request.method(), resourceType: request.resourceType() });
});
page.on('response', (response) => {
  let url = response.url();
  try {
    const parsed = new URL(url);
    url = `${parsed.origin}${parsed.pathname}`;
  } catch {}
  responses.push({ url, status: response.status() });
});
page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text() }));
page.on('pageerror', (error) => pageErrors.push({ name: error.name, message: error.message }));

function saveJson(name, value) {
  fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

async function metrics(name) {
  const result = await page.evaluate((stateName) => {
    const input = document.querySelector('#password-input-demo');
    const toggle = document.querySelector('.password-input-demo__field button.lx-password-input__toggle');
    const bounds = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
      };
    };
    const root = input?.closest('.lx-password-input') || input?.parentElement;
    const inputShell = input?.closest('.el-input');
    const inputWrapper = input?.closest('.el-input__wrapper');
    const suffix = inputShell?.querySelector('.el-input__suffix');
    const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const viewportWidth = document.documentElement.clientWidth;
    return {
      state: stateName,
      viewport: { width: window.innerWidth, height: window.innerHeight, documentClientWidth: viewportWidth, documentScrollWidth: documentWidth },
      pageHorizontalOverflow: documentWidth > viewportWidth,
      input: {
        type: input?.type,
        disabled: input?.disabled,
        readOnly: input?.readOnly,
        focused: document.activeElement === input,
        bounds: bounds(input),
      },
      componentBounds: bounds(root),
      inputShellBounds: bounds(inputShell),
      inputWrapperBounds: bounds(inputWrapper),
      suffixBounds: bounds(suffix),
      toggle: {
        exists: !!toggle,
        disabled: toggle?.disabled,
        ariaLabel: toggle?.getAttribute('aria-label'),
        pressed: toggle?.getAttribute('aria-pressed'),
        bounds: bounds(toggle),
      },
      documentActiveElement: document.activeElement?.outerHTML?.slice(0, 220) || null,
    };
  }, name);
  return result;
}

async function capture(name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const layout = await metrics(name);
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
  states.push(layout);
  return layout;
}

try {
  const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('#password-input-demo').waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForTimeout(500);
  await page.evaluate(() => { document.title = '[Human] LxPasswordInput Assessment B'; });

  await capture('desktop-light');
  const hud = page.getByLabel('HUD 深色主题');
  await hud.check();
  await page.waitForTimeout(150);
  await capture('desktop-hud');

  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(100);
  await capture('mobile-375-hud');
  await hud.uncheck();
  await page.waitForTimeout(150);
  await capture('mobile-375-light');

  await page.setViewportSize({ width: 1280, height: 900 });
  const passwordInput = page.locator('#password-input-demo');
  const demoField = page.locator('.password-input-demo__field').nth(0);
  const mainToggle = demoField.locator('button.lx-password-input__toggle');
  const beforeToggle = await passwordInput.getAttribute('type');
  await mainToggle.click();
  const afterShow = {
    inputType: await passwordInput.getAttribute('type'),
    buttonLabel: await mainToggle.getAttribute('aria-label'),
    ariaPressed: await mainToggle.getAttribute('aria-pressed'),
  };
  await capture('password-visible');
  await passwordInput.focus();
  await page.keyboard.press('Tab');
  const keyboardFocus = await page.evaluate(() => ({
    tag: document.activeElement?.tagName,
    className: document.activeElement?.className || '',
    ariaLabel: document.activeElement?.getAttribute('aria-label'),
    focusVisible: document.activeElement?.matches(':focus-visible') || false,
  }));
  await page.keyboard.press('Space');
  const afterSpace = await passwordInput.getAttribute('type');
  await page.keyboard.press('Enter');
  const afterEnter = await passwordInput.getAttribute('type');
  await capture('keyboard-toggle-focus');
  await passwordInput.focus();
  await passwordInput.blur();
  await page.waitForTimeout(50);
  const afterBlur = {
    inputType: await passwordInput.getAttribute('type'),
    focused: await passwordInput.evaluate((element) => document.activeElement === element),
    status: await page.getByTestId('last-action').innerText(),
  };
  await capture('password-blurred');

  const readonlyInput = page.locator('#password-input-readonly');
  const readonlyToggle = page.locator('.password-input-demo__field').nth(1).locator('button.lx-password-input__toggle');
  await readonlyToggle.click();
  const readonlyState = {
    readOnly: await readonlyInput.evaluate((element) => element.readOnly),
    inputTypeAfterReveal: await readonlyInput.getAttribute('type'),
    toggleDisabled: await readonlyToggle.isDisabled(),
  };
  const disabledInput = page.locator('#password-input-disabled');
  const disabledToggle = page.locator('.password-input-demo__field').nth(2).locator('button.lx-password-input__toggle');
  const disabledState = {
    disabled: await disabledInput.isDisabled(),
    toggleDisabled: await disabledToggle.isDisabled(),
  };
  await disabledInput.focus();
  disabledState.inputReceivedFocus = await disabledInput.evaluate((element) => document.activeElement === element);
  await capture('readonly-disabled');

  const showPasswordControl = page.getByLabel('允许切换明文');
  await showPasswordControl.uncheck();
  const toggleHiddenWhenDisabledByProp = await demoField.locator('button.lx-password-input__toggle').count() === 0;
  const hiddenByPropType = await passwordInput.getAttribute('type');
  await showPasswordControl.check();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedMotionDuration = await mainToggle.evaluate((element) => getComputedStyle(element).transitionDuration);
  await capture('reduced-motion');

  const preflight = await page.evaluate(() => {
    const tag = document.createElement('script');
    tag.type = 'application/json';
    tag.dataset.assessmentPreflight = 'true';
    tag.textContent = '{}';
    document.head.append(tag);
    const appended = document.head.contains(tag);
    tag.remove();
    return { title: document.title, scriptAppendSupported: appended, removedAfterProbe: !document.querySelector('script[data-assessment-preflight]') };
  });
  const injection = await page.evaluate(async (url) => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve({ loaded: true, src: script.src });
      script.onerror = () => resolve({ loaded: false, src: script.src, error: 'script load failed' });
      document.head.append(script);
    });
  }, overlayUrl);
  await page.waitForTimeout(2200);
  const detectorRun = await page.evaluate(async () => {
    const scanner = window.impeccableScanAsync || window.impeccableScan;
    if (typeof scanner !== 'function') return { available: false, result: null };
    const result = await scanner();
    const serialized = JSON.stringify(result ?? null, (key, value) => {
      if (value && typeof value === 'object' && value.nodeType === 1) {
        return { tagName: value.tagName, id: value.id || null, className: value.className || null };
      }
      return value;
    });
    return { available: true, result: JSON.parse(serialized) };
  });
  await page.waitForTimeout(300);
  const overlayDom = await page.evaluate(() => {
    const cssPath = (element) => {
      if (!element || element.nodeType !== 1) return null;
      const parts = [];
      let current = element;
      while (current && current.nodeType === 1 && current !== document.body) {
        let part = current.tagName.toLowerCase();
        if (current.id) {
          part += `#${CSS.escape(current.id)}`;
          parts.unshift(part);
          break;
        }
        const classes = Array.from(current.classList || []).slice(0, 3);
        if (classes.length) part += `.${classes.map((name) => CSS.escape(name)).join('.')}`;
        const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((node) => node.tagName === current.tagName) : [];
        if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
        parts.unshift(part);
        current = current.parentElement;
      }
      return parts.join(' > ');
    };
    return Array.from(document.querySelectorAll('.impeccable-overlay, .impeccable-banner')).map((element) => {
      const target = element._targetEl || null;
      const scope = target?.closest('.password-input-demo')
        ? 'LxPasswordInput demo'
        : target?.closest('.VPDoc')
          ? 'VitePress docs shell/content'
          : target?.closest('.VPNav, .VPSidebar, .VPDocAside, .VPDocFooter, .VPNavBar, .VPSidebarItem, body')
            ? 'VitePress shell'
            : target ? 'page content or shell, needs manual inspection' : 'page-level overlay';
      return {
        overlayClass: element.className,
        text: (element.innerText || element.textContent || '').trim().slice(0, 600),
        targetSelector: cssPath(target),
        targetTag: target?.tagName || null,
        targetClass: target?.className || null,
        scope,
      };
    });
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(outDir, 'overlay-desktop-light.png'), fullPage: true });

  const externalRequests = requests.filter(({ url }) => /^https?:/.test(url) && !/^http:\/\/127\.0\.0\.1(?::\d+)?\//.test(url));
  const evidence = {
    targetUrl,
    documentTitle: await page.title(),
    responseStatus: response?.status() ?? null,
    states,
    interactions: {
      passwordToggle: { before: beforeToggle, afterShow, afterSpace, afterEnter, afterBlur },
      keyboardFocus,
      readonly: readonlyState,
      disabled: disabledState,
      showPasswordFalse: { toggleRemoved: toggleHiddenWhenDisabledByProp, inputType: hiddenByPropType },
      reducedMotion: { media: 'reduce', toggleTransitionDuration: reducedMotionDuration },
    },
    injection: { preflight, ...injection, detectorFunctionAvailable: detectorRun.available },
    detectorRun: detectorRun.result,
    overlayDom,
    externalRequests,
    responses,
    localHttpErrors: responses.filter((item) => item.status >= 400),
    pageErrors,
  };
  saveJson('browser-evidence.json', evidence);
  saveJson('browser-console.json', consoleMessages);
  saveJson('browser-network.json', { requests, responses, externalRequests, localHttpErrors: evidence.localHttpErrors });
  saveJson('browser-injection.json', { preflight, injection, detectorFunctionAvailable: detectorRun.available, overlayCount: overlayDom.length });
  saveJson('browser-findings.json', { detectorRun: detectorRun.result, overlayDom, consoleMessages });
  console.log(JSON.stringify({
    responseStatus: evidence.responseStatus,
    stateCount: states.length,
    overflowStates: states.filter((state) => state.pageHorizontalOverflow).map((state) => state.state),
    mobileToggleBounds: states.find((state) => state.state === 'mobile-375-light')?.toggle.bounds,
    desktopToggleBounds: states.find((state) => state.state === 'desktop-light')?.toggle.bounds,
    interactions: evidence.interactions,
    injection: evidence.injection,
    overlayCount: overlayDom.length,
    externalRequests,
    pageErrors,
  }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
