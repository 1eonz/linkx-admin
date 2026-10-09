import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dir = path.join(root, '.impeccable/critique/wave3-lxicon-2026-10-06/assessment-a-postfix-final/postfix-recheck-2026-10-06');
const appRequire = createRequire(path.join(root, 'other-admin/admin-vue3/package.json'));
const { chromium } = appRequire('@playwright/test');
const url = 'http://127.0.0.1:4174/components/lxicons.html';
const sourceDocument = path.join(root, 'linkx-fe/docs/components/lxicons.md');
const sourceDocumentSha256 = createHash('sha256')
  .update(fs.readFileSync(sourceDocument))
  .digest('hex')
  .toUpperCase();
const evidence = {
  method: 'bounded read-only post-fix Assessment A; fresh isolated Edge/Playwright contexts per viewport',
  target: url,
  sourceDocument: {
    path: 'linkx-fe/docs/components/lxicons.md',
    sha256: sourceDocumentSha256,
  },
  detector: 'not run by request',
  tests: 'not run by request',
  AssessmentB: 'not opened',
  codeReview: 'not opened',
  sourceVersionSignals: {
    tableRegion: 'icon-alias-table-region with role=region, aria-label, and tabindex=0',
    narrowHint: '窄屏可在表格区域横向滚动查看完整说明。',
    narrowTableMinimumWidth: '520px',
  },
  variants: {},
  screenshots: [],
};

fs.mkdirSync(dir, { recursive: true });
const output = (name) => path.join(dir, name);

async function getVariant(page) {
  return page.evaluate(() => {
    const region = document.querySelector('.icon-alias-table-region');
    const table = document.querySelector('.icon-alias-table');
    const hint = document.querySelector('.icon-alias-table-hint');
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
      };
    };
    return {
      title: document.title,
      classes: [...document.documentElement.classList],
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      horizontalPageOverflow: document.documentElement.scrollWidth > innerWidth,
      tableRegion: region
        ? {
            role: region.getAttribute('role'),
            label: region.getAttribute('aria-label'),
            tabindex: region.getAttribute('tabindex'),
            describedBy: region.getAttribute('aria-describedby'),
            describedByText: region.getAttribute('aria-describedby')
              ? document.getElementById(region.getAttribute('aria-describedby'))?.innerText.trim() ?? null
              : null,
            describedByResolves: Boolean(
              region.getAttribute('aria-describedby') &&
                document.getElementById(region.getAttribute('aria-describedby')),
            ),
            rect: rect(region),
            clientWidth: region.clientWidth,
            scrollWidth: region.scrollWidth,
            scrollLeft: region.scrollLeft,
            hasLocalHorizontalOverflow: region.scrollWidth > region.clientWidth,
          }
        : { exists: false },
      table: table
        ? {
            rect: rect(table),
            clientWidth: table.clientWidth,
            scrollWidth: table.scrollWidth,
            minWidth: getComputedStyle(table).minWidth,
            columnWidths: [...table.querySelectorAll('thead th')].map((cell) => Math.round(cell.getBoundingClientRect().width)),
            descriptions: [...table.querySelectorAll('tbody tr')].map((row) => row.cells[3]?.innerText.trim() ?? ''),
          }
        : { exists: false },
      hint: hint
        ? {
            text: hint.innerText.trim(),
            id: hint.id,
            display: getComputedStyle(hint).display,
            visible: hint.getBoundingClientRect().width > 0 && getComputedStyle(hint).display !== 'none',
            rect: rect(hint),
          }
        : { exists: false },
    };
  });
}

async function setVariant(page, name) {
  await page.evaluate((variant) => {
    document.documentElement.classList.remove('dark', 'lx-theme-hud');
    if (variant === 'dark') document.documentElement.classList.add('dark');
    if (variant === 'hud') document.documentElement.classList.add('lx-theme-hud');
  }, name);
  await page.waitForTimeout(80);
}

async function snapRegion(page, name) {
  const locator = page.locator('.icon-alias-table-region');
  await locator.evaluate((element) => { element.scrollLeft = 0; });
  await locator.screenshot({ path: output(name) });
  evidence.screenshots.push({ file: name, element: 'compatibility alias table region, scroll start' });
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  });
  try {
    for (const viewport of [
      { name: 'desktop-1440', width: 1440, height: 1000 },
      { name: 'mobile-375', width: 375, height: 812 },
      { name: 'mobile-320', width: 320, height: 800 },
    ]) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        locale: 'zh-CN',
        colorScheme: 'light',
      });
      const page = await context.newPage();
      page.setDefaultTimeout(5000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const response = await page.goto(url, { waitUntil: 'networkidle' });
      await page.locator('.icon-alias-table-region').waitFor();
      await page.evaluate(() => document.fonts.ready);
      const viewportEvidence = {
        requestedViewport: viewport,
        httpStatus: response?.status() ?? null,
        pageErrors: errors,
        themes: {},
      };

      for (const theme of ['light', 'dark', 'hud']) {
        await setVariant(page, theme);
        viewportEvidence.themes[theme] = await getVariant(page);
        const suffix = `${viewport.name}-${theme}`;
        await snapRegion(page, `alias-region-${suffix}.png`);
        if (theme === 'light') {
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.screenshot({ path: output(`${suffix}-fullpage.png`), fullPage: true });
          evidence.screenshots.push({ file: `${suffix}-fullpage.png`, fullPage: true });
        }
      }

      if (viewport.width < 641) {
        await setVariant(page, 'light');
        const region = page.locator('.icon-alias-table-region');
        await region.focus();
        const focusedBefore = await region.evaluate((element) => ({
          active: document.activeElement === element,
          outlineStyle: getComputedStyle(element).outlineStyle,
          outlineWidth: getComputedStyle(element).outlineWidth,
          scrollLeft: element.scrollLeft,
        }));
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(50);
        const afterKeyboard = await region.evaluate((element) => ({ scrollLeft: element.scrollLeft, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }));
        await region.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
        const afterEnd = await region.evaluate((element) => ({ scrollLeft: element.scrollLeft, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }));
        await region.screenshot({ path: output(`alias-region-${viewport.name}-light-scroll-end.png`) });
        evidence.screenshots.push({ file: `alias-region-${viewport.name}-light-scroll-end.png`, element: 'compatibility alias table region, scrolled to end' });
        viewportEvidence.tableKeyboard = { focusedBefore, afterArrowRight: afterKeyboard, afterScrollToEnd: afterEnd };
      }

      evidence.variants[viewport.name] = viewportEvidence;
      await context.close();
    }
    evidence.completedAt = new Date().toISOString();
    fs.writeFileSync(output('browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  } finally {
    await browser.close().catch(() => undefined);
  }
  process.stdout.write(`${JSON.stringify({
    outputDir: dir,
    variants: Object.fromEntries(Object.entries(evidence.variants).map(([name, data]) => [name, {
      httpStatus: data.httpStatus,
      errors: data.pageErrors,
      themes: Object.fromEntries(Object.entries(data.themes).map(([theme, state]) => [theme, {
        htmlClasses: state.classes,
        region: state.tableRegion,
        table: { rect: state.table?.rect, clientWidth: state.table?.clientWidth, scrollWidth: state.table?.scrollWidth, minWidth: state.table?.minWidth, columnWidths: state.table?.columnWidths },
        hint: state.hint,
        pageOverflow: state.horizontalPageOverflow,
      }])),
      tableKeyboard: data.tableKeyboard,
    }])) ,
    screenshotCount: evidence.screenshots.length,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
