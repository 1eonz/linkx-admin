# LxDatePicker Assessment A

评审目标：`/components/lxdatepicker.html` 中的日期区间 Demo。此报告只记录独立设计评审；未查看 detector 或 Assessment B 结果。当前状态：**尚非正式通过**，缺少可归档截图，且本报告不是完整双评审综合结果。

## 实测证据

- 在 390×844 视口加载后，`window.innerWidth=390`，页面内容宽 375px（含纵向滚动条差异）。日期区间卡片位于 x=40、y=547，宽 295px；起始输入位于 x=77、y=663，97.1×30px；结束输入位于 x=200.9、y=663，97.1×30px。两端底部均为 y=693，完整落在 844px 首屏内。触发器高度为 44px；页面没有横向溢出（`scrollWidth=clientWidth=375`）。输入位置偏首屏下方，但没有被裁切。
- 双端点的 DOM `id` 分别为 `demo-date-control-start`、`demo-date-control-end`，关联标签分别为“专项布控日期区间开始日期”和“专项布控日期区间结束日期”。
- 键盘交互可用：起始输入按 ArrowDown 后焦点进入日期网格；ArrowRight 移到相邻日期；Enter 依次选起止日后，触发器和状态文案更新为 `2026-09-16 至 2026-09-20`；Escape 关闭面板并将焦点返回起始输入，已选值保留。
- 390px 下日期弹层使用 `single-panel`，宽 324px，x=26 至 x=350；周表头为“一、二、三、四、五、六、日”。键盘聚焦日期有可见焦点环。
- HUD 状态下日期弹层文字保持可读：普通日期文字 `rgb(148, 163, 184)`，弹层背景 `rgb(22, 35, 58)`，实算对比约 6.13:1。浅色触发器和 HUD 日期网格在页面中均已查看。

## 可确认的问题

- **[P2] HUD 触发器的“至”分隔符近乎不可见。** 实际节点选择器为 `[data-testid="range"] .el-range-separator`；HUD 状态下 computed foreground 为 `rgb(29, 33, 41)`，触发器背景为 `rgb(16, 26, 44)`，对比约 **1.08:1**。日期值本身仍清晰，起止端点也有读屏标签，所以区间仍可理解；但可见分隔符丢失会削弱两值的关系提示。该节点位于 LxDatePicker 触发器内，不是 VitePress 文档外壳。Demo 在 [basic.vue](/F:/work/linkx-admin/linkx-fe/src/components/LxDatePicker/demo/basic.vue:72) 给根节点切换 `lx-theme-hud`，并在区间实例传入同名 `popperClass`；[style.css](/F:/work/linkx-admin/linkx-fe/src/components/LxDatePicker/style.css:84) 覆盖 HUD 背景、边框和值文字，但没有为 `.el-range-separator` 指定 HUD 字色。建议在 HUD 主题规则中将分隔符映射到可读的 Lx 文字令牌。

目前只确认这一项优先问题。首屏内容让 Demo 靠近视口下方，但两个端点完整可见；据此不把它登记为第二项缺陷。

## 限制与指纹

- CUA 浏览器截图曾在工具输出中短暂显示，但无法从该接口保存到本地目录。另一次本地截图落盘尝试因缺少 Playwright Chromium 可执行文件失败。因此本目录没有截图文件，也不声称存在可归档的快照证据；没有使用旧截图替代本次画面。
- 仅实测 390×844 浏览器视口和演示页本地状态；未做桌面尺寸或真实后端验证，未运行 detector，也未查看 Assessment B。
- 目标源码 SHA-256：`linkx-fe/src/components/LxDatePicker/demo/basic.vue`：`D029C78CB83EC53C7928826246925CC9E42D5361783A75409C0677E86B774AD1`。组件源码 `index.vue`：`49924D2921EA4F651253B77F69ACF85408B00B477C04E6F17F40E867E1E82DFD`。
- Assessment 服务已停止；检查时 4177 无监听进程。

Questions skipped: 1 Priority Issue; skipping is permitted below three.
