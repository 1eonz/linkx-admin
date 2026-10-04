Method: isolated Assessment A (`/root/wave1_a_postfix`); Assessment B intentionally excluded by the requested scope.

# Wave 1 Assessment A：按钮与基础输入控件

## 范围与证据

本次只评估 `linkx-fe` 中的 LxButton、LxActionButtons、LxInput、LxTextarea、LxInputNumber、LxPasswordInput，以及对应文档与 Demo。视觉对照为 `design/按钮体系/` 与 `design/表单控件八件套/`。没有运行或读取 detector、Assessment B 或其他评审报告；没有修改产品源码。

独立 CUA 标签在 `http://127.0.0.1:4174` 观察了六个组件页、文档结构和示例。另在桌面 1280×720 与窄屏 390×844 保存了 12 张页面截图，位于本目录的 `evidence/`。CUA 提供页面观察但没有把截图写入文件系统的接口，因此归档截图使用仓库现有 Playwright 驱动系统 Chrome 生成；这是截图采集的降级补充，不代表检测器评审。浏览器观察到桌面页导航、按钮变体矩阵、输入状态和移动端标题换行；LxActionButtons 的“更多”可展开，按 Escape 后菜单关闭且触发按钮重新获得焦点。

当前六组件源码指纹：`SHA-256 4D7BA628C22642C16147D85A2A9C4AC2C650C792A95C695E7D0DCB3F2F0324A0`。计算对象为以下 22 个文件的相对路径与逐文件 SHA-256 排序后拼接；复核时对这六个目录重新生成同一清单即可比较。范围没有包含其他组件或全仓文件。

- `linkx-fe/src/components/LxButton/index.vue`
- `linkx-fe/src/components/LxButton/style.css`
- `linkx-fe/src/components/LxButton/types.ts`
- `linkx-fe/src/components/LxButton/demo/basic.vue`
- `linkx-fe/src/components/LxActionButtons/index.vue`
- `linkx-fe/src/components/LxActionButtons/types.ts`
- `linkx-fe/src/components/LxActionButtons/demo/basic.vue`
- `linkx-fe/src/components/LxInput/index.vue`
- `linkx-fe/src/components/LxInput/style.css`
- `linkx-fe/src/components/LxInput/types.ts`
- `linkx-fe/src/components/LxInput/demo/basic.vue`
- `linkx-fe/src/components/LxTextarea/index.vue`
- `linkx-fe/src/components/LxTextarea/style.css`
- `linkx-fe/src/components/LxTextarea/types.ts`
- `linkx-fe/src/components/LxTextarea/demo/basic.vue`
- `linkx-fe/src/components/LxInputNumber/index.vue`
- `linkx-fe/src/components/LxInputNumber/style.css`
- `linkx-fe/src/components/LxInputNumber/types.ts`
- `linkx-fe/src/components/LxInputNumber/demo/basic.vue`
- `linkx-fe/src/components/LxPasswordInput/index.vue`
- `linkx-fe/src/components/LxPasswordInput/types.ts`
- `linkx-fe/src/components/LxPasswordInput/demo/basic.vue`

## 设计特异性判断

**明确贴合 LinkX 的警务指挥与行政业务语境。** 两组标本中可复用的基础视觉语言在六个控件中基本连贯：32px 基准高度、约 4px 圆角、低噪声浅色表面、蓝色主操作，以及红/绿/橙的危险、成功、警示色。Demo 使用警号、处置指令、布控核验、巡逻配额、告警时限等实际领域文案，并展示权限、禁用、上限、超长校验等运营情景；整体明显不是可不加修改套到任意消费产品里的演示集。

文档把设计取舍、Element Plus 映射和调用契约一并放在组件页，对组件作者有帮助。代价是单个页面承担了讲概念、比变体、展示状态和列完整 API 四类任务；部分 Demo 同时暴露过多选择，读者容易先看到“所有状态都能配置”，而不是先看到业务推荐用法。

## Design Health Score

