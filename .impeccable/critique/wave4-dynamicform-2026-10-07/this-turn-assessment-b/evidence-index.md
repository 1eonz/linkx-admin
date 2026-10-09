# Assessment B 证据索引

本目录只归档 LxDynamicForm / LxUpload 的 Assessment B 证据。最终可引用的复采集位于 `attempt-2/`；根目录原始截图保留作尺寸校验记录，不应用于移动/HUD 状态结论。没有读取或引用 Assessment A。

## 最终采集：`attempt-2/`

- `browser-evidence.json`：两页状态、overlay groups、注入结果、页面快照、网络边界、console、异常与 13 张截图的 viewport/像素尺寸匹配信息。
- `capture-browser.mjs`：本次采集脚本。触屏 viewport 由 Playwright API 设置；错误状态滚动到可见区后截图。
- `browser-capture.stdout.json`、`browser-capture.stderr.txt`、`browser-capture.exit-code.txt`：采集命令输出、stderr 与退出码。退出码为 0；2 页注入成功，13 张截图，无状态错误。
- `detector/detector-summary.json`：四个目标的扫描汇总；有效 JSON、4/4 退出码 0、stderr 为空、总静态命中 0。
- `detector/01-lxdynamicform-component.*`、`02-lxupload-component.*`、`03-lxdynamicform-doc.*`、`04-lxupload-doc.*`：每个目标独立保存的 JSON、stderr、退出码及实际命令。
- `source-hashes-before-browser.json`、`source-hashes-after-browser.json`、`source-hashes-before-detector.json`、`source-hashes-after-detector.json`：20 个源文件的前后 SHA-256；采集与扫描期间均无目标源文件变化。
- `mobile-layout-audit.json`：375×812 coarse-pointer 下两页的 client/scroll 宽度与内部可滚动元素记录。
- `http-response-audit.json`：两页复核响应状态，均为 HTTP 200，未复现 4xx/5xx。
- `server/`：Assessment B 临时 overlay 服务的启动、停止命令、输出、stderr 与退出码。
- `screenshots/dynamicform-*.png`：桌面亮色、触屏、HUD 暗色、禁用、校验错误、候选空结果、候选请求错误、远程预览错误。
- `screenshots/upload-*.png`：桌面亮色、触屏、HUD 暗色、禁用、本地 Mock 上传失败。

## 初始采集与失败尝试

- 本目录根部的 `browser-evidence.json`、`screenshots/` 与 `source-hashes-*.json` 是第一次成功采集。所有 PNG 为 1440×950，但部分状态的页面 viewport 不同，因此仅保留用于记录差异，不作为对应尺寸的视觉证据。
- `attempt-1/` 保存早期浏览器启动失败的命令输出；该次没有可用截图，不计入最终采集。
- 根部的 `detector-summary.json` 与 `detector/` 是早期工作树扫描。最终结论使用 `attempt-2/detector/` 的四份重扫结果。
