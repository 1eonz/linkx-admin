# Wave 6 Assessment B Evidence Index

最终有效采集时间：2026-10-07T09:33:04Z。最终源码以 fingerprints.json 为准，LxVirtualTree/index.vue 的 SHA-256 为 E36B50875832C374FF98C0366493F6FC26AD1CBF6ABDFD056E863B155C2386B4。

| 证据 | 路径 |
| --- | --- |
| Assessment B 报告 | assessment-b.md |
| 7 项 detector 汇总 | cli-final/summary.json |
| 7 项 detector 原始记录 | cli-final/<target>/{command.txt,stdout.json,stderr.txt,exit-code.txt} |
| 当前目标指纹 | fingerprints.json |
| 浏览器原始页、主题、溢出、交互指标 | browser/browser-evidence.json |
| 浏览器 console | browser/browser-console.json |
| 浏览器请求及失败请求 | browser/browser-requests.json |
| overlay 命中序列化结果 | browser/overlay-results.json |
| 四页截图 | browser/screenshots/ |
| 最终 live server 生命周期 | browser/keyboard-rerun/live-server.start.*、live-server.stop.* |
| 最终临时 VitePress 生命周期 | browser/keyboard-rerun/docs-server.*、stop.verification.json、docs-server.stop-child.verification.json |
| 中间 4175 连接拒绝尝试 | 仅在本轮日志中观察到，随后由 browser/virtualtree-rerun/ 的有效采集覆盖；不计入有效证据 |

最终有效浏览器页：

- /components/lxcascader：HUD 级联弹层、失败态、375px。
- /components/lxdescriptions：双列/边框、全局 HUD、空结果、复制焦点、375px。
- /components/lxvirtualtree：展开、scoped HUD、treeitem 键盘 focus/ArrowDown/ArrowRight/Space、失败态、375px。
- /components/lxupload：全局 HUD、紧凑列表、本地 CSV Mock 成功、375px。

7 项静态 detector 均为 JSON []、stderr 空、exit 0。浏览器四页均注入成功且无 failed request；console 中的文档壳层命中与 VirtualTree text-occlusion 误报判读见 assessment-b.md。
