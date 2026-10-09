# Assessment B 证据索引

本目录只包含独立 Assessment B 修前过程材料。没有读取 Assessment A、代码复审报告或其结论；没有改动产品源码。本目录不会替代修改后冻结版的正式 Assessment B。

## 目标源码与静态扫描

- 组件：`linkx-fe/src/components/LxTransferPanel/index.vue`。原始输出：`component.stdout.json`、`component.stderr.txt`；命令、真实退出码、开始/结束时间和前后哈希：`component.metadata.json`。
- Demo：`linkx-fe/src/components/LxTransferPanel/demo/basic.vue`。原始输出：`demo.stdout.json`、`demo.stderr.txt`；元数据：`demo.metadata.json`。
- 文档：`linkx-fe/docs/components/lxtransferpanel.md`。原始输出：`docs.stdout.json`、`docs.stderr.txt`；元数据：`docs.metadata.json`。
- 汇总：`detector-index.json`。
- 三个 stdout 都是 `[]`、stderr 为空、真实退出码为 0。该结果只说明源码静态规则零命中，不能证明页面没有视觉问题或 overlay 扫描通过。

## 浏览器

- 可变注入预检：`browser-mutation-preflight.json`；命令 stdout、stderr 和真实退出码：`browser-mutation-preflight.stdout.json`、`browser-mutation-preflight.stderr.txt`、`browser-mutation-preflight.metadata.json`。
- 四视图原始结果：`browser-evidence.json`；执行信息：`browser-capture.stdout.json`、`browser-capture.stderr.txt`、`browser-capture.metadata.json`。
- 截图：`screenshots/light-desktop.png`、`screenshots/docs-dark-desktop.png`、`screenshots/hud-dark-desktop.png`、`screenshots/mobile-375.png`。
- 分组归因：`overlay-findings-summary.json`；中文观察和误报/候选令牌说明：[report.md](report.md)。

## 服务生命周期

- 主控报告的 4174 暂时退出及恢复信息：[incident-4174.md](incident-4174.md)。没有捕获失败响应原文；重启后的正式页面请求均为 HTTP 200。
- live-server 早期探针：`live-server-start.metadata.json`、`live-server-start.stderr.txt`。它实际从仓库根启动，随后已停止，退出码记录在 `live-server-root-stop.metadata.json` 与 `live-server-root-stop.stderr.txt`。准备性 stop 还保留于 `live-server-preflight-stop.metadata.json`。
- 正式 live-server：`live-server-official-start.metadata.json`、`live-server-official-start.stderr.txt`、`live-server-official-detect-endpoint.json`；停止证据：`live-server-official-stop.metadata.json`、`live-server-official-stop.stderr.txt`。启动与停止真实退出码均为 0，停止时未触碰用户的 4174 服务。
- 端口确认：`service-stop-verification.json` 记录 4177 与临时 live-server 8400 均无监听，4174 仍由既有 Node 进程提供服务。
- 临时浏览器运行时安装：`browser-runtime-install.metadata.json`、`browser-runtime-install.stdout.txt`、`browser-runtime-install.stderr.txt`。
- 当前目标哈希：`current-source-hashes.json`。它证明暂停时与 detector 基线相同，不证明此后修改版本仍相同。
