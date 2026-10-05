import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const { chromium } = require('./other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright');
const targetUrl = 'http://127.0.0.1:4174/components/lxicons.html';
const outputDir = path.resolve(
  process.cwd(),
  '.impeccable/critique/wave3-lxicon-2026-10-06/final-assessment-a',
);
const runId = 'current-2026-10-06';
const profileDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lxicon-final-a-'));
const results = {
  runId,
  targetUrl,
  method: 'A-only visual and browser interaction review',
  browser: 'System Chrome via isolated Playwright persistent context',
  screenshots: {},
  viewports: {},
  interactions: {},
  consoleErrors: [],
  pageErrors: [],
  httpErrors: [],
};
let context;
let fatalError;

function rect(value) {
  if (!value) return null;
  return {
    x: Math.round(value.x),
    y: Math.round(value.y),
    width: Math.round(value.width),
    height: Math.round(value.height),
    right: Math.round(value.right),
    bottom: Math.round(value.bottom),
  };
}

async function registerPage(page) {
  page.on('console', (message) => {
    if (message.type() === 'error') results.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => results.pageErrors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) {
      results.httpErrors.push({ status: response.status(), url: response.url() });
    }
  });
}

async function openPage(viewport, theme) {
  const page = await context.newPage();
  await registerPage(page);
  await page.setViewportSize(viewport);
  await page.emulateMedia({ colorScheme: theme === 'hud' ? 'dark' : 'light' });
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.evaluate((selectedTheme) => {
    document.documentElement.classList.toggle('dark', selectedTheme === 'hud');
    document.documentElement.classList.toggle('lx-theme-hud', selectedTheme === 'hud');
  }, theme);
  await page.waitForTimeout(120);
  return page;
}

async function saveScreenshot(page, name, fullPage = true) {
  const fileName = `${runId}-${name}.png`;
  await page.screenshot({ path: path.join(outputDir, fileName), fullPage });
  results.screenshots[name] = fileName;
}

async function measurePage(page, label) {
  return page.evaluate((measurementLabel) => {
    const doc = document.documentElement;
    const catalog = document.querySelector('.icon-catalog');
    const searchbar = document.querySelector('.icon-searchbar');
    const input = document.querySelector('.icon-search');
    const clear = document.querySelector('.icon-search__clear');
    const grid = document.querySelector('.icon-grid');
    const tile = document.querySelector('.icon-tile');
    const toRect = (value) =>
      value
        ? {
            x: Math.round(value.x),
            y: Math.round(value.y),
            width: Math.round(value.width),
            height: Math.round(value.height),
            right: Math.round(value.right),
            bottom: Math.round(value.bottom),
          }
        : null;
    const style = (element, property) =>
      element ? getComputedStyle(element).getPropertyValue(property).trim() : null;
    const box = (element) => (element ? toRect(element.getBoundingClientRect()) : null);
    return {
      label: measurementLabel,
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        clientWidth: doc.clientWidth,
        scrollWidth: doc.scrollWidth,
        scrollHeight: doc.scrollHeight,
        horizontalOverflow: doc.scrollWidth > doc.clientWidth,
      },
      theme: {
        htmlClasses: doc.className,
        darkScheme: matchMedia('(prefers-color-scheme: dark)').matches,
        hudPageToken: style(doc, '--lx-bg-page'),
        catalogBackground: style(catalog, 'background-color'),
        bodyBackground: style(document.body, 'background-color'),
      },
      catalog: {
        rect: box(catalog),
        tileCount: document.querySelectorAll('.icon-tile').length,
        groups: [...document.querySelectorAll('.icon-group-title')].map((heading) =>
          heading.textContent.trim(),
        ),
        columns: style(grid, 'grid-template-columns'),
      },
      search: {
        rect: box(searchbar),
        position: style(searchbar, 'position'),
        top: style(searchbar, 'top'),
        inputRect: box(input),
        inputFontSize: style(input, 'font-size'),
        clearRect: box(clear),
        clearLabel: clear?.getAttribute('aria-label') ?? null,
        clearOutline: clear ? style(clear, 'outline') : null,
      },
      firstTile: {
        rect: box(tile),
        nameFontSize: style(tile?.querySelector('.icon-tile__name'), 'font-size'),
        meaningFontSize: style(tile?.querySelector('.icon-tile__meaning'), 'font-size'),
      },
    };
  }, label);
}

