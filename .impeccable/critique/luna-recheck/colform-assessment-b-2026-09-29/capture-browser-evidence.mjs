import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '../../../../other-admin/admin-vue3/node_modules/@playwright/test/index.mjs';

const baseDir = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = 'http://127.0.0.1:30941';
const overlayUrl = 'http://127.0.0.1:8400/detect.js';
const views = [];
const requests = [];
const responses = [];
const consoleMessages = [];
const pageErrors = [];
const blocked = [];
let peopleMode = 'normal';
const mobileOnly = process.env.ASSESSMENT_B_MOBILE_ONLY === '1';
const executablePath = process.env.ASSESSMENT_B_CHROME_PATH;

const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });

async function createContext(width, height) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method().toUpperCase();
    const localOrigin = url.origin === baseUrl || url.origin === new URL(overlayUrl).origin;
    const postReadOnly = method === 'POST' && /\/(list|page|tree|query|permissions|get[A-Z][^/]*)$/.test(url.pathname);
    const writeAttempt = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS' && !postReadOnly;
    const deny = !localOrigin || writeAttempt;
    const item = { method, url: request.url(), blocked: deny };
    requests.push(item);

    if (deny) {
      blocked.push(item);
      await route.fulfill({ status: 403, contentType: 'text/plain', body: 'Assessment B blocked this request.' });
      return;
    }

    if (url.pathname.endsWith('/collaboration/v1/post/queryUserByPage') && peopleMode !== 'normal') {
      if (peopleMode === 'empty') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 0, msg: '操作成功', data: { records: [], total: 0 } }),
        });
      } else {
        await route.fulfill({ status: 503, contentType: 'application/json', body: '{"code":503,"msg":"本轮 Mock 故障状态"}' });
      }
      return;
    }

    await route.continue();
  });
  return context;
}

function observe(page) {
  page.on('console', (message) => consoleMessages.push({ level: message.type(), text: message.text(), url: page.url() }));
  page.on('pageerror', (error) => pageErrors.push({ message: error.message, url: page.url() }));
  page.on('response', (response) => {
    const url = response.url();
    if (url.startsWith(baseUrl) || url.startsWith(overlayUrl)) responses.push({ status: response.status(), url });
  });
}

async function ensureOverlay(page) {
  const detector = await page.evaluate(() => typeof window.impeccableScan === 'function');
  if (!detector) await page.addScriptTag({ url: overlayUrl });
  return page.evaluate(() => ({
    title: document.title,
    href: location.href,
    viewport: { width: innerWidth, height: innerHeight },
    preflightMutation: document.documentElement.dataset.assessmentBPreflight || null,
    detector: typeof window.impeccableScan,
  }));
}

