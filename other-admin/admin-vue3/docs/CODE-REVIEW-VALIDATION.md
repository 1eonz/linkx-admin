# GLM 代码评审复核与修复台账

## 2026-10-05 Wave 2 LxCheckbox / LxRadio 最终代码复审

- **结论**：独立代码复审批准；当前 Checkbox/Radio 差异未发现其他可复现 P0–P2 问题。
- **已关闭问题**：Radio 处置组选中项为可用的 `encrypted`，已选禁用卫星历史值展示在组外只读区域，不再抢占组内 Tab 停靠项。文档 E2E 真实从水平组 Tab 进入垂直选项，并用方向键验证跳过禁用项；中文状态播报与 Demo 状态一致。
- **复审边界**：复审者只读当前源码、类型、文档和测试差异，未重跑测试；定向单测 20/20、文档 E2E 4/4、类型、Lint、格式和构建结果由主任务运行。
- **非代码待办**：Impeccable A 提出 375px API 多列表格扫描效率 P2，登记为文档体验后续项，不伪装成代码审核缺陷或严格矩阵通过。

## 2026-10-05 Wave 2 LxSelect E2E 定位最终复审

- **结论**：Luna max 复审批准，无阻断问题。
- **复核过程**：首轮意见误判 `.el-select-dropdown.lx-select__popper` 无法匹配实际下拉节点。失败上下文确认 Element Plus 当前 DOM 的真实下拉节点同时带有这两个类；宽泛的 `.lx-select__popper` 则会同时命中折叠标签 tooltip。
- **修复与验证**：E2E 改为限定 `.el-select-dropdown.lx-select__popper`，HUD 场景同时限定 `.lx-theme-hud`；文档补齐焦点光环、弹层开合两态重试和 `aria-describedby` 清理说明。主任务重跑文档 E2E 3/3 通过；最终复审者确认选择器和文档与当前实现一致，但未重跑测试。

## 2026-10-05 Wave 2 LxSelect Demo 补充复审

- **结论**：Luna max 独立代码复审批准；未发现本轮新增禁用选项、错误状态文案及 E2E 断言中的可复现 P0–P2。
- **范围**：复核离线 `ElOption` 的禁用呈现、请求失败空态与 `role="alert"`/`aria-describedby` 保持关系、footer 重试入口及 HUD、320px 浏览器 E2E。
- **验证边界**：复审者未运行测试或 detector；本波 E2E、类型、Lint、Prettier、构建结果由主任务实际执行记录。代码复审批准不替代 Impeccable 视觉审查。

## 2026-10-05 Wave 2 LxSelect 修后复审

- **结论**：独立复审批准，当前 LxSelect 变更未发现可复现 P0–P2。
- **范围**：复核 HUD 主色 token 的局部作用域、teleported options 的描述样式、远程错误恢复按钮的位置，以及 320px/触屏行高和对应文档 E2E。
- **处理**：原先的 HUD token 全局泄漏通过 popper 专属 selector 修复；选项描述改用直接类名；重试按钮放入 Select 弹层 footer，错误说明与实际输入框的 `aria-describedby` 关系保留；窄屏/触屏选项行提升至 44px。
- **验证**：LxSelect 单测 10/10、文档 E2E 3/3；Vue3 `vue-tsc --noEmit`、目标 ESLint/Prettier、lx-ui typecheck/build（196 modules）/build:docs 均通过。代码复审者没有重跑这些命令；结果由主任务直接运行取得。
- **边界**：Demo 网络状态为本地 Mock，不代表真实 API 联调；修后 Impeccable A/B、overlay/snapshot/trend 单独跟踪，不因代码复审批准而视作视觉门槛通过。

## 2026-10-05 Wave 2 LxDatePicker 短视口修复代码复审

- **结论**：独立代码复审批准；未发现本次 DatePicker 定位、滚动和 E2E 增补中的可复现正确性或契约问题。
- **范围**：复核 `LxDatePicker` 窄屏视口边界检测、居中态和面板滚动，以及 320×375/390×375 普通与快捷区间回归断言。
- **复审边界**：代码复审代理未运行测试；行为测试与类型、构建、Lint、格式验证结果单独记录在项目交接台账。Impeccable A/B 的未关闭视觉建议不等同于代码缺陷。

## 2026-10-04 UI-13 DynamicForm/Form 代码审核发现

