# Duplicate-submit lock Assessment B

范围：只做 detector 与浏览器证据，目标为 `other-admin/admin-vue3/src/views/baseData/thirdParty/index.vue` 和指定预览地址。没有读取旧 duplicate-submit degraded report、旧 detector 证据或 Assessment A 的结果。

## Detector

本次对指定 Vue 源文件运行了一次 Impeccable detector。原始文件分别保存了 JSON stdout、stderr 和进程退出码：

- `.impeccable/critique/duplicate-submit-assessment-b-luna-max-2026-09-29/detector.json`：`[]`
- `.impeccable/critique/duplicate-submit-assessment-b-luna-max-2026-09-29/detector.stderr.txt`：空文件
- `.impeccable/critique/duplicate-submit-assessment-b-luna-max-2026-09-29/detector.exit-code.txt`：`0`

`[]` 只表示静态扫描该源文件时没有规则命中，不代表运行页面没有问题。浏览器 live detector 在包含应用外壳的实际页面上报告命中，和单文件源码扫描的范围不同。

## Browser

通过新建的 Codex IAB 标签访问 `http://127.0.0.1:30847/baseData/thirdParty` 成功，标题为“三方接入管理 - LinkX 本地预览后台管理系统”。页面展示本地 Mock 管理员和 3 条三方应用记录。浏览器初始视口为 1280×720；移动视口设为 375×812。页面没有可见主题切换入口，根元素无 `dark` / `lx-theme-hud` 类，因此未能采集 HUD 深色主题证据。

修改 `document.title` 并 append 脚本的 CDP 探针成功；随后 `http://localhost:8400/detect.js` 成功加载并在页面中执行。Console 摘要为 `22 anti-patterns found`。保存的逐条 Console 日志解析出：`layout-transition` 3 条、`clipped-overflow-container` 1 条、`dark-glow` 1 条、`cramped-padding` 18 条。摘要数量和逐条规则事件数不一致，原始日志保留供复核。overlay 截图显示导航侧栏命中，以及覆盖内容容器的动画命中。证据采集后临时新标签已关闭，overlay 当前不再显示给用户。

## Duplicate-submit 状态

点击首行“删除”只打开了确认框，没有点“确定”。确认框显示时，首行详情、修改、删除三个操作都为 disabled；其他行操作仍可用。随后点击“取消”，没有观察到 `/collaboration/` 业务写请求，也没有发送删除接口。此证据覆盖确认前的行锁状态，不覆盖确认提交后的网络 pending/loading 状态。

页面运行时自动发起了定时会话心跳：累计观察到 78 次 `POST /linkx/admin/auth/v1/oauth/v2/keepalive`。已核对 `other-admin/admin-vue3/mock/preview-server.ts` 中该路径由当前 `mock-preview` 插件在本地返回 Mock JSON；没有观察到第三方应用删除或其他 collaboration 写请求。另观察到 64 次同源 `GET /` 和 1 次本地模块读取。关闭临时标签后心跳停止。30847 服务保持运行。

## 命中错漏与假阳性

- `cramped-padding` 的 18 条都落在侧栏导航项。DOM 几何显示可见菜单行高 44px，文字行高 17px，文字上下分别留约 13px 和 14px；这些命中更像按 Element Plus 菜单整行盒子判定造成的假阳性，不是文字实际贴边。逐条 overlay 仍覆盖了应用导航项，故把页面壳层扫描结果当作本页缺陷计数会误导。
- `layout-transition` 指向侧栏 `width`、主容器 `margin-left` 和 `body` `width`；从元素和属性看属于布局壳层的响应式/折叠过渡，与重复提交按钮无直接关系。此轮没有操作导航折叠控件。
- `clipped-overflow-container` 指向 `.sidebar-wrapper.sidebar-container`；该元素是侧栏容器且 `overflow: hidden`，符合裁剪侧栏内容的布局容器特征。运行时检测命中，但此轮未验证折叠过程中的被裁剪子元素，标记为上下文相关命中。
- `dark-glow` 指向深色侧栏中的 `.logo-icon` 蓝色投影。它是品牌标记周围的 `box-shadow`，可能属于主题强调效果；没有目标页面设计意图或 HUD 主题证据，不能据此判断为缺陷。
- 移动视图采用紧凑表格，只显示“应用名称”和“操作”列；文档与 body 宽度最终均为 375px。分页控件自身宽于视口并出现内部横向滚动条，live detector overlay 遮住了部分区域；干净截图记录了 overlay 关闭后的视图。

## 原始证据清单

证据目录：`.impeccable/critique/duplicate-submit-assessment-b-luna-max-2026-09-29/`

- Detector：`detector.json`、`detector.stderr.txt`、`detector.exit-code.txt`
- 浏览器逐条 Console：`browser-console.json`
- 页面、viewport、命中计数及状态：`browser-detector-evidence.json`
- 取消前确认框和网络观察：`delete-lock-browser-evidence.json`、`network-summary.json`
- 截图：`desktop-light.png`、`desktop-light-overlay.png`、`mobile-light.png`、`mobile-light-overlay.png`、`desktop-delete-lock-dialog.png`
- Impeccable live-server 启停：`live-server-session.json`、`live-server-start.stdout.txt`、`live-server-start.stderr.txt`、`live-server-start.exit-code.txt`、`live-server-stop.stdout.txt`、`live-server-stop.stderr.txt`、`live-server-stop.exit-code.txt`

Impeccable 临时 live-server 使用 `127.0.0.1:8400`，stop 命令退出码为 `0`，进程已退出；30847 预览服务没有停止。页面探针与 detector overlay 仅存在于已关闭的临时浏览器标签中。
