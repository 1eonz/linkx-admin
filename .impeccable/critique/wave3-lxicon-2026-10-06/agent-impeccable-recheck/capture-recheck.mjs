import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const require = createRequire(resolve(process.cwd(), 'other-admin/admin-vue3/package.json'));
const { chromium } = require('@playwright/test');
const base = 'http://127.0.0.1:4174/components/lxicons.html';
const outDir = resolve(process.cwd(), '.impeccable/critique/wave3-lxicon-2026-10-06/agent-impeccable-recheck');
const evidence = { target: base, capturedAt: new Date().toISOString(), browser: {}, desktop: {}, mobile: {}, interactions: {}, errors: [] };

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
evidence.browser.version = browser.version();

function recordErrors(page) {
  page.on('pageerror', (error) => evidence.errors.push(error.message));
}

async function openPage(viewport, options = {}) {
  const context = await browser.newContext({ viewport, colorScheme: options.colorScheme ?? 'light' });
  if (options.reducedMotion) await context.grantPermissions([]).catch(() => undefined);
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  recordErrors(page);
  if (options.clipboard === 'success') {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async (value) => { window.__lxCopiedText = value; } },
      });
    });
  } else if (options.clipboard === 'failure') {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async () => { throw new Error('clipboard denied'); } },
      });
    });
  }
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('.icon-catalog').waitFor();
  await page.evaluate(() => document.fonts.ready);
  return { context, page };
}

async function catalogState(page) {
  return page.evaluate(() => {
    const intersectsViewport = (rect) => rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
    const groups = [...document.querySelectorAll('.icon-group')].map((group) => ({
      title: group.querySelector('summary')?.innerText.trim(),
      expanded: group.open,
      total: group.querySelectorAll('.icon-tile').length,
      visible: group.open ? [...group.querySelectorAll('.icon-tile')].filter((tile) => intersectsViewport(tile.getBoundingClientRect())).length : 0,
    }));
    const searchbar = document.querySelector('.icon-searchbar');
    const nav = document.querySelector('.VPNavBar');
    const localNav = document.querySelector('.VPLocalNav');
    const searchRect = searchbar?.getBoundingClientRect();
    const navRect = nav?.getBoundingClientRect();
    const localNavRect = localNav?.getBoundingClientRect();
    const topBarBottom = Math.max(0, navRect?.bottom ?? 0, localNavRect?.bottom ?? 0);
    return {
      viewport: { width: innerWidth, height: innerHeight },
      scrollY: window.scrollY,
      documentWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      headings: [...document.querySelectorAll('.vp-doc h1, .vp-doc h2, .vp-doc h3')].map((item) => item.innerText.trim()),
      groups,
      expandedGroups: groups.filter((group) => group.expanded).map((group) => group.title),
      visibleTileCount: groups.reduce((count, group) => count + group.visible, 0),
      expandedTileCount: groups.filter((group) => group.expanded).reduce((count, group) => count + group.total, 0),
      totalCatalogNames: document.querySelectorAll('.icon-tile').length,
      sticky: {
        position: searchbar ? getComputedStyle(searchbar).position : null,
        top: searchRect?.top ?? null,
        bottom: searchRect?.bottom ?? null,
        navBottom: navRect?.bottom ?? null,
        localNavBottom: localNavRect?.bottom ?? null,
        topBarBottom,
        gapFromTopBar: searchRect ? searchRect.top - topBarBottom : null,
        overlapWithNav: searchRect
          ? Math.max(0, Math.min(searchRect.bottom, topBarBottom) - Math.max(searchRect.top, 0))
          : null,
        overlappingOpenTiles: searchRect
          ? [...document.querySelectorAll('.icon-group[open] .icon-tile')].flatMap((tile) => {
              const rect = tile.getBoundingClientRect();
              const overlapWidth = Math.max(0, Math.min(searchRect.right, rect.right) - Math.max(searchRect.left, rect.left));
              const overlapHeight = Math.max(0, Math.min(searchRect.bottom, rect.bottom) - Math.max(searchRect.top, rect.top));
              return overlapWidth && overlapHeight ? [{
                label: tile.getAttribute('aria-label'),
                overlapWidth,
                overlapHeight,
                top: rect.top,
                bottom: rect.bottom,
              }] : [];
            })
          : [],
      },
      codeExamples: [...document.querySelectorAll('.vp-doc pre code')].map((item) => item.innerText.trim()).filter(Boolean),
      statusText: document.querySelector('.icon-search-status')?.innerText.trim() ?? '',
    };
  });
}

