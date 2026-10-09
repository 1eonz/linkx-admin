Method: isolated Assessment A (current source review and fresh Playwright pages in Microsoft Edge; no Assessment B, detector, or overlay findings were used).

# LxTransferPanel Width-Only Assessment A

**Mode:** Operate  
**Target:** `linkx-fe/src/components/LxTransferPanel/demo/basic.vue`, `linkx-fe/src/components/LxTransferPanel/index.vue`, and `http://127.0.0.1:4174/components/lxtransferpanel`  
**Source fingerprint:** `index.vue` SHA-256 `C674CA27197FA3CD0B842492477DB3138EB356D9EC76E89ABB42B6E600B18CE8`; Demo SHA-256 `7A6C9A1C4003270148DFF12BD474B8D9F66B603DF2493E91EDB869B8001A83B3`  
**Browser evidence:** Fresh Playwright context and pages in Microsoft Edge 154.0.4258.62 at 1440×900, 1024×900, 390×844, and 320×844. Narrow views include both source and selected panels. Captures use `prefers-reduced-motion: reduce`; no page errors or document-level horizontal overflow were recorded. Capture time: `2026-10-09T14:09:12.569Z` UTC. Component and Demo hashes matched before and after capture.

## Design Specificity

**Verdict: the 760px cap improves the documentation example's composition while keeping the permission-assignment tool recognizable.** On a 1440px viewport, the preview is exactly 760px wide and centered within the documentation column. The desktop panel split remains 5:2:5, keeping the tree, transfer actions, and selected permissions in a coherent working group. At 390px and 320px, the preview uses the full available content width and the component changes to its single-panel mobile workflow.

The design reference shows 380px panels and five selected rows; the component API still defaults to 380px. The Demo intentionally stays at 240px, so this review evaluates the compact documentation example rather than the component's default production configuration.

## Design Health

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3/4 | Counts and the batch-limit reason are visible; only one selected row fits fully in the compact desktop list viewport. |
| 2 | Match Between System and Real World | 4/4 | Organization, department, status, and permission labels fit the demonstrated task. |
| 3 | User Control and Freedom | 3/4 | Source/selected panel switching and internal scrolling are clear; the compact desktop list needs more scrolling. |
| 4 | Consistency and Standards | 4/4 | The width cap does not disturb the component's 5:2:5 grid or token-based styling. |
| 5 | Error Prevention | 4/4 | The selection cap disables impossible bulk actions and explains the constraint. |
| 6 | Recognition Rather Than Recall | 3/4 | Item counts and status hints help, though the long selected list is mostly below the initial desktop viewport. |
| 7 | Flexibility and Efficiency of Use | 3/4 | Search, batch actions, keyboard tree interaction, and mobile panel switching remain available. |
| 8 | Aesthetic and Minimalist Design | 2/4 | Centering improves page rhythm, but the 760px width makes the 240px selected panel visibly denser. |
| 9 | Help Users Recover from Errors | 3/4 | The component explains blocked batch actions; persistence and save recovery remain host responsibilities. |
| 10 | Help and Documentation | 3/4 | The example and component guide are detailed, but the compact viewport understates the space needed for several selected items. |
| **Total** |  | **32/40** | **Good (80%)** |

## Overall Impression

The width change is clean at the intended large desktop size: the preview is centered, the title and advanced-action entry fit together, and the component's 5:2:5 proportions remain intact. The remaining compromise is vertical: with the Demo still at 240px, its narrower selected panel leaves only 53px for the list, so the first view shows one complete selected row and a scroll hint.

## What's Working

- At 1440px, the preview measures exactly 760×240px at x=396px. Its side panels are 306.66px each and the middle transfer track is 122.67px, preserving the intended 5:2:5 grid.
- The source title and “更多反选选项” occupy one row at the 760px preview width with no overlap. The screenshot confirms both labels remain readable at this target size.
- At 390px and 320px, the preview fills the available content width (342px and 272px respectively). Panel switching works in both sizes, each switch target is 44px tall, and the document does not scroll horizontally.

## Cognitive Load

**Moderate, with one checklist failure.** The task context and action groups are clear, and the advanced full-tree inversion stays behind a disclosure. The demo data has 70 child nodes in its largest group, which exceeds the four-item chunking guideline; virtualization and search make that scale manageable, but users still need to scan or filter a large hierarchy. The 240px selected panel also asks users to scroll sooner on desktop.

## Emotional Journey

The centered preview creates a calmer entry point, and the labeled panels establish where to choose and where to review. The quota hint reassures users when “全部加入” is unavailable. The compact selected list is the main valley: after selecting permissions, users see one full item before the scroll hint, so they need another action to verify the rest. Confirmation and save-success feedback depend on the host workflow, outside this width-only change.

## Priority Issues

1. **[P2] The 760px preview compresses the selected list when the Demo remains 240px high.** In the 1440px capture, the right list's client height is 53px and only one item is fully visible; the example starts with four selected items, including a long unloaded historical permission. Scrolling still works and the hint reports hidden items, so the task remains usable, but reviewing the sample selection costs more actions and the long record is not inspectable in the initial view. **Fix:** retain the 760px cap and 240px outer height, but reclaim some selected-list height by shortening or moving the inheritance helper copy outside the fixed-height panel. **Suggested command:** `/impeccable layout`.

No P0 or P1 issue was found in this width-only pass.

## Persona Red Flags

- **Alex (Power User):** Filtering and batch actions remain available, and the central controls retain the intended proportions. On desktop, Alex sees one complete selected row at first and must scroll to verify the other three.
- **Jordan (First-Timer):** The panel title and advanced-action entry fit together at 760px. The compact selected list gives a clear scroll hint, but it does not show the full selected set at once.
- **Sam (Accessibility-Dependent):** At 390px and 320px, both mobile panel tabs expose descriptive accessible names and provide 44px targets. This browser pass did not include a screen-reader session.

## Minor Observations

- At a 1024px browser viewport, the docs shell leaves a 624px content column, so the preview is 624px wide rather than capped at 760px. The panel title becomes visibly truncated at that width, while the advanced-action entry remains on the same row. This is an intermediate documentation-shell constraint, not a regression from the max-width rule.
- The selected list shows two complete rows at 390px and 320px because the component gives mobile panels a 352px minimum height. The long historical item wraps instead of overflowing horizontally.
- The API default height remains 380px; this review's density finding applies to the Demo override only.

## Evidence

- Browser measurements and source fingerprints: `browser/browser-evidence.json`.
- Desktop screenshots: `browser/desktop-1440x900.png` and `browser/desktop-1024x900.png`.
- Narrow screenshots: `browser/mobile-390x844-source.png`, `browser/mobile-390x844-selected.png`, `browser/mobile-320x844-source.png`, and `browser/mobile-320x844-selected.png`.
- Design reference reviewed: `design/虚拟滚动树 + 双栏穿梭/screen.png` and its source `design/虚拟滚动树 + 双栏穿梭/code.html`.
- Assessment A only. No detector, overlay, or Assessment B result is included or implied.

## Questions to Consider

- Can the inheritance helper remain clear while moving outside the fixed-height Demo panel to recover selected-list space?
- Should the docs example emphasize the compact 240px state or the 380px component default when showing a four-item selection?
