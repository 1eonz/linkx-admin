# 原始结果清单

以下 detector 命令均在本次代码更新前执行；最终报告必须在最终 DOM 上重新扫描并替换结论。

| 目标 | 命令 | 原始 JSON stdout | stderr | 退出码 |
|---|---|---|---|---|
| `linkx-fe/src/components/LxIcon/index.vue` | [command](./lxicon-index.command.txt) | [stdout](./lxicon-index.stdout.json) | [stderr](./lxicon-index.stderr.txt)（空） | [exit](./lxicon-index.exit-code.txt) (`0`) |
| `linkx-fe/src/components/LxSidebar/LxSidebarFooter.vue` | [command](./sidebar-footer.command.txt) | [stdout](./sidebar-footer.stdout.json) | [stderr](./sidebar-footer.stderr.txt)（空） | [exit](./sidebar-footer.exit-code.txt) (`0`) |
| `linkx-fe/src/components/LxSidebar/LxSidebarGroup.vue` | [command](./sidebar-group.command.txt) | [stdout](./sidebar-group.stdout.json) | [stderr](./sidebar-group.stderr.txt)（空） | [exit](./sidebar-group.exit-code.txt) (`0`) |
| `linkx-fe/src/components/LxSidebar/LxSidebarItem.vue` | [command](./sidebar-item.command.txt) | [stdout](./sidebar-item.stdout.json) | [stderr](./sidebar-item.stderr.txt)（空） | [exit](./sidebar-item.exit-code.txt) (`0`) |
| `linkx-fe/src/components/LxUpload/index.vue` | [command](./lxupload-index.command.txt) | [stdout](./lxupload-index.stdout.json) | [stderr](./lxupload-index.stderr.txt)（空） | [exit](./lxupload-index.exit-code.txt) (`0`) |
| `linkx-fe/docs/components/lxicons.md` | [command](./docs-lxicons.command.txt) | [stdout](./docs-lxicons.stdout.json) | [stderr](./docs-lxicons.stderr.txt)（空） | [exit](./docs-lxicons.exit-code.txt) (`0`) |

浏览器原始记录：

- [浏览器命令](./browser-capture.command.txt)、[stdout JSON](./browser-capture.stdout.json)、[stderr](./browser-capture.stderr.txt)、[退出码](./browser-capture.exit-code.txt)
- [结构更新期间 hover 超时尝试的 stderr](./browser-capture-attempt-2.stderr.txt)、[退出码](./browser-capture-attempt-2.exit-code.txt)
- [完整浏览器证据 JSON](./browser-evidence.json)、[可复跑采集器](./browser-evidence.mjs)
- 截图在 [screenshots](./screenshots/)，文件按名称区分 before/after overlay、视口、主题和交互状态。
- 临时 detector server 启动信息已遮盖 token；服务使用端口 8493。不要停止用户服务 4174。
