# LinkX 代码审查报告（lx-ui 与 admin-vue3 全量测评）

- 审查日期：2026-09-28
- 审查性质：静态代码审查。未执行运行时验证、单测、Mock 或浏览器验收；各项修复后需按 AGENTS.md 补对应回归证据。
- 质量基线：仓库 `AGENTS.md` + `doc/PERMISSION-CONTRACT.md`
- 审查方法：4 个分区并行审查 + 2 名独立校验员对全部 16 项初判 major 逐条双重复核。双校验一致确认 11 项 major；5 项经双校验一致降级为 minor；无一项判定为误报。
- 结论统计：**critical 0 项 / major 11 项 / minor 34 项，合计 45 项。**

路径约定：lx-ui 项位置相对 `linkx-fe/`，宿主项位置相对 `other-admin/admin-vue3/`。

## 1. 总体结论

两个工程的架构纪律执行良好：API 层 63 处 `await` 逐处核对全部为本地异步（表单校验、弹窗确认、动态 import），`@ts-ignore`/`@ts-expect-error`/`console.log`/`debugger` 全 src 零命中，权限码与契约文档一致，登出/账号切换的权限+动态路由+页面缓存清理完整，ProTable 远程模式竞态防护正确，未发现 Token 泄漏与"吞异常提示成功"路径。

问题集中在两类：

1. **异步基建的取消与竞态语义名不副实**：useFetch 声称的 AbortController 自动取消从未接入请求（#6），useTable 的写入时序绕过了 useFetch 的过期保护（#5），v-loadmore 指令在 Element Plus teleported 下拉下从未生效（#7）。
2. **"声称的能力与实现不符"**：install 全局注册对 21 个组件静默失效（#1）、hasChildren 虚假契约（#4）、AuthImg 注释失实（#9）、写操作提交锁在 4 处业务页缺失（#10）。

## 2. 审查范围

- **linkx-fe**：`src/index.ts`、`src/tokens/`、`src/permissions.ts`、`src/styles/`、vite.config、tsconfig、package.json；组件：LxProTable、LxDynamicForm、LxForm/LxFormItem、LxDialog、LxSearchBar、LxSelectTree、LxVirtualTree、LxSelectPagination、LxUpload、LxAuthImg、LxTransferPanel、LxDutyCalendar、LxPagination、LxPasswordInput、LxStatusSwitch、LxSplitLayout、LxDrawer、LxMetricCard、LxActionButtons、LxEmpty、LxSidebar 全系（Brand/Item/Group/Footer/Gauge/NodeBadge）。
- **admin-vue3**：`src/main.ts`、`src/utils/` 全部（http/auth/crypto/secure/pageLoading/createDialog/menuRouteMapper 等 14 个）、`src/router/` 全部（index/filterChain/10 个 modules）、`src/store/` 全部、`src/composables/` 全部、`src/layout/` 全部、`src/directives/`、`src/components/` 适配层 8 个、`src/views/` 抽查 10 个模块约 28 个文件（authority/auth、authority/userManage、baseData/thirdParty、baseData/globals、collaboration、h5/groupTags、shiftScheduling/dutyInformation、nodeManage/nodeManagement、thirdInterface/app、login）；横切 grep 覆盖全 src。

## 3. 合规正面确认

- API 链式规范：抽查页面除 userManage handleStatus 一处外全部 `.then().catch().finally()`；业务失败在 then 提示、网络异常由拦截器统一弹错、loading/提交锁在 finally 释放（EditUser、OffDutyDialog、AppManage、GroupManage、GroupTagsForm、login、globals 等均正确）。
- 竞态防护正面样板：ProTable 远程模式（seq + abortFetch + 过期丢弃）、`views/baseData/globals/index.vue`（请求序号 + pendingDeletes）、`views/shiftScheduling/dutyInformation/index.vue`（requestVersion）、`h5/groupTags/GroupTagsForm.vue`（submitting 锁）、`thirdInterface/app/components/AppManage.vue`（行级 statusLoadingMap）。
- 库内 LxAuthImg（requestId + AbortSignal 双重竞态防护、revoke、卸载清理）与 LxSelectPagination（跨页回显、取消不弹错、滚动监听 passive 且完整 detach）为样板实现。
- http.ts 响应拦截器：取消静默 reject、401 单次提示 + closeAllDialogs + endSession（清权限/路由/缓存后跳登录）、403 逐次提示。
- routerGuard：sessionEpoch 双重校验废弃账号切换期间的旧导航；filterChain 修改作用于 `cloneModuleRoutes()` 深拷贝，不污染模块定义。
- 权限码：`/admin/role/*`、`/admin/user/*`、`/admin/globals/*` 等与 `PERMISSION-CONTRACT.md` 一致，无臆造。
- lx-ui 纯净性：全组件目录 grep 无 axios/vue-router/pinia/登录凭据引入；LxActionButtons 的 `hasPermission` 为 `setupLxPermission` 宿主注入模式，合规。
- 指定扫描项零命中：`@ts-ignore`、`@ts-expect-error`、`console.log`、`debugger`。

