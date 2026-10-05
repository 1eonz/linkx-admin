import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const repoRoot = 'F:/work/linkx-admin';
const evidenceRoot = path.join(
  repoRoot,
  '.impeccable/critique/wave1-lxpasswordinput-2026-10-05/postfix-2026-10-06/final-assessment-b',
);
const targetUrl = 'http://127.0.0.1:4182/components/lxpasswordinput';
const require = createRequire(path.join(repoRoot, 'other-admin/admin-vue3/package.json'));
const { chromium } = require('@playwright/test');
const playwrightVersion = JSON.parse(await fs.readFile(
  path.join(path.dirname(require.resolve('@playwright/test')), 'package.json'),
  'utf8',
)).version;

await fs.mkdir(evidenceRoot, { recursive: true });

function writeJson(file, value) {
  return fs.writeFile(path.join(evidenceRoot, file), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function captureConsole(page) {
  const messages = [];
  page.on('console', (msg) => {
    messages.push({ type: msg.type(), text: msg.text(), location: msg.location() });
  });
  page.on('pageerror', (err) => messages.push({ type: 'pageerror', text: err.message }));
  page.on('requestfailed', (req) => messages.push({
    type: 'requestfailed',
    url: req.url(),
    error: req.failure()?.errorText || 'unknown',
  }));
  return messages;
}

async function openPage(browser, { width, height, colorScheme = 'light', reducedMotion = 'no-preference' }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    colorScheme,
    reducedMotion,
  });
  const page = await context.newPage();
  const messages = captureConsole(page);
  const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('.password-input-demo').waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(900);
  return { context, page, messages, response };
}

async function detectorPayload(page, serverBase) {
  const scriptResponse = await fetch(`${serverBase}/detect.js`);
  const scriptText = await scriptResponse.text();
  const hash = createHash('sha256').update(scriptText).digest('hex');
  if (!scriptResponse.ok) throw new Error(`detect.js HTTP ${scriptResponse.status}`);

  await page.addScriptTag({ url: `${serverBase}/detect.js` });
  await page.waitForFunction(() => typeof window.impeccableScan === 'function', { timeout: 10000 });
  await page.waitForTimeout(400);
  const scan = await page.evaluate(() => {
    const findings = window.impeccableScan();
    const nodeLabel = (node) => {
      const classes = [...(node.classList || [])].slice(0, 4);
      return `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ''}${classes.length ? `.${classes.join('.')}` : ''}`;
    };
    const classification = (node) => {
      if (node.closest('.password-input-demo')) return 'component-demo';
      if (node.closest('.lx-password-input__focus-root, .lx-password-input, .el-input')) return 'component';
      if (node.closest('.VPSidebar, .VPNav, .VPNavBar, .VPFooter, .VPDocAside, .VPMenu')) return 'docs-shell';
      if (node.closest('.vp-doc table')) return 'props-table';
      if (node.closest('.vp-doc')) return 'documentation-content';
      return 'other';
    };
    const targetPath = (node) => {
      const parts = [];
      let current = node;
      while (current && current !== document.body && parts.length < 6) {
        parts.unshift(nodeLabel(current));
        current = current.parentElement;
      }
      return parts.join(' > ');
    };
    const serialized = findings.map(({ el, findings: entries }) => ({
      target: nodeLabel(el),
      targetPath: targetPath(el),
      classification: classification(el),
      text: (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 140),
      rect: el.getBoundingClientRect ? el.getBoundingClientRect().toJSON() : null,
      pageLevel: el === document.body || el === document.documentElement,
      findings: entries.map((item) => ({
        type: item.type || item.id,
        detail: item.detail || item.snippet || '',
        severity: item.severity || 'warning',
      })),
    }));
    const overlayElements = [...document.querySelectorAll('[class*="impeccable-overlay"], [class*="impeccable-banner"]')]
      .map((node) => ({
        className: node.className?.baseVal || node.className || '',
        text: (node.innerText || node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 180),
        rect: node.getBoundingClientRect().toJSON(),
        visible: getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden',
      }));
    return { count: serialized.length, findings: serialized, overlayElements };
  });
  await page.waitForTimeout(1100);
  return {
    script: { url: `${serverBase}/detect.js`, status: scriptResponse.status, bytes: scriptText.length, sha256: hash },
    scan,
  };
}

