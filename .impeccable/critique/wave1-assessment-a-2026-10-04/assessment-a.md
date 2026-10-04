# Wave 1 Assessment A：基础交互组件设计评审

## 评审范围

- 评审对象：`LxButton`、`LxActionButtons`、`LxInput`、`LxTextarea`、`LxInputNumber`、`LxPasswordInput` 的 VitePress 文档及交互 Demo。
- 页面访问：`http://localhost:5173/components/{lxbutton,lxactionbuttons,lxinput,lxtextarea,lxinputnumber,lxpasswordinput}#交互示例`。六页均通过新建的独立浏览器标签访问并读取可访问树、截图；行内「更多」菜单及密码显隐执行了键盘操作。
- Textarea 当前状态复核：`http://127.0.0.1:4178/components/lxtextarea#交互示例`，于 2026-10-04 12:48 左右在当前工作树重新检查浅色、HUD 与窄屏；`LxTextarea/style.css` 最近修改时间为 12:38:49，桌面及窄屏截图时间分别为 12:41:30、12:42:26，晚于修复。最新窄屏截图为 12:48:49。
- 视口：桌面 `1280×720`，窄屏 `390×844`。
- 视觉基准：`design/按钮体系/screen.png`、`design/按钮体系/code.html`、`design/按钮体系/DESIGN.md`；`design/表单控件八件套/screen.png` 与 `code.html`。表单目录没有单独 `DESIGN.md`。
- 本记录只包含 Assessment A 的设计判断；未查看或引用 Assessment B 的 detector/浏览器结果。静态 detector 的空数组不构成本评审证据。

## Design Health Score

| # | Nielsen 启发式 | 分数 | 主要观察 |
|---|---|---:|---|
| 1 | 系统状态可见性 | 3 | 输入变更、密码聚焦、超限字数和更多菜单展开均有可观察反馈。 |
| 2 | 系统与真实世界匹配 | 3 | 警号、分局、警务指令等语境与业务设计相符，个别介绍文字偏 API/实现术语。 |
| 3 | 用户控制与自由 | 3 | 输入可清除，数字边界明确，更多菜单支持 Escape 且焦点返回；密码显隐不能键盘到达。 |
| 4 | 一致性与标准 | 3 | 控件大体共享密度、边框和令牌；密码输入尺寸档仍使用 Element Plus 命名，和 `sm/md/lg` 不一致。 |
| 5 | 错误预防 | 3 | 数字范围、长度边界及禁用态可降低误操作；`LxInput` 错误态没有在本页 Demo 中实际展示。 |
| 6 | 识别而非回忆 | 3 | 字段有可见标签、尺寸档及示例，超限状态有文字和计数；文档导航和长 API 说明要求持续定位。 |
| 7 | 灵活性与效率 | 3 | 支持键盘输入、尺寸/主题切换、输入公开方法；密码切换控件有键盘可达性缺口。 |
| 8 | 美观与简约 | 2 | 局部示例清楚，但外层灰底演示容器里又叠多个白底描边面板，卡片层级偏重。 |
| 9 | 错误识别、诊断与恢复 | 3 | Textarea 超限保留内容并展示错误原因和计数，可直接编辑纠正。 |
| 10 | 帮助与文档 | 3 | Props、事件、槽及实例方法说明较完整；关键输入错误态未被 Demo 实际呈现。 |
| **合计** |  | **29/40（Good）** | **有稳定的设计系统基础，优先补齐键盘访问和未演示状态。** |

## Design Specificity Verdict

Demo 使用警务调度、警员标识、分局和布控指令作为示例内容，并与按钮设计样本中的语义色、行内操作规则及表单八件套中的尺寸、边框、计数器对齐，整体不是完全通用占位内容。文档外壳仍是标准 VitePress，两列侧栏与长 API 表格占据较多视觉注意；真正体现 LinkX 业务设计的是 Demo 本身。表单样本明示文本输入的正常、禁用和错误态；当前 `LxInput` Demo 以普通输入框展示联系电话并说明错误由 `LxForm` 触发，却没有把字段置于校验表单内，因此无法从这一页核验设计样本中的输入错误态。

## Cognitive Load

失败项：

- **分组不超过 4 项**：输入、文本域和按钮 Demo 的部分分组包含 5 至 6 个状态/变体；虽有子标题和面板分组，单组内容仍偏长。
- **最少选项不超过 4 个**：按钮矩阵同时展示多种形态，移动视口下以多行按钮呈现；作为组件目录有展示价值，但不是低负担的业务操作场景。
- **渐进披露**：示例源码默认折叠，控制了代码噪声；Props 和完整事件表在 Demo 后连续展开，页面整体较长。

其余检查项总体通过：同页 Demo 的主要焦点清楚、相关字段按区域分组、尺寸/主题等选择有明确标签，窄屏内容能够换行。

## What's Working

- 六个页面使用同一文档框架、令牌语汇和接近的表单控件密度；桌面与 390px 窄屏截图均未观察到整页横向溢出。
- `LxInput` 与 `LxTextarea` 的焦点状态显示紧贴控件边缘的主色描边和光环；Textarea 超限态保留输入内容，提供原因、错误色和 `205 / 200` 计数，符合表单设计样本的纠错方向。
- `LxInputNumber` 的 sm、md、lg 变体中，sm/md 步进按钮视觉上上下连续相接，中间无明显空隙；关闭 `controls` 后为纯数字输入。`LxActionButtons` 的「更多」可通过 Tab 聚焦、Escape 关闭并恢复触发按钮焦点。

