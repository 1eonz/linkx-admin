# Assessment A 截图索引

截图均来自 `http://127.0.0.1:4174/components/lxdynamicform.html` 的单轮浏览器采集；浏览器上下文关闭后完成源文件哈希复核。可复用浏览器记录见 [browser-evidence.json](./browser-evidence.json)。

| 文件 | 视口/状态 | 评审用途 |
|---|---|---|
| [desktop-light-page.png](./desktop-light-page.png) | 1440px，文档整页 | 文档信息架构、长页密度、桌面整体布局 |
| [desktop-light-demo.png](./desktop-light-demo.png) | 1440px，默认 Demo | 默认表单、字段分组、上传组件 |
| [desktop-settings-and-preview.png](./desktop-settings-and-preview.png) | 1440px，展开设置及字段预览 | 渐进披露、示例配置与可选状态 |
| [desktop-validation-error-page.png](./desktop-validation-error-page.png) | 1440px，必填校验错误整页 | 任务信息区错误位置和文字反馈 |
| [desktop-validation-error-demo.png](./desktop-validation-error-demo.png) | 1440px，必填校验错误 Demo | 字段级错误与提交反馈 |
| [desktop-validation-success-demo.png](./desktop-validation-success-demo.png) | 1440px，表单成功反馈 | 成功状态与表单操作区关系 |
| [desktop-upload-in-progress.png](./desktop-upload-in-progress.png) | 1440px，单文件上传中 | 上传进度和取消入口 |
| [desktop-upload-cancelled.png](./desktop-upload-cancelled.png) | 1440px，上传已取消 | 取消后状态 |
| [desktop-upload-failed.png](./desktop-upload-failed.png) | 1440px，Mock 上传失败 | 错误颜色、提示文案与重新上传入口 |
| [desktop-upload-retry-success.png](./desktop-upload-retry-success.png) | 1440px，重试成功 | 失败恢复与成功反馈 |
| [desktop-multiple-upload-success.png](./desktop-multiple-upload-success.png) | 1440px，多文件上传成功 | 多文件列表、数量和移除控件 |
| [desktop-remote-select-preview.png](./desktop-remote-select-preview.png) | 1440px，远程选择字段预览 | 候选字段状态演示 |
| [desktop-candidate-preview-error.png](./desktop-candidate-preview-error.png) | 1440px，候选读取失败 | 错误信息及重试动作 |
| [desktop-candidate-preview-recovered.png](./desktop-candidate-preview-recovered.png) | 1440px，候选预览恢复 | 重试后的恢复状态 |
| [mobile-375-light-page.png](./mobile-375-light-page.png) | 375px，文档整页 | 窄屏文档布局与整页宽度 |
| [mobile-375-light-demo.png](./mobile-375-light-demo.png) | 375px，默认 Demo | 单列表单、移动文档导航叠层及触控布局 |

以下状态没有成功采集，未生成截图：桌面 HUD、主表单负责人候选失败/空结果、移动 HUD、日期范围日历及已选范围。不要从相邻截图推断这些状态。
