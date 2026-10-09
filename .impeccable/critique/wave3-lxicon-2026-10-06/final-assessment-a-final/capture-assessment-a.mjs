import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const outputDir = path.join(
  projectRoot,
  '.impeccable/critique/wave3-lxicon-2026-10-06/final-assessment-a-final',
);
const appRequire = createRequire(path.join(projectRoot, 'other-admin/admin-vue3/package.json'));
const { chromium } = appRequire('@playwright/test');
const target = 'http://127.0.0.1:4174/components/lxicons.html';
const liveBrowsers = [];
const result = {
  assessment: 'A: independent design review and live browser inspection',
  target,
  source: 'linkx-fe/docs/components/lxicons.md',
  detector: 'not run by assignment scope',
  context: {
    createdFresh: true,
    browser: 'Microsoft Edge launched through Playwright Chromium API',
    isolatedContext: true,
    locale: 'zh-CN',
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  captures: [],
  observations: {},
};

fs.mkdirSync(outputDir, { recursive: true });

function file(name) {
  return path.join(outputDir, name);
}

async function screenshot(page, name, fullPage = false) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: file(name), fullPage });
  result.captures.push({ file: name, fullPage });
}

async function evaluateLayout(page) {
  return page.evaluate(() => {
    const rect = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const bounds = element.getBoundingClientRect();
      return {
        top: Math.round(bounds.top + window.scrollY),
        left: Math.round(bounds.left + window.scrollX),
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
        inInitialViewport: bounds.bottom > 0 && bounds.top < window.innerHeight,
      };
    };
    const search = document.querySelector('.icon-search');
    const firstGroup = document.querySelector('.icon-group');
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      htmlTheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      pageTitle: document.title,
      h1: document.querySelector('.vp-doc h1')?.innerText.trim() ?? null,
      intro: document.querySelector('.vp-doc h1')?.nextElementSibling?.innerText.trim() ?? null,
      searchPlaceholder: search?.getAttribute('placeholder') ?? null,
      search: rect('.icon-searchbar'),
      firstGroup: rect('.icon-group-title'),
      firstTile: rect('.icon-tile'),
      groupCount: document.querySelectorAll('.icon-group').length,
      initiallyOpenGroups: [...document.querySelectorAll('.icon-group[open]')].length,
      tilesInOpenGroups: [...document.querySelectorAll('.icon-tile')].filter((element) => {
        const bounds = element.getBoundingClientRect();
        return element.closest('.icon-group')?.open && bounds.width > 0 && bounds.height > 0;
      }).length,
    };
  });
}

async function activeElement(page) {
  return page.evaluate(() => {
    const element = document.activeElement;
    return {
      tag: element?.tagName ?? null,
      ariaLabel: element?.getAttribute('aria-label') ?? null,
      text: element?.innerText?.trim().slice(0, 80) ?? '',
      className: typeof element?.className === 'string' ? element.className : '',
      outlineStyle: element ? getComputedStyle(element).outlineStyle : null,
      outlineWidth: element ? getComputedStyle(element).outlineWidth : null,
    };
  });
}

