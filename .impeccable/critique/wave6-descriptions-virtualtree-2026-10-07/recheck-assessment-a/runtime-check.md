# Assessment A 运行核验记录

## 环境与边界

- 目标服务：`http://127.0.0.1:4175`，使用现有共享预览服务。
- 浏览器：独立 Chromium，通过新的 Playwright page 逐页访问目标。
- 视口：桌面 `1440x900`；Cascader、Descriptions、VirtualTree 另测 `375x812`；Sidebar 另测 `375x780`。
- 目标页面：
  - `/components/lxcascader`
  - `/components/lxdescriptions`
  - `/components/lxvirtualtree`
  - `/components/lxsidebar`
- 本记录属于独立 Assessment A。没有运行 detector，没有读取 Assessment B、旧 Wave 6 报告或其他历史评审作为判断依据。
- 没有停止或重启 4175 服务；该服务由父 Agent 管理。本次没有修改产品源码。

## 状态与交互核验

| 页面 | 已核验的可观察行为 | 结果 |
|---|---|---|
| Cascader | 错误聚焦时输入框有 `aria-invalid="true"`、`aria-describedby="cascader-demo-path-error"`、红色焦点边线和 `role="alert"`；英文错误文案含 `Failed to load organization data` 与 `Retry`；loading 与 error 并发时 loading 文案优先；禁用态输入不可用；375px 下页面宽度保持 375px，输入框与状态按钮高度为 44px。 | 通过运行核验 |
| Descriptions | 读取失败、重试、读取中、空结果均有可观察状态语义；复制按钮可聚焦并带 `复制警号：005882` 名称；主题切换可观察；375px 下详情面板约 327px/301px，无横向溢出；减少动效时过渡接近 0。 | 通过运行核验 |
| VirtualTree | 树有 accessible name `组织结构`；采用 roving tabindex，行内 toggle/checkbox 为 `tabindex="-1"`；错误重试、空结果、展开全部/收起全部可观察；375px 下展开按钮和复选框为 24x24px，页面无横向溢出。当前热更新源码下 `ArrowLeft -> ArrowRight -> ArrowRight` 将焦点移入 `unit-1-1`；`region-1` 暴露 `aria-checked="mixed"`，原生复选框 `indeterminate=true`。 | 通过运行核验；slot 固定行高风险保留在设计报告 |
| Sidebar | 分组按钮支持 `Enter`/`Space` 切换；rail 浮层子项可获得焦点，Escape 后焦点回到分组按钮；移动 drawer 为 dialog，关闭按钮初始聚焦，Escape 后焦点回到打开按钮；375px 下无横向溢出；`prefers-reduced-motion: reduce` 下品牌环动画为 `none`。 | 通过运行核验 |

## 证据产物

- 页面取证脚本：[capture.mjs](./capture.mjs)
- 状态核验脚本：[state-check.mjs](./state-check.mjs)
- 汇总状态结果：[state-results.json](./state-results.json)
- 页面运行结果：[runtime-results.json](./runtime-results.json)
- VirtualTree 修复后追加复核：[virtualtree-postfix.json](./virtualtree-postfix.json)
- 桌面状态截图：`cascader-desktop.png`、`cascader-error-focused.png`、`descriptions-desktop.png`、`virtualtree-desktop.png`、`sidebar-desktop.png`
- 窄屏截图：`cascader-mobile.png`、`descriptions-mobile.png`、`virtualtree-mobile.png`、`sidebar-mobile.png`
- Demo 状态截图：`cascader-demo.png`、`descriptions-demo.png`、`virtualtree-demo.png`、`sidebar-demo.png`

评分与设计结论见同目录的 [assessment-a.md](./assessment-a.md)：`35/40（Good）`。残余优先问题为 Demo 控制区展开后的密度、VirtualTree 自定义 `node` slot 可能突破固定行高，以及 Cascader loading 时触发器仍可聚焦/打开而选择被暂停。
