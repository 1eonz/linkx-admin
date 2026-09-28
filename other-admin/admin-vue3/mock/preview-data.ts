interface PreviewDataResult {
  handled: boolean;
  data?: unknown;
}

const roles = [
  {
    id: 'preview-role-admin',
    name: '系统管理员',
    status: 1,
    remark: '拥有后台管理权限',
    gmtCreated: '2026-01-12 09:30:00',
    iccPrivJson: [],
    adminPrivJson: ['preview-menu-admin'],
    cappPrivJson: [],
    orgPrivList: [{ id: 'dept-001', name: '市局指挥中心', code: '330100' }],
  },
  {
    id: 'preview-role-duty',
    name: '值班调度员',
    status: 1,
    remark: '负责值班与协同岗',
    gmtCreated: '2026-02-03 14:10:00',
    iccPrivJson: [],
    adminPrivJson: [],
    cappPrivJson: [],
    orgPrivList: [{ id: 'dept-002', name: '一线指挥部', code: '330101' }],
  },
  {
    id: 'preview-role-audit',
    name: '信息审核员',
    status: 0,
    remark: '只读审核权限',
    gmtCreated: '2026-03-19 11:45:00',
    iccPrivJson: [],
    adminPrivJson: [],
    cappPrivJson: [],
    orgPrivList: [],
  },
];

const people = [
  {
    id: 'preview-user-001',
    name: '张晨',
    idCard: 'MOCK-ID-001',
    phoneNum: '13800000001',
    departmentName: '市局指挥中心',
    departmentCode: '330100',
    status: 1,
  },
  {
    id: 'preview-user-002',
    name: '李宁',
    idCard: 'MOCK-ID-002',
    phoneNum: '13800000002',
    departmentName: '一线指挥部',
    departmentCode: '330101',
    status: 1,
  },
  {
    id: 'preview-user-003',
    name: '王敏',
    idCard: 'MOCK-ID-003',
    phoneNum: '13800000003',
    departmentName: '信息通信支队',
    departmentCode: '330102',
    status: 0,
  },
];

const departments = [
  {
    id: 'dept-001',
    code: '330100',
    name: '市局指挥中心',
    path: '浙江省/杭州市/市局指挥中心',
    children: [
      { id: 'dept-002', code: '330101', name: '一线指挥部', path: '浙江省/杭州市/一线指挥部', children: [] },
      { id: 'dept-003', code: '330102', name: '信息通信支队', path: '浙江省/杭州市/信息通信支队', children: [] },
    ],
  },
];

const dutyTypes = [
  { type: '0', name: '白班', gmtCreated: '2026-01-01 08:00:00' },
  { type: '1', name: '夜班', gmtCreated: '2026-01-01 08:00:00' },
  { type: '2', name: '机动班', gmtCreated: '2026-01-01 08:00:00' },
];

const collaborations = [
  {
    id: 'preview-post-001',
    postName: '应急指挥岗',
    iconUrl: '',
    type: 1,
    policeTicketTypes: [{ id: 'ticket-001', tag: '治安警情' }],
    ticketTypeNames: '治安警情',
    typeIds: ['ticket-001'],
    orgId: 'dept-001',
    orgName: '市局指挥中心',
    orgCode: '330100',
    relatedUserIds: ['preview-user-001', 'preview-user-002'],
    relatedUserNames: '张晨、李宁',
    operatorName: 'Mock管理员',
    source: 1,
    updateTime: '2026-09-25 10:30:00',
    createTime: '2026-01-10 09:00:00',
  },
  {
    id: 'preview-post-002',
    postName: '巡逻联络岗',
    iconUrl: '',
    type: 2,
    policeTicketTypes: [{ id: 'ticket-002', tag: '巡逻动态' }],
    ticketTypeNames: '巡逻动态',
    typeIds: ['ticket-002'],
    orgId: 'dept-002',
    orgName: '一线指挥部',
    orgCode: '330101',
    relatedUserIds: ['preview-user-003'],
    relatedUserNames: '王敏',
    operatorName: 'Mock管理员',
    source: 1,
    updateTime: '2026-09-24 16:20:00',
    createTime: '2026-02-15 13:15:00',
  },
];

const previewLabels = [
  {
    id: 'preview-label-001',
    name: '勤务标签',
    type: 1,
    scope: 1,
    icon: 'fas fa-bell',
    color: '#409eff',
    parentId: '0',
    level: 1,
    children: [
      { id: 'preview-label-002', name: '重点巡逻', type: 1, scope: 1, parentId: 'preview-label-001', level: 2 },
    ],
  },
  {
    id: 'preview-label-003',
    name: '协同标签',
    type: 2,
    scope: 2,
    icon: 'fas fa-users',
    color: '#67c23a',
    parentId: '0',
    level: 1,
    children: [],
  },
];

