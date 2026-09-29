const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const appRoot = path.resolve(__dirname, '../../../../other-admin/admin-vue3');
const appRequire = createRequire(path.join(appRoot, 'package.json'));
const { chromium } = appRequire('@playwright/test');

const outputDir = path.resolve(__dirname, process.argv[4] ?? '.');
fs.mkdirSync(outputDir, { recursive: true });
const baseUrl = 'http://127.0.0.1:30847';
const livePort = process.argv[3] || '8400';
const liveOrigin = `http://localhost:${livePort}`;
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const fixtures = {
  person: {
    path: '/authority/adminPerson',
    rowText: 'Assessment User',
    records: [
      {
        id: 'assessment-user-1',
        name: 'Assessment User',
        role: { name: 'Mock Operator' },
        roleName: 'Mock Operator',
        departmentName: 'Mock Department',
        departmentCode: 'mock-dept',
        status: 0,
      },
    ],
  },
  role: {
    path: '/authority/adminRole',
    rowText: 'Mock Operator',
    records: [
      {
        id: '100',
        name: 'Mock Operator',
        status: 0,
        iccPrivJson: [],
        adminPrivJson: [],
        cappPrivJson: [],
        orgPrivList: [],
      },
    ],
  },
};

const permissionActions = [
  '/admin/executor/create',
  '/admin/executor/delete',
  '/admin/trUserRole/createMany',
  '/admin/user/updatePwd',
  '/admin/user/update',
  '/admin/role/create',
  '/admin/role/delete',
  '/admin/role/update',
];

