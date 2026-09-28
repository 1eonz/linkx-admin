# LinkX 项目交接记录

> 对应计划：[PROJECT-DELIVERY-PLAN.md](./PROJECT-DELIVERY-PLAN.md)  
> 记录原则：每个阶段只记录实际完成和实际验证，不把静态检查写成联调完成。

## 记录模板

```text
### [日期] 步骤编号 / 步骤名称

- 目标：
- 改动文件：
- 完成内容：
- 验证命令与结果：
- 未完成/阻塞：
- 下一步：
```

## [2026-09-25] P0-01 / 建立统一交付计划

- 目标：把迁移、权限、lx-ui、架构和验证缺口收敛到一份可持续更新的计划中。
- 改动文件：
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
  - `doc/PROJECT-MAP.md`
- 完成内容：
  - 建立五类完成状态：源码对照、单测、Mock、E2E、真实联调。
  - 纳入按钮、文本、菜单、页面展示四层权限任务。
  - 纳入角色成员读取阻塞、OAuth 占位映射、组件库接入、menu-config 和引导系统。
  - 记录当前验证基线和工作区保护要求。
- 验证命令与结果：
  - 已完成只读代码和文档盘点。
  - 尚未修改业务实现，未宣称任何新增功能完成。
- 未完成/阻塞：
  - P0-02 以后任务尚未实施。
  - 角色成员读取、真实后端联调和 Playwright 浏览器环境仍阻塞。
- 下一步：执行 P0-02 权限契约清单和权限覆盖盘点。

## [2026-09-25] P0-02 / 建立权限契约清单

- 目标：明确菜单、页面、按钮、文本四层权限的真实来源，禁止凭空增加权限码。
- 改动文件：
  - `doc/PERMISSION-CONTRACT.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - 记录菜单树、菜单权限 ID、操作权限码、身份类型、License 和全局开关来源。
  - 登记现役 Vue3 菜单和页面入口。
  - 列出已确认的按钮权限码和目前没有可信来源的操作范围。
  - 明确文本/字段权限契约尚未存在，不能直接实现脱敏规则。
  - 建立管理员、普通用户、空菜单、停用菜单和账号切换验收矩阵。
- 验证命令与结果：
  - 只读扫描 Vue2/Vue3 路由、权限工具、页面权限调用和测试文件，完成清单核对。
  - 未修改业务代码。
- 未完成/阻塞：
  - 未确认按钮权限码的模块必须等待 Vue2/API/后端证据。
  - 文本字段权限等待后端契约。
- 下一步：执行 P0-03 菜单、页面访问和 OAuth 映射修正。

## [2026-09-25] P0-03a / legacy 菜单过滤和确定性 OAuth 映射

- 目标：修复能够从现有路由/API 证据确定的菜单和占位映射问题。
- 改动文件：
  - `other-admin/admin-vue3/src/router/filterChain.ts`
  - `other-admin/admin-vue3/src/utils/menuRouteMapper.ts`
  - `other-admin/admin-vue3/tests/unit/auth-routes.test.ts`
  - `other-admin/admin-vue3/tests/unit/auth-oauth-map.test.ts`
  - `doc/PERMISSION-CONTRACT.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - legacy 菜单过滤忽略 `status=0` 停用节点，即使权限 ID 仍在缓存中也不会恢复。
  - 子菜单独立递归，父菜单没有单独权限 ID 时可以匹配已授权叶子节点。
  - `thirdParty`、`globals`、`collaboration` 及警单旧子路径改为当前实现或当前组件。
  - 新增 OAuth 映射测试和停用菜单路由测试。
- 验证命令与结果：
  - `pnpm exec vitest run tests/unit/auth-routes.test.ts tests/unit/auth-oauth-map.test.ts --reporter=dot`：2 个文件、10 项通过。
  - `pnpm exec vue-tsc --noEmit`：通过。
  - 定向 ESLint：0 error；`menuRouteMapper.ts` 仍有既有 console warning。
- 未完成/阻塞：
  - `GroupTags` 仍映射到 Vue3 占位页，需迁移或产品确认下线。
  - 真实浏览器直接地址和停用菜单验证尚未运行，Playwright Chromium 缺失。
  - P0-03 整体仍为进行中。
- 下一步：执行 P0-04，先把已确认权限码接入遗漏的高风险按钮页面。

## [2026-09-25] P0-04a / 已确认权限码的按钮接入

- 目标：让已有后端/Vue2 契约依据的按钮先统一消费权限，避免把未知业务码猜成新协议。
- 改动文件：
  - `other-admin/admin-vue3/src/components/ActionButtons/index.vue`
  - `other-admin/admin-vue3/src/composables/usePermission.ts`
  - `other-admin/admin-vue3/src/views/authority/auth/index.vue`
  - `other-admin/admin-vue3/src/views/authority/adminRole/index.vue`
  - `other-admin/admin-vue3/src/views/authority/imRole/index.vue`
  - `other-admin/admin-vue3/src/views/authority/userManage/index.vue`
  - `other-admin/admin-vue3/tests/unit/permission-ui.test.ts`
  - `doc/PERMISSION-CONTRACT.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - `ActionButtons` 增加可选 `auth` 权限码，保留未传 `auth` 的兼容行为。
  - 后台角色、前台角色、管理员账号的新增、编辑、删除、启用/禁用、绑定和重置密码接入已确认权限码。
  - 后台角色状态切换无更新权限时禁用。
  - 新增按钮权限过滤单测。
- 验证命令与结果：
  - `pnpm exec vitest run tests/unit/permission-ui.test.ts --reporter=dot`：3 项通过。
  - `pnpm exec vue-tsc --noEmit`：通过。
  - 定向 ESLint：0 error；测试文件曾有 import/order warning，已调整。
- 未完成/阻塞：
  - 三方、地图、布局、协同、排班、预警、节点、警单、AI、虚拟用户等模块缺少可信按钮码映射，尚未接入。
  - `ActionButtons` 只覆盖统一组件，直接写在模板和 SearchBar 的按钮仍需逐页盘点。
- 下一步：执行 P0-05 文本权限指令和字段脱敏消费；随后继续补齐有契约依据的按钮。

## [2026-09-25] P0-05a / 文本权限消费框架

- 目标：按设计文档建立可更新的隐藏、禁用和脱敏权限指令，为后端字段权限契约预留安全消费边界。
- 改动文件：
  - `other-admin/admin-vue3/src/composables/usePermission.ts`
  - `other-admin/admin-vue3/src/directives/index.ts`
  - `other-admin/admin-vue3/tests/unit/permission-ui.test.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - `v-has-perm`、`v-has-text-perm` 增加权限变化后的 `updated` 重判。
  - 新增 `v-auth`，支持默认移除、`.hide`、`.disable` 和 `.mask:field`。
  - 脱敏默认显示 `***`，恢复权限后还原原文本；未添加业务使用点，避免臆造字段权限码。
  - 新增指令行为单测。
- 验证命令与结果：
  - `pnpm exec vitest run tests/unit/permission-ui.test.ts --reporter=dot`：3 项通过。
  - `pnpm exec vue-tsc --noEmit`：通过。
- 未完成/阻塞：
  - 后端尚未提供文本/字段权限码，业务页面尚不能安全添加脱敏调用。
  - lx-ui 的 `setupLxPermission`、`permissionSource` 和组件列/描述脱敏仍未实现。
- 下一步：继续逐页盘点按钮，优先补有 Vue2/API 依据的操作；同步准备权限矩阵 E2E。

## [2026-09-25] P0-06 / Vue3 质量门禁收敛

- 目标：清理 Vue3 当前 ESLint 错误和调试输出，确认类型、单测、格式和生产构建可以重复运行。
- 改动文件：
  - `other-admin/admin-vue3/src/views/authority/customDepartment/index.vue`
  - `other-admin/admin-vue3/src/views/baseData/mapConfig/index.vue`
  - `other-admin/admin-vue3/src/views/baseData/thirdParty/index.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/ColForm.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/ColFunctionTab.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/ColSearch.vue`
  - `other-admin/admin-vue3/src/utils/menuRouteMapper.ts`
  - `other-admin/admin-vue3/src/views/authority/adminPerson/index.vue`
  - `other-admin/admin-vue3/src/views/authority/imPerson/index.vue`
  - `other-admin/admin-vue3/src/views/authority/person/index.vue`
  - `other-admin/admin-vue3/src/views/shiftScheduling/dutyInformation/index.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
  - `doc/PROJECT-MAP.md`
- 完成内容：
  - 移除未使用导入、局部状态和恒假条件；保留 `ColSearch` 原有 `hiddenSync` 兼容开关。
  - 删除未被消费的 OAuth 调试打印函数，异常路径不再输出敏感或无用对象。
  - 对查询/导出失败路径补充中文原因说明，避免空 catch 被误判为吞错。
- 验证命令与结果：
  - `pnpm lint`：通过，0 error、0 warning。
  - `pnpm exec prettier --check <本次涉及文件>`：通过。
  - `pnpm test:unit -- --reporter=dot`：11 个文件、42 项通过。
  - `pnpm build`：通过，产物生成成功。
- 未完成/阻塞：
  - 构建仍提示第三方依赖纯函数注释、Less `:export` 命名空间、动态/静态导入和大 chunk；属于构建配置/性能治理，不影响当前功能门禁。
  - Playwright Chromium、真实后端联调尚未执行。
- 下一步：继续补齐有可信来源的按钮权限，建立浏览器权限矩阵并处理 GroupTags 占位模块。

## [2026-09-25] P0-05b / lx-ui 权限消费层

- 目标：按 `doc/lx-ui/MENU-CONFIG-DESIGN.md` 建立与业务无关的权限消费层，让按钮和字段展示由宿主注入权限源控制。
- 改动文件：
  - `linkx-fe/src/permissions.ts`
  - `linkx-fe/src/index.ts`
  - `linkx-fe/src/components/LxActionButtons/index.vue`
  - `linkx-fe/src/components/LxActionButtons/types.ts`
  - `linkx-fe/src/components/LxProTable/index.vue`
  - `linkx-fe/src/components/LxProTable/types.ts`
  - `linkx-fe/src/components/LxDescriptions/index.vue`
  - `linkx-fe/src/components/LxDescriptions/types.ts`
  - `linkx-fe/docs/components/permissions.md`
  - `linkx-fe/docs/.vitepress/config.ts`
  - `linkx-fe/docs/components/new-components.md`
  - `linkx-fe/docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/src/main.ts`
- 完成内容：
  - 新增 `setupLxPermission`、`hasPermission`、`isFieldMasked` 和 `maskValue`；库不请求接口、不保存登录态。
  - `LxActionButtons.auth`、`LxProTable` 列 `mask` 和 `LxDescriptions` 条目 `mask` 消费宿主注入的权限源。
  - Vue3 宿主注入已有 `userStore.buttons`；`maskedFields` 保持为空，等待可信后端字段权限契约。
- 验证命令与结果：
  - `linkx-fe/pnpm typecheck`：通过。
  - `linkx-fe/pnpm build`：通过。
  - `linkx-fe/pnpm build:docs`：通过；仅有文档 chunk 体积提示。
- 未完成/阻塞：
  - 后端尚未提供字段权限来源，业务页面不能凭空添加脱敏权限码。
  - 真实业务页面逐页替换和浏览器主题/上传网络验收仍待完成。
- 下一步：保持字段权限阻塞边界，继续补充有 Vue2/API 证据的业务按钮和组件宿主接入。

## [2026-09-25] P0-07 / 固定 Playwright 浏览器环境与权限矩阵验收

- 目标：让浏览器验收在本机可重复启动，并把权限按钮、菜单停用和页面展示纳入真实浏览器矩阵。
- 改动文件：
  - `other-admin/admin-vue3/playwright.config.ts`
  - `other-admin/admin-vue3/tests/e2e/permission-matrix.spec.ts`
  - `other-admin/admin-vue3/tests/e2e/fixtures.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
  - `doc/PROJECT-MAP.md`
- 完成内容：
  - Playwright 优先使用有效环境变量，Windows 下自动查找 Program Files、Program Files (x86) 和 LocalAppData 中的 Chrome；找不到时回退 Playwright 自带浏览器。
  - 权限矩阵覆盖无操作权限隐藏新增/行内操作、权限恢复显示操作，以及停用菜单即使保留权限 ID 也不能注册页面路由。
  - 修复共享 `SearchBar` 的 controls/actions 插槽冲突，避免新增和批量操作按钮在浏览器中被吞掉。
- 验证命令与结果：
  - `pnpm exec playwright test`：系统 Chrome `153.0.8010.53` 下当前 42 项通过。
  - 包含 31 个入口 Smoke、GroupTags 列表/新增/失败重试/批删 Mock、未登录跳转、受限账号直接地址拦截、4 个权限矩阵用例和 4 个 UI/窄屏/键盘用例。
- 未完成/阻塞：
  - E2E 使用统一 Mock，不代表真实后端权限和业务联调。
  - 未知业务模块仍缺少可信按钮权限码，继续保留在权限契约阻塞清单。
- 下一步：补齐 GroupTags 编辑、单删和失败恢复边界；继续逐模块补业务 Mock/E2E。

## [2026-09-25] P0-04b / 现役按钮权限复核与后台用户状态守卫

- 目标：复核现役 Vue2/Vue3 可见按钮权限码，修复遗漏的状态切换守卫，并登记仍需后端确认的管理员账号 API 域。
- 改动文件：
  - `other-admin/admin-vue3/src/views/authority/adminPerson/index.vue`
  - `other-admin/admin-vue3/tests/e2e/permission-matrix.spec.ts`
  - `doc/PERMISSION-CONTRACT.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - `adminPerson` 状态开关新增 `/admin/user/update` 权限判断，无权限时只显示状态标签。
  - 对照现役 Vue2 页面后，所有可见且有明确来源的 canonical 按钮码均已接入；`/admin/executorToEquipment/create` 仅出现在注释按钮中，登记为 P2 遗留契约，不直接恢复。
  - 发现 `adminPerson` 使用普通用户 API，而仓库另有 `adminUser` API；Vue2 同样存在差异，单独作为 P1 后端契约阻塞，不凭空替换。
- 验证命令与结果：
  - 权限矩阵新增“后台用户无更新权限时状态开关不可操作”用例。
  - 完整 `pnpm exec playwright test` 在系统 Chrome 下当前 42 项通过。
  - 定向 ESLint 和 Prettier 检查通过；完整单测 12 个文件、45 项通过。
- 未完成/阻塞：
  - 管理员账号 API/权限域需后端确认后才能做真实联调。
- 下一步：处理 GroupTags 编辑和单条删除 E2E，再按模块推进 P1 业务 Mock。

## [2026-09-25] P1-08 / H5 群组标签迁移

- 目标：移除 `GroupTags` 占位页，恢复 Vue2 已存在的标签分页、详情、新增、编辑、单删和批删能力。
- 改动文件：
  - `other-admin/admin-vue3/src/api/h5/groupTags.ts`
  - `other-admin/admin-vue3/src/router/modules/h5.ts`
  - `other-admin/admin-vue3/src/views/h5/groupTags/index.vue`
  - `other-admin/admin-vue3/src/views/h5/groupTags/GroupTagsForm.vue`
  - `other-admin/admin-vue3/tests/unit/group-tags.test.ts`
  - `other-admin/admin-vue3/tests/e2e/group-tags.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
- 完成内容：
  - 按 `src/api/h5/groupTags.js` 恢复 `/collaboration/v1/tags/page`、`/tags/{id}`、`/tags` 和 `/tags/delete/list`，删除路径统一编码。
  - 在 `router/modules/h5.ts` 注册 `/h5/GroupTags`，使动态菜单权限过滤后的真实页面可直接访问。
  - 页面提供搜索、重置、分页、多选、单条删除、批量删除、新增/编辑弹窗、图标选择和颜色编辑。
  - 明确 `GroupTags` 与 `/collaboration/quick` 的标签树业务使用不同接口，未将两套契约合并。
- 验证命令与结果：
  - `pnpm exec vitest run tests/unit/group-tags.test.ts --reporter=dot`：2 项通过。
  - `pnpm exec playwright test`：包含 `tests/e2e/group-tags.spec.ts` 在内共 42 项通过。
  - `pnpm exec vue-tsc --noEmit`：通过。
  - 定向 ESLint：0 error、0 warning；本次文件 Prettier 检查通过。
- 未完成/阻塞：
  - 编辑、单条删除、完整按钮权限和真实后端联调尚未执行。
  - Vue2 没有为该页面提供明确的按钮权限码，暂不猜测新增/编辑/删除/批删权限键。
- 下一步：补齐 GroupTags 编辑、单删和失败恢复边界；继续按权限契约逐页补齐有证据的按钮码。

## [2026-09-26] DOC-02 / 登录与图标动效规划

- 目标：把新增登录页和 LxIcon 动效设计资料纳入总计划，明确先后顺序和验收标准。
- 参考资料：
  - `doc/登录1/`、`doc/登录2/`：两套登录页设计参考，尚未选定最终方案。
  - `doc/LxIcon P0 核心矢量线性图标集规范标本 (含Hover微交互动效版)/`
  - `doc/LxIcon P1 级矢量线性图标集规范标本 (含Hover微动效交互版)/`
  - `doc/LxIcon 29枚矢量线性图标集规范标本 (含Hover灵动微交互)/`
- 改动文件：
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - 新增 UI-05 登录页视觉对照与实现任务，要求保留 OAuth、改密、License 提示、校验和键盘/窄屏行为。
  - 新增 UI-06 归并 P0/P1/29 枚图标命名及覆盖关系、UI-07 P0 实现、UI-08 P1/29 扩展任务。
  - 将 `prefers-reduced-motion`、focus/触屏验收和本地 SVG/接口值兼容纳入图标完成标准。
- 验证命令与结果：只读核对设计目录和当前登录页/图标组件入口；未实施登录视觉改版或 LxIcon 动效，不将其标记为完成。
- 未完成/阻塞：UI-05 至 UI-08 均待开始；三套图标清单之间的重叠尚未归并。
- 下一步：先完成 GroupTags 自动化编辑/单删边界，再进入已排期 UI 设计实现。

## [2026-09-26] DEV-01 / 隔离式本地 Mock 预览

- 目标：提供可直接查看 Vue3 群组标签页的本地预览，所有 API 请求不触达真实后端。
- 改动文件：
  - `other-admin/admin-vue3/package.json`
  - `other-admin/admin-vue3/.env.mock-preview`
  - `other-admin/admin-vue3/vite.config.mts`
  - `other-admin/admin-vue3/mock/preview-server.ts`
  - `other-admin/admin-vue3/src/views/h5/groupTags/iconMap.ts`
  - `other-admin/admin-vue3/src/views/h5/groupTags/index.vue`
  - `other-admin/admin-vue3/src/views/h5/groupTags/GroupTagsForm.vue`
  - `other-admin/admin-vue3/tests/e2e/group-tags.spec.ts`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - 新增 `pnpm dev:mock`，使用独立 `mock-preview` 模式和 30847 端口，不设置 API proxy。群组标签、登录、菜单、权限和 Navbar 绑定查询使用本地 Mock；写操作只改当前 Vite 进程内存，重启后恢复样例数据。
  - 未配置的 `/linkx/admin/**` 请求返回 HTTP 501；验证登录 API 返回本地令牌，未知 API 返回 501。
  - 预览业务 URL 自动建立本地会话，`/login` 会清除该会话并显示登录表单；Mock 登录可实际提交。
  - 旧 Font Awesome 类名映射为 Element Plus SVG，不改变存储和 API 传输值；为旧图标渲染增加 E2E 断言。
- 验证命令与结果：
  - `pnpm exec vue-tsc --noEmit`：通过。
  - 定向 ESLint：通过，0 error、0 warning；相关文件 Prettier `--check` 通过。
  - `pnpm exec playwright test`：系统 Chrome 下 43 项通过。
  - 本地浏览器验证：登录表单提交成功；GroupTags 列表、5 个图标、增/改/单删通过，无页面 JS 错误或 Mock 错误提示；390px 登录页无横向溢出。
- 未完成/阻塞：
  - 本地 Mock 不代表真实接口联调；未配置页面 API 会明确报 501。
  - GroupTags 按钮权限码仍等待可信契约来源。
- 下一步：按权限契约继续确认 GroupTags 操作权限，并推进下一个未闭环模块。

## [2026-09-26] P1-08b / GroupTags 编辑与单删 E2E

- 目标：把本地预览手工验证过的编辑和单条删除行为固化为 Playwright Mock 回归。
- 改动文件：
  - `other-admin/admin-vue3/tests/e2e/group-tags.spec.ts`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - 新增编辑与单删浏览器用例，验证详情 GET、标签 ID 对应的 PUT/DELETE、更新后列表回显和删除后空列表。
  - 在迁移台账中记录自动化证据，并将当前 E2E 基线更新为 44 项。
- 验证命令与结果：
  - `pnpm exec playwright test tests/e2e/group-tags.spec.ts`：3 项通过。
  - `pnpm exec playwright test`：44 项通过。
  - `pnpm exec vue-tsc --noEmit`：通过；定向 ESLint、Prettier 检查通过。
