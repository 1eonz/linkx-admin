import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const outputDir = path.dirname(new URL(import.meta.url).pathname).replace(/^\//, '').replaceAll('/', path.sep);
const baseUrl = 'http://127.0.0.1:4174';
const require = createRequire('F:/work/linkx-admin/other-admin/admin-vue3/package.json');
const { chromium } = require('@playwright/test');

await fs.mkdir(outputDir, { recursive: true });

const pages = [
  { key: 'dynamicform', url: '/components/lxdynamicform.html' },
  { key: 'upload', url: '/components/lxupload.html' },
  { key: 'datepicker', url: '/components/lxdatepicker.html' },
];

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const evidence = {
  capturedAt: new Date().toISOString(),
  browserVersion: browser.version(),
  baseUrl,
  scenarios: [],
};

async function capture({ key, url, name, viewport, reducedMotion = 'no-preference', action }) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion,
    isMobile: viewport.width <= 640,
    hasTouch: viewport.width <= 640,
  });
  const page = await context.newPage();
  const blockedWrites = [];
  const consoleErrors = [];
  await page.route('**/*', (route) => {
    const request = route.request();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
      blockedWrites.push({ method: request.method(), url: request.url() });
      return route.abort();
    }
    return route.continue();
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await page.goto(`${baseUrl}${url}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.locator('h1').first().waitFor({ state: 'visible', timeout: 15000 });
  const demoHeading = page.locator('.vp-doc h2').filter({ hasText: '交互示例' }).first();
  if (await demoHeading.count()) {
    await demoHeading.evaluate((element) => {
      window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 96);
    });
  }
  if (action) await action(page);
  await page.waitForTimeout(250);
  const screenshot = `${key}-${name}.png`;
  await page.screenshot({ path: path.join(outputDir, screenshot) });
  const metrics = await page.evaluate(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const label = (element) =>
      element.getAttribute('aria-label') ||
      element.getAttribute('title') ||
      element.innerText?.trim().replace(/\s+/g, ' ').slice(0, 100) ||
      element.getAttribute('placeholder') ||
      element.tagName.toLowerCase();
    const demo = document.querySelector('.dynamic-form-demo, .lx-upload-demo, .lx-date-picker-demo, .vp-doc');
    const controls = [...(demo || document).querySelectorAll('button, a, input, select, textarea, [role="button"], [role="combobox"]')]
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const associatedLabel = element.matches('input[type="checkbox"], input[type="radio"]')
          ? element.closest('label') || (element.id ? document.querySelector(`label[for="${CSS.escape(element.id)}"]`) : null)
          : null;
        const target = associatedLabel || element.closest('.el-input__wrapper, .el-date-editor, .lx-input__wrapper') || element;
        const targetRect = target.getBoundingClientRect();
        const inViewport = rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth;
        return {
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute('role'),
          label: label(element),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          targetWidth: Math.round(targetRect.width),
          targetHeight: Math.round(targetRect.height),
          inViewport,
          type: element.getAttribute('type'),
          tabIndex: element.tabIndex,
          disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
        };
      });
    const active = document.activeElement;
    const activeRect = active?.getBoundingClientRect();
    const durations = [...document.querySelectorAll('*')]
      .map((element) => getComputedStyle(element))
      .flatMap((style) => [style.transitionDuration, style.animationDuration])
      .filter((value) => value !== '0s' && value !== '0ms');
    return {
      title: document.title,
      heading: document.querySelector('h1')?.innerText?.trim(),
      viewport: { width: innerWidth, height: innerHeight },
      inputModes: {
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        noHover: matchMedia('(hover: none)').matches,
        coarsePointer: matchMedia('(pointer: coarse)').matches,
      },
      document: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth },
      body: { clientWidth: document.body.clientWidth, scrollWidth: document.body.scrollWidth },
      demo: demo ? (() => {
        const rect = demo.getBoundingClientRect();
        return { className: demo.className, clientWidth: demo.clientWidth, scrollWidth: demo.scrollWidth, x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
      })() : null,
      activeElement: active ? {
        tag: active.tagName.toLowerCase(),
        label: label(active),
        role: active.getAttribute('role'),
        className: typeof active.className === 'string' ? active.className : '',
        rect: activeRect ? { x: Math.round(activeRect.x), y: Math.round(activeRect.y), width: Math.round(activeRect.width), height: Math.round(activeRect.height) } : null,
        outline: getComputedStyle(active).outline,
        borderColor: getComputedStyle(active).borderColor,
        boxShadow: getComputedStyle(active).boxShadow,
      } : null,
      visibleFormErrors: [...document.querySelectorAll('.el-form-item__error, [role="alert"]')].filter(visible).map((element) => element.innerText.trim()),
      openDatePanels: [...document.querySelectorAll('.el-picker-panel')].filter(visible).length,
      hudActive: document.documentElement.classList.contains('lx-theme-hud') || !!document.querySelector('.lx-theme-hud'),
      text: document.body.innerText.slice(0, 12000),
      controls,
      nonzeroMotionPropertyCount: durations.length,
    };
  });
  evidence.scenarios.push({
    key,
    name,
    url,
    viewport,
    reducedMotion,
    screenshot,
    metrics,
    blockedWrites,
    consoleErrors,
  });
  await context.close();
}

const desktop = { width: 1365, height: 900 };
const mobile = { width: 375, height: 812 };
const [dynamicForm, upload, datepicker] = pages;

await capture({ key: dynamicForm.key, url: dynamicForm.url, name: 'desktop-light', viewport: desktop });
await capture({
  key: dynamicForm.key,
  url: dynamicForm.url,
  name: 'desktop-hud',
  viewport: desktop,
  action: async (page) => {
    await page.locator('.dynamic-form-demo__settings > summary').click();
    await page.locator('.dynamic-form-demo__toolbar').getByText('深色主题（HUD）', { exact: true }).click();
    await page.locator('.dynamic-form-demo__settings > summary').click();
  },
});
await capture({ key: dynamicForm.key, url: dynamicForm.url, name: 'mobile-light', viewport: mobile });
await capture({
  key: dynamicForm.key,
  url: dynamicForm.url,
  name: 'empty-validation',
  viewport: desktop,
  action: async (page) => {
    await page.getByRole('button', { name: '提交校验' }).click();
    await page.locator('.el-form-item__error').first().waitFor({ state: 'visible', timeout: 8000 });
  },
});

await capture({ key: upload.key, url: upload.url, name: 'desktop-light', viewport: desktop });
await capture({
  key: upload.key,
  url: upload.url,
  name: 'desktop-hud',
  viewport: desktop,
  action: async (page) => page.locator('.lx-upload-demo__header input[type="checkbox"]').check(),
});
await capture({ key: upload.key, url: upload.url, name: 'mobile-light', viewport: mobile });

async function failUpload(page) {
  await page.getByRole('button', { name: '下一次上传失败' }).click();
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'week-plan.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('team,date\nA,2026-10-07\n'),
  });
  await page.getByRole('button', { name: '开始上传' }).click();
  await page.locator('.lx-upload__file-error').filter({ hasText: '上传服务暂不可用' }).first().waitFor({ state: 'visible', timeout: 10000 });
}

await capture({ key: upload.key, url: upload.url, name: 'failure-retry-prompt', viewport: desktop, action: failUpload });
await capture({
  key: upload.key,
  url: upload.url,
  name: 'retry-recovered',
  viewport: desktop,
  action: async (page) => {
    await failUpload(page);
    await page.getByRole('button', { name: /重新上传/ }).first().click();
    await page.waitForFunction(() => document.querySelector('[data-testid="upload-last-action"]')?.textContent?.includes('week-plan.csv 上传成功'), null, { timeout: 10000 });
  },
});
await capture({
  key: upload.key,
  url: upload.url,
  name: 'reduced-motion-progress',
  viewport: desktop,
  reducedMotion: 'reduce',
  action: async (page) => {
    await page.getByLabel('选择后立即上传').check();
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'motion-check.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('team,date\nA,2026-10-07\n'),
    });
    await page.locator('.lx-upload__panel-value').waitFor({ state: 'visible', timeout: 8000 });
  },
});

await capture({ key: datepicker.key, url: datepicker.url, name: 'desktop-light', viewport: desktop });
await capture({
  key: datepicker.key,
  url: datepicker.url,
  name: 'desktop-hud',
  viewport: desktop,
  action: async (page) => page.locator('.lx-date-picker-demo__toolbar input[type="checkbox"]').check(),
});
await capture({ key: datepicker.key, url: datepicker.url, name: 'mobile-light', viewport: mobile });

await capture({
  key: datepicker.key,
  url: datepicker.url,
  name: 'shortcut-selected-closed',
  viewport: desktop,
  action: async (page) => {
    const start = page.locator('[data-testid="shortcuts"] input[placeholder="开始日期"]').first();
    await start.click();
    await page.locator('.el-picker-panel:visible').waitFor({ state: 'visible', timeout: 8000 });
    await page.locator('.el-picker-panel__shortcut').filter({ hasText: '本周' }).click();
    await page.locator('.el-picker-panel:visible').waitFor({ state: 'hidden', timeout: 8000 });
  },
});

async function openDatePickerByKeyboard(page) {
  const start = page.locator('[data-testid="range"] input[placeholder="开始日期"]').first();
  await start.press('ArrowDown');
  await page.locator('.el-picker-panel:visible').waitFor({ state: 'visible', timeout: 8000 });
  return start;
}

await capture({
  key: datepicker.key,
  url: datepicker.url,
  name: 'keyboard-open',
  viewport: desktop,
  action: async (page) => openDatePickerByKeyboard(page),
});
await capture({
  key: datepicker.key,
  url: datepicker.url,
  name: 'keyboard-escape-closed',
  viewport: desktop,
  action: async (page) => {
    await openDatePickerByKeyboard(page);
    await page.keyboard.press('Escape');
    await page.locator('.el-picker-panel:visible').waitFor({ state: 'hidden', timeout: 8000 });
  },
});

await fs.writeFile(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
await browser.close();
console.log(JSON.stringify({ browserVersion: evidence.browserVersion, scenarios: evidence.scenarios.map(({ key, name, screenshot, metrics }) => ({ key, name, screenshot, viewport: metrics.viewport, overflow: metrics.document.scrollWidth > metrics.document.clientWidth, heading: metrics.heading })) }, null, 2));
