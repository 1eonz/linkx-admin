import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const projectRequire = createRequire('F:/work/linkx-admin/other-admin/admin-vue3/package.json');
const { chromium } = projectRequire('@playwright/test');
const targetUrl = 'http://127.0.0.1:4174/components/lxicons.html';
const overlayUrl = 'http://127.0.0.1:8400/detect.js';
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const logs = [];
const views = [];

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  colorScheme: 'light',
  reducedMotion: 'no-preference',
});
const page = await context.newPage();
let currentView = '初始化';

page.on('console', (message) => {
  logs.push({ view: currentView, source: 'console', type: message.type(), text: message.text() });
});
page.on('pageerror', (error) => {
  logs.push({ view: currentView, source: 'pageerror', text: error.message });
});
page.on('requestfailed', (request) => {
  logs.push({
    view: currentView,
    source: 'requestfailed',
    url: request.url(),
    error: request.failure()?.errorText ?? 'unknown',
  });
});
page.on('response', (response) => {
  if (response.status() >= 400) {
    logs.push({ view: currentView, source: 'http-error', status: response.status(), url: response.url() });
  }
});

async function applyTheme(theme) {
  await page.evaluate((mode) => {
    document.documentElement.classList.remove('dark', 'lx-theme-hud');
    if (mode === 'hud') document.documentElement.classList.add('lx-theme-hud');
  }, theme);
}

async function pageMetrics() {
  return page.evaluate(() => {
    const rect = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const box = el.getBoundingClientRect();
      return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) };
    };
    const style = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const css = getComputedStyle(el);
      return { color: css.color, backgroundColor: css.backgroundColor, transitionDuration: css.transitionDuration, animationName: css.animationName, outlineStyle: css.outlineStyle, outlineWidth: css.outlineWidth };
    };
    const html = document.documentElement;
    const catalog = document.querySelector('.icon-catalog');
    const catalogCss = catalog ? getComputedStyle(catalog) : null;
    return {
      title: document.title,
      url: location.href,
      viewport: {
        width: innerWidth,
        height: innerHeight,
        clientWidth: html.clientWidth,
        scrollWidth: html.scrollWidth,
        horizontalOverflow: html.scrollWidth > html.clientWidth,
        documentHeight: html.scrollHeight,
      },
      theme: {
        rootClass: html.className,
        light: !html.classList.contains('dark') && !html.classList.contains('lx-theme-hud'),
        hud: html.classList.contains('lx-theme-hud'),
        catalogBackground: catalogCss?.backgroundColor ?? null,
        pageBackground: getComputedStyle(document.body).backgroundColor,
      },
      counts: {
        iconTiles: document.querySelectorAll('.icon-tile').length,
        groupHeadings: document.querySelectorAll('.icon-group-title').length,
        emptyState: !!document.querySelector('.icon-empty'),
      },
      boxes: {
        search: rect('.icon-search'),
        catalog: rect('.icon-catalog'),
        firstTile: rect('.icon-tile'),
      },
      styles: { search: style('.icon-search'), tile: style('.icon-tile'), icon: style('.icon-tile .lx-icon') },
      activeElement: document.activeElement ? {
        tag: document.activeElement.tagName,
        label: document.activeElement.getAttribute('aria-label'),
        className: typeof document.activeElement.className === 'string' ? document.activeElement.className : '',
        focusStyle: (() => {
          const css = getComputedStyle(document.activeElement);
          return { outlineStyle: css.outlineStyle, outlineWidth: css.outlineWidth, outlineColor: css.outlineColor, boxShadow: css.boxShadow };
        })(),
      } : null,
    };
  });
}