async function recordView(page, name, stateNote) {
  const pageEvidence = await ensureOverlay(page);
  const scan = await page.evaluate(() => {
    const findings = window.impeccableScan({ visualContrast: false, scrollOffscreen: false });
    return findings.map(({ el, findings: entries }) => ({
      selector: el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}${[...el.classList].slice(0, 4).map((name) => `.${name}`).join('')}`,
      tagName: el.tagName.toLowerCase(),
      text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 160),
      rect: el.getBoundingClientRect().toJSON(),
      findings: entries.map(({ type, detail }) => ({ type, detail })),
    }));
  });
  await page.waitForTimeout(1200);
  const overlayDom = await page.evaluate(() => ({
    overlayCount: document.querySelectorAll('.impeccable-overlay').length,
    labelCount: document.querySelectorAll('.impeccable-label').length,
    bannerCount: document.querySelectorAll('.impeccable-banner').length,
    samples: [...document.querySelectorAll('.impeccable-overlay')].slice(0, 40).map((node) => ({
      text: (node.innerText || node.textContent || '').trim().slice(0, 160),
      className: node.className,
      rect: node.getBoundingClientRect().toJSON(),
      visible: getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden',
    })),
  }));
  const screenshot = path.join(baseDir, `${name}.png`);
  await page.screenshot({ path: screenshot, fullPage: false });
  const result = { name, stateNote, pageEvidence, count: scan.length, findings: scan, overlayDom, screenshot };
  views.push(result);
  await fs.writeFile(path.join(baseDir, `${name}.json`), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

async function openPage(width, height) {
  const context = await createContext(width, height);
  const page = await context.newPage();
  observe(page);
  await page.goto(`${baseUrl}/collaboration/index`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '新增', exact: true }).waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(900);
  return { context, page };
}

async function openCreate(page) {
  await page.getByRole('button', { name: '新增', exact: true }).click();
  await page.locator('.col-form-dialog').waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500);
}

async function closeCreate(page) {
  const cancel = page.locator('.col-form-dialog').getByRole('button', { name: '取消', exact: true });
  if (await cancel.count()) await cancel.click();
  await page.locator('.col-form-dialog').waitFor({ state: 'hidden', timeout: 5000 });
}

if (!mobileOnly) {
  const desktop = await openPage(1280, 720);
  await recordView(desktop.page, 'desktop-normal-1280', '协同岗列表正常状态，使用本地 Mock 数据');
  await openCreate(desktop.page);
  await recordView(desktop.page, 'desktop-create-1280', '新增弹窗，尚未选择组织或人员');
  await desktop.page.locator('.col-form-dialog').getByRole('button', { name: '确定', exact: true }).click();
  await desktop.page.waitForTimeout(250);
  const validationMessages = await desktop.page.locator('.col-form-dialog .el-form-item__error').allTextContents();
  await recordView(desktop.page, 'desktop-validation-error-1280', `空表单校验错误：${validationMessages.join('；')}`);

  await desktop.page.locator('.col-form-dialog input[placeholder="请选择归属组织"]').click();
  await desktop.page.getByText('信息通信支队', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
  await desktop.page.getByText('信息通信支队', { exact: true }).click();
  peopleMode = 'empty';
  const peopleSelect = desktop.page.locator('.col-form-dialog input[placeholder="请选择关联人员"]');
  await peopleSelect.click();
  await peopleSelect.fill('无匹配人员');
  await desktop.page.waitForTimeout(600);
  await recordView(desktop.page, 'desktop-empty-people-1280', '归属组织已选择；查询返回空 records/total=0 的本地 Mock 状态');

  peopleMode = 'error';
  await peopleSelect.fill('模拟失败');
  await desktop.page.waitForTimeout(800);
  await recordView(desktop.page, 'desktop-request-error-1280', '关联人员查询被本地 Playwright Mock 设为 HTTP 503');
  await desktop.context.close();
}

peopleMode = 'normal';
const mobile = await openPage(375, 812);
await recordView(mobile.page, 'mobile-normal-375', '协同岗列表正常状态，视口 375×812');
await openCreate(mobile.page);
await recordView(mobile.page, 'mobile-create-375', '新增弹窗，视口 375×812');
await mobile.page.locator('.col-form-dialog').getByRole('button', { name: '确定', exact: true }).click();
await mobile.page.waitForTimeout(250);
const mobileValidation = await mobile.page.locator('.col-form-dialog .el-form-item__error').allTextContents();
await recordView(mobile.page, 'mobile-validation-error-375', `空表单校验错误：${mobileValidation.join('；')}`);

await mobile.page.locator('.col-form-dialog input[placeholder="请选择归属组织"]').click();
await mobile.page.getByText('信息通信支队', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
await mobile.page.getByText('信息通信支队', { exact: true }).click();
peopleMode = 'empty';
const mobilePeopleSelect = mobile.page.locator('.col-form-dialog input[placeholder="请选择关联人员"]');
await mobilePeopleSelect.click();
await mobilePeopleSelect.fill('移动端空结果');
await mobile.page.waitForTimeout(600);
await recordView(mobile.page, 'mobile-empty-people-375', '归属组织已选择；移动端关联人员查询返回空 records/total=0 的本地 Mock 状态');

peopleMode = 'error';
await mobilePeopleSelect.fill('移动端失败');
await mobile.page.waitForTimeout(800);
await recordView(mobile.page, 'mobile-request-error-375', '移动端关联人员查询被本地 Playwright Mock 设为 HTTP 503');
await mobile.context.close();

await browser.close();

const networkSummary = {
  baseUrl,
  overlayUrl,
  totalRequests: requests.length,
  blockedCount: blocked.length,
  blocked,
  requests,
  responses,
  consoleMessages,
  pageErrors,
  views: views.map(({ name, stateNote, pageEvidence, count, overlayDom, screenshot }) => ({
    name,
    stateNote,
    pageEvidence,
    findingCount: count,
    overlayCount: overlayDom.overlayCount,
    labelCount: overlayDom.labelCount,
    bannerCount: overlayDom.bannerCount,
    screenshot,
  })),
};
await fs.writeFile(path.join(baseDir, 'browser-network-console.json'), `${JSON.stringify(networkSummary, null, 2)}\n`);
console.log(JSON.stringify(networkSummary.views, null, 2));
console.log(`requests=${requests.length} blocked=${blocked.length} responses=${responses.length} console=${consoleMessages.length} pageErrors=${pageErrors.length}`);
