import type { ApiResponse } from '#/axios';
import type { MenuItem } from '#/menu';
import http from '@/utils/http';

// TODO: 接口可用后删除 mock 分支，恢复真实请求
const MOCK_MENU_DATA: ApiResponse<MenuItem[]> = {
  code: 0,
  msg: '操作成功',
  data: [
    {
      id: '1394906601265037312',
      name: '首页',
      parentId: '-1',
      applicationId: '1289822833455460000',
      url: 'Dashboard',
      imgurl: '',
      isleaf: 1,
      level: 1,
      sort: 2,
      status: 1,
      gmtCreated: '2021-05-19 14:43:44',
      gmtModified: '2021-07-23 14:42:21',
      children: null,
    },
    {
      id: '1522392406668869811',
      name: '权限中心',
      parentId: '-1',
      applicationId: '1289822833455460000',
      url: '/authority',
      imgurl: '',
      isleaf: 1,
      level: 1,
      sort: 7,
      status: 1,
      gmtCreated: '2025-11-21 02:29:58',
      gmtModified: '2025-11-21 02:29:58',
      children: [
        {
          id: '1394908359697629184',
          name: '角色管理',
          parentId: '1522392406668869811',
          applicationId: '1289822833455460000',
          url: 'role',
          imgurl: '',
          isleaf: 1,
          level: 2,
          sort: 2,
          status: 1,
          gmtCreated: '2021-05-19 14:50:43',
          gmtModified: '2021-07-23 14:41:41',
          children: null,
        },
        {
          id: '1522392406668869812',
          name: '权限管理',
          parentId: '1522392406668869811',
          applicationId: '1289822833455460000',
          url: 'person',
          imgurl: '',
          isleaf: 1,
          level: 2,
          sort: 2,
          status: 1,
          gmtCreated: '2025-11-21 02:29:58',
          gmtModified: '2025-11-21 02:29:58',
          children: null,
        },
      ],
    },
  ],
};

/**
 * 获取 OAuth 菜单列表
 * 当前使用 mock 数据，接口可用后切换回真实请求
 * GET linkx/oauth/v1/menu/list
 */
export function getOauthMenuList(): Promise<ApiResponse<MenuItem[]>> {
  // TODO: 接口可用后，删除 mock 分支，恢复下方真实请求
  // return http.get('/linkx/oauth/v1/menu/list');
  return Promise.resolve(MOCK_MENU_DATA);
}
