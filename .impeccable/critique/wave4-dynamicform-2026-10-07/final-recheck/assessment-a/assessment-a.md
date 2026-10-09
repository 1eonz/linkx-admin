Method: isolated Assessment A (design review and live browser inspection only; not a combined Critique report)

# Wave4 最终版视觉与可用性评估

## 范围与总体印象

评估了 `http://127.0.0.1:4174/components/lxdynamicform.html`、`/components/lxupload.html`、`/components/lxdatepicker.html` 的最终页面和对应 Demo。使用独立 headless Chrome 154.0.8037.95；16 个场景各自新建 context/page，覆盖 1365×900 桌面亮色/HUD、375×812 触屏、空表单校验、上传失败/重试、减少动效、快捷日期及键盘打开/Escape。未复用用户浏览器标签，也未重启或停止 4174 服务。

三个 Demo 把任务语境带进组件文档：巡防任务、排班数据导入、专项布控日期。实际交互和错误恢复都比通用控件样例完整；外层仍是标准 VitePress 文档架构，产品性主要来自示例内容而非页面视觉。设计特异性判定：中等，适合工程组件文档，尚不是一眼可辨的 LinkX 产品表达。

## Nielsen 启发式评分

| # | 启发式 | 分数 | 主要依据 |
|---|---|---:|---|
| 1 | 系统状态可见 | 3/4 | 表单有字段错误和提交状态；上传有文件状态、进度、请求计数与最近操作；日期变更有状态反馈。 |
| 2 | 符合现实语境 | 3/4 | “排班数据导入”“任务负责人”“专项布控日期”等标签贴近管理业务；文档仍大量使用工程术语。 |
| 3 | 用户控制与自由 | 4/4 | 表单可重置，文件可清除/移除/取消并重试；日期面板可用 Escape 收起。 |
| 4 | 一致性与标准 | 3/4 | 控件沿用熟悉的表单、上传、日期选择和文档导航模式；三个 Demo 的说明与状态布局略有差异。 |
| 5 | 错误预防 | 4/4 | 必填校验、文件类型/大小限制、禁用态和受限日期均在操作前约束输入。 |
| 6 | 识别而非记忆 | 3/4 | 字段标签、内联提示、日期快捷预设和可搜索字段类型可见；低频状态需打开“演示设置”或折叠区。 |
| 7 | 灵活与效率 | 3/4 | 日期支持 ArrowDown、方向键、Enter、Escape；表单可选布局和字段类型搜索。没有提交类快捷键，但不是主要缺陷。 |
| 8 | 简洁与美感 | 3/4 | Demo 本身层级清楚、留白稳定；API 长表格和示例源码令整页偏长，阅读密度高。 |
| 9 | 错误识别与恢复 | 4/4 | 空提交准确标出名称/密码错误；上传失败保留文件和说明，点击“重新上传”后成功。 |
| 10 | 帮助与文档 | 3/4 | Props、Events、边界和示例较完整，页面内目录可跳转；缺少按常见任务组织的短路径索引。 |
| **总分** |  | **33/40** | **Good：基础扎实，少量移动端触达与信息顺序问题值得处理。** |

## 认知负荷与情绪路径

按 Critique 的 8 项认知负荷清单检查，核心 Demo 路径有 0 项失败；任一实际决策点没有超过 4 个同时可见选项。动态表单按任务信息、状态和附件分组，低频设置和全部类型预览折叠，日期示例拆成独立面板。主要负荷来自阅读整页 API 表格与工程术语，属于文档体量，而不是交互状态混杂。

情绪路径平稳且符合运维工具预期：用户先看到业务语境和当前值；提交空表单时字段附近给出明确错误；上传失败时文件仍在列表中，错误原因和重试入口同屏；重试成功后出现成功徽章和最近状态。日期预设选择后立即回填并关闭弹层，结果容易确认。没有依赖颜色单独表达失败/成功，行内状态也有文字。

## 做得好的地方

- 三个示例都有明确业务场景，不是空白控件画廊；动态表单避免把 14 种类型塞进主表单，而是提供可搜索的独立预览。
- 高风险状态保留上下文：空提交显示字段级错误；上传失败显示文件名、状态、原因和“重新上传”，重试后能看到成功结果。
- 触屏布局在 375px 下堆叠正常，页面宽度无整体横向滚动；主要日期触发器、上传按钮和表单提交控件有足够操作面积。HUD 配色保持表面、正文与控件边界的层次。

## 优先问题

