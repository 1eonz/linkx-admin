import type { RouteRecordRaw } from 'vue-router';

import Layout from '@/layout/index.vue';

type AppRouteRecord = RouteRecordRaw & { alwaysShow?: boolean };

const collaborationRouter: AppRouteRecord = {
  path: '/collaboration',
  component: Layout,
  alwaysShow: true,
  name: 'Collaboration',
  meta: {
    title: '协同岗管理',
    icon: 'chat',
  },
  children: [
    {
      path: 'index',
      component: () => import('@/views/collaboration/index.vue'),
      name: 'CollaborationIndex',
      meta: { title: '协同岗管理' },
    },
    {
      path: 'quick',
      component: () => import('@/views/quick/index.vue'),
      name: 'Quick',
      meta: { title: '标签管理' },
    },
  ],
};

export default collaborationRouter;
