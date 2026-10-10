# Assessment A 浏览器证据索引

首行 provenance 见 [`report.md`](./report.md)。以下截图均由独立 Chromium 新标签从本地 VitePress 页面生成，报告中的观察只来自本次 A 取证。

## TransferPanel

| 文件 | 视口/状态 | 中文说明 |
|---|---|---|
| `assessment-a-demo-desktop-default.png` | 1440px，Demo 默认 240px | 组件横向布局和设置折叠正常，但右侧已选列表可视区约 71px，只能看到两条，批量栏动作名、计数和上限原因压在窄中栏。 |
| `assessment-a-demo-desktop-380.png` | 1440px，切换标准 380px | 四条已选项可同时看到，长名称折叠项可见 chevron；桌面截断项没有文字化“查看全文”。 |
| `assessment-a-mobile-source.png` | 390px，待选面板 | 分段按钮使用“可加入/已选”短标签与数量，树行与 44px 触控区稳定；中间批量操作的禁用原因单独占一行。 |
| `assessment-a-mobile-selected.png` | 390px，已选面板首屏 | 面板高度自动至少 352px，首屏显示三条已选项，底部出现“下方还有 1 项”；长名称仍在下一页。 |
| `assessment-a-mobile-selected-bottom.png` | 390px，已选列表滚到底部 | 未加载长名称以两行摘要显示，`查看全文` 文字入口和 44px 移除按钮同列，编码/状态/原始键值仍可核对。 |
| `assessment-a-mobile-320-selected.png` | 320px，已选面板 | 文档壳层可用宽度约 257px，页面无横向溢出；首屏三条，长项和滚动提示占用明显空间。 |
| `assessment-a-mobile-hud.png` | 390px，打开 HUD 深色主题 | 预览区域切到深色令牌，树/列表/批量控件保持可读；外层 Demo 状态与说明仍是浅色，这是文档约定的局部主题范围。 |

## VirtualTree

| 文件 | 视口/状态 | 中文说明 |
|---|---|---|
| `assessment-a-virtualtree-desktop.png` | 1440px，默认收起 controls | 首屏直接展示树和键盘提示，状态与高级操作被隐藏；summary 的可见展开指示不明显。 |
| `assessment-a-virtualtree-desktop-open.png` | 1440px，展开 controls | 状态按钮出现，两个高级分组仍可继续展开；内容分组合理，但读者不易从视觉上发现入口。 |
| `assessment-a-virtualtree-mobile.png` | 390px，默认收起 controls | 移动端首屏保留树行和筛选，折叠 controls 为降低噪音有效，但 summary 仍缺少明显 chevron。 |

## 交互检查记录

- `ArrowDown`：树首行焦点移到下一 `treeitem`。
- `Space`：下一树项从已选切为未选，Demo 计数从 4 变为 3。
- 已选项移除按钮按 `Enter`：当前项移除，焦点移动到下一项。
- `prefers-reduced-motion: reduce`：关键节点过渡计算为约 `0.00001s`，未发现持续动画阻塞交互。
- 320px：`document.documentElement.scrollWidth` 小于 `innerWidth`，未见页面级横向溢出。

## 浏览器取证边界

本索引没有运行 `detect.mjs`、没有注入 detector、没有生成 overlay，也没有读取 Assessment B；确定性扫描与 B 的浏览器证据由隔离评估负责。
