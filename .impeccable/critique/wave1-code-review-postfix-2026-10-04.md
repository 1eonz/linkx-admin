# Wave 1 Postfix 独立代码审查

审查范围：LxButton、LxActionButtons、LxInput、LxTextarea、LxInputNumber、LxPasswordInput 的实现、Demo、类型、相关令牌、中文 API 文档及 Vue3 对应单测/E2E。未读取 Assessment A/B 或 detector 报告，也未审查其他 Wave 的差异。

## 发现

### [P2] LxInputNumber 会移除公开的 `name` 属性

位置：[linkx-fe/src/components/LxInputNumber/index.vue:71](../../linkx-fe/src/components/LxInputNumber/index.vue#L71)、[linkx-fe/src/components/LxInputNumber/index.vue:114](../../linkx-fe/src/components/LxInputNumber/index.vue#L114)

复现场景：渲染 `<LxInputNumber name="caseQuota" />`。模板先把 prop 传给 Element Plus；挂载及每次更新时，`syncInputAttributes` 又从 `useAttrs()` 读取 `name`。由于 `name` 已声明为本组件 prop，它不在 `$attrs` 中，于是同步逻辑执行 `removeAttribute('name')`，实际数值 input 最终没有 `name`。原生表单序列化因此漏掉该字段，与类型注释承诺的表单序列化能力不符。现有 InputNumber 浏览器用例验证 `id` 与 label 关联，没有验证 `name`；对应单测也未覆盖此情况。

### [P2] HUD 主题下 LxInput 字数计数对比度不足

位置：[linkx-fe/src/components/LxInput/style.css:73](../../linkx-fe/src/components/LxInput/style.css#L73)、[linkx-fe/src/tokens/variables.css:106](../../linkx-fe/src/tokens/variables.css#L106)

复现场景：给文档根节点应用 `lx-theme-hud` 后，使用带 `maxlength` 和 `show-word-limit` 的 LxInput。计数器改用 `--lx-color-on-input`，但该令牌只在亮色基础变量中定义，HUD 令牌表没有覆盖；HUD 输入表面为 `#101a2c` 时，继承的亮色文字 `#4e5969` 对比度约为 2.45:1，低于小字号文本的 4.5:1 要求。当前目标 E2E 未断言 LxInput 字数计数在 HUD 下的颜色对比度。

### [P3] LxActionButtons 文档夸大了焦点恢复范围

位置：[linkx-fe/docs/components/lxactionbuttons.md:65](../../linkx-fe/docs/components/lxactionbuttons.md#L65)、[linkx-fe/src/components/LxActionButtons/index.vue:58](../../linkx-fe/src/components/LxActionButtons/index.vue#L58)、[linkx-fe/src/components/LxActionButtons/index.vue:76](../../linkx-fe/src/components/LxActionButtons/index.vue#L76)

文档把“焦点移出或点击外部时收起”与“收起后焦点回到触发按钮”连成同一保证，但这两条关闭路径调用 `closeMore()` 时不恢复焦点；恢复仅发生于 Escape 与溢出项点击。焦点移出时保留用户新选择的焦点是合理的，文档应明确焦点恢复只适用于 Escape 和溢出项操作，避免调用者误判外部交互后的焦点位置。

## 历史回归核验

- `showPassword` 从 true 改为 false 后密码恢复遮罩：组件同步 watcher 重置可见状态；单测与密码框 E2E 均覆盖并通过。
- `ElForm disabled` 继承到显隐按钮：密码框单测挂载禁用的 ElForm，确认输入框和按钮都禁用；通过。
- 375px 下 sm/md 焦点环不压住标签且触控目标为 44px：密码框 E2E 检查各尺寸按钮宽高，并对 sm/md 检查标签间距与负 outline-offset；通过。
- 点击 ActionButtons 溢出项后焦点回到触发按钮：组件在菜单项点击后关闭并恢复焦点；浏览器 E2E 同时验证点击项和 Escape 路径；通过。

## maxlengthMode 校验

`LxTextarea` 类型、默认值、实现和中文 API 文档一致：默认 `truncate` 保持原生硬截断；`validate` 移除原生 maxlength 限制，仅在当前值超限时设置 `aria-invalid`、关联错误说明，并按 `showWordLimit` 展示自定义计数。单测覆盖两种模式、超限及恢复；目标 E2E 覆盖超限保留、错误关联和计数。相关验证通过，未发现此项可复现问题。

## 实际验证

- 六个目标组件单测：6 个文件、59 项通过。
- 按钮、操作组、密码框文档 E2E：10 项通过。
- InputNumber 文档 E2E（筛选目标用例）：1 项通过。
- Textarea 文档 E2E（筛选目标用例）：1 项通过。

未运行 lx-ui 类型检查、组件库构建、文档构建、Prettier、ESLint 或完整 Vue3 测试套件。上述定向测试通过不代表这些检查已通过。
