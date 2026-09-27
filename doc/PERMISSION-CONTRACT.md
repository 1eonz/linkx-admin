# LinkX 权限契约清单

> 版本：2026-09-26  
> 状态：权限实现基线，未知权限码不得由前端猜测。  
> 关联计划：[PROJECT-DELIVERY-PLAN.md](./PROJECT-DELIVERY-PLAN.md)

## 1. 权限来源和优先级

| 数据          | 当前接口/来源                                    | 前端消费位置                                 | 说明                                        |
| ------------- | ------------------------------------------------ | -------------------------------------------- | ------------------------------------------- |
| 菜单树        | `GET /api/menu/list`                             | `useUserStore.getMenuAction`、`filterChain`  | 提供 URL、父子关系、标题、排序和状态        |
| 菜单权限 ID   | `POST /auth/v1/oauth/v2/permissions` 的 `menus`  | `MenuPermissionFilter`                       | 当前按 ID 精确/前缀匹配                     |
| 操作权限码    | 同一权限响应的 `actions`                         | `usePermission.ts`、页面 `hasBtnPermission`  | 精确字符串匹配，沿用 Vue2/API 契约          |
| 身份类型      | 权限响应 `type`、登录结果 `isAdmin`、本地用户 ID | `filterChain`、`getIsAdmin`                  | `type=0` 当前放行注册路由；按钮不会自动放行 |
| License       | `/api/msip/license/info`                         | `LicenseFilter`                              | 影响归档群组、位置等入口                    |
| 全局开关      | `/api/globals/list`                              | `GlobalConfigFilter`、`MenuPermissionFilter` | 影响排班、网关、车辆、自定义图层            |
| 文本/字段权限 | 当前没有已确认后端字段                           | 无实际业务消费                               | 不得自行创建权限码或敏感字段规则            |

## 2. 现役菜单和页面入口

| 菜单组   | 页面 URL                                                                                                                                                                                                                                              | Vue3 路由模块                     | 当前状态                                                                    |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------- |
| 工作台   | `/dashboard`                                                                                                                                                                                                                                          | `router/index.ts` 静态路由        | 登录后固定入口，不依赖动态菜单 ID；复用路由守卫的登录态检查                 |
| 系统配置 | `/baseData/thirdParty`、`/baseData/globals`、`/baseData/mapConfig`、`/baseData/layoutConfig`                                                                                                                                                          | `router/modules/baseData.ts`      | legacy 菜单过滤；OAuth 三方和全局参数映射已修正                             |
| 权限中心 | `/authority/role`、`/authority/person`、`/authority/userManage`、`/authority/IMPermission`、`/authority/IMrole`、`/authority/IMperson`、`/authority/adminPermission`、`/authority/adminRole`、`/authority/adminPerson`、`/authority/customDepartment` | `router/modules/authority.ts`     | 有管理员、用户 ID 和生产环境例外                                            |
| 协同岗   | `/collaboration/index`、`/collaboration/quick`                                                                                                                                                                                                        | `router/modules/collaboration.ts` | 需补受限账号和按钮验收                                                      |
| H5       | `/h5/carousel`、`/h5/GroupTags`                                                                                                                                                                                                                       | `router/modules/h5.ts`            | 轮播和群组标签入口；归档群组沿用 Vue2 警信扩展菜单 URL                      |
| 位置     | `/location/location`                                                                                                                                                                                                                                  | `router/modules/location.ts`      | 已有按钮码，但页面展示需 E2E                                                |
| 排班     | `/scheduling/dutyType`、`/scheduling/dutyInformation`                                                                                                                                                                                                 | `router/modules/scheduling.ts`    | `dutyInformation` 受全局开关和管理员规则影响                                |
| 预警     | `/notification/alertPush`                                                                                                                                                                                                                             | `router/modules/alert.ts`         | 未完成按钮权限核对                                                          |
| 警信扩展 | `/policeExtend/virtualUser`、`/policeExtend/ArchivedTable`                                                                                                                                                                                            | `router/modules/policeExtend.ts`  | 归档页保留 Vue2 URL；`/h5/ArchivedTable` 仅作重定向兼容；未完成按钮权限核对 |
| 三方对接 | `/thirdParty/app`、`/thirdParty/southInterface`、`/thirdParty/policeReport`、`/thirdParty/unifiedComm`、`/thirdParty/agentInterface`、`/thirdParty/thirdParty`                                                                                        | `router/modules/thirdParty.ts`    | 北向入口沿用 Vue2 `systemName` 和 client API；按钮权限整体未完成            |
| 多节点   | `/nodeManage/nodeManagement`、`/nodeManage/dataManage`                                                                                                                                                                                                | `router/modules/nodeManage.ts`    | 未完成按钮权限核对                                                          |

## 3. 已确认的按钮权限码

以下权限码在 Vue2/Vue3 代码中有直接证据，可以继续沿用：

| 权限码                         | 当前使用位置             | 语义              |
| ------------------------------ | ------------------------ | ----------------- |
| `/admin/role/create`           | Vue3 location            | 新增              |
| `/admin/role/update`           | 角色、位置等页面         | 编辑/更新         |
| `/admin/role/delete`           | 角色、位置等页面         | 删除              |
| `/admin/executor/create`       | 人员页面                 | 新增人员          |
| `/admin/executor/update`       | 人员页面                 | 更新人员          |
| `/admin/executor/delete`       | 人员页面                 | 删除人员          |
| `/admin/user/create`           | 权限 Mock 与用户相关逻辑 | 新增用户          |
| `/admin/user/update`           | 权限 Mock 与用户相关逻辑 | 更新用户          |
| `/admin/user/delete`           | 人员页面                 | 删除用户          |
| `/admin/user/updatePwd`        | 人员页面                 | 修改/重置密码     |
| `/admin/trUserRole/createMany` | 人员、统一通信           | 批量绑定角色/授权 |
| `/admin/globals/create`        | 全局参数                 | 新增              |
| `/admin/globals/update`        | 全局参数                 | 更新/启用         |
| `/admin/globals/delete`        | 全局参数                 | 删除/停用         |