function writeJson(name, data) {
  const target = path.join(outputDir, name);
  if (fs.existsSync(target)) throw new Error(`Refusing to overwrite evidence: ${target}`);
  fs.writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function freshPath(name) {
  const target = path.join(outputDir, name);
  if (fs.existsSync(target)) throw new Error(`Refusing to overwrite evidence: ${target}`);
  return target;
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function waitWithTimeout(promise, label, timeoutMs = 20000) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Timed out waiting for ${label}`)), timeoutMs);
    }),
  ]).finally(() => clearTimeout(timer));
}

function apiBody(data) {
  return { code: 0, msg: 'Assessment B local Mock', data };
}

function personListBody() {
  return apiBody({ records: fixtures.person.records, total: fixtures.person.records.length });
}

function roleListBody() {
  return apiBody({ records: fixtures.role.records, total: fixtures.role.records.length });
}

function safeReadPost(pathname) {
  return (
    pathname.endsWith('/api/globals/list') ||
    pathname.endsWith('/api/menu/list') ||
    pathname.endsWith('/auth/v1/oauth/v2/permissions') ||
    pathname.endsWith('/auth/v1/oauth/v2/keepalive')
  );
}

async function fulfillJson(route, data, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });
}

async function createRun(browser, label, targetName, viewport, holdWrites = false) {
  const target = fixtures[targetName];
  const record = {
    label,
    target: `${baseUrl}${target.path}`,
    viewport,
    routeCheck: null,
    backendMocks: [],
    simulatedWrites: [],
    blockedWrites: [],
    blockedExternalRequests: [],
    pageErrors: [],
    failedRequests: [],
    console: [],
    pendingConsole: [],
    snapshots: {},
    screenshots: [],
    injection: null,
    overlayDom: null,
  };
  const controls = {
    holdWrites,
    writeStarted: deferred(),
    releaseWrite: deferred(),
    refreshStarted: deferred(),
    releaseRefresh: deferred(),
    writeResolved: false,
    listRequests: 0,
  };

  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: viewport.width < 500,
    hasTouch: viewport.width < 500,
  });

  await context.addInitScript(() => {
    localStorage.setItem('vue_admin_template_token', 'assessment-b-local-mock-token');
    localStorage.setItem('is_admin', 'true');
    localStorage.setItem('back_user_id', '1');
    localStorage.setItem('back_username', 'Assessment B');
  });

  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const pathname = url.pathname;

    if (url.origin === liveOrigin) {
      await route.continue();
      return;
    }

    if (url.origin === baseUrl && pathname.startsWith('/linkx/admin/')) {
      const mock = { method, path: pathname, status: 200, state: 'fulfilled' };
      record.backendMocks.push(mock);

      if (pathname.endsWith('/auth/v1/user/page') && method === 'GET') {
        controls.listRequests += 1;
        if (holdWrites && controls.writeResolved && controls.listRequests > 1) {
          mock.state = 'held-refresh';
          controls.refreshStarted.resolve({ method, path: pathname });
          await controls.releaseRefresh.promise;
        }
        await fulfillJson(route, personListBody());
        return;
      }

      if (pathname.endsWith('/api/role') && method === 'GET') {
        controls.listRequests += 1;
        if (holdWrites && controls.writeResolved && controls.listRequests > 1) {
          mock.state = 'held-refresh';
          controls.refreshStarted.resolve({ method, path: pathname });
          await controls.releaseRefresh.promise;
        }
        await fulfillJson(route, roleListBody());
        return;
      }

      if (pathname.endsWith('/api/globals/list')) {
        await fulfillJson(route, apiBody([]));
        return;
      }

      if (pathname.endsWith('/auth/v1/oauth/v2/permissions')) {
        await fulfillJson(route, apiBody({ type: 0, menus: [], actions: permissionActions }));
        return;
      }

      if (pathname.endsWith('/api/menu/list')) {
        await fulfillJson(route, apiBody([]));
        return;
      }

      if (pathname.endsWith('/auth/v1/oauth/v2/keepalive')) {
        await fulfillJson(route, apiBody({}));
        return;
      }

      const isPersonStatusWrite =
        method === 'PUT' && /\/auth\/v1\/user\/[^/]+\/status\/\d+$/.test(pathname);
      const isRoleUpdateWrite = method === 'PUT' && pathname.endsWith('/api/role');
      if (holdWrites && (isPersonStatusWrite || isRoleUpdateWrite)) {
        record.simulatedWrites.push({ method, path: pathname, state: 'held-mock-response' });
        controls.writeStarted.resolve({ method, path: pathname });
        await controls.releaseWrite.promise;
        controls.writeResolved = true;
        record.simulatedWrites[record.simulatedWrites.length - 1].state = 'mock-success';
        await fulfillJson(route, apiBody({}));
        return;
      }

      if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !safeReadPost(pathname)) {
        record.blockedWrites.push({ method, path: pathname, reason: 'No mock write scenario was authorized for this request.' });
        await fulfillJson(route, { code: 403, msg: 'Assessment B blocked an unplanned write', data: null }, 403);
        return;
      }

      await fulfillJson(route, apiBody([]));
      return;
    }

    if (url.origin === baseUrl) {
      await route.continue();
      return;
    }

    record.blockedExternalRequests.push({ method, url: `${url.origin}${pathname}` });
    await route.abort('blockedbyclient');
  });

  const page = await context.newPage();
  page.on('console', (message) => {
    const pending = Promise.all(
      message.args().map((arg) =>
        arg
          .evaluate((value) => {
            if (value instanceof Element) {
              return {
                kind: 'element',
                tag: value.tagName.toLowerCase(),
                id: value.id,
                className: typeof value.className === 'string' ? value.className : '',
                text: value.textContent?.trim().slice(0, 180) ?? '',
              };
            }
            return { kind: typeof value, value: ['string', 'number', 'boolean'].includes(typeof value) ? value : null };
          })
          .catch(() => ({ kind: 'unavailable' })),
      ),
    ).then((args) => {
      record.console.push({ type: message.type(), text: message.text(), args });
    });
    record.pendingConsole.push(pending);
  });
  page.on('pageerror', (error) => record.pageErrors.push(String(error)));
  page.on('requestfailed', (request) => {
    const url = new URL(request.url());
    if (url.origin === baseUrl || url.origin === liveOrigin) {
      record.failedRequests.push({ method: request.method(), path: url.pathname, error: request.failure()?.errorText });
    }
  });

  await page.goto(record.target, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByText(target.rowText, { exact: true }).first().waitFor({ state: 'visible', timeout: 20000 });
  record.routeCheck = await routeCheck(page, target);
  return { context, page, record, controls };
}

async function routeCheck(page, target) {
  return page.evaluate(({ expectedPath, rowText }) => {
    const pathname = window.location.pathname;
    const bodyText = document.body.innerText;
    return {
      requestedPath: expectedPath,
      finalPath: pathname,
      routeMatched: pathname === expectedPath,
      loginPath: pathname === '/login',
      passwordInputCount: document.querySelectorAll('input[type="password"]').length,
      loginTextVisible: /登录|sign in/i.test(bodyText),
      fixtureRowVisible: bodyText.includes(rowText),
      title: document.title,
      headings: [...document.querySelectorAll('h1,h2,h3,[role="heading"]')]
        .map((el) => el.textContent?.trim())
        .filter(Boolean),
    };
  }, { expectedPath: target.path, rowText: target.rowText });
}

async function captureState(page, label, target) {
  const snapshot = await page.evaluate(({ stateLabel, rowText }) => {
    const rows = [...document.querySelectorAll('.el-table__body-wrapper tbody tr, .el-table__body tr')];
    const row = rows.find((item) => item.innerText.includes(rowText));
    const controls = row
      ? [...row.querySelectorAll('button,[role="switch"],[aria-busy]')].map((element) => ({
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute('role'),
          text: element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 80) ?? '',
          disabled: 'disabled' in element ? element.disabled : element.getAttribute('aria-disabled') === 'true',
          ariaDisabled: element.getAttribute('aria-disabled'),
          ariaBusy: element.getAttribute('aria-busy'),
          ariaLabel: element.getAttribute('aria-label'),
          className: typeof element.className === 'string' ? element.className : '',
        }))
      : [];
    return {
      label: stateLabel,
      url: window.location.href,
      title: document.title,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      loginPath: window.location.pathname === '/login',
      passwordInputCount: document.querySelectorAll('input[type="password"]').length,
      fixtureRowVisible: document.body.innerText.includes(rowText),
      rowText: row?.innerText.replace(/\s+/g, ' ').trim() ?? null,
      rowControls: controls,
      tableLoading: Boolean(document.querySelector('.el-table__inner-wrapper > .el-loading-mask, .el-table .el-loading-mask')),
      dialogTitles: [...document.querySelectorAll('.el-dialog__title')].map((el) => el.textContent?.trim()).filter(Boolean),
      visibleText: document.body.innerText.slice(0, 4500),
    };
  }, { stateLabel: label, rowText: target.rowText });
  return snapshot;
}

async function saveScreenshot(page, record, name) {
  const target = freshPath(`${name}.png`);
  await page.screenshot({ path: target, fullPage: false, animations: 'disabled' });
  const relativePath = path.relative(__dirname, target);
  record.screenshots.push(relativePath);
  return relativePath;
}

async function flushConsole(record) {
  await Promise.all(record.pendingConsole);
  record.pendingConsole = [];
}

async function injectDetector(page, record, label, livePort) {
  const before = await page.evaluate(() => ({
    title: document.title,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
  }));
  const injection = await page.evaluate(async ({ source, stateLabel }) => {
    const originalTitle = document.title;
    document.title = `${originalTitle} [${stateLabel}]`;
    const marker = document.createElement('script');
    marker.textContent = 'document.documentElement.dataset.assessmentBMutable = "ok";';
    document.head.append(marker);
    const preflight = {
      titleChanged: document.title !== originalTitle,
      scriptAppended: marker.isConnected,
      scriptExecuted: document.documentElement.dataset.assessmentBMutable === 'ok',
    };
    marker.remove();
    delete document.documentElement.dataset.assessmentBMutable;
    document.title = originalTitle;

    const script = document.createElement('script');
    script.src = source;
    script.async = true;
    const loaded = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve('timeout'), 10000);
      script.addEventListener('load', () => {
        clearTimeout(timer);
        resolve('load');
      }, { once: true });
      script.addEventListener('error', () => {
        clearTimeout(timer);
        resolve('error');
      }, { once: true });
      document.head.append(script);
    });
    return {
      preflight,
      source: script.src,
      loaded,
      scriptConnected: script.isConnected,
      titleRestored: document.title === originalTitle,
    };
  }, { source: `http://localhost:${livePort}/detect.js`, stateLabel: label });

  if (injection.loaded === 'load') await page.waitForTimeout(2500);
  const after = await page.evaluate(() => ({
    title: document.title,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
  }));
  record.injection = { ...injection, before, after };
  record.overlayDom = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('body *')]
      .filter((element) => {
        const names = `${element.id} ${typeof element.className === 'string' ? element.className : ''}`.toLowerCase();
        return names.includes('impeccable-overlay') || names.includes('impeccable-label') || names.includes('impeccable-banner');
      })
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        id: element.id,
        className: typeof element.className === 'string' ? element.className : '',
        text: element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 240) ?? '',
        visible: element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0,
      }))
      .slice(0, 120);
    return { nodes, count: nodes.length };
  });
  await flushConsole(record);
  if (injection.loaded === 'load') await saveScreenshot(page, record, `${label}.overlay`);
}

