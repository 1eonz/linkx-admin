# LxTransferPanel Width Recheck

Target: `http://127.0.0.1:4174/components/lxtransferpanel`  
Run date: 2026-10-09  
Product source edited: no

## Static detector

Each Vue target was scanned separately. The captured JSON, stderr, and process exit code are saved individually under `detector/`.

| Target | JSON | stderr | exit code |
|---|---|---|---:|
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `[]` | empty | 0 |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `[]` | empty | 0 |

## Browser dimensions

A new Playwright context contained one new page. The target returned HTTP 200, mutable preflight passed, the detector script injected successfully, and the preview remained HTTP 200 after the run. Four clean captures and four corresponding overlay captures were saved under `browser/`.

| View | Preview | Surface | Computed max-width | Surface center offset | Document scroll/client | Panel scroll/client |
|---|---:|---:|---:|---:|---:|---:|
| Desktop default, 1440px | 880px | 760px | 760px | 0px | 1440 / 1440 | 760 / 760 |
| Desktop HUD, 1440px | 880px | 760px | 760px | 0px | 1440 / 1440 | 760 / 760 |
| Selected mobile panel, 320px | 272px | 272px | 760px cap | 0px | 320 / 320 | 272 / 272 |
| Selected mobile panel, 390px | 342px | 342px | 760px cap | 0px | 390 / 390 | 342 / 342 |

At desktop, the surface has 60px margins inside the 880px preview and is centered exactly. At 320px and 390px, the surface and panel fit their available 272px and 342px widths. The document, surface, and component all have matching scroll/client widths on mobile. Every width assertion passed.

## Source hashes

Hashes match at the start and end of the browser run (`sourceHashesUnchanged: true`).

| File | SHA-256 |
|---|---|
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `c674ca27197fa3cd0b842492477db3138eb356d9ec76e89abb42b6e600b18ce8` |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `7a6c9a1c4003270148dff12bd474b8d9f66b603df2493e91edb869b8001a83b3` |
| `linkx-fe/docs/.vitepress/theme/custom.css` | `1a0a67582ebaa8076d1754ca32bd939f6bffda9c64b477306133b69f4630d4c4` |
| `linkx-fe/docs/components/lxtransferpanel.md` | `4387514ccac78de78ec17f9540471ab3d9eeaba3ac35708fe7fcb628073e3914` |

## Overlay and runtime

Browser overlay runs reported 26 findings in desktop default, 61 in HUD, and 7 in each mobile view. Most are documentation-shell/code-copy rules; HUD also produced repeated `ai-color-palette` matches on cyan-on-dark elements and one `cramped-padding` match on the HUD preview. These overlay findings are separate from the static source scans and width assertions; raw per-view entries are saved as `browser/views/*.overlay.json`.

The page recorded no JavaScript errors, failed requests, or HTTP responses at/above 400. The docs page's screenshot and DOM measurements are saved in `browser/screenshots/` and `browser/views/`. The Impeccable helper started on port `8400` for this run and was stopped successfully; the user preview service on port `4174` was left running.

## Evidence index

- `run-summary.json`
- `source-hashes-start.json` and `source-hashes-end.json`
- `detector/component.stdout.json`, `detector/component.stderr.txt`, `detector/component.exit-code.txt`
- `detector/demo.stdout.json`, `detector/demo.stderr.txt`, `detector/demo.exit-code.txt`
- `browser/preflight.json`, `browser/overlay-injection.json`, and `browser/browser-errors.json`
- `browser/screenshots/` and `browser/views/`

Scope limitation: these are static detector and documentation-preview results. They do not establish real-backend behavior or production integration.
