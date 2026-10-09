# Assessment A 证据索引

## 评审边界

- 评审面：`linkx-fe` 中的 LxDynamicForm、LxDatePicker、LxUpload 及三份对应文档。
- 来源：当前工作树、`http://127.0.0.1:4174` 和新的 Playwright/Google Chrome 浏览器 context。没有打开既有浏览器标签。
- Assessment A 与 Assessment B 保持隔离；本索引不包含 detector 结果或旧评审材料。
- 页面尺寸：桌面 `1440 × 1000`，移动 `375 × 812`；检查浅色和 HUD 深色主题。
- 交互来源：文档 Demo 自带的内存 Mock；没有向真实后端发送上传请求。

## 浏览器证据

结果机读副本：[browser-evidence.json](browser-evidence.json)。脚本：[capture-assessment-a.mjs](capture-assessment-a.mjs)。

32 张截图：

| 范围 | 截图 |
|---|---|
| DynamicForm 桌面浅色 | [首屏](screenshots/dynamic-desktop-light-top.png)、[必填校验](screenshots/dynamic-desktop-light-validation.png)、[文本类](screenshots/dynamic-desktop-light-types-1.png)、[单值选择](screenshots/dynamic-desktop-light-types-2.png)、[日期与数值](screenshots/dynamic-desktop-light-types-3.png)、[多值与扩展](screenshots/dynamic-desktop-light-types-4.png) |
| DynamicForm HUD 与移动 | [桌面 HUD](screenshots/dynamic-desktop-hud-types.png)、[移动首屏](screenshots/dynamic-mobile-light-top.png)、[移动校验](screenshots/dynamic-mobile-light-validation.png)、[移动分类类型](screenshots/dynamic-mobile-light-category-options.png)、[移动 HUD](screenshots/dynamic-mobile-hud.png) |
| DatePicker 桌面 | [浅色文档与示例全页](screenshots/date-desktop-light-overview.png)、[浅色双月弹层](screenshots/date-desktop-light-range-open.png)、[HUD 双月弹层](screenshots/date-desktop-hud-range-open.png) |
| DatePicker 移动 | [浅色首屏](screenshots/date-mobile-light-overview.png)、[浅色单月弹层](screenshots/date-mobile-light-range-open.png)、[HUD 单月弹层](screenshots/date-mobile-hud-range-open.png)、[HUD 校验示例](screenshots/date-mobile-hud-validation.png) |
| Upload 桌面 | [空闲态](screenshots/upload-desktop-light-idle.png)、[失败态](screenshots/upload-desktop-light-failure.png)、[重试成功](screenshots/upload-desktop-light-recovered.png)、[HUD 重试成功](screenshots/upload-desktop-hud-recovered.png) |
| Upload 移动 | [空闲态](screenshots/upload-mobile-light-idle.png)、[长文件名失败态](screenshots/upload-mobile-light-failure.png)、[重试成功](screenshots/upload-mobile-light-recovered.png)、[HUD 重试成功](screenshots/upload-mobile-hud-recovered.png) |
| 三份组件文档 | [DynamicForm 桌面全页](screenshots/doc-dynamic-desktop-light-full.png)、[DynamicForm 移动首屏](screenshots/doc-dynamic-mobile-top.png)、[DatePicker 桌面全页](screenshots/doc-date-desktop-light-full.png)、[DatePicker 移动首屏](screenshots/doc-date-mobile-top.png)、[Upload 桌面全页](screenshots/doc-upload-desktop-light-full.png)、[Upload 移动首屏](screenshots/doc-upload-mobile-top.png) |

## 可观察交互

- DynamicForm 空表单提交显示 `请输入任务名称`、`请输入访问密码`、`请选择任务类型` 三条字段错误。
- 字段类型菜单按 `文本类字段 3 / 单值选择 4 / 日期与数值 3 / 多值、状态与扩展 4` 分类；375px 下最后一类仍显示 4 项。
- DatePicker 桌面打开 1 个双月区间面板；375px 打开 1 个单月面板。
- Upload Mock 首次失败显示 `上传服务暂不可用，请重试`，文件保留；点击“重新上传”后状态变为 `排班导入.csv 上传成功`。
- 浏览器异常：`console.error` 3 条，分别为缺失 `/favicon.ico` 的 404 和 2 条预期 Mock 失败事件；`pageerror` 0 条，Playwright `requestfailed` 0 条。额外独立页面复查确认 404 URL 为 `/favicon.ico`。

