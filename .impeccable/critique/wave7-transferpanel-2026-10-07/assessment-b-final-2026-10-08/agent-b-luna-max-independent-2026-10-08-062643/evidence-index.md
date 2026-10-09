# Wave 7 Assessment B Evidence Index

**Run status: 修复前独立基线，禁止作为最终验收通过。** 本目录由 Assessment B 单独生成，只依据指定组件、Demo、两份中文文档、静态 detector 和本次新建的浏览器页面；未读取 Assessment A、代码审查报告或其他 Assessment A/B 输出。采集期间源码处于用户指定的待验收基线版本；评估完成后主任务已继续修改组件，因此本目录中的浏览器结果不是修复后版本结论。

## 静态 detector

每个 markup target 独立运行：

```text
node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json "<target>"
```

| Target | Result | Evidence |
| --- | --- | --- |
| `linkx-fe/src/components/LxVirtualTree/index.vue` | `[]`，stderr 空，exit 0 | `detector-virtual-tree-component.{command.txt,stdout.json,stderr.txt,exit-code.txt}` |
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `[]`，stderr 空，exit 0 | `detector-transfer-panel-component.{command.txt,stdout.json,stderr.txt,exit-code.txt}` |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `[]`，stderr 空，exit 0 | `detector-transfer-panel-demo.{command.txt,stdout.json,stderr.txt,exit-code.txt}` |
| `linkx-fe/docs/components/lxtransferpanel.md` | `[]`，stderr 空，exit 0 | `detector-transfer-panel-doc.{command.txt,stdout.json,stderr.txt,exit-code.txt}` |
| `linkx-fe/docs/components/lxvirtualtree.md` | `[]`，stderr 空，exit 0 | `detector-virtual-tree-doc.{command.txt,stdout.json,stderr.txt,exit-code.txt}` |

`[]` 仅证明各文件在 detector 静态规则下零命中，不证明运行页面无问题，也不等同 Impeccable Critique 通过。

## 浏览器与服务

- 使用 Edge `Edg/154.0.4258.53` 的 headless Chromium，通过 CDP 创建独立页面及临时 profile。浏览器注入前通过设置 `document.title`、追加 `<meta>` 验证 DOM 可变；6 个页面均成功加载 `http://127.0.0.1:8417/detect.js`，可见 overlay 控制台输出。
- VitePress 独立服务仅监听 `127.0.0.1:4184`；Assessment A 的 `4174` 未使用。overlay live server 使用隔离临时 app root，仅监听 `127.0.0.1:8417`。
- `vitepress.start.command.txt`、`vitepress.start.cwd.txt`、`vitepress.pid.txt` 记录启动；`overlay-server.start.*` 记录 overlay server 启动；`server-shutdown-verification.json` 和 stop command/output 文件记录停止方法与端口核验。本次创建的 4184/8417 及 CDP 调试端口均已停止；Chromium 临时 profile 清理成功。4174 未被本次进程监听。
- 完整 DOM、overlay 控制台事件、异常、交互测量与页签身份见 `browser-evidence.json`。截图：
  - `desktop-light-ready.png`
  - `desktop-light-search-DEPT-03.png`
  - `desktop-dark-ready.png`
  - `desktop-hud-ready.png`
  - `mobile-375-empty.png`、`mobile-375-empty-ready-after-recovery.png`
  - `mobile-320-error.png`、`mobile-320-error-ready-after-recovery.png`
  - `virtual-tree-doc-desktop-light.png`

## 浏览器实测

