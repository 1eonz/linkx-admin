import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const outDir = path.dirname(fileURLToPath(import.meta.url));
const evidencePath = path.join(outDir, 'browser-evidence.json');
const targetUrl = 'http://127.0.0.1:4174/components/lxicons.html';
const detectorPort = Number(process.argv[2]);
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!Number.isInteger(detectorPort) || detectorPort < 1) throw new Error('Missing detector server port');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function waitFor(predicate, label, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await predicate();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label}${lastError ? `: ${lastError.message}` : ''}`);
}

class CDP {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 0;
    this.pending = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
    });
    this.socket.addEventListener('message', (event) => {
      let message;
      try { message = JSON.parse(String(event.data)); } catch { return; }
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result || {});
    });
  }

  async send(method, params = {}, sessionId) {
    await this.ready;
    const id = ++this.nextId;
    const message = { id, method, params };
    if (sessionId) message.sessionId = sessionId;
    const result = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.socket.send(JSON.stringify(message));
    return result;
  }

  close() { this.socket.close(); }
}

async function evaluate(cdp, sessionId, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  }, sessionId);
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime.evaluate failed');
  }
  return result.result?.value;
}

const baseline = JSON.parse(await fs.readFile(evidencePath, 'utf8'));
const repoRoot = path.resolve(outDir, '..', '..', '..', '..');
const sourcePaths = {
  component: 'linkx-fe/src/components/LxIcon/index.vue',
  docs: baseline.source,
};
const hashSource = async (relativePath) => crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, relativePath))).digest('hex');
const sourceHashesAtStart = Object.fromEntries(await Promise.all(Object.entries(sourcePaths).map(async ([key, value]) => [key, await hashSource(value)])));
const views = [
  { name: 'desktop-light', width: 1440, height: 900, mobile: false, theme: 'light', hud: false },
  { name: 'desktop-dark', width: 1440, height: 900, mobile: false, theme: 'dark', hud: false },
  { name: 'mobile-375-hud', width: 375, height: 812, mobile: true, theme: 'hud', hud: true },
  { name: 'mobile-320-light', width: 320, height: 780, mobile: true, theme: 'light', hud: false },
];

const chromePort = await freePort();
const profilePath = await fs.mkdtemp(path.join(os.tmpdir(), 'linkx-overlay-recheck-'));
const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${chromePort}`,
  '--remote-allow-origins=*',
  `--user-data-dir=${profilePath}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-component-update',
  '--disable-gpu',
], { stdio: 'ignore', windowsHide: true });

let cdp;
let browserContextId;
const results = [];

try {
  const version = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${chromePort}/json/version`);
    return response.ok ? response.json() : null;
  }, 'isolated Chrome DevTools endpoint');
  cdp = new CDP(version.webSocketDebuggerUrl);
  await cdp.ready;
  const context = await cdp.send('Target.createBrowserContext', { disposeOnDetach: true });
  browserContextId = context.browserContextId;

  for (const view of views) {
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank', browserContextId });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: view.width,
      height: view.height,
      deviceScaleFactor: 1,
      mobile: view.mobile,
    }, sessionId);
    await cdp.send('Page.navigate', { url: targetUrl }, sessionId);
    await waitFor(async () => {
      const ready = await evaluate(cdp, sessionId, 'document.readyState');
      const mounted = await evaluate(cdp, sessionId, 'Boolean(document.querySelector(".icon-catalog .icon-search"))');
      return ready === 'complete' && mounted;
    }, `${view.name} page mount`);
    await delay(300);
    await evaluate(cdp, sessionId, `(() => {
      document.documentElement.classList.toggle('dark', ${view.theme === 'dark'});
      document.documentElement.classList.toggle('lx-theme-hud', ${view.hud});
      window.scrollTo(0, 0);
      return true;
    })()`);

    const injection = await evaluate(cdp, sessionId, `new Promise((resolve) => {
      const oldTitle = document.title;
      document.title = oldTitle + ' [DOM Recheck]';
      const marker = document.createElement('span');
      marker.id = 'overlay-dom-recheck-preflight';
      document.body.appendChild(marker);
      const preflight = document.title.endsWith('[DOM Recheck]') && marker.isConnected;
      marker.remove();
      const script = document.createElement('script');
      script.src = 'http://localhost:${detectorPort}/detect.js';
      script.onload = () => resolve({ preflight, scriptLoaded: true, scriptSrc: script.src });
      script.onerror = () => resolve({ preflight, scriptLoaded: false, scriptSrc: script.src, error: 'script error event' });
      document.head.appendChild(script);
    })`);
    await delay(2600);
    const detectorReady = await evaluate(cdp, sessionId, 'typeof window.impeccableScan === "function"');

    const domEvidence = await evaluate(cdp, sessionId, `(() => {
      const cleanText = (value) => (value || '').replace(/\\s+/g, ' ').trim();
      const esc = (value) => String(value).replace(/\\\\/g, '\\\\\\\\').replace(/"/g, '\\\\"');
      const cssPath = (element) => {
        if (!element) return null;
        const parts = [];
        let current = element;
        for (let i = 0; current && i < 5; i += 1, current = current.parentElement) {
          let part = current.tagName.toLowerCase();
          if (current.id) { parts.unshift(part + '#' + current.id); break; }
          if (typeof current.className === 'string' && current.className.trim()) {
            part += '.' + current.className.trim().split(/\\s+/).slice(0, 3).join('.');
          }
          parts.unshift(part);
        }
        return parts.join(' > ');
      };
      const box = (element) => {
        if (!element) return null;
        const r = element.getBoundingClientRect();
        return { x: r.x, y: r.y, top: r.top, right: r.right, bottom: r.bottom, left: r.left, width: r.width, height: r.height };
      };
      const color = (value) => {
        if (!value || value === 'transparent') return [0, 0, 0, 0];
        const values = value.match(/[\\d.]+/g)?.map(Number) || [];
        return values.length >= 3 ? [values[0], values[1], values[2], values[3] ?? 1] : [0, 0, 0, 0];
      };
      const blend = (front, back) => {
        const a = front[3] + back[3] * (1 - front[3]);
        if (!a) return [0, 0, 0, 0];
        return [0, 1, 2].map((i) => (front[i] * front[3] + back[i] * back[3] * (1 - front[3])) / a).concat(a);
      };
      const hex = (rgba) => '#' + rgba.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
      const luminance = (rgb) => {
        const linear = rgb.slice(0, 3).map((v) => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      };
      const contrast = (a, b) => {
        const l1 = luminance(a); const l2 = luminance(b);
        return Number(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2));
      };
      const chainFor = (element) => {
        const chain = [];
        let current = element;
        for (let i = 0; current && i < 14; i += 1, current = current.parentElement) {
          const s = getComputedStyle(current);
          const r = current.getBoundingClientRect();
          chain.push({
            selector: cssPath(current),
            color: s.color,
            backgroundColor: s.backgroundColor,
            backgroundImage: s.backgroundImage,
            opacity: s.opacity,
            display: s.display,
            visibility: s.visibility,
            overflowX: s.overflowX,
            overflowY: s.overflowY,
            box: { x: r.x, y: r.y, width: r.width, height: r.height },
          });
          if (current === document.documentElement) break;
        }
        return chain;
      };
      const visibilityFor = (element) => {
        const s = getComputedStyle(element);
        const r = element.getBoundingClientRect();
        const ownVisible = s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0 && r.width > 0 && r.height > 0;
        const closedDetails = element.closest('details:not([open])');
        const clips = [];
        let visible = { left: Math.max(0, r.left), top: Math.max(0, r.top), right: Math.min(innerWidth, r.right), bottom: Math.min(innerHeight, r.bottom) };
        for (let p = element.parentElement; p; p = p.parentElement) {
          const ps = getComputedStyle(p);
          const pr = p.getBoundingClientRect();
          if (/(hidden|clip|auto|scroll)/.test(ps.overflowX + ' ' + ps.overflowY)) {
            const before = { ...visible };
            if (/(hidden|clip|auto|scroll)/.test(ps.overflowX)) { visible.left = Math.max(visible.left, pr.left); visible.right = Math.min(visible.right, pr.right); }
            if (/(hidden|clip|auto|scroll)/.test(ps.overflowY)) { visible.top = Math.max(visible.top, pr.top); visible.bottom = Math.min(visible.bottom, pr.bottom); }
            clips.push({ selector: cssPath(p), overflowX: ps.overflowX, overflowY: ps.overflowY, box: box(p), before, after: { ...visible } });
          }
        }
        const visibleArea = Math.max(0, visible.right - visible.left) * Math.max(0, visible.bottom - visible.top);
        const area = Math.max(0, r.width * r.height);
        return { ownVisible, paintedVisible: ownVisible && !closedDetails, hiddenByClosedDetails: closedDetails ? cssPath(closedDetails) : null, box: box(element), visibleBox: visible, visibleAreaRatio: area ? Number((visibleArea / area).toFixed(3)) : 0, clips };
      };
      const styleEvidence = (element) => {
        const s = getComputedStyle(element);
        const chain = chainFor(element);
        let background = [255, 255, 255, 1];
        for (const item of [...chain].reverse()) background = blend(color(item.backgroundColor), background);
        const fg = color(s.color);
        const fgOpacity = chain.reduce((value, item) => value * Number(item.opacity || 1), 1);
        const effectiveFg = blend([fg[0], fg[1], fg[2], fg[3] * fgOpacity], background);
        return {
          color: s.color,
          backgroundColor: s.backgroundColor,
          backgroundImage: s.backgroundImage,
          font: s.font,
          lineHeight: s.lineHeight,
          textAlign: s.textAlign,
          opacity: s.opacity,
          backgroundChain: chain,
          effectiveBackgroundApprox: hex(background),
          effectiveForegroundApprox: hex(effectiveFg),
          contrastRatioApprox: contrast(effectiveFg, background),
          approximationLimit: '按纯色祖先背景自根向下合成；若 backgroundImage 非 none 或存在混合效果，需以截图/像素为准。',
        };
      };
      const pointProbes = (element) => {
        const parent = element.closest('button.icon-tile');
        const rects = [...element.getClientRects()].map((r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }));
        const probes = [];
        for (const r of rects) {
          for (const fraction of [0.15, 0.5, 0.85]) {
            const x = Math.min(innerWidth - 1, Math.max(0, r.left + r.width * fraction));
            const y = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
            if (x < r.left || x > r.right || y < r.top || y > r.bottom || r.width < 1 || r.height < 1) continue;
            const stack = document.elementsFromPoint(x, y).filter((node) => !node.closest?.('.impeccable-overlay, .impeccable-label, .impeccable-banner, .impeccable-tooltip, [id^="impeccable-live-"]'));
            const top = stack[0] || null;
            probes.push({
              x: Number(x.toFixed(1)), y: Number(y.toFixed(1)),
              topSelector: cssPath(top),
              topText: cleanText(top?.textContent).slice(0, 80),
              topWithinText: Boolean(top && (top === element || element.contains(top))),
              topWithinTile: Boolean(top && parent?.contains(top)),
              stack: stack.slice(0, 5).map((node) => ({ selector: cssPath(node), text: cleanText(node.textContent).slice(0, 60) })),
            });
          }
        }
        return { textRects: rects, probes };
      };
      const overlayNodes = [...document.querySelectorAll('.impeccable-overlay')];
      const sidebarTexts = [...document.querySelectorAll('.VPSidebarItem p.text')].map((element) => {
        const s = styleEvidence(element);
        return { text: cleanText(element.textContent), selector: cssPath(element), color: s.color, backgroundColor: s.backgroundColor, effectiveForegroundApprox: s.effectiveForegroundApprox, effectiveBackgroundApprox: s.effectiveBackgroundApprox, contrastRatioApprox: s.contrastRatioApprox, box: box(element) };
      });
      const hits = overlayNodes.map((overlay, index) => {
        const target = overlay._targetEl || null;
        const scope = overlay.classList.contains('impeccable-banner') ? 'page-level-banner'
          : target?.closest?.('.icon-catalog') ? 'component'
          : target?.closest?.('.vp-doc') ? 'docs-content'
          : target ? 'outside-target' : 'overlay-self';
        const targetText = cleanText(target?.innerText || target?.textContent).slice(0, 200);
        const s = target ? getComputedStyle(target) : null;
        const details = target?.closest?.('details') || null;
        const style = target ? styleEvidence(target) : null;
        const point = target?.matches?.('.icon-tile__name, .icon-tile__meaning') ? pointProbes(target) : null;
        return {
          index,
          ruleLabel: cleanText(overlay.querySelector('.impeccable-label')?.innerText),
          scope,
          overlayClass: overlay.className,
          overlayBox: box(overlay),
          target: target ? {
            selector: cssPath(target),
            tag: target.tagName.toLowerCase(),
            className: typeof target.className === 'string' ? target.className : '',
            text: targetText,
            outerHTML: target.outerHTML.slice(0, 500),
            ancestry: chainFor(target).slice(0, 7).map((item) => item.selector),
            box: box(target),
            visibility: visibilityFor(target),
            computed: {
              color: s.color,
              backgroundColor: s.backgroundColor,
              backgroundImage: s.backgroundImage,
              display: s.display,
              visibility: s.visibility,
              opacity: s.opacity,
              position: s.position,
              zIndex: s.zIndex,
              overflowX: s.overflowX,
              overflowY: s.overflowY,
              fontSize: s.fontSize,
              lineHeight: s.lineHeight,
              whiteSpace: s.whiteSpace,
              textOverflow: s.textOverflow,
              border: s.border,
              before: target.matches?.('button.copy') ? (() => { const pseudo = getComputedStyle(target, '::before'); return { content: pseudo.content, backgroundImage: pseudo.backgroundImage, opacity: pseudo.opacity, color: pseudo.color, display: pseudo.display }; })() : null,
              after: target.matches?.('button.copy') ? (() => { const pseudo = getComputedStyle(target, '::after'); return { content: pseudo.content, backgroundImage: pseudo.backgroundImage, opacity: pseudo.opacity, color: pseudo.color, display: pseudo.display }; })() : null,
              cssVariables: target.matches?.('dt') ? {
                elementLxTextPrimary: s.getPropertyValue('--lx-text-primary').trim(),
                elementVpText1: s.getPropertyValue('--vp-c-text-1').trim(),
                htmlLxTextPrimary: getComputedStyle(document.documentElement).getPropertyValue('--lx-text-primary').trim(),
                htmlVpText1: getComputedStyle(document.documentElement).getPropertyValue('--vp-c-text-1').trim(),
                pageBackground: getComputedStyle(document.body).backgroundColor,
                nearestCatalog: target.closest('.icon-catalog')?.getAttribute('class') || null,
              } : null,
            },
            styleChain: style?.backgroundChain || [],
            approximateContrast: style ? {
              foreground: style.effectiveForegroundApprox,
              background: style.effectiveBackgroundApprox,
              ratio: style.contrastRatioApprox,
              limitation: style.approximationLimit,
            } : null,
            detailState: details ? { open: details.open, summary: cleanText(details.querySelector('summary')?.textContent), selector: cssPath(details) } : null,
            statusSemantics: target.matches?.('.icon-copy-feedback, .icon-search-status') ? {
              role: target.getAttribute('role'),
              ariaLive: target.getAttribute('aria-live'),
              ariaAtomic: target.getAttribute('aria-atomic'),
              textContent: cleanText(target.textContent),
              isConnected: target.isConnected,
              clientRects: [...target.getClientRects()].map((r) => ({ x: r.x, y: r.y, width: r.width, height: r.height })),
              parent: target.parentElement ? { selector: cssPath(target.parentElement), box: box(target.parentElement), display: getComputedStyle(target.parentElement).display } : null,
            } : null,
            lineLength: target.tagName === 'P' ? (() => {
              const range = document.createRange();
              range.selectNodeContents(target);
              const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
              const lines = [];
              for (const rect of rects) {
                let line = lines.find((entry) => Math.abs(entry.top - rect.top) < 1);
                if (!line) { line = { top: rect.top, left: rect.left, right: rect.right, fragments: 0 }; lines.push(line); }
                line.left = Math.min(line.left, rect.left);
                line.right = Math.max(line.right, rect.right);
                line.fragments += 1;
              }
              return {
                textLength: cleanText(target.textContent).length,
                elementRects: [...target.getClientRects()].map((r) => ({ x: r.x, y: r.y, width: r.width, height: r.height })),
                renderedLineRects: lines.map((line) => ({ top: line.top, width: line.right - line.left, fragments: line.fragments })),
                renderedLineCount: lines.length,
                text: cleanText(target.textContent),
              };
            })() : null,
            hitTest: point,
          } : null,
        };
      });
      return {
        detectorReady: typeof window.impeccableScan === 'function',
        pageTheme: { dark: document.documentElement.classList.contains('dark'), hud: document.documentElement.classList.contains('lx-theme-hud'), viewportWidth: innerWidth },
        overlayCount: overlayNodes.length,
        countsByScope: hits.reduce((counts, hit) => { counts[hit.scope] = (counts[hit.scope] || 0) + 1; return counts; }, {}),
        sidebarTexts,
        hits,
        copyStatusAtStart: (() => {
          const status = document.querySelector('.icon-copy-feedback');
          if (!status) return null;
          return { selector: cssPath(status), className: status.className, textContent: cleanText(status.textContent), role: status.getAttribute('role'), ariaLive: status.getAttribute('aria-live'), display: getComputedStyle(status).display, visibility: getComputedStyle(status).visibility, opacity: getComputedStyle(status).opacity, box: box(status), outerHTML: status.outerHTML.slice(0, 500), parentBox: box(status.parentElement) };
        })(),
      };
    })()`);

    const baselineView = baseline.views.find((item) => item.name === view.name);
    const baselineOverlayCount = baselineView.overlay.count;
    const hitCountsMatch = domEvidence.overlayCount === baselineOverlayCount;
    const names = [];
    const revealedComponentTargets = await evaluate(cdp, sessionId, `(async () => {
      const originals = [...document.querySelectorAll('.impeccable-overlay')].map((overlay) => overlay._targetEl).filter((element) => element?.matches?.('.icon-tile__name, .icon-tile__meaning'));
      const groups = new Set(originals.map((element) => element.closest('details')).filter(Boolean));
      for (const group of groups) group.open = true;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const cssPath = (element) => {
        const parts = []; let current = element;
        for (let i = 0; current && i < 5; i += 1, current = current.parentElement) {
          let part = current.tagName.toLowerCase();
          if (current.id) { parts.unshift(part + '#' + current.id); break; }
          if (typeof current.className === 'string' && current.className.trim()) part += '.' + current.className.trim().split(/\\s+/).slice(0, 3).join('.');
          parts.unshift(part);
        }
        return parts.join(' > ');
      };
      const output = [];
      for (const element of originals) {
        element.scrollIntoView({ block: 'center', inline: 'nearest' });
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const r = element.getBoundingClientRect();
        const rects = [...element.getClientRects()];
        const tile = element.closest('button.icon-tile');
        const probes = rects.flatMap((rect) => [0.15, 0.5, 0.85].map((fraction) => {
          const x = Math.min(innerWidth - 1, Math.max(0, rect.left + rect.width * fraction));
          const y = Math.min(innerHeight - 1, Math.max(0, rect.top + rect.height / 2));
          if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
          const stack = document.elementsFromPoint(x, y).filter((node) => !node.closest?.('.impeccable-overlay, .impeccable-label, .impeccable-banner, .impeccable-tooltip, [id^="impeccable-live-"]'));
          const top = stack[0] || null;
          return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), topSelector: cssPath(top), topText: (top?.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 80), topWithinText: Boolean(top && (top === element || element.contains(top))), topWithinSameTile: Boolean(top && tile?.contains(top)) };
        }).filter(Boolean));
        const style = getComputedStyle(element);
        const group = element.closest('details');
        output.push({
          selector: cssPath(element), text: element.textContent.trim(),
          group: group?.querySelector('summary')?.textContent.trim() || '', groupOpen: group?.open ?? null,
          box: { x: r.x, y: r.y, width: r.width, height: r.height },
          display: style.display, visibility: style.visibility, color: style.color,
          pointProbesAfterOpen: probes,
          allProbePointsHitTextOrDescendant: probes.length > 0 && probes.every((probe) => probe.topWithinText),
          allProbePointsStayInsideTile: probes.length > 0 && probes.every((probe) => probe.topWithinSameTile),
        });
      }
      return output;
    })()`);
    const savedOutsideTargets = baselineView.overlay.hits.filter((hit) => hit.scope === 'outside-target').map((hit) => hit.target?.text || '');
    const currentSidebarByText = new Map(domEvidence.sidebarTexts.map((item) => [item.text, item]));
    const outsideTargetReplay = {
      savedOutsideHitCount: savedOutsideTargets.length,
      savedOutsideHitTexts: savedOutsideTargets,
      liveSidebarTextCount: domEvidence.sidebarTexts.length,
      matchedSavedTexts: savedOutsideTargets.filter((text) => currentSidebarByText.has(text)),
      unmatchedSavedTexts: savedOutsideTargets.filter((text) => !currentSidebarByText.has(text)),
      liveStyleSamples: [...new Map(domEvidence.sidebarTexts.map((item) => [item.color + '|' + item.backgroundColor + '|' + item.contrastRatioApprox, item])).values()].slice(0, 5),
    };
    const clean = await evaluate(cdp, sessionId, `(() => {
      for (const node of document.querySelectorAll('.impeccable-overlay, .impeccable-label, .impeccable-banner, .impeccable-tooltip, [id^="impeccable-live-"]')) node.remove();
      return true;
    })()`);

    let docsCodeCopyBehavior = null;
    if (view.name === 'desktop-light') {
      const position = await evaluate(cdp, sessionId, `(() => {
        const button = document.querySelector('.vp-doc button.copy');
        button?.scrollIntoView({ block: 'center', inline: 'nearest' });
        if (!button) return null;
        const rect = button.getBoundingClientRect();
        const style = getComputedStyle(button);
        return {
          box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          initial: { opacity: style.opacity, visibility: style.visibility, pointerEvents: style.pointerEvents, backgroundImage: style.backgroundImage },
          ariaLabel: button.getAttribute('aria-label'),
        };
      })()`);
      if (position) {
        const inspect = async (state) => evaluate(cdp, sessionId, `(() => {
          const button = document.querySelector('.vp-doc button.copy');
          if (!button) return null;
          const style = getComputedStyle(button);
          const rect = button.getBoundingClientRect();
          return {
            state: ${JSON.stringify(state)},
            hovered: button.matches(':hover'),
            focused: button.matches(':focus'),
            focusVisible: button.matches(':focus-visible'),
            opacity: style.opacity,
            visibility: style.visibility,
            pointerEvents: style.pointerEvents,
            backgroundImage: style.backgroundImage,
            box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          };
        })()`);
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: position.box.x + position.box.width / 2, y: position.box.y + position.box.height / 2, pointerType: 'mouse' }, sessionId);
        await delay(120);
        const hover = await inspect('hover');
        const hoveredShot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, sessionId);
        const hoverName = 'docs-code-copy-hover.png';
        await fs.writeFile(path.join(outDir, hoverName), Buffer.from(hoveredShot.data, 'base64'));
        names.push(hoverName);
        const focusResult = await evaluate(cdp, sessionId, `(() => {
          const button = document.querySelector('.vp-doc button.copy');
          button?.focus();
          return Boolean(button?.matches(':focus'));
        })()`);
        await delay(60);
        const focus = await inspect('focus');
        docsCodeCopyBehavior = { initial: position, hover, focus, focusSucceeded: focusResult, screenshot: hoverName };
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1, pointerType: 'mouse' }, sessionId);
      }
    }

    const componentShot = await evaluate(cdp, sessionId, `(() => {
      for (const group of document.querySelectorAll('.icon-catalog details')) group.open = true;
      const first = [...document.querySelectorAll('.icon-tile__name, .icon-tile__meaning')].find((el) => {
        const text = el.textContent.trim();
        return ['cube', 'bell', 'circle-check', '实时状态', '向左返回'].includes(text);
      });
      if (!first) return null;
      first.closest('details')?.setAttribute('open', '');
      first.scrollIntoView({ block: 'center', inline: 'nearest' });
      const r = first.getBoundingClientRect();
      return { selector: first.tagName.toLowerCase() + '.' + first.className.trim().split(/\\s+/).join('.'), text: first.textContent.trim(), box: { x: r.x, y: r.y, width: r.width, height: r.height }, detailsOpen: first.closest('details')?.open ?? null };
    })()`);
    if (componentShot) {
      await delay(250);
      const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, sessionId);
      const shot = `component-focus-${view.name}.png`;
      await fs.writeFile(path.join(outDir, shot), Buffer.from(screenshot.data, 'base64'));
      names.push(shot);
    }

    let motionBehavior = null;
    if (view.name === 'desktop-light') {
      const prepared = await evaluate(cdp, sessionId, `(() => {
        const p0 = [...document.querySelectorAll('.icon-catalog details')].find((group) => group.querySelector('summary')?.textContent.includes('P0 高频核心'));
        if (!p0) return { error: 'P0 group missing' };
        p0.open = true;
        const findTile = (name) => [...p0.querySelectorAll('.icon-tile')].find((tile) => tile.querySelector('.icon-tile__name')?.textContent.trim() === name);
        const deleteTile = findTile('delete');
        const loadingTile = findTile('loading');
        if (!deleteTile || !loadingTile) return { error: 'delete or loading tile missing' };
        const clone = deleteTile.cloneNode(true);
        clone.dataset.recheckProbe = 'explicit-spin';
        clone.setAttribute('aria-label', 'Assessment B 临时旋转状态复核');
        const svg = clone.querySelector('.lx-icon');
        svg.classList.add('is-spinning');
        svg.dataset.recheckProbe = 'explicit-spin';
        deleteTile.parentElement.appendChild(clone);
        return {
          delete: { dataMotion: deleteTile.querySelector('.lx-icon')?.getAttribute('data-lx-motion'), className: deleteTile.querySelector('.lx-icon')?.getAttribute('class') },
          loading: { dataMotion: loadingTile.querySelector('.lx-icon')?.getAttribute('data-lx-motion'), className: loadingTile.querySelector('.lx-icon')?.getAttribute('class') },
          explicitSpinPropEquivalent: { dataMotion: svg.getAttribute('data-lx-motion'), className: svg.getAttribute('class'), scopeAttributes: [...svg.attributes].map((attribute) => attribute.name).filter((name) => name.startsWith('data-v-')) },
        };
      })()`);
      const selectorFor = (kind) => kind === 'explicitSpinPropEquivalent'
        ? 'svg[data-recheck-probe="explicit-spin"]'
        : null;
      const measureMotion = async (kind, screenshotName) => {
        const selector = selectorFor(kind);
        const point = await evaluate(cdp, sessionId, `(() => {
          const kind = ${JSON.stringify(kind)};
          const p0 = [...document.querySelectorAll('.icon-catalog details')].find((group) => group.querySelector('summary')?.textContent.includes('P0 高频核心'));
          const tile = kind === 'explicitSpinPropEquivalent'
            ? document.querySelector('[data-recheck-probe="explicit-spin"].icon-tile')
            : [...(p0?.querySelectorAll('.icon-tile') || [])].find((item) => item.querySelector('.icon-tile__name')?.textContent.trim() === (kind === 'delete' ? 'delete' : 'loading'));
          const svg = kind === 'explicitSpinPropEquivalent' ? document.querySelector(${JSON.stringify(selector)}) : tile?.querySelector('.lx-icon');
          if (!tile || !svg) return null;
          tile.scrollIntoView({ block: 'center', inline: 'nearest' });
          const r = svg.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        })()`);
        if (!point) return null;
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y, pointerType: 'mouse' }, sessionId);
        await delay(100);
        const state = await evaluate(cdp, sessionId, `(() => {
          const kind = ${JSON.stringify(kind)};
          const p0 = [...document.querySelectorAll('.icon-catalog details')].find((group) => group.querySelector('summary')?.textContent.includes('P0 高频核心'));
          const tile = kind === 'explicitSpinPropEquivalent'
            ? document.querySelector('[data-recheck-probe="explicit-spin"].icon-tile')
            : [...(p0?.querySelectorAll('.icon-tile') || [])].find((item) => item.querySelector('.icon-tile__name')?.textContent.trim() === (kind === 'delete' ? 'delete' : 'loading'));
          const svg = kind === 'explicitSpinPropEquivalent' ? document.querySelector(${JSON.stringify(selector)}) : tile?.querySelector('.lx-icon');
          if (!tile || !svg) return null;
          const s = getComputedStyle(svg); const r = svg.getBoundingClientRect();
          return {
            kind, tileHovered: tile.matches(':hover'), iconHovered: svg.matches(':hover'),
            className: svg.getAttribute('class'), dataIconName: svg.getAttribute('data-icon-name'), dataMotion: svg.getAttribute('data-lx-motion'),
            animationName: s.animationName, animationDuration: s.animationDuration, animationPlayState: s.animationPlayState,
            transform: s.transform, filter: s.filter, transition: s.transition,
            hoverAnimationToken: s.getPropertyValue('--lx-icon-hover-animation').trim(), hoverTransformToken: s.getPropertyValue('--lx-icon-hover-transform').trim(),
            mediaReduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
            box: { x: r.x, y: r.y, width: r.width, height: r.height },
          };
        })()`);
        if (screenshotName) {
          const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, sessionId);
          await fs.writeFile(path.join(outDir, screenshotName), Buffer.from(screenshot.data, 'base64'));
          names.push(screenshotName);
        }
        return state;
      };
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1, pointerType: 'mouse' }, sessionId);
      const initial = await evaluate(cdp, sessionId, `(() => {
        const p0 = [...document.querySelectorAll('.icon-catalog details')].find((group) => group.querySelector('summary')?.textContent.includes('P0 高频核心'));
        const result = {};
        for (const name of ['delete', 'loading']) {
          const svg = [...(p0?.querySelectorAll('.icon-tile') || [])].find((item) => item.querySelector('.icon-tile__name')?.textContent.trim() === name)?.querySelector('.lx-icon');
          if (!svg) continue;
          const s = getComputedStyle(svg);
          result[name] = { animationName: s.animationName, animationDuration: s.animationDuration, transition: s.transition, className: svg.getAttribute('class'), dataMotion: svg.getAttribute('data-lx-motion') };
        }
        return result;
      })()`);
      const deleteHover = await measureMotion('delete', 'motion-hover-delete.png');
      const loadingHover = await measureMotion('loading', 'motion-hover-loading.png');
      const explicitSpinHover = await measureMotion('explicitSpinPropEquivalent', 'motion-hover-spin-prop-clone.png');
      await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);
      const deleteReduced = await measureMotion('delete');
      const loadingReduced = await measureMotion('loading');
      const explicitSpinReduced = await measureMotion('explicitSpinPropEquivalent', 'motion-reduced-spin-prop-clone.png');
      await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] }, sessionId);
      await evaluate(cdp, sessionId, 'document.querySelector("[data-recheck-probe=\\\"explicit-spin\\\"].icon-tile")?.remove()');
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1, pointerType: 'mouse' }, sessionId);
      motionBehavior = {
        prepared,
        initial,
        deleteHover,
        loadingSpinHover: loadingHover,
        explicitSpinPropEquivalentHover: explicitSpinHover,
        reducedMotion: { delete: deleteReduced, loading: loadingReduced, explicitSpinPropEquivalent: explicitSpinReduced },
        note: 'spin=true 以现有 LxIcon SVG 的等价 DOM 输出验证：保留 scoped data-v 属性并添加 is-spinning；loading 名称本身也进入相同旋转态。临时克隆仅存在于隔离浏览器页面。',
      };
    }

    let darkChecklist = null;
    if (view.name === 'desktop-dark') {
      darkChecklist = await evaluate(cdp, sessionId, `(() => {
        const first = document.querySelector('.icon-checklist dt');
        first?.scrollIntoView({ block: 'center' });
        return first ? { text: first.textContent.trim(), box: (() => { const r = first.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })() } : null;
      })()`);
      await delay(200);
      const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, sessionId);
      const shot = 'desktop-dark-checklist.png';
      await fs.writeFile(path.join(outDir, shot), Buffer.from(screenshot.data, 'base64'));
      names.push(shot);
    }

    let hudChecklistFocus = null;
    if (view.name === 'mobile-375-hud') {
      hudChecklistFocus = await evaluate(cdp, sessionId, `(() => {
        const element = document.querySelector('.icon-checklist dt');
        element?.scrollIntoView({ block: 'center' });
        if (!element) return null;
        const r = element.getBoundingClientRect();
        return { text: element.textContent.trim(), color: getComputedStyle(element).color, lxTextPrimary: getComputedStyle(element).getPropertyValue('--lx-text-primary').trim(), vpText1: getComputedStyle(element).getPropertyValue('--vp-c-text-1').trim(), background: getComputedStyle(document.body).backgroundColor, box: { x: r.x, y: r.y, width: r.width, height: r.height } };
      })()`);
      await delay(200);
      const checklistShot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, sessionId);
      const checklistName = 'mobile-375-hud-checklist.png';
      await fs.writeFile(path.join(outDir, checklistName), Buffer.from(checklistShot.data, 'base64'));
      names.push(checklistName);
      await evaluate(cdp, sessionId, `document.querySelector('.icon-copy-feedback')?.scrollIntoView({ block: 'center' })`);
      await delay(200);
      const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, sessionId);
      const shot = 'mobile-375-hud-empty-status.png';
      await fs.writeFile(path.join(outDir, shot), Buffer.from(screenshot.data, 'base64'));
      names.push(shot);
    }

    results.push({
      name: view.name,
      url: targetUrl,
      viewport: { width: view.width, height: view.height, mobile: view.mobile },
      theme: view.theme,
      injection: { ...injection, detectorReady },
      baselineOverlayCount,
      currentOverlayCount: domEvidence.overlayCount,
      hitCountsMatch,
      countsByScope: domEvidence.countsByScope,
      pageTheme: domEvidence.pageTheme,
      outsideTargetReplay,
      copyStatusAtStart: domEvidence.copyStatusAtStart,
      hits: domEvidence.hits,
      revealedComponentTargets,
      docsCodeCopyBehavior,
      motionBehavior,
      componentFocus: componentShot,
      darkChecklistFocus: darkChecklist,
      hudChecklistFocus,
      screenshots: names,
      detectorUiRemovedBeforeFocusScreenshots: clean,
    });
  }

  const sourceHashesAtEnd = Object.fromEntries(await Promise.all(Object.entries(sourcePaths).map(async ([key, value]) => [key, await hashSource(value)])));
  const report = {
    generatedAt: new Date().toISOString(),
    targetUrl,
    sourcePath: baseline.source,
    sourcePaths,
    sourceHashesAtStart,
    sourceHashesAtEnd,
    sourceUnchangedDuringRun: JSON.stringify(sourceHashesAtStart) === JSON.stringify(sourceHashesAtEnd),
    method: 'Chrome CDP；每个视图使用新标签和隔离 BrowserContext；在目标页实际注入 detect.js；命中节点在页面 JS 中读取计算样式、DOMRect、overflow 裁切链及 elementFromPoint 堆栈。',
    caveats: [
      'elementFromPoint 只在命中文字节点矩形内取样，元素自身或其子节点处于顶层记为可见；这是 DOM 几何证据，不替代像素级色彩测量。',
      '近似对比度按纯色祖先背景合成；background-image、伪元素或复杂混合需结合目标截图判断。',
      'focus 截图为去除 Impeccable overlay 后的页面证据；修改 details 展开态只用于查看命中文字，不代表初始状态。',
    ],
    views: results,
  };
  await fs.writeFile(path.join(outDir, 'overlay-dom-recheck.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({ views: results.map((item) => ({ name: item.name, injectionSucceeded: item.injection.preflight && item.injection.scriptLoaded && item.injection.detectorReady, baselineOverlayCount: item.baselineOverlayCount, currentOverlayCount: item.currentOverlayCount, hitCountsMatch: item.hitCountsMatch, screenshots: item.screenshots })), evidenceFile: 'overlay-dom-recheck.json' }, null, 2)}\n`);
} finally {
  if (cdp && browserContextId) {
    await cdp.send('Target.disposeBrowserContext', { browserContextId }).catch(() => {});
    cdp.close();
  }
  chrome.kill();
  await fs.rm(profilePath, { recursive: true, force: true }).catch(() => {});
}
