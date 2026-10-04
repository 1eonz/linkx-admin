Method: isolated Assessment A (design review only; Assessment B was intentionally excluded from this context)

# Assessment A: LxTreeSelect and LxCascader

## Scope and evidence

Reviewed the current implementations, type contracts, demos, component documentation, `doc/lx-ui/DESIGN.md`, `DESIGN-SPEC.md`, `COMPONENT-STYLE-INTERACTION.md`, and the relevant lx-ui token conventions. Rendered both VitePress docs pages in a fresh browser tab at desktop size; opened each selector to inspect its real popper and options. The TreeSelect demo exposes its state controls in a collapsed disclosure; the Cascader demo shows the selected organization path and a similarly collapsed state panel.

Assessment B findings, overlays, and prior wave6 Assessment B reports were not read. This is a design assessment, not a detector or browser-evidence report. Only the desktop layout was inspected here; mobile viewport, reduced-motion runtime, screen-reader output, and real host/backend use were not independently exercised.

## Design specificity verdict

**Overall: moderately product-specific, with component visuals intentionally close to Element Plus.** Both controls inherit a familiar admin-form composition, then align their trigger, popper, focus border, spacing, and colors to lx-ui tokens. The demos use concrete organization labels and realistic disabled/loading/error cases, so they feel relevant to LinkX's organization and search/form use rather than arbitrary showcase data. The shared visual language is coherent and appropriately quiet for an operational component library.

The selector bodies remain category-standard wrappers: neither the TreeSelect nor Cascader has a distinct information treatment beyond the underlying Element Plus interaction and the shared token layer. That is a reasonable fit for these primitives; the clearest opportunity is to make their state feedback and documentation feel equally deliberate across each component, rather than adding decorative product branding.

## Design health scores

### LxTreeSelect

| # | Heuristic | Score | Key issue |
|---|-----------|---:|---|
| 1 | Visibility of System Status | 3/4 | Selected node and error/loading feedback are visible; async feedback depends on host-supplied states. |
| 2 | Match System / Real World | 4/4 | Organization hierarchy, disabled network node, and department selection use familiar language. |
| 3 | User Control and Freedom | 4/4 | Multi-select draft has explicit confirm/cancel; Escape and outside close discard it. |
| 4 | Consistency and Standards | 3/4 | Token-aligned trigger and rows; hard-coded Chinese footer text diverges from the locale-aware API. |
| 5 | Error Prevention | 3/4 | Transactional multi-select prevents accidental commit; only one demo node illustrates disabled selection. |
| 6 | Recognition Rather Than Recall | 3/4 | Selected value and draft count are visible; deep/large trees and collapsed-tag recovery are not demonstrated. |
| 7 | Flexibility and Efficiency | 3/4 | Search, keyboard movement, bulk selection and exposed methods are documented; shortcut discoverability is limited. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Restrained, legible control and popper; the documentation demo page chrome takes more visual weight than the control. |
| 9 | Error Recovery | 3/4 | Inline error and retry event preserve the field; recovery still depends on host action. |
| 10 | Help and Documentation | 4/4 | Chinese docs clearly describe model, confirmation boundary, slots, events, keyboard and host responsibility. |
| **Total** | | **33/40 (Good)** | Strong interaction model; resolve locale inconsistency and validate accessibility/responsive claims. |

### LxCascader

| # | Heuristic | Score | Key issue |
|---|-----------|---:|---|
| 1 | Visibility of System Status | 3/4 | Current path and loading/error feedback are exposed; host owns async completion. |
| 2 | Match System / Real World | 4/4 | The organization path maps naturally to a cascading hierarchy. |
| 3 | User Control and Freedom | 4/4 | Clearable, filterable, keyboard close, and multi-select are available through familiar controls. |
| 4 | Consistency and Standards | 3/4 | Trigger and three-column popper follow lx-ui sizing/tokens; status feedback moves between field and popper by open state. |
| 5 | Error Prevention | 3/4 | Disabled nodes and selection hierarchy constrain choices; simultaneous `loading` and `error` behavior is not clear to consumers. |
| 6 | Recognition Rather Than Recall | 3/4 | Full selected path and current value are shown; multiple paths collapse without an always-visible count in the demo. |
| 7 | Flexibility and Efficiency | 3/4 | Filter, clear, keyboard behavior, and exposed methods support repeated use; no contextual shortcut guidance. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Compact token-consistent trigger and popper; the surrounding demo frame is more prominent than a bare form field. |
| 9 | Error Recovery | 3/4 | Error text and retry action are available in both closed and open states; successful recovery is represented only by demo state. |
| 10 | Help and Documentation | 3/4 | Props and host async contract are detailed; the central `emitPath`/multiple value shape takes effort to parse. |
| **Total** | | **32/40 (Good)** | Coherent and understandable; tighten live feedback and clarify combined async states/value examples. |

## Cognitive load

The core choice points are manageable. TreeSelect exposes one hierarchy at a time; Cascader divides the path into columns with only a few visible options in the inspected example. Both keep secondary demo controls behind a disclosure, and their real selection task has one clear focal point.