| # | Nielsen 启发式 | 分数 | 主要依据 |
|---|---|---:|---|
| 1 | 系统状态可见 | 3/4 | loading、禁用、字数、溢出校验、值变化和菜单展开状态都有反馈；交互示例是本地模拟，页面上仍需读说明才能知道不是实际业务提交。 |
| 2 | 系统与现实世界匹配 | 4/4 | 标签与警务指令、警号、配额、告警时限等真实工作语言相符，危险操作语义也有颜色与操作词双重表达。 |
| 3 | 用户控制与自由 | 2/4 | 常见输入可清除、取消编辑或隐藏明文；但密码控件无条件阻止复制、剪切、粘贴，影响密码管理器和用户粘贴输入的控制权。 |
| 4 | 一致性与标准 | 3/4 | 六个控件共享尺寸、焦点和主题约定，操作按钮保持语义色；各 Demo 工具栏与面板的原生控件外观略有差异。 |
| 5 | 错误预防 | 3/4 | 数值边界、禁用、字数约束及危险操作语义有护栏；Textarea 默认硬截断可能让用户误以为文字仍可继续录入。 |
| 6 | 识别而非回忆 | 3/4 | 所有示例有可见中文字段名、状态说明与用法文本；少数关键限制藏在 Props 或“使用边界”长表之后。 |
| 7 | 灵活性与效率 | 3/4 | 尺寸、图标、attrs 透传、键盘步进、公开聚焦方法和折叠菜单适合重复使用；效率依赖调用者理解较多 prop 组合。 |
| 8 | 美观与极简 | 3/4 | 控件直接沿用低干扰业务令牌且对比层次清晰；按钮 Demo 同屏铺开多种类型、尺寸和生命周期态，密度高于“先推荐、再展开”的学习路径。 |
| 9 | 错误识别与恢复 | 2/4 | Textarea validate 模式保留超限内容并给出关联说明；truncate 模式在上限停止接收字符，示例只说明硬截断，没有强调输入到顶时的结果反馈。 |
| 10 | 帮助与文档 | 3/4 | 六页覆盖 Props、事件、插槽或 expose、示例和设计偏差；术语密集，部分内容要求读者同时理解 Vue、Element Plus 和 lx-ui 契约。 |
| **总分** |  | **29/40** | **Good：基础扎实，建议先处理密码剪贴板策略和 Demo 中的误导行为。** |

## 认知负担清单

Checklist 有 4 项失败，按 critique 规则属于高认知负担；这是**组件文档/Demo 的作者学习负担**判断，不等同于业务页面运行时负担。

- [失败] 单一焦点：LxButton Demo 同时展示尺寸选择、主题开关、6 种类型和多个生命周期样例，首要推荐模式不突出。
- [失败] 分组：单个矩阵组有 6 个可比较的按钮类型，超过每组 4 项的检查线；状态面板本身有标题分组，但主要变体仍铺开。
- [通过] 关联信息分组：组件示例、Props、Events、Slots/Exposes 按文档标题分区，表单字段也以标签和说明邻接控件。
- [通过] 视觉层级：主操作、危险色、字段标签和错误说明可分辨；页面标题、示例、API 表格的阅读顺序明确。
- [失败] 一次一事：作者同时在一个演示区域切换尺寸、主题、显隐、禁用和不同语义动作，必须先建立组件能力总图才能聚焦一个决策。
- [失败] 最少选择：LxButton 同屏 6 个类型，尺寸又有 3 档；LxInputNumber Demo 同时列基础步进、上限、小数、无控件、三种尺寸和禁用态。多个比较点超过 4 个选择。
- [通过] 工作记忆：当前页标签、可见字段标签和状态说明保持在控件附近；示例无需跨页记住先前输入。
- [通过] 渐进披露：Props 和较少用的透传契约在交互示例之后；代码样例可折叠，更多操作通过入口展开。

一个可复验的高于 4 选项点是 LxButton 的“形态 × 尺寸矩阵”：主操作、次级、危险、文字、成功、警示共 6 项同时可见。它有明确的教学用途，也有注明“业务页面同屏主按钮上限 1 个”的说明，问题在默认阅读焦点而非隐藏规则缺失。

## 情绪路径

组件作者从具体业务名称和常规示例进入，容易先获得“这些控件适用于我的警务操作台”的信任。看到 disabled、error、max/min、loading 和折叠操作后，复杂度会迅速抬高；按钮变体矩阵提供完整感，但同时增加选择疲劳。到密码组件时，明文切换和清除动作提升掌控感，紧随其后的“会阻止复制、剪切和粘贴”提示则可能让依赖密码管理器的用户感到被限制。页面末尾详细的 props 与对齐表可以重新建立确定性，但发现关键行为需要向下阅读较长页面。

## 优点

- **标本转译有依据。** 尺寸、焦点色、错误色和状态语义保持成套，文档记录了危险文字色等对比度取舍；这让设计语言能被组件调用者复用。
- **示例来自真实业务动作。** “移出布控”“确认告警时限”“巡逻车组配置配额”等词比抽象的示例按钮更容易校验类型与状态选择是否合理。
- **边界态覆盖较完整。** 输入限长、Textarea 保留超限值、数字上下界、密码只读/禁用/明暗切换及行内操作溢出均有可见说明或 Demo。

## 优先问题

### [P1] 密码输入默认拦截粘贴

**影响：** 使用密码管理器、粘贴长随机密码或无障碍辅助流程的用户会被迫逐字输入；这会增加密码输入错误与放弃概率，也使“密码管理器友好”的预期落空。

**修正建议：** 默认允许 paste/copy/cut；若宿主有明确政策需要拦截，应将策略设为显式、默认关闭的 opt-in，并在字段附近说明。至少在 Demo 中给出允许粘贴的推荐路径。可复验：对示例密码字段粘贴任意非敏感测试字符串，确认值更新；逐项检查默认及策略开关结果。

### [P2] 按钮变体矩阵一次展开过多作者选项

