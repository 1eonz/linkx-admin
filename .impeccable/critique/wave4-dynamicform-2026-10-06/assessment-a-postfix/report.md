# LxDynamicForm Post-fix Assessment A

Method: isolated Assessment A with an independent Edge browser process and fresh desktop/mobile contexts. This report contains design review and browser evidence only; it does not include Assessment B or detector output.

## Scope and Evidence

- Target: `linkx-fe/src/components/LxDynamicForm/index.vue`; live documentation route `http://127.0.0.1:4181/components/lxdynamicform.html`.
- Browser: Microsoft Edge 154.0.4258.53, fresh contexts at 1440×1000 and 375×812, reduced-motion preference enabled.
- The desktop viewport rendered a two-column form; the mobile viewport rendered one column. Neither document had horizontal overflow (1440/1440px desktop; 375/375px mobile).
- All 14 schema preview types rendered. Captures include the default form, validation error/success, each schema type, and remote-select error/retry/manual recovery/empty states.
- `index.vue` SHA-256 was `d5f5606af4a393828acf760acee288fdbc037c27ccc8278252ffa617bde08dde` before and after capture.
- Full-page documentation captures and isolated demo captures are indexed separately in `evidence-index.md`. One desktop console message reported a 404; its request URL was not captured, so it is not attributed to the component or included in scoring.

## Design Specificity

The example is grounded in a patrol-task workflow through labels such as task name, task type, officer, cover image, and field photos. The schema preview demonstrates actual LxDynamicForm types and host-injected remote/upload behavior. The composition still follows a familiar component-library form pattern, while the VitePress shell supplies most of the page identity. Verdict: moderately product-specific and clear, with room to make the demo's primary workflow more distinct from a generic form showcase.

## Heuristic Scores

| # | Heuristic | Score | Key evidence |
|---|---|---:|---|
| 1 | Visibility of system status | 3 | Validation, loading, empty, cancellation, and failure feedback are visible; preview retry produces no loading or recovery state. |
| 2 | Match between system and real world | 3 | Chinese task and officer terms are natural; “HUD” appears only in demo settings. |
| 3 | User control and freedom | 3 | Reset and query cancellation are available; the preview retry action is ineffective. |
| 4 | Consistency and standards | 3 | Fields use the Lx control family and consistent labels; expanded demo settings add a different density from the primary form. |
| 5 | Error prevention | 3 | Required fields, constrained choice controls, date validation, and defaults prevent common input errors. |
| 6 | Recognition rather than recall | 4 | Labels and placeholders stay beside fields; feedback is associated with the remote control through `aria-describedby`. |
| 7 | Flexibility and efficiency | 3 | Adaptive layout, selectable fixed columns, schema coverage, and search support different workflows; no expert accelerators are shown. |
| 8 | Aesthetic and minimalist design | 3 | The default state keeps settings and schema exploration collapsed; the upload examples add considerable vertical weight. |
| 9 | Error recovery | 1 | Clicking the visible remote-preview “重试” leaves the error in place on both tested viewports. |
| 10 | Help and documentation | 4 | The page documents schema fields, events, slots, instance methods, constraints, and a runnable example. |
| **Total** | | **30/40 — Good** | The main task is understandable; repair the broken recovery action before relying on it as a supported state. |

## Cognitive Load and Emotional Journey

Entry-state cognitive load is low. The eight primary fields form four visual row pairs, the submit action is distinct from reset, and both secondary panels are collapsed. The checklist's minimal-choice item fails when the demo settings are expanded: five remote-data simulation actions are visible together, and opening schema exploration exposes a long type list. That density is acceptable for a test/demo surface but should remain out of an operational form.

The initial journey is calm and predictable: labels, defaults, and the required marker make the first action apparent. Validation focuses the first missing field and confirms success after correction. The emotional low point is remote lookup failure: the error and retry are clear, but retry leaves the user in the same state without confirmation. A separate demo control can force success and return three options, but that is not a substitute for the promised retry path.

## What Works

1. Progressive disclosure keeps the primary task visible while lower-frequency layout, theme, mock-state, and schema controls stay out of the initial view.
2. The responsive form changes from two columns at desktop width to one at 375px without horizontal page overflow.
3. Field-level feedback is visually close to the remote selector, uses `role="alert"`, and its ID matches the control's `aria-describedby`; the docs explain the host-owned retry contract.

## Priority Issues

1. **[P1] Preview retry does not retry.** Trigger: open “字段类型预览”, select “远程选择”, open “演示设置”, choose “失败”, search “警官”, then click the field-level “重试”. At both 1440px and 375px the feedback remains “候选人员读取失败”; the demo “成功” mode stays unpressed. Manually selecting “成功” in demo settings and re-entering the query returns three candidates, confirming the page can recover through a separate control. Review the click path at `linkx-fe/src/components/LxDynamicForm/index.vue:250` and `linkx-fe/src/components/LxDynamicForm/index.vue:404`, together with the callback at `linkx-fe/src/components/LxDynamicForm/demo/basic.vue:357` and feedback construction at `linkx-fe/src/components/LxDynamicForm/demo/basic.vue:362`. Make the retry transition to loading and then success/error, preserve the query, and add an E2E assertion for that visible transition and recovered options. Suggested command: `/impeccable harden`.
2. **[P2] Error live-region semantics conflict.** The feedback uses `role="alert"` and explicitly sets `aria-live="polite"` at `linkx-fe/src/components/LxDynamicForm/index.vue:392`. This gives assistive technology mixed urgency signals when a remote lookup fails. Align the role and live setting, then verify with a screen reader or accessibility test. Suggested command: `/impeccable audit`.
3. **[P2, docs shell only] Sticky mobile docs navigation overlays the demo during scroll.** At 375px the “Menu / On this page” VitePress row crossed the form content in `mobile-375-default-collapsed-demo.png`. The form itself stayed one column and the page did not overflow horizontally. Verify the docs-shell sticky offset/scroll margin independently; this is not attributed to LxDynamicForm. Suggested command: `/impeccable adapt`.

## Persona Red Flags

- **Alex, power user:** The form's labels and defaults make direct entry quick, but after a failed remote lookup the obvious one-click retry does nothing. Alex must discover the demo-only simulation controls or change the query manually.
- **Jordan, first-timer:** Required-field feedback and focus make correction straightforward. A novice who trusts “重试” receives no change or confirmation and may conclude the form is stuck.
- **Sam, accessibility-dependent:** The remote input references the feedback ID and the retry is exposed as a named button. The failed retry gives no announced loading/result transition, and the alert/polite live-region combination should be made consistent.

## Minor Observations

- The large upload drop zones and two preloaded photo rows demonstrate capability but make the example long, especially on mobile. Keeping the type preview collapsed helps contain this cost.
- The documentation shell's sticky-navigation overlap is visually distinct from the component's own responsive layout; retain that ownership distinction in any follow-up.

## Questions to Consider

- Should retry be a component-level action with a tested loading/success contract, or remain entirely host-defined while the component only renders the callback?
- Would the 14-type preview be easier to scan if its choices were grouped by input, selection, date, and file behavior?
