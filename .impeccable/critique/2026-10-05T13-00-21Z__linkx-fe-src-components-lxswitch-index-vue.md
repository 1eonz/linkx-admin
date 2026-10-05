---
target: LxSwitch 组件与文档复验
total_score: 32
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 0
target_identity: "file:F:\\work\\linkx-admin\\linkx-fe\\src\\components\\LxSwitch\\index.vue"
target_fingerprint: 'sha256:0d69cffbd94c7b15195f7b79082314d7bb4bfdb00dcb6c7b7debcc674ef4b2fa'
target_path: "F:\\work\\linkx-admin\\linkx-fe\\src\\components\\LxSwitch\\index.vue"
timestamp: 2026-10-05T13-00-21Z
slug: linkx-fe-src-components-lxswitch-index-vue
---

Method: dual-agent (A: /root/lxswitch_final_a · B: /root/lxswitch_assessment_b_final)

# LxSwitch 组件与文档综合评审

## 目标与证据

- 目标源码：`linkx-fe/src/components/LxSwitch/index.vue`；可见目标：`http://127.0.0.1:4195/components/lxswitch.html`。
- Assessment A 先独立检查设计样本 07 和当前组件页；最新修后报告以 29/40 为基线，对用户控制、控件识别和窄屏简约性三项各增加 1 分，得 32/40。其余启发式分数沿用基线；这不是一次全量重新打分。
- Assessment B 独立采集源码 detector 和隔离浏览器证据，未读取 Assessment A。报告和原始数据见 `.impeccable/critique/wave2-lx-switch-2026-10-05/final-recheck/postfix-assessment-b/`。
- 修后 A 报告与截图见 `.impeccable/critique/wave2-lx-switch-2026-10-05/final-recheck/postfix-assessment-a/`；移动宽度归因见 `.impeccable/critique/wave2-lx-switch-2026-10-05/final/assessment-b/mobile-overflow-recheck-addendum.md`。
- 浏览器由独立 headless Chrome/Playwright 页面完成。没有可控的用户交互浏览器标签，因此本报告不声称 `[Human]` overlay 正在用户浏览器显示。

## 设计健康度

| #        | 启发式         |      分数 | 关键观察                                                        |
| -------- | -------------- | --------: | --------------------------------------------------------------- |
| 1        | 系统状态可见性 |       3/4 | 状态文字、loading、失败与成功播报可见。                         |
| 2        | 贴近真实世界   |       3/4 | 业务示例明确；HUD、端侧等词对首次接入者仍偏专业。               |
| 3        | 用户控制与自由 |       4/4 | 状态可逆，锁定原因可见，窄屏触控目标达标。                      |
| 4        | 一致性与标准   |       3/4 | 与标本及 Element Plus 语义一致，默认内嵌文案有说明。            |
| 5        | 错误预防       |       3/4 | disabled/loading 阻止切换；生产确认策略由宿主决定。             |
| 6        | 识别而非回忆   |       4/4 | 控件有可访问名称，锁定原因关联到实际控件。                      |
| 7        | 灵活与效率     |       2/4 | 键盘、自定义值和文字模式齐全，没有批量操作路径。                |
| 8        | 美观与简约     |       4/4 | 375px Props 列对齐、文字折行，触控框不挤压胶囊。                |
| 9        | 错误识别与恢复 |       3/4 | Demo 首次失败保留原值，再次操作成功；这是本地模拟。             |
| 10       | 帮助与文档     |       3/4 | API 和宿主边界齐全，少量专业缩写尚未释义。                      |
| **合计** |                | **32/40** | **Good；这是有界修后复评，三项分数更新，其余沿用 29/40 基线。** |

## 设计特异性

**判断：产品场景明确，组件视觉遵从既定样本。** 40×20 胶囊、16px 滑块、状态色与外置状态文字对应 `design/表单控件八件套/code.html` 第 07 项；卡口研判、夜间静默和上级锁定让示例具备 LinkX 运维语境。文档站侧栏和文章容器属于通用 VitePress 外壳。

**LLM 评估：** 组件同时保留标本主形态、内嵌文字和两侧文字扩展；禁用、loading、失败保值、重试成功和自定义值均有本地示例。状态没有只靠颜色传达。当前修后浏览器检查确认 375px Props 名称与元信息列起点分别为 x=24px、x≈194px；禁用原因经 `aria-describedby` 关联；HUD 主题控制区域为 190×44px。注入前页面根宽为 375px。

**静态扫描：** `LxSwitch/index.vue`、Demo 与中文文档分别扫描。三次结果均为有效 JSON `[]`，stderr 为空、退出码 0；这只表示当前静态规则零命中，不代表页面或动效通过。

