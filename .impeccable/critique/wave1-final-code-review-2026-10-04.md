# Wave 1 六组件代码复审

复审基线：`48d62ff704eb7f7f09025ef165a19678840ea928`（当前 HEAD）

范围：`LxButton`、`LxActionButtons`、`LxInput`、`LxTextarea`、`LxInputNumber`、`LxPasswordInput` 的实现、类型、Demo、中文 API 文档及相关单测和文档 E2E。按任务边界，本次未读取 Assessment A/B 或 detector 报告，也未修改产品源码。

## 发现

### [P1] `type` 透传可绕过密码遮罩

位置：`linkx-fe/src/components/LxPasswordInput/index.vue:82`、`linkx-fe/src/components/LxPasswordInput/index.vue:93`

组件先把内部显隐状态绑定到 `LxInput` 的 `type`，随后再展开 `$attrs`。`type` 未列入 `LxPasswordInputProps`，因此调用者传入的同名未声明属性会后写并覆盖受控值。复现：`<LxPasswordInput type="text" />`；即使显隐按钮仍显示“显示密码”，原生输入框实际为 `type="text"`，密码内容直接明文可见。

这与 [lxpasswordinput.md](../../linkx-fe/docs/components/lxpasswordinput.md) 第 36 行“组件固定以密码类型渲染”的公开契约冲突。临时 Vue Test Utils 探针确认了覆盖结果，探针文件已删除。现有单测和 E2E 验证默认密码类型与显隐按钮，但没有覆盖传入 `type` 的场景。

## 验证

- 六个目标单测：6 个文件、60 项通过。命令：`pnpm exec vitest run tests/unit/lx-button.test.ts tests/unit/lx-action-buttons.test.ts tests/unit/lx-input.test.ts tests/unit/lx-textarea.test.ts tests/unit/lx-input-number.test.ts tests/unit/lx-password-input.test.ts`
- 相关文档 E2E：17 项通过，覆盖按钮、操作按钮、密码框、Input、InputNumber 和 Textarea；该套件还运行了 Select 与 DatePicker 场景。命令：`pnpm exec playwright test --config=playwright.lxui.config.ts tests/e2e/lx-button-docs.spec.ts tests/e2e/lx-action-buttons-docs.spec.ts tests/e2e/lx-password-input-docs.spec.ts tests/e2e/lx-base-controls-docs.spec.ts --reporter=list`
- 另用临时探针验证文本域随父级更新 `id` 后仍将新值同步到原生控件；未发现该路径缺陷，探针已删除。

## 结论

发现 1 项 P1，建议先阻止未声明的 `type` 覆盖密码类型并补充回归测试，再复审该边界。其余已检查的目标路径未发现同等级问题；上述测试通过不代表真实后端联调或 Impeccable 视觉评审完成。
