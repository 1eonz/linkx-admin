import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const outputDir = path.join(
  projectRoot,
  '.impeccable/critique/wave3-lxicon-2026-10-06/postfix-assessment-a-final',
);
const appRequire = createRequire(path.join(projectRoot, 'other-admin/admin-vue3/package.json'));
const { chromium } = appRequire('@playwright/test');
const target = 'http://127.0.0.1:4174/components/lxicons.html';
const evidence = {
  method: 'fresh isolated Edge/Playwright browser context; read-only Assessment A post-fix verification',
  target,
  detector: 'not run',
  priorAssessments: 'not opened or referenced',
  browser: 'Microsoft Edge via Playwright Chromium API',
  screenshots: [],
  checks: {},
};

fs.mkdirSync(outputDir, { recursive: true });
const out = (name) => path.join(outputDir, name);

async function capture(page, name, fullPage = false) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: out(name), fullPage });
  evidence.screenshots.push({ file: name, fullPage });
}

async function layout(page) {
  return page.evaluate(() => {
    const rect = (element) => {
      if (!element) return null;
      const r = element.getBoundingClientRect();
      return {
        top: Math.round(r.top),
        left: Math.round(r.left),
        right: Math.round(r.right),
        bottom: Math.round(r.bottom),
        width: Math.round(r.width),
        height: Math.round(r.height),
        inViewport: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
      };
    };
    const groups = [...document.querySelectorAll('.icon-group')];
    const p0 = groups.find((group) => group.querySelector('summary')?.innerText.includes('P0 高频核心'));
    const p0Cards = p0 ? [...p0.querySelectorAll('.icon-tile')] : [];
    const visibleP0Cards = p0Cards.filter((card) => {
      const r = card.getBoundingClientRect();
      const style = getComputedStyle(card);
      return p0?.open && style.display !== 'none' && style.visibility !== 'hidden' && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
    });
    const list = document.querySelector('.vp-doc dl');
    const terms = list ? [...list.querySelectorAll('dt')] : [];
    const definitions = list ? [...list.querySelectorAll('dd')] : [];
    const search = document.querySelector('.icon-search');
    return {
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      h1: document.querySelector('.vp-doc h1')?.innerText.trim() ?? null,
      searchPlaceholder: search?.placeholder ?? null,
      groupCount: groups.length,
      openGroups: groups.filter((group) => group.open).map((group) => group.querySelector('summary')?.innerText.trim()),
      p0: {
        present: Boolean(p0),
        open: Boolean(p0?.open),
        cardCount: p0Cards.length,
        visibleInInitialViewport: visibleP0Cards.length,
        firstVisibleCard: visibleP0Cards[0]?.getAttribute('aria-label') ?? null,
        groupRect: rect(p0),
        firstCardRect: rect(visibleP0Cards[0]),
      },
      checklist: {
        definitionListCount: document.querySelectorAll('.vp-doc dl').length,
        tableCount: document.querySelectorAll('.vp-doc table').length,
        rect: rect(list),
        clientWidth: list?.clientWidth ?? null,
        scrollWidth: list?.scrollWidth ?? null,
        terms: terms.map((term) => term.innerText.trim()),
        definitionCount: definitions.length,
        termRects: terms.map((term) => ({ text: term.innerText.trim(), rect: rect(term) })),
        definitionRects: definitions.map((definition) => ({ text: definition.innerText.trim(), rect: rect(definition) })),
      },
      header: {
        nav: rect(document.querySelector('.VPNavBar')),
        brand: rect(document.querySelector('.VPNavBarTitle')),
        mobileMenu: rect(document.querySelector('button[aria-label="mobile navigation"]')),
      },
    };
  });
}