async function injectAndScan(name, screenshotName, extras = {}) {
  let injectionError = null;
  try {
    await page.addScriptTag({ url: overlayUrl, timeout: 10000 });
    await page.waitForFunction(() => typeof window.impeccableScan === 'function', null, { timeout: 10000 });
    await page.waitForTimeout(1400);
  } catch (error) {
    injectionError = error.message;
  }

  let detector = null;
  if (!injectionError) {
    detector = await page.evaluate(() => {
      const serialized = window.impeccableDetect?.() ?? [];
      window.impeccableScan?.();
      return {
        scriptReady: typeof window.impeccableScan === 'function',
        serializedFindings: Array.isArray(serialized) ? serialized : [],
        overlayElements: [...document.querySelectorAll('.impeccable-overlay')].map((el) => {
          const box = el.getBoundingClientRect();
          const css = getComputedStyle(el);
          return {
            className: el.className,
            text: (el.innerText || el.textContent || '').trim().slice(0, 240),
            visible: css.display !== 'none' && css.visibility !== 'hidden' && Number(css.opacity) > 0 && box.width > 0 && box.height > 0,
            inViewport: box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth,
            box: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) },
          };
        }),
      };
    });
    await page.waitForTimeout(450);
  }

  const screenshotPath = path.join(evidenceDir, screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  const metrics = await pageMetrics();
  const overlays = detector?.overlayElements ?? [];
  views.push({
    name,
    screenshot: screenshotName,
    screenshotPath,
    injection: { succeeded: !injectionError, error: injectionError, overlayUrl },
    detector: detector ? {
      scriptReady: detector.scriptReady,
      findingCount: detector.serializedFindings.length,
      findings: detector.serializedFindings,
      overlayElementCount: overlays.length,
      visibleOverlayCount: overlays.filter((item) => item.visible && item.inViewport).length,
      overlayElements: overlays,
      pageBannerVisible: overlays.some((item) => item.className.includes('impeccable-banner') && item.visible),
    } : null,
    metrics,
    ...extras,
  });
}

async function openView(name, viewport, theme, reducedMotion = 'no-preference') {
  currentView = name;
  await page.setViewportSize(viewport);
  await page.emulateMedia({ colorScheme: 'light', reducedMotion });
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.locator('.icon-search').waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(400);
  await applyTheme(theme);
  await page.locator('.icon-search').scrollIntoViewIfNeeded();
}

