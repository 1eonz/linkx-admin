---
target: linkx-fe/src/components/LxVirtualTree/index.vue
total_score: 31
max_score: 40
p0_count: 0
p1_count: 0
p2_count: 3
review_status: completed
target_identity: "file:F:\\work\\linkx-admin\\linkx-fe\\src\\components\\LxVirtualTree\\index.vue"
target_fingerprint: "sha256:e45951f1aae8936a9eb9c6213451500077cb26b86b2188ab3c98529e0d835104"
target_path: "F:\\work\\linkx-admin\\linkx-fe\\src\\components\\LxVirtualTree\\index.vue"
timestamp: 2026-10-10T20-49-18Z
slug: linkx-fe-src-components-lxvirtualtree-index-vue
---
# LxVirtualTree / LxTransferPanel 改后综合 Critique

评审日期：2026-10-11。目标为 `linkx-fe/src/components/LxVirtualTree/` 与 `linkx-fe/src/components/LxTransferPanel/index.vue` 的当前工作区版本，界面模式为 Operate。Assessment A、Assessment B 和代码复审分别隔离完成，只有在本报告中综合。权限宿主、真实后端和 Vue3 业务页面不在本次组件级评审范围内。

## 设计健康度

| 启发式 | 分数 | 结论 |
|---|---:|---|
| 系统状态可见性 | 3/4 | 树筛选计数、选中反馈、加载/错误/空态和 TransferPanel 选择上限均有反馈；持久化结果仍由宿主提供。 |
| 系统与现实世界匹配 | 4/4 | 组织、部门编码、状态、继承和未加载授权语义适用于权限配置场景。 |
| 用户控制与自由 | 3/4 | 可筛选、批量操作、危险清空确认、重试、全文展开和键盘树导航完整；单项选择撤销与批量快捷键仍有限。 |
| 一致性与标准 | 3/4 | 公开行布局、设计令牌、亮色/HUD 和桌面/窄屏触控尺寸一致；批量操作的图标、标签和原因提示仍分散。 |
| 错误预防 | 3/4 | 禁用节点、选择上限、未加载授权和危险清空有护栏；保存失败恢复属于宿主。 |
| 识别而非回忆 | 3/4 | 名称、状态、编码、数量和全文入口可见；更多反选动作仍在渐进披露区域。 |
| 灵活与效率 | 3/4 | 虚拟滚动、过滤反选、跨树选择、Space/Enter 和方向键支持高频操作；没有更高阶批量快捷键。 |
| 审美与极简 | 3/4 | 组件本身密度适合权限台账；窄屏已选首屏、批量动作层级和 Demo 控制仍有认知负荷。 |
| 错误识别、诊断与恢复 | 3/4 | 错误保留选择并提供重试，清空有确认；组件无法替宿主诊断保存接口失败。 |
| 帮助与文档 | 3/4 | 中文 API、固定行布局、键盘、摘要和宿主边界已记录；首次使用仍需理解反选范围和 `nodeSummary`。 |
| **总计** | **31/40** | **Good：核心交互可靠，仍有明确的密度和渐进披露优化项。** |

## 综合结论

本波完成了 VirtualTree 插槽行布局的公共契约化：`rowLayout` 将 `single`、`stacked` 和 `responsive` 的行高、虚拟占位、滚动定位与焦点恢复绑定到同一几何规则；`nodeSummary` 为固定行中的插槽元信息提供完整 `aria-label/title`。TransferPanel 改为使用公开契约，树行元信息不再依赖宿主 `:deep` 覆盖；窄屏长名称有可键盘操作的“查看全文/收起”。

Assessment A 观察到的多行 slot 裁切风险现在被明确写入公共边界：固定行虚拟化只承载展示型单行元信息，任意块级/多行内容不会撑高行；需要完整内容时由宿主返回 `nodeSummary`。这保留了虚拟滚动的稳定性，也避免调用者误以为 slot 可以改变行几何。真正需要可测量多行内容时，应另建可测量高度模式，不在本波偷偷改变固定窗口算法。