const schedules = [
  {
    id: 'preview-schedule-001',
    userId: 'preview-user-001',
    userName: '张晨',
    departmentName: '市局指挥中心',
    postName: '应急指挥岗',
    dutyType: '0',
    dutyTypeName: '白班',
    dutyStartDate: '2026-09-26',
    dutyStartTime: '08:00:00',
    dutyEndDate: '2026-09-26',
    dutyEndTime: '20:00:00',
    dutyContent: '指挥大厅值守',
    importUserName: 'Mock管理员',
  },
  {
    id: 'preview-schedule-002',
    userId: 'preview-user-002',
    userName: '李宁',
    departmentName: '一线指挥部',
    postName: '巡逻联络岗',
    dutyType: '1',
    dutyTypeName: '夜班',
    dutyStartDate: '2026-09-26',
    dutyStartTime: '20:00:00',
    dutyEndDate: '2026-09-27',
    dutyEndTime: '08:00:00',
    dutyContent: '夜间联动值守',
    importUserName: 'Mock管理员',
  },
];

export interface PreviewThirdApp {
  id: string;
  clientName: string;
  systemName: string;
  clientId: string;
  clientSecret: string;
  clientType: string;
  tokenTime: number;
  refreshTokenTime: number;
  status: number;
  expired: string;
  remark: string;
  grantTime: string;
  grantUserName: string;
  gmtCreated: string;
  gmtModified: string;
}

export const previewThirdApps: PreviewThirdApp[] = [
  {
    id: 'preview-client-001',
    clientName: '省级情报共享平台',
    systemName: '省级情报共享平台',
    clientId: 'client-preview-duty',
    clientSecret: 'prev-secret-001',
    clientType: '1',
    tokenTime: 24,
    refreshTokenTime: 7,
    status: 1,
    expired: '2027-12-31 23:59:59',
    remark: '用于市级协同数据共享的本地演示配置',
    grantTime: '2026-06-03 10:15:00',
    grantUserName: 'Mock管理员',
    gmtCreated: '2026-04-03 09:00:00',
    gmtModified: '2026-06-03 10:15:00',
  },
  {
    id: 'preview-client-002',
    clientName: '警情联动平台',
    systemName: '警情联动平台',
    clientId: 'client-preview-alert',
    clientSecret: 'prev-secret-002',
    clientType: '1',
    tokenTime: 12,
    refreshTokenTime: 3,
    status: 1,
    expired: '2027-08-20 18:00:00',
    remark: '用于接收警情联动信息',
    grantTime: '2026-05-18 15:30:00',
    grantUserName: 'Mock管理员',
    gmtCreated: '2026-02-18 14:20:00',
    gmtModified: '2026-05-18 15:30:00',
  },
  {
    id: 'preview-client-003',
    clientName: '城市视频资源中心',
    systemName: '城市视频资源中心',
    clientId: 'client-preview-video',
    clientSecret: 'prev-secret-003',
    clientType: '1',
    tokenTime: 8,
    refreshTokenTime: 2,
    status: 0,
    expired: '2026-12-31 23:59:59',
    remark: '演示停用状态、有效期和授权信息',
    grantTime: '2026-04-26 11:40:00',
    grantUserName: 'Mock值班员',
    gmtCreated: '2026-01-26 08:40:00',
    gmtModified: '2026-04-26 11:40:00',
  },
];