try {
  await openView('桌面浅色默认态', { width: 1440, height: 1000 }, 'light');
  const preflight = await page.evaluate(() => {
    document.title = `${document.title} [Assessment B]`;
    const script = document.createElement('script');
    script.textContent = 'window.__assessmentBPreflight = true';
    document.head.appendChild(script);
    const injected = window.__assessmentBPreflight === true;
    script.remove();
    return { titleSet: document.title.endsWith('[Assessment B]'), inlineScriptRan: injected };
  });
  await injectAndScan('桌面浅色默认态', 'browser-desktop-light.png', { preflight });

  await openView('桌面HUD主题', { width: 1440, height: 1000 }, 'hud');
  await injectAndScan('桌面HUD主题', 'browser-desktop-hud.png');

  await openView('375浅色主题', { width: 375, height: 812 }, 'light');
  await injectAndScan('375浅色主题', 'browser-mobile-375-light.png');

  await openView('375HUD主题', { width: 375, height: 812 }, 'hud');
  await injectAndScan('375HUD主题', 'browser-mobile-375-hud.png');

  await openView('Hover图标状态', { width: 1440, height: 1000 }, 'light');
  const deleteTile = page.locator('button.icon-tile[aria-label^="复制 delete"]');
  await deleteTile.scrollIntoViewIfNeeded();
  await deleteTile.hover();
  await page.waitForTimeout(180);
  const hoverState = await page.evaluate(() => {
    const tile = document.querySelector('button.icon-tile[aria-label^="复制 delete"]');
    const icon = tile?.querySelector('.lx-icon');
    const css = icon ? getComputedStyle(icon) : null;
    return {
      targetFound: !!tile,
      hovered: !!tile?.matches(':hover'),
      iconName: icon?.getAttribute('data-icon-name') ?? null,
      transform: css?.transform ?? null,
      filter: css?.filter ?? null,
      animationName: css?.animationName ?? null,
      transitionDuration: css?.transitionDuration ?? null,
    };
  });
  await injectAndScan('Hover图标状态', 'browser-hover-delete.png', { interaction: hoverState });

  await openView('键盘焦点状态', { width: 1440, height: 1000 }, 'light');
  await page.locator('.icon-search').focus();
  await page.keyboard.press('Tab');
  const focusState = await page.evaluate(() => ({
    activeTag: document.activeElement?.tagName ?? null,
    activeLabel: document.activeElement?.getAttribute('aria-label') ?? null,
    activeClass: typeof document.activeElement?.className === 'string' ? document.activeElement.className : '',
    focusVisible: document.activeElement?.matches(':focus-visible') ?? false,
    outline: (() => {
      const css = getComputedStyle(document.activeElement);
      return { style: css.outlineStyle, width: css.outlineWidth, color: css.outlineColor };
    })(),
  }));
  await injectAndScan('键盘焦点状态', 'browser-keyboard-focus.png', { interaction: focusState });

  await openView('减少动效Hover状态', { width: 1440, height: 1000 }, 'light', 'reduce');
  await page.locator('button.icon-tile[aria-label^="复制 delete"]').hover();
  await page.waitForTimeout(180);
  const reducedMotion = await page.evaluate(() => {
    const tile = document.querySelector('button.icon-tile[aria-label^="复制 delete"]');
    const icon = tile?.querySelector('.lx-icon');
    const tileCss = tile ? getComputedStyle(tile) : null;
    const iconCss = icon ? getComputedStyle(icon) : null;
    return {
      mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      tileTransitionDuration: tileCss?.transitionDuration ?? null,
      iconTransitionDuration: iconCss?.transitionDuration ?? null,
      iconAnimationName: iconCss?.animationName ?? null,
      iconTransform: iconCss?.transform ?? null,
    };
  });
  await injectAndScan('减少动效Hover状态', 'browser-reduced-motion.png', { interaction: reducedMotion });

  await openView('筛选undo结果', { width: 1440, height: 1000 }, 'light');
  await page.locator('.icon-search').fill('undo');
  await page.waitForTimeout(120);
  const filterState = await page.evaluate(() => ({
    query: document.querySelector('.icon-search')?.value ?? '',
    tileCount: document.querySelectorAll('.icon-tile').length,
    tileNames: [...document.querySelectorAll('.icon-tile .icon-tile__name')].map((el) => el.textContent.trim()),
    groupTitles: [...document.querySelectorAll('.icon-group-title')].map((el) => el.textContent.trim()),
    emptyVisible: !!document.querySelector('.icon-empty'),
  }));
  await injectAndScan('筛选undo结果', 'browser-filter-undo.png', { interaction: filterState });

  await openView('无匹配空态', { width: 1440, height: 1000 }, 'light');
  await page.locator('.icon-search').fill('不存在的图标-b-assessment');
  await page.waitForTimeout(120);
  const emptyState = await page.evaluate(() => ({
    query: document.querySelector('.icon-search')?.value ?? '',
    tileCount: document.querySelectorAll('.icon-tile').length,
    groupCount: document.querySelectorAll('.icon-group-title').length,
    emptyText: document.querySelector('.icon-empty')?.textContent.trim() ?? null,
    emptyVisible: !!document.querySelector('.icon-empty') && getComputedStyle(document.querySelector('.icon-empty')).display !== 'none',
  }));
  await injectAndScan('无匹配空态', 'browser-empty-state.png', { interaction: emptyState });

  const summary = {
    method: 'Playwright 1.58 + 系统 Google Chrome，新建 BrowserContext 与页面',
    targetUrl,
    overlayUrl,
    browserVersion: browser.version(),
    contextCount: browser.contexts().length,
    pageCount: context.pages().length,
    views,
    logs,
  };
  await fs.writeFile(path.join(evidenceDir, 'browser-state-probes.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} finally {
  await browser.close();
}
