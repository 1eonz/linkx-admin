import type { RouteRecordRaw } from 'vue-router';

import Layout from '@/layout/index.vue';

type AppRouteRecord = RouteRecordRaw & { alwaysShow?: boolean };

const h5Router: AppRouteRecord = {
  path: '/h5',
  component: Layout,
  alwaysShow: true,
  name: 'H5',
  meta: {
    title: 'H5管理',
    icon: 'mobile',
  },
  children: [
    {
      path: 'carousel',
      component: () => import('@/views/h5/carousel/index.vue'),
      name: 'Carousel',
      meta: { title: '轮播图管理' },
    },
    {
      path: 'ArchivedTable',
      component: () => import('@/views/h5/archivedTable/index.vue'),
      name: 'ArchivedTable',
      meta: { title: '已归档群组管理' },
    },
  ],
};

export default h5Router;
