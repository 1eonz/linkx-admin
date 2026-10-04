/* global document, getComputedStyle, console */
import { chromium } from '@playwright/test';

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
const externalRequests = [];
page.on('request', (request) => {
  if (!request.url().startsWith('http://127.0.0.1:4174/')) externalRequests.push(request.url());
});

await page.goto('http://127.0.0.1:4174/components/lxdynamicform.html');
await page.getByRole('heading', { name: 'LxDynamicForm 动态表单' }).waitFor();
await page.getByText('3 名候选人员').waitFor();

const adaptive = await page.locator('.lx-dynamic-form').evaluate((element) => ({
  width: element.getBoundingClientRect().width,
  columns: getComputedStyle(element).gridTemplateColumns.split(' ').length,
  items: [...element.querySelectorAll('.lx-dynamic-form__item')].map((item) => ({
    grid: getComputedStyle(item).gridColumn,
    inline: item.style.gridColumn,
  })),
}));
if (adaptive.width <= 760 && adaptive.columns !== 2) {
  throw new Error(`Expected adaptive two-column container layout, got ${JSON.stringify(adaptive)}`);
}
if (adaptive.width <= 760 && adaptive.items.some((item) => item.inline && item.grid !== '1 / -1')) {
  throw new Error(`Adaptive field retained an overriding inline span: ${JSON.stringify(adaptive)}`);
}

await page.getByRole('button', { name: '提交校验' }).click();
await page.getByText('请输入任务名称').waitFor();
await page.getByPlaceholder('输入任务名称').fill('夜间巡防任务');
await page.getByRole('button', { name: '提交校验' }).click();
await page.getByText('表单已校验：夜间巡防任务').waitFor();

await page.getByRole('button', { name: '空结果' }).click();
await page.getByText('暂无候选人员', { exact: true }).waitFor();
await page.getByRole('button', { name: '失败', exact: true }).click();
await page.getByText('候选人员读取失败', { exact: true }).first().waitFor();
await page.getByRole('button', { name: '重试' }).click();
await page.getByText('候选人员读取失败', { exact: true }).first().waitFor();
await page.getByRole('button', { name: '成功', exact: true }).click();
await page.getByText('3 名候选人员').waitFor();

await page.getByRole('button', { name: '2 列' }).click();
const fixedColumns = await page
  .locator('.lx-dynamic-form')
  .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
if (fixedColumns !== 2) throw new Error(`Expected fixed 2 columns, got ${fixedColumns}`);
await page.getByRole('button', { name: '3 列' }).click();
const desktopColumns = await page
  .locator('.lx-dynamic-form')
  .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
if (desktopColumns !== 3) throw new Error(`Expected 3 columns, got ${desktopColumns}`);
await page.getByLabel('禁用表单').check();
if (!(await page.getByPlaceholder('输入任务名称').isDisabled())) throw new Error('Disabled form input remains enabled');
await page.getByLabel('禁用表单').uncheck();
await page.getByRole('button', { name: '自适应' }).click();
await page.screenshot({ path: 'C:/Users/Administrator/AppData/Local/Temp/lxdynamicform-desktop.png' });

await page.setViewportSize({ width: 375, height: 812 });
await page.getByLabel('HUD 深色主题').check();
const mobile = await page.evaluate(() => ({
  viewport: document.documentElement.clientWidth,
  document: document.documentElement.scrollWidth,
  columns: getComputedStyle(document.querySelector('.lx-dynamic-form')).gridTemplateColumns,
  background: getComputedStyle(document.querySelector('.dynamic-form-demo')).backgroundColor,
}));
if (mobile.document > mobile.viewport) throw new Error(`Mobile overflow: ${JSON.stringify(mobile)}`);
if (mobile.background !== 'rgb(16, 26, 44)') throw new Error(`HUD theme missing: ${mobile.background}`);
if (mobile.columns.split(/\s+/).length !== 1) throw new Error(`Expected mobile single column, got ${mobile.columns}`);
await page.screenshot({ path: 'C:/Users/Administrator/AppData/Local/Temp/lxdynamicform-mobile.png' });
console.log(JSON.stringify({ adaptive, fixedColumns, desktopColumns, mobile, externalRequests }));
await browser.close();