## 冻结 SHA-256

以下 14 个受评文件在报告定稿前以 `Get-FileHash -Algorithm SHA256` 再次核对。14 项由 3 个组件入口、2 个独立样式表、3 个类型、3 个 Demo 和 3 份文档组成。

| 文件 | SHA-256 |
|---|---|
| `linkx-fe/src/components/LxDynamicForm/index.vue` | `26C1B19646D89F4AE9566F32B742D60088AEC817CDE0D2462B7A0CDD7C6E748C` |
| `linkx-fe/src/components/LxDynamicForm/style.css` | `FEA68097BD48ED0C28AD30E2A76272CA7554649C334B430FE6E5ADD7FBCA4B1E` |
| `linkx-fe/src/components/LxDynamicForm/types.ts` | `1996839E87702DA19C39C29062153C98B6F425B78DBAE5E96C5DA054C90C588C` |
| `linkx-fe/src/components/LxDynamicForm/demo/basic.vue` | `3EC13BF4D66996589670B536FF6EB5C7B2402779F5F150C132B4F19F2C8EC27D` |
| `linkx-fe/src/components/LxDatePicker/index.vue` | `6B3E98DD0A0B6AFEECE68CF39A47B0CAC7D5C8BE309058AA6EF8B6AA69DE30AD` |
| `linkx-fe/src/components/LxDatePicker/style.css` | `E989B53ED4A60137DBF0AF6852CE14A960102C7B1D1E5A7605372B27A8240EA8` |
| `linkx-fe/src/components/LxDatePicker/types.ts` | `3A473EAD1EA9E9359C1DABEBE807298C075AF2F1814C5DB2D48CAA9A6DF4EFA9` |
| `linkx-fe/src/components/LxDatePicker/demo/basic.vue` | `2C48B5B1BE0F394D8C33BB511BB47C0F829BD347F2284DB720356F68C2AA0155` |
| `linkx-fe/src/components/LxUpload/index.vue` | `4507FAEF58121F8FD6EBAE4526D398BE72628EF0300394F7FADAC1343E0EC640` |
| `linkx-fe/src/components/LxUpload/types.ts` | `17F77F463F824590C850CE4479BD57A0A619D4CF7F3FB492CEA8B361D8BFF355` |
| `linkx-fe/src/components/LxUpload/demo/basic.vue` | `4A2E7D186717591668147779EF820E8CA75A76603CDB06C8368FD148DD4DD315` |
| `linkx-fe/docs/components/lxdynamicform.md` | `C04197AF5182CC2F4FB778AA96BDC55C99902AE211FDFE1E7215B570FEF48D41` |
| `linkx-fe/docs/components/lxdatepicker.md` | `DDA2B1F674B2811D63CEC50853E8280198DD14E98CBD891531F0A5E73686A6EB` |
| `linkx-fe/docs/components/lxupload.md` | `CBAB34D859358167DF599464ACEFFEDA08FB14E2B1AF56C51A358A8F52D617E4` |

联动依赖单独记录，不计入 14 个受评文件：

| 文件 | SHA-256 |
|---|---|
| `linkx-fe/src/components/LxForm/LxFormItem.vue` | `04720D69BFF3037CA06B6718ABEDDC8BAC588C9153E59B965A44BAF985D54D0D` |

## 清理

- 独立 Playwright context 和它启动的 Chrome 已关闭。
- 本评审临时启动的 `4175` VitePress 进程已通过所属 exec session 的 Ctrl+C 关闭。
- 用户要求保留的 `4174` 服务仍监听在 `127.0.0.1:4174`，当前 PID 为 `11140`；没有向它发送停止信号。
- 没有修改产品源码、组件 Demo 或文档内容；本目录只新增评审脚本与评审证据。
