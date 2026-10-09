// vite.config.mts
import { defineConfig, loadEnv } from "file:///F:/work/linkx-admin/other-admin/admin-vue3/node_modules/.pnpm/vite@5.4.21_@types+node@22._d74da79db4b8ed347bd3be58ea4fbf05/node_modules/vite/dist/node/index.js";
import vue from "file:///F:/work/linkx-admin/other-admin/admin-vue3/node_modules/.pnpm/@vitejs+plugin-vue@5.2.4_vi_0be5959bcaf9b4d0f037075a90aef4f1/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import AutoImport from "file:///F:/work/linkx-admin/other-admin/admin-vue3/node_modules/.pnpm/unplugin-auto-import@0.18.6_1fcbb0b1c12cab55e169d7711e6fe090/node_modules/unplugin-auto-import/dist/vite.js";
import Components from "file:///F:/work/linkx-admin/other-admin/admin-vue3/node_modules/.pnpm/unplugin-vue-components@0.2_62af18b96370af8a88a4989f943f66cd/node_modules/unplugin-vue-components/dist/vite.js";
import { ElementPlusResolver } from "file:///F:/work/linkx-admin/other-admin/admin-vue3/node_modules/.pnpm/unplugin-vue-components@0.2_62af18b96370af8a88a4989f943f66cd/node_modules/unplugin-vue-components/dist/resolvers.js";
import { resolve } from "node:path";

