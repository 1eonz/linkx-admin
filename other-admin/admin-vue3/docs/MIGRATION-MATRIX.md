# Vue2 到 Vue3 现役业务迁移台账

## 2026-10-20 LxPagination 迁移门禁

- 组件行为和文档 Demo 当前可供宿主复用，单测 7/7、文档 E2E 3/3；`change(page, pageSize)`、`autoReset`、`autoScroll` 语义未改变。
- Assessment B 因评估服务 HTTP 403 额度不足未完成，不能关闭组件视觉门禁；业务分页页面仍需逐页补空/失败/取消/权限不足和真实 API 证据。

## 2026-10-19 DynamicForm 行为证据更新

- `LxDynamicForm` 当前版单测 **30/30**、文档 E2E **14/14**、lx-ui typecheck 通过；覆盖字段 renderer、密码/ARIA、上传、日期范围、远程竞态和响应式列。
- 这只是组件库行为证据，不能替代真实页面 API、权限、上传协议、空/错/取消状态和 Mock/E2E；宿主 `element-plus` 依赖保持，业务 API 继续使用 Promise 链。

## 2026-10-19 LxSectionTitle 宿主契约补强

- lx-ui Demo 已验证 `leading` 插槽覆盖 `icon` 属性，宿主适配时应保留 `leading`、`subtitle`、`headingLevel`、`tag` 和 `extra` 插槽/属性契约。
- 组件库单测 **14/14**、文档 E2E **1/1**；这不是 Vue3 业务配置页迁移证据。真实配置数据、按钮权限和后端联调仍需页面级 Mock/E2E 与可信接口字段。
- Vue3 `element-plus` 继续保留，API 请求仍按 `.then().catch().finally()` 编排。

## 2026-10-19 LxSectionTitle 组件侧门禁

- lx-ui 组件侧已通过单测 **14/14**、文档 E2E **1/1** 和当前版双路 Critique（A **32/40**；B 证据见 `linkx-fe/.impeccable/critique/lxsectiontitle-assessment-b-2026-10-19/`）。
- 业务页迁移仍需保留标题层级、标签语义、长标题、extra 键盘焦点和权限过滤；375px 页面级横溢出与 HUD 证据尚有待归因，不能把组件证据计为页面完成。

## 2026-10-19 LxPagination 宿主迁移备注

- 组件当前版单测 **5/5**、4177 文档 E2E **3/3**；宿主接入保留 `change(page, pageSize)` 顺序、`autoReset`、`autoScroll` 和窄屏局部滚动容器。
- 独立 Pagination Critique 快照尚未在工作区核验到，组件行为证据不等于视觉矩阵关闭；业务页仍需补真实 API/Mock、空结果、失败恢复、权限和分页回显。
- 缺少可信分页字段契约前不替换页面 `element-plus`，不臆造接口参数。

## 2026-10-19 LxFormErrorBanner 宿主迁移备注

- 组件当前版单测 **2/2**、4177 文档 E2E **1/1**；宿主接入需保留整体阻断语义、`role=alert`、字段清单 slot 和 375px 换行。
- 组件库没有独立 FormErrorBanner Critique 快照；不可把 G2 SearchBar/StatusSwitch 浏览器证据计为本组件视觉通过。业务页替换仍需单独补 Mock、权限按钮和失败恢复证据。
- 空标题调用暂记 P3，缺少真实页面契约前不改变 `title` 公共类型；Vue3 `element-plus` 继续保留。

## 2026-10-19 LxEmpty 宿主迁移备注

- `LxEmpty` 当前版单测 **5/5**、4177 文档 E2E **1/1**，默认/紧凑空态、图标尺寸、footer 操作和窄屏状态契约已复验；组件不访问业务 API。
- 该证据只覆盖组件库，不表示 Vue3 业务页已完成 `el-empty` 替换。迁移时保留 `description`、`image-size`、`class` 透传和宿主 footer 操作，按页面分别补 Mock、按钮权限和空/失败恢复证据。
- 缺少可信页面接口和权限契约的页面继续阻塞，Vue3 `element-plus` 暂不删除。

## 2026-10-19 LxMetricCard 宿主迁移备注

- 组件已补齐 320px 以下窄卡分层和 loading/empty/error 宿主组合示例；组件单测 **15/15**、文档 E2E **3/3**，不代表业务指标页已迁移。
- Vue3 宿主仍需按页面 API 契约提供数据请求、失败恢复、权限过滤和趋势语义；缺少可信后端字段时不臆造映射。

## 2026-10-19 LxInput 宿主迁移备注

