import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('F:/work/linkx-admin/other-admin/admin-vue3/node_modules/@playwright/test');
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('../../.impeccable/critique/wave2-browser-2026-09-30');
mkdirSync(outDir, { recursive: true });
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const baseURL = 'http://127.0.0.1:4177';
const runStartedAt = new Date().toISOString();
const events = [];
const results = [];

function record(event) {
  events.push({ at: new Date().toISOString(), ...event });
}
function result(name, status, details = {}) {
  const item = { name, status, ...details };
  results.push(item);
  console.log(JSON.stringify(item));
  return item;
}
async function capture(page, name, meta = {}) {
  const safe = name.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
  const screenshot = path.join(outDir, `${safe}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  const metrics = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const read = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return { selector, text: (el.textContent || '').trim().slice(0, 200), rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, display: style.display, color: style.color, backgroundColor: style.backgroundColor, transitionDuration: style.transitionDuration, transitionProperty: style.transitionProperty };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      scroll: { width: html.scrollWidth, height: html.scrollHeight, horizontalOverflow: html.scrollWidth - innerWidth },
      classes: html.className,
      title: document.title,
      bodyText: (body.innerText || '').trim().slice(0, 1200),
      probes: ['.lx-search-demo', '.status-switch-demo', '.lx-upload-demo', '.lx-upload__progress-value', '.el-upload-dragger', '.el-switch__core'].map(read),
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  });
  writeFileSync(path.join(outDir, `${safe}.json`), JSON.stringify({ name, meta, screenshot, metrics }, null, 2));
  return { screenshot, metrics };
}
async function check(label, fn) {
  try {
    await fn();
    result(label, 'passed');
  } catch (error) {
    result(label, 'failed', { error: String(error && error.stack || error) });
  }
}

const browser = await chromium.launch({ headless: true, executablePath, args: ['--disable-dev-shm-usage'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light', reducedMotion: 'no-preference' });
const page = await context.newPage();
for (const p of [page]) {
  p.on('console', (msg) => record({ type: 'console', page: p.url(), level: msg.type(), text: msg.text() }));
  p.on('pageerror', (error) => record({ type: 'pageerror', page: p.url(), text: String(error.stack || error) }));
  p.on('requestfailed', (request) => record({ type: 'requestfailed', page: p.url(), url: request.url(), error: request.failure()?.errorText || 'unknown' }));
}

await check('searchbar desktop success empty error recover expand', async () => {
  await page.goto(`${baseURL}/components/lxsearchbar`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.locator('.lx-search-demo').waitFor({ state: 'visible', timeout: 10000 });
  await page.screenshot({ path: path.join(outDir, 'searchbar-desktop-initial.png'), fullPage: true });
  await page.getByRole('button', { name: '成功' }).click();
  const keyword = page.locator('input').first();
  await keyword.fill('李警官');
  await keyword.press('Enter');
  await page.getByText('查询到 2 条').first().waitFor({ state: 'visible', timeout: 3000 });
  await page.getByRole('button', { name: '空结果' }).click();
  await page.getByRole('button', { name: '查询' }).click();
  await page.getByText('暂无匹配结果').first().waitFor({ state: 'visible', timeout: 3000 });
  await page.getByRole('button', { name: '失败' }).click();
  await page.getByRole('button', { name: '查询' }).click();
  await page.getByText('查询服务暂不可用').first().waitFor({ state: 'visible', timeout: 3000 });
  await page.getByRole('button', { name: '成功' }).click();
  await page.getByRole('button', { name: '查询' }).click();
  await page.getByText('查询到 2 条').first().waitFor({ state: 'visible', timeout: 3000 });
  const expand = page.getByRole('button', { name: /展开|收起/ }).first();
  if (await expand.count()) {
    await expand.click();
    await page.getByLabel('负责人').waitFor({ state: 'visible', timeout: 3000 });
  }
  await capture(page, 'searchbar-desktop-final', { mode: 'success-empty-error-recover-expand' });
});

await check('searchbar mobile hud reduced motion and no overflow', async () => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.goto(`${baseURL}/components/lxsearchbar`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.locator('.lx-search-demo').waitFor({ state: 'visible', timeout: 10000 });
  const toggle = page.locator('button').filter({ hasText: /深色|主题|dark/i }).first();
  if (await toggle.count()) await toggle.click();
  await page.getByRole('button', { name: /展开/ }).click().catch(() => {});
  const metrics = await capture(page, 'searchbar-mobile-hud-reduced', { mode: 'mobile-hud-reduced-motion' });
  if (metrics.metrics.scroll.horizontalOverflow > 0) throw new Error(`horizontal overflow ${metrics.metrics.scroll.horizontalOverflow}`);
  if (!metrics.metrics.reducedMotion) throw new Error('reduced motion media query not active');
});

await check('statusswitch desktop numeric readonly confirm', async () => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference', colorScheme: 'light' });
  await page.goto(`${baseURL}/components/lxstatusswitch`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.getByTestId('numeric-row').locator('.el-switch__core').click();
  if ((await page.getByTestId('numeric-state').textContent())?.trim() !== '1') throw new Error('numeric state did not map to 1');
  await page.getByTestId('confirm-row').locator('.el-switch__core').click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible', timeout: 3000 });
  if (!(await dialog.textContent()).includes('关闭后将中断节点通信')) throw new Error('confirm consequence text missing');
  await dialog.getByRole('button', { name: '取消' }).click();
  if ((await page.getByTestId('confirm-state').textContent())?.trim() !== '开启') throw new Error('cancel changed confirm state');
  await page.getByTestId('confirm-row').locator('.el-switch__core').click();
  await dialog.getByRole('button', { name: '确认关闭' }).click();
  if ((await page.getByTestId('confirm-state').textContent())?.trim() !== '关闭') throw new Error('confirm did not close');
  await capture(page, 'statusswitch-desktop-final', { mode: 'numeric-readonly-confirm' });
});

await check('statusswitch mobile failure hud reduced motion', async () => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${baseURL}/components/lxstatusswitch`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.getByLabel('下一次保存失败').check();
  await page.getByTestId('boolean-row').locator('.el-switch__core').click();
  await page.getByRole('alert').waitFor({ state: 'visible', timeout: 3000 });
  await page.getByLabel('HUD 深色主题').check();
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  const metrics = await capture(page, 'statusswitch-mobile-hud-reduced', { mode: 'failure-recovery-mobile-hud' });
  if (metrics.metrics.scroll.horizontalOverflow > 0) throw new Error(`horizontal overflow ${metrics.metrics.scroll.horizontalOverflow}`);
  if (!metrics.metrics.reducedMotion) throw new Error('reduced motion media query not active');
});

