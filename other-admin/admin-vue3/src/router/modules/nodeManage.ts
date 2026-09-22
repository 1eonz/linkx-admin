import type { RouteRecordRaw } from 'vue-router';

import Layout from '@/layout/index.vue';

type AppRouteRecord = RouteRecordRaw & { alwaysShow?: boolean };

const nodeManageRouter: AppRouteRecord = {
  path: '/nodeManage',
  component: Layout,
  alwaysShow: true,
  name: 'nodeManage',
  meta: {
    title: '多节点管理',
    icon: 'monitor',
  },
  children: [
    {
      path: 'nodeManagement',
      component: () => import('@/views/nodeManage/nodeManagement/index.vue'),
      name: 'nodeManagement',
      meta: { title: '节点管理' },
    },
    {
      path: 'dataManage',
      component: () => import('@/views/nodeManage/dataManage/index.vue'),
      name: 'dataManage',
      meta: { title: '数据管理' },
    },
  ],
};

export default nodeManageRouter;
