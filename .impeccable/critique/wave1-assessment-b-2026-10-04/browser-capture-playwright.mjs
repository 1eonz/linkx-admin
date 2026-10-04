import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = 'F:/work/linkx-admin';
const evidenceDir = path.join(projectRoot, '.impeccable/critique/wave1-assessment-b-2026-10-04');
const screenshotDir = path.join(evidenceDir, 'screenshots-playwright');
const adminPackage = path.join(projectRoot, 'other-admin/admin-vue3/package.json');
const require = createRequire(adminPackage);
const { chromium } = require('@playwright/test');
const chromePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const targets = [
  { slug: 'lxbutton', component: 'LxButton', doc: 'linkx-fe/docs/components/lxbutton.md', source: 'linkx-fe/src/components/LxButton/index.vue', demo: 'linkx-fe/src/components/LxButton/demo/basic.vue', route: 'lxbutton.html', overlay: true, variant: 'light-desktop', focusSelector: '.lx-button-demo button' },
  { slug: 'lxactionbuttons', component: 'LxActionButtons', doc: 'linkx-fe/docs/components/lxactionbuttons.md', source: 'linkx-fe/src/components/LxActionButtons/index.vue', demo: 'linkx-fe/src/components/LxActionButtons/demo/basic.vue', route: 'lxactionbuttons.html', overlay: false, variant: 'light-desktop', focusSelector: '.lx-actions-demo button' },
  { slug: 'lxinput', component: 'LxInput', doc: 'linkx-fe/docs/components/lxinput.md', source: 'linkx-fe/src/components/LxInput/index.vue', demo: 'linkx-fe/src/components/LxInput/demo/basic.vue', route: 'lxinput.html', overlay: true, variant: 'hud-desktop', focusSelector: '.lx-input-demo input:not([type=checkbox])' },
  { slug: 'lxtextarea', component: 'LxTextarea', doc: 'linkx-fe/docs/components/lxtextarea.md', source: 'linkx-fe/src/components/LxTextarea/index.vue', demo: 'linkx-fe/src/components/LxTextarea/demo/basic.vue', route: 'lxtextarea.html', overlay: true, variant: 'light-mobile-375x812', focusSelector: '.lx-textarea-demo textarea' },
  { slug: 'lxinputnumber', component: 'LxInputNumber', doc: 'linkx-fe/docs/components/lxinputnumber.md', source: 'linkx-fe/src/components/LxInputNumber/index.vue', demo: 'linkx-fe/src/components/LxInputNumber/demo/basic.vue', route: 'lxinputnumber.html', overlay: true, variant: 'hud-mobile-375x812', focusSelector: '.lx-input-number-demo input:not([type=checkbox])' },
  { slug: 'lxpasswordinput', component: 'LxPasswordInput', doc: 'linkx-fe/docs/components/lxpasswordinput.md', source: 'linkx-fe/src/components/LxPasswordInput/index.vue', demo: 'linkx-fe/src/components/LxPasswordInput/demo/basic.vue', route: 'lxpasswordinput.html', overlay: true, variant: 'light-desktop', focusSelector: '.password-input-demo input:not([type=checkbox])' },
];

fs.mkdirSync(screenshotDir, { recursive: true });

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function fileFingerprint(relativePath) {
  const bytes = fs.readFileSync(path.join(projectRoot, relativePath));
  return { path: relativePath, bytes: bytes.length, sha256: sha256(bytes) };
}

