Method: isolated Assessment A (source review plus a fresh Playwright page in Microsoft Edge; no Assessment B, detector, or overlay findings were used).

# LxTransferPanel — Assessment A

**Mode:** Operate  
**Target:** `linkx-fe/src/components/LxTransferPanel/index.vue` and the live docs example at `http://127.0.0.1:4174/components/lxtransferpanel`  
**Source fingerprint:** `index.vue` SHA-256 `C674CA27197FA3CD0B842492477DB3138EB356D9EC76E89ABB42B6E600B18CE8`; Demo SHA-256 `CCAA9F9EDDFE0650E2506DFB80D248788176F8CBFB21344CC13E1AAF6C0001C`  
**Browser evidence:** Fresh browser context/page, Microsoft Edge; light desktop 1440×900, HUD desktop 1440×900, mobile 390×844 and 320×844, including the selected-list scrolled to the long historical item. All captures set `prefers-reduced-motion: reduce`; the page reported no horizontal overflow and no page errors. The successful captures were made at `2026-10-09T13:31:26.204Z` (UTC). The source hashes matched before and after that capture window.

## Design Specificity

**Verdict: purpose-built for organizational permission assignment, with a familiar transfer-panel structure.** The tree, department codes, operational statuses, disabled nodes, unloaded historical permissions, selection cap, and child-inheritance control all map to the task. The 5:2:5 desktop split and two-tab mobile layout are conventional patterns, but the permission-specific feedback and unloaded-node handling give them a clear product context. The design reference uses 380px panels and shows five selected rows; the component API still defaults to 380px, while the documentation Demo overrides it to 240px.

## Design Health

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3/4 | Selection counts and limit reasons are visible; saved state belongs to the host and is absent from the Demo. |
| 2 | Match Between System and Real World | 4/4 | Chinese labels and organization/permission language match the task. |
| 3 | User Control and Freedom | 3/4 | Filters clear in place; destructive removals confirm. Undo is demonstrated by the host sample rather than provided by the component. |
| 4 | Consistency and Standards | 4/4 | The two panels share metadata treatment, design tokens, keyboard patterns, and semantic labels. |
| 5 | Error Prevention | 4/4 | Batch additions reject atomically at the cap; disabled controls explain why; clear and unloaded-item removal confirm first. |
| 6 | Recognition Rather Than Recall | 3/4 | Counts and status text reduce memory load, though “可加入” can be read as available quota. |
| 7 | Flexibility and Efficiency of Use | 3/4 | Search, filtered batch actions, tree inversion, keyboard operation, and bulk transfer help repeat users; no shortcuts are shown. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Panel grouping is clear, but the 240px Demo leaves the selected list visibly compressed. |
| 9 | Help Users Recover from Errors | 3/4 | Confirmation cancellation and stale-selection checks preserve state; persistence recovery remains a host responsibility. |
| 10 | Help and Documentation | 3/4 | The component guide is detailed and task-focused, but host save-state obligations are not shown in the live example. |
| **Total** |  | **33/40** | **Good (82.5%)** |

## Overall Impression

This is a careful, operationally credible permission picker. It makes large-tree selection, limits, disabled nodes, and historical selections understandable without pretending to own the backend. The clearest opportunity is to make the first view and the mobile counts match the actual task state more literally.

## What's Working

- The desktop grid keeps source and selected items side by side; on mobile, the component switches to two labeled panels with 44px controls. The 1440px, 390px, and 320px captures had no document-level horizontal overflow.
- Limit feedback is concrete. In the captured Demo, four items are selected, two eligible candidates remain, and one slot is free; “全部加入” is disabled with a reason rather than silently doing nothing.
- Long and unloaded historical names remain inspectable. The 390px scrolled capture shows the full name, its code, status, unloaded marker, and raw key without covering the removal control.

## Cognitive Load

**Low, with one checklist failure.** Grouping, hierarchy, context retention, and progressive disclosure work well. The “minimal choices” check fails at the desktop tree decision point: five node rows are visible at once, in addition to the panel-level actions. The 1,420-node tree is virtualized, and search plus hierarchy help contain the choice set. Advanced full-tree inversion is hidden until requested.

## Emotional Journey