async function rootAndNavMetrics(page) {
  return page.evaluate(() => {
    const previousScroll = { x: window.scrollX, y: window.scrollY };
    const root = document.documentElement;
    const body = document.body;
    const demo = document.querySelector('.password-input-demo');
    const navCandidates = [...document.querySelectorAll('.VPNav, .VPNavBar, #VPNavBar, nav, header')];
    const describeNav = (node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        selector: node.className?.baseVal || node.className || node.tagName.toLowerCase(),
        position: style.position,
        display: style.display,
        visibility: style.visibility,
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
      };
    };
    const navBefore = navCandidates.map(describeNav);
    if (demo) demo.scrollIntoView({ block: 'start', behavior: 'instant' });
    const demoRect = demo?.getBoundingClientRect();
    const navAfter = navCandidates.map(describeNav);
    const fixedNav = navCandidates.find((node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return ['fixed', 'sticky'].includes(style.position)
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && rect.bottom > 0
        && rect.top < innerHeight;
    });
    const fixedNavRect = fixedNav?.getBoundingClientRect();
    const demoStyle = demo ? getComputedStyle(demo) : null;
    const result = {
      viewport: { width: innerWidth, height: innerHeight },
      root: {
        clientWidth: root.clientWidth,
        scrollWidth: root.scrollWidth,
        horizontalOverflow: root.scrollWidth > root.clientWidth + 1,
      },
      body: {
        clientWidth: body.clientWidth,
        scrollWidth: body.scrollWidth,
        horizontalOverflow: body.scrollWidth > body.clientWidth + 1,
      },
      demoNavigation: demo ? {
        applicableFixedNav: Boolean(fixedNav),
        fixedNavSelector: fixedNav ? fixedNav.className?.baseVal || fixedNav.className || fixedNav.tagName.toLowerCase() : null,
        fixedNavPosition: fixedNav ? getComputedStyle(fixedNav).position : null,
        fixedNavBottom: fixedNavRect?.bottom ?? null,
        demoTopAfterScrollIntoView: demoRect.top,
        gapBelowFixedNav: fixedNavRect ? demoRect.top - fixedNavRect.bottom : null,
        demoScrollMarginBlockStart: demoStyle.scrollMarginBlockStart,
        navCandidatesBeforeScroll: navBefore,
        navCandidatesAfterScroll: navAfter,
      } : { applicableFixedNav: false, navCandidatesBeforeScroll: navBefore, navCandidatesAfterScroll: navAfter },
    };
    window.scrollTo({ left: previousScroll.x, top: previousScroll.y, behavior: 'instant' });
    return result;
  });
}

