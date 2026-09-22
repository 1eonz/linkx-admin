import type { RouteRecordRaw } from 'vue-router';

import Layout from '@/layout/index.vue';

type AppRouteRecord = RouteRecordRaw & { alwaysShow?: boolean };

const policeExtendRouter: AppRouteRecord = {
  path: '/policeExtend',
  component: Layout,
  alwaysShow: true,
  name: 'policeExtend',
  meta: {
    title: '警信扩展信息管理',
    icon: 'user',
  },
  children: [
    {
      path: 'virtualUser',
      component: () => import('@/views/policeExtend/virtualUser/index.vue'),
      name: 'virtualUser',
      meta: { title: '虚拟用户管理' },
    },
  ],
};

export default policeExtendRouter;