The main positive peak is immediate feedback: selection totals and the quota explanation update near the relevant actions. The main valley is the cap boundary, where “可加入 2” appears beside a state with only one remaining slot; a helper explains the batch action, but the number still needs interpretation. Confirmation text and unloaded-item warnings provide reassurance before destructive changes. The final confidence signal depends on the host because the component cannot tell whether a selection has been saved.

## Priority Issues

1. **[P2] The Demo opens in a compressed state.** The documented page sets `panelHeight` to 240px while the API and design reference use 380px. At 240px, the right list shows only about one complete item before internal scrolling, although the example starts with four selections and a long unloaded item. The scroll hint works, but the first impression makes the ordinary task look more cramped than the design baseline. **Fix:** default the Demo to 380px, or expose “紧凑 / 标准” above the example and make the selected mode explicit. This concerns the Demo only, not the component API default. **Suggested command:** `/impeccable layout`.

2. **[P2] The mobile “可加入” count can be mistaken for remaining quota.** `index.vue` derives the tab number from unselected eligible nodes, not from `maxCount`; in the captured state it reads “可加入 2” with only one slot remaining. The disabled bulk-action hint clarifies the limit, but the tab label and accessible name still say the two nodes can be added. **Fix:** label the count “待选” or “未选”, and show remaining quota separately when `maxCount` is set. **Suggested command:** `/impeccable clarify`.

3. **[P2] The live example does not distinguish a draft from a saved permission set.** The component correctly treats `modelValue` as the host’s current selection and the guide says the host must show saving, success, and failure. In the Demo, however, “已选 4 项” and the local `v-model` are the only completion signals; the save-state requirement appears later in the guide. Permission changes are high-stakes, so a copied example can teach the wrong completion cue. **Fix:** add an explicit unsaved/saved state to the host Demo, or place the host persistence note beside the live example. Keep server persistence outside the reusable component. **Suggested command:** `/impeccable clarify`.

## Persona Red Flags

- **Alex (Power User):** Search, filtered batch actions, tree inversion, and keyboard tree navigation support efficient work. When bulk add exceeds the cap, the operation is intentionally all-or-nothing; Alex must add nodes individually, although the reason is visible.
- **Jordan (First-Timer):** “可加入 2” reads literally as two items that can be added, while only one quota slot is free. The adjacent limit hint helps, but moving the candidate count to “待选” would remove the contradiction.
- **Sam (Accessibility-Dependent):** Mobile tab buttons have descriptive accessible names, focusable tree/list regions, visible focus styles in source, and status text in addition to color. A live assistive-technology pass was not performed; the save-state ambiguity remains relevant when the host wires the control into a real permission workflow.

## Minor Observations

- The HUD switch affects the component preview only; the surrounding documentation stays light. That boundary is clear in the implementation and keeps the theme comparison local.
- The Demo’s status, error, loading, empty, and inheritance-description states are source-covered, but this Assessment A browser pass focused on the ready state, long selected item, responsive layouts, and HUD theme.
- The component guide explicitly distinguishes the node count from selectable capacity and says the host must own persistence feedback. Those are useful safeguards, though the first-run Demo does not surface them as strongly.

## Evidence Notes

- Screenshots and DOM measurements are in `browser/desktop-1440x900.png`, `browser/desktop-1440x900-hud.png`, `browser/mobile-390x844-source.png`, `browser/mobile-390x844-selected.png`, `browser/mobile-390x844-selected-scrolled.png`, `browser/mobile-320x844-source.png`, and `browser/mobile-320x844-selected.png`; `browser/browser-evidence.json` records viewport bounds, panel sizes, selected labels, reduced-motion state, and console errors.
- The source fingerprint remained `C674…` for the component and `CCAA…` for the Demo across the successful capture. A later attempt to rerun only to enrich browser metadata received `ERR_CONNECTION_REFUSED` after the preview server temporarily stopped. It did not replace or invalidate the successful screenshots and measurements above; no service was started or stopped during this Assessment A.
- This is Assessment A only. It contains no detector, overlay, or Assessment B results and does not claim those checks passed.

## Questions to Consider

- Should the docs Demo prioritize matching the 380px design baseline, or reducing vertical space on a long page?
- Should the mobile count represent unselected candidates, or the number of choices that fit under the current cap?
- Should the live host example show “未保存 / 已保存” state, or remain a selection-only example with the persistence warning moved beside it?
