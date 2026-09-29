# ColForm Browser Evidence Log (Assessment B)

Date: 2026-09-29  
Target: `http://127.0.0.1:30847/collaboration/index`  
Source component: `other-admin/admin-vue3/src/views/collaboration/components/ColForm.vue`  
Runner: `@playwright/test` 1.58.0 with headless Chrome 153.0.8010.53

## Run Scope

- Thirteen fresh browser contexts covered desktop (`1280x720`) and mobile (`375x812`) list, create, edit, empty-results, and error states, plus five representative detector overlays.
- Empty results were injected by a local `queryUserByPage` route mock (HTTP 200 with no records). Error states used the same route mock with HTTP 503. These are Mock evidence, not backend acceptance.
- Save, update, delete, batch-delete, upload, and other non-read requests were guarded. No write request was attempted; no form was submitted and no record changed.
- Normal captures reported no horizontal overflow at either viewport. No stable loading state was captured.
- Six ordinary screenshots were reused from the earlier B capture in this run sequence; empty/error mobile and all five detector-overlay screenshots were saved by this run. See the run log for per-file status.

## Observed States

- The create dialog shows name, type, icon, organization, related-person, and ticket-type controls. Related people initially ask the user to choose an organization first.
- Selecting `市局指挥中心` returns three Mock people, all disabled because they are already associated with another collaboration post.
- Editing `应急指挥岗` populates its organization and two selected people; the collaboration type is disabled with an explanation.
- Empty-result search shows `未找到“luna-empty-check”匹配的人员` on both desktop and mobile.
- The 503 mock shows the error toast and retry guidance. No JavaScript page error or failed request was recorded; the 503 console entry is expected from the deliberate mock.
- On the ordinary mobile empty/error screenshots, the related-people dropdown extends over the secondary status text and the next ticket-type row. The error popper contains its own retry message, but hides the secondary feedback underneath.

## Detector Findings And Classification

Static detector evidence for `ColForm.vue`: exit code `0`, stdout `[]`, stderr `0` bytes. This means zero static rule matches for that file only.

The injected browser detector loaded in five views. Headline counts were 31 (desktop list), 31 (desktop create), 34 (desktop empty), 14 (mobile edit), and 22 (mobile error). Each view also logged two advisory style rows (`dark-glow` and `bounce-easing`) outside the headline count. Those values are rule-hit counts, not defect counts.

Most repeated hits belong to the app shell/table: `.sidebar-wrapper`, `.el-card`/body, `.el-tabs`, `.el-table`, its header wrapper, 18 menu items, and `lx-table`. They report clipped positioned children in scroll/card/tab containers, layout transitions, tight shell/table insets, and table cells flush to a horizontal scroller edge. These do not target ColForm controls; verify them against the component's intended scroll and popup behavior before treating them as defects. The brand-blue `#264ed1` glow is a token-backed hit, not an automatic finding.

The desktop empty-results view produced three text-occlusion hits. Two target pagination text behind the open modal/select layers and are not actionable page content while the modal is open. The third targets the ticket-type placeholder under the related-people empty popper; the normal screenshot also shows the dropdown reaching that next field. The mobile error view produced two `2.6:1` contrast hits for `#f56c6c` on `#fef0f0`, below the normal-text WCAG AA target of `4.5:1`. Its six occlusion hits include four table labels/actions behind the dialog and two ColForm status texts; the screenshot anomaly below invalidates the background-row hits, while the ordinary mobile screenshot confirms that the error popper covers the secondary feedback.

## Overlay Viewport Anomaly

Without injection, `window.innerWidth` and document dimensions stayed at `375x812`; the mobile error dialog was at `x=16`, width `343`. After overlay injection, the mobile edit context reported `377x817`, and the mobile error context reported `545x1181`. Its screenshot is still `375x812`, while the dialog moved to `x=101`, width `343`, cropping the right side. Treat the error overlay screenshot's geometry and table-background occlusion as detector-induced and unreliable. The ordinary error screenshot remains valid for the page state.

Desktop overlay injection increased document scroll size from `1280x720` to `1282x722`; normal desktop captures had no overflow. This is limited to the detector overlay capture.

## Injection And Artifacts

Mutable injection preflight succeeded: title changed/restored, an inline script was appended/executed, and the external detector script loaded. Overlays are saved as screenshots; the headless Playwright contexts were closed after capture, so no overlay remains active in a browser tab.

Saved evidence uses the `colform-assessment-b-luna-max-recheck-2026-09-29.` filename prefix. Raw files: [run log](colform-assessment-b-luna-max-recheck-2026-09-29.browser-run.log.json), [DOM](colform-assessment-b-luna-max-recheck-2026-09-29.browser-dom.json), [console](colform-assessment-b-luna-max-recheck-2026-09-29.browser-console.json), [preflight](colform-assessment-b-luna-max-recheck-2026-09-29.injection-preflight.json), [injection and overlays](colform-assessment-b-luna-max-recheck-2026-09-29.injection-overlay.json), and [overlay DOM](colform-assessment-b-luna-max-recheck-2026-09-29.overlay-dom.json).