async function horizontalOverflowMetrics(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const readLayout = () => ({
      root: {
        clientWidth: root.clientWidth,
        scrollWidth: root.scrollWidth,
        maxScrollLeft: Math.max(0, root.scrollWidth - root.clientWidth),
      },
      body: {
        clientWidth: body.clientWidth,
        scrollWidth: body.scrollWidth,
        maxScrollLeft: Math.max(0, body.scrollWidth - body.clientWidth),
      },
    });
    const actualLayout = readLayout();
    const overwideNodes = [...document.querySelectorAll('body *')]
      .map((node) => ({ node, rect: node.getBoundingClientRect() }))
      .filter(({ node, rect }) => rect.width > 0 && rect.right > innerWidth + 1 && !node.classList?.contains('impeccable-overlay'))
      .sort((a, b) => b.rect.right - a.rect.right)
      .slice(0, 12)
      .map(({ node, rect }) => ({
        tag: node.tagName.toLowerCase(),
        id: node.id || '',
        className: node.className?.baseVal || node.className || '',
        left: rect.left,
        right: rect.right,
        width: rect.width,
        position: getComputedStyle(node).position,
      }));
    const overlayElements = [...document.querySelectorAll('.impeccable-overlay, .impeccable-spotlight-backdrop')]
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          node,
          parent: node.parentElement,
          className: node.className?.baseVal || node.className || '',
          left: rect.left,
          right: rect.right,
          width: rect.width,
          position: getComputedStyle(node).position,
          visible: getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden',
        };
      })
      .filter((node) => node.width > 0 || node.visible);
    const overlayDescendants = [...document.querySelectorAll('.impeccable-overlay *')]
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          tag: node.tagName.toLowerCase(),
          className: node.className?.baseVal || node.className || '',
          text: (node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100),
          left: rect.left,
          right: rect.right,
          width: rect.width,
          position: getComputedStyle(node).position,
          visible: getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden',
        };
      })
      .filter((node) => node.width > 0 || node.visible);

    const groups = new Map();
    for (const item of overlayElements) {
      if (!item.parent) continue;
      if (!groups.has(item.parent)) groups.set(item.parent, []);
      groups.get(item.parent).push(item.node);
    }
    const markers = [];
    for (const [parent, nodes] of groups) {
      const marker = document.createComment('overlay-size-check');
      parent.insertBefore(marker, nodes[0]);
      markers.push({ marker, nodes });
    }
    for (const item of overlayElements) item.node.remove();
    const withoutOverlayNodes = readLayout();
    for (const { marker, nodes } of markers) {
      const fragment = document.createDocumentFragment();
      for (const node of nodes) fragment.append(node);
      marker.parentNode.insertBefore(fragment, marker);
      marker.remove();
    }

    return {
      viewportWidth: innerWidth,
      scrollX: window.scrollX,
      ...actualLayout,
      withoutOverlayNodes,
      overwideNodes,
      overlayNodes: overlayElements.map(({ node: _node, parent: _parent, ...item }) => item),
      overlayDescendants,
    };
  });
}

async function propsTableMetrics(page) {
  return page.evaluate(() => {
    const table = [...document.querySelectorAll('.vp-doc table')]
      .find((node) => node.textContent.includes('modelValue'));
    if (!table) return { found: false };
    const ancestors = [];
    const candidates = [table];
    let current = table.parentElement;
    while (current && current !== document.body) {
      const style = getComputedStyle(current);
      const item = {
        tag: current.tagName.toLowerCase(),
        className: current.className?.baseVal || current.className || '',
        overflowX: style.overflowX,
        clientWidth: current.clientWidth,
        scrollWidth: current.scrollWidth,
        maxScrollLeft: Math.max(0, current.scrollWidth - current.clientWidth),
      };
      ancestors.push(item);
      candidates.push(current);
      current = current.parentElement;
    }
    candidates.push(document.body, document.documentElement);
    const scrollTests = candidates.map((node) => {
      const style = getComputedStyle(node);
      const before = node.scrollLeft;
      const maxScrollLeft = Math.max(0, node.scrollWidth - node.clientWidth);
      node.scrollLeft = Math.min(80, maxScrollLeft);
      const after = node.scrollLeft;
      node.scrollLeft = before;
      return {
        tag: node.tagName.toLowerCase(),
        className: node.className?.baseVal || node.className || '',
        overflowX: style.overflowX,
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        maxScrollLeft,
        trialScrollLeft: after,
        scrollable: after > before,
      };
    });
    const scrollHost = scrollTests.find((item) => item.scrollable && /auto|scroll|overlay/.test(item.overflowX)) || null;
    const tableRect = table.getBoundingClientRect();
    return {
      found: true,
      table: {
        width: tableRect.width,
        left: tableRect.left,
        right: tableRect.right,
        clientWidth: table.clientWidth,
        scrollWidth: table.scrollWidth,
        overflowX: getComputedStyle(table).overflowX,
      },
      scrollHost,
      ancestors,
      scrollTests,
      root: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        maxScrollLeft: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      },
    };
  });
}

