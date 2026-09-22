import type { RouteRecordRaw } from 'vue-router';

import type { FilterContext } from '#/menu';
import alertRouter from './modules/alert';
import authorityRouter from './modules/authority';
import baseDataRouter from './modules/baseData';
import collaborationRouter from './modules/collaboration';
import h5Router from './modules/h5';
import locationRouter from './modules/location';
import nodeManageRouter from './modules/nodeManage';
import policeExtendRouter from './modules/policeExtend';
import schedulingRouter from './modules/scheduling';
import thirdPartyRouter from './modules/thirdParty';
import { getLicenseInfoUtil } from '@/composables/useLicense';
import { useUserStore } from '@/store/modules/useUserStore';
import { getIsAdmin, getUserId } from '@/utils/auth';

type AppRouteRecord = RouteRecordRaw & { alwaysShow?: boolean; hidden?: boolean };

// 当前已注册的模块路由（共 10 个模块）
export const moduleRoutes: AppRouteRecord[] = [
  baseDataRouter as AppRouteRecord,
  h5Router as AppRouteRecord,
  collaborationRouter as AppRouteRecord,
  authorityRouter as AppRouteRecord,
  locationRouter as AppRouteRecord,
  schedulingRouter as AppRouteRecord,
  alertRouter as AppRouteRecord,
  policeExtendRouter as AppRouteRecord,
  thirdPartyRouter as AppRouteRecord,
  nodeManageRouter as AppRouteRecord,
];

/**
 * 路由过滤器接口（责任链模式）
 */
export interface RouteFilter {
  readonly name: string;
  filter(routes: RouteRecordRaw[], ctx: FilterContext): Promise<RouteRecordRaw[]>;
}

/**
 * License 权限过滤
 * groupCollaborationAuth → 隐藏协同岗管理整个父路由（Collaboration）+ H5 父路由下 ArchivedTable/Quick/GroupTags 子路由 + 位置管理 Location 子路由
 * businessCollaborationAuth → 隐藏 H5 的 App/Carousel
 */
export class LicenseFilter implements RouteFilter {
  readonly name = 'LicenseFilter';

  async filter(routes: RouteRecordRaw[], _ctx: FilterContext): Promise<RouteRecordRaw[]> {
    const licenseAuth = await getLicenseInfoUtil();

    if (licenseAuth?.groupCollaborationAuth) {
      // 群组协同 license：
      // - 隐藏 collaboration 父路由（含 CollaborationIndex/Quick 子路由）
      // - 隐藏 H5 父路由下的 ArchivedTable/Quick/GroupTags 子路由
      // - 隐藏位置管理父路由下的 Location 子路由（若父路由无子路由则整体移除）
      const excludeParentNames = ['Collaboration'];
      const excludeChildNames = ['Quick', 'GroupTags', 'ArchivedTable', 'Location'];
      routes = routes
        .filter((route) => !excludeParentNames.includes(route.name as string))
        .map((route) => {
          if (route.children) {
            route.children = route.children.filter((child) => !excludeChildNames.includes(child.name as string));
          }
          return route;
        })
        .filter((route) => !route.children || route.children.length > 0);
    }

    if (licenseAuth?.businessCollaborationAuth) {
      const excludeNames = ['App', 'Carousel'];
      routes = routes
        .map((route) => {
          if (route.children) {
            route.children = route.children.filter((child) => !excludeNames.includes(child.name as string));
          }
          return route;
        })
        .filter((route) => !route.children || route.children.length > 0);
    }

    return routes;
  }
}

/**
 * 全局配置过滤
 * 非 admin 或 DUTY_SCHEDULE_ENABLE≠1 → 隐藏排班信息
 */
export class GlobalConfigFilter implements RouteFilter {
  readonly name = 'GlobalConfigFilter';

