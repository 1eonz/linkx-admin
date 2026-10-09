# Wave 7 Assessment A：LxTransferPanel 与 LxVirtualTree

**方法**：独立设计评审（Assessment A）；未读取 Assessment B、detector 输出或旧 Critique 报告。评审仅依据当前源文件、两个当前文档页和设计资产 `design/虚拟滚动树 + 双栏穿梭/`。

**浏览器证据**：Playwright 包未安装；使用 Chrome 154 的独立 profile、browser context 和新 page，经 DevTools Protocol 检查 VitePress 页面。最终 URL 为 `http://127.0.0.1:8177/components/lxtransferpanel.html`（标题：`LxTransferPanel 双栏穿梭 | LxUI`）和 `http://127.0.0.1:8177/components/lxvirtualtree.html`（标题：`LxVirtualTree 虚拟树 | LxUI`）。两页 Demo 根节点均可见。1440×1000 下文档宽 1425px；375×812 下文档宽 375px，未见水平溢出。8177 是为当前 `linkx-fe` 源码启动的 VitePress 预览，已在截图后以 Ctrl+C 停止；已有的 8001/8002/8003/8006/8191 页面返回旧 Dumi 的“页面未找到”，未用作设计判断。

截图采集信息见 [browser-capture.json](browser-capture.json)，四张视口截图见 [screenshots](screenshots/)。

## 设计特异性

**判断：中等偏高的业务特异性，常规的企业级视觉表达。** 两个控件采用标准的树与双栏选择布局，主色、间距、圆角和状态点符合 LxUI 令牌；组成形态单独看可用于许多后台产品。组织/部门编码、禁用或未加载节点、状态、选择上限和下级授权继承把信息架构落在权限任务上，设计资产中的组件标本也与当前桌面结构一致。产品性格主要来自这些行为和内容，不来自独特的视觉语言。

## 设计健康评分

| # | Nielsen 启发式 | 分数 | 关键观察 |
|---|---|---:|---|
| 1 | 系统状态可见性 | 3 | 两侧数量、当前已选数、操作状态、容量不足说明均可见；加载与错误由宿主提供，示例状态默认收起。 |
| 2 | 系统与现实世界匹配 | 3 | “组织”“部门编码”“已选授权”等贴近任务；API 名称和“反选”等术语仍需产品经验。 |
| 3 | 用户控制与自由 | 3 | 可过滤、清除、逐项移除、切换两侧；未加载授权移除前有确认，组件自身不提供通用撤销。 |
| 4 | 一致性与标准 | 3 | 两页使用一致的 LxUI 令牌、树交互和状态表达；桌面双栏切为移动端面板切换，规则保持清楚。 |
| 5 | 错误预防 | 3 | 禁用项、数量上限和未加载项确认能拦截常见误操作；级联及继承范围仍依赖说明文字。 |
| 6 | 识别优于回忆 | 3 | 操作名称、节点编码、状态和选择数可见；实例方法和筛选规则需查文档。 |
| 7 | 灵活性与效率 | 3 | 支持筛选、批量加入/反选、树键盘操作及实例方法；没有可见的快捷键或可定制操作。 |
| 8 | 美观与极简 | 3 | 面板划分、层级和颜色克制；长组织名、编码、状态与权限说明使界面密度偏高但适合管理任务。 |
| 9 | 错误识别与恢复 | 3 | Demo 有空、加载、失败和重试；权限数据的加载、保存失败恢复由宿主承担，文档有说明。 |
| 10 | 帮助与文档 | 3 | Props、事件、键盘、边界与示例较完整，且可从文档站访问；帮助主要按组件 API 组织，缺少控件旁的任务解释。 |
| **合计** |  | **30/40** | **Good：基础稳固，优先补强权限范围说明与读屏定位。** |

## 认知负荷

初始页面为**低认知负荷，1 项清单失败**。大部分复杂度被收在“示例状态和更多操作”中；打开 LxVirtualTree 高级操作后，“树操作”同时列出 8 个动作和 2 个开关，超过单一决策点的 4 项建议值。初始状态下，双栏按来源/已选分组，移动端一次显示一侧，操作范围和选择数量可见。

