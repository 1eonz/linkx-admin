---
target: input/select/textarea focus alignment
total_score: 35
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:F:\\work\\linkx-admin\\linkx-fe\\src\\components\\LxForm\\style.css"
target_fingerprint: "sha256:d7cdb034e1859c28d8829a119e06c434a2410017d9f5e934a0ae9e704b508afa"
target_path: "F:\\work\\linkx-admin\\linkx-fe\\src\\components\\LxForm\\style.css"
timestamp: 2026-09-28T02-28-51Z
slug: linkx-fe-src-components-lxform-style-css
---
Method: dual-agent (A: /root/bridge_design_review · B: /root/bridge_browser_final)

## Review Scope

This is a focused review of the Element Plus input, select, and textarea keyboard-focus treatment on the Element Bridge page. It does not represent the pending lx-ui library-wide review or Vue3 host-page review.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 4 | Focus and validation remain visually distinguishable. |
| 2 | Match System / Real World | 4 | Standard form controls use familiar focus and error signals. |
| 3 | User Control and Freedom | 3 | Native keyboard focus works; no task-specific shortcut is needed. |
| 4 | Consistency and Standards | 4 | Input, select, and textarea share one focus treatment. |
| 5 | Error Prevention | 3 | Required-field validation is visible; contrast needs follow-up. |
| 6 | Recognition Rather Than Recall | 4 | Fields have visible labels and nearby validation text. |
| 7 | Flexibility and Efficiency | 3 | Keyboard navigation is available; no expert accelerator is needed here. |
| 8 | Aesthetic and Minimalist Design | 4 | The focus halo meets the control edge and does not resize it. |
| 9 | Error Recovery | 3 | Errors are shown beside fields and preserve the form surface. |
| 10 | Help and Documentation | 3 | A dedicated bridge page explains the control behavior. |
| **Total** |  | **35/40** | **Good** |

## Design Specificity Verdict

**LLM assessment:** The treatment fits LinkX's administrative form system: the control's own 1px state border is paired with a close 2px, 15% primary-color halo, while validation keeps its red border. The focused state no longer reads as a second, detached blue frame. It is specific to the shared Element Plus bridge tokens and remains consistent across input, select, and textarea.

**Deterministic scan:** `detect.mjs --json linkx-fe/docs/components/element-bridge.md` returned `[]`, stderr was empty, and exit code was `0`. This is a clean static scan of the Markdown target only. Browser overlay screenshots show labels for bounce/elastic easing, height/padding transitions, a long introductory paragraph, low-contrast helper/placeholder text, a select-popup occlusion label, and palette labels on selected controls. Raw browser-console text and reliable per-view counts were not preserved, so no exact overlay count is claimed.

## Overall Impression

The requested alignment is achieved. At 1280×900 and 375×844, the input and select focus rings sit immediately beside the control border, error red remains visible, and control dimensions stay stable. The remaining user-visible concern is contrast in adjacent placeholder and validation text, not the focus edge itself.

## What's Working

- The primary-color halo is attached to the component edge with no offset outline or visible gap.
- Error focus keeps the red 1px inner border and uses the primary halo to indicate focus independently.
- Keyboard focus does not change the measured control size; the desktop and narrow viewport states remain within the viewport.

## Priority Issues

**[P2] Validation and placeholder text are below text contrast guidance.** The detector's low-contrast labels map to actual text: `#c45656` error copy is 4.36:1 on white and `#c9cdd4` placeholder text is 1.59:1 on white. Visible field labels reduce reliance on placeholders, but validation copy remains important feedback for low-vision users. Review the shared text tokens, retain the intended hierarchy, and add a browser contrast assertion. Suggested command: `/impeccable harden`.

## Persona Red Flags

- **Alex (Power User):** No focus-specific red flag. Tab navigation reaches input and select controls, and focus does not shift their size.
- **Jordan (First-Timer):** Field labels and nearby validation messages are discoverable. The pale placeholder is not the only label, but may be difficult to read.
- **Low-vision user:** The primary focus border is clear in the inspected screenshots; low-contrast placeholder and error copy may be missed.

## Cognitive Load and Emotional Journey

The page is a component specimen with several grouped controls, not a task workflow. The button variants and form groups are scannable, with no ungrouped decision set over four options. Focus provides a steady location cue, and the error color remains visible; faint helper text weakens reassurance after validation.

## Minor Observations

- The HUD palette labels point to the documented `--lx-color-primary: #0060a9` selection color and are false positives for this product.
- The orange “text occluded” callout itself covers the select option in the screenshot; the page is not proven to occlude that label.
- The long-line label targets the documentation introduction. The easing and height/padding transition labels are outside the focus-border rule and need separate review if they affect a shipped workflow.
- Forced-colors mode was not covered in this pass.

## Questions to Consider

Should the low-contrast error/placeholder tokens be handled as a separate accessibility task before the library-wide UI-11 review, or included in that review's bounded fix batch?
