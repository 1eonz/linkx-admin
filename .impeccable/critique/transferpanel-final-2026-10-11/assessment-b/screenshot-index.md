# Assessment B 截图索引

所有视口截图均来自隔离 Chrome。移动截图使用 320×900 CSS 视口（可视宽度 305px）；桌面截图使用 1280×900 CSS 视口（可视宽度 1265px）。Overlay 截图保留 Detector 标注，标注污染测量的对照图则明确标出注入前、注入后和移除后。

| 文件 | 视图 | 用途 |
|---|---|---|
| `desktop-light-overlay.png` | 桌面、亮色 | 页面顶部、组件 Demo 与可见 Detector 标注 |
| `desktop-hud-overlay.png` | 桌面、HUD | HUD 主题下的页面与 Detector 标注 |
| `mobile-light-overlay.png` | 320px、亮色 | 窄屏页面与 Detector 标注；可见标注层造成的横向滚动 |
| `mobile-hud-overlay.png` | 320px、HUD | HUD 主题下的窄屏页面与 Detector 标注 |
| `mobile-overlay-before.png` | 320px、注入前 | 根宽度测量基线 |
| `mobile-overlay-after.png` | 320px、注入后 | Detector 标注注入时的根宽度与标注层 |
| `mobile-overlay-removed.png` | 320px、移除标注后 | 移除 Detector 注入节点后的根宽度复测 |
| `mobile-narrow-no-overlay.png` | 320px、无 overlay | 窄屏文档主视口；页面自身无根级横向溢出 |
| `mobile-demo-settings-open-no-overlay.png` | 320px、展开 Demo 设置、无 overlay | “空结果/加载中”按钮与高度 select 的可见状态及间距 |
| `mobile-props-table-overlay.png` | 320px、Props 表、overlay | Props 表格滚动容器及标注视图 |
| `mobile-props-table-no-overlay.png` | 320px、Props 表、无 overlay | Props 表格在无标注时的局部横向滚动 |
