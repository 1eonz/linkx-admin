# Wave 7 TransferPanel：Assessment B

**结论：不能正式通过。** 本报告是独立的 detector 与浏览器证据记录；未读取或依赖 Assessment A。静态扫描成功，但浏览器取证时目标服务 `4174` 已无监听，无法确认页面上的尺寸、主题、键盘焦点或 overlay。

## Detector

原命令见 [detector.command.txt](detector.command.txt)。扫描目标为 `LxTransferPanel`、`LxVirtualTree` 两个 Vue 源文件，以及对应的两篇组件文档。

- JSON stdout：[detector.stdout.json](detector.stdout.json)，内容为 `[]`。
- stderr：[detector.stderr.txt](detector.stderr.txt)，无输出。
- 退出码：[detector.exit-code.txt](detector.exit-code.txt)，`0`。

该 `[]` 仅表示这些静态目标没有命中 detector 规则；退出码 0 证明扫描完整成功，不代表运行页面通过视觉或交互检查。

## 浏览器与 Overlay

浏览器命令及输出分别见 [browser-capture.command.txt](browser-capture.command.txt)、[browser-capture.stdout.json](browser-capture.stdout.json)、[browser-capture.stderr.txt](browser-capture.stderr.txt) 和 [browser-capture.exit-code.txt](browser-capture.exit-code.txt)。采集器使用 Chrome `154.0.8037.95` 创建了新标签，并尝试了两个页面、桌面和 `320/375/420/421px`、亮暗主题，共 20 个组合。采集器进程退出码为 0，但这只表示脚本完成。

开始检查时，`http://127.0.0.1:4174/components/lxtransferpanel` 返回 HTTP 200。浏览器批次期间目标页显示 `ERR_CONNECTION_REFUSED`；端口检查没有发现 `4174` 监听进程，而 `8400` overlay helper 正常监听。浏览器 JSON 的 20 个组合均为 `rootFound=false`、`treeFound=false`，没有目标 DOM；截图是 Chrome 连接错误页，不是组件截图，例如 [TransferPanel 桌面亮色](screenshots/transfer-desktop-light.png) 和 [VirtualTree 375px 深色](screenshots/virtualtree-375-dark.png)。

由于目标页不可达，以下项目均未获得有效浏览器证据：

- 复选框视觉框 `14×14px`。
- 窄屏复选框触控区域 `44×44px`。
- TransferPanel 在 `320–420px` 的树行高 `64px`，以及 `421px` 的断点表现。
- 两个主题下的组件外观、键盘焦点可见性和方向键移动。

Overlay 注入在 20 个组合中均失败：`scriptStatus=script-load-error`、`readyStatus=ready-event-timeout`、`installed=false`，可见 overlay 数为 0，未捕获到 Impeccable console 消息。没有可靠的用户可见 overlay，不能把它记为零命中或通过。

完整逐场景记录在 [browser-evidence.json](browser-evidence.json)，浏览器截图在 [screenshots/](screenshots/)；这些截图只证明目标页面连接失败。正式复验需在最终源码与稳定的 4174 预览服务可访问后重新执行。

## 服务与范围

本次只读取源码并在本目录生成取证脚本、报告和证据；没有修改产品源码、测试或正式计划。Impeccable helper 使用 8400 端口，启动与停止命令记录在 [overlay-server.command.txt](overlay-server.command.txt)；健康检查 HTTP 200。取证结束后确认端口所有者仍为本任务启动的 PID，再用 `stop --keep-inject` 停止该 helper，退出码为 0（[停止记录](overlay-server.stop.exit-code.txt)）。未停止、重启或改动用户预览服务 `4174`。

Questions skipped: 本任务仅要求独立 Assessment B 证据及通过状态，不要求制定改进优先级。
