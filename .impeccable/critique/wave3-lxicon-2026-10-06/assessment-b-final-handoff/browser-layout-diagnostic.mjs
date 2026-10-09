import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const outDir = path.resolve(process.argv[2]);
const url = 'http://127.0.0.1:4174/components/lxicons.html';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profileDir = path.join(os.tmpdir(), `codex-lxicon-layout-${process.pid}`);
const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0',
  `--user-data-dir=${profileDir}`, 'about:blank',
], { stdio: 'ignore', windowsHide: true });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const pending = new Map();
    let nextId = 0;
    ws.addEventListener('open', () => resolve({
      send(method, params = {}) {
        const id = ++nextId;
        return new Promise((ok, fail) => {
          pending.set(id, { ok, fail });
          ws.send(JSON.stringify({ id, method, params }));
        });
      },
      close: () => ws.close(),
    }));
    ws.addEventListener('error', reject);
    ws.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      const item = pending.get(message.id);
      if (!item) return;
      pending.delete(message.id);
      if (message.error) item.fail(new Error(message.error.message));
      else item.ok(message.result ?? {});
    });
  });
}

async function main() {
  let browser;
  let page;
  try {
    const deadline = Date.now() + 20000;
    const activePortFile = path.join(profileDir, 'DevToolsActivePort');
    while (!fs.existsSync(activePortFile) && Date.now() < deadline) await delay(100);
    if (!fs.existsSync(activePortFile)) throw new Error('Chrome DevTools endpoint did not start');
    const [port, browserPath] = fs.readFileSync(activePortFile, 'utf8').trim().split(/\r?\n/);
    browser = await connect(`ws://127.0.0.1:${port}${browserPath}`);
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const target = targets.find((item) => item.id === targetId);
    if (!target) throw new Error('Fresh page target not found');
    page = await connect(target.webSocketDebuggerUrl);
    await Promise.all([page.send('Page.enable'), page.send('Runtime.enable')]);

    const evaluate = async (expression) => {
      const result = await page.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
      return result.result?.value;
    };
    const views = [];
    for (const width of [320, 375]) {
      const height = width === 320 ? 800 : 812;
      await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true, screenWidth: width, screenHeight: height });
      await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
      await page.send('Page.navigate', { url });
      const end = Date.now() + 20000;
      while (Date.now() < end) {
        if (await evaluate('Boolean(document.querySelector(".icon-catalog"))')) break;
        await delay(100);
      }
      await delay(1000);
      const layout = await evaluate(`(() => {
        const selectors = ['html', 'body', '.VPApp', '.VPNav', '.VPContent', '.VPDoc', '.vp-doc', '.icon-catalog', '.icon-searchbar', '.icon-grid', '.icon-alias-table-region', '.VPNavScreen', '.VPSidebar'];
        const metrics = (el) => {
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return { tag: el.tagName, className: typeof el.className === 'string' ? el.className : '',
            left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width),
            clientWidth: el.clientWidth, scrollWidth: el.scrollWidth, overflowX: style.overflowX,
            position: style.position, display: style.display };
        };
        const bySelector = Object.fromEntries(selectors.map((selector) => [selector, metrics(document.querySelector(selector))]));
        const widest = [...document.querySelectorAll('body *')]
          .filter((el) => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))
          .map((el) => ({ el, rect: el.getBoundingClientRect(), style: getComputedStyle(el) }))
          .filter(({ el, rect, style }) => rect.right > innerWidth + 2 && style.position !== 'fixed' && style.position !== 'absolute')
          .slice(0, 24)
          .map(({ el, rect, style }) => ({ tag: el.tagName, className: typeof el.className === 'string' ? el.className : '',
            left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width),
            overflowX: style.overflowX, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
        return { innerWidth, documentClientWidth: document.documentElement.clientWidth,
          documentScrollWidth: document.documentElement.scrollWidth, bodyClientWidth: document.body.clientWidth,
          bodyScrollWidth: document.body.scrollWidth, bySelector, widest };
      })()`);

      let tabs = 0;
      let reachedSearch = false;
      let active = null;
      while (tabs < 200 && !reachedSearch) {
        await page.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
        await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
        tabs++;
        active = await evaluate(`(() => {
          const el = document.activeElement;
          return { tag: el?.tagName ?? '', className: typeof el?.className === 'string' ? el.className : '',
            ariaLabel: el?.getAttribute?.('aria-label') ?? '', search: el === document.querySelector('.icon-search') };
        })()`);
        reachedSearch = active.search;
      }
      views.push({ width, layout, keyboard: { tabsToSearch: tabs, reachedSearch, finalActive: active } });
    }
    fs.writeFileSync(path.join(outDir, 'browser-layout-diagnostic.json'), JSON.stringify({ targetUrl: url, views }, null, 2));
    console.log(JSON.stringify({ views }, null, 2));
    await browser.send('Browser.close');
  } finally {
    if (page) page.close();
    if (browser) browser.close();
    await Promise.race([new Promise((resolve) => chrome.once('exit', resolve)), delay(5000)]);
    if (chrome.exitCode === null && chrome.signalCode === null) chrome.kill();
    await Promise.race([new Promise((resolve) => chrome.once('exit', resolve)), delay(2000)]);
    fs.rmSync(profileDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.stack ?? error.message ?? String(error));
  process.exitCode = 1;
});
