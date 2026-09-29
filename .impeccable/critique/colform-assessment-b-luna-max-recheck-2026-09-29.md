# ColForm Critique Assessment B

- Date: 2026-09-29
- Assessment: B only (static detector, runtime detector, and browser evidence)
- Target source: `other-admin/admin-vue3/src/views/collaboration/components/ColForm.vue`
- Browser target: `http://127.0.0.1:30847/collaboration/index`
- Runner: `@playwright/test` 1.58.0, headless system Chrome 153.0.8010.53
- Browser run: 13 fresh contexts across desktop (`1280x720`) and mobile (`375x812`)

This file records Assessment B only. Assessment A and prior combined critiques were not read or used. The page was a local Mock preview, not real-backend acceptance. Forms were opened for observation only; no submit, upload, delete, or other write action was attempted.

## Static Detector

Command:

```text
node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json other-admin/admin-vue3/src/views/collaboration/components/ColForm.vue
```

- Exit code: `0`
- Stdout JSON: `[]` (zero static rule findings for the source file)
- Stderr: empty (`0` bytes)
- Evidence: [JSON](colform-assessment-b-luna-max-recheck-2026-09-29.detector.json), [stderr](colform-assessment-b-luna-max-recheck-2026-09-29.detector.stderr.txt), [exit code](colform-assessment-b-luna-max-recheck-2026-09-29.detector.exit-code.txt)

This only records zero static rule matches for this source target. It is not a claim that the rendered page passed Critique.

## Browser States

The route loaded in all 13 runs. Normal captures reported no horizontal document overflow: desktop `1280x720` with document `1280x720`, and mobile `375x812` with document `375x812`.

- Create: name, type, icon, organization, related people, and ticket type controls were visible. Related people prompted for an organization first.
- Organization and edit: selecting `市局指挥中心` showed three disabled Mock users already bound elsewhere. Editing `应急指挥岗` populated the organization and two selected users; its type remained disabled with the explanatory hint.
- Empty results: the local route Mock returned HTTP 200 with an empty `queryUserByPage` result on desktop and mobile. The no-result message appeared in both saved screenshots.
- Request error: the local route Mock returned HTTP 503 for `queryUserByPage` on desktop and mobile. The page showed an error toast and retry guidance while retaining the form. This was an intentional Mock failure, not a real backend response; no page exception or failed request was recorded.
- Loading: no stable loading view was captured.
- Write safety: save, update, delete, batch-delete, upload, and other non-read requests were guarded. Zero write requests matched the guard, because no write action was attempted.

Screenshots are in this directory with the `colform-assessment-b-luna-max-recheck-2026-09-29.` prefix. The create/edit desktop, empty/error desktop, and create/edit mobile files were reused from the earlier B capture in this run sequence; empty/error mobile and all five overlay images were saved during the 13-view run. The detector overlays are evidence screenshots, not a persistent overlay in the user's browser.

## Runtime Detector

Injection preflight passed: title change and restore, script append, and script execution all succeeded. `detect.js` loaded in all five representative overlay contexts. The saved detector headline counts were:

| View | Headline findings |
| --- | ---: |
| Desktop list | 31 |
| Desktop create | 31 |
| Desktop empty results | 34 |
| Mobile edit | 14 |
| Mobile request error | 22 |

Each view's raw console contains two additional advisory rows (`dark-glow` and `bounce-easing`) beyond the headline anti-pattern count. Treat these reports as rule hits, not defect counts.

The repeated findings primarily target the surrounding admin shell and table: `.sidebar-wrapper`, `.el-card` and its body, `.el-tabs`, `.el-table`, `.el-table__header-wrapper`, 18 `.el-menu-item` nodes, and the `lx-table` wrapper. They include clipped positioned children inside scroll/card/tab containers, transition properties on shell layout, tight menu/table insets, and table cells flush to a horizontal scroller edge. These are not ColForm fields; the clip reports may be expected consequences of the shell's scrolling and popup behavior and need component-level verification before repair. The `dark-glow` hit uses the project's brand blue `#264ed1`; treat it as a token-backed design hit, not an automatic defect.

ColForm-specific runtime evidence is narrower:

- In the desktop empty-results view, the detector reported three text-occlusion matches. Two are page pagination text behind the open modal/select layers; these are shell/background hits. One is the ticket-type placeholder under the related-people empty-state popper. The ordinary screenshot confirms that the popper reaches the next form field.
- In the mobile error view, the detector reported two low-contrast hits: `#f56c6c` on `#fef0f0` at `2.6:1`, below the normal-text `4.5:1` WCAG contrast target. The ordinary error screenshot shows this pairing in error feedback.
- The same mobile error overlay reported six text-occlusion hits. Four refer to table labels/actions behind the modal and are invalidated by the overlay viewport anomaly below. The remaining status text, `人员加载失败，已选人员仍保留。请重试。`, is partly covered by the related-people error popper in the ordinary mobile screenshot. The popper supplies its own retry text, but hides the secondary feedback beneath it.

## Overlay Viewport Anomaly

The normal mobile captures remain `375x812`. After detector injection, the mobile edit context reported `377x817`, while the mobile error context reported `545x1181`; its saved raster remains `375x812` and the dialog was positioned at `x=101` with width `343`, so the screenshot crops the right side. The ordinary error screenshot before injection has the dialog at `x=16` and fits the viewport. Therefore, do not use the mobile error overlay geometry or its background-row occlusion findings as product evidence. The error-state screenshot without an overlay remains valid evidence for the form state and feedback overlap.

Desktop overlay injection expanded document scroll size from `1280x720` to `1282x722` while the configured viewport remained `1280x720`. This small overflow is detector-overlay side effect; normal desktop captures had no overflow.

## Evidence Limits

- Empty and error behavior came from local route mocks; no real-backend, permission, upload, or write validation was performed.
- No stable loading state was captured.
- Browser screenshots cover the states listed above; there is no separate light/dark theme pass.
- Static detector `[]` and runtime headline counts do not constitute a formal combined Critique verdict.

Raw browser records: [run log](colform-assessment-b-luna-max-recheck-2026-09-29.browser-run.log.json), [DOM](colform-assessment-b-luna-max-recheck-2026-09-29.browser-dom.json), [console](colform-assessment-b-luna-max-recheck-2026-09-29.browser-console.json), [injection preflight](colform-assessment-b-luna-max-recheck-2026-09-29.injection-preflight.json), [injection and overlay records](colform-assessment-b-luna-max-recheck-2026-09-29.injection-overlay.json), [overlay DOM](colform-assessment-b-luna-max-recheck-2026-09-29.overlay-dom.json).
