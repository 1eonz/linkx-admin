import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, '.impeccable/critique/wave3-lxicon-2026-10-06/assessment-a-postfix-final');
const appRequire = createRequire(path.join(projectRoot, 'other-admin/admin-vue3/package.json'));
const { chromium } = appRequire('@playwright/test');
const target = 'http://127.0.0.1:4174/components/lxicons.html';
const evidence = {
  method: 'independent Assessment A; fresh isolated Edge/Playwright browser context',
  target,
  source: 'linkx-fe/docs/components/lxicons.md',
  detector: 'not run by request',
  AssessmentB: 'not opened',
  codeReview: 'not opened',
  captures: [],
  checks: {},
};

fs.mkdirSync(outputDir, { recursive: true });
const out = (name) => path.join(outputDir, name);

async function capture(page, name, fullPage = false) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: out(name), fullPage });
  evidence.captures.push({ file: name, fullPage });
}

async function pageSnapshot(page) {
  return page.evaluate(() => {
    const rect = (element) => {
      if (!element) return null;
      const bounds = element.getBoundingClientRect();
      return {
        top: Math.round(bounds.top),
        left: Math.round(bounds.left),
        right: Math.round(bounds.right),
        bottom: Math.round(bounds.bottom),
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
        visible: bounds.width > 0 && bounds.height > 0 && getComputedStyle(element).visibility !== 'hidden',
      };
    };
    const groups = [...document.querySelectorAll('.icon-group')];
    const p0 = groups.find((group) => group.querySelector('summary')?.innerText.includes('P0 高频核心'));
    const p0Cards = p0 ? [...p0.querySelectorAll('.icon-tile')] : [];
    const visibleP0Cards = p0Cards.filter((card) => {
      const bounds = card.getBoundingClientRect();
      return p0?.open && bounds.width > 0 && bounds.height > 0 && bounds.bottom > 0 && bounds.top < innerHeight;
    });
    const searchStatus = document.querySelector('.icon-search-status');
    const copyFeedback = document.querySelector('.icon-copy-feedback');
    const aliasHeading = [...document.querySelectorAll('.vp-doc h2')].find((heading) => heading.innerText.includes('兼容别名'));
    const aliasTable = aliasHeading?.nextElementSibling?.tagName === 'TABLE' ? aliasHeading.nextElementSibling : document.querySelector('.vp-doc table:last-of-type');
    const aliasRows = aliasTable ? [...aliasTable.querySelectorAll('tr')] : [];
    return {
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight },
      pageWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      heading: document.querySelector('.vp-doc h1')?.innerText.trim() ?? null,
      intro: document.querySelector('.vp-doc h1')?.nextElementSibling?.innerText.trim() ?? null,
      search: {
        placeholder: document.querySelector('.icon-search')?.getAttribute('placeholder') ?? null,
        rect: rect(document.querySelector('.icon-searchbar')),
      },
      groups: {
        count: groups.length,
        open: groups.filter((group) => group.open).map((group) => group.querySelector('summary')?.innerText.trim()),
        p0: {
          open: Boolean(p0?.open),
          cardCount: p0Cards.length,
          visibleCardsAtInitialViewport: visibleP0Cards.length,
          firstVisibleCard: visibleP0Cards[0]?.getAttribute('aria-label') ?? null,
        },
      },
      searchStatus: searchStatus
        ? {
            exists: true,
            text: searchStatus.textContent.trim(),
            role: searchStatus.getAttribute('role'),
            ariaLive: searchStatus.getAttribute('aria-live'),
            ariaAtomic: searchStatus.getAttribute('aria-atomic'),
          }
        : { exists: false },
      aliasTable: aliasTable
        ? {
            rect: rect(aliasTable),
            clientWidth: aliasTable.clientWidth,
            scrollWidth: aliasTable.scrollWidth,
            rows: aliasRows.map((row) => [...row.querySelectorAll('th,td')].map((cell) => ({ text: cell.innerText.trim(), rect: rect(cell) }))),
          }
        : { exists: false },
    };
  });
}

