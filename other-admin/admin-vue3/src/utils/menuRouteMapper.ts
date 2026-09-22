import type { Component } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

import type { MenuItem, OAuthMatchedInfo } from '#/menu';
import Layout from '@/layout/index.vue';

/**
 * 二级菜单 url → 组件 扁平映射表
 * url 是唯一标识，与父级菜单无关
 * 注释掉的条目表示路由已禁用，待恢复时取消注释即可
 */
export const ROUTE_COMPONENT_MAP: Record<string, () => Promise<unknown>> = {
  // ===== 系统配置 /baseData =====
  thirdParty: () => import('@/views/eventType/thirdParty/index.vue'),
  globals: () => import('@/views/eventType/globals.vue'),
  mapConfig: () => import('@/views/baseData/mapConfig/index.vue'),
  layoutConfig: () => import('@/views/baseData/layoutConfig/index.vue'),
  // dictionary: () => import('@/views/eventType/dictionary'),

  // ===== 权限中心 /authority =====
  role: () => import('@/views/authority/auth/index.vue'),
  person: () => import('@/views/authority/person/index.vue'),
  IMPermission: () => import('@/views/authority/imPermission/index.vue'),
  IMrole: () => import('@/views/authority/imRole/index.vue'),
  IMperson: () => import('@/views/authority/imPerson/index.vue'),
  adminPermission: () => import('@/views/authority/adminPermission/index.vue'),
  adminRole: () => import('@/views/authority/adminRole/index.vue'),
  adminPerson: () => import('@/views/authority/adminPerson/index.vue'),
  customDepartment: () => import('@/views/authority/customDepartment/index.vue'),
  userManage: () => import('@/views/authority/userManage/index.vue'),

  // ===== H5管理 /h5 =====
  carousel: () => import('@/views/h5/carousel/index.vue'),
  GroupTags: () => import('@/views/h5/groupTags/index.vue'),
  ArchivedTable: () => import('@/views/h5/archivedTable/index.vue'),

  // ===== 协同岗管理 /collaboration =====
  collaboration: () => import('@/views/h5/collaboration/index.vue'),
  quick: () => import('@/views/h5/quick/index.vue'),

  // ===== 位置管理 /location =====
  location: () => import('@/views/location/index.vue'),

  // ===== 三方警单 /policeReport =====
  dock: () => import('@/views/thirdInterface/policeReport/dock.vue'),
  manage: () => import('@/views/thirdInterface/policeReport/manage.vue'),
  typeManage: () => import('@/views/thirdInterface/policeReport/typeManage.vue'),

  // ===== 排班管理 /scheduling =====
  dutyInformation: () => import('@/views/shiftScheduling/dutyInformation/index.vue'),
  dutyType: () => import('@/views/shiftScheduling/dutyType/index.vue'),

  // ===== 预警管理 /notification =====
  alertPush: () => import('@/views/notification/alertPush/index.vue'),

  // ===== 节点管理 /nodeManage =====
  nodeManagement: () => import('@/views/nodeManage/nodeManagement/index.vue'),
  dataManage: () => import('@/views/nodeManage/dataManage/index.vue'),

  // ===== 三方对接 /thirdParty =====
  app: () => import('@/views/thirdInterface/app/index.vue'),
  southInterface: () => import('@/views/thirdInterface/southInterface/index.vue'),
  policeReport: () => import('@/views/thirdInterface/policeReport/index.vue'),
  unifiedComm: () => import('@/views/thirdInterface/unifiedComm/index.vue'),
  agentInterface: () => import('@/views/thirdInterface/agentInterface/index.vue'),

  // ===== 警信扩展 /policeExtend =====
  virtualUser: () => import('@/views/policeExtend/virtualUser/index.vue'),
};

/**
 * 标准化 url：去掉前导斜杠
 * @param url - 原始 url（可能以 / 开头）
 * @returns 去除前导斜杠后的 url
 */
