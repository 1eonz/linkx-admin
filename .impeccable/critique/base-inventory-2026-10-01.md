# 基础组件独立源码清点（2026-10-01）

## 证据与边界

- 独立读取根 `AGENTS.md`、`doc/lx-ui/COMPONENT-AUDIT.md` 的设计源/验收矩阵、`DESIGN-SPEC.md`、`COMPONENT-STYLE-INTERACTION.md`、`ICON-DESIGN.md`，以及当前基础控件、Demo 和单测源码；没有读取旧 Impeccable 评价替代本次判断。
- 已直接查看 `design/表单控件八件套/screen.png`，并对照对应 `code.html`；按钮与图标使用各自 `design/` 和规范映射。
- 本报告为源码/静态设计清点，不是正式 Critique，不包含新执行的浏览器、overlay、单测、构建或真实联调通过结论。
- 范围：LxButton、LxInput、LxSelect、LxTextarea、LxInputNumber、LxCheckboxGroup、LxRadioGroup、LxDatePicker、LxPasswordInput、LxIcon 动效。工作区已有大量改动，保留原所有权。

## 可执行发现

| 严重度 | 发现与复现条件 | 当前源码位置 | 设计/契约依据 | 最小修复与验证 |
| --- | --- | --- | --- | --- |
| P2 | 亮色 success/warning 文字按钮对比度不足。默认 12–14px 小字号、白底时 `#529b2e`/`#cf8a1e` 分别为 3.45:1/2.87:1；CSS 注释称 strong 档补偿对比度，但仍未到 4.5:1。三个基础 Demo 的提示也复用 warning-strong。 | `linkx-fe/src/components/LxButton/style.css:109`、`:126`；`linkx-fe/src/tokens/variables.css:23`、`:27` | `DESIGN-SPEC.md` §3.2；AGENTS §8；frontend-ui-ux AA | 分离正文强语义色与实底 hover 色，避免直接加深共享 strong 令牌后破坏深字实底按钮；补亮色/HUD、default/hover 的计算对比度和浏览器检查。实底 success/warning 的深字对比度目前分别 ≥4.68:1/5.61:1，不应混为同一缺陷。 |
| P2 | Select 配置项使用 `String(value)` 作为 key：`1` 与 `'1'`、`true` 与 `'true'` 产生重复 key；动态换序/删项时 Vue 可复用错误选项节点。 | `linkx-fe/src/components/LxSelect/index.vue:129` | Select 类型明确允许 string/number/boolean；AGENTS §5/§9 契约与可观察行为 | 标量 key 保留类型，对象用独立前缀的索引 key（保持当前对象引用契约）；回归同值不同类型选项重排后文案与点击发出的值类型。 |
| P2 | DatePicker 模板为自闭合 ElDatePicker，宿主提供的日期单元 default、range-separator、prev/next-month/year 插槽不会进入 EP 内核；迁移已有插槽时被静默丢弃。 | `linkx-fe/src/components/LxDatePicker/index.vue:93` | AGENTS §5 适配保留插槽；已安装 EP `date-picker/src/date-picker.mjs:44` 和 `:49` 的真实转发契约 | 显式声明日期单元 DateCell 插槽与 EP 支持的命名插槽，条件转发，保留未传插槽时内核默认渲染。同步 Demo/API，测试真实单元文本与范围分隔符。 |
| P2 | Select/DatePicker/InputNumber Demo 的字段名称为裸 span，没有 label-for/id 或 aria-label/aria-labelledby；读屏无法从可见字段名称获知业务含义。区间须区分起止两个输入。 | `linkx-fe/src/components/LxSelect/demo/basic.vue:70`；`LxDatePicker/demo/basic.vue:79`；`LxInputNumber/demo/basic.vue:42` | 表单设计稿明确带字段标签；AGENTS §8；frontend-ui-ux 标签关联 | 单输入关联 label+稳定唯一 id；日期区间使用 EP 实际支持的成对 id，分别提供起止名称。浏览器按 getByLabel 获取真实 input/combobox，检查 label 点击聚焦。 |
| P2 | HUD Demo 只在局部 `.lx-theme-hud` 切换，而 EP 暗色桥只在 `html.dark.lx-theme-hud` 声明；teleport 后的 Select/DatePicker popper不继承局部 HUD token。这是源码能确认的主题覆盖边界，不宣称本次已观察到浏览器颜色。 | `linkx-fe/src/components/LxSelect/style.css:98`；`linkx-fe/src/styles/element-theme.css:527`；各 Demo 根节点主题 class | DESIGN-SPEC §7 两主题；AGENTS §8/§10 | 后续主题专项统一局部主题与 portal 传播，或 Demo 明确切换受支持的根主题；必须在展开 popper 后检查亮色/HUD，不能只拍闭合控件。 |
| P3 | LxIcon 动效父级选择器没有排除 disabled/aria-disabled/button loading，且 SVG 自身 hover 也会触发动效；禁用父按钮内图标仍具交互反馈。 | `linkx-fe/src/components/LxIcon/index.vue:214` | AGENTS §10 禁用动效状态；图标动效应反映可执行操作 | 校核浏览器 disabled/loading 下 computed animation/transform；再选择以父级状态隔离动效的局部方案。保持纯展示图标 hover 需求与业务禁用语义。 |

## 测试现状与下一批验收

- 九项基础控件均有相应单测：DatePicker 文件名为 `lx-date-picker.test.ts`，不是 `lx-datepicker.test.ts`。已有单测覆盖尺寸映射、事件、disabled、部分插槽/attrs/实例方法；本轮只读取测试，没有执行，不能复用旧通过结论。
- Select 当前单测以 ElOption 默认插槽为主，缺少配置式混合类型 value 重排回归。DatePicker 缺日期单元/命名插槽、range 周起始与 popper 样式/标签行为检查。
- Checkbox/Radio 组已有鼠标选中与禁用行为测试；未看到组 name/native 提交、箭头键/Space、长标签换行及错误态的直接测试。Input/Textarea Demo 已有 label-for，不能与三个有问题的 Demo 一并认定缺失。
- Button 单测覆盖 loading/disabled/图标/tooltip，但不测语义文字颜色计算对比度、loading 前后尺寸稳定、HUD 或纯图标键盘 tooltip。
- Icon 有 unit 与 docs E2E，后者覆盖鼠标、键盘、移动端及 reduced-motion；尚缺禁用父按钮、HUD 各状态和 loading spin 与 motion 同时作用的回归。没有把测试存在等同于本次测试通过。
- 本次未执行浏览器；不能宣称 320px/400% zoom、真实焦点、对比度、视觉一致性或正式 A/B 已通过。先修确认契约缺口，再由主 Agent 统一调度有界浏览器验收和 Impeccable A/B，组件库矩阵关闭后再进入宿主替换。