## 4. Major 问题（11 项，双校验确认）

| # | 问题 | 位置 | 级别 |
|---|------|------|------|
| 1 | install 全局注册对 21 个无 name 组件静默失效 | `linkx-fe/src/index.ts:260-264` | major |
| 2 | LxSearchBar cascader 选项值被 String() 字符串化，number/boolean 默认值不回显、canReset 误判 | `linkx-fe/src/components/LxSearchBar/index.vue:109-129` | major |
| 3 | LxSelectTree 懒加载无 catch，失败时节点永久 loading + unhandled rejection | `linkx-fe/src/components/LxSelectTree/index.vue:86` | major |
| 4 | LxSelectTree `hasChildren` 类型契约声明零消费（未映射 isLeaf） | `linkx-fe/src/components/LxSelectTree/types.ts:9-12` / `index.vue:106` | major（校验分歧：1 票建议 minor） |
| 5 | useTable wrappedFetch 绕过 useFetch seq 保护，旧响应覆盖新页数据 | `admin-vue3/src/composables/useTable.ts:275-286` | major |
| 6 | useFetch AbortController 从未接入 fetchFn，cancel/abortPrevious 取消语义虚假 | `admin-vue3/src/composables/useFetch.ts:339-343`（注释 L6-7、L272-276 失实） | major |
| 7 | v-loadmore 指令在 EP teleported 下拉下从未生效，3 处业务触底分页静默失效 | `admin-vue3/src/directives/loadmore.ts:7-22` | major |
| 8 | License 读取失败时用全 false + 999 默认值覆盖已持久化状态 | `admin-vue3/src/store/modules/useUserStore.ts:160-210` | major |
| 9 | 宿主 AuthImg：无 onerror、切换无 abort 竞态、ObjectURL 泄漏、注释失实 | `admin-vue3/src/components/AuthImg/index.vue:43-76` | major |
| 10 | 写操作缺重复提交锁 ×4 处，双击可重复删除/创建/启停 | `admin-vue3/src/views/authority/auth/index.vue:98-152` 等 4 文件 | major |
| 11 | ColForm 远程搜索无竞态防护，旧结果追加污染新列表（选错人风险） | `admin-vue3/src/views/collaboration/components/ColForm.vue:207-255` | major |

### 4.1 明细与修复建议

**#1 install 注册失效**：`install` 中 `app.component(c.name ?? '', c)`，而纯 `<script setup>` SFC 编译产物仅有 `__name` 无 `name`，21 个组件（LxSidebar 全系 7 个、LxTag、LxActionButtons、LxPagination、LxEmpty、LxProTable、LxSelectTree、LxForm、LxFormItem、LxDialog、LxDrawer、LxFormErrorBanner、LxStatusDot、LxDynamicForm）全部以空名注册互相覆盖。`docs/.vitepress/theme/index.ts:14` 的 `app.use(LxUI)` 路径下这些组件的全局注册静默失效。
建议：为上述组件补 `defineOptions({ name: 'LxXxx' })`（与 LxSearchBar/LxIcon 既有做法对齐），或 install 改用显式 `Record<string, Component>` 注册表。

**#2 cascader 值字符串化**：`cascaderOptions` 第 114 行 `value: String(option.value)`，而 `LxSearchOption.value` 公开类型为 `string | number | boolean`，`cascaderValue` 原样返回模型值。EP Cascader 严格相等匹配：number 默认值初始不回显；交互后模型值变字符串，`isSameValue('1', 1)` 为 false，值未变时 canReset 误判可重置。Demo 恰好全用字符串值掩盖了该问题。
建议：去掉 `String()` 转换（EP Cascader 原生支持 number；boolean 不支持则收窄类型并加守卫），或让选项与模型值走同一规范化函数。

