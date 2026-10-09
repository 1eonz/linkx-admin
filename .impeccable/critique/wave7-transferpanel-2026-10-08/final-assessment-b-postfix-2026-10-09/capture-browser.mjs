import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const baseDir = path.dirname(fileURLToPath(import.meta.url))
const screenshotDir = path.join(baseDir, 'screenshots')
const chromiumPath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const overlayUrl =
  process.argv
    .find((arg) => arg.startsWith('--overlay='))
    ?.slice('--overlay='.length) ?? 'http://localhost:8400/detect.js'
const targets = [
  {
    key: 'transfer',
    url: 'http://127.0.0.1:4174/components/lxtransferpanel',
    rootSelector: '.lx-transfer-panel',
    treeSelector: '.lx-transfer-panel .lx-virtual-tree',
  },
  {
    key: 'virtualtree',
    url: 'http://127.0.0.1:4174/components/lxvirtualtree',
    rootSelector: '.virtual-tree-demo__preview',
    treeSelector: '.virtual-tree-demo__preview .lx-virtual-tree',
  },
]
const viewports = [
  { key: 'desktop', width: 1440, height: 1000, touch: false },
  { key: '320', width: 320, height: 980, touch: true },
  { key: '375', width: 375, height: 980, touch: true },
  { key: '420', width: 420, height: 980, touch: true },
  { key: '421', width: 421, height: 980, touch: true },
]
const themes = ['light', 'dark']
const consoleMessages = []
const results = []

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function createCdp(wsUrl) {
  const socket = new WebSocket(wsUrl)
  const pending = new Map()
  const listeners = new Map()
  let nextId = 0

  const opened = new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener(
      'error',
      () => reject(new Error('CDP WebSocket failed')),
      {
        once: true,
      },
    )
  })

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data))
    if (message.id && pending.has(message.id)) {
      const request = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) request.reject(new Error(message.error.message))
      else request.resolve(message.result ?? {})
      return
    }
    const handlers = listeners.get(message.method) ?? []
    handlers.forEach((handler) => handler(message.params ?? {}))
  })

  return {
    async opened() {
      await opened
    },
    send(method, params = {}) {
      const id = ++nextId
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id)
          reject(new Error(`CDP timeout: ${method}`))
        }, 15000)
        pending.set(id, {
          resolve: (value) => {
            clearTimeout(timer)
            resolve(value)
          },
          reject: (error) => {
            clearTimeout(timer)
            reject(error)
          },
        })
        socket.send(JSON.stringify({ id, method, params }))
      })
    },
    on(method, handler) {
      const handlers = listeners.get(method) ?? []
      handlers.push(handler)
      listeners.set(method, handlers)
    },
    once(method, timeoutMs = 20000) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error(`CDP event timeout: ${method}`)),
          timeoutMs,
        )
        const handler = (params) => {
          clearTimeout(timer)
          const handlers = listeners.get(method) ?? []
          listeners.set(
            method,
            handlers.filter((item) => item !== handler),
          )
          resolve(params)
        }
        const handlers = listeners.get(method) ?? []
        handlers.push(handler)
        listeners.set(method, handlers)
      })
    },
    close() {
      socket.close()
    },
  }
}

async function evaluate(cdp, expression) {
  const response = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  })
  if (response.exceptionDetails) {
    throw new Error(
      response.exceptionDetails.text ?? 'Browser evaluation failed',
    )
  }
  return response.result?.value
}