async function screenshot(page, file) {
  await page.screenshot({ path: join(outDir, file), fullPage: false });
}

const desktop = await openPage({ width: 1440, height: 1000 });
evidence.desktop.initial = await catalogState(desktop.page);
await screenshot(desktop.page, 'desktop-light-initial.png');

await desktop.page.evaluate(() => window.scrollTo(0, 620));
await desktop.page.waitForTimeout(300);
evidence.desktop.scrolled = await catalogState(desktop.page);
await screenshot(desktop.page, 'desktop-light-sticky.png');

const themeButton = desktop.page.locator('.VPNavBarAppearance button');
evidence.desktop.themeToggleAvailable = (await themeButton.count()) > 0;
if (evidence.desktop.themeToggleAvailable) {
  await desktop.page.evaluate(() => window.scrollTo(0, 0));
  await desktop.page.waitForTimeout(150);
  await themeButton.click();
  await desktop.page.waitForTimeout(300);
  evidence.desktop.darkTheme = await desktop.page.evaluate(() => ({
    htmlDark: document.documentElement.classList.contains('dark'),
    hudTheme: document.documentElement.classList.contains('lx-theme-hud'),
  }));
  await desktop.page.evaluate(() => window.scrollTo(0, 0));
  await screenshot(desktop.page, 'desktop-dark-initial.png');
}

const mobile = await openPage({ width: 375, height: 812 });
evidence.mobile.initial = await catalogState(mobile.page);
await screenshot(mobile.page, 'mobile-375-light-initial.png');
await mobile.page.evaluate(() => window.scrollTo(0, 680));
await mobile.page.waitForTimeout(300);
evidence.mobile.scrolled = await catalogState(mobile.page);
await screenshot(mobile.page, 'mobile-375-light-sticky.png');

const mobileThemeButton = mobile.page.locator('.VPNavBarAppearance button');
if (await mobileThemeButton.count()) {
  await mobile.page.evaluate(() => document.documentElement.classList.add('dark'));
  await mobile.page.waitForTimeout(150);
  await mobile.page.evaluate(() => window.scrollTo(0, 0));
  evidence.mobile.darkTheme = await mobile.page.evaluate(() => document.documentElement.classList.contains('dark'));
  await screenshot(mobile.page, 'mobile-375-dark-initial.png');
}

await mobile.page.locator('.icon-search').fill('no-such-icon-zz');
await mobile.page.waitForTimeout(200);
evidence.interactions.emptyResult = await mobile.page.evaluate(() => ({
  visibleEmptyText: [...document.querySelectorAll('.icon-empty')].some((item) => item.getClientRects().length > 0),
  visibleGroupCount: [...document.querySelectorAll('.icon-group')].filter((item) => item.getClientRects().length > 0).length,
  statusText: document.querySelector('.icon-search-status')?.innerText.trim() ?? '',
}));
await screenshot(mobile.page, 'mobile-375-empty-result.png');

const copySuccess = await openPage({ width: 1440, height: 1000 }, { clipboard: 'success' });
await copySuccess.page.getByRole('button', { name: '复制 delete（删除）图标用法' }).click();
await copySuccess.page.waitForTimeout(100);
evidence.interactions.copySuccess = await copySuccess.page.evaluate(() => ({
  feedback: document.querySelector('.icon-copy-feedback')?.innerText.trim(),
  copiedText: window.__lxCopiedText ?? null,
  feedbackRect: (() => {
    const rect = document.querySelector('.icon-copy-feedback')?.getBoundingClientRect();
    return rect ? { top: rect.top, bottom: rect.bottom } : null;
  })(),
  navRect: (() => {
    const rect = document.querySelector('.VPNav')?.getBoundingClientRect();
    return rect ? { top: rect.top, bottom: rect.bottom } : null;
  })(),
}));
await screenshot(copySuccess.page, 'desktop-copy-success.png');

