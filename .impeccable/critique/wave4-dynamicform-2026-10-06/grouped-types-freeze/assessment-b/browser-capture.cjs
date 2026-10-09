const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const evidenceDir = __dirname;
const targetUrl = 'http://127.0.0.1:4174/components/lxdynamicform.html';
const livePort = fs.readFileSync(path.join(evidenceDir, 'detector-server-port.txt'), 'utf8').trim();
const detectorScriptUrl = `http://localhost:${livePort}/detect.js`;
const views = [
  { id: 'desktop-light', label: '亮色桌面', context: { viewport: { width: 1440, height: 1000 }, colorScheme: 'light' } },
  { id: 'dark-hud', label: '深色/HUD', context: { viewport: { width: 1440, height: 1000 }, colorScheme: 'dark' } },
  { id: 'mobile-375-touch', label: '375px 触屏', context: { viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'light' } },
];

function mkdir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const view of views) {
    const viewDir = path.join(evidenceDir, 'browser', view.id);
    mkdir(viewDir);
    const context = await browser.newContext(view.context);
    const page = await context.newPage();
    const events = { console: [], pageErrors: [], failedRequests: [], httpErrors: [] };
    page.on('console', message => events.console.push({ type: message.type(), text: message.text(), location: message.location() }));
    page.on('pageerror', error => events.pageErrors.push(String(error?.stack || error)));
    page.on('requestfailed', request => events.failedRequests.push({ url: request.url(), error: request.failure()?.errorText || null }));
    page.on('response', response => {
      if (response.status() >= 400) events.httpErrors.push({ url: response.url(), status: response.status() });
    });

    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);
    let themeAction = 'none';
    if (view.id === 'dark-hud') {
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark') || getComputedStyle(document.documentElement).colorScheme === 'dark');
      if (!isDark) {
        const switches = page.locator('button.VPSwitchAppearance');
        for (let index = 0; index < await switches.count(); index++) {
          const button = switches.nth(index);
          if (await button.isVisible()) {
            await button.click();
            themeAction = `clicked visible theme switch at index ${index}`;
            break;
          }
        }
        await page.waitForTimeout(500);
      } else {
        themeAction = 'dark color scheme applied by browser context';
      }
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    let injected = false;
    let injectionError = null;
    try {
      await page.addScriptTag({ url: detectorScriptUrl });
      injected = true;
    } catch (error) {
      injectionError = String(error?.stack || error);
    }
    await page.waitForTimeout(3000);

    const pageEvidence = await page.evaluate(() => {
      const themeButton = Array.from(document.querySelectorAll('button.VPSwitchAppearance')).find(button => {
        const style = getComputedStyle(button);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
      let findings = null;
      let detectorError = null;
      if (typeof window.impeccableDetect === 'function') {
        try { findings = window.impeccableDetect({ decorate: false }); }
        catch (error) { detectorError = String(error?.stack || error); }
      }
      const findingsArray = Array.isArray(findings) ? findings : [];
      const overlays = Array.from(document.querySelectorAll('.impeccable-overlay')).map((element, index) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const target = element._targetEl || null;
        const targetRect = target?.getBoundingClientRect?.().toJSON?.() || null;
        const candidates = targetRect
          ? findingsArray.filter(group => group.tagName === target.tagName?.toLowerCase() && group.rect && ['x', 'y', 'width', 'height'].every(key => Math.abs(group.rect[key] - targetRect[key]) < 1))
          : [];
        const labelText = (element.innerText || element.textContent || '').trim().slice(0, 320);
        const normalizedLabel = labelText.replace(/^✦\s*/, '').trim().toLowerCase();
        const matchingGroup = candidates.find(group => group.findings?.some(finding => finding.name?.toLowerCase() === normalizedLabel)) || candidates[0] || null;
        return {
          index,
          className: element.className,
          text: labelText,
          attributes: Array.from(element.attributes).map(attribute => [attribute.name, attribute.value]),
          visible: style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0,
          rect: rect.toJSON(),
          targetSelector: matchingGroup?.selector || null,
          targetTagName: target?.tagName?.toLowerCase() || null,
          targetClassName: typeof target?.className === 'string' ? target.className : null,
          targetText: (target?.innerText || target?.textContent || '').trim().slice(0, 240) || null,
          targetRect,
          matchingFindings: matchingGroup?.findings || [],
          selectorMatchStatus: matchingGroup ? 'matched-by-tag-and-bounds' : 'unmatched',
        };
      });
      const matchedSelectors = new Set(overlays.map(overlay => overlay.targetSelector).filter(Boolean));
      return {
        title: document.title,
        heading: document.querySelector('h1')?.innerText || null,
        headings: Array.from(document.querySelectorAll('main h2, main h3, main h4')).map(element => ({ level: element.tagName.toLowerCase(), text: (element.innerText || '').trim() })).filter(item => item.text),
        theme: {
          htmlClass: document.documentElement.className,
          dataTheme: document.documentElement.getAttribute('data-theme'),
          colorScheme: getComputedStyle(document.documentElement).colorScheme,
          background: getComputedStyle(document.body).backgroundColor,
          switchTitle: themeButton?.getAttribute('title') || null,
        },
        viewport: { width: innerWidth, height: innerHeight, visualViewportWidth: window.visualViewport?.width || null, visualViewportHeight: window.visualViewport?.height || null, documentClientWidth: document.documentElement.clientWidth, documentScrollWidth: document.documentElement.scrollWidth, horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 },
        detector: {
          scriptPresent: Array.from(document.scripts).some(script => script.src === window.__assessmentBDetectorScriptUrl),
          apiAvailable: typeof window.impeccableDetect === 'function',
          error: detectorError,
          findings: findingsArray,
          findingGroupCount: findingsArray.length,
          findingCount: findingsArray.reduce((sum, item) => sum + (Array.isArray(item.findings) ? item.findings.length : 0), 0),
          selectors: findingsArray.map(item => ({ selector: item.selector, tagName: item.tagName, findings: item.findings })),
          overlays,
          overlayCount: overlays.length,
          visibleOverlayCount: overlays.filter(item => item.visible).length,
          matchedOverlayCount: overlays.filter(item => item.targetSelector).length,
          unmatchedOverlays: overlays.filter(item => !item.targetSelector).map(item => ({ index: item.index, text: item.text, rect: item.rect })),
          unmatchedFindingGroups: findingsArray.filter(item => !matchedSelectors.has(item.selector)),
        },
        bodyTextStart: (document.body.innerText || '').slice(0, 1000),
      };
    });
    const scriptPresent = await page.evaluate(url => Array.from(document.scripts).some(script => script.src === url), detectorScriptUrl);
    pageEvidence.detector.scriptPresent = scriptPresent;
    pageEvidence.detector.injectedScriptUrl = detectorScriptUrl;

    const screenshot = `${view.id}.png`;
    await page.screenshot({ path: path.join(viewDir, screenshot), fullPage: true, animations: 'disabled', timeout: 30000 });
    const viewportScreenshot = `${view.id}-viewport.png`;
    await page.screenshot({ path: path.join(viewDir, viewportScreenshot), fullPage: false, animations: 'disabled', timeout: 30000 });
    const evidence = {
      view: view.id,
      label: view.label,
      capturedAt: new Date().toISOString(),
      targetUrl,
      detectorScriptUrl,
      responseStatus: response?.status() ?? null,
      responseUrl: response?.url() ?? null,
      context: view.context,
      themeAction,
      injectionSucceeded: injected,
      injectionError,
      postInjectionWaitMs: 3000,
      page: pageEvidence,
      events,
      screenshots: { fullPage: screenshot, viewport: viewportScreenshot },
    };
    fs.writeFileSync(path.join(viewDir, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n', 'utf8');
    results.push({
      view: view.id,
      responseStatus: evidence.responseStatus,
      theme: pageEvidence.theme,
      viewport: pageEvidence.viewport,
      injectionSucceeded: injected,
      apiAvailable: pageEvidence.detector.apiAvailable,
      findingGroupCount: pageEvidence.detector.findingGroupCount,
      findingCount: pageEvidence.detector.findingCount,
      overlayCount: pageEvidence.detector.overlayCount,
      visibleOverlayCount: pageEvidence.detector.visibleOverlayCount,
      consoleImpeccable: events.console.filter(event => event.text.includes('[impeccable]')),
      pageErrors: events.pageErrors,
      failedRequests: events.failedRequests,
      httpErrors: events.httpErrors,
      evidence: path.relative(evidenceDir, path.join(viewDir, 'evidence.json')),
    });
    await context.close();
  }
  await browser.close();
  const summary = { capturedAt: new Date().toISOString(), targetUrl, detectorScriptUrl, views: results };
  fs.writeFileSync(path.join(evidenceDir, 'browser-summary.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');
  process.stdout.write(JSON.stringify({ views: results.length, summaryPath: 'browser-summary.json' }) + '\n');
}

main().catch(error => {
  process.stderr.write(String(error?.stack || error) + '\n');
  process.exitCode = 1;
});