await check('upload desktop progress success reduced motion', async () => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference', colorScheme: 'light' });
  await page.goto(`${baseURL}/components/lxupload`, { waitUntil: 'networkidle', timeout: 15000 });
  const input = page.locator('.lx-upload input[type=file]');
  await input.setInputFiles({ name: '排班数据.csv', mimeType: 'text/csv', buffer: Buffer.from('姓名,班次\\n李警官,早班') });
  if ((await page.locator('.lx-upload__file-status').textContent())?.trim() !== '排队中') throw new Error('queued status missing');
  await page.getByRole('button', { name: '开始上传' }).click();
  const progress = page.getByRole('progressbar', { name: '排班数据.csv 上传进度' });
  await progress.waitFor({ state: 'visible', timeout: 3000 });
  await page.waitForTimeout(500);
  const progressValue = page.locator('.lx-upload__progress-value');
  const transform = await progressValue.evaluate((el) => getComputedStyle(el).transform);
  if (transform === 'none') throw new Error('progress transform did not animate');
  await capture(page, 'upload-desktop-progress', { mode: 'progress' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const duration = Number.parseFloat(await progressValue.evaluate((el) => getComputedStyle(el).transitionDuration));
  if (duration > 0.00002) throw new Error(`reduced-motion transition duration ${duration}`);
  await page.locator('.lx-upload__file-status.is-success').waitFor({ state: 'visible', timeout: 5000 });
});

await check('upload retry cancel mobile hud disabled', async () => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'no-preference', colorScheme: 'light' });
  await page.goto(`${baseURL}/components/lxupload`, { waitUntil: 'networkidle', timeout: 15000 });
  const input = page.locator('.lx-upload input[type=file]');
  await page.getByRole('button', { name: '下一次上传失败' }).click();
  await input.setInputFiles({ name: '失败后重试.csv', mimeType: 'text/csv', buffer: Buffer.from('retry') });
  await page.getByRole('button', { name: '开始上传' }).click();
  await page.locator('.lx-upload__file-error').waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('.lx-upload__retry').click();
  await page.getByTestId('upload-last-action').filter({ hasText: '上传成功' }).waitFor({ state: 'visible', timeout: 5000 });
  await input.setInputFiles({ name: '取消上传.csv', mimeType: 'text/csv', buffer: Buffer.from('cancel') });
  await page.getByRole('button', { name: '开始上传' }).click();
  await page.getByRole('progressbar', { name: '取消上传.csv 上传进度' }).waitFor({ state: 'visible', timeout: 3000 });
  await page.getByRole('button', { name: '取消并移除 取消上传.csv' }).click();
  if (await page.locator('.lx-upload__file-name', { hasText: '取消上传.csv' }).count()) throw new Error('cancelled file remained');
  await page.getByLabel('紧凑标签').click().catch(() => {});
  await page.getByLabel('HUD 深色主题').check();
  await page.getByLabel('禁用上传').check();
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  const metrics = await capture(page, 'upload-mobile-hud-reduced-disabled', { mode: 'retry-cancel-mobile-hud-disabled' });
  if (metrics.metrics.scroll.horizontalOverflow > 0) throw new Error(`horizontal overflow ${metrics.metrics.scroll.horizontalOverflow}`);
  if (!metrics.metrics.reducedMotion) throw new Error('reduced motion media query not active');
});

const payload = {
  runStartedAt,
  runFinishedAt: new Date().toISOString(),
  baseURL,
  executablePath,
  results,
  events,
  consoleErrors: events.filter((event) => event.type === 'console' && ['error', 'warning'].includes(event.level)),
  pageErrors: events.filter((event) => event.type === 'pageerror'),
  requestFailures: events.filter((event) => event.type === 'requestfailed'),
};
writeFileSync(path.join(outDir, 'playwright-results.json'), JSON.stringify(payload, null, 2));
await browser.close();
const failed = results.filter((item) => item.status !== 'passed');
process.exitCode = failed.length ? 1 : 0;


