# Assessment B Final Evidence

Target:

- `linkx-fe/src/components/LxTransferPanel/index.vue`
- `linkx-fe/src/components/LxTransferPanel/demo/basic.vue`
- `http://127.0.0.1:4174/components/lxtransferpanel`

Run date: 2026-10-09. This report is for the final source revision and does not modify product source.

## Source freeze

The browser run started and ended with the expected hashes:

- `index.vue`: `C674CA27197FA3CD0B842492477DB3138EB356D9EC76E89ABB42B6E600B18CE8`
- `demo/basic.vue`: `CCAA9F9EDDFE0650E2506DFB80D248788176F8CBFB21344CC13CE1AAF6C0001C`

## Static detector

The two targets were scanned separately with `detect.mjs --json`:

| Target | stdout | stderr | exit |
|---|---:|---|---:|
| `index.vue` | `[]` | empty | `0` |
| `demo/basic.vue` | `[]` | empty | `0` |

`[]` is static detector output only; it is not browser approval.

## Browser evidence

- Fresh Playwright context with exactly one page.
- Target response: HTTP 200.
- Mutable preflight passed: title mutation, appended script, and inline script execution all succeeded.
- Overlay injection passed: `/detect.js` loaded and both `impeccableScan` and `impeccableDetect` were functions.
- Eight screenshots were captured: four clean views and four overlay views.
- Page errors, failed requests, and HTTP responses >= 400: none in the run artifacts.
- Target health was HTTP 200 before and after capture.
- The Impeccable server ran on port `8400` (PID `17540`) and its stop command exited `0`; its health endpoint was unreachable afterward, confirming shutdown. The `4174` preview was not stopped.

### View measurements

| View | Panel rect | Panel scroll/client | Document scroll/client | Overlay findings |
|---|---|---|---|---:|
| `01-clean-desktop-invert-popover-240` | `880 x 240` | `880 / 880` | `1440 / 1440` | 0 |
| `02-clean-desktop-compact-300` | `880 x 300` | `880 / 880` | `1440 / 1440` | 0 |
| `03-clean-mobile-320-selected` | `272 x 488` | `272 / 272` | `320 / 320` | 0 |
| `04-clean-mobile-390-selected` | `342 x 488` | `342 / 342` | `390 / 390` | 0 |
| `05-overlay-desktop-invert-popover-240` | `880 x 240` | `880 / 880` | `1440 / 1440` | 32 |
| `06-overlay-desktop-compact-300` | `880 x 300` | `880 / 880` | `1440 / 1440` | 26 |
| `07-overlay-mobile-320-selected` | `272 x 488` | `272 / 272` | `560 / 320` | 7 |
| `08-overlay-mobile-390-selected` | `342 x 488` | `342 / 342` | `630 / 390` | 7 |

The clean mobile views have no page overflow and the component and selected list are exact-width. The wider document values occur only after detector overlays are mounted; they are overlay instrumentation overflow, not component overflow. Code samples in the documentation retain their own horizontal scrolling container.

For the expanded desktop popover (`01` and `05`), the measured geometry is:

- summary bottom: `580px`
- source header bottom: `581px`
- popover content top: `626px`
- offset from summary bottom: `+46px`
- offset from header bottom: `+45px`
- computed position: absolute, `inset-block-start: 81px`, `max-height: 64px`, `overflow-y: auto`

## Overlay classification

The desktop overlay totals are 31 elements/32 findings for the expanded popover and 25 elements/26 findings for compact mode. The mobile totals are 6 elements/7 findings in each selected-panel view.

- Documentation-shell findings: line-length (19), buried-raster code-copy controls (3), the API table edge-flush rule, the mobile VitePress hamburger container clipping rule, and the shared body bounce/layout transition rules.
- Design-token signal: `gpt-thin-border-wide-shadow` identifies the panel popover's intentional 1px border plus the shared popover shadow token.
- Expected overlay layering: the six desktop `text-occlusion` findings occur only while the opaque, z-indexed scope-action popover is open. The screenshot shows the popover content itself legible; the detector is reporting the intentionally covered tree rows underneath it.
- One browser console 404 is present for the docs shell's `/favicon.ico`; it is not a component request failure and is excluded from `page-errors.json`.

## Artifact index

- Browser run: `browser/attempt-5/run-summary.json`
- Preflight: `browser/attempt-5/browser-preflight.json`
- Overlay injection: `browser/attempt-5/overlay-injection.json`
- View index: `browser/attempt-5/views-index.json`
- Per-view DOM and metrics: `browser/attempt-5/views/*.json`
- Screenshots: `browser/attempt-5/screenshots/*.png`
- Static detector: `detector/attempt-2/`
- Frozen hashes: `source-hashes-final-revision.txt`

Limitations: this is static detector plus mocked/documentation browser evidence. It does not establish real-backend behavior, production permissions, or live API integration.