- `LxInput` 复合前后缀槽位已在外框内垂直居中，sm/md/lg 与窄屏触控几何回归通过；组件证据不等于业务页面迁移完成。
- 宿主迁移继续复用 lx-ui 的高度令牌和前后缀插槽，不添加页面级 Element Plus 覆盖；业务 API、权限契约和真实后端联调保持原矩阵状态。

## 2026-10-19 LxSectionTitle 宿主迁移备注

- lx-ui 窄屏（400px 及以下）标题与 `extra` 已拆行，文档 E2E **1/1**、单测 **14/14**；该证据只覆盖组件文档，不把业务页面迁移标为完成。
- 迁移页面仍需核对标题层级、标签语义、长标题、操作插槽的键盘焦点和权限过滤；真实后端联调继续等待可信契约。

## 2026-10-19 LxDescriptions 展开状态契约更新

- 组件库长值/长状态收起与展开状态已补齐可见图标和窄屏两行摘要，定向单测 **10/10**、文档 E2E **3/3**；Assessment B 已完成 Light/HUD、1280/375px（含窄屏减少动效）4 场景，页面错误、失败请求和横向溢出均为 0。该证据只覆盖组件文档，不将业务详情页迁移标为完成。
- 迁移页面仍需保留字段标签和值的 `aria-label`、`aria-expanded`、键盘操作、状态点语义、复制入口和抽屉窄屏边界；本条不把组件库证据记为业务页面迁移完成。

## 2026-10-18 DynamicForm/Form 文档门禁当前版复验

- 本轮复验只涉及 `linkx-fe` 文档页与文档站主题，不新增 Vue3 页面替换项，也不改变现有表单迁移契约。
- `LxDynamicForm` 文档 E2E **14/14**、`LxForm` 文档 E2E **6/6**，合计 **20/20**；既有独立浏览器与 detector 证据已归档。业务页面迁移、真实接口联调和宿主 Element Plus 替换仍未关闭。

## 2026-10-17 G2 组件门禁状态

- `LxSearchBar`、`LxStatusSwitch` 已完成库级严格门禁，UI-10 当前 **11/52**；迁移矩阵只登记宿主接入契约，不把组件库证据当作页面迁移完成。
- 相关页面仍需逐页核对 SearchBar 组织树/日期参数、StatusSwitch 旧值映射/确认/失败恢复和按钮权限；真实后端联调未执行，Vue3 `element-plus` 保持。

范围以根目录 `src/router/modules/*.js` 中未注释的路由为准。下表“源码”仅表示核对入口、调用和已知接口契约；“单测”仅表示对应 Vitest 用例通过；Mock 与真实联调必须有实际运行记录才能标为通过。业务 Mock 交互与入口渲染 Smoke 分开记录。Vue2 已注释的历史菜单不纳入迁移目标，Vue3 多出的入口另列。

## 2026-10-17 LxPageCard

- 库级门禁：单测 **3/3**、文档 E2E **1/1**、Assessment A **33/40**、B 五视图浏览器证据有效。
- 宿主替换保留 region、`aria-busy`、loading 和具名 slots；Vue3 `element-plus` 暂不删除。

## 2026-10-17 LxFormErrorBanner

- 组件行为门禁：单测 **2/2**、文档 E2E **1/1**、Assessment A **32/40**；B 的移动 overlay 横溢出已由无覆盖层基线排除组件缺陷。
- 宿主替换暂缓，保留整体阻断、`role=alert`、slot 操作和字段错误边界；Vue3 `element-plus` 继续保留。

## 2026-10-17 LxPagination

- 库级门禁：单测 **5/5**、文档 E2E **3/3**、Assessment A **32/40**、B 五视图浏览器证据有效。
- 宿主替换后保留 `page`、`page-size`、`total`、`change`、`autoReset` 和 `autoScroll` 契约；Vue3 `element-plus` 暂不删除。

## 2026-10-17 LxDrawer

- 库级门禁：单测 **4/4**、文档 E2E **1/1**、Assessment A **32/40**、B 五视图浏览器证据有效。
- 宿主替换仍后置；必须保留 `closeOnPressEsc`、`closeOnClickModal`、`size`、footer 插槽和未保存数据处理，Vue3 `element-plus` 暂不删除。

## 2026-10-17 LxDialog

- lx-ui 组件级门禁：单测 **4/4**、文档 E2E **3/3**、Assessment A **28/40**、B 五视图浏览器证据有效；组件 API/Demo 已有中文说明。
- 宿主替换暂缓。迁移时登记提交中关闭、脏表单离开保护、长内容滚动和错误反馈去重，不得因替换丢失原有业务提交与关闭契约；Vue3 `element-plus` 继续保留。

