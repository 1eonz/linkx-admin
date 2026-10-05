# LxSelect Assessment B 最终复核

日期：2026-10-05；目标：`linkx-fe/src/components/LxSelect/index.vue`、`linkx-fe/src/components/LxSelect/demo/basic.vue` 及 `http://127.0.0.1:4174/components/lxselect.html`
结论：静态 detector 为零命中，CUA 浏览器交互复核已完成；由于未能执行 overlay mutation、独立 overlay 视图检查和快照保存，本次只能记录为降级检查，不能标记正式 Impeccable Critique 通过。

## 静态 detector

官方 detector 在最新 Demo 修改后重新对组件入口和 Demo 执行。两项 stdout 均为 JSON `[]`，stderr 均为空，进程退出码均为 `0`。结果分别保存在：

- `detect-index.stdout.json`、`detect-index.stderr.txt`、`detect-index.exit-code.txt`
- `detect-demo-basic.stdout.json`、`detect-demo-basic.stderr.txt`、`detect-demo-basic.exit-code.txt`

`[]` 只表示对应源码目标没有命中 detector 的静态规则，不代表页面不存在问题，也不代表 Critique 通过。

## 浏览器结果

4174 页面可用。最新修改后的 Demo 已现场复核：新增的“反恐怖与特巡警支队（离线）”标记 disabled，点击不会改变已选值；选择“分局合成作战中心”后显示 `+1`。远程失败空态显示“请求失败，未加载候选项”，外层仍有“远程检索暂时失败，请重试。”；重试后模拟值恢复成功并出现本地候选警员。键盘单选亦能改变并播报选中值。详细操作、窄屏观察、服务状态和证据限制记录于 `browser-evidence.md`。

320px 截图显示底部横向滚动条，但尚未确定来源；390px 截图未见横向滚动条。减少动效没有实际切换验证。CUA 控制台只能保存为摘要，不能作为原始日志审阅。

## 评审建议状态

- Assessment A 的环境阻塞已解除：4174 在复核期间可用；正式浏览器 overlay 验收仍受 CUA 页面写入限制阻塞。
- Assessment A 提到的错误态可能被理解为正常无匹配。最新 Demo 将空态改成“请求失败，未加载候选项”，并保留原因提示与重试；本次确认页面呈现新文字，原有歧义已降低。错误提示和空态仍同时说明失败，后续可按文案规范决定是否继续收敛。
- Assessment A 提到的单项禁用原因与整只控件禁用属于不同状态。最新 Demo 已新增“反恐怖与特巡警支队（离线）”禁用候选项；本次确认 disabled 语义和不可选行为。
- 本次没有修改产品源码，也没有据 detector 零命中结果关闭以上建议。

## 正式 Critique 限制

CUA 原生交互接口不提供页面脚本注入能力。本次没有通过 Playwright、CDP 或其他路径绕开限制；没有对浏览器页面写入、注入 overlay 或创建 overlay 截图。因此缺少 Assessment B 要求的独立 overlay 视觉证据、逐主题/状态 overlay 记录和 `.impeccable/critique` 正式快照，结论按降级检查处理。