- 未完成/阻塞：GroupTags 按钮权限码缺少可信来源；取消/重复提交边界及真实后端联调未完成。
- 下一步：根据权限契约确认按钮操作可见性，再推进迁移台账中的下一个未闭环模块。

## [2026-09-26] DEV-02 / 全现役菜单与首屏 Mock 数据

- 目标：让本地预览显示全部现役 Vue3 菜单，并让 31 个业务入口首屏都有可核对的样例数据。
- 改动文件：
  - `other-admin/admin-vue3/mock/preview-data.ts`
  - `other-admin/admin-vue3/mock/preview-server.ts`
  - `other-admin/admin-vue3/src/layout/index.vue`
  - `other-admin/admin-vue3/src/layout/components/Sidebar/index.vue`
  - `other-admin/admin-vue3/src/layout/components/Navbar.vue`
  - `other-admin/admin-vue3/src/components/AuthImg/index.vue`
  - `other-admin/admin-vue3/playwright.config.ts`
  - `other-admin/admin-vue3/playwright.preview.config.ts`
  - `other-admin/admin-vue3/tests/e2e/preview.spec.ts`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MOCK-SCENARIOS.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - 核对现役路由与 Mock 菜单均为 10 个一级、31 个二级入口；Mock 模式在桌面和窄桌面展开全部子菜单，移动端仍使用原有抽屉行为。
  - 补齐 31 个入口的首屏样例文案断言和轮播图 SVG Mock 响应；AuthImg 以响应 MIME 类型创建 Blob，确保图片可解码。
  - 修复 390px 以下顶栏拥挤：隐藏非关键提示和长用户名，为面包屑保留弹性空间；320px/390px 检查顶栏不重叠且文档无横向溢出。
  - 默认 Playwright 配置排除预览专用测试，避免 Mock 预览请求进入普通开发服务器的真实后端代理；预览配置独立运行该测试。
- 验证命令与结果：
  - `pnpm test:e2e:preview`：1 项通过，覆盖 31 个入口、全部样例文案、未知 API 和 2 张轮播图解码。
  - `pnpm test:e2e`：45 项通过，未出现后端代理请求。
  - `pnpm test:unit -- --reporter=dot`：12 个文件、45 项通过。
  - `pnpm exec vue-tsc --noEmit`、本次文件定向 ESLint、Prettier 检查：通过。
  - 响应式修复后 `pnpm exec playwright test tests/e2e/ui-audit.spec.ts`：4 项通过；390px 和 320px 浏览器截图已检查。
  - `pnpm build`：通过；仍有既有 Less 导出提示、分包循环和大 chunk 警告。
- 未完成/阻塞：这里只验收首屏样例展示，不代表 31 个入口的全部业务操作、上传下载、权限状态或真实后端联调已完成；`adminPerson` API 域仍待后端契约确认。
- 下一步：继续处理计划中的 UI-05 登录页设计对照与实现，并按步骤补齐 UI-06 至 UI-08 图标规范和动效任务。

## [2026-09-26] DEV-03 / 北向菜单与样例数据补齐

- 目标：修复 Mock 预览遗漏 Vue2 现役“北向接入管理”菜单的问题，并让入口数据和 E2E 断言覆盖实际菜单数量。
- 改动文件：`doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`、`doc/PERMISSION-CONTRACT.md`、`other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`、`other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`、`other-admin/admin-vue3/docs/MOCK-SCENARIOS.md`。
- 完成内容：
  - 对照 Vue2 `thirdInterface.js` 和 Vue3 `thirdParty.ts`，确认 `/thirdParty/thirdParty` 属于现役入口；此前页面实现和预览菜单已有，但项目台账仍按 31 个入口记录。
  - 当前 Mock 提供 10 个一级菜单、32 个二级入口及逐入口首屏样例；北向页面使用 `systemName` 和既有 client API，支持筛选、详情和增改删。
  - 同步总计划、项目地图、权限契约、迁移矩阵、Backlog 和 Mock 场景说明，明确北向按钮权限与真实后端联调仍待确认。
- 验证命令与结果：`pnpm test:e2e:preview`：2 项通过；遍历 32 个入口并验证北向筛选及增改删，未知 API 保持隔离返回。
- 未完成/阻塞：其余业务页深层交互及全权限组合未覆盖；北向按钮权限码和真实后端字段/行为仍需可信契约及联调环境。
- 下一步：按计划推进 UI-05 登录页设计落地，并记录实际视觉、键盘、窄屏及功能验收。

## [2026-09-26] DEV-04 / 归档群组旧菜单路径兼容

- 目标：恢复 Vue2 菜单使用的 `/policeExtend/ArchivedTable` 层级和 URL，并保留 Vue3 已使用的 H5 地址兼容。
- 改动文件：`other-admin/admin-vue3/src/router/index.ts`、`src/router/modules/h5.ts`、`src/router/modules/policeExtend.ts`、`mock/preview-menu.ts`、`tests/e2e/preview.spec.ts`、`doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`、`doc/PERMISSION-CONTRACT.md`、`other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`、`other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`。
- 完成内容：归档页现在由 Vue2 同源的警信扩展父菜单进入；`/h5/ArchivedTable` 隐藏重定向到规范路径。License 与菜单权限过滤继续作用于规范路由。
- 验证命令与结果：`pnpm test:e2e:preview`：2 项通过；覆盖全部 32 个入口、首屏样例以及旧 H5 地址重定向。
- 未完成/阻塞：归档页下载、批删、同步配置和业务按钮权限仍未完成；真实 License/菜单后端未联调。
- 下一步：推进 UI-05 登录页设计实现；P0-03 的受限账号、空菜单及 License 矩阵仍需单独验收。

## [2026-09-26] UI-05 / 登录页设计对照与实现

- 目标：把 `doc/登录1/` 与 `doc/登录2/` 的登录视觉落到 Vue3 页面，同时保留 OAuth、改密、License 和键盘/窄屏行为。
- 改动文件：`other-admin/admin-vue3/src/views/login/index.vue`、`tests/e2e/ui-audit.spec.ts`、`src/styles/login.less`、`doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`。
- 完成内容：整合为居中单列认证页，保留 OAuth2 密码流程、密码过期/修改和 License 提示；实现“记住账号”显式勾选后仅在登录成功时保存账号名，取消时清除，不保存密码或令牌；支持减少动效并保留窄屏和键盘操作。
- 验证命令与结果：`pnpm test:e2e`：52 项通过，覆盖登录、改密重复提交锁定、License 提示、记住账号回填/清除及 390px/320px 布局；`pnpm lint`、`pnpm exec vue-tsc --noEmit` 和涉及文件 Prettier 检查通过。
- 未完成/阻塞：真实 License、登录和心跳接口联调未执行；记住账号仅用于本机账号名回填，不保存凭证。
- 下一步：推进 UI-06 图标规范归并，再依序实现 UI-07 核心动效和 UI-08 扩展图标。

## [2026-09-26] DEV-05 / 全菜单可见性与首屏数据回归

- 目标：解决长菜单在普通视口下后半段不明显的问题，并确认所有现役入口有可见的 Mock 首屏数据。
- 改动文件：`other-admin/admin-vue3/src/layout/components/Sidebar/index.vue`、`src/styles/sidebar.less`、`tests/e2e/preview.spec.ts`、`docs/MOCK-SCENARIOS.md`、`docs/MIGRATION-MATRIX.md`、`docs/MIGRATION-BACKLOG.md`、`doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`。
- 完成内容：侧栏增加常驻菜单检索，按父级/页面标题过滤，仅从当前权限菜单构建结果；结果可键盘聚焦并按 Enter 导航。预览 E2E 逐项比对 10 个分组、32 个页面名称，遍历全部 32 页验证对应样例内容并检查未知 Mock API；北向业务操作继续使用内存 Mock。
- 验证命令与结果：`pnpm test:e2e:preview`：2 项通过；`pnpm test:e2e`：52 项通过；`pnpm test:unit -- --reporter=dot`：12 个文件、46 项通过；`pnpm lint`、`pnpm build` 和变更文件 Prettier 检查通过。构建仍有已登记的 Less 导出、分包循环和大 chunk 警告。
- 未完成/阻塞：此项验收全菜单导航与首屏样例，不等于全部页面深层写操作均已 Mock 或真实后端数据联调通过。
- 下一步：继续补齐 P0-03 权限访问矩阵，并逐模块推进 P1 业务 Mock/E2E。

## [2026-09-26] P0-03b / 页面访问权限浏览器矩阵

- 目标：验证菜单过滤结果和直接地址访问一致，覆盖空菜单、停用菜单、License、全局开关及生产隐藏规则。
- 改动文件：`other-admin/admin-vue3/tests/e2e/permission-matrix.spec.ts`、`tests/unit/auth-routes.test.ts`、`doc/PERMISSION-CONTRACT.md`、`doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`、`other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`、`other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`。
- 完成内容：新增空受限菜单不能直达、群组协同 License 失效时归档/位置菜单及页面受限、排班开关关闭时排班信息隐藏的浏览器用例；单测明确生产环境隐藏 6 个权限页。当前代码的 `permissions.type=0` 超管例外仍保留，停用菜单和 License/全局过滤继续优先执行。
- 验证命令与结果：`tests/e2e/permission-matrix.spec.ts`：7 项通过；`tests/unit/auth-routes.test.ts`：9 项通过；完整默认 E2E 52 项、单测 46 项通过。
- 未完成/阻塞：真实后端的管理员类型、License 字段真假语义、菜单列表和权限同步仍需可信接口环境；P0-03 因真实联调未执行保持进行中。
- 下一步：确认真实后端菜单/License 契约后完成联调；继续 UI-06 图标规范归并及剩余 P0/P1 任务。

## [2026-09-26] DEV-06 / 首页菜单与全菜单目录补齐

- 目标：补齐静态首页菜单，并让 Mock 预览可以一次浏览完整菜单目录和全部页面样例。
- 改动文件：
  - `other-admin/admin-vue3/src/layout/components/Sidebar/index.vue`
  - `other-admin/admin-vue3/src/styles/sidebar.less`
  - `other-admin/admin-vue3/mock/preview-server.ts`
  - `other-admin/admin-vue3/tests/e2e/preview.spec.ts`
  - `other-admin/admin-vue3/docs/MOCK-SCENARIOS.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `doc/PERMISSION-CONTRACT.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
- 完成内容：
  - `/dashboard` 是静态登录后路由，之前没有从动态权限菜单树进入侧栏；现已补入首页入口和包含全部当前授权菜单的目录。目录支持筛选、键盘导航和路由直达，不展示 `meta.hidden` 项。
  - 全量预览为首页加 10 组、32 个动态子菜单，共 33 个页面；首页样例检查欢迎语和警务协同、MSIP、警信三项版本 Mock。
  - 菜单/样例数量和首页固定路由例外已同步至权限契约、迁移矩阵、Backlog、项目地图和本计划。
- 验证命令与结果：
  - `pnpm test:e2e:preview`：2 项通过，覆盖 33 页首屏、完整目录与筛选跳转、未知 API、北向筛选及增改删。
  - `pnpm test:e2e`：52 项通过；`pnpm test:unit -- --reporter=dot`：12 个文件、46 项通过。
  - `pnpm exec vue-tsc --noEmit`、改动文件 ESLint、改动文件及文档 Prettier 检查、`pnpm build`：通过。
  - 浏览器检查确认首页入口和 33 项目录入口可见。构建仍有既有 Less 导出、分包循环和大 chunk 警告。
- 未完成/阻塞：Mock 样例只代表预览数据；其余业务页面的深层写操作、真实后端数据与权限联调仍未完成。
- 下一步：继续 UI-06 图标清单与别名归并，然后按 UI-07、UI-08 完成图标动效、Demo 和验收。

## [2026-09-26] UI-06 / P0、P1 与 29 枚图标清单归并

- 目标：将三份图标设计清单映射到 lx-ui 现有图形键，保持旧调用名称可继续使用。
- 改动文件：
  - `linkx-fe/src/components/LxIcon/icons.ts`
  - `linkx-fe/src/components/LxIcon/index.vue`
  - `linkx-fe/src/index.ts`
  - `linkx-fe/docs/components/lxicons.md`
  - `linkx-fe/docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/tests/unit/lx-icon.test.ts`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
- 完成内容：
  - P0 清单 13 个名称全部命中；P1 清单 27 个名称中 `date` 映射到既有 `calendar`；29 枚清单中 `eye-on` 映射到既有 `eye`。其余名称与现有 94 个图形键一致。
  - 新增有类型约束的别名表和统一解析函数，`LxIconName` 现在覆盖 94 个标准图形键和 2 个别名；渲染元素保留调用方传入的名称用于诊断和动效定位。
  - 图标总览显示兼容别名，并说明别名复用的图形；交付核查、项目地图和迁移台账同步更新。
- 验证命令与结果：`pnpm exec vitest run tests/unit/lx-icon.test.ts --reporter=dot`：4 项通过；Vue3 `pnpm exec vue-tsc --noEmit` 与 lx-ui `pnpm exec vue-tsc --noEmit -p ../../linkx-fe/tsconfig.json` 均通过；本次源文件及文档 Prettier 已运行。
- 未完成/阻塞：Hover/focus/触屏动效、减少动效、浏览器验收和 Demo 交互属于 UI-07/08，尚未完成。组件库源文件不在 Vue3 ESLint base path 内，本步骤没有把它们记为通过 ESLint。
- 下一步：按 P0 参考为 13 个图标实现鼠标、键盘焦点和触屏按压微动效，完成 Demo、浏览器检查与减少动效验收。

## [2026-09-26] UI-07 / LxIcon P0 核心动效

- 目标：按 P0 参考实现 13 个核心图标的微动效，并覆盖键盘焦点和减少动效偏好。
- 改动文件：
  - `linkx-fe/src/components/LxIcon/icons.ts`
  - `linkx-fe/src/components/LxIcon/index.vue`
  - `linkx-fe/src/index.ts`
  - `linkx-fe/docs/components/lxicons.md`
  - `linkx-fe/docs/DELIVERY-CHECK.md`
  - `linkx-fe/docs/ROADMAP.md`
  - `other-admin/admin-vue3/package.json`
  - `other-admin/admin-vue3/playwright.icons.config.ts`
  - `other-admin/admin-vue3/tests/unit/lx-icon.test.ts`
  - `other-admin/admin-vue3/tests/e2e/lx-icon-docs.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
- 完成内容：
  - P0 删除、编辑、加减、刷新、撤销、上传下载、查看、加载、更多、文件夹和警告等 13 个图标按参考实现语义动效。图标跟随按钮/链接/role=button 的 hover、键盘 `focus-visible` 和按压状态，不会自行进入 Tab 顺序。
  - `prefers-reduced-motion: reduce` 时停止图标动画及位移变换；总览 Demo 为每个图标提供可访问名称、明确焦点样式、固定最小尺寸及筛选输入标签。
  - 新增独立 Playwright 配置与 `test:e2e:icons`，避免把文档站加入普通业务 E2E 的服务依赖。
- 验证命令与结果：
  - `pnpm exec vitest run tests/unit/lx-icon.test.ts --reporter=dot`：5 项通过。
  - `pnpm test:e2e:icons`：1 项通过，浏览器确认 96 个名称、P0 鼠标悬浮和键盘焦点动画、减少动效和 320px 无横向溢出。
  - Vue3 与 lx-ui `vue-tsc --noEmit`、定向 ESLint、变更文件 Prettier 检查、`pnpm build`、`pnpm build:docs`：通过；文档构建保留既有大 chunk 提示。
- 未完成/阻塞：P1 专属动效与 29 枚清单的触屏验收属于 UI-08；当前截图/浏览器证据只覆盖本步骤 P0 Demo，不代表所有宿主业务按钮都逐页视觉验收。
- 下一步：将 P1 和 29 枚清单按参考映射到既有图形名，补齐语义动效、别名焦点触发、触屏按压和整套文档浏览器验收。

## [2026-09-26] UI-08 / LxIcon P1 与 29 枚扩展动效

- 目标：完成扩展图标清单映射、参考动效、文档展示及桌面/触屏验收。
- 改动文件：
  - linkx-fe/src/components/LxIcon/index.vue
  - linkx-fe/docs/components/lxicons.md
  - linkx-fe/docs/DELIVERY-CHECK.md
  - linkx-fe/docs/ROADMAP.md
  - other-admin/admin-vue3/playwright.icons.config.ts
  - other-admin/admin-vue3/tests/unit/lx-icon.test.ts
  - other-admin/admin-vue3/tests/e2e/lx-icon-docs.spec.ts
  - other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md
  - doc/PROJECT-DELIVERY-PLAN.md
  - doc/PROJECT-MAP.md
  - doc/PROJECT-HANDOFF.md
- 完成内容：
  - P1 27 个名称与 29 枚扩展清单全部映射；date 和 eye-on 分别复用 calendar 与 eye，总计 69 个去重动效名称。
  - P1 补齐参考语义动效；29 枚扩展采用 scale(1.18) 与蓝色阴影。别名以标准图形的动效身份渲染，减少动效偏好会清除动画和变换。
  - 文档列出三份设计清单的完整名称，图标总览保留 96 个可用名称；Playwright 增加 Pixel 7 触屏项目。
- 验证命令与结果：
  - pnpm exec vitest run tests/unit/lx-icon.test.ts --reporter=dot：5 项通过。
  - pnpm test:e2e:icons：桌面 Chrome 与 Pixel 7 各 1 项通过，覆盖名称总览、清单计数、悬浮、键盘、触屏反馈、复制代码、减少动效和 320px 无溢出。
  - Vue3 pnpm exec vue-tsc --noEmit、lx-ui pnpm typecheck、Vue3 定向 ESLint、涉及文件 Prettier 检查、lx-ui pnpm build、pnpm build:docs：通过；文档构建保留既有大 chunk 提示。
  - lx-ui 没有独立 ESLint 配置；尝试将库内 SFC 交给宿主 ESLint 时被配置忽略，因此不记录为库 ESLint 通过。组件文件已由类型检查、Prettier 和构建验证。
- 未完成/阻塞：P1/P2 其他组件接入、上传/远程选择失败重试和真实业务页面逐项验收仍属于其他 UI 任务；P0 权限真实后端契约也仍待确认。
- 下一步：按总计划继续 P1-02 权限中心的 Vue2 源码对照和可验证缺口实现；对缺少后端契约的部分保留阻塞记录。

## [2026-09-26] P1-02 / 权限树失败保护与保存门禁

- 目标：补齐角色菜单树和部门数据权限树加载失败的可见反馈、恢复入口及提交保护。
- 改动文件：
  - `other-admin/admin-vue3/src/views/authority/auth/components/EditRole.vue`
  - `other-admin/admin-vue3/src/views/authority/components/DataPermissionTree.vue`
  - `other-admin/admin-vue3/tests/e2e/permission-matrix.spec.ts`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - 三套角色菜单树任一失败时显示错误和重试；未全部成功前禁用保存。
  - 部门树校验成功响应码；初始部门树失败显示重试，懒加载失败保留未加载节点并在节点内提供重试。
  - 部门树状态传给角色弹窗；初次加载未完成或任一部门节点失败时禁止提交，重试成功后恢复保存。
  - 懒加载重试完成后重新展开节点；初始树重试成功后恢复已回显的权限选中项。
- 验证命令与结果：
  - `pnpm exec playwright test tests/e2e/permission-matrix.spec.ts --reporter=line`：10 项通过，其中包含部门树初始失败和懒加载子节点失败恢复。
  - `pnpm exec vue-tsc --noEmit`、定向 ESLint、涉及文件 `pnpm exec prettier --check ...`：通过。
  - `pnpm build`：通过；输出保留已有 Less 导出、循环分包、依赖注释和大 chunk 警告。
  - Playwright 请求全部由 Mock 拦截；没有执行真实权限/部门服务联调。
- 未完成/阻塞：角色设置用户仍缺少可信已有成员读取接口；人员绑定、管理员例外、直接地址的完整权限中心矩阵和真实后端联调尚未验收。
- 下一步：继续按 Vue2 对照逐项核验角色/人员绑定与管理员特殊角色；缺少可信接口时保留阻塞，不臆造字段或权限码。

## [2026-09-26] P1-02 / 管理员账号、人员权限和身份例外验证

- 目标：将部门树失败门禁覆盖到所有权限中心消费者，并补齐 Vue2 有据的人员按钮、特殊角色和管理员账号直达行为验证。
- 改动文件：
  - `other-admin/admin-vue3/src/views/authority/userManage/components/EditUser.vue`
  - `other-admin/admin-vue3/tests/e2e/permission-matrix.spec.ts`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `doc/PERMISSION-CONTRACT.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - 管理员用户编辑弹窗复用部门树加载状态；部门树失败或未完成时禁用并在处理函数中拦截提交，重试后恢复。
  - 角色 ID 2/6 的 Vue2 规则获得 E2E 证据：保留编辑，隐藏删除和启停；普通角色仍显示对应操作。
  - 普通人员操作矩阵验证 `/admin/executor/*`、`/admin/user/*`、`/admin/trUserRole/createMany` 权限码，以及仅通用管理员可重置密码/启停的条件。
  - `UserAuthFilter` 直接地址矩阵验证：管理员 ID 1 可加载管理员账号页；ID 2 即使权限菜单全量也不能进入或触发账号列表 API。
