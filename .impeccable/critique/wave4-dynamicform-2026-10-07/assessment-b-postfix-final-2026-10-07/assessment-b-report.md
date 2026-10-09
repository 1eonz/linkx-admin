# Assessment B 执行证据

本报告记录 Assessment B 的静态扫描、浏览器采集与归因证据；命中数是 detector 分组数，不等同于缺陷数。

## 静态扫描

六个目标的 JSON stdout 均为 `[]`，stderr 均为空，进程退出码均为 `0`。`[]` 仅表示对应源码或文档静态扫描没有规则命中，不代表浏览器运行时没有命中。

| 目标 | 结果 | 记录 |
| --- | --- | --- |
| LxDynamicForm 源码 | `[]`, stderr 空, exit 0 | [JSON](detector/LxDynamicForm-source.stdout.json) · [命令](detector/LxDynamicForm-source.command.txt) · [stderr](detector/LxDynamicForm-source.stderr.txt) · [exit](detector/LxDynamicForm-source.exit-code.txt) |
| LxDynamicForm 文档 | `[]`, stderr 空, exit 0 | [JSON](detector/lxdynamicform-doc.stdout.json) · [命令](detector/lxdynamicform-doc.command.txt) · [stderr](detector/lxdynamicform-doc.stderr.txt) · [exit](detector/lxdynamicform-doc.exit-code.txt) |
| LxDatePicker 源码 | `[]`, stderr 空, exit 0 | [JSON](detector/LxDatePicker-source.stdout.json) · [命令](detector/LxDatePicker-source.command.txt) · [stderr](detector/LxDatePicker-source.stderr.txt) · [exit](detector/LxDatePicker-source.exit-code.txt) |
| LxDatePicker 文档 | `[]`, stderr 空, exit 0 | [JSON](detector/lxdatepicker-doc.stdout.json) · [命令](detector/lxdatepicker-doc.command.txt) · [stderr](detector/lxdatepicker-doc.stderr.txt) · [exit](detector/lxdatepicker-doc.exit-code.txt) |
| LxUpload 源码 | `[]`, stderr 空, exit 0 | [JSON](detector/LxUpload-source.stdout.json) · [命令](detector/LxUpload-source.command.txt) · [stderr](detector/LxUpload-source.stderr.txt) · [exit](detector/LxUpload-source.exit-code.txt) |
| LxUpload 文档 | `[]`, stderr 空, exit 0 | [JSON](detector/lxupload-doc.stdout.json) · [命令](detector/lxupload-doc.command.txt) · [stderr](detector/lxupload-doc.stderr.txt) · [exit](detector/lxupload-doc.exit-code.txt) |

## 浏览器采集

三个文档页分别使用独立浏览器 context；九个视图均完成 detector 注入与 overlay 生成。表中“可见 / 隐藏”来自 overlay 的 computed style 与布局尺寸检查。

| 页面 | 视图 | detector 组 | overlay 可见 / 隐藏（总数） | console warning/error；pageerror | 截图 |
| --- | --- | ---: | ---: | ---: | --- |
| DynamicForm | 桌面浅色 | 20 | 15 / 5（20） | 0；0 | [PNG](browser-evidence/screenshots/lxdynamicform-desktop-light.png) |
| DynamicForm | 桌面 HUD | 48 | 40 / 8（48） | 0；0 | [PNG](browser-evidence/screenshots/lxdynamicform-desktop-hud.png) |
| DynamicForm | 375px 浅色 | 341 | 8 / 333（341） | 0；0 | [PNG](browser-evidence/screenshots/lxdynamicform-mobile-375-light.png) |
| DatePicker | 桌面浅色 | 19 | 9 / 10（19） | 0；0 | [PNG](browser-evidence/screenshots/lxdatepicker-desktop-light.png) |
| DatePicker | 桌面 HUD | 47 | 38 / 9（47） | 0；0 | [PNG](browser-evidence/screenshots/lxdatepicker-desktop-hud.png) |
| DatePicker | 375px 浅色 | 13 | 3 / 10（13） | 0；0 | [PNG](browser-evidence/screenshots/lxdatepicker-mobile-375-light.png) |
| Upload | 桌面浅色 | 8 | 7 / 1（8） | 0；0 | [PNG](browser-evidence/screenshots/lxupload-desktop-light.png) |
| Upload | 桌面 HUD | 17 | 15 / 2（17） | 0；0 | [PNG](browser-evidence/screenshots/lxupload-desktop-hud.png) |
| Upload | 375px 浅色 | 151 | 3 / 148（151） | 0；0 | [PNG](browser-evidence/screenshots/lxupload-mobile-375-light.png) |

浏览器明细、原始 console 记录及可见 / 隐藏节点样式样本见 [browser-evidence.json](browser-evidence/browser-evidence.json)。命中归因汇总包含 VitePress 文档外壳 556 组、页面级 / 文档外壳 9 组、组件 Demo / 目标区域 61 组；文档外壳命中属于目标组件源码之外的扫描对象。

另有 38 组最初标记为待人工核对：DynamicForm 页 12 组、DatePicker 页 26 组。只读 DOM 核验将它们全部归因为目标组件所用的 Element Plus 控件或 Teleport 弹层，详情见 [manual-attribution.json](browser-evidence/manual-attribution.json)。各归因桶的命中数都不能直接视作组件缺陷数。

## 哈希与服务状态

采集前后 30 个目标及依赖文件的 SHA-256 保持一致，清单见 [source-hashes.json](browser-evidence/source-hashes.json)。联动依赖 `linkx-fe/src/components/LxForm/LxFormItem.vue` 的哈希为 `04720d69bff3037ca06b6718abeddc8bac588c9153e59b965a44baf985d54d0d`。

三篇文档页当前均返回 HTTP 200。停止 Impeccable live server 的记录为 [命令](browser-evidence/live-server-stop.command.txt) · [stdout](browser-evidence/live-server-stop.stdout.txt) · [stderr](browser-evidence/live-server-stop.stderr.txt) · [exit](browser-evidence/live-server-stop.exit-code.txt)：端口 8400 已停止监听，4174 文档服务保持运行。stop 日志中的 `config_missing` 只表示无法清理 live script tag；停止命令退出码为 0。
