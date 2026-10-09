# G2 修复后独立 Assessment B

日期：2026-10-10（Asia/Shanghai）  
范围：LxSearchBar、LxStatusSwitch 的现役源码、Demo 与文档  
方法：只读 detector + 独立浏览器证据；未读取 Assessment A 或代码审查输出，未修改产品源码。

## 1. Detector 三件套

运行命令：

```text
node C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs --json <target>
```

六个目标均满足：`stdout` 为合法 JSON `[]`，`stderr` 为空，退出码 `0`，静态 finding 数 `0`。按目标的 stdout JSON、stderr 和退出码三件套分别保存于 `detector/`，汇总见 `detector/summary.json`。

| 目标 | stdout JSON | stderr | exit | 结论 |
| --- | --- | --- | ---: | --- |
| `linkx-fe/src/components/LxSearchBar/index.vue` | `[]` | 空 | 0 | 静态零命中 |
| `linkx-fe/src/components/LxSearchBar/demo/basic.vue` | `[]` | 空 | 0 | 静态零命中 |
| `linkx-fe/docs/components/lxsearchbar.md` | `[]` | 空 | 0 | 静态零命中 |
| `linkx-fe/src/components/LxStatusSwitch/index.vue` | `[]` | 空 | 0 | 静态零命中 |
| `linkx-fe/src/components/LxStatusSwitch/demo/basic.vue` | `[]` | 空 | 0 | 静态零命中 |
| `linkx-fe/docs/components/lxstatusswitch.md` | `[]` | 空 | 0 | 静态零命中 |

`[] + exit 0` 只代表上述静态目标没有 detector 命中，不代表运行页面没有问题，也不等同于 Critique 通过。

## 2. 浏览器证据

使用新建 headless Chrome CDP page/context 访问 `http://127.0.0.1:4177`；运行期间在页面内动态注入 `detect-antipatterns-browser.js`，注入成功且 `window.impeccableDetect`、`window.impeccableScan` 可用。浏览器证据、原始测量和截图见 `browser/evidence.json` 与 `browser/*.png`。本轮启动的 4177/4178 VitePress 进程已停止。

### LxSearchBar

- 亮色 1440：文档页面加载成功，`scrollWidth=1425`，未出现页面级横向溢出。Demo 搜索根节点存在；前四字段实测前 3 项在同一行，日期字段已换到第二行（字段网格实测行数 `2`）。
- 375：视口为 `375×760`，文档壳层 `documentElement.scrollWidth=600`、`bodyScrollWidth=360`，存在由文档壳层/响应式外壳产生的横向溢出证据；组件按钮的“展开（隐藏 6 项）”“查询”“重置”均可见，尺寸分别约 `140×44`、`79×44`、`60×44`。
- 运行态 overlay 注入成功。页面 detector 命中 10 个实际/隐藏目标，主要为文档壳层的 `clipped-overflow-container`、隐藏复制按钮 `buried-raster`、文档段落 `line-length`、隐藏确认层 `gpt-thin-border-wide-shadow`，以及页面级 `gradient-text` 和 `layout-transition`。这些命中来自运行中的 VitePress 外壳或 Element Plus Teleport，不能直接归因于 LxSearchBar 六个静态目标。

### LxStatusSwitch

- 亮色 1440 默认态：布控服务 `开启`、兼容旧状态值 `0`、关闭前确认 `开启`。页面 detector 注入成功。
- `aria-labelledby`：3 个业务开关实际关联 `status-switch-boolean-label`（布控服务）、`status-switch-numeric-label`（兼容旧状态值）、`status-switch-confirm-label`（关闭前确认）；同时实测 `role=switch`、`aria-label=开启 / 关闭`、`aria-checked` 均存在。
- 确认弹窗 Teleport：点击确认示例开关后，页面出现 `role=dialog`，其祖先链位于 `body` 下的 Element Plus overlay；文本为“确认停用该节点？/关闭后将中断节点通信，并记录操作审计。/取消/确认关闭”。
- HUD：点击“HUD 深色主题”后，Demo 根节点增加 `lx-theme-hud`，并保存 HUD 截图；确认 overlay 仍在 body 下，body 出现 Element Plus 的 `el-message-box-parent--hidden` 管理类。
- 375：视口为 `375×760`，文档壳层 `scrollWidth=600`、`bodyScrollWidth=360`，同样存在文档外壳的横向溢出证据。开关实际输入元素由外层组件包裹，输入本身部分测量为零尺寸，不能用裸 input rect 代表触控区域；可见按钮/确认按钮测得 `44×44` 或更大区域。
- 减少动效：`matchMedia('(prefers-reduced-motion: reduce)').matches=true`；抽样开关按钮的 `transitionDuration` 降至 `1e-05s`，动画时长同样为 `1e-05s`，另有文档按钮保留 `0.25s` 过渡，属于 VitePress 外壳抽样而非状态开关本体。
- 运行态 overlay 命中 8 个实际/隐藏目标，主要为文档壳层的 `clipped-overflow-container`、示例权限/只读标签的 `cramped-padding`、隐藏复制按钮 `buried-raster`、移动文档表格 `edge-flush-cards`，以及页面级 `gradient-text` 和 `layout-transition`。这些命中应与组件源码静态零命中分开解释。

## 3. 证据边界

浏览器 overlay **成功**：脚本动态注入、`impeccableDetect` 执行并产生 console/返回 findings，且截图已保存。detector 运行态命中包含 VitePress 文档外壳、Element Plus 隐藏/Teleport 节点和示例标签；本报告没有把这些运行态命中回写成组件源码缺陷。静态六项均为零命中，浏览器证据仍显示 375px 文档壳层横向溢出，需由页面组合/文档外壳单独处理与复验。