const copyFailure = await openPage({ width: 375, height: 812 }, { clipboard: 'failure' });
await copyFailure.page.getByRole('button', { name: '复制 delete（删除）图标用法' }).click();
await copyFailure.page.waitForTimeout(100);
evidence.interactions.copyFailure = await copyFailure.page.evaluate(() => {
  const input = document.querySelector('.icon-copy-fallback textarea');
  return {
    feedback: document.querySelector('.icon-copy-feedback')?.innerText.trim(),
    fallbackVisible: Boolean(input?.getClientRects().length),
    fallbackValue: input?.value ?? null,
    fallbackFocused: document.activeElement === input,
    fallbackSelectedLength: input ? input.selectionEnd - input.selectionStart : null,
  };
});
await screenshot(copyFailure.page, 'mobile-375-copy-failure.png');

const keyboard = await openPage({ width: 1440, height: 1000 }, { clipboard: 'success' });
const input = keyboard.page.locator('.icon-search');
await input.focus();
await input.fill('undo');
await keyboard.page.keyboard.press('Tab');
evidence.interactions.keyboardClearFocus = await keyboard.page.evaluate(() => ({
  focusedLabel: document.activeElement?.getAttribute('aria-label'),
  focusedTag: document.activeElement?.tagName,
}));
await keyboard.page.keyboard.press('Enter');
await keyboard.page.waitForTimeout(100);
evidence.interactions.keyboardClearRecovery = await keyboard.page.evaluate(() => ({
  inputFocused: document.activeElement === document.querySelector('.icon-search'),
  value: document.querySelector('.icon-search')?.value,
}));
await keyboard.page.locator('.icon-search').fill('undo');
const undoTile = keyboard.page.getByRole('button', { name: '复制 undo（重置）图标用法' });
await undoTile.focus();
await keyboard.page.keyboard.press('Enter');
await keyboard.page.waitForTimeout(100);
evidence.interactions.keyboardCopy = await keyboard.page.evaluate(() => ({
  copiedText: window.__lxCopiedText ?? null,
  feedback: document.querySelector('.icon-copy-feedback')?.innerText.trim(),
  focusVisible: document.activeElement?.matches(':focus-visible') ?? false,
}));
await screenshot(keyboard.page, 'desktop-keyboard-search-copy.png');

const reduced = await openPage({ width: 375, height: 812 });
await reduced.page.emulateMedia({ reducedMotion: 'reduce' });
const loadingTile = reduced.page.locator('[aria-label="复制 loading（加载中）图标用法"]');
evidence.interactions.reducedMotion = await reduced.page.evaluate(() => {
  const tile = document.querySelector('[aria-label="复制 loading（加载中）图标用法"]');
  const svg = tile?.querySelector('svg');
  const tileStyle = tile ? getComputedStyle(tile) : null;
  const svgStyle = svg ? getComputedStyle(svg) : null;
  return {
    mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    tileTransitionDuration: tileStyle?.transitionDuration ?? null,
    iconAnimationName: svgStyle?.animationName ?? null,
    iconAnimationDuration: svgStyle?.animationDuration ?? null,
  };
});
if (await loadingTile.count()) await loadingTile.hover();
await screenshot(reduced.page, 'mobile-375-reduced-motion.png');

const narrow = await openPage({ width: 320, height: 720 });
evidence.mobile.width320 = await catalogState(narrow.page);
await screenshot(narrow.page, 'mobile-320-light-initial.png');

await writeFile(join(outDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2) + '\n', 'utf8');

for (const item of [desktop, mobile, copySuccess, copyFailure, keyboard, reduced, narrow]) await item.context.close();
await browser.close();
console.log(JSON.stringify({ output: outDir, evidence }, null, 2));
