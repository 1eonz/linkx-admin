# LxTransferPanel Assessment A 复核证据

状态：`provisional`。父任务已要求先修复空树状态的已选项重叠，再统一冻结并复核。当前目录只保存修复前浏览器证据和 provisional P1；最终 Assessment A 报告尚未写入，结束 SHA256 核验未执行。修复后必须新开浏览器 context/page 复验，不能用本目录截图代替最终证据。

## 采集条件

- 目标：`http://127.0.0.1:4174/components/lxtransferpanel`，页面响应 HTTP 200。
- 浏览器：Playwright 启动系统 Google Chrome；每轮均使用新 browser/context/page，全部 context 与 browser 已关闭。
- 未启动或停止任何服务；4174 用户预览保持运行。未运行 detector/测试，未读取 Assessment B 或其结果。
- 页面触发一条未归因的通用 Console 404 文本；Playwright 未收到 HTTP >= 400 的 response，也没有 `pageerror`。不作为组件问题结论。

## 截图

| 文件 | 视口 / 状态 | 观察 |
| --- | --- | --- |
| `desktop-page-1440x1000.png` | 1440 × 1000 | 目标页面首屏。 |
| `desktop-light-ready-1440.png` | 1440 × 1000，Light | Demo 元素宽 688px；两面板各 380px 高；默认已选 5 项。 |
| `hud-dark-1440.png` | 1440 × 1000，HUD | `lx-theme-hud` 生效；源面板背景 RGB(16, 26, 44)，标题文字 RGB(226, 232, 240)。 |
| `mobile-light-375.png` | 375 × 900，Light | Demo 元素宽 327px、高 1066px；两面板纵排且各 380px 高；无横向溢出。 |
| `keyboard-focus-1440.png` | 1440 × 1000，搜索框焦点 | 收起 Demo 状态面板后，从摘要按 Tab 到“筛选待选节点”；筛选容器有浅色 2px 阴影焦点效果。 |
| `keyboard-tree-selection-1440.png` | 1440 × 1000，树行焦点/空格操作 | Tab 进入 `role=treeitem`，ArrowDown 移到下一行，Space 取消一个选中项；焦点行有 2px 主色 outline，已选数从 5 变为 4。 |
| `filter-match-1440.png` | 1440 × 1000，名称过滤 | 匹配一项并显示全选/反选筛选结果；已选匹配项使全选禁用、反选可用。 |
| `filter-invert-1440.png` | 1440 × 1000，反选筛选结果 | 已选数从 5 降为 4，状态条反馈当前树中可解析的节点数。 |
| `filter-select-1440.png` | 1440 × 1000，全选筛选结果 | 已选数恢复为 5。清除筛选后焦点回到筛选输入框。 |
| `empty-tree-1440.png` | 1440 × 1000，宿主空树 | 右侧仍保留已选项；每项变成“未加载”展示。此图在点击后约 100ms 捕获。 |
| `empty-tree-settled-1440.png` | 1440 × 1000，空树稳定 900ms | 已选列表标签、编码、状态和键值发生跨行重叠；这是当前 provisional P1。DOM 尺寸见 `empty-tree-observation.json`。 |
| `loading-1440.png` | 1440 × 1000，加载中 | `aria-busy=true`，提示为 `role=status`，面板透明度 0.62。 |
| `error-1440.png` | 1440 × 1000，加载失败 | 错误提示为 `role=alert`；重试按钮可见，已选值保留为 5。 |
| `reduced-motion-1440.png` | 1440 × 1000，reduce | `prefers-reduced-motion` 匹配；没有活动动画，非零 transition duration 为 `1e-05s`。 |
| `empty-selected-1440.png` | 1440 × 1000，确认清空后 | 未加载键触发确认；确认后已选数为 0，并显示空列表提示和 Demo 撤销入口。 |

## Provisional P1

**空树状态中，右侧已选项的文字发生垂直重叠。**可按 `empty-tree-observation.json` 中步骤复现。DOM 测量显示 `.lx-transfer-panel__selected-main` 高 56–84px，但各 `li` 仅约 40px，主内容框伸出本行并压到相邻项；等待 900ms 后仍可见。该状态下节点名称、编码、状态和未加载键值不易核对。建议保留未加载提示，同时给多行详情提供不重叠的行高/布局。

本问题尚待产品代码修复和父任务重新冻结；本文件不是最终 Assessment A 通过结论。