async function runNormal(browser, targetName, viewport, overlay, livePort) {
  const viewportName = viewport.width < 500 ? '390' : 'desktop';
  const label = `${targetName}-${viewportName}-normal`;
  const run = await createRun(browser, label, targetName, viewport, false);
  try {
    run.record.snapshots.normal = await captureState(run.page, `${label}-before-overlay`, fixtures[targetName]);
    await saveScreenshot(run.page, run.record, label);
    if (overlay) await injectDetector(run.page, run.record, label, livePort);
    await flushConsole(run.record);
    return run.record;
  } finally {
    await run.context.close();
  }
}

async function runPersonBusy(browser, viewport, overlay, livePort) {
  const viewportName = viewport.width < 500 ? '390' : 'desktop';
  const label = `person-${viewportName}-status-refresh`;
  const run = await createRun(browser, label, 'person', viewport, true);
  const row = run.page.locator('.el-table__body-wrapper tbody tr, .el-table__body tr').filter({ hasText: fixtures.person.rowText }).first();
  try {
    const statusSwitch = row.locator('.el-switch');
    await statusSwitch.waitFor({ state: 'visible', timeout: 10000 });
    await statusSwitch.click();
    const mutation = await waitWithTimeout(run.controls.writeStarted.promise, 'mock person status request');
    await run.page.waitForFunction(
      (rowText) => {
        const rowElement = [...document.querySelectorAll('.el-table__body-wrapper tbody tr, .el-table__body tr')]
          .find((element) => element.innerText.includes(rowText));
        return rowElement?.querySelector('.el-switch')?.getAttribute('aria-busy') === 'true';
      },
      fixtures.person.rowText,
      { timeout: 10000 },
    );
    run.record.snapshots.mutationPending = await captureState(run.page, `${label}-mutation-pending`, fixtures.person);
    run.record.snapshots.mutationPending.mockRequest = mutation;
    await saveScreenshot(run.page, run.record, `${label}.mutation-pending`);

    run.controls.releaseWrite.resolve();
    const refresh = await waitWithTimeout(run.controls.refreshStarted.promise, 'mock person list refresh');
    await run.page.waitForFunction(
      (rowText) => {
        const rowElement = [...document.querySelectorAll('.el-table__body-wrapper tbody tr, .el-table__body tr')]
          .find((element) => element.innerText.includes(rowText));
        return rowElement?.querySelector('.el-switch')?.getAttribute('aria-busy') === 'true';
      },
      fixtures.person.rowText,
      { timeout: 10000 },
    );
    run.record.snapshots.refreshWaiting = await captureState(run.page, `${label}-refresh-waiting`, fixtures.person);
    run.record.snapshots.refreshWaiting.mockRequest = refresh;
    await saveScreenshot(run.page, run.record, `${label}.refresh-waiting`);
    if (overlay) await injectDetector(run.page, run.record, `${label}-refresh-waiting`, livePort);

    run.controls.releaseRefresh.resolve();
    await run.page.waitForFunction(
      (rowText) => {
        const rowElement = [...document.querySelectorAll('.el-table__body-wrapper tbody tr, .el-table__body tr')]
          .find((element) => element.innerText.includes(rowText));
        return rowElement?.querySelector('.el-switch')?.getAttribute('aria-busy') !== 'true';
      },
      fixtures.person.rowText,
      { timeout: 15000 },
    );
    run.record.snapshots.settled = await captureState(run.page, `${label}-settled`, fixtures.person);
    await flushConsole(run.record);
    return run.record;
  } finally {
    run.controls.releaseWrite.resolve();
    run.controls.releaseRefresh.resolve();
    await run.context.close();
  }
}

