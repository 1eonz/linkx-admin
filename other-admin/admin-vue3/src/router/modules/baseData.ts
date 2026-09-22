import type { RouteRecordRaw } from 'vue-router';

import Layout from '@/layout/index.vue';

type AppRouteRecord = RouteRecordRaw & { alwaysShow?: boolean };

const baseDataRouter: AppRouteRecord = {
  path: '/baseData',
  component: Layout,
  alwaysShow: true,
  name: 'BaseData',
  meta: {
    title: '系统配置',
    icon: 'component',
  },
  children: [
    {
      path: 'thirdParty',
      component: () => import('@/views/baseData/thirdParty/index.vue'),
      name: 'BaseDataThirdParty',
      meta: { title: '三方接入管理' },
    },
    {
      path: 'globals',
      component: () => import('@/views/baseData/globals/index.vue'),
      name: 'Globals',
      meta: { title: '全局参数配置' },
    },
    {
      path: 'mapConfig',
      component: () => import('@/views/baseData/mapConfig/index.vue'),
      name: 'MapConfig',
      meta: { title: '地图配置' },
    },
    {
      path: 'layoutConfig',
      component: () => import('@/views/baseData/layoutConfig/index.vue'),
      name: 'LayoutConfig',
      meta: { title: '布局配置' },
    },
  ],
};

export default baseDataRouter;
