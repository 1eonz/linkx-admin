⚠️ DEGRADED: Assessment B only (按本轮限定范围；Assessment A 未执行)

# Wave 0 LxDatePicker 当前态：Assessment B 证据记录

本记录只包含 detector 与浏览器证据，不是完成的双评估 Critique。Assessment A 未读取或复核，因此不提供完整设计评分，也不宣称 Critique 通过。

## 目标与方法

- 页面：`http://127.0.0.1:4189/components/lxdatepicker.html`
- 静态目标：DatePicker 组件目录、`demo/basic.vue`、`docs/components/lxdatepicker.md`。
- 浏览器：CUA 浏览器不可用，本次使用本机 Playwright/Chromium 页面进行注入、采集和截图。`[Human]` 标题只写入隔离的 Playwright 页面；没有用户可见的 `[Human]` 标签页。本报告仅称 overlay 截图已归档。
- 五个浏览器视图均注入成功，分别覆盖桌面亮色、HUD 深色、HUD 减少动效，以及 390px、375px 移动视图。

## 静态扫描

三个目标的 detector 输出均为合法 JSON `[]`，stderr 为空，进程退出码为 0。

| 目标 | 命中 | stderr | 退出码 |
|---|---:|---:|---:|
| `linkx-fe/src/components/LxDatePicker` | 0 | 空 | 0 |
| `linkx-fe/src/components/LxDatePicker/demo/basic.vue` | 0 | 空 | 0 |
| `linkx-fe/docs/components/lxdatepicker.md` | 0 | 空 | 0 |

原始 JSON、stderr 与退出码分别保存在同目录的 `component-directory.*`、`demo.*`、`documentation.*` 文件中。

## 浏览器扫描

| 视图 | detector 命中 | overlay 标记 | banner |
|---|---:|---:|---:|
| 桌面 1440px，亮色区间日历打开 | 24 | 22 | 1 |
| 桌面 1440px，HUD 区间日历打开 | 48 | 46 | 1 |
| 桌面 1440px，HUD + 减少动效 | 48 | 46 | 2 |
| 移动 390px，区间日历打开 | 16 | 14 | 1 |
| 移动 375px，区间日历打开 | 16 | 14 | 2 |

五个视图合计 152 次规则命中、142 个 overlay 标记；这些是跨视图重复出现的规则次数，不是 152 个独立缺陷。主要归因如下：

- `ai-color-palette` 在两种 HUD 视图各命中 33 次，属于 Demo 明确展示的 HUD 主题配色。
- `gpt-thin-border-wide-shadow` 共命中 24 次。DatePicker 样式明确使用 `--lx-shadow-pop` 弹层令牌及控件内描边；需结合设计令牌判断，不能仅凭规则名判为缺陷。
- `text-occlusion` 共命中 16 次。实际命中的是日历弹层打开时被遮住的 Demo 标签和提示文字；日历 popper 属于预期浮层，但截图确认弹层打开期间这些底层文字不可见。
- `buried-raster`、`clipped-overflow-container`、`layout-transition` 命中的是文档站代码示例或外壳元素，不是 DatePicker 组件实现。
- `edge-flush-cards` 指向日历 `table` 网格，不是卡片列表；`line-length` 与 `em-dash-overuse` 指向文档文字，其中破折号规则会把 API 表格中的“不适用”占位符也计入。

## 可观察状态与环境

- 键盘：焦点落在日期单元格 `15`，`focusVisible=true`，但 `visibleFocusOutline=false`。所选日期的描边不能替代键盘焦点指示。发送 Escape 后 `escapeClosed=false`；Demo 的键盘说明写有 Escape 关闭日历，因此这项行为未达到说明预期。
- 减少动效：`prefersReducedMotion=true` 时，wrapper 与 popper 的 transition/animation duration 均为 `1e-05s`。
- 桌面 1440px 与移动 390px 记录均无横向溢出，390px 下日历弹层在视口内。375px 图片尺寸确认是 `375×844`，但同次布局 JSON 报告 viewport 为 `615×1385`、body width 为 `375`；该测量自相矛盾，所以不把其中的 `horizontalOverflow=false` 当作通过证据。
- 浏览器 `pageErrors` 为空。Console 记录一条资源错误：`/favicon.ico` 返回 404；网络记录中没有 HTTP 状态码不低于 400 的响应，也没有非本地外部请求。五次 detector 注入均请求本地 `localhost:8400` helper。
- `index.vue`、`style.css`、Demo、文档四个目标文件在采集开始与结束时 SHA-256 一致。
- 本轮 VitePress PID 3572 已停止，4189 不再监听；8400 helper 的停止命令退出码为 0。没有启动、停止或修改 4176。

## 证据边界

静态 detector 的零命中只代表这三个目标的静态规则未命中；浏览器 overlay 是隔离 Playwright 页面内注入并归档的截图，不是用户 `[Human]` 标签页中的可见覆盖层。375px 布局测量仍待修复采集后复验。完整综合评审、建议处理与复验快照不属于本次 B-only 交付。

Questions skipped: this deliverable is the requested Assessment B-only evidence record, not a full Critique.
