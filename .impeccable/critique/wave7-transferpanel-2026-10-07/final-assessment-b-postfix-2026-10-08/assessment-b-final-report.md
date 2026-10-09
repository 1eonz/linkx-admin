# LxTransferPanel Final Assessment B

Post-fix browser and detector evidence for the frozen source at `http://127.0.0.1:4174/components/lxtransferpanel`. Product source was not modified during this assessment.

## Source Freeze

Seven files were SHA-256 hashed before and after the assessment. All seven hashes match; see `source.sha256.before.json`, `source.sha256.after.json`, and `source.sha256.comparison.json` for the complete fingerprints.

- `linkx-fe/src/components/LxTransferPanel/index.vue`
- `linkx-fe/src/components/LxTransferPanel/demo/basic.vue`
- `linkx-fe/src/components/LxTransferPanel/types.ts`
- `linkx-fe/docs/components/lxtransferpanel.md`
- `linkx-fe/docs/.vitepress/theme/custom.css`
- `other-admin/admin-vue3/tests/unit/lx-transfer-panel.test.ts`
- `other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts`

## Static Detector

The official command was `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json "<target>"`, run from the repository root for the component, Demo, and docs targets. Each run returned stdout `[]`, empty stderr, and exit code `0`. The exact command and unmodified output are in the per-target `detector.*.{command.txt,stdout.json,stderr.txt,exit-code.txt}` files; `detector.summary.json` indexes the runs. This is static-source evidence only.

## Browser Matrix

Each scenario used a fresh Playwright context and page. The official `detect.js` was injected successfully; the collector saved JSON, console output, an overlay screenshot, and a pre-overlay screenshot for each view.

| Scenario | View and interaction | Result |
| --- | --- | --- |
| `desktop-light-filter-keyboard` | 1440x1100 light; filter `待授权`, follow Shift+Tab focus, activate batch select with Enter | Candidate visible; focus reached `反选筛选结果` then `全选筛选结果`; Enter activated the latter. |
| `desktop-dark-loading` | 1440x1100 full-site dark plus HUD; select loading state | Dark class and HUD active; `aria-busy=true`; loading status visible. |
| `mobile-light-empty` | 375x844 light; select empty result | Empty tree shown; existing five selected keys remain. |
| `mobile-320-reflow` | 320x780 light | Before detector injection, document, demo, and transfer panel were each 272px wide inside a 320px viewport; document scroll width equaled 320px. No horizontal overflow. |
| `mobile-dark-error` | 375x812 full-site dark plus HUD; select error state | Mobile theme switch worked through the open navigation menu; error alert and retry action were visible. |
| `desktop-light-clear-confirmation` | 1440x1100 light; activate clear-all | Confirmation explained that an unloaded selected node could not be checked; cancel was available and was used. |
| `desktop-400-percent-browser-zoom` | 1280x1000; dispatch `Ctrl+Shift+=` seven times | Browser zoom did not apply: `innerWidth` and visual viewport stayed 1280px and DPR stayed 1. This is not 400% evidence. The 320 CSS-pixel reflow scenario is the verified narrow-width result. |

All seven pages returned HTTP 200. Injection and detector API checks passed in every context; there were no page errors or failed requests. Browser version, exact state data, viewport measurements, findings, and console messages are in `browser-assessment.json`, each `<scenario>.json`, and `browser-console.json`. `browser.exit-code.txt` is `0`; `browser.stderr.txt` is empty.

## Finding Attribution

- The filtered source title produced one component selector hit: `#lx-transfer-panel-161-source-title`. Its measured text width was 176px in a 150px title box, a 26px difference. The component applies `overflow: hidden`, ellipsis, and a full-text `title` attribute; this is intentional truncation rather than page-level overflow. The title remains a review point for narrow title space, especially for touch users who do not receive hover tooltips.
- HUD scans repeated the cyan-palette rule on checked tree rows and controls. The cited color is the documented HUD primary token `#38bdf8` in `linkx-fe/src/tokens/theme-hud.css`; it is an intentional theme token, not an unplanned neon palette. Purple/violet hits targeted VitePress Shiki code-highlight spans, not the transfer panel.
- `text-occlusion` targeted the detector's own `✦ ai color palette` label behind the demo settings disclosure, so it is an overlay artifact.
- Other repeated matches were on VitePress or rendered documentation: `body` easing/layout transitions, syntax-block copy buttons, docs tables/containers, and line-length heuristics on Chinese docs text. They are not component selectors. The full selector and detail lists remain in each scenario JSON; counts are not unique defects.
- The 375px and 320px pages measured no overflow before injection. After detector injection, mobile full-page captures widened to 615px and 560px respectively while visual viewports remained 375px and 320px. Treat that extra width as injection-time behavior; the paired `pre-overlay-*.png` captures and `preInjectionLayout` measurements show the product page geometry before the overlay.

## Evidence Files

- Detector: `detector.*.command.txt`, `detector.*.stdout.json`, `detector.*.stderr.txt`, `detector.*.exit-code.txt`, `detector.summary.json`
- Browser commands and summary: `browser.command.txt`, `browser.stdout.json`, `browser.stderr.txt`, `browser.exit-code.txt`, `browser-assessment.json`, `browser-console.json`
- Per-view records and screenshots: `<scenario>.json`, `<scenario>.png` (detector overlay), `pre-overlay-<scenario>.png`
- Source freeze: `source.sha256.before.json`, `source.sha256.after.json`, `source.sha256.comparison.json`
- Overlay cleanup: `overlay-server.start.*`, `overlay-server.stop.*`, `overlay-server.stop-verification.json`

The 8400 overlay helper exited successfully and its port was verified unreachable. The VitePress server on 4174 remains available and returns HTTP 200.
