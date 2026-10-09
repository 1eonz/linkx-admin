# Evidence Index

本目录保存 `LxTransferPanel` Assessment B 的 attempt-2 复测证据。组件源 SHA-256：`707ea027e7c450226c68f07cec01df5730e7cb3b52270859c7389ec5a773cedc`。

## 报告

- `assessment-b-report.zh-CN.md`：六视图 detector/overlay/console 归因、交互观测、重叠复核和清理结果。

## 静态 detector

每个目标均有独立 stdout JSON、stderr 和退出码文件：

- `static/component.stdout.json`、`static/component.stderr.log`、`static/component.exit-code.txt` 对应 `linkx-fe/src/components/LxTransferPanel/index.vue`。
- `static/demo.stdout.json`、`static/demo.stderr.log`、`static/demo.exit-code.txt` 对应 `linkx-fe/src/components/LxTransferPanel/demo/basic.vue`。
- `static/docs.stdout.json`、`static/docs.stderr.log`、`static/docs.exit-code.txt` 对应 `linkx-fe/docs/components/lxtransferpanel.md`。

三个 stdout 均为合法 JSON `[]`，stderr 长度为 0，退出码均为 `0`。

## 浏览器证据

- `browser-evidence.json`：Chrome 版本、六个全新 context、注入结果、视口指标、交互数据、请求/异常、截图相对路径和 runner 清理记录。
- `browser-console.json`：按场景保存的完整 CDP 控制台事件。
- `runner.stdout.log`、`runner.stderr.log`、`runner.exit-code.txt`：attempt-2 runner 的标准输出、标准错误和退出码；输出为空，错误为空，退出码为 `0`。
- `browser-command.txt`：执行参数、端口和截图顺序说明。
- `detector-server-start.*`、`detector-server-stop.*`、`detector-asset-http.json`、`chrome-stderr.log`：隔离 detector server 启停、注入脚本 HTTP 检查与浏览器 stderr。
- `screenshots/*-before-overlay.png` 与同名 `*-overlay.png`：六组基线/注入后图像。基线先于 overlay 注入。

## 单视图几何复核

- 上级目录 `../overlap-diagnostic/browser-evidence.json` 保存展开名称时 `.selected-name-full` 与 `.node-code` 的 rect 和交叠计算。
- `../overlap-diagnostic/screenshots/desktop-light-scope-and-keyboard-selected-name-expanded.png` 为展开后的浏览器截图；复核结果是 0% 可见重叠。
- 上级 `overlap-diagnostic.stdout.log`、`overlap-diagnostic.stderr.log`、`overlap-diagnostic.exit-code.txt` 记录诊断 runner 执行结果；退出码为 `0`。

## 服务状态

清理后仅用户预览端口 `4174` 仍在监听。隔离预览 `4199`、detector `8401`、Chrome DevTools `9333` 均已释放。