## Priority Issues

### [P1] 密码显隐按钮不能通过键盘焦点访问

- **证据**：在 `LxPasswordInput` Demo 将焦点放在「访问密码」输入框后按 Tab，焦点直接移至「只读密码」；集成眼睛显隐控件没有进入键盘顺序。Demo 页面中显隐可用鼠标切换，但键盘用户不能执行同一操作。
- **影响**：键盘与辅助技术用户无法使用公开的密码明文切换能力，组件行为对该群体不完整。
- **建议**：让显隐操作具有可访问名称、按钮语义和正常 Tab 顺序；用 Enter/Space 切换，并同步 `aria-pressed` 或等价状态。补一个浏览器回归确认焦点顺序与切换结果。
- **建议命令**：`/impeccable harden`

### [P2] LxInput Demo 没有实际呈现设计样本中的错误态

- **证据**：当前 Demo 的「联系电话（错误态由 LxForm 校验触发）」显示值为 `1390000`，输入框仍为普通描边；其说明文字明确写着错误态需要在 `LxForm` 内触发。`design/表单控件八件套/screen.png` 中包含红色错误边框、底色及说明文案。
- **影响**：使用者无法在该组件页面验证该状态是否按设计呈现；文档列出了能力，但可见示例没有给出证据。
- **建议**：在 Demo 内用 `LxForm/LxFormItem` 展示一个校验失败字段和具体纠错说明，保留当前正常态/禁用态对照；状态应由真实表单校验触发，而非额外造一个组件 prop。
- **建议命令**：`/impeccable harden`

### [P2] 密码输入尺寸命名与基础输入组件不一致

- **证据**：`LxInput`、`LxInputNumber` 使用 `sm/md/lg` 三档；`LxPasswordInput` 文档将 `size` 定义为 Element Plus 的 `small/default/large`，Demo 也没有尺寸切换或三档并排对照。
- **影响**：相同表单中的基础文本框和密码框难以使用一致的业务尺寸配置，开发者需要记住两套命名。
- **建议**：评估将公开 API 对齐到 `sm/md/lg` 并保留 Element Plus 兼容映射；在文档展示三档与相邻 LxInput 的高度对照。若因兼容合同不能修改，清楚记录映射并在 Demo 呈现。
- **建议命令**：`/impeccable clarify`

## Persona Red Flags

- **Sam（键盘/辅助技术用户）**：访问密码字段后的 Tab 跳过显隐操作；无法用键盘检查密码值是否输入正确。Textarea 错误原因以可见文字显示，但仍需另外核验错误说明与字段的读屏关联。
- **Alex（高频操作用户）**：输入数字、操作行内菜单和清空字段的路径短；主要障碍是密码显隐的键盘捷径缺失。Demo 主要用于组件查阅，不应据此推断真实业务页效率。
- **Jordan（首次使用者）**：警务业务词汇为示例提供了明确场景；但「错误态由 LxForm 校验触发」依赖组件知识，当前页面又未演示完整触发过程，理解实现和核对视觉需要跳转或推断。

## Minor Observations

- Demo 使用大面积浅灰背景承载多个白色描边面板，出现外层容器套内层卡片的重复边界；可以保留组标题并减少一层背景/边框。
- LxInput Demo 的联系电话字数计数显示 `7 / 11`，辅助说明却写 `8 / 11`，文案与可见数据不一致。
- `LxPasswordInput` Demo 的工具条三个复选项在窄屏自然换行，交互可用；但显隐按钮没有公开其当前明文/密文状态给键盘焦点提示。

## Questions to Consider

- 密码显隐是否可以在视觉上仍是输入框内图标，同时保持语义按钮和键盘焦点可见？
- `LxInput` 页面能否像 Textarea 超限态一样直接展示一个可恢复的错误示例，而不让读者根据说明自行拼装 LxForm？
- 文档 Demo 是否需要同时展示全部尺寸和状态，还是可以把低频边界状态收进分段或可展开区？

## 截图证据

桌面 `1280×720`：

- `lxbutton-desktop.png`（12:41:20）
- `lxactionbuttons-desktop.png`（12:41:24）
- `lxinput-desktop.png`（12:41:26）
- `lxtextarea-desktop.png`（12:41:30，晚于样式更新 12:38:49；当前浅色与 HUD 状态又在 12:48 左右人工重新检查）
- `lxinputnumber-desktop.png`（12:40:55）
- `lxpasswordinput-desktop.png`（12:41:32）

窄屏 `390×844`：

- `lxbutton-mobile.png`（12:42:14）
- `lxactionbuttons-mobile.png`（12:42:10）
- `lxinput-mobile.png`（12:42:21）
- `lxtextarea-current-mobile.png`（12:48:49，当前工作树）
- `lxinputnumber-mobile.png`（12:42:32）
- `lxpasswordinput-mobile.png`（12:42:37）

## 评审边界

本记录是独立 Assessment A，不代表 Impeccable 的双评估正式综合 Critique 已通过。没有运行 detector，也没有把 `[]` 当作视觉证据。Textarea HUD 状态已通过浏览器当前页检查但没有单独导出截图文件；其浅色桌面与窄屏文件如上。当前临时文档服务器使用 `4178`，评审后停止；其他端口不在本评审控制范围内。
