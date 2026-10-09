# Wave 7 LxTransferPanel 独立代码审查

审查日期：2026-10-09

## 结论

**Request Changes**。当前实现的常规高度、移动端触控区、筛选与选择行为、未加载项回显及焦点处理没有发现新的功能回归；但两个可复现的布局问题仍影响受支持的边界场景：最小 `panelHeight` 下树视口几乎不可用，筛选批量操作出现时桌面标题会被截断。修复并补齐相应浏览器回归后再通过本轮审查。

## Findings

### P1：`panelHeight=240` 时树视口几乎不可用

相关位置：

- [`linkx-fe/src/components/LxTransferPanel/index.vue:93`](/F:/work/linkx-admin/linkx-fe/src/components/LxTransferPanel/index.vue:93) 至 [`:99`](/F:/work/linkx-admin/linkx-fe/src/components/LxTransferPanel/index.vue:99)
- [`linkx-fe/src/components/LxTransferPanel/index.vue:1306`](/F:/work/linkx-admin/linkx-fe/src/components/LxTransferPanel/index.vue:1306) 至 [`:1310`](/F:/work/linkx-admin/linkx-fe/src/components/LxTransferPanel/index.vue:1310)
- [`linkx-fe/src/components/LxTransferPanel/index.vue:1521`](/F:/work/linkx-admin/linkx-fe/src/components/LxTransferPanel/index.vue:1521) 至 [`:1534`](/F:/work/linkx-admin/linkx-fe/src/components/LxTransferPanel/index.vue:1534)
- [`linkx-fe/src/components/LxVirtualTree/index.vue:780`](/F:/work/linkx-admin/linkx-fe/src/components/LxVirtualTree/index.vue:780) 至 [`:806`](/F:/work/linkx-admin/linkx-fe/src/components/LxVirtualTree/index.vue:806) 和 [`:809`](/F:/work/linkx-admin/linkx-fe/src/components/LxVirtualTree/index.vue:809) 至 [`:814`](/F:/work/linkx-admin/linkx-fe/src/components/LxVirtualTree/index.vue:814)

`panelHeight` 在代码中被向下限制为 `240px`，但树高只按 `panelHeight - 116` 预估。左侧面板的标题、筛选栏和底部说明还要占用同一个固定高度；`LxVirtualTree` 在 `showCheckbox` 时又始终渲染选择说明和状态区。浏览器把面板压到合法的 `240px` 后，采样结果约为：标题区 `95px`、筛选区 `45px`、树容器约 `33px`，实际虚拟树 viewport 约 `5px`。首行及其 `44px` 触控区会被裁掉，用户几乎无法滚动、展开或勾选节点，等同于最小高度状态失去主要用途。

修复方向：重新计算面板内各区域的最小高度并确保树 viewport 保留可操作高度；可以在紧凑高度下压缩或移出选择说明，或提高组件实际最小高度并同步 props/文档契约。应增加真实 `panelHeight=240` 的浏览器回归，至少断言首个树行可见、checkbox/toggle 在视口内且可点击。

### P2：筛选批量操作出现时桌面标题被截断

相关位置：

- [`linkx-fe/src/components/LxTransferPanel/index.vue:849`](/F:/work/linkx-admin/linkx-fe/src/components/LxTransferPanel/index.vue:849) 至 [`:881`](/F:/work/linkx-admin/linkx-fe/src/components/LxTransferPanel/index.vue:881)
- [`linkx-fe/src/components/LxTransferPanel/index.vue:1351`](/F:/work/linkx-admin/linkx-fe/src/components/LxTransferPanel/index.vue:1351) 至 [`:1378`](/F:/work/linkx-admin/linkx-fe/src/components/LxTransferPanel/index.vue:1378)
- [`linkx-fe/src/components/LxTransferPanel/index.vue:1389`](/F:/work/linkx-admin/linkx-fe/src/components/LxTransferPanel/index.vue:1389) 至 [`:1403`](/F:/work/linkx-admin/linkx-fe/src/components/LxTransferPanel/index.vue:1403)

左侧筛选词非空时，标题行同时渲染“全选筛选结果”和“反选筛选结果”。标题使用 `flex: 1 1 auto`、`min-width: 0`、`overflow: hidden`，操作按钮使用 `flex: 0 0 auto` 且禁止换行。桌面窄面板中，标题可用宽度约 `147px`，标题内容约 `176px`，末尾会被裁掉；`title` 属性只在悬停时提供补救，触屏和不依赖悬停的辅助技术用户仍会失去可见上下文。

修复方向：将批量操作移到标题第二行或独立操作区，或缩短操作文案并为标题保留稳定的最小可见宽度。增加筛选激活状态的浏览器回归，断言标题文本不被裁切/遮挡，同时确认两个批量按钮仍可见、可聚焦、可点击。

## 已核验的正向边界

- 移动端 `320px` 树行约 `64px`，展开按钮和 checkbox 热区均为 `44×44px`。
- `375px` 下移动切换按钮和已选项删除按钮均为 `44×44px`；桌面删除按钮约 `24×24px`。
- 桌面长名称会启用 disclosure；未加载历史项保留最近详情、未加载标记和原始键值。
- 移动切回桌面时切换按钮焦点转移、虚拟树滚动后 Tab 停靠项同步、树内按钮获得焦点后的方向键导航均已有实现，本轮不重复登记旧问题。
- 当前页面没有发现横向溢出。

## 验证范围

- 阅读 `LxTransferPanel`、`LxVirtualTree` 的实现、类型、Demo、文档及对应单元测试和文档 E2E；审查限定在本波指定组件及其直接依赖。
- 主 Agent 提供的定向验证结果：TransferPanel Vitest `64/64` 通过，文档 E2E `28/28` 通过，typecheck 通过，build 通过。
- 本报告未修改业务代码；临时浏览器采样脚本已删除。现有自动化结果没有覆盖真实 `panelHeight=240` 的布局可操作性，也没有覆盖筛选激活时标题完整性，因此不能替代上述两项浏览器回归。