// mock/preview-data.ts
var roles = [
  {
    id: "preview-role-admin",
    name: "\u7CFB\u7EDF\u7BA1\u7406\u5458",
    status: 1,
    remark: "\u62E5\u6709\u540E\u53F0\u7BA1\u7406\u6743\u9650",
    gmtCreated: "2026-01-12 09:30:00",
    iccPrivJson: [],
    adminPrivJson: ["preview-menu-admin"],
    cappPrivJson: [],
    orgPrivList: [{ id: "dept-001", name: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3", code: "330100" }]
  },
  {
    id: "preview-role-duty",
    name: "\u503C\u73ED\u8C03\u5EA6\u5458",
    status: 1,
    remark: "\u8D1F\u8D23\u503C\u73ED\u4E0E\u534F\u540C\u5C97",
    gmtCreated: "2026-02-03 14:10:00",
    iccPrivJson: [],
    adminPrivJson: [],
    cappPrivJson: [],
    orgPrivList: [{ id: "dept-002", name: "\u4E00\u7EBF\u6307\u6325\u90E8", code: "330101" }]
  },
  {
    id: "preview-role-audit",
    name: "\u4FE1\u606F\u5BA1\u6838\u5458",
    status: 0,
    remark: "\u53EA\u8BFB\u5BA1\u6838\u6743\u9650",
    gmtCreated: "2026-03-19 11:45:00",
    iccPrivJson: [],
    adminPrivJson: [],
    cappPrivJson: [],
    orgPrivList: []
  }
];
var people = [
  {
    id: "preview-user-001",
    name: "\u5F20\u6668",
    idCard: "MOCK-ID-001",
    phoneNum: "13800000001",
    departmentName: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3",
    departmentCode: "330100",
    status: 1
  },
  {
    id: "preview-user-002",
    name: "\u674E\u5B81",
    idCard: "MOCK-ID-002",
    phoneNum: "13800000002",
    departmentName: "\u4E00\u7EBF\u6307\u6325\u90E8",
    departmentCode: "330101",
    status: 1
  },
  {
    id: "preview-user-003",
    name: "\u738B\u654F",
    idCard: "MOCK-ID-003",
    phoneNum: "13800000003",
    departmentName: "\u4FE1\u606F\u901A\u4FE1\u652F\u961F",
    departmentCode: "330102",
    status: 0
  }
];
var departments = [
  {
    id: "dept-001",
    code: "330100",
    name: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3",
    path: "\u6D59\u6C5F\u7701/\u676D\u5DDE\u5E02/\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3",
    children: [
      { id: "dept-002", code: "330101", name: "\u4E00\u7EBF\u6307\u6325\u90E8", path: "\u6D59\u6C5F\u7701/\u676D\u5DDE\u5E02/\u4E00\u7EBF\u6307\u6325\u90E8", children: [] },
      { id: "dept-003", code: "330102", name: "\u4FE1\u606F\u901A\u4FE1\u652F\u961F", path: "\u6D59\u6C5F\u7701/\u676D\u5DDE\u5E02/\u4FE1\u606F\u901A\u4FE1\u652F\u961F", children: [] }
    ]
  }
];
var dutyTypes = [
  { type: "0", name: "\u767D\u73ED", gmtCreated: "2026-01-01 08:00:00" },
  { type: "1", name: "\u591C\u73ED", gmtCreated: "2026-01-01 08:00:00" },
  { type: "2", name: "\u673A\u52A8\u73ED", gmtCreated: "2026-01-01 08:00:00" }
];
var collaborations = [
  {
    id: "preview-post-001",
    postName: "\u5E94\u6025\u6307\u6325\u5C97",
    iconUrl: "",
    type: 1,
    policeTicketTypes: [{ id: "ticket-001", tag: "\u6CBB\u5B89\u8B66\u60C5" }],
    ticketTypeNames: "\u6CBB\u5B89\u8B66\u60C5",
    typeIds: ["ticket-001"],
    orgId: "dept-001",
    orgName: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3",
    orgCode: "330100",
    relatedUserIds: ["preview-user-001", "preview-user-002"],
    relatedUserNames: "\u5F20\u6668\u3001\u674E\u5B81",
    operatorName: "Mock\u7BA1\u7406\u5458",
    source: 1,
    updateTime: "2026-09-25 10:30:00",
    createTime: "2026-01-10 09:00:00"
  },
  {
    id: "preview-post-002",
    postName: "\u5DE1\u903B\u8054\u7EDC\u5C97",
    iconUrl: "",
    type: 2,
    policeTicketTypes: [{ id: "ticket-002", tag: "\u5DE1\u903B\u52A8\u6001" }],
    ticketTypeNames: "\u5DE1\u903B\u52A8\u6001",
    typeIds: ["ticket-002"],
    orgId: "dept-002",
    orgName: "\u4E00\u7EBF\u6307\u6325\u90E8",
    orgCode: "330101",
    relatedUserIds: ["preview-user-003"],
    relatedUserNames: "\u738B\u654F",
    operatorName: "Mock\u7BA1\u7406\u5458",
    source: 1,
    updateTime: "2026-09-24 16:20:00",
    createTime: "2026-02-15 13:15:00"
  }
];
var previewLabels = [
  {
    id: "preview-label-001",
    name: "\u52E4\u52A1\u6807\u7B7E",
    type: 1,
    scope: 1,
    icon: "fas fa-bell",
    color: "#409eff",
    parentId: "0",
    level: 1,
    children: [
      { id: "preview-label-002", name: "\u91CD\u70B9\u5DE1\u903B", type: 1, scope: 1, parentId: "preview-label-001", level: 2 }
    ]
  },
  {
    id: "preview-label-003",
    name: "\u534F\u540C\u6807\u7B7E",
    type: 2,
    scope: 2,
    icon: "fas fa-users",
    color: "#67c23a",
    parentId: "0",
    level: 1,
    children: []
  }
];
var schedules = [
  {
    id: "preview-schedule-001",
    userId: "preview-user-001",
    userName: "\u5F20\u6668",
    departmentName: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3",
    postName: "\u5E94\u6025\u6307\u6325\u5C97",
    dutyType: "0",
    dutyTypeName: "\u767D\u73ED",
    dutyStartDate: "2026-09-26",
    dutyStartTime: "08:00:00",
    dutyEndDate: "2026-09-26",
    dutyEndTime: "20:00:00",
    dutyContent: "\u6307\u6325\u5927\u5385\u503C\u5B88",
    importUserName: "Mock\u7BA1\u7406\u5458"
  },
  {
    id: "preview-schedule-002",
    userId: "preview-user-002",
    userName: "\u674E\u5B81",
    departmentName: "\u4E00\u7EBF\u6307\u6325\u90E8",
    postName: "\u5DE1\u903B\u8054\u7EDC\u5C97",
    dutyType: "1",
    dutyTypeName: "\u591C\u73ED",
    dutyStartDate: "2026-09-26",
    dutyStartTime: "20:00:00",
    dutyEndDate: "2026-09-27",
    dutyEndTime: "08:00:00",
    dutyContent: "\u591C\u95F4\u8054\u52A8\u503C\u5B88",
    importUserName: "Mock\u7BA1\u7406\u5458"
  }
];
var previewThirdApps = [
  {
    id: "preview-client-001",
    clientName: "\u7701\u7EA7\u60C5\u62A5\u5171\u4EAB\u5E73\u53F0",
    systemName: "\u7701\u7EA7\u60C5\u62A5\u5171\u4EAB\u5E73\u53F0",
    clientId: "client-preview-duty",
    clientSecret: "prev-secret-001",
    clientType: "1",
    tokenTime: 24,
    refreshTokenTime: 7,
    status: 1,
    expired: "2027-12-31 23:59:59",
    remark: "\u7528\u4E8E\u5E02\u7EA7\u534F\u540C\u6570\u636E\u5171\u4EAB\u7684\u672C\u5730\u6F14\u793A\u914D\u7F6E",
    grantTime: "2026-06-03 10:15:00",
    grantUserName: "Mock\u7BA1\u7406\u5458",
    gmtCreated: "2026-04-03 09:00:00",
    gmtModified: "2026-06-03 10:15:00"
  },
  {
    id: "preview-client-002",
    clientName: "\u8B66\u60C5\u8054\u52A8\u5E73\u53F0",
    systemName: "\u8B66\u60C5\u8054\u52A8\u5E73\u53F0",
    clientId: "client-preview-alert",
    clientSecret: "prev-secret-002",
    clientType: "1",
    tokenTime: 12,
    refreshTokenTime: 3,
    status: 1,
    expired: "2027-08-20 18:00:00",
    remark: "\u7528\u4E8E\u63A5\u6536\u8B66\u60C5\u8054\u52A8\u4FE1\u606F",
    grantTime: "2026-05-18 15:30:00",
    grantUserName: "Mock\u7BA1\u7406\u5458",
    gmtCreated: "2026-02-18 14:20:00",
    gmtModified: "2026-05-18 15:30:00"
  },
  {
    id: "preview-client-003",
    clientName: "\u57CE\u5E02\u89C6\u9891\u8D44\u6E90\u4E2D\u5FC3",
    systemName: "\u57CE\u5E02\u89C6\u9891\u8D44\u6E90\u4E2D\u5FC3",
    clientId: "client-preview-video",
    clientSecret: "prev-secret-003",
    clientType: "1",
    tokenTime: 8,
    refreshTokenTime: 2,
    status: 0,
    expired: "2026-12-31 23:59:59",
    remark: "\u6F14\u793A\u505C\u7528\u72B6\u6001\u3001\u6709\u6548\u671F\u548C\u6388\u6743\u4FE1\u606F",
    grantTime: "2026-04-26 11:40:00",
    grantUserName: "Mock\u503C\u73ED\u5458",
    gmtCreated: "2026-01-26 08:40:00",
    gmtModified: "2026-04-26 11:40:00"
  }
];
var sampleUserPage = (url, body) => paginate(people, url, body);
function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}
function paginate(records, url, body) {
  const input = asRecord(body);
  const pageNum = positiveInteger(
    url.searchParams.get("pageNum") ?? url.searchParams.get("current") ?? url.searchParams.get("page") ?? input.pageNum ?? input.current ?? input.page,
    1
  );
  const pageSize = positiveInteger(
    url.searchParams.get("pageSize") ?? url.searchParams.get("size") ?? input.pageSize ?? input.size,
    records.length || 10
  );
  const start = (pageNum - 1) * pageSize;
  return { records: records.slice(start, start + pageSize), total: records.length };
}
function handled(data) {
  return { handled: true, data: structuredClone(data) };
}
function getPreviewData(method, path, url, body) {
  const readMethod = method === "GET" || method === "POST";
  if (method === "POST" && path === "/api/globals/list") {
    return handled([
      { id: "preview-global-001", name: "DUTY_SCHEDULE_ENABLE", value: "1", remark: "\u5F00\u653E\u6392\u73ED\u4FE1\u606F\u83DC\u5355", status: 1 },
      { id: "preview-global-002", name: "EDGEGATEWAY_BREAKER", value: "1", remark: "\u8FB9\u7F18\u7F51\u5173\u529F\u80FD\u5F00\u5173", status: 1 },
      { id: "preview-global-003", name: "CAR_BREAKER", value: "1", remark: "\u8F66\u8F86\u529F\u80FD\u5F00\u5173", status: 1 },
      { id: "preview-global-004", name: "CUSTOMIZED_LAYER", value: "1", remark: "\u81EA\u5B9A\u4E49\u56FE\u5C42\u5F00\u5173", status: 1 }
    ]);
  }
  if (method === "POST" && path === "/base/v1/globals/getGlobalsList") {
    return handled({
      SYSTEM_NAME: "LinkX \u672C\u5730\u9884\u89C8",
      ALLOW_SIMPLE_PASSWORD: "1",
      DEPARTMENT_SYNC_SIGN: "0",
      DUTY_SCHEDULE_ENABLE: "1",
      EDGEGATEWAY_BREAKER: "1",
      CAR_BREAKER: "1",
      CUSTOMIZED_LAYER: "1",
      SUPERSET_SERVER_URL: "",
      SUPERSET_SERVER_URL_HTTP: "",
      CONFIG_DEVICE_GB: "preview-device"
    });
  }
  if (path === "/api/role" && method === "GET") return handled(paginate(roles, url, body));
  if (path === "/auth/v1/user/page" && method === "GET") return handled(sampleUserPage(url, body));
  if (path === "/auth/v1/user/adminuser/page" && method === "GET") {
    return handled(
      paginate(
        [
          {
            id: "preview-admin-001",
            idCard: "admin.preview",
            status: 0,
            gmtCreated: "2026-01-12 09:30:00",
            orgIds: ["dept-001"],
            orgList: [{ id: "dept-001", name: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3" }]
          },
          {
            id: "preview-admin-002",
            idCard: "duty.preview",
            status: 0,
            gmtCreated: "2026-02-03 14:10:00",
            orgIds: ["dept-002"],
            orgList: [{ id: "dept-002", name: "\u4E00\u7EBF\u6307\u6325\u90E8" }]
          }
        ],
        url,
        body
      )
    );
  }
  if (path === "/auth/v1/custom-department/tree" && readMethod) return handled(departments);
  if (path === "/auth/v1/custom-department/node" && readMethod) {
    return handled([
      {
        id: "node-001",
        orgId: "dept-001",
        parentId: "dept-001",
        code: "330101",
        name: "\u4E00\u7EBF\u6307\u6325\u90E8",
        path: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3/\u4E00\u7EBF\u6307\u6325\u90E8",
        sort: 1
      },
      {
        id: "node-002",
        orgId: "dept-001",
        parentId: "dept-001",
        code: "330102",
        name: "\u4FE1\u606F\u901A\u4FE1\u652F\u961F",
        path: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3/\u4FE1\u606F\u901A\u4FE1\u652F\u961F",
        sort: 2
      }
    ]);
  }
  if (path.startsWith("/auth/v1/custom-department/node/") && path.endsWith("/user") && method === "GET") {
    return handled(paginate(people, url, body));
  }
  if (path.startsWith("/auth/v1/custom-department/node/") && path.endsWith("/available-user") && method === "GET") {
    return handled(paginate(people, url, body));
  }
  if (path.startsWith("/api/map/") && method === "POST") {
    if (path === "/api/map/selectPageMap") {
      return handled(
        paginate(
          [
            {
              id: "preview-map-001",
              name: "\u5E02\u533A\u57FA\u7840\u5730\u56FE",
              mapType: "AMap",
              type: 0,
              activation: 1,
              configuration: '{"center":[120.1551,30.2741],"zoom":11}',
              gmtCreated: "2026-04-12 10:00:00"
            },
            {
              id: "preview-map-002",
              name: "\u5E94\u6025\u4E13\u9898\u5730\u56FE",
              mapType: "Arcgis",
              type: 1,
              activation: 0,
              configuration: '{"layer":"emergency"}',
              gmtCreated: "2026-05-18 15:30:00"
            }
          ],
          url,
          body
        )
      );
    }
    if (path === "/api/map/selectPageBaseMap") {
      return handled(
        paginate(
          [
            {
              id: "preview-basemap-001",
              name: "\u5E02\u533A\u77E2\u91CF\u5E95\u56FE",
              size: "18.6 MB",
              created: "2026-06-02 09:00:00",
              tiles: "/mock/tiles/city/{z}/{x}/{y}.png"
            },
            {
              id: "preview-basemap-002",
              name: "\u5E94\u6025\u4E13\u9898\u5E95\u56FE",
              size: "32.1 MB",
              created: "2026-06-18 13:40:00",
              tiles: "/mock/tiles/emergency/{z}/{x}/{y}.png"
            }
          ],
          url,
          body
        )
      );
    }
    if (path === "/api/map/selectListGeo") {
      const type = asRecord(body).type;
      const options = type === "inversecode" ? ["\u9AD8\u5FB7\u9006\u5730\u7406\u7F16\u7801"] : type === "poi" ? ["\u9AD8\u5FB7\u5730\u70B9\u68C0\u7D22"] : ["\u9AD8\u5FB7\u5730\u7406\u7F16\u7801"];
      return handled(options);
    }
    if (path === "/api/map/selectGeo")
      return handled({ geocode: "\u9AD8\u5FB7\u5730\u7406\u7F16\u7801", inversecode: "\u9AD8\u5FB7\u9006\u5730\u7406\u7F16\u7801", poi: "\u9AD8\u5FB7\u5730\u70B9\u68C0\u7D22" });
    if (path === "/api/map/selectDivision") return handled({ name: "\u6D59\u6C5F\u7701\u676D\u5DDE\u5E02" });
  }
  if (path === "/api/layout/app/sections" && method === "GET") {
    return handled([
      {
        id: "preview-section-001",
        name: "\u5E38\u7528\u5E94\u7528",
        type: 2,
        show: 1,
        sort: 1,
        custom: '[{"name":"\u503C\u73ED\u53F0","url":"/duty"}]',
        gmtCreated: "2026-04-10 08:30:00"
      },
      {
        id: "preview-section-002",
        name: "\u534F\u540C\u7FA4\u7EC4",
        type: 3,
        show: 1,
        sort: 2,
        custom: '{"buttons":[{"type":1,"name":"\u521B\u5EFA\u7FA4\u7EC4","enable":"true"}]}',
        gmtCreated: "2026-04-10 08:35:00"
      },
      {
        id: "preview-section-003",
        name: "\u6D88\u606F\u5217\u8868",
        type: 6,
        show: 0,
        sort: 3,
        custom: "",
        gmtCreated: "2026-04-10 08:40:00"
      }
    ]);
  }
  if (path === "/api/system/config" && method === "GET") {
    return handled([
      { id: "preview-config-001", key: "SYSTEM_NAME", value: "LinkX \u672C\u5730\u9884\u89C8" },
      { id: "preview-config-002", key: "APP_H5_CONFIG", value: '{"showBanner":true}' },
      {
        id: "preview-config-003",
        key: "PC_NAV_CUSTOM",
        value: '[{"name":"\u503C\u73ED\u5DE5\u4F5C\u53F0","url":"/workbench","order":1,"openWay":0}]'
      }
    ]);
  }
  if (path === "/collaboration/v1/client/list" && method === "POST") {
    const keyword = String(asRecord(body).clientName ?? asRecord(body).systemName ?? "").trim();
    const filtered = previewThirdApps.filter(
      (item) => !keyword || item.clientName.includes(keyword) || item.systemName.includes(keyword)
    );
    return handled(paginate(filtered, url, body));
  }
  if (path === "/collaboration/v1/post/page" && method === "GET") return handled(paginate(collaborations, url, body));
  if (path === "/collaboration/v1/post/queryUserByIdCard" && method === "GET") {
    return handled({
      userDepartments: [{ departmentId: "dept-001", departmentCode: "330100", departmentName: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3" }]
    });
  }
  if (path === "/collaboration/v1/post/queryDepartment" && method === "GET") return handled(departments);
  if (path === "/collaboration/v1/organization/tree" && method === "GET") return handled(departments[0]);
  if (path === "/collaboration/v1/post/queryUserByPage" && method === "GET") {
    return handled(
      paginate(
        people.map((person) => ({
          ...person,
          code: person.id,
          mobile: person.phoneNum,
          isBinding: 1,
          userDepartments: [{ id: "dept-001", departmentCode: "330100", departmentName: person.departmentName }]
        })),
        url,
        body
      )
    );
  }
  if (path === "/collaboration/v1/post/queryUser" && method === "GET") return handled(people);
  if (path === "/collaboration/v1/im/users/tree" && method === "GET") return handled(departments);
  if (path === "/auth/v1/role/byUserId" && method === "GET")
    return handled([{ id: "preview-role-duty", name: "\u503C\u73ED\u8C03\u5EA6\u5458" }]);
  if (path === "/collaboration/v1/post/queryByName" && method === "GET") return handled(false);
  if (path === "/collaboration/v1/post/syncPostFromIm" && method === "GET") return handled(true);
  if (path === "/collaboration/v1/post/getImSyncStatus" && method === "GET") return handled(true);
  if (path === "/collaboration/v1/post/getProcess" && method === "GET") return handled(true);
  if (path === "/collaboration/v1/post/log/page" && method === "GET") {
    return handled(
      paginate(
        [
          {
            id: "preview-log-001",
            postName: "\u5E94\u6025\u6307\u6325\u5C97",
            orgName: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3",
            relatedUserNames: "\u5F20\u6668\u3001\u674E\u5B81",
            operatorName: "Mock\u7BA1\u7406\u5458",
            operationType: 1,
            operationTypeName: "\u7F16\u8F91",
            content: "\u8C03\u6574\u5728\u5C97\u4EBA\u5458",
            operateTime: "2026-09-25 10:30:00"
          }
        ],
        url,
        body
      )
    );
  }
  if (path === "/collaboration/v1/attendance/page" && method === "GET") {
    return handled(
      paginate(
        [
          {
            id: "preview-attendance-001",
            postName: "\u5E94\u6025\u6307\u6325\u5C97",
            orgName: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3",
            personName: "\u5F20\u6668",
            relatedUserNames: "\u5F20\u6668\u3001\u674E\u5B81",
            type: 1,
            lastPeopleNum: 2,
            lastPeople: "\u5F20\u6668\u3001\u674E\u5B81",
            switchType: 1,
            createTime: "2026-09-26 08:00:00"
          }
        ],
        url,
        body
      )
    );
  }
  if (path === "/collaboration/v1/attendance/getOnline" && method === "GET") {
    return handled([
      {
        id: "preview-duty-user-001",
        userId: "preview-user-001",
        name: "\u5F20\u6668",
        idCard: "MOCK-ID-001",
        departmentName: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3",
        departmentCode: "330100"
      }
    ]);
  }
  if (path === "/collaboration/v1/attendance/getLastNum" && method === "GET") return handled({ lastPeopleNum: 2 });
  if (path === "/collaboration/v1/label/list" && method === "GET") return handled(previewLabels);
  if (/^\/collaboration\/v1\/functionaldepts\/[^/]+\/children$/.test(path) && method === "GET") {
    return handled([
      { id: "preview-function-001", name: "\u5E94\u6025\u5904\u7F6E", type: 1, children: [] },
      { id: "preview-function-002", name: "\u5DE1\u903B\u8054\u52A8", type: 2, children: [] }
    ]);
  }
  if (/^\/collaboration\/v1\/functionaldepts\/[^/]+\/coop$/.test(path) && method === "GET") {
    return handled({ records: collaborations, total: collaborations.length });
  }
  if (path === "/collaboration/v1/functionaldepts/default/coop/page" && method === "GET") {
    return handled({
      records: [
        { id: "preview-default-coop-001", postId: "preview-post-001", postName: "\u5E94\u6025\u6307\u6325\u5C97", orgName: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3" }
      ],
      total: 1
    });
  }
  if (path === "/api/content/carousel/page" && method === "GET") {
    return handled(
      paginate(
        [
          {
            id: "preview-carousel-001",
            title: "\u5E94\u6025\u503C\u5B88\u5B89\u6392",
            pciUrl: "/mock/images/duty-banner.svg",
            officialAccountId: "preview-account-001",
            officialAccountName: "\u676D\u5DDE\u8B66\u52A1",
            articleId: "preview-article-001",
            url: "/news/duty",
            sort: 1
          },
          {
            id: "preview-carousel-002",
            title: "\u5E73\u5B89\u5DE1\u9632\u63D0\u793A",
            pciUrl: "/mock/images/patrol-banner.svg",
            officialAccountId: "preview-account-001",
            officialAccountName: "\u676D\u5DDE\u8B66\u52A1",
            articleId: "preview-article-002",
            url: "/news/patrol",
            sort: 2
          }
        ],
        url,
        body
      )
    );
  }
  if (path === "/collaboration/v1/post/officialAccounts/page" && method === "GET") {
    return handled(
      paginate(
        [
          { id: "preview-account-001", name: "\u676D\u5DDE\u8B66\u52A1" },
          { id: "preview-account-002", name: "\u5E73\u5B89\u676D\u5DDE" }
        ],
        url,
        body
      )
    );
  }
  if (path === "/collaboration/v1/post/articles/page" && method === "GET") {
    return handled(
      paginate(
        [
          { id: "preview-article-001", title: "\u5E94\u6025\u503C\u5B88\u5B89\u6392", contentUrl: "/mock/articles/duty" },
          { id: "preview-article-002", title: "\u5E73\u5B89\u5DE1\u9632\u63D0\u793A", contentUrl: "/mock/articles/patrol" }
        ],
        url,
        body
      )
    );
  }
  if (path === "/collaboration/v1/groups/archive/list" && method === "GET") {
    return handled(
      paginate(
        [
          {
            groupId: "preview-group-001",
            groupName: "\u5E02\u5C40\u5E94\u6025\u8054\u52A8\u7FA4",
            tagName: "\u5E94\u6025\u5904\u7F6E",
            taskName: "\u9632\u6C5B\u5DE1\u67E5",
            departmentName: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3",
            archiveUserName: "Mock\u7BA1\u7406\u5458",
            archivedFile: "2026/09/\u5E94\u6025\u8054\u52A8\u7FA4.zip",
            archivedTime: "2026-09-20 18:30:00"
          },
          {
            groupId: "preview-group-002",
            groupName: "\u591C\u95F4\u5DE1\u9632\u5DE5\u4F5C\u7FA4",
            tagName: "\u5DE1\u903B\u52A8\u6001",
            taskName: "\u591C\u95F4\u5DE1\u9632",
            departmentName: "\u4E00\u7EBF\u6307\u6325\u90E8",
            archiveUserName: "Mock\u7BA1\u7406\u5458",
            archivedFile: "2026/09/\u591C\u95F4\u5DE1\u9632\u7FA4.zip",
            archivedTime: "2026-09-18 21:15:00"
          }
        ],
        url,
        body
      )
    );
  }
  if (path === "/collaboration/v1/dept/location/list" && method === "GET") {
    return handled([
      {
        id: "preview-location-001",
        departmentCode: "330100",
        departmentName: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3",
        location: "120.1551,30.2741"
      },
      {
        id: "preview-location-002",
        departmentCode: "330101",
        departmentName: "\u4E00\u7EBF\u6307\u6325\u90E8",
        location: "120.2058,30.2456"
      }
    ]);
  }
  if (path === "/collaboration/v1/duty/type/page" && method === "GET") return handled(paginate(dutyTypes, url, body));
  if (path === "/collaboration/v1/duty/type/all" && method === "GET") return handled(dutyTypes);
  if (path === "/collaboration/v1/duty/schedule/page" && method === "GET")
    return handled(paginate(schedules, url, body));
  if (path === "/collaboration/v1/duty/schedule/calendar" && method === "GET") {
    return handled({ "2026-09-26": schedules, "2026-09-27": [schedules[1]] });
  }
  if (path === "/api/warning/ralation/page" && method === "GET") {
    return handled(
      paginate(
        [
          {
            id: "preview-warning-001",
            businessId: "dept-001",
            businessName: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3",
            orgName: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3",
            targetType: 1,
            targetId: "preview-user-001",
            targetName: "\u5F20\u6668",
            idCard: "MOCK-ID-001"
          },
          {
            id: "preview-warning-002",
            businessId: "preview-post-002",
            businessName: "\u5DE1\u903B\u8054\u7EDC\u5C97",
            orgName: "\u4E00\u7EBF\u6307\u6325\u90E8",
            targetType: 2,
            targetId: "preview-group-001",
            targetName: "\u591C\u95F4\u5DE1\u9632\u5DE5\u4F5C\u7FA4",
            idCard: ""
          }
        ],
        url,
        body
      )
    );
  }
  if (path === "/collaboration/v1/im/queryUser" && method === "GET") {
    return handled(
      paginate(
        people.map(({ id, name, idCard }) => ({ id, name, idCard })),
        url,
        body
      )
    );
  }
  if (path === "/collaboration/v1/im/query/group/type" && method === "GET") {
    return handled(
      paginate(
        [
          { groupId: "preview-group-001", groupName: "\u5E02\u5C40\u5E94\u6025\u8054\u52A8\u7FA4" },
          { groupId: "preview-group-002", groupName: "\u591C\u95F4\u5DE1\u9632\u5DE5\u4F5C\u7FA4" }
        ],
        url,
        body
      )
    );
  }
  if (path === "/collaboration/v1/im/users/virtual" && method === "GET") {
    return handled([
      {
        id: "preview-virtual-001",
        userName: "\u5E94\u6025\u503C\u5B88\u8D26\u53F7",
        contactNumber: "13800000011",
        appId: "preview-app-001",
        appSecret: "preview-virtual-secret",
        defaultUser: 1,
        remark: "\u672C\u5730\u6837\u4F8B",
        createdAt: "2026-06-01 08:00:00",
        createdBy: "1"
      }
    ]);
  }
  if (path === "/api/content/app/info/page" && method === "GET") {
    return handled(
      paginate(
        [
          {
            id: "preview-app-001",
            name: "\u8B66\u52A1\u534F\u540C H5",
            type: 1,
            url: "http://127.0.0.1:30847/mock/h5",
            scope: [1],
            scopeList: [{ id: 1, name: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3" }],
            zone: 1,
            sort: 1,
            status: 0,
            official: 1,
            createTime: "2026-04-10 10:00:00"
          },
          {
            id: "preview-app-002",
            name: "\u52E4\u52A1\u79FB\u52A8\u7AEF",
            type: 0,
            packageAndroid: "/mock/apps/duty.apk",
            activity: "com.linkx.duty.MainActivity",
            scope: [1, 2],
            zone: 2,
            sort: 2,
            status: 1,
            official: 0,
            createTime: "2026-05-02 11:20:00"
          }
        ],
        url,
        body
      )
    );
  }
  if (path === "/api/content/app/info/prerequisite" && method === "GET")
    return handled([{ id: "preview-app-parent", name: "\u57FA\u7840\u5DE5\u4F5C\u53F0" }]);
  if (path === "/third/v1/apps/groups" && method === "GET") {
    return handled([
      {
        id: "preview-app-group-001",
        name: "\u6307\u6325\u8C03\u5EA6",
        sort: 1,
        appIds: ["preview-app-001"],
        appList: [],
        type: 1,
        createUser: "Mock\u7BA1\u7406\u5458"
      },
      {
        id: "preview-app-group-002",
        name: "\u65E5\u5E38\u5E94\u7528",
        sort: 2,
        appIds: ["preview-app-002"],
        appList: [],
        type: 2,
        createUser: "Mock\u7BA1\u7406\u5458"
      }
    ]);
  }
  if (path === "/third/v1/app/callable" && method === "GET") {
    return handled(
      paginate(
        [
          {
            id: "preview-callable-001",
            name: "\u8B66\u60C5\u67E5\u8BE2\u670D\u52A1",
            systemName: "\u8B66\u60C5\u5E73\u53F0",
            systemCode: "ALERT",
            uniqueId: "alert.query",
            type: 1,
            scope: 1,
            protocol: "https",
            ip: "127.0.0.1",
            port: 443,
            uri: "/mock/alerts",
            method: "GET",
            pagenation: 0,
            gmtCreated: "2026-05-14 09:15:00"
          },
          {
            id: "preview-callable-002",
            name: "\u91CD\u70B9\u4EBA\u5458\u5E93",
            systemName: "\u7EFC\u5408\u4FE1\u606F\u5E73\u53F0",
            systemCode: "INFO",
            uniqueId: "person.list",
            type: 2,
            scope: 2,
            databaseName: "preview_db",
            dbType: "PostgreSQL",
            account: "preview_readonly",
            period: "5m",
            gmtCreated: "2026-06-08 16:00:00"
          }
        ],
        url,
        body
      )
    );
  }
  if (path === "/collaboration/v1/poltclients/page" && method === "GET") {
    return handled(
      paginate(
        [
          {
            id: "preview-dock-001",
            name: "\u8B66\u60C5\u63A5\u5165\u670D\u52A1",
            systemName: "\u8B66\u60C5\u5E73\u53F0",
            systemCode: "ALERT",
            schema: "https",
            ip: "127.0.0.1",
            port: 8443,
            path: "/mock/police/tickets",
            method: "POST",
            headers: "{}",
            body: "{}",
            params: "{}",
            script: "",
            executePeriod: 6e4,
            status: 1,
            gmtCreated: "2026-05-10 09:00:00"
          }
        ],
        url,
        body
      )
    );
  }
  if (path === "/collaboration/v1/policeticket/page" && method === "GET") {
    return handled(
      paginate(
        [
          {
            id: "preview-ticket-001",
            code: "MOCK-20260926-001",
            name: "\u9053\u8DEF\u79EF\u6C34\u5DE1\u67E5",
            content: "\u5DE1\u67E5\u53D1\u73B0\u9053\u8DEF\u79EF\u6C34\uFF0C\u5DF2\u901A\u77E5\u5C5E\u5730\u5904\u7F6E\u3002",
            tag: "\u9632\u6C5B",
            source: "\u8B66\u60C5\u5E73\u53F0",
            createTime: "2026-09-26 09:20:00",
            origin: "MOCK"
          }
        ],
        url,
        body
      )
    );
  }
  if (path === "/collaboration/v1/policetickettype/page" && method === "GET") {
    return handled(
      paginate(
        [
          { id: "preview-ticket-type-001", tag: "\u6CBB\u5B89\u8B66\u60C5", gmtCreated: "2026-01-10 09:00:00" },
          { id: "preview-ticket-type-002", tag: "\u9632\u6C5B\u5DE1\u67E5", gmtCreated: "2026-02-20 10:30:00" }
        ],
        url,
        body
      )
    );
  }
  if (path === "/collaboration/v1/policeticket/types" && method === "GET")
    return handled([
      { id: "preview-ticket-type-001", tag: "\u6CBB\u5B89\u8B66\u60C5" },
      { id: "preview-ticket-type-002", tag: "\u9632\u6C5B\u5DE1\u67E5" }
    ]);
  if (path === "/collaboration/v1/policetickettype/list" && method === "GET")
    return handled([
      { id: "ticket-001", tag: "\u6CBB\u5B89\u8B66\u60C5" },
      { id: "ticket-002", tag: "\u5DE1\u903B\u52A8\u6001" }
    ]);
  if (path === "/api/icp/server/config" && method === "GET") {
    return handled({
      id: "preview-icp-config-001",
      protocol: 2,
      ip: "127.0.0.1",
      port: 9443,
      wssUrl: "wss://127.0.0.1:9443/mock",
      username: "preview-user",
      password: "preview-password",
      departmentId: "dept-001",
      departmentName: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3",
      cameraLevelId: "camera-level-001",
      cameraLevelName: "\u5E02\u533A\u6444\u50CF\u5934",
      environment: 0,
      status: 1,
      remark: "\u672C\u5730\u9884\u89C8\u6570\u636E"
    });
  }
  if (path === "/proxy/icp/v1/camera-level/tree/select" || path === "/proxy/icp/v1/camera-level/tree") {
    return handled([
      {
        id: "camera-level-001",
        label: "\u5E02\u533A\u6444\u50CF\u5934",
        children: [{ id: "camera-level-002", label: "\u4E2D\u5FC3\u57CE\u533A", parentId: "camera-level-001" }]
      }
    ]);
  }
  if (path === "/proxy/icp/v1/department/tree/select" || path === "/proxy/icp/v1/department/tree")
    return handled(
      departments.map((item) => ({
        id: item.id,
        label: item.name,
        children: item.children.map((child) => ({ id: child.id, label: child.name, parentId: item.id }))
      }))
    );
  if (path === "/auth/v1/user/page/dept" && method === "GET")
    return handled(
      paginate(
        people.map(({ id, name, idCard, departmentName, departmentCode }) => ({
          id,
          name,
          idCard,
          departmentName,
          departmentCode,
          directLeaderName: "\u503C\u73ED\u8D1F\u8D23\u4EBA",
          directLeaderId: "preview-user-001"
        })),
        url,
        body
      )
    );
  if (path === "/proxy/icp/v1/isdnType/list" && method === "GET") {
    return handled([
      { id: "device-type-001", name: "\u6267\u6CD5\u8BB0\u5F55\u4EEA", type: "camera", isShow: 1, icon: "" },
      { id: "device-type-002", name: "\u79FB\u52A8\u7EC8\u7AEF", type: "mobile", isShow: 1, icon: "" }
    ]);
  }
  if (/^\/proxy\/icp\/v1\/(camera|imuser)\/priv(\/dept)?\/[^/]+$/.test(path)) return handled([]);
  if (path === "/api/globals/ai/deploy" && method === "GET")
    return handled({ separatedDeploy: false, groupAiHost: "http://127.0.0.1:30847/mock/ai", groupAiFrontendHost: "" });
  if (path === "/XA-ics-agent/proxy/ai/v1/aiagent/management/settings" && method === "GET")
    return handled({ approvalEnabled: true, approvalSubMode: 0, approvalSystemUrl: "" });
  if (path === "/XA-ics-agent/proxy/ai/v1/aiagent/management/page" && method === "GET") {
    return handled(
      paginate(
        [
          {
            id: "preview-agent-001",
            name: "\u52E4\u52A1\u95EE\u7B54\u52A9\u624B",
            desc: "\u56DE\u7B54\u503C\u73ED\u3001\u5DE1\u903B\u548C\u5E94\u6025\u6D41\u7A0B\u95EE\u9898",
            avatarUrl: "",
            url: "http://127.0.0.1:30847/mock/ai/assistant",
            token: "preview-agent-token",
            httpMethod: "POST",
            priority: 0,
            categoryIds: ["preview-agent-category-001"],
            categoryName: "\u52E4\u52A1\u670D\u52A1",
            isRestricted: 0,
            audio: 0,
            video: 0,
            image: 1,
            document: 1,
            virtualUserId: "preview-virtual-001"
          }
        ],
        url,
        body
      )
    );
  }
  if (path === "/XA-ics-agent/proxy/ai/v1/aiagent/management/category/list" && method === "GET")
    return handled([
      { id: "preview-agent-category-001", name: "\u52E4\u52A1\u670D\u52A1" },
      { id: "preview-agent-category-002", name: "\u8B66\u60C5\u7814\u5224" }
    ]);
  if (path === "/collaboration/v1/ai/assistant/agent/page" && method === "GET") {
    return handled(
      paginate(
        [
          {
            id: "preview-agent-binding-001",
            agentId: "preview-agent-001",
            virtualUserId: "preview-virtual-001",
            createdUserId: "1"
          }
        ],
        url,
        body
      )
    );
  }
  if (path === "/XA-ics-agent/proxy/ai/v1/aiagent/management/record" && method === "GET") {
    return handled(
      paginate(
        [
          {
            id: "preview-agent-record-001",
            userName: "\u5F20\u6668",
            identityCardNumber: "MOCK-ID-001",
            agentName: "\u52E4\u52A1\u95EE\u7B54\u52A9\u624B",
            departmentName: "\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3",
            queryContent: "\u591C\u73ED\u4EA4\u63A5\u9700\u8981\u586B\u5199\u54EA\u4E9B\u5185\u5BB9\uFF1F",
            time: "2026-09-26 08:10:00",
            responseContent: "\u8BF7\u8BB0\u5F55\u5728\u5C97\u4EBA\u5458\u3001\u672A\u7ED3\u8B66\u60C5\u548C\u8BBE\u5907\u72B6\u6001\u3002"
          }
        ],
        url,
        body
      )
    );
  }
  if (path === "/XA-ics-agent/proxy/ai/v1/aiagent/attachment-config/list" && method === "GET") {
    return handled([
      {
        id: "preview-agent-file-001",
        name: "\u6587\u4EF6\u89E3\u6790\u670D\u52A1",
        method: "POST",
        ip: "127.0.0.1",
        port: 8080,
        uri: "/mock/files/parse",
        header: "{}",
        query: "{}",
        body: "{}",
        reponseFileFiled: "fileUrl",
        desc: "\u672C\u5730\u6837\u4F8B\u63A5\u53E3"
      }
    ]);
  }
  if (path === "/node/v1/p2p/servers" && method === "GET") {
    return handled(
      paginate(
        [
          {
            id: "preview-server-001",
            peerId: "preview-peer-001",
            ip: "127.0.0.1",
            port: 30017,
            name: "\u5E02\u5C40\u4E3B\u8282\u70B9",
            tag: "main",
            remark: "\u672C\u5730\u9884\u89C8\u8282\u70B9",
            createUserName: "Mock\u7BA1\u7406\u5458",
            gmtCreated: "2026-04-02 10:00:00",
            status: 1,
            statusDesc: "\u8FDE\u63A5\u6B63\u5E38"
          },
          {
            id: "preview-server-002",
            peerId: "preview-peer-002",
            ip: "127.0.0.2",
            port: 30017,
            name: "\u6F14\u793A\u5907\u8282\u70B9",
            tag: "backup",
            remark: "Mock \u6570\u636E",
            createUserName: "Mock\u7BA1\u7406\u5458",
            gmtCreated: "2026-05-10 16:30:00",
            status: 2,
            statusDesc: "\u7B49\u5F85\u8FDE\u63A5"
          }
        ],
        url,
        body
      )
    );
  }
  if (path === "/node/v1/p2p/clients" && method === "GET") {
    return handled(
      paginate(
        [
          {
            id: "preview-client-node-001",
            peerId: "preview-client-peer-001",
            ip: "127.0.0.3",
            port: 30017,
            name: "\u5E94\u6025\u6307\u6325\u5BA2\u6237\u7AEF",
            tag: "dispatch",
            remark: "\u672C\u5730\u5BA2\u6237\u7AEF\u6837\u4F8B",
            grant: 1,
            expired: false,
            grantUserName: "Mock\u7BA1\u7406\u5458",
            grantTime: "2026-06-10 09:00:00",
            expiredIn: 17987616e5,
            status: 1,
            statusDesc: "\u8FDE\u63A5\u6B63\u5E38",
            lastSeen: "2026-09-26 10:20:00",
            gmtCreated: "2026-06-10 08:30:00"
          }
        ],
        url,
        body
      )
    );
  }
  if (/^\/node\/v1\/p2p\/servers\/[^/]+\/opendata\/grant$/.test(path) && method === "GET")
    return handled({ users: 1, groups: 1, msg: 1, h5: 1, agent: 0, coopUser: 1 });
  if (/^\/node\/v1\/p2p\/[^/]+\/opendata\/statistic$/.test(path) && method === "GET")
    return handled({
      users: { coopUserCount: 36 },
      groups: { coopGroupCount: 12, normalGroupCount: 28 },
      msg: { coopMsg: 320 },
      h5: { count: 18 },
      agent: { count: 4 }
    });
  if (/^\/node\/v1\/p2p\/[^/]+\/opendata\/coop\/search$/.test(path) && method === "GET")
    return handled(
      collaborations.map(({ id, postName, orgName, relatedUserNames, relatedUserIds, iconUrl }) => ({
        id,
        postName,
        orgName,
        relatedUserNames,
        relatedUserIds,
        iconUrl
      }))
    );
  if (path === "/api/globals/ai/deploy" || path.startsWith("/XA-ics-agent/") || path.startsWith("/proxy/icp/")) {
    return { handled: false };
  }
  if (path === "/collaboration/v1/tags/page") return { handled: false };
  if (path === "/api/globals/list" || path === "/base/v1/globals/getGlobalsList") return { handled: false };
  return { handled: false };
}

// mock/preview-menu.ts
var menuModules = [
  {
    url: "/baseData",
    name: "\u7CFB\u7EDF\u914D\u7F6E",
    icon: "component",
    children: [
      ["thirdParty", "\u4E09\u65B9\u63A5\u5165\u7BA1\u7406"],
      ["globals", "\u5168\u5C40\u53C2\u6570\u914D\u7F6E"],
      ["mapConfig", "\u5730\u56FE\u914D\u7F6E"],
      ["layoutConfig", "\u5E03\u5C40\u914D\u7F6E"]
    ]
  },
  {
    url: "/authority",
    name: "\u6743\u9650\u4E2D\u5FC3",
    icon: "password",
    children: [
      ["role", "\u89D2\u8272\u7BA1\u7406"],
      ["person", "\u6743\u9650\u7BA1\u7406"],
      ["userManage", "\u7528\u6237\u7BA1\u7406"],
      ["IMPermission", "\u524D\u53F0\u6743\u9650\u7BA1\u7406"],
      ["IMrole", "\u524D\u53F0\u89D2\u8272\u7BA1\u7406"],
      ["IMperson", "\u524D\u53F0\u7528\u6237\u7BA1\u7406"],
      ["adminPermission", "\u540E\u53F0\u6743\u9650\u7BA1\u7406"],
      ["adminRole", "\u540E\u53F0\u89D2\u8272\u7BA1\u7406"],
      ["adminPerson", "\u540E\u53F0\u7528\u6237\u7BA1\u7406"],
      ["customDepartment", "\u81EA\u5B9A\u4E49\u7EC4\u7EC7\u7BA1\u7406"]
    ]
  },
  {
    url: "/collaboration",
    name: "\u534F\u540C\u5C97\u7BA1\u7406",
    icon: "chat",
    children: [
      ["index", "\u534F\u540C\u5C97\u7BA1\u7406"],
      ["quick", "\u6807\u7B7E\u7BA1\u7406"]
    ]
  },
  {
    url: "/h5",
    name: "H5\u7BA1\u7406",
    icon: "mobile",
    children: [
      ["carousel", "\u8F6E\u64AD\u56FE\u7BA1\u7406"],
      ["GroupTags", "\u7FA4\u7EC4\u6807\u7B7E\u7BA1\u7406"]
    ]
  },
  {
    url: "/location",
    name: "\u4F4D\u7F6E\u7BA1\u7406",
    icon: "map",
    children: [["location", "\u4F4D\u7F6E\u4FE1\u606F"]]
  },
  {
    url: "/scheduling",
    name: "\u6392\u73ED\u7BA1\u7406",
    icon: "document",
    children: [
      ["dutyType", "\u6392\u73ED\u7C7B\u578B\u7BA1\u7406"],
      ["dutyInformation", "\u6392\u73ED\u4FE1\u606F"]
    ]
  },
  {
    url: "/notification",
    name: "\u9884\u8B66\u7BA1\u7406",
    icon: "bell",
    children: [["alertPush", "\u9884\u8B66\u63A8\u9001"]]
  },
  {
    url: "/policeExtend",
    name: "\u8B66\u4FE1\u6269\u5C55\u4FE1\u606F\u7BA1\u7406",
    icon: "user",
    children: [
      ["virtualUser", "\u865A\u62DF\u7528\u6237\u7BA1\u7406"],
      ["ArchivedTable", "\u5DF2\u5F52\u6863\u7FA4\u7EC4\u7BA1\u7406"]
    ]
  },
  {
    url: "/thirdParty",
    name: "\u4E09\u65B9\u5BF9\u63A5",
    icon: "connection",
    children: [
      ["app", "\u5E94\u7528\u7BA1\u7406"],
      ["southInterface", "\u5357\u5411\u5BF9\u63A5"],
      ["policeReport", "\u8B66\u5355\u5E73\u53F0"],
      ["unifiedComm", "\u901A\u4FE1\u670D\u52A1\u7BA1\u7406"],
      ["agentInterface", "AI\u667A\u80FD\u4F53\u5BF9\u63A5\uFF08\u5357\u5411\uFF09"],
      ["thirdParty", "\u5317\u5411\u63A5\u5165\u7BA1\u7406"]
    ]
  },
  {
    url: "/nodeManage",
    name: "\u591A\u8282\u70B9\u7BA1\u7406",
    icon: "monitor",
    children: [
      ["nodeManagement", "\u8282\u70B9\u7BA1\u7406"],
      ["dataManage", "\u6570\u636E\u7BA1\u7406"]
    ]
  }
];
var routeModuleOrder = [
  "/baseData",
  "/h5",
  "/collaboration",
  "/authority",
  "/location",
  "/scheduling",
  "/notification",
  "/policeExtend",
  "/thirdParty",
  "/nodeManage"
];
var previewMenu = [...menuModules].sort((left, right) => routeModuleOrder.indexOf(left.url) - routeModuleOrder.indexOf(right.url)).map((module, parentIndex) => {
  const parentId = `parent-${parentIndex}`;
  return {
    id: parentId,
    name: module.name,
    parentId: "0",
    applicationId: "",
    url: module.url,
    imgurl: module.icon,
    isleaf: 0,
    level: 1,
    sort: parentIndex + 1,
    status: 1,
    children: module.children.map(([path, name], childIndex) => ({
      id: `${module.url}-${path}`,
      name,
      parentId,
      applicationId: "",
      url: `${module.url}/${path}`,
      isleaf: 1,
      level: 2,
      sort: childIndex + 1,
      status: 1
    }))
  };
});
var previewMenuPermissions = previewMenu.flatMap((parent) => [
  parent.id,
  ...(parent.children ?? []).map((child) => child.id)
]);

// mock/preview-server.ts
var initialTags = [
  { id: "preview-001", name: "\u503C\u73ED\u901A\u77E5", icon: "fas fa-bell", color: "#409eff" },
  { id: "preview-002", name: "\u5DE1\u903B\u52A8\u6001", icon: "fas fa-map-marker-alt", color: "#67c23a" },
  { id: "preview-003", name: "\u534F\u540C\u5904\u7F6E", icon: "fas fa-users", color: "#e6a23c" },
  { id: "preview-004", name: "\u4F1A\u8BAE\u5B89\u6392", icon: "fas fa-calendar", color: "#909399" },
  { id: "preview-005", name: "\u7CFB\u7EDF\u516C\u544A", icon: "fas fa-bullhorn", color: "#f56c6c" }
];
var previewImages = {
  "/mock/images/duty-banner.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="320" viewBox="0 0 680 320">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d9efff"/><stop offset="1" stop-color="#f4fbff"/></linearGradient></defs>
    <rect width="680" height="320" rx="16" fill="url(#sky)"/><circle cx="560" cy="72" r="34" fill="#f4c96b" opacity=".92"/>
    <path d="M0 228 86 178l64 34 90-88 78 54 80-71 101 71 66-36 115 78v100H0Z" fill="#a8d7df"/>
    <path d="M0 253 112 208l86 39 88-61 78 43 99-72 87 63 61-28 69 37v91H0Z" fill="#75b9b4"/>
    <path d="M0 272h680v48H0Z" fill="#4d9b91"/><path d="M392 271v-84l24-19 24 19v84m32 0v-108l29-24 29 24v108m34 0v-76l21-17 21 17v76" fill="#f4fbff" opacity=".8"/>
    <rect x="34" y="30" width="212" height="28" rx="14" fill="#ffffff" opacity=".86"/><circle cx="52" cy="44" r="5" fill="#168a7b"/>
    <text x="68" y="49" fill="#35646b" font-size="14" font-family="Microsoft YaHei,sans-serif">\u5E02\u5C40\u6307\u6325\u4E2D\u5FC3 \xB7 \u52E4\u52A1\u5B89\u6392</text>
    <text x="36" y="113" fill="#17465b" font-size="34" font-weight="700" font-family="Microsoft YaHei,sans-serif">\u5E94\u6025\u503C\u5B88\u5B89\u6392</text>
    <text x="38" y="143" fill="#426c78" font-size="16" font-family="Microsoft YaHei,sans-serif">\u91CD\u70B9\u65F6\u6BB5\u5728\u5C97\u4FE1\u606F\u4E0E\u4EA4\u63A5\u63D0\u9192</text>
    <rect x="38" y="166" width="106" height="34" rx="17" fill="#167f83"/><text x="57" y="189" fill="#ffffff" font-size="14" font-family="Microsoft YaHei,sans-serif">\u4ECA\u65E5\u503C\u5B88</text>
  </svg>`,
  "/mock/images/patrol-banner.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="320" viewBox="0 0 680 320">
    <defs><linearGradient id="field" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e7f4ec"/><stop offset="1" stop-color="#d7eee4"/></linearGradient></defs>
    <rect width="680" height="320" rx="16" fill="url(#field)"/><path d="M0 230 90 204l78 23 77-86 72 50 95-70 76 48 88-67 104 69v149H0Z" fill="#acd4bd"/>
    <path d="M0 270 118 228l90 29 85-50 79 39 87-61 80 54 67-31 74 28v64H0Z" fill="#75b795"/>
    <path d="M390 270c18-61 56-89 100-75 31 10 42 34 62 21 21-14 25-42 55-46" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" stroke-dasharray="4 15"/>
    <circle cx="392" cy="269" r="10" fill="#d05a49" stroke="#ffffff" stroke-width="5"/><circle cx="608" cy="170" r="10" fill="#d05a49" stroke="#ffffff" stroke-width="5"/>
    <path d="M501 132c-18 0-32 14-32 31 0 25 32 56 32 56s32-31 32-56c0-17-14-31-32-31Zm0 42a11 11 0 1 1 0-22 11 11 0 0 1 0 22Z" fill="#167f68"/>
    <rect x="34" y="30" width="204" height="28" rx="14" fill="#ffffff" opacity=".88"/><circle cx="52" cy="44" r="5" fill="#167f68"/>
    <text x="68" y="49" fill="#35645a" font-size="14" font-family="Microsoft YaHei,sans-serif">\u5DE1\u9632\u52A8\u6001 \xB7 \u5B9E\u65F6\u8DEF\u7EBF</text>
    <text x="36" y="113" fill="#174c3e" font-size="34" font-weight="700" font-family="Microsoft YaHei,sans-serif">\u5E73\u5B89\u5DE1\u9632\u63D0\u793A</text>
    <text x="38" y="143" fill="#426e61" font-size="16" font-family="Microsoft YaHei,sans-serif">\u91CD\u70B9\u533A\u57DF\u5DE1\u67E5\u4E0E\u8054\u52A8\u4EFB\u52A1</text>
    <rect x="38" y="166" width="106" height="34" rx="17" fill="#167f68"/><text x="57" y="189" fill="#ffffff" font-size="14" font-family="Microsoft YaHei,sans-serif">\u8DEF\u7EBF\u5DE1\u67E5</text>
  </svg>`
};
function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}
async function readJson(request) {
  let raw = "";
  for await (const chunk of request) raw += typeof chunk === "string" ? chunk : chunk.toString("utf8");
  if (!raw) return void 0;
  return JSON.parse(raw);
}
function isTagInput(value) {
  if (!value || typeof value !== "object") return false;
  const input = value;
  return typeof input.name === "string" && typeof input.icon === "string" && typeof input.color === "string";
}
function isIdList(value) {
  return Array.isArray(value) && value.every((id) => typeof id === "string" || typeof id === "number");
}
function asRecord2(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function isThirdAppInput(input) {
  const name = input.systemName ?? input.clientName;
  return typeof name === "string" && typeof input.clientId === "string" && typeof input.clientSecret === "string" && (typeof input.tokenTime === "number" || typeof input.tokenTime === "string") && (typeof input.refreshTokenTime === "number" || typeof input.refreshTokenTime === "string") && typeof input.status === "number";
}
function mockPreviewPlugin() {
  const tags = initialTags.map((tag) => ({ ...tag }));
  let nextId = 6;
  let nextThirdAppId = previewThirdApps.length + 1;
  return {
    name: "linkx-mock-preview",
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: "script",
            injectTo: "head-prepend",
            children: `
              if (window.location.pathname === '/login') {
                ['vue_admin_template_token', 'is_admin', 'back_user_id', 'back_username'].forEach((key) => {
                  localStorage.removeItem(key);
                });
              } else {
                localStorage.setItem('vue_admin_template_token', 'linkx-local-mock-token');
                localStorage.setItem('is_admin', 'true');
                localStorage.setItem('back_user_id', '1');
                localStorage.setItem('back_username', 'Mock\u9884\u89C8\u7BA1\u7406\u5458');
              }
            `
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const requestUrl = request.url;
        if (!requestUrl?.startsWith("/linkx/admin")) return next();
        void (async () => {
          const url = new URL(requestUrl, "http://localhost");
          const path = url.pathname.replace(/^\/linkx\/admin/, "") || "/";
          const method = request.method ?? "GET";
          const image = previewImages[path];
          if (method === "GET" && image) {
            response.statusCode = 200;
            response.setHeader("content-type", "image/svg+xml; charset=utf-8");
            response.setHeader("cache-control", "no-store");
            response.setHeader("x-content-type-options", "nosniff");
            response.end(image);
            return;
          }
          const requestBody = request.headers["content-type"]?.includes("application/json") ? await readJson(request) : void 0;
          const ok = (data = null) => ({ code: 0, msg: "\u64CD\u4F5C\u6210\u529F", data });
          const normalizedPath = decodeURIComponent(path);
          if (path.endsWith("/oauth/v2/login") && method === "POST") {
            const username = requestBody && typeof requestBody === "object" && "username" in requestBody ? String(requestBody.username) : "\u672C\u5730\u9884\u89C8";
            sendJson(
              response,
              200,
              ok({
                accessToken: "linkx-local-mock-token",
                userName: username,
                userId: "1",
                idCardNum: "",
                isAdmin: true
              })
            );
            return;
          }
          if (path.endsWith("/oauth/v2/permissions")) {
            sendJson(response, 200, ok({ type: 1, menus: previewMenuPermissions, actions: [] }));
            return;
          }
          if (path === "/api/menu/list") {
            sendJson(response, 200, ok(previewMenu));
            return;
          }
          if (path === "/api/globals/list") {
            const mock = getPreviewData(method, path, url, requestBody);
            sendJson(response, 200, ok(mock.data));
            return;
          }
          if (path === "/base/v1/globals/getGlobalsList") {
            const mock = getPreviewData(method, path, url, requestBody);
            sendJson(response, 200, ok(mock.data));
            return;
          }
          if (path === "/api/msip/license/info") {
            sendJson(
              response,
              200,
              ok({
                status: 1,
                LINKXBS: "1",
                LINKXGCF: "1",
                LINKXTCF: "1",
                LINKXBCF: "1",
                LINKXACF: "1",
                LINKXNDI: "1"
              })
            );
            return;
          }
          if (path === "/collaboration/v1/base/version") {
            sendJson(
              response,
              200,
              ok({
                jx: { serviceVersion: "\u672C\u5730 Mock" },
                eagent: { serviceVersion: "\u672C\u5730 Mock" },
                linkx: { serviceVersion: "\u672C\u5730 Mock" }
              })
            );
            return;
          }
          if (path === "/auth/v1/user/adminuser/bind/im-user" && method === "GET") {
            sendJson(response, 200, ok(null));
            return;
          }
          if (path.endsWith("/oauth/v2/keepalive") || path.endsWith("/oauth/v2/logout")) {
            sendJson(response, 200, ok());
            return;
          }
          if (path === "/collaboration/v1/tags/page" && method === "GET") {
            const name = url.searchParams.get("name")?.trim() ?? "";
            const pageNum = Math.max(1, Number(url.searchParams.get("pageNum")) || 1);
            const pageSize = Math.max(1, Number(url.searchParams.get("pageSize")) || 10);
            const filtered = tags.filter((tag) => tag.name.includes(name));
            const start = (pageNum - 1) * pageSize;
            sendJson(response, 200, ok({ records: filtered.slice(start, start + pageSize), total: filtered.length }));
            return;
          }
          if (path === "/collaboration/v1/tags" && method === "POST") {
            if (!isTagInput(requestBody)) {
              sendJson(response, 400, { code: 400, msg: "\u6807\u7B7E\u6570\u636E\u683C\u5F0F\u9519\u8BEF", data: null });
              return;
            }
            tags.push({ id: `preview-${String(nextId++).padStart(3, "0")}`, ...requestBody });
            sendJson(response, 200, ok());
            return;
          }
          if ((normalizedPath === "/collaboration/v1/client/create " || normalizedPath === "/collaboration/v1/client/create") && method === "POST") {
            const input = asRecord2(requestBody);
            if (!isThirdAppInput(input)) {
              sendJson(response, 400, { code: 400, msg: "\u5E94\u7528\u6570\u636E\u683C\u5F0F\u9519\u8BEF", data: null });
              return;
            }
            const name = String(input.systemName ?? input.clientName);
            const now = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ");
            const id = `preview-client-${String(nextThirdAppId++).padStart(3, "0")}`;
            previewThirdApps.push({
              id,
              clientName: name,
              systemName: name,
              clientId: String(input.clientId),
              clientSecret: String(input.clientSecret),
              clientType: String(input.clientType ?? ""),
              tokenTime: Number(input.tokenTime),
              refreshTokenTime: Number(input.refreshTokenTime),
              status: Number(input.status),
              expired: String(input.expired ?? ""),
              remark: String(input.remark ?? ""),
              grantTime: now,
              grantUserName: "Mock\u7BA1\u7406\u5458",
              gmtCreated: now,
              gmtModified: now
            });
            sendJson(response, 200, ok(id));
            return;
          }
          if (path === "/collaboration/v1/client/update" && method === "PUT") {
            const input = asRecord2(requestBody);
            if (!isThirdAppInput(input) || typeof input.id !== "string") {
              sendJson(response, 400, { code: 400, msg: "\u5E94\u7528\u6570\u636E\u683C\u5F0F\u9519\u8BEF", data: null });
              return;
            }
            const index = previewThirdApps.findIndex((item) => item.id === input.id);
            if (index < 0) {
              sendJson(response, 404, { code: 404, msg: "\u5E94\u7528\u4E0D\u5B58\u5728", data: null });
              return;
            }
            const name = String(input.systemName ?? input.clientName);
            previewThirdApps[index] = {
              ...previewThirdApps[index],
              ...input,
              id: input.id,
              clientName: name,
              systemName: name,
              clientId: String(input.clientId),
              clientSecret: String(input.clientSecret),
              clientType: String(input.clientType ?? ""),
              tokenTime: Number(input.tokenTime),
              refreshTokenTime: Number(input.refreshTokenTime),
              status: Number(input.status),
              expired: String(input.expired ?? ""),
              remark: String(input.remark ?? ""),
              gmtModified: (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ")
            };
            sendJson(response, 200, ok());
            return;
          }
          if (path === "/collaboration/v1/client/delete" && method === "DELETE") {
            const id = url.searchParams.get("id");
            const index = previewThirdApps.findIndex((item) => item.id === id);
            if (index >= 0) previewThirdApps.splice(index, 1);
            sendJson(response, 200, ok());
            return;
          }
          if (path === "/collaboration/v1/client/detail" && method === "GET") {
            const id = url.searchParams.get("id");
            const item = previewThirdApps.find((entry) => entry.id === id);
            if (!item) sendJson(response, 404, { code: 404, msg: "\u5E94\u7528\u4E0D\u5B58\u5728", data: null });
            else sendJson(response, 200, ok(item));
            return;
          }
          if (path === "/collaboration/v1/tags/delete/list" && method === "DELETE") {
            const ids = requestBody;
            if (!isIdList(ids)) {
              sendJson(response, 400, { code: 400, msg: "\u6807\u7B7E ID \u5217\u8868\u683C\u5F0F\u9519\u8BEF", data: null });
              return;
            }
            const idSet = new Set(ids.map(String));
            for (let index = tags.length - 1; index >= 0; index -= 1) {
              if (idSet.has(tags[index].id)) tags.splice(index, 1);
            }
            sendJson(response, 200, ok());
            return;
          }
          const detailMatch = path.match(/^\/collaboration\/v1\/tags\/([^/]+)$/);
          if (detailMatch) {
            const id = decodeURIComponent(detailMatch[1]);
            const index = tags.findIndex((tag) => tag.id === id);
            if (method === "GET") {
              if (index < 0) sendJson(response, 404, { code: 404, msg: "\u6807\u7B7E\u4E0D\u5B58\u5728", data: null });
              else sendJson(response, 200, ok(tags[index]));
              return;
            }
            if (method === "PUT") {
              if (index < 0 || !isTagInput(requestBody)) {
                sendJson(response, index < 0 ? 404 : 400, {
                  code: index < 0 ? 404 : 400,
                  msg: "\u6807\u7B7E\u65E0\u6CD5\u66F4\u65B0",
                  data: null
                });
                return;
              }
              tags[index] = { id, ...requestBody };
              sendJson(response, 200, ok());
              return;
            }
            if (method === "DELETE") {
              if (index >= 0) tags.splice(index, 1);
              sendJson(response, 200, ok());
              return;
            }
          }
          const previewData = getPreviewData(method, path, url, requestBody);
          if (previewData.handled) {
            sendJson(response, 200, ok(previewData.data));
            return;
          }
          sendJson(response, 501, {
            code: 501,
            msg: `\u672C\u5730 Mock \u672A\u914D\u7F6E\u63A5\u53E3\uFF1A${method} ${path}`,
            data: null
          });
        })().catch((error) => {
          sendJson(response, 400, {
            code: 400,
            msg: error instanceof Error ? error.message : "\u672C\u5730 Mock \u8BF7\u6C42\u89E3\u6790\u5931\u8D25",
            data: null
          });
        });
      });
    }
  };
}

// vite.config.mts
var __vite_injected_original_dirname = "F:\\work\\linkx-admin\\other-admin\\admin-vue3";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: env.VITE_PUBLIC_PATH || "/",
    resolve: {
      // 本地组件库与宿主共享运行时，避免双份 Vue/Element Plus 注入上下文。
      dedupe: ["vue", "element-plus"],
      alias: {
        "@": resolve(__vite_injected_original_dirname, "src"),
        "#": resolve(__vite_injected_original_dirname, "types")
      }
    },
    plugins: [
      ...mode === "mock-preview" ? [mockPreviewPlugin()] : [],
      vue(),
      AutoImport({
        imports: ["vue", "vue-router", "pinia"],
        resolvers: [ElementPlusResolver()],
        dts: "types/auto-imports.d.ts",
        eslintrc: { enabled: true }
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: "types/components.d.ts",
        dirs: ["src/components"]
      })
    ],
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          // 全局注入 variables.less，让所有 .vue/.less 文件的 scoped style
          // 可直接使用 @color-* / @spacing-* / @radius-* 等设计令牌
          additionalData: `@import "@/styles/variables.less";`
        }
      }
    },
    server: {
      port: mode === "mock-preview" ? 30847 : 30845,
      open: false,
      ...mode === "mock-preview" ? {} : {
        proxy: {
          [env.VITE_BASE_API || "/linkx/admin"]: {
            target: env.VITE_PROXY || "https://172.16.23.8:30844",
            changeOrigin: true,
            secure: false,
            rewrite: (p) => p.replace(new RegExp(`^${env.VITE_BASE_API || "/linkx/admin"}`), "/linkx/admin")
          }
        }
      }
    },
    build: {
      outDir: "dist",
      assetsDir: "static",
      sourcemap: mode !== "production",
      rollupOptions: {
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]",
          manualChunks: {
            "element-plus": ["element-plus", "@element-plus/icons-vue"],
            "vue-vendor": ["vue", "vue-router", "pinia", "vue-i18n"],
            utils: ["axios", "dayjs", "lodash-es", "crypto-js", "js-cookie", "qs"]
          }
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIiwgIm1vY2svcHJldmlldy1kYXRhLnRzIiwgIm1vY2svcHJldmlldy1tZW51LnRzIiwgIm1vY2svcHJldmlldy1zZXJ2ZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJGOlxcXFx3b3JrXFxcXGxpbmt4LWFkbWluXFxcXG90aGVyLWFkbWluXFxcXGFkbWluLXZ1ZTNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkY6XFxcXHdvcmtcXFxcbGlua3gtYWRtaW5cXFxcb3RoZXItYWRtaW5cXFxcYWRtaW4tdnVlM1xcXFx2aXRlLmNvbmZpZy5tdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Y6L3dvcmsvbGlua3gtYWRtaW4vb3RoZXItYWRtaW4vYWRtaW4tdnVlMy92aXRlLmNvbmZpZy5tdHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnO1xyXG5pbXBvcnQgQXV0b0ltcG9ydCBmcm9tICd1bnBsdWdpbi1hdXRvLWltcG9ydC92aXRlJztcclxuaW1wb3J0IENvbXBvbmVudHMgZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvdml0ZSc7XHJcbmltcG9ydCB7IEVsZW1lbnRQbHVzUmVzb2x2ZXIgfSBmcm9tICd1bnBsdWdpbi12dWUtY29tcG9uZW50cy9yZXNvbHZlcnMnO1xyXG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAnbm9kZTpwYXRoJztcclxuaW1wb3J0IHsgbW9ja1ByZXZpZXdQbHVnaW4gfSBmcm9tICcuL21vY2svcHJldmlldy1zZXJ2ZXInO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgYmFzZTogZW52LlZJVEVfUFVCTElDX1BBVEggfHwgJy8nLFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICAvLyBcdTY3MkNcdTU3MzBcdTdFQzRcdTRFRjZcdTVFOTNcdTRFMEVcdTVCQkZcdTRFM0JcdTUxNzFcdTRFQUJcdThGRDBcdTg4NENcdTY1RjZcdUZGMENcdTkwN0ZcdTUxNERcdTUzQ0NcdTRFRkQgVnVlL0VsZW1lbnQgUGx1cyBcdTZDRThcdTUxNjVcdTRFMEFcdTRFMEJcdTY1ODdcdTMwMDJcclxuICAgICAgZGVkdXBlOiBbJ3Z1ZScsICdlbGVtZW50LXBsdXMnXSxcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICAnQCc6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjJyksXHJcbiAgICAgICAgJyMnOiByZXNvbHZlKF9fZGlybmFtZSwgJ3R5cGVzJyksXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgcGx1Z2luczogW1xyXG4gICAgICAuLi4obW9kZSA9PT0gJ21vY2stcHJldmlldycgPyBbbW9ja1ByZXZpZXdQbHVnaW4oKV0gOiBbXSksXHJcbiAgICAgIHZ1ZSgpLFxyXG4gICAgICBBdXRvSW1wb3J0KHtcclxuICAgICAgICBpbXBvcnRzOiBbJ3Z1ZScsICd2dWUtcm91dGVyJywgJ3BpbmlhJ10sXHJcbiAgICAgICAgcmVzb2x2ZXJzOiBbRWxlbWVudFBsdXNSZXNvbHZlcigpXSxcclxuICAgICAgICBkdHM6ICd0eXBlcy9hdXRvLWltcG9ydHMuZC50cycsXHJcbiAgICAgICAgZXNsaW50cmM6IHsgZW5hYmxlZDogdHJ1ZSB9LFxyXG4gICAgICB9KSxcclxuICAgICAgQ29tcG9uZW50cyh7XHJcbiAgICAgICAgcmVzb2x2ZXJzOiBbRWxlbWVudFBsdXNSZXNvbHZlcigpXSxcclxuICAgICAgICBkdHM6ICd0eXBlcy9jb21wb25lbnRzLmQudHMnLFxyXG4gICAgICAgIGRpcnM6IFsnc3JjL2NvbXBvbmVudHMnXSxcclxuICAgICAgfSksXHJcbiAgICBdLFxyXG4gICAgY3NzOiB7XHJcbiAgICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcclxuICAgICAgICBsZXNzOiB7XHJcbiAgICAgICAgICBqYXZhc2NyaXB0RW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICAgIC8vIFx1NTE2OFx1NUM0MFx1NkNFOFx1NTE2NSB2YXJpYWJsZXMubGVzc1x1RkYwQ1x1OEJBOVx1NjI0MFx1NjcwOSAudnVlLy5sZXNzIFx1NjU4N1x1NEVGNlx1NzY4NCBzY29wZWQgc3R5bGVcclxuICAgICAgICAgIC8vIFx1NTNFRlx1NzZGNFx1NjNBNVx1NEY3Rlx1NzUyOCBAY29sb3ItKiAvIEBzcGFjaW5nLSogLyBAcmFkaXVzLSogXHU3QjQ5XHU4QkJFXHU4QkExXHU0RUU0XHU3MjRDXHJcbiAgICAgICAgICBhZGRpdGlvbmFsRGF0YTogYEBpbXBvcnQgXCJAL3N0eWxlcy92YXJpYWJsZXMubGVzc1wiO2AsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgcG9ydDogbW9kZSA9PT0gJ21vY2stcHJldmlldycgPyAzMDg0NyA6IDMwODQ1LFxyXG4gICAgICBvcGVuOiBmYWxzZSxcclxuICAgICAgLi4uKG1vZGUgPT09ICdtb2NrLXByZXZpZXcnXHJcbiAgICAgICAgPyB7fVxyXG4gICAgICAgIDoge1xyXG4gICAgICAgICAgICBwcm94eToge1xyXG4gICAgICAgICAgICAgIFtlbnYuVklURV9CQVNFX0FQSSB8fCAnL2xpbmt4L2FkbWluJ106IHtcclxuICAgICAgICAgICAgICAgIHRhcmdldDogZW52LlZJVEVfUFJPWFkgfHwgJ2h0dHBzOi8vMTcyLjE2LjIzLjg6MzA4NDQnLFxyXG4gICAgICAgICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHJld3JpdGU6IChwOiBzdHJpbmcpID0+XHJcbiAgICAgICAgICAgICAgICAgIHAucmVwbGFjZShuZXcgUmVnRXhwKGBeJHtlbnYuVklURV9CQVNFX0FQSSB8fCAnL2xpbmt4L2FkbWluJ31gKSwgJy9saW5reC9hZG1pbicpLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9KSxcclxuICAgIH0sXHJcbiAgICBidWlsZDoge1xyXG4gICAgICBvdXREaXI6ICdkaXN0JyxcclxuICAgICAgYXNzZXRzRGlyOiAnc3RhdGljJyxcclxuICAgICAgc291cmNlbWFwOiBtb2RlICE9PSAncHJvZHVjdGlvbicsXHJcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgIGNodW5rRmlsZU5hbWVzOiAnc3RhdGljL2pzL1tuYW1lXS1baGFzaF0uanMnLFxyXG4gICAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdzdGF0aWMvanMvW25hbWVdLVtoYXNoXS5qcycsXHJcbiAgICAgICAgICBhc3NldEZpbGVOYW1lczogJ3N0YXRpYy9bZXh0XS9bbmFtZV0tW2hhc2hdLltleHRdJyxcclxuICAgICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgICAnZWxlbWVudC1wbHVzJzogWydlbGVtZW50LXBsdXMnLCAnQGVsZW1lbnQtcGx1cy9pY29ucy12dWUnXSxcclxuICAgICAgICAgICAgJ3Z1ZS12ZW5kb3InOiBbJ3Z1ZScsICd2dWUtcm91dGVyJywgJ3BpbmlhJywgJ3Z1ZS1pMThuJ10sXHJcbiAgICAgICAgICAgIHV0aWxzOiBbJ2F4aW9zJywgJ2RheWpzJywgJ2xvZGFzaC1lcycsICdjcnlwdG8tanMnLCAnanMtY29va2llJywgJ3FzJ10sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH07XHJcbn0pO1xyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkY6XFxcXHdvcmtcXFxcbGlua3gtYWRtaW5cXFxcb3RoZXItYWRtaW5cXFxcYWRtaW4tdnVlM1xcXFxtb2NrXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJGOlxcXFx3b3JrXFxcXGxpbmt4LWFkbWluXFxcXG90aGVyLWFkbWluXFxcXGFkbWluLXZ1ZTNcXFxcbW9ja1xcXFxwcmV2aWV3LWRhdGEudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Y6L3dvcmsvbGlua3gtYWRtaW4vb3RoZXItYWRtaW4vYWRtaW4tdnVlMy9tb2NrL3ByZXZpZXctZGF0YS50c1wiO2ludGVyZmFjZSBQcmV2aWV3RGF0YVJlc3VsdCB7XHJcbiAgaGFuZGxlZDogYm9vbGVhbjtcclxuICBkYXRhPzogdW5rbm93bjtcclxufVxyXG5cclxuY29uc3Qgcm9sZXMgPSBbXHJcbiAge1xyXG4gICAgaWQ6ICdwcmV2aWV3LXJvbGUtYWRtaW4nLFxyXG4gICAgbmFtZTogJ1x1N0NGQlx1N0VERlx1N0JBMVx1NzQwNlx1NTQ1OCcsXHJcbiAgICBzdGF0dXM6IDEsXHJcbiAgICByZW1hcms6ICdcdTYyRTVcdTY3MDlcdTU0MEVcdTUzRjBcdTdCQTFcdTc0MDZcdTY3NDNcdTk2NTAnLFxyXG4gICAgZ210Q3JlYXRlZDogJzIwMjYtMDEtMTIgMDk6MzA6MDAnLFxyXG4gICAgaWNjUHJpdkpzb246IFtdLFxyXG4gICAgYWRtaW5Qcml2SnNvbjogWydwcmV2aWV3LW1lbnUtYWRtaW4nXSxcclxuICAgIGNhcHBQcml2SnNvbjogW10sXHJcbiAgICBvcmdQcml2TGlzdDogW3sgaWQ6ICdkZXB0LTAwMScsIG5hbWU6ICdcdTVFMDJcdTVDNDBcdTYzMDdcdTYzMjVcdTRFMkRcdTVGQzMnLCBjb2RlOiAnMzMwMTAwJyB9XSxcclxuICB9LFxyXG4gIHtcclxuICAgIGlkOiAncHJldmlldy1yb2xlLWR1dHknLFxyXG4gICAgbmFtZTogJ1x1NTAzQ1x1NzNFRFx1OEMwM1x1NUVBNlx1NTQ1OCcsXHJcbiAgICBzdGF0dXM6IDEsXHJcbiAgICByZW1hcms6ICdcdThEMUZcdThEMjNcdTUwM0NcdTczRURcdTRFMEVcdTUzNEZcdTU0MENcdTVDOTcnLFxyXG4gICAgZ210Q3JlYXRlZDogJzIwMjYtMDItMDMgMTQ6MTA6MDAnLFxyXG4gICAgaWNjUHJpdkpzb246IFtdLFxyXG4gICAgYWRtaW5Qcml2SnNvbjogW10sXHJcbiAgICBjYXBwUHJpdkpzb246IFtdLFxyXG4gICAgb3JnUHJpdkxpc3Q6IFt7IGlkOiAnZGVwdC0wMDInLCBuYW1lOiAnXHU0RTAwXHU3RUJGXHU2MzA3XHU2MzI1XHU5MEU4JywgY29kZTogJzMzMDEwMScgfV0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBpZDogJ3ByZXZpZXctcm9sZS1hdWRpdCcsXHJcbiAgICBuYW1lOiAnXHU0RkUxXHU2MDZGXHU1QkExXHU2ODM4XHU1NDU4JyxcclxuICAgIHN0YXR1czogMCxcclxuICAgIHJlbWFyazogJ1x1NTNFQVx1OEJGQlx1NUJBMVx1NjgzOFx1Njc0M1x1OTY1MCcsXHJcbiAgICBnbXRDcmVhdGVkOiAnMjAyNi0wMy0xOSAxMTo0NTowMCcsXHJcbiAgICBpY2NQcml2SnNvbjogW10sXHJcbiAgICBhZG1pblByaXZKc29uOiBbXSxcclxuICAgIGNhcHBQcml2SnNvbjogW10sXHJcbiAgICBvcmdQcml2TGlzdDogW10sXHJcbiAgfSxcclxuXTtcclxuXHJcbmNvbnN0IHBlb3BsZSA9IFtcclxuICB7XHJcbiAgICBpZDogJ3ByZXZpZXctdXNlci0wMDEnLFxyXG4gICAgbmFtZTogJ1x1NUYyMFx1NjY2OCcsXHJcbiAgICBpZENhcmQ6ICdNT0NLLUlELTAwMScsXHJcbiAgICBwaG9uZU51bTogJzEzODAwMDAwMDAxJyxcclxuICAgIGRlcGFydG1lbnROYW1lOiAnXHU1RTAyXHU1QzQwXHU2MzA3XHU2MzI1XHU0RTJEXHU1RkMzJyxcclxuICAgIGRlcGFydG1lbnRDb2RlOiAnMzMwMTAwJyxcclxuICAgIHN0YXR1czogMSxcclxuICB9LFxyXG4gIHtcclxuICAgIGlkOiAncHJldmlldy11c2VyLTAwMicsXHJcbiAgICBuYW1lOiAnXHU2NzRFXHU1QjgxJyxcclxuICAgIGlkQ2FyZDogJ01PQ0stSUQtMDAyJyxcclxuICAgIHBob25lTnVtOiAnMTM4MDAwMDAwMDInLFxyXG4gICAgZGVwYXJ0bWVudE5hbWU6ICdcdTRFMDBcdTdFQkZcdTYzMDdcdTYzMjVcdTkwRTgnLFxyXG4gICAgZGVwYXJ0bWVudENvZGU6ICczMzAxMDEnLFxyXG4gICAgc3RhdHVzOiAxLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgaWQ6ICdwcmV2aWV3LXVzZXItMDAzJyxcclxuICAgIG5hbWU6ICdcdTczOEJcdTY1NEYnLFxyXG4gICAgaWRDYXJkOiAnTU9DSy1JRC0wMDMnLFxyXG4gICAgcGhvbmVOdW06ICcxMzgwMDAwMDAwMycsXHJcbiAgICBkZXBhcnRtZW50TmFtZTogJ1x1NEZFMVx1NjA2Rlx1OTAxQVx1NEZFMVx1NjUyRlx1OTYxRicsXHJcbiAgICBkZXBhcnRtZW50Q29kZTogJzMzMDEwMicsXHJcbiAgICBzdGF0dXM6IDAsXHJcbiAgfSxcclxuXTtcclxuXHJcbmNvbnN0IGRlcGFydG1lbnRzID0gW1xyXG4gIHtcclxuICAgIGlkOiAnZGVwdC0wMDEnLFxyXG4gICAgY29kZTogJzMzMDEwMCcsXHJcbiAgICBuYW1lOiAnXHU1RTAyXHU1QzQwXHU2MzA3XHU2MzI1XHU0RTJEXHU1RkMzJyxcclxuICAgIHBhdGg6ICdcdTZENTlcdTZDNUZcdTc3MDEvXHU2NzZEXHU1RERFXHU1RTAyL1x1NUUwMlx1NUM0MFx1NjMwN1x1NjMyNVx1NEUyRFx1NUZDMycsXHJcbiAgICBjaGlsZHJlbjogW1xyXG4gICAgICB7IGlkOiAnZGVwdC0wMDInLCBjb2RlOiAnMzMwMTAxJywgbmFtZTogJ1x1NEUwMFx1N0VCRlx1NjMwN1x1NjMyNVx1OTBFOCcsIHBhdGg6ICdcdTZENTlcdTZDNUZcdTc3MDEvXHU2NzZEXHU1RERFXHU1RTAyL1x1NEUwMFx1N0VCRlx1NjMwN1x1NjMyNVx1OTBFOCcsIGNoaWxkcmVuOiBbXSB9LFxyXG4gICAgICB7IGlkOiAnZGVwdC0wMDMnLCBjb2RlOiAnMzMwMTAyJywgbmFtZTogJ1x1NEZFMVx1NjA2Rlx1OTAxQVx1NEZFMVx1NjUyRlx1OTYxRicsIHBhdGg6ICdcdTZENTlcdTZDNUZcdTc3MDEvXHU2NzZEXHU1RERFXHU1RTAyL1x1NEZFMVx1NjA2Rlx1OTAxQVx1NEZFMVx1NjUyRlx1OTYxRicsIGNoaWxkcmVuOiBbXSB9LFxyXG4gICAgXSxcclxuICB9LFxyXG5dO1xyXG5cclxuY29uc3QgZHV0eVR5cGVzID0gW1xyXG4gIHsgdHlwZTogJzAnLCBuYW1lOiAnXHU3NjdEXHU3M0VEJywgZ210Q3JlYXRlZDogJzIwMjYtMDEtMDEgMDg6MDA6MDAnIH0sXHJcbiAgeyB0eXBlOiAnMScsIG5hbWU6ICdcdTU5MUNcdTczRUQnLCBnbXRDcmVhdGVkOiAnMjAyNi0wMS0wMSAwODowMDowMCcgfSxcclxuICB7IHR5cGU6ICcyJywgbmFtZTogJ1x1NjczQVx1NTJBOFx1NzNFRCcsIGdtdENyZWF0ZWQ6ICcyMDI2LTAxLTAxIDA4OjAwOjAwJyB9LFxyXG5dO1xyXG5cclxuY29uc3QgY29sbGFib3JhdGlvbnMgPSBbXHJcbiAge1xyXG4gICAgaWQ6ICdwcmV2aWV3LXBvc3QtMDAxJyxcclxuICAgIHBvc3ROYW1lOiAnXHU1RTk0XHU2MDI1XHU2MzA3XHU2MzI1XHU1Qzk3JyxcclxuICAgIGljb25Vcmw6ICcnLFxyXG4gICAgdHlwZTogMSxcclxuICAgIHBvbGljZVRpY2tldFR5cGVzOiBbeyBpZDogJ3RpY2tldC0wMDEnLCB0YWc6ICdcdTZDQkJcdTVCODlcdThCNjZcdTYwQzUnIH1dLFxyXG4gICAgdGlja2V0VHlwZU5hbWVzOiAnXHU2Q0JCXHU1Qjg5XHU4QjY2XHU2MEM1JyxcclxuICAgIHR5cGVJZHM6IFsndGlja2V0LTAwMSddLFxyXG4gICAgb3JnSWQ6ICdkZXB0LTAwMScsXHJcbiAgICBvcmdOYW1lOiAnXHU1RTAyXHU1QzQwXHU2MzA3XHU2MzI1XHU0RTJEXHU1RkMzJyxcclxuICAgIG9yZ0NvZGU6ICczMzAxMDAnLFxyXG4gICAgcmVsYXRlZFVzZXJJZHM6IFsncHJldmlldy11c2VyLTAwMScsICdwcmV2aWV3LXVzZXItMDAyJ10sXHJcbiAgICByZWxhdGVkVXNlck5hbWVzOiAnXHU1RjIwXHU2NjY4XHUzMDAxXHU2NzRFXHU1QjgxJyxcclxuICAgIG9wZXJhdG9yTmFtZTogJ01vY2tcdTdCQTFcdTc0MDZcdTU0NTgnLFxyXG4gICAgc291cmNlOiAxLFxyXG4gICAgdXBkYXRlVGltZTogJzIwMjYtMDktMjUgMTA6MzA6MDAnLFxyXG4gICAgY3JlYXRlVGltZTogJzIwMjYtMDEtMTAgMDk6MDA6MDAnLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgaWQ6ICdwcmV2aWV3LXBvc3QtMDAyJyxcclxuICAgIHBvc3ROYW1lOiAnXHU1REUxXHU5MDNCXHU4MDU0XHU3RURDXHU1Qzk3JyxcclxuICAgIGljb25Vcmw6ICcnLFxyXG4gICAgdHlwZTogMixcclxuICAgIHBvbGljZVRpY2tldFR5cGVzOiBbeyBpZDogJ3RpY2tldC0wMDInLCB0YWc6ICdcdTVERTFcdTkwM0JcdTUyQThcdTYwMDEnIH1dLFxyXG4gICAgdGlja2V0VHlwZU5hbWVzOiAnXHU1REUxXHU5MDNCXHU1MkE4XHU2MDAxJyxcclxuICAgIHR5cGVJZHM6IFsndGlja2V0LTAwMiddLFxyXG4gICAgb3JnSWQ6ICdkZXB0LTAwMicsXHJcbiAgICBvcmdOYW1lOiAnXHU0RTAwXHU3RUJGXHU2MzA3XHU2MzI1XHU5MEU4JyxcclxuICAgIG9yZ0NvZGU6ICczMzAxMDEnLFxyXG4gICAgcmVsYXRlZFVzZXJJZHM6IFsncHJldmlldy11c2VyLTAwMyddLFxyXG4gICAgcmVsYXRlZFVzZXJOYW1lczogJ1x1NzM4Qlx1NjU0RicsXHJcbiAgICBvcGVyYXRvck5hbWU6ICdNb2NrXHU3QkExXHU3NDA2XHU1NDU4JyxcclxuICAgIHNvdXJjZTogMSxcclxuICAgIHVwZGF0ZVRpbWU6ICcyMDI2LTA5LTI0IDE2OjIwOjAwJyxcclxuICAgIGNyZWF0ZVRpbWU6ICcyMDI2LTAyLTE1IDEzOjE1OjAwJyxcclxuICB9LFxyXG5dO1xyXG5cclxuY29uc3QgcHJldmlld0xhYmVscyA9IFtcclxuICB7XHJcbiAgICBpZDogJ3ByZXZpZXctbGFiZWwtMDAxJyxcclxuICAgIG5hbWU6ICdcdTUyRTRcdTUyQTFcdTY4MDdcdTdCN0UnLFxyXG4gICAgdHlwZTogMSxcclxuICAgIHNjb3BlOiAxLFxyXG4gICAgaWNvbjogJ2ZhcyBmYS1iZWxsJyxcclxuICAgIGNvbG9yOiAnIzQwOWVmZicsXHJcbiAgICBwYXJlbnRJZDogJzAnLFxyXG4gICAgbGV2ZWw6IDEsXHJcbiAgICBjaGlsZHJlbjogW1xyXG4gICAgICB7IGlkOiAncHJldmlldy1sYWJlbC0wMDInLCBuYW1lOiAnXHU5MUNEXHU3MEI5XHU1REUxXHU5MDNCJywgdHlwZTogMSwgc2NvcGU6IDEsIHBhcmVudElkOiAncHJldmlldy1sYWJlbC0wMDEnLCBsZXZlbDogMiB9LFxyXG4gICAgXSxcclxuICB9LFxyXG4gIHtcclxuICAgIGlkOiAncHJldmlldy1sYWJlbC0wMDMnLFxyXG4gICAgbmFtZTogJ1x1NTM0Rlx1NTQwQ1x1NjgwN1x1N0I3RScsXHJcbiAgICB0eXBlOiAyLFxyXG4gICAgc2NvcGU6IDIsXHJcbiAgICBpY29uOiAnZmFzIGZhLXVzZXJzJyxcclxuICAgIGNvbG9yOiAnIzY3YzIzYScsXHJcbiAgICBwYXJlbnRJZDogJzAnLFxyXG4gICAgbGV2ZWw6IDEsXHJcbiAgICBjaGlsZHJlbjogW10sXHJcbiAgfSxcclxuXTtcclxuXHJcbmNvbnN0IHNjaGVkdWxlcyA9IFtcclxuICB7XHJcbiAgICBpZDogJ3ByZXZpZXctc2NoZWR1bGUtMDAxJyxcclxuICAgIHVzZXJJZDogJ3ByZXZpZXctdXNlci0wMDEnLFxyXG4gICAgdXNlck5hbWU6ICdcdTVGMjBcdTY2NjgnLFxyXG4gICAgZGVwYXJ0bWVudE5hbWU6ICdcdTVFMDJcdTVDNDBcdTYzMDdcdTYzMjVcdTRFMkRcdTVGQzMnLFxyXG4gICAgcG9zdE5hbWU6ICdcdTVFOTRcdTYwMjVcdTYzMDdcdTYzMjVcdTVDOTcnLFxyXG4gICAgZHV0eVR5cGU6ICcwJyxcclxuICAgIGR1dHlUeXBlTmFtZTogJ1x1NzY3RFx1NzNFRCcsXHJcbiAgICBkdXR5U3RhcnREYXRlOiAnMjAyNi0wOS0yNicsXHJcbiAgICBkdXR5U3RhcnRUaW1lOiAnMDg6MDA6MDAnLFxyXG4gICAgZHV0eUVuZERhdGU6ICcyMDI2LTA5LTI2JyxcclxuICAgIGR1dHlFbmRUaW1lOiAnMjA6MDA6MDAnLFxyXG4gICAgZHV0eUNvbnRlbnQ6ICdcdTYzMDdcdTYzMjVcdTU5MjdcdTUzODVcdTUwM0NcdTVCODgnLFxyXG4gICAgaW1wb3J0VXNlck5hbWU6ICdNb2NrXHU3QkExXHU3NDA2XHU1NDU4JyxcclxuICB9LFxyXG4gIHtcclxuICAgIGlkOiAncHJldmlldy1zY2hlZHVsZS0wMDInLFxyXG4gICAgdXNlcklkOiAncHJldmlldy11c2VyLTAwMicsXHJcbiAgICB1c2VyTmFtZTogJ1x1Njc0RVx1NUI4MScsXHJcbiAgICBkZXBhcnRtZW50TmFtZTogJ1x1NEUwMFx1N0VCRlx1NjMwN1x1NjMyNVx1OTBFOCcsXHJcbiAgICBwb3N0TmFtZTogJ1x1NURFMVx1OTAzQlx1ODA1NFx1N0VEQ1x1NUM5NycsXHJcbiAgICBkdXR5VHlwZTogJzEnLFxyXG4gICAgZHV0eVR5cGVOYW1lOiAnXHU1OTFDXHU3M0VEJyxcclxuICAgIGR1dHlTdGFydERhdGU6ICcyMDI2LTA5LTI2JyxcclxuICAgIGR1dHlTdGFydFRpbWU6ICcyMDowMDowMCcsXHJcbiAgICBkdXR5RW5kRGF0ZTogJzIwMjYtMDktMjcnLFxyXG4gICAgZHV0eUVuZFRpbWU6ICcwODowMDowMCcsXHJcbiAgICBkdXR5Q29udGVudDogJ1x1NTkxQ1x1OTVGNFx1ODA1NFx1NTJBOFx1NTAzQ1x1NUI4OCcsXHJcbiAgICBpbXBvcnRVc2VyTmFtZTogJ01vY2tcdTdCQTFcdTc0MDZcdTU0NTgnLFxyXG4gIH0sXHJcbl07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFByZXZpZXdUaGlyZEFwcCB7XHJcbiAgaWQ6IHN0cmluZztcclxuICBjbGllbnROYW1lOiBzdHJpbmc7XHJcbiAgc3lzdGVtTmFtZTogc3RyaW5nO1xyXG4gIGNsaWVudElkOiBzdHJpbmc7XHJcbiAgY2xpZW50U2VjcmV0OiBzdHJpbmc7XHJcbiAgY2xpZW50VHlwZTogc3RyaW5nO1xyXG4gIHRva2VuVGltZTogbnVtYmVyO1xyXG4gIHJlZnJlc2hUb2tlblRpbWU6IG51bWJlcjtcclxuICBzdGF0dXM6IG51bWJlcjtcclxuICBleHBpcmVkOiBzdHJpbmc7XHJcbiAgcmVtYXJrOiBzdHJpbmc7XHJcbiAgZ3JhbnRUaW1lOiBzdHJpbmc7XHJcbiAgZ3JhbnRVc2VyTmFtZTogc3RyaW5nO1xyXG4gIGdtdENyZWF0ZWQ6IHN0cmluZztcclxuICBnbXRNb2RpZmllZDogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgcHJldmlld1RoaXJkQXBwczogUHJldmlld1RoaXJkQXBwW10gPSBbXHJcbiAge1xyXG4gICAgaWQ6ICdwcmV2aWV3LWNsaWVudC0wMDEnLFxyXG4gICAgY2xpZW50TmFtZTogJ1x1NzcwMVx1N0VBN1x1NjBDNVx1NjJBNVx1NTE3MVx1NEVBQlx1NUU3M1x1NTNGMCcsXHJcbiAgICBzeXN0ZW1OYW1lOiAnXHU3NzAxXHU3RUE3XHU2MEM1XHU2MkE1XHU1MTcxXHU0RUFCXHU1RTczXHU1M0YwJyxcclxuICAgIGNsaWVudElkOiAnY2xpZW50LXByZXZpZXctZHV0eScsXHJcbiAgICBjbGllbnRTZWNyZXQ6ICdwcmV2LXNlY3JldC0wMDEnLFxyXG4gICAgY2xpZW50VHlwZTogJzEnLFxyXG4gICAgdG9rZW5UaW1lOiAyNCxcclxuICAgIHJlZnJlc2hUb2tlblRpbWU6IDcsXHJcbiAgICBzdGF0dXM6IDEsXHJcbiAgICBleHBpcmVkOiAnMjAyNy0xMi0zMSAyMzo1OTo1OScsXHJcbiAgICByZW1hcms6ICdcdTc1MjhcdTRFOEVcdTVFMDJcdTdFQTdcdTUzNEZcdTU0MENcdTY1NzBcdTYzNkVcdTUxNzFcdTRFQUJcdTc2ODRcdTY3MkNcdTU3MzBcdTZGMTRcdTc5M0FcdTkxNERcdTdGNkUnLFxyXG4gICAgZ3JhbnRUaW1lOiAnMjAyNi0wNi0wMyAxMDoxNTowMCcsXHJcbiAgICBncmFudFVzZXJOYW1lOiAnTW9ja1x1N0JBMVx1NzQwNlx1NTQ1OCcsXHJcbiAgICBnbXRDcmVhdGVkOiAnMjAyNi0wNC0wMyAwOTowMDowMCcsXHJcbiAgICBnbXRNb2RpZmllZDogJzIwMjYtMDYtMDMgMTA6MTU6MDAnLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgaWQ6ICdwcmV2aWV3LWNsaWVudC0wMDInLFxyXG4gICAgY2xpZW50TmFtZTogJ1x1OEI2Nlx1NjBDNVx1ODA1NFx1NTJBOFx1NUU3M1x1NTNGMCcsXHJcbiAgICBzeXN0ZW1OYW1lOiAnXHU4QjY2XHU2MEM1XHU4MDU0XHU1MkE4XHU1RTczXHU1M0YwJyxcclxuICAgIGNsaWVudElkOiAnY2xpZW50LXByZXZpZXctYWxlcnQnLFxyXG4gICAgY2xpZW50U2VjcmV0OiAncHJldi1zZWNyZXQtMDAyJyxcclxuICAgIGNsaWVudFR5cGU6ICcxJyxcclxuICAgIHRva2VuVGltZTogMTIsXHJcbiAgICByZWZyZXNoVG9rZW5UaW1lOiAzLFxyXG4gICAgc3RhdHVzOiAxLFxyXG4gICAgZXhwaXJlZDogJzIwMjctMDgtMjAgMTg6MDA6MDAnLFxyXG4gICAgcmVtYXJrOiAnXHU3NTI4XHU0RThFXHU2M0E1XHU2NTM2XHU4QjY2XHU2MEM1XHU4MDU0XHU1MkE4XHU0RkUxXHU2MDZGJyxcclxuICAgIGdyYW50VGltZTogJzIwMjYtMDUtMTggMTU6MzA6MDAnLFxyXG4gICAgZ3JhbnRVc2VyTmFtZTogJ01vY2tcdTdCQTFcdTc0MDZcdTU0NTgnLFxyXG4gICAgZ210Q3JlYXRlZDogJzIwMjYtMDItMTggMTQ6MjA6MDAnLFxyXG4gICAgZ210TW9kaWZpZWQ6ICcyMDI2LTA1LTE4IDE1OjMwOjAwJyxcclxuICB9LFxyXG4gIHtcclxuICAgIGlkOiAncHJldmlldy1jbGllbnQtMDAzJyxcclxuICAgIGNsaWVudE5hbWU6ICdcdTU3Q0VcdTVFMDJcdTg5QzZcdTk4OTFcdThENDRcdTZFOTBcdTRFMkRcdTVGQzMnLFxyXG4gICAgc3lzdGVtTmFtZTogJ1x1NTdDRVx1NUUwMlx1ODlDNlx1OTg5MVx1OEQ0NFx1NkU5MFx1NEUyRFx1NUZDMycsXHJcbiAgICBjbGllbnRJZDogJ2NsaWVudC1wcmV2aWV3LXZpZGVvJyxcclxuICAgIGNsaWVudFNlY3JldDogJ3ByZXYtc2VjcmV0LTAwMycsXHJcbiAgICBjbGllbnRUeXBlOiAnMScsXHJcbiAgICB0b2tlblRpbWU6IDgsXHJcbiAgICByZWZyZXNoVG9rZW5UaW1lOiAyLFxyXG4gICAgc3RhdHVzOiAwLFxyXG4gICAgZXhwaXJlZDogJzIwMjYtMTItMzEgMjM6NTk6NTknLFxyXG4gICAgcmVtYXJrOiAnXHU2RjE0XHU3OTNBXHU1MDVDXHU3NTI4XHU3MkI2XHU2MDAxXHUzMDAxXHU2NzA5XHU2NTQ4XHU2NzFGXHU1NDhDXHU2Mzg4XHU2NzQzXHU0RkUxXHU2MDZGJyxcclxuICAgIGdyYW50VGltZTogJzIwMjYtMDQtMjYgMTE6NDA6MDAnLFxyXG4gICAgZ3JhbnRVc2VyTmFtZTogJ01vY2tcdTUwM0NcdTczRURcdTU0NTgnLFxyXG4gICAgZ210Q3JlYXRlZDogJzIwMjYtMDEtMjYgMDg6NDA6MDAnLFxyXG4gICAgZ210TW9kaWZpZWQ6ICcyMDI2LTA0LTI2IDExOjQwOjAwJyxcclxuICB9LFxyXG5dO1xyXG5cclxuY29uc3Qgc2FtcGxlVXNlclBhZ2UgPSAodXJsOiBVUkwsIGJvZHk6IHVua25vd24pID0+IHBhZ2luYXRlKHBlb3BsZSwgdXJsLCBib2R5KTtcclxuXHJcbmZ1bmN0aW9uIGFzUmVjb3JkKHZhbHVlOiB1bmtub3duKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xyXG4gIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KHZhbHVlKSA/ICh2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgOiB7fTtcclxufVxyXG5cclxuZnVuY3Rpb24gcG9zaXRpdmVJbnRlZ2VyKHZhbHVlOiB1bmtub3duLCBmYWxsYmFjazogbnVtYmVyKTogbnVtYmVyIHtcclxuICBjb25zdCBudW1iZXIgPSBOdW1iZXIodmFsdWUpO1xyXG4gIHJldHVybiBOdW1iZXIuaXNJbnRlZ2VyKG51bWJlcikgJiYgbnVtYmVyID4gMCA/IG51bWJlciA6IGZhbGxiYWNrO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYWdpbmF0ZShyZWNvcmRzOiB1bmtub3duW10sIHVybDogVVJMLCBib2R5OiB1bmtub3duKTogeyByZWNvcmRzOiB1bmtub3duW107IHRvdGFsOiBudW1iZXIgfSB7XHJcbiAgY29uc3QgaW5wdXQgPSBhc1JlY29yZChib2R5KTtcclxuICBjb25zdCBwYWdlTnVtID0gcG9zaXRpdmVJbnRlZ2VyKFxyXG4gICAgdXJsLnNlYXJjaFBhcmFtcy5nZXQoJ3BhZ2VOdW0nKSA/P1xyXG4gICAgICB1cmwuc2VhcmNoUGFyYW1zLmdldCgnY3VycmVudCcpID8/XHJcbiAgICAgIHVybC5zZWFyY2hQYXJhbXMuZ2V0KCdwYWdlJykgPz9cclxuICAgICAgaW5wdXQucGFnZU51bSA/P1xyXG4gICAgICBpbnB1dC5jdXJyZW50ID8/XHJcbiAgICAgIGlucHV0LnBhZ2UsXHJcbiAgICAxLFxyXG4gICk7XHJcbiAgY29uc3QgcGFnZVNpemUgPSBwb3NpdGl2ZUludGVnZXIoXHJcbiAgICB1cmwuc2VhcmNoUGFyYW1zLmdldCgncGFnZVNpemUnKSA/PyB1cmwuc2VhcmNoUGFyYW1zLmdldCgnc2l6ZScpID8/IGlucHV0LnBhZ2VTaXplID8/IGlucHV0LnNpemUsXHJcbiAgICByZWNvcmRzLmxlbmd0aCB8fCAxMCxcclxuICApO1xyXG4gIGNvbnN0IHN0YXJ0ID0gKHBhZ2VOdW0gLSAxKSAqIHBhZ2VTaXplO1xyXG4gIHJldHVybiB7IHJlY29yZHM6IHJlY29yZHMuc2xpY2Uoc3RhcnQsIHN0YXJ0ICsgcGFnZVNpemUpLCB0b3RhbDogcmVjb3Jkcy5sZW5ndGggfTtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlZChkYXRhOiB1bmtub3duKTogUHJldmlld0RhdGFSZXN1bHQge1xyXG4gIHJldHVybiB7IGhhbmRsZWQ6IHRydWUsIGRhdGE6IHN0cnVjdHVyZWRDbG9uZShkYXRhKSB9O1xyXG59XHJcblxyXG4vKiogXHU4RkQ0XHU1NkRFXHU0RjlEXHU2MzZFIFZ1ZTMgQVBJIFx1N0M3Qlx1NTc4Qlx1NjU3NFx1NzQwNlx1NzY4NFx1NjcyQ1x1NTczMFx1NTNFQVx1OEJGQlx1NjgzN1x1NEY4Qlx1RkYxQlx1NkNBMVx1NjcwOVx1OTE0RFx1N0Y2RVx1NzY4NFx1NjNBNVx1NTNFM1x1N0VFN1x1N0VFRFx1NzUzMVx1OTg4NFx1ODlDOFx1NjcwRFx1NTJBMVx1OEZENFx1NTZERSA1MDFcdTMwMDIgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFByZXZpZXdEYXRhKG1ldGhvZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIHVybDogVVJMLCBib2R5OiB1bmtub3duKTogUHJldmlld0RhdGFSZXN1bHQge1xyXG4gIGNvbnN0IHJlYWRNZXRob2QgPSBtZXRob2QgPT09ICdHRVQnIHx8IG1ldGhvZCA9PT0gJ1BPU1QnO1xyXG5cclxuICBpZiAobWV0aG9kID09PSAnUE9TVCcgJiYgcGF0aCA9PT0gJy9hcGkvZ2xvYmFscy9saXN0Jykge1xyXG4gICAgcmV0dXJuIGhhbmRsZWQoW1xyXG4gICAgICB7IGlkOiAncHJldmlldy1nbG9iYWwtMDAxJywgbmFtZTogJ0RVVFlfU0NIRURVTEVfRU5BQkxFJywgdmFsdWU6ICcxJywgcmVtYXJrOiAnXHU1RjAwXHU2NTNFXHU2MzkyXHU3M0VEXHU0RkUxXHU2MDZGXHU4M0RDXHU1MzU1Jywgc3RhdHVzOiAxIH0sXHJcbiAgICAgIHsgaWQ6ICdwcmV2aWV3LWdsb2JhbC0wMDInLCBuYW1lOiAnRURHRUdBVEVXQVlfQlJFQUtFUicsIHZhbHVlOiAnMScsIHJlbWFyazogJ1x1OEZCOVx1N0YxOFx1N0Y1MVx1NTE3M1x1NTI5Rlx1ODBGRFx1NUYwMFx1NTE3MycsIHN0YXR1czogMSB9LFxyXG4gICAgICB7IGlkOiAncHJldmlldy1nbG9iYWwtMDAzJywgbmFtZTogJ0NBUl9CUkVBS0VSJywgdmFsdWU6ICcxJywgcmVtYXJrOiAnXHU4RjY2XHU4Rjg2XHU1MjlGXHU4MEZEXHU1RjAwXHU1MTczJywgc3RhdHVzOiAxIH0sXHJcbiAgICAgIHsgaWQ6ICdwcmV2aWV3LWdsb2JhbC0wMDQnLCBuYW1lOiAnQ1VTVE9NSVpFRF9MQVlFUicsIHZhbHVlOiAnMScsIHJlbWFyazogJ1x1ODFFQVx1NUI5QVx1NEU0OVx1NTZGRVx1NUM0Mlx1NUYwMFx1NTE3MycsIHN0YXR1czogMSB9LFxyXG4gICAgXSk7XHJcbiAgfVxyXG4gIGlmIChtZXRob2QgPT09ICdQT1NUJyAmJiBwYXRoID09PSAnL2Jhc2UvdjEvZ2xvYmFscy9nZXRHbG9iYWxzTGlzdCcpIHtcclxuICAgIHJldHVybiBoYW5kbGVkKHtcclxuICAgICAgU1lTVEVNX05BTUU6ICdMaW5rWCBcdTY3MkNcdTU3MzBcdTk4ODRcdTg5QzgnLFxyXG4gICAgICBBTExPV19TSU1QTEVfUEFTU1dPUkQ6ICcxJyxcclxuICAgICAgREVQQVJUTUVOVF9TWU5DX1NJR046ICcwJyxcclxuICAgICAgRFVUWV9TQ0hFRFVMRV9FTkFCTEU6ICcxJyxcclxuICAgICAgRURHRUdBVEVXQVlfQlJFQUtFUjogJzEnLFxyXG4gICAgICBDQVJfQlJFQUtFUjogJzEnLFxyXG4gICAgICBDVVNUT01JWkVEX0xBWUVSOiAnMScsXHJcbiAgICAgIFNVUEVSU0VUX1NFUlZFUl9VUkw6ICcnLFxyXG4gICAgICBTVVBFUlNFVF9TRVJWRVJfVVJMX0hUVFA6ICcnLFxyXG4gICAgICBDT05GSUdfREVWSUNFX0dCOiAncHJldmlldy1kZXZpY2UnLFxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIGlmIChwYXRoID09PSAnL2FwaS9yb2xlJyAmJiBtZXRob2QgPT09ICdHRVQnKSByZXR1cm4gaGFuZGxlZChwYWdpbmF0ZShyb2xlcywgdXJsLCBib2R5KSk7XHJcbiAgaWYgKHBhdGggPT09ICcvYXV0aC92MS91c2VyL3BhZ2UnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHJldHVybiBoYW5kbGVkKHNhbXBsZVVzZXJQYWdlKHVybCwgYm9keSkpO1xyXG4gIGlmIChwYXRoID09PSAnL2F1dGgvdjEvdXNlci9hZG1pbnVzZXIvcGFnZScgJiYgbWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgcmV0dXJuIGhhbmRsZWQoXHJcbiAgICAgIHBhZ2luYXRlKFxyXG4gICAgICAgIFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgaWQ6ICdwcmV2aWV3LWFkbWluLTAwMScsXHJcbiAgICAgICAgICAgIGlkQ2FyZDogJ2FkbWluLnByZXZpZXcnLFxyXG4gICAgICAgICAgICBzdGF0dXM6IDAsXHJcbiAgICAgICAgICAgIGdtdENyZWF0ZWQ6ICcyMDI2LTAxLTEyIDA5OjMwOjAwJyxcclxuICAgICAgICAgICAgb3JnSWRzOiBbJ2RlcHQtMDAxJ10sXHJcbiAgICAgICAgICAgIG9yZ0xpc3Q6IFt7IGlkOiAnZGVwdC0wMDEnLCBuYW1lOiAnXHU1RTAyXHU1QzQwXHU2MzA3XHU2MzI1XHU0RTJEXHU1RkMzJyB9XSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAncHJldmlldy1hZG1pbi0wMDInLFxyXG4gICAgICAgICAgICBpZENhcmQ6ICdkdXR5LnByZXZpZXcnLFxyXG4gICAgICAgICAgICBzdGF0dXM6IDAsXHJcbiAgICAgICAgICAgIGdtdENyZWF0ZWQ6ICcyMDI2LTAyLTAzIDE0OjEwOjAwJyxcclxuICAgICAgICAgICAgb3JnSWRzOiBbJ2RlcHQtMDAyJ10sXHJcbiAgICAgICAgICAgIG9yZ0xpc3Q6IFt7IGlkOiAnZGVwdC0wMDInLCBuYW1lOiAnXHU0RTAwXHU3RUJGXHU2MzA3XHU2MzI1XHU5MEU4JyB9XSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICB1cmwsXHJcbiAgICAgICAgYm9keSxcclxuICAgICAgKSxcclxuICAgICk7XHJcbiAgfVxyXG4gIGlmIChwYXRoID09PSAnL2F1dGgvdjEvY3VzdG9tLWRlcGFydG1lbnQvdHJlZScgJiYgcmVhZE1ldGhvZCkgcmV0dXJuIGhhbmRsZWQoZGVwYXJ0bWVudHMpO1xyXG4gIGlmIChwYXRoID09PSAnL2F1dGgvdjEvY3VzdG9tLWRlcGFydG1lbnQvbm9kZScgJiYgcmVhZE1ldGhvZCkge1xyXG4gICAgcmV0dXJuIGhhbmRsZWQoW1xyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6ICdub2RlLTAwMScsXHJcbiAgICAgICAgb3JnSWQ6ICdkZXB0LTAwMScsXHJcbiAgICAgICAgcGFyZW50SWQ6ICdkZXB0LTAwMScsXHJcbiAgICAgICAgY29kZTogJzMzMDEwMScsXHJcbiAgICAgICAgbmFtZTogJ1x1NEUwMFx1N0VCRlx1NjMwN1x1NjMyNVx1OTBFOCcsXHJcbiAgICAgICAgcGF0aDogJ1x1NUUwMlx1NUM0MFx1NjMwN1x1NjMyNVx1NEUyRFx1NUZDMy9cdTRFMDBcdTdFQkZcdTYzMDdcdTYzMjVcdTkwRTgnLFxyXG4gICAgICAgIHNvcnQ6IDEsXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogJ25vZGUtMDAyJyxcclxuICAgICAgICBvcmdJZDogJ2RlcHQtMDAxJyxcclxuICAgICAgICBwYXJlbnRJZDogJ2RlcHQtMDAxJyxcclxuICAgICAgICBjb2RlOiAnMzMwMTAyJyxcclxuICAgICAgICBuYW1lOiAnXHU0RkUxXHU2MDZGXHU5MDFBXHU0RkUxXHU2NTJGXHU5NjFGJyxcclxuICAgICAgICBwYXRoOiAnXHU1RTAyXHU1QzQwXHU2MzA3XHU2MzI1XHU0RTJEXHU1RkMzL1x1NEZFMVx1NjA2Rlx1OTAxQVx1NEZFMVx1NjUyRlx1OTYxRicsXHJcbiAgICAgICAgc29ydDogMixcclxuICAgICAgfSxcclxuICAgIF0pO1xyXG4gIH1cclxuICBpZiAocGF0aC5zdGFydHNXaXRoKCcvYXV0aC92MS9jdXN0b20tZGVwYXJ0bWVudC9ub2RlLycpICYmIHBhdGguZW5kc1dpdGgoJy91c2VyJykgJiYgbWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgcmV0dXJuIGhhbmRsZWQocGFnaW5hdGUocGVvcGxlLCB1cmwsIGJvZHkpKTtcclxuICB9XHJcbiAgaWYgKHBhdGguc3RhcnRzV2l0aCgnL2F1dGgvdjEvY3VzdG9tLWRlcGFydG1lbnQvbm9kZS8nKSAmJiBwYXRoLmVuZHNXaXRoKCcvYXZhaWxhYmxlLXVzZXInKSAmJiBtZXRob2QgPT09ICdHRVQnKSB7XHJcbiAgICByZXR1cm4gaGFuZGxlZChwYWdpbmF0ZShwZW9wbGUsIHVybCwgYm9keSkpO1xyXG4gIH1cclxuXHJcbiAgaWYgKHBhdGguc3RhcnRzV2l0aCgnL2FwaS9tYXAvJykgJiYgbWV0aG9kID09PSAnUE9TVCcpIHtcclxuICAgIGlmIChwYXRoID09PSAnL2FwaS9tYXAvc2VsZWN0UGFnZU1hcCcpIHtcclxuICAgICAgcmV0dXJuIGhhbmRsZWQoXHJcbiAgICAgICAgcGFnaW5hdGUoXHJcbiAgICAgICAgICBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBpZDogJ3ByZXZpZXctbWFwLTAwMScsXHJcbiAgICAgICAgICAgICAgbmFtZTogJ1x1NUUwMlx1NTMzQVx1NTdGQVx1Nzg0MFx1NTczMFx1NTZGRScsXHJcbiAgICAgICAgICAgICAgbWFwVHlwZTogJ0FNYXAnLFxyXG4gICAgICAgICAgICAgIHR5cGU6IDAsXHJcbiAgICAgICAgICAgICAgYWN0aXZhdGlvbjogMSxcclxuICAgICAgICAgICAgICBjb25maWd1cmF0aW9uOiAne1wiY2VudGVyXCI6WzEyMC4xNTUxLDMwLjI3NDFdLFwiem9vbVwiOjExfScsXHJcbiAgICAgICAgICAgICAgZ210Q3JlYXRlZDogJzIwMjYtMDQtMTIgMTA6MDA6MDAnLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgaWQ6ICdwcmV2aWV3LW1hcC0wMDInLFxyXG4gICAgICAgICAgICAgIG5hbWU6ICdcdTVFOTRcdTYwMjVcdTRFMTNcdTk4OThcdTU3MzBcdTU2RkUnLFxyXG4gICAgICAgICAgICAgIG1hcFR5cGU6ICdBcmNnaXMnLFxyXG4gICAgICAgICAgICAgIHR5cGU6IDEsXHJcbiAgICAgICAgICAgICAgYWN0aXZhdGlvbjogMCxcclxuICAgICAgICAgICAgICBjb25maWd1cmF0aW9uOiAne1wibGF5ZXJcIjpcImVtZXJnZW5jeVwifScsXHJcbiAgICAgICAgICAgICAgZ210Q3JlYXRlZDogJzIwMjYtMDUtMTggMTU6MzA6MDAnLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIHVybCxcclxuICAgICAgICAgIGJvZHksXHJcbiAgICAgICAgKSxcclxuICAgICAgKTtcclxuICAgIH1cclxuICAgIGlmIChwYXRoID09PSAnL2FwaS9tYXAvc2VsZWN0UGFnZUJhc2VNYXAnKSB7XHJcbiAgICAgIHJldHVybiBoYW5kbGVkKFxyXG4gICAgICAgIHBhZ2luYXRlKFxyXG4gICAgICAgICAgW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgaWQ6ICdwcmV2aWV3LWJhc2VtYXAtMDAxJyxcclxuICAgICAgICAgICAgICBuYW1lOiAnXHU1RTAyXHU1MzNBXHU3N0UyXHU5MUNGXHU1RTk1XHU1NkZFJyxcclxuICAgICAgICAgICAgICBzaXplOiAnMTguNiBNQicsXHJcbiAgICAgICAgICAgICAgY3JlYXRlZDogJzIwMjYtMDYtMDIgMDk6MDA6MDAnLFxyXG4gICAgICAgICAgICAgIHRpbGVzOiAnL21vY2svdGlsZXMvY2l0eS97en0ve3h9L3t5fS5wbmcnLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgaWQ6ICdwcmV2aWV3LWJhc2VtYXAtMDAyJyxcclxuICAgICAgICAgICAgICBuYW1lOiAnXHU1RTk0XHU2MDI1XHU0RTEzXHU5ODk4XHU1RTk1XHU1NkZFJyxcclxuICAgICAgICAgICAgICBzaXplOiAnMzIuMSBNQicsXHJcbiAgICAgICAgICAgICAgY3JlYXRlZDogJzIwMjYtMDYtMTggMTM6NDA6MDAnLFxyXG4gICAgICAgICAgICAgIHRpbGVzOiAnL21vY2svdGlsZXMvZW1lcmdlbmN5L3t6fS97eH0ve3l9LnBuZycsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgdXJsLFxyXG4gICAgICAgICAgYm9keSxcclxuICAgICAgICApLFxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gICAgaWYgKHBhdGggPT09ICcvYXBpL21hcC9zZWxlY3RMaXN0R2VvJykge1xyXG4gICAgICBjb25zdCB0eXBlID0gYXNSZWNvcmQoYm9keSkudHlwZTtcclxuICAgICAgY29uc3Qgb3B0aW9ucyA9XHJcbiAgICAgICAgdHlwZSA9PT0gJ2ludmVyc2Vjb2RlJyA/IFsnXHU5QUQ4XHU1RkI3XHU5MDA2XHU1NzMwXHU3NDA2XHU3RjE2XHU3ODAxJ10gOiB0eXBlID09PSAncG9pJyA/IFsnXHU5QUQ4XHU1RkI3XHU1NzMwXHU3MEI5XHU2OEMwXHU3RDIyJ10gOiBbJ1x1OUFEOFx1NUZCN1x1NTczMFx1NzQwNlx1N0YxNlx1NzgwMSddO1xyXG4gICAgICByZXR1cm4gaGFuZGxlZChvcHRpb25zKTtcclxuICAgIH1cclxuICAgIGlmIChwYXRoID09PSAnL2FwaS9tYXAvc2VsZWN0R2VvJylcclxuICAgICAgcmV0dXJuIGhhbmRsZWQoeyBnZW9jb2RlOiAnXHU5QUQ4XHU1RkI3XHU1NzMwXHU3NDA2XHU3RjE2XHU3ODAxJywgaW52ZXJzZWNvZGU6ICdcdTlBRDhcdTVGQjdcdTkwMDZcdTU3MzBcdTc0MDZcdTdGMTZcdTc4MDEnLCBwb2k6ICdcdTlBRDhcdTVGQjdcdTU3MzBcdTcwQjlcdTY4QzBcdTdEMjInIH0pO1xyXG4gICAgaWYgKHBhdGggPT09ICcvYXBpL21hcC9zZWxlY3REaXZpc2lvbicpIHJldHVybiBoYW5kbGVkKHsgbmFtZTogJ1x1NkQ1OVx1NkM1Rlx1NzcwMVx1Njc2RFx1NURERVx1NUUwMicgfSk7XHJcbiAgfVxyXG5cclxuICBpZiAocGF0aCA9PT0gJy9hcGkvbGF5b3V0L2FwcC9zZWN0aW9ucycgJiYgbWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgcmV0dXJuIGhhbmRsZWQoW1xyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6ICdwcmV2aWV3LXNlY3Rpb24tMDAxJyxcclxuICAgICAgICBuYW1lOiAnXHU1RTM4XHU3NTI4XHU1RTk0XHU3NTI4JyxcclxuICAgICAgICB0eXBlOiAyLFxyXG4gICAgICAgIHNob3c6IDEsXHJcbiAgICAgICAgc29ydDogMSxcclxuICAgICAgICBjdXN0b206ICdbe1wibmFtZVwiOlwiXHU1MDNDXHU3M0VEXHU1M0YwXCIsXCJ1cmxcIjpcIi9kdXR5XCJ9XScsXHJcbiAgICAgICAgZ210Q3JlYXRlZDogJzIwMjYtMDQtMTAgMDg6MzA6MDAnLFxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6ICdwcmV2aWV3LXNlY3Rpb24tMDAyJyxcclxuICAgICAgICBuYW1lOiAnXHU1MzRGXHU1NDBDXHU3RkE0XHU3RUM0JyxcclxuICAgICAgICB0eXBlOiAzLFxyXG4gICAgICAgIHNob3c6IDEsXHJcbiAgICAgICAgc29ydDogMixcclxuICAgICAgICBjdXN0b206ICd7XCJidXR0b25zXCI6W3tcInR5cGVcIjoxLFwibmFtZVwiOlwiXHU1MjFCXHU1RUZBXHU3RkE0XHU3RUM0XCIsXCJlbmFibGVcIjpcInRydWVcIn1dfScsXHJcbiAgICAgICAgZ210Q3JlYXRlZDogJzIwMjYtMDQtMTAgMDg6MzU6MDAnLFxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6ICdwcmV2aWV3LXNlY3Rpb24tMDAzJyxcclxuICAgICAgICBuYW1lOiAnXHU2RDg4XHU2MDZGXHU1MjE3XHU4ODY4JyxcclxuICAgICAgICB0eXBlOiA2LFxyXG4gICAgICAgIHNob3c6IDAsXHJcbiAgICAgICAgc29ydDogMyxcclxuICAgICAgICBjdXN0b206ICcnLFxyXG4gICAgICAgIGdtdENyZWF0ZWQ6ICcyMDI2LTA0LTEwIDA4OjQwOjAwJyxcclxuICAgICAgfSxcclxuICAgIF0pO1xyXG4gIH1cclxuICBpZiAocGF0aCA9PT0gJy9hcGkvc3lzdGVtL2NvbmZpZycgJiYgbWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgcmV0dXJuIGhhbmRsZWQoW1xyXG4gICAgICB7IGlkOiAncHJldmlldy1jb25maWctMDAxJywga2V5OiAnU1lTVEVNX05BTUUnLCB2YWx1ZTogJ0xpbmtYIFx1NjcyQ1x1NTczMFx1OTg4NFx1ODlDOCcgfSxcclxuICAgICAgeyBpZDogJ3ByZXZpZXctY29uZmlnLTAwMicsIGtleTogJ0FQUF9INV9DT05GSUcnLCB2YWx1ZTogJ3tcInNob3dCYW5uZXJcIjp0cnVlfScgfSxcclxuICAgICAge1xyXG4gICAgICAgIGlkOiAncHJldmlldy1jb25maWctMDAzJyxcclxuICAgICAgICBrZXk6ICdQQ19OQVZfQ1VTVE9NJyxcclxuICAgICAgICB2YWx1ZTogJ1t7XCJuYW1lXCI6XCJcdTUwM0NcdTczRURcdTVERTVcdTRGNUNcdTUzRjBcIixcInVybFwiOlwiL3dvcmtiZW5jaFwiLFwib3JkZXJcIjoxLFwib3BlbldheVwiOjB9XScsXHJcbiAgICAgIH0sXHJcbiAgICBdKTtcclxuICB9XHJcblxyXG4gIGlmIChwYXRoID09PSAnL2NvbGxhYm9yYXRpb24vdjEvY2xpZW50L2xpc3QnICYmIG1ldGhvZCA9PT0gJ1BPU1QnKSB7XHJcbiAgICBjb25zdCBrZXl3b3JkID0gU3RyaW5nKGFzUmVjb3JkKGJvZHkpLmNsaWVudE5hbWUgPz8gYXNSZWNvcmQoYm9keSkuc3lzdGVtTmFtZSA/PyAnJykudHJpbSgpO1xyXG4gICAgY29uc3QgZmlsdGVyZWQgPSBwcmV2aWV3VGhpcmRBcHBzLmZpbHRlcihcclxuICAgICAgKGl0ZW0pID0+ICFrZXl3b3JkIHx8IGl0ZW0uY2xpZW50TmFtZS5pbmNsdWRlcyhrZXl3b3JkKSB8fCBpdGVtLnN5c3RlbU5hbWUuaW5jbHVkZXMoa2V5d29yZCksXHJcbiAgICApO1xyXG4gICAgcmV0dXJuIGhhbmRsZWQocGFnaW5hdGUoZmlsdGVyZWQsIHVybCwgYm9keSkpO1xyXG4gIH1cclxuXHJcbiAgaWYgKHBhdGggPT09ICcvY29sbGFib3JhdGlvbi92MS9wb3N0L3BhZ2UnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHJldHVybiBoYW5kbGVkKHBhZ2luYXRlKGNvbGxhYm9yYXRpb25zLCB1cmwsIGJvZHkpKTtcclxuICBpZiAocGF0aCA9PT0gJy9jb2xsYWJvcmF0aW9uL3YxL3Bvc3QvcXVlcnlVc2VyQnlJZENhcmQnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgIHJldHVybiBoYW5kbGVkKHtcclxuICAgICAgdXNlckRlcGFydG1lbnRzOiBbeyBkZXBhcnRtZW50SWQ6ICdkZXB0LTAwMScsIGRlcGFydG1lbnRDb2RlOiAnMzMwMTAwJywgZGVwYXJ0bWVudE5hbWU6ICdcdTVFMDJcdTVDNDBcdTYzMDdcdTYzMjVcdTRFMkRcdTVGQzMnIH1dLFxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIGlmIChwYXRoID09PSAnL2NvbGxhYm9yYXRpb24vdjEvcG9zdC9xdWVyeURlcGFydG1lbnQnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHJldHVybiBoYW5kbGVkKGRlcGFydG1lbnRzKTtcclxuICBpZiAocGF0aCA9PT0gJy9jb2xsYWJvcmF0aW9uL3YxL29yZ2FuaXphdGlvbi90cmVlJyAmJiBtZXRob2QgPT09ICdHRVQnKSByZXR1cm4gaGFuZGxlZChkZXBhcnRtZW50c1swXSk7XHJcbiAgaWYgKHBhdGggPT09ICcvY29sbGFib3JhdGlvbi92MS9wb3N0L3F1ZXJ5VXNlckJ5UGFnZScgJiYgbWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgcmV0dXJuIGhhbmRsZWQoXHJcbiAgICAgIHBhZ2luYXRlKFxyXG4gICAgICAgIHBlb3BsZS5tYXAoKHBlcnNvbikgPT4gKHtcclxuICAgICAgICAgIC4uLnBlcnNvbixcclxuICAgICAgICAgIGNvZGU6IHBlcnNvbi5pZCxcclxuICAgICAgICAgIG1vYmlsZTogcGVyc29uLnBob25lTnVtLFxyXG4gICAgICAgICAgaXNCaW5kaW5nOiAxLFxyXG4gICAgICAgICAgdXNlckRlcGFydG1lbnRzOiBbeyBpZDogJ2RlcHQtMDAxJywgZGVwYXJ0bWVudENvZGU6ICczMzAxMDAnLCBkZXBhcnRtZW50TmFtZTogcGVyc29uLmRlcGFydG1lbnROYW1lIH1dLFxyXG4gICAgICAgIH0pKSxcclxuICAgICAgICB1cmwsXHJcbiAgICAgICAgYm9keSxcclxuICAgICAgKSxcclxuICAgICk7XHJcbiAgfVxyXG4gIGlmIChwYXRoID09PSAnL2NvbGxhYm9yYXRpb24vdjEvcG9zdC9xdWVyeVVzZXInICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHJldHVybiBoYW5kbGVkKHBlb3BsZSk7XHJcbiAgaWYgKHBhdGggPT09ICcvY29sbGFib3JhdGlvbi92MS9pbS91c2Vycy90cmVlJyAmJiBtZXRob2QgPT09ICdHRVQnKSByZXR1cm4gaGFuZGxlZChkZXBhcnRtZW50cyk7XHJcbiAgaWYgKHBhdGggPT09ICcvYXV0aC92MS9yb2xlL2J5VXNlcklkJyAmJiBtZXRob2QgPT09ICdHRVQnKVxyXG4gICAgcmV0dXJuIGhhbmRsZWQoW3sgaWQ6ICdwcmV2aWV3LXJvbGUtZHV0eScsIG5hbWU6ICdcdTUwM0NcdTczRURcdThDMDNcdTVFQTZcdTU0NTgnIH1dKTtcclxuICBpZiAocGF0aCA9PT0gJy9jb2xsYWJvcmF0aW9uL3YxL3Bvc3QvcXVlcnlCeU5hbWUnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHJldHVybiBoYW5kbGVkKGZhbHNlKTtcclxuICBpZiAocGF0aCA9PT0gJy9jb2xsYWJvcmF0aW9uL3YxL3Bvc3Qvc3luY1Bvc3RGcm9tSW0nICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHJldHVybiBoYW5kbGVkKHRydWUpO1xyXG4gIGlmIChwYXRoID09PSAnL2NvbGxhYm9yYXRpb24vdjEvcG9zdC9nZXRJbVN5bmNTdGF0dXMnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHJldHVybiBoYW5kbGVkKHRydWUpO1xyXG4gIGlmIChwYXRoID09PSAnL2NvbGxhYm9yYXRpb24vdjEvcG9zdC9nZXRQcm9jZXNzJyAmJiBtZXRob2QgPT09ICdHRVQnKSByZXR1cm4gaGFuZGxlZCh0cnVlKTtcclxuICBpZiAocGF0aCA9PT0gJy9jb2xsYWJvcmF0aW9uL3YxL3Bvc3QvbG9nL3BhZ2UnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgIHJldHVybiBoYW5kbGVkKFxyXG4gICAgICBwYWdpbmF0ZShcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAncHJldmlldy1sb2ctMDAxJyxcclxuICAgICAgICAgICAgcG9zdE5hbWU6ICdcdTVFOTRcdTYwMjVcdTYzMDdcdTYzMjVcdTVDOTcnLFxyXG4gICAgICAgICAgICBvcmdOYW1lOiAnXHU1RTAyXHU1QzQwXHU2MzA3XHU2MzI1XHU0RTJEXHU1RkMzJyxcclxuICAgICAgICAgICAgcmVsYXRlZFVzZXJOYW1lczogJ1x1NUYyMFx1NjY2OFx1MzAwMVx1Njc0RVx1NUI4MScsXHJcbiAgICAgICAgICAgIG9wZXJhdG9yTmFtZTogJ01vY2tcdTdCQTFcdTc0MDZcdTU0NTgnLFxyXG4gICAgICAgICAgICBvcGVyYXRpb25UeXBlOiAxLFxyXG4gICAgICAgICAgICBvcGVyYXRpb25UeXBlTmFtZTogJ1x1N0YxNlx1OEY5MScsXHJcbiAgICAgICAgICAgIGNvbnRlbnQ6ICdcdThDMDNcdTY1NzRcdTU3MjhcdTVDOTdcdTRFQkFcdTU0NTgnLFxyXG4gICAgICAgICAgICBvcGVyYXRlVGltZTogJzIwMjYtMDktMjUgMTA6MzA6MDAnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHVybCxcclxuICAgICAgICBib2R5LFxyXG4gICAgICApLFxyXG4gICAgKTtcclxuICB9XHJcbiAgaWYgKHBhdGggPT09ICcvY29sbGFib3JhdGlvbi92MS9hdHRlbmRhbmNlL3BhZ2UnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgIHJldHVybiBoYW5kbGVkKFxyXG4gICAgICBwYWdpbmF0ZShcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAncHJldmlldy1hdHRlbmRhbmNlLTAwMScsXHJcbiAgICAgICAgICAgIHBvc3ROYW1lOiAnXHU1RTk0XHU2MDI1XHU2MzA3XHU2MzI1XHU1Qzk3JyxcclxuICAgICAgICAgICAgb3JnTmFtZTogJ1x1NUUwMlx1NUM0MFx1NjMwN1x1NjMyNVx1NEUyRFx1NUZDMycsXHJcbiAgICAgICAgICAgIHBlcnNvbk5hbWU6ICdcdTVGMjBcdTY2NjgnLFxyXG4gICAgICAgICAgICByZWxhdGVkVXNlck5hbWVzOiAnXHU1RjIwXHU2NjY4XHUzMDAxXHU2NzRFXHU1QjgxJyxcclxuICAgICAgICAgICAgdHlwZTogMSxcclxuICAgICAgICAgICAgbGFzdFBlb3BsZU51bTogMixcclxuICAgICAgICAgICAgbGFzdFBlb3BsZTogJ1x1NUYyMFx1NjY2OFx1MzAwMVx1Njc0RVx1NUI4MScsXHJcbiAgICAgICAgICAgIHN3aXRjaFR5cGU6IDEsXHJcbiAgICAgICAgICAgIGNyZWF0ZVRpbWU6ICcyMDI2LTA5LTI2IDA4OjAwOjAwJyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICB1cmwsXHJcbiAgICAgICAgYm9keSxcclxuICAgICAgKSxcclxuICAgICk7XHJcbiAgfVxyXG4gIGlmIChwYXRoID09PSAnL2NvbGxhYm9yYXRpb24vdjEvYXR0ZW5kYW5jZS9nZXRPbmxpbmUnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgIHJldHVybiBoYW5kbGVkKFtcclxuICAgICAge1xyXG4gICAgICAgIGlkOiAncHJldmlldy1kdXR5LXVzZXItMDAxJyxcclxuICAgICAgICB1c2VySWQ6ICdwcmV2aWV3LXVzZXItMDAxJyxcclxuICAgICAgICBuYW1lOiAnXHU1RjIwXHU2NjY4JyxcclxuICAgICAgICBpZENhcmQ6ICdNT0NLLUlELTAwMScsXHJcbiAgICAgICAgZGVwYXJ0bWVudE5hbWU6ICdcdTVFMDJcdTVDNDBcdTYzMDdcdTYzMjVcdTRFMkRcdTVGQzMnLFxyXG4gICAgICAgIGRlcGFydG1lbnRDb2RlOiAnMzMwMTAwJyxcclxuICAgICAgfSxcclxuICAgIF0pO1xyXG4gIH1cclxuICBpZiAocGF0aCA9PT0gJy9jb2xsYWJvcmF0aW9uL3YxL2F0dGVuZGFuY2UvZ2V0TGFzdE51bScgJiYgbWV0aG9kID09PSAnR0VUJykgcmV0dXJuIGhhbmRsZWQoeyBsYXN0UGVvcGxlTnVtOiAyIH0pO1xyXG4gIGlmIChwYXRoID09PSAnL2NvbGxhYm9yYXRpb24vdjEvbGFiZWwvbGlzdCcgJiYgbWV0aG9kID09PSAnR0VUJykgcmV0dXJuIGhhbmRsZWQocHJldmlld0xhYmVscyk7XHJcbiAgaWYgKC9eXFwvY29sbGFib3JhdGlvblxcL3YxXFwvZnVuY3Rpb25hbGRlcHRzXFwvW14vXStcXC9jaGlsZHJlbiQvLnRlc3QocGF0aCkgJiYgbWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgcmV0dXJuIGhhbmRsZWQoW1xyXG4gICAgICB7IGlkOiAncHJldmlldy1mdW5jdGlvbi0wMDEnLCBuYW1lOiAnXHU1RTk0XHU2MDI1XHU1OTA0XHU3RjZFJywgdHlwZTogMSwgY2hpbGRyZW46IFtdIH0sXHJcbiAgICAgIHsgaWQ6ICdwcmV2aWV3LWZ1bmN0aW9uLTAwMicsIG5hbWU6ICdcdTVERTFcdTkwM0JcdTgwNTRcdTUyQTgnLCB0eXBlOiAyLCBjaGlsZHJlbjogW10gfSxcclxuICAgIF0pO1xyXG4gIH1cclxuICBpZiAoL15cXC9jb2xsYWJvcmF0aW9uXFwvdjFcXC9mdW5jdGlvbmFsZGVwdHNcXC9bXi9dK1xcL2Nvb3AkLy50ZXN0KHBhdGgpICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgIHJldHVybiBoYW5kbGVkKHsgcmVjb3JkczogY29sbGFib3JhdGlvbnMsIHRvdGFsOiBjb2xsYWJvcmF0aW9ucy5sZW5ndGggfSk7XHJcbiAgfVxyXG4gIGlmIChwYXRoID09PSAnL2NvbGxhYm9yYXRpb24vdjEvZnVuY3Rpb25hbGRlcHRzL2RlZmF1bHQvY29vcC9wYWdlJyAmJiBtZXRob2QgPT09ICdHRVQnKSB7XHJcbiAgICByZXR1cm4gaGFuZGxlZCh7XHJcbiAgICAgIHJlY29yZHM6IFtcclxuICAgICAgICB7IGlkOiAncHJldmlldy1kZWZhdWx0LWNvb3AtMDAxJywgcG9zdElkOiAncHJldmlldy1wb3N0LTAwMScsIHBvc3ROYW1lOiAnXHU1RTk0XHU2MDI1XHU2MzA3XHU2MzI1XHU1Qzk3Jywgb3JnTmFtZTogJ1x1NUUwMlx1NUM0MFx1NjMwN1x1NjMyNVx1NEUyRFx1NUZDMycgfSxcclxuICAgICAgXSxcclxuICAgICAgdG90YWw6IDEsXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGlmIChwYXRoID09PSAnL2FwaS9jb250ZW50L2Nhcm91c2VsL3BhZ2UnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgIHJldHVybiBoYW5kbGVkKFxyXG4gICAgICBwYWdpbmF0ZShcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAncHJldmlldy1jYXJvdXNlbC0wMDEnLFxyXG4gICAgICAgICAgICB0aXRsZTogJ1x1NUU5NFx1NjAyNVx1NTAzQ1x1NUI4OFx1NUI4OVx1NjM5MicsXHJcbiAgICAgICAgICAgIHBjaVVybDogJy9tb2NrL2ltYWdlcy9kdXR5LWJhbm5lci5zdmcnLFxyXG4gICAgICAgICAgICBvZmZpY2lhbEFjY291bnRJZDogJ3ByZXZpZXctYWNjb3VudC0wMDEnLFxyXG4gICAgICAgICAgICBvZmZpY2lhbEFjY291bnROYW1lOiAnXHU2NzZEXHU1RERFXHU4QjY2XHU1MkExJyxcclxuICAgICAgICAgICAgYXJ0aWNsZUlkOiAncHJldmlldy1hcnRpY2xlLTAwMScsXHJcbiAgICAgICAgICAgIHVybDogJy9uZXdzL2R1dHknLFxyXG4gICAgICAgICAgICBzb3J0OiAxLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgaWQ6ICdwcmV2aWV3LWNhcm91c2VsLTAwMicsXHJcbiAgICAgICAgICAgIHRpdGxlOiAnXHU1RTczXHU1Qjg5XHU1REUxXHU5NjMyXHU2M0QwXHU3OTNBJyxcclxuICAgICAgICAgICAgcGNpVXJsOiAnL21vY2svaW1hZ2VzL3BhdHJvbC1iYW5uZXIuc3ZnJyxcclxuICAgICAgICAgICAgb2ZmaWNpYWxBY2NvdW50SWQ6ICdwcmV2aWV3LWFjY291bnQtMDAxJyxcclxuICAgICAgICAgICAgb2ZmaWNpYWxBY2NvdW50TmFtZTogJ1x1Njc2RFx1NURERVx1OEI2Nlx1NTJBMScsXHJcbiAgICAgICAgICAgIGFydGljbGVJZDogJ3ByZXZpZXctYXJ0aWNsZS0wMDInLFxyXG4gICAgICAgICAgICB1cmw6ICcvbmV3cy9wYXRyb2wnLFxyXG4gICAgICAgICAgICBzb3J0OiAyLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHVybCxcclxuICAgICAgICBib2R5LFxyXG4gICAgICApLFxyXG4gICAgKTtcclxuICB9XHJcbiAgaWYgKHBhdGggPT09ICcvY29sbGFib3JhdGlvbi92MS9wb3N0L29mZmljaWFsQWNjb3VudHMvcGFnZScgJiYgbWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgcmV0dXJuIGhhbmRsZWQoXHJcbiAgICAgIHBhZ2luYXRlKFxyXG4gICAgICAgIFtcclxuICAgICAgICAgIHsgaWQ6ICdwcmV2aWV3LWFjY291bnQtMDAxJywgbmFtZTogJ1x1Njc2RFx1NURERVx1OEI2Nlx1NTJBMScgfSxcclxuICAgICAgICAgIHsgaWQ6ICdwcmV2aWV3LWFjY291bnQtMDAyJywgbmFtZTogJ1x1NUU3M1x1NUI4OVx1Njc2RFx1NURERScgfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHVybCxcclxuICAgICAgICBib2R5LFxyXG4gICAgICApLFxyXG4gICAgKTtcclxuICB9XHJcbiAgaWYgKHBhdGggPT09ICcvY29sbGFib3JhdGlvbi92MS9wb3N0L2FydGljbGVzL3BhZ2UnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgIHJldHVybiBoYW5kbGVkKFxyXG4gICAgICBwYWdpbmF0ZShcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7IGlkOiAncHJldmlldy1hcnRpY2xlLTAwMScsIHRpdGxlOiAnXHU1RTk0XHU2MDI1XHU1MDNDXHU1Qjg4XHU1Qjg5XHU2MzkyJywgY29udGVudFVybDogJy9tb2NrL2FydGljbGVzL2R1dHknIH0sXHJcbiAgICAgICAgICB7IGlkOiAncHJldmlldy1hcnRpY2xlLTAwMicsIHRpdGxlOiAnXHU1RTczXHU1Qjg5XHU1REUxXHU5NjMyXHU2M0QwXHU3OTNBJywgY29udGVudFVybDogJy9tb2NrL2FydGljbGVzL3BhdHJvbCcgfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHVybCxcclxuICAgICAgICBib2R5LFxyXG4gICAgICApLFxyXG4gICAgKTtcclxuICB9XHJcbiAgaWYgKHBhdGggPT09ICcvY29sbGFib3JhdGlvbi92MS9ncm91cHMvYXJjaGl2ZS9saXN0JyAmJiBtZXRob2QgPT09ICdHRVQnKSB7XHJcbiAgICByZXR1cm4gaGFuZGxlZChcclxuICAgICAgcGFnaW5hdGUoXHJcbiAgICAgICAgW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBncm91cElkOiAncHJldmlldy1ncm91cC0wMDEnLFxyXG4gICAgICAgICAgICBncm91cE5hbWU6ICdcdTVFMDJcdTVDNDBcdTVFOTRcdTYwMjVcdTgwNTRcdTUyQThcdTdGQTQnLFxyXG4gICAgICAgICAgICB0YWdOYW1lOiAnXHU1RTk0XHU2MDI1XHU1OTA0XHU3RjZFJyxcclxuICAgICAgICAgICAgdGFza05hbWU6ICdcdTk2MzJcdTZDNUJcdTVERTFcdTY3RTUnLFxyXG4gICAgICAgICAgICBkZXBhcnRtZW50TmFtZTogJ1x1NUUwMlx1NUM0MFx1NjMwN1x1NjMyNVx1NEUyRFx1NUZDMycsXHJcbiAgICAgICAgICAgIGFyY2hpdmVVc2VyTmFtZTogJ01vY2tcdTdCQTFcdTc0MDZcdTU0NTgnLFxyXG4gICAgICAgICAgICBhcmNoaXZlZEZpbGU6ICcyMDI2LzA5L1x1NUU5NFx1NjAyNVx1ODA1NFx1NTJBOFx1N0ZBNC56aXAnLFxyXG4gICAgICAgICAgICBhcmNoaXZlZFRpbWU6ICcyMDI2LTA5LTIwIDE4OjMwOjAwJyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGdyb3VwSWQ6ICdwcmV2aWV3LWdyb3VwLTAwMicsXHJcbiAgICAgICAgICAgIGdyb3VwTmFtZTogJ1x1NTkxQ1x1OTVGNFx1NURFMVx1OTYzMlx1NURFNVx1NEY1Q1x1N0ZBNCcsXHJcbiAgICAgICAgICAgIHRhZ05hbWU6ICdcdTVERTFcdTkwM0JcdTUyQThcdTYwMDEnLFxyXG4gICAgICAgICAgICB0YXNrTmFtZTogJ1x1NTkxQ1x1OTVGNFx1NURFMVx1OTYzMicsXHJcbiAgICAgICAgICAgIGRlcGFydG1lbnROYW1lOiAnXHU0RTAwXHU3RUJGXHU2MzA3XHU2MzI1XHU5MEU4JyxcclxuICAgICAgICAgICAgYXJjaGl2ZVVzZXJOYW1lOiAnTW9ja1x1N0JBMVx1NzQwNlx1NTQ1OCcsXHJcbiAgICAgICAgICAgIGFyY2hpdmVkRmlsZTogJzIwMjYvMDkvXHU1OTFDXHU5NUY0XHU1REUxXHU5NjMyXHU3RkE0LnppcCcsXHJcbiAgICAgICAgICAgIGFyY2hpdmVkVGltZTogJzIwMjYtMDktMTggMjE6MTU6MDAnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHVybCxcclxuICAgICAgICBib2R5LFxyXG4gICAgICApLFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGlmIChwYXRoID09PSAnL2NvbGxhYm9yYXRpb24vdjEvZGVwdC9sb2NhdGlvbi9saXN0JyAmJiBtZXRob2QgPT09ICdHRVQnKSB7XHJcbiAgICByZXR1cm4gaGFuZGxlZChbXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogJ3ByZXZpZXctbG9jYXRpb24tMDAxJyxcclxuICAgICAgICBkZXBhcnRtZW50Q29kZTogJzMzMDEwMCcsXHJcbiAgICAgICAgZGVwYXJ0bWVudE5hbWU6ICdcdTVFMDJcdTVDNDBcdTYzMDdcdTYzMjVcdTRFMkRcdTVGQzMnLFxyXG4gICAgICAgIGxvY2F0aW9uOiAnMTIwLjE1NTEsMzAuMjc0MScsXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogJ3ByZXZpZXctbG9jYXRpb24tMDAyJyxcclxuICAgICAgICBkZXBhcnRtZW50Q29kZTogJzMzMDEwMScsXHJcbiAgICAgICAgZGVwYXJ0bWVudE5hbWU6ICdcdTRFMDBcdTdFQkZcdTYzMDdcdTYzMjVcdTkwRTgnLFxyXG4gICAgICAgIGxvY2F0aW9uOiAnMTIwLjIwNTgsMzAuMjQ1NicsXHJcbiAgICAgIH0sXHJcbiAgICBdKTtcclxuICB9XHJcbiAgaWYgKHBhdGggPT09ICcvY29sbGFib3JhdGlvbi92MS9kdXR5L3R5cGUvcGFnZScgJiYgbWV0aG9kID09PSAnR0VUJykgcmV0dXJuIGhhbmRsZWQocGFnaW5hdGUoZHV0eVR5cGVzLCB1cmwsIGJvZHkpKTtcclxuICBpZiAocGF0aCA9PT0gJy9jb2xsYWJvcmF0aW9uL3YxL2R1dHkvdHlwZS9hbGwnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHJldHVybiBoYW5kbGVkKGR1dHlUeXBlcyk7XHJcbiAgaWYgKHBhdGggPT09ICcvY29sbGFib3JhdGlvbi92MS9kdXR5L3NjaGVkdWxlL3BhZ2UnICYmIG1ldGhvZCA9PT0gJ0dFVCcpXHJcbiAgICByZXR1cm4gaGFuZGxlZChwYWdpbmF0ZShzY2hlZHVsZXMsIHVybCwgYm9keSkpO1xyXG4gIGlmIChwYXRoID09PSAnL2NvbGxhYm9yYXRpb24vdjEvZHV0eS9zY2hlZHVsZS9jYWxlbmRhcicgJiYgbWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgcmV0dXJuIGhhbmRsZWQoeyAnMjAyNi0wOS0yNic6IHNjaGVkdWxlcywgJzIwMjYtMDktMjcnOiBbc2NoZWR1bGVzWzFdXSB9KTtcclxuICB9XHJcblxyXG4gIGlmIChwYXRoID09PSAnL2FwaS93YXJuaW5nL3JhbGF0aW9uL3BhZ2UnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgIHJldHVybiBoYW5kbGVkKFxyXG4gICAgICBwYWdpbmF0ZShcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAncHJldmlldy13YXJuaW5nLTAwMScsXHJcbiAgICAgICAgICAgIGJ1c2luZXNzSWQ6ICdkZXB0LTAwMScsXHJcbiAgICAgICAgICAgIGJ1c2luZXNzTmFtZTogJ1x1NUUwMlx1NUM0MFx1NjMwN1x1NjMyNVx1NEUyRFx1NUZDMycsXHJcbiAgICAgICAgICAgIG9yZ05hbWU6ICdcdTVFMDJcdTVDNDBcdTYzMDdcdTYzMjVcdTRFMkRcdTVGQzMnLFxyXG4gICAgICAgICAgICB0YXJnZXRUeXBlOiAxLFxyXG4gICAgICAgICAgICB0YXJnZXRJZDogJ3ByZXZpZXctdXNlci0wMDEnLFxyXG4gICAgICAgICAgICB0YXJnZXROYW1lOiAnXHU1RjIwXHU2NjY4JyxcclxuICAgICAgICAgICAgaWRDYXJkOiAnTU9DSy1JRC0wMDEnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgaWQ6ICdwcmV2aWV3LXdhcm5pbmctMDAyJyxcclxuICAgICAgICAgICAgYnVzaW5lc3NJZDogJ3ByZXZpZXctcG9zdC0wMDInLFxyXG4gICAgICAgICAgICBidXNpbmVzc05hbWU6ICdcdTVERTFcdTkwM0JcdTgwNTRcdTdFRENcdTVDOTcnLFxyXG4gICAgICAgICAgICBvcmdOYW1lOiAnXHU0RTAwXHU3RUJGXHU2MzA3XHU2MzI1XHU5MEU4JyxcclxuICAgICAgICAgICAgdGFyZ2V0VHlwZTogMixcclxuICAgICAgICAgICAgdGFyZ2V0SWQ6ICdwcmV2aWV3LWdyb3VwLTAwMScsXHJcbiAgICAgICAgICAgIHRhcmdldE5hbWU6ICdcdTU5MUNcdTk1RjRcdTVERTFcdTk2MzJcdTVERTVcdTRGNUNcdTdGQTQnLFxyXG4gICAgICAgICAgICBpZENhcmQ6ICcnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHVybCxcclxuICAgICAgICBib2R5LFxyXG4gICAgICApLFxyXG4gICAgKTtcclxuICB9XHJcbiAgaWYgKHBhdGggPT09ICcvY29sbGFib3JhdGlvbi92MS9pbS9xdWVyeVVzZXInICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgIHJldHVybiBoYW5kbGVkKFxyXG4gICAgICBwYWdpbmF0ZShcclxuICAgICAgICBwZW9wbGUubWFwKCh7IGlkLCBuYW1lLCBpZENhcmQgfSkgPT4gKHsgaWQsIG5hbWUsIGlkQ2FyZCB9KSksXHJcbiAgICAgICAgdXJsLFxyXG4gICAgICAgIGJvZHksXHJcbiAgICAgICksXHJcbiAgICApO1xyXG4gIH1cclxuICBpZiAocGF0aCA9PT0gJy9jb2xsYWJvcmF0aW9uL3YxL2ltL3F1ZXJ5L2dyb3VwL3R5cGUnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgIHJldHVybiBoYW5kbGVkKFxyXG4gICAgICBwYWdpbmF0ZShcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7IGdyb3VwSWQ6ICdwcmV2aWV3LWdyb3VwLTAwMScsIGdyb3VwTmFtZTogJ1x1NUUwMlx1NUM0MFx1NUU5NFx1NjAyNVx1ODA1NFx1NTJBOFx1N0ZBNCcgfSxcclxuICAgICAgICAgIHsgZ3JvdXBJZDogJ3ByZXZpZXctZ3JvdXAtMDAyJywgZ3JvdXBOYW1lOiAnXHU1OTFDXHU5NUY0XHU1REUxXHU5NjMyXHU1REU1XHU0RjVDXHU3RkE0JyB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgdXJsLFxyXG4gICAgICAgIGJvZHksXHJcbiAgICAgICksXHJcbiAgICApO1xyXG4gIH1cclxuICBpZiAocGF0aCA9PT0gJy9jb2xsYWJvcmF0aW9uL3YxL2ltL3VzZXJzL3ZpcnR1YWwnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgIHJldHVybiBoYW5kbGVkKFtcclxuICAgICAge1xyXG4gICAgICAgIGlkOiAncHJldmlldy12aXJ0dWFsLTAwMScsXHJcbiAgICAgICAgdXNlck5hbWU6ICdcdTVFOTRcdTYwMjVcdTUwM0NcdTVCODhcdThEMjZcdTUzRjcnLFxyXG4gICAgICAgIGNvbnRhY3ROdW1iZXI6ICcxMzgwMDAwMDAxMScsXHJcbiAgICAgICAgYXBwSWQ6ICdwcmV2aWV3LWFwcC0wMDEnLFxyXG4gICAgICAgIGFwcFNlY3JldDogJ3ByZXZpZXctdmlydHVhbC1zZWNyZXQnLFxyXG4gICAgICAgIGRlZmF1bHRVc2VyOiAxLFxyXG4gICAgICAgIHJlbWFyazogJ1x1NjcyQ1x1NTczMFx1NjgzN1x1NEY4QicsXHJcbiAgICAgICAgY3JlYXRlZEF0OiAnMjAyNi0wNi0wMSAwODowMDowMCcsXHJcbiAgICAgICAgY3JlYXRlZEJ5OiAnMScsXHJcbiAgICAgIH0sXHJcbiAgICBdKTtcclxuICB9XHJcblxyXG4gIGlmIChwYXRoID09PSAnL2FwaS9jb250ZW50L2FwcC9pbmZvL3BhZ2UnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgIHJldHVybiBoYW5kbGVkKFxyXG4gICAgICBwYWdpbmF0ZShcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAncHJldmlldy1hcHAtMDAxJyxcclxuICAgICAgICAgICAgbmFtZTogJ1x1OEI2Nlx1NTJBMVx1NTM0Rlx1NTQwQyBINScsXHJcbiAgICAgICAgICAgIHR5cGU6IDEsXHJcbiAgICAgICAgICAgIHVybDogJ2h0dHA6Ly8xMjcuMC4wLjE6MzA4NDcvbW9jay9oNScsXHJcbiAgICAgICAgICAgIHNjb3BlOiBbMV0sXHJcbiAgICAgICAgICAgIHNjb3BlTGlzdDogW3sgaWQ6IDEsIG5hbWU6ICdcdTVFMDJcdTVDNDBcdTYzMDdcdTYzMjVcdTRFMkRcdTVGQzMnIH1dLFxyXG4gICAgICAgICAgICB6b25lOiAxLFxyXG4gICAgICAgICAgICBzb3J0OiAxLFxyXG4gICAgICAgICAgICBzdGF0dXM6IDAsXHJcbiAgICAgICAgICAgIG9mZmljaWFsOiAxLFxyXG4gICAgICAgICAgICBjcmVhdGVUaW1lOiAnMjAyNi0wNC0xMCAxMDowMDowMCcsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogJ3ByZXZpZXctYXBwLTAwMicsXHJcbiAgICAgICAgICAgIG5hbWU6ICdcdTUyRTRcdTUyQTFcdTc5RkJcdTUyQThcdTdBRUYnLFxyXG4gICAgICAgICAgICB0eXBlOiAwLFxyXG4gICAgICAgICAgICBwYWNrYWdlQW5kcm9pZDogJy9tb2NrL2FwcHMvZHV0eS5hcGsnLFxyXG4gICAgICAgICAgICBhY3Rpdml0eTogJ2NvbS5saW5reC5kdXR5Lk1haW5BY3Rpdml0eScsXHJcbiAgICAgICAgICAgIHNjb3BlOiBbMSwgMl0sXHJcbiAgICAgICAgICAgIHpvbmU6IDIsXHJcbiAgICAgICAgICAgIHNvcnQ6IDIsXHJcbiAgICAgICAgICAgIHN0YXR1czogMSxcclxuICAgICAgICAgICAgb2ZmaWNpYWw6IDAsXHJcbiAgICAgICAgICAgIGNyZWF0ZVRpbWU6ICcyMDI2LTA1LTAyIDExOjIwOjAwJyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICB1cmwsXHJcbiAgICAgICAgYm9keSxcclxuICAgICAgKSxcclxuICAgICk7XHJcbiAgfVxyXG4gIGlmIChwYXRoID09PSAnL2FwaS9jb250ZW50L2FwcC9pbmZvL3ByZXJlcXVpc2l0ZScgJiYgbWV0aG9kID09PSAnR0VUJylcclxuICAgIHJldHVybiBoYW5kbGVkKFt7IGlkOiAncHJldmlldy1hcHAtcGFyZW50JywgbmFtZTogJ1x1NTdGQVx1Nzg0MFx1NURFNVx1NEY1Q1x1NTNGMCcgfV0pO1xyXG4gIGlmIChwYXRoID09PSAnL3RoaXJkL3YxL2FwcHMvZ3JvdXBzJyAmJiBtZXRob2QgPT09ICdHRVQnKSB7XHJcbiAgICByZXR1cm4gaGFuZGxlZChbXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogJ3ByZXZpZXctYXBwLWdyb3VwLTAwMScsXHJcbiAgICAgICAgbmFtZTogJ1x1NjMwN1x1NjMyNVx1OEMwM1x1NUVBNicsXHJcbiAgICAgICAgc29ydDogMSxcclxuICAgICAgICBhcHBJZHM6IFsncHJldmlldy1hcHAtMDAxJ10sXHJcbiAgICAgICAgYXBwTGlzdDogW10sXHJcbiAgICAgICAgdHlwZTogMSxcclxuICAgICAgICBjcmVhdGVVc2VyOiAnTW9ja1x1N0JBMVx1NzQwNlx1NTQ1OCcsXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogJ3ByZXZpZXctYXBwLWdyb3VwLTAwMicsXHJcbiAgICAgICAgbmFtZTogJ1x1NjVFNVx1NUUzOFx1NUU5NFx1NzUyOCcsXHJcbiAgICAgICAgc29ydDogMixcclxuICAgICAgICBhcHBJZHM6IFsncHJldmlldy1hcHAtMDAyJ10sXHJcbiAgICAgICAgYXBwTGlzdDogW10sXHJcbiAgICAgICAgdHlwZTogMixcclxuICAgICAgICBjcmVhdGVVc2VyOiAnTW9ja1x1N0JBMVx1NzQwNlx1NTQ1OCcsXHJcbiAgICAgIH0sXHJcbiAgICBdKTtcclxuICB9XHJcbiAgaWYgKHBhdGggPT09ICcvdGhpcmQvdjEvYXBwL2NhbGxhYmxlJyAmJiBtZXRob2QgPT09ICdHRVQnKSB7XHJcbiAgICByZXR1cm4gaGFuZGxlZChcclxuICAgICAgcGFnaW5hdGUoXHJcbiAgICAgICAgW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogJ3ByZXZpZXctY2FsbGFibGUtMDAxJyxcclxuICAgICAgICAgICAgbmFtZTogJ1x1OEI2Nlx1NjBDNVx1NjdFNVx1OEJFMlx1NjcwRFx1NTJBMScsXHJcbiAgICAgICAgICAgIHN5c3RlbU5hbWU6ICdcdThCNjZcdTYwQzVcdTVFNzNcdTUzRjAnLFxyXG4gICAgICAgICAgICBzeXN0ZW1Db2RlOiAnQUxFUlQnLFxyXG4gICAgICAgICAgICB1bmlxdWVJZDogJ2FsZXJ0LnF1ZXJ5JyxcclxuICAgICAgICAgICAgdHlwZTogMSxcclxuICAgICAgICAgICAgc2NvcGU6IDEsXHJcbiAgICAgICAgICAgIHByb3RvY29sOiAnaHR0cHMnLFxyXG4gICAgICAgICAgICBpcDogJzEyNy4wLjAuMScsXHJcbiAgICAgICAgICAgIHBvcnQ6IDQ0MyxcclxuICAgICAgICAgICAgdXJpOiAnL21vY2svYWxlcnRzJyxcclxuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcclxuICAgICAgICAgICAgcGFnZW5hdGlvbjogMCxcclxuICAgICAgICAgICAgZ210Q3JlYXRlZDogJzIwMjYtMDUtMTQgMDk6MTU6MDAnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgaWQ6ICdwcmV2aWV3LWNhbGxhYmxlLTAwMicsXHJcbiAgICAgICAgICAgIG5hbWU6ICdcdTkxQ0RcdTcwQjlcdTRFQkFcdTU0NThcdTVFOTMnLFxyXG4gICAgICAgICAgICBzeXN0ZW1OYW1lOiAnXHU3RUZDXHU1NDA4XHU0RkUxXHU2MDZGXHU1RTczXHU1M0YwJyxcclxuICAgICAgICAgICAgc3lzdGVtQ29kZTogJ0lORk8nLFxyXG4gICAgICAgICAgICB1bmlxdWVJZDogJ3BlcnNvbi5saXN0JyxcclxuICAgICAgICAgICAgdHlwZTogMixcclxuICAgICAgICAgICAgc2NvcGU6IDIsXHJcbiAgICAgICAgICAgIGRhdGFiYXNlTmFtZTogJ3ByZXZpZXdfZGInLFxyXG4gICAgICAgICAgICBkYlR5cGU6ICdQb3N0Z3JlU1FMJyxcclxuICAgICAgICAgICAgYWNjb3VudDogJ3ByZXZpZXdfcmVhZG9ubHknLFxyXG4gICAgICAgICAgICBwZXJpb2Q6ICc1bScsXHJcbiAgICAgICAgICAgIGdtdENyZWF0ZWQ6ICcyMDI2LTA2LTA4IDE2OjAwOjAwJyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICB1cmwsXHJcbiAgICAgICAgYm9keSxcclxuICAgICAgKSxcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBpZiAocGF0aCA9PT0gJy9jb2xsYWJvcmF0aW9uL3YxL3BvbHRjbGllbnRzL3BhZ2UnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgIHJldHVybiBoYW5kbGVkKFxyXG4gICAgICBwYWdpbmF0ZShcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAncHJldmlldy1kb2NrLTAwMScsXHJcbiAgICAgICAgICAgIG5hbWU6ICdcdThCNjZcdTYwQzVcdTYzQTVcdTUxNjVcdTY3MERcdTUyQTEnLFxyXG4gICAgICAgICAgICBzeXN0ZW1OYW1lOiAnXHU4QjY2XHU2MEM1XHU1RTczXHU1M0YwJyxcclxuICAgICAgICAgICAgc3lzdGVtQ29kZTogJ0FMRVJUJyxcclxuICAgICAgICAgICAgc2NoZW1hOiAnaHR0cHMnLFxyXG4gICAgICAgICAgICBpcDogJzEyNy4wLjAuMScsXHJcbiAgICAgICAgICAgIHBvcnQ6IDg0NDMsXHJcbiAgICAgICAgICAgIHBhdGg6ICcvbW9jay9wb2xpY2UvdGlja2V0cycsXHJcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgICAgICBoZWFkZXJzOiAne30nLFxyXG4gICAgICAgICAgICBib2R5OiAne30nLFxyXG4gICAgICAgICAgICBwYXJhbXM6ICd7fScsXHJcbiAgICAgICAgICAgIHNjcmlwdDogJycsXHJcbiAgICAgICAgICAgIGV4ZWN1dGVQZXJpb2Q6IDYwMDAwLFxyXG4gICAgICAgICAgICBzdGF0dXM6IDEsXHJcbiAgICAgICAgICAgIGdtdENyZWF0ZWQ6ICcyMDI2LTA1LTEwIDA5OjAwOjAwJyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICB1cmwsXHJcbiAgICAgICAgYm9keSxcclxuICAgICAgKSxcclxuICAgICk7XHJcbiAgfVxyXG4gIGlmIChwYXRoID09PSAnL2NvbGxhYm9yYXRpb24vdjEvcG9saWNldGlja2V0L3BhZ2UnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgIHJldHVybiBoYW5kbGVkKFxyXG4gICAgICBwYWdpbmF0ZShcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAncHJldmlldy10aWNrZXQtMDAxJyxcclxuICAgICAgICAgICAgY29kZTogJ01PQ0stMjAyNjA5MjYtMDAxJyxcclxuICAgICAgICAgICAgbmFtZTogJ1x1OTA1M1x1OERFRlx1NzlFRlx1NkMzNFx1NURFMVx1NjdFNScsXHJcbiAgICAgICAgICAgIGNvbnRlbnQ6ICdcdTVERTFcdTY3RTVcdTUzRDFcdTczQjBcdTkwNTNcdThERUZcdTc5RUZcdTZDMzRcdUZGMENcdTVERjJcdTkwMUFcdTc3RTVcdTVDNUVcdTU3MzBcdTU5MDRcdTdGNkVcdTMwMDInLFxyXG4gICAgICAgICAgICB0YWc6ICdcdTk2MzJcdTZDNUInLFxyXG4gICAgICAgICAgICBzb3VyY2U6ICdcdThCNjZcdTYwQzVcdTVFNzNcdTUzRjAnLFxyXG4gICAgICAgICAgICBjcmVhdGVUaW1lOiAnMjAyNi0wOS0yNiAwOToyMDowMCcsXHJcbiAgICAgICAgICAgIG9yaWdpbjogJ01PQ0snLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHVybCxcclxuICAgICAgICBib2R5LFxyXG4gICAgICApLFxyXG4gICAgKTtcclxuICB9XHJcbiAgaWYgKHBhdGggPT09ICcvY29sbGFib3JhdGlvbi92MS9wb2xpY2V0aWNrZXR0eXBlL3BhZ2UnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgIHJldHVybiBoYW5kbGVkKFxyXG4gICAgICBwYWdpbmF0ZShcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7IGlkOiAncHJldmlldy10aWNrZXQtdHlwZS0wMDEnLCB0YWc6ICdcdTZDQkJcdTVCODlcdThCNjZcdTYwQzUnLCBnbXRDcmVhdGVkOiAnMjAyNi0wMS0xMCAwOTowMDowMCcgfSxcclxuICAgICAgICAgIHsgaWQ6ICdwcmV2aWV3LXRpY2tldC10eXBlLTAwMicsIHRhZzogJ1x1OTYzMlx1NkM1Qlx1NURFMVx1NjdFNScsIGdtdENyZWF0ZWQ6ICcyMDI2LTAyLTIwIDEwOjMwOjAwJyB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgdXJsLFxyXG4gICAgICAgIGJvZHksXHJcbiAgICAgICksXHJcbiAgICApO1xyXG4gIH1cclxuICBpZiAocGF0aCA9PT0gJy9jb2xsYWJvcmF0aW9uL3YxL3BvbGljZXRpY2tldC90eXBlcycgJiYgbWV0aG9kID09PSAnR0VUJylcclxuICAgIHJldHVybiBoYW5kbGVkKFtcclxuICAgICAgeyBpZDogJ3ByZXZpZXctdGlja2V0LXR5cGUtMDAxJywgdGFnOiAnXHU2Q0JCXHU1Qjg5XHU4QjY2XHU2MEM1JyB9LFxyXG4gICAgICB7IGlkOiAncHJldmlldy10aWNrZXQtdHlwZS0wMDInLCB0YWc6ICdcdTk2MzJcdTZDNUJcdTVERTFcdTY3RTUnIH0sXHJcbiAgICBdKTtcclxuICBpZiAocGF0aCA9PT0gJy9jb2xsYWJvcmF0aW9uL3YxL3BvbGljZXRpY2tldHR5cGUvbGlzdCcgJiYgbWV0aG9kID09PSAnR0VUJylcclxuICAgIHJldHVybiBoYW5kbGVkKFtcclxuICAgICAgeyBpZDogJ3RpY2tldC0wMDEnLCB0YWc6ICdcdTZDQkJcdTVCODlcdThCNjZcdTYwQzUnIH0sXHJcbiAgICAgIHsgaWQ6ICd0aWNrZXQtMDAyJywgdGFnOiAnXHU1REUxXHU5MDNCXHU1MkE4XHU2MDAxJyB9LFxyXG4gICAgXSk7XHJcblxyXG4gIGlmIChwYXRoID09PSAnL2FwaS9pY3Avc2VydmVyL2NvbmZpZycgJiYgbWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgcmV0dXJuIGhhbmRsZWQoe1xyXG4gICAgICBpZDogJ3ByZXZpZXctaWNwLWNvbmZpZy0wMDEnLFxyXG4gICAgICBwcm90b2NvbDogMixcclxuICAgICAgaXA6ICcxMjcuMC4wLjEnLFxyXG4gICAgICBwb3J0OiA5NDQzLFxyXG4gICAgICB3c3NVcmw6ICd3c3M6Ly8xMjcuMC4wLjE6OTQ0My9tb2NrJyxcclxuICAgICAgdXNlcm5hbWU6ICdwcmV2aWV3LXVzZXInLFxyXG4gICAgICBwYXNzd29yZDogJ3ByZXZpZXctcGFzc3dvcmQnLFxyXG4gICAgICBkZXBhcnRtZW50SWQ6ICdkZXB0LTAwMScsXHJcbiAgICAgIGRlcGFydG1lbnROYW1lOiAnXHU1RTAyXHU1QzQwXHU2MzA3XHU2MzI1XHU0RTJEXHU1RkMzJyxcclxuICAgICAgY2FtZXJhTGV2ZWxJZDogJ2NhbWVyYS1sZXZlbC0wMDEnLFxyXG4gICAgICBjYW1lcmFMZXZlbE5hbWU6ICdcdTVFMDJcdTUzM0FcdTY0NDRcdTUwQ0ZcdTU5MzQnLFxyXG4gICAgICBlbnZpcm9ubWVudDogMCxcclxuICAgICAgc3RhdHVzOiAxLFxyXG4gICAgICByZW1hcms6ICdcdTY3MkNcdTU3MzBcdTk4ODRcdTg5QzhcdTY1NzBcdTYzNkUnLFxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIGlmIChwYXRoID09PSAnL3Byb3h5L2ljcC92MS9jYW1lcmEtbGV2ZWwvdHJlZS9zZWxlY3QnIHx8IHBhdGggPT09ICcvcHJveHkvaWNwL3YxL2NhbWVyYS1sZXZlbC90cmVlJykge1xyXG4gICAgcmV0dXJuIGhhbmRsZWQoW1xyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6ICdjYW1lcmEtbGV2ZWwtMDAxJyxcclxuICAgICAgICBsYWJlbDogJ1x1NUUwMlx1NTMzQVx1NjQ0NFx1NTBDRlx1NTkzNCcsXHJcbiAgICAgICAgY2hpbGRyZW46IFt7IGlkOiAnY2FtZXJhLWxldmVsLTAwMicsIGxhYmVsOiAnXHU0RTJEXHU1RkMzXHU1N0NFXHU1MzNBJywgcGFyZW50SWQ6ICdjYW1lcmEtbGV2ZWwtMDAxJyB9XSxcclxuICAgICAgfSxcclxuICAgIF0pO1xyXG4gIH1cclxuICBpZiAocGF0aCA9PT0gJy9wcm94eS9pY3AvdjEvZGVwYXJ0bWVudC90cmVlL3NlbGVjdCcgfHwgcGF0aCA9PT0gJy9wcm94eS9pY3AvdjEvZGVwYXJ0bWVudC90cmVlJylcclxuICAgIHJldHVybiBoYW5kbGVkKFxyXG4gICAgICBkZXBhcnRtZW50cy5tYXAoKGl0ZW0pID0+ICh7XHJcbiAgICAgICAgaWQ6IGl0ZW0uaWQsXHJcbiAgICAgICAgbGFiZWw6IGl0ZW0ubmFtZSxcclxuICAgICAgICBjaGlsZHJlbjogaXRlbS5jaGlsZHJlbi5tYXAoKGNoaWxkKSA9PiAoeyBpZDogY2hpbGQuaWQsIGxhYmVsOiBjaGlsZC5uYW1lLCBwYXJlbnRJZDogaXRlbS5pZCB9KSksXHJcbiAgICAgIH0pKSxcclxuICAgICk7XHJcbiAgaWYgKHBhdGggPT09ICcvYXV0aC92MS91c2VyL3BhZ2UvZGVwdCcgJiYgbWV0aG9kID09PSAnR0VUJylcclxuICAgIHJldHVybiBoYW5kbGVkKFxyXG4gICAgICBwYWdpbmF0ZShcclxuICAgICAgICBwZW9wbGUubWFwKCh7IGlkLCBuYW1lLCBpZENhcmQsIGRlcGFydG1lbnROYW1lLCBkZXBhcnRtZW50Q29kZSB9KSA9PiAoe1xyXG4gICAgICAgICAgaWQsXHJcbiAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgaWRDYXJkLFxyXG4gICAgICAgICAgZGVwYXJ0bWVudE5hbWUsXHJcbiAgICAgICAgICBkZXBhcnRtZW50Q29kZSxcclxuICAgICAgICAgIGRpcmVjdExlYWRlck5hbWU6ICdcdTUwM0NcdTczRURcdThEMUZcdThEMjNcdTRFQkEnLFxyXG4gICAgICAgICAgZGlyZWN0TGVhZGVySWQ6ICdwcmV2aWV3LXVzZXItMDAxJyxcclxuICAgICAgICB9KSksXHJcbiAgICAgICAgdXJsLFxyXG4gICAgICAgIGJvZHksXHJcbiAgICAgICksXHJcbiAgICApO1xyXG4gIGlmIChwYXRoID09PSAnL3Byb3h5L2ljcC92MS9pc2RuVHlwZS9saXN0JyAmJiBtZXRob2QgPT09ICdHRVQnKSB7XHJcbiAgICByZXR1cm4gaGFuZGxlZChbXHJcbiAgICAgIHsgaWQ6ICdkZXZpY2UtdHlwZS0wMDEnLCBuYW1lOiAnXHU2MjY3XHU2Q0Q1XHU4QkIwXHU1RjU1XHU0RUVBJywgdHlwZTogJ2NhbWVyYScsIGlzU2hvdzogMSwgaWNvbjogJycgfSxcclxuICAgICAgeyBpZDogJ2RldmljZS10eXBlLTAwMicsIG5hbWU6ICdcdTc5RkJcdTUyQThcdTdFQzhcdTdBRUYnLCB0eXBlOiAnbW9iaWxlJywgaXNTaG93OiAxLCBpY29uOiAnJyB9LFxyXG4gICAgXSk7XHJcbiAgfVxyXG4gIGlmICgvXlxcL3Byb3h5XFwvaWNwXFwvdjFcXC8oY2FtZXJhfGltdXNlcilcXC9wcml2KFxcL2RlcHQpP1xcL1teL10rJC8udGVzdChwYXRoKSkgcmV0dXJuIGhhbmRsZWQoW10pO1xyXG5cclxuICBpZiAocGF0aCA9PT0gJy9hcGkvZ2xvYmFscy9haS9kZXBsb3knICYmIG1ldGhvZCA9PT0gJ0dFVCcpXHJcbiAgICByZXR1cm4gaGFuZGxlZCh7IHNlcGFyYXRlZERlcGxveTogZmFsc2UsIGdyb3VwQWlIb3N0OiAnaHR0cDovLzEyNy4wLjAuMTozMDg0Ny9tb2NrL2FpJywgZ3JvdXBBaUZyb250ZW5kSG9zdDogJycgfSk7XHJcbiAgaWYgKHBhdGggPT09ICcvWEEtaWNzLWFnZW50L3Byb3h5L2FpL3YxL2FpYWdlbnQvbWFuYWdlbWVudC9zZXR0aW5ncycgJiYgbWV0aG9kID09PSAnR0VUJylcclxuICAgIHJldHVybiBoYW5kbGVkKHsgYXBwcm92YWxFbmFibGVkOiB0cnVlLCBhcHByb3ZhbFN1Yk1vZGU6IDAsIGFwcHJvdmFsU3lzdGVtVXJsOiAnJyB9KTtcclxuICBpZiAocGF0aCA9PT0gJy9YQS1pY3MtYWdlbnQvcHJveHkvYWkvdjEvYWlhZ2VudC9tYW5hZ2VtZW50L3BhZ2UnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgIHJldHVybiBoYW5kbGVkKFxyXG4gICAgICBwYWdpbmF0ZShcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAncHJldmlldy1hZ2VudC0wMDEnLFxyXG4gICAgICAgICAgICBuYW1lOiAnXHU1MkU0XHU1MkExXHU5NUVFXHU3QjU0XHU1MkE5XHU2MjRCJyxcclxuICAgICAgICAgICAgZGVzYzogJ1x1NTZERVx1N0I1NFx1NTAzQ1x1NzNFRFx1MzAwMVx1NURFMVx1OTAzQlx1NTQ4Q1x1NUU5NFx1NjAyNVx1NkQ0MVx1N0EwQlx1OTVFRVx1OTg5OCcsXHJcbiAgICAgICAgICAgIGF2YXRhclVybDogJycsXHJcbiAgICAgICAgICAgIHVybDogJ2h0dHA6Ly8xMjcuMC4wLjE6MzA4NDcvbW9jay9haS9hc3Npc3RhbnQnLFxyXG4gICAgICAgICAgICB0b2tlbjogJ3ByZXZpZXctYWdlbnQtdG9rZW4nLFxyXG4gICAgICAgICAgICBodHRwTWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIHByaW9yaXR5OiAwLFxyXG4gICAgICAgICAgICBjYXRlZ29yeUlkczogWydwcmV2aWV3LWFnZW50LWNhdGVnb3J5LTAwMSddLFxyXG4gICAgICAgICAgICBjYXRlZ29yeU5hbWU6ICdcdTUyRTRcdTUyQTFcdTY3MERcdTUyQTEnLFxyXG4gICAgICAgICAgICBpc1Jlc3RyaWN0ZWQ6IDAsXHJcbiAgICAgICAgICAgIGF1ZGlvOiAwLFxyXG4gICAgICAgICAgICB2aWRlbzogMCxcclxuICAgICAgICAgICAgaW1hZ2U6IDEsXHJcbiAgICAgICAgICAgIGRvY3VtZW50OiAxLFxyXG4gICAgICAgICAgICB2aXJ0dWFsVXNlcklkOiAncHJldmlldy12aXJ0dWFsLTAwMScsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgdXJsLFxyXG4gICAgICAgIGJvZHksXHJcbiAgICAgICksXHJcbiAgICApO1xyXG4gIH1cclxuICBpZiAocGF0aCA9PT0gJy9YQS1pY3MtYWdlbnQvcHJveHkvYWkvdjEvYWlhZ2VudC9tYW5hZ2VtZW50L2NhdGVnb3J5L2xpc3QnICYmIG1ldGhvZCA9PT0gJ0dFVCcpXHJcbiAgICByZXR1cm4gaGFuZGxlZChbXHJcbiAgICAgIHsgaWQ6ICdwcmV2aWV3LWFnZW50LWNhdGVnb3J5LTAwMScsIG5hbWU6ICdcdTUyRTRcdTUyQTFcdTY3MERcdTUyQTEnIH0sXHJcbiAgICAgIHsgaWQ6ICdwcmV2aWV3LWFnZW50LWNhdGVnb3J5LTAwMicsIG5hbWU6ICdcdThCNjZcdTYwQzVcdTc4MTRcdTUyMjQnIH0sXHJcbiAgICBdKTtcclxuICBpZiAocGF0aCA9PT0gJy9jb2xsYWJvcmF0aW9uL3YxL2FpL2Fzc2lzdGFudC9hZ2VudC9wYWdlJyAmJiBtZXRob2QgPT09ICdHRVQnKSB7XHJcbiAgICByZXR1cm4gaGFuZGxlZChcclxuICAgICAgcGFnaW5hdGUoXHJcbiAgICAgICAgW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogJ3ByZXZpZXctYWdlbnQtYmluZGluZy0wMDEnLFxyXG4gICAgICAgICAgICBhZ2VudElkOiAncHJldmlldy1hZ2VudC0wMDEnLFxyXG4gICAgICAgICAgICB2aXJ0dWFsVXNlcklkOiAncHJldmlldy12aXJ0dWFsLTAwMScsXHJcbiAgICAgICAgICAgIGNyZWF0ZWRVc2VySWQ6ICcxJyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICB1cmwsXHJcbiAgICAgICAgYm9keSxcclxuICAgICAgKSxcclxuICAgICk7XHJcbiAgfVxyXG4gIGlmIChwYXRoID09PSAnL1hBLWljcy1hZ2VudC9wcm94eS9haS92MS9haWFnZW50L21hbmFnZW1lbnQvcmVjb3JkJyAmJiBtZXRob2QgPT09ICdHRVQnKSB7XHJcbiAgICByZXR1cm4gaGFuZGxlZChcclxuICAgICAgcGFnaW5hdGUoXHJcbiAgICAgICAgW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogJ3ByZXZpZXctYWdlbnQtcmVjb3JkLTAwMScsXHJcbiAgICAgICAgICAgIHVzZXJOYW1lOiAnXHU1RjIwXHU2NjY4JyxcclxuICAgICAgICAgICAgaWRlbnRpdHlDYXJkTnVtYmVyOiAnTU9DSy1JRC0wMDEnLFxyXG4gICAgICAgICAgICBhZ2VudE5hbWU6ICdcdTUyRTRcdTUyQTFcdTk1RUVcdTdCNTRcdTUyQTlcdTYyNEInLFxyXG4gICAgICAgICAgICBkZXBhcnRtZW50TmFtZTogJ1x1NUUwMlx1NUM0MFx1NjMwN1x1NjMyNVx1NEUyRFx1NUZDMycsXHJcbiAgICAgICAgICAgIHF1ZXJ5Q29udGVudDogJ1x1NTkxQ1x1NzNFRFx1NEVBNFx1NjNBNVx1OTcwMFx1ODk4MVx1NTg2Qlx1NTE5OVx1NTRFQVx1NEU5Qlx1NTE4NVx1NUJCOVx1RkYxRicsXHJcbiAgICAgICAgICAgIHRpbWU6ICcyMDI2LTA5LTI2IDA4OjEwOjAwJyxcclxuICAgICAgICAgICAgcmVzcG9uc2VDb250ZW50OiAnXHU4QkY3XHU4QkIwXHU1RjU1XHU1NzI4XHU1Qzk3XHU0RUJBXHU1NDU4XHUzMDAxXHU2NzJBXHU3RUQzXHU4QjY2XHU2MEM1XHU1NDhDXHU4QkJFXHU1OTA3XHU3MkI2XHU2MDAxXHUzMDAyJyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICB1cmwsXHJcbiAgICAgICAgYm9keSxcclxuICAgICAgKSxcclxuICAgICk7XHJcbiAgfVxyXG4gIGlmIChwYXRoID09PSAnL1hBLWljcy1hZ2VudC9wcm94eS9haS92MS9haWFnZW50L2F0dGFjaG1lbnQtY29uZmlnL2xpc3QnICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgIHJldHVybiBoYW5kbGVkKFtcclxuICAgICAge1xyXG4gICAgICAgIGlkOiAncHJldmlldy1hZ2VudC1maWxlLTAwMScsXHJcbiAgICAgICAgbmFtZTogJ1x1NjU4N1x1NEVGNlx1ODlFM1x1Njc5MFx1NjcwRFx1NTJBMScsXHJcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgaXA6ICcxMjcuMC4wLjEnLFxyXG4gICAgICAgIHBvcnQ6IDgwODAsXHJcbiAgICAgICAgdXJpOiAnL21vY2svZmlsZXMvcGFyc2UnLFxyXG4gICAgICAgIGhlYWRlcjogJ3t9JyxcclxuICAgICAgICBxdWVyeTogJ3t9JyxcclxuICAgICAgICBib2R5OiAne30nLFxyXG4gICAgICAgIHJlcG9uc2VGaWxlRmlsZWQ6ICdmaWxlVXJsJyxcclxuICAgICAgICBkZXNjOiAnXHU2NzJDXHU1NzMwXHU2ODM3XHU0RjhCXHU2M0E1XHU1M0UzJyxcclxuICAgICAgfSxcclxuICAgIF0pO1xyXG4gIH1cclxuXHJcbiAgaWYgKHBhdGggPT09ICcvbm9kZS92MS9wMnAvc2VydmVycycgJiYgbWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgcmV0dXJuIGhhbmRsZWQoXHJcbiAgICAgIHBhZ2luYXRlKFxyXG4gICAgICAgIFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgaWQ6ICdwcmV2aWV3LXNlcnZlci0wMDEnLFxyXG4gICAgICAgICAgICBwZWVySWQ6ICdwcmV2aWV3LXBlZXItMDAxJyxcclxuICAgICAgICAgICAgaXA6ICcxMjcuMC4wLjEnLFxyXG4gICAgICAgICAgICBwb3J0OiAzMDAxNyxcclxuICAgICAgICAgICAgbmFtZTogJ1x1NUUwMlx1NUM0MFx1NEUzQlx1ODI4Mlx1NzBCOScsXHJcbiAgICAgICAgICAgIHRhZzogJ21haW4nLFxyXG4gICAgICAgICAgICByZW1hcms6ICdcdTY3MkNcdTU3MzBcdTk4ODRcdTg5QzhcdTgyODJcdTcwQjknLFxyXG4gICAgICAgICAgICBjcmVhdGVVc2VyTmFtZTogJ01vY2tcdTdCQTFcdTc0MDZcdTU0NTgnLFxyXG4gICAgICAgICAgICBnbXRDcmVhdGVkOiAnMjAyNi0wNC0wMiAxMDowMDowMCcsXHJcbiAgICAgICAgICAgIHN0YXR1czogMSxcclxuICAgICAgICAgICAgc3RhdHVzRGVzYzogJ1x1OEZERVx1NjNBNVx1NkI2M1x1NUUzOCcsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogJ3ByZXZpZXctc2VydmVyLTAwMicsXHJcbiAgICAgICAgICAgIHBlZXJJZDogJ3ByZXZpZXctcGVlci0wMDInLFxyXG4gICAgICAgICAgICBpcDogJzEyNy4wLjAuMicsXHJcbiAgICAgICAgICAgIHBvcnQ6IDMwMDE3LFxyXG4gICAgICAgICAgICBuYW1lOiAnXHU2RjE0XHU3OTNBXHU1OTA3XHU4MjgyXHU3MEI5JyxcclxuICAgICAgICAgICAgdGFnOiAnYmFja3VwJyxcclxuICAgICAgICAgICAgcmVtYXJrOiAnTW9jayBcdTY1NzBcdTYzNkUnLFxyXG4gICAgICAgICAgICBjcmVhdGVVc2VyTmFtZTogJ01vY2tcdTdCQTFcdTc0MDZcdTU0NTgnLFxyXG4gICAgICAgICAgICBnbXRDcmVhdGVkOiAnMjAyNi0wNS0xMCAxNjozMDowMCcsXHJcbiAgICAgICAgICAgIHN0YXR1czogMixcclxuICAgICAgICAgICAgc3RhdHVzRGVzYzogJ1x1N0I0OVx1NUY4NVx1OEZERVx1NjNBNScsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgdXJsLFxyXG4gICAgICAgIGJvZHksXHJcbiAgICAgICksXHJcbiAgICApO1xyXG4gIH1cclxuICBpZiAocGF0aCA9PT0gJy9ub2RlL3YxL3AycC9jbGllbnRzJyAmJiBtZXRob2QgPT09ICdHRVQnKSB7XHJcbiAgICByZXR1cm4gaGFuZGxlZChcclxuICAgICAgcGFnaW5hdGUoXHJcbiAgICAgICAgW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogJ3ByZXZpZXctY2xpZW50LW5vZGUtMDAxJyxcclxuICAgICAgICAgICAgcGVlcklkOiAncHJldmlldy1jbGllbnQtcGVlci0wMDEnLFxyXG4gICAgICAgICAgICBpcDogJzEyNy4wLjAuMycsXHJcbiAgICAgICAgICAgIHBvcnQ6IDMwMDE3LFxyXG4gICAgICAgICAgICBuYW1lOiAnXHU1RTk0XHU2MDI1XHU2MzA3XHU2MzI1XHU1QkEyXHU2MjM3XHU3QUVGJyxcclxuICAgICAgICAgICAgdGFnOiAnZGlzcGF0Y2gnLFxyXG4gICAgICAgICAgICByZW1hcms6ICdcdTY3MkNcdTU3MzBcdTVCQTJcdTYyMzdcdTdBRUZcdTY4MzdcdTRGOEInLFxyXG4gICAgICAgICAgICBncmFudDogMSxcclxuICAgICAgICAgICAgZXhwaXJlZDogZmFsc2UsXHJcbiAgICAgICAgICAgIGdyYW50VXNlck5hbWU6ICdNb2NrXHU3QkExXHU3NDA2XHU1NDU4JyxcclxuICAgICAgICAgICAgZ3JhbnRUaW1lOiAnMjAyNi0wNi0xMCAwOTowMDowMCcsXHJcbiAgICAgICAgICAgIGV4cGlyZWRJbjogMTc5ODc2MTYwMDAwMCxcclxuICAgICAgICAgICAgc3RhdHVzOiAxLFxyXG4gICAgICAgICAgICBzdGF0dXNEZXNjOiAnXHU4RkRFXHU2M0E1XHU2QjYzXHU1RTM4JyxcclxuICAgICAgICAgICAgbGFzdFNlZW46ICcyMDI2LTA5LTI2IDEwOjIwOjAwJyxcclxuICAgICAgICAgICAgZ210Q3JlYXRlZDogJzIwMjYtMDYtMTAgMDg6MzA6MDAnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHVybCxcclxuICAgICAgICBib2R5LFxyXG4gICAgICApLFxyXG4gICAgKTtcclxuICB9XHJcbiAgaWYgKC9eXFwvbm9kZVxcL3YxXFwvcDJwXFwvc2VydmVyc1xcL1teL10rXFwvb3BlbmRhdGFcXC9ncmFudCQvLnRlc3QocGF0aCkgJiYgbWV0aG9kID09PSAnR0VUJylcclxuICAgIHJldHVybiBoYW5kbGVkKHsgdXNlcnM6IDEsIGdyb3VwczogMSwgbXNnOiAxLCBoNTogMSwgYWdlbnQ6IDAsIGNvb3BVc2VyOiAxIH0pO1xyXG4gIGlmICgvXlxcL25vZGVcXC92MVxcL3AycFxcL1teL10rXFwvb3BlbmRhdGFcXC9zdGF0aXN0aWMkLy50ZXN0KHBhdGgpICYmIG1ldGhvZCA9PT0gJ0dFVCcpXHJcbiAgICByZXR1cm4gaGFuZGxlZCh7XHJcbiAgICAgIHVzZXJzOiB7IGNvb3BVc2VyQ291bnQ6IDM2IH0sXHJcbiAgICAgIGdyb3VwczogeyBjb29wR3JvdXBDb3VudDogMTIsIG5vcm1hbEdyb3VwQ291bnQ6IDI4IH0sXHJcbiAgICAgIG1zZzogeyBjb29wTXNnOiAzMjAgfSxcclxuICAgICAgaDU6IHsgY291bnQ6IDE4IH0sXHJcbiAgICAgIGFnZW50OiB7IGNvdW50OiA0IH0sXHJcbiAgICB9KTtcclxuICBpZiAoL15cXC9ub2RlXFwvdjFcXC9wMnBcXC9bXi9dK1xcL29wZW5kYXRhXFwvY29vcFxcL3NlYXJjaCQvLnRlc3QocGF0aCkgJiYgbWV0aG9kID09PSAnR0VUJylcclxuICAgIHJldHVybiBoYW5kbGVkKFxyXG4gICAgICBjb2xsYWJvcmF0aW9ucy5tYXAoKHsgaWQsIHBvc3ROYW1lLCBvcmdOYW1lLCByZWxhdGVkVXNlck5hbWVzLCByZWxhdGVkVXNlcklkcywgaWNvblVybCB9KSA9PiAoe1xyXG4gICAgICAgIGlkLFxyXG4gICAgICAgIHBvc3ROYW1lLFxyXG4gICAgICAgIG9yZ05hbWUsXHJcbiAgICAgICAgcmVsYXRlZFVzZXJOYW1lcyxcclxuICAgICAgICByZWxhdGVkVXNlcklkcyxcclxuICAgICAgICBpY29uVXJsLFxyXG4gICAgICB9KSksXHJcbiAgICApO1xyXG5cclxuICBpZiAocGF0aCA9PT0gJy9hcGkvZ2xvYmFscy9haS9kZXBsb3knIHx8IHBhdGguc3RhcnRzV2l0aCgnL1hBLWljcy1hZ2VudC8nKSB8fCBwYXRoLnN0YXJ0c1dpdGgoJy9wcm94eS9pY3AvJykpIHtcclxuICAgIHJldHVybiB7IGhhbmRsZWQ6IGZhbHNlIH07XHJcbiAgfVxyXG4gIGlmIChwYXRoID09PSAnL2NvbGxhYm9yYXRpb24vdjEvdGFncy9wYWdlJykgcmV0dXJuIHsgaGFuZGxlZDogZmFsc2UgfTtcclxuICBpZiAocGF0aCA9PT0gJy9hcGkvZ2xvYmFscy9saXN0JyB8fCBwYXRoID09PSAnL2Jhc2UvdjEvZ2xvYmFscy9nZXRHbG9iYWxzTGlzdCcpIHJldHVybiB7IGhhbmRsZWQ6IGZhbHNlIH07XHJcblxyXG4gIHJldHVybiB7IGhhbmRsZWQ6IGZhbHNlIH07XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJGOlxcXFx3b3JrXFxcXGxpbmt4LWFkbWluXFxcXG90aGVyLWFkbWluXFxcXGFkbWluLXZ1ZTNcXFxcbW9ja1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRjpcXFxcd29ya1xcXFxsaW5reC1hZG1pblxcXFxvdGhlci1hZG1pblxcXFxhZG1pbi12dWUzXFxcXG1vY2tcXFxccHJldmlldy1tZW51LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9GOi93b3JrL2xpbmt4LWFkbWluL290aGVyLWFkbWluL2FkbWluLXZ1ZTMvbW9jay9wcmV2aWV3LW1lbnUudHNcIjtleHBvcnQgaW50ZXJmYWNlIFByZXZpZXdNZW51SXRlbSB7XHJcbiAgaWQ6IHN0cmluZztcclxuICBuYW1lOiBzdHJpbmc7XHJcbiAgcGFyZW50SWQ6IHN0cmluZztcclxuICBhcHBsaWNhdGlvbklkOiBzdHJpbmc7XHJcbiAgdXJsOiBzdHJpbmc7XHJcbiAgaW1ndXJsPzogc3RyaW5nO1xyXG4gIGlzbGVhZjogMCB8IDE7XHJcbiAgbGV2ZWw6IDEgfCAyO1xyXG4gIHNvcnQ6IG51bWJlcjtcclxuICBzdGF0dXM6IDE7XHJcbiAgY2hpbGRyZW4/OiBQcmV2aWV3TWVudUl0ZW1bXTtcclxufVxyXG5cclxuaW50ZXJmYWNlIFByZXZpZXdNZW51TW9kdWxlIHtcclxuICB1cmw6IHN0cmluZztcclxuICBuYW1lOiBzdHJpbmc7XHJcbiAgaWNvbjogc3RyaW5nO1xyXG4gIGNoaWxkcmVuOiBBcnJheTxbc3RyaW5nLCBzdHJpbmddPjtcclxufVxyXG5cclxuY29uc3QgbWVudU1vZHVsZXM6IFByZXZpZXdNZW51TW9kdWxlW10gPSBbXHJcbiAge1xyXG4gICAgdXJsOiAnL2Jhc2VEYXRhJyxcclxuICAgIG5hbWU6ICdcdTdDRkJcdTdFREZcdTkxNERcdTdGNkUnLFxyXG4gICAgaWNvbjogJ2NvbXBvbmVudCcsXHJcbiAgICBjaGlsZHJlbjogW1xyXG4gICAgICBbJ3RoaXJkUGFydHknLCAnXHU0RTA5XHU2NUI5XHU2M0E1XHU1MTY1XHU3QkExXHU3NDA2J10sXHJcbiAgICAgIFsnZ2xvYmFscycsICdcdTUxNjhcdTVDNDBcdTUzQzJcdTY1NzBcdTkxNERcdTdGNkUnXSxcclxuICAgICAgWydtYXBDb25maWcnLCAnXHU1NzMwXHU1NkZFXHU5MTREXHU3RjZFJ10sXHJcbiAgICAgIFsnbGF5b3V0Q29uZmlnJywgJ1x1NUUwM1x1NUM0MFx1OTE0RFx1N0Y2RSddLFxyXG4gICAgXSxcclxuICB9LFxyXG4gIHtcclxuICAgIHVybDogJy9hdXRob3JpdHknLFxyXG4gICAgbmFtZTogJ1x1Njc0M1x1OTY1MFx1NEUyRFx1NUZDMycsXHJcbiAgICBpY29uOiAncGFzc3dvcmQnLFxyXG4gICAgY2hpbGRyZW46IFtcclxuICAgICAgWydyb2xlJywgJ1x1ODlEMlx1ODI3Mlx1N0JBMVx1NzQwNiddLFxyXG4gICAgICBbJ3BlcnNvbicsICdcdTY3NDNcdTk2NTBcdTdCQTFcdTc0MDYnXSxcclxuICAgICAgWyd1c2VyTWFuYWdlJywgJ1x1NzUyOFx1NjIzN1x1N0JBMVx1NzQwNiddLFxyXG4gICAgICBbJ0lNUGVybWlzc2lvbicsICdcdTUyNERcdTUzRjBcdTY3NDNcdTk2NTBcdTdCQTFcdTc0MDYnXSxcclxuICAgICAgWydJTXJvbGUnLCAnXHU1MjREXHU1M0YwXHU4OUQyXHU4MjcyXHU3QkExXHU3NDA2J10sXHJcbiAgICAgIFsnSU1wZXJzb24nLCAnXHU1MjREXHU1M0YwXHU3NTI4XHU2MjM3XHU3QkExXHU3NDA2J10sXHJcbiAgICAgIFsnYWRtaW5QZXJtaXNzaW9uJywgJ1x1NTQwRVx1NTNGMFx1Njc0M1x1OTY1MFx1N0JBMVx1NzQwNiddLFxyXG4gICAgICBbJ2FkbWluUm9sZScsICdcdTU0MEVcdTUzRjBcdTg5RDJcdTgyNzJcdTdCQTFcdTc0MDYnXSxcclxuICAgICAgWydhZG1pblBlcnNvbicsICdcdTU0MEVcdTUzRjBcdTc1MjhcdTYyMzdcdTdCQTFcdTc0MDYnXSxcclxuICAgICAgWydjdXN0b21EZXBhcnRtZW50JywgJ1x1ODFFQVx1NUI5QVx1NEU0OVx1N0VDNFx1N0VDN1x1N0JBMVx1NzQwNiddLFxyXG4gICAgXSxcclxuICB9LFxyXG4gIHtcclxuICAgIHVybDogJy9jb2xsYWJvcmF0aW9uJyxcclxuICAgIG5hbWU6ICdcdTUzNEZcdTU0MENcdTVDOTdcdTdCQTFcdTc0MDYnLFxyXG4gICAgaWNvbjogJ2NoYXQnLFxyXG4gICAgY2hpbGRyZW46IFtcclxuICAgICAgWydpbmRleCcsICdcdTUzNEZcdTU0MENcdTVDOTdcdTdCQTFcdTc0MDYnXSxcclxuICAgICAgWydxdWljaycsICdcdTY4MDdcdTdCN0VcdTdCQTFcdTc0MDYnXSxcclxuICAgIF0sXHJcbiAgfSxcclxuICB7XHJcbiAgICB1cmw6ICcvaDUnLFxyXG4gICAgbmFtZTogJ0g1XHU3QkExXHU3NDA2JyxcclxuICAgIGljb246ICdtb2JpbGUnLFxyXG4gICAgY2hpbGRyZW46IFtcclxuICAgICAgWydjYXJvdXNlbCcsICdcdThGNkVcdTY0QURcdTU2RkVcdTdCQTFcdTc0MDYnXSxcclxuICAgICAgWydHcm91cFRhZ3MnLCAnXHU3RkE0XHU3RUM0XHU2ODA3XHU3QjdFXHU3QkExXHU3NDA2J10sXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgdXJsOiAnL2xvY2F0aW9uJyxcclxuICAgIG5hbWU6ICdcdTRGNERcdTdGNkVcdTdCQTFcdTc0MDYnLFxyXG4gICAgaWNvbjogJ21hcCcsXHJcbiAgICBjaGlsZHJlbjogW1snbG9jYXRpb24nLCAnXHU0RjREXHU3RjZFXHU0RkUxXHU2MDZGJ11dLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgdXJsOiAnL3NjaGVkdWxpbmcnLFxyXG4gICAgbmFtZTogJ1x1NjM5Mlx1NzNFRFx1N0JBMVx1NzQwNicsXHJcbiAgICBpY29uOiAnZG9jdW1lbnQnLFxyXG4gICAgY2hpbGRyZW46IFtcclxuICAgICAgWydkdXR5VHlwZScsICdcdTYzOTJcdTczRURcdTdDN0JcdTU3OEJcdTdCQTFcdTc0MDYnXSxcclxuICAgICAgWydkdXR5SW5mb3JtYXRpb24nLCAnXHU2MzkyXHU3M0VEXHU0RkUxXHU2MDZGJ10sXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgdXJsOiAnL25vdGlmaWNhdGlvbicsXHJcbiAgICBuYW1lOiAnXHU5ODg0XHU4QjY2XHU3QkExXHU3NDA2JyxcclxuICAgIGljb246ICdiZWxsJyxcclxuICAgIGNoaWxkcmVuOiBbWydhbGVydFB1c2gnLCAnXHU5ODg0XHU4QjY2XHU2M0E4XHU5MDAxJ11dLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgdXJsOiAnL3BvbGljZUV4dGVuZCcsXHJcbiAgICBuYW1lOiAnXHU4QjY2XHU0RkUxXHU2MjY5XHU1QzU1XHU0RkUxXHU2MDZGXHU3QkExXHU3NDA2JyxcclxuICAgIGljb246ICd1c2VyJyxcclxuICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgIFsndmlydHVhbFVzZXInLCAnXHU4NjVBXHU2MkRGXHU3NTI4XHU2MjM3XHU3QkExXHU3NDA2J10sXHJcbiAgICAgIFsnQXJjaGl2ZWRUYWJsZScsICdcdTVERjJcdTVGNTJcdTY4NjNcdTdGQTRcdTdFQzRcdTdCQTFcdTc0MDYnXSxcclxuICAgIF0sXHJcbiAgfSxcclxuICB7XHJcbiAgICB1cmw6ICcvdGhpcmRQYXJ0eScsXHJcbiAgICBuYW1lOiAnXHU0RTA5XHU2NUI5XHU1QkY5XHU2M0E1JyxcclxuICAgIGljb246ICdjb25uZWN0aW9uJyxcclxuICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgIFsnYXBwJywgJ1x1NUU5NFx1NzUyOFx1N0JBMVx1NzQwNiddLFxyXG4gICAgICBbJ3NvdXRoSW50ZXJmYWNlJywgJ1x1NTM1N1x1NTQxMVx1NUJGOVx1NjNBNSddLFxyXG4gICAgICBbJ3BvbGljZVJlcG9ydCcsICdcdThCNjZcdTUzNTVcdTVFNzNcdTUzRjAnXSxcclxuICAgICAgWyd1bmlmaWVkQ29tbScsICdcdTkwMUFcdTRGRTFcdTY3MERcdTUyQTFcdTdCQTFcdTc0MDYnXSxcclxuICAgICAgWydhZ2VudEludGVyZmFjZScsICdBSVx1NjY3QVx1ODBGRFx1NEY1M1x1NUJGOVx1NjNBNVx1RkYwOFx1NTM1N1x1NTQxMVx1RkYwOSddLFxyXG4gICAgICBbJ3RoaXJkUGFydHknLCAnXHU1MzE3XHU1NDExXHU2M0E1XHU1MTY1XHU3QkExXHU3NDA2J10sXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgdXJsOiAnL25vZGVNYW5hZ2UnLFxyXG4gICAgbmFtZTogJ1x1NTkxQVx1ODI4Mlx1NzBCOVx1N0JBMVx1NzQwNicsXHJcbiAgICBpY29uOiAnbW9uaXRvcicsXHJcbiAgICBjaGlsZHJlbjogW1xyXG4gICAgICBbJ25vZGVNYW5hZ2VtZW50JywgJ1x1ODI4Mlx1NzBCOVx1N0JBMVx1NzQwNiddLFxyXG4gICAgICBbJ2RhdGFNYW5hZ2UnLCAnXHU2NTcwXHU2MzZFXHU3QkExXHU3NDA2J10sXHJcbiAgICBdLFxyXG4gIH0sXHJcbl07XHJcblxyXG5jb25zdCByb3V0ZU1vZHVsZU9yZGVyID0gW1xyXG4gICcvYmFzZURhdGEnLFxyXG4gICcvaDUnLFxyXG4gICcvY29sbGFib3JhdGlvbicsXHJcbiAgJy9hdXRob3JpdHknLFxyXG4gICcvbG9jYXRpb24nLFxyXG4gICcvc2NoZWR1bGluZycsXHJcbiAgJy9ub3RpZmljYXRpb24nLFxyXG4gICcvcG9saWNlRXh0ZW5kJyxcclxuICAnL3RoaXJkUGFydHknLFxyXG4gICcvbm9kZU1hbmFnZScsXHJcbl07XHJcblxyXG5leHBvcnQgY29uc3QgcHJldmlld01lbnU6IFByZXZpZXdNZW51SXRlbVtdID0gWy4uLm1lbnVNb2R1bGVzXVxyXG4gIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcm91dGVNb2R1bGVPcmRlci5pbmRleE9mKGxlZnQudXJsKSAtIHJvdXRlTW9kdWxlT3JkZXIuaW5kZXhPZihyaWdodC51cmwpKVxyXG4gIC5tYXAoKG1vZHVsZSwgcGFyZW50SW5kZXgpOiBQcmV2aWV3TWVudUl0ZW0gPT4ge1xyXG4gICAgY29uc3QgcGFyZW50SWQgPSBgcGFyZW50LSR7cGFyZW50SW5kZXh9YDtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGlkOiBwYXJlbnRJZCxcclxuICAgICAgbmFtZTogbW9kdWxlLm5hbWUsXHJcbiAgICAgIHBhcmVudElkOiAnMCcsXHJcbiAgICAgIGFwcGxpY2F0aW9uSWQ6ICcnLFxyXG4gICAgICB1cmw6IG1vZHVsZS51cmwsXHJcbiAgICAgIGltZ3VybDogbW9kdWxlLmljb24sXHJcbiAgICAgIGlzbGVhZjogMCxcclxuICAgICAgbGV2ZWw6IDEsXHJcbiAgICAgIHNvcnQ6IHBhcmVudEluZGV4ICsgMSxcclxuICAgICAgc3RhdHVzOiAxLFxyXG4gICAgICBjaGlsZHJlbjogbW9kdWxlLmNoaWxkcmVuLm1hcCgoW3BhdGgsIG5hbWVdLCBjaGlsZEluZGV4KTogUHJldmlld01lbnVJdGVtID0+ICh7XHJcbiAgICAgICAgaWQ6IGAke21vZHVsZS51cmx9LSR7cGF0aH1gLFxyXG4gICAgICAgIG5hbWUsXHJcbiAgICAgICAgcGFyZW50SWQsXHJcbiAgICAgICAgYXBwbGljYXRpb25JZDogJycsXHJcbiAgICAgICAgdXJsOiBgJHttb2R1bGUudXJsfS8ke3BhdGh9YCxcclxuICAgICAgICBpc2xlYWY6IDEsXHJcbiAgICAgICAgbGV2ZWw6IDIsXHJcbiAgICAgICAgc29ydDogY2hpbGRJbmRleCArIDEsXHJcbiAgICAgICAgc3RhdHVzOiAxLFxyXG4gICAgICB9KSksXHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IHByZXZpZXdNZW51UGVybWlzc2lvbnMgPSBwcmV2aWV3TWVudS5mbGF0TWFwKChwYXJlbnQpID0+IFtcclxuICBwYXJlbnQuaWQsXHJcbiAgLi4uKHBhcmVudC5jaGlsZHJlbiA/PyBbXSkubWFwKChjaGlsZCkgPT4gY2hpbGQuaWQpLFxyXG5dKTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMaW1pdGVkUHJldmlld01lbnVQZXJtaXNzaW9ucygpOiBzdHJpbmdbXSB7XHJcbiAgY29uc3QgaDVNZW51ID0gcHJldmlld01lbnUuZmluZCgoaXRlbSkgPT4gaXRlbS51cmwgPT09ICcvaDUnKTtcclxuICBjb25zdCBjYXJvdXNlbE1lbnUgPSBoNU1lbnU/LmNoaWxkcmVuPy5maW5kKChpdGVtKSA9PiBpdGVtLnVybCA9PT0gJy9oNS9jYXJvdXNlbCcpO1xyXG4gIHJldHVybiBbaDVNZW51Py5pZCwgY2Fyb3VzZWxNZW51Py5pZF0uZmlsdGVyKChpZCk6IGlkIGlzIHN0cmluZyA9PiBCb29sZWFuKGlkKSk7XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJGOlxcXFx3b3JrXFxcXGxpbmt4LWFkbWluXFxcXG90aGVyLWFkbWluXFxcXGFkbWluLXZ1ZTNcXFxcbW9ja1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRjpcXFxcd29ya1xcXFxsaW5reC1hZG1pblxcXFxvdGhlci1hZG1pblxcXFxhZG1pbi12dWUzXFxcXG1vY2tcXFxccHJldmlldy1zZXJ2ZXIudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Y6L3dvcmsvbGlua3gtYWRtaW4vb3RoZXItYWRtaW4vYWRtaW4tdnVlMy9tb2NrL3ByZXZpZXctc2VydmVyLnRzXCI7aW1wb3J0IHR5cGUgeyBJbmNvbWluZ01lc3NhZ2UsIFNlcnZlclJlc3BvbnNlIH0gZnJvbSAnbm9kZTpodHRwJztcclxuXHJcbmltcG9ydCB0eXBlIHsgUGx1Z2luIH0gZnJvbSAndml0ZSc7XHJcblxyXG5pbXBvcnQgeyBnZXRQcmV2aWV3RGF0YSwgcHJldmlld1RoaXJkQXBwcyB9IGZyb20gJy4vcHJldmlldy1kYXRhJztcclxuaW1wb3J0IHsgcHJldmlld01lbnUsIHByZXZpZXdNZW51UGVybWlzc2lvbnMgfSBmcm9tICcuL3ByZXZpZXctbWVudSc7XHJcblxyXG5pbnRlcmZhY2UgUHJldmlld0dyb3VwVGFnIHtcclxuICBpZDogc3RyaW5nO1xyXG4gIG5hbWU6IHN0cmluZztcclxuICBpY29uOiBzdHJpbmc7XHJcbiAgY29sb3I6IHN0cmluZztcclxufVxyXG5cclxuY29uc3QgaW5pdGlhbFRhZ3M6IFByZXZpZXdHcm91cFRhZ1tdID0gW1xyXG4gIHsgaWQ6ICdwcmV2aWV3LTAwMScsIG5hbWU6ICdcdTUwM0NcdTczRURcdTkwMUFcdTc3RTUnLCBpY29uOiAnZmFzIGZhLWJlbGwnLCBjb2xvcjogJyM0MDllZmYnIH0sXHJcbiAgeyBpZDogJ3ByZXZpZXctMDAyJywgbmFtZTogJ1x1NURFMVx1OTAzQlx1NTJBOFx1NjAwMScsIGljb246ICdmYXMgZmEtbWFwLW1hcmtlci1hbHQnLCBjb2xvcjogJyM2N2MyM2EnIH0sXHJcbiAgeyBpZDogJ3ByZXZpZXctMDAzJywgbmFtZTogJ1x1NTM0Rlx1NTQwQ1x1NTkwNFx1N0Y2RScsIGljb246ICdmYXMgZmEtdXNlcnMnLCBjb2xvcjogJyNlNmEyM2MnIH0sXHJcbiAgeyBpZDogJ3ByZXZpZXctMDA0JywgbmFtZTogJ1x1NEYxQVx1OEJBRVx1NUI4OVx1NjM5MicsIGljb246ICdmYXMgZmEtY2FsZW5kYXInLCBjb2xvcjogJyM5MDkzOTknIH0sXHJcbiAgeyBpZDogJ3ByZXZpZXctMDA1JywgbmFtZTogJ1x1N0NGQlx1N0VERlx1NTE2Q1x1NTQ0QScsIGljb246ICdmYXMgZmEtYnVsbGhvcm4nLCBjb2xvcjogJyNmNTZjNmMnIH0sXHJcbl07XHJcblxyXG5jb25zdCBwcmV2aWV3SW1hZ2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xyXG4gICcvbW9jay9pbWFnZXMvZHV0eS1iYW5uZXIuc3ZnJzogYDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHdpZHRoPVwiNjgwXCIgaGVpZ2h0PVwiMzIwXCIgdmlld0JveD1cIjAgMCA2ODAgMzIwXCI+XHJcbiAgICA8ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9XCJza3lcIiB4MT1cIjBcIiB5MT1cIjBcIiB4Mj1cIjFcIiB5Mj1cIjFcIj48c3RvcCBzdG9wLWNvbG9yPVwiI2Q5ZWZmZlwiLz48c3RvcCBvZmZzZXQ9XCIxXCIgc3RvcC1jb2xvcj1cIiNmNGZiZmZcIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+XHJcbiAgICA8cmVjdCB3aWR0aD1cIjY4MFwiIGhlaWdodD1cIjMyMFwiIHJ4PVwiMTZcIiBmaWxsPVwidXJsKCNza3kpXCIvPjxjaXJjbGUgY3g9XCI1NjBcIiBjeT1cIjcyXCIgcj1cIjM0XCIgZmlsbD1cIiNmNGM5NmJcIiBvcGFjaXR5PVwiLjkyXCIvPlxyXG4gICAgPHBhdGggZD1cIk0wIDIyOCA4NiAxNzhsNjQgMzQgOTAtODggNzggNTQgODAtNzEgMTAxIDcxIDY2LTM2IDExNSA3OHYxMDBIMFpcIiBmaWxsPVwiI2E4ZDdkZlwiLz5cclxuICAgIDxwYXRoIGQ9XCJNMCAyNTMgMTEyIDIwOGw4NiAzOSA4OC02MSA3OCA0MyA5OS03MiA4NyA2MyA2MS0yOCA2OSAzN3Y5MUgwWlwiIGZpbGw9XCIjNzViOWI0XCIvPlxyXG4gICAgPHBhdGggZD1cIk0wIDI3Mmg2ODB2NDhIMFpcIiBmaWxsPVwiIzRkOWI5MVwiLz48cGF0aCBkPVwiTTM5MiAyNzF2LTg0bDI0LTE5IDI0IDE5djg0bTMyIDB2LTEwOGwyOS0yNCAyOSAyNHYxMDhtMzQgMHYtNzZsMjEtMTcgMjEgMTd2NzZcIiBmaWxsPVwiI2Y0ZmJmZlwiIG9wYWNpdHk9XCIuOFwiLz5cclxuICAgIDxyZWN0IHg9XCIzNFwiIHk9XCIzMFwiIHdpZHRoPVwiMjEyXCIgaGVpZ2h0PVwiMjhcIiByeD1cIjE0XCIgZmlsbD1cIiNmZmZmZmZcIiBvcGFjaXR5PVwiLjg2XCIvPjxjaXJjbGUgY3g9XCI1MlwiIGN5PVwiNDRcIiByPVwiNVwiIGZpbGw9XCIjMTY4YTdiXCIvPlxyXG4gICAgPHRleHQgeD1cIjY4XCIgeT1cIjQ5XCIgZmlsbD1cIiMzNTY0NmJcIiBmb250LXNpemU9XCIxNFwiIGZvbnQtZmFtaWx5PVwiTWljcm9zb2Z0IFlhSGVpLHNhbnMtc2VyaWZcIj5cdTVFMDJcdTVDNDBcdTYzMDdcdTYzMjVcdTRFMkRcdTVGQzMgXHUwMEI3IFx1NTJFNFx1NTJBMVx1NUI4OVx1NjM5MjwvdGV4dD5cclxuICAgIDx0ZXh0IHg9XCIzNlwiIHk9XCIxMTNcIiBmaWxsPVwiIzE3NDY1YlwiIGZvbnQtc2l6ZT1cIjM0XCIgZm9udC13ZWlnaHQ9XCI3MDBcIiBmb250LWZhbWlseT1cIk1pY3Jvc29mdCBZYUhlaSxzYW5zLXNlcmlmXCI+XHU1RTk0XHU2MDI1XHU1MDNDXHU1Qjg4XHU1Qjg5XHU2MzkyPC90ZXh0PlxyXG4gICAgPHRleHQgeD1cIjM4XCIgeT1cIjE0M1wiIGZpbGw9XCIjNDI2Yzc4XCIgZm9udC1zaXplPVwiMTZcIiBmb250LWZhbWlseT1cIk1pY3Jvc29mdCBZYUhlaSxzYW5zLXNlcmlmXCI+XHU5MUNEXHU3MEI5XHU2NUY2XHU2QkI1XHU1NzI4XHU1Qzk3XHU0RkUxXHU2MDZGXHU0RTBFXHU0RUE0XHU2M0E1XHU2M0QwXHU5MTkyPC90ZXh0PlxyXG4gICAgPHJlY3QgeD1cIjM4XCIgeT1cIjE2NlwiIHdpZHRoPVwiMTA2XCIgaGVpZ2h0PVwiMzRcIiByeD1cIjE3XCIgZmlsbD1cIiMxNjdmODNcIi8+PHRleHQgeD1cIjU3XCIgeT1cIjE4OVwiIGZpbGw9XCIjZmZmZmZmXCIgZm9udC1zaXplPVwiMTRcIiBmb250LWZhbWlseT1cIk1pY3Jvc29mdCBZYUhlaSxzYW5zLXNlcmlmXCI+XHU0RUNBXHU2NUU1XHU1MDNDXHU1Qjg4PC90ZXh0PlxyXG4gIDwvc3ZnPmAsXHJcbiAgJy9tb2NrL2ltYWdlcy9wYXRyb2wtYmFubmVyLnN2Zyc6IGA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB3aWR0aD1cIjY4MFwiIGhlaWdodD1cIjMyMFwiIHZpZXdCb3g9XCIwIDAgNjgwIDMyMFwiPlxyXG4gICAgPGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPVwiZmllbGRcIiB4MT1cIjBcIiB5MT1cIjBcIiB4Mj1cIjFcIiB5Mj1cIjFcIj48c3RvcCBzdG9wLWNvbG9yPVwiI2U3ZjRlY1wiLz48c3RvcCBvZmZzZXQ9XCIxXCIgc3RvcC1jb2xvcj1cIiNkN2VlZTRcIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+XHJcbiAgICA8cmVjdCB3aWR0aD1cIjY4MFwiIGhlaWdodD1cIjMyMFwiIHJ4PVwiMTZcIiBmaWxsPVwidXJsKCNmaWVsZClcIi8+PHBhdGggZD1cIk0wIDIzMCA5MCAyMDRsNzggMjMgNzctODYgNzIgNTAgOTUtNzAgNzYgNDggODgtNjcgMTA0IDY5djE0OUgwWlwiIGZpbGw9XCIjYWNkNGJkXCIvPlxyXG4gICAgPHBhdGggZD1cIk0wIDI3MCAxMTggMjI4bDkwIDI5IDg1LTUwIDc5IDM5IDg3LTYxIDgwIDU0IDY3LTMxIDc0IDI4djY0SDBaXCIgZmlsbD1cIiM3NWI3OTVcIi8+XHJcbiAgICA8cGF0aCBkPVwiTTM5MCAyNzBjMTgtNjEgNTYtODkgMTAwLTc1IDMxIDEwIDQyIDM0IDYyIDIxIDIxLTE0IDI1LTQyIDU1LTQ2XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCIjZmZmZmZmXCIgc3Ryb2tlLXdpZHRoPVwiOVwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtZGFzaGFycmF5PVwiNCAxNVwiLz5cclxuICAgIDxjaXJjbGUgY3g9XCIzOTJcIiBjeT1cIjI2OVwiIHI9XCIxMFwiIGZpbGw9XCIjZDA1YTQ5XCIgc3Ryb2tlPVwiI2ZmZmZmZlwiIHN0cm9rZS13aWR0aD1cIjVcIi8+PGNpcmNsZSBjeD1cIjYwOFwiIGN5PVwiMTcwXCIgcj1cIjEwXCIgZmlsbD1cIiNkMDVhNDlcIiBzdHJva2U9XCIjZmZmZmZmXCIgc3Ryb2tlLXdpZHRoPVwiNVwiLz5cclxuICAgIDxwYXRoIGQ9XCJNNTAxIDEzMmMtMTggMC0zMiAxNC0zMiAzMSAwIDI1IDMyIDU2IDMyIDU2czMyLTMxIDMyLTU2YzAtMTctMTQtMzEtMzItMzFabTAgNDJhMTEgMTEgMCAxIDEgMC0yMiAxMSAxMSAwIDAgMSAwIDIyWlwiIGZpbGw9XCIjMTY3ZjY4XCIvPlxyXG4gICAgPHJlY3QgeD1cIjM0XCIgeT1cIjMwXCIgd2lkdGg9XCIyMDRcIiBoZWlnaHQ9XCIyOFwiIHJ4PVwiMTRcIiBmaWxsPVwiI2ZmZmZmZlwiIG9wYWNpdHk9XCIuODhcIi8+PGNpcmNsZSBjeD1cIjUyXCIgY3k9XCI0NFwiIHI9XCI1XCIgZmlsbD1cIiMxNjdmNjhcIi8+XHJcbiAgICA8dGV4dCB4PVwiNjhcIiB5PVwiNDlcIiBmaWxsPVwiIzM1NjQ1YVwiIGZvbnQtc2l6ZT1cIjE0XCIgZm9udC1mYW1pbHk9XCJNaWNyb3NvZnQgWWFIZWksc2Fucy1zZXJpZlwiPlx1NURFMVx1OTYzMlx1NTJBOFx1NjAwMSBcdTAwQjcgXHU1QjlFXHU2NUY2XHU4REVGXHU3RUJGPC90ZXh0PlxyXG4gICAgPHRleHQgeD1cIjM2XCIgeT1cIjExM1wiIGZpbGw9XCIjMTc0YzNlXCIgZm9udC1zaXplPVwiMzRcIiBmb250LXdlaWdodD1cIjcwMFwiIGZvbnQtZmFtaWx5PVwiTWljcm9zb2Z0IFlhSGVpLHNhbnMtc2VyaWZcIj5cdTVFNzNcdTVCODlcdTVERTFcdTk2MzJcdTYzRDBcdTc5M0E8L3RleHQ+XHJcbiAgICA8dGV4dCB4PVwiMzhcIiB5PVwiMTQzXCIgZmlsbD1cIiM0MjZlNjFcIiBmb250LXNpemU9XCIxNlwiIGZvbnQtZmFtaWx5PVwiTWljcm9zb2Z0IFlhSGVpLHNhbnMtc2VyaWZcIj5cdTkxQ0RcdTcwQjlcdTUzM0FcdTU3REZcdTVERTFcdTY3RTVcdTRFMEVcdTgwNTRcdTUyQThcdTRFRkJcdTUyQTE8L3RleHQ+XHJcbiAgICA8cmVjdCB4PVwiMzhcIiB5PVwiMTY2XCIgd2lkdGg9XCIxMDZcIiBoZWlnaHQ9XCIzNFwiIHJ4PVwiMTdcIiBmaWxsPVwiIzE2N2Y2OFwiLz48dGV4dCB4PVwiNTdcIiB5PVwiMTg5XCIgZmlsbD1cIiNmZmZmZmZcIiBmb250LXNpemU9XCIxNFwiIGZvbnQtZmFtaWx5PVwiTWljcm9zb2Z0IFlhSGVpLHNhbnMtc2VyaWZcIj5cdThERUZcdTdFQkZcdTVERTFcdTY3RTU8L3RleHQ+XHJcbiAgPC9zdmc+YCxcclxufTtcclxuXHJcbmZ1bmN0aW9uIHNlbmRKc29uKHJlc3BvbnNlOiBTZXJ2ZXJSZXNwb25zZSwgc3RhdHVzOiBudW1iZXIsIGJvZHk6IHVua25vd24pOiB2b2lkIHtcclxuICByZXNwb25zZS5zdGF0dXNDb2RlID0gc3RhdHVzO1xyXG4gIHJlc3BvbnNlLnNldEhlYWRlcignY29udGVudC10eXBlJywgJ2FwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLTgnKTtcclxuICByZXNwb25zZS5lbmQoSlNPTi5zdHJpbmdpZnkoYm9keSkpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZWFkSnNvbihyZXF1ZXN0OiBJbmNvbWluZ01lc3NhZ2UpOiBQcm9taXNlPHVua25vd24+IHtcclxuICBsZXQgcmF3ID0gJyc7XHJcbiAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiByZXF1ZXN0KSByYXcgKz0gdHlwZW9mIGNodW5rID09PSAnc3RyaW5nJyA/IGNodW5rIDogY2h1bmsudG9TdHJpbmcoJ3V0ZjgnKTtcclxuICBpZiAoIXJhdykgcmV0dXJuIHVuZGVmaW5lZDtcclxuICByZXR1cm4gSlNPTi5wYXJzZShyYXcpIGFzIHVua25vd247XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzVGFnSW5wdXQodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBPbWl0PFByZXZpZXdHcm91cFRhZywgJ2lkJz4ge1xyXG4gIGlmICghdmFsdWUgfHwgdHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JykgcmV0dXJuIGZhbHNlO1xyXG4gIGNvbnN0IGlucHV0ID0gdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XHJcbiAgcmV0dXJuIHR5cGVvZiBpbnB1dC5uYW1lID09PSAnc3RyaW5nJyAmJiB0eXBlb2YgaW5wdXQuaWNvbiA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIGlucHV0LmNvbG9yID09PSAnc3RyaW5nJztcclxufVxyXG5cclxuZnVuY3Rpb24gaXNJZExpc3QodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBBcnJheTxzdHJpbmcgfCBudW1iZXI+IHtcclxuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUuZXZlcnkoKGlkKSA9PiB0eXBlb2YgaWQgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBpZCA9PT0gJ251bWJlcicpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhc1JlY29yZCh2YWx1ZTogdW5rbm93bik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcclxuICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyAodmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIDoge307XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzVGhpcmRBcHBJbnB1dChpbnB1dDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBib29sZWFuIHtcclxuICBjb25zdCBuYW1lID0gaW5wdXQuc3lzdGVtTmFtZSA/PyBpbnB1dC5jbGllbnROYW1lO1xyXG4gIHJldHVybiAoXHJcbiAgICB0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycgJiZcclxuICAgIHR5cGVvZiBpbnB1dC5jbGllbnRJZCA9PT0gJ3N0cmluZycgJiZcclxuICAgIHR5cGVvZiBpbnB1dC5jbGllbnRTZWNyZXQgPT09ICdzdHJpbmcnICYmXHJcbiAgICAodHlwZW9mIGlucHV0LnRva2VuVGltZSA9PT0gJ251bWJlcicgfHwgdHlwZW9mIGlucHV0LnRva2VuVGltZSA9PT0gJ3N0cmluZycpICYmXHJcbiAgICAodHlwZW9mIGlucHV0LnJlZnJlc2hUb2tlblRpbWUgPT09ICdudW1iZXInIHx8IHR5cGVvZiBpbnB1dC5yZWZyZXNoVG9rZW5UaW1lID09PSAnc3RyaW5nJykgJiZcclxuICAgIHR5cGVvZiBpbnB1dC5zdGF0dXMgPT09ICdudW1iZXInXHJcbiAgKTtcclxufVxyXG5cclxuLyoqIFx1NEUzQVx1NjcyQ1x1NTczMFx1OTg3NVx1OTc2Mlx1OTg4NFx1ODlDOFx1NjNEMFx1NEY5Qlx1NTE4NVx1NUI1OFx1NjU3MFx1NjM2RVx1RkYxQlx1NjcyQVx1NzdFNVx1NjNBNVx1NTNFM1x1OEZENFx1NTZERSA1MDFcdUZGMENcdTdFRERcdTRFMERcdTRGMUFcdThGNkNcdTUzRDFcdTUyMzBcdTU0MEVcdTdBRUZcdTMwMDIgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIG1vY2tQcmV2aWV3UGx1Z2luKCk6IFBsdWdpbiB7XHJcbiAgY29uc3QgdGFncyA9IGluaXRpYWxUYWdzLm1hcCgodGFnKSA9PiAoeyAuLi50YWcgfSkpO1xyXG4gIGxldCBuZXh0SWQgPSA2O1xyXG4gIGxldCBuZXh0VGhpcmRBcHBJZCA9IHByZXZpZXdUaGlyZEFwcHMubGVuZ3RoICsgMTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIG5hbWU6ICdsaW5reC1tb2NrLXByZXZpZXcnLFxyXG4gICAgdHJhbnNmb3JtSW5kZXhIdG1sKGh0bWwpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBodG1sLFxyXG4gICAgICAgIHRhZ3M6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdGFnOiAnc2NyaXB0JyxcclxuICAgICAgICAgICAgaW5qZWN0VG86ICdoZWFkLXByZXBlbmQnLFxyXG4gICAgICAgICAgICBjaGlsZHJlbjogYFxyXG4gICAgICAgICAgICAgIGlmICh3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgPT09ICcvbG9naW4nKSB7XHJcbiAgICAgICAgICAgICAgICBbJ3Z1ZV9hZG1pbl90ZW1wbGF0ZV90b2tlbicsICdpc19hZG1pbicsICdiYWNrX3VzZXJfaWQnLCAnYmFja191c2VybmFtZSddLmZvckVhY2goKGtleSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd2dWVfYWRtaW5fdGVtcGxhdGVfdG9rZW4nLCAnbGlua3gtbG9jYWwtbW9jay10b2tlbicpO1xyXG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2lzX2FkbWluJywgJ3RydWUnKTtcclxuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdiYWNrX3VzZXJfaWQnLCAnMScpO1xyXG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2JhY2tfdXNlcm5hbWUnLCAnTW9ja1x1OTg4NFx1ODlDOFx1N0JBMVx1NzQwNlx1NTQ1OCcpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfTtcclxuICAgIH0sXHJcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoKHJlcXVlc3QsIHJlc3BvbnNlLCBuZXh0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgcmVxdWVzdFVybCA9IHJlcXVlc3QudXJsO1xyXG4gICAgICAgIGlmICghcmVxdWVzdFVybD8uc3RhcnRzV2l0aCgnL2xpbmt4L2FkbWluJykpIHJldHVybiBuZXh0KCk7XHJcblxyXG4gICAgICAgIHZvaWQgKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxdWVzdFVybCwgJ2h0dHA6Ly9sb2NhbGhvc3QnKTtcclxuICAgICAgICAgIGNvbnN0IHBhdGggPSB1cmwucGF0aG5hbWUucmVwbGFjZSgvXlxcL2xpbmt4XFwvYWRtaW4vLCAnJykgfHwgJy8nO1xyXG4gICAgICAgICAgY29uc3QgbWV0aG9kID0gcmVxdWVzdC5tZXRob2QgPz8gJ0dFVCc7XHJcbiAgICAgICAgICBjb25zdCBpbWFnZSA9IHByZXZpZXdJbWFnZXNbcGF0aF07XHJcbiAgICAgICAgICBpZiAobWV0aG9kID09PSAnR0VUJyAmJiBpbWFnZSkge1xyXG4gICAgICAgICAgICByZXNwb25zZS5zdGF0dXNDb2RlID0gMjAwO1xyXG4gICAgICAgICAgICByZXNwb25zZS5zZXRIZWFkZXIoJ2NvbnRlbnQtdHlwZScsICdpbWFnZS9zdmcreG1sOyBjaGFyc2V0PXV0Zi04Jyk7XHJcbiAgICAgICAgICAgIHJlc3BvbnNlLnNldEhlYWRlcignY2FjaGUtY29udHJvbCcsICduby1zdG9yZScpO1xyXG4gICAgICAgICAgICByZXNwb25zZS5zZXRIZWFkZXIoJ3gtY29udGVudC10eXBlLW9wdGlvbnMnLCAnbm9zbmlmZicpO1xyXG4gICAgICAgICAgICByZXNwb25zZS5lbmQoaW1hZ2UpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCByZXF1ZXN0Qm9keSA9IHJlcXVlc3QuaGVhZGVyc1snY29udGVudC10eXBlJ10/LmluY2x1ZGVzKCdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgPyBhd2FpdCByZWFkSnNvbihyZXF1ZXN0KVxyXG4gICAgICAgICAgICA6IHVuZGVmaW5lZDtcclxuICAgICAgICAgIGNvbnN0IG9rID0gKGRhdGE6IHVua25vd24gPSBudWxsKSA9PiAoeyBjb2RlOiAwLCBtc2c6ICdcdTY0Q0RcdTRGNUNcdTYyMTBcdTUyOUYnLCBkYXRhIH0pO1xyXG4gICAgICAgICAgY29uc3Qgbm9ybWFsaXplZFBhdGggPSBkZWNvZGVVUklDb21wb25lbnQocGF0aCk7XHJcblxyXG4gICAgICAgICAgaWYgKHBhdGguZW5kc1dpdGgoJy9vYXV0aC92Mi9sb2dpbicpICYmIG1ldGhvZCA9PT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHVzZXJuYW1lID1cclxuICAgICAgICAgICAgICByZXF1ZXN0Qm9keSAmJiB0eXBlb2YgcmVxdWVzdEJvZHkgPT09ICdvYmplY3QnICYmICd1c2VybmFtZScgaW4gcmVxdWVzdEJvZHlcclxuICAgICAgICAgICAgICAgID8gU3RyaW5nKHJlcXVlc3RCb2R5LnVzZXJuYW1lKVxyXG4gICAgICAgICAgICAgICAgOiAnXHU2NzJDXHU1NzMwXHU5ODg0XHU4OUM4JztcclxuICAgICAgICAgICAgc2VuZEpzb24oXHJcbiAgICAgICAgICAgICAgcmVzcG9uc2UsXHJcbiAgICAgICAgICAgICAgMjAwLFxyXG4gICAgICAgICAgICAgIG9rKHtcclxuICAgICAgICAgICAgICAgIGFjY2Vzc1Rva2VuOiAnbGlua3gtbG9jYWwtbW9jay10b2tlbicsXHJcbiAgICAgICAgICAgICAgICB1c2VyTmFtZTogdXNlcm5hbWUsXHJcbiAgICAgICAgICAgICAgICB1c2VySWQ6ICcxJyxcclxuICAgICAgICAgICAgICAgIGlkQ2FyZE51bTogJycsXHJcbiAgICAgICAgICAgICAgICBpc0FkbWluOiB0cnVlLFxyXG4gICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAocGF0aC5lbmRzV2l0aCgnL29hdXRoL3YyL3Blcm1pc3Npb25zJykpIHtcclxuICAgICAgICAgICAgc2VuZEpzb24ocmVzcG9uc2UsIDIwMCwgb2soeyB0eXBlOiAxLCBtZW51czogcHJldmlld01lbnVQZXJtaXNzaW9ucywgYWN0aW9uczogW10gfSkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAocGF0aCA9PT0gJy9hcGkvbWVudS9saXN0Jykge1xyXG4gICAgICAgICAgICBzZW5kSnNvbihyZXNwb25zZSwgMjAwLCBvayhwcmV2aWV3TWVudSkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAocGF0aCA9PT0gJy9hcGkvZ2xvYmFscy9saXN0Jykge1xyXG4gICAgICAgICAgICBjb25zdCBtb2NrID0gZ2V0UHJldmlld0RhdGEobWV0aG9kLCBwYXRoLCB1cmwsIHJlcXVlc3RCb2R5KTtcclxuICAgICAgICAgICAgc2VuZEpzb24ocmVzcG9uc2UsIDIwMCwgb2sobW9jay5kYXRhKSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChwYXRoID09PSAnL2Jhc2UvdjEvZ2xvYmFscy9nZXRHbG9iYWxzTGlzdCcpIHtcclxuICAgICAgICAgICAgY29uc3QgbW9jayA9IGdldFByZXZpZXdEYXRhKG1ldGhvZCwgcGF0aCwgdXJsLCByZXF1ZXN0Qm9keSk7XHJcbiAgICAgICAgICAgIHNlbmRKc29uKHJlc3BvbnNlLCAyMDAsIG9rKG1vY2suZGF0YSkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAocGF0aCA9PT0gJy9hcGkvbXNpcC9saWNlbnNlL2luZm8nKSB7XHJcbiAgICAgICAgICAgIHNlbmRKc29uKFxyXG4gICAgICAgICAgICAgIHJlc3BvbnNlLFxyXG4gICAgICAgICAgICAgIDIwMCxcclxuICAgICAgICAgICAgICBvayh7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXM6IDEsXHJcbiAgICAgICAgICAgICAgICBMSU5LWEJTOiAnMScsXHJcbiAgICAgICAgICAgICAgICBMSU5LWEdDRjogJzEnLFxyXG4gICAgICAgICAgICAgICAgTElOS1hUQ0Y6ICcxJyxcclxuICAgICAgICAgICAgICAgIExJTktYQkNGOiAnMScsXHJcbiAgICAgICAgICAgICAgICBMSU5LWEFDRjogJzEnLFxyXG4gICAgICAgICAgICAgICAgTElOS1hOREk6ICcxJyxcclxuICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKHBhdGggPT09ICcvY29sbGFib3JhdGlvbi92MS9iYXNlL3ZlcnNpb24nKSB7XHJcbiAgICAgICAgICAgIHNlbmRKc29uKFxyXG4gICAgICAgICAgICAgIHJlc3BvbnNlLFxyXG4gICAgICAgICAgICAgIDIwMCxcclxuICAgICAgICAgICAgICBvayh7XHJcbiAgICAgICAgICAgICAgICBqeDogeyBzZXJ2aWNlVmVyc2lvbjogJ1x1NjcyQ1x1NTczMCBNb2NrJyB9LFxyXG4gICAgICAgICAgICAgICAgZWFnZW50OiB7IHNlcnZpY2VWZXJzaW9uOiAnXHU2NzJDXHU1NzMwIE1vY2snIH0sXHJcbiAgICAgICAgICAgICAgICBsaW5reDogeyBzZXJ2aWNlVmVyc2lvbjogJ1x1NjcyQ1x1NTczMCBNb2NrJyB9LFxyXG4gICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAocGF0aCA9PT0gJy9hdXRoL3YxL3VzZXIvYWRtaW51c2VyL2JpbmQvaW0tdXNlcicgJiYgbWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgICAgICAgICBzZW5kSnNvbihyZXNwb25zZSwgMjAwLCBvayhudWxsKSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChwYXRoLmVuZHNXaXRoKCcvb2F1dGgvdjIva2VlcGFsaXZlJykgfHwgcGF0aC5lbmRzV2l0aCgnL29hdXRoL3YyL2xvZ291dCcpKSB7XHJcbiAgICAgICAgICAgIHNlbmRKc29uKHJlc3BvbnNlLCAyMDAsIG9rKCkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAocGF0aCA9PT0gJy9jb2xsYWJvcmF0aW9uL3YxL3RhZ3MvcGFnZScgJiYgbWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoJ25hbWUnKT8udHJpbSgpID8/ICcnO1xyXG4gICAgICAgICAgICBjb25zdCBwYWdlTnVtID0gTWF0aC5tYXgoMSwgTnVtYmVyKHVybC5zZWFyY2hQYXJhbXMuZ2V0KCdwYWdlTnVtJykpIHx8IDEpO1xyXG4gICAgICAgICAgICBjb25zdCBwYWdlU2l6ZSA9IE1hdGgubWF4KDEsIE51bWJlcih1cmwuc2VhcmNoUGFyYW1zLmdldCgncGFnZVNpemUnKSkgfHwgMTApO1xyXG4gICAgICAgICAgICBjb25zdCBmaWx0ZXJlZCA9IHRhZ3MuZmlsdGVyKCh0YWcpID0+IHRhZy5uYW1lLmluY2x1ZGVzKG5hbWUpKTtcclxuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSAocGFnZU51bSAtIDEpICogcGFnZVNpemU7XHJcbiAgICAgICAgICAgIHNlbmRKc29uKHJlc3BvbnNlLCAyMDAsIG9rKHsgcmVjb3JkczogZmlsdGVyZWQuc2xpY2Uoc3RhcnQsIHN0YXJ0ICsgcGFnZVNpemUpLCB0b3RhbDogZmlsdGVyZWQubGVuZ3RoIH0pKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKHBhdGggPT09ICcvY29sbGFib3JhdGlvbi92MS90YWdzJyAmJiBtZXRob2QgPT09ICdQT1NUJykge1xyXG4gICAgICAgICAgICBpZiAoIWlzVGFnSW5wdXQocmVxdWVzdEJvZHkpKSB7XHJcbiAgICAgICAgICAgICAgc2VuZEpzb24ocmVzcG9uc2UsIDQwMCwgeyBjb2RlOiA0MDAsIG1zZzogJ1x1NjgwN1x1N0I3RVx1NjU3MFx1NjM2RVx1NjgzQ1x1NUYwRlx1OTUxOVx1OEJFRicsIGRhdGE6IG51bGwgfSk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRhZ3MucHVzaCh7IGlkOiBgcHJldmlldy0ke1N0cmluZyhuZXh0SWQrKykucGFkU3RhcnQoMywgJzAnKX1gLCAuLi5yZXF1ZXN0Qm9keSB9KTtcclxuICAgICAgICAgICAgc2VuZEpzb24ocmVzcG9uc2UsIDIwMCwgb2soKSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgKG5vcm1hbGl6ZWRQYXRoID09PSAnL2NvbGxhYm9yYXRpb24vdjEvY2xpZW50L2NyZWF0ZSAnIHx8XHJcbiAgICAgICAgICAgICAgbm9ybWFsaXplZFBhdGggPT09ICcvY29sbGFib3JhdGlvbi92MS9jbGllbnQvY3JlYXRlJykgJiZcclxuICAgICAgICAgICAgbWV0aG9kID09PSAnUE9TVCdcclxuICAgICAgICAgICkge1xyXG4gICAgICAgICAgICBjb25zdCBpbnB1dCA9IGFzUmVjb3JkKHJlcXVlc3RCb2R5KTtcclxuICAgICAgICAgICAgaWYgKCFpc1RoaXJkQXBwSW5wdXQoaW5wdXQpKSB7XHJcbiAgICAgICAgICAgICAgc2VuZEpzb24ocmVzcG9uc2UsIDQwMCwgeyBjb2RlOiA0MDAsIG1zZzogJ1x1NUU5NFx1NzUyOFx1NjU3MFx1NjM2RVx1NjgzQ1x1NUYwRlx1OTUxOVx1OEJFRicsIGRhdGE6IG51bGwgfSk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBTdHJpbmcoaW5wdXQuc3lzdGVtTmFtZSA/PyBpbnB1dC5jbGllbnROYW1lKTtcclxuICAgICAgICAgICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDE5KS5yZXBsYWNlKCdUJywgJyAnKTtcclxuICAgICAgICAgICAgY29uc3QgaWQgPSBgcHJldmlldy1jbGllbnQtJHtTdHJpbmcobmV4dFRoaXJkQXBwSWQrKykucGFkU3RhcnQoMywgJzAnKX1gO1xyXG4gICAgICAgICAgICBwcmV2aWV3VGhpcmRBcHBzLnB1c2goe1xyXG4gICAgICAgICAgICAgIGlkLFxyXG4gICAgICAgICAgICAgIGNsaWVudE5hbWU6IG5hbWUsXHJcbiAgICAgICAgICAgICAgc3lzdGVtTmFtZTogbmFtZSxcclxuICAgICAgICAgICAgICBjbGllbnRJZDogU3RyaW5nKGlucHV0LmNsaWVudElkKSxcclxuICAgICAgICAgICAgICBjbGllbnRTZWNyZXQ6IFN0cmluZyhpbnB1dC5jbGllbnRTZWNyZXQpLFxyXG4gICAgICAgICAgICAgIGNsaWVudFR5cGU6IFN0cmluZyhpbnB1dC5jbGllbnRUeXBlID8/ICcnKSxcclxuICAgICAgICAgICAgICB0b2tlblRpbWU6IE51bWJlcihpbnB1dC50b2tlblRpbWUpLFxyXG4gICAgICAgICAgICAgIHJlZnJlc2hUb2tlblRpbWU6IE51bWJlcihpbnB1dC5yZWZyZXNoVG9rZW5UaW1lKSxcclxuICAgICAgICAgICAgICBzdGF0dXM6IE51bWJlcihpbnB1dC5zdGF0dXMpLFxyXG4gICAgICAgICAgICAgIGV4cGlyZWQ6IFN0cmluZyhpbnB1dC5leHBpcmVkID8/ICcnKSxcclxuICAgICAgICAgICAgICByZW1hcms6IFN0cmluZyhpbnB1dC5yZW1hcmsgPz8gJycpLFxyXG4gICAgICAgICAgICAgIGdyYW50VGltZTogbm93LFxyXG4gICAgICAgICAgICAgIGdyYW50VXNlck5hbWU6ICdNb2NrXHU3QkExXHU3NDA2XHU1NDU4JyxcclxuICAgICAgICAgICAgICBnbXRDcmVhdGVkOiBub3csXHJcbiAgICAgICAgICAgICAgZ210TW9kaWZpZWQ6IG5vdyxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHNlbmRKc29uKHJlc3BvbnNlLCAyMDAsIG9rKGlkKSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChwYXRoID09PSAnL2NvbGxhYm9yYXRpb24vdjEvY2xpZW50L3VwZGF0ZScgJiYgbWV0aG9kID09PSAnUFVUJykge1xyXG4gICAgICAgICAgICBjb25zdCBpbnB1dCA9IGFzUmVjb3JkKHJlcXVlc3RCb2R5KTtcclxuICAgICAgICAgICAgaWYgKCFpc1RoaXJkQXBwSW5wdXQoaW5wdXQpIHx8IHR5cGVvZiBpbnB1dC5pZCAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICBzZW5kSnNvbihyZXNwb25zZSwgNDAwLCB7IGNvZGU6IDQwMCwgbXNnOiAnXHU1RTk0XHU3NTI4XHU2NTcwXHU2MzZFXHU2ODNDXHU1RjBGXHU5NTE5XHU4QkVGJywgZGF0YTogbnVsbCB9KTtcclxuICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBwcmV2aWV3VGhpcmRBcHBzLmZpbmRJbmRleCgoaXRlbSkgPT4gaXRlbS5pZCA9PT0gaW5wdXQuaWQpO1xyXG4gICAgICAgICAgICBpZiAoaW5kZXggPCAwKSB7XHJcbiAgICAgICAgICAgICAgc2VuZEpzb24ocmVzcG9uc2UsIDQwNCwgeyBjb2RlOiA0MDQsIG1zZzogJ1x1NUU5NFx1NzUyOFx1NEUwRFx1NUI1OFx1NTcyOCcsIGRhdGE6IG51bGwgfSk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBTdHJpbmcoaW5wdXQuc3lzdGVtTmFtZSA/PyBpbnB1dC5jbGllbnROYW1lKTtcclxuICAgICAgICAgICAgcHJldmlld1RoaXJkQXBwc1tpbmRleF0gPSB7XHJcbiAgICAgICAgICAgICAgLi4ucHJldmlld1RoaXJkQXBwc1tpbmRleF0sXHJcbiAgICAgICAgICAgICAgLi4uaW5wdXQsXHJcbiAgICAgICAgICAgICAgaWQ6IGlucHV0LmlkLFxyXG4gICAgICAgICAgICAgIGNsaWVudE5hbWU6IG5hbWUsXHJcbiAgICAgICAgICAgICAgc3lzdGVtTmFtZTogbmFtZSxcclxuICAgICAgICAgICAgICBjbGllbnRJZDogU3RyaW5nKGlucHV0LmNsaWVudElkKSxcclxuICAgICAgICAgICAgICBjbGllbnRTZWNyZXQ6IFN0cmluZyhpbnB1dC5jbGllbnRTZWNyZXQpLFxyXG4gICAgICAgICAgICAgIGNsaWVudFR5cGU6IFN0cmluZyhpbnB1dC5jbGllbnRUeXBlID8/ICcnKSxcclxuICAgICAgICAgICAgICB0b2tlblRpbWU6IE51bWJlcihpbnB1dC50b2tlblRpbWUpLFxyXG4gICAgICAgICAgICAgIHJlZnJlc2hUb2tlblRpbWU6IE51bWJlcihpbnB1dC5yZWZyZXNoVG9rZW5UaW1lKSxcclxuICAgICAgICAgICAgICBzdGF0dXM6IE51bWJlcihpbnB1dC5zdGF0dXMpLFxyXG4gICAgICAgICAgICAgIGV4cGlyZWQ6IFN0cmluZyhpbnB1dC5leHBpcmVkID8/ICcnKSxcclxuICAgICAgICAgICAgICByZW1hcms6IFN0cmluZyhpbnB1dC5yZW1hcmsgPz8gJycpLFxyXG4gICAgICAgICAgICAgIGdtdE1vZGlmaWVkOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc2xpY2UoMCwgMTkpLnJlcGxhY2UoJ1QnLCAnICcpLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBzZW5kSnNvbihyZXNwb25zZSwgMjAwLCBvaygpKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKHBhdGggPT09ICcvY29sbGFib3JhdGlvbi92MS9jbGllbnQvZGVsZXRlJyAmJiBtZXRob2QgPT09ICdERUxFVEUnKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGlkID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoJ2lkJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gcHJldmlld1RoaXJkQXBwcy5maW5kSW5kZXgoKGl0ZW0pID0+IGl0ZW0uaWQgPT09IGlkKTtcclxuICAgICAgICAgICAgaWYgKGluZGV4ID49IDApIHByZXZpZXdUaGlyZEFwcHMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICAgICAgc2VuZEpzb24ocmVzcG9uc2UsIDIwMCwgb2soKSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChwYXRoID09PSAnL2NvbGxhYm9yYXRpb24vdjEvY2xpZW50L2RldGFpbCcgJiYgbWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgICAgICAgICBjb25zdCBpZCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KCdpZCcpO1xyXG4gICAgICAgICAgICBjb25zdCBpdGVtID0gcHJldmlld1RoaXJkQXBwcy5maW5kKChlbnRyeSkgPT4gZW50cnkuaWQgPT09IGlkKTtcclxuICAgICAgICAgICAgaWYgKCFpdGVtKSBzZW5kSnNvbihyZXNwb25zZSwgNDA0LCB7IGNvZGU6IDQwNCwgbXNnOiAnXHU1RTk0XHU3NTI4XHU0RTBEXHU1QjU4XHU1NzI4JywgZGF0YTogbnVsbCB9KTtcclxuICAgICAgICAgICAgZWxzZSBzZW5kSnNvbihyZXNwb25zZSwgMjAwLCBvayhpdGVtKSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChwYXRoID09PSAnL2NvbGxhYm9yYXRpb24vdjEvdGFncy9kZWxldGUvbGlzdCcgJiYgbWV0aG9kID09PSAnREVMRVRFJykge1xyXG4gICAgICAgICAgICBjb25zdCBpZHMgPSByZXF1ZXN0Qm9keTtcclxuICAgICAgICAgICAgaWYgKCFpc0lkTGlzdChpZHMpKSB7XHJcbiAgICAgICAgICAgICAgc2VuZEpzb24ocmVzcG9uc2UsIDQwMCwgeyBjb2RlOiA0MDAsIG1zZzogJ1x1NjgwN1x1N0I3RSBJRCBcdTUyMTdcdTg4NjhcdTY4M0NcdTVGMEZcdTk1MTlcdThCRUYnLCBkYXRhOiBudWxsIH0pO1xyXG4gICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBpZFNldCA9IG5ldyBTZXQoaWRzLm1hcChTdHJpbmcpKTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaW5kZXggPSB0YWdzLmxlbmd0aCAtIDE7IGluZGV4ID49IDA7IGluZGV4IC09IDEpIHtcclxuICAgICAgICAgICAgICBpZiAoaWRTZXQuaGFzKHRhZ3NbaW5kZXhdLmlkKSkgdGFncy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNlbmRKc29uKHJlc3BvbnNlLCAyMDAsIG9rKCkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY29uc3QgZGV0YWlsTWF0Y2ggPSBwYXRoLm1hdGNoKC9eXFwvY29sbGFib3JhdGlvblxcL3YxXFwvdGFnc1xcLyhbXi9dKykkLyk7XHJcbiAgICAgICAgICBpZiAoZGV0YWlsTWF0Y2gpIHtcclxuICAgICAgICAgICAgY29uc3QgaWQgPSBkZWNvZGVVUklDb21wb25lbnQoZGV0YWlsTWF0Y2hbMV0pO1xyXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRhZ3MuZmluZEluZGV4KCh0YWcpID0+IHRhZy5pZCA9PT0gaWQpO1xyXG4gICAgICAgICAgICBpZiAobWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgICAgICAgICAgIGlmIChpbmRleCA8IDApIHNlbmRKc29uKHJlc3BvbnNlLCA0MDQsIHsgY29kZTogNDA0LCBtc2c6ICdcdTY4MDdcdTdCN0VcdTRFMERcdTVCNThcdTU3MjgnLCBkYXRhOiBudWxsIH0pO1xyXG4gICAgICAgICAgICAgIGVsc2Ugc2VuZEpzb24ocmVzcG9uc2UsIDIwMCwgb2sodGFnc1tpbmRleF0pKTtcclxuICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG1ldGhvZCA9PT0gJ1BVVCcpIHtcclxuICAgICAgICAgICAgICBpZiAoaW5kZXggPCAwIHx8ICFpc1RhZ0lucHV0KHJlcXVlc3RCb2R5KSkge1xyXG4gICAgICAgICAgICAgICAgc2VuZEpzb24ocmVzcG9uc2UsIGluZGV4IDwgMCA/IDQwNCA6IDQwMCwge1xyXG4gICAgICAgICAgICAgICAgICBjb2RlOiBpbmRleCA8IDAgPyA0MDQgOiA0MDAsXHJcbiAgICAgICAgICAgICAgICAgIG1zZzogJ1x1NjgwN1x1N0I3RVx1NjVFMFx1NkNENVx1NjZGNFx1NjVCMCcsXHJcbiAgICAgICAgICAgICAgICAgIGRhdGE6IG51bGwsXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgdGFnc1tpbmRleF0gPSB7IGlkLCAuLi5yZXF1ZXN0Qm9keSB9O1xyXG4gICAgICAgICAgICAgIHNlbmRKc29uKHJlc3BvbnNlLCAyMDAsIG9rKCkpO1xyXG4gICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAobWV0aG9kID09PSAnREVMRVRFJykge1xyXG4gICAgICAgICAgICAgIGlmIChpbmRleCA+PSAwKSB0YWdzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgICAgICAgc2VuZEpzb24ocmVzcG9uc2UsIDIwMCwgb2soKSk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY29uc3QgcHJldmlld0RhdGEgPSBnZXRQcmV2aWV3RGF0YShtZXRob2QsIHBhdGgsIHVybCwgcmVxdWVzdEJvZHkpO1xyXG4gICAgICAgICAgaWYgKHByZXZpZXdEYXRhLmhhbmRsZWQpIHtcclxuICAgICAgICAgICAgc2VuZEpzb24ocmVzcG9uc2UsIDIwMCwgb2socHJldmlld0RhdGEuZGF0YSkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgc2VuZEpzb24ocmVzcG9uc2UsIDUwMSwge1xyXG4gICAgICAgICAgICBjb2RlOiA1MDEsXHJcbiAgICAgICAgICAgIG1zZzogYFx1NjcyQ1x1NTczMCBNb2NrIFx1NjcyQVx1OTE0RFx1N0Y2RVx1NjNBNVx1NTNFM1x1RkYxQSR7bWV0aG9kfSAke3BhdGh9YCxcclxuICAgICAgICAgICAgZGF0YTogbnVsbCxcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKCkuY2F0Y2goKGVycm9yOiB1bmtub3duKSA9PiB7XHJcbiAgICAgICAgICBzZW5kSnNvbihyZXNwb25zZSwgNDAwLCB7XHJcbiAgICAgICAgICAgIGNvZGU6IDQwMCxcclxuICAgICAgICAgICAgbXNnOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdcdTY3MkNcdTU3MzAgTW9jayBcdThCRjdcdTZDNDJcdTg5RTNcdTY3OTBcdTU5MzFcdThEMjUnLFxyXG4gICAgICAgICAgICBkYXRhOiBudWxsLFxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuICB9O1xyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNFQsU0FBUyxjQUFjLGVBQWU7QUFDbFcsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sZ0JBQWdCO0FBQ3ZCLE9BQU8sZ0JBQWdCO0FBQ3ZCLFNBQVMsMkJBQTJCO0FBQ3BDLFNBQVMsZUFBZTs7O0FDQXhCLElBQU0sUUFBUTtBQUFBLEVBQ1o7QUFBQSxJQUNFLElBQUk7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLFFBQVE7QUFBQSxJQUNSLFFBQVE7QUFBQSxJQUNSLFlBQVk7QUFBQSxJQUNaLGFBQWEsQ0FBQztBQUFBLElBQ2QsZUFBZSxDQUFDLG9CQUFvQjtBQUFBLElBQ3BDLGNBQWMsQ0FBQztBQUFBLElBQ2YsYUFBYSxDQUFDLEVBQUUsSUFBSSxZQUFZLE1BQU0sd0NBQVUsTUFBTSxTQUFTLENBQUM7QUFBQSxFQUNsRTtBQUFBLEVBQ0E7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QUNKLFdBQVc7QUFBQSxRQUNULFNBQVMsQ0FBQyxPQUFPLGNBQWMsT0FBTztBQUFBLFFBQ3RDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQztBQUFBLFFBQ2pDLEtBQUs7QUFBQSxRQUNMLFVBQVUsRUFBRSxTQUFTLEtBQUs7QUFBQSxNQUM1QixDQUFDO0FBQUEsTUFDRCxXQUFXO0FBQUEsUUFDVCxXQUFXLENBQUMsb0JBQW9CLENBQUM7QUFBQSxRQUNqQyxLQUFLO0FBQUEsUUFDTCxNQUFNLENBQUMsZ0JBQWdCO0FBQUEsTUFDekIsQ0FBQztBQUFBLElBQ0g7QUFBQSxJQUNBLEtBQUs7QUFBQSxNQUNILHFCQUFxQjtBQUFBLFFBQ25CLE1BQU07QUFBQSxVQUNKLG1CQUFtQjtBQUFBO0FBQUE7QUFBQSxVQUduQixnQkFBZ0I7QUFBQSxRQUNsQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixNQUFNLFNBQVMsaUJBQWlCLFFBQVE7QUFBQSxNQUN4QyxNQUFNO0FBQUEsTUFDTixHQUFJLFNBQVMsaUJBQ1QsQ0FBQyxJQUNEO0FBQUEsUUFDRSxPQUFPO0FBQUEsVUFDTCxDQUFDLElBQUksaUJBQWlCLGNBQWMsR0FBRztBQUFBLFlBQ3JDLFFBQVEsSUFBSSxjQUFjO0FBQUEsWUFDMUIsY0FBYztBQUFBLFlBQ2QsUUFBUTtBQUFBLFlBQ1IsU0FBUyxDQUFDLE1BQ1IsRUFBRSxRQUFRLElBQUksT0FBTyxJQUFJLElBQUksaUJBQWlCLGNBQWMsRUFBRSxHQUFHLGNBQWM7QUFBQSxVQUNuRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDTjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsV0FBVztBQUFBLE1BQ1gsV0FBVyxTQUFTO0FBQUEsTUFDcEIsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsVUFDaEIsY0FBYztBQUFBLFlBQ1osZ0JBQWdCLENBQUMsZ0JBQWdCLHlCQUF5QjtBQUFBLFlBQzFELGNBQWMsQ0FBQyxPQUFPLGNBQWMsU0FBUyxVQUFVO0FBQUEsWUFDdkQsT0FBTyxDQUFDLFNBQVMsU0FBUyxhQUFhLGFBQWEsYUFBYSxJQUFJO0FBQUEsVUFDdkU7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsiYXNSZWNvcmQiXQp9Cg==