async function demoStatesMetrics(page) {
  return page.evaluate(() => {
    const names = ['password-input-demo', 'password-input-readonly', 'password-input-disabled'];
    const inputs = Object.fromEntries(names.map((id) => {
      const input = document.getElementById(id);
      if (!input) return [id, null];
      const rect = input.getBoundingClientRect();
      return [id, {
        type: input.type,
        readOnly: input.readOnly,
        disabled: input.disabled,
        rect: rect.toJSON(),
      }];
    }));
    const buttons = [...document.querySelectorAll('.password-input-demo__actions button')].map((button) => {
      const rect = button.getBoundingClientRect();
      return { text: button.textContent.trim(), width: rect.width, height: rect.height, min44: rect.height >= 44 && rect.width >= 44 };
    });
    const toggle = document.querySelector('.lx-password-input__toggle');
    const toggleRect = toggle?.getBoundingClientRect();
    const demo = document.querySelector('.password-input-demo');
    return {
      inputs,
      actionButtons: buttons,
      passwordVisibilityButton: toggleRect ? {
        width: toggleRect.width,
        height: toggleRect.height,
        min44: toggleRect.width >= 44 && toggleRect.height >= 44,
      } : null,
      demoClass: demo?.className || '',
      hudBackground: demo ? getComputedStyle(demo).backgroundColor : null,
      activeElement: document.activeElement?.id || document.activeElement?.tagName?.toLowerCase() || null,
    };
  });
}

async function runPreflight(browser) {
  const { context, page, messages, response } = await openPage(browser, {
    width: 1280,
    height: 900,
    colorScheme: 'light',
  });
  const result = await page.evaluate(() => {
    const originalTitle = document.title;
    const marker = `pw-injection-preflight-${Date.now()}`;
    document.title = marker;
    const script = document.createElement('script');
    script.dataset.pwPreflight = marker;
    script.textContent = `window.__impeccablePwPreflight = ${JSON.stringify(marker)};`;
    document.head.append(script);
    return {
      originalTitle,
      changedTitle: document.title,
      scriptInserted: script.isConnected,
      scriptExecuted: window.__impeccablePwPreflight === marker,
      scriptTagCount: document.querySelectorAll(`script[data-pw-preflight="${marker}"]`).length,
    };
  });
  await page.screenshot({ path: path.join(evidenceRoot, 'preflight-1280-light.png') });
  await writeJson('preflight.json', {
    url: targetUrl,
    httpStatus: response?.status() ?? null,
    browser: await browser.version(),
    playwright: playwrightVersion,
    context: { viewport: { width: 1280, height: 900 }, colorScheme: 'light', reducedMotion: 'no-preference' },
    mutableInjection: result,
    pass: result.changedTitle.startsWith('pw-injection-preflight-') && result.scriptInserted && result.scriptExecuted,
    console: messages,
  });
  await context.close();
}

