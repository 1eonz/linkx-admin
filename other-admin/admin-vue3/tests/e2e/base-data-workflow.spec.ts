import { readFile } from 'node:fs/promises';

import { expect, test, type Page } from '@playwright/test';

import { mockBackend, ok, seedSession } from './fixtures';

async function setFileWithReportedSize(page: Page, selector: string, name: string, size: number): Promise<void> {
  await page.locator(selector).evaluate(
    (input, file) => {
      const rawFile = new File(['mock-file'], file.name, { type: 'application/octet-stream' });
      Object.defineProperty(rawFile, 'size', { value: file.size });
      const transfer = new DataTransfer();
      transfer.items.add(rawFile);
      const fileInput = input as HTMLInputElement;
      fileInput.files = transfer.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    },
    { name, size },
  );
}

test('全局参数加载失败时保留当前数据状态并提供重试', async ({ page }) => {
  let isBootstrapRequest = true;
  let shouldFail = true;
  await mockBackend(page, {
    handler: (path) => {
      if (path !== '/api/globals/list') return undefined;
      if (isBootstrapRequest) {
        isBootstrapRequest = false;
        return ok([]);
      }
      return shouldFail
        ? { code: 500, msg: 'Mock 查询失败', data: null }
        : ok([
            {
              id: 'setting-1',
              name: 'TEST_SETTING',
              value: 'enabled',
              remark: '测试配置',
              remarkEn: 'Test setting',
              status: 0,
            },
          ]);
    },
  });

  await seedSession(page);
  await page.goto('/baseData/globals');

  const errorAlert = page.locator('.load-error');
  await expect(errorAlert).toContainText('全局参数加载失败');
  shouldFail = false;
  await errorAlert.getByRole('button', { name: '重试' }).click();

  await expect(errorAlert).toHaveCount(0);
  await expect(page.locator('.el-table__body-wrapper')).toContainText('TEST_SETTING');
});

test('公共布局配置加载失败时禁止保存默认值并支持重试', async ({ page }) => {
  let shouldFail = true;
  await mockBackend(page, {
    handler: (path) => {
      if (path !== '/api/system/config') return undefined;
      return shouldFail
        ? { code: 500, msg: 'Mock 配置读取失败', data: null }
        : ok([
            {
              id: 'system-name',
              key: 'SYSTEM_NAME',
              value: JSON.stringify({ name: '系统名称', value: 'LinkX Mock' }),
            },
            {
              id: 'group-config',
              key: 'CREAT_GROUP_CONFIG',
              value: JSON.stringify([{ type: 1, name: '自定义建群', enable: 'true' }]),
            },
          ]);
    },
  });

  await seedSession(page);
  await page.goto('/baseData/layoutConfig');

  const config = page.locator('.common-config');
  const error = config.locator('.load-error');
  await expect(error).toContainText('系统配置加载失败');
  await expect(config.getByRole('button', { name: '保存配置' })).toHaveCount(0);
  await expect(config.getByRole('button', { name: '重试' })).toBeEnabled();

  shouldFail = false;
  await config.getByRole('button', { name: '重试' }).click();

  await expect(error).toHaveCount(0);
  await expect(config.getByPlaceholder('请输入系统名称')).toHaveValue('LinkX Mock');
  await expect(config.getByRole('button', { name: '保存配置' })).toBeEnabled();
});

test('地图底图上传拒绝非 mbtiles 文件', async ({ page }) => {
  const requests = await mockBackend(page, {
    handler: (path) =>
      path === '/api/map/selectPageBaseMap' || path === '/api/map/selectPageMap'
        ? ok({ records: [], total: 0 })
        : undefined,
  });

  await seedSession(page);
  await page.goto('/baseData/mapConfig');
  await page.locator('.base-map-upload input[type="file"]').setInputFiles({
    name: 'invalid.zip',
    mimeType: 'application/zip',
    buffer: Buffer.from('not a basemap'),
  });

  await expect(page.locator('.el-message')).toContainText('仅支持 .mbtiles 文件');
  expect(requests.some((request) => new URL(request.url()).pathname.endsWith('/api/map/uploadBaseMap'))).toBe(false);
});