Assessment B 的四个静态目标（VirtualTree 组件、类型、Demo、TransferPanel 组件）均记录了合法 JSON `[]`、空 stderr、退出码 `0`；这只代表静态 detector 零命中。六个独立浏览器视图均 HTTP 200、脚本注入成功、无 page error/request failure，并保存 overlay、DOM、长筛选、键盘、HUD 和减少动效证据。overlay 中的 VitePress 文档壳、HUD 颜色提示、标注层和 `/favicon.ico` 404 已逐项归因；TransferPanel 弹出操作区的细边框/阴影和窄屏已选项内距经代码复审确认有设计依据，作为后续视觉观察记录，不能因为静态 `[]` 而抹掉。

## 评审建议处理

- **插槽固定行高（原 P1）**：通过公开类型、中文文档和 `nodeSummary` 形成明确契约；不把任意多行 slot 当成可撑高内容。多行压力 Demo 和相邻行几何 E2E 保留，完整摘要单测覆盖 `aria-label/title`。
- **窄屏已选列表首屏密度（P2）**：保留后续任务。当前列表内滚动和“下方还有 N 项”提示可用，但 240px 紧凑高度下首屏可见项偏少。
- **批量动作层级（P2）**：保留后续任务。窄屏仍同时呈现图标、动作标签和名额说明，禁用原因可继续收拢到动作块。
- **Demo 控制墙（P2）**：已拆成“数据操作与定位”和“边界与外观”两级，但全部展开仍会增加首屏决策点，后续可继续收敛默认入口。
- **TransferPanel 弹出区边框/阴影与移动条目内距（观察项）**：Assessment B 记录了规则命中，代码复审确认边框/阴影对应弹层边界和层级，移动内距对应 44px 触控行的紧凑设计；后续密度波次再结合设计稿复看。
- **代码审查 P3 已关闭**：`LxVirtualTreeNodeSlotProps` 注释已改为说明 `single`、`stacked`/`responsive` 和展示型元信息，和实现/文档一致；独立代码复审结论为无 P0-P3 缺陷。

## 验证与证据

- 定向单测：`lx-virtual-tree.test.ts` 与 `lx-transfer-panel.test.ts` 合计 **67/67**。
- 文档 E2E：VirtualTree **14/14**；TransferPanel **33/33**；另有 TransferPanel 长名称补充 **3/3**。
- 工程检查：`linkx-fe` `vue-tsc --noEmit`、203 modules 库构建、VitePress 文档构建、Vue3 生产构建、目标 Prettier、ESLint 和 `git diff --check` 均通过。
- Assessment A：`.impeccable/critique/lxvirtualtree-wave11-2026-10-11/assessment-a-postfix/report.md`，含 10 张截图、浏览器 JSON 和证据索引。
- Assessment B：`.impeccable/critique/lxvirtualtree-wave11-2026-10-11/assessment-b-postfix/report.md`，含四个 detector 三件套、六组浏览器视图、overlay、DOM、键盘和服务停止记录。
- 代码复审：`.impeccable/critique/lxvirtualtree-wave11-2026-10-11/code-review-luna-max-postfix.md`，结论批准，无 P0-P3。
- 服务清理：Assessment B 复核 `5194`、`8427` 无监听；旧 Assessment A 服务 `5193` 已释放。当前没有把用户的 `4174` 预览当作本波测试服务重启。

## 交付边界

本波没有替换 Vue3 业务页面的 Element Plus，没有删除宿主 `element-plus`，没有接入真实权限保存、权限中心、文本/字段权限或引导页，也没有改变 API 请求的 `.then().catch().finally()` 规则。UI-10 全库严格矩阵仍为 `0/52`；这些项目按计划在组件库门禁和整站 Impeccable 之后继续。

Questions skipped: 用户已明确要求按计划自动推进，本波遗留项已按优先级写入项目台账，不单独等待确认。
