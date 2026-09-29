const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const appRequire = createRequire(path.resolve(process.cwd(), 'package.json'));
const { chromium } = appRequire('@playwright/test');

const prefix = 'colform-assessment-b-luna-max-recheck-2026-09-29';
const outputDir = path.resolve(process.cwd(), '../../.impeccable/critique');
const baseUrl = 'http://127.0.0.1:30847/collaboration/index';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const viewportDesktop = { width: 1280, height: 720 };
const viewportMobile = { width: 375, height: 812 };
const readOnlyPostPaths = new Set([
  '/linkx/admin/api/globals/list',
  '/linkx/admin/api/menu/list',
  '/linkx/admin/auth/v1/oauth/v2/permissions',
]);
const writePathPattern = /\/collaboration\/v1\/post\/(save|update|delete(?:Batch)?(?:\/|$)|upload\/icon)/;
const allEvidenceNames = [
  `${prefix}.browser-run.log.json`,
  `${prefix}.browser-dom.json`,
  `${prefix}.browser-console.json`,
  `${prefix}.injection-preflight.json`,
  `${prefix}.injection-overlay.json`,
  `${prefix}.overlay-dom.json`,
  `${prefix}.create-desktop.png`,
  `${prefix}.edit-desktop.png`,
  `${prefix}.empty-desktop.png`,
  `${prefix}.error-desktop.png`,
  `${prefix}.create-mobile.png`,
  `${prefix}.edit-mobile.png`,
  `${prefix}.empty-mobile.png`,
  `${prefix}.error-mobile.png`,
  `${prefix}.overlay-list-desktop.png`,
  `${prefix}.overlay-create-desktop.png`,
  `${prefix}.overlay-empty-desktop.png`,
  `${prefix}.overlay-edit-mobile.png`,
  `${prefix}.overlay-error-mobile.png`,
];

function assertFreshOutputs(names) {
  const existing = names.filter((name) => fs.existsSync(path.join(outputDir, name)));
  if (existing.length) throw new Error(`Refusing to overwrite evidence: ${existing.join(', ')}`);
}

function writeJson(name, data) {
  fs.writeFileSync(path.join(outputDir, name), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function launchBrowser() {
  return chromium.launch({ executablePath: chromePath, headless: true });
}

async function installGuards(context, record, getPeopleMode) {
  await context.route('**/linkx/admin/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (url.pathname.endsWith('/queryUserByPage') && method === 'GET') {
      const mode = getPeopleMode();
      if (mode === 'empty') {
        record.routeMocks.push({ path: url.pathname, mode, status: 200 });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 0, msg: '操作成功', data: { records: [], total: 0 } }),
        });
        return;
      }
      if (mode === 'error') {
        record.routeMocks.push({ path: url.pathname, mode, status: 503 });
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ code: 503, msg: 'Assessment B 测试故障', data: null }),
        });
        return;
      }
    }

    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !readOnlyPostPaths.has(url.pathname)) {
      record.blockedWrites.push({ method, path: url.pathname });
      await route.abort('blockedbyclient');
      return;
    }

    if (writePathPattern.test(url.pathname)) {
      record.blockedWrites.push({ method, path: url.pathname });
      await route.abort('blockedbyclient');
      return;
    }

    await route.continue();
  });
}

function listenToPage(page, record) {
  page.on('console', (message) => {
    record.console.push({ type: message.type(), text: message.text() });
  });
  page.on('pageerror', (error) => {
    record.pageErrors.push(String(error));
  });
  page.on('requestfailed', (request) => {
    const url = new URL(request.url());
    if (url.origin === 'http://127.0.0.1:30847') {
      record.failedRequests.push({ method: request.method(), path: url.pathname, error: request.failure()?.errorText });
    }
  });
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.origin === 'http://127.0.0.1:30847' && url.pathname.startsWith('/linkx/admin/')) {
      record.apiResponses.push({ method: response.request().method(), path: url.pathname, status: response.status() });
    }
  });
}