| 现役模块                                            | 源码证据                                                                                                                                                                                                                                                                                                                                                                                                        | 源码对照                                                                                                                            | 单测                                                                                                          | Mock                                                                                                                                        | 真实联调 | 剩余项                                                                                                                                                   |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 协同岗、快捷标签                                    | `src/router/modules/collaboration.js` 的 `index`、`quick`；Vue3 `src/router/modules/collaboration.ts`、`src/views/collaboration`、`src/views/quick`。协同岗挂载管理、层级、功能、编辑和上下岗记录。                                                                                                                                                                                                             | 入口与主要调用已对照；下岗接口、最后一人确认和管理员 `switchType=3` 载荷与 Vue2 一致；快捷标签 API 已按 Promise 链风格收敛          | 未新增专项单测                                                                                                | `tests/e2e/collaboration-workflow.spec.ts`：1/1；验证最后一人提示、下岗失败重试、成功关闭弹窗/刷新列表；全请求由 Mock 拦截                  | 未执行   | 组织/职能树、层级挂靠、记录筛选/导出、批量操作等深交互验收跟随 lx-ui 对应组件替换波次；API/字段及 Vue2 已有权限契约可并行核查；已注释的 `share` 不纳入。 |
| H5 群组标签 `GroupTags`                             | Vue2 `src/api/h5/groupTags.js`、`src/views/h5/groupTags`；Vue3 OAuth `GroupTags` 映射至 `src/views/h5/groupTags`，API 使用 `/collaboration/v1/tags/*`。旧 Font Awesome 字符串由 `src/views/h5/groupTags/iconMap.ts` 映射为 lx-ui `LxIcon`。                                                                                                                                                                     | 列表、分页、详情、增改删和批删已对照并迁移；API 已按 Promise 链风格收敛；移动端表格和分页可在各自容器滚动                           | `tests/unit/group-tags.test.ts` 2 项；旧图标映射 22 项通过                                                    | Mock E2E 4/4：列表/新增、详情/编辑/单删、查询失败重试/批删、375px 表格与分页滚动；接口仍保存旧图标字符串                                    | 未执行   | 补完整权限、取消/重复操作边界和真实联调；没有可信按钮权限码，暂不猜测。                                                                                  |
| 排班类型、排班信息                                  | Vue2 `src/views/shiftScheduling/{dutyType,dutyInformation}` 与 `src/api/shiftScheduling/*`；Vue3 同名路由、`src/views/shiftScheduling/*`、`src/api/shiftScheduling/*`。核对 `type=0` 内置保护及值班列表/日历/导入/模板/批删契约。                                                                                                                                                                               | 入口、字段、主要交互和 API 已对照；宿主 API 按 Promise 链风格收敛                                                                   | 未新增专项单测                                                                                                | `tests/e2e/shift-scheduling-workflow.spec.ts`：4/4；类型 CRUD、筛选、日历失败恢复/切月、导入错误、模板下载和批量删除失败重试；全部请求 Mock | 未执行   | 补协同岗组织树、挂靠/上下岗、导入导出和失败恢复；真实联调按 P1-07 跟踪。已注释的协同减员不纳入。                                                         |
| 预警推送                                            | `src/router/modules/alert.js` 的 `alertPush`；Vue3 同名路由、`src/views/notification/alertPush`、`src/api/notification/alertPush.ts`。                                                                                                                                                                                                                                                                          | 列表与增删改调用已对照；四个新增/编辑表单按接收人类型切换查询 API 和群组名称字段                                                                                                              | 未新增专项单测                                                                                                | `tests/e2e/alert-push-workflow.spec.ts`：2/2；列表分类/搜索/重置、删除重试、无人值守新增群组查询与提交均由 Mock 拦截                                                        | 未执行   | 补齐其余新增/编辑组合、分页回显、受限账号及真实后端联调；不臆造无可信来源的权限码。                                                          |
| 权限中心：角色、人员、用户、IM/后台权限、自定义部门 | `src/router/modules/authority.js` 与 Vue3 `src/router/modules/authority.ts` 的 10 个未注释子路由；Vue3 `src/views/authority/*`、`src/api/authority/*`、`src/api/permission/*`。                                                                                                                                                                                                                                 | 入口和主要调用已对照；菜单/数据树失败保护、人员按钮码与管理员例外已补；后台角色成员回显仍阻塞                                       | 未覆盖                                                                                                        | 默认业务 E2E 86/86；权限矩阵 14 项、`authority-bind-workflow.spec.ts` 3 项通过，后端均由 Mock 拦截                                          | 未执行   | 补 IM 权限配置和人员设角工作流；后台角色成员读取契约待后端确认。                                                                                         |
| 基础数据：全局配置、地图、布局                      | `src/router/modules/baseData.js` 的 `globals`、`mapConfig`、`layoutConfig`；Vue3 同名路由、`src/views/baseData/*`、`src/api/baseData/*`。                                                                                                                                                                                                                                                                       | 全局参数 CRUD/权限、地图文件/地理编码/区划、App H5 板块 CRUD、协同群组配置创建/ID 回填、PC 页签写回和统计 Excel 文件流均有 Mock E2E | 已通过                                                                                                        | `base-data-workflow.spec.ts`：33/33 通过；所有请求由 Mock 截获                                                                              | 未执行   | 基础数据 Mock/E2E 验收完成；真实后端联调按 P1-07 跟踪。                                                                                                  |
| 场所                                                | 两代 `src/router/modules/location.*`、`src/views/location/index.vue`；Vue3 沿用 Vue2 的 `/admin/role/create`、`update`、`delete` 按钮权限标识。                                                                                                                                                                                                                                                                 | 列表/编辑/删除、权限标识已对照；宿主 API 已按 Promise 链风格收敛                                                                    | 未覆盖                                                                                                        | 未执行                                                                                                                                      | 未执行   | 用受限账号验证按钮及回显；权限名虽含 role，仍是 Vue2 既有契约。                                                                                          |
| 第三方应用、警情上报、北向接入                      | Vue2 `src/router/modules/thirdInterface.js` 的 `app`、`policeReport`、`thirdParty`；Vue3 `src/router/modules/thirdParty.ts`、`src/views/thirdInterface/{app,policeReport}`、`src/views/eventType/thirdParty/index.vue`、`src/api/resource/thirdApp.ts`。北向沿用 `systemName` 和 `/collaboration/v1/client/*` 契约。                                                                                            | 入口/API 字段已对照；北向列表、筛选、详情、增改删已迁移                                                                             | 未覆盖                                                                                                        | 北向筛选及增改删 Mock E2E 通过；其余流程未覆盖                                                                                              | 未执行   | 北向按钮权限码待后端契约确认；其余页验证分组、警情类型/对接配置及权限。                                                                                  |
| 南向接口与任务标准件                                | 上述路由的 `southInterface`；Vue2 `src/api/thirdInterface/southInterface.js` 与 TaskConfigModal；Vue3 `src/api/thirdInterface/southInterface.ts` 与同名组件。GET/POST `/third/v1/app/callable/{id}/task-config`，载荷为 `enableTask` 与 JSON 字符串 `taskAutoFillConfig`。                                                                                                                                      | URL、方法、字段、回显、读取失败重试、损坏配置保护、取消和重复保存已对照                                                             | `business-migration.test.ts`：URL/载荷、读取失败与损坏配置禁止保存、重试，通过                                | 未执行                                                                                                                                      | 未执行   | 用存量配置验证六项模板回显、保存后重开和受限权限。                                                                                                       |
| 统一通信与设备类型                                  | 上述路由的 `unifiedComm`；Vue2 `src/api/resource/deviceType.js`、DeviceTypeManage；Vue3 `src/api/thirdInterface/unifiedComm.ts`、同名组件。列表/更新/上传/展示开关沿用 `/proxy/icp/v1/isdnType`；开关 PUT 查询参数含 `id`、`isShow`。                                                                                                                                                                           | URL、方法、字段、开关失败回退、图标预览与上传失败恢复已对照                                                                         | `business-migration.test.ts`：四种请求，通过                                                                  | 未执行                                                                                                                                      | 未执行   | 验证鉴权图片、上传/移除/重开回显和开关失败；Vue2 无该页按钮级权限指令。                                                                                  |
| 智能体、分类、虚拟用户绑定                          | 上述路由的 `agentInterface`；Vue2 `src/api/thirdInterface/agentInterface.js`、AgentBindVirtualUser/AgentTypeEditModal；Vue3 `src/api/thirdInterface/agentInterface.ts`、同名业务组件及 `src/views/thirdInterface/agentInterface/utils/category.ts`。绑定 GET/POST/PUT `/collaboration/v1/ai/assistant/agent`；分类 POST `/XA-ics-agent/proxy/ai/v1/aiagent/management/category/saveOrUpdate/batch` 为全量提交。 | URL、方法、字段、绑定回显/读取失败保护、旧请求晚返忽略、分类提交前读取与重复名保护已对照                                            | `business-migration.test.ts`：绑定/分类请求、绑定读取失败禁止写入、旧绑定响应竞态、分类读取失败禁止写入，通过 | 未执行                                                                                                                                      | 未执行   | 验证创建/更新/解绑语义、分类并发修改、导入模板/上传及权限；无后端事务仍可能并发覆盖。                                                                    |
| 多节点与客户端拒绝                                  | `src/router/modules/nodeManage.js` 的 `nodeManagement`、`dataManage`；Vue3 同名路由、`src/views/nodeManage/*`。拒绝对照 Vue2 `src/api/nodeManage/client.js` 与 RejectDialog，PUT `/node/v1/p2p/clients/{peerId}/reject`，理由为查询参数 `desc`。                                                                                                                                                                | 拒绝契约、取消/失败保留弹窗及重复提交已对照；其他子页仅静态扫查                                                                     | `business-migration.test.ts`：拒绝 URL/参数及取消，通过                                                       | 未执行                                                                                                                                      | 未执行   | 实测授权、拒绝、连接状态、数据进出站、失败恢复与受限账号。                                                                                               |
| 虚拟用户、归档群                                    | Vue2 `src/router/modules/policeExtend.js` 的 `virtualUser`、`ArchivedTable`；Vue3 `policeExtend.ts` 在 `/policeExtend/ArchivedTable` 使用 `src/views/h5/archivedTable`，`/h5/ArchivedTable` 保留隐藏重定向。                                                                                                                                                                                                    | Vue2 父子菜单和旧 URL 已恢复；虚拟用户与归档 API 已按 Promise 链风格收敛                                                            | 未覆盖                                                                                                        | 归档首屏及旧 URL 重定向由 `preview.spec.ts` 覆盖；深层操作未覆盖                                                                            | 未执行   | 验证虚拟用户载荷、归档下载/批删/同步配置和权限。                                                                                                         |
| Vue3 额外入口：轮播、第三方接入                     | Vue3 `src/router/modules/h5.ts` 的 `carousel`、`src/router/modules/baseData.ts` 的 `thirdParty`；根目录 Vue2 对应模块无未注释入口。                                                                                                                                                                                                                                                                             | Vue3 入口已确认，不计 Vue2 缺失                                                                                                     | 未覆盖                                                                                                        | 未执行                                                                                                                                      | 未执行   | 明确产品归属后单独验收增删改与文件操作。                                                                                                                 |

