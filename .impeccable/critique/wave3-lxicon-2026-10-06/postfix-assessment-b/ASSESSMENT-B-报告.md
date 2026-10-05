# Wave 3 LxIcon 修后版：Impeccable Assessment B

## 范围与方法

本报告只记录 Assessment B 的 detector 与浏览器证据；没有读取 Assessment A 或 code review 报告，也没有修改产品源码。静态扫描使用 Impeccable `detect.mjs --json`，对指定的六个目标逐个执行。浏览器使用 Playwright 1.58 与本机 Google Chrome，新建 BrowserContext 和页面访问 `http://127.0.0.1:4174/components/lxicons.html`；每个视图都成功注入临时 live-server 提供的 `detect.js`，由页面内 detector 扫描后截图。

| 目标 | 原始 JSON stdout | stderr | 退出码 |
| --- | --- | --- | ---: |
| `src/components/LxIcon/index.vue` | `[]` | 0 字节 | 0 |
| `src/components/LxSidebar/LxSidebarItem.vue` | `[]` | 0 字节 | 0 |
| `src/components/LxSidebar/LxSidebarGroup.vue` | `[]` | 0 字节 | 0 |
| `src/components/LxSidebar/LxSidebarFooter.vue` | `[]` | 0 字节 | 0 |
| `src/components/LxUpload/index.vue` | `[]` | 0 字节 | 0 |
| `docs/components/lxicons.md` | `[]` | 0 字节 | 0 |

每项的命令、原始 stdout、stderr、exit code 分别保存在同名前缀的 `.command.txt`、`.stdout.json`、`.stderr.txt`、`.exit-code.txt` 文件中。静态 `[]` 仅表示该源码目标的静态规则没有 primary finding，不代表运行页面通过。

## 浏览器视图

九个视图均确认脚本注入成功、`window.impeccableScan` 已注册且页面 detector 返回了结果。截图中可见黄色 detector banner 和目标标记；页面内 finding 数量包含文档站外壳、组件、内容及 overlay 自身的误报，不等于缺陷数。

| 视图 | 尺寸 | detector findings | 截图 |
| --- | ---: | ---: | --- |
| 桌面浅色默认态 | 1440×1000 | 119 | [browser-desktop-light.png](browser-desktop-light.png) |
| 桌面 HUD | 1440×1000 | 121 | [browser-desktop-hud.png](browser-desktop-hud.png) |
| 375 浅色 | 375×812 | 100 | [browser-mobile-375-light.png](browser-mobile-375-light.png) |
| 375 HUD | 375×812 | 100 | [browser-mobile-375-hud.png](browser-mobile-375-hud.png) |
| Hover：delete | 1440×1000 | 139 | [browser-hover-delete.png](browser-hover-delete.png) |
| 键盘焦点 | 1440×1000 | 119 | [browser-keyboard-focus.png](browser-keyboard-focus.png) |
| 减少动效下 Hover | 1440×1000 | 139 | [browser-reduced-motion.png](browser-reduced-motion.png) |
| `undo` 筛选 | 1440×1000 | 8 | [browser-filter-undo.png](browser-filter-undo.png) |
| 无匹配空态 | 1440×1000 | 8 | [browser-empty-state.png](browser-empty-state.png) |

浏览器实际状态记录在 `browser-state-probes.json`，完整 console、请求和页面事件记录在其中的 `logs` 数组；对应执行命令、原始 stdout、stderr 和退出码也分别留档。筛选 `undo` 后有 1 个结果；输入不存在的名称后显示“无匹配图标”。键盘从筛选框 Tab 到首个图标按钮后，`focus-visible` 生效并有 2px 实线轮廓。Hover 时 delete 图标执行配置的缩放、阴影和短促动画；`prefers-reduced-motion: reduce` 下图标动画为 `none`、变换为 `none`、transition 为 `0s`。

HUD 通过库实际使用的 `<html class="lx-theme-hud">` 类检查；HUD 下图标目录背景解析为 `rgb(11, 18, 32)`，文档外壳仍为白色。这是组件演示区域应用 HUD 令牌的结果。

## 命中归因

- **真实组件命中：图标名称文本。** 页面内 detector 在图标卡片的 `.icon-tile__name` 上发现 `10px` 功能文字，低于 detector 的 11px 可读性门槛。中文含义标签为 12px；这是组件文档实际展示的次级名称文字，属于真实目标命中，值得单独评估其字号用途。
- **真实组件与令牌命中：空态对比度。** 空态 `.icon-empty` 使用 `--lx-text-secondary`；浏览器解析后为 `#86909c`，在白底上对比度为 3.2:1。该状态的可见文字未达到 detector 的 4.5:1 文本对比阈值。这是实测令牌使用结果，不是扫描数量推断。
- **组件令牌命中：Hover 阴影。** Hover 卡片使用 `--lx-shadow-pop`，detector 在该状态提示 1px 边框与 16px shadow blur 的组合。截图显示这是单张悬停卡片的状态样式；令牌命中本身不等于缺陷。
- **文档正文。** `line-length` 命中落在图标页的说明段落；窄表格间距命中落在文档对照表。这些属于文档内容排版，不是 `LxIcon` SVG 本身。
- **VitePress 外壳。** `body` 上的 Inter 占比和高度/内边距 transition、`.copy` 上的隐藏 raster 命中属于文档站全局或代码块控件；375px 下的 `span.container` clipped-container 规则也没有指向图标目录类名，不能归为图标组件缺陷。
- **overlay 误报。** 页面扫描还报告了大量 `text-occlusion`，文本内容正是 detector 自己生成的 “undersized functional text” 标签；截图能看到黄色标签互相覆盖卡片文字。这是 overlay 的呈现/自检伪影，不作为产品页面命中计数或缺陷结论。

## 错误、溢出与服务

九个浏览器视图没有捕获到未处理 `pageerror`、请求失败或可归属的 HTTP 响应错误；桌面浅色默认态记录到一条 Chrome 通用 console 错误：“Failed to load resource: the server responded with a status of 404 (Not Found)”，事件没有提供资源 URL，不能据此归因到具体组件。

1440px 视图的根文档宽度等于视口宽度。375px 两种主题的记录是 `documentElement.scrollWidth=615`、`clientWidth=375`，但宽度采样是在 detector overlay 已注入后进行；截图中黄色 overlay 标签本身延伸到视口右侧，因此本轮不能证明原页面在无 overlay 时也存在横向溢出。该数字和 detector 的 `.container` 命中都保留供后续无 overlay 复核，当前不归因为 `LxIcon`。

服务核对记录在 `service-port-verification.json`：用户已有 4174 listener 的 PID 前后均为 `44124`。本次临时 overlay server 在 8400 端口启动、停止退出码为 0，停止后 8400 不再监听；没有停止 4174 服务。

## 环境和采样说明

随 Playwright 安装的 Chromium 在本机遇到 Windows 并行配置启动错误；Playwright 改用系统 Google Chrome 后完成全部视图。第一次脚本尝试因将 `emulateMedia` 调用在 BrowserContext 而失败，错误保存在 `browser-state-probes-attempt-1.*`；改为 Page API 后最终浏览器命令退出码为 0、stderr 为空。

原始 browser JSON 里的 `visibleOverlayCount` 在 `scan()` 后立即采样，早于后续 450ms 的显现等待，所以值为 0；同一记录中的 banner 状态以及九张稍后截取的 PNG 都显示 overlay 已实际呈现。该字段不应用来否定截图证据，也不应称为稳定后的可见 overlay 数量。