async function createPage(browser, name, viewport, mode = 'normal') {
  const record = { name, viewport, routeMocks: [], blockedWrites: [], console: [], pageErrors: [], failedRequests: [], apiResponses: [] };
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: viewport.width < 500, hasTouch: viewport.width < 500 });
  await installGuards(context, record, () => mode);
  const page = await context.newPage();
  listenToPage(page, record);
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('button', { name: '新增', exact: true }).waitFor({ state: 'visible', timeout: 15000 });
  return { context, page, record, setMode(nextMode) { mode = nextMode; } };
}

async function openCreate(page) {
  await page.getByRole('button', { name: '新增', exact: true }).click();
  await page.getByRole('heading', { name: '新增', exact: true }).waitFor({ state: 'visible' });
  await page.waitForTimeout(450);
}

async function openEdit(page) {
  await page.getByRole('button', { name: '修改', exact: true }).first().click();
  await page.getByRole('heading', { name: '修改', exact: true }).waitFor({ state: 'visible' });
  await page.waitForTimeout(450);
}

async function chooseOrganization(page) {
  await page.locator('.col-form-dialog .org-tree-select input').click({ force: true });
  const node = page.locator('.org-tree-select__popper:visible .el-tree-node__content').filter({ hasText: '市局指挥中心' }).last();
  await node.waitFor({ state: 'visible', timeout: 12000 });
  await node.click();
}

async function openRelatedUsers(page) {
  const peopleField = page.locator('.col-form-dialog .el-form-item').filter({ hasText: '关联人员' }).locator('.el-select');
  const response = page.waitForResponse((item) => item.url().includes('/queryUserByPage') && item.request().method() === 'GET', { timeout: 12000 });
  await peopleField.locator('input[role="combobox"]').fill('luna-empty-check');
  await response;
}

async function waitForPeopleState(page, state) {
  if (state === 'empty') {
    await page.getByText('未找到“luna-empty-check”匹配的人员。', { exact: true }).waitFor({ state: 'visible', timeout: 12000 });
  } else if (state === 'error') {
    await page.getByText('人员加载失败，已选人员仍保留。请重试。', { exact: true }).waitFor({ state: 'visible', timeout: 12000 });
  }
}

async function stateEvidence(page, label) {
  return page.evaluate((stateLabel) => {
    const dialog = document.querySelector('.col-form-dialog');
    const rect = dialog?.getBoundingClientRect();
    const inputs = [...document.querySelectorAll('.col-form-dialog input')].map((input) => ({
      placeholder: input.getAttribute('placeholder'),
      value: input.value,
      disabled: input.disabled,
    }));
    return {
      label: stateLabel,
      title: document.title,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      dialog: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
      headings: [...document.querySelectorAll('h1,h2,h3,[role="heading"]')].map((el) => el.textContent?.trim()).filter(Boolean),
      inputs,
      visibleText: document.body.innerText.slice(-2600),
    };
  }, label);
}

async function saveScreenshot(page, name) {
  const filePath = path.join(outputDir, name);
  if (fs.existsSync(filePath)) return { saved: false, reused: true };
  await page.screenshot({ path: filePath, fullPage: false, animations: 'disabled' });
  return { saved: true, reused: false };
}

