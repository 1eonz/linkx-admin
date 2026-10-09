# Wave 7 LxTransferPanel：Assessment B 证据

本记录只包含 Assessment B 的 detector、隔离浏览器与 overlay 证据，不读取或引用 Assessment A 内容。评估目标为 `linkx-fe/src/components/LxTransferPanel/index.vue`，静态 Demo 为 `linkx-fe/src/components/LxTransferPanel/demo/basic.vue`。`.impeccable/critique/ignore.md` 在本次运行时不存在。

## Detector

| 目标 | 命令 | UTC 时间 | 退出码 | JSON 校验 | 结果 |
| --- | --- | --- | ---: | --- | --- |
| 组件 | `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json linkx-fe/src/components/LxTransferPanel/index.vue` | 见 `detector-component.metadata.json` | 0 | 可解析，根类型为数组，长度为 0 | 静态规则零命中 |
| Basic Demo | `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | 见 `detector-basic-demo.metadata.json` | 0 | 可解析，根类型为数组，长度为 0 | 静态规则零命中 |

原始 stdout、stderr、完整命令、开始/结束时间及真实退出码分别保存在 `detector-component.*` 和 `detector-basic-demo.*` 文件。stdout 原文是 `[]` 加换行。该结果只说明两个静态 markup 目标没有命中 detector 的源码规则，不表示运行页面没有问题或 Critique 通过。

## Browser

使用 Playwright 的 Chromium API 与系统 Edge channel，另启浏览器进程，并为每种状态建立独立 browser context/page。每页在扫描前都验证了 `document.title` 可改写，且可追加 `<script>` 节点。注入地址为本次 Impeccable live-server 的 `/detect.js`；三页均确认 `window.impeccableScan` 存在并观察到 detector console 输出。因此这三页是实际执行的 overlay 证据，不是仅根据截图推断。

| 状态 | 视口 | 交互 | Console detector 摘要 | Overlay 元素 | 命中归属 | 截图 |
| --- | ---: | --- | --- | ---: | --- | --- |
| 桌面浅色 | 1440 × 1100 | 默认样例状态 | 21 groups | 21 | 组件 1；文档区 19；page banner 1 | [desktop-light.png](desktop-light.png) |
| HUD 深色 + 清空确认框 | 1440 × 1100 | 展开示例参数、启用 HUD、点击“全部移除”，确认框保持打开 | 54 groups | 54 | 组件 34；文档区 19；page banner 1 | [hud-confirmation-desktop.png](hud-confirmation-desktop.png) |
| 375px HUD + 清空确认框 | 375 × 900 | 启用 HUD，打开清空确认框 | 42 groups | 42 | 组件 36；文档区/导航 5；page banner 1 | [hud-375-mobile.png](hud-375-mobile.png) |

“groups”是 detector console 的摘要值；一个 page banner 中可以包含多个 page-level 规则。`assessment-b-evidence.json` 保留每条原始 console 记录、overlay label、检测目标 tag/class/path/text、归属判定、请求失败、页面错误和布局测量；截图均为 detector 执行后的画面。

## 命中判读

- 浅色桌面唯一组件命中为 `positioned child clipped by overflow container`，目标是左侧 `.lx-transfer-panel__panel`。该面板使用内层树列表承载虚拟滚动；截图显示是面板裁剪/滚动区域，属于需要按预期滚动容器行为核对的规则命中，不直接等同于功能缺陷。
- HUD 桌面有 33 条 `✦ ai color palette` 组件命中，375px HUD 有 35 条。同一规则重复指向树行、复选框、SVG 路径、状态/文本子节点等。组件使用 `--lx-color-primary` 等 LinkX 变量；[theme-hud.css](../../../../linkx-fe/src/tokens/theme-hud.css) 明确以中文注释将 HUD 主色定为 sky blue（`#38bdf8`）。这些是 detector 的规则命中，不应按 33/35 个独立缺陷计数；颜色选择有已实现的主题令牌依据，仍可在综合视觉评审中评估主题观感。
- 三个状态中的文档正文 `line length too long`、代码复制按钮 `raster buried under a wash or opacity` 和 API 表格 `cards flush against the scroller edge` 都落在 VitePress `.vp-doc` 内容区；375px 下额外一条 `positioned child clipped by overflow container` 落在 VitePress 导航汉堡控件。这些文档区域和导航命中不属于 `LxTransferPanel` 组件。页面级 banner 显示 `bounce easing: cubic-bezier(.71, -.46, .29, 1.46)` 和 `layout transition: height, padding-top, padding-bottom`，目标也属于文档站外壳。
- 375px 页面报告 `documentElement.scrollWidth=615`、视口宽 375。测得 API 参考表格宽约 976px、右边界在 x=1001，是页面横向溢出的来源；组件本身在 x=24 至 x=351，宽 327px，`scrollWidth=clientWidth=327`。确认框测量宽 375px，未造成额外组件溢出。因此此页面级溢出不应记在 TransferPanel 组件名下。
- Console 有一个仅在浅色页观察到的 `/favicon.ico` 404；浏览器 pageerror 为 0、failed request 为 0，三状态均未观察到发往 localhost 以外的 HTTP(S) 请求（请求数 0）。

## 服务与证据文件

给定预览地址 `http://127.0.0.1:4174/components/lxtransferpanel` 的请求被拒绝，虽然随后该端口被报告为占用；未停止或改动该 listener。本次 VitePress 临时预览改用 `4175`，Capture 完成后通过其终端 session 发送 Ctrl+C 并退出。自己的 Impeccable live-server 在端口 8400 启动、注入三页后以记录的 `stop --keep-inject` 命令成功停止。之后端口抽查发现另一个 PID 2432，进程创建时间晚于本次停止时间；它虽运行同一路径脚本，但属于后续进程，所以本次未触碰。启停证据在 `preview-server.json`、`live-server-start.json` 和 `live-server-stop.json`。

主要原始材料：`assessment-b-evidence.json`、`browser-evidence.json`、`capture-assessment-b.mjs`、两组 detector stdout/stderr/metadata、三张 PNG 截图及 preview/live-server 启停记录。
