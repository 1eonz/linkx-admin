import type { Page, Request } from '@playwright/test';

import { getLimitedPreviewMenuPermissions, previewMenu, previewMenuPermissions } from '../../mock/preview-menu';

export const menus = previewMenu;
export const menuModules = previewMenu.map(
  (parent) => [parent.url, parent.children?.map((child) => child.url.slice(parent.url.length + 1)) ?? []] as const,
);

export const ok = (data: unknown = null) => ({ code: 0, msg: '操作成功', data });

/** 可复用的接口状态，供页面回归覆盖成功、空结果、失败和鉴权失效。 */
export type MockApiState = 'success' | 'empty' | 'error' | 'unauthorized';

export interface MockBackendOptions {
  admin?: boolean;
  loginCode?: number;
  loginWarning?: string;
  actions?: string[];
  handler?: (path: string, request: Request) => unknown | undefined;
  /** 指定路径返回失败状态，便于验证失败恢复和重试。 */
  states?: Record<string, MockApiState>;
  /** 模拟慢请求；页面切换或关闭时可验证旧请求不会回写。 */
  delayMs?: number;
}

/** Intercept every backend request: tests must never send writes to a real service. */
export async function mockBackend(page: Page, options: MockBackendOptions = {}) {
  const requests: Request[] = [];
  await page.route('**/linkx/admin/**', async (route) => {
    const request = route.request();
    requests.push(request);
    const path = new URL(request.url()).pathname.replace('/linkx/admin', '');
    const state = options.states?.[path] ?? 'success';
    if (options.delayMs) await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    if (state === 'unauthorized')
      return route.fulfill({ status: 401, json: { code: 401, msg: '登录已失效', data: null } });
    if (state === 'error') return route.fulfill({ status: 500, json: { code: 500, msg: 'Mock 服务异常', data: null } });
    const custom = options.handler?.(path, request);
    if (custom !== undefined) return route.fulfill({ json: custom });
    let data: unknown = [];
    if (path.endsWith('/oauth/v2/login')) {
      return route.fulfill({
        json: {
          ...ok({
            accessToken: 'mock-token',
            userName: 'Mock管理员',
            userId: '1',
            idCardNum: '',
            isAdmin: options.admin !== false,
          }),
          code: options.loginCode ?? 0,
          ...(options.loginWarning ? { licenseWarning: options.loginWarning } : {}),
        },
      });
    }
    if (path === '/api/menu/list') data = menus;
    else if (path.endsWith('/oauth/v2/permissions'))
      data = {
        type: options.admin === false ? 1 : 0,
        menus: options.admin === false ? getLimitedPreviewMenuPermissions() : previewMenuPermissions,
        actions: options.actions ?? [
          '/admin/role/create',
          '/admin/role/update',
          '/admin/role/delete',
          '/admin/user/create',
          '/admin/user/update',
          '/admin/user/delete',
        ],
      };
    else if (path === '/api/globals/list') data = [{ id: 'duty', name: 'DUTY_SCHEDULE_ENABLE', value: '1' }];
    else if (path === '/base/v1/globals/getGlobalsList')
      data = { SYSTEM_NAME: 'LinkX Mock', ALLOW_SIMPLE_PASSWORD: '1', DEPARTMENT_SYNC_SIGN: '0' };
    else if (path === '/api/msip/license/info')
      data = { status: 1, LINKXBS: '1', LINKXGCF: '1', LINKXTCF: '1', LINKXBCF: '1', LINKXACF: '1', LINKXNDI: '1' };
    else if (path === '/collaboration/v1/base/version') data = { linkx: { serviceVersion: 'mock-1.0' } };
    else if (path === '/permission/v1/permission/tree') data = [];
    else if (path.includes('/oauth/v2/keepalive')) data = null;
    else if (path.endsWith('/page')) data = { records: [], total: 0 };
    if (state === 'empty') data = path.endsWith('/page') ? { records: [], total: 0 } : [];
    await route.fulfill({ json: ok(data) });
  });
  return requests;
}

export async function seedSession(page: Page, admin = true) {
  await page.addInitScript((isAdmin) => {
    localStorage.setItem('vue_admin_template_token', 'mock-token');
    localStorage.setItem('is_admin', JSON.stringify(isAdmin));
    localStorage.setItem('back_user_id', '1');
    localStorage.setItem('back_username', 'Mock管理员');
  }, admin);
}
