import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(path.resolve(
  process.cwd(),
  'other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright',
));

const url = process.argv[2] || 'http://127.0.0.1:4174/components/lxicons.html';
const overlayBase = process.argv[3] || 'http://127.0.0.1:8493';
const outDir = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(outDir, 'screenshots');
const browserPath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const consoleEntries = [];
const pageErrors = [];
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await fs.mkdir(screenshotsDir, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: browserPath });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  colorScheme: 'light',
  reducedMotion: 'no-preference',
});
const page = await context.newPage();
page.on('console', (message) => {
  consoleEntries.push({ type: message.type(), text: message.text() });
});
page.on('pageerror', (error) => pageErrors.push(error.message));

async function loadPage(width, height, hud = false, reducedMotion = 'no-preference') {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate((useHud) => {
    document.documentElement.classList.toggle('lx-theme-hud', useHud);
  }, hud);
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await delay(100);
}

async function pageMetrics() {
  return page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const input = document.querySelector('.icon-search');
    const tile = document.querySelector('.icon-tile');
    const label = document.querySelector('.icon-tile__name');
    const rootStyle = getComputedStyle(root);
    const docStyle = getComputedStyle(document.querySelector('.vp-doc'));
    const tileStyle = tile ? getComputedStyle(tile) : null;
    const labelStyle = label ? getComputedStyle(label) : null;
    const names = [...document.querySelectorAll('.icon-tile__name')].map((item) => item.textContent.trim());
    const longestName = names.reduce((longest, name) => name.length > longest.length ? name : longest, '');
    const longestElement = [...document.querySelectorAll('.icon-tile__name')].find((item) => item.textContent.trim() === longestName);
    const longestStyle = longestElement ? getComputedStyle(longestElement) : null;
    return {
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
      visualViewportWidth: visualViewport?.width ?? null,
      documentElementScrollWidth: root.scrollWidth,
      bodyScrollWidth: body.scrollWidth,
      documentClientWidth: root.clientWidth,
      horizontalOverflow: root.scrollWidth > root.clientWidth,
      documentHeight: root.scrollHeight,
      htmlClass: root.className,
      darkMode: root.classList.contains('dark'),
      hudMode: root.classList.contains('lx-theme-hud'),
      rootBackground: rootStyle.backgroundColor,
      docsBackground: docStyle.backgroundColor,
      tileCount: document.querySelectorAll('.icon-tile').length,
      searchValue: input?.value ?? null,
      searchClearBox: (() => {
        const button = document.querySelector('.icon-search__clear');
        if (!button) return null;
        const rect = button.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      })(),
      keyLabel: label ? {
        text: label.textContent.trim(),
        fontSize: labelStyle.fontSize,
        lineHeight: labelStyle.lineHeight,
        fontFamily: labelStyle.fontFamily,
        overflowWrap: labelStyle.overflowWrap,
        color: labelStyle.color,
      } : null,
      keyLabelCount: names.length,
      longestEnglishKey: longestName,
      longestEnglishKeyBox: longestElement ? {
        width: longestElement.getBoundingClientRect().width,
        height: longestElement.getBoundingClientRect().height,
        fontSize: longestStyle.fontSize,
        lineHeight: longestStyle.lineHeight,
        overflowWrap: longestStyle.overflowWrap,
      } : null,
      firstTileStyle: tileStyle ? {
        color: tileStyle.color,
        backgroundColor: tileStyle.backgroundColor,
        borderColor: tileStyle.borderColor,
        transitionDuration: tileStyle.transitionDuration,
      } : null,
    };
  });
}

async function contrastForEmptyState() {
  await page.locator('.icon-search').fill('no-such-lx-icon-20261006');
  await page.locator('.icon-empty').waitFor({ state: 'visible' });
  const result = await page.locator('.icon-empty').evaluate((element) => {
    const parse = (value) => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) return null;
      const values = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
      return { r: values[0], g: values[1], b: values[2], a: values[3] ?? 1 };
    };
    const composite = (foreground, background) => {
      const alpha = foreground.a + background.a * (1 - foreground.a);
      if (!alpha) return { r: 0, g: 0, b: 0, a: 0 };
      return {
        r: (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / alpha,
        g: (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / alpha,
        b: (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / alpha,
        a: alpha,
      };
    };
    const css = (color) => `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
    const linear = (channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (color) => 0.2126 * linear(color.r) + 0.7152 * linear(color.g) + 0.0722 * linear(color.b);
    const foreground = parse(getComputedStyle(element).color);
    const nodes = [];
    for (let node = element; node; node = node.parentElement) {
      nodes.push(node);
    }
    const chain = nodes.map((node) => {
      const style = getComputedStyle(node);
      return {
        selector: node.id ? `#${node.id}` : node.className?.toString().split(' ').filter(Boolean).map((name) => `.${name}`).join('') || node.tagName.toLowerCase(),
        backgroundColor: style.backgroundColor,
      };
    });
    let background = { r: 255, g: 255, b: 255, a: 1 };
    for (const node of nodes.reverse()) {
      const color = parse(getComputedStyle(node).backgroundColor);
      if (color && color.a > 0) background = composite(color, background);
    }
    const fg = composite(foreground, background);
    const l1 = luminance(fg);
    const l2 = luminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const style = getComputedStyle(element);
    return {
      text: element.textContent.trim(),
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      computedForeground: style.color,
      effectiveForeground: css(fg),
      effectiveBackground: css(background),
      backgroundChain: chain,
      contrastRatio: Number(ratio.toFixed(2)),
      normalTextWcagAa: ratio >= 4.5,
      method: 'computed CSS foreground and alpha-composited ancestor background colors',
    };
  });
  await page.locator('.icon-search__clear').click();
  const focusRestored = await page.evaluate(() => document.activeElement === document.querySelector('.icon-search'));
  return { ...result, clearSearchFocusRestored: focusRestored };
}