async function visibleAnnouncements(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('[role="alert"], [aria-live="assertive"]')]
      .filter((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0 && getComputedStyle(element).visibility !== 'hidden';
      })
      .map((element) => ({
        role: element.getAttribute('role'),
        live: element.getAttribute('aria-live'),
        text: element.innerText.trim(),
      })),
  );
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  });
  liveBrowsers.push(browser);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'light',
    reducedMotion: 'no-preference',
    locale: 'zh-CN',
  });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4174' });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  page.setDefaultNavigationTimeout(12000);
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(target, { waitUntil: 'networkidle' });
  await page.locator('.icon-search').waitFor();
  await page.evaluate(() => document.fonts.ready);

  result.observations.desktopLight = await evaluateLayout(page);
  await screenshot(page, 'desktop-1440-light.png', true);

  const themeSwitch = page.locator('.VPNavBarAppearance button:visible').first();
  result.observations.themeSwitchInitialTitle = await themeSwitch.getAttribute('title');
  await themeSwitch.click();
  await page.waitForTimeout(150);
  result.observations.desktopDark = await evaluateLayout(page);
  result.observations.themeSwitchDarkTitle = await page.locator('.VPNavBarAppearance button:visible').first().getAttribute('title');
  await screenshot(page, 'desktop-1440-dark.png', true);

  await page.locator('.VPNavBarAppearance button:visible').first().click();
  await page.waitForTimeout(100);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(100);
  result.observations.mobile375Light = await evaluateLayout(page);
  await screenshot(page, 'mobile-375-light.png', true);

  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.waitForTimeout(100);
  result.observations.mobile375Dark = await evaluateLayout(page);
  await screenshot(page, 'mobile-375-dark.png', true);
  await page.evaluate(() => document.documentElement.classList.remove('dark'));
  await page.waitForTimeout(100);

  await page.setViewportSize({ width: 320, height: 800 });
  await page.waitForTimeout(100);
  result.observations.mobile320Light = await evaluateLayout(page);
  await screenshot(page, 'mobile-320-light.png', true);
  await page.setViewportSize({ width: 375, height: 812 });

  const input = page.locator('.icon-search');
  await input.fill('zz-no-icon-matches-this');
  await page.waitForTimeout(120);
  result.observations.emptySearch = await page.evaluate(() => {
    const status = document.querySelector('.icon-empty');
    const bounds = status?.getBoundingClientRect();
    return {
      visible: Boolean(status && bounds && bounds.width > 0 && bounds.height > 0),
      text: status?.innerText.trim() ?? null,
      role: status?.getAttribute('role') ?? null,
      ariaLive: status?.getAttribute('aria-live') ?? null,
      ariaAtomic: status?.getAttribute('aria-atomic') ?? null,
      groupCount: document.querySelectorAll('.icon-group').length,
      clearButtonVisible: Boolean(document.querySelector('.icon-search__clear')),
    };
  });
  await screenshot(page, 'mobile-375-search-empty.png');

  await input.fill('das');
  const firstSummary = page.locator('.icon-group-title').first();
  const beforeCollapse = await page.locator('.icon-group').first().getAttribute('open');
  await firstSummary.click();
  const afterCollapse = await page.locator('.icon-group').first().getAttribute('open');
  await input.fill('dashboard');
  const afterTermChange = await page.locator('.icon-group').first().getAttribute('open');
  result.observations.filterCollapseThenChangeTerm = {
    queryBefore: 'das',
    groupOpenBeforeCollapse: beforeCollapse !== null,
    groupOpenAfterManualCollapse: afterCollapse !== null,
    queryAfter: 'dashboard',
    groupOpenAfterTermChange: afterTermChange !== null,
    matchingTiles: await page.locator('.icon-tile').count(),
  };
  await screenshot(page, 'mobile-375-filter-after-collapse-and-term-change.png');

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.icon-search').waitFor();
  const keyboardSteps = [];
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press('Tab');
    keyboardSteps.push(await activeElement(page));
  }
  result.observations.keyboardTabSequence = keyboardSteps;
  const skipLink = page.locator('a[href="#VPContent"]:visible').first();
  result.observations.skipLink = {
    count: await page.locator('a[href="#VPContent"]').count(),
    visible: await skipLink.isVisible().catch(() => false),
    text: await skipLink.innerText().catch(() => ''),
  };
  await page.locator('.icon-search').focus();
  await page.keyboard.type('undo');
  result.observations.keyboardSearch = {
    query: await page.locator('.icon-search').inputValue(),
    matchCount: await page.locator('.icon-tile').count(),
    inputFocused: (await activeElement(page)).className.includes('icon-search'),
  };
  await page.keyboard.press('Tab');
  result.observations.focusAfterSearch = await activeElement(page);
  await page.keyboard.press('Enter');
  result.observations.keyboardClear = {
    valueAfterActivation: await page.locator('.icon-search').inputValue(),
    focusAfterActivation: await activeElement(page),
  };
  await page.locator('.icon-search').fill('dashboard');
  await page.locator('.icon-search__clear').focus();
  await page.keyboard.press('Tab');
  let keyboardTileTabs = 0;
  while (!(await page.evaluate(() => document.activeElement?.classList.contains('icon-tile'))) && keyboardTileTabs < 8) {
    await page.keyboard.press('Tab');
    keyboardTileTabs += 1;
  }
  result.observations.keyboardTileFocus = {
    tabsAfterClear: keyboardTileTabs,
    focused: await activeElement(page),
    count: await page.locator('.icon-tile').count(),
  };
  await page.keyboard.press('Enter');
  await page.waitForTimeout(120);
  result.observations.keyboardTileCopy = {
    clipboardText: await page.evaluate(() => navigator.clipboard.readText().catch(() => null)),
    announcements: await visibleAnnouncements(page),
  };

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.icon-search').waitFor();
  await page.locator('.icon-search').fill('dashboard');
  await page.locator('.icon-tile').first().click();
  await page.waitForTimeout(200);
  result.observations.copySuccess = {
    clipboardText: await page.evaluate(() => navigator.clipboard.readText().catch(() => null)),
    pageText: (await page.locator('body').innerText()).slice(-800),
    announcements: await visibleAnnouncements(page),
  };
  await screenshot(page, 'mobile-375-copy-success.png');

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.icon-search').waitFor();
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('assessment-forced-clipboard-rejection')) },
    });
  });
  await page.locator('.icon-search').fill('team');
  await page.locator('.icon-tile').first().click();
  await page.waitForTimeout(180);
  result.observations.copyFailure = await page.evaluate(() => {
    const fallback = document.querySelector('.icon-copy-fallback textarea');
    const active = document.activeElement;
    const bounds = fallback?.getBoundingClientRect();
    return {
      fallbackVisible: Boolean(fallback && bounds && bounds.width > 0 && bounds.height > 0),
      fallbackValue: fallback?.value ?? null,
      fallbackFocused: active === fallback,
      selectionLength: fallback ? fallback.selectionEnd - fallback.selectionStart : 0,
      announcements: [...document.querySelectorAll('[role="alert"], [aria-live="assertive"]')]
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden';
        })
        .map((element) => ({
          role: element.getAttribute('role'),
          live: element.getAttribute('aria-live'),
          text: element.innerText.trim(),
        })),
      fallbackMessage: document.querySelector('.icon-copy-fallback')?.innerText.trim() ?? null,
      htmlTheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    };
  });
  await screenshot(page, 'mobile-375-copy-failure.png');

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.icon-search').waitFor();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedMotion = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const chevron = page.locator('.icon-group-title .lx-icon').first();
  const chevronBefore = await chevron.evaluate((element) => ({
    transform: getComputedStyle(element).transform,
    transitionDuration: getComputedStyle(element).transitionDuration,
  }));
  await page.locator('.icon-group-title').first().click();
  const chevronAfter = await chevron.evaluate((element) => ({
    transform: getComputedStyle(element).transform,
    transitionDuration: getComputedStyle(element).transitionDuration,
  }));
  await page.locator('.icon-tile').first().hover();
  result.observations.reducedMotion = {
    mediaPreferenceActive: reducedMotion,
    collapsedChevron: chevronBefore,
    expandedChevron: chevronAfter,
    tileTransitionDuration: await page.locator('.icon-tile').first().evaluate((element) => getComputedStyle(element).transitionDuration),
    expanded: await page.locator('.icon-group').first().getAttribute('open') !== null,
  };
  await screenshot(page, 'mobile-375-reduced-motion-expanded.png');

  result.observations.pageErrors = pageErrors;
  result.completedAt = new Date().toISOString();
  fs.writeFileSync(file('browser-evidence.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  await context.close();
  await browser.close();
  liveBrowsers.splice(liveBrowsers.indexOf(browser), 1);
  process.stdout.write(`${JSON.stringify({
    outputDir,
    captures: result.captures,
    desktopLight: result.observations.desktopLight,
    desktopDark: result.observations.desktopDark,
    mobile375Light: result.observations.mobile375Light,
    mobile320Light: result.observations.mobile320Light,
    emptySearch: result.observations.emptySearch,
    filterCollapseThenChangeTerm: result.observations.filterCollapseThenChangeTerm,
    keyboardSearch: result.observations.keyboardSearch,
    keyboardClear: result.observations.keyboardClear,
    keyboardTileFocus: result.observations.keyboardTileFocus,
    copySuccess: result.observations.copySuccess,
    copyFailure: result.observations.copyFailure,
    reducedMotion: result.observations.reducedMotion,
    pageErrors,
  }, null, 2)}\n`);
}

main().catch(async (error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  await Promise.all(liveBrowsers.map((browser) => browser.close().catch(() => undefined)));
  process.exit(1);
});