**#3 懒加载无失败处理**：`props.lazy?.(raw).then((children) => resolve(children))` 无 `.catch`。宿主注入的 lazy reject 时：resolve 永不调用（EP 树该节点永久转圈无重试路径）+ unhandled rejection。
建议：`.catch` 中 resolve 空数组结束 loading，并可增加 `lazy-error` 事件交宿主反馈。

**#4 hasChildren 虚假契约**：types.ts 声明"懒加载场景渲染展开箭头"，但实现零消费，`:props="{ label: 'title' }"` 未映射 isLeaf。叶子节点初始均显示展开箭头并触发无谓 lazy 请求。校验员对级别有分歧（major/minor 各一票），因属公开契约破坏保留 major。
建议：映射 `isLeaf`（`hasChildren === false` 时判定叶子），或删除虚假声明。

**#5 useTable 竞态绕过**：`wrappedFetch` 在 `fetchApi(params).then()` 内直接 `data.value = list; total.value = totalNum`。useFetch 的 seq 过期检查在 fetchFn resolve 之后才执行，只保护 useFetch 内部 ref，拦不住已发生的写入。快速翻页/搜索时旧慢响应后到会覆盖新数据。所有使用 useTable 的页面受影响。
建议：把 records/total 提取移到 useFetch 的 `onSuccess`（seq 检查通过后触发）；补"旧请求后 resolve"时序的回归单测。

**#6 useFetch 取消语义虚假**：创建了 AbortController 并在 abortPrevious 时 abort，但 `fetchFn(...args) => Promise<TData>` 签名无 signal 通道，controller 从未传入请求函数；http.ts 已提供的 `config.abort`/`abortFetch` 均未利用。cancel/reset 实际只丢弃结果（seq），请求照发。L6-7、L272-276 注释声称"自动取消"不实；`isAbortError` 分支几乎不可命中；无任何 abort/cancel 测试。
建议：为 fetchFn 提供信号通道（尾参 signal 或 options.getSignal），cancel() 同时调宿主从 http 返回值获得的 abortFetch；短期先修正注释为"仅丢弃结果、不中断请求"。

**#7 v-loadmore 失效**：指令在 mounted 时于宿主 el 内 `querySelector('.el-select-dropdown__wrap')`。EP 2.9.5 el-select 下拉默认 teleported 到 body 且懒渲染，宿主内必为 null 直接 return，scroll 监听永不绑定。且该类名是 Element UI 旧版结构，EP 2.x 应为 `.el-scrollbar__wrap`（即使 teleported=false 也选不中）。受影响：`views/authority/person/components/setRole.vue:283`、`views/collaboration/components/ColForm.vue:461`、`views/h5/carousel/components/CarouselForm.vue:455`（均未设 `:teleported="false"`）——三处远程搜索的触底分页从未生效，用户只能看到第一页。
建议：改为下拉首次展开后绑定（visible-change / popper-class 全局查找 / MutationObserver），修正选择器类名，unmounted 解绑，并补任一页面的 E2E。

**#8 License 失败覆盖**：`refreshLicenseAuthAction` 中 `newAuth` 初始全 false + `licenseState: 999`；`getLicenseInfo` 网络异常（catch 仅 console.error）或 `code !== 0` 时链继续执行，无条件 `setLicenseAuth(newAuth)`（写 localStorage）+ `licenseAuth.value = newAuth`。epoch 检查只防账号切换竞态，不防"失败保留旧值"。一次瞬时网络错误会把已持久化的 License 结论永久重置为"全部可用"，影响 LicenseFilter 菜单过滤与登录页过期警告。
建议：失败分支（网络异常与 code!==0）直接 return 已有 `licenseAuth.value`，仅成功时写入；补"接口失败不清除旧值"单测。

**#9 宿主 AuthImg 三重缺陷**：(a) XHR 无 onerror/ontimeout，非 200 时无失败反馈与占位；(b) watch authSrc 触发重载不 abort 旧请求，旧响应后到会把旧图写回 img.src（还会 revoke 属于新请求的 objectUrl）；(c) 无 onUnmounted revokeObjectURL，L11 注释"浏览器自动回收"不实，blob URL 随 authSrc 变化逐次泄漏至页面关闭。
建议：改 fetch + AbortController（切换时 abort 旧请求 + revoke 旧 URL）；补失败占位；onUnmounted 清理；修正注释。可参照库内 LxAuthImg 的实现。

