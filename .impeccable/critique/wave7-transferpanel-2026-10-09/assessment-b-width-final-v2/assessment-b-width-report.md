# LxTransferPanel 820px Width Recheck

Target: `http://127.0.0.1:4174/components/lxtransferpanel`  
Run date: 2026-10-09  
Final rule checked: Demo preview surface max-width `820px`  
Product source edited during this assessment: no

## Static detector

The component and Demo were scanned separately. For each scan, the raw JSON stdout, stderr, exit code, command, and process metadata are preserved under `detector/`.

| Target | JSON | stderr | exit code |
|---|---|---|---:|
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `[]` | empty | 0 |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `[]` | empty | 0 |

Both JSON outputs parsed successfully and both detector processes completed successfully.

## Browser verification

A fresh Playwright context contained one new page. The target returned HTTP 200, mutable preflight passed, and the browser detector script injected successfully (`impeccableScan` and `impeccableDetect` both available). Four clean views and four corresponding overlay views were captured.

| View | Preview width | Surface width | Computed max-width | Center offset | Document scroll/client | Panel scroll/client |
|---|---:|---:|---:|---:|---:|---:|
| Desktop default, 1440px | 880px | 820px | 820px | 0px | 1440 / 1440 | 820 / 820 |
| Desktop HUD, 1440px | 880px | 820px | 820px | 0px | 1440 / 1440 | 820 / 820 |
| Selected mobile panel, 320px | 272px | 272px | 820px cap | 0px | 320 / 320 | 272 / 272 |
| Selected mobile panel, 390px | 342px | 342px | 820px cap | 0px | 390 / 390 | 342 / 342 |

At desktop, the surface has 30px margins inside the 880px preview and is centered exactly. At 320px and 390px, it fills the 272px and 342px available widths. The document, surface, and panel have matching scroll/client widths at both mobile sizes. All width assertions passed.

## Source hashes

The hashes below were unchanged from the start through the end of browser capture (`sourceHashesUnchanged: true`).

| File | SHA-256 |
|---|---|
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `c674ca27197fa3cd0b842492477db3138eb356d9ec76e89abb42b6e600b18ce8` |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `d5c9c97f4418cacb3791af5b2905ea0fc552e4fe4cc3cc528c0de3a694771dc9` |
| `linkx-fe/docs/.vitepress/theme/custom.css` | `1a0a67582ebaa8076d1754ca32bd939f6bffda9c64b477306133b69f4630d4c4` |
| `linkx-fe/docs/components/lxtransferpanel.md` | `ac1343a4bdecab3fa8b6406972c754bd0f728cda742be9e4c7945c829ed304d6` |

## Overlay and runtime

Overlay scans reported 26 findings for desktop default, 61 for HUD, and 7 for each mobile view. These are recorded separately from the clean-view width measurements in `browser/views/*.overlay.json`. Browser page errors, failed requests, and HTTP responses at/above 400 were all empty. The preview remained HTTP 200 after capture.

The Impeccable helper was started by this run on port `8400` and stopped successfully; its health endpoint was unavailable afterward. The `4174` preview was not stopped.

## Evidence index

- `run-summary.json`
- `source-hashes-start.json` and `source-hashes-end.json`
- Detector JSON/stderr/exit code for `component` and `demo` under `detector/`
- `browser/preflight.json`, `browser/overlay-injection.json`, and `browser/browser-errors.json`
- Clean screenshots: `browser/screenshots/`
- Overlay screenshots: `browser/overlay-screenshots/`
- Per-view dimensions and overlay findings: `browser/views/`

Scope limitation: these are static detector and documentation-preview results. They do not establish real-backend behavior or production integration.