async function waitForDemo(page) {
  await page.goto(`http://127.0.0.1:4174/components/${page.__route}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.locator('main h1').waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForTimeout(500);
}

async function runPreflight() {
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, colorScheme: 'light' });
  const results = [];
  try {
    for (const target of targets) {
      const page = await context.newPage();
      page.__route = target.route;
      const response = await page.goto(`http://127.0.0.1:4174/components/${target.route}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.locator('main h1').waitFor({ state: 'visible', timeout: 30000 });
      await page.waitForTimeout(500);
      const originalTitle = await page.title();
      const mutation = await page.evaluate((title) => {
        const script = document.createElement('script');
        script.dataset.assessmentBPreflight = 'true';
        script.textContent = 'window.__assessmentBPreflightRan = true;';
        document.title = `[Assessment B preflight] ${title}`;
        document.head.appendChild(script);
        const result = {
          changedTitle: document.title === `[Assessment B preflight] ${title}`,
          scriptAppended: script.isConnected,
          scriptExecuted: window.__assessmentBPreflightRan === true,
          matchingScriptCount: document.querySelectorAll('script[data-assessment-b-preflight="true"]').length,
        };
        script.remove();
        delete window.__assessmentBPreflightRan;
        document.title = title;
        return { ...result, restoredTitle: document.title === title, remainingProbeScripts: document.querySelectorAll('script[data-assessment-b-preflight="true"]').length };
      }, originalTitle);
      const pageState = await page.evaluate(() => ({
        title: document.title,
        heading: document.querySelector('main h1')?.innerText,
        viewport: { width: innerWidth, height: innerHeight },
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        controls: [...document.querySelectorAll('main input, main textarea, main button, main [role="button"], main [role="switch"]')]
          .filter((element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          })
          .slice(0, 50)
          .map((element) => ({
            tag: element.tagName,
            type: element.getAttribute('type'),
            className: typeof element.className === 'string' ? element.className : '',
            ariaLabel: element.getAttribute('aria-label'),
            placeholder: element.getAttribute('placeholder'),
            text: (element.innerText || element.closest('label')?.innerText || element.parentElement?.innerText || '').trim().slice(0, 100),
            disabled: 'disabled' in element ? element.disabled : false,
          })),
      }));
      results.push({ component: target.component, url: page.url(), httpStatus: response?.status(), titleBefore: originalTitle, mutation, pageState });
      await page.close();
    }
  } finally {
    await context.close();
    await browser.close();
  }

  const output = { stage: 'preflight', generatedAt: new Date().toISOString(), chromium: await chromiumExecutableVersion(), results };
  fs.writeFileSync(path.join(evidenceDir, 'browser-preflight-playwright.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(output)}\n`);
}

async function chromiumExecutableVersion() {
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const version = browser.version();
  await browser.close();
  return { executablePath: chromePath, version };
}

async function measure(page, externalRequests) {
  const viewport = page.viewportSize();
  const metrics = await page.evaluate(() => ({
    title: document.title,
    heading: document.querySelector('main h1')?.innerText,
    viewport: { width: innerWidth, height: innerHeight },
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
    bodyHeight: document.body.scrollHeight,
    scrollY,
    hudThemeContainers: document.querySelectorAll('.lx-theme-hud').length,
    overlayElements: document.querySelectorAll('.impeccable-overlay').length,
    overflowElements: [...document.querySelectorAll('body *')]
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.position !== 'fixed' && style.display !== 'none' && style.visibility !== 'hidden'
          && rect.width > 0 && rect.height > 0 && (rect.left < -1 || rect.right > innerWidth + 1);
      })
      .slice(0, 20)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id || null,
          className: typeof element.className === 'string' ? element.className : '',
          text: (element.innerText || element.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 120),
          bounds: { left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) },
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          position: style.position,
        };
      }),
  }));
  return { ...metrics, viewportConfigured: viewport, externalRequestCount: externalRequests.size, externalHosts: [...new Set([...externalRequests].map((url) => new URL(url).hostname))] };
}

async function serializeConsoleMessage(message) {
  const args = await Promise.all(message.args().map(async (arg) => {
    try {
      return await arg.evaluate((value) => {
        if (value instanceof Element) {
          const style = getComputedStyle(value);
          const rect = value.getBoundingClientRect();
          return {
            kind: 'element',
            tag: value.tagName.toLowerCase(),
            id: value.id || null,
            className: typeof value.className === 'string' ? value.className : '',
            text: (value.innerText || value.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 180),
            outerHTML: value.outerHTML.slice(0, 500),
            bounds: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            style: { color: style.color, backgroundColor: style.backgroundColor, fontSize: style.fontSize, opacity: style.opacity },
          };
        }
        if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
          return { kind: typeof value, value: typeof value === 'string' ? value.slice(0, 2000) : value };
        }
        let serialized;
        try {
          serialized = JSON.stringify(value);
        } catch {
          serialized = String(value);
        }
        return { kind: typeof value, value: serialized?.slice(0, 2000) ?? null };
      });
    } catch (error) {
      return { kind: 'unavailable', reason: error.message };
    }
  }));
  return { type: message.type(), text: message.text(), location: message.location(), args };
}