- 验证命令与结果：
  - `pnpm exec playwright test tests/e2e/permission-matrix.spec.ts --reporter=line`：14 项通过，所有后端读写请求均由 Mock 拦截。
  - Vue3 `pnpm exec vue-tsc --noEmit`、涉及文件 ESLint 和 Prettier 检查、`pnpm build`：通过。
  - 构建仍输出已有 Less 导出、循环分包、依赖注释和大 chunk 提示；新增用例后的默认全量 E2E 尚未重跑。
- 未完成/阻塞：Vue2 角色“设置用户”读取/绑定/解绑仍为 TODO/空 Mock；IM 权限和人员绑定完整业务闭环、生产环境真实账号身份/权限契约及真实后端联调尚未完成。
- 下一步：按契约继续核验 IM 权限与人员绑定；接口缺少可信 Vue2/API 来源时维持阻塞，然后推进 P1-03 基础数据导入导出、地图和布局配置失败恢复。

## [2026-09-26] 验证基线 / Playwright 套件范围与全量回归

- 目标：让默认业务 E2E 与 lx-ui 图标文档 E2E 各自使用匹配的服务配置，并重跑权限中心修改后的完整业务套件。
- 改动文件：
  - `other-admin/admin-vue3/playwright.config.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：默认配置排除 `lx-icon-docs.spec.ts`，由 `playwright.icons.config.ts` 独立运行图标文档项目，避免图标文档用例访问业务 Vite 服务并发起真实代理请求。
- 验证命令与结果：`pnpm exec playwright test --reporter=line`：59/59 通过；此前错误配置下观察到的 1 项图标文档失败是套件范围问题，修正后默认套件不再包含该用例。图标独立套件已在 UI-08 记录为桌面 Chrome 和 Pixel 7 各 1 项通过。
- 未完成/阻塞：全量 E2E 仍是路由、权限与既有交互覆盖，不代表每个业务模块已完成 Mock，也不代表真实后端联调。
- 下一步：补 IM 角色绑定弹窗的人员分页查询、权限门禁、批量绑定请求体和失败恢复 Mock E2E；通用后台角色设置用户成员回显接口仍按 Vue2 TODO 单独阻塞。

## [2026-09-26] P1-02 / IM 角色批量绑定 Mock 验收

- 目标：基于 Vue2 已存在的 IM 角色绑定 API 契约补齐浏览器权限与交互验证。
- 改动文件：
  - `other-admin/admin-vue3/tests/e2e/authority-bind-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：无 `/admin/trUserRole/createMany` 权限时隐藏绑定按钮；授权后按人员姓名筛选，提交 `PUT /auth/v1/role/{roleId}/user` 和 `userIds` 数组；服务失败时保持弹窗及选择，允许重试。测试只访问 Playwright Mock。
- 验证命令与结果：专项 `pnpm exec playwright test tests/e2e/authority-bind-workflow.spec.ts --reporter=line`：3/3 通过；默认完整 `pnpm exec playwright test --reporter=line`：62/62 通过；`pnpm exec vue-tsc --noEmit`、定向 ESLint、变更文件 Prettier 检查通过。
- 未完成/阻塞：IM 权限配置页面和 IM 人员“设置角色”保存/回显仍需逐项验收；后台角色“设置用户”的 Vue2 读取接口仍是 TODO/空 Mock，无可信契约，不得提交可能覆盖全部成员的用户列表。
- 下一步：推进 P1-03，从全局参数配置加载失败提示与重试开始，随后覆盖地图文件、地理编码/区划和布局配置的读写及导出。

## [2026-09-26] P1-03 / 全局参数列表失败恢复

- 目标：让基础数据全局参数列表在接口或业务响应失败时保留现有数据并提供可操作的恢复入口。
- 改动文件：
  - `other-admin/admin-vue3/src/views/baseData/globals/index.vue`
  - `other-admin/admin-vue3/tests/e2e/base-data-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：全局参数查询现在验证 `code === 0` 和数组数据；失败时不清空已有列表，页面展示错误提示和重试按钮；成功后关闭错误提示。Mock E2E 特意放过启动阶段第一次全局参数读取，只让页面列表读取失败，随后验证重试恢复。
- 验证命令与结果：专项 `pnpm exec playwright test tests/e2e/base-data-workflow.spec.ts --reporter=line`：1 项通过；默认全量 `pnpm exec playwright test --reporter=line`：63/63 通过；`pnpm exec vue-tsc --noEmit`、变更文件 ESLint 和 Prettier 检查通过。
- 未完成/阻塞：全局参数 CRUD、地图底图/区划文件及布局子页读写、导出尚未完成 Mock；真实后端联调未执行。
- 下一步：继续 P1-03，优先为公共布局配置加载失败加重试和提交门禁，再覆盖地图上传、初始化、地理编码和区划下载。

## [2026-09-26] P1-03 / 公共布局配置读取失败保护

- 目标：避免 `/api/system/config` 读取失败时生成默认配置并开放保存，提供重试并在读取成功后恢复真实表单。
- 改动文件：
  - `other-admin/admin-vue3/src/views/baseData/layoutConfig/components/CommonConfig.vue`
  - `other-admin/admin-vue3/tests/e2e/base-data-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：配置加载要求成功码与数组数据；网络或业务失败显示重试，禁用字段与保存按钮，阻止单项或协同群组默认值写回；重试成功后回显服务器的 `SYSTEM_NAME` 等设置。
- 验证命令与结果：`pnpm exec playwright test tests/e2e/base-data-workflow.spec.ts --reporter=line`：2/2 通过；默认 `pnpm exec playwright test --reporter=line`：64/64 通过；`pnpm exec vue-tsc --noEmit`、相关文件 ESLint、Prettier 检查及 `pnpm build` 通过。构建保留已登记的 Less 导出、循环分包、依赖注释和大 chunk 警告。
- 未完成/阻塞：地图配置和文件导入导出、布局 App H5/PC/统计子页操作、真实后端联调仍未完成。
- 下一步：继续 P1-03，补地图底图上传/初始化和地理编码/区划导入导出 Mock，之后逐项覆盖布局其余子页。

## [2026-09-26] P1-03 / 地图底图上传与初始化 Mock 验收

- 目标：依据 Vue2 已有地图 API 契约验证 `.mbtiles` 扩展名门禁，以及上传成功后的初始化和列表刷新顺序。
- 改动文件：
  - `other-admin/admin-vue3/tests/e2e/base-data-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MOCK-SCENARIOS.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：非 `.mbtiles` 文件显示错误且不调用上传接口；合法文件以 multipart POST 调用 `/api/map/uploadBaseMap`，随后调用 `/api/map/initBaseMap`，成功后刷新 `/api/map/selectPageBaseMap`。全部请求由 Playwright Mock 截获。
- 验证命令与结果：`pnpm exec playwright test tests/e2e/base-data-workflow.spec.ts --reporter=line --grep "地图底图"`：2/2 通过；默认完整 `pnpm exec playwright test --reporter=line`：66/66 通过；`pnpm exec vue-tsc --noEmit`、定向 ESLint 和 Prettier 检查通过。
- 回归稳定性复验：基础数据专项扩展至 7/7 后，默认完整套件 69/69 通过；此前 GroupTags 与 `/baseData/thirdParty` 两项首屏超时未在本轮全量套件中复现。
- 本地预览：`pnpm dev:mock` 已启动，`http://127.0.0.1:30847/h5/GroupTags` 返回 HTTP 200；浏览器确认侧栏 10 组菜单、“全部菜单”33 项和 5 条群组标签样例。Mock 模式不启用真实后端代理。
- 未完成/阻塞：地图上传大小上限和接口失败恢复、底图删除、地理编码与行政区划导入导出、全局参数 CRUD、布局其他子页及真实后端联调仍待验收。
- 下一步：继续 P1-03，覆盖底图上传/初始化失败与删除，再验证地理编码和行政区划文件流程；之后完成全局参数 CRUD 与布局子页读写。真实后端契约或环境不可得的部分继续单独标记阻塞。

## [2026-09-26] P1-03 / 地图底图失败恢复与删除 Mock 验收

- 目标：补齐底图上传失败、初始化失败和删除后的浏览器可观察行为。
- 改动文件：
  - `other-admin/admin-vue3/tests/e2e/base-data-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MOCK-SCENARIOS.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：上传接口失败时不调用初始化；初始化失败时不刷新底图列表；删除使用 Vue2 既有 `POST /api/map/deleteBaseMap?id=...` 契约，成功后刷新并移除对应行。以上读写均由 Playwright Mock 拦截。
- 验证命令与结果：`pnpm exec playwright test tests/e2e/base-data-workflow.spec.ts --reporter=line`：7/7；默认 `pnpm exec playwright test --reporter=line`：69/69；`pnpm exec vue-tsc --noEmit`、定向 ESLint、Prettier 和 `git diff --check` 通过。
- 未完成/阻塞：文件大小 500 MB 边界、地理编码读写、行政区划导入导出、全局参数 CRUD、布局其余子页及真实后端联调仍待完成。
- 下一步：继续 P1-03，验证地理编码与行政区划文件流程，再逐项覆盖全局参数 CRUD 和布局子页读写；真实后端契约或环境不可得的内容保持阻塞并记录依据。

## [2026-09-26] P1-03 / 行政区划导出与文件大小边界

- 目标：按 Vue2 契约完成行政区划导出、验证 500 MB 上传边界，并让行政区划读取失败可见且可重试。
- 改动文件：
  - `other-admin/admin-vue3/src/api/baseData/mapConfig.ts`
  - `other-admin/admin-vue3/src/views/baseData/mapConfig/index.vue`
  - `other-admin/admin-vue3/tests/e2e/base-data-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MOCK-SCENARIOS.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：旧上传组件以超过 500 MB 才拒绝，Vue3 两类上传现允许精确 500 MB；行政区划导出恢复 `POST /api/map/updateDivision?nodeId=0` 标准 JSON 响应并生成 `.geojson` 下载；区域读取失败展示错误和重试按钮。新增 5 项 E2E 覆盖边界、读取恢复、导出文件内容和失败提示。
- 验证命令与结果：`pnpm exec playwright test tests/e2e/base-data-workflow.spec.ts --reporter=line`：15/15；`pnpm exec playwright test --reporter=line`：77/77；`pnpm exec vue-tsc --noEmit`、定向 ESLint、Prettier 和 `git diff --check` 通过。全部业务请求由 Playwright Mock 截获。
- 未完成/阻塞：全局参数 CRUD 与权限、地图配置新增编辑、地理编码失败恢复、布局其余子页读写和真实后端联调未完成。
- 下一步：继续 P1-03，优先检查全局参数可用操作与旧版契约，再完成布局子页读写；真实后端契约不可证实的权限和接口继续记录为阻塞。

## [2026-09-26] UI-09 依赖盘点与菜单目录回归

- 目标：确认 Vue3 宿主能否移除自己的 Element Plus 直依赖，列出 lx-ui 可替换项与缺少封装项，并复验全菜单目录导航。
- 改动文件：
  - `other-admin/admin-vue3/src/layout/components/Sidebar/index.vue`
  - `other-admin/admin-vue3/tests/e2e/preview.spec.ts`
  - `other-admin/admin-vue3/docs/ELEMENT-PLUS-LX-UI-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MOCK-SCENARIOS.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：全菜单目录从“点击时关闭并销毁弹窗”改为“路由变化后关闭”，避免导航被同一点击中的弹窗销毁打断；E2E 断言北向路由跳转及弹窗关闭。完成 46 种 Element Plus 标签映射：13 种有 lx-ui 封装候选、8 种只有场景型封装、25 种没有通用 Lx 封装；后者仍可从 lx-ui 全量导出的 Element Plus 使用。确认 103 个 Vue3 Vue/TS 文件直接引用 element-plus，当前宿主和 lx-ui 实际解析版本分别为 2.14.2 与 2.14.6。结论是可移除宿主 package.json 直依赖，但必须先迁移导入、resolver、类型、locale、插件、样式和 Vite 配置；Element Plus 仍作为 lx-ui 传递依赖。
- 验证：`pnpm test:e2e:preview --reporter=line`：2/2；`pnpm exec vitest run --reporter=dot`：13 个文件、51 项；`pnpm exec vue-tsc --noEmit`、定向 ESLint、Prettier 检查通过。默认 Playwright 86/86 与基础数据专项 24/24 为前一实现步骤的结果，本步骤未重跑；生产构建未运行。
- 未完成/阻塞：UI-09 的源码/构建迁移未开始，Vue3 宿主 element-plus 依赖当前仍保留。P1-03 的布局 App H5、PC 和运维统计读写/失败恢复、全局参数 CRUD、真实后端联调仍未完成。
- 下一步：继续 P1-03，对照 Vue2 检查布局 App H5、PC 和运维统计接口及失败状态，补 Mock/E2E 后更新迁移矩阵和交接记录。

## [2026-09-26] CODE-01 / P1-03 布局配置 API Promise 链风格

- 目标：按用户偏好保留 Vue3 宿主业务 API 的 `.then().catch().finally()` 调用方式，并将该约定记录到协作规则。
- 改动文件：
  - `AGENTS.md`
  - `other-admin/admin-vue3/src/views/baseData/layoutConfig/components/AppH5Config.vue`
  - `other-admin/admin-vue3/src/views/baseData/layoutConfig/components/PcConfig.vue`
  - `other-admin/admin-vue3/src/views/baseData/layoutConfig/components/OpsStatistic.vue`
  - `other-admin/admin-vue3/src/views/baseData/layoutConfig/components/CommonConfig.vue`
  - `other-admin/admin-vue3/src/utils/createDialog.ts`
  - `other-admin/admin-vue3/tests/e2e/base-data-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MOCK-SCENARIOS.md`
- 完成内容：四个布局组件中的业务 API 调用改为 `.then().catch().finally()`；接口业务码判断和网络错误提示保留，请求状态在 `finally` 释放；App H5 写操作增加重复提交锁。修复 `createDialog` 可见状态未使用响应式变量、导致新增编辑弹窗不显示的问题。协作规则明确：弹窗、表单校验等非 API 异步流程可继续使用 `async/await`；其他 Vue3 模块的历史 API 调用纳入 CODE-01 分批迁移。
- 验证命令与结果：`pnpm exec playwright test tests/e2e/base-data-workflow.spec.ts --reporter=line`：29/29 通过；`pnpm exec vue-tsc --noEmit`、涉及文件 ESLint、Prettier 检查、`pnpm build` 通过。构建仍有 Less 变量导出、Element Plus 循环分包、动态/静态导入、依赖注释和大 chunk 警告。Playwright 后端请求均由 Mock 拦截；`http://127.0.0.1:30847/h5/GroupTags` 返回 HTTP 200，本地 Mock 预览保持运行。
- 未完成/阻塞：全局参数完整 CRUD 与权限、PC 页签新增/编辑成功工作流、统计导出成功文件流、真实后端联调仍待完成；CODE-01 其他业务模块的历史 API 风格盘点/迁移尚未开始。`CODE-01` 整体保持进行中。
- 下一步：继续按基础数据未完成项补 PC 页签新增/编辑、统计导出成功路径和全局参数权限；之后按业务模块扫描 Vue3 宿主接口调用并分批改为链式处理，每步同步计划、迁移台账和交接记录。

## [2026-09-26] P1-03 / CODE-01 基础数据成功流程与 Promise 链迁移

- 目标：补齐 PC 页签和统计导出的成功路径，并把基础数据全局参数、地图与区划页面中直接 `await API()` 的调用改为 Promise 链。
- 改动文件：
  - `other-admin/admin-vue3/src/api/baseData/layoutConfig.ts`
  - `other-admin/admin-vue3/src/utils/http.ts`
  - `other-admin/admin-vue3/types/axios.d.ts`
  - `other-admin/admin-vue3/src/views/baseData/layoutConfig/components/OpsStatistic.vue`
  - `other-admin/admin-vue3/src/views/baseData/globals/index.vue`
  - `other-admin/admin-vue3/src/views/baseData/globals/components/globalsConfig.vue`
  - `other-admin/admin-vue3/src/views/baseData/mapConfig/index.vue`
  - `other-admin/admin-vue3/src/views/baseData/mapConfig/components/EditMap.vue`
  - `other-admin/admin-vue3/tests/e2e/base-data-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MOCK-SCENARIOS.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：统计导出现在保留 ArrayBuffer 与 HTTP 响应头，处理服务端 JSON 错误并按 `Content-Disposition` 下载文件；新增 PC 页签按 Vue2 配置格式新增/编辑成功回读和 Excel 文件内容检查。基础数据全局参数和地图/地理编码/区划 API 改用 `.then().catch().finally()`，保留请求竞态、业务失败、重试和 loading/提交锁行为；表单校验、确认弹窗等本地异步流程保留 `async/await`。
- 验证命令与结果：基础数据专项 `pnpm exec playwright test tests/e2e/base-data-workflow.spec.ts --reporter=line`：31/31 通过；`pnpm exec vue-tsc --noEmit`、涉及文件定向 ESLint、源码 Prettier `--check`、`pnpm build` 和 `git diff --check` 通过。构建保留 Less 变量导出、分包循环、动态/静态导入和大 chunk 警告；浏览器请求由 Mock 截获，真实后端联调未执行。Markdown Prettier 检查提示计划、地图、迁移矩阵和 backlog 的表格排版差异，本步骤未对整份文档自动重排。
- 当时未完成：App H5 编辑/删除、公共配置成功保存 Mock，及 CODE-01 其他业务模块的历史 API 调用。前两项由本文件 P1-03 最终验收关闭；API 风格迁移由后续 CODE-01 完成记录关闭。
- 真实后端联调未执行；该项仍按 P1-07 跟踪。

## [2026-09-26] CODE-01 / 登录与会话核心 API Promise 链

- 目标：把认证启动、会话清理、License/权限读取和共用同步查询中的宿主 API 调用统一为用户指定的 Promise 链风格。
- 改动文件：
  - `other-admin/admin-vue3/src/store/modules/useUserStore.ts`
  - `other-admin/admin-vue3/src/utils/session.ts`
  - `other-admin/admin-vue3/src/utils/auth.ts`
  - `other-admin/admin-vue3/src/utils/pageLoading.ts`
  - `other-admin/admin-vue3/src/views/login/index.vue`
  - `other-admin/admin-vue3/src/layout/components/Navbar.vue`
  - `other-admin/admin-vue3/tests/unit/auth.test.ts`
  - `other-admin/admin-vue3/tests/unit/page-loading.test.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：登录/登出、菜单初始化、权限/全局参数/License 读取、keepalive、登录密码修改、Navbar 绑定人员查询、部门递归查询和同步进度轮询改用 Promise 链；登出失败清会话、session epoch 竞态保护、5 秒轮询和深度优先结果顺序保留。表单验证、提示弹窗、路由和动态导入仍使用本地异步处理。
- 验证命令与结果：完整 `pnpm exec vitest run --reporter=dot`：14 个文件、54 项通过；`pnpm exec playwright test tests/e2e/ui-audit.spec.ts --reporter=line`：7/7；`pnpm exec vue-tsc --noEmit`、定向 ESLint、Prettier 检查和 `pnpm build` 通过。构建保留已记录的 Less 变量、循环分包、动态/静态导入及 chunk 警告。
- 未完成/阻塞：静态扫描仍在第三方接口、协同、权限中心、排班、H5、位置等模块发现历史 API `await`；真实后端联调未执行。`CODE-01` 保持进行中。
- 下一步：逐模块继续改写剩余页面的直接 API-await 调用，优先覆盖权限中心和第三方接口，并为每个模块补充行为回归与交接记录。

## [2026-09-26] CODE-01 / 权限中心首批 API Promise 链