async function injectDetect(page, livePort, label, record) {
  const result = await page.evaluate(async ({ source, stateLabel }) => {
    const priorTitle = document.title;
    document.title = `${priorTitle} [${stateLabel}]`;
    const marker = document.createElement('script');
    marker.textContent = 'document.documentElement.dataset.assessmentBScriptAppend = "ok";';
    document.head.append(marker);
    const preflight = {
      titleChanged: document.title !== priorTitle,
      scriptAppended: marker.isConnected,
      scriptExecuted: document.documentElement.dataset.assessmentBScriptAppend === 'ok',
    };
    marker.remove();
    delete document.documentElement.dataset.assessmentBScriptAppend;
    document.title = priorTitle;

    const script = document.createElement('script');
    script.src = source;
    script.async = true;
    const loaded = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve('timeout'), 10000);
      script.addEventListener('load', () => { clearTimeout(timer); resolve('load'); }, { once: true });
      script.addEventListener('error', () => { clearTimeout(timer); resolve('error'); }, { once: true });
      document.head.append(script);
    });
    return {
      preflight,
      source: script.src,
      loaded,
      scriptConnected: script.isConnected,
      titleRestored: document.title === priorTitle,
    };
  }, { source: `http://localhost:${livePort}/detect.js`, stateLabel: label });
  await page.waitForTimeout(2500);
  record.injection = result;
  record.impeccableConsole = record.console.filter((entry) => /impeccable/i.test(entry.text));
  record.overlayDom = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('body *')]
      .filter((el) => {
        const names = `${el.id} ${typeof el.className === 'string' ? el.className : ''}`.toLowerCase();
        return names.includes('impeccable') || names.includes('design-detector') || names.includes('detector-overlay');
      })
      .map((el) => ({ tag: el.tagName.toLowerCase(), id: el.id, className: typeof el.className === 'string' ? el.className : '', text: el.textContent?.trim().slice(0, 300) }))
      .slice(0, 60);
    return { nodes, matchingNodeCount: nodes.length };
  });
}

async function runView(browser, spec, livePort) {
  const run = await createPage(browser, spec.label, spec.viewport, spec.mode ?? 'normal');
  if (spec.form === 'create') await openCreate(run.page);
  if (spec.form === 'edit') await openEdit(run.page);
  if (spec.form === 'empty' || spec.form === 'error') {
    await openCreate(run.page);
    await run.setMode(spec.form);
    await chooseOrganization(run.page);
    await openRelatedUsers(run.page);
    await waitForPeopleState(run.page, spec.form);
  }
  if (spec.overlay) await injectDetect(run.page, livePort, spec.label, run.record);
  run.record.screenshotStatus = await saveScreenshot(run.page, `${prefix}.${spec.screenshot}.png`);
  run.record.dom = await stateEvidence(run.page, spec.label);
  run.record.screenshot = `${prefix}.${spec.screenshot}.png`;
  await run.context.close();
  return run.record;
}

async function preflight() {
  const outputName = `${prefix}.injection-preflight.json`;
  assertFreshOutputs([outputName]);
  const browser = await launchBrowser();
  const record = { browser: browser.version(), target: baseUrl, viewport: viewportDesktop };
  const run = await createPage(browser, 'preflight', viewportDesktop);
  record.result = await run.page.evaluate(() => {
    const priorTitle = document.title;
    document.title = `${priorTitle} [Assessment B preflight]`;
    const script = document.createElement('script');
    script.textContent = 'document.documentElement.dataset.assessmentBPreflight = "ok";';
    document.head.append(script);
    const result = {
      titleChanged: document.title !== priorTitle,
      scriptAppended: script.isConnected,
      scriptExecuted: document.documentElement.dataset.assessmentBPreflight === 'ok',
    };
    document.title = priorTitle;
    script.remove();
    delete document.documentElement.dataset.assessmentBPreflight;
    return { ...result, titleRestored: document.title === priorTitle };
  });
  record.blockedWrites = run.record.blockedWrites;
  record.failedRequests = run.record.failedRequests;
  record.pageErrors = run.record.pageErrors;
  writeJson(outputName, record);
  await browser.close();
  process.stdout.write(`${JSON.stringify(record)}\n`);
}

