Method: independent Assessment A (fresh Playwright contexts; no historical Critique, detector output, or Assessment B input)

# LxIcon 独立设计评审

评审对象：`linkx-fe/docs/components/lxicons.md`、`linkx-fe/src/components/LxIcon/index.vue`、`linkx-fe/src/components/LxIcon/icons.ts`。设计对照包括 `doc/lx-ui/ICON-DESIGN.md`、三组 `design/` 参考、三组 `doc/LxIcon*` 标本。浏览器使用全新无状态 context 访问 `http://127.0.0.1:4174/components/lxicons.html`；覆盖 1440×1000、375×812、浅色、根节点 `.lx-theme-hud`、鼠标 hover、键盘焦点、reduced-motion、过滤空态，以及用内存 stub 模拟复制成功/失败。未修改产品代码。

## 设计特异性

图标几何遵循项目约定：24×24 viewBox、1.5px 描边、round cap/join、currentColor；P0/P1/P2 图形在截图中与设计标本整体一致。P0 高频、P1 业务语义、P2 通用补充是 LinkX 项目自己的分类，能看出业务来历。当前文档页的展示方式仍较通用：卡片只有图形和英文 kebab-case 名称，没有标本中的中文语义、场景或消歧说明，因此项目已经做出的语义设计没有传达到使用者。

## Design Health Score

| # | 启发式 | 分数 | 主要观察 |
|---|---|---:|---|
| 1 | 系统状态可见性 | 3/4 | 过滤即时更新，空态明确；复制成功回传完整代码，失败给出手动复制建议。 |
| 2 | 贴近真实世界 | 2/4 | 图形大多容易辨认，但卡片只标英文标识；`switch`、`power`、`logout` 等相近语义缺少中文场景说明。 |
| 3 | 用户控制与自由 | 3/4 | 搜索可随时改写，页内目录可以跳转；无需进入强制流程。 |
| 4 | 一致性与标准 | 3/4 | 网格、笔画、尺寸呈现一致；动效覆盖和 HUD 文档上下文存在局部差异。 |
| 5 | 错误预防 | 2/4 | 卡片是原生 button 且有名称，但组件接受任意 string；未知名称映射为空路径，会静默留下空图标。 |
| 6 | 识别而非回忆 | 2/4 | 图形和英文名同时可见，搜索也有效；用户仍须记住英文名，无法按中文用途检索。 |
| 7 | 灵活高效 | 3/4 | 名称过滤和一键复制有效；没有尺寸/颜色预览器，也没有按语义过滤。 |
| 8 | 美观与简约 | 2/4 | 浅色网格克制易扫；HUD 下说明标题变浅而页面仍白，主题呈现断层。 |
| 9 | 错误识别与恢复 | 3/4 | 空态和复制失败均给出明确反馈；失败提示可再附上当前图标代码，免得用户回到上方示例重组。 |
| 10 | 帮助与文档 | 3/4 | 有用法、尺寸规范、分组和兼容别名；单枚图标没有用途说明。 |
| **总计** |  | **26/40** | **Acceptable：可用基础扎实，语义检索和主题呈现需改进。** |

## 整体印象

浅色模式下，94 个图形、96 个名称以稳定网格呈现，笔画和常规颜色符合设计基线。名称过滤、空结果提示和复制反馈构成了明确的查找路径。当前最大机会是把标本中已有的中文用途信息放回卡片，并让 HUD 文本和它所在的表面使用同一套主题上下文。

## 做得好的部分

- 组件按单色描边输出，图标会继承当前文字颜色；实测 stroke-width 为 1.5px。`delete` 的动作微反馈清晰，`prefers-reduced-motion` 下动画、变换和过渡均关闭。
- 页面搜索能过滤名称并呈现“无匹配图标”；复制成功显示完整 `<LxIcon name="delete" :size="20" />`，失败提示“复制失败，请手动复制代码”。本次通过内存 clipboard stub 检查，没有写入宿主系统剪贴板。
- 375px 视口没有横向溢出，卡片为两列且触控面积充足；图标与文本不会相互覆盖。

## 优先问题

