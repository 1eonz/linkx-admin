# Assessment B 证据索引

证据目录：`F:/work/linkx-admin/.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-final-frozen-2026-10-07/`

| 证据 | 文件 | 用途 |
| --- | --- | --- |
| 本报告 | `report-zh.md` | Detector 与浏览器发现、目标归因、限制和结束状态 |
| 浏览器完整记录 | `browser-evidence/browser-evidence-final-recheck.json` | 7 个独立上下文的导航、注入预检、DOM 观测、Detector 控制台与目标节点、页面错误/请求和截图路径 |
| 最终干净截图 | `screenshots/final-recheck/` | 七场景页面截图，文件名对应 `desktop-light-default`、`desktop-hud`、`desktop-empty`、`desktop-loading`、`desktop-error`、`mobile-375-keyboard-focus`、`desktop-reduced-motion` |
| 最终覆盖层截图 | `screenshots/final-recheck/*-overlay.png` | 同七场景的注入覆盖层截图，保留真实元素归属标记 |
| 关键视图 | `screenshots/final-recheck/desktop-empty.png`、`desktop-hud-overlay.png`、`desktop-loading.png`、`mobile-375-keyboard-focus.png`、`mobile-375-keyboard-focus-overlay.png` | 空态布局、HUD 检测目标、加载反馈、窄屏标题/焦点与外壳归属复核 |
| Detector 汇总 | `detector/summary.json` | 三个静态目标的命令、退出码、stderr/stdout 长度、JSON 解析状态和命中数 |
| Detector 原始记录 | `detector/*.{command.txt,stdout.json,stderr.txt,exit-code.txt}` | 分目标保存的精确命令、JSON 输出、stderr 和退出码；每项 stdout 为 `[]`、stderr 为空、退出码为 0 |
| 浏览器采集脚本 | `capture-browser.mjs` | 七种状态/视口、独立上下文、注入预检和证据采集的可复现配置 |
| Detector 执行脚本 | `run-detector.mjs` | 三个冻结源码目标的扫描配置和输出归档逻辑 |
| 开始指纹 | `fingerprints-start.json` | 浏览器/Detector 采集前确认 8 个目标文件与冻结 SHA-256 一致 |
| 结束指纹 | `fingerprints-end.json` | 采集后再次核验 8 个文件；`allMatch: true`，每项 `match: true` |
| Detector 服务启动记录 | `overlay-server-start.json` | 8491 服务的启动命令、端口、健康检查和专用临时工作目录 |
| Detector 服务停止记录 | `overlay-server-stop.json` | `stop --keep-inject` 命令、退出码、停止时间及停止后的健康检查失败（连接不可用） |
| 停止脚本 | `stop-overlay-server.mjs` | 使用启动记录中的临时工作目录停止专用服务，并保存停止结果 |

## 目标源码定位

- `linkx-fe/src/components/LxTransferPanel/index.vue`：标题与批量操作模板约 342–377 行；标题、操作区样式约 624–656 行；窄屏断点约 990 行起。
- `linkx-fe/src/components/LxTransferPanel/demo/basic.vue`：HUD Demo 包装约 185 行；浅色/深色文字令牌使用处约 390、420–422 行。
- `linkx-fe/src/tokens/variables.css`：默认卡片悬停背景与次级文字令牌约 91、105 行。
- `linkx-fe/src/tokens/theme-hud.css`：HUD 次级文字和主题意图约 1–23 行。
- `linkx-fe/docs/components/lxtransferpanel.md`：路由正文、代码块与 API 表格；运行时文档命中目标由浏览器 JSON 保留。

## 端口复核

- `overlay-server-stop.json` 记录 8491 服务退出码 0，停止后 `/health` 请求不可达。
- 停止后复验 `http://127.0.0.1:4174/components/lxtransferpanel` 返回 HTTP 200。
- `Get-NetTCPConnection -LocalPort 8491 -State Listen` 没有返回监听项；未停止 4174。

早期未完成尝试留在 `screenshots/` 根目录，仅供追溯；最终报告只引用 `screenshots/final-recheck/` 中的完整七场景记录。