**#10 提交锁缺失 ×4**：`views/authority/auth/index.vue`（handleDelete/handleStatus/handleSubmit 全文件无任何 loading 状态；EditRole footer 的 disabled 绑定的是 treeLoading 树加载而非提交锁，双击可重复 emit submit）、`views/baseData/thirdParty/index.vue:117-136`（删除）、`views/baseData/thirdParty/components/thirdPartyEdit.vue:108-129`（确定按钮无 :loading/:disabled，双击重复创建）、`views/authority/userManage/index.vue:117-125`（行内启停无确认弹窗可连点）。
建议：参照 GroupTagsForm 的 `submitting` 锁 + finally 释放；行级操作参照 AppManage 的 `statusLoadingMap`。

**#11 ColForm 远程搜索竞态**：`getUserListByPage` 无请求序号/取消，`userList.value = [...userList.value, ...records]` 追加式回写；remoteMethod 清空列表重置 pageNum 后快速输入时，旧关键词响应后到会把过期人员追加进新结果、pageNum 错位翻页、先完成请求的 finally 提前置 userLoading=false。发生在关联人员选择场景，可能选错人。
建议：请求序号方案（与 ProTable 内置机制一致），过期结果与过期 finally 均直接丢弃。

## 5. Minor 问题（34 项）

### 5.1 lx-ui（18 项）

| # | 问题 | 位置 | 建议 |
|---|------|------|------|
| L1 | unknown 表单值无守卫 as 断言直传 EP 控件（同文件 textValue 等已有守卫模式，number/input/select 缺失）【降级项】 | `LxDynamicForm/index.vue:252,267,301,315`、`LxSearchBar/index.vue:190,201-203,239` | 补 `numberValue` 等运行时守卫；option.value 断言处注明依据 |
| L2 | as any/any 共 5 处【降级项】 | `LxSelectTree/index.vue:38,55,82,89-90` | 导入 EP Tree 官方类型（TreeNodeData 等）替代 |
| L3 | watch data 无条件重置滚动与焦点，宿主 immutable 追加子节点时视图跳顶【降级项】 | `LxVirtualTree/index.vue:135-139` | 区分追加/替换场景或提供 `resetOnDataChange` |
| L4 | hideFooter=true 且无 footer 插槽时仍渲染空 footer 容器 | `LxDialog/index.vue:107-126` | 插槽提供条件改 `!hideFooter \|\| $slots.footer` |
| L5 | validate 事件声明的 fields 参数从不透传（catch 丢弃 EP reject 的字段对象）；resetFields 依赖首挂载初始值、不可见字段不重置，文档未说明边界 | `LxDynamicForm/index.vue:176-188` | catch 中透传 fields；注释/文档补边界 |
| L6 | onSelectionChange 对 rowKey 取值无空值过滤，与 rememberSelectedRows(L54-55) 不一致，emit keys 可含 undefined | `LxProTable/index.vue:130-140` | 与既有逻辑对齐补空值过滤 |
| L7 | catch 丢弃错误详情且 emits 无 error 事件，宿主无法感知失败原因 | `LxSelectPagination/index.vue:270-275` | 补 `error: [error: unknown]` 事件 |
| L8 | debounce 被静默钳制 250-400ms，types.ts 未说明 | `LxSelectPagination/index.vue:293-294` | 移除钳制或注明取值范围 |
| L9 | 非 autoUpload 模式选择文件时不校验 accept/maxSize，提交才拦截且父级已同步过非法数据 | `LxUpload/index.vue:165-185` | onChange 对新文件即时校验反馈 |
| L10 | JS smooth scroll 不受 CSS reduced-motion 控制 | `LxPagination/index.vue:46-48` | matchMedia 判断 behavior |
| L11 | progress transition 缺 prefers-reduced-motion 降级（同库其他组件已处理） | `LxMetricCard/index.vue:279-282` | 补 `@media (prefers-reduced-motion: reduce)` |
| L12 | rail popper 无 focusout 处理，键盘移出后浮层滞留 | `LxSidebar/index.vue:320-331` | 补 focusout + relatedTarget 判断关闭 |
| L13 | showRailTip 忽略入参 x/y，3 处调用方被迫传 `{x:0,y:0}` | `LxSidebar/index.vue:86-101`、LxSidebarItem.vue:45、LxSidebarGroup.vue:54-60,77-83 | 参数类型改 `Pick<LxRailTip, 'content'\|'subItems'\|'activeKey'>` |
| L14 | 注释"受控 + 非受控兜底"失实（无 expandedKeys 受控入口） | `LxSidebar/index.vue:53-63` | 修正注释或补受控 prop |
| L15 | 搜索输入框无可访问名称（对比 LxVirtualTree:275 的正确写法） | `LxSelectTree/index.vue:99` | 补 `aria-label` |
| L16 | 懒加载模式 noMatch 基于已加载层误报空态 | `LxSelectTree/index.vue:42-48` | lazy 模式弱化/隐藏该提示 |
| L17 | keyOf 索引签名断言无守卫无依据注释 | `LxVirtualTree/index.vue:48-50` | 改 `typeof` 类型守卫函数 |
| L18 | disabled 已选项在树面板不可取消，但右侧列表可单个移除/清空，语义矛盾 | `LxTransferPanel/index.vue:81-150` | 明确 disabled 语义并统一两侧行为 |

