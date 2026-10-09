# 兼容别名表修后复验

## 范围与基线

- 目标：`http://127.0.0.1:4174/components/lxicons.html`，三个视口均返回 HTTP 200。
- 方法：全新 Edge/Playwright context，检查 1440、375、320px 下的浅色、深色和 HUD 状态；本次仅复验兼容别名表。
- 源文档：`linkx-fe/docs/components/lxicons.md`。
- 源文档 SHA-256：`96DC323B1DE1A4039F817BFE60A399A3052F42CD098A98912F74B4AC05043D54`。采集前后与当前文件哈希一致。此前 Assessment A 报告没有记录源文档哈希，故无旧值可逐项比较。
- 分数基线仍为此前 Assessment A 的 34/40；本次不重新评分。

## 结果

| 视口 | 表格区域宽度 | 表格内容宽度 | 局部横向滚动 | 提示 | 页面横向溢出 |
| --- | ---: | ---: | --- | --- | --- |
| 1440px | 686px | 686px | 无需滚动 | 隐藏 | 无 |
| 375px | 325px | 520px | 可滚动 | 显示 | 无 |
| 320px | 270px | 520px | 可滚动 | 显示 | 无 |

三个主题下表格均保持在自身区域滚动，文档没有页面级横向溢出，也没有浏览器页面错误。320px 下开始位置能看到“名称、标准图形、来源”列；滚至末端后“说明”列内容完整可读。375px 和 320px 下的提示均可见。

运行页面中的区域具有 `role="region"`、名称“兼容别名对应关系”及 `tabindex="0"`。`aria-describedby="icon-alias-table-hint"` 在三个视口均解析到提示“窄屏可在表格区域横向滚动查看完整说明。”；320px 键盘聚焦显示 2px 可见轮廓，按 `ArrowRight` 会滚动表格区域，滚至末端的 `scrollLeft` 为 250px。375px 的末端 `scrollLeft` 为 195px。

## 结论与边界

原窄屏表格挤压与页面溢出问题通过局部横向滚动得到解决；本次 320px 复验也确认新增的提示关联在运行页面生效。保存的浏览器证据包含 14 张截图及逐视口 DOM/滚动数据，重点截图为 `alias-region-mobile-320-light.png`、`alias-region-mobile-320-light-scroll-end.png`、`alias-region-mobile-320-dark.png`、`alias-region-mobile-320-hud.png` 和 `mobile-320-light-fullpage.png`。

按既定范围未运行 detector、E2E/单测，也未读取 Assessment B 或代码复审材料；因此新增 E2E 断言尚未由本次执行验证。屏幕阅读器和真实触屏设备未做人工验收。