try {
  await fs.mkdir(outputDir, { recursive: true });
  context = await chromium.launchPersistentContext(profileDir, {
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    locale: 'zh-CN',
    reducedMotion: 'no-preference',
  });

  for (const theme of ['light', 'hud']) {
    for (const [name, width, height] of [
      ['desktop', 1440, 1000],
      ['mobile-375', 375, 812],
    ]) {
      const page = await openPage({ width, height }, theme);
      const key = `${name}-${theme}`;
      results.viewports[key] = await measurePage(page, `${width}x${height} ${theme}`);
      await saveScreenshot(page, key);

      const stickyBar = page.locator('.icon-searchbar');
      await page.evaluate(() => window.scrollTo(0, 2100));
      await page.waitForTimeout(350);
      results.viewports[key].stickyAfterScroll = await stickyBar.evaluate((element) => ({
        rect: (() => {
          const value = element.getBoundingClientRect();
          return {
            x: Math.round(value.x),
            y: Math.round(value.y),
            width: Math.round(value.width),
            height: Math.round(value.height),
            right: Math.round(value.right),
            bottom: Math.round(value.bottom),
          };
        })(),
        scrollY: window.scrollY,
        computedTop: getComputedStyle(element).top,
        position: getComputedStyle(element).position,
        viewportWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      await saveScreenshot(page, `${key}-sticky`, false);
      await page.close();
    }
  }

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: new URL(targetUrl).origin,
  });
  const desktop = await openPage({ width: 1440, height: 1000 }, 'light');
  const input = desktop.locator('.icon-search');
  await input.fill('重置');
  await desktop.waitForFunction(() => document.querySelectorAll('.icon-tile').length === 1);
  results.interactions.chineseSearch = await desktop.evaluate(() => ({
    query: document.querySelector('.icon-search')?.value,
    matches: [...document.querySelectorAll('.icon-tile')].map((tile) => ({
      text: tile.innerText.trim().replaceAll('\n', ' '),
      ariaLabel: tile.getAttribute('aria-label'),
    })),
    clearButton: {
      visible: Boolean(document.querySelector('.icon-search__clear')),
      rect: (() => {
        const value = document.querySelector('.icon-search__clear')?.getBoundingClientRect();
        return value
          ? {
              x: Math.round(value.x),
              y: Math.round(value.y),
              width: Math.round(value.width),
              height: Math.round(value.height),
            }
          : null;
      })(),
      label: document.querySelector('.icon-search__clear')?.getAttribute('aria-label'),
    },
    searchbarPosition: getComputedStyle(document.querySelector('.icon-searchbar')).position,
  }));
  await saveScreenshot(desktop, 'search-chinese-reset');

  await input.press('Tab');
  results.interactions.keyboardClearFocus = await desktop.evaluate(() => ({
    activeClass: document.activeElement?.className ?? null,
    activeLabel: document.activeElement?.getAttribute('aria-label') ?? null,
    focusVisible: document.activeElement?.matches(':focus-visible') ?? false,
    searchbarOutline: getComputedStyle(document.querySelector('.icon-searchbar')).outline,
  }));
  await saveScreenshot(desktop, 'search-clear-keyboard-focus');

  await desktop.locator('.icon-search__clear').click();
  await desktop.waitForFunction(() => document.querySelector('.icon-search')?.value === '');
  await desktop.waitForFunction(() => document.querySelectorAll('.icon-tile').length === 96);
  results.interactions.clearAndRestoreFocus = await desktop.evaluate(() => ({
    query: document.querySelector('.icon-search')?.value,
    activeTag: document.activeElement?.tagName.toLowerCase() ?? null,
    activeClass: document.activeElement?.className ?? null,
    inputFocused: document.activeElement === document.querySelector('.icon-search'),
    tilesRestored: document.querySelectorAll('.icon-tile').length,
    clearButtonPresent: Boolean(document.querySelector('.icon-search__clear')),
  }));
  await saveScreenshot(desktop, 'search-clear-focus-restored');

  await input.fill('沒有這枚圖標');
  await desktop.waitForFunction(() => Boolean(document.querySelector('.icon-empty')));
  results.interactions.emptyState = await desktop.evaluate(() => ({
    query: document.querySelector('.icon-search')?.value,
    message: document.querySelector('.icon-empty')?.textContent.trim() ?? null,
    clearButtonPresent: Boolean(document.querySelector('.icon-search__clear')),
    groupCount: document.querySelectorAll('.icon-group-title').length,
    tileCount: document.querySelectorAll('.icon-tile').length,
  }));
  await saveScreenshot(desktop, 'search-empty-state');
  await desktop.locator('.icon-search__clear').click();
  results.interactions.emptyRecovery = await desktop.evaluate(() => ({
    inputFocused: document.activeElement === document.querySelector('.icon-search'),
    emptyStatePresent: Boolean(document.querySelector('.icon-empty')),
    tileCount: document.querySelectorAll('.icon-tile').length,
  }));

  await input.fill('重置');
  await desktop.waitForFunction(() => document.querySelectorAll('.icon-tile').length === 1);
  await input.press('Tab');
  await input.press('Tab');
  results.interactions.keyboardTileFocus = await desktop.evaluate(() => {
    const active = document.activeElement;
    const style = active ? getComputedStyle(active) : null;
    return {
      activeClass: typeof active?.className === 'string' ? active.className : '',
      ariaLabel: active?.getAttribute('aria-label') ?? null,
      focusVisible: active?.matches(':focus-visible') ?? false,
      outlineWidth: style?.outlineWidth ?? null,
      outlineStyle: style?.outlineStyle ?? null,
      resultCount: document.querySelectorAll('.icon-tile').length,
    };
  });
  await saveScreenshot(desktop, 'search-keyboard-tile-focus');
  await desktop.keyboard.press('Enter');
  await desktop.waitForTimeout(100);
  results.interactions.keyboardCopy = {
    clipboardText: await desktop.evaluate(() => navigator.clipboard.readText()),
    feedback: await desktop.evaluate(() =>
      [...document.querySelectorAll('.el-message, .lx-message, [role="alert"], [role="status"]')]
        .filter((element) => element.getClientRects().length)
        .map((element) => element.textContent.trim()),
    ),
  };

  await input.fill('');
  const deleteTile = desktop.locator('.icon-tile').filter({ hasText: 'delete' });
  await deleteTile.hover();
  await desktop.waitForTimeout(350);
  results.interactions.hover = await desktop.evaluate(() => {
    const tile = [...document.querySelectorAll('.icon-tile')].find((element) =>
      element.querySelector('.icon-tile__name')?.textContent.trim() === 'delete',
    );
    const icon = tile?.querySelector('.lx-icon');
    const tileStyle = tile ? getComputedStyle(tile) : null;
    const iconStyle = icon ? getComputedStyle(icon) : null;
    return {
      tileBorder: tileStyle?.borderColor ?? null,
      tileText: tileStyle?.color ?? null,
      tileShadow: tileStyle?.boxShadow ?? null,
      iconTransform: iconStyle?.transform ?? null,
      iconAnimation: iconStyle?.animationName ?? null,
    };
  });
  await saveScreenshot(desktop, 'hover-delete');

  await desktop.emulateMedia({ reducedMotion: 'reduce' });
  await deleteTile.hover();
  await desktop.waitForTimeout(100);
  results.interactions.reducedMotion = await desktop.evaluate(() => {
    const tile = [...document.querySelectorAll('.icon-tile')].find((element) =>
      element.querySelector('.icon-tile__name')?.textContent.trim() === 'delete',
    );
    const icon = tile?.querySelector('.lx-icon');
    const tileStyle = tile ? getComputedStyle(tile) : null;
    const iconStyle = icon ? getComputedStyle(icon) : null;
    return {
      preferenceActive: matchMedia('(prefers-reduced-motion: reduce)').matches,
      tileTransitionDuration: tileStyle?.transitionDuration ?? null,
      iconTransitionDuration: iconStyle?.transitionDuration ?? null,
      iconAnimation: iconStyle?.animationName ?? null,
      iconTransform: iconStyle?.transform ?? null,
    };
  });
  await saveScreenshot(desktop, 'reduced-motion-hover');
  await desktop.close();
} catch (error) {
  fatalError = error;
  results.error = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
} finally {
  if (context) {
    try {
      await context.close();
    } catch (error) {
      results.contextCloseError = error instanceof Error ? error.message : String(error);
    }
  }
  try {
    await fs.rm(profileDir, { recursive: true, force: true });
    results.temporaryProfileRemoved = true;
  } catch (error) {
    results.temporaryProfileRemoved = false;
    results.profileCleanupError = error instanceof Error ? error.message : String(error);
  }
  const jsonPath = path.join(outputDir, `${runId}-browser-evidence.json`);
  await fs.writeFile(jsonPath, `${JSON.stringify(results, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ jsonPath, ...results }, null, 2));
}

if (fatalError) process.exitCode = 1;