async function setTheme(cdp, theme) {
  let method = await evaluate(
    cdp,
    `(() => {
      const desired = ${JSON.stringify(theme)};
      const html = document.documentElement;
      const isDark = html.classList.contains('dark');
      if (isDark === (desired === 'dark')) return 'already-set';
      if (isDark !== (desired === 'dark')) {
        const button = document.querySelector('.VPNavBarAppearance button')
          || [...document.querySelectorAll('button')].find((item) => /theme|主题/i.test(
            [item.getAttribute('aria-label'), item.title, item.textContent].join(' '),
          ));
        if (button) {
          button.click();
          return 'theme-control';
        }
        else {
          html.classList.toggle('dark', desired === 'dark');
          html.style.colorScheme = desired;
          return 'class-fallback';
        }
      }
      return 'class-fallback';
    })()`,
  )
  await delay(250)
  const siteTheme = await evaluate(
    cdp,
    `document.documentElement.classList.contains('dark') ? 'dark' : 'light'`,
  )
  if (siteTheme !== theme) {
    await evaluate(
      cdp,
      `(() => {
        document.documentElement.classList.toggle('dark', ${JSON.stringify(theme)} === 'dark');
        document.documentElement.style.colorScheme = ${JSON.stringify(theme)};
      })()`,
    )
    await delay(150)
    method = `${method}+class-fallback`
  }
  return {
    siteTheme: await evaluate(
      cdp,
      `document.documentElement.classList.contains('dark') ? 'dark' : 'light'`,
    ),
    method,
  }
}

async function setPreviewTheme(cdp, theme) {
  return evaluate(
    cdp,
    `(() => {
      const label = [...document.querySelectorAll('label')].find((item) =>
        item.textContent.includes('HUD 深色主题'),
      );
      const input = label?.querySelector('input[type="checkbox"]');
      if (!input) return { found: false, active: false };
      const details = label.closest('details');
      if (details) details.open = true;
      const desired = ${JSON.stringify(theme)} === 'dark';
      if (input.checked !== desired) label.click();
      const preview = label.closest('.transfer-panel-demo')?.querySelector('.transfer-panel-demo__preview')
        || label.closest('.virtual-tree-demo')?.querySelector('.virtual-tree-demo__preview');
      return { found: true, active: preview?.classList.contains('lx-theme-hud') ?? false };
    })()`,
  )
}

async function navigate(cdp, url) {
  const loaded = cdp.once('Page.loadEventFired', 25000)
  await cdp.send('Page.navigate', { url })
  await loaded
  await delay(1500)
}

async function waitForTarget(cdp, target) {
  return evaluate(
    cdp,
    `(async () => {
      const startedAt = Date.now();
      const rootSelector = ${JSON.stringify(target.rootSelector)};
      const treeSelector = ${JSON.stringify(target.treeSelector)};
      while (Date.now() - startedAt < 10000) {
        if (document.querySelector(rootSelector) && document.querySelector(treeSelector)) return true;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return false;
    })()`,
  )
}

