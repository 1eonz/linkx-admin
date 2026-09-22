import type { RouteRecordRaw } from 'vue-router';

import Layout from '@/layout/index.vue';

type AppRouteRecord = RouteRecordRaw & { alwaysShow?: boolean };

const alertRouter: AppRouteRecord = {
  path: '/notification',
  component: Layout,
  alwaysShow: true,
  name: 'notification',
  meta: {
    title: '预警管理',
    icon: 'bell',
  },
  children: [
    {
      path: 'alertPush',
      component: () => import('@/views/notification/alertPush/index.vue'),
      name: 'AlertPush',
      meta: { title: '预警推送' },
    },
  ],
};

export default alertRouter;