### 5.2 admin-vue3（16 项）

| # | 问题 | 位置 | 建议 |
|---|------|------|------|
| V1 | debounce/throttle 定时器存于闭包无清理句柄，onUnmounted 仅 cancel；pending 定时器在卸载后仍触发请求并回写状态【降级项】 | `src/composables/useFetch.ts:61-69,76-100,536-538` | 保存 timer 句柄，onUnmounted/cancel 清理 + disposed 短路 |
| V2 | handleStatus 链尾缺 `.catch`，网络异常 unhandled rejection（拦截器已统一弹错，后果有限）【降级项】 | `src/views/authority/userManage/index.vue:117-125` | 补 `.catch(() => {})`，随 #10 一并加提交锁 |
| V3 | postDownload 签名 `ApiResponse<T>` 实返 ArrayBuffer，全仓无调用（死代码） | `src/utils/http.ts:231-233` | 删除或改签名为 `Promise<ArrayBuffer>` |
| V4 | API 层 106 处函数声明收窄为 `Promise<ApiResponse>` 擦除 abortFetch（另 160 处保留 HttpResult，风格分裂），ProTable 被迫断言补救 | `src/api/`（代表 `user.ts:38-64`）、`src/components/ProTable/index.vue:366` | 统一返回类型为 `HttpResult<T>`，移除 ProTable 断言 |
| V5 | httpController Map 无任何外部消费方，每请求挂一个 60s setTimeout 维护它 | `src/utils/http.ts:58-72` | 删除 httpController 与 processController |
| V6 | 断言清单：拦截器返回结构、store 权限数据、假 matched、null 占位 App、JSON.parse、自定义路由字段等 9 处代表 | `http.ts:195,206,226`、`useUserStore.ts:145`、`Breadcrumb/index.vue:46`、`createDialog.ts:81`、`auth.ts:82`、`filterChain.ts:22-31`、`menuRouteMapper.ts:205` | `declare module 'vue-router'` 扩展 RouteMeta；跨结构断言建运行时守卫 |
| V7 | 显式关闭 noImplicitAny，削弱 strict 基线 | `tsconfig.json:15` | 存量隐式 any 清零后恢复默认 |
| V8 | "加密身份证号"实为字符串反转 + Base64，AES 密钥硬编码前端 | `src/utils/crypto.ts:4`、`src/utils/secure.ts:26-35` | 注释改"编码混淆，非加密"；安全台账登记 XSS 下可还原风险 |
| V9 | openPageLoading 首查无 catch，失败 unhandled rejection | `src/utils/pageLoading.ts:28-41` | 链尾补 catch |
| V10 | ITableColumn.hide 字段定义未实现（模板无 hide 过滤，当前无调用方） | `src/components/ProTable/types.ts:29-30` | 实现列过滤或删字段 |
| V11 | 退出登录 confirm 的 catch 吞掉真实错误，点了确定却停留原页无提示 | `src/layout/components/Navbar.vue:40-51` | 区分 'cancel'/'close' 与真实错误分别处理 |
| V12 | getAllNodeIdByDepartmentId 子查询失败时把部分 id 串当完整结果返回 | `src/utils/auth.ts:136-164` | 失败上抛或返回带完成标记的结构 |
| V13 | `as unknown as`/`as never` 强转 8 处（EditRole 的 store 强转可零成本移除，store 已公开 licenseAuth） | `EditRole.vue:214`、`ColForm.vue:224,226`、`colLevelManage.vue:269`、`colEditRecord.vue:94`、`colOnOffRecord.vue:68`、ColDefaultCoopTab.vue、ColFunctionTab.vue | EditRole 直接用 `userStore.licenseAuth`；as never 处完善 API 入参类型 |
| V14 | setTimeout 延迟绑定 scroll 后，卸载既不清 timer 也不解绑监听（内存泄漏） | `src/views/shiftScheduling/dutyInformation/components/DutySearchBar.vue:96-104` | onBeforeUnmount 清 timer + removeEventListener |
| V15 | `as any` 全 src 41 处（代表 DataPermissionTree 三处 `as any[]`） | `src/views/authority/components/DataPermissionTree.vue:192,203,297` | 定义部门树节点 interface，按模块分批收敛 |
| V16 | console.error/warn 52 处 | 代表：`colEditRecord.vue:112`、`colOnOffRecord.vue:121`、`useUserStore.ts:196-200` | 统一 logger 便于生产剥离，保留有诊断价值的日志 |

