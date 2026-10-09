# Wave 7 LxTransferPanel 当前版独立代码复审

复审日期：2026-10-08  
范围：`LxTransferPanel` 实现与类型、Demo、文档、对应 unit/E2E、`LxConfirm` 主题样式与令牌继承路径。只读检查产品代码；仅更新本报告。

## 结论

未发现 P0、P1 或 P2 正确性问题。**Approved，附一项 P3 窄屏体验建议。** 复审重点中的确认快照、移除后焦点恢复、列表滚动提示 ARIA、窄屏横向布局及 HUD 确认按钮颜色均与当前实现一致。

### [P3] Demo 在窄屏仍固定 380px 面板高度

证据：`linkx-fe/src/components/LxTransferPanel/demo/basic.vue:345` 显式传入 `panelHeight=380`。窄屏在 `index.vue:1468` 起把两侧面板纵向排列，每侧仍高 380px，页面还要容纳中间操作区和间距；在 375px/320px 视口查看两侧内容需要较长的页面纵向滚动。组件本身允许宿主传 `panelHeight`，文档也将 380px 列为默认/目标高度，因此这是示例的移动端操作成本，不是组件裁切或布局正确性缺陷。可作为低优先级后续改进，为 Demo 窄屏选择较短高度，同时保留面板内列表/树滚动和两侧同高。

## 重点复核

- **确认并发与过期状态**：`index.vue:131-140` 用同步 watcher 只在键序列变化时递增版本；`339-346` 同时校验版本与完整键序列。清空和未加载项移除分别在 `429-455`、`484-527` 确认后校验快照；测试覆盖清空时受控值变化、移除期间删后重加及同值新数组引用。未发现旧确认能清除已变更的当前键序列。当前实现没有单独的 pending 锁；标准确认框覆盖并陷获焦点，组件也未公开这些内部操作，普通交互不能在确认框打开时再次触发面板按钮。没有用测试强行构造并列的多个 MessageBox 实例，因此不对程序化多弹窗栈作结论。
- **焦点与 ARIA**：`index.vue:484-505` 删除前先将焦点移至稳定列表，受控值接受删除后再聚焦相邻移除按钮，末项删除回到列表。`789-888` 给可聚焦列表提供数量名称，并在尚有未显示项时关联外部 `role=status`/`aria-live=polite` 提示；列表滚动到底部或过滤后不再溢出时解除关联。E2E 覆盖普通/未加载项移除和清空后的键盘焦点，以及 320px 下列表焦点与滚动提示；未进行真实读屏器测试。
- **高度与窄屏**：`index.vue:79-88` 限定最小面板高度并据此计算树视口；`315-337` 在挂载和窗口缩放时更新虚拟行高与已选列表溢出测量，并在卸载时清理 ResizeObserver 和窗口监听。375px、320px 浏览器测试通过；页面没有横向溢出，长名称换行，移除/批量触控目标满足 44px，列表可内部滚动。面板不会因内容行高自动缩短；Demo 固定高度问题见上项。
- **HUD 确认框主题与颜色断言**：当前 Demo 的 `setHudTheme()` 在 `basic.vue:188-203` 将 `dark` 和 `lx-theme-hud` 写到 `document.documentElement`；卸载时保留用户后续修改的主题类（`221-234`）。`LxConfirm` 的 MessageBox 挂到 `document.body`，而自定义属性在 `html` 上定义并继承给 `body` 后代，因此 E2E 在 `body` 下插入 span 并读取 `var(--lx-...)` 的探针有效，不会因为探针父级或 Dialog Teleport 而读到错误作用域。`LxConfirm/style.css:35-49` 用高优先级规则覆盖按钮默认/hover/active 令牌；E2E 实际读取按钮计算色并确认浅色与 HUD 两态。浏览器复验中深色 HUD 类成立；危险实底/深字对比度按令牌值分别为 `5.56:1`（`#f56c6c`）和 `4.68:1`（hover `#e65d5d`）。此前针对“HUD 未作用到 Teleport 确认框/主题类恢复”的风险不适用于当前根节点主题实现。

## 验证与边界

- `pnpm exec vitest run tests/unit/lx-transfer-panel.test.ts`：通过，20/20。
- `pnpm exec playwright test --config playwright.lxui.config.ts tests/e2e/lx-transfer-panel-docs.spec.ts`：通过，10/10。包含 HUD 状态恢复、浅色/HUD 确认框实际计算颜色、确认焦点、375px 与 320px 布局。
- 未重复运行 build、Lint；未进行真实后端联调、真实读屏器验证或程序化多弹窗栈压力测试。

## 复审时 SHA-256

以下为复审结束时工作树中本次阅读的产品源码/文档和测试文件。哈希均为完整 SHA-256 大写十六进制。

| 文件 | SHA-256 |
| --- | --- |
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `B168DEBA31A595473B9BD4DCEF524300CEC9F8361AA92E6094473FA362397D7D` |
| `linkx-fe/src/components/LxTransferPanel/types.ts` | `AD19C9CDDCD7EF7BDCC03D1A0F440D1773219163DAA9E20F1BE4B7896443DA8F` |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `641C38B92B957C2F0335D3939A2D09F953404DC4FE65C0CB605738298F90249B` |
| `linkx-fe/docs/components/lxtransferpanel.md` | `C1D9C860B86A6B2205C35AE94CA2ABF89FC9611112483A571CBFBA2F806D6A30` |
| `linkx-fe/src/components/LxConfirm/index.ts` | `54B8496B99DC35679625A29D74C3C1D1D3216D410AE97A099446D185ABE01A80` |
| `linkx-fe/src/components/LxConfirm/style.css` | `3AB88E6BA2C999B1DAD92B74E93FAFE1342CAF93B364A3163D3BE286DFDA29B1` |
| `linkx-fe/src/components/LxVirtualTree/index.vue` | `E36B50875832C374FF98C0366493F6FC26AD1CBF6ABDFD056E863B155C2386B4` |
| `linkx-fe/src/utils/syncAriaDescribedBy.ts` | `8CABF31329578CEC0886322D1539DB4B4DE8303E5DA41794E98AE2CBA97596F4` |
| `linkx-fe/src/tokens/variables.css` | `7CF5BF056DED0FD77F72EB1E3007E4A439FC712C06DF8D3A1D53053924365F96` |
| `linkx-fe/src/styles/element-theme.css` | `C09B55D6857E00291198219FD92E6BB03E5D117A09150AC0F55BF29DA603A316` |
| `other-admin/admin-vue3/tests/unit/lx-transfer-panel.test.ts` | `91D6D98D6D8FDA43628BFBA3677972F20879841BB93ED6C967077F443AC1DDF7` |
| `other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts` | `F949A895691B5F2FEAACDD10E67502657C9815A4F7AFD567E9D82568FD2B80F0` |
