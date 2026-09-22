import type { RouteRecordRaw } from 'vue-router';

import Layout from '@/layout/index.vue';

type AppRouteRecord = RouteRecordRaw & { alwaysShow?: boolean };

const schedulingRouter: AppRouteRecord = {
  path: '/scheduling',
  component: Layout,
  alwaysShow: true,
  name: 'scheduling',
  meta: {
    title: '排班管理',
    icon: 'document',
  },
  children: [
    {
      path: 'dutyType',
      component: () => import('@/views/shiftScheduling/dutyType/index.vue'),
      name: 'dutyType',
      meta: { title: '排班类型管理' },
    },
    {
      path: 'dutyInformation',
      component: () => import('@/views/shiftScheduling/dutyInformation/index.vue'),
      name: 'dutyInformation',
      meta: { title: '排班信息' },
    },
  ],
};

export default schedulingRouter;
