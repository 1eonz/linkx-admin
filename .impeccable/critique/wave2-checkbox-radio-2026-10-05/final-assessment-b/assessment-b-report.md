# Wave 2 LxRadio Assessment B

**评估方式**：由独立子代理 `/root/checkbox_radio_b_final` 完成 detector 与浏览器证据；本报告未读取 Assessment A 结论，不含综合评分。

## 范围

最终检查 `linkx-fe/src/components/LxRadio/demo/basic.vue`，浏览目标为 `/components/lxradio`。最新浏览器矩阵覆盖 `LxRadio` 与 `LxRadioGroup`；Checkbox 与 CheckboxGroup 的 16 张矩阵截图和 DOM 记录沿用同一独立评估早先取得的材料。

## 静态 Detector

Checkbox、CheckboxGroup、Radio、RadioGroup 四个组件源码目录的扫描均返回 JSON `[]`、空 stderr、退出码 `0`。完成 Radio Demo 最终修改后，再单独扫描 `LxRadio/demo/basic.vue`，仍为 JSON `[]`、空 stderr、退出码 `0`。具体三件套与汇总见同目录 `detector-*.stdout.json`、`detector-*.stderr.txt`、`detector-*.exit-code.txt` 和 `detector-summary.json`。`[]` 仅表示所扫源码目标没有命中静态规则，不代表运行页面无问题，也不单独构成 Critique 通过。

## 浏览器证据

本子代理的 Codex 内置浏览器无法显示，Edge connector 也不可用。评估改用隔离 Edge/CDP 页面和临时 profile 检查本地 VitePress 预览，没有复用用户浏览器标签，因此不声称用户浏览器出现了 `[Human]` 覆盖层。

Radio 与 RadioGroup 各完成八个视图：亮色桌面、HUD 深色、375px 触屏、亮色/深色禁用态、亮色/深色键盘焦点及减少动效。16 个视图均通过注入预检，detector 脚本均加载，预期 Demo 和目标节点均找到；文档没有横向溢出，没有 console 错误、运行时异常、失败请求或外部请求。触屏模拟确认无悬停/粗指针媒体条件；44px 标签触控高度另由通过的文档 E2E 断言覆盖。

垂直 Radio 组默认选中可用值 `encrypted`，禁用的 `satellite` 不会成为 Tab 入口；独立只读历史值行显示 `satellite` 已选且禁用。水平组改选 `emergency` 后，画面和 `aria-live="polite"` 均播报“应急处突”。交互截图为 `screenshots/LxRadio/interaction-live-status.png` 与 `screenshots/LxRadio/checked-disabled-light-desktop.png`。

## Overlay 核验

覆盖层截图已归档，但不代表当前用户浏览器中的 overlay。逐项检查如下：

- 页面级 em-dash 计数和布局属性过渡指向 VitePress/文档外壳，不是 Radio 控件缺陷。
- 长行标记框住页面引言；文字在桌面可读地换为两行，没有定位到 Radio 选项。
- 375px 下“overflow container”标记裁切的是 detector 固定提示条，文档与 Radio 内容仍留在视口内，无页面横向溢出。
- HUD 下 `ai color palette` 标记位于 Radio 选中态，实际值来自项目已记录的 Element Plus/HUD 主色令牌；属于设计令牌命中。
- “raster buried under wash”本轮无法定位到实际组件节点；控件未使用被遮罩的栅格图片，暂记为未确认的文档壳层/overlay 命中。

Detector 在整页累计的提示数量不是缺陷数量。Checkbox/Radio 与组控件的最终截图、DOM 数据、运行日志以及服务清理记录均保存在本目录；本代理启动的 4178 与 8400 已停止。