Checklist failures: **1 of 8 (low load overall)**. The TreeSelect demo, when expanded, presents five distinct controls together (single/multiple, empty, loading, failure, HUD); Cascader exposes one mode toggle plus four state buttons. These are demo-only controls, not shipped user workflows, but the five-choice decision point exceeds the checklist's four-option target. Group mode and async/appearance states or split them into labeled groups. No core-user decision point with more than four visible choices was observed.

## Emotional journey

The selection experience starts with a populated, recognizable organization path, which lowers uncertainty. TreeSelect's explicit multi-select confirmation gives a useful reassurance point before committing; cancellation behavior is also clearly described. Both components preserve a recovery path when data fails. In Cascader, the repeated value and “last action” live regions may cause redundant spoken feedback for assistive-technology users; this weakens the otherwise reassuring completion moment. No high-stakes irreversible action is implied by these primitive controls.

## What's working

- TreeSelect's draft/confirm/cancel boundary matches the risk of choosing multiple organizational units and is reflected in both visible footer controls and documentation.
- Both implementations use the existing lx-ui size, radius, border, shadow, and semantic color tokens; the opened desktop poppers look at home with the library's form language.
- The demos include meaningful organization labels, disabled entries, error/loading states, and a visible current value instead of only showing a static default control.

## Priority issues

1. **[P2] TreeSelect footer ignores the component locale.** `locale` changes the Element Plus subtree and error/retry copy, but the default multiple-selection footer always renders `已选 N 项` / `未选择`, `取消`, and `确认`. An English host gets a mixed-language control at the commit boundary. Add locale-aware defaults (and optional text overrides if needed), retain the existing footer slot, and verify the default English and Chinese output. Suggested command: `/impeccable clarify`.

2. **[P2] Cascader demo announces each change through two live regions.** `当前值` and `lastAction` both update on a selection, and both have polite live announcements. Screen-reader users can hear the path twice in different wording, especially for long paths. Keep the current value as ordinary text and announce one concise result, or ensure the action announcement does not duplicate the selected path. Suggested command: `/impeccable audit`.

3. **[P2] Cascader's async state contract leaves a combined state ambiguous.** `loading` and `error` are independent booleans. If both are true, the component renders loading feedback and error feedback, gives the popper both state classes, and blocks panel pointer interaction; consumers are not told which state wins. Define precedence (prefer error to take precedence once loading ends) or reject/document the combination, and keep one status message and one available recovery action. Suggested command: `/impeccable harden`.

4. **[P3] Demo state controls exceed the four-choice guideline when expanded.** Each demo puts five distinct state/mode actions into one row/group. The disclosure keeps the normal demo focused, but when opened the test controls are harder to scan and wrap on narrow screens. Separate mode from data/appearance states and visually group the four state choices. Suggested command: `/impeccable distill`.

## Persona red flags

**Alex (Power User):** TreeSelect exposes `focus`, `blur`, `confirm`, and `cancel`, while Cascader exposes focus, visibility, and checked-node methods; the docs describe keyboard selection. However, the demos do not expose a direct keyboard hint beside the controls, so keyboard-first discovery relies on prior knowledge or reading the full API notes.

**Sam (Accessibility-Dependent User):** TreeSelect demo gives its input an accessible name and opened rows appear as an outline with expandable rows. Cascader's visible label is present. The Cascader demo updates both the current-value and last-action live regions for the same selection, which may be repetitive. Actual screen-reader announcements, 200% zoom behavior, contrast, and full keyboard-only completion were not verified in this isolated visual review.

**Jordan (First-Timer):** The labels “组织路径” and “组织节点” are concrete, and the example starts with a selected path. The difference between tree multi-select confirmation and Cascader's immediate path updates is explained in docs but not surfaced as a short contextual hint in the live demo; first-time users may need to infer the commit behavior from the widget.

## Minor observations

- TreeSelect has a compact 420px demo width and Cascader a 520px framed demo. At desktop size both are readable; the Cascader frame adds presentation weight around a single field.
- The TreeSelect error defaults and footer actions currently mix localization strategies. Aligning those paths would make locale behavior more predictable.
- Documentation claims 375px behavior for Cascader and mobile touch target expansion for both components; this assessment only inspected desktop rendering, so those claims remain unverified here.
- The lx-ui references establish the general token and control conventions but do not supply a dedicated TreeSelect/Cascader visual specimen. The organization demos therefore provide most of the component-specific visual context.

## Provocative questions

- Should the two organization selectors share a small, documented rule for how much of the selected hierarchy remains visible after selection, especially when multiple paths collapse into tags?
- Does the library want its demo pages to explain the difference between “confirm a set” (TreeSelect) and “select a path immediately” (Cascader) at the point of interaction?
- Should lx-ui guarantee English and Chinese defaults only, or should all user-visible component copy be required to arrive via locale-aware labels?

Questions skipped: Assessment A is an isolated handoff to the parent agent; final synthesis and follow-up questions belong to the parent after Assessment B completes.
