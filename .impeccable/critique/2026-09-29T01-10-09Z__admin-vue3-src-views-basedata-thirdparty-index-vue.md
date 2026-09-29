---
target: Vue3 duplicate-submit experience for third-party integration and adjacent admin writes
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:F:\\work\\linkx-admin\\other-admin\\admin-vue3\\src\\views\\baseData\\thirdParty\\index.vue"
target_fingerprint: "sha256:880c0def653b72f938f92403a6c039d9d94c117a08d7166297e098baea3fed71"
target_path: "F:\\work\\linkx-admin\\other-admin\\admin-vue3\\src\\views\\baseData\\thirdParty\\index.vue"
timestamp: 2026-09-29T01-10-09Z
slug: admin-vue3-src-views-basedata-thirdparty-index-vue
---
Method: dual-agent (A: /root/dupsubmit_luna_a · B: /root/dupsubmit_luna_b)

## Design Health

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 2 | Target deletion lock was observed before confirmation; request-pending save/delete was not held open in browser. |
| 2 | Match System / Real World | 3 | Labels and status words map to the integration task. |
| 3 | User Control and Freedom | 2 | The integration dialog prevents dismissal while saving. |
| 4 | Consistency and Standards | 2 | Pending-state handling differs across adjacent role/account pages. |
| 5 | Error Prevention | 2 | Target locks duplicate delete and source locks save; adjacent adminRole/adminPerson writes lack guards. |
| 6 | Recognition Rather Than Recall | 2 | Create dialog autofill was observed once but not verified in a clean profile. |
| 7 | Flexibility and Efficiency | 2 | Search and pagination are clear; no batch path is present. |
| 8 | Aesthetic and Minimalist Design | 3 | The work area is calm and scannable. |
| 9 | Error Recovery | 2 | A claims failures are silent; code review found shared HTTP errors are reported, though generic recovery guidance is limited. |
| 10 | Help and Documentation | 1 | Token lifetime `-1` and credential handling lack contextual explanation. |
| **Total** | | **21/40** | **Acceptable; strengthen consistency and recovery.** |

The A score evaluates the broader duplicate-submit experience across integration and nearby role/account workflows. Two P1 findings below are confirmed source defects outside the legacy GLM #10 route scope and are recorded as follow-up work, not as failures of the `/baseData/thirdParty` implementation alone.

## Design Specificity Verdict

The third-party page uses the established LinkX admin shell, localized integration fields, masked secret, status labels, and a compact table. Its visual language is coherent but common to admin products. At 1280x720 the page displayed three local Mock applications. The 375x812 view had no page-level overflow, but the pagination controls overflowed within their own horizontally scrollable area.

The target source detector produced valid JSON `[]`, empty stderr, and exit code 0; this is static zero-hit evidence only. Mutable preflight and live overlay injection succeeded. The overlay headline said 22 hits, while parsed events counted 18 cramped-padding, 3 layout-transition, 1 clipped-overflow-container, and 1 dark-glow; this count mismatch is retained as a limitation. Hits were on the navigation shell/layout, not duplicate-submit controls. The 18 cramped-padding hits were menu rows with measured 44px height and generous text padding, likely false positives. No HUD theme control was available.

The delete confirmation was opened and cancelled. During confirmation, the first row's detail/edit/delete actions were disabled. No collaboration business write was observed. The runtime automatically sent 78 local Mock keepalive POSTs; `preview-server.ts` handles them locally. No delete/save operation was submitted. Browser screenshots, console records, status captures, detector JSON/stderr/exit code, and live-server stop evidence are under `.impeccable/critique/duplicate-submit-assessment-b-luna-max-2026-09-29/`.

## Overall Impression

The third-party table is easy to scan and its source connects delete/save locks to disabled/loading states. Confirmation-time lock behavior is visible in the browser. The largest gap is consistency across adjacent administration workflows, followed by a narrow-screen pagination control that requires internal horizontal scrolling.

## What's Working

- The integration list has a clear search, table, status, and row-action hierarchy.
- The third-party delete confirmation disables all actions on the pending row; cancellation restores them without sending a business write.
- The save flow guards duplicate invocation, shows loading/disabled/`aria-busy`, and releases state in `.finally()`.

## Priority Issues

### [P1] Backend-role save is not guarded

`/authority/adminRole` does not guard `handleSubmit` or pass `submitting` into the shared `EditRole`, so another save can be sent while the first is pending. This is confirmed by code review but is outside the old GLM #10 route coverage. Add a pending guard and bind it to the existing dialog state. Suggested command: `/impeccable harden`.

### [P1] Admin-person writes lack pending locks

Single/batch role binding, password changes, delete, and status updates on `/authority/adminPerson` can be re-triggered while pending. These are confirmed by code review but are outside the old #10 `/authority/userManage` delete/status scope. Add dialog and row-level locks with `.finally()` cleanup. Suggested command: `/impeccable harden`.

### [P2] Mobile pagination requires internal horizontal scrolling

At 375px the document stays within the viewport, but the pagination control itself is wider than the screen. Keep the primary pager actions visible or use a responsive compact arrangement. Suggested command: `/impeccable adapt`.

### [P2] New-credential fields appeared prefilled

The create dialog showed `preview` and a masked secret with a validation error in one browser profile, while the form model initializes empty. Browser autofill/session state is a plausible cause and has not been confirmed in a clean profile. Recheck before changing autocomplete behavior. Suggested command: `/impeccable harden`.

### [P2] Failed requests lack operation-specific recovery guidance

The prior claim that errors are silent was not supported: non-cancelled HTTP/network failures use the shared `ElMessage` interceptor, and business error codes are handled by pages. The remaining issue is that a generic error message may not explain what the operator should do next. Keep form input and provide a clear retry path where needed. Suggested command: `/impeccable clarify`.

## Persona Red Flags

- **Alex:** repeated role/account submissions are possible on adjacent admin pages; the table pagination also costs horizontal navigation on mobile.
- **Sam:** target action buttons expose disabled/loading state; adminRole/adminPerson forms lack consistent busy semantics and need keyboard/screen-reader validation after their locks are added.
- **Jordan:** unexplained `-1` token lifetime and a potentially autofilled create form can make credentials ambiguous.

## Minor Observations

No live request-pending state was observed; only the pre-confirmation row lock was exercised. The target has no theme toggle, so HUD screenshots are unavailable. The app shell's overlay findings should not be attributed to the third-party component.

## Questions to Consider

- Should pending locks be consistent across every role and account write workflow?
- Can pagination keep its primary controls visible at 375px without an internal horizontal scroll?
- What does `-1` mean for token lifetime, and should the form say so directly?
