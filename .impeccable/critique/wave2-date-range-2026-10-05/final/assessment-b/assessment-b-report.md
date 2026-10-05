# Assessment B：LxDatePicker 日期区间

## 范围

- 静态扫描目标：`linkx-fe/src/components/LxDatePicker/`
- 浏览器目标：`http://127.0.0.1:5180/components/lxdatepicker`
- 浏览器视图：1440×900 桌面默认态、375×812 移动端区间弹层、390×375 普通区间弹层、390×375 HUD 快捷区间弹层。
- 本报告只记录 Assessment B 的静态 detector 与浏览器证据，不包含 Assessment A 或综合评审。

## 静态 detector

`detector.stdout.json` 为 `[]`，`detector.stderr.txt` 为空，退出码为 `0`。这表示该源码目录的静态规则扫描零命中；它不代表运行页面没有问题，也不等于整体 Critique 通过。

## 浏览器证据

四个视图的文档状态均为 HTTP 200；DatePicker 组件、样式和 Demo 相关请求均为 HTTP 200。记录中没有 page error 或 failed request。桌面默认态有一条未关联到具体 URL 的通用 404 console 文案；记录的响应列表中没有对应的非 200 请求，因此暂不能归因到 DatePicker。

Detector overlay 的脚本注入成功，`detect.js` 返回 HTTP 200。overlay console 汇总数如下：

| 视图 | console 汇总数 |
|---|---:|
| 桌面默认态 1440×900 | 18 |
| 移动端区间 375×812 | 17 |
| 普通区间 390×375 | 15 |
| HUD 快捷区间 390×375 | 42 |

这些数量覆盖 VitePress 文档外壳和组件，不可直接视为 DatePicker 缺陷数。截图中的实际命中仍需按元素和设计依据逐项判读。

## 短视口发现

**可用性问题：390×375 时区间弹层超出视口。**

- 普通区间弹层的位置为 x=33、y=221，尺寸 324×359，底边 y=580，超出 375px 高的视口。实际 wheel 操作后，弹层内部 `scrollTop` 从 0 到 6，`window.scrollY` 保持 357；末行滚入弹层内部区域（y=534–579），但仍在视口下方。截图 `short-390x375-range-at-scroll-end.png` 显示了下部裁切。当前证据只能说明弹层内部可滚动，不能说明末行对用户可见。
- HUD 快捷弹层的位置为 x=14、y=222，尺寸 362×359，底边 y=581，同样超出视口。wheel 后弹层内部 `scrollTop` 从 0 到 67，`window.scrollY` 保持 841；末行位于 y=535–580，仍在视口下方。快捷按钮存在且可滚动，但测试状态下弹层下部被视口裁切。
- 后续修复应让弹层适配当前可用视口（例如调整弹层翻转或高度约束），并复验短屏状态下末行实际进入 viewport；本轮没有修改应用源码。

375×812 的区间弹层截图尺寸为 324×365。该视图未观察到短屏场景中的上述裁切；短视口问题由 390×375 的实际位置与截图支持。

## 服务清理

首次 stop 命令报告已停止 8400 端口的临时 live server，退出码为 0。随后再次运行 stop 作为幂等核验，输出 `No running live server found.`，退出码仍为 0；停止复核的 stdout、stderr 和退出码保存在 `helper-stop.stdout.txt`、`helper-stop.stderr.txt` 和 `helper-stop.exit-code.txt`。复核时 8400 已无监听，用户保留的 5180 仍由 PID 37856 监听。

stop 脚本同时报告 `.impeccable/live/config.json` 缺失，无法移除 live 注入标签。该提示来自标签清理步骤；临时 server 已停止，且本次没有停止 5180。

## 证据文件

- `browser-evidence.json`：四个浏览器视图、请求、滚动位置和弹层几何数据。
- `capture-final.mjs`：浏览器采集脚本。
- `detector.stdout.json`、`detector.stderr.txt`、`detector.exit-code.txt`：静态扫描输出及退出状态。
- `desktop-1440x900-default.png`、`desktop-1440x900-default-overlay.png`。
- `mobile-375x812-range-popper.png`、`mobile-375x812-range-popper-overlay.png`。
- `short-390x375-range-before-wheel.png`、`short-390x375-range-after-first-wheel.png`、`short-390x375-range-at-scroll-end.png`、`short-390x375-range-overlay.png`。
- `short-390x375-hud-shortcuts-before-wheel.png`、`short-390x375-hud-shortcuts-after-first-wheel.png`、`short-390x375-hud-shortcuts-at-scroll-end.png`、`short-390x375-hud-shortcuts-overlay.png`。
- `helper-stop.stdout.txt`、`helper-stop.stderr.txt`、`helper-stop.exit-code.txt`：临时服务停止后的幂等核验记录。
