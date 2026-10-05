Method: bounded isolated Assessment A-only post-fix recheck (new system Chrome/Playwright BrowserContext; no Assessment B, detector, or synthesis report)

# LxSwitch 修后确认

## 目标与范围

- 目标页面：`http://127.0.0.1:4195/components/lxswitch.html`，标题“LxSwitch 状态开关 | LxUI”。
- 当前对照：`linkx-fe/src/components/LxSwitch/demo/basic.vue`、`linkx-fe/docs/components/lxswitch.md`、`linkx-fe/docs/.vitepress/theme/custom.css`。
- 目标版本：2026-10-05 当前工作区由本地服务提供的页面。页面未显示构建号或提交 SHA，本报告只绑定本次观察到的工作区版本。
- 浏览器：系统 Chrome + 新 Playwright BrowserContext；375×900 窄屏与 1440×1050 桌面。截图在本目录。
- 本轮只确认指定修复，不重跑其他场景。未运行真实读屏器；DOM 结果能确认描述关联，不代替 NVDA/VoiceOver 验收。未读取任何 Assessment B、detector 或综合报告，也未运行 detector。

## 修后 A-only 评分

**32/40，Good。** 这是有界更新分：以先前 A-only 观察的 29/40 为基线，本次关闭三个已记录问题，对应系统控制、内容识别和窄屏简约性各提升 1 分。其他启发式分数沿用基线，本轮没有重新检查它们；这不是一次全量复审。

| 本轮复评启发式 | 修后分数 | 依据 |
|---|---:|---|
| 用户控制与自由 | 4/4 | HUD label 在 375px 下可点击区域为 190×44px，达到窄屏触控高度要求。 |
| 识别而非回忆 | 4/4 | 禁用开关的描述关联到明确的锁定原因文本。 |
| 美观与简约 | 4/4 | 7 行 Props 的类型和默认值列在窄屏起点稳定，长类型只在本列内换行。 |

## 已关闭项

1. **375px Props 对齐：通过。** 七行类型字段的 x 起点全为 24px，默认值字段的 x 起点全为 194px。`modelValue` 类型文字可在本列内折行，不会挤动默认值列。桌面 1440px 下七行也分别固定在 x=547px 与 x=818px。
2. **禁用原因可访问描述：通过。** 锁定开关渲染的原生控件带有 `aria-describedby="upper-lock-reason"`；该 id 对应文本为“受上级指令系统锁定，本级不可改动”。本轮确认了 DOM 属性及目标文本，未使用真实读屏器试听。
3. **HUD label 触控高度：通过。** 375px 下 label 实测 190×44px。
4. **根级横向溢出：通过。** 375px 下 `documentElement.clientWidth`、`documentElement.scrollWidth`、`body.scrollWidth` 均为 375px，`scrollX` 为 0。页面根部没有横向溢出。

## 当前发现

本轮指定范围内没有仍待处理的问题。移动 Props 全部稳定纵向排列名称与详情，元数据采用固定两列；示例行没有引起页面根部扩宽。

## 截图

- `mobile-375-props.png`：375px 下完整 Props 字段区域。
- `mobile-375-controls.png`：375px 下 HUD 主题 label 与开关示例状态。
- `desktop-1440-props.png`：1440px 下 Props 桌面列位置。

本轮没有修改产品源码；临时浏览器脚本已清理，只留下报告和截图。