1. **[P2] 动态表单的移动端主 Demo 被最小配置代码推到首屏之后**。窄屏文档先显示说明和代码块，交互表单要继续向下滚动才能操作；第一次来试控件的人要先经过一段实现代码。把“交互示例”移到最小配置之前，或在页首提供直接跳转到 Demo 的链接。建议 `/impeccable adapt`。
2. **[P2] 少数移动端辅助控件的触达高度低于 44px**。375px 下“浏览全部字段类型”链接测得 104×24px，日期 Demo 的 HUD 主题标签约 112×32px；它们低频且有文本名称，但仍比该界面的主要触屏目标小。为关联的可点击区域增加 44px 最小高度和居中对齐，不改变视觉字号。建议 `/impeccable adapt`。
3. **[P3] 文档源码复制按钮为 40×40px**。它比常用触屏目标建议值少 4px，属于文档辅助操作，影响低。移动断点下给按钮 44×44px 命中区。建议 `/impeccable polish`。

## Persona 红旗

- **Jordan（首次使用者）**：字段错误、文件格式限制和重试路径都直白，主要任务不会被卡住。动态表单的 `schema`、`remote-select`、`v-model` 等术语假设有 Vue 经验；对业务操作人员而言需依赖后半页说明才能解释这些接口概念。
- **Sam（键盘/无障碍使用者）**：表单字段有标签，错误以文本呈现；实测日期输入按 ArrowDown 打开日历，Escape 关闭并把焦点留在输入框，日历单元的焦点有可见环。未用屏幕阅读器验证日期网格及动态状态播报，因此 ARIA 播报效果仍属未验项。
- **Casey（移动用户）**：375px 页面没有外层横向滚动，主操作和日期触发器可触摸。动态表单主 Demo 初始位置靠后，低频跳转链接命中高度 24px；被打断后需再次找到长文档中的表单位置，页面没有跨刷新保存演示数据的承诺。

## 次要观察与问题

- “演示设置”“字段类型预览”和源码默认折叠，主表单更容易扫读；低频能力会多一次展开动作。
- 动态表单与日期文档在 375px 下 `.vp-doc` 可测到 351px scrollWidth / 327px clientWidth，来源是最小配置代码块的横向代码内容；代码块自身滚动，浏览器 document 仍为 375/375，Demo 内容也没有撑宽页面，未发现整页横向溢出。
- 颜色对比未做逐项数值计算；HUD 与错误态仅做浏览器目视检查。

## 需要考虑的问题

- 移动端读者的首要目标是先运行组件 Demo，还是先看最小集成代码？当前顺序让动态表单的操作入口更靠后。
- Demo 的主题切换是低频展示控制，是否应让控件可视面积达到与日期输入、上传按钮相同的触屏规格？

## 截图与机器证据

报告目录：`.impeccable/critique/wave4-dynamicform-2026-10-07/final-recheck/assessment-a/`

- 动态表单：`dynamicform-desktop-light.png`、`dynamicform-desktop-hud.png`、`dynamicform-mobile-light.png`、`dynamicform-empty-validation.png`
- 文件上传：`upload-desktop-light.png`、`upload-desktop-hud.png`、`upload-mobile-light.png`、`upload-failure-retry-prompt.png`、`upload-retry-recovered.png`、`upload-reduced-motion-progress.png`
- 日期选择：`datepicker-desktop-light.png`、`datepicker-desktop-hud.png`、`datepicker-mobile-light.png`、`datepicker-shortcut-selected-closed.png`、`datepicker-keyboard-open.png`、`datepicker-keyboard-escape-closed.png`
- DOM、视口、焦点、溢出、状态、拦截写请求与未捕获页面错误记录：`browser-evidence.json`

## 范围限制

这是独立的 Assessment A，不是完整综合 Critique。按任务要求未运行 detector、未查看 Assessment B、旧版 Assessment A/B、代码审查报告或其他 Agent 报告，也未生成 detector overlay；未执行 `context.mjs` 项目上下文扫描，因为本次评估范围指定为当前产品源码和浏览器，且模式由任务明确为 Read/Operate 混合。完整 Critique 的 Assessment B、综合结论、快照和趋势仍需由协调 Agent 在其独立评估完成后处理。

未运行测试套件；只做浏览器设计与交互检查。浏览器路由拦截并记录所有非 GET/HEAD/OPTIONS 请求，本次为 0；16 个场景均没有未捕获页面错误。日期键盘、上传重试和 reduced-motion 均通过 Demo 的本地状态检查。辅助技术播报与逐色对比度未验证。

Freeze start/end 的 stdout、stderr 与 exit code 均保存在本目录；两次 `matchedCount` 都是 **41/41**，`allMatch: true`，exit code 为 0，stderr 为空。本评估未修改产品源码、测试、计划或冻结文件。
