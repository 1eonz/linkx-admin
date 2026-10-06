import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const require = createRequire(resolve(process.cwd(), 'other-admin/admin-vue3/package.json'));
const { chromium } = require('@playwright/test');
const target = 'http://127.0.0.1:4174/components/lxicons.html';
const outputDir = resolve(process.cwd(), '.impeccable/critique/wave3-lxicon-2026-10-06/agent-impeccable-recheck/postfix-final');
const evidence = {
  target,
  capturedAt: new Date().toISOString(),
  browser: {},
  viewports: {},
  keyboard: {},
  empty: {},
  copy: {},
  theme: {},
  reducedMotion: {},
  pageErrors: [],
};

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
evidence.browser.version = browser.version();

function listenForErrors(page) {
  page.on('pageerror', (error) => evidence.pageErrors.push(error.message));
}

async function freshPage(width, height, options = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme: options.colorScheme ?? 'light',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(6000);
  listenForErrors(page);
  if (options.clipboard === 'success') {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async (value) => { window.__lxCopiedText = value; } },
      });
    });
  }
  if (options.clipboard === 'failure') {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async () => { throw new Error('clipboard denied'); } },
      });
    });
  }
  await page.goto(target, { waitUntil: 'networkidle' });
  await page.locator('.icon-catalog').waitFor();
  await page.evaluate(() => document.fonts.ready);
  return { context, page };
}

async function snapshot(page) {
  return page.evaluate(() => {
    const intersects = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
      * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const searchbar = document.querySelector('.icon-searchbar');
    const searchRect = searchbar?.getBoundingClientRect();
    const openGroups = [...document.querySelectorAll('.icon-group[open]')];
    const tiles = [...openGroups.flatMap((group) => [...group.querySelectorAll('.icon-tile')])];
    const overlaps = searchRect ? tiles.flatMap((tile) => {
      const rect = tile.getBoundingClientRect();
      const area = intersects(searchRect, rect);
      return area ? [{
        label: tile.getAttribute('aria-label'),
        area,
        width: Math.max(0, Math.min(searchRect.right, rect.right) - Math.max(searchRect.left, rect.left)),
        height: Math.max(0, Math.min(searchRect.bottom, rect.bottom) - Math.max(searchRect.top, rect.top)),
      }] : [];
    }) : [];
    return {
      viewport: { width: innerWidth, height: innerHeight },
      scrollY: scrollY,
      documentWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      searchbar: {
        position: searchbar ? getComputedStyle(searchbar).position : null,
        rect: searchRect ? { top: searchRect.top, bottom: searchRect.bottom, left: searchRect.left, right: searchRect.right } : null,
        overlappingOpenTiles: overlaps,
      },
      groups: [...document.querySelectorAll('.icon-group')].map((group) => ({
        title: group.querySelector('summary')?.innerText.trim(),
        open: group.open,
        total: group.querySelectorAll('.icon-tile').length,
      })),
      expandedGroups: openGroups.map((group) => group.querySelector('summary')?.innerText.trim()),
      expandedTileCount: tiles.length,
      businessExample: (() => {
        const figure = document.querySelector('.icon-business-example');
        const flow = figure?.querySelector('.icon-business-example__flow');
        if (!figure || !flow) return null;
        const figureRect = figure.getBoundingClientRect();
        const flowRect = flow.getBoundingClientRect();
        const childRects = [...flow.children].map((child) => {
          const rect = child.getBoundingClientRect();
          return { text: child.textContent.trim(), left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
        });
        return {
          caption: figure.querySelector('figcaption')?.innerText.trim(),
          rect: { top: figureRect.top, bottom: figureRect.bottom, left: figureRect.left, right: figureRect.right },
          flowRect: { left: flowRect.left, right: flowRect.right, top: flowRect.top, bottom: flowRect.bottom },
          flowClientWidth: flow.clientWidth,
          flowScrollWidth: flow.scrollWidth,
          wraps: childRects.length > 1
            && Math.max(...childRects.map((rect) => (rect.top + rect.bottom) / 2))
              - Math.min(...childRects.map((rect) => (rect.top + rect.bottom) / 2)) > 8,
          childRects,
        };
      })(),
      htmlDark: document.documentElement.classList.contains('dark'),
      hudTheme: document.documentElement.classList.contains('lx-theme-hud'),
    };
  });
}

async function saveScreenshot(page, name) {
  await page.screenshot({ path: join(outputDir, name), fullPage: false });
}

const viewportCases = [
  { key: 'desktop1440', label: '1440x1000', width: 1440, height: 1000, scrollY: 420 },
  { key: 'mobile375', label: '375x812', width: 375, height: 812, scrollY: 530 },
  { key: 'mobile320', label: '320x800', width: 320, height: 800, scrollY: 500 },
];

const viewportContexts = [];
for (const item of viewportCases) {
  const { context, page } = await freshPage(item.width, item.height);
  viewportContexts.push(context);
  evidence.viewports[item.key] = { label: item.label };
  evidence.viewports[item.key].initial = await snapshot(page);
  await saveScreenshot(page, `${item.key}-first-viewport.png`);

  await page.locator('.icon-group').nth(1).evaluate((group) => { group.open = true; });
  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), item.scrollY);
  await page.waitForTimeout(300);
  evidence.viewports[item.key].catalogScroll = await snapshot(page);
  await saveScreenshot(page, `${item.key}-catalog-scroll.png`);

  const example = page.locator('.icon-business-example');
  await example.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  evidence.viewports[item.key].businessExample = await snapshot(page);
  await saveScreenshot(page, `${item.key}-business-example.png`);
}