## 6. 已排除的误报（校验记录，避免重复报告）

| 疑点 | 排除依据 |
|---|---|
| filterChain hiddenPaths 按 path 匹配疑似错配 | router/modules/authority.ts 中这些路由 path 值恰为 'IMPermission' 等，与列表一致 |
| LicenseFilter excludeChildNames 匹配不到 | ArchivedTable/Location 路由 name 均存在，按 name 匹配正确 |
| http.ts 401 msgFlag=false 漏 reject | 函数末尾统一 `return Promise.reject(error)`，无吞错 |
| 401 并发 + 改密临时 token 误伤 | isCurrentAuthRequest 正确隔离改密令牌与会话令牌 |
| 登录成功后未启动会话监控 | login/index.vue:181 显式调用 startSessionMonitoring() |
| 登录按钮无防重复提交 | 模板 :disabled="loading" + finally 释放，正确 |
| filterChain 修改污染模块定义 | addRouterByPermissions 每次经 cloneModuleRoutes() 深拷贝 |
| ProTable 远程模式疑有 useTable 同款竞态 | executeFetch 的 seq 检查在写 innerData 之前，且真实消费 abortFetch，正确 |
| keep-alive 跨账号残留 | clearLocalSession 依次 stopSessionMonitoring → clearAuthStorage → resetRouter → clearCachedViews，完整 |
| 会话心跳 5s 疑过频 | 既有后端 keepalive 契约，链式处理正确 |
| LxActionButtons hasPermission 违反库纯净性 | 走 setupLxPermission 注入模式，无业务依赖 |
| LxForm $attrs 根转发双绑定 | Vue3 mergeProps 对相同 handler 去重，无功能影响 |
| 业务页空 `.catch(() => {})` 吞错 | 拦截器已统一弹错后的合理局部处理，非吞错 |

## 7. 修复优先级建议

- **P0（行为缺陷，先修）**：#5 + #6（同根链，一次改造覆盖）→ #7（功能静默失效）→ #8（数据被默认值覆盖）→ #10（防脏写）→ #11（选错人风险）→ #2/#3（lx-ui 交互缺陷）→ #1（全局注册）→ #9（AuthImg）→ #4。
- **P1（有用户可感知影响的 minor）**：L4-L12、L15、V1、V2、V9、V11、V14 等。
- **P2（类型与契约治理，分批）**：L1-L3、L13-L18、V3-V8、V10、V12、V13、V15、V16。建议按模块分批，公共层（http/composables/ProTable 适配层）先行。
- **修复模板**：提交锁参照 `h5/groupTags/GroupTagsForm.vue` 与 `thirdInterface/app/components/AppManage.vue`；竞态防护参照 `src/components/ProTable/index.vue` 与 `baseData/globals/index.vue`；鉴权图片直接参照库内 `LxAuthImg`。

## 8. 登记说明