  async filter(routes: RouteRecordRaw[], ctx: FilterContext): Promise<RouteRecordRaw[]> {
    const isAdmin = ctx.isAdmin;
    const dutyScheduleEnable = ctx.globals.find((item) => item.name === 'DUTY_SCHEDULE_ENABLE')?.value;

    if (!isAdmin || dutyScheduleEnable !== '1') {
      routes = routes
        .map((route) => {
          if (route.children) {
            route.children = route.children.filter((child) => child.name !== 'dutyInformation');
          }
          return route;
        })
        .filter((route) => !route.children || route.children.length > 0);
    }

    return routes;
  }
}

/**
 * 用户权限过滤
 * 非 admin → 隐藏 layoutConfig
 * 非 admin + userId≠1 → 隐藏 userManage
 * 生产环境 → 隐藏 6 个权限相关路由
 */
export class UserAuthFilter implements RouteFilter {
  readonly name = 'UserAuthFilter';

  async filter(routes: RouteRecordRaw[], ctx: FilterContext): Promise<RouteRecordRaw[]> {
    const isAdmin = ctx.isAdmin;
    const userId = ctx.userId;

    routes = routes.map((route) => {
      if (route.children) {
        if (!isAdmin) {
          route.children = route.children.filter((child) => child.path !== 'layoutConfig');
        }
        // 用户管理菜单：仅 isAdmin 且 userId='1' 时显示
        const showUserManage = isAdmin && userId === '1';
        if (!showUserManage) {
          route.children = route.children.filter((child) => child.name !== 'userManage');
        }
        // 生产环境隐藏 6 个权限路由
        if (ctx.isProd) {
          const hiddenPaths = ['IMPermission', 'IMrole', 'IMperson', 'adminPermission', 'adminRole', 'adminPerson'];
          route.children = route.children.filter((child) => !hiddenPaths.includes(child.path));
        }
      }
      return route;
    });

    return routes;
  }
}

/**
 * 菜单权限过滤（根据后端返回的 paths 列表过滤）
 */
export class MenuPermissionFilter implements RouteFilter {
  readonly name = 'MenuPermissionFilter';

  async filter(routes: RouteRecordRaw[], ctx: FilterContext): Promise<RouteRecordRaw[]> {
    const userStore = useUserStore();
    const permissionsType = userStore.permissions.type;
    const paths = this.collectPaths(ctx.menu, ctx.menuPermissions);

    console.log(
      '[MenuPermissionFilter] permissionsType:',
      permissionsType,
      'permissionsRaw:',
      JSON.parse(JSON.stringify(userStore.permissions)),
      'paths:',
      paths,
      'isAdmin:',
      ctx.isAdmin,
    );

    // 从 globals 收集需要隐藏的 path（EDGEGATEWAY_BREAKER/CAR_BREAKER/CUSTOMIZED_LAYER）
    const hidePaths: string[] = [];
    ctx.globals.forEach((item) => {
      if (item.name === 'EDGEGATEWAY_BREAKER' && item.value === '0') {
        hidePaths.push('gateway');
      } else if (item.name === 'CAR_BREAKER' && item.value === '0') {
        hidePaths.push('vehicle');
      } else if (item.name === 'CUSTOMIZED_LAYER' && item.value === '0') {
        hidePaths.push('layer');
      }
    });

    const filterMenus = (routeList: RouteRecordRaw[]): RouteRecordRaw[] => {
      return routeList
        .filter((route) => {
          // type===0 表示超管，不限制
          // 超管（isAdmin=true）也直接放行，避免依赖 /oauth/v2/permissions 接口返回的 type 字段
          if (permissionsType === 0 || ctx.isAdmin) return true;

          const path = route.path;
          if (hidePaths.includes(path)) return false;

          // collaboration 的 index 子路由特殊处理
          if (path === 'index' && paths.includes('/collaboration/index')) {
            return true;
          }
          return paths.includes(path);
        })
        .map((route) => {
          const newRoute = { ...route };
          if (newRoute.children) {
            newRoute.children = filterMenus(newRoute.children);
          }
          return newRoute;
        });
    };

    return filterMenus(routes);
  }

