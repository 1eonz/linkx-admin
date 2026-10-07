# Assessment B 证据索引

所有路径均相对本目录：`.impeccable/critique/wave4-dynamicform-2026-10-07/final-assessment-b-current/`。

## Detector 原始证据

| 目标          | 命令                        | stdout JSON                 | stderr                     | 退出码                        |
| ------------- | --------------------------- | --------------------------- | -------------------------- | ----------------------------- |
| LxDatePicker  | `lxdatepicker.command.txt`  | `lxdatepicker.stdout.json`  | `lxdatepicker.stderr.txt`  | `lxdatepicker.exit-code.txt`  |
| LxDynamicForm | `lxdynamicform.command.txt` | `lxdynamicform.stdout.json` | `lxdynamicform.stderr.txt` | `lxdynamicform.exit-code.txt` |
| LxUpload      | `lxupload.command.txt`      | `lxupload.stdout.json`      | `lxupload.stderr.txt`      | `lxupload.exit-code.txt`      |

聚合结果：`detector-summary.json`。执行脚本：`run-detectors.mjs`。

## 浏览器场景证据

每个场景均有 `<场景名>.overlay-scan.json`（结构化 findings、overlay 与目标元素关系）、`<场景名>.evidence.json`（状态、注入、截图和浏览器事件）及 `<场景名>.console-network.json`（console、请求和响应）。对应截图在 `screenshots/<场景名>.png`。

| 场景名                                            | 视图                                                 |
| ------------------------------------------------- | ---------------------------------------------------- |
| `datepicker-desktop-light-open`                   | DatePicker 桌面浅色，日历展开                        |
| `datepicker-desktop-hud-open`                     | DatePicker 桌面 HUD，日历展开                        |
| `datepicker-mobile-375-light-open`                | DatePicker 375px 浅色，日历展开                      |
| `datepicker-desktop-light-keyboard-open`          | DatePicker 桌面浅色，键盘 ArrowDown 打开日历         |
| `dynamicform-desktop-light-validation-error`      | DynamicForm 桌面浅色，校验错误                       |
| `dynamicform-desktop-hud-field-preview`           | DynamicForm 桌面 HUD，字段类型预览                   |
| `dynamicform-mobile-375-hud-error-reduced-motion` | DynamicForm 375px HUD、校验错误、减少动效            |
| `upload-desktop-light-failure`                    | Upload 桌面浅色，Mock 上传失败                       |
| `upload-desktop-hud-progress`                     | Upload 桌面 HUD，上传进度；另含进度状态复扫 findings |
| `upload-mobile-375-light-failure`                 | Upload 375px 浅色，Mock 上传失败                     |

浏览器执行脚本与聚合结果：`capture-browser.mjs`、`browser-capture-summary.json`、`playwright-runtime.json`。

## 服务与源码完整性

- `overlay-server-start.command.txt`、`overlay-server-start.stdout.txt`、`overlay-server-start.stderr.txt`、`overlay-server-start.exit-code.txt`、`overlay-server-start.json`
- `overlay-server-stop.command.txt`、`overlay-server-stop.stdout.txt`、`overlay-server-stop.stderr.txt`、`overlay-server-stop.exit-code.txt`、`overlay-server-stop.json`
- `source-hashes-start.json`、`source-hashes-after-detector.json`、`source-hashes-before-browser.json`、`source-hashes-after-browser.json`

## 历史截图

前一轮采证残留的三张未完成截图不属于最终聚合证据，本次正式证据清单不包含它们；原工作区副本保留作过程记录。
