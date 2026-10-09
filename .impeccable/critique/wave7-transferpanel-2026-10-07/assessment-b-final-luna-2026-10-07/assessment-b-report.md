# Wave 7 Assessment B 报告：LxTransferPanel

日期：2026-10-07  
评估：独立 Assessment B（Luna）  
目标：`linkx-fe/src/components/LxTransferPanel` 及其文档页 `http://127.0.0.1:4174/components/lxtransferpanel`

## 结论

Assessment B 有效完成，属于非降级评估。冻结的 6 个目标文件逐个匹配，聚合 SHA-256 为 `B09D9EED0568C60EF0527B95B36187B28F91DF449D59E2B49CB22B601C14B3C5`。本次没有发现可归因于 LxTransferPanel 的 P1/P2 组件问题。Detector 的 `[]` 仅表示静态规则没有命中；结论同时依据隔离浏览器中的实际视图、交互、状态和 overlay 归因。

本报告只给出 Assessment B 的结果，不替代 Assessment A、整站组合评审或真实后端联调结论。评估没有修改产品源码。

## 检查结果

- **冻结源文件**：6 个路径及 SHA-256 均匹配；聚合值与预期一致。详见 [source-fingerprint-check.json](source-fingerprint-check.json)。
- **静态 detector**：目标 `linkx-fe/src/components/LxTransferPanel`；stdout 为 JSON `[]`，stderr 为空，退出码 `0`。原始记录见 `detector.*` 与 [detector.summary.json](detector.summary.json)。
- **浏览器与布局**：新建 Playwright Chromium 隔离 context，页面 HTTP `200`，组件存在。显式溢出检查覆盖 `desktop-1440-light`、`mobile-375-light`、`mobile-375-hud`、`mobile-320-light`；这些检查的 document/body scroll width 均等于 viewport，无页面横向溢出。各次记录中的左右面板均高 380px。另有 1440px HUD 截图，但该视图不计入显式溢出检查。浏览器原始记录见 [browser-evidence.json](browser-evidence.json)，视图截图见 [screenshots](screenshots)。
- **状态与键盘**：采集 loading、error、empty 状态；error 状态有可见重试入口且当前已选数量保留为 2，empty 状态显示“暂无数据”且已选数量仍为 2。树项可键盘聚焦，Space 操作后已选数量由 2 增至 3；反向操作按钮焦点环为 2px 实线。`prefers-reduced-motion: reduce` 生效，检测到的 transition/animation duration 为 `1e-05s`。
- **请求与运行错误**：页面错误、失败请求、HTTP 错误和外部请求均为 0。console 中除 Vite 连接调试信息外，记录的是 detector overlay 输出。

## Overlay 归因

Overlay 汇总为 4 个命中节点，console 包含 5 条规则细节；命中都位于 VitePress 文档页或其通用外壳，未定位到组件实现缺陷：

| 规则                                 | 命中位置                                                                | 归因                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `line-length`                        | 文档开头的说明段落，估算约 86 chars/line                                | 中文字符宽度与规则估算模型可能不同；这是文档段落，不是组件布局缺陷。 |
| `buried-raster`                      | VitePress 代码块的 `.copy` 按钮，SVG data URL 背景且静止时 opacity 为 0 | 属于文档外壳的复制按钮 hover 交互。                                  |
| `edge-flush-cards`                   | Props HTML `table`，规则报告 9 个贴边单元格                             | 规则将表格行/单元格按 card 解释，属于目标语义误报。                  |
| `bounce-easing`、`layout-transition` | 页面 `body`                                                             | 命中整页 VitePress 样式上下文，没有指向 LxTransferPanel 源码。       |

节点及 console 目标的完整证据见 [overlay-attribution.json](overlay-attribution.json)。Overlay 命中数量不作为组件缺陷数量。

## 服务与边界

本次独立 overlay 服务在 8400 端口启动后已正常停止，端口已关闭，临时状态已清理；4174 用户预览服务终末仍可访问。4177 在前序观察时有 PID `24920` 监听，最终探测不可达。Assessment B 的服务记录标明没有对 4177 执行 start/stop；因此记录的是外部服务状态变化，不能据此归因其停止原因或责任方。生命周期记录位于 [service-runs](service-runs)，终末端口检查位于 [ports-after-stop.json](ports-after-stop.json)。

浏览器验证针对本地 VitePress 文档页与其 demo，不代表真实后端联调，也没有测试生产权限或真实数据。两次浏览器环境失败尝试保留在 `attempts/`，不计入结论；最终有效采集的 preflight、overlay 注入和执行证据均在 `browser-evidence.json`。
