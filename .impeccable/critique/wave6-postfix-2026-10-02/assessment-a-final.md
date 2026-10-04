Method: Assessment A only (isolated design pass; two fresh local browser tabs; no Assessment B or detector/overlay evidence read)

# Assessment A: LxTreeSelect and LxCascader

Target: current `linkx-fe` component source, demos, and component docs. The docs were viewed from the existing VitePress dev server at `localhost:4174`; no server was started or stopped.

## Design Specificity Verdict

**Mostly product-grounded, with a shared LinkX visual language.** Both controls connect their feedback to organization selection and preserve familiar Element Plus behavior while adding LinkX sizing, focus, loading, retry, and multi-select confirmation. Cascader's sample names a public-safety organization hierarchy; TreeSelect exposes similar organization data, disabled branches, draft confirmation, and retry. This gives the examples credible operational context rather than generic placeholder content.

The component treatment is coherent at the control level. The demo presentation is less authored as a pair: their cards have different maximum widths, vertical rhythm, and labeling. TreeSelect calls its locale switch “English footer” even though it changes the locale for the wrapped control more broadly. These are small but visible mismatches in a library whose examples are meant to teach consistent use.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3/4 | Loading, error, selected value, and retry count are exposed; Cascader's loading-over-error priority is visible and documented. |
| 2 | Match System / Real World | 3/4 | Organization paths and branch names fit the domain; locale switch wording understates its scope. |
| 3 | User Control and Freedom | 3/4 | TreeSelect supports confirm/cancel/Escape; Cascader supports clear and Escape. |
| 4 | Consistency and Standards | 2/4 | Similar demos differ in width, field labeling, and spacing. |
| 5 | Error Prevention | 3/4 | TreeSelect stages multi-select changes; loading/error disables Cascader panel selection. |
| 6 | Recognition Rather Than Recall | 3/4 | Current values and counts stay visible; TreeSelect expands the full sample tree at once. |
| 7 | Flexibility and Efficiency | 3/4 | Filtering, multi-select, keyboard contracts, and exposed instance methods support repeated use. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Restrained component styling; the different demo card proportions weaken the paired presentation. |
| 9 | Error Recovery | 3/4 | Retry is explicit and host-owned; Cascader retry is below the stated 44px touch target on narrow screens. |
| 10 | Help and Documentation | 3/4 | Props, events, keyboard behavior, error ownership, and concurrent states are documented, though the API reference is dense. |
| **Total** |  | **29/40** | **Good (72.5%); address the small consistency and narrow-screen issues.** |

## Cognitive Load

**Low: 1 of 8 checklist failures.** The demos keep state controls collapsed initially, group mode/data/appearance options, and expose the current value. Cascader progressively reveals each path level. TreeSelect's `default-expand-all` exposes six sample rows simultaneously, which is the one failure against the four-item decision guideline; hierarchy and indentation partly mitigate it. The docs API tables are information-dense but are secondary to the interactive selection task.

Visible decision points: TreeSelect offers three data-state actions plus two appearance toggles in separate groups; Cascader offers four data states and a separate mode switch. Each group stays at four or fewer choices. Cascader's three columns expose only two or three choices each.

## Strengths

- **Clear commit boundary:** TreeSelect's multi-select draft shows the pending count and only submits through Confirm; Cancel and Escape preserve the previous value.
- **Recoverable async states:** both components keep retry responsibility with the host and expose a concrete retry action. In the live Cascader demo, error-only showed its message and Retry; with loading and error both active, the panel showed “加载中” and suppressed the error action, matching the docs.
- **Useful docs and semantic feedback:** the pages explain keyboard behavior, locale ownership, loading/error precedence, and ARIA relationships instead of presenting props alone.

## Priority Issues

1. **P2 — Align the paired demo frame.** TreeSelect caps its card at 420px and Cascader at 520px, producing noticeably different widths in the live docs. Their gaps also use different spacing tokens. Choose one shared demo width and rhythm so side-by-side component pages read as one library. Evidence: [TreeSelect Demo](/F:/work/linkx-admin/linkx-fe/src/components/LxTreeSelect/demo/basic.vue:147), [Cascader Demo](/F:/work/linkx-admin/linkx-fe/src/components/LxCascader/demo/basic.vue:145).
2. **P2 — Make the English toggle's scope explicit.** “English footer” is backed by the component `locale` prop, which also changes Element Plus and component fallback strings such as loading, empty, error, and retry labels. Rename it to describe the full control locale, or make the demo truly footer-only. Evidence: [TreeSelect Demo](/F:/work/linkx-admin/linkx-fe/src/components/LxTreeSelect/demo/basic.vue:93) and the checkbox label at line 126.
3. **P2 — Keep the Cascader retry target touch-sized.** The narrow-screen media query raises Cascader input and option rows to 44px, but `.lx-cascader__retry` remains 32px in the error feedback/footer. Users on touch screens get a smaller target precisely when recovery is needed. Evidence: [Cascader styles](/F:/work/linkx-admin/linkx-fe/src/components/LxCascader/style.css:105) and its narrow-screen rules beginning at line 129.
4. **P3 — Give the TreeSelect demo a visible field label.** Cascader pairs its input with the visible “组织路径” label; TreeSelect relies on an accessible name and placeholder only. A visible label would make the two examples more consistent and keep the field's purpose clear after a value is selected. Evidence: [TreeSelect Demo](/F:/work/linkx-admin/linkx-fe/src/components/LxTreeSelect/demo/basic.vue:81) and [Cascader Demo](/F:/work/linkx-admin/linkx-fe/src/components/LxCascader/demo/basic.vue:84).

## Persona Red Flags

- **Alex, impatient power user:** no blocking issue in the shown workflows; TreeSelect has a direct multi-select confirmation path and both components document keyboard and instance contracts. Large real-world trees may make the sample's expand-all behavior feel noisy.
- **Sam, accessibility-dependent user:** source and docs provide labels, live status/error semantics, and focus styles. The Cascader Retry target falling short of 44px on mobile is the concrete access risk. Screen-reader announcement quality and keyboard traversal were not independently exercised in this pass.
- **Riley, deliberate stress tester:** loading plus error has a deterministic and documented precedence, and retry clearly emits to the host. The demo does not show a persistent request failure cycle; its retry immediately returns to ready, so repeated-failure behavior is not demonstrated.

## Minor Observations

- TreeSelect's sample has no visible field label despite its `aria-label`; the placeholder and current value make the purpose inferable.
- Cascader's selected path remains visible while its open panel is dimmed in loading state. This reassures users that the current value is retained.
- API docs are complete but long. Keeping the behavior contract before the full prop table, as both pages mostly do, is the right ordering.

## Provocative Questions

- Should all new component demos use one shared maximum width, spacing rhythm, and visible-label convention?
- Is the TreeSelect control intended to demonstrate English across the entire component, or only the multi-select footer?
- Should the sample TreeSelect start with branches collapsed so the example itself demonstrates progressive disclosure?

## Limitations

This is the isolated design assessment only. No detector, overlay, Assessment B report, or prior critique output was consulted. Browser review used the current local docs server in two newly opened tabs and verified the named desktop states. A narrow viewport, dark theme, full keyboard-only flow, and assistive-technology announcement were not independently tested. No product files were changed.
