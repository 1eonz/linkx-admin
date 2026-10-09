# LxTransferPanel Assessment B

Method: single-context Assessment B continuation (detector and browser evidence only; this is not a combined Assessment A/B critique).

## Scope and result

Target: `linkx-fe/src/components/LxTransferPanel/index.vue`, with its VitePress demo at `http://127.0.0.1:4198`. This record uses the Assessment B artifacts in this directory only; it does not import Assessment A findings.

The static detector completed successfully for the component source: stdout `[]`, stderr empty, exit code `0`. That is a zero-hit result for this source file only, not a whole-page or visual pass. Browser evidence covers desktop light mode with the scope menu open, desktop HUD dark mode, and a 375px reduced-motion view with a long selected name expanded.

## Detector evidence

| View | Overlay title count | Visible overlay elements | Raw `ruleRows` | Console `log` rows |
|---|---:|---:|---:|---:|
| Desktop light, scope menu | 26 | 25 | 28 | 27 |
| Desktop HUD dark | 58 | 56 | 60 | 59 |
| Mobile 375px, reduced motion | 10 | 5 | 12 | 11 |

Each `ruleRows` array includes one console group-heading row. After excluding that row, the console still has one more `log` row than the overlay title count in each view. These are different detector output layers; the evidence does not explain the remaining one-row delta. Do not treat the overlay title, visible elements, or console rows as a reconciled unique-issue total.

The rule hits attribute as follows:

| Rule | Captured hits | Attribution |
|---|---|---|
| `line-length` | 17 in each desktop view | VitePress demo prose and nearby documentation content, with reported lines around 106–108 characters. These are page-content findings, not transfer-panel geometry. |
| `buried-raster` | 3 in every view | `button.copy` code-copy controls in the docs shell. The captured target is not a transfer-panel control. |
| `edge-flush-cards` | 1 in every view | A docs table with 11 cards near its left edge; this is the component documentation table. |
| `bounce-easing`, `layout-transition` | 1 each in every view | Rules reported on `body` for the VitePress page. They are not attributed to `LxTransferPanel`; the mobile scenario had `prefers-reduced-motion: reduce` enabled. |
| `text-occlusion` | 4 in desktop light | The open scope menu covers underlying source-tree content by design. The menu itself, its action button, and its text fit inside the panel and viewport. The screenshot shows the popover occupying the tree area, so these hits describe covered content behind an open overlay, not clipped menu content. |
| `ai-color-palette` | 35 in HUD dark | Repeated candidates against the explicitly selected HUD dark theme. The screenshot shows the intended dark surface and cyan accents; do not count these repeated color matches as 35 independent component defects. Review the theme tokens if this palette is reconsidered. |
| `cramped-padding` | 1 in HUD dark | The target is the demo preview wrapper (`transfer-panel-demo__preview`), not the component's internal panel padding. |
| `clipped-overflow-container` | 1 on mobile | The target is the docs wrapper `span.container`. The component root remained within its own width; the captured component content was not clipped. |
| `text-occlusion` | 4 on mobile | Three hits identify demo state/theme controls under the mobile switch; one identifies the “提供继承说明” label under a neighboring button. Treat this as a narrow-screen demo-control density issue for follow-up, not as evidence that transfer-panel content is occluded. |

The only captured browser console error was `Failed to load resource: 404` for `http://127.0.0.1:4198/favicon.ico`, a VitePress preview asset request. No component runtime error was recorded.

## Browser observations

- In the desktop light scenario, keyboard navigation reached “更多反选选项” after 82 Tab steps and showed a visible focus ring. Pressing Enter did not open the menu; the recorded pointer fallback did. The evidence does not record a Space activation attempt, so it does not establish that every keyboard activation path fails. Retest this trigger with both Enter and Space before closing the accessibility finding.
- Once open, the scope menu measured 280×98px, its action button was visible, and both fit inside the 350×380px panel and the viewport. Its explanatory text states that inversion applies to the loaded tree, including filtered-hidden nodes, while disabled nodes and selected keys outside the tree remain unchanged.
- In the HUD scenario, Space toggled the theme control successfully. The component panel background computed to `rgb(16, 26, 44)`; the component root had no horizontal overflow and remained in the viewport.
- Before detector injection, the 375px page measured 375px document and body scroll widths, with no horizontal overflow. The component root was 327px wide with matching client and scroll widths, and remained in the viewport. The detector-injected measurement later reported `innerWidth` and document scroll width of 615px while body width stayed 375px and the component root stayed 327px. Keep these post-injection values separate from the pre-overlay page measurement; the detector stage changed the measured document geometry.
- In the mobile reduced-motion scenario, the focused long-name disclosure expanded with the keyboard and kept a visible focus indicator. Immediately after expansion, the full-text box ended about 0.55px below the tree-list boundary (`fullWithinList: false`), but remained within the panel and viewport and was not text-clipped. After scrolling the list, the full text was inside the list, panel, and viewport. The screenshots show the expanded name readable; this is a subpixel boundary condition, not a blocking truncation.

## Cleanup and follow-up

The detector server on port `8400` stopped with exit code `0`; its port was released. The browser profile and detector temporary root were removed. Preview port `4198` is recorded as released, but its saved process exit-code field is `null`; the preview process exit status is therefore unverified.

Priority follow-up is to reproduce the scope-menu Enter behavior and test Space separately. The 0.55px mobile list-boundary overrun is a low-severity polish item if it persists across a fresh capture. Revisit the 375px demo control row as documentation usability work. The static `[]` result and this Assessment B record do not replace Assessment A, a combined Impeccable Critique, or broader browser/accessibility acceptance.

Questions skipped: 用户要求继续执行，无需提问
