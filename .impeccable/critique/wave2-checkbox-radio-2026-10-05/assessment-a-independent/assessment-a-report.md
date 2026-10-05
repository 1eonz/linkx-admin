Method: Assessment A only（独立设计评审；与 Assessment B 隔离，本报告未读取 B 的产物）

# Checkbox / Radio 独立设计评审

## 范围与证据

- 目标：`LxCheckbox`、`LxCheckboxGroup`、`LxRadio`、`LxRadioGroup`。
- 设计依据：`design/表单控件八件套/screen.png`、`design/表单控件八件套/code.html` 第 340 行起的 Radio 标本与第 399 行起的 Checkbox 标本。
- 实现与说明：四个组件的 Vue、CSS、types、两个中文 Demo、`linkx-fe/docs/components/lxcheckbox.md`、`lxradio.md`。
- 测试与矩阵：`other-admin/admin-vue3/tests/unit/lx-checkbox.test.ts`、`lx-radio.test.ts`、`doc/lx-ui/COMPONENT-AUDIT.md` 中 UI-10 关闭条件及四个矩阵行。
- 浏览器观察：在新建的 In-app Browser 标签检查 `http://127.0.0.1:4174/components/lxcheckbox.html` 与 `.../lxradio.html`；默认、已选、半选、禁用和 Demo 的 HUD 开关可见。Radio HUD 开启后的截图显示深色面板中未选圆点仍呈白色，禁用选项对比偏弱。该标签以 1280×720 桌面视口观察；未做移动端截图、屏幕阅读器实测或 Assessment B overlay。
- 当前评审未运行测试或 detector；这里只检查现有用例和页面状态，不把静态检查或源码判断当成完整验收。

## 设计具体性判断

控件用语和状态围绕 LinkX 的勤务、警单、业务授权、加密链路与支队审批场景组织，14px 控件、12px 标签、主色与紧凑间距能看出对应的设计样本，整体并非可直接换文案套用的通用表单。但复选组 Demo 的主样例横向排布，和设计稿的纵向权限清单不一致；Checkbox 选中标签也被 EP 默认规则染成主色，而图稿保持正文色。Radio 默认态、选中靶环及垂直禁用样例与设计图更接近。

## 易用性评分

模式：Operate，使用者在表单中完成单选或权限勾选。十项均适用。

| # | 启发式 | 得分 | 依据 |
|---|---|---:|---|
| 1 | 系统状态可见 | 3/4 | 选中、禁用、半选均有明显状态；Demo 有授权值/最近操作反馈。 |
| 2 | 符合真实世界 | 4/4 | 勤务、授权、处置通道等标签贴合业务语义，值和说明靠近选项。 |
| 3 | 用户控制与自由 | 4/4 | 普通选项可即时反选，单选组可改选；没有多余确认步骤。 |
| 4 | 一致性与标准 | 2/4 | Checkbox 的选中标签颜色与图稿不符，主 Demo 方向也与权限清单标本不同；组禁用默认值说明互相冲突。 |
| 5 | 错误预防 | 3/4 | 禁用项和审批提示可见；CheckboxGroup 的公开值类型写错会引导使用无法正常工作的值。 |
| 6 | 识别而非记忆 | 3/4 | 选项和授权反馈一直可见；主 Demo 未按图稿展示“警单流转”这一子项的半选状态。 |
| 7 | 灵活与效率 | 3/4 | 支持水平/垂直组与内核键盘操作；键盘焦点和触屏尺寸尚缺当前版本专项浏览器证据。 |
| 8 | 简洁美观 | 3/4 | 控件本身紧凑、层级清楚；图稿与 Demo 排布差异让开发者难以判断应复用哪种默认样式。 |
| 9 | 错误识别与恢复 | 3/4 | 选错可直接反选或改选；该组件没有异步错误恢复场景。 |
| 10 | 帮助与文档 | 2/4 | 中文 API、示例和状态说明齐全，但 CheckboxGroup 值类型及两个组的 `disabled` 默认值与实现不符。 |
| **合计** |  | **30/40** | **Good（75%）；阶段性 A-only 评价，不代表 Critique 或 UI-10 通过。** |

## 认知负荷

低，8 项清单未发现明确失败。设计决策点不超过 4 个可见选项：Radio 为 3 项，Checkbox 样例为 4 项；标签、状态与选项同屏，用户不必记住其他步骤的信息。主要问题是复选列表横排导致禁用项折到下一行，视觉阅读顺序与图稿不一致；这是规范偏差，不是选择数量过载。