- `DEPT-03` 在待选面板的部门编码查询中命中目标部门；保留机构祖先行，结果说明为“筛选结果已全部选择，共 1 项”。DOM 同时存在已选回显编码，因此原始匹配节点数为 2，目标结果 1 个。
- 在 375px 与 320px 布局，复选框触控层均为 44×44px，原生复选框视觉框为 24×24px，展开按钮为 44×44px；两个触控区间隔 4px、没有相交。实际触控分别能收起/重新展开树根并勾选子节点。禁用节点的 `aria-disabled="true"` 且 checkbox disabled。
- 错误态重试恢复及空态恢复均成功。截图记录的是外层 VitePress 视口：移动页面 `document.documentElement.scrollWidth` 分别为 600px（375 视口）和 560px（320 视口），但 `body.scrollWidth`、TransferPanel demo 与组件自身宽度均未超过可用内容宽度；`.vp-doc` 仍有 24px 内溢出。此处文档外壳确有横向溢出，不能归因给组件根节点。
- 错误页尝试恢复到 ready 后复核尺寸和控件；未在错误覆盖层截图里执行复选框、展开点击。对应恢复截图和数值仍在 JSON。

## Overlay 命中与归因

Overlay 规则命中不得直接按数量判定缺陷。页面包括整篇组件说明和文档主题样式，规则运行范围比组件本身大。逐条归因如下：

| 规则/目标 | 当前证据与归因 |
| --- | --- |
| `line-length` (`p`、`li`) | 命中 Demo/Props/规则中的长中文说明文本；属于文档排版的静态可读性提示，不能据规则名称直接认定文本不可读。 |
| `buried-raster` (`button.copy`) | 复制代码按钮图标资源带透明/栅格背景，被文档站工具按钮命中；是文档壳组件，非 TransferPanel 操作。 |
| `edge-flush-cards` (`table`) | 命中 Markdown API 表格默认边界；目标文档里的表格不是穿梭面板的业务卡片。 |
| `first-viewport-column-overflow` (`section.lx-transfer-panel`) | 桌面组件有 380px 固定面板高度，并与长文档后续内容共享正文列；规则把长内容首屏高度归给组件 section。组件内部左右列同高且组件宽度未溢出，这条提示需按实际区块用途解释，不自动按缺陷处理。 |
| `first-viewport-column-overflow` (`div.container`, VirtualTree 文档页) | VitePress 长文档主容器；文档外壳命中，与 TransferPanel 不相关。 |
| `clipped-overflow-container` (`span.container`) | 仅窄屏出现，定位到 VitePress 的全站导航/菜单包装层，非组件树或穿梭面板。 |
| `bounce-easing`、`layout-transition` (`body`) | 文档站包含过渡曲线/布局过渡；命中 `body` 全局样式，不在两个目标 Vue 组件样式中。 |
| `ai-color-palette` | 标准文档暗色主题中 190 个 `span` 等命中来自 VitePress 品牌文字色；HUD 深色主题额外命中组件的 sky-blue 主色及其配套标签/图标。这是仓库 HUD 设计令牌（`src/tokens/theme-hud.css`）的有意主题映射，规则标签本身不构成缺陷结论。 |

浏览器 overlay 的完整原始 console 记录和每个视口截图保留在 `browser-evidence.json` 与 PNG 中，便于修复后逐条对照。静态 detector 的零命中与浏览器 overlay 命中是不同信号源。

## 采集限制

- 第一轮 PowerShell 启动命令把带空格的 Edge 路径拆开，9337/9338 初次 CDP 连接失败；失败尝试与对应 `browser-evidence.partial.json`、`browser-capture.stderr.txt` 保留。第二轮改为直接从 Node 启动 Edge，完成同一批页面后 profile 清理成功。
- 初次 VirtualTree 文档页等待器误假设页面存在 TransferPanel 专用状态控件；后续改成等待 `.vp-doc`，最终独立打开 VirtualTree 文档、overlay 已注入、记录其标题、树 DOM、console 和截图。
- 最终运行记录存在 `browser-evidence.json`（5 个 TransferPanel 页面 + VirtualTree 文档路由）；最终脚本退出码见 `browser-capture-final.exit-code.txt`。前述失败轮次不是最终运行的浏览器结论。
- 这份 Assessment B 只记录指定覆盖范围，不包含 Assessment A 的启发式评分或综合设计结论；主任务应在源码冻结后重新执行互相隔离的最终 Assessment A/B 并做综合报告与快照。
