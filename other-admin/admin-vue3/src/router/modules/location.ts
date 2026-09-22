import type { RouteRecordRaw } from 'vue-router';

import Layout from '@/layout/index.vue';

type AppRouteRecord = RouteRecordRaw & { alwaysShow?: boolean };

const locationRouter: AppRouteRecord = {
  path: '/location',
  component: Layout,
  alwaysShow: true,
  name: 'location',
  meta: {
    title: '位置管理',
    icon: 'map',
  },
  children: [
    {
      path: 'location',
      component: () => import('@/views/location/index.vue'),
      name: 'Location',
      meta: { title: '位置信息' },
    },
  ],
};

export default locationRouter;