1. **[P1] HUD 标题与白色页面表面失配**：加上受支持的 `.lx-theme-hud` 后，卡片背景变为 `rgb(16, 26, 44)`，但页面正文仍是白色；分组标题却变为 `rgb(226, 232, 240)`，在白底上几乎不可读。用户会失去当前分类线索。让 HUD 背景和文字令牌覆盖同一内容区域，或让文档标题保留适配宿主表面的前景色。建议 `/impeccable harden`。
2. **[P1] 图标没有中文语义，名称过滤也只搜英文**：页面卡片只呈现图形与 `delete`、`switch`、`power` 等代码名。对照标本，P0/P1/P2 卡片有中文用途和场景；在线页面缺失后，调用者难区分“停用”“电源/登出”“退出登录”等含义，也无法用中文业务词搜图标。增加简短中文释义，并让过滤同时覆盖名称、语义和兼容名。建议 `/impeccable clarify`。
3. **[P2] 键盘焦点缺少明确边界**：实测 Tab 到 `delete` 后 `:focus-visible` 为真，但计算样式是 `outline-style: none`、边框仍为 `rgb(228, 231, 237)`，只有 `rgb(236, 245, 255)` 的浅背景变化。键盘用户在 96 项网格里不易定位当前项；这也没有满足 `DESIGN-SPEC §9` 的 2px primary 外圈、2px offset 约定。加入符合令牌对比的外圈。建议 `/impeccable audit`。
4. **[P2] 动效范围与页面文案不一致**：页面将动效描述为图标 Hover/focus 微动效；浏览器中 96 个卡片只有 69 个 SVG 带 `data-lx-motion`。`delete` hover 有 0.35s 抖动，`dashboard` 没有图标运动；P2 卡片的 `location-arrow` 也没有进入动效名单。若这是刻意挑选的动效集，应把文案限定到这 69 个名称；若承诺覆盖全量图标，则为余项定义克制且语义合适的反馈。建议 `/impeccable animate`。

## Persona Red Flags

- **Jordan（初次使用）**：只看到图形和英文代码名；要把 P0 的 `undo` 与 `refresh`、P1 的 `switch` 与 `power`、P2 的 `logout` 对应到中文动作，需要另查设计文档。中文释义会直接减少误选。
- **Sam（键盘/辅助技术）**：过滤框之后，Tab 到 P0 `delete` 要经过 27 次 Tab；即使聚焦后，按钮也没有可见外圈。先用名称过滤可缩短路径，但低对比焦点状态仍影响全键盘定位。
- **Casey（手机单手用户）**：375px 下不会横向滚动，卡片也足够大；不过搜索框在文档纵向约 942px、首组卡片约 1010px 才出现，入口需要先越过标题和用法说明。页内目录提供绕行入口，但首屏没有直接的图标搜索。

## 认知负荷

按技能清单 8 项评估：3 项失败，整体为中等负荷。单一任务、视觉层级、类别邻近分组和“名称留在卡片上”都有效；但组内仍同时摆出 10–29 个选项，没有渐进展开，且最前的用途说明会把搜索/卡片推到首屏以下。分组和搜索缓解了总量，但不能替代中文语义标记。

- 失败：信息块不小于 4 项；可选项超过 4 个；各组默认全部展开。
- 通过：单一焦点；相关图标按类别邻近；有清楚的标题层级；一次只需选择一个图标；名称始终可见，不需要回忆选项。

## 次要观察

- 移动版页面高度约 7545px。页内目录缓解长滚动，搜索仍可上移到图标列表入口。
- `ICON-DESIGN.md` 和在线页写三档 16/18/20px；P0/P1/P2 标本工具栏还展示 24px。需要说明 24px 是标准支持尺寸还是标本中的临时预览档。
- 页面文案说复制完整用法；成功路径已确认，失败文案只提示手动复制，没有显示本次点击对应的代码。上方通用示例不包含当前所选名称。

## 评审问题

- 卡片是否应统一显示简短中文语义，并将这些语义纳入搜索？
- HUD 模式是要预览整个文档内容，还是仅预览图标卡片？目前两种表面混在一起。
- 动效是否只为高频动作设计？如果是，文案是否应明确列出 69 个适用名称？

## 浏览器证据

根目录：`F:\work\linkx-admin\.impeccable\critique\wave3-lxicon-2026-10-06\assessment-a\`

- 全量桌面与主题：`desktop-light-full.png`、`desktop-hud-full.png`；首屏：`desktop-light-viewport.png`、`desktop-hud-viewport.png`。
- 设计类别：`desktop-light-p0.png`、`desktop-light-p1.png`、`desktop-light-p2.png`；清单与名称：`desktop-groups.json`。
- 手机：`mobile-375-light-full.png`、`mobile-375-hud-full.png`；另有首屏 `mobile-375-light-viewport.png` 和 `mobile-375-hud-viewport.png`。
- 状态：`desktop-hud-hover-dashboard.png`、`desktop-hud-hover-delete.png`、`desktop-light-keyboard-focus.png`、`desktop-light-reduced-motion-hover.png`、`desktop-hud-empty-state.png`、`desktop-light-copy-success.png`、`desktop-light-copy-failure.png`。
- 计算样式与交互结果：`browser-summary.json`、`desktop-hover.json`、`desktop-focus.json`、`desktop-reduced-motion.json`、`copy-feedback.json`；可复跑的捕获脚本：`browser-evidence.mjs`。