- 目标：按项目约定收敛权限菜单、角色绑定、后台用户详情/保存和密码策略 API 的直接 `await` 调用。
- 改动文件：
  - `other-admin/admin-vue3/src/views/authority/adminPermission/index.vue`
  - `other-admin/admin-vue3/src/views/authority/imPermission/index.vue`
  - `other-admin/admin-vue3/src/views/authority/adminRole/index.vue`
  - `other-admin/admin-vue3/src/views/authority/imRole/components/BindUser.vue`
  - `other-admin/admin-vue3/src/views/authority/userManage/components/EditUser.vue`
  - `other-admin/admin-vue3/src/views/permission/components/userPassword.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：菜单树、角色批量绑定、用户详情/保存和密码策略请求改用 Promise 链；业务码在 `.then()` 处理，网络错误在 `.catch()` 提示，提交和加载状态在 `.finally()` 清理。保留公开的 `EditUser.open()` Promise 返回契约；确认框、表单校验等本地异步步骤继续使用 `async/await`。
- 验证：`pnpm exec vue-tsc --noEmit`、6 个文件定向 ESLint 和 Prettier 检查通过；`authority-bind-workflow.spec.ts` 与 `permission-matrix.spec.ts` 合计 16/17 通过。IM 角色绑定、失败后重试、数据权限树重试和用户编辑门禁通过。
- 未完成/阻塞：唯一失败为 License 菜单用例的 `.sidebar-container` 定位器未命中，需核对当前侧栏 DOM 与测试选择器；此失败点不在本批改动文件内。权限中心自定义部门、数据权限树、人员设角和 IM 权限 API 仍待迁移；真实后端未联调。
- 下一步：继续收敛权限中心剩余 API 请求，再按协同、第三方接口、排班、H5、位置模块推进 CODE-01。

## [2026-09-26] CODE-01 / 权限中心剩余请求链收敛

- 目标：完成权限中心其余人员角色、组织树、数据权限和自定义部门业务 API 的链式风格迁移，并清理等待 API helper 的 `async/await`。
- 改动文件：
  - `other-admin/admin-vue3/src/views/authority/components/DataPermissionTree.vue`
  - `other-admin/admin-vue3/src/views/authority/imPerson/components/SetDataPermission.vue`
  - `other-admin/admin-vue3/src/views/authority/adminPerson/index.vue`
  - `other-admin/admin-vue3/src/views/authority/person/index.vue`
  - `other-admin/admin-vue3/src/views/authority/imPerson/index.vue`
  - `other-admin/admin-vue3/src/views/authority/person/components/setRole.vue`
  - `other-admin/admin-vue3/src/views/authority/person/components/setBatchRole.vue`
  - `other-admin/admin-vue3/src/views/authority/customDepartment/index.vue`
  - `other-admin/admin-vue3/src/views/authority/auth/components/EditRole.vue`
  - `other-admin/admin-vue3/src/views/permission/components/userPassword.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：组织/部门及懒加载树、角色菜单树、人员设角和数据权限读取/保存均改用 `.then().catch().finally()`；业务码错误在 `.then()` 中反馈，网络失败由 `.catch()` 处理，loading 在 `.finally()` 清理。链式加载结果显式保留失败状态，避免请求失败后打开空弹窗或清空人员选择。权限中心剩余 `await` 仅用于表单校验、确认框等本地异步。
- 验证：`pnpm exec vue-tsc --noEmit`、15 个权限页面/组件定向 ESLint 与 Prettier 检查通过；`permission-matrix.spec.ts --grep "树"`：3/3 通过。树用例验证角色菜单树失败阻止保存及重试、数据权限部门树失败重试、管理员用户编辑的部门树门禁。
- 未完成/阻塞：完整权限矩阵较早一次为 16/17，唯一失败是 License 菜单用例找不到 `.sidebar-container` 侧栏选择器；该测试结构差异待单列检查。权限业务完整 Mock、真实菜单/License/角色接口联调仍按 P1-02/P1-07 跟踪。
- 下一步：迁移协同岗 API 请求，再处理第三方接口、排班、H5 和位置等 CODE-01 剩余模块。

## [2026-09-26] CODE-01 / 协同岗 API Promise 链

- 目标：统一协同岗主页、层级、职能、默认岗、上下岗、表单和导出请求的宿主 API 写法。
- 改动文件：
  - `other-admin/admin-vue3/src/views/collaboration/index.vue`
  - `other-admin/admin-vue3/src/views/collaboration/colLevelManage.vue`
  - `other-admin/admin-vue3/src/views/collaboration/colOnOffRecord.vue`
  - `other-admin/admin-vue3/src/views/collaboration/colEditRecord.vue`
  - `other-admin/admin-vue3/src/views/collaboration/colManage.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/ColForm.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/ColDefaultCoopTab.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/ColFunctionTab.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/CoopLevelTree.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/CoopBindDialog.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/CoopNodeDialog.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/OffDutyDialog.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：协同首页配置与人员归属、层级/职能/组织懒加载、默认岗递归分页与挂靠、协同表单查询/图标上传/新增编辑、上下岗、IM 同步状态/触发和两个 Excel 导出改用 Promise 链。保留业务响应判断、人员分页累加、切换组织选择过滤、递归总数、请求 loading/提交锁、树父节点刷新；表单验证、确认框和渲染等待保留本地异步。
- 验证：协同目录直接 API-await 静态扫描无命中；`pnpm exec vue-tsc --noEmit`、12 个文件定向 ESLint 和 Prettier 检查通过。
- 未完成/阻塞：`preview.spec.ts` 2 项均失败且没有进入协同交互：全部菜单导航点击后仍在 `/h5/GroupTags`，北向接入 Mock 表格行断言为 0。协同专属业务 Mock E2E 和真实后端联调尚未执行。
- 下一步：继续扫描第三方接口，再迁移排班、H5、位置及剩余 API 请求编排工具；为协同补独立的 Mock 交互验收。

## [2026-09-26] CODE-01 / 第三方接口统一通信 Promise 链

- 目标：统一 ICP 服务配置、设备类型、部门树和单人/批量授权组件中的业务 API 调用风格。
- 改动文件：
  - `other-admin/admin-vue3/src/views/thirdInterface/unifiedComm/components/DeviceTypeManage.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/unifiedComm/components/IcpServerConfig.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/unifiedComm/components/IcpAuthManage.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/unifiedComm/components/AuthTreeModal.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：设备类型读取、展示状态修改、图标上传/保存，ICP 配置读取/保存/部门与摄像头树，非管理员部门归属查询、部门树，以及授权树与单人/批量授权保存均使用 Promise 链。保留业务码处理、开关回滚、上传临时 URL 清理与失败恢复、并行请求和 loading/提交锁释放；表单校验保留本地 `async/await`。
- 验证命令与结果：统一通信目录 `rg -n "await"` 只命中 `IcpServerConfig.vue` 的表单校验；`pnpm exec vue-tsc --noEmit`、4 个组件定向 ESLint 与 Prettier 检查通过。
- 未完成/阻塞：统一通信没有专属 Mock E2E，本批不记为浏览器交互或真实后端验收。智能体、南向、应用/警单等第三方接口子模块仍待扫描迁移，真实后端联调未执行。
- 下一步：迁移智能体接口，再处理南向、应用/警单、排班、H5 和位置模块，并继续为每个模块记录验证证据。

## [2026-09-26] CODE-01 / 第三方接口智能体 Promise 链

- 目标：统一智能体配置、分类、文件接口、查询记录、导入导出和虚拟用户绑定中的宿主 API 写法。
- 改动文件：
  - `other-admin/admin-vue3/src/api/thirdInterface/agentInterface.ts`
  - `other-admin/admin-vue3/src/views/thirdInterface/agentInterface/utils/category.ts`
  - `other-admin/admin-vue3/src/views/thirdInterface/agentInterface/components/AgentBindVirtualUser.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/agentInterface/components/AgentConfig.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/agentInterface/components/AgentFile.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/agentInterface/components/AgentHistory.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/agentInterface/components/AgentManage.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/agentInterface/components/AgentManageEditModal.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：智能体设置与导入、分类读取/全量更新、文件接口 CRUD、智能体 CRUD、虚拟用户绑定、查询记录删除/导出和模板下载均使用 Promise 链。保留表单校验、确认框、绑定请求版本保护及状态释放；下载接口非成功业务码现在会进入页面失败反馈，避免误报成功。
- 验证命令与结果：智能体目录/API helper `rg -n "await"` 只命中表单校验和确认框；`pnpm exec vue-tsc --noEmit`、8 个文件定向 ESLint、Prettier 检查通过；全量 Vitest 14 个文件、54 项通过。
- 未完成/阻塞：未发现智能体专属 Mock E2E；真实后端字段、文件传输和绑定联调未执行。
- 下一步：迁移第三方南向、应用/警单模块，再处理排班、H5、位置和共享请求组件。

## [2026-09-26] CODE-01 / 第三方接口南向 Promise 链

- 目标：统一南向 Mapper、任务标准件配置、应用详情读取和应用新增/更新请求的写法。
- 改动文件：
  - `other-admin/admin-vue3/src/views/thirdInterface/southInterface/index.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/southInterface/components/TaskConfigModal.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/southInterface/components/AppsManageEditModal.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/southInterface/components/AppsManageDetailModal.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：Mapper 保存、任务标准件配置读取/保存、南向应用详情读取及新增/更新使用 Promise 链；详情加载状态、任务配置请求版本保护、失败门禁、成功码判断和提交/loading 锁释放均保留。表单校验使用本地 `async/await`。
- 验证命令与结果：南向目录 `rg -n "await"` 只命中两个表单校验；`pnpm exec vue-tsc --noEmit`、4 个文件定向 ESLint 和 Prettier 检查通过。
- 未完成/阻塞：暂无南向专属 Mock E2E，真实后端联调未执行。
- 下一步：迁移应用与警单模块，再处理北向接入、排班、H5、位置和共享请求组件。

## [2026-09-26] CODE-01 / 第三方接口应用与警单 Promise 链

- 目标：统一应用/分组管理、图标上传、上下架、警单 Dock、类型和详情组件中的宿主 API 写法。
- 改动文件：
  - `other-admin/admin-vue3/src/views/thirdInterface/app/components/AppManage.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/app/components/AppForm.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/app/components/GroupManage.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/policeReport/components/DockManage.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/policeReport/components/EditDock.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/policeReport/components/TicketDetail.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/policeReport/components/TypeEdit.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：应用/分组分页与候选项读取、图标上传、应用及分组增改、上下架、Dock 状态/保存、警单类型保存和详情读取使用 Promise 链。保留表单校验、确认框、本地状态回滚、列表刷新与 loading/提交状态清理。
- 验证命令与结果：应用/警单目录 `rg -n "await"` 只命中表单校验与确认框；`pnpm exec vue-tsc --noEmit`、7 个文件定向 ESLint 与 Prettier 检查通过。
- 未完成/阻塞：暂无应用/警单专属 Mock E2E，真实后端联调未执行。
- 下一步：迁移北向接入，然后继续排班、H5、位置与共享请求组件。

## [2026-09-26] CODE-01 / 北向接入 Promise 链

- 目标：统一北向接入列表、应用新增/更新和删除请求的调用写法。
- 改动文件：
  - `other-admin/admin-vue3/src/views/eventType/thirdParty/index.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：列表读取、增改、删除使用 Promise 链；保留请求版本保护、保存/删除后的列表刷新、末页删除回退、确认框和表单校验。
- 验证命令与结果：北向页面 `rg -n "await"` 只命中表单校验和确认框；`pnpm exec vue-tsc --noEmit`、页面定向 ESLint 和 Prettier 检查通过。
- 未完成/阻塞：定向北向 Mock E2E 0/1，首屏表格预期 3 行实际 0 行、失败截图为空白；同一服务现有浏览器页面显示 3 行。两种运行表现不一致，需调查测试隔离/启动基线。真实后端未联调。
- 下一步：继续排班、H5、位置与共享请求组件，并独立排查北向 E2E 空白页问题。

## [2026-09-26] CODE-01 / 排班 Promise 链

- 目标：统一排班类型、值班信息和排班查询栏中的宿主 API 请求风格。
- 改动文件：
  - `other-admin/admin-vue3/src/views/shiftScheduling/dutyInformation/components/DutySearchBar.vue`
  - `other-admin/admin-vue3/src/views/shiftScheduling/dutyInformation/index.vue`
  - `other-admin/admin-vue3/src/views/shiftScheduling/dutyType/index.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：排班类型分页、创建/更新/删除，排班下拉分页、日历查询、模板下载和导入后刷新改用 Promise 链。表单校验、确认框和 `nextTick` 保留本地 `async/await`；类型检查发现并修复下拉请求并发/无更多数据时的 `Promise<void>` 早退分支。
- 验证：`src/views/shiftScheduling` 的 `rg -n "await"` 仅剩表单校验和 `nextTick`；`pnpm exec vue-tsc --noEmit`、3 个文件定向 ESLint 与 Prettier 检查通过。
- 未完成/阻塞：无排班专属 Mock E2E；真实后端联调未执行。
- 下一步：继续 H5 轮播、归档、快捷标签和群组标签 API，再迁移位置及共享请求组件；真实后端联调仍单独记录。

## [2026-09-26] CODE-01 / H5 与快捷标签 Promise 链

- 目标：统一群组标签、H5 快捷标签及协同快捷标签页面的宿主 API 请求风格。
- 改动文件：
  - `other-admin/admin-vue3/src/views/h5/groupTags/index.vue`
  - `other-admin/admin-vue3/src/views/h5/groupTags/GroupTagsForm.vue`
  - `other-admin/admin-vue3/src/views/h5/quick/TreeLabel.vue`
  - `other-admin/admin-vue3/src/views/h5/quick/LookLabel.vue`
  - `other-admin/admin-vue3/src/views/h5/quick/EditForm.vue`
  - `other-admin/admin-vue3/src/views/quick/index.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：标签分页、详情、保存、单删/批删和警员关联读取改用 Promise 链；loading/submitting 在 `finally` 释放，业务失败与网络失败分别反馈。确认框取消保持静默；表单校验保留本地 `async/await`。
- 验证：`pnpm exec vue-tsc --noEmit`、6 个文件定向 ESLint/Prettier 检查通过；`group-tags.test.ts` 2/2、`group-tags.spec.ts` 3/3 通过；静态扫描仅剩 3 个表单校验 `await`。
- 未完成/阻塞：快捷标签无专属业务 E2E；H5 轮播/归档、真实后端联调未执行。
- 下一步：收敛轮播和归档 API 请求，再处理位置、仪表盘、虚拟用户及共享请求组件。

## [2026-09-26] CODE-01 / H5 轮播与归档 Promise 链

- 目标：统一 H5 轮播图和已归档群组页面中的宿主 API 请求风格。
- 改动文件：
  - `other-admin/admin-vue3/src/views/h5/carousel/components/CarouselForm.vue`
  - `other-admin/admin-vue3/src/views/h5/archivedTable/index.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：轮播图片上传、公众号/文章/环境配置及详情读取、轮播新增/更新，归档文件下载、系统配置读取、群组同步和同步配置写入改用 Promise 链。保留图片上传先于保存、下载取消静默、下载进度及定时器清理；同步配置业务失败不会误提示同步成功。
- 验证：H5 页面 `rg -n "await"` 只命中表单校验和归档下载确认；`pnpm exec vue-tsc --noEmit`、2 个文件定向 ESLint 和 Prettier 检查通过。未发现轮播/归档专属业务 Mock E2E。
- 未完成/阻塞：位置、仪表盘、虚拟用户与共享请求组件仍待迁移；真实后端联调未执行。
- 下一步：处理位置、仪表盘和虚拟用户页面，再审查共享表格、选择控件与请求 composable。

## [2026-09-26] CODE-01 / 位置、仪表盘与虚拟用户 Promise 链

- 目标：统一位置编辑、Dashboard 全局配置和虚拟用户管理中的宿主 API 请求风格。
- 改动文件：
  - `other-admin/admin-vue3/src/api/policeExtend/virtualUser.ts`
  - `other-admin/admin-vue3/src/views/dashboard/index.vue`
  - `other-admin/admin-vue3/src/views/location/components/EditLocation.vue`
  - `other-admin/admin-vue3/src/views/policeExtend/virtualUser/index.vue`
  - `other-admin/admin-vue3/src/views/policeExtend/virtualUser/EditVirtualUser.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：位置新增/更新、Dashboard 全局配置、虚拟用户列表/新增/编辑/删除改用 Promise 链；失败反馈与 loading 释放保留。将虚拟用户请求表单从动态索引类型收窄为显式字段，移除页面中的 `as never`。
- 验证：目录静态扫描只剩位置和虚拟用户表单校验 `await`；`pnpm exec vue-tsc --noEmit`、5 个文件定向 ESLint/Prettier 检查通过；`business-migration.test.ts` 10/10 通过。
- 未完成/阻塞：本批没有位置或虚拟用户专属业务 Mock E2E，真实后端联调未执行。
- 下一步：迁移 `OrgTreeSelect`、`UserBindDialog`、`SelectPagination`、`ProTable`、`useTable` 与 `useFetch` 中的请求等待。

## [2026-09-26] CODE-01 / 共享 UI 请求组件 Promise 链

- 目标：统一组织树选择、人员绑定弹窗、远程分页选择器和 ProTable 中的宿主 API 请求风格。
- 改动文件：
  - `other-admin/admin-vue3/src/components/OrgTreeSelect/index.vue`
  - `other-admin/admin-vue3/src/components/UserBindDialog/index.vue`
  - `other-admin/admin-vue3/src/components/SelectPagination/index.vue`
  - `other-admin/admin-vue3/src/components/ProTable/index.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：四个组件的直接 API 等待改为 Promise 链；保留组织树查询先后与懒加载回退、确认框取消静默、绑定/解绑状态清理、ProTable 请求序号与 abort 取消、错误事件和最终 loading 通知。
- 验证：四个组件 `rg -n "await"` 无命中；`pnpm exec vue-tsc --noEmit`、定向 ESLint/Prettier 检查通过；`pro-table.test.ts` 4/4，部门树失败恢复 E2E 2/2 通过。
- 未完成/阻塞：没有 SelectPagination 或 UserBindDialog 专属交互 E2E；真实后端联调未执行。
- 下一步：把 `useTable` 与 `useFetch` 改为链式请求，再全量扫描 Vue3 `src`，确认只保留表单/确认/渲染等待等本地异步。

## [2026-09-26] CODE-01 / 请求 composable 与全源风格收敛

- 目标：完成 `useTable`、`useFetch` 及全源扫描发现的剩余 API 等待，关闭 CODE-01。
- 改动文件：
  - `other-admin/admin-vue3/src/composables/useFetch.ts`
  - `other-admin/admin-vue3/src/composables/useTable.ts`
  - `other-admin/admin-vue3/src/composables/useLicense.ts`
  - `other-admin/admin-vue3/src/router/filterChain.ts`
  - `other-admin/admin-vue3/src/router/routerGuard.ts`
  - `other-admin/admin-vue3/src/layout/components/Navbar.vue`
  - `other-admin/admin-vue3/src/utils/session.ts`
  - `other-admin/admin-vue3/src/views/baseData/layoutConfig/components/PcConfig.vue`
  - `other-admin/admin-vue3/tests/unit/use-fetch.test.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`、`other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`、`other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
- 完成内容：`useTable` API 包装和查询操作改用 Promise 链；`useFetch` 请求、错误处理、重试、刷新改用 Promise 链，重试复用请求序号以阻止过期重试覆盖新请求；修复 `useTable.mutate` 只更新内部副本的问题。菜单初始化、License 过滤、登出会话和 PC 页签保存的 API 调用也不再使用 `await`。表单校验、确认/弹窗结果、`nextTick`、动态导入和按序路由过滤器仍保留本地异步写法。
- 验证：全量 Vitest 15 个文件、59 项通过；权限矩阵 Playwright 14/14；`pnpm exec vue-tsc --noEmit`、9 个文件定向 ESLint/Prettier 检查通过。Vue3 `src` 全量 `await` 扫描未发现直接业务 API `await`。
- 未完成/阻塞：真实后端联调未执行，按 P1-07 跟踪；无剩余 CODE-01 代码迁移项。
- 下一步：继续 P1 权限和业务 Mock 验收，并按 UI-09 计划迁移 Vue3 宿主对 Element Plus 的直接依赖。

## [2026-09-26] P1-03 / 基础数据 App H5 与公共配置 Mock 验收

- 目标：补齐基础数据台账中 App H5 编辑/删除和公共配置成功保存边界。
- 改动文件：
  - `other-admin/admin-vue3/tests/e2e/base-data-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
- 完成内容：新增 App H5 编辑回显与 PUT 载荷检查、删除失败后操作恢复和再次删除成功刷新；新增公共配置首次写入 `CREAT_GROUP_CONFIG`、回填 ID 后再次更新的请求载荷和界面成功状态检查。页面和 Vue2 API 契约一致，本步骤仅补 Mock 验收。
- 验证：完整 `pnpm exec playwright test tests/e2e/base-data-workflow.spec.ts --reporter=line`：33/33 通过；测试文件 ESLint 与 Prettier 检查通过。Playwright 通过 `mockBackend` 拦截请求，没有连接真实后端。
- 未完成/阻塞：真实后端联调尚未执行，按 P1-07 跟踪；基础数据 Mock/E2E 台账范围完成。
- 下一步：推进 P0-04 按钮权限逐页面契约核对与 P1-02 权限中心工作流，保留可信接口缺失项为阻塞。

## [2026-09-26] CODE-01 / HTTP 401 会话结束链式处理补漏

- 目标：清除业务请求失败拦截器中间接等待登出 API 的 `await`，保持宿主 API 链式风格，并确保提示门可以恢复。
- 改动文件：
  - `other-admin/admin-vue3/src/utils/http.ts`
  - `other-admin/admin-vue3/tests/unit/auth-http.test.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
