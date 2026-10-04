const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { chromium } = require('F:/work/linkx-admin/other-admin/admin-vue3/node_modules/@playwright/test');
const out = __dirname;
const skill = 'C:/Users/Administrator/.codex/skills/impeccable/scripts';
const save = (name, value) => fs.writeFileSync(path.join(out, name), typeof value === 'string' ? value : JSON.stringify(value, null, 2));
const targets = ['linkx-fe/src/components/LxTreeSelect', 'linkx-fe/src/components/LxCascader', 'linkx-fe/docs/components/lxtreeselect.md', 'linkx-fe/docs/components/lxcascader.md'];
for (let i = 0; i < targets.length; i++) {
  const result = spawnSync(process.execPath, [skill + '/detect.mjs', '--json', targets[i]], { cwd: 'F:/work/linkx-admin', encoding: 'utf8' });
  save(`static-${i}.json`, result.stdout); save(`static-${i}.stderr.txt`, result.stderr); save(`static-${i}.meta.json`, { target: targets[i], exitCode: result.status, error: result.error?.message });
}
const start = spawnSync(process.execPath, [skill + '/live-server.mjs', '--background', '--port=8496'], { cwd: out, encoding: 'utf8' });
save('server-start.stderr.txt', start.stderr);
let info; try { info = JSON.parse(start.stdout); } catch { save('server-start.stdout.txt', start.stdout); }
save('server-meta.json', { exitCode: start.status, pid: info?.pid, port: info?.port, stop: `node ${skill}/live-server.mjs stop --keep-inject (cwd assessment-b)` });
const consoleLogs = [], requests = [], results = [];
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route('**/*', route => {
    const url = route.request().url(); const local = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(url);
    requests.push({ url, method: route.request().method(), allowed: local });
    return local || /^(data|blob):/.test(url) ? route.continue() : route.abort();
  });
  async function capture(page, name, field) {
    await field.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    save(name + '-dom.txt', await page.locator('body').innerText());
    const metrics = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, active: document.activeElement?.outerHTML, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, inputs: [...document.querySelectorAll('.lx-tree-select-field input,.lx-cascader-field input')].map(i => ({ id: i.id, invalid: i.getAttribute('aria-invalid'), describedby: i.getAttribute('aria-describedby'), disabled: i.disabled })), poppers: [...document.querySelectorAll('.lx-tree-select__popper,.lx-cascader__popper')].filter(e => e.getBoundingClientRect().height && getComputedStyle(e).visibility !== 'hidden').map(e => ({ text: e.innerText, rect: e.getBoundingClientRect().toJSON(), transitions: [...e.querySelectorAll('*')].map(n => getComputedStyle(n).transitionDuration).filter(v => v !== '0s') })) }));
    save(name + '-metrics.json', metrics);
    await page.screenshot({ path: path.join(out, name + '.png') });
    const findings = await page.evaluate(() => typeof window.impeccableScan === 'function' ? window.impeccableScan() : null);
    save(name + '-overlay.json', findings);
    await page.screenshot({ path: path.join(out, name + '-overlay.png') });
    results.push({ name, overlayAvailable: findings !== null, width: metrics.width, scrollWidth: metrics.scrollWidth });
  }
  try {
    for (const kind of ['tree', 'cascader']) {
      const page = await context.newPage();
      page.on('console', msg => consoleLogs.push({ page: kind, type: msg.type(), text: msg.text() }));
      page.on('pageerror', error => consoleLogs.push({ page: kind, type: 'pageerror', text: error.message }));
      await page.goto(`http://127.0.0.1:4174/components/lx${kind === 'tree' ? 'treeselect' : 'cascader'}.html`);
      const field = page.locator(kind === 'tree' ? '.lx-tree-select-field' : '.lx-cascader-field');
      await field.waitFor();
      await page.evaluate(() => { document.title = '[Human] Independent Assessment B'; const s = document.createElement('script'); s.dataset.preflight = 'true'; document.head.appendChild(s); });
      if (info) await page.addScriptTag({ url: 'http://localhost:8496/detect.js' });
      await page.waitForTimeout(2300);
      await page.getByText('演示状态', { exact: true }).click();
      await capture(page, kind + '-desktop-ready', field);
      await page.getByRole('button', { name: kind === 'tree' ? '模拟加载失败' : '失败', exact: true }).click();
      await capture(page, kind + '-desktop-error', field);
      await page.getByRole('button', { name: '重试', exact: true }).click();
      await capture(page, kind + '-desktop-retry', field);
      await page.waitForTimeout(1500);
      await page.getByRole('button', { name: kind === 'tree' ? '模拟加载' : '加载中', exact: true }).click();
      await field.locator('input').click();
      await capture(page, kind + '-desktop-loading', field);
      await page.keyboard.press('Escape');
      if (kind === 'tree') await page.waitForTimeout(1500); else await page.getByRole('button', { name: '正常', exact: true }).click();
      if (kind === 'tree') {
        await page.getByRole('button', { name: '查看空目录', exact: true }).click(); await field.locator('input').click();
        await capture(page, 'tree-desktop-empty', field); await page.keyboard.press('Escape');
        await page.getByRole('button', { name: '返回组织目录', exact: true }).click();
      }
      await page.getByRole('button', { name: '多选模式', exact: true }).click();
      await field.locator('input').click();
      await capture(page, kind + '-desktop-multiple', field);
      if (kind === 'tree') {
        const before = await page.locator('.lx-tree-select-demo__value').innerText();
        await page.getByRole('treeitem', { name: '科技城派出所', exact: true }).getByRole('checkbox').check();
        const draft = await page.locator('.lx-tree-select-demo__value').innerText();
        await page.getByRole('button', { name: '取消', exact: true }).click();
        const canceled = await page.locator('.lx-tree-select-demo__value').innerText();
        await field.locator('input').click();
        await page.getByRole('treeitem', { name: '科技城派出所', exact: true }).getByRole('checkbox').check();
        await page.getByRole('button', { name: '确认', exact: true }).click();
        save('tree-confirm-cancel.json', { before, draft, canceled, confirmed: await page.locator('.lx-tree-select-demo__value').innerText() });
      } else await page.keyboard.press('Escape');
      await context.setViewportSize({ width: 375, height: 812 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await field.locator('input').press('ArrowDown');
      await capture(page, kind + '-mobile-keyboard-reduce', field);
      await page.keyboard.press('Escape');
      if (kind === 'tree') await page.getByLabel('HUD 深色').check();
      else await page.evaluate(() => document.documentElement.classList.add('dark', 'lx-theme-hud'));
      await field.locator('input').click();
      await capture(page, kind + '-mobile-hud', field);
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: kind === 'tree' ? '模拟加载失败' : '失败', exact: true }).click();
      await capture(page, kind + '-mobile-hud-error', field);
      await page.getByRole('button', { name: '重试', exact: true }).press('Tab');
      await capture(page, kind + '-mobile-hud-keyboard', field);
      await context.setViewportSize({ width: 1440, height: 1000 });
      await page.close();
    }
  } catch (error) { save('browser-error.txt', error.stack); process.exitCode = 1; }
  finally {
    save('results.json', results); save('console.json', consoleLogs); save('requests.json', requests);
    await browser.close();
    const stop = spawnSync(process.execPath, [skill + '/live-server.mjs', 'stop', '--keep-inject'], { cwd: out, encoding: 'utf8' });
    save('server-stop.json', { exitCode: stop.status, stdout: stop.stdout, stderr: stop.stderr });
  }
})();