async function injectOverlay(cdp) {
  await evaluate(cdp, `document.title = 'Assessment B fresh browser tab'; true`)
  const result = await evaluate(
    cdp,
    `(async () => {
      const ready = new Promise((resolve) => {
        const timer = setTimeout(() => resolve('ready-event-timeout'), 5000);
        window.addEventListener('message', (event) => {
          if (event.data?.source === 'impeccable-ready') {
            clearTimeout(timer);
            resolve('impeccable-ready');
          }
        });
      });
      const script = document.createElement('script');
      script.src = ${JSON.stringify(overlayUrl)};
      const loaded = new Promise((resolve) => {
        script.onload = () => resolve('script-loaded');
        script.onerror = () => resolve('script-load-error');
      });
      document.head.append(script);
      const scriptStatus = await loaded;
      const readyStatus = await ready;
      return {
        scriptStatus,
        readyStatus,
        installed:
          typeof window.impeccableScanAsync === 'function'
          && typeof window.impeccableDetectAsync === 'function',
      };
    })()`,
  )
  await delay(2200)
  let findings = null
  let findingsSerialization = {
    attempted: false,
    source: null,
    scannedCount: null,
    circularReferenceSafe: false,
    error: null,
  }
  if (result?.installed) {
    const serializedResult = await evaluate(
      cdp,
      `(async () => {
        const raw = await window.impeccableScanAsync();
        let source = 'detector-serialized';
        let serializationError = null;
        let value;
        try {
          value = await window.impeccableDetectAsync();
        } catch (error) {
          source = 'safe-raw-fallback';
          serializationError = error?.message ?? String(error);
          value = raw;
        }

        // scanAsync 返回包含 DOM 节点的原始 finding；回退时用 WeakSet 截断循环引用。
        const seen = new WeakSet();
        const safeSerialize = (input) => {
          if (input === null || typeof input !== 'object') {
            if (typeof input === 'bigint') return String(input) + 'n';
            if (typeof input === 'number' && !Number.isFinite(input)) return String(input);
            if (typeof input === 'function') return '[Function]';
            return input;
          }
          if (seen.has(input)) return '[循环引用]';
          seen.add(input);
          if (input instanceof Element) {
            return {
              type: 'Element',
              tagName: input.tagName?.toLowerCase() ?? null,
              id: input.id || null,
              className: typeof input.className === 'string' ? input.className : null,
              text: (input.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 180),
            };
          }
          if (input instanceof Node) {
            return { type: 'Node', nodeType: input.nodeType, nodeName: input.nodeName };
          }
          if (typeof DOMRect !== 'undefined' && input instanceof DOMRect) {
            return {
              x: input.x,
              y: input.y,
              width: input.width,
              height: input.height,
              top: input.top,
              right: input.right,
              bottom: input.bottom,
              left: input.left,
            };
          }
          if (input instanceof Date) return input.toISOString();
          if (Array.isArray(input)) return input.map((item) => safeSerialize(item));
          const output = {};
          for (const key of Object.keys(input)) {
            try {
              output[key] = safeSerialize(input[key]);
            } catch (error) {
              output[key] = '[无法序列化: ' + (error?.message ?? String(error)) + ']';
            }
          }
          return output;
        };

        const escapeSelector = (value) => {
          if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value);
          return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
        };
        const selectorFor = (element) => {
          if (!element) return null;
          if (element === document.body) return 'body';
          if (element === document.documentElement) return 'html';
          if (element.id) return '#' + escapeSelector(element.id);
          const parts = [];
          let current = element;
          while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 8) {
            let part = current.tagName.toLowerCase();
            const classes = typeof current.className === 'string'
              ? current.className.trim().split(/\\s+/).filter(Boolean).slice(0, 2)
              : [];
            if (classes.length > 0) part += '.' + classes.map(escapeSelector).join('.');
            const parent = current.parentElement;
            if (parent) {
              const siblings = [...parent.children].filter((item) => item.tagName === current.tagName);
              if (siblings.length > 1) part += ':nth-of-type(' + (siblings.indexOf(current) + 1) + ')';
            }
            parts.unshift(part);
            current = parent;
          }
          return parts.join(' > ');
        };
        const rectFor = (element) => {
          if (!element?.getBoundingClientRect) return null;
          const value = element.getBoundingClientRect();
          return {
            x: value.x,
            y: value.y,
            width: value.width,
            height: value.height,
            top: value.top,
            right: value.right,
            bottom: value.bottom,
            left: value.left,
          };
        };
        const hiddenFor = (element) => {
          if (!element || element === document.body || element === document.documentElement) return false;
          if (typeof element.checkVisibility === 'function') {
            return !element.checkVisibility({ checkOpacity: false, checkVisibilityCSS: true });
          }
          return element.offsetWidth === 0 && element.offsetHeight === 0;
        };
        const recordFor = (input) => {
          const value = safeSerialize(input);
          return value && typeof value === 'object' && !Array.isArray(value)
            ? value
            : { value };
        };
        const projectFinding = (finding) => {
          const record = recordFor(finding);
          return {
            ...record,
            rule: finding?.rule ?? finding?.type ?? finding?.id ?? record.rule ?? record.type ?? record.id ?? null,
            label: finding?.label ?? finding?.name ?? record.label ?? record.name ?? null,
            type: finding?.type ?? finding?.id ?? record.type ?? record.id ?? null,
            name: finding?.name ?? finding?.label ?? record.name ?? record.label ?? null,
          };
        };
        const projectEntry = (entry) => {
          const element = entry?.el instanceof Element ? entry.el : null;
          const rawFindings = Array.isArray(entry?.findings) ? entry.findings : [];
          const firstFinding = rawFindings[0] ?? {};
          return {
            selector: entry?.selector ?? selectorFor(element),
            label: entry?.label ?? entry?.name ?? firstFinding?.label ?? firstFinding?.name ?? null,
            rule: entry?.rule ?? entry?.type ?? firstFinding?.rule ?? firstFinding?.type ?? firstFinding?.id ?? null,
            tagName: entry?.tagName ?? element?.tagName?.toLowerCase() ?? null,
            rect: safeSerialize(entry?.rect ?? rectFor(element)),
            isPageLevel: Boolean(entry?.isPageLevel ?? (element === document.body || element === document.documentElement)),
            isHidden: Boolean(entry?.isHidden ?? hiddenFor(element)),
            findings: rawFindings.map(projectFinding),
          };
        };
        const projected = Array.isArray(value)
          ? value.map(projectEntry)
          : safeSerialize(value);

        return {
          source,
          serializationError,
          projection: 'selector-label-rule-rect',
          scannedCount: Array.isArray(raw) ? raw.length : null,
          value: projected ?? null,
        };
      })()`,
    )
    findings = serializedResult?.value ?? null
    findingsSerialization = {
      attempted: true,
      source: serializedResult?.source ?? 'unknown',
      projection: serializedResult?.projection ?? null,
      scannedCount: serializedResult?.scannedCount ?? null,
      circularReferenceSafe: true,
      error: serializedResult?.serializationError ?? null,
    }
  }
  const overlayState = await evaluate(
    cdp,
    `(() => ({
      overlayCount: document.querySelectorAll('.impeccable-overlay:not(.impeccable-banner)').length,
      visibleOverlayCount: document.querySelectorAll('.impeccable-overlay.impeccable-visible:not(.impeccable-banner)').length,
      bannerCount: document.querySelectorAll('.impeccable-banner').length,
    }))()`,
  )
  return { ...result, findings, findingsSerialization, ...overlayState }
}

