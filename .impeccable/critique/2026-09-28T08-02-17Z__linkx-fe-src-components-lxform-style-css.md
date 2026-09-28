---
target: Element Bridge 多选焦点样式 Critique
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:F:\\work\\linkx-admin\\linkx-fe\\src\\components\\LxForm\\style.css"
target_fingerprint: "sha256:8ce0f82e2f090829861bc8cd89a979d3caee905ea4f7cee4ca59a800f55f731e"
target_path: "F:\\work\\linkx-admin\\linkx-fe\\src\\components\\LxForm\\style.css"
timestamp: 2026-09-28T08-02-17Z
slug: linkx-fe-src-components-lxform-style-css
---
Method: dual-agent (A: /root/select_final_assessment_a · B: /root/select_final_assessment_b)

# Element Bridge 多选焦点样式 Critique

目标：`linkx-fe/src/components/LxForm/style.css` 与 `http://127.0.0.1:4174/components/element-bridge.html` 的基础控件桥接。当前焦点规则为单层 2px inset 边线，普通态使用主题主色，错误态使用错误强调色；不绘制独立 `outline`。

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3/4 | 焦点和已选标签可见；多选字段没有真实校验状态。 |
| 2 | Match System / Real World | 3/4 | 中文业务字段清楚，控件行为熟悉；页面仍是组件示例。 |
| 3 | User Control and Freedom | 3/4 | 支持 Escape、移除标签和重置。 |
| 4 | Consistency and Standards | 3/4 | 普通/错误与浅色/HUD 共用单层边线；选项高度略高于设计契约。 |
| 5 | Error Prevention | 3/4 | 选项受控，其他必填字段有校验；未验证协同部门的业务必填性。 |
| 6 | Recognition Rather Than Recall | 3/4 | 已选值可见；375px 展开菜单会遮住本字段标签。 |
| 7 | Flexibility and Efficiency | 2/4 | 验证了 Escape；方向键选择、搜索和快捷路径未验证。 |
| 8 | Aesthetic and Minimalist Design | 3/4 | 焦点样式简洁且尺寸稳定；移动端菜单与字段标签会遮挡。 |
| 9 | Error Recovery | 2/4 | 错误视觉状态可辨，但多选错误文案和恢复流程没有真实规则可验证。 |
| 10 | Help and Documentation | 3/4 | 桥接页说明接入边界，控件级状态说明较少。 |
| **Total** | | **28/40** | **Good** |

## Design Specificity Verdict

**LLM assessment:** 中等偏强的 LinkX 特异性。中文操作字段、HUD 主题和设计令牌让控件样例属于该管理系统；结构仍是常见的组件展示页，开发者需要的交互状态比装饰更重要。

**Deterministic scan:** Impeccable detector 对 `linkx-fe/docs/components/element-bridge.md` 返回 `[]`，stderr 为空、退出码为 0；这只表示本次 Markdown 静态规则零命中。浏览器 `detect.js` 在 8 个独立主题/视口/状态页面成功注入。overlay 没有把焦点 wrapper 标为问题。控制台长输出被截断，无法复核全部视图的 marker 总数，因此不据此宣称整体零问题。

**Visual overlays:** 截图 overlay 标出文档说明的长行、临时错误文案低对比度、Element Plus tabs active-bar 布局过渡、VitePress 代码块复制图标低透明度、移动导航图标裁切，以及 HUD 主题状态色。主题色命中属于项目令牌误报；复制图标和移动导航裁切属于文档壳层；错误提示对比度是有效信号。注释框与错误 wrapper 的 2px 相交是 Impeccable 标注几何，不是焦点边线或真实页面遮挡。

## Overall Impression

用户指出的“外圈仍像额外包了一圈”通过直接修改控件自身边线来处理。最终 A/B 八态截图显示单一内嵌边线，没有外扩轮廓、分离边线或焦点尺寸跳变；这比调节独立 outline 的偏移更符合用户要求。窄屏弹层遮挡字段标签和错误文字对比度仍需要后续修复。

## What's Working

1. 普通/错误焦点在浅色/HUD 下均只有一层 2px inset 边线；错误态颜色随主题切换。
2. 桌面与 375px 焦点前后控件高度保持 32px，outline 关闭，单选/多选使用同一规则。
3. 已选标签可移除，Escape 能关闭列表；页面没有横向溢出。

## Priority Issues

### [P2] 窄屏多选菜单遮住字段标签

375px 菜单向上展开时覆盖“协同部门”标签约 51×17px，用户暂时看不到当前字段名称。调整窄屏滚动位置或菜单布局，并复验 Escape 关闭和选中值保留。Suggested command: `/impeccable adapt`.

### [P2] 错误提示文字对比度不足

小字号错误色 `#c45656` 在浅红底 `#fef0f0` 上约为 3.93:1，低于普通文本 4.5:1 AA 基线。加深错误文字 token 并分别检查浅色/HUD；本轮错误态是临时视觉模拟，不代表多选字段已有校验规则。Suggested command: `/impeccable colorize`.

### [P3] 下拉选项行高高于设计稿

Element Plus 选项行实测为 34px，设计参考为 32px。若该紧凑密度契约仍适用，调整选项 padding/line-height，并复验 hover、选中和 HUD。Suggested command: `/impeccable polish`.

## Persona Red Flags

- **Alex，熟练管理员/开发者：** Escape 可关闭菜单；方向键选择和快速筛选本轮未验证，不能据此认定完整键盘效率通过。
- **Jordan，首次使用者：** 选项短且已选项可辨；375px 展开后字段标签被菜单遮住，可能要先关闭再确认字段含义。
- **Sam，辅助技术用户：** 焦点明显；错误文字对比度未达 AA，且本轮没有真实多选校验公告或屏幕阅读器测试。

## Minor Observations

- A、B 使用的 Chrome 视口和页面可用宽度略有不同；各自检查的焦点前后几何均稳定，不直接比较两个环境的控件宽度。
- 文档长行 detector 命中虽然是真实源码行长，但浏览器段落正常换行，对焦点控件没有直接影响。
- B 的错误状态通过隔离页临时添加 `.is-error` 测量，不等同于真实多选校验或后端联调。

## Provocative Questions

- 窄屏展开时，字段标签可见性是否应优先于菜单紧贴选择框？
- 设计参考的 32px 选项行高是否要作为 Element Plus 桥接的强约束？
- 错误提示文字是否应使用比错误边线更深的独立文本 token？

Questions skipped: 本轮只关闭焦点外圈问题；上述后续项已按优先级记录在项目计划，无需额外设计决定才能交付本次修复。
