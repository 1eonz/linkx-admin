# Assessment B：LxIcon 浏览器与 Detector 交接

## 结论

Assessment B 的独立浏览器检查与 detector 扫描均已完成。两个 detector 的 JSON stdout 均为 `[]`，stderr 均为 0 bytes，进程退出码均为 0。浏览器覆盖 5 个页面视图和 2 个复制状态；页面交互与减少动效行为可观察。Overlay 在窄屏注入后会制造横向溢出，因此该溢出不能归因于目标页面。

## Detector

| 目标 | stdout JSON | stderr | 退出码 | 原始记录 |
|---|---|---:|---:|---|
| LxIcon 源码 | `[]` | 0 bytes | 0 | `source-detector.stdout.json`、`source-detector.stderr.txt`、`source-detector.exit-code.txt` |
| LxIcon 文档 | `[]` | 0 bytes | 0 | `docs-detector.stdout.json`、`docs-detector.stderr.txt`、`docs-detector.exit-code.txt` |

`[]` 仅表示这两个静态源码目标没有命中 detector 规则，不代表运行页面没有问题，也不单独构成 Critique 通过结论。

## 浏览器结果

| 页面视图 | 可观察结果 | Overlay 命中 |
|---|---|---:|
| 桌面亮色（1425px） | 正常渲染，无页面横向溢出 | 19 |
| 桌面暗色（1425px） | 正常渲染，无页面横向溢出 | 21 |
| 桌面 HUD（1425px） | 正常渲染，无页面横向溢出 | 20 |
| 320px 空结果与焦点 | 空态为“无匹配图标”，搜索框获得焦点；Tab 第 64 次到达搜索框 | 3 |
| 375px 减少动效 | `prefers-reduced-motion` 生效；计算样式为 `animation: none`、`transition: 0s`、`transform: none` | 38 |
| 复制成功 | 状态显示“已复制”，剪贴板内容为 `<LxIcon name="delete" :size="20" />` | 19 |
| 复制失败 | 显示手动复制提示，备用文本框获焦并选中文本 | 19 |

窄屏布局诊断在 overlay 注入前确认页面根宽分别等于视口宽 320px、375px；`.icon-catalog` 分别为 272px、327px，没有页面自身横向溢出。别名表内容宽 520px，由 `overflow: auto` 的 `.icon-alias-table-region` 内部滚动承接。注入后 `documentScrollWidth` 增至 560px、615px，且 overlay 的溢出标记为真，属于检测面板自身造成的视口溢出伪影。

## Overlay 归因

各状态命中数是规则提示数量，不是缺陷数量。截图和浏览器记录支持以下归因：

- `text-occlusion` 共 104 条：把 `.icon-tile` 内正常显示的图标名或用途文字误判为被父级 `button.icon-tile` 遮挡，属于明确误报。
- 文档行长、Inter 字体占比和 `body` 的高度/内边距过渡命中涉及 VitePress 文档内容或外壳样式；不能直接算作 LxIcon 组件缺陷。
- 窄屏 `span.container` 裁切与上文所述 overlay 注入后页面宽度增加相关；目标页面在注入前没有根级溢出。
- `button.copy`、暗色配色、hover 卡片细边框/阴影等命中应作为人工复核建议；仅凭规则提示和计数不能认定为缺陷。

## 环境与证据

目标页 `http://127.0.0.1:4174/components/lxicons.html` 检查前后均返回 HTTP 200。Overlay 服务端口 8467 已通过 `node live-server.mjs stop --keep-inject` 停止，退出码 0；停止后 listener、PID 与 server 信息均不存在。隔离 Chrome 已关闭，临时 profile 已删除。浏览器网络记录未发现外部网络 origin；控制台记录中的单个 404 是本地 `/favicon.ico` 请求。

原始证据、采集脚本与 10 张截图均保存在本目录：`browser-evidence.json`、`browser-layout-diagnostic.json`、`browser-console.ndjson`、`browser-network.ndjson`、`overlay-server-lifecycle.json`、`browser-assessment.mjs`、`browser-layout-diagnostic.mjs` 及各 `*.png` 文件。脚本采集退出码记录为 0；本报告仅总结已保存的 Assessment B 证据，没有执行 Assessment A，也未将静态扫描或 detector 数量表述为正式 Critique 通过。
