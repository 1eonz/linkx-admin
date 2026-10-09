# Assessment B 证据索引：修复前冻结基线

> 本目录记录修复前冻结的 Assessment B。它不是修复后的复验，也不单独构成正式 Critique 通过结论。实现更新后仍需重新执行最终 Assessment A/B。

## 目标与方法

- 文档页：`http://127.0.0.1:4185/components/lxtransferpanel`。
- 浏览器：headless Chrome 154，通过 CDP 采集；当时未安装 Playwright/Puppeteer。
- Impeccable detector 注入成功。浏览器证据记录在 `browser/browser-evidence.json` 和 `browser/mobile-overflow-evidence.json`。
- 本次代码冻结时间：浏览器证据时间为 `2026-10-07T21:58:44.645Z` 与 `2026-10-07T22:02:28.98Z`；冻结目录日期为 `2026-10-08`。

## 冻结源码

SHA-256 哈希与本次扫描和浏览器采集使用的源码相对应：

| 目标 | 文件 | SHA-256 |
| --- | --- | --- |
| 组件 | `linkx-fe/src/components/LxTransferPanel/index.vue` | `1E726F334A02924D1BE0C2D30450DD8D8592A92310769D49E41B92F174FF0D87` |
| Demo | `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `641C38B92B957C2F0335D3939A2D09F953404DC4FE65C0CB605738298F90249B` |
| 文档 | `linkx-fe/docs/components/lxtransferpanel.md` | `4EBBAEB913DB982CB86ADCFBA34905AEDE6B6A8397E4E5700D58D68AFD54BF39` |

## 静态扫描

| 目标 | 原始 JSON | stderr | 退出码 | 结论 |
| --- | --- | --- | --- | --- |
| 组件 | `detector/component.stdout.json` | `detector/component.stderr.txt` | `detector/component.exit-code.txt` | `[]`，stderr 为空，退出码 `0` |
| Demo | `detector/demo.stdout.json` | `detector/demo.stderr.txt` | `detector/demo.exit-code.txt` | `[]`，stderr 为空，退出码 `0` |
| 文档 | `detector/docs.stdout.json` | `detector/docs.stderr.txt` | `detector/docs.exit-code.txt` | `[]`，stderr 为空，退出码 `0` |

命令行原文分别保存在 `detector/component.command.txt`、`detector/demo.command.txt` 和 `detector/docs.command.txt`。`[]` 仅表示这些源码目标在本次静态规则集中零命中，不代表运行页面无问题或 Critique 通过。

## 浏览器证据

Demo 与组件均成功挂载。浏览器 console 记录 detector 报告 17 个 anti-pattern；页面异常数组为空。桌面截图显示 16 个 overlay 标记和 1 个 detector banner。浏览器状态覆盖亮色就绪、暗色就绪、错误、空结果及移动端亮色就绪。

移动端归因以 `browser/mobile-overflow-evidence.json` 为准：注入前 viewport、root 与 body 宽度均为 390px；注入后 `documentElement.scrollWidth` 与 `innerWidth` 记录为 630px，而 root/body client width 仍为 390px；临时隐藏 overlay 后这些文档宽度读数恢复为 390px。`.lx-transfer-panel` 在三个阶段均为 342px，`clientWidth` 与 `scrollWidth` 均为 342px。

移动端 7 个 overlay 目标分别落在文档外壳、文档代码复制按钮（3 个）、属性表格（1 个）和 Demo 宿主状态按钮（2 个）；没有目标落在 `.lx-transfer-panel` 内。两个 Demo 宿主按钮遮挡命中未能从截图独立确认，应视作未确认的 detector 命中。该组数据支持“此次宽度增加来自 overlay 注入，而非组件自身横向溢出”的归因。

截图文件：

- `browser/desktop-light-ready-before-injection.png`
- `browser/desktop-light-ready-overlay.png`
- `browser/desktop-dark-ready-overlay.png`
- `browser/desktop-error-overlay.png`
- `browser/desktop-empty-overlay.png`
- `browser/mobile-light-ready-overlay.png`
- `browser/mobile-overflow-before-injection.png`
- `browser/mobile-overflow-after-injection.png`

`browser/mobile-overlay-attribution.mjs` 是 viewport 模拟状态重置后的过期探测脚本，本报告未运行该脚本；归因只采用同一 CDP 会话中已保存的 `mobile-overflow-evidence.json`。完整状态、截图和 detector 注入记录见 `browser/browser-evidence.json`。

## 临时服务清理记录

| 资源 | 操作与核验 |
| --- | --- |
| VitePress `4185` | 对 exec session `64397` 发送 Ctrl+C；会话以中断码 `1` 结束。随后未发现 `4185` 监听端口。 |
| Impeccable live server `8417` | 从专用临时目录执行 `node C:\Users\Administrator\.codex\skills\impeccable\scripts\live-server.mjs stop`；输出确认服务已停止，端口核验无监听。脚本同时报告临时 `config.json` 缺失，因此无法移除 script tag。 |
| Chrome CDP `9339` | 结束仅使用本次唯一 `chrome-profile` 的 Chrome 进程及子进程；端口核验无监听。 |
| 临时目录 | `C:\Users\Administrator\AppData\Local\Temp\impeccable-wave7-b-3795151a531d4c43872e22fac8fa66a9` 仍保留。自动安全审核拒绝递归删除；本报告不将该目录记作已清理。 |
| 端口 `4174` | 本次未对其执行停止、写入或配置操作。 |

## 结论

Assessment B 的冻结静态扫描有效且零命中；浏览器证据确认 detector 注入成功、无 JavaScript 异常，并区分了组件尺寸与 overlay 引起的文档宽度变化。该结果仅代表上述冻结哈希对应的修复前基线。修复后的组件、Demo、文档需要重新扫描并再次采集浏览器证据，才能形成最终 A/B 复验结论。