async function runRoleEditBusy(browser, viewport, overlay, livePort) {
  const viewportName = viewport.width < 500 ? '390' : 'desktop';
  const label = `role-${viewportName}-edit-refresh`;
  const run = await createRun(browser, label, 'role', viewport, true);
  const row = run.page.locator('.el-table__body-wrapper tbody tr, .el-table__body tr').filter({ hasText: fixtures.role.rowText }).first();
  try {
    await row.getByRole('button', { name: '编辑', exact: true }).click();
    const saveButton = run.page.getByRole('button', { name: '保存', exact: true });
    await saveButton.waitFor({ state: 'visible', timeout: 15000 });
    await run.page.waitForFunction(
      () => {
        const button = [...document.querySelectorAll('.el-dialog__footer button')]
          .find((element) => element.textContent?.trim() === '保存');
        return button && !button.disabled;
      },
      null,
      { timeout: 20000 },
    );
    await saveButton.click();
    const mutation = await waitWithTimeout(run.controls.writeStarted.promise, 'mock role edit request');
    run.record.snapshots.mutationPending = await captureState(run.page, `${label}-mutation-pending`, fixtures.role);
    run.record.snapshots.mutationPending.mockRequest = mutation;
    run.record.snapshots.mutationPending.saveButton = {
      disabled: await saveButton.isDisabled().catch(() => null),
      ariaBusy: await saveButton.getAttribute('aria-busy').catch(() => null),
    };
    await saveScreenshot(run.page, run.record, `${label}.mutation-pending`);

    run.controls.releaseWrite.resolve();
    const refresh = await waitWithTimeout(run.controls.refreshStarted.promise, 'mock role list refresh');
    await run.page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 10000 });
    await run.page.waitForFunction(
      (rowText) => {
        const rowElement = [...document.querySelectorAll('.el-table__body-wrapper tbody tr, .el-table__body tr')]
          .find((element) => element.innerText.includes(rowText));
        const buttons = rowElement ? [...rowElement.querySelectorAll('button')] : [];
        return buttons.length > 0 && buttons.every((button) => button.disabled);
      },
      fixtures.role.rowText,
      { timeout: 10000 },
    );
    run.record.snapshots.refreshWaiting = await captureState(run.page, `${label}-refresh-waiting`, fixtures.role);
    run.record.snapshots.refreshWaiting.mockRequest = refresh;
    run.record.snapshots.refreshWaiting.actionButtonsAllDisabled = true;
    await saveScreenshot(run.page, run.record, `${label}.refresh-waiting`);
    if (overlay) await injectDetector(run.page, run.record, `${label}-refresh-waiting`, livePort);

    run.controls.releaseRefresh.resolve();
    await run.page.waitForFunction(
      (rowText) => {
        const rowElement = [...document.querySelectorAll('.el-table__body-wrapper tbody tr, .el-table__body tr')]
          .find((element) => element.innerText.includes(rowText));
        const buttons = rowElement ? [...rowElement.querySelectorAll('button')] : [];
        return buttons.length > 0 && buttons.every((button) => !button.disabled);
      },
      fixtures.role.rowText,
      { timeout: 15000 },
    );
    run.record.snapshots.settled = await captureState(run.page, `${label}-settled`, fixtures.role);
    await flushConsole(run.record);
    return run.record;
  } finally {
    run.controls.releaseWrite.resolve();
    run.controls.releaseRefresh.resolve();
    await run.context.close();
  }
}