## Vue3 API 调用风格

- 宿主业务 API 调用统一使用 `.then().catch().finally()`；业务响应在 `.then()` 中判断，网络异常在 `.catch()` 中处理，请求状态在 `.finally()` 中释放。详见根目录 `AGENTS.md` 与交付计划 CODE-01。
- 基础数据、登录/登出、会话心跳、权限中心、协同岗、第三方接口、排班、H5、位置、仪表盘、虚拟用户、共享 UI、`useTable`/`useFetch`、菜单与 License 路由初始化、HTTP 401 会话结束及登出流程均已按 Promise 链处理。Vue3 `src` 静态扫描没有直接业务 API `await`；表单校验、确认/弹窗结果、`nextTick`、动态导入和路由过滤顺序编排保留 `async/await`；401 原错误透传和提示门恢复由 `auth-http.test.ts` 回归。
- 权限范围按用户于 2026-09-26 的确认拆分：Vue2 有来源的菜单/按钮权限及管理员例外保留在迁移基线；文本/字段权限、新权限中心流程和无旧版权限码的按钮扩展延期。角色成员接口仍为 Vue2 TODO/空 Mock，恢复前不得猜造契约。
- 验证：全量 Vitest 15 个文件、59 项通过；`tests/e2e/permission-matrix.spec.ts` 14/14 通过；`vue-tsc --noEmit`、定向 ESLint 与 Prettier 检查通过。真实后端联调未执行，单列于 P1-07。

