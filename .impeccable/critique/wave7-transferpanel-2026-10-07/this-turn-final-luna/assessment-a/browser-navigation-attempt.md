# 浏览器导航记录

本轮使用新建的 Playwright Chromium browser context 和 page，目标为 `http://127.0.0.1:4174/components/lxvirtualtree` 与 `http://127.0.0.1:4174/components/lxtransferpanel`。Playwright 从捆绑运行时加载，不依赖项目安装。

首次 HTTP 只读探测曾返回 VitePress app shell：HTTP 200、530 bytes、空 `<title>`。随后在新 browser context 中导航时，Chromium 对 4174 返回 `net::ERR_CONNECTION_REFUSED`；后续 `127.0.0.1` 检查也被拒绝，`localhost` 检查超时。无法加载客户端页面，因此没有真实页面 DOM、ARIA 或 320/375px、主题、焦点、减少动效和缺少 `inheritChildDescription` 状态的浏览器截图。

没有停止、重启、配置或写入 4174 服务。当前可用的图像仅是 `design-reference-screen.png`，它是指定设计图 `design/虚拟滚动树 + 双栏穿梭/screen.png` 的原样副本，不是运行页面截图。`dom-aria-record.md` 标注了其源码推导性质。
