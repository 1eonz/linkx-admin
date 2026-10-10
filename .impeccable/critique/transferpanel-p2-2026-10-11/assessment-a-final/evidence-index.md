# Assessment A Final 证据索引

所有截图和 JSON 均由本目录的 `capture.mjs` 通过独立 CDP 浏览器上下文采集。截图中的中文说明以当前最终源码实际渲染为准；没有把文档站侧栏或目录命中当作组件缺陷。

## TransferPanel

| 文件 | 中文说明 |
|---|---|
| `transfer-desktop-380.png` | 1440px 亮色视口；高度选择器显示“标准 380px（默认）”，批量提示为“剩余 1 个名额”。 |
| `transfer-desktop-300.png` | 1440px 适中 300px；右侧出现“下方还有 1 项”滚动状态。 |
| `transfer-desktop-240.png` | 1440px 紧凑 240px；右侧出现“下方还有 3 项”，用于确认边界压力。 |
| `transfer-desktop-long-name-expanded.png` | 桌面长名称展开；名称正文、`收起`、编码、状态、未加载标记和移除按钮同时可见。 |
| `transfer-desktop-hud-scrolled.png` | HUD 深色预览；设置摘要显示 HUD 已启用，外层文档保持浅色。 |
| `transfer-desktop-reduced-motion.png` | `prefers-reduced-motion: reduce` 状态截图；对应 JSON 记录过渡时长。 |
| `transfer-mobile-390-source-scrolled.png` | 390px 待选面板；可加入/已选分段、树行触控区、键盘提示和短批量提示可见。 |
| `transfer-mobile-390-selected-scrolled.png` | 390px 已选面板；三条完整条目、长名称“查看全文”、滚动提示和“剩余 1 个名额”可见。 |
| `transfer-mobile-320-selected-scrolled.png` | 320px 已选面板；短批量提示、右侧滚动条和“下方还有 1 项”可见，页面没有横向溢出。 |
| `transfer-mobile-320-settings-open-scrolled.png` | 320px 设置展开后的组件视口，确认设置打开不改变组件可用宽度。 |
| `transfer-mobile-320-keyboard-after-remove.png` | 320px 移除按钮的可见焦点框；本轮合成输入不作为删除成功证据。 |
| `transfer-evidence.json` | 各视口尺寸、面板高度、短批量提示、滚动提示、长名称 disclosure、HUD、焦点和溢出测量的机器可读记录。 |

## VirtualTree

| 文件 | 中文说明 |
|---|---|
| `virtualtree-desktop-collapsed.png` | 1440px 默认收起；主“演示状态和更多操作”入口旁有可见 chevron。 |
| `virtualtree-desktop-controls-open.png` | 主控制区打开；“数据操作与定位”和“边界与外观”两个嵌套入口均显示 chevron。 |
| `virtualtree-mobile-collapsed.png` | 390px 收起状态；summary 图标和树首屏在窄屏可见。 |
| `virtualtree-desktop-reduced-motion.png` | 减少动效状态；对应 JSON 记录媒体查询命中和摘要图标过渡时长。 |
| `virtualtree-evidence.json` | summary 尺寸、图标 SVG/可见性、展开状态、窄屏宽度和减少动效的机器可读记录。 |

## 运行记录

| 文件 | 说明 |
|---|---|
| `run-meta.json` | 端口、页面 URL 和完成时间。 |
| `vitepress.stdout.log` | 本轮 VitePress 启动日志。 |
| `vitepress.stderr.log` | 本轮 VitePress 启动告警；未发现页面运行时异常。 |