  /**
   * 递归遍历后端菜单，按 menuPermissions 收集 url 到 paths 数组
   */
  private collectPaths(menu: FilterContext['menu'], menuPermissions: string[]): string[] {
    const paths: string[] = [];

    // 手动补充父级菜单 id
    const newMenuPermissions = [...menuPermissions, '1522392406668869814', '1522392406668869816'];

    const mapper = (data: FilterContext['menu']): void => {
      data.forEach((item) => {
        if (newMenuPermissions.includes(item.id)) {
          paths.push(item.url);
          if (item.children) {
            mapper(item.children);
          }
        }
      });
    };
    mapper(menu);

    // 过滤没有子菜单的父级
    return this.filterParentPaths(paths);
  }

  /**
   * 处理 paths 中"父级在 paths 但所有子级都不在"的情况
   */
  private filterParentPaths(paths: string[]): string[] {
    // 简化版：保留所有 paths，不强制要求子路由存在
    // 特殊处理：collaboration 的 index 子路由
    if (paths.includes('collaboration') || paths.includes('/collaboration')) {
      if (!paths.includes('/collaboration/index')) {
        paths.push('/collaboration/index');
      }
    }
    return paths;
  }
}

/**
 * 责任链
 */
export class FilterChain {
  private filters: RouteFilter[] = [];

  use(filter: RouteFilter): FilterChain {
    this.filters.push(filter);
    return this;
  }

  async run(routes: RouteRecordRaw[], ctx: FilterContext): Promise<RouteRecordRaw[]> {
    let result = routes;
    for (const filter of this.filters) {
      result = await filter.filter(result, ctx);
    }
    return result;
  }
}

/**
 * 根据权限动态添加路由（Vue3 版 addRouterByPermissions）
 */
export async function addRouterByPermissions(
  menu: FilterContext['menu'],
  menuPermissions: string[],
): Promise<RouteRecordRaw[]> {
  const userStore = useUserStore();
  const { globals, permissions } = userStore;

  // 清理 localStorage 中的旧标志
  localStorage.removeItem('hiddenGateWay');
  localStorage.removeItem('hiddenVehicle');

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  let supersetHttps = '';
  let supersetHttp = '';

  globals.forEach((item) => {
    if (item.name === 'EDGEGATEWAY_BREAKER' && item.value === '0') {
      localStorage.setItem('hiddenGateWay', 'true');
    } else if (item.name === 'CAR_BREAKER' && item.value === '0') {
      localStorage.setItem('hiddenVehicle', 'true');
    } else if (item.name === 'SUPERSET_SERVER_URL') {
      supersetHttps = item.value.replace('ip', hostname);
    } else if (item.name === 'SUPERSET_SERVER_URL_HTTP') {
      supersetHttp = item.value.replace('ip', hostname);
    } else if (item.name === 'CONFIG_DEVICE_GB') {
      sessionStorage.gbId = item.value;
    }
  });

  const supersetUrl = protocol === 'https:' ? supersetHttps : supersetHttp;
  sessionStorage.supersetUrl = supersetUrl;

  const ctx: FilterContext = {
    menu,
    menuPermissions,
    globals,
    isAdmin: getIsAdmin(),
    userId: getUserId() ?? '',
    isProd: import.meta.env.PROD,
  };

  // 组装责任链
  const chain = new FilterChain()
    .use(new LicenseFilter())
    .use(new GlobalConfigFilter())
    .use(new UserAuthFilter())
    .use(new MenuPermissionFilter());

  const filteredRoutes = await chain.run(moduleRoutes, ctx);
  console.log(
    '[FilterChain] 过滤后路由:',
    JSON.parse(
      JSON.stringify(
        filteredRoutes.map((r) => ({ path: r.path, name: r.name, childrenCount: r.children?.length ?? 0 })),
      ),
    ),
  );
  console.log(
    '[FilterChain] permissions.type:',
    userStore.permissions.type,
    'menuPermissions:',
    ctx.menuPermissions,
    'isAdmin:',
    ctx.isAdmin,
  );
  userStore.setPermissionsMenu(filteredRoutes);
  return filteredRoutes;
}
