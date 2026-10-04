# Wave 2 browser evidence — 2026-09-30

阶段性浏览器验证记录；本目录不构成正式 Impeccable Critique 通过结论。仅负责 LxSearchBar、LxStatusSwitch、LxUpload 的页面交互证据。

## 环境与命令

- 文档站：`http://127.0.0.1:4177`；三条路由均可加载 VitePress SPA，页面标题和正文正常。
- 浏览器：本机 Chrome，Playwright 1.58.0，headless Chromium。
- Playwright runner 完整命令（工作目录 `F:\work\linkx-admin\other-admin\admin-vue3`）：`& '.\node_modules\.bin\playwright.cmd' test 'F:/work/linkx-admin/other-admin/admin-vue3/tests/e2e/lx-status-switch-docs.spec.ts' 'F:/work/linkx-admin/other-admin/admin-vue3/tests/e2e/lx-upload-docs.spec.ts' --config='F:/work/linkx-admin/.impeccable/critique/wave2-browser-2026-09-30/playwright.wave2.config.mjs' --workers=1 --timeout=15000`。配置文件固定 baseURL 为 4177，单 worker，expect timeout 3000 ms。
- Runner stdout：`playwright-runner.stdout.log`；stderr：`playwright-runner.stderr.log`；JSON：`playwright-runner.json`；进程退出码：`0`。Playwright 统计 6 passed / 0 failed / 0 skipped，实际 worker 数 1。
- 初次命令 `pnpm exec playwright test ...` 因 pnpm shim 未识别 playwright 返回退出码 `1`（stderr: `'playwright' is not recognized as an internal or external command`）；随后改用上方已安装的 `node_modules/.bin/playwright.cmd`，runner 正常启动并完成，退出码 `0`。
- SearchBar 在现有 E2E spec 中没有对应文件，使用 `wave2-browser.mjs` 做独立真实浏览器交互。该脚本退出码 `0`，见 `playwright-results.json` 和 `playwright-stdout.log`。

## 交互与视口

- LxSearchBar：桌面成功查询、空结果、失败提示、恢复成功、Enter 查询和展开全部条件；375×812 检查无横向溢出；HUD 深色截图由浏览器设定 `dark lx-theme-hud` 根类后采集，减少动效媒体查询为 true。
- LxStatusSwitch：实际点击 0/1 开关并观察值变为 1；只读行无 switch；关闭确认展示后果说明，取消保留开启，确认后变关闭；另测保存失败反馈、375×812、HUD 与减少动效。
- LxUpload：实际选择 CSV、点击开始上传并观察进度变换及成功；失败后重试成功；上传中实际点击取消并移除；窄屏检查紧凑标签、HUD、禁用和减少动效。
- 三个页面桌面 1440×900 与移动 375×812 截图、DOM/CSS metrics 分别见同目录 PNG/JSON。全部移动页面的 scrollWidth 等于 viewport 宽度（无横向溢出）。HUD 根类已在 StatusSwitch / Upload 演示切换；SearchBar HUD 额外截图的根类由脚本显式加入，页面只读验证。

## 浏览器控制台与网络