const sampleUserPage = (url: URL, body: unknown) => paginate(people, url, body);

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function positiveInteger(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function paginate(records: unknown[], url: URL, body: unknown): { records: unknown[]; total: number } {
  const input = asRecord(body);
  const pageNum = positiveInteger(
    url.searchParams.get('pageNum') ??
      url.searchParams.get('current') ??
      url.searchParams.get('page') ??
      input.pageNum ??
      input.current ??
      input.page,
    1,
  );
  const pageSize = positiveInteger(
    url.searchParams.get('pageSize') ?? url.searchParams.get('size') ?? input.pageSize ?? input.size,
    records.length || 10,
  );
  const start = (pageNum - 1) * pageSize;
  return { records: records.slice(start, start + pageSize), total: records.length };
}

function handled(data: unknown): PreviewDataResult {
  return { handled: true, data: structuredClone(data) };
}

/** 返回依据 Vue3 API 类型整理的本地只读样例；没有配置的接口继续由预览服务返回 501。 */
export function getPreviewData(method: string, path: string, url: URL, body: unknown): PreviewDataResult {
  const readMethod = method === 'GET' || method === 'POST';

  if (method === 'POST' && path === '/api/globals/list') {
    return handled([
      { id: 'preview-global-001', name: 'DUTY_SCHEDULE_ENABLE', value: '1', remark: '开放排班信息菜单', status: 1 },
      { id: 'preview-global-002', name: 'EDGEGATEWAY_BREAKER', value: '1', remark: '边缘网关功能开关', status: 1 },
      { id: 'preview-global-003', name: 'CAR_BREAKER', value: '1', remark: '车辆功能开关', status: 1 },
      { id: 'preview-global-004', name: 'CUSTOMIZED_LAYER', value: '1', remark: '自定义图层开关', status: 1 },
    ]);
  }
  if (method === 'POST' && path === '/base/v1/globals/getGlobalsList') {
    return handled({
      SYSTEM_NAME: 'LinkX 本地预览',
      ALLOW_SIMPLE_PASSWORD: '1',
      DEPARTMENT_SYNC_SIGN: '0',
      DUTY_SCHEDULE_ENABLE: '1',
      EDGEGATEWAY_BREAKER: '1',
      CAR_BREAKER: '1',
      CUSTOMIZED_LAYER: '1',
      SUPERSET_SERVER_URL: '',
      SUPERSET_SERVER_URL_HTTP: '',
      CONFIG_DEVICE_GB: 'preview-device',
    });
  }
  if (path === '/api/role' && method === 'GET') return handled(paginate(roles, url, body));
  if (path === '/auth/v1/user/page' && method === 'GET') return handled(sampleUserPage(url, body));
  if (path === '/auth/v1/user/adminuser/page' && method === 'GET') {
    return handled(
      paginate(
        [
          {
            id: 'preview-admin-001',
            idCard: 'admin.preview',
            status: 0,
            gmtCreated: '2026-01-12 09:30:00',
            orgIds: ['dept-001'],
            orgList: [{ id: 'dept-001', name: '市局指挥中心' }],
          },
          {
            id: 'preview-admin-002',
            idCard: 'duty.preview',
            status: 0,
            gmtCreated: '2026-02-03 14:10:00',
            orgIds: ['dept-002'],
            orgList: [{ id: 'dept-002', name: '一线指挥部' }],
          },
        ],
        url,
        body,
      ),
    );
  }
  if (path === '/auth/v1/custom-department/tree' && readMethod) return handled(departments);
  if (path === '/auth/v1/custom-department/node' && readMethod) {
    return handled([
      {
        id: 'node-001',
        orgId: 'dept-001',
        parentId: 'dept-001',
        code: '330101',
        name: '一线指挥部',
        path: '市局指挥中心/一线指挥部',
        sort: 1,
      },
      {
        id: 'node-002',
        orgId: 'dept-001',
        parentId: 'dept-001',
        code: '330102',
        name: '信息通信支队',
        path: '市局指挥中心/信息通信支队',
        sort: 2,
      },
    ]);
  }
  if (path.startsWith('/auth/v1/custom-department/node/') && path.endsWith('/user') && method === 'GET') {
    return handled(paginate(people, url, body));
  }
  if (path.startsWith('/auth/v1/custom-department/node/') && path.endsWith('/available-user') && method === 'GET') {
    return handled(paginate(people, url, body));
  }

  if (path.startsWith('/api/map/') && method === 'POST') {
    if (path === '/api/map/selectPageMap') {
      return handled(
        paginate(
          [
            {
              id: 'preview-map-001',
              name: '市区基础地图',
              mapType: 'AMap',
              type: 0,
              activation: 1,
              configuration: '{"center":[120.1551,30.2741],"zoom":11}',
              gmtCreated: '2026-04-12 10:00:00',
            },
            {
              id: 'preview-map-002',
              name: '应急专题地图',
              mapType: 'Arcgis',
              type: 1,
              activation: 0,
              configuration: '{"layer":"emergency"}',
              gmtCreated: '2026-05-18 15:30:00',
            },
          ],
          url,
          body,
        ),
      );
    }
    if (path === '/api/map/selectPageBaseMap') {
      return handled(
        paginate(
          [
            {
              id: 'preview-basemap-001',
              name: '市区矢量底图',
              size: '18.6 MB',
              created: '2026-06-02 09:00:00',
              tiles: '/mock/tiles/city/{z}/{x}/{y}.png',
            },
            {
              id: 'preview-basemap-002',
              name: '应急专题底图',
              size: '32.1 MB',
              created: '2026-06-18 13:40:00',
              tiles: '/mock/tiles/emergency/{z}/{x}/{y}.png',
            },
          ],
          url,
          body,
        ),
      );
    }
    if (path === '/api/map/selectListGeo') {
      const type = asRecord(body).type;
      const options =
        type === 'inversecode' ? ['高德逆地理编码'] : type === 'poi' ? ['高德地点检索'] : ['高德地理编码'];
      return handled(options);
    }
    if (path === '/api/map/selectGeo')
      return handled({ geocode: '高德地理编码', inversecode: '高德逆地理编码', poi: '高德地点检索' });
    if (path === '/api/map/selectDivision') return handled({ name: '浙江省杭州市' });
  }

  if (path === '/api/layout/app/sections' && method === 'GET') {
    return handled([
      {
        id: 'preview-section-001',
        name: '常用应用',
        type: 2,
        show: 1,
        sort: 1,
        custom: '[{"name":"值班台","url":"/duty"}]',
        gmtCreated: '2026-04-10 08:30:00',
      },
      {
        id: 'preview-section-002',
        name: '协同群组',
        type: 3,
        show: 1,
        sort: 2,
        custom: '{"buttons":[{"type":1,"name":"创建群组","enable":"true"}]}',
        gmtCreated: '2026-04-10 08:35:00',
      },
      {
        id: 'preview-section-003',
        name: '消息列表',
        type: 6,
        show: 0,
        sort: 3,
        custom: '',
        gmtCreated: '2026-04-10 08:40:00',
      },
    ]);
  }
  if (path === '/api/system/config' && method === 'GET') {
    return handled([
      { id: 'preview-config-001', key: 'SYSTEM_NAME', value: 'LinkX 本地预览' },
      { id: 'preview-config-002', key: 'APP_H5_CONFIG', value: '{"showBanner":true}' },
      {
        id: 'preview-config-003',
        key: 'PC_NAV_CUSTOM',
        value: '[{"name":"值班工作台","url":"/workbench","order":1,"openWay":0}]',
      },
    ]);
  }

  if (path === '/collaboration/v1/client/list' && method === 'POST') {
    const keyword = String(asRecord(body).clientName ?? asRecord(body).systemName ?? '').trim();
    const filtered = previewThirdApps.filter(
      (item) => !keyword || item.clientName.includes(keyword) || item.systemName.includes(keyword),
    );
    return handled(paginate(filtered, url, body));
  }

  if (path === '/collaboration/v1/post/page' && method === 'GET') return handled(paginate(collaborations, url, body));
  if (path === '/collaboration/v1/post/queryUserByIdCard' && method === 'GET') {
    return handled({
      userDepartments: [{ departmentId: 'dept-001', departmentCode: '330100', departmentName: '市局指挥中心' }],
    });
  }
  if (path === '/collaboration/v1/post/queryDepartment' && method === 'GET') return handled(departments);
  if (path === '/collaboration/v1/organization/tree' && method === 'GET') return handled(departments[0]);
  if (path === '/collaboration/v1/post/queryUserByPage' && method === 'GET') {
    return handled(
      paginate(
        people.map((person) => ({
          ...person,
          code: person.id,
          mobile: person.phoneNum,
          isBinding: 1,
          userDepartments: [{ id: 'dept-001', departmentCode: '330100', departmentName: person.departmentName }],
        })),
        url,
        body,
      ),
    );
  }
  if (path === '/collaboration/v1/post/queryUser' && method === 'GET') return handled(people);
  if (path === '/collaboration/v1/im/users/tree' && method === 'GET') return handled(departments);
  if (path === '/auth/v1/role/byUserId' && method === 'GET')
    return handled([{ id: 'preview-role-duty', name: '值班调度员' }]);
  if (path === '/collaboration/v1/post/queryByName' && method === 'GET') return handled(false);
  if (path === '/collaboration/v1/post/syncPostFromIm' && method === 'GET') return handled(true);
  if (path === '/collaboration/v1/post/getImSyncStatus' && method === 'GET') return handled(true);
  if (path === '/collaboration/v1/post/getProcess' && method === 'GET') return handled(true);
  if (path === '/collaboration/v1/post/log/page' && method === 'GET') {
    return handled(
      paginate(
        [
          {
            id: 'preview-log-001',
            postName: '应急指挥岗',
            orgName: '市局指挥中心',
            relatedUserNames: '张晨、李宁',
            operatorName: 'Mock管理员',
            operationType: 1,
            operationTypeName: '编辑',
            content: '调整在岗人员',
            operateTime: '2026-09-25 10:30:00',
          },
        ],
        url,
        body,
      ),
    );
  }
  if (path === '/collaboration/v1/attendance/page' && method === 'GET') {
    return handled(
      paginate(
        [
          {
            id: 'preview-attendance-001',
            postName: '应急指挥岗',
            orgName: '市局指挥中心',
            personName: '张晨',
            relatedUserNames: '张晨、李宁',
            type: 1,
            lastPeopleNum: 2,
            lastPeople: '张晨、李宁',
            switchType: 1,
            createTime: '2026-09-26 08:00:00',
          },
        ],
        url,
        body,
      ),
    );
  }
  if (path === '/collaboration/v1/attendance/getOnline' && method === 'GET') {
    return handled([
      {
        id: 'preview-duty-user-001',
        userId: 'preview-user-001',
        name: '张晨',
        idCard: 'MOCK-ID-001',
        departmentName: '市局指挥中心',
        departmentCode: '330100',
      },
    ]);
  }
  if (path === '/collaboration/v1/attendance/getLastNum' && method === 'GET') return handled({ lastPeopleNum: 2 });
  if (path === '/collaboration/v1/label/list' && method === 'GET') return handled(previewLabels);
  if (/^\/collaboration\/v1\/functionaldepts\/[^/]+\/children$/.test(path) && method === 'GET') {
    return handled([
      { id: 'preview-function-001', name: '应急处置', type: 1, children: [] },
      { id: 'preview-function-002', name: '巡逻联动', type: 2, children: [] },
    ]);
  }
  if (/^\/collaboration\/v1\/functionaldepts\/[^/]+\/coop$/.test(path) && method === 'GET') {
    return handled({ records: collaborations, total: collaborations.length });
  }
  if (path === '/collaboration/v1/functionaldepts/default/coop/page' && method === 'GET') {
    return handled({
      records: [
        { id: 'preview-default-coop-001', postId: 'preview-post-001', postName: '应急指挥岗', orgName: '市局指挥中心' },
      ],
      total: 1,
    });
  }

  if (path === '/api/content/carousel/page' && method === 'GET') {
    return handled(
      paginate(
        [
          {
            id: 'preview-carousel-001',
            title: '应急值守安排',
            pciUrl: '/mock/images/duty-banner.svg',
            officialAccountId: 'preview-account-001',
            officialAccountName: '杭州警务',
            articleId: 'preview-article-001',
            url: '/news/duty',
            sort: 1,
          },
          {
            id: 'preview-carousel-002',
            title: '平安巡防提示',
            pciUrl: '/mock/images/patrol-banner.svg',
            officialAccountId: 'preview-account-001',
            officialAccountName: '杭州警务',
            articleId: 'preview-article-002',
            url: '/news/patrol',
            sort: 2,
          },
        ],
        url,
        body,
      ),
    );
  }
  if (path === '/collaboration/v1/post/officialAccounts/page' && method === 'GET') {
    return handled(
      paginate(
        [
          { id: 'preview-account-001', name: '杭州警务' },
          { id: 'preview-account-002', name: '平安杭州' },
        ],
        url,
        body,
      ),
    );
  }
  if (path === '/collaboration/v1/post/articles/page' && method === 'GET') {
    return handled(
      paginate(
        [
          { id: 'preview-article-001', title: '应急值守安排', contentUrl: '/mock/articles/duty' },
          { id: 'preview-article-002', title: '平安巡防提示', contentUrl: '/mock/articles/patrol' },
        ],
        url,
        body,
      ),
    );
  }
  if (path === '/collaboration/v1/groups/archive/list' && method === 'GET') {
    return handled(
      paginate(
        [
          {
            groupId: 'preview-group-001',
            groupName: '市局应急联动群',
            tagName: '应急处置',
            taskName: '防汛巡查',
            departmentName: '市局指挥中心',
            archiveUserName: 'Mock管理员',
            archivedFile: '2026/09/应急联动群.zip',
            archivedTime: '2026-09-20 18:30:00',
          },
          {
            groupId: 'preview-group-002',
            groupName: '夜间巡防工作群',
            tagName: '巡逻动态',
            taskName: '夜间巡防',
            departmentName: '一线指挥部',
            archiveUserName: 'Mock管理员',
            archivedFile: '2026/09/夜间巡防群.zip',
            archivedTime: '2026-09-18 21:15:00',
          },
        ],
        url,
        body,
      ),
    );
  }

  if (path === '/collaboration/v1/dept/location/list' && method === 'GET') {
    return handled([
      {
        id: 'preview-location-001',
        departmentCode: '330100',
        departmentName: '市局指挥中心',
        location: '120.1551,30.2741',
      },
      {
        id: 'preview-location-002',
        departmentCode: '330101',
        departmentName: '一线指挥部',
        location: '120.2058,30.2456',
      },
    ]);
  }
  if (path === '/collaboration/v1/duty/type/page' && method === 'GET') return handled(paginate(dutyTypes, url, body));
  if (path === '/collaboration/v1/duty/type/all' && method === 'GET') return handled(dutyTypes);
  if (path === '/collaboration/v1/duty/schedule/page' && method === 'GET')
    return handled(paginate(schedules, url, body));
  if (path === '/collaboration/v1/duty/schedule/calendar' && method === 'GET') {
    return handled({ '2026-09-26': schedules, '2026-09-27': [schedules[1]] });
  }

  if (path === '/api/warning/ralation/page' && method === 'GET') {
    return handled(
      paginate(
        [
          {
            id: 'preview-warning-001',
            businessId: 'dept-001',
            businessName: '市局指挥中心',
            orgName: '市局指挥中心',
            targetType: 1,
            targetId: 'preview-user-001',
            targetName: '张晨',
            idCard: 'MOCK-ID-001',
          },
          {
            id: 'preview-warning-002',
            businessId: 'preview-post-002',
            businessName: '巡逻联络岗',
            orgName: '一线指挥部',
            targetType: 2,
            targetId: 'preview-group-001',
            targetName: '夜间巡防工作群',
            idCard: '',
          },
        ],
        url,
        body,
      ),
    );
  }
  if (path === '/collaboration/v1/im/queryUser' && method === 'GET') {
    return handled(
      paginate(
        people.map(({ id, name, idCard }) => ({ id, name, idCard })),
        url,
        body,
      ),
    );
  }
  if (path === '/collaboration/v1/im/query/group/type' && method === 'GET') {
    return handled(
      paginate(
        [
          { groupId: 'preview-group-001', groupName: '市局应急联动群' },
          { groupId: 'preview-group-002', groupName: '夜间巡防工作群' },
        ],
        url,
        body,
      ),
    );
  }
  if (path === '/collaboration/v1/im/users/virtual' && method === 'GET') {
    return handled([
      {
        id: 'preview-virtual-001',
        userName: '应急值守账号',
        contactNumber: '13800000011',
        appId: 'preview-app-001',
        appSecret: 'preview-virtual-secret',
        defaultUser: 1,
        remark: '本地样例',
        createdAt: '2026-06-01 08:00:00',
        createdBy: '1',
      },
    ]);
  }

  if (path === '/api/content/app/info/page' && method === 'GET') {
    return handled(
      paginate(
        [
          {
            id: 'preview-app-001',
            name: '警务协同 H5',
            type: 1,
            url: 'http://127.0.0.1:30847/mock/h5',
            scope: [1],
            scopeList: [{ id: 1, name: '市局指挥中心' }],
            zone: 1,
            sort: 1,
            status: 0,
            official: 1,
            createTime: '2026-04-10 10:00:00',
          },
          {
            id: 'preview-app-002',
            name: '勤务移动端',
            type: 0,
            packageAndroid: '/mock/apps/duty.apk',
            activity: 'com.linkx.duty.MainActivity',
            scope: [1, 2],
            zone: 2,
            sort: 2,
            status: 1,
            official: 0,
            createTime: '2026-05-02 11:20:00',
          },
        ],
        url,
        body,
      ),
    );
  }
  if (path === '/api/content/app/info/prerequisite' && method === 'GET')
    return handled([{ id: 'preview-app-parent', name: '基础工作台' }]);
  if (path === '/third/v1/apps/groups' && method === 'GET') {
    return handled([
      {
        id: 'preview-app-group-001',
        name: '指挥调度',
        sort: 1,
        appIds: ['preview-app-001'],
        appList: [],
        type: 1,
        createUser: 'Mock管理员',
      },
      {
        id: 'preview-app-group-002',
        name: '日常应用',
        sort: 2,
        appIds: ['preview-app-002'],
        appList: [],
        type: 2,
        createUser: 'Mock管理员',
      },
    ]);
  }
  if (path === '/third/v1/app/callable' && method === 'GET') {
    return handled(
      paginate(
        [
          {
            id: 'preview-callable-001',
            name: '警情查询服务',
            systemName: '警情平台',
            systemCode: 'ALERT',
            uniqueId: 'alert.query',
            type: 1,
            scope: 1,
            protocol: 'https',
            ip: '127.0.0.1',
            port: 443,
            uri: '/mock/alerts',
            method: 'GET',
            pagenation: 0,
            gmtCreated: '2026-05-14 09:15:00',
          },
          {
            id: 'preview-callable-002',
            name: '重点人员库',
            systemName: '综合信息平台',
            systemCode: 'INFO',
            uniqueId: 'person.list',
            type: 2,
            scope: 2,
            databaseName: 'preview_db',
            dbType: 'PostgreSQL',
            account: 'preview_readonly',
            period: '5m',
            gmtCreated: '2026-06-08 16:00:00',
          },
        ],
        url,
        body,
      ),
    );
  }

  if (path === '/collaboration/v1/poltclients/page' && method === 'GET') {
    return handled(
      paginate(
        [
          {
            id: 'preview-dock-001',
            name: '警情接入服务',
            systemName: '警情平台',
            systemCode: 'ALERT',
            schema: 'https',
            ip: '127.0.0.1',
            port: 8443,
            path: '/mock/police/tickets',
            method: 'POST',
            headers: '{}',
            body: '{}',
            params: '{}',
            script: '',
            executePeriod: 60000,
            status: 1,
            gmtCreated: '2026-05-10 09:00:00',
          },
        ],
        url,
        body,
      ),
    );
  }
  if (path === '/collaboration/v1/policeticket/page' && method === 'GET') {
    return handled(
      paginate(
        [
          {
            id: 'preview-ticket-001',
            code: 'MOCK-20260926-001',
            name: '道路积水巡查',
            content: '巡查发现道路积水，已通知属地处置。',
            tag: '防汛',
            source: '警情平台',
            createTime: '2026-09-26 09:20:00',
            origin: 'MOCK',
          },
        ],
        url,
        body,
      ),
    );
  }
  if (path === '/collaboration/v1/policetickettype/page' && method === 'GET') {
    return handled(
      paginate(
        [
          { id: 'preview-ticket-type-001', tag: '治安警情', gmtCreated: '2026-01-10 09:00:00' },
          { id: 'preview-ticket-type-002', tag: '防汛巡查', gmtCreated: '2026-02-20 10:30:00' },
        ],
        url,
        body,
      ),
    );
  }
  if (path === '/collaboration/v1/policeticket/types' && method === 'GET')
    return handled([
      { id: 'preview-ticket-type-001', tag: '治安警情' },
      { id: 'preview-ticket-type-002', tag: '防汛巡查' },
    ]);
  if (path === '/collaboration/v1/policetickettype/list' && method === 'GET')
    return handled([
      { id: 'ticket-001', tag: '治安警情' },
      { id: 'ticket-002', tag: '巡逻动态' },
    ]);

  if (path === '/api/icp/server/config' && method === 'GET') {
    return handled({
      id: 'preview-icp-config-001',
      protocol: 2,
      ip: '127.0.0.1',
      port: 9443,
      wssUrl: 'wss://127.0.0.1:9443/mock',
      username: 'preview-user',
      password: 'preview-password',
      departmentId: 'dept-001',
      departmentName: '市局指挥中心',
      cameraLevelId: 'camera-level-001',
      cameraLevelName: '市区摄像头',
      environment: 0,
      status: 1,
      remark: '本地预览数据',
    });
  }
  if (path === '/proxy/icp/v1/camera-level/tree/select' || path === '/proxy/icp/v1/camera-level/tree') {
    return handled([
      {
        id: 'camera-level-001',
        label: '市区摄像头',
        children: [{ id: 'camera-level-002', label: '中心城区', parentId: 'camera-level-001' }],
      },
    ]);
  }
  if (path === '/proxy/icp/v1/department/tree/select' || path === '/proxy/icp/v1/department/tree')
    return handled(
      departments.map((item) => ({
        id: item.id,
        label: item.name,
        children: item.children.map((child) => ({ id: child.id, label: child.name, parentId: item.id })),
      })),
    );
  if (path === '/auth/v1/user/page/dept' && method === 'GET')
    return handled(
      paginate(
        people.map(({ id, name, idCard, departmentName, departmentCode }) => ({
          id,
          name,
          idCard,
          departmentName,
          departmentCode,
          directLeaderName: '值班负责人',
          directLeaderId: 'preview-user-001',
        })),
        url,
        body,
      ),
    );
  if (path === '/proxy/icp/v1/isdnType/list' && method === 'GET') {
    return handled([
      { id: 'device-type-001', name: '执法记录仪', type: 'camera', isShow: 1, icon: '' },
      { id: 'device-type-002', name: '移动终端', type: 'mobile', isShow: 1, icon: '' },
    ]);
  }
  if (/^\/proxy\/icp\/v1\/(camera|imuser)\/priv(\/dept)?\/[^/]+$/.test(path)) return handled([]);

  if (path === '/api/globals/ai/deploy' && method === 'GET')
    return handled({ separatedDeploy: false, groupAiHost: 'http://127.0.0.1:30847/mock/ai', groupAiFrontendHost: '' });
  if (path === '/XA-ics-agent/proxy/ai/v1/aiagent/management/settings' && method === 'GET')
    return handled({ approvalEnabled: true, approvalSubMode: 0, approvalSystemUrl: '' });
  if (path === '/XA-ics-agent/proxy/ai/v1/aiagent/management/page' && method === 'GET') {
    return handled(
      paginate(
        [
          {
            id: 'preview-agent-001',
            name: '勤务问答助手',
            desc: '回答值班、巡逻和应急流程问题',
            avatarUrl: '',
            url: 'http://127.0.0.1:30847/mock/ai/assistant',
            token: 'preview-agent-token',
            httpMethod: 'POST',
            priority: 0,
            categoryIds: ['preview-agent-category-001'],
            categoryName: '勤务服务',
            isRestricted: 0,
            audio: 0,
            video: 0,
            image: 1,
            document: 1,
            virtualUserId: 'preview-virtual-001',
          },
        ],
        url,
        body,
      ),
    );
  }
  if (path === '/XA-ics-agent/proxy/ai/v1/aiagent/management/category/list' && method === 'GET')
    return handled([
      { id: 'preview-agent-category-001', name: '勤务服务' },
      { id: 'preview-agent-category-002', name: '警情研判' },
    ]);
  if (path === '/collaboration/v1/ai/assistant/agent/page' && method === 'GET') {
    return handled(
      paginate(
        [
          {
            id: 'preview-agent-binding-001',
            agentId: 'preview-agent-001',
            virtualUserId: 'preview-virtual-001',
            createdUserId: '1',
          },
        ],
        url,
        body,
      ),
    );
  }
  if (path === '/XA-ics-agent/proxy/ai/v1/aiagent/management/record' && method === 'GET') {
    return handled(
      paginate(
        [
          {
            id: 'preview-agent-record-001',
            userName: '张晨',
            identityCardNumber: 'MOCK-ID-001',
            agentName: '勤务问答助手',
            departmentName: '市局指挥中心',
            queryContent: '夜班交接需要填写哪些内容？',
            time: '2026-09-26 08:10:00',
            responseContent: '请记录在岗人员、未结警情和设备状态。',
          },
        ],
        url,
        body,
      ),
    );
  }
  if (path === '/XA-ics-agent/proxy/ai/v1/aiagent/attachment-config/list' && method === 'GET') {
    return handled([
      {
        id: 'preview-agent-file-001',
        name: '文件解析服务',
        method: 'POST',
        ip: '127.0.0.1',
        port: 8080,
        uri: '/mock/files/parse',
        header: '{}',
        query: '{}',
        body: '{}',
        reponseFileFiled: 'fileUrl',
        desc: '本地样例接口',
      },
    ]);
  }

  if (path === '/node/v1/p2p/servers' && method === 'GET') {
    return handled(
      paginate(
        [
          {
            id: 'preview-server-001',
            peerId: 'preview-peer-001',
            ip: '127.0.0.1',
            port: 30017,
            name: '市局主节点',
            tag: 'main',
            remark: '本地预览节点',
            createUserName: 'Mock管理员',
            gmtCreated: '2026-04-02 10:00:00',
            status: 1,
            statusDesc: '连接正常',
          },
          {
            id: 'preview-server-002',
            peerId: 'preview-peer-002',
            ip: '127.0.0.2',
            port: 30017,
            name: '演示备节点',
            tag: 'backup',
            remark: 'Mock 数据',
            createUserName: 'Mock管理员',
            gmtCreated: '2026-05-10 16:30:00',
            status: 2,
            statusDesc: '等待连接',
          },
        ],
        url,
        body,
      ),
    );
  }
  if (path === '/node/v1/p2p/clients' && method === 'GET') {
    return handled(
      paginate(
        [
          {
            id: 'preview-client-node-001',
            peerId: 'preview-client-peer-001',
            ip: '127.0.0.3',
            port: 30017,
            name: '应急指挥客户端',
            tag: 'dispatch',
            remark: '本地客户端样例',
            grant: 1,
            expired: false,
            grantUserName: 'Mock管理员',
            grantTime: '2026-06-10 09:00:00',
            expiredIn: 1798761600000,
            status: 1,
            statusDesc: '连接正常',
            lastSeen: '2026-09-26 10:20:00',
            gmtCreated: '2026-06-10 08:30:00',
          },
        ],
        url,
        body,
      ),
    );
  }
  if (/^\/node\/v1\/p2p\/servers\/[^/]+\/opendata\/grant$/.test(path) && method === 'GET')
    return handled({ users: 1, groups: 1, msg: 1, h5: 1, agent: 0, coopUser: 1 });
  if (/^\/node\/v1\/p2p\/[^/]+\/opendata\/statistic$/.test(path) && method === 'GET')
    return handled({
      users: { coopUserCount: 36 },
      groups: { coopGroupCount: 12, normalGroupCount: 28 },
      msg: { coopMsg: 320 },
      h5: { count: 18 },
      agent: { count: 4 },
    });
  if (/^\/node\/v1\/p2p\/[^/]+\/opendata\/coop\/search$/.test(path) && method === 'GET')
    return handled(
      collaborations.map(({ id, postName, orgName, relatedUserNames, relatedUserIds, iconUrl }) => ({
        id,
        postName,
        orgName,
        relatedUserNames,
        relatedUserIds,
        iconUrl,
      })),
    );

  if (path === '/api/globals/ai/deploy' || path.startsWith('/XA-ics-agent/') || path.startsWith('/proxy/icp/')) {
    return { handled: false };
  }
  if (path === '/collaboration/v1/tags/page') return { handled: false };
  if (path === '/api/globals/list' || path === '/base/v1/globals/getGlobalsList') return { handled: false };

  return { handled: false };
}