- 本报告为一次性全量静态测评记录，不改变 `PROJECT-DELIVERY-PLAN.md` 中任何任务的完成状态。
- 修复实施时按 AGENTS.md 执行：改动后补类型检查、Lint、相关单测/E2E；涉及 lx-ui 组件契约变更（#1、#2、#4、L4、L13）须同步更新类型、Demo、中文说明与可观察行为测试。
- 全部修复完成后建议做一轮复评（重点复验 #5/#6/#7 的运行时行为），并在交付计划中登记对应修复波次。

## 9. 代码质量评分（2026-09-28）

### 9.1 评分方法

- 参评范围：`linkx-fe`（lx-ui）与 `other-admin/admin-vue3` 已有代码；Vue2 现役 `src/`、构建产物、依赖目录不参评。
- 证据来源：本次全量静态审查（45 项问题 + 正面确认 + 误报排除记录）+ 交付计划中已验证的门禁记录（vue-tsc 通过、Vitest 173 项通过、Playwright 86/86、ESLint 0 错误）；未执行的运行时验证不计分也不扣分。
- 权重依据：管理后台为请求密集型应用，异步正确性、类型安全、架构各占 15%；其余维度 10%，安全 5%。
- 等级标尺：9.0+ 参考级｜8.0-8.9 可交付优秀｜7.0-7.9 良好但有明确短板｜6.0-6.9 及格、债务累积｜<6.0 需要干预。

### 9.2 总分卡

| 工程 | 总分 | 等级 |
|---|---|---|
| lx-ui 组件库 | **7.5 / 10**（加权 7.45） | 良好，收尾阶段有明确短板 |
| admin-vue3 宿主 | **7.0 / 10**（加权 6.95） | 良好，异步基建是结构性短板 |
| 综合 | 7.2 / 10 | — |

### 9.3 lx-ui 维度明细（7.5）

| 维度 | 权重 | 得分 | 依据 |
|---|---|---|---|
| 架构与分层 | 15% | 8.5 | 纯净性零违规（无 axios/router/pinia/凭据）、请求能力宿主注入、令牌/权限/主题分层清晰；扣分：install 注册链路断裂（#1）、RailTip x/y 冗余契约（L13） |
| 类型安全 | 15% | 7.0 | strict 开启、36 页 API 文档类型齐全、零 `@ts-ignore`；扣分：LxSelectTree 5 处 `as any`（L2）、7 处无守卫 `as` 断言（L1）、keyOf 断言（L17） |
| 异步与竞态 | 15% | 6.5 | LxAuthImg（requestId+AbortSignal）、LxSelectPagination（取消不弹错、失败回退页码）为样板；扣分：懒加载无 catch 节点永久转圈（#3）、吞错误详情无 error 事件（L7） |
| 错误处理与反馈 | 10% | 7.0 | LxDialog confirm 双保险、SearchBar loading 守卫齐全；扣分：lazy 失败无恢复路径、debounce 静默钳制违背参数语义（L8） |
| 资源清理 | 10% | 8.5 | ResizeObserver/滚动监听/对象 URL 基本全覆盖且有卸载清理；仅 LxUpload 校验时机（L9）等小项 |
| 可访问性与动效 | 10% | 8.0 | ProTable role=region+键盘滚动+aria-busy、全局 reduced-motion 兜底为同类项目少见；扣分：LxSelectTree 搜索框无 aria-label（L15）、两处 reduced-motion 遗漏（L10/L11）、popper focusout 滞留（L12） |
| 测试与可验证性 | 10% | 6.5 | 约 20 个组件有宿主侧单测/E2E 证据；扣分：7 个组件零自动化测试（LxDrawer/LxSelectTree/LxTag/LxStatusDot/LxFormErrorBanner/lxMessage/lxConfirm），LxCodeSlot 缺文档页 |
| 文档与契约一致性 | 10% | 7.0 | 36 页中文文档站 + 30 个 demo 目录，覆盖度良好；扣分：hasChildren 虚假契约（#4）、validate fields 声明未兑现（L5）、Sidebar 注释失实（L14） |
| 安全与纯净性 | 5% | 9.0 | 无凭据、无业务泄漏面，权限走 setupLxPermission 注入模式 |

### 9.4 admin-vue3 维度明细（7.0）

