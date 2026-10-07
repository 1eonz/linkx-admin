# Wave 4 综合 Critique：LxDatePicker、LxDynamicForm 与 LxUpload

## 目标与边界

本次审查针对当前统一源码冻结的三个组件目录、对应中文文档 Demo，以及 4174 文档站的 Light/HUD、桌面、375px 窄屏和组件状态。Assessment A 只做独立设计评估；Assessment B 只做 detector 与浏览器 overlay 证据，双方在各自完成前没有读取对方材料。代码复审另行检查最终补丁。所有 Demo 请求均为本地 Mock，不代表真实后端、上传协议或 Vue3 业务页迁移。

## 设计健康评分

Assessment A 对十项启发式使用 Impeccable 要求的 0–4 分制：

| #        | 启发式             |      分数 | 结论                                                           |
| -------- | ------------------ | --------: | -------------------------------------------------------------- |
| 1        | 系统状态可见性     |         3 | 日期、校验、候选失败和上传进度均有状态反馈。                   |
| 2        | 系统与现实世界匹配 |         4 | 示例字段和动作贴合 LinkX 布控、任务与排班语境。                |
| 3        | 用户控制与自由     |         3 | 重置、清空、重试和取消可用；完整键盘退出路径未在本轮全部验证。 |
| 4        | 一致性与标准       |         2 | 三个 Demo 的主题控制位置和处理方式不一致。                     |
| 5        | 错误预防           |         3 | 必填、格式、大小和数量限制覆盖常见错误，全部边界未逐项运行。   |
| 6        | 识别而非回忆       |         3 | 标签和提示清晰，但 DynamicForm 的低频设置默认隐藏。            |
| 7        | 灵活与效率         |         3 | 日期快捷项、响应式面板、列数模式和批量上传提供有效替代路径。   |
| 8        | 美观与简约         |         3 | 控件层级清楚，Upload 首段说明和长文档仍稍密。                  |
| 9        | 错误恢复           |         3 | 错误靠近来源并给出重试；真实后端恢复未联调。                   |
| 10       | 帮助与文档         |         3 | API、事件和 schema 说明齐全，但参考页仍可更任务化。            |
| **总计** |                    | **30/40** | **Good；无 P0、P1 或 P2。**                                    |

## 设计特异性与整体判断

界面明显落在 LinkX 管理工作流中：布控日期、告警窗口、任务负责人、排班导入和文件状态都不是可直接搬到任意产品的占位文案。视觉基础复用了 Element Plus 习惯和 lx-ui 令牌，产品特征主要由业务语境和状态反馈体现。整体可用、克制且适合运营型后台；最大机会是统一 Demo 控件的发现路径，减少展示设置与真实工作流动作的混排。

认知负荷评估为低负荷：本轮八项检查清单均未失败，测试决策点的可见选项不超过四项。Upload 首段把文件格式、Mock、拖拽、自动上传、进度和取消放在一段文字中，是主要的阅读负担，但没有遮挡操作。

## 浏览器与 detector 证据

Assessment B 对三个源码目录和三份中文文档共六个目标保存原始 stdout JSON、stderr、退出码和命令记录。有效扫描必须同时满足 JSON 可解析、stderr 为空且退出码为 0；目标的 `[]` 只表示静态规则零命中，不表示视觉通过。十个全新浏览器 context 均导航 HTTP 200，注入成功并运行 `impeccableScan()`，页面异常和失败请求为 0；上传失败场景的 `UploadAjaxError` 是主动触发的预期 Mock。

Overlay 命中逐项归因如下：

- DatePicker 的文字遮挡命中来自展开日历覆盖底层标题或标签，属于弹层的预期覆盖；短高度桌面弹层与触发器保留间隙，375px 弹层落在视口内。
- HUD 下大量 `ai-color-palette` 命中是已启用 cyan 令牌及其 SVG/path 重复节点；DynamicForm 的移动低对比度和文字覆盖候选均为隐藏或视口外节点。
- 文档壳层、Shiki、侧栏、目录和复制按钮命中不归因给组件。
- Upload 375px 文件名省略是文档规定的窄屏行为；源码保留完整文本、`title` 和包含完整名称的操作标签，新增 E2E 断言验证 `title`。
- Upload HUD 标题/提示的对比度候选保留为后续共享主题令牌复核，不在本波改动组件语义。

