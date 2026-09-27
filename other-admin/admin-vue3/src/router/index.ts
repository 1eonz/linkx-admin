import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHistory } from 'vue-router';

import Layout from '@/layout/index.vue';

/**
 * 自定义路由元信息扩展（hidden / alwaysShow 是项目自定义字段）
 */
type AppRouteRecord = RouteRecordRaw & {
  hidden?: boolean;
  alwaysShow?: boolean;
};

/**
 * 静态路由
 */
export const routes: AppRouteRecord[] = [
  {
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    hidden: true,
  },
  {
    path: '/404',
    component: () => import('@/views/404.vue'),
    hidden: true,
  },
  {
    path: '/h5/ArchivedTable',
    redirect: '/policeExtend/ArchivedTable',
    hidden: true,
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'homePage',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页', icon: 'dashboard' },
      },
    ],
  },
  // 通配符必须放在最后
  { path: '/:pathMatch(.*)*', redirect: '/', hidden: true },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_PUBLIC_PATH || '/'),
  routes: routes as RouteRecordRaw[],
  scrollBehavior: () => ({ top: 0 }),
});

const dynamicRouteNames = new Set<string>();

export function addDynamicRoute(route: RouteRecordRaw): void {
  if (route.name) dynamicRouteNames.add(String(route.name));
  router.addRoute(route);
}

/**
 * 重置 router（登出时调用）
 */
export function resetRouter(): void {
  dynamicRouteNames.forEach((name) => {
    if (router.hasRoute(name)) router.removeRoute(name);
  });
  dynamicRouteNames.clear();
}

export default router;
