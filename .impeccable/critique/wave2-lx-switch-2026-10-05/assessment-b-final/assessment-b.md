# LxSwitch Assessment B：Detector 与浏览器证据

## 范围与方法

本文件仅记录 Assessment B。目标源码为 `F:\work\linkx-admin\linkx-fe\src\components\LxSwitch\demo\basic.vue`，文档目标为 `http://127.0.0.1:4193/components/lxswitch.html`。先尝试指定的 `http://127.0.0.1:4174/components/lxswitch.html`，该端口未监听；父 Agent 提供 4192 文档站后，站点在并行文档构建期间因 VitePress 文件监听 `EBUSY` 崩溃，随后由父 Agent 在 4193 重启。最终浏览器观察均来自 4193 的新标签页；未使用 4192 截图作为结论依据。

只读了目标源码、Impeccable `reference/critique.md` 与 `live-server.mjs --help`。没有读取 Assessment A、postfix 或旧 Critique 报告，没有修改产品源码，也没有生成综合报告或 snapshot。

## Detector

执行目录：`F:\work\linkx-admin`

命令：

```text
node "C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs" --json "linkx-fe/src/components/LxSwitch/demo/basic.vue"
```

目标：`F:\work\linkx-admin\linkx-fe\src\components\LxSwitch\demo\basic.vue`

原始证据文件：

- `detector.stdout.json`：`[]`（3 字节）
- `detector.stderr.txt`：空（0 字节）
- `detector.exit-code.txt`：`0`
- `detector-command.txt`：完整执行命令

结论：该源码目标静态扫描零命中。此结论仅限 detector 的源码扫描，不代表浏览器页面无问题，也不代表正式 Critique 通过。文档 URL 未传给 CLI；依照规则，URL 使用浏览器检查。

## 浏览器证据

环境：Codex In-app Browser，CUA 新建标签页 2，页面标题为“LxSwitch 状态开关 | LxUI”，最终 URL 为 `http://127.0.0.1:4193/components/lxswitch.html`。捕获的 JPEG 截图像素尺寸均为 `1265×712`。

| 检查项 | 结果与现场证据 |
| --- | --- |
| 亮色主题 | 完成。新标签初始页面呈亮色主题，示例区与开关可见。截图元数据见 `browser-screenshot-evidence.md` 的“bright”。 |
| HUD 深色主题 | 完成。勾选“HUD 深色主题”后文档与示例区切换为深色，复选状态为 1。 |
| 键盘焦点 | 完成。Tab 依次到达 HUD 复选框和第一个开关；开关获得可见蓝色外环。 |
| Space 键 | 画面中的开关滑块与文案切换为关闭；同一时刻 CUA 完整无障碍树仍报告该 switch `Value: 1`。精确读取 `.lx-switch` checked class、`[role=switch]` 的 `aria-checked` 和原生 input `checked` 未能通过当前 CUA API 完成，因此该差异未定性。 |
| 禁用态 | 完成。对“省厅直辖联防调度镜像（锁定）”执行点击时，浏览器工具返回“Cannot interact with a disabled element”；之后控件仍为禁用、值为 1。 |
| Loading | 完成。点击“省厅镜像同步”后控件进入禁用/loading，文案播报“镜像同步下发中……（loading 期间点击被拦截）”。 |
| 错误与恢复 | 完成。首次模拟下发显示“模拟下发失败，开关保持关闭；再次操作可重试。”；再次操作两秒后控件变为开启并播报“省厅镜像同步 已开启”。 |
| 375px 触控 | 未完成。CUA 的 Tab API 没有视口大小或触控设备仿真接口，现场截图宽度为 1265px。不能据此推断 375px 布局或触控命中区域通过。 |
| `prefers-reduced-motion` | 未完成。当前浏览器 API 未暴露媒体偏好设置或模拟接口。 |
| Console | 未采集。CUA 的 Tab API 没有 console 日志读取接口；详见 `browser-console.txt`。未捕获不等于没有错误。 |
| 外部网络请求 | 数量未知。CUA 未提供 Network/HAR 读取能力；没有把未观测写成 0。 |
| 截图文件 | CUA 已返回并展示现场截图，尺寸和字节数保存在 `browser-screenshot-evidence.md`；CUA 只返回内存中的 `Uint8Array`，未提供本地文件保存路径，因此本目录未落盘 JPEG 原始图像。 |

### Overlay 注入

执行注入预检时，尝试经 `tab.goto("javascript:...")` 设置 `document.title` 并追加 `<script>`。浏览器安全策略在执行前拒绝了该 URL：只允许 `http:` 与 `https:` 协议。按照 Assessment B 的降级规则，未启动 Impeccable live server，也未尝试绕过浏览器策略；没有 overlay 注入成功、没有 detector 页面 console 消息，也没有可供用户查看的 overlay。没有启动 Impeccable live server，因此没有 stop 命令需要执行；4193 VitePress 服务由父 Agent 管理。

## 未完成步骤与建议

1. 在获得受支持的只读 DOM 检查能力后，同一页面同一键盘状态下读取 `.lx-switch` checked class、`[role=switch] aria-checked` 与原生 input `checked`，核对 CUA 无障碍树仍报 `Value: 1` 的差异。
2. 在可控制视口和媒体偏好的浏览器环境重新检查 `375px` 触控尺寸与 `prefers-reduced-motion`；当前两项为未验证。
3. 在提供 console 与 Network 读取能力的环境保存原始日志和外部请求计数。
4. 浏览器安全策略允许受支持的脚本注入后，再进行 overlay 检查；本轮没有 overlay 证据。
5. 若要归档截图图像，需要提供允许将 CUA 返回的图像字节写入指定目录的保存接口；当前目录仅有尺寸/字节数元数据。

本轮 detector 结果完整；浏览器交互观察部分完成。由于 overlay、console、网络计数、375px、减少动效及现场 DOM 核验均受工具能力限制，Assessment B 不标记为完整正式审查通过。
