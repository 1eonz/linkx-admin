# LxSwitch 移动宽度证据复验

本补充只记录独立 Assessment B 的浏览器与 detector 证据，不读取或合并 Assessment A / 综合报告，也未修改产品源码。

## 目标与运行环境

- 目标服务：`http://127.0.0.1:4195`，复验期间 HTTP 正常。进程 `38380` 为本工作区 `linkx-fe` 下的 VitePress 1.6.4 dev server，命令行参数为 `dev docs --host 127.0.0.1 --port 4195 --strictPort`。
- 两个 4195 路由均返回 HTTP 200：`/components/lxswitch.html` 与 `/components/lxswitch`。无需启动 Playwright 配置的备用 4176 服务。
- 浏览器为 Playwright 所用系统 Chrome `154.0.8037.95`。移动 context 为 `375×812`、`deviceScaleFactor=1`、`isMobile=true`、`hasTouch=true`；桌面 context 为 `1280×900`。
- 页面使用的当前工作区文件在复验时分别为：`linkx-fe/docs/.vitepress/theme/custom.css`（2026-10-05 11:29:26 UTC）、`linkx-fe/docs/components/lxswitch.md`（10:58:52 UTC）、`linkx-fe/src/components/LxSwitch/index.vue`（07:40:57 UTC）、`linkx-fe/src/components/LxSwitch/demo/basic.vue`（09:36:53 UTC）。4195 是该工作区的 dev server，复验直接访问它，没有改动文件或替换服务。

## 375px 阶段测量

每个路由均在同一个真移动浏览器 context 中按顺序测量：注入前、加入 detector 后即时、等待 2500ms、通过 detector 的 Toggle overlay visibility 隐藏标记、重新显示标记并关闭 banner。数字格式为 `clientWidth/scrollWidth`。两个路由在下表各阶段所得数值完全一致：

| 阶段                         | `window.innerWidth` / `visualViewport.width` | `documentElement` |    `body` | Detector 状态                                                |
| ---------------------------- | -------------------------------------------: | ----------------: | --------: | ------------------------------------------------------------ |
| 注入前                       |                                    375 / 375 |         375 / 375 | 375 / 375 | 0 marker，0 banner                                           |
| 脚本注入后即时               |                                    375 / 375 |         375 / 375 | 375 / 375 | 扫描尚未绘制 marker，0 marker，0 banner                      |
| 等待 2500ms                  |                                    615 / 375 |         375 / 615 | 375 / 375 | 3 marker，1 banner，可见                                     |
| 隐藏 overlay                 |                                    375 / 375 |         375 / 375 | 375 / 375 | DOM 中保留 3 marker、1 banner；`body.impeccable-hidden` 生效 |
| 关闭 banner、重新显示 marker |                                    615 / 375 |         375 / 615 | 375 / 375 | 3 marker，0 banner，可见                                     |

`meta[name=viewport]` 为 `width=device-width,initial-scale=1`。等待后 `innerWidth` 随文档根滚动宽度变为 615，但 `visualViewport.width` 和 `documentElement.clientWidth` 仍为 375；`body.scrollWidth` 始终为 375。这组值表明 615 是可见 detector 标记扩出的布局视口宽度，不是视口模拟被设为 615。

## 溢出 DOM 定位

浏览器 JSON 在每个阶段完整列出了所有 `scrollWidth > clientWidth` 的元素及 selector、两种宽度、差值、矩形、`overflow-x`、可见性、detector 所有权和简短节点内容。注入前两路均有 14 个局部溢出节点，但根节点和 body 都是 375/375。主要文档节点包括：

- 长代码块 `<pre>`：`293/613`，`overflow-x:auto`；另一代码块为 `375/520`，也是内部滚动。
- 属性契约表：`327/391`，`overflow-x:auto`。
- VitePress 文档 `.container` 及其祖先：`327/351`、`overflow-x:visible`，但边界右侧为 x=351，仍在 375px 视口内，因此不会把根节点扩大到 615。

扩展到 615 时，新增的页面级来源是 detector 注入的 marker：

