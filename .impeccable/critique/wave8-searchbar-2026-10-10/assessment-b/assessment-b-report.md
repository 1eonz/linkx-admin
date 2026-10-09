# Assessment B report: LxSearchBar, generated 2026-10-10

## Detector evidence

Targets were scanned independently with `detect.mjs --json`.

| Target | JSON | stderr | exit code | Result |
|---|---|---|---:|---|
| `linkx-fe/src/components/LxSearchBar/index.vue` | `linkx-fe-src-components-LxSearchBar-index-vue.json` (`[]`) | matching `.stderr` (empty) | `0` | static zero-hit |
| `linkx-fe/src/components/LxSearchBar/demo/basic.vue` | `linkx-fe-src-components-LxSearchBar-demo-basic-vue.json` (`[]`) | matching `.stderr` (empty) | `0` | static zero-hit |
| `linkx-fe/docs/components/lxsearchbar.md` | `linkx-fe-docs-components-lxsearchbar-md.json` (`[]`) | matching `.stderr` (empty) | `0` | static zero-hit |

`[]` is treated only as static rule zero-hit evidence. It is corroborated by the browser run below; it is not a visual pass by itself.

## Browser evidence

The VitePress docs were served in an isolated local process at `http://127.0.0.1:4173/components/lxsearchbar`; a fresh Playwright context was used for every view. Mutable preflight (`document.title = [Human] LxSearchBar`) succeeded, and `detect.js` injection from the Impeccable live server succeeded in every captured view. Both servers were stopped after capture; stop metadata is in `docs-server/stopped.txt`.

Captured views:

- `light-desktop.png` and `light-mobile.png`: 1440px and 375px, light theme.
- `hud-desktop.png` and `hud-mobile.png`: 1440px and 375px, dark/HUD theme.
- `reduced-motion.png`: 1440px with `prefers-reduced-motion: reduce`; computed icon transition reduced to `none 1e-05s`.
- `state-default.png`, `state-empty.png`, `state-error.png`, `state-recovered.png`: success, empty, failure, then success recovery.
- `state-expanded.png`, `state-collapsed.png`, `state-keyboard-focus.png`: expand/collapse and keyboard focus.

Raw per-view console/preflight records are in `browser/*.json`; interaction state assertions are in `browser/interaction.json`.

Observed behavior: success resolves to two rows, empty resolves to `暂无匹配结果`, failure resolves to `查询服务暂不可用`, and switching back to success restores `查询到 2 条`. Expand/collapse toggles `aria-expanded` (`false` → `true` → `false`). The keyword input receives keyboard focus with a visible native/Element focus state. Desktop and 375px runs had `scrollWidth === clientWidth` (1440/1440 and 375/375), so no page-level horizontal overflow was observed.

## Overlay attribution

The detector overlay ran in the page and emitted these headline counts: light desktop 16, light mobile 7, HUD desktop 89, HUD mobile 81, reduced-motion 16. The counts are dominated by documentation shell and intentional theme tokens:

- `text-occlusion` hits are VitePress syntax-highlight table spans under opaque `th`/`td`; they are not hidden SearchBar labels or controls.
- `layout-transition`, `buried-raster`, `clipped-overflow-container`, and `edge-flush-cards` are VitePress navigation/content shell findings. Mobile shell clipping was outside the component container; component page width remained stable.
- `ai-color-palette` in HUD views is the documented cyan/violet HUD palette, an intentional product theme token.
- `gpt-thin-border-wide-shadow` marks the card wrappers that intentionally use the documented 1px border and card shadow. It is a review signal for token consistency, not a SearchBar defect.
- `line-length ~86 chars` points to docs/demo source rendering and is a minor documentation formatting observation.

No overlay hit was attributed to the SearchBar field grid, labels, action buttons, collapse control, loading/empty/error state, or focus treatment.

## Priority assessment (Assessment B only)

- **P0:** none observed.
- **P1:** none observed in the component surface or its exercised states.
- **P2:** docs source contains a few ~86-character lines flagged by the detector; consider wrapping long documentation/demo lines if docs readability is prioritized. The collapse control uses the compact library control height; if a 44px mobile touch target is a hard product requirement, confirm that token at the host level.
- **P3:** detector reports intentional card border+shadow and HUD palette usage; no corrective action indicated unless the design tokens change.

The browser evidence and static scans support a clean Assessment B for the SearchBar component, with the caveat that detector overlay counts include VitePress shell and documented theme false positives.
