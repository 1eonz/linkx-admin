import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const { chromium } = require('./other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright');
const url = 'http://127.0.0.1:4174/components/lxicons.html';
const artifactDir = path.resolve(
  process.cwd(),
  '.impeccable/critique/wave3-lxicon-2026-10-06/postfix-assessment-a-rerun',
);
const runId = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const profileDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lxicon-assessment-a-'));
const output = {
  runId,
  url,
  assessment: 'A-only visual and browser review',
  browser: 'System Chrome via isolated Playwright persistent context',
  screenshots: {},
  states: {},
  interactions: {},
  consoleErrors: [],
  pageErrors: [],
};
let context;
let failure;

async function measure(page, label) {
  return page.evaluate((state) => {
    const doc = document.documentElement;
    const catalog = document.querySelector('.icon-catalog');
    const search = document.querySelector('.icon-search');
    const grid = document.querySelector('.icon-grid');
    const tile = document.querySelector('.icon-tile');
    const sidebar = document.querySelector('.VPSidebar');
    const rect = (element) => {
      if (!element) return null;
      const value = element.getBoundingClientRect();
      return {
        x: Math.round(value.x),
        y: Math.round(value.y),
        width: Math.round(value.width),
        height: Math.round(value.height),
        right: Math.round(value.right),
      };
    };
    const overflowCandidates = [...document.querySelectorAll('body *')]
      .filter((element) => {
        const value = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return (
          value.width > 0 &&
          value.right > doc.clientWidth + 1 &&
          value.left < doc.clientWidth &&
          style.position !== 'fixed' &&
          style.visibility !== 'hidden'
        );
      })
      .slice(0, 8)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === 'string' ? element.className : '',
        right: Math.round(element.getBoundingClientRect().right),
        width: Math.round(element.getBoundingClientRect().width),
      }));
    return {
      label: state,
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        clientWidth: doc.clientWidth,
        scrollWidth: doc.scrollWidth,
        scrollHeight: doc.scrollHeight,
        horizontalOverflow: doc.scrollWidth > doc.clientWidth,
      },
      htmlClasses: doc.className,
      hudPageToken: getComputedStyle(doc).getPropertyValue('--lx-bg-page').trim(),
      catalogBackground: catalog ? getComputedStyle(catalog).backgroundColor : null,
      pageBackground: getComputedStyle(document.body).backgroundColor,
      catalogRect: rect(catalog),
      searchRect: rect(search),
      gridRect: rect(grid),
      gridColumns: grid ? getComputedStyle(grid).gridTemplateColumns : null,
      firstTileRect: rect(tile),
      mobileNavigation: {
        sidebarRect: rect(sidebar),
        sidebarTransform: sidebar ? getComputedStyle(sidebar).transform : null,
        sidebarVisibility: sidebar ? getComputedStyle(sidebar).visibility : null,
        hamburgerExpanded: document.querySelector('.VPNavBarHamburger')?.getAttribute('aria-expanded') ?? null,
      },
      tileCount: document.querySelectorAll('.icon-tile').length,
      groupHeadings: [...document.querySelectorAll('.icon-group-title')].map((element) =>
        element.textContent.trim(),
      ),
      overflowCandidates,
    };
  }, label);
}

async function screenshot(page, name) {
  const fileName = `${runId}-${name}.png`;
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: true });
  output.screenshots[name] = fileName;
}

