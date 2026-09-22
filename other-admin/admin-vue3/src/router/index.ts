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

/**
 * 重置 router（登出时调用）
 */
export function resetRouter(): void {
  const staticNames = new Set(routes.map((r) => r.name).filter(Boolean));
  const dynamicRoutes = router.getRoutes().filter((r) => !staticNames.has(r.name));
  dynamicRoutes.forEach((r) => {
    if (r.name) router.removeRoute(r.name);
  });
}

export default router;