六项目录、逐场景 overlay/evidence/console-network、截图、哈希和服务启停证据位于：
`.impeccable/critique/wave4-dynamicform-2026-10-07/final-assessment-b-current/`。

## 重点建议与处理结果

1. **[P3] Demo 主题和状态控制发现路径不一致。** Assessment A 建议三个 Demo 统一主题入口；本波记录为后续共享文档壳层任务，未改变业务组件契约。
2. **[P3] Upload 的失败注入按钮邻近真实操作。** 建议后续移入本地 Mock 设置分组；本波保留现有可观察 Demo 行为，未将测试控制伪装成生产操作。
3. **[P3] Upload 首段说明偏密。** 建议后续把交互细节移入折叠说明；本波没有删减文案，避免改变组件文档事实。
4. **[P3] 短视口回归需要锁定触发器关系。** 已补 E2E：检查 320/390×375 下触发器在视口内、弹层不与触发器相交，并验证弹层内部 `scrollTop > 0`；最新 DatePicker/Upload 文档 E2E 31/31 通过。

## 代码复审与验证

独立只读代码复审检查了 DynamicForm 字段 renderer、DatePicker 定位与清理、Upload fallback UID/Abort、Demo 和测试，未发现可复现 P0–P2。复审另记录 fallback UID 回灌后调用公开 `abort()` 的组合路径缺少直接测试，列为非阻断项并交给后续 Upload 复验。新增 E2E 复审只提出并确认了上述 P3 断言缺口。复审记录见[最终代码复审](code-review-final/final-review.md)，收口核验见[独立最终核验](agent-wave4-final-verify.md)。

当前最终验证记录为：定向单测 89/89；三份文档 E2E 合并 43/43，最新 DatePicker/Upload 子集 31/31；另将 lx-ui 文档 E2E 从已被其他项目占用的 4176 隔离至 4177，并同步 Switch 的本地来源白名单，Switch 兼容用例 6/6；Vue3 与 lx-ui 类型检查、目标 ESLint/Prettier、203 模块库构建、VitePress 文档构建和 `git diff --check` 通过。文档构建保留既有大 chunk 警告，pnpm 仍提示旧 `onlyBuiltDependencies` 配置。

## 评审证据

- [Assessment A 独立视觉与交互评估](final-assessment-a-current/report.md)：评分、问题和浏览器截图索引。
- [Assessment B 浏览器与 Detector 综合记录](final-assessment-b-current/assessment-b-report.md)及[六个目标证据索引](final-assessment-b-current/assessment-b-six-targets-evidence-index.md)：原始扫描、overlay 与浏览器证据。
- [最终代码复审](code-review-final/final-review.md)：复审结论及非阻断测试空缺。
- [独立最终核验](agent-wave4-final-verify.md)：测试数量、命令、Detector 状态和白名单核验。

## 未关闭边界

本波没有进行真实上传服务端或真实权限身份联调，没有逐项关闭 `LxForm` 设计稿差异，也没有迁移 Vue3 业务页面或移除宿主 `element-plus`。UI-10 全库严格矩阵和 UI-11 整站 Critique 仍保持开放。下一波为 TreeSelect/Cascader 当前版复验，以及 `LxSelectPagination` 的表单 disabled 继承、迟到响应隔离、续页失败同页重试和禁用不发请求闭环。

## 持久化记录

Impeccable snapshot：`.impeccable/critique/2026-10-07T03-11-47Z__linkx-fe-src-components-lxdynamicform-index-vue.md`。按目标路径查询 trend 后仅返回本次 30/40 记录；这是该目标首次保存的正式分数，暂无历史趋势。

组件与测试提交：`a2ba943 fix(lx-ui): finalize DynamicForm date picker and upload flows`。项目计划、交接及正式审查证据由配套 `docs(project)` 提交归档。
