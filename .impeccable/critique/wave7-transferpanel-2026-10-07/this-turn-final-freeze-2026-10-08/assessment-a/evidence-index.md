# Assessment A 证据索引

采集入口：`http://127.0.0.1:4174`。本轮重新执行 `capture-final-pages.mjs`，分别新建 Playwright 页面访问 `/components/lxvirtualtree` 与 `/components/lxtransferpanel`；两页 HTTP 200，记录中 console errors、page errors 均为 0。

## 主要记录

- `browser-evidence.json`：路径、页面状态、viewport/overflow、过滤计数、键盘焦点、清空确认、主题、减少动效及错误计数的结构化数据。
- `capture-final-pages.mjs`：本次浏览器采集步骤。脚本仅打开新 context/page 并写入本 Assessment A 目录，不管理预览服务。
- `design-reference-screen.png`：随 Assessment A 保存的设计参考图。
- `source-hashes-start.txt` / `source-hashes-end.txt`：六个审查目标文件的开始与结束 SHA-256。

## 截图对应观察

- `virtualtree-desktop-page.png`、`transferpanel-desktop-page.png`：文档层级、示例布局、桌面信息密度和页面目录。
- `virtualtree-desktop-light.png`、`transferpanel-desktop-light.png`：核心组件结构和常态内容。
- `virtualtree-320-light.png`、`virtualtree-375-light.png`：窄屏树示例；页面无横向溢出，状态操作可换行。
- `transferpanel-320-source.png`、`transferpanel-375-source.png`、`transferpanel-375-selected.png`：窄屏单面板模式、两侧数量和已选列表；各视口切换后页面无横向溢出。
- `virtualtree-filter-count.png`：12 个匹配节点、祖先不计数及路径保留。
- `virtualtree-keyboard-focus.png`、`transferpanel-375-keyboard-focus.png`：树项和移动面板切换键可见焦点轮廓。
- `virtualtree-empty.png`、`virtualtree-loading.png`、`virtualtree-error.png`：树宿主示例的空、加载、错误反馈。
- `transferpanel-empty.png`、`transferpanel-loading.png`、`transferpanel-error.png`：面板状态、保留选择、重试及阻塞态整体降透明表现。
- `transferpanel-clear-confirmation.png`：清空前的危险确认以及一个未加载节点的明示数量。
- `transferpanel-inherit-description-missing.png`：继承说明缺失时开关禁用并提供关联说明。
- `virtualtree-desktop-hud-dark.png`、`transferpanel-desktop-hud-dark.png`：HUD 深色主题预览。

## 来源定位

- `LxVirtualTree` 过滤播报、树/treeitem 语义与空态：`linkx-fe/src/components/LxVirtualTree/index.vue`。
- 树 Demo 的状态示例、键盘交互与操作分组：`linkx-fe/src/components/LxVirtualTree/demo/basic.vue`。
- TransferPanel 清空确认、未加载键提示、继承说明和列表语义：`linkx-fe/src/components/LxTransferPanel/index.vue`。
- TransferPanel 宿主状态与错误恢复：`linkx-fe/src/components/LxTransferPanel/demo/basic.vue`。
- 面向接入者的限制与选择规则：`linkx-fe/docs/components/lxvirtualtree.md`、`linkx-fe/docs/components/lxtransferpanel.md`。

此目录不包含 Assessment B 的 detector、overlay 或其产物。
