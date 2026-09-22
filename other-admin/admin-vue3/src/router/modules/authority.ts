import type { RouteRecordRaw } from 'vue-router';

import Layout from '@/layout/index.vue';

type AppRouteRecord = RouteRecordRaw & { alwaysShow?: boolean };

const authorityRouter: AppRouteRecord = {
  path: '/authority',
  component: Layout,
  alwaysShow: true,
  name: 'authority',
  meta: {
    title: '权限中心',
    icon: 'password',
  },
  children: [
    {
      path: 'role',
      component: () => import('@/views/authority/auth/index.vue'),
      name: 'Role',
      meta: { title: '角色管理' },
    },
    {
      path: 'person',
      component: () => import('@/views/authority/person/index.vue'),
      name: 'person',
      meta: { title: '权限管理' },
    },
    {
      path: 'userManage',
      component: () => import('@/views/authority/userManage/index.vue'),
      name: 'userManage',
      meta: { title: '用户管理' },
    },
    {
      path: 'IMPermission',
      component: () => import('@/views/authority/imPermission/index.vue'),
      name: 'IMPermission',
      meta: { title: '前台权限管理' },
    },
    {
      path: 'IMrole',
      component: () => import('@/views/authority/imRole/index.vue'),
      name: 'IMrole',
      meta: { title: '前台角色管理' },
    },
    {
      path: 'IMperson',
      component: () => import('@/views/authority/imPerson/index.vue'),
      name: 'IMperson',
      meta: { title: '前台用户管理' },
    },
    {
      path: 'adminPermission',
      component: () => import('@/views/authority/adminPermission/index.vue'),
      name: 'adminPermission',
      meta: { title: '后台权限管理' },
    },
    {
      path: 'adminRole',
      component: () => import('@/views/authority/adminRole/index.vue'),
      name: 'adminRole',
      meta: { title: '后台角色管理' },
    },
    {
      path: 'adminPerson',
      component: () => import('@/views/authority/adminPerson/index.vue'),
      name: 'adminPerson',
      meta: { title: '后台用户管理' },
    },
    {
      path: 'customDepartment',
      component: () => import('@/views/authority/customDepartment/index.vue'),
      name: 'customDepartment',
      meta: { title: '自定义组织管理' },
    },
  ],
};

export default authorityRouter;
