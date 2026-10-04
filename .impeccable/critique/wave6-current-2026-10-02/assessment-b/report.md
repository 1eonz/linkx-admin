# Assessment B: LxTreeSelect and LxCascader

Method: isolated Assessment B sub-agent; detector and browser evidence only. This report is independent of any design-review assessment.

## Targets

- `linkx-fe/src/components/LxTreeSelect/` including its demo, and `linkx-fe/docs/components/lxtreeselect.md`
- `linkx-fe/src/components/LxCascader/` including its demo, and `linkx-fe/docs/components/lxcascader.md`
- Local docs site: `http://127.0.0.1:4174/components/lxtreeselect` and `/components/lxcascader`

## Static detector

Ran the bundled `detect.mjs --json` against both component directories and both documentation files. Every scan returned `[]`, empty stderr, and exit code `0`. These are markup/source-scope results only; they do not establish that the rendered page has no issues.

Raw JSON, stderr, and exit-code files are preserved for each target as `treeselect-source.*`, `treeselect-docs.*`, `cascader-source.*`, and `cascader-docs.*`.

## Browser evidence

Opened the live docs with a fresh TreeSelect tab in the in-app browser. This sub-agent could not create a second in-app tab, so a fresh isolated Playwright/System Chrome context was used for the remaining page and state captures. Mutable preflight succeeded: the page title changed, an inline script element was appended, and its script executed. The preflight restored the title and removed its temporary script.

Injected the detector overlay into six fresh local page views after starting the bundled temporary live server: TreeSelect desktop docs, open selector, mobile error; Cascader desktop docs, open selector, mobile error. Overlay summaries reported 8, 8, 9, 8, 10, and 7 findings respectively. Screenshots and the full visible-text, request, and console evidence are saved beside this report. All 2,442 recorded requests stayed on localhost (docs port 4174 or overlay port 8401); there were no browser console errors.

The overlay raised low contrast repeatedly (`#86909c` on white, 3.2:1), `buried-raster`, thin-border/wide-shadow, and `layout-transition` findings. Cascader additionally raised an 88–89% Inter usage rule and docs first-column-height findings. On open states it raised TreeSelect popper clipping and Cascader text occlusion over the `失败` and `禁用` demo buttons.

## Signal quality and limits

- The low-contrast color ratio is a real computed signal, though repeated hits may share one token or target docs chrome, hints, or placeholders; the overlay alone does not prove every hit is a component defect.
- `buried-raster` appears anchored to the code-fence language badge, where the rendered page shows no buried raster image. This is a likely false positive.
- `edge-flush-cards` tracks the VitePress API tables, whose cells intentionally form continuous tables rather than separate cards. `first-viewport-column-overflow` likewise measures long documentation content against the short outline column. These are docs-shell/reading-layout signals, not component-specific evidence.
- TreeSelect's popper was fully visible in the captured open-state screenshot, so the clipping alert appears to be a geometry false positive for the teleported popup.
- Cascader's `失败` and `禁用` occlusion alerts occur while its expected floating popup is open and target demo controls outside the visible viewport. The captured popup and selected nodes render correctly; this is likely a whole-DOM overlap false positive for that state.
- On mobile, the detector toolbar itself extends beyond the 375px viewport and inflates the measured document width to 615px. Without the overlay, both pages report a 375px document width; the wider API tables stay inside their horizontal-scroll wrappers.
- Screenshots include the injected diagnostic overlay, which covers portions of the docs content. In-app browser visibility was unavailable in this delegated thread, so the standalone headless captures are the disk-backed screenshot evidence.

The temporary overlay server started on port 8401 and is stopped; no listener remains. Its stop helper returned a `config_missing` cleanup diagnostic because direct `/detect.js` injection did not create persistent live-mode configuration. No server-side script tag was added; each injected detector lived only in the temporary browser page, which was closed after capture.

## Evidence index

- `browser-evidence.json`: six viewport states, visible text, dimensions, request and console records.
- `browser-requests.json`, `browser-console.json`, `overlay-summary.json`: separated raw browser sidecars.
- `treeselect-docs-desktop.png`, `treeselect-open-desktop.png`, `treeselect-error-mobile.png`.
- `cascader-docs-desktop.png`, `cascader-open-desktop.png`, `cascader-error-mobile.png`.
- `capture-browser-evidence.mjs`: repeatable local capture procedure.
- `live-server.stdout.json`, `live-server.stderr.txt`, `live-server.exit-code.txt`, and corresponding `live-server-stop.*` files: lifecycle evidence.
