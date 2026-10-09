import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const root = path.resolve(process.argv[2]);
const evidenceDir = path.resolve(process.argv[3]);
const targetUrl = process.argv[4];
const skillScripts = 'C:/Users/Administrator/.codex/skills/impeccable/scripts';
const liveServerPath = path.join(skillScripts, 'live-server.mjs');
const sourcePath = path.join(root, 'linkx-fe/src/components/LxTransferPanel/demo/basic.vue');
const requireFromAdmin = createRequire(path.join(root, 'other-admin/admin-vue3/package.json'));
const { chromium } = requireFromAdmin('@playwright/test');
const screenshotsDir = path.join(evidenceDir, 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

const sha256 = (filePath) => createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
const writeJson = (filePath, value) => fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const commandRecord = (label, command, result, stdoutRedactor = (value) => value) => {
  fs.writeFileSync(path.join(evidenceDir, `${label}.command.txt`), `${command}\n`, 'utf8');
  fs.writeFileSync(path.join(evidenceDir, `${label}.stdout.txt`), stdoutRedactor(result.stdout ?? ''), 'utf8');
  fs.writeFileSync(path.join(evidenceDir, `${label}.stderr.txt`), result.stderr ?? '', 'utf8');
  fs.writeFileSync(path.join(evidenceDir, `${label}.exit-code.txt`), `${result.status ?? 'null'}\n`, 'utf8');
};

const evidence = {
  assessment: 'B: 静态 detector 与浏览器证据',
  target: targetUrl,
  source: 'linkx-fe/src/components/LxTransferPanel/demo/basic.vue',
  sourceSha256Before: sha256(sourcePath),
  browser: {
    automation: '@playwright/test Chromium',
    mode: 'headless，独立 browser context 与新 page',
    userVisibleBrowserPresentation: '当前工具未提供可控制 Playwright 实例的浏览器标签；证据由独立新页采集。',
    console: [],
    pageErrors: [],
    httpErrors: [],
    states: [],
  },
  mutableInjectionPreflight: null,
  detectorOverlay: null,
  liveServer: { started: false, stopped: false },
  sourceSha256After: null,
};

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('console', (message) => {
  evidence.browser.console.push({ type: message.type(), text: message.text(), location: message.location() });
});
page.on('pageerror', (error) => {
  evidence.browser.pageErrors.push(error.message);
});
page.on('response', (response) => {
  if (response.status() >= 400) {
    evidence.browser.httpErrors.push({ status: response.status(), url: response.url() });
  }
});

let liveStarted = false;
try {
  const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('.lx-transfer-panel').first().waitFor({ state: 'visible', timeout: 20000 });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  evidence.browser.page = {
    status: response?.status() ?? null,
    titleBeforeLabel: await page.title(),
    finalUrl: page.url(),
    viewport: page.viewportSize(),
    userAgent: await page.evaluate(() => navigator.userAgent),
  };

  evidence.mutableInjectionPreflight = await page.evaluate(() => {
    const originalTitle = document.title;
    document.title = '[Human] LxTransferPanel Assessment B';
    const script = document.createElement('script');
    script.id = 'assessment-b-mutable-preflight';
    script.textContent = 'window.__assessmentBMutablePreflight = true;';
    document.head.appendChild(script);
    return {
      originalTitle,
      titleChanged: document.title === '[Human] LxTransferPanel Assessment B',
      scriptAppended: script.parentElement === document.head,
      scriptExecuted: window.__assessmentBMutablePreflight === true,
    };
  });

  const serverCommand = `node "${liveServerPath}" --background`;
  const serverStart = spawnSync(process.execPath, [liveServerPath, '--background'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 30000,
  });
  const redactToken = (value) => value.replace(/("token"\s*:\s*")[^"]+(")/g, '$1[REDACTED]$2');
  commandRecord('overlay-server-start', serverCommand, serverStart, redactToken);
  let serverInfo = null;
  try {
    serverInfo = JSON.parse(serverStart.stdout.trim());
  } catch {
    serverInfo = null;
  }

  if (serverStart.status === 0 && serverInfo?.port) {
    liveStarted = true;
    evidence.liveServer = {
      started: true,
      startExitCode: serverStart.status,
      port: serverInfo.port,
      pid: serverInfo.pid,
      stopCommand: `node "${liveServerPath}" stop --keep-inject`,
    };
    const overlayUrl = `http://localhost:${serverInfo.port}/detect.js`;
    evidence.detectorOverlay = await page.evaluate((src) => new Promise((resolve) => {
      const script = document.createElement('script');
      script.id = 'assessment-b-detector-overlay';
      script.src = src;
      script.onload = () => resolve({ status: 'loaded', src: script.src });
      script.onerror = () => resolve({ status: 'load-error', src: script.src });
      document.head.appendChild(script);
      window.setTimeout(() => resolve({ status: 'timeout', src: script.src }), 10000);
    }), overlayUrl);
    await page.waitForTimeout(2500);
    evidence.detectorOverlay.windowSignals = await page.evaluate(() => ({
      scriptPresent: Boolean(document.getElementById('assessment-b-detector-overlay')),
      detectorGlobals: Object.keys(window).filter((key) => /impeccable|detect/i.test(key)),
    }));
    evidence.detectorOverlay.serializedFindings = await page.evaluate(() => {
      if (typeof window.impeccableDetect !== 'function') return null;
      return window.impeccableDetect();
    });
    if (Array.isArray(evidence.detectorOverlay.serializedFindings)) {
      evidence.detectorOverlay.groupCount = evidence.detectorOverlay.serializedFindings.length;
      evidence.detectorOverlay.findingCount = evidence.detectorOverlay.serializedFindings
        .reduce((count, group) => count + (group.findings?.length ?? 0), 0);
      evidence.detectorOverlay.ruleCounts = evidence.detectorOverlay.serializedFindings
        .flatMap((group) => group.findings ?? [])
        .reduce((counts, finding) => {
          counts[finding.type] = (counts[finding.type] ?? 0) + 1;
          return counts;
        }, {});
      evidence.detectorOverlay.elementContexts = await page.evaluate((groups) => groups.map((group) => {
        const element = document.querySelector(group.selector);
        if (!element) return { selector: group.selector, resolved: false };
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const ancestors = [];
        let ancestor = element.parentElement;
        while (ancestor && ancestors.length < 3) {
          ancestors.push({ tag: ancestor.tagName.toLowerCase(), className: String(ancestor.className || '') });
          ancestor = ancestor.parentElement;
        }
        return {
          selector: group.selector,
          resolved: true,
          text: (element.innerText || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 240),
          className: String(element.className || ''),
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          computedStyle: {
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            border: style.border,
            boxShadow: style.boxShadow,
            transition: style.transition,
            backgroundImage: style.backgroundImage,
          },
          ancestors,
        };
      }), evidence.detectorOverlay.serializedFindings);
    }
    evidence.detectorOverlay.consoleMessages = evidence.browser.console.filter((entry) => /impeccable|detect/i.test(entry.text));
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: path.join(screenshotsDir, 'overlay-default-1440x1000.png'), fullPage: true });
  } else {
    evidence.liveServer = {
      started: false,
      startExitCode: serverStart.status,
      startError: serverStart.error?.message ?? null,
      reason: 'live-server 未能返回有效端口信息；overlay 未注入。',
    };
    evidence.detectorOverlay = { status: 'not-attempted', reason: 'live-server 未启动。' };
  }

  const select = page.getByLabel('面板高度');
  const collectState = async (name, panelHeight, viewport) => {
    if (viewport) await page.setViewportSize(viewport);
    await select.selectOption(String(panelHeight));
    await page.waitForTimeout(250);
    const measurement = await page.evaluate(() => {
      const panel = document.querySelector('.lx-transfer-panel');
      const rect = panel?.getBoundingClientRect();
      const documentElement = document.documentElement;
      const selectRect = document.querySelector('select[aria-label="面板高度"]')?.getBoundingClientRect();
      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        page: { scrollWidth: documentElement.scrollWidth, clientWidth: documentElement.clientWidth, horizontalOverflow: documentElement.scrollWidth > documentElement.clientWidth },
        panel: panel && rect ? {
          x: Math.round(rect.x * 100) / 100,
          y: Math.round(rect.y * 100) / 100,
          width: Math.round(rect.width * 100) / 100,
          height: Math.round(rect.height * 100) / 100,
          scrollHeight: panel.scrollHeight,
          clientHeight: panel.clientHeight,
        } : null,
        selectedHeight: document.querySelector('select[aria-label="面板高度"]')?.value ?? null,
        heightControl: selectRect ? { x: Math.round(selectRect.x), y: Math.round(selectRect.y), width: Math.round(selectRect.width), height: Math.round(selectRect.height) } : null,
        selectedCount: document.querySelector('[data-testid="selected-count"]')?.textContent?.trim() ?? null,
      };
    });
    const filename = `${name}.png`;
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: path.join(screenshotsDir, filename), fullPage: true });
    evidence.browser.states.push({ name, requestedPanelHeight: panelHeight, screenshot: `screenshots/${filename}`, ...measurement });
  };

  await page.locator('details.transfer-panel-demo__settings > summary').click();
  await collectState('desktop-height-240-1440x1000', 240);
  await collectState('desktop-height-300-1440x1000', 300);
  await collectState('desktop-height-380-1440x1000', 380);
  await collectState('narrow-height-240-320x844', 240, { width: 320, height: 844 });
} catch (error) {
  evidence.browser.captureError = error.stack ?? error.message;
} finally {
  if (liveStarted) {
    const stopCommand = `node "${liveServerPath}" stop --keep-inject`;
    const stopResult = spawnSync(process.execPath, [liveServerPath, 'stop', '--keep-inject'], {
      cwd: root,
      encoding: 'utf8',
      timeout: 15000,
    });
    commandRecord('overlay-server-stop', stopCommand, stopResult);
    evidence.liveServer.stopped = stopResult.status === 0;
    evidence.liveServer.stopExitCode = stopResult.status;
    evidence.liveServer.stopStdout = stopResult.stdout.trim();
    evidence.liveServer.stopStderr = stopResult.stderr;
  }
  evidence.browser.console = [...evidence.browser.console];
  evidence.sourceSha256After = sha256(sourcePath);
  evidence.sourceUnchangedDuringCapture = evidence.sourceSha256Before === evidence.sourceSha256After;
  await context.close();
  await browser.close();
  writeJson(path.join(evidenceDir, 'browser-evidence.json'), evidence);
}

if (evidence.browser.captureError || !evidence.liveServer.stopped) {
  process.exitCode = 1;
}