- **发现**：`LxDatePicker` 在 Element Plus Fragment 根回退时，当前实现仍可能无法稳定定位本实例触发器；DynamicForm/DatePicker 定向单测出现 5 项失败，包含字段说明未到达实际输入和相邻日期字段隔离回归。
- **处理状态**：Wave 0 修复完成。组件实例 UID 用于限定 Fragment 根下的触发器范围；单值和区间输入、相邻区间实例、说明更新/移除及 DynamicForm 日期字段均有回归覆盖。此项代码缺陷关闭，但 DynamicForm/Form 正式视觉审查仍因 Impeccable A/B 和 snapshot 缺失而保持阶段性。
- **独立代码审核**：未发现可复现实现缺陷；建议补充区间两个输入框及相邻区间实例的 `aria-describedby` 隔离测试，该建议已落实。
- **验证**：DatePicker/DynamicForm 单测 36/36；lx-ui `typecheck`、`build`（196 modules）、`build:docs`；DatePicker 文档 E2E 1/1；目标 ESLint、Prettier 和 `git diff --check` 均通过。VitePress 构建保留既有大 chunk 警告。正式 Impeccable A/B、overlay、snapshot/trend 未完成，detector `[]` 不作通过依据。

## 2026-10-02 轮播文章分页触底回归

- **发现**：触底事件在文章列表尚未更新时可重复进入分页回调，测试曾观察到新增文章重复呈现；旧测试还按固定 CSS 类滚动下拉，并在 Element Plus popper 过渡时全局查询同名 option。
- **修复**：`CarouselForm.vue` 对文章分页请求加 loading 锁，失败回退页码，按文章 ID 去重；请求代次和公众号 ID 校验阻止切换账号后的迟到结果覆盖当前数据。`preview.spec.ts` 按输入框 `aria-controls` 关联真实 listbox/滚动容器，并断言第 21 篇唯一出现。
- **复核**：未发现本次修改改变既有文章选择、默认首篇回填或 Promise 链异常处理契约；API 仍使用 `.then().catch().finally()`。完整 preview E2E 6/6，分页定向 E2E 1/1，目标 ESLint、Prettier、`vue-tsc --noEmit` 通过。
- **边界**：E2E 使用本地 Mock；未验证真实后端或其他 `v-loadmore` 页面。旧 #7 指令单测结论不变，本次是轮播宿主分页状态加固。
- **Impeccable 静态检查**：`.impeccable/critique/carousel-pagination-2026-10-02/` 保存 JSON、stderr 和退出码；JSON `[]` 且 stderr 为空、退出码 0，只表示源码 detector 零命中，不代表正式双路视觉 Critique。

## 2026-09-30 UI-10 Wave 5 postfix 代码审核

- **范围**：`LxDialog`、`LxDrawer`、`LxEmpty`、`LxPageCard`、`LxFormErrorBanner` 的组件实现、Demo 和对应宿主单测/文档 E2E。
- **结论**：未发现本波组件代码新增的可复现正确性、契约或安全问题。Dialog/Drawer 的受控显隐、ESC、ARIA 标题关系、portal 主题变量、PageCard `aria-busy`/恢复状态和 ErrorBanner live region 与测试契约一致；组件仍不发起业务请求。
- **发现并修复**：PageCard 文档 E2E 在 VitePress hydration 完成前立即读取 `table`，会出现空表误报。已先等待 `Props` 标题可见再检查表格布局；修复后定向文档 E2E **6/6** 通过。
- **验证**：Wave 5 单测 9/9（Drawer 4、PageCard 3、FormErrorBanner 2）；定向文档 E2E 6/6；Vue3 `vue-tsc --noEmit`、目标 E2E/单测 ESLint、lx-ui `build`（195 modules）、VitePress `build:docs` 和目标文件 Prettier 通过；目标范围 `git diff --check` 通过。
- **环境边界**：全库 `git diff --check` 仍受既有 `.vitepress/config.ts` EOF 空行影响，未修改他人文件；不影响本波目标范围。真实后端联调未执行，Impeccable B 的 CUA 限制仍按 `DEGRADED` 登记。
- **后续**：保留 Wave 5 P2/P3 视觉建议，进入 `COMPONENT-AUDIT.md` 中树/穿梭/上传/远程分页选择等尚未完成正式 A/B 的下一波。