## 有效之处

1. Radio 的 14px 白底蓝心靶环、6px 圆心、选中标签强调和垂直 8px 行距与标本 03 基本吻合。
2. Checkbox 的选中勾、半选横杠、禁用态和 44px 触屏最小高度已有实现；Demo 中父级半选也能直观看到三态。
3. 独立选项和组容器分开提供，值变化即时反馈；权限项使用自然语言，并把审批限制写在禁用项标签中。

## 优先问题

### [P1] CheckboxGroup 文档声称支持布尔数组，但类型与运行时会过滤布尔值

- **影响**：`lxcheckbox.md` 将 `LxCheckboxGroup.modelValue` 标为 `(string | number | boolean)[]`，而 `LxCheckboxGroupProps` 仅允许 `(string | number)[]`。实现又在 `elementModelValue` 中滤掉所有布尔值。使用者照文档传布尔型选项时，类型检查不通过；若绕开类型，已有布尔选中值不会进入内核，选项无法稳定呈现为选中。`LxCheckbox.value` 单项的布尔契约不等同于组值契约。
- **建议**：明确选择组值只支持字符串/数字并修正文档与事件类型，或完整实现布尔组值；在决定后补一个布尔组行为用例，验证回显、切换和 emitted payload。
- **复核路径**：`linkx-fe/docs/components/lxcheckbox.md:34`；`linkx-fe/src/components/LxCheckboxGroup/types.ts:15`；`linkx-fe/src/components/LxCheckboxGroup/index.vue:26-44`。

### [P1] Checkbox 主 Demo 的排布和半选行没有严格复现设计标本

- **影响**：设计 `code.html:409-437` 将授权项按 `space-y-3` 纵向排列，并把“警单流转（部分下属权限）”作为子项半选。当前主 Demo 的第一组未传 `vertical`，实际为 16px 横排；半选展示在独立的“全部授权”父项上，子项“警单流转”仍是未选。开发者在组件文档首屏看到的主要示例因此不能验证图稿指定的组方向和半选项目。
- **建议**：让首个权限 Demo 直接展示图稿的纵向四行、子项半选和禁用状态；水平组作为单独变体保留，清楚标出它是扩展能力。不要仅将说明文字改成“vertical”而不改变首屏状态。
- **复核路径**：`design/表单控件八件套/code.html:409-440`；`linkx-fe/src/components/LxCheckbox/demo/basic.vue:41-63`；`linkx-fe/src/components/LxCheckboxGroup/style.css:10-25`。

### [P2] Checkbox 选中项文本颜色与设计图相反

- **影响**：设计稿 Checkbox 四种状态的标签都使用正文色 `#303133`，悬停时才转主色；当前浏览器 Demo 中“视频巡查权限（已授权）”选中后为蓝色，受 Element Plus 默认选中标签规则影响。勾选框已通过填充和白勾表达状态，再把标签改蓝会比标本更强，也改变了图稿的层级。
- **建议**：为 LxCheckbox 明确覆盖 checked 标签颜色为设计正文色，同时保留非禁用 hover 转主色；补截图/样式断言确认 checked、hover、disabled 的颜色优先级。
- **复核路径**：`design/表单控件八件套/code.html:414-435`；`linkx-fe/src/components/LxCheckbox/style.css:22-35`；浏览器 `components/lxcheckbox.html` 首组已选项。

### [P2] Radio 与 Checkbox Group 的 `disabled` 默认值文档不真实

- **影响**：两个 Group 实现都显式设 `disabled: undefined`，这是为了让 `ElForm` 的禁用状态继续沿 EP 的 `??` 继承链传入；但中文 API 表格都写成默认 `false`。同页单项表格又明确写“默认 undefined 可继承”，形成组/单项行为说明矛盾；调用者可能显式传 `false`，使整组不再继承父表单禁用。
- **建议**：两个 Group 表格统一写明 `—（undefined）`，并解释缺省继承、显式 `true/false` 覆盖的语义；加入父级 Form disabled 的回归检查。
- **复核路径**：`linkx-fe/src/components/LxCheckboxGroup/index.vue:16-22` 与 `linkx-fe/docs/components/lxcheckbox.md:30-36`；`linkx-fe/src/components/LxRadioGroup/index.vue:15-21` 与 `linkx-fe/docs/components/lxradio.md:28-34`。