async function full(livePort) {
  if (!livePort || !/^\d+$/.test(livePort)) throw new Error('Pass the live-server port as the first argument.');
  assertFreshOutputs(allEvidenceNames.filter((name) => name.endsWith('.json') && name !== `${prefix}.injection-preflight.json`));
  const browser = await launchBrowser();
  const specs = [
    { label: 'create-desktop', viewport: viewportDesktop, form: 'create', screenshot: 'create-desktop' },
    { label: 'edit-desktop', viewport: viewportDesktop, form: 'edit', screenshot: 'edit-desktop' },
    { label: 'empty-desktop', viewport: viewportDesktop, form: 'empty', screenshot: 'empty-results-desktop' },
    { label: 'error-desktop', viewport: viewportDesktop, form: 'error', screenshot: 'error-desktop' },
    { label: 'create-mobile', viewport: viewportMobile, form: 'create', screenshot: 'create-mobile' },
    { label: 'edit-mobile', viewport: viewportMobile, form: 'edit', screenshot: 'edit-mobile' },
    { label: 'empty-mobile', viewport: viewportMobile, form: 'empty', screenshot: 'empty-results-mobile' },
    { label: 'error-mobile', viewport: viewportMobile, form: 'error', screenshot: 'error-mobile' },
    { label: 'overlay-list-desktop', viewport: viewportDesktop, form: 'list', screenshot: 'overlay-list-desktop', overlay: true },
    { label: 'overlay-create-desktop', viewport: viewportDesktop, form: 'create', screenshot: 'overlay-create-desktop', overlay: true },
    { label: 'overlay-empty-desktop', viewport: viewportDesktop, form: 'empty', screenshot: 'overlay-empty-desktop', overlay: true },
    { label: 'overlay-edit-mobile', viewport: viewportMobile, form: 'edit', screenshot: 'overlay-edit-mobile', overlay: true },
    { label: 'overlay-error-mobile', viewport: viewportMobile, form: 'error', screenshot: 'overlay-error-mobile', overlay: true },
  ];
  const records = [];
  try {
    for (const spec of specs) {
      process.stdout.write(`[start] ${spec.label}\n`);
      try {
        records.push(await runView(browser, spec, livePort));
        process.stdout.write(`[done] ${spec.label}\n`);
      } catch (error) {
        process.stderr.write(`[failed] ${spec.label}: ${error.stack ?? error}\n`);
        throw error;
      }
    }
  } finally {
    await browser.close();
  }
  const writeRequests = records.flatMap((record) => record.blockedWrites.map((entry) => ({ view: record.name, ...entry })));
  const consoleEvidence = records.map(({ name, viewport, console, pageErrors, failedRequests, apiResponses, impeccableConsole }) => ({
    name,
    viewport,
    console,
    pageErrors,
    failedRequests,
    apiResponses,
    impeccableConsole: impeccableConsole ?? [],
  }));
  const domEvidence = records.map(({ name, dom }) => ({ name, ...dom }));
  const injectionEvidence = records.filter((record) => record.injection).map(({ name, viewport, injection, impeccableConsole, overlayDom }) => ({
    name,
    viewport,
    injection,
    impeccableConsole,
    overlayDom,
  }));
  writeJson(`${prefix}.browser-run.log.json`, { browser: browser.version(), target: baseUrl, livePort: Number(livePort), views: records.map(({ name, screenshot, screenshotStatus, routeMocks, blockedWrites }) => ({ name, screenshot, screenshotStatus, routeMocks, blockedWrites })), blockedWrites: writeRequests });
  writeJson(`${prefix}.browser-dom.json`, domEvidence);
  writeJson(`${prefix}.browser-console.json`, consoleEvidence);
  writeJson(`${prefix}.injection-overlay.json`, injectionEvidence);
  writeJson(`${prefix}.overlay-dom.json`, injectionEvidence.map(({ name, viewport, overlayDom, impeccableConsole }) => ({ name, viewport, overlayDom, impeccableConsole })));
  process.stdout.write(`${JSON.stringify({ browser: browser.version(), count: records.length, viewNames: records.map((r) => r.name), screenshots: records.map((r) => r.screenshot), blockedWrites: writeRequests, overlayRuns: injectionEvidence.map(({ name, injection, impeccableConsole, overlayDom }) => ({ name, loaded: injection.loaded, impeccableConsoleCount: impeccableConsole.length, overlayNodeCount: overlayDom.matchingNodeCount })) }, null, 2)}\n`);
}

const command = process.argv[2] ?? 'full';
if (command === 'preflight') {
  preflight().catch((error) => { console.error(error.stack); process.exitCode = 1; });
} else {
  full(process.argv[3]).catch((error) => { console.error(error.stack); process.exitCode = 1; });
}