**浏览器 overlay：** detector 注入后页面根 `scrollWidth` 一度升至 615px，但 `clientWidth` 与 `body.scrollWidth` 仍为 375px。DOM 归因显示宽度来自 detector 自己注入的绝对定位 marker/label；隐藏 overlay 后根宽回到 375px，所以不记为产品溢出。`span.container`、`body` 过渡以及代码块复制按钮属于 VitePress 文档壳层候选，不计作 LxSwitch 缺陷。另有一次资源 404，未归因；页面没有 JavaScript page error。

## 整体印象

开关外形、文字状态和错误恢复路径符合设计样本，窄屏 Props 已能逐项阅读。组件本身没有未关闭的 P0–P2 缺陷；剩余风险属于共享文档导航和未来宿主业务语义，不能从组件演示推断生产确认、授权或审计规则。

## 做得好的地方

- 几何、颜色与外置状态文字能直接对照设计样本，状态不只依赖颜色。
- 锁定原因与禁用开关关联；HUD 控件具有 44px 高触控区域。
- loading 示例展示首次失败保留值、再次操作成功，状态文字与开关值一致。

## 优先问题

### [P2] 移动端文档侧栏关闭时的键盘顺序需复验

较早的全页 Assessment A 发现移动侧栏收起后，画外导航链接可能仍在 Tab 顺序中。最新 LxSwitch 修后 A 只复验 Props、锁定说明和触控区域，没有重新核验该共享外壳行为。该项属于组件文档站导航，不是 LxSwitch 本体；在 Wave 6 壳层检查中用当前版本复现并修正，若未复现则关闭记录。

**影响与处理：** 键盘用户可能通过 Tab 进入视觉上已关闭的导航，造成焦点位置与当前页面不一致。Wave 6 应在 375px 下关闭侧栏，连续按 Tab 检查焦点是否进入隐藏链接；若复现，使用 `inert` 或等效机制移出焦点顺序，再补键盘浏览器回归。建议命令：`/impeccable audit`。

### [P2] 生产高影响开关的后果与确认由宿主契约决定

示例包含实时研判和布防场景，但本 Demo 仅更新内存状态，不调用业务 API。真实接入若改变设备、权限或告警行为，需由后端/业务契约确定是否提示后果、二次确认、授权审计及失败补偿。lx-ui 不应臆造这些业务规则；列入 Vue3 宿主页面迁移验收。

**影响与处理：** 若宿主把展示级切换直接连接到设备、权限或告警写操作，缺少确认和失败补偿会影响真实业务。迁移对应页面时，先从 Vue2 页面、API 契约和后端行为确认副作用，再记录授权、确认、审计及失败回滚要求，并用全拦截的 Mock E2E 验证；没有契约证据时不得由通用组件补造规则。建议命令：`/impeccable harden`。

### [P3] 首次出现的专业词可增加简短释义

`HUD`、`AI 研判`、`端侧` 等词让非专业接入者需要额外背景。保留既有业务词表，并在文档首次出现处补充短释义即可，不需更改组件 API。

**影响与处理：** 首次接入者需要先猜测术语含义，降低 Demo 扫读效率。仅在中文文档首次出现处补充简短释义，避免重复改写领域词和组件 API。建议命令：`/impeccable clarify`。

## 用户画像风险

- **键盘/读屏用户：** 控件有准确名称、锁定原因和可见焦点；仍需在共享文档壳层确认关闭侧栏后无隐藏 Tab 停靠点。
- **移动用户：** 375px 下 Props 对齐、根宽稳定，触控区域达到 44px；长文档仍需纵向滚动。
- **首次接入开发者：** API 与透传边界完整，但专业缩写及生产高影响动作的宿主责任需要更直白地说明。

## 次要观察

- 修后 Assessment A 没有发现指定范围内仍未处理的问题；屏幕阅读器未做 NVDA/VoiceOver 实机朗读，本次证据是 DOM 关联与可访问名称断言。
- 独立代码复核批准，未发现可复现的 P0–P2 代码问题。非阻塞测试缺口：移动端 E2E 检查了触控环境和 44px 命中框但未执行实际触摸点击；ARIA 单测未覆盖属性动态移除；没有用例在计时器运行时卸载 Demo。
- detector 的 `[]` 只表示静态零命中。overlay 标记扩宽、文档外壳命中和真实页面尺寸已分别核验，不以命中数量直接作为组件缺陷数。

## 可继续思考的问题

- Wave 6 复验移动文档侧栏时，关闭状态是否应使用 `inert` 或等效方式移出 Tab 顺序？
- Vue3 宿主迁入会改变设备、权限或告警状态的开关时，真实契约要求什么确认、审计与失败补偿？
- 首次出现 `HUD`、`端侧` 等词时，目标文档读者是否需要短释义？
