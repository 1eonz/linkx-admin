# LxTransferPanel Assessment A 浏览器证据索引

状态：`provisional`。这些材料于 2026-10-07 在父任务通知的修复前版本采集，只保留为复核素材；不得用来证明修复后的源码状态或替代最终冻结哈希核验。Assessment A 正式报告尚未写入。

## 采集条件

- 目标：`http://127.0.0.1:4174/components/lxtransferpanel.html`，页面响应 HTTP 200。
- 浏览器：系统 Google Chrome，经 Playwright 启动；使用本次新建的 browser、context、page。Playwright 默认 Chromium revision 未安装，改用本机 Chrome executable；没有下载依赖。
- 页面有 1 条 Console 资源 404 提示，未保留响应 URL；无 `pageerror`。该提示尚未归因，不作为组件问题结论。
- 所有截图均为组件 Demo 元素截图，`desktop-page-1440x1000.png` 另存页面首屏；未运行 detector，未读取其他 Assessment A/B、代码复审或综合报告。
- 4174 服务未被停止。Playwright context 与 browser 已关闭。

## 截图

| 文件 | 视口 / 状态 | 可复查观察 |
| --- | --- | --- |
| `desktop-page-1440x1000.png` | 1440 × 1000，页面首屏 | VitePress 预览完整页面首屏。 |
| `desktop-ready-1440.png` | 1440 × 1000，默认数据 | Demo 元素宽 688px；左右面板各 380px 高；当前已选 5 项；组件宽度无页面横向溢出。 |
| `mobile-ready-375.png` | 375 × 900，默认数据 | Demo 元素宽 327px、高 1175px；文档宽仍为 375px；两侧面板纵向排列，面板各 380px 高，中间控制区在两面板之间。 |
| `hud-dark-1440.png` | 1440 × 1000，HUD 深色主题 | `lx-theme-hud` 已加到 Demo 根节点；组件面板切换为深色主题。 |
| `empty-tree-1440.png` | 1440 × 1000，宿主空树 | 左树显示“暂无数据”；已选项仍保留 5 项。 |
| `empty-selected-1440.png` | 1440 × 1000，确认清空后 | 未加载项触发“清空已选授权”危险确认；确认后显示“暂无分配权限，请在左侧勾选”，计数为 0，Demo 提供“撤销清空”。 |
| `loading-1440.png` | 1440 × 1000，加载中 | 宿主消息可见，`.transfer-panel-demo__surface` 的 `aria-busy="true"`；面板透明度 0.62。 |
| `error-1440.png` | 1440 × 1000，加载失败 | 错误消息使用 `role="alert"`，重试按钮可见，已选数保留为 5。 |
| `keyboard-focus-1440.png` | 1440 × 1000，键盘 Tab | 从 Demo 设置摘要开始，第 7 次 Tab 到“筛选待选节点”输入框；父筛选条有 2px box-shadow 焦点效果。 |
| `reduced-motion-1440.png` | 1440 × 1000，减少动效 | `prefers-reduced-motion: reduce` 匹配；组件及后代没有活动动画，计算出的非零 transition duration 为 `1e-05s`。 |
| `filter-result-1440.png` | 1440 × 1000，按“情指行一体化”筛选 | 筛选后显示“全选筛选结果 / 反选筛选结果”；已选匹配项使全选按钮禁用、反选按钮可用。 |
| `filter-invert-1440.png` | 1440 × 1000，反选筛选结果 | 已选数由 5 降至 4；状态文字反馈“选中 4 项；当前树中可解析 3 个节点”。 |

## 交互观测

- 点击“全选筛选结果”恢复已选数至 5；过滤输入可清空。
- “空结果”“加载中”“加载失败”由 Demo 宿主状态切换；错误恢复按钮可用。
- 清空包含未加载项时先弹出确认，确认后已选值变为空数组。
- 移动视口下 `document.documentElement.scrollWidth === innerWidth`，没有横向溢出；完整 Demo 的纵向高度为 1175px。
- 捕获期间的修复前冻结指纹不在此索引重申；最终评审必须按父任务提供的新冻结清单重新核验。
