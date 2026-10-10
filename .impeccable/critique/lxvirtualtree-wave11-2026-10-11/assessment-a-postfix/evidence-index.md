# Assessment A 证据索引

Method: dual-agent (A: /root/virtualtree_assessment_a_postfix_luna · B: pending)

## 运行边界

- 页面服务：`http://127.0.0.1:5193`
- 服务启动目录：`F:\work\linkx-admin\linkx-fe`
- 服务命令：`pnpm dev --host 127.0.0.1 --port 5193`
- 服务根 PID：`14664`（启动的 `cmd`，子 VitePress Node PID 为 `23152`）
- 停止方式：停止根 PID 及其子进程，随后检查 5193 不再监听。
- 浏览器：Playwright 1.58，系统 Chrome executable，独立 Chromium context 与新 page。
- context：初始 `1280×900`、`locale=zh-CN`、`colorScheme=light`、`reducedMotion=reduce`。
- detector：未运行；未读取旧 Assessment B 报告、JSON 或 overlay。
- 页面错误：`pageErrors=[]`；响应监听 `httpErrors=[]`；控制台有一条未带 URL 的 404 资源提示，原始值保存在 JSON。

## 文件证据

| 文件 | 用途 |
|---|---|
| `browser-assessment-a-postfix.mjs` | 独立浏览器采集脚本；包含视口切换、HUD、插槽压力、筛选、长名称、键盘和 reduced-motion 断言/指标。 |
| `browser-results.json` | 结构化浏览器结果、截图清单、viewport、aria/几何数据、控制台与 page error 记录。 |
| `vitepress.stdout.log` | 本次 VitePress stdout；包含启动命令与本地 URL。 |
| `vitepress.stderr.log` | 本次 VitePress stderr；包含 pnpm 配置警告，无运行时失败。 |
| `vitepress.pid` | 本次服务根 PID `14664`。 |

## 截图证据

| 截图 | 状态与可观察结论 |
|---|---|
| `01-virtualtree-desktop-light.png` | 1280px 亮色 VirtualTree；筛选框、级联说明、状态区、固定 32px 树行和右侧摘要可见。 |
| `02-virtualtree-desktop-hud.png` | HUD 深色只作用于预览容器；深空背景、sky 主色、浅色文档外壳形成明确边界。 |
| `03-virtualtree-desktop-hud-slot-stress.png` | 开启多行节点插槽；固定行高保持 32px，压力文案被压进右侧摘要槽。 |
| `04-virtualtree-desktop-filtered-slot-stress.png` | 输入“执勤单元 01”；显示 12 个匹配节点、祖先路径展开和筛选后行位置。 |
| `05-virtualtree-narrow-slot-stress.png` | 375px 窄屏；控件外层 44px、无页面横向溢出，插槽裁切风险最明显。 |
| `06-transferpanel-desktop-light.png` | 1280px 亮色 TransferPanel；5:2:5 三列、240px 紧凑高度、32px 短项、长项增高与中间批量按钮。 |
| `07-transferpanel-desktop-hud.png` | HUD 深色 TransferPanel 桌面预览，状态色和边框切换正常。 |
| `08-transferpanel-narrow-source.png` | 375px 待选面板；“待选/已选”切换条、64px stacked 树行、44px 触控目标、键盘提示。 |
| `09-transferpanel-narrow-selected.png` | 375px 已选面板；列表可视高度约 136px，4 项中首屏显示 3 条短项/长项入口，并有“下方还有”提示。 |
| `10-transferpanel-narrow-long-name-expanded.png` | Enter 展开长名称；全文可读，条目约 140.6px，移除按钮仍位于右上 44px 触控列，列表自动滚动。 |

## 关键 JSON 指标

- VirtualTree 过滤状态：`筛选匹配到 12 个节点；路径祖先不计入数量。`
- VirtualTree 插槽压力：桌面 row `32px`，extra `20px`，相邻行 `nextTop == rowBottom`；窄屏四个首批操作目标均为 `44×44px`。
- VirtualTree 键盘：方向键后活动元素为 `role=treeitem`，键 `unit-1-1`。
- VirtualTree 375px：`documentWidth=375`、`scrollWidth=375`，无页面横向溢出。
- TransferPanel 桌面：组件预览宽 `720px`，面板高 `240px`，左面板宽 `290px`；普通选中项高 `32px`，长项高约 `57.6px`。
- TransferPanel 375px：移动切换条高 `54px`；树行高 `64px`；展开/复选/批量/移除目标均实测 `44px`。
- TransferPanel 长名称：展开前 `aria-expanded=false`，Enter 后 `true`，Space 后恢复 `false`；展开条目高约 `140.6px`，移除按钮 `44×44px`，列表 `scrollTop=175`。
- TransferPanel 键盘：树行活动元素为 `role=treeitem`、键 `org-01`；Space 操作后 Demo 显示当前已选 `3` 项。
- reduced-motion：context 与媒体查询均为 `reduce`；VirtualTree filter 和 TransferPanel selected item 的计算过渡时长为 `0.00001s`。

## 静态来源定位

- VirtualTree stacked 结构与固定摘要槽：`linkx-fe/src/components/LxVirtualTree/index.vue:1180-1243`。
- VirtualTree 压力插槽内容：`linkx-fe/src/components/LxVirtualTree/demo/basic.vue:254-261`。
- TransferPanel 长名称 disclosure：`linkx-fe/src/components/LxTransferPanel/index.vue:1155-1207`。
- TransferPanel 窄屏尺寸与移动切换：`linkx-fe/src/components/LxTransferPanel/index.vue:2165-2439`。
- TransferPanel Demo 默认紧凑高度与状态控制：`linkx-fe/src/components/LxTransferPanel/demo/basic.vue:16,200-299`。
- 全局 reduced-motion 令牌：`linkx-fe/src/tokens/variables.css:221-227`。

## 验证状态

- 已完成：浏览器手工评审、截图、结构化 JSON、服务日志和可复跑脚本。
- 未执行：Assessment B detector、旧 B 报告读取、单元/E2E/构建命令；这些不属于本次独立 A 的授权范围。
- 服务收尾：报告写入后停止 PID `14664` 及子进程，并复查 `Get-NetTCPConnection -LocalPort 5193 -State Listen` 无结果。