- Playwright 自定义脚本捕获到 0 个 pageerror、0 个 requestfailed。另用 diagnose-responses.mjs 查询失败 HTTP 响应，结果 []。
- 收集到的 console error/warning（其中上传失败项来自被页面捕获并用于验证重试的预期 Mock 错误）：
- [error] http://127.0.0.1:4177/components/lxsearchbar: Failed to load resource: the server responded with a status of 404 (Not Found)
- [warning] http://127.0.0.1:4177/components/lxsearchbar: Invalid prop: type check failed for prop "id". Expected Array, got String with value "lx-search-date". null at <PickerRangeTrigger> at <ElOnlyChild> at <ElPopperTrigger> at <ElTooltipTrigger> at <ElPopper> at <ElTooltip> at <Picker> at <ElDatePicker> at <LxDatePicker> at <LxSearchBar> at <Basic> at <Components/lxsearchbar.md> at <VitePressContent> at <VPDoc> at <VPContent> at <Layout> at <VitePressApp> [Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object]
- [warning] http://127.0.0.1:4177/components/lxsearchbar: Invalid prop: type check failed for prop "id". Expected Array, got String with value "lx-search-date". null at <PickerRangeTrigger> at <ElOnlyChild> at <ElPopperTrigger> at <ElTooltipTrigger> at <ElPopper> at <ElTooltip> at <Picker> at <ElDatePicker> at <LxDatePicker> at <LxSearchBar> at <Basic> at <Components/lxsearchbar.md> at <VitePressContent> at <VPDoc> at <VPContent> at <Layout> at <VitePressApp> [Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object]
- [warning] http://127.0.0.1:4177/components/lxstatusswitch: [Vue warn]: Invalid prop: type check failed for prop "confirm". Expected String / Boolean, got Object at <LxStatusSwitch model-value=true confirm= {title: 确认停用该节点？, message: 关闭后将中断节点通信，并记录操作审计。, type: danger} onUpdate:modelValue=fn > at <Basic> at <Components/lxstatusswitch.md onVnodeMounted=fn<runCbs> onVnodeUpdated=fn<runCbs> onVnodeUnmounted=fn<runCbs> > at <VitePressContent class="vp-doc _components_lxstatusswitch" > at <VPDoc key=4 > at <VPContent> at <Layout> at <VitePressApp>
- [warning] http://127.0.0.1:4177/components/lxstatusswitch: [Vue warn]: Invalid prop: type check failed for prop "confirm". Expected String / Boolean, got Object at <LxStatusSwitch model-value=false confirm= {title: 确认停用该节点？, message: 关闭后将中断节点通信，并记录操作审计。, type: danger} onUpdate:modelValue=fn > at <Basic> at <Components/lxstatusswitch.md onVnodeMounted=fn<runCbs> onVnodeUpdated=fn<runCbs> onVnodeUnmounted=fn<runCbs> > at <VitePressContent class="vp-doc _components_lxstatusswitch" > at <VPDoc key=4 > at <VPContent> at <Layout> at <VitePressApp>
- [warning] http://127.0.0.1:4177/components/lxstatusswitch: [Vue warn]: Invalid prop: type check failed for prop "confirm". Expected String / Boolean, got Object at <LxStatusSwitch model-value=true confirm= {title: 确认停用该节点？, message: 关闭后将中断节点通信，并记录操作审计。, type: danger} onUpdate:modelValue=fn > at <Basic> at <Components/lxstatusswitch.md onVnodeMounted=fn<runCbs> onVnodeUpdated=fn<runCbs> onVnodeUnmounted=fn<runCbs> > at <VitePressContent class="vp-doc _components_lxstatusswitch" > at <VPDoc key=4 > at <VPContent> at <Layout> at <VitePressApp>
- [error] http://127.0.0.1:4177/components/lxupload: UploadAjaxError: 本地 Mock 上传失败 at http://127.0.0.1:4177/@fs/F:/work/linkx-admin/linkx-fe/src/components/LxUpload/demo/basic.vue?t=1790742733839:45:39
- SearchBar 404 仅由 console 报为“Failed to load resource”；同一导航的 response 监听未见 HTTP ≥400，需后续定位是否浏览器内部资源请求或 VitePress 外部资源。LxSearchBar 日期范围的 Element Plus id prop warning 与 LxStatusSwitch confirm prop warning 在演示挂载时出现，建议由组件/示例负责人确认契约。

## 证据索引

- Playwright Test runner：`playwright-runner.json`、`playwright-runner.stdout.log`、`playwright-runner.stderr.log`。
- 搜索栏脚本结果：`playwright-results.json`、`playwright-stdout.log`、`playwright-stderr.log`。
- 搜索栏桌面/移动 HUD：`searchbar-desktop-initial.png`、`searchbar-desktop-final.png`、`searchbar-mobile-hud-reduced.png` 及配套 JSON。
- 状态开关：`statusswitch-desktop-final.png`、`statusswitch-mobile-hud-reduced.png` 及配套 JSON。
- 上传：`upload-desktop-progress.png`、`upload-mobile-hud-reduced-disabled.png` 及配套 JSON。

正式 Impeccable Critique 的两路独立评估、detector/overlay、趋势快照等未在本次任务执行；本记录只证明所述浏览器场景的交互与页面指标。

