import type { RouteRecordRaw } from 'vue-router';

/**
 * 菜单项（后端返回结构）
 */
export interface MenuItem {
  id: string;
  name: string;
  parentId: string;
  applicationId: string;
  url: string;
  imgurl?: string;
  isleaf?: number;
  level?: number;
  sort?: number;
  status?: number;
  gmtCreated?: string;
  gmtModified?: string;
  children?: MenuItem[] | null;
  /** 是否禁用（系统内置菜单 status=2 时前端设置，用于 el-tree disabled 字段） */
  disabled?: boolean;
}

/**
 * 权限对象
 */
export interface Permissions {
  menus: string[];
  actions: string[];
  type?: number;
}

/**
 * 全局参数项
 */
export interface GlobalItem {
  name: string;
  value: string;
  description?: string;
}

/**
 * OAuth 菜单项（与旧 getMenuList 结构兼容）
 */
export interface OAuthMenuItem extends MenuItem {}

/**
 * 路由过滤上下文
 */
export interface FilterContext {
  menu: MenuItem[];
  menuPermissions: string[];
  globals: GlobalItem[];
  isAdmin: boolean;
  userId: string;
  isProd: boolean;
}

/**
 * 路由过滤结果
 */
export interface FilterResult {
  routes: RouteRecordRaw[];
  permissionsMenu: RouteRecordRaw[];
}

/**
 * OAuth 菜单映射信息
 */
export interface OAuthMatchedInfo {
  matched: Array<{ name: string; url: string; routePath: string; component: string }>;
  placeholder: Array<{ name: string; url: string; normalizedUrl: string; parentName: string; routePath: string; reason: string }>;
  disabled: Array<{ name: string; url: string; parentName?: string; reason: string }>;
  routeOnly: Array<{ url: string; reason: string }>;
}
