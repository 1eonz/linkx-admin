# Assessment A Browser Evidence

Capture target: `http://127.0.0.1:4181/components/lxdynamicform.html`  
Browser: Microsoft Edge 154.0.4258.53  
Contexts: desktop 1440×1000; mobile 375×812; reduced motion enabled  
Capture time: 2026-10-06 05:07:32–05:07:55 UTC  
Source hash stable: `linkx-fe/src/components/LxDynamicForm/index.vue` = `d5f5606af4a393828acf760acee288fdbc037c27ccc8278252ffa617bde08dde`

`*-page.png` files show the full VitePress documentation page. `*-demo.png` files crop the live demo region; sticky documentation navigation can remain visible in a scrolled mobile crop, so shell effects are identified separately from component behavior. Schema screenshots show the schema-preview panel only.

Capture program: `capture-assessment-a.mjs`  
Structured measurements and interactions: `browser-evidence.json`
Server stop record: `server-stop.txt`

| Scenario | Screenshots |
|---|---|
| Desktop default, preview collapsed | `desktop-default-collapsed-page.png`, `desktop-default-collapsed-demo.png` |
| Desktop required-field error and corrected submission | `desktop-validation-error-page.png`, `desktop-validation-error-demo.png`, `desktop-validation-success-page.png`, `desktop-validation-success-demo.png` |
| Desktop default number preview | `desktop-preview-number-page.png`, `desktop-preview-number-demo.png` |
| Schema preview types | `desktop-schema-input.png`, `desktop-schema-password.png`, `desktop-schema-textarea.png`, `desktop-schema-number.png`, `desktop-schema-select.png`, `desktop-schema-remote-select.png`, `desktop-schema-tree-select.png`, `desktop-schema-date.png`, `desktop-schema-daterange.png`, `desktop-schema-switch.png`, `desktop-schema-radio.png`, `desktop-schema-checkbox.png`, `desktop-schema-upload.png`, `desktop-schema-slot.png` |
| Desktop remote preview failure | `desktop-remote-preview-error-page.png`, `desktop-remote-preview-error-demo.png` |
| Desktop failed retry, still in error | `desktop-remote-preview-retry-noop-page.png`, `desktop-remote-preview-retry-noop-demo.png` |
| Desktop manual recovery via demo success control | `desktop-remote-preview-recovered-page.png`, `desktop-remote-preview-recovered-demo.png` |
| Desktop empty response | `desktop-remote-preview-empty-page.png`, `desktop-remote-preview-empty-demo.png` |
| Mobile 375px default, preview collapsed | `mobile-375-default-collapsed-page.png`, `mobile-375-default-collapsed-demo.png` |
| Mobile 375px default preview and date range | `mobile-375-preview-number-page.png`, `mobile-375-preview-number-demo.png`, `mobile-375-schema-daterange-page.png`, `mobile-375-schema-daterange-demo.png` |
| Mobile 375px remote preview failure | `mobile-375-remote-preview-error-page.png`, `mobile-375-remote-preview-error-demo.png` |
| Mobile failed retry, still in error | `mobile-375-remote-preview-retry-noop-page.png`, `mobile-375-remote-preview-retry-noop-demo.png` |
| Mobile manual recovery via demo success control | `mobile-375-remote-preview-recovered-page.png`, `mobile-375-remote-preview-recovered-demo.png` |

The two `retry-noop` captures are the direct evidence for the P1 finding. The `recovered` captures follow an explicit click on the demo's separate “成功” control; they are not evidence that the retry button recovered.
