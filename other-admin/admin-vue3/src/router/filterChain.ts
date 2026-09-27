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

export function cloneModuleRoutes(routes: RouteRecordRaw[] = moduleRoutes): RouteRecordRaw[] {
  return routes.map((route) => {
    const cloned = { ...route, meta: route.meta ? { ...route.meta } : route.meta } as RouteRecordRaw;
    if (route.children) cloned.children = cloneModuleRoutes(route.children);
    return cloned;
  });
}

/**
 * 路由过滤器接口（责任链模式）
 */
export interface RouteFilter {
  readonly name: string;
  filter(routes: RouteRecordRaw[], ctx: FilterContext): Promise<RouteRecordRaw[]>;
}

/**
 * License 权限过滤
 * 与 Vue2 路由保持一致：群组协同失效时隐藏归档群组和位置管理。
 */
export class LicenseFilter implements RouteFilter {
  readonly name = 'LicenseFilter';

  filter(routes: RouteRecordRaw[], _ctx: FilterContext): Promise<RouteRecordRaw[]> {
    return getLicenseInfoUtil().then((licenseAuth) => {
      if (licenseAuth?.groupCollaborationAuth) {
        // 群组协同失效时仅隐藏归档群组和位置管理；空父路由随之移除。
        const excludeChildNames = ['ArchivedTable', 'Location'];
        routes = routes
          .map((route) => {
            if (route.children) {
              route.children = route.children.filter((child) => !excludeChildNames.includes(child.name as string));
            }
            return route;
          })
          .filter((route) => !route.children || route.children.length > 0);
      }

      return routes;
    });
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

    const hasCarouselMenu = (items: FilterContext['menu']): boolean =>
      items.some(
        (item) =>
          item.url === 'layoutConfig/banner' || (item.children?.length ? hasCarouselMenu(item.children) : false),
      );
    routes = routes.map((route) => {
      if (route.children) {
        if (!isAdmin && !hasCarouselMenu(ctx.menu)) {
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
    const disabledPaths = this.collectDisabledPaths(ctx.menu);

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

    const filterMenus = (routeList: RouteRecordRaw[], parentPath = ''): RouteRecordRaw[] => {
      return routeList
        .filter((route) => {
          const path = route.path;
          const fullPath = this.normalizeRoutePath(parentPath, path);
          // 停用菜单必须对所有身份生效，不能被超管全量放行分支绕过。
          if (disabledPaths.has(fullPath)) return false;
          if (hidePaths.includes(path)) return false;
          // type===0 表示超管，但全局开关仍生效。
          if (permissionsType === 0) return true;

          // collaboration 的 index 子路由特殊处理
          if (path === 'index' && paths.includes('/collaboration/index')) {
            return true;
          }
          return paths.some(
            (menuPath) =>
              menuPath === path ||
              menuPath.startsWith(`${path}/`) ||
              menuPath.replace(/^\//, '').startsWith(`${path.replace(/^\//, '')}/`) ||
              // 后端菜单通常返回 /authority/role，而 Vue Router 子路由只声明 role。
              // 追加后缀匹配，避免权限过滤误删合法子路由。
              menuPath.endsWith(`/${path}`),
          );
        })
        .map((route) => {
          const newRoute = { ...route };
          if (newRoute.children) {
            const fullPath = this.normalizeRoutePath(parentPath, newRoute.path);
            newRoute.children = filterMenus(newRoute.children, fullPath);
          }
          return newRoute;
        })
        .filter((route) => !route.children || route.children.length > 0);
    };

    return filterMenus(routes);
  }

  /** 将父级和子级路由 path 规范化为菜单接口使用的绝对 URL。 */
  private normalizeRoutePath(parentPath: string, path: string): string {
    const combined = path.startsWith('/') ? path : `${parentPath}/${path}`;
    const normalized = combined.replace(/\/+/g, '/').replace(/\/\/$/, '');
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }

  /** 收集后端明确标记为停用的菜单 URL。 */
  private collectDisabledPaths(menu: FilterContext['menu']): Set<string> {
    const disabled = new Set<string>();
    const visit = (items: FilterContext['menu']): void => {
      items.forEach((item) => {
        if (item.status === 0) disabled.add(this.normalizeRoutePath('', item.url));
        if (item.children?.length) visit(item.children);
      });
    };
    visit(menu);
    return disabled;
  }

  /**
   * 递归遍历后端菜单，按 menuPermissions 收集 url 到 paths 数组
   */
  private collectPaths(menu: FilterContext['menu'], menuPermissions: string[]): string[] {
    const paths: string[] = [];

    const mapper = (data: FilterContext['menu']): void => {
      data.forEach((item) => {
        // 停用菜单不能因为权限 ID 仍被缓存而重新注册；子节点仍需继续遍历，
        // 这样父节点缺少单独权限 ID 时，已授权的叶子菜单也能正常匹配。
        if (item.status !== 0 && menuPermissions.includes(item.id)) {
          paths.push(item.url);
        }
        if (item.status !== 0 && item.children) {
          mapper(item.children);
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
  const expectedEpoch = userStore.sessionEpoch;
  const { globals } = userStore;

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

  // 每次从模块定义复制路由树，避免上个账号的过滤结果污染下个账号。
  const filteredRoutes = await chain.run(cloneModuleRoutes(), ctx);
  if (expectedEpoch !== userStore.sessionEpoch) return [];
  userStore.setPermissionsMenu(filteredRoutes);
  return filteredRoutes;
}