| 检查项 | 结果 | 依据 |
|---|---|---|
| 单一焦点 | 通过 | 主任务是选择节点；示例宿主状态默认收起。 |
| 信息分块 | 通过 | 来源树、批量动作、已选清单分别成组。 |
| 相关信息分组 | 通过 | 节点名称、编码和状态处于同一行；已选节点集中显示。 |
| 视觉层级 | 通过 | 面板标题、数量、列表和主要操作层次明确。 |
| 一次处理一件事 | 通过 | 移动端可在“待选/已选”间切换；加载状态由宿主单独呈现。 |
| 最少选项 | **失败（展开高级 Demo 后）** | LxVirtualTree 的“树操作”组同时显示 8 个命令和 2 个开关；收起时不干扰初始任务。 |
| 工作记忆 | 通过 | 来源树与已选清单并列；移动端切换项保留两侧计数。 |
| 渐进披露 | 通过 | 状态/主题和高级演示操作使用原生折叠区；详细 API 留在文档章节。 |

## 情绪旅程

进入示例先看到“已载入组织权限数据”和两侧数量，建立数据就绪感。选择时名称、编码、状态、勾选和选中清单相互确认；接近上限时说明“需加入 2 项；仅剩 1 个名额”，避免部分写入带来的不确定。对无法识别的旧授权，界面标出“节点未加载”，移除前再确认，风险提示有针对性。操作结果由状态文案和数量收尾。主要情绪低谷在下级继承开关：权限范围影响较大，但实际规则说明可选，且在桌面面板底部以较小字号靠右呈现，初看不如开关本身醒目。

## 优点

1. 双栏桌面结构把待选和已选并置；375px 下转为两侧计数清晰的切换按钮，页面没有横向溢出。
2. 权限边界考虑充分：已加载/未加载、禁用、选择上限和旧授权均有不同反馈，清空或移除未加载项会确认。
3. 虚拟树示例覆盖 240 个节点、键盘操作和宿主状态；穿梭面板以 1,420 个本地节点呈现大数据密度，同时将演示设置收起。

## 优先问题

1. **[P2] 独立虚拟树的父子级联缺少操作时提示**：LxVirtualTree 默认 `checkStrictly: false`，可级联勾选；当前树行附近没有说明，行为解释主要在文档和默认收起的 Demo 控件中。用户勾选父节点前难以判断会影响多少子项。建议在启用复选框且级联时，于树标题附近说明范围，并在勾选后反馈新增节点数。注意：LxTransferPanel 明确给内嵌树传 `check-strictly`，此问题针对独立 LxVirtualTree 的默认用法，不适用于穿梭面板。证据：[LxVirtualTree/index.vue:32](../../../../../linkx-fe/src/components/LxVirtualTree/index.vue:32)、[LxTransferPanel/index.vue:753](../../../../../linkx-fe/src/components/LxTransferPanel/index.vue:753)、[lxvirtualtree.md:20](../../../../../linkx-fe/docs/components/lxvirtualtree.md:20)。建议命令：`/impeccable clarify`。
2. **[P2] 继承开关的影响说明容易被忽略**：`inheritChildDescription` 默认可缺省；缺省时“保留下级继承授权”仍可操作。示例虽给出直属下级范围，说明在面板底部小字位置，与开关视觉分离。实际宿主若遗漏该 prop，用户无法知道关闭后的具体影响。建议业务集成在开关旁固定提供经确认的范围描述；必要时由宿主在变更前确认高影响策略。证据：[LxTransferPanel/index.vue:994](../../../../../linkx-fe/src/components/LxTransferPanel/index.vue:994)、[lxtransferpanel.md:37](../../../../../linkx-fe/docs/components/lxtransferpanel.md:37)。建议命令：`/impeccable clarify`。
3. **[P2] 虚拟化树项没有暴露集合位置和总数**：可见 `treeitem` 有层级、展开、勾选和禁用状态，但没有 `aria-posinset`/`aria-setsize`。在 240 或 1,420 个节点的窗口化树中，读屏用户难以判断当前项处于同级集合的什么位置、还有多少项。建议按过滤后的同级节点集合给可见行补齐位置和总数语义，并用读屏器复验。证据：[LxVirtualTree/index.vue:571](../../../../../linkx-fe/src/components/LxVirtualTree/index.vue:571)。建议命令：`/impeccable harden`。