test('地图底图上传成功后初始化并刷新底图列表', async ({ page }) => {
  const mapRequests: Array<{ path: string; method: string; contentType?: string }> = [];
  await mockBackend(page, {
    handler: (path, request) => {
      if (path === '/api/map/selectPageBaseMap') {
        mapRequests.push({ path, method: request.method() });
        return ok({
          records: [
            {
              id: 'basemap-1',
              name: '杭州市底图',
              size: '1 KB',
              created: '2026-09-26 09:00:00',
            },
          ],
          total: 1,
        });
      }
      if (path === '/api/map/selectPageMap') return ok({ records: [], total: 0 });
      if (path === '/api/map/uploadBaseMap') {
        mapRequests.push({
          path,
          method: request.method(),
          contentType: request.headers()['content-type'],
        });
        return ok('上传成功');
      }
      if (path === '/api/map/initBaseMap') {
        mapRequests.push({ path, method: request.method() });
        return ok('更新底图成功');
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/mapConfig');
  await expect(page.getByRole('cell', { name: '杭州市底图' })).toBeVisible();
  mapRequests.length = 0;

  await page.locator('.base-map-upload input[type="file"]').setInputFiles({
    name: 'hangzhou.mbtiles',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('mock mbtiles'),
  });

  await expect
    .poll(() => mapRequests.map(({ path }) => path))
    .toEqual(['/api/map/uploadBaseMap', '/api/map/initBaseMap', '/api/map/selectPageBaseMap']);
  expect(mapRequests[0]?.method).toBe('POST');
  expect(mapRequests[0]?.contentType).toContain('multipart/form-data');
});

test('地图底图上传失败时不初始化或刷新列表', async ({ page }) => {
  const mapRequests: string[] = [];
  await mockBackend(page, {
    handler: (path) => {
      if (path === '/api/map/selectPageBaseMap') {
        mapRequests.push(path);
        return ok({ records: [], total: 0 });
      }
      if (path === '/api/map/selectPageMap') return ok({ records: [], total: 0 });
      if (path === '/api/map/uploadBaseMap') {
        mapRequests.push(path);
        return { code: 500, msg: 'Mock 底图上传失败', data: null };
      }
      if (path === '/api/map/initBaseMap') mapRequests.push(path);
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/mapConfig');
  await page.locator('.base-map-upload input[type="file"]').setInputFiles({
    name: 'failed-upload.mbtiles',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('mock mbtiles'),
  });

  await expect
    .poll(() => mapRequests.filter((path) => path !== '/api/map/selectPageBaseMap'))
    .toEqual(['/api/map/uploadBaseMap']);
  await expect(page.locator('.el-message--error')).toContainText('Mock 底图上传失败');
});

test('地图初始化失败时不刷新底图列表', async ({ page }) => {
  const mapRequests: string[] = [];
  await mockBackend(page, {
    handler: (path) => {
      if (path === '/api/map/selectPageBaseMap') {
        mapRequests.push(path);
        return ok({ records: [], total: 0 });
      }
      if (path === '/api/map/selectPageMap') return ok({ records: [], total: 0 });
      if (path === '/api/map/uploadBaseMap' || path === '/api/map/initBaseMap') {
        mapRequests.push(path);
        return path === '/api/map/initBaseMap' ? { code: 500, msg: 'Mock 底图初始化失败', data: null } : ok('上传成功');
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/mapConfig');
  await page.locator('.base-map-upload input[type="file"]').setInputFiles({
    name: 'failed-init.mbtiles',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('mock mbtiles'),
  });

  await expect
    .poll(() => mapRequests.filter((path) => path !== '/api/map/selectPageBaseMap'))
    .toEqual(['/api/map/uploadBaseMap', '/api/map/initBaseMap']);
  await expect(page.locator('.el-message--error')).toContainText('Mock 底图初始化失败');
});

test('删除底图使用既有 id 契约并刷新列表', async ({ page }) => {
  let deleted = false;
  let deleteUrl = '';
  await mockBackend(page, {
    handler: (path, request) => {
      if (path === '/api/map/selectPageBaseMap') {
        return ok({
          records: deleted
            ? []
            : [
                {
                  id: 'basemap-1',
                  name: '杭州市底图',
                  size: '1 KB',
                  created: '2026-09-26 09:00:00',
                },
              ],
          total: deleted ? 0 : 1,
        });
      }
      if (path === '/api/map/selectPageMap') return ok({ records: [], total: 0 });
      if (path === '/api/map/deleteBaseMap') {
        deleteUrl = request.url();
        deleted = true;
        return ok('删除成功');
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/mapConfig');
  const basemapRow = page.getByRole('row').filter({ hasText: '杭州市底图' });
  await expect(basemapRow).toBeVisible();
  await basemapRow.getByRole('button', { name: '删除' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '确定' }).click();

  await expect(basemapRow).toHaveCount(0);
  expect(new URL(deleteUrl).searchParams.get('id')).toBe('basemap-1');
});

test('地图配置新增编辑沿用接口载荷且失败后可重试', async ({ page }) => {
  const maps: Array<Record<string, unknown>> = [];
  let createPayload: Record<string, unknown> | undefined;
  let updatePayload: Record<string, unknown> | undefined;
  let failUpdate = true;
  await mockBackend(page, {
    handler: (path, request) => {
      if (path === '/api/map/selectPageBaseMap') return ok({ records: [], total: 0 });
      if (path === '/api/map/selectPageMap') return ok({ records: maps, total: maps.length });
      if (path === '/api/map/createMap') {
        createPayload = request.postDataJSON() as Record<string, unknown>;
        maps.push({ id: 'map-1', ...createPayload });
        return ok('新增成功');
      }
      if (path === '/api/map/updateMap') {
        updatePayload = request.postDataJSON() as Record<string, unknown>;
        if (failUpdate) {
          failUpdate = false;
          return { code: 500, msg: 'Mock 地图更新失败', data: null };
        }
        const index = maps.findIndex((item) => item.id === updatePayload?.id);
        if (index >= 0) maps[index] = { ...updatePayload };
        return ok('修改成功');
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/mapConfig');
  await page.getByRole('button', { name: '新增地图' }).click();

  const dialog = page.getByRole('dialog');
  await dialog.getByPlaceholder('请输入名称').fill('测试地图');
  await dialog.locator('.el-select').nth(0).click();
  await page.getByRole('option', { name: 'AMap', exact: true }).click();
  await dialog.locator('.el-select').nth(1).click();
  await page.getByRole('option', { name: '栅格', exact: true }).click();
  await dialog.getByPlaceholder('请输入配置 JSON，或点击上方按钮填入模板').fill('{"url":"/tiles/{z}/{x}/{y}"}');
  await dialog.getByRole('button', { name: '创建' }).click();

  const row = page.getByRole('row').filter({ hasText: '测试地图' });
  await expect(row).toBeVisible();
  expect(createPayload).toMatchObject({
    name: '测试地图',
    mapType: 'AMap',
    type: 0,
    activation: 1,
    configuration: '{"url":"/tiles/{z}/{x}/{y}"}',
  });
  expect(createPayload).not.toHaveProperty('id');

  await row.getByRole('button', { name: '编辑' }).click();
  await dialog.getByPlaceholder('请输入名称').fill('测试地图-已编辑');
  await dialog.getByRole('button', { name: '修改' }).click();
  await expect(page.locator('.el-message--error')).toContainText('Mock 地图更新失败');
  await expect(dialog.getByPlaceholder('请输入名称')).toHaveValue('测试地图-已编辑');

  await dialog.getByRole('button', { name: '修改' }).click();
  await expect(page.getByRole('row').filter({ hasText: '测试地图-已编辑' })).toBeVisible();
  expect(updatePayload).toMatchObject({ id: 'map-1', name: '测试地图-已编辑', mapType: 'AMap', type: 0 });
});

test('地图数据页提交地理编码配置沿用 Vue2 字段契约', async ({ page }) => {
  let updateBody = '';
  await mockBackend(page, {
    handler: (path, request) => {
      if (path === '/api/map/selectPageBaseMap' || path === '/api/map/selectPageMap') {
        return ok({ records: [], total: 0 });
      }
      if (path === '/api/map/selectGeo') {
        return ok({ geocode: '高德正向', inversecode: '默认逆地理', poi: '默认 POI' });
      }
      if (path === '/api/map/selectListGeo') {
        const type = request.postDataJSON().type;
        return ok(
          type === 'inversecode'
            ? ['默认逆地理', '备用逆地理']
            : type === 'poi'
              ? ['默认 POI', '备用 POI']
              : ['高德正向'],
        );
      }
      if (path === '/api/map/selectDivision') return ok({ name: '杭州市' });
      if (path === '/api/map/updateGeo') {
        updateBody = request.postData() ?? '';
        return ok('保存成功');
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/mapConfig');
  await page.getByRole('tab', { name: '地图数据' }).click();
  const geoSelects = page.locator('.geo-form .el-select');
  await geoSelects.nth(1).click();
  await page.getByRole('option', { name: '备用逆地理' }).click();
  await geoSelects.nth(2).click();
  await page.getByRole('option', { name: '备用 POI' }).click();
  await page.getByRole('button', { name: '更新接口' }).click();

  await expect(page.locator('.el-message--success')).toContainText('操作成功');
  expect(JSON.parse(updateBody)).toEqual({
    geocode: '高德正向',
    inversecode: '备用逆地理',
    poi: '备用 POI',
  });
});

test('地理编码配置和选项加载可重试且保存失败后可再次提交', async ({ page }) => {
  let geoReadCount = 0;
  let failedOptionRead = false;
  let geoUpdateCount = 0;
  let updateBody = '';
  await mockBackend(page, {
    handler: (path, request) => {
      if (path === '/api/map/selectPageBaseMap' || path === '/api/map/selectPageMap') {
        return ok({ records: [], total: 0 });
      }
      if (path === '/api/map/selectGeo') {
        geoReadCount += 1;
        return geoReadCount === 1
          ? { code: 500, msg: 'Mock 地理编码读取失败', data: null }
          : ok({ geocode: '高德正向', inversecode: '默认逆地理', poi: '默认 POI' });
      }
      if (path === '/api/map/selectListGeo') {
        const type = request.postDataJSON().type;
        if (type === 'inversecode' && !failedOptionRead) {
          failedOptionRead = true;
          return { code: 500, msg: 'Mock 地理编码选项读取失败', data: null };
        }
        return ok(type === 'poi' ? ['默认 POI', '备用 POI'] : ['默认逆地理', '备用逆地理']);
      }
      if (path === '/api/map/selectDivision') return ok({ name: '杭州市' });
      if (path === '/api/map/updateGeo') {
        geoUpdateCount += 1;
        updateBody = request.postData() ?? '';
        return geoUpdateCount === 1 ? { code: 500, msg: 'Mock 地理编码保存失败', data: null } : ok('保存成功');
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/mapConfig');
  await page.getByRole('tab', { name: '地图数据' }).click();

  const geoError = page.getByRole('alert').filter({ hasText: '地理编码配置或选项读取失败' });
  const updateButton = page.getByRole('button', { name: '更新接口' });
  await expect(geoError).toBeVisible();
  await expect(updateButton).toBeDisabled();
  await geoError.getByRole('button', { name: '重试' }).click();
  await expect(geoError).toHaveCount(0);
  await expect(page.locator('.geo-form .el-select').nth(0)).toContainText('高德正向');

  const geoSelects = page.locator('.geo-form .el-select');
  await geoSelects.nth(1).click();
  await page.getByRole('option', { name: '备用逆地理' }).click();
  await geoSelects.nth(2).click();
  await page.getByRole('option', { name: '备用 POI' }).click();
  await updateButton.click();
  await expect(page.locator('.el-message--error')).toContainText('Mock 地理编码保存失败');

  await updateButton.click();
  await expect(page.locator('.el-message--success')).toContainText('操作成功');
  expect(JSON.parse(updateBody)).toEqual({
    geocode: '高德正向',
    inversecode: '备用逆地理',
    poi: '备用 POI',
  });
});

test('行政区划上传拒绝非 geojson 文件', async ({ page }) => {
  const requests = await mockBackend(page, {
    handler: (path) => {
      if (path === '/api/map/selectPageBaseMap' || path === '/api/map/selectPageMap') {
        return ok({ records: [], total: 0 });
      }
      if (path === '/api/map/selectDivision') return ok({ name: '杭州市' });
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/mapConfig');
  await page.getByRole('tab', { name: '地图数据' }).click();
  await page.locator('.division-upload input[type="file"]').setInputFiles({
    name: 'division.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"type":"FeatureCollection","features":[]}'),
  });

  await expect(page.locator('.el-message--error')).toContainText('仅支持 .geojson 文件');
  expect(requests.some((request) => new URL(request.url()).pathname.endsWith('/api/map/uploadBaseMap'))).toBe(false);
});

test('行政区划上传成功后重新加载区域名称', async ({ page }) => {
  let uploaded = false;
  let contentType = '';
  await mockBackend(page, {
    handler: (path, request) => {
      if (path === '/api/map/selectPageBaseMap' || path === '/api/map/selectPageMap') {
        return ok({ records: [], total: 0 });
      }
      if (path === '/api/map/selectDivision') {
        return ok({ name: uploaded ? '更新后的行政区' : '杭州市' });
      }
      if (path === '/api/map/uploadBaseMap') {
        contentType = request.headers()['content-type'] ?? '';
        uploaded = true;
        return ok('上传成功');
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/mapConfig');
  await page.getByRole('tab', { name: '地图数据' }).click();
  await page.locator('.division-upload input[type="file"]').setInputFiles({
    name: 'updated-division.geojson',
    mimeType: 'application/geo+json',
    buffer: Buffer.from('{"type":"FeatureCollection","features":[]}'),
  });

  await expect(page.getByText('更新后的行政区', { exact: true })).toBeVisible();
  expect(contentType).toContain('multipart/form-data');
});

test('底图上传允许 500 MB 边界并拒绝超限文件', async ({ page }) => {
  const uploadRequests: string[] = [];
  await mockBackend(page, {
    handler: (path) => {
      if (path === '/api/map/selectPageBaseMap' || path === '/api/map/selectPageMap')
        return ok({ records: [], total: 0 });
      if (path === '/api/map/uploadBaseMap' || path === '/api/map/initBaseMap') {
        uploadRequests.push(path);
        return ok('操作成功');
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/mapConfig');
  const input = '.base-map-upload input[type="file"]';
  await setFileWithReportedSize(page, input, 'limit.mbtiles', 500 * 1024 * 1024);
  await expect.poll(() => uploadRequests).toEqual(['/api/map/uploadBaseMap', '/api/map/initBaseMap']);

  await setFileWithReportedSize(page, input, 'over-limit.mbtiles', 500 * 1024 * 1024 + 1);
  await expect(page.locator('.el-message--error').last()).toContainText('文件大小不能超过 500MB');
  expect(uploadRequests).toEqual(['/api/map/uploadBaseMap', '/api/map/initBaseMap']);
});

test('行政区划上传允许 500 MB 边界并拒绝超限文件', async ({ page }) => {
  let uploadCount = 0;
  await mockBackend(page, {
    handler: (path) => {
      if (path === '/api/map/selectPageBaseMap' || path === '/api/map/selectPageMap') {
        return ok({ records: [], total: 0 });
      }
      if (path === '/api/map/selectDivision') return ok({ name: uploadCount ? '更新后的行政区' : '杭州市' });
      if (path === '/api/map/uploadBaseMap') {
        uploadCount += 1;
        return ok('上传成功');
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/mapConfig');
  await page.getByRole('tab', { name: '地图数据' }).click();
  const input = '.division-upload input[type="file"]';
  await setFileWithReportedSize(page, input, 'limit.geojson', 500 * 1024 * 1024);
  await expect(page.getByText('更新后的行政区', { exact: true })).toBeVisible();

  await setFileWithReportedSize(page, input, 'over-limit.geojson', 500 * 1024 * 1024 + 1);
  await expect(page.locator('.el-message--error').last()).toContainText('文件大小不能超过 500MB');
  expect(uploadCount).toBe(1);
});

test('行政区划读取失败显示重试并恢复区域名称', async ({ page }) => {
  let attempts = 0;
  await mockBackend(page, {
    handler: (path) => {
      if (path === '/api/map/selectPageBaseMap' || path === '/api/map/selectPageMap') {
        return ok({ records: [], total: 0 });
      }
      if (path === '/api/map/selectDivision') {
        attempts += 1;
        return attempts === 1 ? { code: 500, msg: 'Mock 查询失败', data: null } : ok({ name: '杭州市' });
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/mapConfig');
  await page.getByRole('tab', { name: '地图数据' }).click();
  const error = page.locator('.division-load-error');
  await expect(error).toContainText('行政区划加载失败');
  await error.getByRole('button', { name: '重试' }).click();

  await expect(error).toHaveCount(0);
  await expect(page.getByText('杭州市', { exact: true })).toBeVisible();
  expect(attempts).toBe(2);
});

test('下载行政区划沿用 JSON 业务响应并生成 GeoJSON 文件', async ({ page }) => {
  const exportedGeoJson = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { name: '杭州' } }] };
  let exportUrl = '';
  let exportMethod = '';
  await mockBackend(page, {
    handler: (path, request) => {
      if (path === '/api/map/selectPageBaseMap' || path === '/api/map/selectPageMap') {
        return ok({ records: [], total: 0 });
      }
      if (path === '/api/map/selectDivision') return ok({ name: '杭州市' });
      if (path === '/api/map/updateDivision') {
        exportUrl = request.url();
        exportMethod = request.method();
        return ok(exportedGeoJson);
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/mapConfig');
  await page.getByRole('tab', { name: '地图数据' }).click();
  await expect(page.getByText('杭州市', { exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '下载行政区划' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('杭州市.geojson');
  expect(exportMethod).toBe('POST');
  expect(new URL(exportUrl).searchParams.get('nodeId')).toBe('0');
  const filePath = await download.path();
  if (!filePath) throw new Error('Mock 导出文件未生成');
  expect(JSON.parse(await readFile(filePath, 'utf8'))).toEqual(exportedGeoJson);
});

test('行政区划导出失败时显示可恢复错误', async ({ page }) => {
  await mockBackend(page, {
    handler: (path) => {
      if (path === '/api/map/selectPageBaseMap' || path === '/api/map/selectPageMap') {
        return ok({ records: [], total: 0 });
      }
      if (path === '/api/map/selectDivision') return ok({ name: '杭州市' });
      if (path === '/api/map/updateDivision') return { code: 500, msg: 'Mock 导出失败', data: null };
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/mapConfig');
  await page.getByRole('tab', { name: '地图数据' }).click();
  await page.getByRole('button', { name: '下载行政区划' }).click();

  await expect(page.locator('.el-message--error').last()).toContainText('下载失败');
});

test('全局参数新增按 Vue2 载荷提交并在保存期间锁定重复操作', async ({ page }) => {
  let createPayload: Record<string, unknown> | undefined;
  let createCount = 0;
  let listCount = 0;
  await mockBackend(page, {
    actions: ['/admin/globals/create'],
    delayMs: 150,
    handler: (path, request) => {
      if (path === '/api/globals/list') {
        listCount += 1;
        return ok([]);
      }
      if (path === '/api/globals/create') {
        createCount += 1;
        createPayload = request.postDataJSON();
        return ok('success');
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/globals');
  await page.getByRole('button', { name: 'Add' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('.el-form-item').nth(2).locator('input').fill('1');
  await dialog.locator('.el-form-item').nth(3).locator('input').fill('测试配置');
  const submit = dialog.getByRole('button', { name: 'Create' });
  await submit.click();

  await expect(submit).toBeDisabled();
  await expect(dialog).toHaveCount(0);
  expect(createCount).toBe(1);
  expect(createPayload).toMatchObject({ id: '', name: '', value: '1', remarkEn: '测试配置', status: 0 });
  expect(listCount).toBeGreaterThanOrEqual(2);
});

test('全局参数新增失败保留表单并允许重试', async ({ page }) => {
  let createCount = 0;
  await mockBackend(page, {
    actions: ['/admin/globals/create'],
    handler: (path) => {
      if (path === '/api/globals/list') return ok([]);
      if (path === '/api/globals/create') {
        createCount += 1;
        return createCount === 1 ? { code: 500, msg: 'Mock 新增失败', data: null } : ok('success');
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/globals');
  await page.getByRole('button', { name: 'Add' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('.el-form-item').nth(2).locator('input').fill('1');
  await dialog.locator('.el-form-item').nth(3).locator('input').fill('测试配置');
  await dialog.getByRole('button', { name: 'Create' }).click();

  await expect(page.locator('.el-message--error').last()).toContainText('Mock 新增失败');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Create' }).click();

  await expect(dialog).toHaveCount(0);
  expect(createCount).toBe(2);
});

test('全局参数编辑沿用完整字段载荷并刷新数据', async ({ page }) => {
  let item = {
    id: 'global-1',
    name: 'AUTO_MISSION_STATUS',
    value: '0',
    remark: '任务状态',
    remarkEn: 'Mission status',
    status: 0,
    classify: '任务',
  };
  let updatePayload: Record<string, unknown> | undefined;
  await mockBackend(page, {
    actions: ['/admin/globals/update'],
    handler: (path, request) => {
      if (path === '/api/globals/list') return ok([item]);
      if (path === '/api/globals/update') {
        updatePayload = request.postDataJSON();
        item = { ...item, ...(updatePayload as typeof item) };
        return ok('success');
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/globals');
  const row = page.getByRole('row').filter({ hasText: 'AUTO_MISSION_STATUS' });
  await row.getByRole('button', { name: 'Edit' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('.el-form-item').nth(2).locator('input').fill('1');
  await dialog.getByRole('button', { name: 'Change' }).click();

  await expect(dialog).toHaveCount(0);
  await expect(row).toContainText('1');
  expect(updatePayload).toMatchObject({
    id: 'global-1',
    name: 'AUTO_MISSION_STATUS',
    value: '1',
    remark: '任务状态',
    remarkEn: 'Mission status',
    status: 0,
  });
});

test('全局参数删除失败保留数据，重试后按 id 参数删除', async ({ page }) => {
  let deleted = false;
  let deleteAttempts = 0;
  let deleteUrl = '';
  const item = {
    id: 'global-delete-1',
    name: 'TEST_DELETE',
    value: '1',
    remark: '待删除配置',
    remarkEn: 'Delete test',
    status: 0,
  };
  await mockBackend(page, {
    actions: ['/admin/globals/delete'],
    handler: (path, request) => {
      if (path === '/api/globals/list') return ok(deleted ? [] : [item]);
      if (path === '/api/globals/delete') {
        deleteAttempts += 1;
        deleteUrl = request.url();
        if (deleteAttempts === 1) return { code: 500, msg: 'Mock 删除失败', data: null };
        deleted = true;
        return ok('success');
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/globals');
  const row = page.getByRole('row').filter({ hasText: 'TEST_DELETE' });
  await row.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();

  await expect(page.locator('.el-message--error').last()).toContainText('Mock 删除失败');
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();

  await expect(row).toHaveCount(0);
  expect(new URL(deleteUrl).searchParams.get('id')).toBe('global-delete-1');
  expect(deleteAttempts).toBe(2);
});

test('全局参数恢复操作沿用更新接口并提交正常状态', async ({ page }) => {
  let item = {
    id: 'global-restore-1',
    name: 'TEST_RESTORE',
    value: '0',
    remark: '停用配置',
    remarkEn: 'Restore test',
    status: 1,
  };
  let updatePayload: Record<string, unknown> | undefined;
  await mockBackend(page, {
    actions: ['/admin/globals/update'],
    handler: (path, request) => {
      if (path === '/api/globals/list') return ok([item]);
      if (path === '/api/globals/update') {
        updatePayload = request.postDataJSON();
        item = { ...item, status: Number(updatePayload.status) };
        return ok('success');
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/globals');
  const row = page.getByRole('row').filter({ hasText: 'TEST_RESTORE' });
  await row.getByRole('button', { name: 'Restore' }).click();

  await expect(row).toContainText('Normal');
  expect(updatePayload).toMatchObject({ id: 'global-restore-1', name: 'TEST_RESTORE', status: 0 });
});

test('全局参数操作入口严格按权限码显示', async ({ page }) => {
  await mockBackend(page, {
    actions: ['/admin/globals/create'],
    handler: (path) =>
      path === '/api/globals/list'
        ? ok([
            {
              id: 'global-permission-1',
              name: 'TEST_PERMISSION',
              value: '1',
              remark: '权限测试',
              remarkEn: 'Permission test',
              status: 0,
            },
          ])
        : undefined,
  });

  await seedSession(page);
  await page.goto('/baseData/globals');

  await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
  const row = page.getByRole('row').filter({ hasText: 'TEST_PERMISSION' });
  await expect(row.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  await expect(row.getByRole('button', { name: 'Delete' })).toHaveCount(0);
});

test('全局参数支持键盘分类筛选和服务端关键词查询并适配窄屏', async ({ page }) => {
  const items = [
    {
      id: 'global-security',
      name: 'SECURITY_LEVEL',
      value: '1',
      remark: '安全级别',
      remarkEn: 'Security level',
      status: 0,
      classify: '安全',
    },
    {
      id: 'global-security-session',
      name: 'SESSION_TTL',
      value: '30',
      remark: '会话时长',
      remarkEn: 'Session lifetime',
      status: 0,
      classify: '安全',
    },
    {
      id: 'global-map',
      name: 'MAP_TYPE',
      value: 'AMap',
      remark: '地图类型',
      remarkEn: 'Map type',
      status: 0,
      classify: '地图',
    },
  ];
  let lastKeyword: string | null = null;
  await mockBackend(page, {
    actions: [],
    handler: (path, request) => {
      if (path !== '/api/globals/list') return undefined;
      lastKeyword = new URL(request.url()).searchParams.get('keyword');
      return ok(lastKeyword ? items.filter((item) => item.name.includes(lastKeyword ?? '')) : items);
    },
  });

  await page.setViewportSize({ width: 320, height: 900 });
  await seedSession(page);
  await page.goto('/baseData/globals');
  await expect(page.getByRole('row').filter({ hasText: 'SECURITY_LEVEL' })).toBeVisible();
  const firstSecurityRow = page.getByRole('row').filter({ hasText: 'SECURITY_LEVEL' });
  await expect(firstSecurityRow.locator('td').first()).toHaveAttribute('rowspan', '2');
  await expect(page.getByRole('row').filter({ hasText: 'SESSION_TTL' })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'MAP_TYPE' })).toBeVisible();
  const mapCategory = page.getByRole('button', { name: /地图/ });
  await mapCategory.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('row').filter({ hasText: 'SECURITY_LEVEL' })).toHaveCount(0);
  await expect(page.getByRole('row').filter({ hasText: 'MAP_TYPE' })).toBeVisible();

  await page.getByRole('button', { name: '重置筛选' }).click();
  const search = page.getByRole('textbox', { name: '搜索全局参数' });
  await search.fill('MAP_TYPE');
  await expect.poll(() => lastKeyword).toBe('MAP_TYPE');
  await expect(page.getByRole('row').filter({ hasText: 'MAP_TYPE' })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'SECURITY_LEVEL' })).toHaveCount(0);

  const pageWidth = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(pageWidth).toBeLessThanOrEqual(0);
});

test('App H5 查询全部板块沿用 show=-1 并支持失败重试', async ({ page }) => {
  let shouldFail = true;
  let requestedShow: string | null = null;
  await mockBackend(page, {
    handler: (path, request) => {
      if (path !== '/api/layout/app/sections') return undefined;
      requestedShow = new URL(request.url()).searchParams.get('show');
      if (shouldFail) return { code: 500, msg: 'Mock 板块读取失败', data: null };
      return ok([
        {
          id: 'section-visible',
          name: 'Mock 显示板块',
          type: 2,
          show: 1,
          sort: 1,
        },
        {
          id: 'section-hidden',
          name: 'Mock 隐藏板块',
          type: 5,
          show: 0,
          sort: 2,
        },
      ]);
    },
  });

  await seedSession(page);
  await page.goto('/baseData/layoutConfig');
  await page.getByRole('tab', { name: 'App H5设置' }).click();

  const appConfig = page.locator('.app-h5-config');
  await expect(appConfig.locator('.load-error')).toContainText('板块列表加载失败');
  await expect(appConfig.getByRole('button', { name: '新增板块' })).toBeDisabled();
  shouldFail = false;
  await appConfig.getByRole('button', { name: '重试' }).click();

  await expect(page.getByRole('row').filter({ hasText: 'Mock 显示板块' })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'Mock 隐藏板块' })).toBeVisible();
  expect(requestedShow).toBe('-1');
});

test('App H5 新增板块保存期间锁定重复操作', async ({ page }) => {
  const sections: Array<Record<string, unknown>> = [];
  let createCount = 0;
  await mockBackend(page, {
    delayMs: 150,
    handler: (path, request) => {
      if (path !== '/api/layout/app/sections') return undefined;
      if (request.method() === 'POST') {
        createCount += 1;
        sections.push({ id: 'section-created', ...(request.postDataJSON() as Record<string, unknown>) });
        return ok('新增成功');
      }
      return ok(sections);
    },
  });

  await seedSession(page);
  await page.goto('/baseData/layoutConfig');
  await page.getByRole('tab', { name: 'App H5设置' }).click();

  const appConfig = page.locator('.app-h5-config');
  const createButton = appConfig.getByRole('button', { name: '新增板块' });
  await expect(createButton).toBeEnabled();
  await createButton.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByPlaceholder('请输入板块名称').fill('重复提交保护样例');
  await dialog.getByRole('button', { name: '确定' }).click();

  await expect(createButton).toBeDisabled();
  await expect(page.getByRole('row').filter({ hasText: '重复提交保护样例' })).toBeVisible();
  expect(createCount).toBe(1);
});

test('App H5 编辑回显并在删除失败后恢复操作，成功删除后刷新列表', async ({ page }) => {
  const sections: Array<Record<string, unknown>> = [
    {
      id: 'section-1',
      name: '常用应用',
      type: 2,
      show: 1,
      sort: 2,
      custom: JSON.stringify({ rowCount: 4 }),
    },
  ];
  const writes: Array<{ method: string; path: string; body?: Record<string, unknown> }> = [];
  let shouldFailDelete = true;
  await mockBackend(page, {
    handler: (path, request) => {
      if (path === '/api/layout/app/sections' && request.method() === 'GET') return ok(sections);
      if (path === '/api/layout/app/sections/section-1' && request.method() === 'PUT') {
        const body = request.postDataJSON() as Record<string, unknown>;
        writes.push({ method: request.method(), path, body });
        Object.assign(sections[0], body);
        return ok('更新成功');
      }
      if (path === '/api/layout/app/sections/section-1' && request.method() === 'DELETE') {
        writes.push({ method: request.method(), path });
        if (shouldFailDelete) {
          shouldFailDelete = false;
          return { code: 500, msg: 'Mock 删除失败', data: null };
        }
        sections.splice(0, 1);
        return ok('删除成功');
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/baseData/layoutConfig');
  await page.getByRole('tab', { name: 'App H5设置' }).click();

  const appConfig = page.locator('.app-h5-config');
  let row = page.getByRole('row').filter({ hasText: '常用应用' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: '编辑' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByPlaceholder('请输入板块名称')).toHaveValue('常用应用');
  await expect(dialog.getByLabel('每行应用数')).toHaveValue('4');
  await dialog.getByPlaceholder('请输入板块名称').fill('常用应用入口');
  await dialog.getByRole('button', { name: '确定' }).click();

  row = page.getByRole('row').filter({ hasText: '常用应用入口' });
  await expect(row).toBeVisible();
  await expect(page.locator('.el-message--success').last()).toContainText('更新成功');
  expect(writes[0]).toMatchObject({
    method: 'PUT',
    path: '/api/layout/app/sections/section-1',
    body: { id: 'section-1', name: '常用应用入口', type: 2, custom: JSON.stringify({ rowCount: 4 }) },
  });

  await row.getByRole('button', { name: '删除' }).click();
  await expect(page.locator('.el-message-box')).toContainText('确定要删除该板块吗？');
  await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click();
  await expect(page.locator('.el-message--error').last()).toContainText('删除失败');
  await expect(row).toBeVisible();
  await expect(row.getByRole('button', { name: '删除' })).toBeEnabled();

  await row.getByRole('button', { name: '删除' }).click();
  await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click();
  await expect(page.getByRole('row').filter({ hasText: '常用应用入口' })).toHaveCount(0);
  expect(writes.filter((write) => write.method === 'DELETE')).toHaveLength(2);
  expect(appConfig.getByRole('button', { name: '新增板块' })).toBeEnabled();
});

test('公共设置首次保存协同群组配置后回填 ID 并按更新载荷继续保存', async ({ page }) => {
  const writes: Array<Record<string, unknown>> = [];
  await mockBackend(page, {
    handler: (path, request) => {
      if (path !== '/api/system/config') return undefined;
      if (request.method() === 'PUT') {
        const payload = request.postDataJSON() as Record<string, unknown>;
        writes.push(payload);
        return { code: 0, msg: '保存成功', data: { id: 'group-config-created' } };
      }
      return ok([
        {
          id: 'system-name',
          key: 'SYSTEM_NAME',
          value: JSON.stringify({ name: '系统名称', value: 'LinkX Mock' }),
        },
      ]);
    },
  });

  await seedSession(page);
  await page.goto('/baseData/layoutConfig');

  const config = page.locator('.common-config');
  const groupButtons = config.locator('.group-button-config .el-form-item');
  await expect(groupButtons).toHaveCount(4);
  const firstButton = groupButtons.nth(0);
  await firstButton.getByPlaceholder('请输入标题').fill('自定义群组入口');
  await firstButton.locator('label.el-checkbox').click();
  await config.getByRole('button', { name: '保存配置' }).click();

  await expect(page.locator('.el-message--success').last()).toContainText('保存成功');
  expect(writes[0]).toMatchObject({ id: '', key: 'CREAT_GROUP_CONFIG' });
  const createdButtons = JSON.parse(String(writes[0].value)) as Array<Record<string, unknown>>;
  expect(createdButtons[0]).toMatchObject({ type: 1, name: '自定义群组入口', enable: 'false' });

  await groupButtons.nth(1).getByPlaceholder('请输入标题').fill('快捷群组入口');
  await config.getByRole('button', { name: '保存配置' }).click();
  await expect(page.locator('.el-message--success').last()).toContainText('保存成功');
  expect(writes[1]).toMatchObject({ id: 'group-config-created' });
  expect(writes[1]).not.toHaveProperty('key');
  const updatedButtons = JSON.parse(String(writes[1].value)) as Array<Record<string, unknown>>;
  expect(updatedButtons[1]).toMatchObject({ type: 2, name: '快捷群组入口', enable: 'true' });
});

test('PC 页签读取失败时禁止编辑并在重试后恢复', async ({ page }) => {
  let allowConfigRead = false;
  await mockBackend(page, {
    handler: (path) => {
      if (path !== '/api/system/config') return undefined;
      if (!allowConfigRead) return { code: 500, msg: 'Mock 系统配置读取失败', data: null };
      return ok([
        {
          id: 'pc-nav',
          key: 'PC_NAV_CUSTOM',
          value: JSON.stringify([{ name: '巡查系统', url: '/patrol', order: 1, openWay: 0 }]),
        },
      ]);
    },
  });

  await seedSession(page);
  await page.goto('/baseData/layoutConfig');
  await page.getByRole('tab', { name: 'PC端设置' }).click();

  const pcConfig = page.locator('.pc-config');
  await expect(pcConfig.locator('.load-error')).toContainText('PC 端配置加载失败');
  await expect(pcConfig.getByRole('button', { name: '新增页签' })).toBeDisabled();
  allowConfigRead = true;
  await pcConfig.getByRole('button', { name: '重试' }).click();

  await expect(page.getByRole('row').filter({ hasText: '巡查系统' })).toBeVisible();
  await expect(pcConfig.locator('.load-error')).toHaveCount(0);
});

test('PC 页签保存成功但回读失败时提示状态并要求重试', async ({ page }) => {
  let value = JSON.stringify([{ name: '巡查系统', url: '/patrol', order: 1, openWay: 0 }]);
  let saved = false;
  let failRefresh = true;
  await mockBackend(page, {
    handler: (path, request) => {
      if (path !== '/api/system/config') return undefined;
      if (request.method() === 'PUT') {
        value = String(request.postDataJSON()?.value ?? '[]');
        saved = true;
        return ok('更新成功');
      }
      if (saved && failRefresh) {
        failRefresh = false;
        return { code: 500, msg: 'Mock 保存后读取失败', data: null };
      }
      return ok([{ id: 'pc-nav', key: 'PC_NAV_CUSTOM', value }]);
    },
  });

  await seedSession(page);
  await page.goto('/baseData/layoutConfig');
  await page.getByRole('tab', { name: 'PC端设置' }).click();

  const pcConfig = page.locator('.pc-config');
  const row = page.getByRole('row').filter({ hasText: '巡查系统' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: '删除' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '确定' }).click();

  await expect(pcConfig.locator('.load-error')).toContainText('保存成功，但刷新 PC 端配置失败');
  await expect(page.locator('.el-message--warning').last()).toContainText('保存成功');
  await expect(pcConfig.getByRole('button', { name: '新增页签' })).toBeDisabled();
  await pcConfig.getByRole('button', { name: '重试' }).click();
  await expect(page.getByRole('row').filter({ hasText: '巡查系统' })).toHaveCount(0);
  expect(JSON.parse(value)).toEqual([]);
});

test('PC 页签新增和编辑成功后按 Vue2 配置格式回读', async ({ page }) => {
  let tabs = [{ name: '巡查系统', url: '/patrol', order: 1, openWay: 0 }];
  const savedTabs: Array<Array<Record<string, unknown>>> = [];
  await mockBackend(page, {
    handler: (path, request) => {
      if (path !== '/api/system/config') return undefined;
      if (request.method() === 'PUT') {
        const body = request.postDataJSON() as { value?: string };
        tabs = JSON.parse(body.value ?? '[]') as typeof tabs;
        savedTabs.push(tabs);
        return ok('更新成功');
      }
      return ok([{ id: 'pc-nav', key: 'PC_NAV_CUSTOM', value: JSON.stringify(tabs) }]);
    },
  });

  await seedSession(page);
  await page.goto('/baseData/layoutConfig');
  await page.getByRole('tab', { name: 'PC端设置' }).click();

  const pcConfig = page.locator('.pc-config');
  await expect(page.getByRole('row').filter({ hasText: '巡查系统' })).toBeVisible();
  await pcConfig.getByRole('button', { name: '新增页签' }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByPlaceholder('请输入页签名称').fill('统一消息');
  await dialog.getByPlaceholder('请输入跳转 URL').fill('/message');
  await dialog.getByRole('button', { name: '确定' }).click();

  let newRow = page.getByRole('row').filter({ hasText: '统一消息' });
  await expect(newRow).toBeVisible();
  await expect(page.locator('.el-message--success').last()).toContainText('新增页签成功');
  expect(savedTabs[0]).toContainEqual({ name: '统一消息', url: '/message', order: 1, openWay: 0 });

  await newRow.getByRole('button', { name: '编辑' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByPlaceholder('请输入页签名称').fill('统一消息中心');
  await dialog.getByPlaceholder('请输入跳转 URL').fill('/message/home');
  await dialog.getByRole('button', { name: '确定' }).click();

  newRow = page.getByRole('row').filter({ hasText: '统一消息中心' });
  await expect(newRow).toBeVisible();
  await expect(page.locator('.el-message--success').last()).toContainText('编辑页签成功');
  expect(savedTabs[1]).toContainEqual({ name: '统一消息中心', url: '/message/home', order: 1, openWay: 0 });
});

test('运维统计未选择日期时仍提交空时间参数并释放导出状态', async ({ page }) => {
  let exportUrl = '';
  await mockBackend(page, {
    handler: (path, request) => {
      if (path !== '/dashboard/v1/statistic/login/export') return undefined;
      exportUrl = request.url();
      return { code: 500, msg: 'Mock 导出失败', data: null };
    },
  });

  await seedSession(page);
  await page.goto('/baseData/layoutConfig');
  const opsTab = page.getByRole('tab', { name: '运维统计' });
  await opsTab.click();
  await expect(opsTab).toHaveClass(/is-active/);

  const exportButton = page.getByRole('button', { name: '导出' });
  await exportButton.click();
  await expect(exportButton).toBeEnabled();
  await expect(page.locator('.el-message--error').last()).toContainText('Mock 导出失败');

  const query = new URL(exportUrl).searchParams;
  expect(query.get('startTime')).toBe('');
  expect(query.get('endTime')).toBe('');
  await expect(page.locator('.el-message--warning')).toHaveCount(0);
});

test('运维统计成功时按响应头文件名下载 Excel 内容', async ({ page }) => {
  let exportUrl = '';
  const filename = '日活统计_mock.xlsx';
  const fileContents = 'mock-excel-binary-content';
  await mockBackend(page);
  await page.route('**/linkx/admin/dashboard/v1/statistic/login/export**', async (route) => {
    exportUrl = route.request().url();
    await route.fulfill({
      status: 200,
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
      body: fileContents,
    });
  });

  await seedSession(page);
  await page.goto('/baseData/layoutConfig');
  const opsTab = page.getByRole('tab', { name: '运维统计' });
  await opsTab.click();
  await expect(opsTab).toHaveClass(/is-active/);

  const downloadPromise = page.waitForEvent('download');
  const exportButton = page.getByRole('button', { name: '导出' });
  await exportButton.click();
  const download = await downloadPromise;
  await expect(exportButton).toBeEnabled();
  expect(download.suggestedFilename()).toBe(filename);
  expect(exportUrl).toBeTruthy();
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  if (downloadPath) {
    const { readFile } = await import('node:fs/promises');
    expect((await readFile(downloadPath)).toString('utf8')).toBe(fileContents);
  }
  const query = new URL(exportUrl).searchParams;
  expect(query.get('startTime')).toBe('');
  expect(query.get('endTime')).toBe('');
  await expect(page.locator('.el-message--success').last()).toContainText('导出成功');
});