async function inspectScenario(cdp, target, viewport, theme) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.touch,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
  })
  await cdp.send('Emulation.setTouchEmulationEnabled', {
    enabled: viewport.touch,
    ...(viewport.touch ? { maxTouchPoints: 1 } : {}),
  })
  await cdp.send('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{ name: 'prefers-color-scheme', value: theme }],
  })
  await navigate(cdp, target.url)
  const targetReady = await waitForTarget(cdp, target)
  const siteTheme = await setTheme(cdp, theme)
  const previewTheme = await setPreviewTheme(cdp, theme)
  await delay(250)

  const before = await evaluate(
    cdp,
    `(() => {
      const root = document.querySelector(${JSON.stringify(target.rootSelector)});
      const tree = document.querySelector(${JSON.stringify(target.treeSelector)});
      root?.scrollIntoView({ block: 'center', inline: 'nearest' });
      const row = tree?.querySelector('.lx-virtual-tree__row');
      const checkboxControl = row?.querySelector('.lx-virtual-tree__checkbox-control');
      const checkbox = checkboxControl?.querySelector('input[type="checkbox"]');
      const toggle = row?.querySelector('.lx-virtual-tree__toggle');
      const rect = (element) => {
        if (!element) return null;
        const value = element.getBoundingClientRect();
        return { x: value.x, y: value.y, width: value.width, height: value.height };
      };
      const checkboxRect = rect(checkboxControl);
      const hitLeft = checkboxRect
        ? document.elementFromPoint(checkboxRect.x + 1, checkboxRect.y + checkboxRect.height / 2)
        : null;
      const hitRight = checkboxRect
        ? document.elementFromPoint(checkboxRect.x + checkboxRect.width - 1, checkboxRect.y + checkboxRect.height / 2)
        : null;
      const inputRect = rect(checkbox);
      const inputStyle = checkbox ? getComputedStyle(checkbox) : null;
      const describe = (element, selector) => {
        if (!element) {
          return { selector, found: false, outerHTML: null };
        }
        const value = element.getBoundingClientRect();
        return {
          selector,
          found: true,
          tagName: element.tagName.toLowerCase(),
          id: element.id || null,
          className: typeof element.className === 'string' ? element.className : null,
          role: element.getAttribute('role'),
          ariaLabel: element.getAttribute('aria-label'),
          childElementCount: element.childElementCount,
          text: (element.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 240),
          rect: { x: value.x, y: value.y, width: value.width, height: value.height },
          outerHTML: element.outerHTML.slice(0, 20000),
        };
      };
      return {
        targetReady: ${JSON.stringify(targetReady)},
        targetDom: {
          readyState: document.readyState,
          title: document.title,
          root: describe(root, ${JSON.stringify(target.rootSelector)}),
          tree: describe(tree, ${JSON.stringify(target.treeSelector)}),
        },
        pageWidth: window.innerWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        documentOverflowsHorizontally: document.documentElement.scrollWidth > window.innerWidth,
        siteTheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        previewDarkClass: !!root?.closest('.lx-theme-hud') || root?.classList.contains('lx-theme-hud') || !!root?.parentElement?.classList.contains('lx-theme-hud'),
        treeRowCount: tree?.querySelectorAll('.lx-virtual-tree__row').length ?? 0,
        row: rect(row),
        rowKey: row?.getAttribute('data-lx-tree-key') ?? null,
        rowTabIndex: row?.getAttribute('tabindex') ?? null,
        checkboxControl: checkboxRect,
        checkboxInput: inputRect,
        checkboxVisual: inputStyle ? {
          width: inputStyle.width,
          height: inputStyle.height,
          appearance: inputStyle.appearance,
        } : null,
        checkboxBefore: checkbox?.checked ?? null,
        checkboxDisabled: checkbox?.disabled ?? null,
        checkboxControlHitLeft: !!hitLeft?.closest('.lx-virtual-tree__checkbox-control'),
        checkboxControlHitRight: !!hitRight?.closest('.lx-virtual-tree__checkbox-control'),
        expansionControl: rect(toggle),
        rootFound: !!root,
        treeFound: !!tree,
      };
    })()`,
  )

  const overlay = await injectOverlay(cdp)
  const touchTest = viewport.touch
    ? await testTouchTarget(cdp, before)
    : { attempted: false }
  const focus = await testKeyboardFocus(cdp, target)
  const screenshot = `${target.key}-${viewport.key}-${theme}.png`
  const screenshotResult = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  })
  await fs.writeFile(
    path.join(screenshotDir, screenshot),
    Buffer.from(screenshotResult.data, 'base64'),
  )
  const screenshotCheck = await evaluate(
    cdp,
    `(() => {
      const title = document.title;
      const bodyText = (document.body?.innerText || '').replace(/\\s+/g, ' ').trim();
      const rootFound = Boolean(document.querySelector(${JSON.stringify(target.rootSelector)}));
      const treeFound = Boolean(document.querySelector(${JSON.stringify(target.treeSelector)}));
      const errorMarkers = ['404 Not Found', 'Cannot GET', '页面不存在', 'Internal Server Error']
        .filter((marker) => (title + ' ' + bodyText).includes(marker));
      return {
        title,
        rootFound,
        treeFound,
        errorMarkers,
        notErrorPage: rootFound && treeFound && errorMarkers.length === 0,
        bodyTextPreview: bodyText.slice(0, 240),
      };
    })()`,
  )
  const focusScreenshot =
    viewport.key === '375'
      ? `${target.key}-${viewport.key}-${theme}-keyboard-focus.png`
      : null
  if (focusScreenshot) {
    const focusedPng = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false,
    })
    await fs.writeFile(
      path.join(screenshotDir, focusScreenshot),
      Buffer.from(focusedPng.data, 'base64'),
    )
  }
  const logs = consoleMessages.splice(0)
  return {
    page: target.key,
    url: target.url,
    viewport: { ...viewport },
    theme,
    themeControls: { siteTheme, previewTheme },
    measured: before,
    touchTest,
    keyboardFocus: focus,
    overlay,
    screenshotCheck,
    consoleMessages: logs,
    screenshots: [screenshot, ...(focusScreenshot ? [focusScreenshot] : [])],
  }
}