const desktop = viewportContexts[0] ? browser.contexts()[0] : null;
const desktopPage = desktop?.pages()[0];
if (desktopPage) {
  await desktopPage.locator('.icon-group').nth(1).evaluate((group) => { group.open = false; });
  await desktopPage.evaluate(() => window.scrollTo(0, 0));
  await desktopPage.waitForTimeout(250);
  const themeSwitch = desktopPage.locator('.VPNavBarAppearance button');
  evidence.theme.switchAvailable = (await themeSwitch.count()) > 0;
  if (evidence.theme.switchAvailable) {
    await themeSwitch.click();
    await desktopPage.waitForTimeout(150);
    evidence.theme.darkAfterSwitch = await desktopPage.evaluate(() => document.documentElement.classList.contains('dark'));
    await saveScreenshot(desktopPage, 'desktop-dark-first-viewport.png');
    await desktopPage.evaluate(() => window.scrollTo(0, 420));
    await desktopPage.waitForTimeout(100);
    evidence.theme.darkCatalogScroll = await snapshot(desktopPage);
    await saveScreenshot(desktopPage, 'desktop-dark-catalog-scroll.png');
  }
}

const keyboardRun = await freshPage(1440, 1000, { clipboard: 'success' });
const search = keyboardRun.page.locator('.icon-search');
await search.focus();
await search.fill('undo');
await keyboardRun.page.keyboard.press('Tab');
evidence.keyboard.clearButtonFocused = await keyboardRun.page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
await keyboardRun.page.keyboard.press('Enter');
evidence.keyboard.clearReturnsFocus = await keyboardRun.page.evaluate(() => document.activeElement === document.querySelector('.icon-search'));
await search.fill('undo');
const undo = keyboardRun.page.getByRole('button', { name: '复制 undo（重置）图标用法' });
await undo.focus();
await keyboardRun.page.keyboard.press('Enter');
evidence.keyboard.copy = await keyboardRun.page.evaluate(() => ({
  copiedText: window.__lxCopiedText ?? null,
  feedback: document.querySelector('.icon-copy-feedback')?.innerText.trim() ?? '',
  focusVisible: document.activeElement?.matches(':focus-visible') ?? false,
}));
await saveScreenshot(keyboardRun.page, 'keyboard-copy-undo.png');

const emptyRun = await freshPage(375, 812);
await emptyRun.page.locator('.icon-search').fill('no-such-icon-postfix');
await emptyRun.page.waitForTimeout(100);
evidence.empty.mobile375 = await emptyRun.page.evaluate(() => ({
  status: document.querySelector('.icon-search-status')?.innerText.trim() ?? '',
  emptyVisible: [...document.querySelectorAll('.icon-empty')].some((node) => node.getClientRects().length > 0),
  tileCount: [...document.querySelectorAll('.icon-group[open] .icon-tile')].filter((node) => node.getClientRects().length > 0).length,
}));
await saveScreenshot(emptyRun.page, 'mobile375-empty-result.png');

const copySuccessRun = await freshPage(1440, 1000, { clipboard: 'success' });
await copySuccessRun.page.getByRole('button', { name: '复制 delete（删除）图标用法' }).click();
evidence.copy.success = await copySuccessRun.page.evaluate(() => ({
  copiedText: window.__lxCopiedText ?? null,
  feedback: document.querySelector('.icon-copy-feedback')?.innerText.trim() ?? '',
}));
await saveScreenshot(copySuccessRun.page, 'desktop-copy-success.png');

const copyFailureRun = await freshPage(375, 812, { clipboard: 'failure' });
await copyFailureRun.page.getByRole('button', { name: '复制 delete（删除）图标用法' }).click();
evidence.copy.failure = await copyFailureRun.page.evaluate(() => {
  const textarea = document.querySelector('.icon-copy-fallback textarea');
  return {
    feedback: document.querySelector('.icon-copy-feedback')?.innerText.trim() ?? '',
    fallbackVisible: Boolean(textarea?.getClientRects().length),
    fallbackValue: textarea?.value ?? null,
    focused: document.activeElement === textarea,
    selectedLength: textarea ? textarea.selectionEnd - textarea.selectionStart : null,
  };
});
await saveScreenshot(copyFailureRun.page, 'mobile375-copy-failure.png');

const motionRun = await freshPage(375, 812);
await motionRun.page.emulateMedia({ reducedMotion: 'reduce' });
await motionRun.page.locator('.icon-search').fill('loading');
const loading = motionRun.page.getByRole('button', { name: '复制 loading（加载中）图标用法' });
await loading.hover();
evidence.reducedMotion = await motionRun.page.evaluate(() => {
  const tile = document.querySelector('[aria-label="复制 loading（加载中）图标用法"]');
  const svg = tile?.querySelector('svg');
  return {
    mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    tileTransitionDuration: tile ? getComputedStyle(tile).transitionDuration : null,
    iconAnimationName: svg ? getComputedStyle(svg).animationName : null,
    iconAnimationDuration: svg ? getComputedStyle(svg).animationDuration : null,
  };
});
await saveScreenshot(motionRun.page, 'mobile375-reduced-motion.png');

evidence.pageErrors = [...new Set(evidence.pageErrors)];
await writeFile(join(outputDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2) + '\n', 'utf8');

for (const context of [...browser.contexts()]) await context.close();
await browser.close();
console.log(JSON.stringify({ outputDir, capturedAt: evidence.capturedAt, pageErrors: evidence.pageErrors }, null, 2));
