import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'file:///F:/work/linkx-admin/other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright/index.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '../../../../../');
const freezePath = resolve(repoRoot, '.impeccable/critique/wave4-dynamicform-2026-10-06/final-recheck-2026-10-06/source-hashes-freeze.json');
const outputDir = scriptDir;
const target = 'http://127.0.0.1:4174/components/lxdynamicform.html';
const evidence = {
  target,
  capturedAt: new Date().toISOString(),
  browser: 'Playwright Chromium, isolated fresh contexts',
  hashChecks: {},
  views: [],
  actions: [],
  pageSignals: {},
};

async function verifyFreeze(label) {
  const freeze = JSON.parse(await readFile(freezePath, 'utf8'));
  const rows = await Promise.all(Object.entries(freeze.files).map(async ([relativePath, expected]) => {
    const content = await readFile(resolve(repoRoot, relativePath));
    const actual = createHash('sha256').update(content).digest('hex');
    return { path: relativePath, expected, actual, matches: actual === expected };
  }));
  const mismatches = rows.filter((row) => !row.matches);
  evidence.hashChecks[label] = {
    expectedCount: freeze.fileCount,
    checkedCount: rows.length,
    matchedCount: rows.length - mismatches.length,
    mismatches,
  };
  return rows.length === freeze.fileCount && mismatches.length === 0;
}

async function visibleControls(page) {
  return page.locator('main').first().locator('button, a, input, select, textarea, [role="button"], [role="combobox"], [aria-expanded]')
    .evaluateAll((nodes) => nodes.filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }).map((node) => ({
      tag: node.tagName.toLowerCase(),
      role: node.getAttribute('role'),
      text: (node.innerText || node.getAttribute('aria-label') || node.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 100),
      expanded: node.getAttribute('aria-expanded'),
      type: node.getAttribute('type'),
    })).slice(0, 70));
}

async function captureView(page, name, width, height, colorScheme) {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ colorScheme });
  await page.waitForTimeout(400);
  const file = `${name}.png`;
  await page.screenshot({ path: resolve(outputDir, file), fullPage: false, animations: 'disabled' });
  evidence.views.push({ name, width, height, colorScheme, screenshot: file });
  return file;
}

async function newPage(browser, { width, height, colorScheme, isMobile = false, hasTouch = false }) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme, isMobile, hasTouch });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  evidence.pageSignals[`${width}x${height}-${colorScheme}`] = {
    status: response?.status() ?? null,
    title: await page.title(),
    pageErrors: errors,
    headings: await page.locator('h1, h2, h3').evaluateAll((nodes) => nodes.map((node) => node.innerText.trim()).filter(Boolean).slice(0, 50)),
    visibleControls: await visibleControls(page),
    bodyText: (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 7000),
  };
  return { context, page };
}