- 完成内容：401 拦截器调用 `endSession()` 后以 Promise 链等待登出；在 `.finally()` 恢复提示门，并继续拒绝原始 401 请求。动态导入仍保留本地 `async/await`。
- 验证：`auth-http.test.ts` 6/6；全量 Vitest 15 个文件、60 项通过；`vue-tsc --noEmit`、涉及文件 ESLint 与 Prettier 检查通过。全源扫描剩余 `await` 均为本地表单、弹窗、动态导入、路由过滤顺序或渲染等待。
- 未完成/阻塞：真实后端登出与 401 联调未执行，按 P1-07 跟踪。
- 下一步：继续 P0-04 按钮权限逐页面契约核对与 P1-02 权限中心工作流，保留可信接口缺失项为阻塞。

## [2026-09-26] SCOPE / 新权限扩展与页面引导延期

- 目标：按用户最新范围决策区分 Vue2 迁移基线与新增需求，避免将新增功能当作本期迁移阻塞。
- 范围决策：Vue2 已有菜单过滤、明确按钮码和管理员例外继续迁移并保留回归；Vue2 没有的文本/字段权限、新权限中心工作流、缺少旧版权限码的额外按钮授权及页面引导系统延期。
- 依据：现役 Vue2 页面中的明确按钮码已在 Vue3 消费；`/admin/executorToEquipment/create` 只在注释按钮出现。角色成员读取在 Vue2 仍为 TODO/空 Mock。Vue3/Vue2 运行源码未找到 `GuideRegistry` 或 `driver.js` 引导流程；引导文件保留为草案。
- 文档同步：总交付计划、权限契约、项目地图、迁移矩阵、迁移 Backlog 和 `GUIDE-CONTENT-PLAN.md` 已记录延期状态及恢复条件。
- 未完成/阻塞：延期项不计为当前迭代阻塞，也不能报告为已完成；真实菜单/权限联调仍由 P0-03/P1-07 单独跟踪。
- 下一步：转入 P1-04 协同岗与排班的 Vue2 行为对照及 Mock 验收；保留既有权限门禁，不扩展无契约的权限键。

## [2026-09-26] P1-04 / 排班类型和值班信息 Mock 验收

- 目标：按 Vue2 行为补齐排班类型与值班信息的浏览器 Mock 验收，并修复验证中发现的问题。
- 改动文件：
  - `other-admin/admin-vue3/src/api/shiftScheduling/index.ts`
  - `other-admin/admin-vue3/src/views/shiftScheduling/dutyInformation/index.vue`
  - `other-admin/admin-vue3/src/views/shiftScheduling/dutyInformation/components/DutyCalendar.vue`
  - `other-admin/admin-vue3/src/views/shiftScheduling/dutyInformation/components/ImportResultDialog.vue`
  - `other-admin/admin-vue3/tests/e2e/shift-scheduling-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`、`other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
- 完成内容：排班专项 E2E 覆盖类型 CRUD 与内置类型保护、列表条件查询、日历失败提示/重试和键盘切月、导入错误文本安全展示、模板下载文件名、批量删除失败后重试。修复日历切换早于子组件挂载导致漏查；模板导出改用 `getBinary` 并解析真实响应头；批删失败提供反馈且不提前刷新；服务端导入错误不再作为 HTML 渲染；日历读取增加 loading、失败提示及旧请求结果保护。
- 验证：`pnpm exec playwright test tests/e2e/shift-scheduling-workflow.spec.ts --reporter=line --timeout=20000`：4/4；`pnpm exec vue-tsc --noEmit`、5 个涉及文件的 ESLint 与 Prettier 检查通过。所有浏览器请求由 Mock 拦截；默认全量 E2E 未重跑。
- 未完成/阻塞：协同岗组织树、挂靠/上下岗、导入导出和失败恢复尚未补业务 E2E；真实后端联调未执行。
- 下一步：继续 P1-04 协同岗行为验收，权限仅保留 Vue2 已有菜单/按钮契约，不扩展新权限码。

## [2026-09-26] P1-04 / 协同岗下岗工作流 Mock 验收

- 目标：验证 Vue2 已有的管理员下岗工作流及失败恢复，不扩展权限契约。
- 改动文件：
  - `other-admin/admin-vue3/tests/e2e/collaboration-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`、`other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
- 完成内容：模拟协同岗列表、在岗人员、最后一人在岗判断和管理员下岗接口；验证最后一人提示、首次写入失败后人员仍在列表、重试成功后重新查询并关闭弹窗。请求载荷断言使用人员记录 ID，并保留服务端注入的 `switchType: 3`。
- 验证：`pnpm exec playwright test tests/e2e/collaboration-workflow.spec.ts --reporter=line --timeout=20000`：1/1；定向 ESLint 与 Prettier 检查通过。所有接口请求均由 `mockBackend` 截获。
- 未完成/阻塞：协同组织树、层级与职能挂靠、上下岗记录查询/导出、批量操作仍需验收；真实后端联调未执行。
- 下一步：验证协同岗上下岗记录筛选和二进制导出契约，然后继续树与挂靠工作流。

## [2026-09-26] PLAN / lx-ui 先行与页面验收顺序调整

- 目标：减少共享组件替换前后对同一表单、弹窗、表格、搜索、树、焦点和窄屏行为的重复验收。
- 依据：Vue3 宿主有 103 个源码文件直接引用 Element Plus，模板使用 46 种 Element Plus 标签；lx-ui 已有封装覆盖部分常用场景，其余控件仍由库入口导出 Element Plus。组件库目前类型、构建和文档构建通过，但除图标外的组件尚未完成完整真实浏览器验收。
- 决策：先完成将由宿主采用的高频 lx-ui 组件契约、Demo、行为测试和浏览器验收；再迁移宿主导入/自动导入/类型/插件/样式/分包；随后按共享组件影响面分批替换页面，并在每批后回归受影响页面；所有直接引用迁移后才移除 Vue3 对 Element Plus 的直接依赖。
- 并行边界：Vue2 源码对照、API/字段/状态契约及已有菜单/按钮权限与管理员例外核查可继续；不因调整重复运行未受影响的已通过测试。没有通用 Lx 封装的控件继续从 lx-ui 导入 Element Plus，不强制新建包装。
- 当前排队：P1-04 已通过的排班 4/4 与协同下岗 1/1 保留；协同树、记录筛选/导出、批量操作等深交互验收排在搜索/树/表格组件替换后。新权限中心、文本/字段权限及页面引导仍延期。
- 文档同步：`PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`linkx-fe/docs/ROADMAP.md`、`ELEMENT-PLUS-LX-UI-MATRIX.md`、`MIGRATION-MATRIX.md`、`MIGRATION-BACKLOG.md`。
- 下一步：从 lx-ui 高频组件与 UI-09 接入前置开始，先确认 `LxDynamicForm`、`LxDialog`、`LxProTable`、`LxSearchBar`、`LxVirtualTree` 等被宿主实际采用场景的 Demo/行为测试和样式缺口；保留 API 契约修复作为并行工作。

## [2026-09-26] UI-03 / LxVirtualTree 行为单测

- 目标：按 lx-ui 先行的新优先级，先为虚拟树补充可观察行为回归，再进入宿主逐页替换。
- 改动文件：
  - `other-admin/admin-vue3/tests/unit/lx-virtual-tree.test.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`
  - `linkx-fe/docs/ROADMAP.md`、`linkx-fe/docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`、`other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
- 完成内容：验证 100 项数据只渲染可视窗口、过滤时保留匹配节点祖先、选中父节点时跳过禁用后代、方向键展开并将焦点移至子节点。键盘测试将树挂载到文档中，验证真实 `document.activeElement`。
- 验证：Vue3 全量 Vitest 16 个文件、64 项通过；`pnpm exec eslint tests/unit/lx-virtual-tree.test.ts` 和该文件 Prettier 检查通过。该单测不代表独立 Demo 或真实浏览器验收。
- 未完成/阻塞：LxVirtualTree 独立 Demo、公开 exposes/属性覆盖和浏览器窄屏/主题验收仍待完成；其他高频组件的行为测试和 Demo 也未完成。
- 下一步：为 LxVirtualTree 补独立中文 Demo 和 API 页面，覆盖过滤、受控勾选、禁用节点、空态、exposes 与键盘；随后继续 LxDynamicForm、LxDialog、LxSearchBar 和 LxProTable 的库级证据。

## [2026-09-26] UI-04 / LxSectionTitle、LxIcon 与窄屏分页首批接入

- 目标：让 Vue3 首批高频入口采用 lx-ui 图标/标题组件，并修复 GroupTags 窄屏下表格和分页控件不可达的问题。
- 改动文件：
  - `linkx-fe/src/components/LxSectionTitle/index.vue`
  - `other-admin/admin-vue3/src/components/SectionTitle/index.vue`、`SearchBar/index.vue`、`Pagination/index.vue`
  - `other-admin/admin-vue3/src/layout/components/Navbar.vue`、`Sidebar/index.vue`
  - `other-admin/admin-vue3/src/views/h5/groupTags/index.vue`、`GroupTagsForm.vue`、`iconMap.ts`
  - `other-admin/admin-vue3/tests/unit/group-tag-icon.test.ts`、`section-title-adapter.test.ts`、`tests/e2e/group-tags.spec.ts`
  - 总计划、项目地图、迁移矩阵、lx-ui 路线图与交付核查、`AGENTS.md`
- 完成内容：SectionTitle 适配器改为使用 `LxSectionTitle`，保留旧 dashed 默认、旧 props 和未映射图标回退；侧栏、Navbar、SearchBar 与 GroupTags 常用图标改用 `LxIcon`。GroupTags 的 Font Awesome 接口字符串保持不变，仅本地映射到 LxIcon。GroupTags 表格和分页分别增加独立、可聚焦的横向滚动容器；375px 下页面本身无横向溢出，操作列及跳页控件可通过各自容器到达。
- 验证：Vue3 `vue-tsc --noEmit` 通过；Vitest 19 个文件、91 项通过；定向 ESLint 与本轮代码 Prettier 检查通过；GroupTags Mock E2E 4/4；默认 E2E 100/101，唯一 `/baseData/thirdParty` Smoke 隔离复跑 1/1 通过；Vue3 生产构建、lx-ui 类型/构建/文档构建通过。生产构建仍有 LESS 变量导出、Element Plus 分包循环和 chunk 警告。桌面及 375px 浏览器渲染已检查；Impeccable 检测器对本轮组件返回空结果。
- 未完成/阻塞：全量 E2E 中 `/baseData/thirdParty` 入口 Smoke 的间歇失败仍需观察。lx-ui 其他组件的 Demo、状态/键盘/主题浏览器证据未齐，因此正式 Impeccable 组件/动效审查尚未执行；Vue3 全量组件替换后的整站审查也未执行。其他 Vue3 页面仍有 Element Plus 图标和独立组件待迁移。
- 下一步：继续补 LxVirtualTree、LxDynamicForm、LxDialog、LxSearchBar、LxProTable 等组件的独立 Demo、行为测试和浏览器证据；组件库完成后用 Impeccable 审查组件与动效，落实建议并复验，再按共享组件波次迁移 Vue3 页面。未来 Vue2 页面迁入 Vue3 时直接采用 lx-ui；整站审查留到全量替换后。

## [2026-09-26] UI-02/UI-03 / LxVirtualTree 文档与公开契约

- 目标：补齐虚拟树调用者可见的 API、交互示例和实例方法类型，为 lx-ui 组件库验收建立可复查证据。
- 改动文件：
  - `linkx-fe/src/components/LxVirtualTree/types.ts`、`index.vue`、`src/index.ts`
  - `linkx-fe/src/components/LxVirtualTree/demo/basic.vue`
  - `linkx-fe/docs/components/lxvirtualtree.md`、`new-components.md`、`.vitepress/config.ts`
  - `linkx-fe/docs/ROADMAP.md`、`DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/tests/unit/lx-virtual-tree.test.ts`、`docs/MIGRATION-MATRIX.md`、`docs/MIGRATION-BACKLOG.md`、`docs/ELEMENT-PLUS-LX-UI-MATRIX.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`
- 完成内容：增加导出的 `LxVirtualTreeExpose` 类型和独立中文 API 文档；Demo 覆盖 240 节点窗口树、受控勾选、禁用节点、级联开关、筛选、`node` 插槽、公开方法、HUD 深色主题，以及由宿主提供的加载/错误/空状态。单测扩展到 8 项，覆盖公开方法和插槽。
- 验证：`pnpm typecheck`、`pnpm build`、`pnpm build:docs` 通过；Vue3 定向 Vitest 8/8，ESLint 和本轮新增 Demo/API/测试的 Prettier 检查通过。Chrome 浏览器中桌面筛选、受控选择、空/错状态恢复和方向键焦点通过；375px HUD 深色主题计算色为 `rgb(16, 26, 44)`，页面宽度 375/375 无横向溢出。Impeccable detector 对组件和 Demo 返回 `[]`。构建仍提示文档 bundle 超过 500 kB；现有大文档的全文件 Prettier 检查有既有格式差异，未整篇重排。
- 未完成/阻塞：其他高频组件的独立 Demo/行为证据仍待补；Impeccable 组件/动效审查要等库级 Demo 和浏览器检查完成后执行，Vue3 整站审查排在全量替换后。
- 下一步：继续 LxDynamicForm、LxDialog、LxSearchBar、LxProTable 等组件的独立验收材料；累积完成组件库 Demo、行为与浏览器检查后执行第一阶段 Impeccable 正式审查，再迁移 Vue3 页面，最终执行整站审查。

## [2026-09-27] UI-01 / 基础控件桥接与 DynamicForm 库级验收

- 目标：按用户确认的先后顺序，先完成 `design/` 基础控件与动态图标，再收尾 `LxDynamicForm`；Vue3 Element Plus 页面替换继续排在组件库完成和 Impeccable 库级审查之后。
- 改动文件：
  - `linkx-fe/src/styles/element-theme.css`
  - `linkx-fe/src/tokens/variables.css`、`linkx-fe/src/tokens/theme-hud.css`
  - `linkx-fe/src/components/LxForm/demo/control-bridge.vue`
  - `linkx-fe/docs/components/element-bridge.md`、`linkx-fe/docs/.vitepress/config.ts`
  - `linkx-fe/docs/components/lxdynamicform.md`、`linkx-fe/src/components/LxDynamicForm/*`（本轮只做浏览器验证）
  - `doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`、`linkx-fe/docs/ROADMAP.md`、`linkx-fe/docs/DELIVERY-CHECK.md`
- 完成内容：基础桥接 Demo 覆盖按钮 28/32/40px、默认/主/危险/禁用态、输入、选择、单选、复选、数字、日期范围、开关、文本域、Tabs、Card、Tree、Descriptions；表单必填错误可见，键盘焦点存在，HUD 深色令牌可切换。修正 HUD 主/危险按钮文字变量和占位文字对比度，避免亮底白字及过暗占位。
- DynamicForm 浏览器证据：文档页实际渲染；成功/空结果/失败状态与失败重试入口可见；切回成功恢复；任务类型联动显示“支援说明”；1/2/3 列栅格、24 栅格通栏、受控禁用、重置和 375px 单列/无页面横向溢出通过。失败模式下重试仍失败是当前 Mock 模式的预期结果，切换成功模式后可恢复。
- 验证：`linkx-fe/pnpm typecheck` 通过；`linkx-fe/pnpm build:docs` 通过（保留既有大 chunk 警告）；指定文件由 Vue3 已安装 Prettier 写入并检查；Impeccable detector 对本轮组件、Demo、令牌和桥接 CSS 返回 `[]`。基础控件和 DynamicForm 的浏览器检查均使用本地文档服务 `http://127.0.0.1:4174`，没有真实后端请求。
- 未完成/阻塞：UI-01/UI-02/UI-03 仍不能整体标记完成，其他待替换组件的 Demo、状态/键盘/主题浏览器证据尚未齐；正式 Impeccable 组件库审查要等库级组件闭环后执行，Vue3 全站审查要等全量替换后执行。Vue3 宿主仍有 Element Plus 直接引用，不能现在删除自身依赖；无专用 Lx 封装的控件继续从 lx-ui 导出的 Element Plus 使用。新权限中心、文本/字段权限和页面引导按确认范围延期。
- 下一步：继续补齐 LxDialog、LxSearchBar、LxProTable、LxSelectPagination、LxUpload 等宿主实际采用组件的 Demo、行为测试和浏览器证据；库级组件闭环后执行 Impeccable 审查并记录修复/复验，再进入 Vue3 导入和页面替换波次。业务 API 继续保持 `.then().catch().finally()`。

## [2026-09-27] UI-02/UI-03 / LxSearchBar 状态验收与窄屏修复

- 目标：收尾 SearchBar 的 Mock 状态、受控查询交互和窄屏布局证据，按已确认顺序继续完成 lx-ui 后再替换 Vue3 的 Element Plus 控件。
- 改动文件：
  - `linkx-fe/src/components/LxSearchBar/index.vue`、`docs/components/lxsearchbar.md`、`docs/ROADMAP.md`、`docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/tests/unit/lx-search-bar.test.ts`、`docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`PROJECT-HANDOFF.md`
- 完成内容：新增 SearchBar 3 项行为测试，覆盖受控字段更新、按 schema 默认值重置并立即查询、loading 时禁止查询及超过 8 个字段后的展开。375px 展开时发现原 24 列及列间距撑宽组件，现移动断点使用单列网格并限制最小宽度。
- 浏览器验收：文档页 `http://127.0.0.1:4174/components/lxsearchbar` 桌面通过成功、空结果、失败、失败后恢复、重置、展开/收起和 loading 禁用；375px 下折叠/展开均为 375/375 页面宽度，十项条件全部可见，查询成功。数据为本地内存 Mock，不请求后端。
- 验证：lx-ui `pnpm typecheck`、`pnpm build`、`pnpm build:docs` 通过；Vue3 全量 Vitest 21 个文件、103 项通过，`pnpm lint:ts`、定向 ESLint/Prettier、`pnpm build` 和 `git diff --check` 通过。构建保留既有 Less 变量导出、Element Plus 循环分包、大 chunk 和文档 chunk 提示。长篇 Markdown Prettier 检查在索引中的原始版本也失败，因此未做整篇格式重排。
- 未完成/阻塞：其他高频 lx-ui 组件的 Demo、行为和浏览器证据仍待补；组件库级 Impeccable 审查必须等库级组件闭环后执行，Vue3 整站审查仍排在宿主全量替换后。宿主仍有 Element Plus 直接引用，尚未进入依赖删除门槛；新增权限中心、文本/字段权限和页面引导继续延期。
- 下一步：继续验收 LxDialog、LxProTable、LxSelectPagination、LxUpload 等宿主采用组件，完成组件行为证据后先做 Impeccable 库级审查，再按共享组件影响面替换 Vue3 页面；全量替换后再做整站审查并移除宿主 Element Plus 直接依赖。

## [2026-09-27] UI-02/UI-03/UI-11 / LxDialog 定向审查与窄屏验收

- 目标：补齐 LxDialog 独立文档、状态 Demo、移动端约束和可复查的 Impeccable 定向审查证据；保持“基础控件与动态图标 → LxDynamicForm → 其余 lx-ui 组件及组件库审查 → Vue3 Element Plus 替换”的已确认顺序。
- 改动文件：
  - `linkx-fe/src/components/LxDialog/index.vue`、`src/components/LxDialog/demo/basic.vue`、`docs/components/lxdialog.md`
  - `linkx-fe/docs/ROADMAP.md`、`docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/package.json`、`playwright.config.ts`、`playwright.lxui.config.ts`
  - `other-admin/admin-vue3/tests/unit/lx-dialog.test.ts`、`tests/e2e/lx-dialog-docs.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`PROJECT-HANDOFF.md`、`other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
- 完成内容：定向 Impeccable 审查发现默认 672px 宽度缺少视口约束、移动端关闭按钮小于触屏目标及自定义按钮无明确焦点环。现限制 Dialog 最大宽度为视口减 32px；移动端关闭/操作按钮和示例表单控件采用 44px 尺寸；新增键盘焦点环、限制 hover 过渡属性，并对减少动效提供降级。标题保留 Element Plus `titleId`/`titleClass` 关联机制；Demo 覆盖表单校验/提交、危险操作与自定义 footer。`design/` 无单独的 Dialog 设计文件，外观沿用已有 FormModal 视觉实现和 lx-ui 令牌。
- Impeccable 检查：定向技术审查的建议已按上述范围吸收；源码 detector 对 Dialog 与 Demo 返回 `[]`。浏览器手动检查通过桌面表单、校验错误、loading 锁、危险样式、ESC、footer 和焦点回退。Chromium Playwright 3/3，通过 375px 面板边界、无页面横向溢出、单列表单、44px 关闭目标、可访问标题、键盘焦点环、减少动效、提交/错误/ESC/footer 检查。示例提交为本地内存 Mock，没有请求后端。
- 验证：lx-ui `pnpm typecheck`、`pnpm build`、`pnpm build:docs` 通过；Vue3 Vitest 22 个文件、107 项通过；Dialog 文档 Playwright 3/3；定向 ESLint、Prettier 和 `git diff --check` 通过。构建仍提示 VitePress 文档 chunk 超过 500 kB；全库 Impeccable 审查不在本步骤宣告完成。
- 未完成/阻塞：UI-10 其他高频组件的设计映射、Demo/行为/浏览器矩阵仍在进行；UI-11 整库 Impeccable 审查待这些组件闭环。Vue3 Element Plus 页面替换和依赖删除仍未开始；权限中心、文本/字段权限及页面引导继续按用户确认延期。
- 下一步：继续 LxProTable、LxSelectPagination、LxUpload、树/穿梭等被 Vue3 采用组件的契约与状态验收；完成库级 Impeccable 审查及修复复验后，才启动 Vue3 组件接入和替换波次。业务 API 调用继续使用 `.then().catch().finally()`。

