import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(path.resolve('other-admin/admin-vue3/package.json'));
const { chromium } = require('@playwright/test');
const outDir = path.dirname(fileURLToPath(import.meta.url));
const targetUrl = 'http://127.0.0.1:4174/components/lxicons.html';
const detectorUrl = 'http://127.0.0.1:8400/detect.js';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sourcePaths = [
  'linkx-fe/src/components/LxIcon/index.vue',
  'linkx-fe/docs/components/lxicons.md',
];
const views = [
  { name: 'desktop-light', width: 1440, height: 900, mobile: false, dark: false, hud: false },
  { name: 'desktop-dark', width: 1440, height: 900, mobile: false, dark: true, hud: false },
  { name: 'mobile-375-hud', width: 375, height: 812, mobile: true, dark: false, hud: true },
  { name: 'mobile-320-light', width: 320, height: 780, mobile: true, dark: false, hud: false },
];

async function sha256(filePath) {
  const data = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function captureSourceHashes() {
  const entries = await Promise.all(sourcePaths.map(async (filePath) => [filePath, await sha256(filePath)]));
  return Object.fromEntries(entries);
}

const evidence = {
  generatedAt: new Date().toISOString(),
  targetUrl,
  detectorUrl,
  sourcePaths,
  sourceHashesAtStart: await captureSourceHashes(),
  browser: { executable: chromePath, isolatedContexts: true, viewCount: views.length },
  views: [],
};

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
  args: ['--disable-background-networking', '--disable-component-update'],
});
evidence.browser.version = browser.version();

