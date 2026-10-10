Method: dual-agent (A: /root/transferpanel_p2_assessment_a_luna · B: isolated and withheld)

# Assessment A Recheck：LxTransferPanel / LxVirtualTree

## 复核结论

**Design Health Score：34/40（Good，85%）**

本轮只复核当前工作区源码渲染，不读取或引用 Assessment B、detector 或 overlay 结果。上一轮的三个主要问题已经有可观察修复：TransferPanel Demo 默认高度由 240px 调整为 380px；已选长名称在桌面和窄屏均显示“查看全文”，展开后显示“收起”；VirtualTree 的三个折叠入口均有可见的 14px `chevron-down` 图标，展开时旋转且减少动效下过渡被压缩。

## 评分

| # | Nielsen 启发式 | 分数 | 复核观察 |
|---|---|---:|---|
| 1 | 系统状态可见性 | 4/4 | 380px 默认高度、已选计数、滚动剩余提示、HUD 状态、加载/错误文案和 `aria-live` 均可观察。 |
| 2 | 系统与现实世界匹配 | 3/4 | 组织编码、在线/处理中/停用、未加载节点和继承授权继续符合权限核对语境；批量上限说明仍需阅读多行文字。 |
| 3 | 用户控制与自由 | 3/4 | 面板切换、单项移除、清空确认、撤销和长名称展开均保留；“全量加入”受上限拒绝时没有按剩余名额分批加入的快捷路径。 |
| 4 | 一致性与标准 | 4/4 | 树、穿梭动作、状态点和折叠摘要沿用 lx-ui 图标/令牌；VirtualTree 的折叠入口在桌面和 390px 视口都保留可见 chevron。 |
| 5 | 错误预防 | 3/4 | 禁用节点、未加载危险确认、选择上限和滚动提示能降低误操作；紧凑 240px 仍会较早进入列表滚动。 |
| 6 | 识别而非回忆 | 4/4 | 桌面长名称已提供可见“查看全文”，展开后有“收起”；数量、编码、状态和未加载标记保持在条目内。 |
| 7 | 灵活高效 | 3/4 | 虚拟树、筛选批量、全量操作、移动面板和焦点样式覆盖熟练用户；窄屏批量动作仍要阅读多层计数/原因。 |
| 8 | 审美与极简 | 3/4 | 推荐 380px 状态接近设计标本，首屏核对空间明显改善；240px/320px 的中栏动作仍形成第三个信息面板。 |
| 9 | 错误恢复 | 3/4 | 清空确认、撤销、加载失败重试和保留选择均可见；真实保存成功/失败仍由宿主提供。 |
| 10 | 帮助与文档 | 4/4 | 文档已说明标准高度、窄屏滚动、长名称和 HUD 范围；三个 VirtualTree summary 的图标使渐进披露入口可发现。 |
| **总计** |  | **34/40** | **Good（85%）** |

## 已处理的上一轮问题

- **P1：Demo 默认 240px 压缩已选清单**：已处理。`transfer-evidence.json` 的 `desktop380.panelHeight` 为 `380`，截图中的高度选择器显示“标准 380px（默认）”；240px 与 300px 仍作为显式边界选项保留。
- **P2：桌面长名称只有 chevron**：已处理。`desktop380.longNameDisclosure` 显示 `查看全文`，展开状态显示 `收起`；`transfer-desktop-long-name-expanded.png` 可见完整名称、编码、状态和移除按钮。
- **P2：VirtualTree 折叠入口不明显**：已处理。三个 summary 均存在 `14 × 14` 的 `chevron-down` SVG；打开主 controls 后两个嵌套 summary 仍可见图标，`virtualtree-desktop-controls-open.png` 与移动截图均记录了结果。

## 剩余真实问题

### [P2] 批量动作、计数和禁用原因在紧凑布局中争夺层级

在 240px 桌面、390px 和 320px 视口，批量区同时展示图标、动作名、可加入/已选计数、需加入量、剩余名额和完整禁用原因。可观察状态是正确的，但中栏在视觉上接近第三个说明面板，主动作需要从多行小字中辨认。

建议保留按钮与一行短计数作为主层级；将完整原因放在 tooltip、统一状态行或可展开说明中。移动端可以让每个动作使用“图标 + 名称/计数”两行，并把原因置于动作下方独立一行。

### [P3] Demo 设置打开后仍是较大的验证决策集合

默认状态已折叠，主流程没有被阻塞；打开设置后仍会同时出现四个宿主状态、三个参数开关和高度选择。它是开发者验证工具，不影响业务组件，但文档读者需要自行决定先打开哪组状态。可考虑在设置摘要后补充简短数量提示，或将高度和状态分成两个更小的折叠组。

## 浏览器取证状态

- 页面：`http://127.0.0.1:4188/components/lxtransferpanel.html`、`http://127.0.0.1:4188/components/lxvirtualtree.html`。
- 使用 CDP `Target.createBrowserContext` 创建独立浏览器上下文和新页面；没有复用现有标签。
- TransferPanel 已检查 1440px 的 380/300/240px、桌面长名称展开、390px 与 320px 窄屏待选/已选、批量操作、设置展开、HUD 和 `prefers-reduced-motion`。
- `transfer-evidence.json` 显示 1440px 文档壳层 `documentClientWidth/documentScrollWidth = 1425/1425`；390px 为 `375/375`；320px 为 `305/305`，没有发现页面级横向溢出。
- 300px 和 240px 分别显示“下方还有 1 项”和“下方还有 3 项”；390px/320px 已选面板显示“下方还有 1 项，向下滚动查看更多”。
- HUD 复核显示 `hudPreview: true`，深色只作用于预览容器，文档站外壳保持浅色。
- `prefers-reduced-motion: reduce` 下 TransferPanel 与 VirtualTree 的摘要/组件过渡计算为约 `0.00001s`，VirtualTree summary 图标保留可见旋转状态但不产生明显动效。
- 本轮通过 CDP 读取了移除按钮的焦点和可见焦点框；合成输入没有作为“键盘删除成功”的新证据，键盘行为以已有 Assessment A 记录为对照，不在本报告重复宣称超出本轮取证的结果。
- 未运行 detector、overlay、单元测试、构建或真实后端联调；本文件是设计与浏览器人工复核，不是自动化验收结论。

## Questions skipped

以下内容本轮不作结论：真实后端保存成功/失败与权限联调；文件、Token 和生产鉴权链路；Assessment B 的 detector/overlay 规则命中。它们不属于本次独立设计复核范围。