## [2026-09-27] UI-02/UI-03 / LxProTable 选择与响应式验收

- 目标：按既定顺序补齐 LxProTable 的真实分页选择、加载可访问性、窄屏滚动与主题证据；Vue3 Element Plus 替换保持在 lx-ui 组件闭环和整库审查之后。
- 改动文件：
  - `linkx-fe/src/components/LxProTable/index.vue`、`types.ts`、`demo/basic.vue`
  - `linkx-fe/docs/components/lxprotable.md`、`docs/ROADMAP.md`、`docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/playwright.lxui.config.ts`、`tests/e2e/lx-pro-table-docs.spec.ts`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`、`MIGRATION-BACKLOG.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`PROJECT-HANDOFF.md`
- 完成内容：浏览器首先暴露跨页选择问题：已选计数为 2，但返回第一页时原行未勾选。组件现缓存仍选中的行对象，在 `selectedKeys` 或分页数据变化后恢复 Element Plus 内部选择；清空选择会移除全部缓存项。宽表格溢出时将组件区域加入 Tab 顺序并支持左右/Home/End 滚动；复选点按区域扩大到 44px；loading 增加 `aria-busy` 和 live status，系统减少动效时停止旋转但保留文字状态。Demo 新增成功/加载/空/错误重试、本地 HUD 主题切换、行点击/排序反馈、跨页清空和公开实例调用。
- 验证：lx-ui `pnpm typecheck`、`pnpm build`、`pnpm build:docs` 通过；Vue3 `vue-tsc --noEmit` 和 Vitest 22 个文件/107 项通过；ProTable 文档 Playwright 4/4 通过，包含跨页选中恢复与清空、加载读屏/减少动效、空结果/错误恢复/排序、375px 页面无横向溢出/表内方向键滚动/44px 复选范围，以及真实 `.lx-theme-hud` 表头令牌切换。定向 ESLint、Prettier、`git diff --check` 通过；Impeccable 源码 detector 返回 `[]`。文档构建保留既有大于 500 kB chunk 提示；示例为本地内存数据，没有后端请求。
- 未完成/阻塞：组件级定向改进不等于 UI-11 整库 Impeccable 审查完成。`tableAttrs`、自定义列/单元格契约和权限脱敏尚无完整专项矩阵；其他 lx-ui 高频组件仍待 Demo、行为与浏览器验收。Vue3 Element Plus 导入切换、逐页替换和依赖删除没有开始；新权限中心、文本/字段权限及页面引导继续延期。
- 下一步：继续 LxSelectPagination、LxUpload 及其他 Vue3 实际采用组件；UI-10 闭环后进行正式 Impeccable 组件/动效审查，吸收建议并复验，再进入宿主接入和页面替换。保持“`design/` 基础控件与动态图标 → `LxDynamicForm` → 其余 lx-ui 组件及整库审查 → Vue3 Element Plus 替换”顺序；业务 API 继续使用 `.then().catch().finally()`。

## [2026-09-27] UI-02/UI-03 / LxUpload 上传状态与浏览器验收

- 目标：按已确认顺序继续完成 lx-ui 组件库证据；Vue3 Element Plus 替换必须等待其他候选组件闭环和整库 Impeccable 审查。
- 改动文件：
  - `linkx-fe/src/components/LxUpload/index.vue`、`types.ts`、`demo/basic.vue`
  - `linkx-fe/docs/components/lxupload.md`、`docs/ROADMAP.md`、`docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/tests/unit/lx-upload.test.ts`、`tests/e2e/lx-upload-docs.spec.ts`、`playwright.lxui.config.ts`
  - `other-admin/admin-vue3/docs/ELEMENT-PLUS-LX-UI-MATRIX.md`、`MIGRATION-BACKLOG.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`PROJECT-HANDOFF.md`
- 完成内容：对照 `design/上传拖拽区 Upload/` 增加进度与可读状态、失败保留/重试、取消、文件校验、紧凑列表和 `drag` 兼容属性；网络请求由宿主 `httpRequest` 或 `action` 配置。默认手动提交，无配置时阻止提交；`chunkSize` 只透传给宿主，不宣称内置分片协议。中文 API 和内存 Mock Demo 覆盖成功、加载、错误、重试、取消、禁用及主题。
- 验证：lx-ui `pnpm typecheck`、`pnpm build`、`pnpm build:docs` 通过；Vue3 Vitest 23 个文件/111 项和 `pnpm lint:ts` 通过；Upload 定向单测 4 项、文档 Playwright 3 项通过。首次跑全量文档 E2E 时，Upload 进度测试因断言精确要求瞬时 20% 而观察到 40%/60% 失败；将其改为检查有效中间进度后，全量 Chromium 文档 E2E 14/14 通过。文档 chunk 大于 500 kB 的既有构建提示保留。
- 边界：示例全部由浏览器内存 Mock 驱动，未请求后端；地图/图标/Excel 业务页尚未替换，真实上传协议、鉴权及分片联调未执行。Upload 单项证据和定向源码检查不等于 UI-11 整库 Impeccable 审查。
- 下一步：继续验收 `LxDescriptions`、`LxStatusSwitch`、`LxTransferPanel` 与树/穿梭等 Vue3 替换候选；全部库级证据齐备后，使用 Impeccable 审查组件和动效、落实建议并复验，再开始 Vue3 Element Plus 替换。顺序保持 `design/` 基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 组件与整库审查 → Vue3 替换。

## [2026-09-27] UI-02/UI-03 / LxDescriptions 设计验收

- 目标：按 `design/详情描述行 Descriptions/` 补齐描述行的设计实现、API/Demo、行为与窄屏证据；Vue3 Element Plus 批量替换继续等待 lx-ui 组件闭环及整库 Impeccable 审查。
- 改动文件：
  - `linkx-fe/src/components/LxDescriptions/index.vue`、`types.ts`、`demo/basic.vue`
  - `linkx-fe/docs/components/lxdescriptions.md`、`docs/ROADMAP.md`、`docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/tests/unit/lx-descriptions.test.ts`、`tests/e2e/lx-descriptions-docs.spec.ts`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`、`MIGRATION-BACKLOG.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`PROJECT-HANDOFF.md`
- 完成内容：补齐 32px 紧凑行高、布局和标签宽度控制、复制字段与状态点；保留既有 Props、插槽及脱敏能力。浅色/HUD 深色辅助文字使用正文令牌；复制操作的可访问名称包含字段和值；描述网格适配窄屏并尊重减少动效设置。
- Impeccable 定向检查：评分 19/20，源码 detector 返回 `[]`。检查建议集中在辅助文字对比度、复制按钮可访问名称、窄屏约束和减少动效；已修改并由组件行为和浏览器用例复验。该定向结果不等于 UI-11 整库审查完成。
- 验证：`tests/unit/lx-descriptions.test.ts` 6/6；`tests/e2e/lx-descriptions-docs.spec.ts` 3/3，覆盖复制键盘焦点、32px 行高、状态展示、375/320px 抽屉边界、主题/减少动效及宿主加载/空/错误恢复；lx-ui 类型检查、构建、文档构建通过；lx-ui 文档 Playwright 全量 17/17。Vue3 全量 Vitest 基线 24 个文件、117 项通过。演示使用本地内存 Mock，不发起后端请求。
- 未完成/阻塞：Vue3 业务详情页尚未采用 `LxDescriptions`；UI-10 仍有 `LxStatusSwitch`、`LxTransferPanel` 和其他宿主候选待补；UI-11 整库组件/动效审查与复验未完成。权限中心、文本/字段权限和页面引导继续延期。
- 下一步：继续验收 `LxStatusSwitch`、`LxTransferPanel` 及其余被 Vue3 使用的组件；UI-10 结束后做完整 Impeccable 审查并落实建议、复验；之后才进入 Vue3 Element Plus 替换。顺序固定为 `design/` 基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 组件与整库审查 → Vue3 替换。Vue3 业务 API 保持 `.then().catch().finally()`。

## [2026-09-27] UI-02/UI-03 / LxStatusSwitch 设计与浏览器验收

- 目标：对照 `design/状态开关 StatusSwitch/` 补齐 lx-ui 组件、中文 API/Demo 和交互证据；遵守既定顺序，暂不替换 Vue3 宿主 ElSwitch。
- 改动文件：
  - `linkx-fe/src/components/LxStatusSwitch/index.vue`、`types.ts`、`demo/basic.vue`、`src/tokens/variables.css`
  - `linkx-fe/docs/components/lxstatusswitch.md`、`docs/ROADMAP.md`、`docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/tests/unit/lx-status-switch.test.ts`、`tests/e2e/lx-status-switch-docs.spec.ts`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`、`MIGRATION-BACKLOG.md`、`ELEMENT-PLUS-LX-UI-MATRIX.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`PROJECT-HANDOFF.md`
- 完成内容：保持布尔和旧 `0=开启/1=关闭` 映射；关闭操作可确认且取消不发出状态变更；提供只读、loading、失败恢复示例。轨道按设计固定 42×20px；为轨道文案增加对比度令牌、可见键盘焦点、减少动效和窄屏 44×44px 点按区域。Demo 保存逻辑使用 Promise 链风格的本地内存 Mock。
- Impeccable 定向复核：detector 对组件和 Demo 返回 `[]`；实测窄屏开关原触控盒宽 42px，修正为宽高至少 44px 并增加 Playwright 断言。该组件专项复核不等于 UI-11 整库审查。
- 验证：`tests/unit/lx-status-switch.test.ts` 6/6；`tests/e2e/lx-status-switch-docs.spec.ts` 3/3；完整 lx-ui 文档 Playwright 20/20。lx-ui 类型检查、构建（134 modules）、文档构建、定向 ESLint、Prettier 和 `git diff --check` 通过；文档构建仍有既有的大 chunk 警告。Impeccable detector 返回 `[]`。Mock 未访问后端。
- 未完成/阻塞：Vue3 宿主状态开关仍独立使用 Element Plus，需在后续 UI-04 替换波次核对数值映射和事件；`LxTransferPanel` 等其他组件、UI-10 整体闭环和 UI-11 整库 Impeccable 审查未完成。新增权限中心、文本/字段权限和页面引导继续延期。
- 下一步：继续验收 `LxTransferPanel` 及其余 lx-ui 候选；全部库级证据齐备后执行整库 Impeccable 审查、落实建议并复验，只有随后才开始 Vue3 Element Plus 替换。固定顺序为 `design/` 基础控件与动态图标 → `LxDynamicForm` → 其余 lx-ui 组件与整库 Impeccable 审查 → Vue3 Element Plus 替换；业务 API 继续使用 `.then().catch().finally()`。

## [2026-09-27] UI-02/UI-03 / LxTransferPanel 设计与浏览器验收

- 目标：按 `design/虚拟滚动树 + 双栏穿梭/` 补齐双栏穿梭行为、独立文档和移动端证据；Vue3 `DataPermissionTree` 替换继续等待其余组件闭环及整库 Impeccable 审查。
- 改动文件：
  - `linkx-fe/src/components/LxTransferPanel/index.vue`、`demo/basic.vue`
  - `linkx-fe/docs/components/lxtransferpanel.md`、`components/new-components.md`、`.vitepress/config.ts`、`ROADMAP.md`、`DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/tests/unit/lx-transfer-panel.test.ts`、`tests/e2e/lx-transfer-panel-docs.spec.ts`
  - `other-admin/admin-vue3/docs/ELEMENT-PLUS-LX-UI-MATRIX.md`、`MIGRATION-BACKLOG.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`PROJECT-HANDOFF.md`
- 完成内容：将设计稿的左侧“全选/反选”落实到组件；全选和中间批量加入会按 `maxCount` 原子拒绝溢出操作，并显示 disabled 状态。树勾选更新会保留树外未加载键及已有禁用键；反选只翻转当前已加载、未禁用节点。右侧单项删除和清空即使初始选择超限仍可用；新增 `clear-all` 事件。文档明确 `change.nodes` 只包含当前树可解析节点，不伪造未加载数据。
- 验证：TransferPanel 单测 4/4、文档 Playwright 3/3；Vue3 Vitest 全量 26 个文件/127 项；Vue3 定向 ESLint 和 TypeScript 检查通过；lx-ui `vue-tsc --noEmit`、134 modules 构建、VitePress 文档构建、定向 Prettier 检查及 `git diff --check` 通过。浏览器检查覆盖批量状态、加载/空/错误恢复、375px 无横向溢出、44px 触控区域、焦点环、HUD 深色与减少动效设置。示例使用本地数据，不访问后端。文档构建仍有既有的大 chunk 警告。
- 未完成/边界：Vue3 `DataPermissionTree` 仍是业务实现，尚未采用 `LxTransferPanel`；后续替换时需对照 props、exposes、树勾选和父级回传契约并补真实宿主 Mock/E2E。本次未新增权限判断；UI-10 仍有其他 lx-ui 候选待补，UI-11 整库 Impeccable 审查未开始。
- 下一步：继续其他候选组件的设计、Demo、行为与浏览器验收；全部闭环后再按用户要求执行 Impeccable 组件/动效审查、落实建议并复验，之后才开始 Vue3 Element Plus 替换。顺序仍为基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 组件和 Impeccable → Vue3 替换；新权限中心、文本/字段权限、页面引导延期，业务 API 写法保持 `.then().catch().finally()`。

## [2026-09-27] UI-02 / 新增组件总览浏览器复核

- 目标：复查此前交接里记录的 `LxSelectPagination` 因 `targetMap['user-02']` 失败导致总览白屏。
- 发现：当前 `LxSelectPagination.externalItem` 可在目标映射缺失时安全回退到值标签；新增组件总览桌面实测能完整渲染，运行时没有报错。该白屏线索在当前代码上未复现，本轮没有改动组件实现。
- 改动文件：`other-admin/admin-vue3/tests/e2e/lx-new-components-overview-docs.spec.ts`、`doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-HANDOFF.md`。
- 验证：文档 Playwright 2/2。桌面检查新增组件分区、远程分页选择、虚拟树、穿梭示例及无运行错误；375px 检查页面内容可见且无横向溢出。演示使用本地数据，无真实后端请求。
- 后续：此复核不改变 Vue3 组件替换门槛；继续按基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 组件及 Impeccable 整库审查 → Vue3 Element Plus 替换推进。

## [2026-09-27] UI-02/UI-03 / LxActionButtons 键盘与窄屏验收

- 目标：补齐高频行内操作组件的真实按钮语义、溢出操作键盘交互及浏览器证据；严格保持 `design/` 基础控件与动态图标 → `LxDynamicForm` → 其余 lx-ui 组件和 Impeccable 整库审查 → Vue3 Element Plus 替换的既定顺序。
- 改动文件：
  - `linkx-fe/src/components/LxActionButtons/index.vue`、`types.ts`
  - `linkx-fe/docs/components/lxactionbuttons.md`、`docs/ROADMAP.md`、`docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/tests/unit/lx-action-buttons.test.ts`、`tests/e2e/lx-action-buttons-docs.spec.ts`
  - `other-admin/admin-vue3/docs/ELEMENT-PLUS-LX-UI-MATRIX.md`、`MIGRATION-BACKLOG.md`、`MIGRATION-MATRIX.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`PROJECT-HANDOFF.md`
- 完成内容：把行内链接改为原生按钮，添加 `disabled` 和稳定 `key` 类型；“更多”现在点击展开，可由 Tab/Enter/Space 操作，Escape 关闭并恢复焦点，焦点移出或点击外部时收起；自定义 `moreText` 用于可见按钮和辅助名称。窄屏点按目标至少 44px，溢出列表受视口宽度约束并允许长文案换行，减少动效设置会停用过渡。
- Impeccable：按局部 harden 流程核对现有设计；代码 detector 结果已复核为 `[]`。这不代表 UI-11 整库组件/动效审查已完成。
- 验证：`tests/unit/lx-action-buttons.test.ts` 3/3；`tests/e2e/lx-action-buttons-docs.spec.ts` 3/3，覆盖原始 action 事件、hidden/disabled、键盘展开、Escape 焦点恢复、外部点击/焦点移出收起、375px 44×44px 点按/菜单边界、HUD 深色及减少动效。Vue3 与 lx-ui 类型检查、定向 ESLint、组件/测试/API 页 Prettier 检查、lx-ui 构建和文档构建通过；既有的大块 Markdown 文件全文件 Prettier 检查在暂存基线中也失败，未对整篇重排。构建仍有已记录的大 chunk 提示。Demo 使用本地静态数据，不请求后端。
- 未完成/边界：Vue3 约 29 处 `ActionButtons` 仍由宿主组件实现；`buttons` 与预设 `actions`、逐项 `onClick`、Element Plus 图标到 `LxIcon` 映射、`gap`、disabled 及权限语义须在后续适配中逐项保留。本轮没有修改宿主页面、Element Plus 导入或权限流程。
- 下一步：继续补 `LxMetricCard`、`LxAuthImg` 及其余 Vue3 实际替换候选的契约、Demo 与行为/浏览器证据；候选闭环后先进行 Impeccable 整库审查、处理建议并复验，之后才能开始 Vue3 组件替换。全量 Vue3 替换后再做整站审查。

## [2026-09-27] UI-02/UI-03/UI-10 / LxMetricCard 设计与宿主兼容验收

- 目标：对照 `design/指标卡 MetricCard/` 完成 lx-ui 组件契约和独立验收，保留 Vue3 宿主旧接口；遵守基础控件/动态图标 → `LxDynamicForm` → 其他 lx-ui 组件与 Impeccable → Vue3 Element Plus 替换顺序。
- 改动文件：
  - `linkx-fe/src/components/LxMetricCard/index.vue`、`types.ts`、`demo/basic.vue`、`src/index.ts`
  - `linkx-fe/docs/components/lxmetriccard.md`、`docs/components/new-components.md`、`.vitepress/config.ts`、`docs/ROADMAP.md`、`docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/tests/unit/lx-metric-card.test.ts`、`tests/e2e/lx-metric-card-docs.spec.ts`
  - `other-admin/admin-vue3/docs/ELEMENT-PLUS-LX-UI-MATRIX.md`、`MIGRATION-BACKLOG.md`
  - `doc/lx-ui/COMPONENT-SPEC.md`、`COMPONENT-STYLE-INTERACTION.md`、`PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`PROJECT-HANDOFF.md`
- 完成内容：按设计稿补 `title` / `status` / `badgeText` / 进度标签与格式化进度值；保留 lx-ui `label` / `badge` 与 Vue3 宿主 `valueType` / `footer` 及 `title`、`value`、`footer`、`extra` 插槽。显式 `status` 优先于旧 `valueType`，标题和角标属性/插槽的优先级写入 API 文档。趋势方向改用 LxIcon `arrow-up` / `arrow-down`，趋势状态语义色保持高对比；进度值限制在 0–100，提供 `aria-label` 和 `aria-valuetext`，RTL 下从右侧展开。
- Impeccable 定向检查：首轮发现普通小字沿用 secondary token 对比度仅 3.24:1、浅色 warning 数值不足大号文字 3:1，且进度条过渡 `width` 会触发布局。小字改用高对比正文令牌，趋势文字保留状态语义色并在浅色及 HUD 主题验证 ≥4.5:1；浅色 warning 数值调深、HUD 沿用主题令牌；进度填充改用 transform 缩放固定轨道，并尊重减少动效。桌面浅色及 320px HUD 截图已检查；本轮 detector 返回 `[]`。此为 MetricCard 定向复核，不代表 UI-11 整库审查完成。
- 验证：lx-ui `vue-tsc --noEmit`、Vue3 `vue-tsc --noEmit` 均通过；MetricCard 单测 6/6、文档 Playwright 2/2。浏览器用例验证旧 API 展示、进度读屏名称/值、三种趋势语义图标、浅色和 HUD 主题正文/趋势文字 ≥4.5:1、大号值 ≥3:1、320px 无横向溢出、超长标题换行及减少动效时关闭过渡。lx-ui 构建通过（134 modules），VitePress 文档构建通过；保留既有大 chunk 警告。Prettier 定向写入与 `--check` 通过，测试文件 ESLint 通过；lx-ui 无独立 ESLint 配置，Vue3 ESLint 忽略仓库外的 `linkx-fe` 文件。示例为静态数据，没有真实接口请求。
- 未完成/边界：Vue3 `ClientDetailDrawer.vue` 仍有 6 个宿主 `<MetricCard>`，尚未替换为 `LxMetricCard`，须在 UI-04 对照旧 `valueType`、插槽和抽屉组合回归。UI-11 整库审查、Vue3 组件替换及 UI-12 全站审查均未完成。
- 下一步：继续 `LxAuthImg` 和其余实际宿主替换候选；候选库级契约、Demo 和行为/浏览器证据闭环后，执行完整 Impeccable 组件/动效审查并吸收建议、复验，再开始 Vue3 Element Plus 替换。Vue3 全量替换稳定后另做整站审查。

