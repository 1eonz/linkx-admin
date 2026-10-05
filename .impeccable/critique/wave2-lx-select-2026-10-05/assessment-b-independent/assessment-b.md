# LxSelect Assessment B 独立评估

## 结论

本次是降级取证，不能标记为 Impeccable 正式 Critique 通过。源码 detector 返回静态规则零命中；浏览器侧的 mutation 预检被 CUA 只读页面代理拒绝，因此没有注入 overlay，也没有进行逐状态 overlay 检查或保存截图。

## 静态 detector

目标为 `linkx-fe/src/components/LxSelect/index.vue`。原始 stdout 为 `[]` 加换行，stderr 为 0 字节，退出码为 0。该结果只表示本次源码目标的静态规则零命中，不表示运行页面无问题或 Critique 通过。

- `detector.stdout.json`：原始 stdout JSON。
- `detector.stderr.txt`：原始 stderr，空文件。
- `detector.exit-code.txt`：进程退出码 `0`。

## 浏览器证据

在新建的后台浏览器标签中打开 `http://127.0.0.1:4177/components/lxselect.html`，页面标题与 LxSelect Demo 均可读取。预检先设置 `document.title` 再追加 inline script；CUA evaluate 在第一次写入时返回 `TypeError: Cannot set property title of [object Object] which has only a getter`，因此脚本未追加，页面未被修改。按评估要求，没有改走 Playwright、CDP 或其他 mutation 路径。

可保留的只读测量见 `browser-measurement.json`：初始视口为 1280×720、DPR 1，文档与 body 的 `scrollWidth` 均为 1265，未发现越出视口的元素；页面有 1 个 Demo、6 个 LxSelect 触发器。该结果只覆盖初始桌面视图，不能替代 overlay 检查。一次尝试读取 `performance` 失败，因为只读 evaluate 沙箱未暴露该对象；外部资源请求未测量。浏览器控制台 warn/error 记录为 0 条，见 `browser-console.json`。

## 跳过项

- 桌面单选键盘展开、多选选中态、HUD、320/390px 禁用或弹层、减少动效：未操作，未截图；mutation 预检失败后停止浏览器变更。
- 远程错误/重试：页面 Demo 仅实现 600ms 的本地成功模拟，没有失败/重试模拟；未触发。
- Overlay、overlay console 和逐视图截图：未注入、未产生，不能提供截图索引。
- Browser runner：未启动独立进程；CUA API 不提供 OS 进程退出码或 stdout/stderr 流。API 错误见 `browser-errors.txt`，成功测量见 `browser-measurement.json`，状态说明见 `browser-runner.json`。

## live-server 生命周期

官方 `live-server.mjs` 从本目录下的 `live-root/` 独立工作目录启动，使用专属端口 8411；启动退出码 0，PID 40036，stderr 为空。启动 stdout 原样保存在 `live-server.stdout.json`，stderr 和退出码分别保存在同名证据文件。停止命令为 `node live-server.mjs stop --keep-inject --port=8411`，退出码 0；停止 stdout 为 `Stopped live server on port 8411.`，stderr 为空，PID 已退出，8411 已无监听。生命周期核验见 `live-server.stop-verification.txt`。4177 未停止或重启，5180 未触碰。

## 设计参考

组件源码与页面说明都指向 `design/表单控件八件套/code.html` 的 02 下拉选择器标本。本报告没有读取其他 assessment、A 报告或 `.impeccable` 其他目录，也没有修改应用源码。