async function injectDetector(label) {
  const consoleStart = consoleEntries.length;
  const title = `[Human] LxIcon detector evidence - ${label}`;
  const injection = await page.evaluate(async ({ src, nextTitle }) => {
    document.title = nextTitle;
    const script = document.createElement('script');
    script.src = src;
    script.dataset.assessmentB = 'true';
    const loaded = new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 8000);
      script.onload = () => { clearTimeout(timeout); resolve(true); };
      script.onerror = () => { clearTimeout(timeout); resolve(false); };
    });
    document.head.append(script);
    return { loaded: await loaded, scriptSrc: script.src, title: document.title };
  }, { src: `${overlayBase}/detect.js`, nextTitle: title });
  await delay(2500);
  const pageState = await page.evaluate(() => ({
    scriptPresent: Boolean(document.querySelector('script[data-assessment-b="true"]')),
    scriptReadyState: document.querySelector('script[data-assessment-b="true"]')?.readyState ?? null,
    addedElements: [...document.querySelectorAll('[id*="impeccable" i], [class*="impeccable" i], [data-impeccable]')]
      .slice(0, 20)
      .map((element) => ({ tag: element.tagName, id: element.id, className: element.className?.toString?.() ?? '' })),
    bodyChildCount: document.body.children.length,
  }));
  const messages = consoleEntries.slice(consoleStart).filter((entry) => /impeccable|design|detector/i.test(entry.text));
  return { ...injection, pageState, detectorConsoleMessages: messages };
}

const evidence = {
  targetUrl: url,
  detectorUrl: `${overlayBase}/detect.js`,
  browser: { product: 'Chrome', executablePath: browserPath, playwrightVersion: '1.58.0' },
  context: { freshIncognitoContext: true, storageStateProvided: false, serviceWorkers: 'default' },
  hudMethod: 'The page has no HUD toggle; the evidence harness toggles the existing lx-theme-hud root class used by the page CSS.',
  console: consoleEntries,
  pageErrors,
  initialDesktopLight: null,
  searchAndInteraction: {},
  noOverlayWidths: [],
  overlayRuns: [],
};

