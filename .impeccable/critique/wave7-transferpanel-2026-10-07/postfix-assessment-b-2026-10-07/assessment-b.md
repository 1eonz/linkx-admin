# Wave 7 LxTransferPanel 修后 Assessment B

Method: 独立 detector + 浏览器证据评审；本评审未读取 Assessment A 或代码复审材料。

## 范围与完整性

目标源码为组件、basic demo 和组件文档，浏览器目标为 `http://127.0.0.1:4174/components/lxtransferpanel`。`.impeccable/critique/ignore.md` 不存在，本次没有忽略规则。4174 页面返回 HTTP 200；每个最终浏览器场景均创建独立 Playwright context/page，修改了 `document.title`、附加并执行内联 script，然后加载 `http://localhost:8400/detect.js`。最终 6 个场景的 detector ready、console 扫描日志及可见 overlay 均有记录。

目标文件在本轮开始与结束时的 SHA-256 完全一致，见 [sha256-start.txt](sha256-start.txt) 与 [sha256-end.txt](sha256-end.txt)。

## 静态扫描

| 目标 | 结果 | 退出码 | 原始证据 |
|---|---:|---:|---|
| `LxTransferPanel/index.vue` | `[]`，0 项 | 0 | `detector-component.{command,stdout.json,stderr.txt,exit-code.txt}` |
| `LxTransferPanel/demo/basic.vue` | `[]`，0 项 | 0 | `detector-demo-basic.{command,stdout.json,stderr.txt,exit-code.txt}` |
| `docs/components/lxtransferpanel.md` | `[]`，0 项 | 0 | `detector-docs.{command,stdout.json,stderr.txt,exit-code.txt}` |

三项 stderr 均为空。`[]` 只表示相应源码目标的静态规则零命中，不代表运行页面无问题。

## 浏览器场景

每个场景都有 `*-base.png`、`*-overlay.png` 与 JSON 状态；详细测量和 detector 控制台记录在 [browser-evidence.json](browser-evidence.json)。

| 场景 | 结果 | 观察 |
|---|---|---|
| 桌面浅色，1440×1080 | 9 overlays | Panel 与两侧导航没有相交；页面无水平溢出。检测到文档长行及隐藏 copy 控件相关规则。 |
| 桌面 HUD，1440×1080 | 44 overlays | 大量 `ai color palette` 标记落在状态点、状态标签和选择色等语义色上，判为设计令牌/状态色误报；桌面布局仍未与导航相交。 |
| 375px 筛选与键盘 | 4 overlays | 最终复采确认 CSS 视口为 375×812、`max-width:480px` 生效。过滤“交警”后可 Shift+Tab 聚焦“反选筛选结果”，可见 2px 焦点，Enter 可操作。Panel 宽 312px，留在视口内。 |
| 加载中，1365×900 | 10 overlays | 显示“组织权限数据加载中……”，宿主 surface 设置 `aria-busy="true"`，已选 5 项保留。 |
| 加载失败，1365×900 | 10 overlays | 错误说明保留当前选择并提供“重试”；已选 5 项保留。 |
| 空结果 / reduced motion，声明 375×812 | 4 overlays | 空树计数为 0，既有 5 项选择仍可见；`prefers-reduced-motion` 命中。此场景首次运行使用设备模拟，DOM CSS 宽度为 615；375 CSS px 的键盘/筛选结果以随后严格复采为准。 |

移动文档页 `documentElement.scrollWidth` 为 600px，超过 375px 视口。最大右溢出来源是文档 Props 表的 `thead/tr/td`（表格行宽 872px、右边界约 897px），归因于 VitePress 文档内容，而非 transfer panel：panel 右边界为 336px。窄屏本地导航 `.VPLocalNav` 占据 y=0–48；自动将 panel 滚到顶端时与 panel 顶部 48px 相交，截图中会遮住面板顶部内容。桌面 `.VPSidebar` 与 `.VPDocAside` 均未挡住 panel。左侧 off-canvas `.VPSidebar` 位于 x=-311–0，是移动菜单收起状态。

浏览器抽样文本对比度范围为 4.50:1–15.03:1；状态文案约 4.52:1，筛选结果说明约 5.69:1，抽样项达到 WCAG AA 普通文本阈值。批量“全部加入”处于禁用态，示例启用了最多 5 项且当前已选 5 项，原因是达到上限；按钮 `title` 只写“已全部选择或达到选择上限”，不能区分这两种原因，也没有 `aria-describedby`。筛选范围操作区在有筛选文本时用可见状态说明关联按钮；“交警”场景显示匹配数与已选数。

## 命中归因

- `.copy` 上的 `buried-raster` 命中来自文档代码示例的 copy 控件，属于 VitePress 外壳状态，不是组件图像。
- `bounce-easing` 与 `layout-transition` 命中 `body`，属于文档主题/外壳规则。
- HUD 的 `ai color palette` 标记集中在面板状态和选择颜色；这些颜色承载在线、处理中、停用及选中状态，静态页面 evidence 不支持把它们判作装饰性配色错误。
- `clipped-overflow-container` 命中通用 `span.container`，单凭规则标签无法证明它属于 transfer panel；浏览器中 panel 尺寸本身落在 375px 视口内，暂归外壳/规则误报待复核。
- 加载/错误页的 `cards flush against the scroller edge` 及长行命中数量较低，截图未显示操作内容被裁掉；规则命中保留为观察项，不按数量直接当作缺陷。

## 运行记录与边界

Playwright 首次执行遇到 Windows ESM 路径错误，随后本机 Chromium 启动报 `spawn UNKNOWN`；通过隐藏的独立 Chrome headless 进程和 CDP 重连后完成浏览器评估。首次加载/错误页面动作未展开“示例状态与主题”折叠区而超时，原始状态保存在 `browser-evidence-attempt-1.json`；展开后两场景复采均成功。所有最终页面 preflight、脚本注入和 detector overlay 均通过，没有 Puppeteer/浏览器缺失或注入失败。官方 live-server stop 已关闭 8400 服务，但清理尝试因缺少 `.impeccable/live/config.json` 返回 `config_missing`；本轮未注入 `live.js`。Chrome headless 已关闭，端口 8400/18417 均不再监听，4174 预览复核仍为 HTTP 200。对比度为页面可见文本抽样，不是完整 WCAG 审计；真实后端状态未涉及。

最终截图位于 [screenshots](screenshots)，各扫描的原始 stdout/stderr/exit code 与逐场景 browser JSON 同目录保存。
