# GLM 代码评审复核与修复台账

> 复核时间：2026-09-28  
> 来源：[CODE-REVIEW.md](./CODE-REVIEW.md)

## 复核结论

GLM 报告的 11 项 major 经复核后，#3、#4 为已有修复，#5、#6、#7、#8、#9、#10、#11 已完成代码修复或 Mock 验收；#1、#2 仍待处理。#9 的对象 URL 描述收窄为卸载清理、XHR 取消和响应归属保护。`useTable` 当前没有检索到业务页面调用，因此 #5 影响范围登记为公共能力风险。#10 的正式 Impeccable 双路 Critique 因评审服务 503 和浏览器只读能力未完成，单独保留视觉门禁，不影响其代码与 Mock 状态标记。

| 编号 | 当前结论 | 处理 |
| --- | --- | --- |
| #1 全局组件注册 | 已修复；39 个公开组件按显式名称注册，未产生空注册名 | `linkx-fe/src/index.ts` 使用名称到组件的注册表；`tests/unit/lx-ui-install.test.ts` 覆盖全部公开名称。定向单测 1/1、lx-ui typecheck/build/docs build、Vue3 全量 Vitest 39 文件/200 项及 Prettier 通过。组件库没有独立 ESLint CLI，未声称 ESLint 通过 |
| #2 Cascader 值类型 | 成立，选项值被 String 化而公开契约保留 number/boolean | 后续统一规范化与类型守卫 |
| #3 树懒加载失败 | 原报告过时，当前有 catch、failedLoads、retryLoad；EP resolve 行为仍需浏览器复验 | 保留现有实现，另列运行验收 |
| #4 hasChildren | 原报告过时，当前已有 isLeaf/normalizeNode 消费 | 保留现有实现，核对测试 |
| #5 useTable 竞态 | 成立；旧结果在 useFetch 序号校验前写 data/total | 本波已把提交移到 useFetch onSuccess，并传递可选 signal |
| #6 useFetch 取消 | 成立；原 controller 未传给请求，cancel 也未失效序号 | 本波已加入 signal 通道、取消失效序号和卸载保护 |
| #7 v-loadmore | 已修复并做定向浏览器验收；teleport 列表通过 `aria-controls` 定位，延迟挂载可捕获 | 单测 3/3、轮播文章真实 Element Plus 下拉 Mock E2E 1/1；其他宿主仍待逐页回归 |
| #8 License 失败覆盖 | 已修复；网络失败、业务失败和无效数据均保留现有授权 | 仅有效 `code === 0` 响应更新 store 与持久缓存；单测覆盖失败保留和成功更新 |
| #9 AuthImg | 实现与 Mock 验收完成；真实后端未联调，正式 Impeccable 双路审查受环境阻塞 | 站内鉴权 Blob API、外站地址拦截、失败重试、AbortSignal、迟到响应保护和 ObjectURL 回收；10 处宿主调用补 `alt`。独立 gpt-6-sol 评审因 503 未启动、浏览器注入因只读限制失败，降级报告不计正式 Critique |
| #10 写操作重复提交 | 已修复并通过 Mock：角色删除/启停/保存、第三方应用删除/编辑保存、管理员用户删除/启停均有重复提交锁 | 行级锁覆盖确认及请求；按钮在请求阶段显示 loading/`aria-busy`；保存、启停及请求结束均通过 `.finally()` 释放。代码审核无新增可复现问题；正式 Impeccable Critique 待评审服务恢复后补齐 |
| #11 ColForm 搜索竞态 | 已修复并通过 Mock：过期关键词不能覆盖当前列表或 loading，触底分页使用当前关键词 | API 支持 AbortSignal；搜索代次忽略迟到响应；组织切换、关闭、重置和卸载时取消旧请求；防止并发翻页。代码审核未发现新增问题 |

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
- GLM #1 插件回归：`tests/unit/lx-ui-install.test.ts` 1/1；lx-ui `pnpm typecheck`、`pnpm build`（134 modules）、`pnpm build:docs`、Vue3 Vitest 39 文件/200 项及 Vue3 Prettier 检查通过。VitePress 报告大 chunk 警告；pnpm 提示旧 `package.json` 内 `pnpm.onlyBuiltDependencies` 字段已忽略。组件库无 ESLint CLI，本次未将其记作通过。
- 仍需补真实 API adapter 对 signal 的接入和浏览器取消证据；未接入 `fetchFnWithSignal` 的旧 API 只能丢弃迟到结果，不能声称网络请求已中止。
- 所有业务 API 调用继续使用 `.then().catch().finally()`；本波未将 API 链改写为 `async/await`。
- GLM #8 属于 store/API 错误恢复，无界面或动效变更；未运行 Impeccable detector，不产生 `[]` 结果，也不记为视觉检查。
- 当前项：GLM #2 Cascader 值类型。`LxSearchBar` 选项保留 string/number/boolean 原值，核对 Element Plus Cascader 的真实值契约，并补 Demo、中文说明与可观察行为测试。GLM #11 的 Impeccable 技术/样式审查及 GLM #10 正式 Critique 仍单独跟踪；detector `[]` 不代表通过。