## [2026-09-27] UI-10 / LxMetricCard 趋势动态图标与对比度复验

- 目标：复验趋势语义色调整，并确保设计资产中的动态图标真正用于指标卡；继续遵守 `design/` 基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 组件及整库 Impeccable → Vue3 Element Plus 替换的顺序。
- 改动：MetricCard 趋势方向由 Unicode 箭头改为库内 `LxIcon` `arrow-up` / `arrow-down`；新增状态映射单测和文档浏览器断言，减少动效时同时检查图标过渡已关闭。同步 API、组件设计规格、路线图、交付核查、项目地图和总计划。
- Impeccable 定向复核：修正后的 detector 对组件与 Demo 返回 `[]`；320px HUD 实际浏览器截图无横向溢出，标题、状态色和指标布局正常。浅色/HUD 趋势文字对比度均由 Playwright 检查达到 4.5:1，warning 大号值达到 3:1。
- 验证：MetricCard 单测 6/6、文档 Playwright 2/2；lx-ui 和 Vue3 `vue-tsc --noEmit`、lx-ui 构建（134 modules）、VitePress 文档构建、定向 ESLint/Prettier、`git diff --check` 均通过。文档构建有既有 500 kB chunk 警告；示例为静态数据，不请求后端。
- 未完成/边界：Vue3 详情抽屉 6 处旧 `MetricCard` 尚未替换；此为单组件定向检查，不代表 UI-11 整库 Impeccable 审查完成。Vue3 批量 Element Plus 替换仍未开始。
- 下一步：继续补齐 `LxAuthImg` 和其他实际宿主候选的 API/Demo、行为和浏览器证据；全部闭环后开展 Impeccable 整库审查、落实建议并复验，再进入 Vue3 替换。权限中心、文本/字段权限与页面引导仍延期；业务 API 继续使用 `.then().catch().finally()`。

## [2026-09-27] UI-02/UI-03/UI-10 / LxAuthImg 台账与验收复核

- 目标：将 `LxAuthImg` 库级交付、文档与浏览器证据同步到计划台账；继续遵守 `design/` 基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 组件及完整 Impeccable 审查 → Vue3 Element Plus 替换的顺序。
- 文档改动：修正 UI-03 中 `LxMetricCard` 单测数为 6；将 `LxAuthImg` 的独立文档、6 项单测和 3 项文档 Playwright 纳入 UI-02/UI-03；补齐 lx-ui 交付核查的 MetricCard/AuthImg 专项证据概览；Vue3 单测基线更新为 29 个文件、142 项。
- 验证：Vue3 全量 Vitest 29/29 文件、142/142 项通过；AuthImg 文档 Playwright 3/3；Vue3 与 lx-ui 类型检查通过；lx-ui 构建通过（134 modules）；VitePress 文档构建通过但保留既有大 chunk 警告；定向 ESLint 通过；AuthImg 组件与 Demo 的 Impeccable detector 返回 `[]`。本轮未改 UI 代码，因此没有运行代码格式化。
- 格式现状：`linkx-fe/docs/DELIVERY-CHECK.md` 的 Prettier 检查通过；`doc/PROJECT-DELIVERY-PLAN.md` 与 `doc/PROJECT-HANDOFF.md` 在本轮和暂存版本检查时均未通过全文件 Prettier，且 `git diff --check` 检出既有 Markdown 硬换行尾空格。没有对两份含大量既有改动的长文档做全文件重排。
- 未完成/边界：detector 为空只说明 AuthImg 本轮静态检查未报项，不等于 UI-11 整库 Impeccable 审查。Vue3 鉴权适配器、详情抽屉与其他候选尚未替换；真实鉴权后端联调未执行。UI-10 其余候选、UI-11 整库审查、UI-04 替换及 UI-12 整站审查仍未完成；新增权限中心、文本/字段权限和引导页继续延期。
- 下一步：核对 UI-10/迁移矩阵中仍未完成库级证据的实际宿主候选，逐个补设计映射、API/Demo、行为测试与浏览器验收；完成后先做 Impeccable 组件/动效整库审查、吸收建议并复验，再开始 Vue3 Element Plus 组件替换。业务 API 保持 `.then().catch().finally()`。

## [2026-09-27] UI-02/UI-03/UI-10 / SectionTitle 补验与 Impeccable 预检建议吸收

- 目标：按已确认顺序维护组件库验收证据：`design/` 基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 组件与 Impeccable 整库审查 → Vue3 Element Plus 替换。
- 完成内容：复验 `LxSectionTitle` 的字号、三种标题变体、`tag`/`tagType` 和 Vue3 旧适配器兼容。图标 hover/focus 改用自然减速曲线，warning/email 保留短时微动效；上传进度填充改用固定轨道上的 `transform`，并在 `prefers-reduced-motion` 下关闭过渡。
- 文档同步：更新 lx-ui 路线图、交付核查、SectionTitle/LxIcon/LxUpload API 文档、Vue3 组件替换矩阵、迁移 Backlog、项目地图、本计划和本交接日志；UI-11 保持进行中，正式整库审查仍等待 UI-10 组件闭环。
- Impeccable detector 预检：首轮发现 LxIcon 弹性曲线、LxUpload 进度 `width` 过渡及 LxSidebar/LxSplitLayout 两处宽度布局过渡。已按建议修改图标 easing 和上传进度实现；复扫只剩 Sidebar/SplitLayout 两项。它们是否保留需结合各自真实布局交互和减少动效检查，在正式整库审查时处理；本次不是 UI-11 全库结论。
- 验证：SectionTitle 单测 13/13、文档 Playwright 1/1（含截图与 320/375px 长标题检查）；LxIcon 单测 5/5，桌面和 Pixel 7 浏览器各 1/1；LxUpload 单测 4/4、Chromium 文档 Playwright 3/3（进度 transform 与减少动效）；Vue3 类型检查、相关 E2E ESLint/Prettier、lx-ui 类型检查、134 modules 构建及 VitePress 文档构建通过。文档构建保留既有大 chunk 提示，pnpm 保留现有 `onlyBuiltDependencies` 字段告警。`git diff --check` 通过；截图已在浏览器查看 SectionTitle 的 320px 布局。
- 未完成/边界：其他实际替换候选仍有库级 Demo/状态/键盘/响应式证据待闭环；Sidebar/SplitLayout 布局动画仍待正式审查。此次没有开始 Vue3 Element Plus 批量替换，也没有执行全站 Impeccable；权限中心、文本/字段权限和引导页继续延期。
- 下一步：继续 UI-10 尚未闭环的 lx-ui 候选；达到门槛后完整运行 Impeccable 审查、吸收建议并复验，再进入 Vue3 替换。Vue3 全量替换完成后再做 UI-12 整站审查；业务 API 继续使用 `.then().catch().finally()`。

## [2026-09-27] UI-11 / LxEmpty Impeccable 使用校准与定向复验

- 目标：确认静态 detector `[]` 是否被正确解释，并完成 `LxEmpty` Demo 修复与浏览器复验；完整组件库审查仍依赖 UI-10 所有组件闭环。
- 改动文件：
  - `linkx-fe/src/components/LxEmpty/demo/basic.vue`
  - `linkx-fe/docs/components/lxempty.md`
  - `other-admin/admin-vue3/tests/e2e/lx-empty-docs.spec.ts`
  - `AGENTS.md`、`doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-HANDOFF.md`
- 完成内容：主按钮前景使用 `--lx-color-on-primary`；“新建映射”改为添加可见的本地记录，并可恢复初始空态；无匹配结果可清除筛选并重新应用。状态变更后将键盘焦点交给结果列表，返回时恢复到对应操作按钮。中文组件文档同步说明创建结果和双向恢复示例。
- Impeccable 评估：独立设计评估为 34/40（10 项启发式均适用，0 项明确 P1/P2）；修复前评分为 28/40，发现按钮对比度、无真实创建结果及单向筛选三个问题，本轮全部修复。当前源码 detector 对 `index.vue` 与 Demo 均返回 `[]`，仅表示静态规则零命中。隔离 detector Agent 的 Chromium/Edge 回退 overlay 与主会话 Playwright 复核一致：亮色 3 项，HUD 6 项。3 项重复页面壳命中分别是隐藏的 VitePress 复制按钮、VitePress 文档容器的列高启发式以及 Element Plus 全局折叠过渡；HUD 额外 3 项落在同一个 LxIcon 搜索 SVG 的 path 上，命中青色深底规则。项目 `theme-hud.css` 明确将 HUD 主色设为 sky/cyan，该发现是有设计来源的令牌用法而非组件误配，保留并记录；本轮未发现实际组件低对比度项。隔离设计 Agent 以 Playwright 截图加源码完成评估；它的子会话没有浏览器，交互焦点改由主会话 Playwright E2E 实测。
- 验证：`tests/e2e/lx-empty-docs.spec.ts` 1/1；覆盖浅色和 HUD 正文/按钮对比度、创建和恢复、筛选往返、列表/按钮焦点、44px 操作区、375/320px 无横向溢出与减少动效。Vue3 定向 ESLint、Prettier 检查通过；lx-ui `vue-tsc --noEmit`、134 modules 构建、VitePress 文档构建通过。文档构建仍提示已有大 chunk；pnpm 提示 `package.json` 内 `onlyBuiltDependencies` 字段位置将被忽略。局部视觉截图和 overlay 截图在 `other-admin/admin-vue3/test-results/`，本地文档预览仍为 `http://127.0.0.1:4174/components/lxempty.html`，Impeccable helper 已停止。
- 未完成/边界：Vue3 15 处 `el-empty` 宿主用法未替换；UI-10 仍有组件待验收，UI-11 的 LxIcon/LxSidebar/LxSplitLayout 等整库组件与动效审查仍未完成。此次只完成 LxEmpty 定向复查，不代表整库或 Vue3 全站审查；权限中心、文本/字段权限和引导页继续延期。
- 下一步：继续按 `design/` 基础控件与动态图标 → `LxDynamicForm` → 其余 lx-ui 组件 → Impeccable 整库审查及复验 → Vue3 Element Plus 替换推进；替换完成后再做 UI-12 整站审查。业务 API 调用继续保持 `.then().catch().finally()`。

## [2026-09-27] UI-11 / Impeccable Critique 流程核验与状态更正

- 目标：核实 `detect.mjs` 多次返回 `[]` 是否代表 Impeccable 审查通过，并按 skill 规范纠正计划台账。
- 核验依据：已安装 Impeccable `reference/critique.md` 明确要求两路隔离评估、可浏览目标各自新建浏览器标签、detector 与浏览器 overlay 证据、完整综合评审，以及将快照写入 `.impeccable/critique` 并记录趋势。`critique-storage.mjs trend "linkx-fe/src/components/LxEmpty/index.vue" 5` 返回空数组，`latest` 无该目标记录。历史 Assessment A 明确使用主会话截图而未在自己的新标签查看；Assessment B 记录 HUD 切换后未单独重跑 detector。
- 结论：此前确实有启发式评分、静态扫描、overlay 和行为测试，但没有完成 Impeccable `critique` 的全部硬性步骤。28/40 与 34/40 保留为阶段性人工评审记录，不作为正式验收；detector `[]` 只表示对应源码扫描零命中。
- 文档改动：更新 `AGENTS.md` 的正式 Critique 门槛、`doc/PROJECT-DELIVERY-PLAN.md` 的 UI-11 顺序/状态、`doc/PROJECT-MAP.md` 的 LxEmpty 状态及 `linkx-fe/docs/DELIVERY-CHECK.md` 的 LxEmpty 说明；正式评审未闭环，不推进 UI-11 完成状态，也不改变 UI-10 组件完成后再 Vue3 替换的既定次序。
- 验证：`critique-storage.mjs trend` 确认当前无快照；`latest` 确认无目标记录。文档修改后 `git diff --check` 通过；Prettier 检查中 `AGENTS.md` 与 `DELIVERY-CHECK.md` 通过，计划和交接长文档仍有既有全文件格式差异，未作整篇重排。本次只更正文档和协作规则，没有修改 UI，因此未运行 detector 或浏览器测试。
- 后续正式评审：待 UI-10 组件闭环后，按 Impeccable `critique.md` 为设计评估与 detector/浏览器证据分别安排隔离评估；二者各自开新标签检查，覆盖所有实际使用主题/状态，提交含启发式评分、优先问题、误报核验的完整报告，并保存快照/趋势。任何条件不可用时标为阶段性/降级，不以 `[]` 代替审查。

## [2026-09-28] DEV-05 / 全菜单 Mock 复验交接与 UI-11 Impeccable 扫描诊断

- 目标：补齐全菜单 Mock E2E 的交接记录，并核实 Impeccable 经常返回 `[]` 是扫描错误还是正确的静态结果。
- 全菜单 Mock 复验：`pnpm test:e2e:preview --reporter=line` 最终 2/2 通过，首页、群组标签、北向页面可挂载，预览菜单共 10 组/32 个动态入口与静态首页，共 33 个入口；未配置 Mock 的 API 返回 501。首次冷启动时首页导航超时，Chromium 手动复现正常，完整重跑通过，根因未确认，作为稳定性观察项保留。Mock 服务继续运行于 `http://127.0.0.1:30847/h5/GroupTags`。
- Impeccable 诊断：直接执行 skill `detect.mjs --json` 扫描 `LxEmpty/index.vue` 和 `LxIcon/index.vue` 均输出 `[]`、退出码 0，说明这两个源码目标没有命中当前静态规则。2026-09-28 另复核 `linkx-fe/src/components/LxSidebar` 同为 `[]`、退出码 0；对本地 GroupTags URL 使用同一 CLI 时，stderr 报 `Puppeteer is required for URL scanning`、退出码为 1，但 stdout 仍输出 `[]`，且 `critique-storage trend` 对 Sidebar 返回空数组、没有正式快照。URL 结果是扫描失败，不能记录为零命中。此前通过 skill `live-server.mjs --background` 在 VitePress 新标签实际注入 `/detect.js` 成功，浏览器控制台报告 3 条 anti-pattern；页面标注涉及 Inter 字体占比、height/padding 过渡、首屏单栏及代码区透明度提示，需按实际目标核对文档壳和代码示例，不能把 overlay 数量直接当成组件缺陷。诊断标签和临时文档服务已关闭，Impeccable helper 已停止。
- 本轮复测：`context.mjs --target linkx-fe/src/components/LxIcon/index.vue` 识别到目标源码，但报告本会话没有自动 detector hook，要求 UI 完成后手动扫描。源码 CLI 输出 `[]`、退出码 0；把当前图标文档 URL 直接传给 CLI 后，stderr 报 Puppeteer 缺失、退出码 1，stdout 仍是 `[]`。该目标 `critique-storage trend` 仍为空；本地 `127.0.0.1:4174/components/lxicons.html` 当前拒绝连接，因此本轮没有运行浏览器 overlay 或正式 Critique，也没有生成评分/快照。
- 结论与规则：此前若只看 stdout 的 `[]`，确实存在误判。今后必须同时核对 JSON、stderr、退出码；源码扫描与运行时浏览器 overlay 分开记录。URL CLI 缺 Puppeteer 时按失败处理，并在浏览器自动化可用时走 skill 的 overlay 注入路径；overlay 逐条核对命中后再综合，不以静态扫描、阶段性评分或构建结果替代正式 Critique。
- 文档同步：更新 `AGENTS.md`、总交付计划、项目地图、lx-ui 路线图和交付核查；将 LxEmpty 的 28/40、34/40 及 LxDescriptions 的 19/20 明确标为阶段性证据。UI-11 仍等待 UI-10 组件闭环后按 skill 完成双路隔离评审、主题/状态浏览器证据、综合报告及 `.impeccable/critique` 快照/趋势。
- 本步边界：本次是 detector 使用路径诊断，不是正式 Impeccable Critique；未生成评分或快照，也未调整组件代码。Vue3 Element Plus 替换仍按既定顺序等待 UI-10/UI-11；权限中心、文本/字段权限及引导页仍延期。
- 下一步：继续补齐 UI-10 的库级组件证据；正式评审时为设计评估和 detector/浏览器证据安排两个隔离评估，各自新建浏览器标签，按实际主题/状态注入并复查，写入报告和快照后修复、有限复验；再推进 Vue3 组件替换。业务 API 继续使用 `.then().catch().finally()`。

## [2026-09-28] UI-10 / LxSidebar 交互与组件文档验收

- 目标：完成 LxSidebar 交互补强并以实际文档浏览器验证 expanded/rail 与移动抽屉行为；Vue3 宿主迁移仍受 UI-10/UI-11 顺序约束。
- 完成内容：分组按钮提供 `aria-expanded` 和键盘切换；直达项/二级项每次只触发一次 `select`，无路径项使用按钮；rail 子项浮层可键盘打开、Escape 关闭并还焦点；移动端抽屉提供对话框语义、焦点进入/循环/返回，支持 Escape、遮罩和菜单选择关闭；侧栏动效尊重减少动效设置。Demo 展示选择次数、移动入口和 HUD 主题，中文 API 文档同步更新。
- 验证：`tests/e2e/lx-sidebar-docs.spec.ts` Chromium 2/2；组件库 `pnpm typecheck`、`pnpm build`（134 modules）、`pnpm build:docs` 通过，文档构建有既有大 chunk 提示；Vue3 ESLint 对 E2E 文件通过，Vue3 Prettier 对本步变更组件、Demo、文档和测试文件 `--check` 通过。实际打开 VitePress 页面并检查 expanded 示例渲染，375px 移动抽屉交互由 E2E 实测。
- 未完成/边界：这是 LxSidebar 定向行为和文档验收，不是 UI-11 正式视觉/动效 Critique；静态 `detect.mjs` 的 `[]` 不作为通过。UI-10 仍有其他高频组件待闭环，Vue3 当前侧栏仍使用权限路由驱动的 Element Plus `el-menu`/`SidebarItem`，需在后续 UI-04 保留菜单搜索、“全部菜单”目录、权限和路由激活语义后替换；新权限中心、文本/字段权限及引导页继续延期。
- 下一步：继续补齐 UI-10 其余待替换组件的 API/Demo、行为与浏览器证据；UI-10 闭环后执行正式 Impeccable 双路组件/动效审查及复验，再进入 Vue3 页面替换。Mock 预览服务运行状态按实时端口和浏览器页面核验，不沿用旧交接状态推断。

## [2026-09-28] DEV-07 / 全菜单 Mock 稳定截图与服务复验

- 目标：确认全菜单 Mock 仍可本地查看，并留存菜单目录与首屏样例的稳定画面，供后续继续验收。
- 运行状态：`127.0.0.1:30847` 由 `vite --mode mock-preview --host 127.0.0.1 --strictPort` 提供；本轮确认端口监听、浏览器页面可访问，数据来自本地内存 Mock，未知接口返回 501，不代理真实后端。服务保持运行，入口为 `http://127.0.0.1:30847/h5/GroupTags`。
- 完成内容：浏览器首屏显示 5 条群组标签样例；全菜单弹窗显示 33 项并以内部滚动呈现全部目录。稳定截图等待 280ms 过渡结束后生成于 `other-admin/admin-vue3/test-results/mock-preview-all-menus.png`。临时截图脚本复用项目指定的系统 Chrome，截图完成后已清理。
- 验证：`pnpm test:e2e:preview --reporter=line` 本轮 2/2 通过；截图脚本断言全菜单目录恰有 33 条链接。全量入口样例、目录筛选、未知接口、北向 CRUD、归档旧地址和 390/320px 布局均由专项预览 E2E 覆盖。`4174` 文档预览端口当前未监听，与 `30847` Mock 预览相互独立。
- 未完成/边界：此项只证明 33 个入口首屏与全菜单目录可预览，不代表各业务深层操作、完整权限组合或真实后端联调完成；冷启动超时原因仍待观察。
- 文档同步：更新总交付计划 DEV-06 证据、项目地图 Mock 预览入口、迁移 Backlog 与迁移矩阵，并更新本交接记录。只生成截图产物，未改业务代码。
- 下一步：保持 Mock 服务运行，继续按 `design/` 基础控件与动态图标 → `LxDynamicForm` → 其余 lx-ui 候选及正式 Impeccable 审查 → Vue3 Element Plus 替换顺序推进。

