# Assessment A 证据索引

目标页面：`http://127.0.0.1:4174/components/lxtransferpanel`  
浏览器：Chromium 153.0.8010.12；新建 browser context 与 page；1280×900、375×900、320×900。  
边界：只采集设计和页面行为证据；没有查看、搜索或调用 Assessment B / detector 结果。

## 报告与结构化证据

- `report.md`：中文设计审查、Nielsen 十项逐项评分、认知负荷、优点、优先问题、persona 红旗和边界说明。
- `browser-evidence.json`：14 个页面/DOM checkpoint，以及名额、键盘、列表滚动、主题和减少动效操作记录。
- `browser-assessment.mjs`：生成这些截图和 DOM 记录的一次性 Playwright 采集器。
- `source-hashes.json`：审查前、结束时七个冻结文件的 SHA256 核对。

## 浏览器截图

- `desktop-page-viewport.png`：桌面文档页面与 Demo 首屏。
- `desktop-default-demo.png`：1280px 默认 4 项已选、1 个可新增名额及“仅剩 1 个名额”提示。
- `desktop-after-adding-fifth.png`：搜索并选择“待授权特勤支队”后，总数从 4 变为 5。
- `desktop-source-clear-keyboard-focus.png`：键盘焦点落在待选筛选清除按钮时的可见轮廓。
- `desktop-selected-overflow-hint-visible.png`：关闭 Demo 上限并加入所有可选节点后的列表滚动提示。
- `desktop-selected-overflow-at-bottom.png`：已选列表滚至底部，向下提示收起。
- `mobile-375-page-viewport.png`：375px 文档页面首屏。
- `mobile-375-default-demo.png`：375px 纵向排列、默认选择和滚动提示。
- `mobile-375-filters-visible.png`：375px 两侧筛选均有值、清除按钮可见；右侧聚焦搜索框可见两个相邻 × 符号。
- `mobile-320-page-viewport.png`：320px 文档页面首屏。
- `mobile-320-default-demo.png`：320px 默认视图，树节点名称省略，列表内容溢出但可滚动。
- `mobile-320-filters-visible.png`：320px 筛选状态、两侧清除按钮与窄屏名称截断。
- `desktop-hud-dark-theme.png`：HUD 深色主题下的组件和 Demo 外壳。
- `desktop-hud-dark-reduced-motion.png`：深色主题、减少动效偏好已开启的采样画面。

## 关键 DOM 观测

- 默认已选数为 4；全量加入禁用，旁边显示“仅剩 1 个名额”。勾选唯一可用待选节点后显示 5 项。
- 桌面两侧清除按钮都是 32×32px；375px 和 320px 两侧均为 44×44px。
- 两侧筛选清除按钮均可由键盘到达，按钮聚焦轮廓为 2px solid；执行清除后焦点分别回到“筛选待选节点”和“在已选项中检索”。
- 桌面溢出状态：已选列表 `364/212px`，提示显示；滚动到底 `scrollTop=152px` 后提示隐藏。
- 375px 与 320px 的 `documentElement.scrollWidth` 分别为 375px 和 320px，没有整体横向溢出；面板为单列纵向排列。
- 320px 下“待授权特勤支队”树标签可视宽 31px，文本 `scrollWidth` 为 91px；“情指行一体化研判调度专班”为 74px/156px。
- 深色样式下根类为 `dark lx-theme-hud`，面板背景 `rgb(16, 26, 44)`、正文 `rgb(148, 163, 184)`、强调令牌 `#38bdf8`。
- 减少动效媒体查询为 true，面板、操作按钮和已选项计算出的过渡/动画时长均为 `1e-05s`。
