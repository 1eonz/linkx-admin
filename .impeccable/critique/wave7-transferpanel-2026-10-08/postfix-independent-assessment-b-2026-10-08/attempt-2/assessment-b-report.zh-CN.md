# LxTransferPanel Assessment B 证据报告

方法：隔离浏览器与静态检测证据（Assessment B）；本文件不包含 Assessment A 设计评审，也不宣称为完整 Critique 综合结论。

## 对象与完整性

- 目标组件：`linkx-fe/src/components/LxTransferPanel/index.vue`；浏览器页面：`http://127.0.0.1:4199/components/lxtransferpanel`。
- 组件源 SHA-256 在静态扫描、attempt-2 浏览器运行及结束后均为 `707ea027e7c450226c68f07cec01df5730e7cb3b52270859c7389ec5a773cedc`。本次没有修改组件或 Demo 源码。
- 浏览器使用全新 Chrome 154.0.8037.95 profile、CDP 和 Impeccable 注入脚本。attempt-2 六个视图都成功，runner 退出码为 0，stdout 与 stderr 均为空；原始证据保存于 `browser-evidence.json` 和 `browser-console.json`。
- 六个视图均先截取无 overlay 基线，再注入 detector 并截取 overlay。逐对检查的图像内容不同，基线没有橙色工具栏/标注，overlay 图有注入标注。
- 组件、Demo、文档页静态扫描分别输出合法 JSON `[]`，stderr 均为空，退出码均为 0。静态零命中只表示这三个源码目标未触发 detector 规则，不代表浏览器视图零命中。

## 六个视图

| 视图 | Overlay 规则数 / 可见 overlay 节点 | 控制台记录 | 命中归属与观察 |
|---|---:|---:|---|
| `desktop-light-scope-and-keyboard` | 24 / 22 | 25 条 detector log；另有 1 条启动摘要 | `line-length` 命中文档段落与列表；`buried-raster` 命中 VitePress `button.copy`；`edge-flush-cards` 命中文档 Props 表；`bounce-easing`、`layout-transition` 命中全局 `body`。`text-occlusion` 指向 `.lx-transfer-panel__selected-name-full` 与相邻 `.lx-transfer-panel__node-code`，见下方复核。 |
| `desktop-hud-dark-keyboard` | 65 / 57 | 66 条 detector log；另有 1 条启动摘要 | `ai-color-palette` 重复命中 HUD 中的 cyan/sky 主题控件、图标、已选树行及元信息；颜色来源是 `theme-hud.css` 的 `--lx-color-primary: #38bdf8` 主题令牌。`cramped-padding` 命中 Demo 的 HUD 预览容器 `.transfer-panel-demo__preview.lx-theme-hud`。其余为文档正文、复制按钮、Props 表和全局 `body` 规则。 |
| `desktop-light-empty-state` | 23 / 22 | 24 条 detector log；另有 1 条启动摘要 | 命中只有文档段落/列表行长度、VitePress 复制按钮和 Props 表边距，以及全局 `body` 动效规则；没有目标组件节点命中。 |
| `desktop-light-loading-state` | 23 / 22 | 24 条 detector log；另有 1 条启动摘要 | 与空结果视图相同；loading 组件自身未被浏览器 detector 指中，目标面板无横向溢出。 |
| `desktop-light-error-retry-state` | 23 / 22 | 24 条 detector log；另有 1 条启动摘要 | 与空结果视图相同；重试按钮可用。指针点击重试后恢复“已载入组织权限数据”，当前已选 4 项仍保留。 |
| `mobile-375-light-reduced-motion-selected-long-name` | 5 / 4 | 6 条 detector log；另有 1 条启动摘要 | `clipped-overflow-container` 命中 VitePress `.container`，不是穿梭面板；`buried-raster` 命中页面代码块复制按钮；动效命中全局 `body`。注入前 document 宽度为 375px、无横向溢出；注入 overlay 后宽度增至 615px，属于检测 overlay 造成的页面级溢出，不能归因于组件。 |

控制台 banner 的 anti-pattern 数比同页 detector log 行少 1（六页一致）。原始记录保留了 `startGroup`、log 与 `endGroup` 事件；报告按页面 overlay 的 rule 节点数、规则名和命中选择器归因，不用 banner 数代替实际节点检查。

## 交互与复核

- Scope 原生 `<summary>` 的 CDP 键盘探测中，Space 打开菜单，Enter 没有打开；指针也可打开。长名称 `<summary>` 经 Tab 聚焦后使用 Space 能展开，完整文本未裁切且位于已选列表和面板内。该 Enter/Space 差异按本次浏览器探测记录；未改动原生控件语义。
- 移动端已选面板切换按钮经 Tab 聚焦后，Enter 探测未改变 `aria-pressed`；Space 和指针都将其切换为 true。selected 面板因此可见，滚动到长名称后文本可见区域为 239×84px，列表 `scrollTop=192`，状态和几何有效。由于这是 CDP 合成键盘输入，Enter 差异应视为需真人键盘复验的观察，不单凭该结果判定组件键盘行为失效。
- 对 `text-occlusion` 做了单视图隔离复核。展开长名称时文本可见、未裁切，位于列表内；文本矩形为 `(x=868.58,y=489.78,w=264.42,h=67.19)`，节点编码标签从 `y=558.97` 开始，矩形相交面积为 0，重叠比例为 0%。因此该 61% detector 命中不构成展开态的可见遮挡；命中选择器处于 disclosure 内容状态，按 detector 状态误报/非可见碰撞记录。
- 六个页面请求没有 JS exception。唯一 HTTP 失败是 scope 场景对 `/favicon.ico` 的 404，与组件请求无关；其余五页没有 HTTP 失败。
- `prefers-reduced-motion` 移动场景为 true。全局 `body` 的 bounce/layout 规则来自被测文档运行时环境；组件静态文件声明全局 reduced-motion 降级令牌。该浏览器 detector 命中不能据此认定组件自身忽略减少动效偏好。

## 清理

- 已停止本次隔离浏览器与 detector server；Chrome profile 和 detector 临时目录均已删除。
- 已停止隔离预览端口 4199。最终端口核验：4174 仍由原 PID 28380 监听；4199、8401、9333 均无监听进程。

## 限制

本报告只整理 Assessment B 的确定性源码扫描及浏览器证据。Detector 的 overlay 不是源码缺陷计数；HUD 令牌、文档 shell 与组件命中分别归因。Enter 键结果来自 CDP 输入探测，应以真实键盘复验。完整设计评分、优先级建议和独立评审结论由 Assessment A 与后续综合报告提供。
