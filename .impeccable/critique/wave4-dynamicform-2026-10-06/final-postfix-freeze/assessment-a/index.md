# Assessment A 证据索引

目标：`http://127.0.0.1:4174/components/lxdynamicform.html`  
报告：[assessment-a-report.md](assessment-a-report.md)  
浏览器：Chrome 154，无痕上下文、新建标签  
视口：桌面 1440×1100；移动 375×812 CSS px、device scale factor 2  
冻结哈希：起始 34/34 匹配；结束 34/34 匹配；0 个差异，详见 [hash-verification.json](hash-verification.json)。

浏览器进程已由 DevTools `Browser.close` 关闭；复核到匹配该 profile 的进程数为 0、调试端口监听数为 0。临时 profile 按父线程要求保留：`C:\Users\Administrator\AppData\Local\Temp\linkx-assessment-a-86a9b4b96e9244b185d1744e23aebaad`。

## 截图

| 文件 | 视口/状态 | 证据 |
|---|---|---|
| [01-desktop-initial.png](01-desktop-initial.png) | 桌面，页面顶部 | 文档站层级、组件侧栏、标题和最小配置代码。 |
| [02-mobile-initial.png](02-mobile-initial.png) | 375px，页面顶部 | 窄屏标题、顶部导航和正文换行。 |
| [03-mobile-main-nav-open.png](03-mobile-main-nav-open.png) | 375px，顶部主导航展开 | “首页 / 组件 / 新增组件”和外观切换实际显示。 |
| [04-mobile-sidebar-open.png](04-mobile-sidebar-open.png) | 375px，组件侧栏展开 | 中文分类、长组件入口列表和侧栏抽屉。 |
| [05-mobile-demo-top.png](05-mobile-demo-top.png) | 375px，交互示例默认态 | 默认折叠演示设置、单列字段和表单分组。 |
| [06-desktop-demo-settings.png](06-desktop-demo-settings.png) | 桌面，演示设置展开 | 列数控制、候选项状态单选组、主表单及附件布局。 |
| [07-desktop-remote-error.png](07-desktop-remote-error.png) | 桌面，远程失败 | “负责人”字段的失败文案和重试入口。 |
| [09-desktop-remote-retried.png](09-desktop-remote-retried.png) | 桌面，点击重试后 | 负责人字段级失败反馈已清除。 |
| [11-desktop-form-actions.png](11-desktop-form-actions.png) | 桌面，表单末尾 | 附件列表之后的“提交校验/重置”操作区。 |
| [12-desktop-form-errors.png](12-desktop-form-errors.png) | 桌面，提交空表单后 | 两条必填错误就近显示，焦点移到任务名称。 |
| [13-desktop-date-type-options.png](13-desktop-date-type-options.png) | 桌面，类型选择器展开 | “日期范围”等 14 个可选类型。 |
| [14-desktop-date-range-preview.png](14-desktop-date-range-preview.png) | 桌面，日期范围已选择 | 两个端点和当前值 2026-10-01 至 2026-10-06。 |
| [15-desktop-upload-failure.png](15-desktop-upload-failure.png) | 桌面，上传失败 | 合成 PNG 文件失败状态、错误文字和“重新上传”按钮。 |
| [16-desktop-upload-retried.png](16-desktop-upload-retried.png) | 桌面，点击重新上传后 | 同一文件状态变为上传成功。 |
| [17-mobile-form-actions.png](17-mobile-form-actions.png) | 375px，表单末尾 | 单列附件区、已上传文件和手机操作按钮位置。 |
| [18-mobile-form-errors.png](18-mobile-form-errors.png) | 375px，提交空表单后 | 两条必填错误、首字段聚焦和无横向溢出。 |

## 交互记录

- 中文主导航和侧栏抽屉分别打开；当前页面导航按钮没有单独展开复核。
- 空表单校验后，桌面和移动均观察到任务名称、访问密码错误；焦点落到任务名称字段。
- 远程候选失败态和点击重试后的恢复已观察。加载中、空结果和取消中的画面未验证。
- 日期范围两个端点和字段值已观察；开始日期晚于结束日期时的行为未验证。
- 上传失败由本地临时合成 PNG 触发，点击“重新上传”后变为成功；未访问真实上传后端。
- 屏幕阅读器播报、完整键盘路径、颜色对比度和离开页面后的草稿保留未验证。

## 哈希检查

冻结源文件清单：`../source-hashes-freeze.json`  
起始：34 个文件检查，0 个差异。结束：34 个文件检查，0 个差异。报告、索引和截图保存在本评审目录，不属于 34 个被冻结源文件。