async function prepareView(page, name) {
  if (name === '320-props') {
    const table = page.locator('.vp-doc table').filter({ hasText: 'modelValue' }).first();
    await table.scrollIntoViewIfNeeded();
  }
  if (name === '320-demo') {
    await page.locator('.password-input-demo').evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
  }
  if (name === '320-hud') {
    await page.locator('.password-input-demo__advanced summary').click();
    await page.locator('.password-input-demo__advanced-controls input').nth(1).check();
    await page.locator('.password-input-demo').evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
  }
  if (name === '320-disabled-readonly') {
    await page.locator('#password-input-readonly').evaluate((node) => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
  }
  if (name === '320-focus') {
    await page.locator('.password-input-demo__advanced summary').evaluate((node) => node.focus());
    await page.keyboard.press('Tab');
  }
  if (name === '320-reduced-motion') {
    await page.locator('.password-input-demo').evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
  }
  await page.waitForTimeout(180);
}

async function captureView(browser, serverBase, name, viewport, reducedMotion = 'no-preference') {
  const { context, page, messages, response } = await openPage(browser, { ...viewport, reducedMotion });
  await prepareView(page, name);
  const preInjectionOverflow = await horizontalOverflowMetrics(page);
  const props = name === '320-props' ? await propsTableMetrics(page) : null;
  const detector = await detectorPayload(page, serverBase);
  const postInjectionOverflow = await horizontalOverflowMetrics(page);
  const layout = await rootAndNavMetrics(page);
  const demo = name.includes('demo') || name.includes('hud') || name.includes('disabled') || name.includes('focus') || name.includes('reduced')
    ? await demoStatesMetrics(page)
    : null;
  let focus = null;
  if (name === '320-focus') {
    focus = await page.evaluate(() => {
      const input = document.getElementById('password-input-demo');
      const wrapper = input?.closest('.el-input')?.querySelector('.el-input__wrapper');
      const style = wrapper ? getComputedStyle(wrapper) : null;
      return {
        activeElementId: document.activeElement?.id || null,
        focused: document.activeElement === input,
        wrapperClass: wrapper?.className || null,
        outline: style?.outline || null,
        boxShadow: style?.boxShadow || null,
      };
    });
  }
  let reducedMotionMetrics = null;
  if (name === '320-reduced-motion') {
    reducedMotionMetrics = await page.evaluate(() => ({
      matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      demoIconTransition: getComputedStyle(document.querySelector('.password-input-demo__advanced-icon')).transitionDuration,
      toggleTransition: getComputedStyle(document.querySelector('.lx-password-input__toggle')).transitionDuration,
      pageScrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    }));
  }
  const screenshot = `${name}.png`;
  await page.screenshot({ path: path.join(evidenceRoot, screenshot) });
  const view = {
    name,
    url: targetUrl,
    httpStatus: response?.status() ?? null,
    viewport,
    reducedMotion,
    screenshot,
    preInjectionOverflow,
    postInjectionOverflow,
    layout,
    propsTable: props,
    demo,
    focus,
    reducedMotionMetrics,
    detector: {
      ...detector,
      docsShellTargets: detector.scan.findings.filter((item) => item.classification === 'docs-shell'),
      componentTargets: detector.scan.findings.filter((item) => ['component-demo', 'component'].includes(item.classification)),
      documentationContentTargets: detector.scan.findings.filter((item) => item.classification === 'documentation-content'),
    },
    console: messages,
  };
  await writeJson(`${name}.json`, view);
  await context.close();
  return view;
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
try {
  if (process.argv[2] === 'preflight') {
    await runPreflight(browser);
    process.stdout.write('preflight complete\n');
  } else if (process.argv[2] === 'views') {
    const port = Number(process.argv[3]);
    if (!Number.isInteger(port) || port <= 0) throw new Error('Usage: browser-evidence.mjs views <live-server-port>');
    const serverBase = `http://127.0.0.1:${port}`;
    const health = await fetch(`${serverBase}/health`);
    await writeJson('live-server-health.json', { status: health.status, body: await health.text(), serverBase });
    if (!health.ok) throw new Error(`Live server health HTTP ${health.status}`);
    const views = [];
    views.push(await captureView(browser, serverBase, '1280-light', { width: 1280, height: 900 }));
    views.push(await captureView(browser, serverBase, '320-props', { width: 320, height: 920 }));
    views.push(await captureView(browser, serverBase, '320-demo', { width: 320, height: 920 }));
    views.push(await captureView(browser, serverBase, '320-hud', { width: 320, height: 920 }));
    views.push(await captureView(browser, serverBase, '320-disabled-readonly', { width: 320, height: 1000 }));
    views.push(await captureView(browser, serverBase, '320-focus', { width: 320, height: 920 }));
    views.push(await captureView(browser, serverBase, '320-reduced-motion', { width: 320, height: 920 }, 'reduce'));
    await writeJson('browser-summary.json', {
      url: targetUrl,
      browser: await browser.version(),
      playwright: playwrightVersion,
      pageCount: views.length,
      views: views.map((view) => ({
        name: view.name,
        screenshot: view.screenshot,
        httpStatus: view.httpStatus,
        rootHorizontalOverflow: view.layout.root.horizontalOverflow,
        detectorCount: view.detector.scan.count,
        overlayElementCount: view.detector.scan.overlayElements.length,
        consoleHits: view.console.filter((message) => message.text?.includes('[impeccable]')).map((message) => message.text),
      })),
    });
    process.stdout.write(`captured ${views.length} views\n`);
  } else {
    throw new Error('Usage: browser-evidence.mjs preflight | views <live-server-port>');
  }
} finally {
  await browser.close();
}