try {
  await fs.mkdir(artifactDir, { recursive: true });
  context = await chromium.launchPersistentContext(profileDir, {
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'light',
    reducedMotion: 'no-preference',
    locale: 'zh-CN',
  });
  const page = context.pages()[0] ?? (await context.newPage());
  page.on('console', (message) => {
    if (message.type() === 'error') output.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => output.pageErrors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) {
      output.httpErrors ??= [];
      output.httpErrors.push({ status: response.status(), url: response.url() });
    }
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.classList.remove('dark', 'lx-theme-hud'));
  await page.waitForTimeout(100);

  output.states.lightDesktop = await measure(page, 'light desktop 1440x1000');
  await screenshot(page, 'desktop-light');
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 375, height: 812 });
  mobilePage.on('console', (message) => {
    if (message.type() === 'error') output.consoleErrors.push(message.text());
  });
  mobilePage.on('pageerror', (error) => output.pageErrors.push(error.message));
  mobilePage.on('response', (response) => {
    if (response.status() >= 400) {
      output.httpErrors ??= [];
      output.httpErrors.push({ status: response.status(), url: response.url() });
    }
  });
  await mobilePage.goto(url, { waitUntil: 'networkidle' });
  await mobilePage.evaluate(() => document.documentElement.classList.remove('dark', 'lx-theme-hud'));
  await mobilePage.waitForTimeout(100);
  output.states.lightMobile = await measure(mobilePage, 'light mobile 375x812');
  await screenshot(mobilePage, 'mobile-375-light');

  await page.setViewportSize({ width: 1440, height: 1000 });
  const themeToggle = page.locator('button.VPSwitchAppearance:visible').first();
  await themeToggle.click();
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
  await page.evaluate(() => document.documentElement.classList.add('lx-theme-hud'));
  await page.waitForTimeout(100);
  output.states.hudDesktop = await measure(page, 'HUD desktop 1440x1000');
  await screenshot(page, 'desktop-hud');
  await mobilePage.evaluate(() =>
    document.documentElement.classList.add('dark', 'lx-theme-hud'),
  );
  await mobilePage.waitForTimeout(100);
  output.states.hudMobile = await measure(mobilePage, 'HUD mobile 375x812');
  await screenshot(mobilePage, 'mobile-375-hud');

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => document.documentElement.classList.remove('dark', 'lx-theme-hud'));
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: new URL(url).origin,
  });
  const search = page.locator('.icon-search');
  await search.fill('重置');
  await page.waitForFunction(() => document.querySelectorAll('.icon-tile').length === 1);
  const searchResults = await page.locator('.icon-tile').allTextContents();
  await search.press('Tab');
  output.interactions.keyboardFocus = await page.evaluate(() => {
    const active = document.activeElement;
    const style = active ? getComputedStyle(active) : null;
    return {
      tag: active?.tagName.toLowerCase() ?? null,
      className: typeof active?.className === 'string' ? active.className : '',
      ariaLabel: active?.getAttribute('aria-label') ?? null,
      outlineStyle: style?.outlineStyle ?? null,
      outlineWidth: style?.outlineWidth ?? null,
      outlineColor: style?.outlineColor ?? null,
      resultCount: document.querySelectorAll('.icon-tile').length,
    };
  });
  await screenshot(page, 'chinese-search-keyboard-focus');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(120);
  output.interactions.chineseSearch = {
    query: '重置',
    searchResults: searchResults.map((value) => value.trim().replaceAll('\n', ' ')),
    clipboardText: await page.evaluate(() => navigator.clipboard.readText()),
    feedback: await page.evaluate(() =>
      [...document.querySelectorAll('.el-message, .lx-message, .el-notification, [role="alert"], [role="status"]')]
        .filter((element) => element.getClientRects().length)
        .map((element) => element.textContent.trim()),
    ),
  };

  await search.fill('不存在的图标');
  await page.waitForFunction(() => Boolean(document.querySelector('.icon-empty')));
  output.interactions.emptyState = await page.evaluate(() => ({
    message: document.querySelector('.icon-empty')?.textContent.trim() ?? null,
    groups: document.querySelectorAll('.icon-group-title').length,
    tiles: document.querySelectorAll('.icon-tile').length,
  }));
  await screenshot(page, 'empty-state');

  await search.fill('');
  await page.waitForFunction(() => document.querySelectorAll('.icon-tile').length === 96);
  const deleteIcon = page.locator('.icon-tile').filter({ hasText: 'delete' }).locator('svg.lx-icon');
  output.interactions.motion = {
    normal: await deleteIcon.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        transitionDuration: style.transitionDuration,
        transitionProperty: style.transitionProperty,
        animationName: style.animationName,
      };
    }),
  };
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.icon-tile').filter({ hasText: 'delete' }).hover();
  await page.waitForTimeout(80);
  output.interactions.motion.reduced = await deleteIcon.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      transitionDuration: style.transitionDuration,
      transitionProperty: style.transitionProperty,
      animationName: style.animationName,
      transform: style.transform,
    };
  });
  await screenshot(page, 'reduced-motion');
  output.states.reducedMotionDesktop = await measure(page, 'reduced motion desktop 1440x1000');
} catch (error) {
  failure = error;
  output.error = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
} finally {
  if (context) {
    try {
      await context.close();
    } catch (error) {
      output.browserCloseError = error instanceof Error ? error.message : String(error);
    }
  }
  try {
    await fs.rm(profileDir, { recursive: true, force: true });
    output.temporaryProfileRemoved = true;
  } catch (error) {
    output.temporaryProfileRemoved = false;
    output.profileCleanupError = error instanceof Error ? error.message : String(error);
  }
  const outputPath = path.join(artifactDir, `${runId}-browser-assessment.json`);
  await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ outputPath, ...output }, null, 2));
}

if (failure) process.exitCode = 1;
