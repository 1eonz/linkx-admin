---
target: ColForm collaboration create/edit form
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:F:\\work\\linkx-admin\\other-admin\\admin-vue3\\src\\views\\collaboration\\components\\ColForm.vue"
target_fingerprint: "sha256:f1f0ac845cd8455845bd33a054d410ad6647aad3cfcadfc0b027021eb2309b7f"
target_path: "F:\\work\\linkx-admin\\other-admin\\admin-vue3\\src\\views\\collaboration\\components\\ColForm.vue"
timestamp: 2026-09-29T02-28-54Z
slug: ue3-src-views-collaboration-components-colform-vue
---
Method: dual-agent (A: /root/colform_luna_a_recheck · B: /root/colform_luna_b_recheck)

# ColForm Critique

Target: `other-admin/admin-vue3/src/views/collaboration/components/ColForm.vue`  
Surface: collaboration post create/edit form, Operate mode  
Date: 2026-09-29

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3/4 | Counts and request feedback exist; empty-state cause is unclear. |
| 2 | Match System / Real World | 3/4 | Chinese collaboration terms are clear, while ticket-type consequences need context. |
| 3 | User Control and Freedom | 3/4 | Cancel and close are available; the mobile people popper can cover the dialog footer. |
| 4 | Consistency and Standards | 3/4 | Familiar form controls; upload exposes duplicate keyboard stops. |
| 5 | Error Prevention | 3/4 | Validation and disabled bound users help, but empty copy can misattribute the cause. |
| 6 | Recognition Rather Than Recall | 3/4 | Organization, selected users, counts, and disabled reasons remain visible. |
| 7 | Flexibility and Efficiency | 2/4 | Search and keyboard use are supported, with a redundant upload focus stop. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean form hierarchy; fields remain a long ungrouped sequence. |
| 9 | Error Recovery | 3/4 | Retry and selection retention exist; mobile error feedback is partly obscured. |
| 10 | Help and Documentation | 2/4 | Upload and immutable type rules are explained; domain terms need local help. |
| **Total** | | **28/40** | **Good, at the lower edge of this band.** |

The form fits LinkX's restrained admin visual system and prioritizes operational clarity. Its domain specificity mainly comes from collaboration-post fields and association rules; the UI should explain the people filter in terms of the selected post type.

## Priority Issues

### P2: Mobile people popper obscures dialog actions

At 375x812, opening the related-people list can cover the dialog's Cancel and Confirm area. Keep the footer visible by constraining the list to the available dialog height or opening it upward; verify at 375x812 and a shorter viewport.

### P2: Upload control has duplicate Tab stops

Keyboard inspection reached two consecutive same-named upload buttons for one visual control. Keep one focusable trigger and verify visible focus plus Enter/Space activation.

### P2: Empty-state copy can blame the organization

The current “no related people in this organization” wording may imply the organization has no members, while the query can also be filtered by collaboration type. State the actual filter scope, such as no people available for the selected collaboration type, after confirming that interpretation against the API contract.

### P2: Error text misses normal-text contrast

The mobile error presentation uses `#f56c6c` on `#fef0f0` at 2.6:1. Darken the text or change its surface until normal-size text meets 4.5:1, then check error and retry states.

## Cognitive Load and Emotional Journey

One cognitive-load checklist item failed: the six-field form is a single ungrouped vertical sequence. Overall load remains low. The create flow is easy to start, but the empty state can prompt users to question organization setup. Edit mode gives reassurance through selected names, counts, disabled-user reasons, and the immutable-type explanation.

## Strengths and Persona Risks

- Edit mode explains why collaboration type cannot be changed.
- Selected people, totals, and bound-user reasons are visible in the dialog.
- Request errors retain selections and provide retry guidance.
- A keyboard user encounters an extra upload focus stop; a first-time operator can misread an empty filtered result as a missing organization roster.
- Browser accessibility-tree inspection was performed; no screen-reader session was run.

## Detector and Browser Evidence

- Static detector for `ColForm.vue`: JSON `[]`, stderr empty, exit code 0. This means zero static rule matches for this source file only.
- Assessment B covered 13 fresh Playwright contexts at 1280x720 and 375x812, including create, edit, empty, error, and five overlay views. Normal captures had no horizontal document overflow. A stable loading view was not captured.
- Runtime overlay hits were mostly admin shell/table findings. ColForm-relevant evidence included popper overlap with the next field/status text and the 2.6:1 error-text contrast.
- The injected mobile-error overlay changed the reported viewport to 545x1181 while retaining a 375x812 screenshot. Its dialog geometry and background-row hits are invalidated; the ordinary mobile error screenshot remains usable evidence of feedback overlap.
- All mutating requests were guarded; zero writes were sent. Empty/error states were route mocks, not real-backend validation.

## Limits

The collaboration type's effect on server-side people filtering still needs real API confirmation. No upload, form submission, permission matrix, stable loading capture, or real backend flow was tested. Theme coverage was limited to the current preview theme.

Questions skipped: the user previously directed automatic continuation through the plan and review findings, so this run does not pause for prioritization.
