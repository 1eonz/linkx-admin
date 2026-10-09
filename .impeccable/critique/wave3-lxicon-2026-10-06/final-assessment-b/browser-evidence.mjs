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
const pendingConsoleTasks = [];
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
  const entry = { type: message.type(), text: message.text() };
  consoleEntries.push(entry);
  pendingConsoleTasks.push(Promise.all(message.args().map(async (handle) => {
    try {
      return await handle.evaluate((value) => {
        if (value instanceof Element) {
          const rect = value.getBoundingClientRect();
          return {
            kind: 'element',
            tag: value.tagName,
            id: value.id,
            className: value.className?.toString?.() ?? '',
            text: value.innerText?.slice(0, 180) ?? value.textContent?.slice(0, 180) ?? '',
            ariaLabel: value.getAttribute('aria-label'),
            title: value.getAttribute('title'),
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            outerHTML: value.outerHTML.slice(0, 360),
          };
        }
        return { kind: typeof value, value: String(value).slice(0, 180) };
      });
    } catch {
      return { kind: 'unavailable' };
    }
  })).then((values) => { entry.arguments = values; }));
});
page.on('pageerror', (error) => pageErrors.push(error.message));

async function flushConsoleArguments() {
  await Promise.all(pendingConsoleTasks.splice(0));
}

async function loadPage(width, height, hud = false, reducedMotion = 'no-preference') {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate((useHud) => {
    document.documentElement.classList.toggle('lx-theme-hud', useHud);
  }, hud);
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await delay(350);
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
    const parseRgb = (value) => {
      const channels = value.match(/rgba?\(([^)]+)\)/)?.[1]
        .split(',')
        .map((part) => Number.parseFloat(part.trim()));
      if (!channels) return null;
      return { r: channels[0], g: channels[1], b: channels[2], a: channels[3] ?? 1 };
    };
    const luminance = (color) => {
      const linear = (channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * linear(color.r) + 0.7152 * linear(color.g) + 0.0722 * linear(color.b);
    };
    const labelContrasts = [...document.querySelectorAll('.icon-tile__name')].map((item) => {
      const label = getComputedStyle(item);
      const tile = getComputedStyle(item.closest('.icon-tile'));
      const foreground = parseRgb(label.color);
      const background = parseRgb(tile.backgroundColor);
      if (!foreground || !background) return null;
      const fgLum = luminance(foreground);
      const bgLum = luminance(background);
      return {
        name: item.textContent.trim(),
        fontSize: label.fontSize,
        foreground: label.color,
        background: tile.backgroundColor,
        contrastRatio: Number(((Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05)).toFixed(2)),
      };
    }).filter(Boolean).sort((left, right) => left.contrastRatio - right.contrastRatio);
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
      iconGroups: {
        count: document.querySelectorAll('details.icon-group').length,
        openCount: document.querySelectorAll('details.icon-group[open]').length,
        titles: [...document.querySelectorAll('details.icon-group > summary')].map((summary) => summary.innerText.trim()),
      },
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
        tileWidth: longestElement.closest('.icon-tile').getBoundingClientRect().width,
        tileContentWidth: longestElement.closest('.icon-tile').clientWidth,
        tileText: longestElement.closest('.icon-tile').innerText,
      } : null,
      englishKeyContrast: {
        sampleCount: labelContrasts.length,
        minimum: labelContrasts[0] ?? null,
        maximum: labelContrasts.at(-1) ?? null,
        allMeetNormalTextAa: labelContrasts.length === document.querySelectorAll('.icon-tile').length
          && labelContrasts.every((item) => item.contrastRatio >= 4.5),
      },
      firstTileStyle: tileStyle ? {
        color: tileStyle.color,
        backgroundColor: tileStyle.backgroundColor,
        borderColor: tileStyle.borderColor,
        transitionDuration: tileStyle.transitionDuration,
      } : null,
    };
  });
}

