# Assessment B: LxTreeSelect and LxCascader

Method: isolated Assessment B (detector + browser evidence); no Assessment A findings were read.

## Scope and target availability

- TreeSelect docs: `http://127.0.0.1:4174/components/lxtreeselect.html` returned HTTP 200.
- Cascader docs: `http://127.0.0.1:4174/components/lxcascader.html` returned HTTP 200.
- Both were opened in fresh browser tabs at desktop viewport (observed screenshot dimensions: 1264x719).
- The existing docs server on port 4174 was left running.

## Static detector

| Target | Result | Exit | stderr |
|---|---:|---:|---|
| `linkx-fe/src/components/LxTreeSelect/index.vue` | `[]` (0 static findings) | 0 | empty |
| `linkx-fe/src/components/LxCascader/index.vue` | `[]` (0 static findings) | 0 | empty |
| `linkx-fe/docs/components/lxtreeselect.md` | `[]` (0 static findings) | 0 | empty |
| `linkx-fe/docs/components/lxcascader.md` | `[]` (0 static findings) | 0 | empty |

Each target's raw JSON stdout, stderr, and exit code is preserved beside this report. Empty arrays only mean no static rules matched these targets; they are not visual or accessibility approval.

## Browser evidence

### LxTreeSelect

- Fresh desktop tab rendered the component title, usage example, interactive demo, and props/events table.
- Expanded the control: the three-level organization tree appeared with expanded states and a disabled node exposed in the accessibility tree. The screenshot showed the popup anchored beneath the input and contained within the demo content width.
- Expanded demo status controls and triggered the failure state. The input received an error border, the error text appeared adjacent to the control, and a keyboard-focusable `重试` button was exposed. The accessibility tree associated the error container with `tree-select-demo-organization-error`.
- Triggered loading once. The demo transitioned back to its data/loading flow too quickly for a stable loading screenshot; no claim is made that the transient loading frame was captured.

### LxCascader

- Fresh desktop tab rendered the component title, labeled organization-path control, interactive demo, design notes, and props/events table.
- Expanded the control: three cascading columns were shown, the current path was marked, and disabled data was distinguishable. The popup aligned with the input and stayed within the page content width.
- Switched the demo to loading and error. Loading exposed `加载中`; error exposed `组织数据加载失败` and a `重试` button, while the control showed an error border. The accessibility tree exposed the error/retry contents.

## Overlay, screenshots, console, and viewport limits

- The browser bridge available in this isolated worker exposes navigation, accessibility snapshots, interaction, and transient screenshots, but no mutable page evaluation/script injection, console-log retrieval, screenshot export path, or viewport override. The required detector overlay could not be injected, so no user-visible overlay is claimed.
- Desktop screenshots were captured and visually inspected through the browser tool, but this bridge does not expose a filesystem export path; therefore no screenshot files are claimed in this artifact directory.
- Mobile-width (375px) checks were not possible because the bridge has no viewport override. Narrow-screen behavior remains unverified.
- Browser console/request-event logs were unavailable. Independent HTTP GET checks returned HTTP 200 for both docs pages, `/health`, and the detector's `/detect.js` asset; these do not substitute for page console or request instrumentation.
- The temporary Impeccable live server used to provide `/detect.js` was stopped on port 8400. Stop output noted missing `.impeccable/live/config.json` while attempting to remove an injection tag; no injection had succeeded or been applied. Port 4174 remains untouched.

## Assessment B disposition

Static scans completed successfully and both desktop demos were interactively inspected in fresh tabs. Overlay, saved screenshot artifacts, console inspection, and mobile viewport evidence are unavailable in this worker, so this is partial browser evidence and cannot be recorded as a formal visual Critique pass.
