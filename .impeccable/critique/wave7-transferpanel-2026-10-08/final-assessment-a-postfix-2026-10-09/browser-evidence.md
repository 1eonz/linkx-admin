# Assessment A 浏览器证据

## 运行信息

- URL：`http://127.0.0.1:4174/components/lxtransferpanel`
- 浏览器：Chrome 154.0.8037.98，CDP 端口 9237，新建 target `C023F07A6CB9A49D1ABCFF8763E4E42C`
- 视口：1280×900、375×900、320×900，deviceScaleFactor 1
- 证据采集时间：2026-10-09 08:04 左右（本地时间）
- 目标组件：`linkx-fe/src/components/LxTransferPanel/index.vue`
- 嵌入子组件：`linkx-fe/src/components/LxVirtualTree/index.vue`
- 本文件只记录 Assessment A 的浏览器事实；未读取或复用 Assessment B 目录、报告或 findings。

## 视图清单

| 视图 | 截图 | 关键事实 |
|---|---|---|
| 桌面浅色 | `screenshots/desktop-light-viewport.png` | 1280px 下组件预览 720px，三列为 290/116/290px；桌面树行 32px；两侧面板 380px。 |
| 桌面 HUD | `screenshots/desktop-hud-viewport.png` | `.transfer-panel-demo__preview` 追加 `lx-theme-hud`；面板背景 rgb(16,26,44)，选中项背景 rgb(22,35,58)，状态文字仍使用语义色。 |
| 375px 浅色 | `screenshots/mobile375-light-viewport.png` | 单列面板，切换按钮各 44px 高；source panel 380px；树行 64px；正常状态无页面横向溢出。 |
| 320px 浅色 | `screenshots/mobile320-light-viewport.png` | 面板宽 272px；切换按钮各 44px 高；长节点名称自然换行；正常状态 `scrollWidth=320`。 |
| 键盘焦点 | `screenshots/mobile375-keyboard-focus-target-viewport.png` | Tab 第 4 步聚焦首个 `treeitem`，2px 主色轮廓可见；`mobile375-keyboard-focus-sequence.json` 记录完整前 12 步。 |
| 减少动效 | `screenshots/mobile375-reduced-motion-viewport.png` | `matchMedia('(prefers-reduced-motion: reduce)===true`；主要 transition/animation 为 `1e-05s`；treeitem 焦点环仍存在。 |
| 移动已选面板 | `screenshots/mobile375-selected-panel-viewport.png` | 已选列表包含 3 个普通项和 1 个未加载长项；长项实测高度约 154px；页面无横向溢出。 |
| 空数据 | `screenshots/mobile375-empty-state-viewport.png` | 树内显示“暂无数据”；宿主状态为“宿主返回了空树数据”；页面无横向溢出。 |
| 错误态 | `screenshots/mobile375-error-state-viewport.png` | 宿主 alert 显示“组织权限数据加载失败，当前选择仍然保留。重试”；状态保留语义。 |
| 反选范围弹层 | `screenshots/mobile375-scope-popover-viewport.png` | 弹层宽约 285px、高 76px、内部 `overflow:auto`；说明包含筛选隐藏项、不可选项和未加载项。 |
| 240px 桌面 | `screenshots/desktop-panel-height-240-viewport.png` | 模拟面板高度 240px 后，source grid rows `95/45/65/33px`，树视口 65px，约两行 32px。 |
| 240px 移动 | `screenshots/mobile320-panel-height-240-viewport.png` | 模拟面板高度 240px 后，source grid rows `111/45/17/65px`，树视口 17px，节点不可读。 |
| 320px 筛选激活 | `screenshots/mobile320-filter-active-viewport.png` | 输入“公安”后批量操作区溢出到视口右侧；`scrollWidth=456`，操作文字不完整。 |

## 键盘事实

375px 从移动待选按钮开始按 Tab，实际顺序为：

1. 已选面板切换按钮，`:focus-visible=true`。
2. “更多反选选项” summary，`:focus-visible=true`。
3. 左侧机构名称/部门编码筛选输入，`:focus-visible=true`。
4. 首个 `treeitem`，`:focus-visible=true`，outline 为 `rgb(0,96,169) solid 2px`。
5. “全部移除”按钮，`:focus-visible=true`。

之后焦点按文档顺序进入示例代码、Props/Events/节点元数据表格。隐藏的移动另一面板不会进入焦点顺序，符合 `display:none` 的当前实现。

## 减少动效事实

在 `Emulation.setEmulatedMedia` 设置 `prefers-reduced-motion=reduce` 后，`mobile375-reduced-motion-facts.json` 记录：

- `matchMedia` 为 `true`；
- `.lx-transfer-panel__panel`、`.lx-transfer-panel__selected-item`、`.lx-virtual-tree__row` 和移动切换按钮的 transition/animation 为 `1e-05s`；
- treeitem 活动焦点保持 2px 主色轮廓；
- 视口与树行高度不因减少动效发生抖动。