async function feedbackState(page) {
  return page.evaluate(() => {
    const getRect = (element) => {
      if (!element) return null;
      const r = element.getBoundingClientRect();
      return { top: Math.round(r.top), left: Math.round(r.left), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
    };
    const intersects = (a, b) => Boolean(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
    const feedback = document.querySelector('.icon-copy-feedback');
    const fallback = document.querySelector('.icon-copy-fallback');
    const textarea = fallback?.querySelector('textarea');
    const nav = document.querySelector('.VPNavBar');
    const brand = document.querySelector('.VPNavBarTitle');
    const mobileMenu = document.querySelector('button[aria-label="mobile navigation"]');
    return {
      message: feedback?.innerText.trim() ?? null,
      role: feedback?.getAttribute('role') ?? null,
      ariaLive: feedback?.getAttribute('aria-live') ?? null,
      ariaAtomic: feedback?.getAttribute('aria-atomic') ?? null,
      feedbackRect: getRect(feedback),
      fallback: fallback
        ? {
            text: fallback.innerText.trim(),
            role: fallback.getAttribute('role'),
            ariaLive: fallback.getAttribute('aria-live'),
            textareaValue: textarea?.value ?? null,
            focused: document.activeElement === textarea,
            selectedLength: textarea ? textarea.selectionEnd - textarea.selectionStart : 0,
            rect: getRect(fallback),
          }
        : null,
      navRect: getRect(nav),
      brandRect: getRect(brand),
      mobileMenuRect: getRect(mobileMenu),
      overlapsNav: intersects(getRect(feedback), getRect(nav)),
      overlapsBrand: intersects(getRect(feedback), getRect(brand)),
      overlapsMobileMenu: intersects(getRect(feedback), getRect(mobileMenu)),
    };
  });
}

async function activeElement(page) {
  return page.evaluate(() => {
    const element = document.activeElement;
    return {
      tag: element?.tagName ?? null,
      label: element?.getAttribute('aria-label') ?? null,
      text: element?.innerText?.trim().slice(0, 80) ?? '',
      className: typeof element?.className === 'string' ? element.className : '',
      outlineStyle: element ? getComputedStyle(element).outlineStyle : null,
      outlineWidth: element ? getComputedStyle(element).outlineWidth : null,
    };
  });
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  });
  try {
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
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(target, { waitUntil: 'networkidle' });
    await page.locator('.icon-search').waitFor();
    await page.evaluate(() => document.fonts.ready);

    evidence.context = { fresh: true, isolated: true, browser: 'Microsoft Edge via Playwright', permissions: ['clipboard-read', 'clipboard-write'], viewport: { width: 1440, height: 1000 } };
    evidence.checks.desktop1440Light = await pageSnapshot(page);
    await capture(page, 'desktop-1440-light.png', true);

    const themeSwitch = page.locator('.VPNavBarAppearance button:visible').first();
    evidence.checks.themeSwitch = { count: await themeSwitch.count(), initialTitle: await themeSwitch.getAttribute('title') };
    if (await themeSwitch.count()) await themeSwitch.click();
    await page.waitForTimeout(100);
    evidence.checks.desktop1440Dark = await pageSnapshot(page);
    await capture(page, 'desktop-1440-dark.png', true);
    await themeSwitch.click();
    await page.waitForTimeout(100);

    await page.setViewportSize({ width: 375, height: 812 });
    evidence.checks.mobile375Light = await pageSnapshot(page);
    await capture(page, 'mobile-375-light.png', true);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await themeSwitch.click();
    await page.waitForTimeout(100);
    await page.setViewportSize({ width: 375, height: 812 });
    evidence.checks.mobile375Dark = await pageSnapshot(page);
    await capture(page, 'mobile-375-dark.png', true);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await themeSwitch.click();
    await page.waitForTimeout(100);
    await page.setViewportSize({ width: 320, height: 800 });
    evidence.checks.mobile320Light = await pageSnapshot(page);
    await capture(page, 'mobile-320-light.png', true);
    const aliasTable = page.locator('.vp-doc table').last();
    await aliasTable.screenshot({ path: out('mobile-320-alias-table.png') });
    evidence.captures.push({ file: 'mobile-320-alias-table.png', fullPage: false, element: 'compatibility alias table' });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.icon-search').waitFor();
    const p0 = page.locator('.icon-group').filter({ hasText: 'P0 高频核心' }).first();
    evidence.checks.copySuccessSetup = { p0Count: await p0.count(), initiallyOpen: await p0.getAttribute('open') !== null, cards: await p0.locator('.icon-tile').count() };
    if ((await p0.getAttribute('open')) === null) await p0.locator('summary').click();
    const successTile = p0.locator('.icon-tile').first();
    await successTile.click();
    await page.waitForTimeout(100);
    evidence.checks.copySuccess = {
      tile: await successTile.getAttribute('aria-label'),
      clipboardText: await page.evaluate(() => navigator.clipboard.readText().catch(() => null)),
      feedback: await feedbackState(page),
    };
    await capture(page, 'mobile-375-copy-success.png');

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
    await page.waitForTimeout(100);
    evidence.checks.copyFailure = await feedbackState(page);
    await capture(page, 'mobile-375-copy-failure.png');

    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.icon-search').waitFor();
    evidence.checks.emptyBefore = await pageSnapshot(page);
    await page.locator('.icon-search').fill('no-icon-match-this-final-review');
    await page.waitForTimeout(100);
    evidence.checks.emptyAfter = await page.evaluate(() => {
      const status = document.querySelector('.icon-search-status');
      const visual = document.querySelector('.icon-empty');
      return {
        query: document.querySelector('.icon-search')?.value ?? null,
        visibleGroupCount: document.querySelectorAll('.icon-group').length,
        status: status
          ? { exists: true, text: status.textContent.trim(), role: status.getAttribute('role'), ariaLive: status.getAttribute('aria-live'), ariaAtomic: status.getAttribute('aria-atomic') }
          : { exists: false },
        visualCopy: visual
          ? { exists: true, text: visual.textContent.trim(), ariaHidden: visual.getAttribute('aria-hidden'), visible: visual.getBoundingClientRect().width > 0 }
          : { exists: false },
      };
    });
    await capture(page, 'mobile-375-empty-search.png');

    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.icon-search').waitFor();
    const tabSequence = [];
    for (let i = 0; i < 9; i += 1) {
      await page.keyboard.press('Tab');
      tabSequence.push(await activeElement(page));
    }
    await page.locator('.icon-search').focus();
    await page.keyboard.type('undo');
    await page.keyboard.press('Tab');
    const clearFocus = await activeElement(page);
    await page.keyboard.press('Enter');
    evidence.checks.keyboard = {
      initialTabSequence: tabSequence,
      clearFocus,
      valueAfterClear: await page.locator('.icon-search').inputValue(),
      focusAfterClear: await activeElement(page),
    };
    await page.locator('.icon-search').fill('dashboard');
    await page.locator('.icon-search__clear').focus();
    await page.keyboard.press('Tab');
    let tabsAfterClear = 0;
    while (!(await page.evaluate(() => document.activeElement?.classList.contains('icon-tile'))) && tabsAfterClear < 6) {
      await page.keyboard.press('Tab');
      tabsAfterClear += 1;
    }
    evidence.checks.keyboard.tileFocus = { tabsAfterClear, focused: await activeElement(page) };
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    evidence.checks.keyboard.enterCopy = await page.evaluate(() => navigator.clipboard.readText().catch(() => null));

    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.icon-search').waitFor();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const loadingCard = page.locator('.icon-tile').filter({ hasText: 'loading' }).first();
    const loadingIcon = loadingCard.locator('.lx-icon');
    const loadingIdle = await loadingIcon.evaluate((element) => ({
      className: element.getAttribute('class'),
      dataMotion: element.getAttribute('data-lx-motion'),
      animationName: getComputedStyle(element).animationName,
      animationDuration: getComputedStyle(element).animationDuration,
      transform: getComputedStyle(element).transform,
    }));
    await loadingCard.hover();
    await page.waitForTimeout(60);
    const loadingHover = await loadingIcon.evaluate((element) => ({
      className: element.getAttribute('class'),
      animationName: getComputedStyle(element).animationName,
      animationDuration: getComputedStyle(element).animationDuration,
      transform: getComputedStyle(element).transform,
    }));
    evidence.checks.loadingHover = { idle: loadingIdle, hover: loadingHover };

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reduceActive = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    const group = page.locator('.icon-group').filter({ hasText: '侧边栏菜单' }).first();
    const chevron = group.locator('.icon-group-title .lx-icon').first();
    const arrowCollapsed = await chevron.evaluate((element) => ({
      transform: getComputedStyle(element).transform,
      transitionDuration: getComputedStyle(element).transitionDuration,
    }));
    if ((await group.getAttribute('open')) === null) await group.locator('summary').click();
    const arrowExpanded = await chevron.evaluate((element) => ({
      transform: getComputedStyle(element).transform,
      transitionDuration: getComputedStyle(element).transitionDuration,
    }));
    const loadingReduced = await loadingIcon.evaluate((element) => ({
      animationName: getComputedStyle(element).animationName,
      animationDuration: getComputedStyle(element).animationDuration,
      transform: getComputedStyle(element).transform,
    }));
    evidence.checks.reducedMotion = {
      preferenceActive: reduceActive,
      collapsedArrow: arrowCollapsed,
      expandedArrow: arrowExpanded,
      loadingIcon: loadingReduced,
      tileTransitionDuration: await page.locator('.icon-tile').first().evaluate((element) => getComputedStyle(element).transitionDuration),
    };
    await capture(page, 'mobile-375-reduced-motion.png');
    evidence.checks.pageErrors = errors;
    evidence.completedAt = new Date().toISOString();
    fs.writeFileSync(out('browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
    await context.close();
  } finally {
    await browser.close().catch(() => undefined);
  }
  process.stdout.write(`${JSON.stringify({
    outputDir,
    checks: {
      desktop: evidence.checks.desktop1440Light,
      mobile375: evidence.checks.mobile375Light,
      mobile320: evidence.checks.mobile320Light,
      copySuccess: evidence.checks.copySuccess,
      copyFailure: evidence.checks.copyFailure,
      emptyBefore: evidence.checks.emptyBefore?.searchStatus,
      emptyAfter: evidence.checks.emptyAfter,
      keyboard: evidence.checks.keyboard,
      loadingHover: evidence.checks.loadingHover,
      reducedMotion: evidence.checks.reducedMotion,
      pageErrors: evidence.checks.pageErrors,
    },
    captures: evidence.captures,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
