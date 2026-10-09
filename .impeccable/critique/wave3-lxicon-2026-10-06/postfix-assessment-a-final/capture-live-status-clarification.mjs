import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, '.impeccable/critique/wave3-lxicon-2026-10-06/postfix-assessment-a-final');
const appRequire = createRequire(path.join(root, 'other-admin/admin-vue3/package.json'));
const { chromium } = appRequire('@playwright/test');
const target = 'http://127.0.0.1:4174/components/lxicons.html';

async function readState(page) {
  return page.evaluate(() => {
    const bounds = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        visible: rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden',
      };
    };
    const status = document.querySelector('.icon-search-status');
    const empty = document.querySelector('.icon-empty');
    return {
      status: status
        ? {
            exists: true,
            text: status.textContent.trim(),
            role: status.getAttribute('role'),
            ariaLive: status.getAttribute('aria-live'),
            ariaAtomic: status.getAttribute('aria-atomic'),
            ariaHidden: status.getAttribute('aria-hidden'),
            visualBounds: bounds(status),
          }
        : { exists: false },
      visibleEmptyCopy: empty
        ? {
            exists: true,
            text: empty.textContent.trim(),
            ariaHidden: empty.getAttribute('aria-hidden'),
            visualBounds: bounds(empty),
          }
        : { exists: false },
      query: document.querySelector('.icon-search')?.value ?? null,
      groupCount: document.querySelectorAll('.icon-group').length,
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
      viewport: { width: 375, height: 812 },
      colorScheme: 'light',
      reducedMotion: 'no-preference',
      locale: 'zh-CN',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    await page.goto(target, { waitUntil: 'networkidle' });
    await page.locator('.icon-search').waitFor();
    const before = await readState(page);
    await page.locator('.icon-search').fill('postfix-status-node-no-match-xyzz');
    await page.waitForTimeout(100);
    const after = await readState(page);
    const record = {
      method: 'fresh isolated Edge/Playwright context; read-only DOM state check',
      target,
      detector: 'not run',
      priorAssessmentArtifacts: 'not opened',
      assistiveTechnologyTest: 'not run; live-region DOM state only',
      viewport: { width: 375, height: 812 },
      beforeSearch: before,
      afterNoMatchSearch: after,
      conclusion: {
        liveRegionRemainsMounted: before.status.exists && after.status.exists,
        liveRegionTextChanges: before.status.text !== after.status.text,
        visualEmptyCopyIsHiddenFromAssistiveTechnology: after.visibleEmptyCopy.ariaHidden === 'true',
        liveRegionHasExpectedSemantics: after.status.role === 'status' && after.status.ariaLive === 'polite' && after.status.ariaAtomic === 'true',
      },
      completedAt: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(outputDir, 'live-status-clarification.json'), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
    await context.close();
    process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
  } finally {
    await browser.close().catch(() => undefined);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