**影响：** 6 种类型和多个状态同时出现，会让组件调用者把 Demo 当作同等推荐的菜单；颜色类型还需结合危险、成功和警示语义表理解。

**修正建议：** 先呈现一个主操作、一个次操作和一个行内文字操作作为推荐路径，再把完整矩阵放进折叠区或独立对比段落；保留现有“主按钮最多 1 个”的规则。可复验：首次进入示例时，首屏主要动作不超过 4 个，扩展后仍可访问全部六种变体。

### [P2] LxInputNumber Demo 两个字段共享同一响应式值

**影响：** “巡逻车组配置配额”和“告警确认时限”都绑定 `quota`，修改任一项会同步改变另一项。读者会把联动误认为组件设计行为，难以单独验证两种不同范围与步进。

**修正建议：** 为时限字段建立独立的响应式数值。可复验：先将配额改为 31，再观察告警时限仍保持其原始值；反向调整时限也不应改变配额。

### [P2] 文本域硬截断的输入反馈不够显式

**影响：** 默认 `maxlengthMode="truncate"` 到上限后不再收字。字段附近有字数计数，但初次使用者可能不知道输入为何停止；溢出校验态则能解释并保留原文，两种恢复路径差异较大。

**修正建议：** 对截断模式，在接近/达到上限时提供短暂明确提示，或在计数附近写明“最多 N 字”；对重要备注默认选用 validate 模式。可复验：输入至上限再继续输入，能识别限制并看见清晰反馈；validate 模式仍保留超出的文字与关联错误文案。

## 人物风险

- **Alex，熟练操作者/组件作者：** 通过尺寸和状态 props 能高效比较；但需要翻长文档才能找到少见参数。业务使用层若把更多操作展开为很多逐项动作，示例中没有展示“更多”入口何时比增加外显项更合适。
- **Jordan，首次使用者：** 中文字段名与警务任务语境很友好。Element Plus 的 attrs、`stepStrictly`、`maxlengthMode` 等术语没有在首次出现处解释；密码框阻止粘贴是最可能使其停住的行为。
- **Sam，键盘与辅助技术用户：** LxActionButtons 已支持 Tab/Enter/Space/Escape，实测 Escape 收起并把焦点带回入口；数字步进按钮有增减名称，密码明暗按钮有状态名。仍需将密码复制/粘贴例外纳入可访问用户流程；本次未运行屏幕阅读器或对比度测量，代码中记录了对比度目标，但不等同于现场验证。

## 次要观察

- 390px 窄屏下六页标题和正文会正常换行，操作区域向下堆叠；当前截图视口未见横向页面滚动条或文字相互遮挡。
- LxActionButtons 的更多菜单可展开并通过 Escape 关闭，关闭后焦点回到触发按钮；它作为逐项 Tab 列表运作，触屏菜单项最小高度在代码中设为 44px。
- 密码 Demo 显示三个工具栏开关：清空、明文切换、HUD 主题；窄屏会自然折行，不影响字段本身的宽度。
- 组件页右侧目录及桌面常驻侧栏可帮助 API 查阅，但新增组件文档范围增长后，侧栏的高密度需要持续管理分组。

## 可复验清单

1. 在 `http://127.0.0.1:4174/components/lxbutton`、`lxactionbuttons`、`lxinput`、`lxtextarea`、`lxinputnumber`、`lxpasswordinput` 六页分别以 1280×720 与 390×844 查看 `evidence/` 对应截图，确认页面标题、示例分组与窄屏换行。
2. 在 `lxactionbuttons` 展开首个“更多”入口，按 Escape；确认菜单隐藏且焦点回到触发按钮。
3. 在 `lxinputnumber` 独立编辑“巡逻车组配置配额”和“告警确认时限”；两者应互不联动。当前源文件指纹包含该 Demo 的两个控件绑定，值共享是静态源码检查结论。
4. 在 `lxpasswordinput` 以测试字符串检查默认粘贴；核对粘贴、复制和剪切是否被阻止，以及示例附近的提示。不要使用真实密码做验证。
5. 在 `lxtextarea` 分别尝试默认 truncate 和 validate 模式的阈值行为：前者应硬截断；后者应保留输入并显示错误说明与超限计数。

## 问题与限制

- 页面属于组件文档站，不代表业务宿主应用中所有布局和真实权限反馈；Demo 的交互数据仅在浏览器本地。
- CUA 浏览器用于独立人工观察；截图因 CUA 无直接落盘能力，使用现有 Playwright + 系统 Chrome 补采。12 张截图为轻量页面证据，不是全页面长截图。
- 没有运行 detector、Assessment B、单元测试、E2E、读屏器或真实后端联调；也未作正式 Impeccable 综合评审。
- 报告文件和 12 张截图已作为本次 Assessment A 快照保存于指定目录；critique-storage 趋势命令未运行，趋势记录未创建。这是独立 A 报告，不能当作六组件完整 Critique 归档。
- 按委托未提出产品决策问题。
