Method: single-context design review (Assessment A only; isolated from detector and overlay evidence)

# ColForm Post-Fix Assessment A

## Scope and evidence

Target: `other-admin/admin-vue3/src/views/collaboration/components/ColForm.vue`, reviewed as the Operate-mode create/edit form for collaboration posts.

The review used the current component source, the Vue3 admin `DESIGN.md`, the local Mock route, and a new browser tab at `http://127.0.0.1:30847/collaboration/index`. The page was visually inspected at 1280×720 in the Codex in-app browser and at 375×812 in installed Edge. I opened and dismissed create and edit dialogs without submitting either form. Keyboard checks covered Escape for the people dropdown and dialog, and Tab between the edit dialog's Cancel and Confirm buttons. Color ratios were calculated from browser-computed colors.

This is the requested independent Assessment A. No Assessment B, detector, browser-overlay output, or prior Assessment A report was used. The Mock returns the same three people regardless of the `name` query; it cannot establish real keyword filtering, empty results, pagination, or backend behavior. Its response was too fast to observe loading, and no failure was injected, so failure/retry visuals are assessed from source only. No product source was changed and no write action was performed.

## Design Specificity Verdict

The form is grounded in a collaboration-post workflow rather than a generic admin dialog: it scopes people to an organization and its subordinate units, keeps the current selection count visible, explains why already-bound people cannot be selected, and discloses that the post type cannot change after creation. The blue primary action, white surfaces, restrained borders, and compact Chinese labels align with the documented admin design system.

The structure is still a conventional single-column Element Plus dialog, but the content-specific rules make it understandable. The main opportunity is to make the responsive form behavior match the intent of its mobile CSS and to give disabled role text enough contrast.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Organization scope and selected count are visible; loading/error states were not reproducible against this Mock. |
| 2 | Match System / Real World | 3 | “归属组织” and “关联人员” match the domain; “协同岗” is domain-specific but used consistently. |
| 3 | User Control and Freedom | 3 | Escape closes the dropdown and dialog; Cancel is visible. There is no draft recovery after closing. |
| 4 | Consistency and Standards | 3 | Native Element Plus controls and the documented bright surface/blue-action style are consistent. |
| 5 | Error Prevention | 3 | Required fields, organization prerequisite, disabled conflicting users, and immutable type are communicated before submission. |
| 6 | Recognition Rather Than Recall | 3 | Selected people, scope, totals, and disabled reasons are visible; the meaning of the disabled role relies partly on its hint. |
| 7 | Flexibility and Efficiency of Use | 2 | Keyboard focus works for footer actions and selection supports search; no form-specific shortcut or visible bulk selection is provided. |
| 8 | Aesthetic and Minimalist Design | 3 | The dialog stays focused, with only task-relevant fields; 12px secondary text and restrained disabled styling weaken a small part of the hierarchy. |
| 9 | Help Users Recognize, Diagnose, and Recover from Errors | 3 | Source provides a retry action and says existing selections remain; browser failure and retry were not exercised. |
| 10 | Help and Documentation | 2 | Inline prerequisite and immutability hints help, but there is no contextual help for organization/user binding rules. |
| **Total** | | **28/40 — Good** | **Solid foundation; fix the mobile label layout and disabled-value contrast.** |

## Overall Impression

The new organization gate, scope summary, selection count, retry affordance, and immutable-type explanation make the key rules legible at the point of action. In edit mode, selected people remain visible and the already-bound alternative carries a text reason. The two gaps with clearest evidence are that the mobile stacking rule misses the teleported dialog, and the disabled type value is exceptionally faint. The Mock's fixed data also prevents a meaningful browser check of remote-search states.

## What's Working

- Before an organization is chosen, the people field explains the prerequisite. Once a Mock organization is selected, the form states the subordinate-unit scope and reports total and selected people; changing or clearing the organization clears the previous selection in source.
- The edit view preserves the selected names and explicitly says the role type cannot be changed after creation. This prevents users from mistaking the disabled control for a loading or permission failure.
- In edit mode, “王敏” is disabled with the reason “已关联至其他协同岗,” while “张晨” and “李宁” remain selected. This pairs a visual constraint with text and retains the existing assignment context.

## Priority Issues

### [P2] Mobile form labels remain in a fixed horizontal column

**Why it matters:** At 375×812, the dialog fits and its footer remains visible, but the computed `.el-form-item` is still `display:flex; flex-direction:row`; its label remains 100px wide and the control content is only 211px. The component's `max-width: 480px` rules intend stacked labels, but the dialog is appended to `body`, so the scoped selector does not reach it. Narrow controls leave less room for long organization names, chips, and error text.

**Fix:** Put the mobile overrides on a selector that can reach the teleported dialog (for example a deliberately global dialog class scoped by the stable `.col-form-dialog` class), then verify stacked labels and footer bounds at 375px.

**Suggested command:** `/impeccable adapt`

