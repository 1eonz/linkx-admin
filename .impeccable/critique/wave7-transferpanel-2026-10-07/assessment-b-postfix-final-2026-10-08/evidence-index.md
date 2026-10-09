# Wave 7 Assessment B 中间版证据索引

**报告状态：修后中间版，代码复审 P3 修复前；不代表最终版，也不构成正式 Critique 通过。** Assessment B 基于当前冻结快照独立采集。后续最终源码冻结后必须重新执行 A/B。所有路径均相对于本目录。

## 目标源码冻结

- `source-hashes-start.json`：六个源文件在 detector 扫描开始前的 SHA-256。
- `source-hashes-after-detector.json`：detector 后复核；`unchangedDuringDetector: true`。
- `source-hashes-final.json`：浏览器采集后复核；`unchangedSinceFreeze: true`。

哈希目标：

- `linkx-fe/src/components/LxTransferPanel/index.vue`
- `linkx-fe/src/components/LxTransferPanel/demo/basic.vue`
- `linkx-fe/docs/components/lxtransferpanel.md`
- `linkx-fe/src/components/LxVirtualTree/index.vue`
- `linkx-fe/src/components/LxVirtualTree/demo/basic.vue`
- `linkx-fe/docs/components/lxvirtualtree.md`

## Detector

`capture-detectors.mjs` 对每个目标分别启动 `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json <target>`。六个结果均为 `[]`、stderr 为空、退出码 0；摘要见 `detector-summary.json`。每个目标的完整四件套如下：

| Target slug | Command | stdout JSON | stderr | Exit code |
| --- | --- | --- | --- | --- |
| `lxtransferpanel-component` | `detector-lxtransferpanel-component.command.txt` | `detector-lxtransferpanel-component.stdout.json` | `detector-lxtransferpanel-component.stderr.txt` | `detector-lxtransferpanel-component.exit-code.txt` |
| `lxtransferpanel-demo` | `detector-lxtransferpanel-demo.command.txt` | `detector-lxtransferpanel-demo.stdout.json` | `detector-lxtransferpanel-demo.stderr.txt` | `detector-lxtransferpanel-demo.exit-code.txt` |
| `lxtransferpanel-doc` | `detector-lxtransferpanel-doc.command.txt` | `detector-lxtransferpanel-doc.stdout.json` | `detector-lxtransferpanel-doc.stderr.txt` | `detector-lxtransferpanel-doc.exit-code.txt` |
| `lxvirtualtree-component` | `detector-lxvirtualtree-component.command.txt` | `detector-lxvirtualtree-component.stdout.json` | `detector-lxvirtualtree-component.stderr.txt` | `detector-lxvirtualtree-component.exit-code.txt` |
| `lxvirtualtree-demo` | `detector-lxvirtualtree-demo.command.txt` | `detector-lxvirtualtree-demo.stdout.json` | `detector-lxvirtualtree-demo.stderr.txt` | `detector-lxvirtualtree-demo.exit-code.txt` |
| `lxvirtualtree-doc` | `detector-lxvirtualtree-doc.command.txt` | `detector-lxvirtualtree-doc.stdout.json` | `detector-lxvirtualtree-doc.stderr.txt` | `detector-lxvirtualtree-doc.exit-code.txt` |

## Browser

- `capture-browser-transferpanel.mjs` 是本轮 CDP capture 脚本；`browser-capture-final.command.txt`、`.stdout.json`、`.stderr.txt`、`.exit-code.txt` 保存最终 capture 命令及结果。最终 exit 0，capture error 数组为空。
- `browser-evidence.json` 是 8 个新建页签的完整机器证据：每页可变注入预检、overlay 注入、console、截图名、布局指标、状态/交互检查及浏览器清理结果。8/8 页成功加载 `http://127.0.0.1:8417/detect.js`。
- 页面：TransferPanel desktop light/dark/HUD/loading、375px empty、320px error；VirtualTree 文档页和 Demo 页。交互证据包括 `DEPT-03`、全树反选往返、359/360px 焦点恢复、键盘方向键/空格、触控区与触控操作、宿主状态恢复、HUD 与 reduced-motion。
- Console 中 detector 报告数依页面为 19、209、242、19、5、5、7、7。规则名称、目标选择器和完整原始 console 消息保存在 `browser-evidence.json`；重复命中不是缺陷计数。
- Screenshots：`desktop-light-ready.png`、`desktop-dark-ready.png`、`desktop-hud-ready.png`、`desktop-loading.png`、`desktop-light-search-DEPT-03.png`、`desktop-light-full-tree-invert.png`、`mobile-375-empty.png`、`mobile-375-empty-ready-after-recovery.png`、`mobile-375-reduced-motion.png`、`breakpoint-359-focus.png`、`breakpoint-360-focus.png`、`mobile-320-error.png`、`mobile-320-error-ready-after-recovery.png`、`virtual-tree-doc-desktop-light.png`、`virtual-tree-demo-desktop-light.png`、`virtual-tree-loading.png`、`virtual-tree-error.png`、`virtual-tree-empty.png`、`virtual-tree-demo-reduced-motion.png`、`virtual-tree-demo-hud.png`。

## 服务生命周期

- `start-review-services.mjs` 启动 VitePress 4184 和隔离临时根中的 overlay 8417；启动命令、cwd、日志和 `server-start-verification.json` 留档。overlay 启动凭据值未写入报告或索引。
- `stop-review-services.mjs` 停止 overlay 和本轮 VitePress 进程，关闭后验证本轮拥有的 4184、8417、9347、9348、9349 无监听；临时根/profile 清理结果见 `server-shutdown-verification.json`。
- 本轮未使用或停止 4174。

## 结论边界

本证据可作为当前中间源码快照的修后对照。代码复审 P3 项完成后，必须对最终冻结源码重跑 detector、独立浏览器 Assessment B，并与独立 Assessment A 综合；本目录不能替代该最终运行。