## [2026-09-28] UI-10 / LxSplitLayout 交互闭环

- 目标：按 `doc/lx-ui/COMPONENT-STYLE-INTERACTION.md` 完成分栏布局独立文档、键盘/鼠标调整、折叠和窄屏回归；保持 UI-10 → UI-11 → Vue3 替换的既定顺序。
- 改动：新增 `linkx-fe/docs/components/lxsplitlayout.md`、状态 Demo 和 VitePress 导航；修复桌面折叠时主区被网格自动放到下一行；调整上限测量以扣除真实分隔条、控制按钮和间距；零宽 DOM 回退到受控宽度；容器收窄触发自动限宽时发出 `resize` 同步宿主；移动端纵向布局不覆盖宿主宽度。
- 验证：`tests/unit/lx-split-layout.test.ts` 3/3；`tests/e2e/lx-split-layout-docs.spec.ts` 3/3，覆盖 1920px 键盘/拖动、桌面折叠同行、375px 表格局部滚动和 44px 按钮、HUD 深色及减少动效。Vue3 `vue-tsc --noEmit`、定向 ESLint/Prettier、lx-ui `pnpm typecheck`、134 模块库构建及 VitePress 文档构建通过；VitePress 有既有大 chunk 警告。
- 本地预览：VitePress 服务保持运行于 `http://127.0.0.1:4174/components/lxsplitlayout`，已在浏览器打开并确认页面标题；全菜单业务 Mock 服务仍在 `http://127.0.0.1:30847/h5/GroupTags`，本轮 HTTP 200。
- Impeccable：本步未执行 detector 或正式 Critique；库组件仍在 UI-10 阶段，UI-11 要在候选组件闭环后完成两路隔离评审、各自新标签、实际主题/状态 overlay、综合报告和快照/趋势。源码扫描 `[]` 仅是静态规则零命中，URL 扫描若 stderr 或退出码失败必须记录为失败，不能拿 stdout `[]` 代表通过；相关流程诊断见本文件 DEV-05 记录。
- 未完成/边界：Vue3 业务树/表页面尚未接入 `LxSplitLayout`；单独组件 Demo 通过不代表宿主业务迁移完成，真实后端不在本步范围。
- 文档同步：更新总计划、项目地图、lx-ui 路线图/交付核查、Vue3 迁移 Backlog/矩阵及本交接记录；`AGENTS.md` 已保留 detector JSON/stderr/退出码和正式 Critique 的强制标准。
- 下一步：继续 UI-10 的其余候选；UI-10 完成后正式执行 UI-11 并按建议有界修复复验，之后进入 Vue3 Element Plus 替换。Mock 业务 API 仍使用 `.then().catch().finally()`。

## [2026-09-28] UI-11 / Impeccable `[]` 与当前浏览器能力复核

- 目标：回应对 detector 多次输出 `[]` 的疑虑，区分静态零命中、浏览器 overlay 和正式 Critique。
- 静态扫描：按 skill 的 `detect.mjs --json` 扫描 `linkx-fe/src/components/LxIcon/index.vue` 与图标定义文件，stdout 为 `[]`、退出码 0 且无错误输出；这只表示该次静态规则没有命中，不评价视觉设计质量。
- 浏览器复核：在新标签打开 `http://127.0.0.1:4174/components/lxicons.html`，页面当前可访问并正常渲染。可用 CUA 页面接口支持可访问树和截图，但页面脚本执行接口是只读，不能设置标题或注入 `/detect.js`；依照 skill 的不可变更 fallback，本轮未启动 overlay helper、未宣称 overlay 已运行，也未将扫描结果写成视觉发现。
- 正式审查状态：`.impeccable/critique` 目录当前不存在；本轮没有两路隔离评估、完整 10 项启发式报告、主题/状态 overlay 或快照/趋势，因此不构成正式 Impeccable Critique。之前记录的源码 `[]`、阶段性评分与定向浏览器验收均保持各自证据边界。
- 结论：用户的疑虑成立在“把 `[]` 当整体验收”这一用法上；`[]` 本身并非异常。本轮 `LxIcon` 源码扫描是有效的静态零命中，当前浏览器 overlay 则因接口只读而未执行；正式 UI-11 仍等待 UI-10 闭环及满足隔离评估、浏览器证据与快照要求。
- 下一步：正式 Critique 中继续分别记录 detector JSON、stderr、退出码与浏览器能力；按 skill 创建两路隔离评估和各自的新标签。若当时不能注入 overlay，明确写 fallback 并按 skill 降级说明，不用静态 `[]` 补足缺失证据。

## [2026-09-28] UI-10 / LxDutyCalendar 库组件闭环

- 目标：完成 lx-ui 日历组件的文档、Demo、无障碍和响应式交互证据；继续保持 UI-10 完成后做 Impeccable UI-11、再做 Vue3 替换 UI-04 的顺序。
- 实现：新增独立中文 API/Demo 与文档侧栏入口；加入严格 `YYYY-MM` 解析/无效月份回退、42 格语义网格、方向键/Home/End 跨月焦点保持、日期自包含班次名称、主题化非本月日期和窄屏 44×44px 月份导航。Demo 只用内存样例，状态由宿主示例包装，不发网络请求，也不扩展业务 props。
- 测试：`tests/unit/lx-duty-calendar.test.ts` 8/8；`tests/e2e/lx-duty-calendar-docs.spec.ts` 3/3（Chromium）。覆盖周起始与闰年月份、非法月份回退、月份年份滚动、日期/班次事件、slot、键盘及跨网格焦点、宿主空/加载/错误恢复/只读、375/320px 内滚动、44px 按钮、浅色/HUD 对比度及减少动效。
- 失败修复：首轮 E2E 发现 Demo 从入口默认导入了组件库插件而非具名组件，导致日历未挂载；改为具名导入 `LxDutyCalendar` 后三项 E2E 通过，防止只凭文档构建误判 Demo 可用。
- 验证：lx-ui `pnpm typecheck`、`pnpm build`（134 modules）、`pnpm build:docs`、定向 ESLint/Prettier 和 `git diff --check` 通过。文档构建保留既有大 chunk 警告，pnpm 继续提示 `onlyBuiltDependencies` 配置位置已变更。
- Impeccable：本步没有运行 detector 或正式 Critique。用户对多次 `[]` 的疑问是合理的：静态 `[]` 只能表示静态规则零命中；整体验收还需设计评估、实际页面/主题检查、overlay 证据（若注入受限则记 fallback）和 `.impeccable/critique` 快照。该流程诊断及 UI-11 状态见上方 UI-11 记录；本步不把 `[]` 记作通过。
- 未完成/边界：未发现专属 `design/` 日历稿；Vue3 `DutyCalendar.vue` 尚未替换，其 `calendarList`、loading、完整详情 popover、`dutyTypeFilter`、月份查询事件和父级实例方法需在 UI-04 适配并做业务 Mock/E2E。库级日历不代表排班页迁移完成。
- 文档同步：更新 UI-02/03/10 总计划、项目地图、lx-ui 路线图与交付核查、Vue3 Element Plus/lx-ui 迁移矩阵及本交接记录。
- 下一步：继续 UI-10 其余待补组件；UI-10 全部闭环后，按 Impeccable skill 执行两路隔离 Critique、浏览器证据、综合报告和快照，然后开始 Vue3 Element Plus 替换。业务 API 继续使用 `.then().catch().finally()`。

## [2026-09-28] UI-10 / LxPagination API、Demo 与适配器回归

- 目标：补全 LxPagination 的中文 API/Demo 和受控事件回归，并回答静态 detector 多次输出 `[]` 是否代表 Impeccable 验收通过。
- 改动：文档补齐 `layout`、`background`、`update:page-size` 及事件触发顺序；修正 `doc/lx-ui/COMPONENT-SPEC.md` 中旧事件名；Demo 展示默认/自定义布局、背景、自动重置/滚动，分页文案使用 `zh-cn` locale，窄屏分页在可聚焦的局部横向滚动区。工作区原有库组件和 Vue3 `Pagination` 适配器改动已保留，本步新增 5 项库测试、2 项适配器测试和 3 项文档 Playwright。
- 验证：LxPagination 单测 5/5，宿主适配器 2/2，文档 Playwright 3/3；Vue3 全量 Vitest 34 个文件/173 项通过，`vue-tsc --noEmit`、lx-ui 类型检查、134 模块构建、VitePress 文档构建、定向 ESLint/Prettier 通过。文档构建保留既有大 chunk 警告，pnpm 提示 `onlyBuiltDependencies` 字段迁移。
- Impeccable 结论：本次按 skill 对 `LxPagination/index.vue`、Demo、文档 Markdown、Vue3 适配器运行静态 detector，stdout 为 `[]`、stderr 无错误、退出码 0；这是有效静态零命中。静态 `[]` 不代表页面没有视觉问题或 Critique 通过。此前本地 URL 扫描曾因 Puppeteer 缺失退出码 1，stdout 仍输出 `[]`，该情形是扫描失败。当前 `.impeccable/critique` 无正式快照，UI-11 仍待 UI-10 组件闭环；本步没有伪记正式评分或 overlay。
- 浏览器发现：首轮分页下拉呈现英文 `20/page`，与中文宿主不一致；Demo 加入 Element Plus `zh-cn` ConfigProvider 后，E2E 使用实际中文选项复验通过。VitePress 当前全局主题开关用于明暗状态验收。
- 边界：示例只用本地数据，没有业务 API。Vue3 共享适配器现在使用 LxPagination，但仍有 4 处页面直接使用 `el-pagination`；后续 UI-04 需逐页保留加载、空态和滚动语义，不能把组件级通过记作整页迁移或真实联调。
- 文档同步：更新总计划、项目地图、lx-ui 路线图与交付核查、Element Plus/lx-ui 映射矩阵、迁移 Backlog、组件规格和本交接记录。
- 下一步：继续 UI-10 其余组件；全部闭环后用 Impeccable 执行两路隔离评审、实际主题/状态 overlay、完整报告与快照/趋势，再进入 Vue3 Element Plus 替换。

## [2026-09-28] UI-10 / LxPasswordInput 文档与交互闭环、全菜单预览复验

- 目标：补齐密码输入组件资料缺口，并复核隔离 Mock 预览仍覆盖当前全部现役菜单和首屏样例。
- 改动：新增 `linkx-fe/docs/components/lxpasswordinput.md`、`linkx-fe/src/components/LxPasswordInput/demo/basic.vue`、组件站侧栏入口及 `other-admin/admin-vue3/tests/e2e/lx-password-input-docs.spec.ts`。既有组件实现和 Vue3 适配器保持原行为；Demo 覆盖明文切换、清空、只读、禁用、事件状态及 focus/blur/select，不访问 API。同步总计划、项目地图、迁移 Backlog、Element Plus/lx-ui 映射、lx-ui 路线图与交付核查。
- 验证：LxPasswordInput 文档 Playwright 3/3；Vue3 Vitest 34 个文件/173 项；全菜单 Mock 预览 2/2。预览验证 10 个分组、32 个动态菜单及首页共 33 个入口的首屏样例、全部菜单目录搜索跳转、未知 Mock API 检测和北向筛选/增改删。lx-ui `pnpm typecheck`、`pnpm build`（134 modules）、`pnpm build:docs`、Prettier 检查、`git diff --check` 通过。
- 浏览器复核：VitePress `http://127.0.0.1:4174/components/lxpasswordinput.html` 正常渲染，侧栏可见入口、标签可访问名称、密码值受遮蔽、只读/禁用状态和实例按钮均可见；预览服务 `127.0.0.1:30847` 保持运行。文档构建仍有既有大 chunk 提示，pnpm 提示 `onlyBuiltDependencies` 配置迁移。
- Impeccable：本步未运行 detector 或正式 Critique。整库 UI-11 仍待其余 UI-10 候选闭环后执行双路隔离评审、可用浏览器 overlay、综合报告和快照/趋势；静态 `[]` 不作为视觉验收。Vue3 登录、权限及文件真实后端联调仍按计划保留为未完成或阻塞项。
- 下一步：继续检查 UI-10 尚未闭环的组件/API 文档、Demo 和状态证据；库级 Impeccable 门槛完成后，按映射表逐波替换 Vue3 Element Plus 并回归页面契约。业务 API 保持 `.then().catch().finally()`。

## [2026-09-28] UI-10 / 壳层组件交互修复与 Impeccable 判定校准

- 目标：完成 `LxBreadcrumb`、`LxNavbar`、`LxTabsBar`、`LxPageCard` 文档 Demo 的失败 E2E，并核实 Impeccable 多次输出 `[]` 的原因。
- 发现：源码扫描 `linkx-fe/src/components/LxIcon/index.vue` 返回 `[]`、退出码 0，代表当前静态规则零命中；它不评价真实页面视觉。历史 URL CLI 缺 Puppeteer 的运行退出码为 1，虽然 stdout 仍有 `[]`，应判扫描失败。当前 `.impeccable/critique` 没有正式快照，UI-11 继续未完成；把 `[]` 当成整体 Critique 结论才是误用。
- 修复：通知徽标设置 `pointer-events: none`，避免遮住按钮点击点；面包屑 Demo 链接使用 `.test` 外部地址，避免 VitePress 捕获同源链接；有标题的 `LxPageCard` 使用 `useId()` 建立具名 region；页签测试精确匹配 trigger accessible name。窄屏检查改为度量组件容器，排除文档代码表格对整页 `scrollWidth` 的影响。
- 验证：`tests/e2e/lx-shell-components-docs.spec.ts` 4/4；Vue3 `vue-tsc --noEmit`、定向 ESLint 和 Prettier 检查通过；lx-ui `pnpm typecheck`、134 模块 `pnpm build`、`pnpm build:docs` 通过。文档构建保留既有大 chunk 提示。
- 文档同步：更新总计划、项目地图、lx-ui 路线图与交付核查、迁移 Backlog 和本交接记录。UI-10 仍有其他候选；UI-11 继续等 UI-10 闭环后按 Impeccable skill 做双路隔离评估、浏览器证据、综合报告和快照。
- 下一步：继续 UI-10 的其余组件状态和浏览器验收；正式 Critique 前分别记录 detector JSON/stderr/退出码与 overlay 注入结果，不以 `[]` 代替视觉判断。之后再开始 Vue3 Element Plus 组件替换及页面级回归。

## [2026-09-28] UI-11 / LxIcon Impeccable Critique 与 detector 范围核验

- 用户疑虑：反复看到 Impeccable 输出 `[]`，怀疑没有正确使用。
- 结论：疑虑有依据。针对 `LxIcon/index.vue` 的 detector 命令有效退出码 0、输出 `[]`，但只表示该源码目标的静态规则零命中。它不是设计评审，也不是浏览器页面扫描；把它当作整体通过属于误判。
- 方法：按正式 Critique 流程使用两个隔离评估。A 在新标签检查文档页、筛选/无结果和明暗主题；B 对源码运行 CLI detector，并在独立新标签验证动态注入、展示 overlay 和读取实际控制台。主会话再把 overlay 留在可见 `[Human]` 标签供复核。
- 证据：静态源码 `[]`/exit 0；浏览器页标题报 3 条、细项 4 条（`buried-raster`、`overused-font`、`layout-transition`、`first-viewport-column-overflow`），主要命中 VitePress 文档壳层/代码区，不直接归因于 LxIcon 图形实现。标题计数差异保留为 detector 报告问题。Live-server 已停止。
- 设计评审：27/40；主要问题为暗色组标题对比不足、P1/P2 组项目过多且全展开、尺寸规范和设计稿 24px 扩展用法不一致、双侧文档导航挤压正文。完整启发式、persona、认知负荷与建议已写入 `.impeccable/critique/2026-09-27T22-24-39Z__linkx-fe-src-components-lxicon-index-vue.md`；首次趋势只有 27/40。
- 补充动效证据：Critique 之后在可见浏览器抽查 `delete` 图标，悬停实际触发 `lx-icon-delete-shake`；模拟 `prefers-reduced-motion: reduce` 后 computed style 为 animation `none`、transform `none`、transition `0s`，恢复默认后 hover 动效重新生效。键盘 focus、其他代表性图标及动画中途状态仍未验证。
- 未覆盖：LxIcon 单目标 Critique 已完成，整库 UI-11 仍待 UI-10 其他组件闭环；Vue3 替换后仍需另做整站审查。
- 下一步：处理 LxIcon 页面发现并补其他代表性动效浏览器验证；继续其余 lx-ui 候选。组件替换次序保持基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 组件及整库审查 → Vue3 Element Plus 替换。

## [2026-09-28] UI-11 / LxIcon 卡片键盘焦点边框对齐

- 目标：修正文档图标卡片外侧蓝色焦点框与卡片边框分离的问题，同时保留清晰键盘焦点。
- 改动：`linkx-fe/docs/components/lxicons.md` 的焦点态改为卡片自身 2px 主色边框，移除额外 outline；固定 `box-sizing: border-box` 并限制过渡属性，避免边框状态改变卡片外部尺寸。`tests/e2e/lx-icon-docs.spec.ts` 增加焦点颜色、宽度、外框和前后尺寸断言。
- 验证：Playwright 图标文档用例 1/1 通过，覆盖图标全集、hover/focus 动效、减少动效、焦点边框状态和窄屏；ESLint、Prettier、`git diff --check` 及 VitePress 文档构建通过。手动浏览器确认桌面卡片为 108×84px，320px 视口文档宽度为 320px。构建保留既有大包和 pnpm 配置提示；VitePress 本地预览仍使用 4174 端口。
- 文档同步：更新总计划、项目地图、lx-ui Roadmap/Delivery Check 和本交接记录。Impeccable 静态 `[]` 没有作为视觉验收；以真实焦点状态截图与 E2E 结果记录本次改动。
- 未完成/边界：本次只修复 LxIcon 文档目录的卡片键盘焦点样式，不代表整库 UI-11 Critique 完成；其他代表性图标动画、暗色标题对比、分组浏览及尺寸契约仍待处理。
- 下一步：继续 LxIcon 其余视觉建议与动效覆盖，并推进剩余 UI-10 候选；维持基础控件/动态图标 → `LxDynamicForm` → 其他 lx-ui 组件 → Impeccable 整库审查 → Vue3 Element Plus 替换的顺序。

## [2026-09-28] UI-11 / LxIcon 焦点边框光学对齐复验

- 反馈：上一轮的 2px 蓝色卡片边框虽然没有造成尺寸变化，但视觉上仍与卡片自身的原边界错开。
- 证据：独立浏览器评估检查桌面焦点、hover 和 390px 窄屏；源码显示原边框为 1px，焦点加粗后内缘变化 1px。detector `--scope layout` 对 `lxicons.md` 输出 `[]`、stderr 空、退出码 0；这只表示本次静态规则零命中，不代替视觉检查。
- 修复：焦点态保留 1px 外边框并切换为主题主色，以 1px inset 主色线补足 2px 键盘焦点指标；无外扩 outline，卡片盒尺寸不变。
- 验证：`tests/e2e/lx-icon-docs.spec.ts` Playwright 1/1；该文件 ESLint、Prettier 检查、`git diff --check` 和 VitePress 文档构建通过。系统 Chrome 等待过渡结束后实测桌面卡片 108×84px、390px 视口 108.66×84px、320px 视口 132×84px，三个视口均为 1px 主色边框 + 1px inset 焦点线、无 outline/横向溢出；detector `--scope layout` 对文档源码 stdout `[]`、stderr 空、退出码 0，仅为静态零命中。
- 文档同步：更新交付计划、项目地图、组件交付核查和本交接日志。整库 UI-11 与 UI-12 仍未完成。
- 下一步：继续 LxIcon 主题/分组/尺寸建议和其他 UI-10 组件验收，再依计划完成组件库 Impeccable 审查和 Vue3 页面替换。

## [2026-09-28] UI-11 / LxIcon 焦点边框单线样式复验

- 反馈：此前 1px 边框加 1px inset 主色线仍像双层蓝框，视觉上不够整齐。
- 改动：焦点态只将卡片自己的 1px 边框切换为主题主色，并使用主色浅底；关闭 inset 阴影和 outline，让蓝色边界与卡片真实边界重合。
- 验证：`pnpm test:e2e:icons` 桌面 Chromium 与 Pixel 7 共 2/2 通过；覆盖图标全集、hover/focus 动效、减少动效、焦点边框颜色/宽度、主题浅底、无额外阴影/轮廓、焦点前后尺寸稳定和 320px 横向溢出。浏览器实测 email 图标键盘焦点样式与卡片边界对齐。`pnpm build:docs`、该 E2E 文件 ESLint/Prettier 检查、`git diff --check` 通过；文档构建有既有 chunk >500 kB 和 pnpm 配置提示。Impeccable layout detector 输出 `[]`、stderr 为空、退出码 0，只表示静态规则零命中。
- 文档同步：更新 LxUI Delivery Check、Roadmap、项目计划与本交接记录。
- 未完成：整库 UI-11 Critique、其他代表性图标动效、UI-10 剩余组件候选及 Vue3 替换后 UI-12 仍按既定计划跟踪。