## 人物红旗

**Alex（熟练操作员）**：批量加入、反选、搜索和树键盘操作缩短大量节点的选择时间。没有专用快捷键；更重要的摩擦是打开高级演示后动作过多，以及独立树的级联范围不在操作点显现。

**Sam（键盘与读屏用户）**：组件使用树/树项语义、箭头键和空格/回车，筛选、清除及状态信息也有可访问名称或直播区域。虚拟窗口的读屏位置/集合规模不明确，尤其会影响长树中的定位和进度感。

**Riley（边界测试者）**：示例覆盖空、加载、失败、选择上限和未加载既有授权，错误状态提供重试。实际加载、保存失败及权限语义仍由宿主组合，单看组件 Demo 不能确认各宿主都保留了草稿并提供匹配的提示。

## 细节观察

- 原型 `screen.png` 的桌面树与穿梭面板结构在当前实现中延续；当前实现更清楚地区分状态、编码、选择上限和窄屏行为。
- 375px 截图里两个面板切换按钮都保留数量；节点名在移动行中换行，按钮保留触控区域，截图中页面宽度与视口相同。
- 状态同时有圆点和文字，选择状态有勾选与浅蓝底，不依赖颜色单独传达。
- 截图评估的是默认亮色和默认示例状态；HUD、错误/加载、读屏器和真实宿主权限流程未在本次 Assessment A 中单独操作或验证。

## 证据哈希

以下为评审时工作树内容的 SHA-256，用于标识本次读取版本。

```text
272E4682FB23216223446775C7A17B8CC86AC60174CDA06B805C5351FCDCECAA  linkx-fe/src/components/LxTransferPanel/index.vue
AD19C9CDDCD7EF7BDCC03D1A0F440D1773219163DAA9E20F1BE4B7896443DA8F  linkx-fe/src/components/LxTransferPanel/types.ts
641C38B92B957C2F0335D3939A2D09F953404DC4FE65C0CB605738298F90249B  linkx-fe/src/components/LxTransferPanel/demo/basic.vue
0466D77963DE46A3FEF76C58375B3AAB96874D699B8E15F95EA5C81C84BE247C  linkx-fe/src/components/LxVirtualTree/index.vue
94C1D543AD1A27AA27FEDE4D229B2995F5B3C6424AC480E8BB9C987AFE76D992  linkx-fe/src/components/LxVirtualTree/types.ts
06AAAF1458985D1A8A1BA673612258F4B569530ACB48B10F1C4FBB24B9CD4EDE  linkx-fe/src/components/LxVirtualTree/demo/basic.vue
5981D79D0E9610B6D7DDE06160CB12B37EEF3500C0F02D986C6BEFF399E6619F  linkx-fe/docs/components/lxtransferpanel.md
A82E19A73035BEB6947B8E3AE56EA13601833C32877F3356F7C1D6ED0A46C93B  linkx-fe/docs/components/lxvirtualtree.md
0CD58711D0C646BD295E26FEE03F9CA28371FBF895C22E9EA8E31542B54FFEBD  doc/lx-ui/DESIGN-SPEC.md
D523F7C5167DDAF3A3DA6BFDA68B9F29773CB4F89AE54A8DF7A413AABD853CEA  design/虚拟滚动树 + 双栏穿梭/code.html
4BDF7DED1C8D2272F0AFBB7706A2F103B888D3DAF72BF472204C1AA7DB9DE4F5  design/虚拟滚动树 + 双栏穿梭/screen.png
```

## 待讨论问题

1. 独立树启用级联选择时，是否应始终显示受影响范围，而不是只在文档中说明？
2. `inheritChildDescription` 对权限面板的安全理解如此关键，真实宿主是否应把业务确认过的说明视作必要配置？
3. 虚拟树是否应为筛选后的可见节点提供读屏用户可感知的同级位置和总数？