> 复核时间：2026-09-28  
> 来源：[CODE-REVIEW.md](./CODE-REVIEW.md)

## 复核结论

GLM 报告的 11 项 major 经复核后，#1、#2、#5、#6、#7、#8、#9、#10、#11 已完成代码修复或 Mock 验收；#3、#4 为已有实现、另留运行验收。#9 的对象 URL 描述收窄为卸载清理、XHR 取消和响应归属保护。`useTable` 当前没有检索到业务页面调用，因此 #5 影响范围登记为公共能力风险。#9/#10 此前失败的双路视觉评审已由独立 Luna `max` 重新完成，并保存 A/B 报告、有效 detector 三件套、浏览器 overlay/截图及正式 snapshot；运行时发现按目标组件归因，`[]` 仍只代表静态零命中。

| 编号                 | 当前结论                                                                         | 处理                                                                                                                                                                                                                                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #1 全局组件注册      | 已修复；39 个公开组件按显式名称注册，未产生空注册名                              | `linkx-fe/src/index.ts` 使用名称到组件的注册表；`tests/unit/lx-ui-install.test.ts` 覆盖全部公开名称。定向单测 1/1、lx-ui typecheck/build/docs build、Vue3 全量 Vitest 39 文件/200 项及 Prettier 通过。组件库没有独立 ESLint CLI，未声称 ESLint 通过                                                                                     |
| #2 Cascader 值类型   | 已修复并通过回归                                                                 | `LxCascaderOptionValue` 与 Element Plus 契约一致，接受 string/number/record object；普通 `call` 和 `Symbol.iterator` 业务字段不再被守卫误拒。保留对象值、数值/混合路径、Demo 和中文说明同步；`lx-search-bar.test.ts` 6/6、Vue3 `vue-tsc`、lx-ui typecheck/build/docs build 通过                                                         |
| #3 树懒加载失败      | 原报告过时，当前有 catch、failedLoads、retryLoad；EP resolve 行为仍需浏览器复验  | 保留现有实现，另列运行验收                                                                                                                                                                                                                                                                                                              |
| #4 hasChildren       | 原报告过时，当前已有 isLeaf/normalizeNode 消费                                   | 保留现有实现，核对测试                                                                                                                                                                                                                                                                                                                  |
| #5 useTable 竞态     | 成立；旧结果在 useFetch 序号校验前写 data/total                                  | 本波已把提交移到 useFetch onSuccess，并传递可选 signal                                                                                                                                                                                                                                                                                  |
| #6 useFetch 取消     | 成立；原 controller 未传给请求，cancel 也未失效序号                              | 本波已加入 signal 通道、取消失效序号和卸载保护                                                                                                                                                                                                                                                                                          |
| #7 v-loadmore        | 已修复并做定向浏览器验收；teleport 列表通过 `aria-controls` 定位，延迟挂载可捕获 | 单测 3/3、轮播文章真实 Element Plus 下拉 Mock E2E 1/1；其他宿主仍待逐页回归                                                                                                                                                                                                                                                             |
| #8 License 失败覆盖  | 已修复；网络失败、业务失败和无效数据均保留现有授权                               | 仅有效 `code === 0` 响应更新 store 与持久缓存；单测覆盖失败保留和成功更新                                                                                                                                                                                                                                                               |
| #9 AuthImg           | 实现、Mock 验收和正式 Impeccable A/B 完成；真实后端未联调                        | 站内鉴权 Blob API、外站地址拦截、失败重试、AbortSignal、迟到响应保护和 ObjectURL 回收；10 处宿主调用补 `alt`。Luna `max` A/B 29/40；有效 detector `[]`/stderr 空/exit 0；桌面与 375px 图片 2/2 加载，overlay 命中归属于应用外壳和表格容器；正式快照及证据见 `.impeccable/critique/`                                                     |
| #10 写操作重复提交   | 计划范围实现、Mock 验收和正式 Impeccable A/B 完成                                | `/authority/role`、`/authority/userManage` 及三方应用计划范围按行/表单加锁并通过原有 E2E 5/5。第三方目标 A/B 21/40；overlay 期间确认框同一行操作 disabled，取消后无业务写请求。A 额外发现的 `/authority/adminRole` 与 `/authority/adminPerson` 锁缺失是真实风险，但超出此计划范围，列 CODE-03；浏览器自动 78 次 keepalive 为本地 Mock。 |
| #11 ColForm 搜索竞态 | 已修复并通过 Mock：过期关键词不能覆盖当前列表或 loading，触底分页使用当前关键词  | API 支持 AbortSignal；搜索代次忽略迟到响应；组织切换、关闭、重置和卸载时取消旧请求；防止并发翻页。代码审核未发现新增问题                                                                                                                                                                                                                |