## 本轮浏览器验收

- 默认 `pnpm exec playwright test --reporter=line`：2026-09-26 为 100/101；唯一失败为 `/baseData/thirdParty` 入口 Smoke 未找到 `.main-container`，隔离复跑 1/1 通过，列为全量顺序执行波动待跟踪。其余覆盖现役入口、GroupTags 列表/增改删/旧图标显示/失败重试/批删与 375px 表格/分页滚动、权限和各业务 Mock。图标文档用例由 `playwright.icons.config.ts` 单独运行，避免接入业务开发代理。
- `pnpm test:e2e:preview --reporter=line`：2026-09-28 专用隔离 Mock 配置复验 2/2；独立遍历静态首页和 10 个分组、32 个动态入口，共 33 个页面，核验每个首屏样例文案、未配置 API 和轮播图资源，并验证全菜单目录、北向筛选/增改删及归档旧 URL 重定向。首次冷启动的一次全菜单导航超时，在独立浏览器确认路由挂载及完整重跑后通过；冷启动波动根因待观察。该首屏预览不等价于所有业务操作 Mock 验收。
- 2026-09-28 使用项目 Playwright 配置指定的系统 Chrome 生成 `test-results/mock-preview-all-menus.png`；等待 280ms 对话框过渡结束后截取，Playwright 单独断言目录包含 33 条链接。当前 Mock 服务保持在 `http://127.0.0.1:30847/h5/GroupTags`，全部 API 请求仍由隔离 Mock 处理。
- 2026-09-26 北向隔离 Mock E2E 单项复跑曾为 0/1（预期 3 行、实际 0 行）；2026-09-28 当前专用套件中北向筛选/增改删通过。北向按钮权限码仍需可信后端契约确认，真实后端联调未执行。
- `tests/e2e/fixtures.ts` 拦截 `/linkx/admin/**` 后端请求。本轮只证明路由渲染和访问控制 Smoke 通过，不代表业务表单、上传下载、保存回显等交互完成 Mock 验收，也不代表真实后端联调通过。
- Vue3 完整 Vitest 最新记录为 15 个文件、59 项通过；`vue-tsc --noEmit`、定向 ESLint 与变更文件 Prettier 检查通过。14 个文件、54 项为此前批次的历史基线。
- 真实后端联调：未执行。角色设置用户仍受缺少可信成员读取接口的契约阻塞。

