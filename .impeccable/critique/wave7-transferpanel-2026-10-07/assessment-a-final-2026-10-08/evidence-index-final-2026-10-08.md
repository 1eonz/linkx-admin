# Assessment A 证据索引

采集日期：2026-10-08。目标：`LxTransferPanel` 文档页 `http://127.0.0.1:4183/components/lxtransferpanel.html`。浏览器：Chrome 154.0.8037.95，通过 Chrome DevTools Protocol 新建标签采集。正式报告：`assessment-a-final-report-2026-10-08.md`。

## 采集与边界

- 完整交互采集脚本：`capture-current-final-a.mjs`，`node --check` 通过，运行退出码 0。
- 断点焦点定点复核：`verify-current-anchor-breakpoints.mjs`，`node --check` 通过，运行退出码 0；没有重复完整交互采集。
- 完整结构化证据：`current-browser-evidence.json`。焦点锚点专门证据：`current-anchor-breakpoint-evidence.json`。
- 浏览器事件列表为空。所谓 non-local requests 只有内嵌 `data:image/svg+xml` 图标；没有外部 HTTP 或后端请求。
- 本报告为独立 Assessment A，不读取 Assessment B 或 detector 结果，不宣称完成综合 Critique。
- 完成后停止本轮启动的 VitePress 4183 与专用 Chrome/CDP 9333；复查 4183、9333、4174 均无监听。

## 源码指纹

报告对应字节的 SHA-256：

| 文件 | SHA-256 |
|---|---|
| `.pnpm-store/v11/projects/52a71209e7d25f2c975b26a09a9e5d31/src/components/LxTransferPanel/index.vue` | `E540B75CC0B8E6D1AF98765EF8A71ED9EB8AEB1457980084DDF0898C31548018` |
| `.pnpm-store/v11/projects/52a71209e7d25f2c975b26a09a9e5d31/src/components/LxTransferPanel/demo/basic.vue` | `641C38B92B957C2F0335D3939A2D09F953404DC4FE65C0CB605738298F90249B` |
| `.pnpm-store/v11/projects/52a71209e7d25f2c975b26a09a9e5d31/src/components/LxVirtualTree/index.vue` | `0466D77963DE46A3FEF76C58375B3AAB96874D699B8E15F95EA5C81C84BE247C` |
| `linkx-fe/docs/components/lxtransferpanel.md` | `6F32CE2EDFED1F85C0BC55A0ADD6F5FC3853AF46B8562D8A245ADCED35B23C5B` |

SHA-256 在报告写入前重新计算。未修改组件源码、Demo、测试、项目计划或交接文档；本轮只更新 critique 证据脚本并新增报告/索引。

## 证据映射

| 文件 | 内容 |
|---|---|
| `current-desktop-1440-light-default.png` | 桌面双栏、组织元数据、未加载授权回显和容量反馈。 |
| `current-full-tree-inverted.png` | 全树反选后已选项与禁用节点状态。 |
| `current-filtered-tree-inverted.png`、`current-code-filter-lowercase.png` | 编码筛选命中和筛选结果反选。大小写与计数细节见完整 JSON。 |
| `current-tree-no-match.png`、`current-host-empty-tree.png` | 搜索无匹配与宿主空树的不同提示。 |
| `current-host-loading.png`、`current-host-error.png` | loading 的 busy/inert/status 与 error 的 alert/inert/retry。 |
| `current-keyboard-invert-focus.png` | Shift+Tab 到反选按钮后的可见焦点。 |
| `current-desktop-hud-theme.png`、`current-desktop-dark-default.png`、`current-desktop-hud-dark.png` | HUD 深色、文档暗色默认、文档暗色下的 HUD 状态。 |
| `current-mobile-375-source.png`、`current-mobile-375-selected.png` | 375px 待选与已选视图。 |
| `current-mobile-320-source.png`、`current-mobile-320-selected.png` | 320px 待选与已选视图。 |
| `current-docs-props-320.png` | 窄屏 Props 表局部横向滚动。完整 JSON 记录 table 272px clientWidth、997px scrollWidth、`overflow-x:auto`。 |
| `current-anchor-1440.png`、`current-anchor-375.png`、`current-anchor-320.png` | 同一树项跨视口保持焦点的三张定点截图。 |

### 锚点复核

权威数据见 `current-anchor-breakpoint-evidence.json`。在 1440px 聚焦 `archive-unit-09` 后，不执行面板切换或其它 DOM 操作，连续调整到 375px、320px：

| 宽度 | focusedKey | 行高 | scrollTop | 树内行偏移 | DOM / 焦点 |
|---:|---|---:|---:|---:|---|
| 1440px | `archive-unit-09` | 32px | 301px | 116px | connected，focus-visible |
| 375px | `archive-unit-09` | 64px | 717px | 116px | connected，focus-visible |
| 320px | `archive-unit-09` | 80px | 925px | 116px | connected，focus-visible |

`current-browser-evidence.json` 中 `responsive-and-anchor-summary.anchor` 的早期测量是在移动端面板按钮点击之后，不能用于判断纯断点焦点保持；以本表和专门证据 JSON 为准。该 JSON 中 `mobile-375-source-panel` 是点击移动面板前的即时视图，可作为补充。

## 旧证据处理

- `assessment-a-report.md` 是代码修复前基线，保留且不作为本轮最终判断。
- `current-desktop-hud-light.png` 来自第一次主题序列，主题标签不准确；本轮改用 `current-desktop-hud-theme.png` 和 `current-desktop-hud-dark.png`。
- 完整采集中的移动锚点摘要受面板切换焦点影响；已在正文标出，不用于推断焦点丢失。
