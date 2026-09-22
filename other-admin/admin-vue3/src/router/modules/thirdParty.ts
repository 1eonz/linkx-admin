import type { RouteRecordRaw } from 'vue-router';

import Layout from '@/layout/index.vue';

type AppRouteRecord = RouteRecordRaw & { alwaysShow?: boolean };

const thirdPartyRouter: AppRouteRecord = {
  path: '/thirdParty',
  component: Layout,
  alwaysShow: true,
  name: 'ThirdParty',
  meta: {
    title: '三方对接',
    icon: 'connection',
  },
  children: [
    {
      path: 'app',
      component: () => import('@/views/thirdInterface/app/index.vue'),
      name: 'ThirdApp',
      meta: { title: '应用管理' },
    },
    {
      path: 'southInterface',
      component: () => import('@/views/thirdInterface/southInterface/index.vue'),
      name: 'SouthInterface',
      meta: { title: '南向对接' },
    },
    {
      path: 'policeReport',
      component: () => import('@/views/thirdInterface/policeReport/index.vue'),
      name: 'PoliceReport',
      meta: { title: '警单平台' },
    },
    {
      path: 'unifiedComm',
      component: () => import('@/views/thirdInterface/unifiedComm/index.vue'),
      name: 'UnifiedComm',
      meta: { title: '通信服务管理' },
    },
    {
      path: 'agentInterface',
      component: () => import('@/views/thirdInterface/agentInterface/index.vue'),
      name: 'AgentInterface',
      meta: { title: 'AI智能体对接' },
    },
  ],
};

export default thirdPartyRouter;