### 3.1 尚无可信权限码的操作

应用管理、地图配置、布局配置、协同岗、排班、预警、节点、警单、南向、AI、虚拟用户、归档和上传下载等页面存在操作按钮，但当前没有完整的 Vue2/API 权限码对照证据。经用户确认，这些超出 Vue2 明确权限基线的按钮授权属于新增需求，当前延期；恢复时必须先补充后端或 Vue2 契约来源，再接入按钮权限。已确认的旧版按钮码仍按迁移计划保留和回归。

## 4. 文本和字段权限

当前事实：

- `v-has-text-perm`、`v-auth` 已注册并支持权限变化后的重判；业务页面仍没有调用字段脱敏，避免臆造后端字段权限。
- 没有已确认的 `maskedFields`、字段权限码或脱敏占位契约。
- lx-ui 已提供 `setupLxPermission`、`permissionSource`、`mask/disable/hide` 和组件级 `auth`/`mask` 消费，但宿主当前只注入按钮权限，字段来源为空。

因此在后端未确认前，保留已实现的权限消费框架和测试；手机号、身份证号、密钥等字段脱敏作为新增需求延期，不能臆造权限码或脱敏规则。

## 4.1 OAuth 映射处理记录

- 已修正：`thirdParty`、`globals`、`collaboration`、`dock`、`manage`、`typeManage` 指向当前 Vue3 实现。
- `GroupTags` 已按 Vue2 独立 API 迁移到 Vue3 页面，保持与 `quick` 标签树不同的契约；列表/新增、编辑、单删、查询失败重试和批量删除已有 Mock/E2E，按钮权限边界和真实联调仍待执行。

## 5. 管理员和路由例外

| 规则                             | 当前实现                                                                            | 待验收                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 固定首页 `/dashboard`            | 登录后由静态路由提供；侧栏与全菜单目录固定列出                                      | 页面不依赖动态菜单 ID，保留登录态保护                    |
| `permissions.type=0`             | `MenuPermissionFilter` 放行注册路由，但 `status=0` 停用菜单仍强制不注册             | Mock/单测按超管全量处理；真实后端管理员契约待确认        |
| 非管理员隐藏 `layoutConfig`      | 仅拥有 `layoutConfig/banner` 时保留                                                 | 轮播菜单例外                                             |
| `userId !== 1` 隐藏 `userManage` | `UserAuthFilter`                                                                    | Mock E2E 验证 ID 2 即使拥有全量菜单也被直接地址拦截；真实账号身份契约待确认 |
| 角色 ID 2/6                         | Vue2 `/authority/role` 允许编辑，隐藏删除和启停；Vue3 保持相同行为                   | `permission-matrix.spec.ts` Mock E2E 已验证               |
| 生产环境隐藏六个权限页           | `IMPermission`、`IMrole`、`IMperson`、`adminPermission`、`adminRole`、`adminPerson` | 生产构建浏览器验收                                       |
| License 过滤                     | 归档群组、位置                                                                      | Mock 菜单与直达地址已验收；字段真假语义需和后端确认      |
| 全局开关                         | 排班、网关、车辆、自定义图层                                                        | 排班关闭的菜单与直达地址已验收；其他开关和失败恢复待验证 |

## 6. 交付验收矩阵

| 场景                | 菜单                                       | 页面               | 按钮                             | 文本             | 当前证据                                                                     |
| ------------------- | ------------------------------------------ | ------------------ | -------------------------------- | ---------------- | ---------------------------------------------------------------------------- |
| 管理员全量          | Mock 33 项通过（静态首页 + 32 个动态入口） | 部分验收           | 角色/人员/管理员账号按钮矩阵 14 项通过 | 文本业务待契约 | 路由单测、入口 Smoke、`permission-matrix.spec.ts`；真实后端仍待验收          |
| 普通用户受限菜单    | 已有过滤                                   | 直接地址拦截已验收 | 局部                             | 文本业务待契约   | `auth-routes.test.ts`、`migration.spec.ts`、`permission-matrix.spec.ts`      |
| 空受限菜单          | 单测与浏览器通过                           | 直接地址回退通过   | 未覆盖                           | 未实现           | `auth-routes.test.ts`、`permission-matrix.spec.ts`                           |
| 无按钮权限          | 部分覆盖                                   | 页面可进入         | 角色/人员/管理员局部按钮码已覆盖 | 未覆盖           | `permission-matrix.spec.ts`：当前 14 项；其他模块仍缺契约                    |
| 无文本权限          | 框架已实现                                 | 组件/指令单测      | 业务字段待契约                   | 后端字段来源缺失 | `permission-ui.test.ts`、lx-ui permissions 消费层；无业务脱敏调用            |
| 停用菜单 `status=0` | OAuth/legacy 均过滤                        | 受限页面不注册     | 不适用                           | 不适用           | `auth-routes.test.ts`、`auth-oauth-map.test.ts`、`permission-matrix.spec.ts` |
| License/全局开关    | 受限菜单已过滤                             | 直接地址回退通过   | 不适用                           | 不适用           | `permission-matrix.spec.ts`：群组 License、排班开关                          |
| 账号切换            | store 清理已实现                           | 需浏览器验证       | 需验证旧按钮清理                 | 需验证旧文本清理 | auth-store 单测部分覆盖                                                      |