| 维度 | 权重 | 得分 | 依据 |
|---|---|---|---|
| 架构与分层 | 15% | 8.5 | 适配层保旧契约（跨页选择/取消/分页/校验全保留）、filterChain 责任链 + 深拷贝隔离、API 域集中、http 层具备取消能力；扣分：API 返回类型 106/160 处风格分裂（V4）、postDownload/httpController 死代码（V3/V5） |
| 类型安全 | 15% | 6.0 | 显式关闭 noImplicitAny 是硬伤（V7）；41 处 `as any`（V15）、8 处 `as never`/`as unknown as`（V13）、ProTable 被迫断言补救；正面：vue-tsc 通过、composables/适配层类型定义质量高 |
| 异步与竞态 | 15% | 5.0 | 最大拖分项：useTable 绕过 seq 保护（#5）、useFetch 取消语义虚假（#6）、v-loadmore 从未生效（#7）、ColForm 搜索竞态（#11）；正面：ProTable 远程模式、globals、dutyInformation 的防护正确，多数走 ProTable 的页面实际安全 |
| 错误处理与状态 | 10% | 7.0 | 链式规范执行率高（抽查仅 1 处缺 catch）、401/403/取消语义正确；扣分：License 失败覆盖旧值（#8）、Navbar 吞真实错误（V11）、部分结果当完整返回（V12） |
| 资源清理 | 10% | 7.0 | 会话清理三件套完整、ProTable 卸载取消；扣分：useFetch 定时器不清理（V1）、DutySearchBar 监听泄漏（V14）、宿主 AuthImg ObjectURL 泄漏（#9） |
| 可访问性与动效 | 10% | 7.5 | 经 lx-ui 适配层继承库级 a11y 能力；业务页自身未做深度 a11y 审查（随 UI-12 排期） |
| 测试与可验证性 | 10% | 8.0 | 34 个单测文件 173 项、业务 E2E 86/86、权限矩阵 14/14、Mock 预览 2/2，测试文化高于同类内网项目；扣分：useFetch 声称的取消能力零测试佐证 |
| 文档与契约一致性 | 10% | 7.0 | MIGRATION-MATRIX/ELEMENT-PLUS-LX-UI-MATRIX 维护至 2026-09-28、权限码对契约零臆造；扣分：useFetch 注释夸大能力、crypto"加密"失实（V8）、根目录 PROGRESS.md 过时 |
| 安全 | 5% | 7.5 | 无 Token 泄漏、401 清理链正确；扣分：AES 密钥硬编码 + 身份证号可逆存储（V8，继承契约，需安全台账登记） |

### 9.5 评分解读

1. 两个工程均非"烂代码"：0 critical、0 安全事故级、0 契约臆造，测试与文档纪律明显高于同类内网项目平均水平。扣分主要来自"承诺与实现的缝隙"——useFetch 注释声称自动取消（#6）、hasChildren 声称渲染箭头（#4）、install 看似注册了全部组件（#1），实际均未兑现。
2. admin-vue3 与 lx-ui 的 0.5 分差距几乎全部来自异步基建（5.0 vs 6.5）：库组件请求由宿主注入、异步面小；宿主自建竞态基建暴露了缺口，而正确答案（ProTable 的 seq + abortFetch）就在同一仓库中。
3. 风险集中在"静默"二字：#1 全局注册失效、#7 触底加载失效、#8 License 覆盖均无报错、无日志，正常路径测试无法发现——这解释了为何 173 项单测与 86 条 E2E 全绿但问题仍在。

### 9.6 提分路线（预估）

| 修复动作 | 维度变化 | 预估总分 |
|---|---|---|
| admin-vue3 修 P0（#5-#8、#10、#11 + V1/V14 清理项） | 异步 5→8.5，清理 7→8.5，错误 7→8 | 7.0 → 约 7.7 |
| 再做 P2 类型治理（as any 清零、noImplicitAny 恢复、HttpResult 统一） | 类型 6→8 | → 约 8.0 |
| lx-ui 修 #1-#4 + L1/L2 + 补 7 个零测试组件 | 类型 7→8.5，异步 6.5→8，测试 6.5→8，文档 7→8.5 | 7.5 → 约 8.2 |

最高性价比单点：useTable/useFetch 的 signal 链改造——一处修复同时拉高异步、清理、错误处理、文档四个维度，并消除"虚假注释"的信任损耗。本评分为 2026-09-28 时点快照，P0 修复完成后建议按 9.1 方法复评更新。