try {
  await loadPage(1440, 900, false);
  evidence.initialDesktopLight = await pageMetrics();
  evidence.initialDesktopLight.screenshot = 'screenshots/light-desktop-1440-before-overlay.png';
  evidence.initialDesktopLight.overlayScriptPresent = await page.locator('script[data-assessment-b="true"]').count() > 0;
  await page.screenshot({ path: path.join(outDir, evidence.initialDesktopLight.screenshot), fullPage: true, animations: 'disabled' });

  evidence.searchAndInteraction.englishKeyStyle = evidence.initialDesktopLight.keyLabel;
  evidence.searchAndInteraction.longestKey = evidence.initialDesktopLight.longestEnglishKeyBox;

  const input = page.locator('.icon-search');
  await input.fill('undo');
  await page.locator('.icon-tile').first().waitFor({ state: 'visible' });
  evidence.searchAndInteraction.searchUndo = {
    query: 'undo',
    visibleTileCount: await page.locator('.icon-tile').count(),
    matchingKeys: await page.locator('.icon-tile__name').allTextContents(),
  };
  await page.locator('.icon-search__clear').click();
  evidence.searchAndInteraction.clearRestoresFocus = await page.evaluate(() => ({
    value: document.querySelector('.icon-search')?.value,
    activeIsSearch: document.activeElement === document.querySelector('.icon-search'),
  }));
  await page.keyboard.press('Tab');
  evidence.searchAndInteraction.keyboardFocus = await page.evaluate(() => {
    const element = document.activeElement;
    const style = getComputedStyle(element);
    return {
      tag: element.tagName,
      className: element.className,
      ariaLabel: element.getAttribute('aria-label'),
      isIconTile: element.matches('.icon-tile'),
      focusVisible: element.matches(':focus-visible'),
      outline: style.outline,
      outlineOffset: style.outlineOffset,
      borderColor: style.borderColor,
      text: element.innerText,
    };
  });
  await page.screenshot({ path: path.join(screenshotsDir, 'keyboard-focus-after-search-clear.png'), fullPage: false, animations: 'disabled' });

  const firstTile = page.locator('.icon-tile').first();
  await firstTile.evaluate((element) => element.blur());
  await firstTile.hover();
  evidence.searchAndInteraction.hover = await firstTile.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      hovered: element.matches(':hover'),
      color: style.color,
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      boxShadow: style.boxShadow,
      transitionDuration: style.transitionDuration,
    };
  });
  await page.screenshot({ path: path.join(screenshotsDir, 'tile-hover-light-desktop.png'), fullPage: false, animations: 'disabled' });

  evidence.searchAndInteraction.emptyLight = await contrastForEmptyState();
  evidence.searchAndInteraction.emptyLight.screenshot = 'screenshots/empty-state-light-desktop.png';
  await page.screenshot({ path: path.join(screenshotsDir, evidence.searchAndInteraction.emptyLight.screenshot), fullPage: false, animations: 'disabled' });

  await input.fill('');
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  evidence.searchAndInteraction.reducedMotion = await page.evaluate(() => ({
    mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    tileTransitionDuration: getComputedStyle(document.querySelector('.icon-tile')).transitionDuration,
    loadingIcon: (() => {
      const tile = [...document.querySelectorAll('.icon-tile')].find((item) => item.innerText.includes('loading'));
      const icon = tile?.querySelector('.lx-icon');
      if (!icon) return null;
      const style = getComputedStyle(icon);
      return { className: icon.className.toString(), animationName: style.animationName, animationDuration: style.animationDuration, transitionDuration: style.transitionDuration };
    })(),
  }));
  await page.screenshot({ path: path.join(screenshotsDir, 'reduced-motion-light-desktop.png'), fullPage: false, animations: 'disabled' });

  const variants = [
    { name: 'light-desktop-1440', width: 1440, height: 900, hud: false },
    { name: 'hud-desktop-1440', width: 1440, height: 900, hud: true },
    { name: 'light-mobile-375', width: 375, height: 812, hud: false },
    { name: 'hud-mobile-375', width: 375, height: 812, hud: true },
  ];

  for (const variant of variants) {
    await loadPage(variant.width, variant.height, variant.hud);
    const before = await pageMetrics();
    before.variant = variant.name;
    before.screenshot = `screenshots/${variant.name}-before-overlay.png`;
    before.overlayInjected = false;
    evidence.noOverlayWidths.push({
      variant: variant.name,
      viewportWidth: before.viewportWidth,
      documentElementScrollWidth: before.documentElementScrollWidth,
      bodyScrollWidth: before.bodyScrollWidth,
      documentClientWidth: before.documentClientWidth,
      horizontalOverflow: before.horizontalOverflow,
    });
    await page.screenshot({ path: path.join(outDir, before.screenshot), fullPage: true, animations: 'disabled' });

    if (variant.hud && variant.width === 1440) {
      evidence.searchAndInteraction.emptyHud = await contrastForEmptyState();
      evidence.searchAndInteraction.emptyHud.screenshot = 'screenshots/empty-state-hud-desktop.png';
      await page.screenshot({ path: path.join(screenshotsDir, evidence.searchAndInteraction.emptyHud.screenshot), fullPage: false, animations: 'disabled' });
      await input.fill('');
    }

    const injected = await injectDetector(variant.name);
    const after = await pageMetrics();
    const afterScreenshot = `screenshots/${variant.name}-after-overlay.png`;
    await page.screenshot({ path: path.join(outDir, afterScreenshot), fullPage: false, animations: 'disabled' });
    evidence.overlayRuns.push({
      variant: variant.name,
      injected,
      beforeOverlay: {
        documentElementScrollWidth: before.documentElementScrollWidth,
        bodyScrollWidth: before.bodyScrollWidth,
        documentClientWidth: before.documentClientWidth,
        horizontalOverflow: before.horizontalOverflow,
      },
      afterOverlay: {
        documentElementScrollWidth: after.documentElementScrollWidth,
        bodyScrollWidth: after.bodyScrollWidth,
        documentClientWidth: after.documentClientWidth,
        horizontalOverflow: after.horizontalOverflow,
      },
      overlayScreenshot: afterScreenshot,
      consoleMessages: injected.detectorConsoleMessages,
    });
  }

  evidence.console = consoleEntries;
  evidence.pageErrors = pageErrors;
  await fs.writeFile(path.join(outDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2) + '\n', 'utf8');
  process.stdout.write(JSON.stringify(evidence, null, 2) + '\n');
} finally {
  await context.close();
  await browser.close();
}