## 本波已完成

- `useFetch` 增加可选 `fetchFnWithSignal`，取消时递增请求序号、abort 当前 controller、释放 loading，卸载后不再启动请求。
- 防抖/节流调度改为可取消调度器；被覆盖或取消的等待 Promise 均 resolve `undefined`，不再悬挂。
- `useTable` 的格式化结果改为 `{ list, total }`，只在 `useFetch` 的序号校验通过后由 `onSuccess` 写入公开 data/total；API 可接收可选 `AbortSignal`。
- `useFetch` 的取消同时清理等待中的重试计时器；覆盖 `abortPrevious=false` 时取消所有并行请求，且不让迟到结果回写。
- `v-loadmore` 按 `aria-controls` 解析 teleport 下拉，并监听打开后的延迟挂载；组件更新时替换回调，卸载时清理 observer、滚动和宿主事件监听。
- `tests/unit/use-fetch.test.ts` 9/9、`tests/unit/loadmore.test.ts` 3/3 通过；后者覆盖延迟 teleport、触底阈值、回调更新、滚动监听及未完成观察时卸载清理。
- GLM #8：License 刷新只在成功码、有限状态值和有效可选日期通过校验后写入；网络异常、业务失败、无效数据及会话切换均返回当前 store 值，不覆盖 localStorage。`auth-store.test.ts` 覆盖失败保留、持久化保留和成功更新。
- GLM #10：权限角色、第三方应用及管理员用户的删除/启停/保存操作增加逐行或弹窗提交锁。删除锁从确认前建立、取消后恢复，API 进行时显示 loading 和可访问 busy 状态；`.finally()` 清理锁。第三方应用列表在浅色/HUD、桌面/375px 下完成对比度和触控检查。
- GLM #11：`ColForm` 远程人员查询支持 AbortSignal、搜索代次和关键字分页状态；组织变更、输入新关键词、重置、关闭和卸载会取消旧请求。页码仅在当前请求成功后提交，旧响应及旧 `finally` 不能改写新列表/加载态。
- 代码审核：复核 #10 行锁边界、确认取消、保存期间重复触发及 `.finally()` 释放；传输失败提示由 `src/utils/http.ts` 响应拦截器统一负责，调用层空 `.catch()` 避免重复 Toast。复核 #11 取消/代次、页码提交时机、并发触底和关键词延续，未发现本次新增可复现问题。
- GLM #1 代码审核：复核 `linkx-fe/src/index.ts` 的 39 项显式注册表及默认插件安装行为、公开导出未改变；插件级回归验证所有预期键均注册且空名称不存在，未发现本次新增可复现问题。组件库无独立 ESLint，Vue3 ESLint 配置会忽略库文件；不把忽略结果记录为通过。

## 验证与边界

