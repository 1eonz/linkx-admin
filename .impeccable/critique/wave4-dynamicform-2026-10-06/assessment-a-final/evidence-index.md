# Assessment A 浏览器证据索引

## 采集方法

- 目标：`linkx-fe/src/components/LxDynamicForm/index.vue`，页面 `http://127.0.0.1:4181/components/lxdynamicform.html`。
- 评估类型：独立 Assessment A；使用全新 Edge `154.0.4258.53` 进程和 Playwright context，未读取 Assessment B、detector 或代码复审产物。
- 视口：桌面 `1440×1000` 和移动 `375×812`；两者均启用减少动效偏好。
- 采集时间：2026-10-06 14:40:45–14:41:17（UTC+08:00）。
- 结果：33 个场景记录；6 个移动场景另有真实 viewport 截图。两端无水平溢出、浏览器错误或外部请求。
- 当前冻结：8 个目标文件采集前后哈希一致；主组件 targetFingerprint 为 `CA9FDFB4B85D85E6EC0B20D12A899B2556BC6EBE8A08E297BA66D35A705B17CF`。

## 文件

- [report.md](./report.md)：修后当前版独立设计评分、问题和 persona 观察。
- [browser-evidence.json](./browser-evidence.json)：机器可读的状态、测量、哈希、浏览器错误和截图路径。
- [capture-final-a.mjs](./capture-final-a.mjs)：采集脚本；只读目标源，写入本证据目录。
- `desktop-1440-light-default-page.png` / `desktop-1440-light-default-demo.png`：桌面首屏和主 Demo。
- `desktop-validation-error-light-demo.png` / `desktop-validation-success-light-demo.png`：错误关联、首错焦点和成功确认。
- `desktop-upload-progress-light-demo.png` / `desktop-upload-success-light-demo.png`：上传排队与成功。
- `desktop-schema-*.png`：14 种字段 schema 的可见预览。
- `desktop-main-failure-light-demo.png`、`desktop-preview-failure-light-demo.png`、`desktop-preview-failure-hud-demo.png`：主字段与类型预览的独立错误状态。
- `desktop-preview-retry-loading-hud-demo.png`、`desktop-preview-recovered-main-still-failed-hud-demo.png`、`desktop-both-recovered-hud-demo.png`：重试 loading、预览恢复但主表单仍失败、两者分别恢复。
- `mobile-375-*-page.png` / `mobile-375-*-demo.png`：移动端浅色/HUD、日期范围、远程失败/恢复的全页和 Demo 截图。
- `mobile-375-*-viewport.png`：浅色/HUD、日期范围、远程失败、重试 loading 和恢复的实际 viewport 截图。
- [server-stop.txt](./server-stop.txt)：本地文档服务的停止方式和端口核验。

## 冻结文件 SHA-256

| 文件 | SHA-256 |
|---|---|
| `linkx-fe/src/components/LxDynamicForm/index.vue` | `CA9FDFB4B85D85E6EC0B20D12A899B2556BC6EBE8A08E297BA66D35A705B17CF` |
| `linkx-fe/src/components/LxDynamicForm/demo/basic.vue` | `79F231AB0DE0644FC34764681EC655F24FCD2907D6D4E0CE8502F1E53D09A84E` |
| `linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldUpload.vue` | `5BA371CADF7FF889FA8F5528B964E3C50D1F4DDE538D62447298EDCE1D25A988` |
| `linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldPassword.vue` | `DF38FCF06BB467653BE5D620EEC7CB95580FBD40F21783020C6E4DE9EE169397` |
| `linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldRemoteSelect.vue` | `123F21E98606E68B2DFA73142485B4F897B2A4A285E5DFE7B3EF367653542541` |
| `linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldDateRange.vue` | `1E370E684953D005FC5AF43B086EB44BF495CC1BA372AEE24EFEAB25A28CAC3B` |
| `linkx-fe/src/components/LxUpload/index.vue` | `D9FFB2F4E11C6A665BC6362E7C3ACC706B3CDF8FE6A829D104DDA9DE2AA9EE17` |
| `linkx-fe/docs/components/lxdynamicform.md` | `E4616E97D6F9742F427A7727079076307E66C1D4DA3B78865576AF0A9B101939` |

## 命令与边界

- 语法检查：本机 Node `--check capture-final-a.mjs` 通过。
- `pnpm exec node --check` 在仓库安装状态检查阶段尝试 `pnpm install`，因 ignored build scripts 策略退出；没有改动依赖或锁文件。随后用现有 Node 可执行文件直接完成语法检查和浏览器采集。
- 本轮未运行 detector、overlay、Assessment B 或代码复审，保持 A/B 隔离。
- 浏览器请求 fence 仅允许 `127.0.0.1:4181`、`data:` 和 `blob:`；blocked external requests 计数为 0。
