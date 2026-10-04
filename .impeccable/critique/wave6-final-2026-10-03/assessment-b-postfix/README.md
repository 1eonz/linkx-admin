# Wave 6 Assessment B: TreeSelect and Cascader

Independent detector and browser evidence only. No Assessment A material was opened or used.

## 2026-10-03 evidence refresh

- The four current detector targets (`LxTreeSelect/index.vue`, `LxCascader/index.vue`, `lxtreeselect.md`, and `lxcascader.md`) were rerun after the current edits. Each returned valid JSON `[]`, empty stderr, and exit code 0. These are static zero-hit results only.
- Raw outputs are stored as `current-treeselect-source.*`, `current-cascader-source.*`, `current-treeselect-doc.*`, and `current-cascader-doc.*` in this directory; each set contains separate stdout JSON, stderr, and exit-code files.
- The lx-ui Playwright suite was rerun with `other-admin/admin-vue3/playwright.lxui.config.ts` against VitePress on port 4176: 8/8 passed, including visibility of the Cascader demo on the New Components overview, keyboard selection, error/loading/disabled states, reduced motion, 375px touch targets, and TreeSelect first-viewport visibility.
- Browser inspection on the local docs tab confirmed the standalone Cascader page renders its labeled interactive demo and the sidebar links to it. The overview route is `/components/new-components.html`; the standalone route is `/components/lxcascader.html`.
- Current overlay status remains unavailable. The browser rejected the mutable-injection preflight and prohibited alternate injection paths. October 2 overlay screenshots predate the current source/document edits, so this refresh does not constitute formal Impeccable Critique completion or current overlay evidence.

## Historical detector snapshot (October 2)

The table below records the original Assessment B scans only; it is not the current scan record. October 3 refresh results are stored separately in the `current-*` files listed above.

| Target                                                              | JSON result | stderr | exit code | Finding count |
| ------------------------------------------------------------------- | ----------- | ------ | --------: | ------------: |
| `linkx-fe/src/components/LxTreeSelect/index.vue`                    | `[]`        | empty  |         0 |             0 |
| `linkx-fe/src/components/LxCascader/index.vue` (after Delete guard) | `[]`        | empty  |         0 |             0 |
| `linkx-fe/docs/components/lxtreeselect.md`                          | `[]`        | empty  |         0 |             0 |
| `linkx-fe/docs/components/lxcascader.md`                            | `[]`        | empty  |         0 |             0 |

The original JSON stdout, stderr, and exit code are retained beside this file. The initial Cascader source run predates the Delete guard and is retained as `lxcascader-detector-before-delete-guard.*`; the historical `lxcascader-detector.*` run was rerun after that guard. The remaining historical scans predate later source/document edits and are superseded for the current revision by the four `current-*` result sets above. Each result describes only the bytes scanned in that run.

## Browser evidence

| Page       | Fresh tab                                              | View and state                                                                                                                                                                                                                                                                                                                                                                  | Theme                                                          | Viewport   | External requests                                               | Screenshot                                                                                                                      |
| ---------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| TreeSelect | Tab 1, `http://127.0.0.1:4174/components/lxtreeselect` | Interactive example in view; demo controls expanded; single-select default; current value `bj`; retry count `0`; empty/loading/failure controls visible                                                                                                                                                                                                                         | Light docs theme; HUD dark unchecked; English locale unchecked | 1264 x 713 | Not observable through the available CUA API; no count inferred | Captured inline through CUA, but the API exposes no workspace export path                                                       |
| Cascader   | Tab 2, `http://127.0.0.1:4174/components/lxcascader`   | After the latest source update, page reloaded; failure demo + focused `Delete` preserved the selected path. Normal-state keyboard path: `ArrowDown` opened/focused root, `Right` advanced columns, `Down` moved to a sibling, and `Enter` selected `巡防大队`. Search `滨江` showed one matching path; `Enter` then closed the popup but left the prior selected path unchanged | Light docs theme                                               | 1264 x 713 | Not observable through the available CUA API; no count inferred | Error, expanded-menu, and filtered-result screenshots captured inline through CUA, but the API exposes no workspace export path |

The screenshot images are present in the CUA observations for this Assessment B run. The available screenshot method returns images to the tool transcript and does not expose bytes or a filesystem destination, so PNG files could not be saved. This limitation is recorded instead of fabricating screenshot paths.

## Overlay attempt and limitation

Browser visualization status: degraded evidence; live overlay unavailable, not passed. The CUA browser opened both localhost pages successfully in newly created tabs. A mutable-injection preflight was attempted on the TreeSelect page by navigating to a `javascript:` URL that would set `document.title` and append a script element. The browser rejected that protocol because only `http:` and `https:` are allowed, and explicitly prohibited workaround execution through indirect injection, CDP, browser commands, or alternate browser surfaces. No further injection was attempted.

Because mutation was unavailable, the Impeccable live overlay was skipped and its live server was not started. No overlay or page-console detector output is claimed. The browser observations are manual CUA page and accessibility-tree evidence only. External request counts were not observable through CUA and remain unknown.