async function testTouchTarget(cdp, before) {
  if (!before.checkboxControl || before.checkboxBefore === null) {
    return { attempted: true, completed: false, reason: 'checkbox not found' }
  }
  const point = {
    x: before.checkboxControl.x + 1,
    y: before.checkboxControl.y + before.checkboxControl.height / 2,
  }
  const hit = await evaluate(
    cdp,
    `(() => {
      const target = document.elementFromPoint(${point.x}, ${point.y});
      return !!target?.closest('.lx-virtual-tree__checkbox-control');
    })()`,
  )
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ ...point, id: 1, radiusX: 1, radiusY: 1, force: 1 }],
  })
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  })
  await delay(120)
  const after = await evaluate(
    cdp,
    `document.querySelector(${JSON.stringify('.lx-virtual-tree__checkbox-control input[type="checkbox"]')})?.checked ?? null`,
  )
  const changed = after !== before.checkboxBefore
  if (changed) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ ...point, id: 1, radiusX: 1, radiusY: 1, force: 1 }],
    })
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    })
    await delay(100)
  }
  return {
    attempted: true,
    completed: true,
    point: { x: point.x, y: point.y },
    hitWithinControl: hit,
    checkedBefore: before.checkboxBefore,
    checkedAfter: after,
    clickChangedSelection: changed,
    restored: changed,
  }
}