await mkdir(outputDir, { recursive: true });
evidence.hashChecks.pre = { verified: await verifyFreeze('pre') };
if (!evidence.hashChecks.pre.verified) {
  await writeFile(resolve(outputDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2));
  throw new Error('The frozen source hash check failed before browser inspection.');
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
try {
  const desktop = await newPage(browser, { width: 1440, height: 1000, colorScheme: 'light' });
  const { page } = desktop;
  await captureView(page, '01-light-desktop-initial', 1440, 1000, 'light');

  const browseAnchor = page.getByText('浏览全部字段类型', { exact: false }).first();
  if (await browseAnchor.count()) {
    await browseAnchor.scrollIntoViewIfNeeded();
    const visible = await browseAnchor.isVisible();
    await browseAnchor.click({ timeout: 4000 }).catch((error) => evidence.actions.push({ action: 'click-browse-anchor', result: 'failed', detail: error.message }));
    await page.waitForTimeout(300);
    evidence.actions.push({ action: 'click-browse-anchor', visible, count: await page.getByText('浏览全部字段类型', { exact: false }).count() });
  } else {
    evidence.actions.push({ action: 'click-browse-anchor', result: 'not-found' });
  }
  await captureView(page, '02-light-desktop-after-browse-anchor', 1440, 1000, 'light');
  evidence.pageSignals['after-browse-anchor'] = {
    bodyText: (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 7000),
    visibleControls: await visibleControls(page),
    scrollY: await page.evaluate(() => window.scrollY),
  };

  const summary = page.getByText('可搜索 14 种', { exact: false }).first();
  let picker;
  if (await summary.count()) {
    const visible = await summary.isVisible();
    const details = await summary.evaluate((node) => ({
      tag: node.tagName.toLowerCase(),
      role: node.getAttribute('role'),
      text: node.innerText.trim(),
      parentTag: node.parentElement?.tagName.toLowerCase(),
      parentRole: node.parentElement?.getAttribute('role'),
      parentExpanded: node.parentElement?.getAttribute('aria-expanded'),
    }));
    picker = summary.locator('xpath=../..');
    evidence.actions.push({ action: 'inspect-collapsed-summary', visible, details, initiallyOpen: await picker.evaluate((node) => node.open) });
  } else {
    evidence.actions.push({ action: 'inspect-collapsed-summary', result: 'not-found' });
  }

  if (picker) {
    await summary.click();
    await page.waitForTimeout(250);
    evidence.actions.push({ action: 'expand-all-field-types', expanded: await picker.evaluate((node) => node.open) });
    await captureView(page, '03-light-desktop-preview-expanded', 1440, 1000, 'light');

    const fieldCombo = picker.getByRole('combobox').first();
    if (await fieldCombo.count()) {
      await fieldCombo.click();
      await page.waitForTimeout(200);
      const menuStructure = await page.evaluate(() => Array.from(document.querySelectorAll('[role="group"], [role="listbox"], [role="option"], details > summary, button[aria-expanded], [role="button"][aria-expanded]')).filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).map((node) => ({
        tag: node.tagName.toLowerCase(),
        role: node.getAttribute('role'),
        text: (node.innerText || node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 180),
        label: node.getAttribute('aria-label'),
        expanded: node.getAttribute('aria-expanded') ?? (node.tagName === 'DETAILS' ? String(node.open) : null),
      })).slice(-50));
      const listbox = page.getByRole('listbox').first();
      const listboxText = await listbox.innerText();
      const categoryLabels = ['文本类字段', '下拉选择字段', '单选与多选', '日期与数值', '状态与附件'];
      const groupLabels = categoryLabels.filter((label) => listboxText.includes(label));
      const menuOptions = await page.getByRole('option').allInnerTexts();
      evidence.actions.push({ action: 'open-field-type-menu', expanded: await fieldCombo.getAttribute('aria-expanded'), groupCount: groupLabels.length, groupLabels, optionCount: menuOptions.length, menuOptions, menuStructure });
      await captureView(page, '04-light-desktop-category-menu', 1440, 1000, 'light');

      const firstExpandableGroup = page.locator('details > summary, button[aria-expanded="false"], [role="button"][aria-expanded="false"]').filter({ hasText: /文本类字段|下拉选择字段|单选与多选|日期与数值|状态与附件/ }).first();
      if (await firstExpandableGroup.count()) {
        const firstGroupLabel = (await firstExpandableGroup.innerText()).trim().replace(/\s+/g, ' ');
        await firstExpandableGroup.click();
        await page.waitForTimeout(150);
        evidence.actions.push({ action: 'expand-first-field-group', firstGroup: firstGroupLabel, expanded: await firstExpandableGroup.getAttribute('aria-expanded') ?? await firstExpandableGroup.evaluate((node) => node.parentElement?.open ?? null) });
        await captureView(page, '05-light-desktop-first-group', 1440, 1000, 'light');
      } else {
        evidence.actions.push({ action: 'expand-first-field-group', result: 'no-collapsible-group-control-found', visibleGroups: groupLabels });
      }

      const inputDetails = await fieldCombo.evaluate((node) => ({ placeholder: node.getAttribute('placeholder'), ariaLabel: node.getAttribute('aria-label'), type: node.getAttribute('type') }));
      await fieldCombo.fill('日期');
      await page.waitForTimeout(250);
      const visibleOptions = await page.locator('[role="option"]').evaluateAll((nodes) => nodes.filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).map((node) => (node.innerText || node.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ')).filter(Boolean));
      await fieldCombo.press('ArrowDown');
      const activeAfterArrow = await page.evaluate(() => ({
        tag: document.activeElement?.tagName?.toLowerCase(),
        text: document.activeElement?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 100),
        ariaSelected: document.activeElement?.getAttribute('aria-selected'),
        ariaActiveDescendant: document.activeElement?.getAttribute('aria-activedescendant'),
      }));
      await fieldCombo.press('Enter');
      await page.waitForTimeout(200);
      evidence.actions.push({ action: 'search-and-keyboard-select', query: '日期', inputDetails, visibleOptions, activeAfterArrow, activeAfterEnter: await page.evaluate(() => ({ tag: document.activeElement?.tagName?.toLowerCase(), text: document.activeElement?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 100), value: document.activeElement?.value ?? null })), selectedText: (await picker.innerText()).replace(/\s+/g, ' ').slice(0, 2400) });
      await captureView(page, '06-light-desktop-search-keyboard', 1440, 1000, 'light');
    } else {
      evidence.actions.push({ action: 'open-field-type-menu', result: 'combobox-not-found', controls: await picker.locator('input, select, button').evaluateAll((nodes) => nodes.map((node) => ({ tag: node.tagName.toLowerCase(), role: node.getAttribute('role'), placeholder: node.getAttribute('placeholder'), ariaLabel: node.getAttribute('aria-label'), text: node.innerText.trim() }))) });
    }
  }

  const submitButton = page.getByRole('button', { name: /提交校验/ }).first();
  if (await submitButton.count()) {
    await submitButton.click();
    await page.waitForTimeout(350);
    const validation = await page.evaluate(() => ({
      messages: Array.from(document.querySelectorAll('[role="alert"], .el-form-item__error, .lx-form-item__error, [data-error]')).filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).map((node) => node.textContent?.trim().replace(/\s+/g, ' ')).filter(Boolean),
      invalidControls: Array.from(document.querySelectorAll('[aria-invalid="true"]')).filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).map((node) => ({ tag: node.tagName.toLowerCase(), type: node.getAttribute('type'), label: node.getAttribute('aria-label'), describedBy: node.getAttribute('aria-describedby') })),
      active: document.activeElement?.tagName?.toLowerCase(),
    }));
    evidence.actions.push({ action: 'submit-empty-form', validation });
    await captureView(page, '07-light-desktop-validation-error', 1440, 1000, 'light');
  } else {
    evidence.actions.push({ action: 'submit-empty-form', result: 'submit-button-not-found' });
  }

  const dark = await newPage(browser, { width: 1440, height: 1000, colorScheme: 'dark' });
  const darkBrowse = dark.page.getByText('浏览全部字段类型', { exact: false }).first();
  if (await darkBrowse.count()) {
    await darkBrowse.scrollIntoViewIfNeeded();
    await darkBrowse.click();
    const darkSummary = dark.page.getByText('可搜索 14 种', { exact: false }).first();
    if (await darkSummary.count()) await darkSummary.click();
  }
  await captureView(dark.page, '08-dark-hud-field-types', 1440, 1000, 'dark');
  evidence.pageSignals['dark-hud'] = {
    bodyAttributes: await dark.page.locator('html').evaluate((node) => ({ className: node.className, dataTheme: node.getAttribute('data-theme') })),
    visibleControls: await visibleControls(dark.page),
    bodyText: (await dark.page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 5000),
  };

  const mobile = await newPage(browser, { width: 375, height: 812, colorScheme: 'light', isMobile: true, hasTouch: true });
  await captureView(mobile.page, '09-mobile-375-initial', 375, 812, 'light');
  const mobileBrowse = mobile.page.getByText('浏览全部字段类型', { exact: false }).first();
  if (await mobileBrowse.count()) {
    await mobileBrowse.scrollIntoViewIfNeeded();
    await mobileBrowse.tap({ timeout: 4000 }).catch((error) => evidence.actions.push({ action: 'tap-browse-anchor-mobile', result: 'failed', detail: error.message }));
    await mobile.page.waitForTimeout(250);
    evidence.actions.push({ action: 'tap-browse-anchor-mobile', result: 'tapped' });
  } else {
    evidence.actions.push({ action: 'tap-browse-anchor-mobile', result: 'not-found' });
  }
  const mobileSummary = mobile.page.getByText('可搜索 14 种', { exact: false }).first();
  if (await mobileSummary.count()) {
    await mobileSummary.tap();
    await mobile.page.waitForTimeout(200);
    evidence.actions.push({ action: 'expand-mobile-field-types', expanded: await mobileSummary.locator('xpath=..').evaluate((node) => node.open) });
  }
  await captureView(mobile.page, '10-mobile-375-field-types', 375, 812, 'light');
  evidence.pageSignals.mobile = {
    touchCapable: await mobile.page.evaluate(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0),
    scrollWidth: await mobile.page.evaluate(() => document.documentElement.scrollWidth),
    clientWidth: await mobile.page.evaluate(() => document.documentElement.clientWidth),
    scrollY: await mobile.page.evaluate(() => window.scrollY),
    visibleControls: await visibleControls(mobile.page),
    bodyText: (await mobile.page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 5000),
  };

  await desktop.context.close();
  await dark.context.close();
  await mobile.context.close();
} finally {
  await browser.close();
}

evidence.hashChecks.post = { verified: await verifyFreeze('post') };
await writeFile(resolve(outputDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2));
await writeFile(resolve(outputDir, 'browser-evidence.stdout.json'), JSON.stringify({ hashChecks: evidence.hashChecks, views: evidence.views, actions: evidence.actions }, null, 2));