async function launchBrowser() {
  return chromium.launch({ executablePath: chromePath, headless: true });
}

async function preflight() {
  const browser = await launchBrowser();
  const run = await createRun(browser, 'preflight-person-desktop', 'person', { width: 1280, height: 800 }, false);
  try {
    const mutation = await run.page.evaluate(() => {
      const originalTitle = document.title;
      document.title = `${originalTitle} [Assessment B preflight]`;
      const script = document.createElement('script');
      script.textContent = 'document.documentElement.dataset.assessmentBPreflight = "ok";';
      document.head.append(script);
      const result = {
        titleChanged: document.title !== originalTitle,
        scriptAppended: script.isConnected,
        scriptExecuted: document.documentElement.dataset.assessmentBPreflight === 'ok',
      };
      document.title = originalTitle;
      script.remove();
      delete document.documentElement.dataset.assessmentBPreflight;
      return { ...result, titleRestored: document.title === originalTitle };
    });
    await flushConsole(run.record);
    const result = {
      browser: browser.version(),
      runner: '@playwright/test 1.58.0',
      target: run.record.target,
      routeCheck: run.record.routeCheck,
      mutableInjection: mutation,
      backendMockCount: run.record.backendMocks.length,
      backendMocks: run.record.backendMocks,
      blockedExternalRequests: run.record.blockedExternalRequests,
      blockedWrites: run.record.blockedWrites,
      pageErrors: run.record.pageErrors,
      console: run.record.console,
      success: Boolean(run.record.routeCheck?.routeMatched && !run.record.routeCheck?.loginPath && run.record.routeCheck?.fixtureRowVisible && mutation.titleChanged && mutation.scriptAppended && mutation.scriptExecuted && mutation.titleRestored),
    };
    writeJson('injection-preflight.json', result);
    if (!result.success) process.exitCode = 2;
    process.stdout.write(`${JSON.stringify({ success: result.success, target: result.target, routeCheck: result.routeCheck, mutableInjection: result.mutableInjection }, null, 2)}\n`);
  } finally {
    await run.context.close();
    await browser.close();
  }
}

