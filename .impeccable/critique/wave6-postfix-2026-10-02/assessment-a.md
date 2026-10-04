# Wave 6 Post-fix Assessment A: LxTreeSelect and LxCascader

Assessment A: isolated design review by `/root/treecascader_postfix_a`. Detector output and Assessment B materials were not inspected. This is a design assessment only, not a completed dual-assessment Impeccable Critique.

## Scope and evidence

- Reviewed current component source, styles, demos, types/docs, shared tokens, and available `design/` references for LxTreeSelect and LxCascader.
- Opened fresh local documentation pages at `http://127.0.0.1:4174/components/lxtreeselect.html` and `http://127.0.0.1:4174/components/lxcascader.html` in separate browser tabs at the available desktop viewport (about 1260 x 720).
- Interacted with TreeSelect’s grouped demo controls, tree popup, and multi-select footer. Confirmed the footer displays the Chinese locale defaults “已选 1 项”, “取消”, and “确认”.
- Interacted with Cascader’s grouped demo controls, failure state, and open popup. Confirmed the selected path remains visible, failure copy is actionable, retry is present, and the popup presents error/retry feedback while preserving the existing hierarchy.
- Reviewed CSS breakpoints, minimum touch heights, reduced-motion overrides, token use, and component locale/loading/error precedence in source.
- No component-specific TreeSelect or Cascader mockups were present in `design/` or `doc/lx-ui/`; the inspected shared styling follows the lx-ui token system.

## Design-specificity verdict

The components read as part of the LinkX admin system rather than generic controls: Chinese organizational data, disabled network nodes, retained path values, retry semantics, and the compact blue focus treatment are tied to their actual work context. The 28/32/40 px sizing, 4 px focus/border treatment, popup shadow, and error colors are consistently token-driven. Overall specificity is strong for operational form controls.

## Heuristic scores

| # | Heuristic | Score | Key observation |
|---|---|---:|---|
| 1 | Visibility of System Status | 3/4 | Loading and error feedback are visible; Cascader exposes status/retry both inline and in the popup according to visibility. |
| 2 | Match Between System and Real World | 4/4 | Organization names, disabled nodes, and path selection match the domain. |
| 3 | User Control and Freedom | 3/4 | Clear, Escape, and TreeSelect draft cancel/confirm semantics are documented and available. |
| 4 | Consistency and Standards | 3/4 | Shared sizing, borders, focus and token use are coherent; demo framing differs between these neighboring pages. |
| 5 | Error Prevention | 3/4 | Disabled choices, explicit multi-select confirmation, disabled retry, and stable loading/error precedence reduce mistakes. |
| 6 | Recognition Rather Than Recall | 3/4 | Labels, path values, grouped state controls, and contextual feedback are visible; some behavior still depends on reading prose. |
| 7 | Flexibility and Efficiency of Use | 3/4 | Filterable selection, keyboard support, multiple selection, and clear/collapse behavior support experienced users. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Quiet hierarchy and restrained color suit admin work; component demos remain compact and scannable. |
| 9 | Help Users Recognize, Diagnose, and Recover from Errors | 3/4 | Failure text is plain language and retry is adjacent; retry correctly delegates data loading to the host. |
| 10 | Help and Documentation | 2/4 | Props/events and interaction rules are thorough, but support is mostly static prose and the demos do not expose every documented locale/state combination. |
| **Total** |  | **30/40 (75%)** | **Good** |

## Findings

### P2 — Cascader demo cannot reproduce the documented loading/error precedence

The component docs state that `loading=true` takes precedence over `error=true`, and the implementation applies that precedence (`hasError` is false while loading). The demo models the data state as a single exclusive choice among ready/loading/error/disabled, so visitors cannot set both flags and see the precedence rule. The behavior is coherent in code and described in docs, but is not demonstrable through the public example. Consider adding one explicit “加载中 + 错误” state or a small targeted example that shows loading feedback and suppresses retry until loading ends.

### P3 — Locale fallback behavior is documented but not demonstrable in either demo

TreeSelect’s Chinese footer labels were verified and look correct. The docs also claim English fallback and local overrides, while the demo remains Chinese-only. A compact locale control or one static English example would make the locale-aware fix discoverable and let maintainers catch regressions without reading implementation code.

### P3 — Demo framing differs across the two pages

Cascader encloses the input and controls in a bordered card with generous padding; TreeSelect presents its input and grouped controls directly on the documentation surface. Neither layout is broken at desktop size, but the difference makes adjacent data-entry examples feel less like one component family. Aligning their demo framing would improve library-wide consistency. This is polish, not a component usability defect.

No P0 or P1 issue was observed in the inspected states.

## Cognitive load

The tested decision points stay within the four-item working-memory guideline. TreeSelect groups selection mode, three data actions, and one appearance option; Cascader groups selection mode separately from four mutually exclusive data states. The “演示状态” disclosure keeps these implementation-focused controls out of the initial reading path. The Cascader state group is at the upper limit of four choices but is short, mutually exclusive, and visibly marks the selected state.

Checklist: grouping — pass; hierarchy — pass; one decision at a time — pass; minimal choices — pass; working-memory burden — pass; progressive disclosure — pass. Cognitive load is low. The only material recall burden is that users must read the prose to learn that Cascader retry emits an event and does not fetch data itself.

## Persona observations

- **Alex, impatient power user:** Common choice and filtering remain direct; multi-select commit has an explicit footer. TreeSelect exposes keyboard navigation and Escape in the docs. No forced onboarding was observed. The Cascader demo needs an extra disclosure click to reach state controls, which is reasonable for a documentation playground.
- **Sam, keyboard/screen-reader user:** Accessible names are present on the input and grouped controls; both demos use semantic buttons and visible focus styling in source. TreeSelect’s multi-select footer was exposed as distinct Cancel/Confirm buttons in the accessibility tree. Cascader failure feedback was exposed as text plus a named retry button. A complete keyboard-only run and screen-reader announcement quality were not independently tested.
- **Casey, distracted mobile user:** Source provides at least 44 px touch heights at coarse pointers/narrow widths and constrains Cascader columns/popups to the viewport with internal horizontal scrolling. Actual narrow-screen rendering could not be inspected in this browser session, so overflow and thumb reach remain unverified.

## Coverage limits

- The browser surface in this sub-agent session did not provide viewport emulation. I inspected desktop screenshots only; mobile observations above are source-based, not visual verification.
- Reduced-motion behavior was verified from CSS media-query rules, not by changing the browser motion preference and observing animation.
- Locale behavior was visually verified only for the default Chinese TreeSelect footer; English locale and explicit localized overrides were not toggled in the demo.
- Cascader loading and error were inspected separately. The simultaneous state is documented and source precedence was inspected, but the demo cannot render that combination without changing component inputs outside its public controls.
- This assignment explicitly excluded detector and Assessment B/browser overlay evidence. No formal combined Impeccable verdict or snapshot success is claimed here.

## Verdict

The post-fix desktop experience is solid and ready to continue through the remaining review gates. TreeSelect’s locale-aware Chinese footer and Cascader’s loading-over-error policy are clear in the current implementation/docs. Before calling the documentation examples fully reviewable, add a demonstrable simultaneous loading/error Cascader state and a locale example; align demo framing when convenient. Mobile, reduced-motion, English locale, and combined-state browser evidence remain outstanding for this assessment.