function normalizeUrl(url: string): string {
  if (!url) return '';
  return url.replace(/^\//, '');
}

/**
 * 根据 oauth 菜单数据构建 vue-router 路由配置
 * @param menuData - 后端返回的菜单数据数组
 * @returns routes 构建好的路由数组；matchedInfo 路由匹配诊断信息（已匹配/占位/禁用/路由独有）
 */
export function buildRoutesFromOauthMenu(menuData: MenuItem[]): {
  routes: RouteRecordRaw[];
  matchedInfo: OAuthMatchedInfo;
} {
  const matchedInfo: OAuthMatchedInfo = {
    matched: [],
    placeholder: [],
    disabled: [],
    routeOnly: [],
  };

  const oauthChildUrls = new Set<string>();
  const routes: RouteRecordRaw[] = [];

  if (!Array.isArray(menuData)) {
    console.warn('[menuRouteMapper] menuData is not an array:', menuData);
    return { routes, matchedInfo };
  }

  for (const parentMenu of menuData) {
    // 过滤 status=0 的一级菜单
    if (parentMenu.status === 0) {
      matchedInfo.disabled.push({
        name: parentMenu.name,
        url: parentMenu.url,
        reason: '一级菜单 status=0',
      });
      continue;
    }

    // Dashboard 首页特殊处理
    if (normalizeUrl(parentMenu.url) === 'Dashboard') {
      matchedInfo.matched.push({
        name: parentMenu.name,
        url: parentMenu.url,
        routePath: '/dashboard',
        component: 'views/dashboard',
      });
      continue;
    }

    // 一级菜单：构建 Layout 容器
    const parentPath = parentMenu.url;
    const children: RouteRecordRaw[] = [];

    if (Array.isArray(parentMenu.children) && parentMenu.children.length > 0) {
      const sortedChildren = [...parentMenu.children].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

      for (const childMenu of sortedChildren) {
        const childUrl = normalizeUrl(childMenu.url);
        oauthChildUrls.add(childUrl);

        // 过滤 status=0 的二级菜单
        if (childMenu.status === 0) {
          matchedInfo.disabled.push({
            name: childMenu.name,
            url: childMenu.url,
            parentName: parentMenu.name,
            reason: '二级菜单 status=0',
          });
          continue;
        }

        // 在映射表中查找组件
        if (ROUTE_COMPONENT_MAP[childUrl]) {
          children.push({
            path: childUrl,
            component: ROUTE_COMPONENT_MAP[childUrl] as () => Promise<{ default: Component }>,
            name: childUrl,
            meta: {
              title: childMenu.name,
              _oauthMenuId: childMenu.id,
              _matched: true,
            },
          });
          matchedInfo.matched.push({
            name: childMenu.name,
            url: childMenu.url,
            routePath: `${parentPath}/${childUrl}`,
            component: 'real',
          });
        } else {
          // 未匹配：使用占位页面
          children.push({
            path: childUrl,
            component: () => import('@/views/placeholder/index.vue'),
            name: `placeholder_${childUrl}`,
            meta: {
              title: childMenu.name,
              _oauthMenuId: childMenu.id,
              _matched: false,
              _placeholder: true,
            },
          });
          matchedInfo.placeholder.push({
            name: childMenu.name,
            url: childMenu.url,
            normalizedUrl: childUrl,
            parentName: parentMenu.name,
            routePath: `${parentPath}/${childUrl}`,
            reason: '映射表中无此 url 对应的组件',
          });
        }
      }
    }

    // 只有一级菜单有子菜单时才生成路由
    if (children.length > 0) {
      routes.push({
        path: parentPath,
        component: Layout,
        alwaysShow: true,
        name: normalizeUrl(parentPath),
        meta: {
          title: parentMenu.name,
          icon: parentMenu.imgurl || 'component',
          _oauthMenuId: parentMenu.id,
        },
        children,
      } as RouteRecordRaw);
    }
  }

  // 找出路由存在但接口未返回的菜单
  for (const url of Object.keys(ROUTE_COMPONENT_MAP)) {
    if (!oauthChildUrls.has(url)) {
      matchedInfo.routeOnly.push({
        url,
        reason: '路由映射表中存在，但接口未返回此 url',
      });
    }
  }

  return { routes, matchedInfo };
}

/**
 * 打印映射结果到控制台（调试用，仅开发环境生效）
 * @param matchedInfo - 路由匹配诊断信息
 */
export function printMatchedInfo(matchedInfo: OAuthMatchedInfo): void {
  if (!import.meta.env.DEV) return;

  console.group('%c[OAuth 菜单映射结果]', 'color: #264ed1; font-weight: bold;');

  console.group('%c✅ 映射成功', 'color: #67C23A;');
  console.table(matchedInfo.matched);
  console.groupEnd();

  console.group('%c⚠️ 占位页面（接口有但路由不存在）', 'color: #E6A23C;');
  if (matchedInfo.placeholder.length > 0) {
    console.table(matchedInfo.placeholder);
  } else {
    console.log('无');
  }
  console.groupEnd();

  console.group('%c🔵 路由独有（路由存在但接口未返回）', 'color: #909399;');
  if (matchedInfo.routeOnly.length > 0) {
    console.table(matchedInfo.routeOnly);
  } else {
    console.log('无');
  }
  console.groupEnd();

  console.group('%c🚫 已禁用（status=0）', 'color: #F56C6C;');
  if (matchedInfo.disabled.length > 0) {
    console.table(matchedInfo.disabled);
  } else {
    console.log('无');
  }
  console.groupEnd();

  console.groupEnd();
}