async function alertGeometry(page) {
  return page.evaluate(() => {
    const rect = (element) => {
      if (!element) return null;
      const r = element.getBoundingClientRect();
      return { top: Math.round(r.top), left: Math.round(r.left), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
    };
    const intersects = (a, b) => Boolean(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
    const alert = [...document.querySelectorAll('[role="alert"]')].find((element) => {
      const r = element.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    const nav = document.querySelector('.VPNavBar');
    const brand = document.querySelector('.VPNavBarTitle');
    const menu = document.querySelector('button[aria-label="mobile navigation"]');
    return {
      count: [...document.querySelectorAll('[role="alert"]')].filter((element) => element.getBoundingClientRect().width > 0).length,
      text: alert?.innerText.trim() ?? null,
      alert: rect(alert),
      nav: rect(nav),
      brand: rect(brand),
      mobileMenu: rect(menu),
      overlapsNav: intersects(alert && rect(alert), rect(nav)),
      overlapsBrand: intersects(alert && rect(alert), rect(brand)),
      overlapsMobileMenu: intersects(alert && rect(alert), rect(menu)),
    };
  });
}

async function active(page) {
  return page.evaluate(() => {
    const element = document.activeElement;
    return {
      tag: element?.tagName ?? null,
      label: element?.getAttribute('aria-label') ?? null,
      text: element?.innerText?.trim().slice(0, 70) ?? '',
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
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(target, { waitUntil: 'networkidle' });
    await page.locator('.icon-search').waitFor();
    await page.evaluate(() => document.fonts.ready);

    evidence.context = { createdFresh: true, isolated: true, locale: 'zh-CN', permissions: ['clipboard-read', 'clipboard-write'] };
    evidence.checks.desktop1440Light = await layout(page);
    await capture(page, 'desktop-1440-light.png', true);
    await capture(page, 'desktop-1440-light-top.png');

    const desktopThemeSwitch = page.locator('.VPNavBarAppearance button:visible').first();
    evidence.checks.themeSwitch = { available: await desktopThemeSwitch.count(), initialTitle: await desktopThemeSwitch.getAttribute('title') };
    if (await desktopThemeSwitch.count()) {
      await desktopThemeSwitch.click();
      await page.waitForTimeout(100);
    }
    evidence.checks.desktop1440Dark = await layout(page);
    await capture(page, 'desktop-1440-dark.png');

    await page.setViewportSize({ width: 375, height: 812 });
    evidence.checks.mobile375Dark = await layout(page);
    await capture(page, 'mobile-375-dark.png', true);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('.VPNavBarAppearance button:visible').first().click();
    await page.waitForTimeout(100);
    await page.setViewportSize({ width: 375, height: 812 });
    evidence.checks.mobile375Light = await layout(page);
    await capture(page, 'mobile-375-light.png', true);

    await page.setViewportSize({ width: 320, height: 800 });
    evidence.checks.mobile320Light = await layout(page);
    await capture(page, 'mobile-320-light.png', true);

    const list = page.locator('.vp-doc dl').first();
    if (await list.count()) {
      await list.screenshot({ path: out('mobile-320-checklist-definition-list.png') });
      evidence.screenshots.push({ file: 'mobile-320-checklist-definition-list.png', fullPage: false, element: 'first definition list' });
    }
    await page.setViewportSize({ width: 375, height: 812 });
    const list375 = page.locator('.vp-doc dl').first();
    if (await list375.count()) {
      await list375.screenshot({ path: out('mobile-375-checklist-definition-list.png') });
      evidence.screenshots.push({ file: 'mobile-375-checklist-definition-list.png', fullPage: false, element: 'first definition list' });
    }

    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.icon-search').waitFor();
    const p0Group = page.locator('.icon-group').filter({ hasText: 'P0 高频核心' }).first();
    evidence.checks.p0CardScreenshotState = {
      groupCount: await p0Group.count(),
      open: await p0Group.getAttribute('open') !== null,
      cardCount: await p0Group.locator('.icon-tile').count(),
    };
    if (evidence.checks.p0CardScreenshotState.groupCount && evidence.checks.p0CardScreenshotState.cardCount) {
      if (!evidence.checks.p0CardScreenshotState.open) await p0Group.locator('summary').click();
      await p0Group.locator('.icon-tile').first().click();
      await page.waitForTimeout(120);
      evidence.checks.copySuccess = {
        clipboardText: await page.evaluate(() => navigator.clipboard.readText().catch(() => null)),
        feedback: await alertGeometry(page),
      };
      await capture(page, 'mobile-375-copy-success.png');
    } else {
      evidence.checks.copySuccess = { unavailable: 'P0 group/card selector absent in current page version' };
    }

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
    await page.waitForTimeout(120);
    evidence.checks.copyFailure = await page.evaluate(() => {
      const fallback = document.querySelector('.icon-copy-fallback textarea');
      const activeElement = document.activeElement;
      return {
        fallbackVisible: Boolean(fallback && fallback.getBoundingClientRect().width > 0),
        fallbackMessage: document.querySelector('.icon-copy-fallback')?.innerText.trim() ?? null,
        fallbackValue: fallback?.value ?? null,
        fallbackFocused: activeElement === fallback,
        selectedLength: fallback ? fallback.selectionEnd - fallback.selectionStart : 0,
      };
    });
    evidence.checks.copyFailure.feedback = await alertGeometry(page);
    await capture(page, 'mobile-375-copy-failure.png');

    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.icon-search').waitFor();
    await page.locator('.icon-search').fill('postfix-no-match-xyz');
    evidence.checks.emptyState = await page.evaluate(() => {
      const status = document.querySelector('.icon-empty');
      return {
        visible: Boolean(status && status.getBoundingClientRect().width > 0),
        role: status?.getAttribute('role') ?? null,
        ariaLive: status?.getAttribute('aria-live') ?? null,
        ariaAtomic: status?.getAttribute('aria-atomic') ?? null,
        text: status?.innerText.trim() ?? null,
      };
    });
    await capture(page, 'mobile-375-search-empty.png');

    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.icon-search').waitFor();
    const tabSequence = [];
    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.press('Tab');
      tabSequence.push(await active(page));
    }
    await page.locator('.icon-search').focus();
    await page.keyboard.type('undo');
    await page.keyboard.press('Tab');
    const focusOnClear = await active(page);
    await page.keyboard.press('Enter');
    evidence.checks.keyboard = {
      initialTabSequence: tabSequence,
      clearButtonFocus: focusOnClear,
      valueAfterKeyboardClear: await page.locator('.icon-search').inputValue(),
      focusAfterKeyboardClear: await active(page),
    };
    await page.locator('.icon-search').fill('dashboard');
    await page.locator('.icon-search__clear').focus();
    await page.keyboard.press('Tab');
    let tileTabs = 0;
    while (!(await page.evaluate(() => document.activeElement?.classList.contains('icon-tile'))) && tileTabs < 6) {
      await page.keyboard.press('Tab');
      tileTabs += 1;
    }
    evidence.checks.keyboard.tileFocus = { tabsAfterClear: tileTabs, focused: await active(page) };
    await page.keyboard.press('Enter');
    await page.waitForTimeout(80);
    evidence.checks.keyboard.enterCopy = await page.evaluate(() => navigator.clipboard.readText().catch(() => null));

    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.icon-search').waitFor();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const group = page.locator('.icon-group').filter({ hasText: '侧边栏菜单' }).first();
    const arrow = group.locator('.icon-group-title .lx-icon').first();
    const collapsed = await arrow.evaluate((element) => ({
      transform: getComputedStyle(element).transform,
      transitionDuration: getComputedStyle(element).transitionDuration,
    }));
    if ((await group.getAttribute('open')) === null) await group.locator('summary').click();
    const expanded = await arrow.evaluate((element) => ({
      transform: getComputedStyle(element).transform,
      transitionDuration: getComputedStyle(element).transitionDuration,
    }));
    evidence.checks.reducedMotion = {
      mediaPreferenceActive: await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
      collapsedArrow: collapsed,
      expandedArrow: expanded,
      tileTransitionDuration: await page.locator('.icon-tile').first().evaluate((element) => getComputedStyle(element).transitionDuration),
      expanded: await group.getAttribute('open') !== null,
    };
    await capture(page, 'mobile-375-reduced-motion-expanded.png');
    evidence.checks.pageErrors = pageErrors;
    evidence.completedAt = new Date().toISOString();
    fs.writeFileSync(out('browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
    await context.close();
  } finally {
    await browser.close().catch(() => undefined);
  }
  process.stdout.write(`${JSON.stringify({
    outputDir,
    checks: {
      p0: evidence.checks.mobile375Light?.p0,
      mobile375Layout: evidence.checks.mobile375Light?.checklist,
      mobile320Layout: evidence.checks.mobile320Light?.checklist,
      copySuccess: evidence.checks.copySuccess,
      copyFailure: evidence.checks.copyFailure,
      emptyState: evidence.checks.emptyState,
      keyboard: evidence.checks.keyboard,
      reducedMotion: evidence.checks.reducedMotion,
      pageErrors: evidence.checks.pageErrors,
    },
    screenshots: evidence.screenshots,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
