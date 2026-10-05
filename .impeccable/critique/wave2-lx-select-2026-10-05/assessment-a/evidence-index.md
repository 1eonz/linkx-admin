# Assessment A 证据索引

评审时间：2026-10-05（Asia/Shanghai）

## 浏览器现场

- 页面：`http://127.0.0.1:4177/components/lxselect.html`，标题 `LxSelect 下拉选择器 | LxUI`。
- 使用独立新建的 Codex in-app browser 标签（tab 1）。5180 当时无监听；按任务要求未停止、重启或改写服务，改用父代理提供的独立 4177 文档服务。
- 桌面：CSS 视口 1280×720，devicePixelRatio 1；文档宽 1265px（垂直滚动条占 15px），文档高 5311px。
- 窄屏：CSS 视口 390×844，devicePixelRatio 1；文档宽 375px，无水平溢出。六个 `.el-select__wrapper` 都测得 44px 高、269px 宽。
- 窄屏展开态菜单边界：left 53、top 702、right 322、bottom 812，宽 269、高 110；完全在 390×844 视口内。
- 深色演示实测：`.lx-select-demo` 背景 `rgb(11, 18, 32)`；Teleport 菜单背景 `rgb(255, 255, 255)`；选中项背景 `rgb(245, 247, 250)`、文字 `rgb(0, 96, 169)`；`html` 未挂 `dark` 类。
- 交互：基础单选展开显示 3 项，选择“三级布控”后触发器值和 `aria-live` 状态同步变化；AX 树显示带名称的 combobox、expanded 状态和各选项。已检查 HUD toggle 后再展开，确认 popper 仍为亮色。

## 截图与测量文件

- `desktop-chrome-1280x720.png`：当前文档页桌面首屏，1280×720；通过独立 Chrome headless 页面捕获，页面地址同上。
- `mobile-390x844.png`：当前文档页窄屏首屏，390×844；通过独立 Chrome headless 页面捕获。窄屏断言和控件尺寸以 Codex in-app browser 的视口实测为准。
- `measurements.json`：记录视口、页面尺寸、菜单矩形、触控高度和深色状态的浏览器测量值。

## 设计与代码依据

- 设计图：`design/表单控件八件套/screen.png`（675×1600）；LxSelect 参考 HTML 位于 `design/表单控件八件套/code.html:280` 起。
- 尺寸和主题：`linkx-fe/src/components/LxSelect/style.css:92`、`style.css:64`。
- HUD 示例开关：`linkx-fe/src/components/LxSelect/demo/basic.vue:56`。
- API 类型：`linkx-fe/src/components/LxSelect/types.ts:32`；slot 声明：`linkx-fe/src/components/LxSelect/index.vue:33`。
- 文档 API 表：`linkx-fe/docs/components/lxselect.md:19`、`lxselect.md:49`；文档首屏说明：`lxselect.md:1`。

Assessment A 未运行 detector、未读取 Assessment B，也未修改产品源码。