async function testKeyboardFocus(cdp, target) {
  const focused = await evaluate(
    cdp,
    `(() => {
      const row = document.querySelector(${JSON.stringify(`${target.treeSelector} .lx-virtual-tree__row[tabindex="0"]`)})
        || document.querySelector(${JSON.stringify(`${target.treeSelector} .lx-virtual-tree__row`)})
      if (!row) return { found: false };
      row.focus({ focusVisible: true });
      const style = getComputedStyle(row);
      return {
        found: true,
        active: document.activeElement === row,
        beforeKey: row.getAttribute('data-lx-tree-key'),
        tabindex: row.getAttribute('tabindex'),
        focusVisible: row.matches(':focus-visible'),
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineColor: style.outlineColor,
      };
    })()`,
  )
  if (!focused?.found) return focused
  await cdp.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'ArrowDown',
    code: 'ArrowDown',
    windowsVirtualKeyCode: 40,
    nativeVirtualKeyCode: 40,
  })
  await cdp.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'ArrowDown',
    code: 'ArrowDown',
    windowsVirtualKeyCode: 40,
    nativeVirtualKeyCode: 40,
  })
  await delay(80)
  const after = await evaluate(
    cdp,
    `(() => {
      const row = document.activeElement;
      const style = row ? getComputedStyle(row) : null;
      return {
        activeRole: row?.getAttribute('role') ?? null,
        activeKey: row?.getAttribute('data-lx-tree-key') ?? null,
        focusVisible: row?.matches(':focus-visible') ?? false,
        outlineStyle: style?.outlineStyle ?? null,
        outlineWidth: style?.outlineWidth ?? null,
        outlineColor: style?.outlineColor ?? null,
      };
    })()`,
  )
  return { ...focused, afterArrowDown: after }
}