async function full(livePort) {
  if (!/^\d+$/.test(String(livePort ?? ''))) throw new Error('Pass the Impeccable live-server port.');
  const browser = await launchBrowser();
  const runs = [];
  try {
    const desktop = { width: 1280, height: 800 };
    const mobile = { width: 390, height: 844 };
    runs.push(await runNormal(browser, 'person', desktop, true, livePort));
    runs.push(await runNormal(browser, 'person', mobile, false, livePort));
    runs.push(await runNormal(browser, 'role', desktop, true, livePort));
    runs.push(await runNormal(browser, 'role', mobile, false, livePort));
    runs.push(await runPersonBusy(browser, desktop, true, livePort));
    runs.push(await runPersonBusy(browser, mobile, true, livePort));
    runs.push(await runRoleEditBusy(browser, desktop, false, livePort));
    runs.push(await runRoleEditBusy(browser, mobile, true, livePort));
  } finally {
    await browser.close();
  }

  const consoleEvidence = runs.map(({ label, target, viewport, console, pageErrors, failedRequests }) => ({
    label,
    target,
    viewport,
    console,
    pageErrors,
    failedRequests,
  }));
  const routeEvidence = runs.map(({ label, target, viewport, backendMocks, simulatedWrites, blockedWrites, blockedExternalRequests }) => ({
    label,
    target,
    viewport,
    backendMocks,
    simulatedWrites,
    blockedWrites,
    blockedExternalRequests,
  }));
  const overlayRuns = runs
    .filter((run) => run.injection)
    .map(({ label, target, viewport, injection, overlayDom, console }) => ({
      label,
      target,
      viewport,
      injection,
      overlayDom,
      impeccableConsole: console.filter((entry) => /impeccable/i.test(entry.text)),
    }));
  writeJson('browser-run.log.json', {
    browser: browser.version(),
    runner: '@playwright/test 1.58.0',
    viewCount: runs.length,
    viewports: ['1280x800', '390x844'],
    allBackendRequestsIntercepted: runs.every((run) => run.backendMocks.length > 0),
    unplannedWrites: runs.flatMap((run) => run.blockedWrites.map((entry) => ({ view: run.label, ...entry }))),
    simulatedWrites: runs.flatMap((run) => run.simulatedWrites.map((entry) => ({ view: run.label, ...entry }))),
    targetChecks: runs.map(({ label, target, routeCheck }) => ({ label, target, ...routeCheck })),
    screenshots: runs.flatMap((run) => run.screenshots.map((screenshot) => ({ view: run.label, screenshot }))),
    overlaySummary: overlayRuns.map(({ label, injection, overlayDom, impeccableConsole }) => ({
      label,
      loaded: injection.loaded,
      preflight: injection.preflight,
      overlayNodeCount: overlayDom.count,
      messages: impeccableConsole.map((entry) => entry.text),
      beforeViewport: injection.before.viewport,
      afterViewport: injection.after.viewport,
      beforeDocument: injection.before.document,
      afterDocument: injection.after.document,
    })),
    failures: runs.flatMap((run) => run.pageErrors.map((error) => ({ view: run.label, error }))),
  });
  writeJson('browser-dom.json', runs.map(({ label, target, viewport, routeCheck, snapshots, injection, overlayDom }) => ({
    label,
    target,
    viewport,
    routeCheck,
    snapshots,
    injection,
    overlayDom,
  })));
  writeJson('browser-console.json', consoleEvidence);
  writeJson('backend-mocks.json', routeEvidence);
  writeJson('injection-overlay.json', overlayRuns);
  writeJson('overlay-dom.json', overlayRuns.map(({ label, target, viewport, overlayDom, impeccableConsole, injection }) => ({
    label,
    target,
    viewport,
    injection,
    overlayDom,
    impeccableConsole,
  })));
  process.stdout.write(`${JSON.stringify({
    browser: browser.version(),
    viewCount: runs.length,
    routeChecksPassed: runs.every((run) => run.routeCheck?.routeMatched && !run.routeCheck?.loginPath && run.routeCheck?.fixtureRowVisible),
    simulatedWriteCount: runs.reduce((count, run) => count + run.simulatedWrites.length, 0),
    unplannedWriteCount: runs.reduce((count, run) => count + run.blockedWrites.length, 0),
    overlayRuns: overlayRuns.map(({ label, injection, overlayDom, impeccableConsole }) => ({
      label,
      loaded: injection.loaded,
      overlayNodeCount: overlayDom.count,
      messages: impeccableConsole.map((entry) => entry.text),
    })),
    pageErrors: runs.flatMap((run) => run.pageErrors.map((error) => ({ view: run.label, error }))),
  }, null, 2)}\n`);
}

if (process.argv[2] === 'preflight') {
  preflight().catch((error) => {
    process.stderr.write(`${error.stack ?? error}\n`);
    process.exitCode = 1;
  });
} else {
  full(process.argv[3]).catch((error) => {
    process.stderr.write(`${error.stack ?? error}\n`);
    process.exitCode = 1;
  });
}
