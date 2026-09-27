export interface PreviewMenuItem {
  id: string;
  name: string;
  parentId: string;
  applicationId: string;
  url: string;
  imgurl?: string;
  isleaf: 0 | 1;
  level: 1 | 2;
  sort: number;
  status: 1;
  children?: PreviewMenuItem[];
}

interface PreviewMenuModule {
  url: string;
  name: string;
  icon: string;
  children: Array<[string, string]>;
}

const menuModules: PreviewMenuModule[] = [
  {
    url: '/baseData',
    name: '系统配置',
    icon: 'component',
    children: [
      ['thirdParty', '三方接入管理'],
      ['globals', '全局参数配置'],
      ['mapConfig', '地图配置'],
      ['layoutConfig', '布局配置'],
    ],
  },
  {
    url: '/authority',
    name: '权限中心',
    icon: 'password',
    children: [
      ['role', '角色管理'],
      ['person', '权限管理'],
      ['userManage', '用户管理'],
      ['IMPermission', '前台权限管理'],
      ['IMrole', '前台角色管理'],
      ['IMperson', '前台用户管理'],
      ['adminPermission', '后台权限管理'],
      ['adminRole', '后台角色管理'],
      ['adminPerson', '后台用户管理'],
      ['customDepartment', '自定义组织管理'],
    ],
  },
  {
    url: '/collaboration',
    name: '协同岗管理',
    icon: 'chat',
    children: [
      ['index', '协同岗管理'],
      ['quick', '标签管理'],
    ],
  },
  {
    url: '/h5',
    name: 'H5管理',
    icon: 'mobile',
    children: [
      ['carousel', '轮播图管理'],
      ['GroupTags', '群组标签管理'],
    ],
  },
  {
    url: '/location',
    name: '位置管理',
    icon: 'map',
    children: [['location', '位置信息']],
  },
  {
    url: '/scheduling',
    name: '排班管理',
    icon: 'document',
    children: [
      ['dutyType', '排班类型管理'],
      ['dutyInformation', '排班信息'],
    ],
  },
  {
    url: '/notification',
    name: '预警管理',
    icon: 'bell',
    children: [['alertPush', '预警推送']],
  },
  {
    url: '/policeExtend',
    name: '警信扩展信息管理',
    icon: 'user',
    children: [
      ['virtualUser', '虚拟用户管理'],
      ['ArchivedTable', '已归档群组管理'],
    ],
  },
  {
    url: '/thirdParty',
    name: '三方对接',
    icon: 'connection',
    children: [
      ['app', '应用管理'],
      ['southInterface', '南向对接'],
      ['policeReport', '警单平台'],
      ['unifiedComm', '通信服务管理'],
      ['agentInterface', 'AI智能体对接（南向）'],
      ['thirdParty', '北向接入管理'],
    ],
  },
  {
    url: '/nodeManage',
    name: '多节点管理',
    icon: 'monitor',
    children: [
      ['nodeManagement', '节点管理'],
      ['dataManage', '数据管理'],
    ],
  },
];

const routeModuleOrder = [
  '/baseData',
  '/h5',
  '/collaboration',
  '/authority',
  '/location',
  '/scheduling',
  '/notification',
  '/policeExtend',
  '/thirdParty',
  '/nodeManage',
];

export const previewMenu: PreviewMenuItem[] = [...menuModules]
  .sort((left, right) => routeModuleOrder.indexOf(left.url) - routeModuleOrder.indexOf(right.url))
  .map((module, parentIndex): PreviewMenuItem => {
    const parentId = `parent-${parentIndex}`;
    return {
      id: parentId,
      name: module.name,
      parentId: '0',
      applicationId: '',
      url: module.url,
      imgurl: module.icon,
      isleaf: 0,
      level: 1,
      sort: parentIndex + 1,
      status: 1,
      children: module.children.map(([path, name], childIndex): PreviewMenuItem => ({
        id: `${module.url}-${path}`,
        name,
        parentId,
        applicationId: '',
        url: `${module.url}/${path}`,
        isleaf: 1,
        level: 2,
        sort: childIndex + 1,
        status: 1,
      })),
    };
  });

export const previewMenuPermissions = previewMenu.flatMap((parent) => [
  parent.id,
  ...(parent.children ?? []).map((child) => child.id),
]);

export function getLimitedPreviewMenuPermissions(): string[] {
  const h5Menu = previewMenu.find((item) => item.url === '/h5');
  const carouselMenu = h5Menu?.children?.find((item) => item.url === '/h5/carousel');
  return [h5Menu?.id, carouselMenu?.id].filter((id): id is string => Boolean(id));
}