## Vue3 Element Plus 与 lx-ui 依赖迁移

2026-09-27 `LxEmpty` 已完成库级 API/Demo、5 项单测和文档 Playwright 1/1；`imageSize` 支持现有两处 `image-size=80`，根节点 class 可透传。当前 15 处宿主 `el-empty` 仍待 UI-04 按实际页面逐项替换和回归；不提前进入宿主迁移阶段。

Vue3 宿主 Element Plus 用量、46 种模板标签的逐项映射、没有 Lx 通用封装的 25 种标签，以及移除宿主直接依赖的前置条件见 [ELEMENT-PLUS-LX-UI-MATRIX.md](./ELEMENT-PLUS-LX-UI-MATRIX.md)。当前仅完成盘点，宿主源码、自动导入、类型、样式和 Vite 构建配置仍直接依赖 Element Plus；执行顺序为 lx-ui 高频组件就绪、宿主依赖入口统一、按共享组件影响面替换页面、再补受影响业务深交互验收，最后移除宿主直依赖。

`LxActionButtons` 库级 API、3 项单测和 3 项文档 Playwright 已验证。Vue3 29 处宿主引用仍未迁移；后续适配需保留原 `buttons` 与预设 `actions`、每项 `onClick`、Element Plus 图标映射、`gap`、disabled 和现有权限过滤行为。

组件行为增量：`tests/unit/lx-virtual-tree.test.ts` 覆盖虚拟窗口、过滤祖先、禁用节点选择、键盘焦点、公开方法和插槽；lx-ui 独立中文 Demo/API 位于 `linkx-fe/docs/components/lxvirtualtree.md`。Chrome 桌面交互/方向键、375px HUD 深色、空/错状态和页面无横向溢出已验；尚未替换 Vue3 业务树。

`LxProTable` 独立中文 API/Demo 和 `tests/e2e/lx-pro-table-docs.spec.ts` 4 项浏览器验收已补齐，覆盖跨页受控选择、清空、加载/减少动效、空/错恢复、排序、375px 局部滚动/键盘、44px 复选目标及 HUD 深色。该证据验证组件文档示例，不代表 Vue3 业务表格已逐页替换或完成真实后端联调。

`LxDescriptions` 已对照 `design/详情描述行 Descriptions/` 完成 32px 行高、布局/标签宽度、复制字段和状态点；6 项单测、3 项文档 Playwright 与组件级 Impeccable 定向检查通过。该组件仍未接入 Vue3 业务详情页；当前只是库级交付证据，完整替换仍按“基础控件与动态图标 → DynamicForm → 其余组件及整库 Impeccable → Vue3 页面替换”推进。

`LxSplitLayout` 已有独立中文 API/Demo、3 项宿主单测及 3 项文档 Playwright，覆盖 200–480px 可用宽度、折叠后主区同行、键盘/拖动、375px 表格局部滚动、HUD 深色和减少动效。它仍只是组件库交付，业务树/表场景未逐页替换；后续 UI-04 按 Vue2 页面契约验证数据、选择状态和窄屏组合。此证据不代表 Impeccable 正式 Critique 通过或真实后端联调。

