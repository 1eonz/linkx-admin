# Assessment A 更正说明

复核对象仅为本轮 A 的 `08-narrow-375-viewport-errors.png`、`browser-evidence.json` 与 `capture-browser.mjs`。

## 结论

原报告中“375px 校验后固定文档导航遮住首个错误字段”的 P2 **撤回**，不以此证据改写成其他缺陷。全 viewport 截图显示固定的 `Menu / On this page` 栏位于顶部；其下方仍可见“任务名称”标签、错误输入框和“请输入任务名称”提示。

## 证据顺序

脚本先滚动到 Demo 并生成组件截图 `06-narrow-375-field-errors.png`（`capture()` 内先执行 `scrollIntoViewIfNeeded()`），再直接生成 viewport 截图 `08-narrow-375-viewport-errors.png`，随后才调用 `measure()` 写入 `browser-evidence.json`。两者之间没有滚动或交互操作，因此该测量是在 viewport 截图之后、同一页面状态下取得。

测量记录的 viewport 是 `375×812`；首字段 `getBoundingClientRect().y` 为 `377`，错误文案为“请输入任务名称”，`activeElement.label` 为“任务名称”。该 y 值相对 viewport，首字段及错误提示均在视口范围内，也与截图一致。

## 对原报告的影响

- 删除“固定导航遮挡首个错误字段”这一优先问题；不计入 P2 数量。
- 情绪路径应描述为：校验保留数据并将焦点移到首个错误，当前证据显示该错误可见。
- Sam、Casey 的 persona 不再记录导航遮挡问题。移动端输入控件实测 30px 高仍是独立的触达尺寸观察。
- `31/40` 分数维持；第 9 项的 3 分应由通用必填错误文案缺少字段特定原因/修复细节支撑，而非导航遮挡。第 4 项的 3 分是保守评分，不依赖此项。

未修改产品源码，也未查看 Assessment B 或 detector 证据。