### [P2] The disabled role value is nearly unreadable

**Why it matters:** Browser-computed colors for “人员核查协同岗” are `#c9cdd4` on `#f2f4f8`, a 1.45:1 contrast ratio. The 12px explanatory hint below it is readable at 7.10:1, but users still need to identify the current immutable value, particularly in edit mode.

**Fix:** Raise disabled selected-value text contrast to at least 4.5:1 while retaining a separate disabled surface/border cue. Keep the immutable hint adjacent.

**Suggested command:** `/impeccable typeset`

### [P2] The people dropdown covers the dialog footer area

**Why it matters:** In the 1280×720 edit view, opening the three-option people dropdown extends it across the lower dialog and overlaps the Cancel/Confirm region. Escape closes the dropdown and restores access, so this is not a blocker, but it makes the dialog feel crowded and can obscure actions while the user evaluates options.

**Fix:** Bound the dropdown height to the available space above the footer or otherwise place it so the footer controls remain visually separate while the menu is open. Recheck when there are many options, since the live Mock only exposes three.

**Suggested command:** `/impeccable layout`

## Cognitive Load

Assessment of the eight checklist items: single focus passes; chunking passes (the form has six labeled field groups and the people choices are in a dropdown); grouping passes; visual hierarchy passes at desktop and mobile; one decision at a time passes; minimal choices passes in the visible fields and the three-person option list; working memory passes in edit mode because selected names, organization scope, and count remain visible; progressive disclosure passes because people choices are hidden until the selector opens and depend on an organization. **Failures: 0/8; low cognitive load.**

The workflow has six field groups, but only four are required in the visible create form and the organization dependency is explained before selection. In the captured edit state, the dropdown's overlap with the footer temporarily competes with the dialog actions; this is a layout issue rather than a large option-count burden.

## Emotional Journey

The initial create state is calm but leaves a clear next step: choose an organization before searching people. Selecting the organization and seeing the scoped total reduces uncertainty. The edit state offers reassurance by preserving two names and explaining the locked type. The dropdown/footer overlap is the main moment of friction. A failed request should be recoverable according to the source copy and retry action, but that emotional recovery path remains unverified in the browser. The ending state was not submitted, by design, so no success feedback was assessed.

## Persona Red Flags

**Alex (Power User):** The primary fields are grouped in one dialog and Escape works for both the people menu and the dialog. The form offers no shortcut for jumping between fields or submitting, and assignment remains a one-person-at-a-time multi-select interaction. The latter may be acceptable for the observed three people, but the real list size is unknown.

**Sam (Accessibility-Dependent User):** The two footer buttons are keyboard reachable in sequence and show a visible focus outline; Escape closes the open menu. The disabled role value falls well below 4.5:1 contrast. Loading, failure announcements, retry focus, and screen-reader behavior were not exercised, so their source-level `role="status"`, `aria-live`, and `aria-busy` semantics need a browser/screen-reader check.

**Casey (Distracted Mobile User):** At 375×812, Cancel and Confirm remain above the fold and the page has no horizontal overflow. However, each mobile field keeps a 100px side label, narrowing the control column; the append-to-body dialog bypasses its intended stacked layout. No interruption or draft persistence behavior was tested.

## Minor Observations

- The status and immutable-type hint use 12px text. Their measured regular text color on white has adequate contrast, but the small size may be harder to read at increased zoom or on a small display.
- The source has explicit empty and error copy, preserves selection on request error, aborts stale requests, and exposes a retry button. These are source findings, not browser-verified behavior in this run.
- The Mock marks all three returned people as already bound (`isBinding: 1`), leaving create mode with no selectable person. This makes it unsuitable for validating a successful create selection workflow.
- No actual browser measurement was taken at enlarged text/200% zoom; the mobile width check used 375 CSS pixels.

## Evidence and Limits

- Desktop, 1280×720: create gate, selected organization, people dropdown, unmatched keyword input, edit view, disabled reason, scope and selection count, footer overlay while dropdown is open, Escape dismissal, and Tab focus on Cancel/Confirm were observed in the browser.
- Mobile, 375×812: create dialog bounds x=16, y≈104, width=343, height≈581; edit dialog bounds x=16, y≈129, width=343, height≈537. Footer bottoms were approximately 670px and 650px, respectively. `document.documentElement.scrollWidth` was 375px. Labels remained horizontal with a 100px label column; control content measured 211px.
- Contrast: regular hint/status text `rgb(78,89,105)` on white = 7.10:1. Disabled role text `rgb(201,205,212)` on its `rgb(242,244,248)` surface = 1.45:1.
- The live Mock uses a static `people` list and paginates it without applying the `name` filter. Typing “不存在” retained the same three options. Loading could not be captured because the response completed too quickly; no failure or retry state was induced. Empty, search, pagination, and failure states therefore remain unverified against a representative contract.
- No detector, overlay, Assessment B artifact, old Assessment A report, or product write action contributed to this assessment.