## 本地 Mock 全菜单预览

- `mock/preview-menu.ts` 的 10 个菜单组、32 个动态子菜单与现役 Vue3 路由入口一致，并补入 Vue2 现役北向接入管理；固定首页来自 `router/index.ts` 静态路由。历史注释菜单和未证实入口不自动恢复。
- Mock 预览在 768px 及以上默认展开侧栏菜单；侧栏固定首页、支持搜索和“全部菜单”目录，目录从当前权限路由生成且可筛选/键盘导航。窄屏移动端保留抽屉交互，390px 和 320px 下顶栏无重叠、页面无横向溢出。Mock 为全部 33 个页面首屏提供样例数据或配置。
- 轮播图图片由隔离式 Mock 服务返回本地 SVG；未配置接口返回 501，不代理真实后端。普通 E2E 排除 `preview.spec.ts`，专用预览配置只启动 Mock 模式。

## 明确阻塞与边界

- 角色“设置用户”：Vue2 `src/api/resource/user.js:getUsersByRoleId` 留有 TODO，实际返回空 Mock；Vue3 `src/views/authority/adminRole/index.vue` 的 `PUT /auth/v1/role/{roleId}/user` 提交完整用户 ID 数组。目前无可信的现有成员读取接口，直接确认可能覆盖既有成员。需后端确认读取契约，才可做安全回显和真实验收；不可凭空添加 URL 或标为已验证。
- 静态扫查 `src/views`，仅 `src/views/placeholder/index.vue` 明确写“尚未实现”，但未被现役 Vue3 router 引用。`src/api/oauth/menu.ts` 保留未被 `src` 引用的 Mock，由认证工作单独处理。
- 上表没有完整业务 Mock 或真实后端联调通过记录；GroupTags 的列表/增改删/失败重试/批删及窄屏滚动有自动化 Mock/E2E，图标映射保留接口旧值。Vitest 仅模拟 HTTP 返回并断言请求和局部失败行为，不证明后端兼容。仍需自动化覆盖权限、取消、重复操作与保存后重开。

验证命令：`pnpm exec vitest run tests/unit/business-migration.test.ts`（10 项通过）、`pnpm lint:ts`（上一轮通过，本轮未修改类型代码）、修改文件定向 `pnpm exec eslint ...`（通过）、变更文件 Prettier `--check`（通过）。

## 2026-10-17 LxEmpty

- 库级 API、Demo、单测 **5/5**、文档 E2E **1/1** 已完成；`imageSize` 兼容现有两处 `image-size=80`，根节点 `class` 可透传。
- 15 处宿主 `el-empty` 继续留在 UI-04 逐页迁移，需按页面保留描述、插槽和空/错/加载契约；不提前删除 `element-plus`。

`LxPasswordInput` 组件级证据已完成：单测 11/11、文档 E2E 9/9；移动端清空/显隐键盘顺序和 44px 触控区已回归。该条只关闭 lx-ui 组件门禁，不代表 Vue3 登录页替换或真实认证联调；下一组件为 `LxMetricCard` 与 `LxSectionTitle`。
- `LxSectionTitle` 组件库已完成窄容器响应式与标签辅助名称修复，组件 E2E **1/1**；配置页真实组合仍登记为 UI-04 未完成，不能标记页面迁移完成。

## 2026-10-19 LxInput 前后缀行高

- Vue3 适配继续通过 lx-ui 的 LxInput；本波只修复库内样式和文档 E2E，不改变宿主 props、事件、插槽或 Promise 链 API 请求写法。
- 复合输入尺寸、390px 触屏和焦点环回归通过；Element Plus 全量替换仍等待 UI-10/UI-11 门禁。

## 2026-10-19 LxInput 前后缀完整高度

- lx-ui 输入节点、prefix/suffix、内部槽位和 prepend/append 已统一完整高度轨道；宿主适配不需要再覆盖 Element Plus 高度样式。
- 组件级 E2E **1/1**、单测 **13/13**；业务页面、权限源、真实 API 和 Element Plus 删除仍未完成。

# LxDescriptions 宿主迁移补充

- lx-ui 当前版长值/长状态按钮已通过单测 10/10、文档 E2E 3/3；宿主详情页迁移时需保留 `items`、`columns`、`layout`、`rowHeight`、`copyable`、脱敏和具名插槽契约。
- 业务 API、权限源、真实详情数据和错误恢复仍由页面适配层负责；缺少可信后端契约时不新增字段或权限码。真实宿主回归属于 UI-04，不能用 Demo 证据替代。
# 2026-10-19 LxProTable 迁移契约复验