async function main() {
  assert(
    await fs.stat(chromiumPath).then(
      () => true,
      () => false,
    ),
    `Chromium not found: ${chromiumPath}`,
  )
  await fs.mkdir(screenshotDir, { recursive: true })
  const profileDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'linkx-wave7-assessment-b-'),
  )
  const activePortFile = path.join(profileDir, 'DevToolsActivePort')
  const browser = spawn(
    chromiumPath,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-debugging-port=0',
      '--remote-allow-origins=*',
      `--user-data-dir=${profileDir}`,
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true },
  )
  const browserStderr = []
  browser.stderr.setEncoding('utf8')
  browser.stderr.on('data', (chunk) => browserStderr.push(chunk))
  let cdp

  try {
    let port = null
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (browser.exitCode !== null)
        throw new Error(`Chromium exited early: ${browserStderr.join('')}`)
      try {
        const content = await fs.readFile(activePortFile, 'utf8')
        port = Number(content.split(/\r?\n/)[0])
        if (Number.isFinite(port) && port > 0) break
      } catch {}
      await delay(100)
    }
    assert(
      port,
      `Timed out waiting for Chromium CDP port: ${browserStderr.join('')}`,
    )
    const endpoint = `http://127.0.0.1:${port}`
    const targetResponse = await fetch(`${endpoint}/json/new?about:blank`, {
      method: 'PUT',
    })
    assert(
      targetResponse.ok,
      `Could not create a fresh browser tab: ${targetResponse.status}`,
    )
    const target = await targetResponse.json()
    assert(
      target.webSocketDebuggerUrl,
      'Fresh tab did not expose a CDP WebSocket URL',
    )
    cdp = createCdp(target.webSocketDebuggerUrl)
    await cdp.opened()
    cdp.on('Runtime.consoleAPICalled', (event) => {
      const message = event.args
        .map((item) => item.value ?? item.description ?? '')
        .join(' ')
      if (/impeccable/i.test(message)) consoleMessages.push(message)
    })
    cdp.on('Runtime.exceptionThrown', (event) => {
      consoleMessages.push(
        `exception: ${event.exceptionDetails?.text ?? 'unknown'}`,
      )
    })
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')
    await cdp.send('Log.enable')
    const browserInfo = await cdp.send('Browser.getVersion')

    for (const targetPage of targets) {
      for (const viewport of viewports) {
        for (const theme of themes) {
          results.push(await inspectScenario(cdp, targetPage, viewport, theme))
        }
      }
    }

    const evidence = {
      capturedAt: new Date().toISOString(),
      browser: {
        product: browserInfo.product,
        revision: browserInfo.revision,
        protocolVersion: browserInfo.protocolVersion,
        freshTabCreated: true,
        pageTargetId: target.id,
      },
      overlayUrl,
      scenarioCount: results.length,
      scenarios: results,
      browserStderr: browserStderr.join('').trim(),
      中文证据: {
        目标: targets.map((item) => ({
          名称: item.key,
          地址: item.url,
          根节点选择器: item.rootSelector,
          树节点选择器: item.treeSelector,
        })),
        场景总数: results.length,
        截图非错误页场景数: results.filter(
          (item) => item.screenshotCheck?.notErrorPage === true,
        ).length,
        overlay注入成功场景数: results.filter(
          (item) => item.overlay?.installed === true,
        ).length,
        循环引用安全序列化场景数: results.filter(
          (item) =>
            item.overlay?.findingsSerialization?.circularReferenceSafe === true,
        ).length,
        说明: '每个场景均记录目标 DOM、root/tree、overlay 注入结果、截图非错误页判定，以及脚本 stdout/stderr/退出码文件。',
      },
    }
    await fs.writeFile(
      path.join(baseDir, 'browser-evidence.json'),
      `${JSON.stringify(evidence, null, 2)}\n`,
      'utf8',
    )
    process.stdout.write(
      `${JSON.stringify({ scenarioCount: results.length, browser: evidence.browser, evidencePath: 'browser-evidence.json' })}\n`,
    )
  } finally {
    cdp?.close()
    if (browser.exitCode === null && browser.pid) {
      const killer = spawn(
        'taskkill.exe',
        ['/PID', String(browser.pid), '/T', '/F'],
        {
          stdio: 'ignore',
          windowsHide: true,
        },
      )
      await new Promise((resolve) => killer.once('exit', resolve))
    }
    if (browser.exitCode === null) browser.kill()
    await new Promise((resolve) => {
      if (browser.exitCode !== null) resolve()
      else browser.once('exit', resolve)
    })
    const relativeProfile = path.relative(os.tmpdir(), profileDir)
    if (
      !relativeProfile.startsWith('..') &&
      !path.isAbsolute(relativeProfile)
    ) {
      await fs.rm(profileDir, { recursive: true, force: true })
    }
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`)
  process.exitCode = 1
})