- `pnpm exec vitest run tests/unit/use-fetch.test.ts tests/unit/loadmore.test.ts --reporter=dot`：12/12 通过。
- `pnpm exec playwright test --config=playwright.preview.config.ts --grep "轮播文章下拉滚到底部后使用本地 Mock 加载下一页" --reporter=line`：1/1 通过；使用本地 Mock，实际请求第 1、2 页并显示第 21 篇文章。
- `pnpm exec eslint`、`pnpm exec prettier --check` 对本波源码和测试文件：通过；`pnpm exec vue-tsc --noEmit`、`git diff --check`：通过。
- `pnpm exec vue-tsc --noEmit`：通过。
- GLM #8：Vue3 全量 Vitest 36 个文件、186 项通过；定向 ESLint、Prettier、`vue-tsc --noEmit` 和 `git diff --check` 通过。`code-reviewer` 对本次差异未发现新增问题。
- GLM #9：`auth-img.test.ts` 与 `auth-image-api.test.ts` 12/12；预览 AuthImg E2E 3/3，覆盖失败恢复、键盘重试、alt/读屏名称、图片载入完成、375px 和减少动效；`vue-tsc`、目标文件 ESLint/Prettier 通过。代码复核未发现新增可复现问题；真实鉴权后端未联调。
- Impeccable GLM #9 降级证据：目标 detector 原始 JSON 为 `[]`、stderr 0 字节、进程退出码 0；此结果仅表示 `AuthImg/index.vue` 静态零命中。两个 gpt-6-sol 隔离评审均因提供方 HTTP 503 未能启动；CUA `document.title` 写入因 getter-only 页面桥被拒，未注入 overlay，不计正式双路 Critique 通过。截图及报告路径见 `.impeccable/critique/`。
- GLM #10 Impeccable 降级检查：`thirdParty/index.vue` detector JSON 为 `[]`、stderr 0 字节、退出码 0，只表示静态规则零命中。五次隔离 `gpt-6-sol ultra` 评审尝试均遇 HTTP 503；本次可用浏览器 API 的 DOM evaluate 为只读，未注入 overlay。四张人工检查截图覆盖浅色/HUD、桌面/375px，但没有双路报告及正式 snapshot，因此视觉 Critique 保持未完成；详见 `.impeccable/critique/duplicate-submit-degraded-review-2026-09-29.md`。
- GLM #10 Mock E2E：`tests/e2e/duplicate-submit.spec.ts` 5/5 通过，覆盖角色确认取消/删除/启停/保存、第三方应用删除/编辑、管理员用户删除/启停、失败后解锁重试及第三方应用浅色/HUD 对比度、375px 触控目标。
- GLM #11 Mock E2E：`tests/e2e/col-form-search-race.spec.ts` 1/1 通过，覆盖切换关键词时取消旧请求、当前请求 loading、旧响应不污染新列表、第二页携带同一关键词和 `aria-busy` 清理。
- GLM #9 Impeccable 复核：A 29/40；B 在 AuthImg 页面桌面/移动成功检查，2/2 图片解码；目标源码 detector JSON `[]`、stderr 空、exit 0，overlay 的壳层/表格容器命中未归因到 AuthImg。正式快照 `2026-09-29T01-10-08Z__admin-admin-vue3-src-components-authimg-index-vue.md`。窄槽位重试文字隐藏、长等待缺少升级提示列为后续设计观察。
- GLM #10 Impeccable 复核：A 21/40；B 成功访问第三方页面并注入 overlay；目标 detector JSON `[]`、stderr 空、exit 0。overlay 总结数 22 与解析的规则事件总数不一致，已保留原始 console 并标注限制；侧栏 `cramped-padding` 依据 DOM 间距判为假阳性候选。移动分页控件需在内部横向滚动。正式快照 `2026-09-29T01-10-09Z__admin-vue3-src-views-basedata-thirdparty-index-vue.md`。
- Luna `max` 代码复核：确认 `/authority/adminRole` 保存和 `/authority/adminPerson` 单人/批量授权、改密、删除、状态写操作缺少 pending guard；这些超出原 #10 范围，进入 CODE-03。A 的“请求失败静默”判断不准确：共享 HTTP 拦截器提示非取消传输错误，业务失败码由调用页提示。Create 凭据框 autofill 只观察一次，未在干净浏览器 profile 复现，不先改 `autocomplete`。
- GLM #11 E2E 稳定性复核：旧协同类型查询只在第一条 gated route handler 结束后解析完成 Promise，首屏岗位列表响应也在定位行前等待。`col-form-search-race.spec.ts` 最终 4/4 通过；全流程使用本地 Mock。
- GLM #1 插件回归：`tests/unit/lx-ui-install.test.ts` 1/1；lx-ui `pnpm typecheck`、`pnpm build`（134 modules）、`pnpm build:docs`、Vue3 Vitest 39 文件/200 项及 Vue3 Prettier 检查通过。VitePress 报告大 chunk 警告；pnpm 提示旧 `package.json` 内 `pnpm.onlyBuiltDependencies` 字段已忽略。组件库无 ESLint CLI，本次未将其记作通过。
- 仍需补真实 API adapter 对 signal 的接入和浏览器取消证据；未接入 `fetchFnWithSignal` 的旧 API 只能丢弃迟到结果，不能声称网络请求已中止。
- 所有业务 API 调用继续使用 `.then().catch().finally()`；本波未将 API 链改写为 `async/await`。
- GLM #8 属于 store/API 错误恢复，无界面或动效变更；未运行 Impeccable detector，不产生 `[]` 结果，也不记为视觉检查。
- 下一步 CODE-03：为 `/authority/adminRole` 角色保存及 `/authority/adminPerson` 授权/改密/删除/状态写操作增加防重复提交锁和可访问 busy 状态，按 Vue2/API 行为回归；随后单独进行代码审核和 UI/动效检查。GLM #2 Cascader、GLM #9/#10 正式视觉复核和 GLM #11 E2E 时序复核已完成；真实后端联调仍独立记录。