- Vue3 宿主适配继续保留 `tableAttrs`、自定义列/表头/单元格插槽、按当前页差集合并的跨页选择、排序、局部滚动和 `maskValue` 权限脱敏边界。
- 当前仅完成库级行为与 Mock 文档证据；真实列表 API、分页协议、权限源和业务页面替换未完成，不得将本条标记为真实联调完成。

## 2026-10-19 LxPagination 迁移门禁复核

- lx-ui 组件/适配器单测 **7/7**、文档 E2E **3/3** 通过，旧 `page/limit/pagination` 事件契约保持不变。
- 组件正式 Impeccable B 目录当前缺失，UI-10 行保持开放；未开始业务页面替换、真实分页 API 和权限联调。

## 2026-10-19 全菜单 Mock 首屏复验

- 专用预览配置下 **10/10** 通过；首页、10 个菜单组、32 个动态入口共 33 个页面均核对首屏样例和路由可达性。
- 另覆盖菜单目录/搜索、远程搜索迟到响应、北向筛选增改删、轮播分页、鉴权图片失败恢复/键盘重试和减少动效。
- 该证据不关闭真实 API、权限码、深层业务操作或 Element Plus 替换门禁。

## 2026-10-19 LxPagination 宿主首批迁移

- 已替换 `notification/alertPush` 双分页、`eventType/thirdParty` 分页和 `collaboration/CoopBindDialog` 分页；均使用 `LxPagination` 并保留原页面数据请求和分页状态。
- 验证：类型检查、目标 ESLint、Prettier、差异检查；全菜单首屏和北向 Mock CRUD 通过。
- 剩余直接 `el-pagination` 页面及真实后端/权限联调继续登记，不删除 Vue3 `element-plus` 直接依赖。

## 2026-10-19 LxInput 复合边框

- Vue3 适配继续直接复用 lx-ui `LxInput`，不在宿主复制边框样式；复合 prepend/append 和密码边框已纳入文档回归。
- 本波不改变页面权限、API 请求链或 Element Plus 依赖，业务页面迁移仍按 UI-04/UI-10 门禁推进。

## 2026-10-19 LxDialog footer

- Vue3 宿主复用 lx-ui `LxDialog` 时，`hideFooter` 与自定义 `#footer` 已保持单一底栏；页面不需要复制条件样式或默认按钮。
- 本波不改变业务弹窗 API、提交锁、权限码和请求链；真实宿主组合仍需逐页回归。

## 2026-10-19 ProTable 隐藏列

- Vue3 `ProTable` 适配层已按 `ITableColumn.hide` 不渲染隐藏列，保留可见列属性、插槽和顺序；单测 **5/5**、LxProTable 文档 E2E **4/4**。
- 该修复不等于业务字段权限完成；真实权限源、列表 API、空/错/取消和深层操作仍需逐页迁移验证，API 请求继续采用 `.then().catch().finally()`。

## 2026-10-19 LxPagination 宿主门禁

- 组件文档 E2E **3/3** 通过，证明当前公开分页交互可供宿主复用；不代表业务页面真实 API、权限和分页协议已验证。
- 正式 Impeccable A/B 与跨浏览器仍开放；页面迁移继续按 `.then().catch().finally()` 保留请求状态和错误恢复。
## 2026-10-19 LxInput 普通边框契约

- Vue3 业务页继续通过 lx-ui `LxInput` 复用边框令牌；普通、密码、透传包装器和复合前后缀已有组件级边框回归，不在宿主复制样式。
- 本波不改变页面 props、事件、权限码或 Promise 链请求；Element Plus 全量替换仍等待 UI-10/UI-11 门禁与逐页 Mock/E2E。
## 2026-10-19 LxSelectPagination 防抖宿主契约

- Vue3 宿主接入时可直接传入业务需要的 `debounce` 毫秒数；组件不改变请求取消、分页和失败恢复语义。
- 本波不改变页面权限码、API 协议或 `.then().catch().finally()` 请求风格；真实页面仍需 Mock/E2E 和后端契约验证。
## 2026-10-19 LxSectionTitle 图标名契约

- Vue3 宿主继续通过 lx-ui `LxSectionTitle`，组件 Demo 的图标名称已与注册表统一为 `setting`；不改变页面标题、插槽或权限契约。
- 本波只修复库级类型门禁，页面迁移仍需按 Mock、权限和真实 API 逐页验证。
