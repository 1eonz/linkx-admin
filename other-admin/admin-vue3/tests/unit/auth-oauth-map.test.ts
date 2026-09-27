import { describe, expect, it } from 'vitest';

import { buildRoutesFromOauthMenu } from '@/utils/menuRouteMapper';

describe('OAuth 菜单路由映射', () => {
  it('将已迁移的系统配置页面映射到真实 Vue3 页面', () => {
    const { routes, matchedInfo } = buildRoutesFromOauthMenu([
      {
        id: 'base-data',
        name: '系统配置',
        parentId: '',
        applicationId: '',
        url: '/baseData',
        status: 1,
        children: [
          {
            id: 'third-party',
            name: '三方接入管理',
            parentId: 'base-data',
            applicationId: '',
            url: 'thirdParty',
            status: 1,
          },
          { id: 'globals', name: '全局参数配置', parentId: 'base-data', applicationId: '', url: 'globals', status: 1 },
        ],
      },
    ]);

    expect(routes[0]?.children).toHaveLength(2);
    expect(matchedInfo.placeholder).toHaveLength(0);
    expect(matchedInfo.matched.map((item) => item.url)).toEqual(['thirdParty', 'globals']);
  });

  it('将旧协同岗 URL 兼容到当前协同岗页面', () => {
    const { routes, matchedInfo } = buildRoutesFromOauthMenu([
      {
        id: 'h5',
        name: 'H5管理',
        parentId: '',
        applicationId: '',
        url: '/h5',
        status: 1,
        children: [
          {
            id: 'collaboration',
            name: '协同岗管理',
            parentId: 'h5',
            applicationId: '',
            url: 'collaboration',
            status: 1,
          },
        ],
      },
    ]);

    expect(routes[0]?.children?.[0]?.meta?._matched).toBe(true);
    expect(matchedInfo.placeholder).toHaveLength(0);
  });

  it('将警单旧子菜单映射到当前实际组件，并过滤停用项', () => {
    const { routes, matchedInfo } = buildRoutesFromOauthMenu([
      {
        id: 'police',
        name: '警单平台',
        parentId: '',
        applicationId: '',
        url: '/thirdParty',
        status: 1,
        children: [
          { id: 'dock', name: '警单对接', parentId: 'police', applicationId: '', url: 'dock', status: 1 },
          { id: 'manage', name: '警单管理', parentId: 'police', applicationId: '', url: 'manage', status: 1 },
          { id: 'type', name: '类型管理', parentId: 'police', applicationId: '', url: 'typeManage', status: 1 },
          { id: 'disabled', name: '已停用', parentId: 'police', applicationId: '', url: 'disabled', status: 0 },
        ],
      },
    ]);

    expect(routes[0]?.children?.map((route) => route.path)).toEqual(['dock', 'manage', 'typeManage']);
    expect(matchedInfo.placeholder).toHaveLength(0);
    expect(matchedInfo.disabled.map((item) => item.url)).toEqual(['disabled']);
  });
});