### [P2] HUD Radio Demo 的未选/禁用圆点在深色背景上不协调

- **影响**：实际页面点击“HUD 深色主题”后，面板变为深色，选中态能切换 HUD 主色；未选项的圆心仍明显呈白色，禁用 Radio 文案又很暗。这样会让操作控件像白色孔洞，禁用项也较难辨认，和统一暗色表面断开。设计稿没有深色图，因此这是 Demo 宣称支持的扩展主题问题，不应记作图稿本身的偏差。
- **建议**：为 HUD 下未选 Radio 的内圆指定深色表面填充，并确认 disabled label/圆环在真实深色背景下达到可读对比；将检查加入 HUD 浏览器状态证据。
- **复核路径**：`linkx-fe/src/components/LxRadio/demo/basic.vue:22-25`；`linkx-fe/src/components/LxRadio/style.css:55-70`；本次 HUD 开启后的 `components/lxradio.html` 浏览器画面。

## 人物走查

- **Alex（熟练操作员）**：Radio 可以直接改选，Checkbox 可反选或点“全部授权”，常见动作短。若他按 API 文档把布尔值用于 CheckboxGroup，选择值会违反真实组契约；文档类型错误比缺少快捷键更直接影响效率。
- **Jordan（首次使用者）**：勤务和权限文案直白，“需支队审批”让禁用原因可理解。主权限组选项横排且禁用项换行，阅读方向不如图稿稳定；“半选/indeterminate”需要从示例而非术语理解。
- **Sam（键盘/读屏用户）**：原生单选/复选语义、Radio 方向键能力及减少动效全局规则有源码依据，触屏高度也有 44px 规则。当前没有本波专属键盘焦点截图、触屏视口和目标屏幕阅读器验证；Radio 暗色禁用文本是实际视觉风险。Checkbox 文档断言读屏将半选读作未选，但本次浏览器辅助树将“全部授权”半选项呈为 `Value: 2`，含义需要在目标读屏器验证后再保留或修正文案。

## 次要观察

- `design/表单控件八件套/code.html` 的 Checkbox 图标与文字用 `gap-2.5`（10px），Radio 用 `space-x-2`（8px）；Element Plus Checkbox 内核标签间距需核对是否仍是 8px，避免和图稿相差 2px。
- Radio 文档声明系统减少动效会关闭圆心缩放；仓库有 `prefers-reduced-motion: reduce` 全局规则（`linkx-fe/src/tokens/variables.css`），建议 B 确认组件实际动画被该规则覆盖，不能仅依赖说明文字。
- 四个组件当前仍通过 `ElCheckbox` / `ElRadio` 渲染，并依赖 `.el-checkbox__*` / `.el-radio__*` 内部类。当前桌面视觉可被 CSS 覆盖，但若“Lx 基础组件不以 EP 控件作为实现内核”是本项目约束，这些组件尚未满足该实现边界；应在架构波次明确，而不是把当前视觉近似当作已自有实现。

## 测试与关闭边界

- 单测已覆盖基本渲染、方向类、值切换、组禁用、Checkbox 半选类和 `label` 旧契约；没有发现按 Checkbox/Radio 文档 Demo 页运行的专属 E2E 用例。
- 现有单测未覆盖 CheckboxGroup 布尔值、`ElForm` 禁用继承、选中标签颜色、hover 颜色、组 gap、44px 触屏命中框、真实键盘焦点可见性、HUD 对比度或 `prefers-reduced-motion`。
- `COMPONENT-AUDIT.md` 第 24 行要求逐个基础控件严格对照，矩阵第 95-96、119-120 行仍为“待严格复核”。本次 A-only 报告没有修改正式矩阵；正式关闭仍需修复后行为验证、当前版本浏览器状态证据、隔离 Assessment B 与综合 Critique。
- 本次未运行 detector；没有以 `[]` 推断视觉通过。浏览器检查是独立 A 的人工观察，没有 overlay、持久截图、综合 snapshot 或 trend，不能标记正式 Critique 通过。

## 可继续讨论的问题

1. CheckboxGroup 是否严格限制为 `string | number`，还是需要在 Lx 组件层支持 boolean 并承担与 Element Plus 的组模型差异？
2. 水平 CheckboxGroup 是必须公开的扩展，还是当前设计源中应将垂直权限清单作为默认使用和文档首屏？
3. HUD Demo 是否承诺 Checkbox 和 Radio 的完整暗色可读状态，还是暂时只作为主题背景预览？