async function enableHudTheme(page) {
  const checkboxes = await page.locator('input[type="checkbox"]').all();
  for (const checkbox of checkboxes) {
    const text = await checkbox.evaluate((element) => (element.closest('label')?.innerText || element.parentElement?.innerText || '').trim());
    if (text.includes('HUD 深色主题')) {
      await checkbox.check();
      await page.waitForTimeout(150);
      return { found: true, label: text, checked: await checkbox.isChecked(), containers: await page.locator('.lx-theme-hud').count() };
    }
  }
  return { found: false, checked: false, containers: await page.locator('.lx-theme-hud').count() };
}

async function capture() {
  const liveServerPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs';
  const liveServerOutput = execFileSync(process.execPath, [liveServerPath, '--background'], { cwd: projectRoot, encoding: 'utf8' }).trim();
  const liveServer = JSON.parse(liveServerOutput);
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, colorScheme: 'light', deviceScaleFactor: 1 });
  const views = [];
  try {
    for (const target of targets) {
      const page = await context.newPage();
      const consoleEvents = [];
      const externalRequests = new Set();
      const requestUrls = [];
      const requestFailures = [];
      const httpErrors = [];
      const consoleMessages = [];
      page.on('console', (message) => consoleMessages.push(message));
      page.on('pageerror', (error) => consoleEvents.push({ type: 'pageerror', text: error.stack || error.message }));
      page.on('request', (request) => {
        const url = request.url();
        requestUrls.push(url);
        try {
          const hostname = new URL(url).hostname;
          if (!['127.0.0.1', 'localhost', '::1'].includes(hostname)) externalRequests.add(url);
        } catch {}
      });
      page.on('requestfailed', (request) => requestFailures.push({ url: request.url(), errorText: request.failure()?.errorText || null }));
      page.on('response', (response) => {
        if (response.status() >= 400) httpErrors.push({ status: response.status(), url: response.url() });
      });

      const response = await page.goto(`http://127.0.0.1:4174/components/${target.route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.locator('main h1').waitFor({ state: 'visible', timeout: 30000 });
      await page.waitForTimeout(500);
      const renderedDomSha256 = sha256(await page.content());
      const sourceFingerprints = [target.source, target.demo, target.doc].map(fileFingerprint);
      const baseMetrics = await measure(page, externalRequests);
      const baseScreenshot = path.join(screenshotDir, `${target.slug}-light-desktop-baseline.png`);
      await page.screenshot({ path: baseScreenshot, fullPage: false });

      let hudState = { found: false, checked: false, containers: 0 };
      if (target.variant.includes('hud')) hudState = await enableHudTheme(page);
      if (target.variant.includes('mobile')) await page.setViewportSize({ width: 375, height: 812 });
      const variantMetrics = await measure(page, externalRequests);

      const interactions = [];
      if (target.focusSelector) {
        const focusTarget = page.locator(target.focusSelector).first();
        if (await focusTarget.count()) {
          await focusTarget.focus();
          interactions.push({
            kind: 'focus',
            selector: target.focusSelector,
            focused: await focusTarget.evaluate((element) => element === document.activeElement || element.contains(document.activeElement)),
          });
        } else {
          interactions.push({ kind: 'focus', selector: target.focusSelector, focused: false, reason: 'selector matched no element' });
        }
      }
      if (target.component === 'LxPasswordInput') {
        const reveal = page.locator('.password-input-demo__field').first().locator('button[aria-pressed]');
        if (await reveal.count()) {
          const input = page.locator('.password-input-demo input:not([type=checkbox])').first();
          const before = { type: await input.getAttribute('type'), ariaLabel: await reveal.getAttribute('aria-label'), ariaPressed: await reveal.getAttribute('aria-pressed') };
          await reveal.click();
          interactions.push({
            kind: 'password visibility toggle',
            before,
            after: { type: await input.getAttribute('type'), ariaLabel: await reveal.getAttribute('aria-label'), ariaPressed: await reveal.getAttribute('aria-pressed') },
          });
        } else {
          interactions.push({ kind: 'password visibility toggle', attempted: false, reason: 'toggle button not found' });
        }
      }

      let overlayResult = { injected: false, reason: 'not selected as a representative overlay page' };
      if (target.overlay) {
        const consoleStart = consoleMessages.length;
        await page.addScriptTag({ url: `http://localhost:${liveServer.port}/detect.js` });
        await page.waitForTimeout(2500);
        const overlayMessages = await Promise.all(consoleMessages.slice(consoleStart)
          .filter((message) => message.location()?.url?.includes('/detect.js') || message.text().includes('[impeccable]') || message.text().includes('anti-pattern'))
          .map(serializeConsoleMessage));
        const overlayMetrics = await measure(page, externalRequests);
        const overlayScreenshot = path.join(screenshotDir, `${target.slug}-${target.variant}-overlay.png`);
        await page.screenshot({ path: overlayScreenshot, fullPage: false });
        overlayResult = {
          injected: true,
          scriptUrl: `http://localhost:${liveServer.port}/detect.js`,
          scriptNodeCount: await page.locator('script[src*="/detect.js"]').count(),
          consoleMessages: overlayMessages,
          metricsAfterOverlay: overlayMetrics,
          screenshot: path.relative(evidenceDir, overlayScreenshot),
        };
      }

      const finalMetrics = await measure(page, externalRequests);
      for (const message of consoleMessages) consoleEvents.push(await serializeConsoleMessage(message));
      views.push({
        component: target.component,
        url: page.url(),
        httpStatus: response?.status(),
        variant: target.variant,
        viewport: finalMetrics.viewport,
        targetFingerprint: { renderedDomSha256, sourceFingerprints },
        mutableDomPreflight: 'passed on an earlier fresh page for this URL; title restored and probe script removed',
        baseline: { metrics: baseMetrics, screenshot: path.relative(evidenceDir, baseScreenshot) },
        variantMetrics,
        hudState,
        interactions,
        overlay: overlayResult,
        finalMetrics,
        console: consoleEvents,
        requestFailures,
        httpErrors,
        requestUrls,
      });
      await page.close();
    }
  } finally {
    await context.close();
    await browser.close();
    try {
      execFileSync(process.execPath, [liveServerPath, 'stop', '--keep-inject'], { cwd: projectRoot, encoding: 'utf8', stdio: 'ignore' });
    } catch {}
  }

  const output = {
    stage: 'browser capture',
    generatedAt: new Date().toISOString(),
    browser: { engine: 'Chromium', executablePath: chromePath, version: browser.version(), headless: true },
    liveDetectorServer: { startedByThisCapture: true, port: liveServer.port, stoppedInFinally: true },
    representatives: targets.filter((target) => target.overlay).map((target) => target.component),
    viewCount: views.length,
    views,
  };
  fs.writeFileSync(path.join(evidenceDir, 'browser-evidence-playwright.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({ viewCount: output.viewCount, overlays: views.filter((view) => view.overlay.injected).length, liveServerStopped: output.liveDetectorServer.stoppedInFinally, evidence: path.join(evidenceDir, 'browser-evidence-playwright.json') })}\n`);
}

const stage = process.argv[2];
if (stage === 'preflight') {
  await runPreflight();
} else if (stage === 'capture') {
  await capture();
} else {
  process.stderr.write('Usage: browser-capture-playwright.mjs <preflight|capture>\n');
  process.exitCode = 2;
}