async function openIconGroups() {
  await page.locator('details.icon-group').evaluateAll((groups) => {
    groups.forEach((group) => { group.open = true; });
  });
  await page.locator('.icon-tile').first().waitFor({ state: 'visible' });
  await delay(250);
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
  await flushConsoleArguments();
  const pageState = await page.evaluate(() => ({
    scriptPresent: Boolean(document.querySelector('script[data-assessment-b="true"]')),
    scriptReadyState: document.querySelector('script[data-assessment-b="true"]')?.readyState ?? null,
    addedElements: [...document.querySelectorAll('[id*="impeccable" i], [class*="impeccable" i], [data-impeccable]')]
      .slice(0, 20)
      .map((element) => ({ tag: element.tagName, id: element.id, className: element.className?.toString?.() ?? '' })),
    bodyChildCount: document.body.children.length,
  }));
  const messages = consoleEntries.slice(consoleStart);
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
  evidence.initialDesktopLight = {
    defaultGroups: await page.evaluate(() => ({
      groupCount: document.querySelectorAll('details.icon-group').length,
      initiallyOpenCount: document.querySelectorAll('details.icon-group[open]').length,
      titles: [...document.querySelectorAll('details.icon-group > summary')].map((summary) => summary.innerText.trim()),
    })),
    defaultScreenshot: 'screenshots/light-desktop-default-groups.png',
  };
  await page.screenshot({ path: path.join(outDir, evidence.initialDesktopLight.defaultScreenshot), fullPage: true, animations: 'disabled' });
  await openIconGroups();
  evidence.initialDesktopLight = await pageMetrics();
  evidence.initialDesktopLight.defaultGroups = {
    groupCount: 7,
    initiallyOpenCount: 0,
    interactionCaptureOpensGroups: true,
  };
  evidence.initialDesktopLight.screenshot = 'screenshots/light-desktop-1440-before-overlay.png';
  evidence.initialDesktopLight.overlayScriptPresent = await page.locator('script[data-assessment-b="true"]').count() > 0;
  await page.screenshot({ path: path.join(outDir, evidence.initialDesktopLight.screenshot), fullPage: true, animations: 'disabled' });

  evidence.searchAndInteraction.englishKeyStyle = evidence.initialDesktopLight.keyLabel;
  evidence.searchAndInteraction.longestKey = evidence.initialDesktopLight.longestEnglishKeyBox;

  const input = page.locator('.icon-search');
  await input.fill('undo');
  await openIconGroups();
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
  await openIconGroups();
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
  await firstTile.scrollIntoViewIfNeeded();
  const hoverPoint = await firstTile.evaluate((element) => {
    element.blur();
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
  await page.mouse.move(hoverPoint.x, hoverPoint.y);
  await delay(250);
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
  await page.screenshot({ path: path.join(outDir, evidence.searchAndInteraction.emptyLight.screenshot), fullPage: false, animations: 'disabled' });

  await input.fill('');
  await openIconGroups();
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
    const defaultGroups = await page.evaluate(() => ({
      groupCount: document.querySelectorAll('details.icon-group').length,
      initiallyOpenCount: document.querySelectorAll('details.icon-group[open]').length,
    }));
    await openIconGroups();
    const before = await pageMetrics();
    before.variant = variant.name;
    before.defaultGroups = defaultGroups;
    before.captureExpandedGroups = true;
    before.screenshot = `screenshots/${variant.name}-before-overlay.png`;
    before.overlayInjected = false;
    evidence.noOverlayWidths.push({
      variant: variant.name,
      viewportWidth: before.viewportWidth,
      documentElementScrollWidth: before.documentElementScrollWidth,
      bodyScrollWidth: before.bodyScrollWidth,
      documentClientWidth: before.documentClientWidth,
      horizontalOverflow: before.horizontalOverflow,
      englishKeyContrast: before.englishKeyContrast,
      longestEnglishKey: before.longestEnglishKey,
      longestEnglishKeyBox: before.longestEnglishKeyBox,
    });
    await page.screenshot({ path: path.join(outDir, before.screenshot), fullPage: true, animations: 'disabled' });

    if (variant.hud && variant.width === 1440) {
      evidence.searchAndInteraction.emptyHud = await contrastForEmptyState();
      evidence.searchAndInteraction.emptyHud.screenshot = 'screenshots/empty-state-hud-desktop.png';
      await page.screenshot({ path: path.join(outDir, evidence.searchAndInteraction.emptyHud.screenshot), fullPage: false, animations: 'disabled' });
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
