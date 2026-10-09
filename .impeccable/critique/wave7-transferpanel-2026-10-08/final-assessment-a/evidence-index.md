# Wave 7 LxTransferPanel Assessment A 证据索引

目标：`http://127.0.0.1:4174/components/lxtransferpanel`  
浏览器：Google Chrome 154.0.8037.95，由 Playwright 通过 Chromium API 控制；headless，独立 context。  
首轮：1440×960、浅色、`prefers-reduced-motion: reduce`；组件 HUD 另切深色。窄屏：390×844、320×740。  
设计参照：`design/虚拟滚动树 + 双栏穿梭/screen.png` 与同目录 `code.html`。  
输入文件只读；此目录保存审查报告、自动化证据与截图。未查看 detector 或 Assessment B 产物。

## 截图

| 文件 | 视图 / 复现步骤 |
|---|---|
| `01-doc-page-desktop-light.png` | 指定 URL 的完整文档页，桌面浅色初始视图。 |
| `02-component-desktop-light.png` | 组件桌面浅色预览；默认 4 项已选，包含 1 个未加载键。 |
| `03-host-error-state.png` | 展开“示例状态与主题”，选“加载失败”；观察选择保留与重试按钮。 |
| `04-host-empty-state.png` | 选“空结果”；观察空树信息及右侧既有选择保留。 |
| `05-host-loading-state.png` | 选“加载中”；观察状态消息与 `aria-busy`。 |
| `06-component-desktop-hud-dark.png` | 取消加载态后重载页面，勾选 HUD 深色主题。 |
| `07-filtered-batch-selection.png` | 浅色页面筛选“待授权特勤支队”，用“全选筛选结果”加入第 5 项，观察上限提示。 |
| `08-clear-confirmation.png` | 选择“全部移除”；确认框告知有 1 个未加载项且无法核对名称。截图后取消，选择保持 5 项。 |
| `09-clear-empty-state.png` | 再次清空并确认；观察空态、0 项计数和撤销入口。 |
| `10-component-mobile-390-source.png` | 390×844，待选侧；观察切换器、64px 树行及滚动布局。 |
| `11-component-mobile-390-selected.png` | 390×844，以键盘 Enter 切到已选侧；观察 44px 移除触控区、滚动余量提示及页脚计数。 |
| `12-component-mobile-320-source.png` | 320×740，待选侧；观察 80px 树行和窄页签标签换行。 |
| `13-keyboard-tree-selection-mobile.png` | 320px，筛选“站前路派出所综合作战室”，聚焦树行并按 Space；观察已选数变化和焦点环。 |

## 结构化证据

- `browser-facts.json`：URL、视口、主题、动作、树行尺寸、面板可聚焦元素、状态、选择结果及截图对应数据。
- `resource-errors.json`：第二个新 context 的资源/console 监听结果；没有页面脚本异常或可归属 URL 的非 2xx response。控制台出现一条 URL 未知的 404 文案，故未计作组件缺陷。
- `capture-assessment-a.mjs`：首轮截图与交互取证脚本。
- `capture-resource-errors.mjs`：隔离页面资源监听脚本。
- `docs-server.stdout.log`、`docs-server.stderr.log`：临时本地文档服务日志。
