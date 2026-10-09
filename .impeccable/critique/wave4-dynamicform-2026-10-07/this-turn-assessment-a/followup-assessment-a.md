Method: isolated Assessment A follow-up (fresh Edge/Playwright mobile context; no detector or Assessment B evidence consulted)

# LxDynamicForm 最新补丁复验：手机上传与浅色提示文字

## 范围

- 目标：`http://127.0.0.1:4174/components/lxdynamicform.html`，当前工作树的 VitePress 开发页；页面 HTTP 200。
- 视口：手机 `375×812`，设备像素比 `1`，触屏输入开启；浅色主题、系统减少动效开启。
- 仅复验两项：上传进度面板中的“取消上传”完整显示和触及尺寸；浅色表单 placeholder 的实际前景/背景对比度。
- `linkx-fe/src/components/LxUpload/index.vue` 的当前工作树修改时间为 2026-10-07 03:20:03，晚于此前 Assessment A 截图。开发服务器 4174 正由 `linkx-fe` 的 VitePress dev 进程提供，并在此之后直接检查当前路由。因此本报告的三张截图及测量覆盖最新渲染；不再用旧进度截图作为补丁复验依据。
- 本轮未读取 Assessment B、未运行 detector、未改产品源码；没有浏览器运行错误。上传使用文档内存 Mock。

## 结果

### 上传进度面板：通过

通过原生文件输入注入内存测试文件，等待单张附件上传进度态，将进度面板滚入视口后采集截图并检查浏览器布局矩形：

- 面板位于 `x=39, y=346`，尺寸 `297×120px`；拖拽区位于 `x=37, y=344`，尺寸 `301×124px`。
- “取消上传”按钮位于 `x=47, y=416`，尺寸 `78×44px`；可见交集为 `78×44px`，没有被拖拽区裁切。
- 按钮中心点命中按钮元素；实际点击后上传取消，文件回到队列态，验证了该控件可操作。
- 浏览器 `prefers-reduced-motion: reduce` 已开启。该状态没有缩短或隐藏取消控件。

截图：[`followup-mobile-375-upload-progress.png`](followup-mobile-375-upload-progress.png) 显示进度面板和完整按钮；[`followup-mobile-375-upload-cancelled.png`](followup-mobile-375-upload-cancelled.png) 显示取消后文件留在队列。前者页面滚动到附件进度区，后者在操作完成后仍保留附件区上下文。

**复验结论**：原 03:12–03:15 截图中的手机取消控件裁切已在当前工作树复验通过。当前按钮达到触屏最小 44px 高，且点击成功。本轮未覆盖慢速/真实网络中断或多个上传项目同时取消。

### 浅色 placeholder：通过

在当前页面读取可见输入的 `::placeholder` 前景色，沿祖先背景逐层合成透明背景，并按 WCAG 相对亮度公式对实际白色字段底色计算对比度：

| 示例占位文字 | 前景 | 合成底色 | 对比度 |
|---|---|---|---:|
| 输入任务名称 | `rgb(107, 114, 128)` | `rgb(255, 255, 255)` | **4.83:1** |
| 输入访问密码 | `rgb(107, 114, 128)` | `rgb(255, 255, 255)` | **4.83:1** |

依据普通文本 4.5:1 的 WCAG AA 对比度门槛，当前这两个表单示例通过。测量依据当前活动 DOM 样式，而非旧截图中的像素值；[`followup-mobile-375-placeholder.png`](followup-mobile-375-placeholder.png) 为本次浅色页面截图。

**复验结论**：原报告记录的约 1.59:1 不代表当前工作树。最新浏览器渲染得到 4.83:1，当前修复通过。该结果覆盖本页面抽样的浅色输入 placeholder；未对所有字段类型、其他主题或浏览器高对比度模式穷举。

## 原始证据

- [`followup-mobile-evidence.json`](followup-mobile-evidence.json) 保存目标 URL、视口/主题/减少动效配置、placeholder 样式与对比度、面板和按钮矩形、触及命中、取消结果、运行错误及截图清单。
- [`capture-mobile-followup.mjs`](capture-mobile-followup.mjs) 是生成本次证据的有限浏览器脚本。
- 本轮截图共三张，均为 `375×812`：`followup-mobile-375-placeholder.png`、`followup-mobile-375-upload-progress.png`、`followup-mobile-375-upload-cancelled.png`。

本 follow-up 仅更新 A 的这两项观察。它不是 Assessment B，也不替代正式合并 Critique 中独立的 detector、浏览器 overlay、综合报告与快照流程。