## 2026-09-30 UI-13 LxForm 首错焦点修复代码审核

- 结论：未发现本次修复新增的可复现正确性或契约问题。
- 复核范围：`linkx-fe/src/components/LxForm/index.vue`、`other-admin/admin-vue3/tests/e2e/lx-form-docs.spec.ts`。
- 重点：表单根节点从组件挂载实例获取，失败路径保持 Promise 链；聚焦重试只在 `scrollToError` 开启时执行；未改变 `validate`、`validateField`、`resetFields`、`clearValidate` 和 `scrollToField` 的公开方法；没有引入 API 请求或 `async/await` 改写。
- 验证：lx-ui `vue-tsc --noEmit`；LxForm 文档 Playwright 3/3；Vue3 定向 Vitest 34/34；`git diff --check`。未把 detector `[]` 作为代码审查结论。
- 后续：正式 Impeccable 综合仍需按 A/B、浏览器状态/overlay、snapshot/trend 门槛收口；组件库全量严格矩阵完成前不进入 Vue3 Element Plus 直接依赖移除。

## 2026-10-02 UI-10 Wave 6 TreeSelect/Cascader 行为复核

- 复核点：TreeSelect 文案 locale 选择与 `{count}` 单次替换、显式覆盖、原 footer slot/提交事件兼容；Cascader loading/error 组合下错误状态是否会错误关联到实际 input、面板与外层是否重复提供 retry、loading 结束后错误是否正确恢复；Demo 是否仅保留一个级联选择结果 live announcement。
- 结果：已由定向测试覆盖英文默认 footer、定制文案、并发 `loading + error` 先加载后错误的转移、错误 ARIA 和重试按钮。未发现本波新增的 API 请求逻辑或 `.then().catch().finally()` 风格变化。
- 验证：单测 17/17；定向文档 E2E 5/5；lx-ui typecheck/build/docs build、Vue3 vue-tsc、目标 Prettier 检查通过。`linkx-fe` 无独立 ESLint 配置，Vue3 ESLint 对库路径提示 ignored，因此不将该结果记为库 Lint 通过。
- 严格视觉结论由修后 Impeccable A/B 综合报告给出；此前 detector `[]` 不是代码审核或视觉通过结论。报告落盘前本项仍为审查中。

## 2026-10-04 Wave 0 DatePicker 复核结论

独立代码审核未发现可复现缺陷；建议补充的区间起止输入和相邻区间实例 `aria-describedby` 回归已加入。当前工作区 DatePicker/DynamicForm 单测 36/36，lx-ui 类型检查、构建、文档构建、DatePicker 文档 E2E 1/1、目标 ESLint/Prettier 和差异检查通过。正式 Impeccable A/B、overlay 与 snapshot/trend 仍未完成；detector `[]` 不作通过依据。

## 2026-10-05 Wave 2 DatePicker Demo 与窄屏样式复核

- **结论**：Approved；未发现 Critical 或 Nitpick。测试对比度 helper 曾有忽略 alpha 的潜在误报风险，已增加对 `rgba(...)` 和 slash-alpha 色值的拒绝分支，并经独立复核确认当前浏览器 `rgb(...)` 计算色仍兼容。
- **范围**：`linkx-fe/src/components/LxDatePicker/demo/basic.vue`、`style.css`、`other-admin/admin-vue3/tests/e2e/lx-date-picker-docs.spec.ts`。未读取 Impeccable A/B 报告；未运行测试。
- **复核依据**：窄屏用例实际检查 320/375/390px 弹层和内部日期面板边界、宽度上限、触控目标；390px 首屏用例检查区间两端输入可见并可操作。对比度断言读取当前分隔符和输入表面的计算颜色。
- **复验**：修订后 HUD 对比度 E2E 1/1、目标 ESLint 和 Prettier 通过；完整日期文档 E2E 由主会话运行 12/12。
