# Assessment B — AuthImg current target

Target: `other-admin/admin-vue3/src/components/AuthImg/index.vue`

Host page: `http://127.0.0.1:30847/thirdParty/unifiedComm` in the Vue3 `mock-preview` host. The host listener was already running before this assessment; it was not stopped.

## Detector evidence

- Command: `node C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs --json other-admin/admin-vue3/src/components/AuthImg/index.vue`
- Exit code: `0`
- JSON stdout: `detector.stdout.json` (`[]`)
- stderr: `detector.stderr.txt` (empty)
- Exact exit code: `detector.exit-code.txt` (`0`)
- Interpretation: the current component source produced zero deterministic detector findings.

## Browser evidence

Injection preflight succeeded in the fresh Codex in-app browser tab: CDP `Runtime.evaluate` changed `document.title`, appended an inline script marker, and verified the marker before restoring the title. The live overlay script loaded successfully from `http://localhost:8400/detect.js` and emitted `[impeccable] 30 anti-patterns found`.

The probe was injected into the host page only for evidence. It mounted the current `AuthImg` component with controlled local fetch fixtures:

- success: HTTP 200 SVG fixture; DOM exposed `img` with the supplied alt text;
- error: HTTP 503 fixture; DOM exposed the retry button with `图片加载失败，重新加载 错误状态示例` and visible `重试`;
- loading: request intentionally held; DOM exposed `aria-busy=true` and `加载状态示例，图片加载中`.

Reduced-motion emulation matched `(prefers-reduced-motion: reduce)` and the loading icon computed `animation-name: none`.

## Browser overlay classification

The 30 runtime findings are host-shell findings or artifacts of the temporary probe, not findings attached to `.auth-img-placeholder` / `.auth-img-placeholder__retry`:

- Host shell: sidebar/main layout transition, clipped sidebar overflow, logo glow, repeated menu-item cramped padding, low contrast on inactive tabs, nested table/card styling, tooltip shadow, and low contrast in a host error toast.
- Probe false positives: generic low-contrast labels in the temporary state cards and the temporary probe container. These labels were injected by this assessment and are not application source.
- Target-specific overlay findings: none observed. The source detector was also clean.

## Server and cleanup

- Overlay server: started with `node C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs --background` (port `8400`, PID `2564`); stopped with `node C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs stop`. Stop reported `Stopped live server on port 8400`; its optional config cleanup reported `config_missing` because this run used manual CDP script injection. The injected script and probe were explicitly removed through CDP.
- Evidence receiver: temporary localhost receiver on `127.0.0.1:32895`; stopped with `POST /shutdown` after all files were written.
- The existing Vue host at port `30847` was left running because it predated this assessment.

## Limits

- Mock preview data had no production device-icon rows, so success/error/loading states were controlled local fixtures mounted beside the page table.
- Browser overlay findings are page-level and include the host shell; they do not override the clean component-source detector result.
- The native sub-agent browser could not be made visible in the foreground; DOM, CDP, console, and PNG capture evidence were still collected from a fresh tab.