- `.impeccable-overlay.impeccable-visible:nth-of-type(2)` 的矩形左边 x=333、宽 20px，但自身 `clientWidth/scrollWidth=20/282`，对应标签“positioned child clipped by overflow container”。其内容滚动范围从 x=333 延伸约 282px，右缘约为 x=615，与观测到的 `documentElement.scrollWidth=615` 相符。
- `.impeccable-overlay.impeccable-visible:nth-of-type(4)` 左边 x=321、宽 44px，`44/230`，对应标签“raster buried under a wash or opacity”；这是另一条 detector 标签的横向延伸。
- banner 的滚动区也有局部宽度（`315/528`），但可视矩形右缘约 x=315；隐藏全部 overlay 时 banner 仍在 DOM，而根宽恢复 375。重新显示标记并关闭 banner 后，根宽仍恢复到 615。因此根宽变化跟随 marker 可见状态，不跟随 banner 是否存在。

结论：本复验中未发现产品页面本身把文档根宽扩至 615px。此前看到的 615px 是 detector 的可见绝对定位标签造成的测量污染；单独看已注入 overlay 的截图会误判成页面溢出。页面确有代码块/表格自身的局部横向滚动，但注入前根节点保持 375/375。

## 路由与桌面对照

`/components/lxswitch.html` 与 `/components/lxswitch` 在 375px 下的全部阶段数据、marker 数和局部溢出节点计数一致，均返回 200。`1280×900` 下两个路由在注入前和 detector 等待 2500ms 后均为 `window.innerWidth=1280`、`documentElement=1280/1280`、`body=1280/1280`，页面根宽没有横向溢出。

## Detector 与原始证据

当前组件、Demo、文档分别运行 `detect.mjs --json`。三个 stdout 均为有效 JSON `[]`（3 字节），stderr 均为空（0 字节），各 exit-code 文件内容均为 `0`。注意 exit-code 文件自身为 2 字节，末尾包含换行；文件长度不是进程码。

| 源码目标 | 命令、stdout、stderr 与退出码                                                                                                                                           |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 组件     | `recheck-detector-component.command.txt`、`recheck-detector-component.stdout.json`、`recheck-detector-component.stderr.txt`、`recheck-detector-component.exit-code.txt` |
| Demo     | `recheck-detector-demo.command.txt`、`recheck-detector-demo.stdout.json`、`recheck-detector-demo.stderr.txt`、`recheck-detector-demo.exit-code.txt`                     |
| 文档     | `recheck-detector-doc.command.txt`、`recheck-detector-doc.stdout.json`、`recheck-detector-doc.stderr.txt`、`recheck-detector-doc.exit-code.txt`                         |

每项原命令已再单独直接复跑一次：Playwright 工具返回进程码 0、stdout `[]`，与保存文件一致。静态 `[]` 只表示对应源码目标零静态命中，不代替本次浏览器尺寸测量。

浏览器主证据为 `recheck-375-dom-measurements.json`，其中保留两路所有阶段的根/body 尺寸、所有 `scrollWidth > clientWidth` 节点、viewport 参数、overlay 状态及 console events；相同完整 JSON 也保存在 `recheck-375-browser.stdout.json`。命令见 `recheck-375-browser-command.txt`，stderr 为空，进程码见 `recheck-375-browser.exit-code.txt`（内容 `0`）。

截图为：

- `.html` 移动路由：`recheck-375-html-01-before.png`、`recheck-375-html-02-settled.png`、`recheck-375-html-03-overlay-hidden.png`、`recheck-375-html-04-banner-dismissed.png`。
- extensionless 移动路由：`recheck-375-extensionless-01-before.png`、`recheck-375-extensionless-02-settled.png`、`recheck-375-extensionless-03-overlay-hidden.png`、`recheck-375-extensionless-04-banner-dismissed.png`。
- 桌面对照：`recheck-1280-html-detector.png`、`recheck-1280-extensionless-detector.png`。

所有移动图尺寸均为 `375×812`，桌面图均为 `1280×900`。复验没有启动或停止服务器；4195 的 VitePress PID `38380` 和已有 detector live-server 8400 的 PID `34796` 在结束时仍监听。4176 未启动。未执行页面源码修改。