try {
  for (const view of views) {
    const context = await browser.newContext({
      viewport: { width: view.width, height: view.height },
      deviceScaleFactor: 1,
      isMobile: view.mobile,
      hasTouch: view.mobile,
    });
    const page = await context.newPage();
    const consoleEvents = [];
    page.on('console', (message) => consoleEvents.push({ type: message.type(), text: message.text().slice(0, 700) }));
    page.on('pageerror', (error) => consoleEvents.push({ type: 'pageerror', text: error.message.slice(0, 700) }));
    page.on('requestfailed', (request) => consoleEvents.push({ type: 'requestfailed', url: request.url(), error: request.failure()?.errorText || '' }));

    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.locator('.icon-catalog .icon-search').waitFor({ state: 'visible', timeout: 20000 });
    await page.evaluate(({ dark, hud }) => {
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.classList.toggle('lx-theme-hud', hud);
      window.scrollTo(0, 0);
    }, view);
    await page.waitForTimeout(250);

    const initial = await page.evaluate(() => {
      const parseRgb = (color) => {
        const match = color.match(/rgba?\(([^)]+)\)/i);
        if (!match) return null;
        const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
        return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
      };
      const opaqueBackground = (element) => {
        const chain = [];
        for (let node = element; node; node = node.parentElement) {
          const style = getComputedStyle(node);
          chain.push({ tag: node.tagName.toLowerCase(), className: typeof node.className === 'string' ? node.className : '', color: style.backgroundColor, image: style.backgroundImage });
          const rgb = parseRgb(style.backgroundColor);
          if (rgb && rgb.a >= 0.99) return { color: style.backgroundColor, chain };
        }
        return { color: 'rgb(255, 255, 255)', chain };
      };
      const luminance = ({ r, g, b }) => {
        const channel = (value) => {
          const normalized = value / 255;
          return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      };
      const contrast = (foreground, background) => {
        const fg = parseRgb(foreground);
        const bg = parseRgb(background);
        if (!fg || !bg) return null;
        const values = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
        return Number(((values[0] + 0.05) / (values[1] + 0.05)).toFixed(2));
      };
      const checklistRows = [...document.querySelectorAll('.icon-checklist__row')].map((row) => {
        const label = row.querySelector('dt');
        if (!label) return null;
        const background = opaqueBackground(label);
        const style = getComputedStyle(label);
        return {
          text: label.textContent.trim(),
          selector: '.icon-checklist__row dt',
          foreground: style.color,
          background: background.color,
          contrastRatio: contrast(style.color, background.color),
          textToken: getComputedStyle(document.documentElement).getPropertyValue('--vp-c-text-1').trim(),
          box: (() => {
            const rect = label.getBoundingClientRect();
            return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
          })(),
        };
      }).filter(Boolean);
      const groups = [...document.querySelectorAll('.icon-catalog details')];
      const p0 = groups.find((group) => group.querySelector('summary')?.textContent.includes('P0 高频核心'));
      const aliasRegion = document.querySelector('.icon-alias-table-region');
      const hintId = aliasRegion?.getAttribute('aria-describedby');
      const hint = hintId ? document.getElementById(hintId) : null;
      return {
        title: document.title,
        documentReadyState: document.readyState,
        viewportWidth: window.innerWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        documentHasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        htmlDark: document.documentElement.classList.contains('dark'),
        htmlHud: document.documentElement.classList.contains('lx-theme-hud'),
        p0OpenInitially: Boolean(p0?.open),
        p0TileCount: p0?.querySelectorAll('.icon-tile').length ?? 0,
        collapsedGroupsInitially: groups.filter((group) => !group.open).length,
        checklistClientWidth: document.querySelector('.icon-checklist')?.clientWidth ?? null,
        checklistScrollWidth: document.querySelector('.icon-checklist')?.scrollWidth ?? null,
        checklistRows,
        aliasRegion: aliasRegion ? {
          role: aliasRegion.getAttribute('role'),
          tabIndex: aliasRegion.tabIndex,
          describedBy: hintId,
          descriptionText: hint?.textContent.trim() || '',
          descriptionVisible: Boolean(hint && getComputedStyle(hint).display !== 'none'),
        } : null,
      };
    });

    const checklist = page.locator('.icon-checklist');
    await checklist.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    const checklistScreenshot = `${view.name}-checklist.png`;
    await page.screenshot({ path: path.join(outDir, checklistScreenshot) });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);
    const pageScreenshot = `${view.name}.png`;
    await page.screenshot({ path: path.join(outDir, pageScreenshot) });

    const preflight = await page.evaluate(() => {
      const oldTitle = document.title;
      document.title = `${oldTitle} [Assessment B preflight]`;
      const marker = document.createElement('span');
      marker.id = 'assessment-b-injection-preflight';
      document.body.append(marker);
      const mutable = document.title.endsWith('[Assessment B preflight]') && marker.isConnected;
      marker.remove();
      document.title = oldTitle;
      return { mutable, markerRemoved: !document.getElementById(marker.id) };
    });
    let scriptLoaded = false;
    let injectionError = '';
    try {
      await page.addScriptTag({ url: detectorUrl, timeout: 15000 });
      scriptLoaded = true;
    } catch (error) {
      injectionError = error.message;
    }
    await page.waitForTimeout(2600);

    const detector = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('.impeccable-overlay')];
      const cleanText = (value) => (value || '').trim().replace(/\s+/g, ' ').slice(0, 180);
      const describeTarget = (node) => {
        if (!node) return null;
        const ancestry = [];
        for (let current = node, depth = 0; current && depth < 6; current = current.parentElement, depth += 1) {
          const className = typeof current.className === 'string' ? current.className.trim().split(/\s+/).filter(Boolean).slice(0, 2) : [];
          ancestry.push(`${current.tagName.toLowerCase()}${className.map((name) => `.${name}`).join('')}`);
        }
        const rect = node.getBoundingClientRect();
        const details = node.closest('details');
        return {
          tag: node.tagName.toLowerCase(),
          id: node.id || '',
          className: typeof node.className === 'string' ? node.className : '',
          text: cleanText(node.innerText || node.textContent),
          selectorHint: node.className && typeof node.className === 'string' ? `.${node.className.trim().split(/\s+/).join('.')}` : node.tagName.toLowerCase(),
          ancestry: ancestry.join(' < '),
          box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          hiddenByClosedDetails: details && !details.open ? details.querySelector('summary')?.textContent.trim() || true : null,
        };
      };
      const hits = nodes.map((overlay) => {
        const target = overlay._targetEl || null;
        const label = cleanText(overlay.querySelector('.impeccable-label')?.innerText || overlay.getAttribute('aria-label') || overlay.title || overlay.innerText || overlay.textContent);
        const selfTarget = Boolean(target?.closest?.('.impeccable-overlay, .impeccable-label, .impeccable-banner, .impeccable-tooltip, [id^="impeccable-live-"]'));
        const scope = overlay.classList.contains('impeccable-banner') ? 'page-level-banner'
          : selfTarget ? 'overlay-self'
          : target?.closest?.('.icon-catalog') ? 'component'
          : target === document.body || target === document.documentElement ? 'page-level'
          : target?.closest?.('.vp-doc') ? 'docs-content'
          : target ? 'outside-target' : 'no-target';
        const rect = overlay.getBoundingClientRect();
        return {
          ruleLabel: label,
          scope,
          overlayClass: overlay.className,
          overlayVisible: getComputedStyle(overlay).display !== 'none' && rect.width > 0 && rect.height > 0,
          target: describeTarget(target),
        };
      });
      const countsByScope = hits.reduce((counts, hit) => {
        counts[hit.scope] = (counts[hit.scope] || 0) + 1;
        return counts;
      }, {});
      return {
        scanFunctionAvailable: typeof window.impeccableScan === 'function',
        count: nodes.length,
        countsByScope,
        hits,
      };
    });
    const overlayScreenshot = `${view.name}-overlay.png`;
    await page.screenshot({ path: path.join(outDir, overlayScreenshot) });

    const occlusionRecheck = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('.impeccable-overlay')];
      const targets = nodes
        .filter((overlay) => /occluded/i.test(overlay.querySelector('.impeccable-label')?.innerText || overlay.innerText || overlay.textContent || ''))
        .map((overlay) => overlay._targetEl)
        .filter(Boolean);
      nodes.forEach((node) => { node.style.visibility = 'hidden'; });
      const results = targets.map((target) => {
        const detail = target.closest('details');
        const wasOpen = Boolean(detail?.open);
        if (detail) detail.open = true;
        target.scrollIntoView({ block: 'center', inline: 'nearest' });
        const rect = target.getBoundingClientRect();
        const tile = target.closest('.icon-tile');
        const probes = [0.2, 0.5, 0.8].map((fraction) => {
          const x = Math.min(window.innerWidth - 1, rect.left + rect.width * fraction);
          const y = Math.min(window.innerHeight - 1, rect.top + rect.height / 2);
          const top = document.elementFromPoint(x, y);
          return {
            x,
            y,
            topText: (top?.innerText || top?.textContent || '').trim().slice(0, 80),
            withinTarget: Boolean(top && (top === target || target.contains(top))),
            withinTile: Boolean(top && tile?.contains(top)),
          };
        });
        return {
          text: (target.innerText || target.textContent || '').trim(),
          selector: target.tagName.toLowerCase() + (typeof target.className === 'string' && target.className ? `.${target.className.trim().split(/\s+/).join('.')}` : ''),
          detailWasOpen: wasOpen,
          detailIsOpen: Boolean(detail?.open),
          probes,
          allProbesWithinTarget: probes.length > 0 && probes.every((probe) => probe.withinTarget),
          allProbesWithinTile: probes.length > 0 && probes.every((probe) => probe.withinTile),
        };
      });
      return results;
    });
    const revealedScreenshot = `${view.name}-details-open.png`;
    await page.screenshot({ path: path.join(outDir, revealedScreenshot) });

    evidence.views.push({
      name: view.name,
      viewport: { width: view.width, height: view.height, mobile: view.mobile },
      theme: view.hud ? 'hud' : view.dark ? 'dark' : 'light',
      responseStatus: response?.status() ?? null,
      initial,
      preflight,
      injection: { scriptLoaded, injectionError, ...detector },
      occlusionRecheck,
      screenshots: [checklistScreenshot, pageScreenshot, overlayScreenshot, revealedScreenshot],
      console: consoleEvents,
    });
    evidence.sourceHashesAtEnd = await captureSourceHashes();
    evidence.sourceUnchangedDuringRun = JSON.stringify(evidence.sourceHashesAtStart) === JSON.stringify(evidence.sourceHashesAtEnd);
    await fs.writeFile(path.join(outDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
    await context.close();
  }
} finally {
  await browser.close();
}

const summary = evidence.views.map((view) => ({
  name: view.name,
  responseStatus: view.responseStatus,
  theme: view.theme,
  viewport: view.viewport,
  checklistRows: view.initial.checklistRows.map((row) => ({ text: row.text, foreground: row.foreground, background: row.background, contrastRatio: row.contrastRatio })),
  overlayCount: view.injection.count,
  overlayScopes: view.injection.countsByScope,
  injectionSucceeded: view.preflight.mutable && view.preflight.markerRemoved && view.injection.scriptLoaded && view.injection.scanFunctionAvailable,
  occlusionRecheckCount: view.occlusionRecheck.length,
  allOcclusionSamplesWithinTextAndTile: view.occlusionRecheck.every((item) => item.allProbesWithinTarget && item.allProbesWithinTile),
  screenshots: view.screenshots,
}));
await fs.writeFile(path.join(outDir, 'browser-summary.json'), `${JSON.stringify({ summary, sourceUnchangedDuringRun: evidence.sourceUnchangedDuringRun }, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ summary, sourceHashesAtStart: evidence.sourceHashesAtStart, sourceHashesAtEnd: evidence.sourceHashesAtEnd, sourceUnchangedDuringRun: evidence.sourceUnchangedDuringRun }, null, 2)}\n`);
