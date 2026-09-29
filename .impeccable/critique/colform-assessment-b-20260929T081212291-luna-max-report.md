# Assessment B: Detector and Browser Evidence

**Run:** `colform-assessment-b-20260929T081212291-luna-max`  
**Target:** `other-admin/admin-vue3/src/views/collaboration/components/ColForm.vue`, exercised at `http://127.0.0.1:30847/collaboration/index`  
**Method:** Fresh Microsoft Edge context driven by Playwright; desktop `1280×720` and mobile `375×812`. This report records Assessment B only and does not include Assessment A or a combined critique.

## Deterministic scan

The bundled detector was run once against the ColForm source. Its stdout is valid JSON `[]`, stderr is empty, and the recorded exit code is `0`: zero static findings for that source target. The result has no rule names or locations and does not establish that the rendered page has no usability or accessibility issues.

## Browser evidence

Eleven screenshots were captured: create and edit dialogs, plus loading, empty, and error states at both viewport sizes, and a desktop detector-overlay view. The capture manifest records the visible dialog titles (`新增` or `修改`). All ten non-overlay captures report no page-level horizontal overflow. The detector overlay capture reports overflow, which is specific to the overlay-injected view and should not be treated as baseline page behavior.

The create and edit flows were opened and canceled; no form write was submitted. Loading, empty, and error conditions were induced locally for `queryUserByPage`; the error case intentionally aborted that browser request. These captures are Mock-preview evidence, not real-backend verification.

The error-state screenshots show the retained selected-user chips as `preview-user-001` and `preview-user-002`, while the nearby message says selected users are preserved. This makes the preservation visible but not meaningful to an operator; confirm whether IDs are the intended fallback when the user-name lookup fails.

Detector script injection succeeded: the overlay screenshot contains highlights and the browser console emitted `31 anti-patterns found`. Visible labels include elastic easing, a width transition, positioned content clipped by an overflow container, cramped padding, and cards flush against the scroller edge. The highlights span the application shell and list as well as the form. The captured console output has only a page-wide count, so the 31 hits cannot be attributed to ColForm or mapped to exact findings from this evidence alone. The post-injection probe found the script tag but not a `window.impeccable` object; the screenshot and console message are the evidence that the overlay ran.

The browser log also contains one generic 404 resource message on the primary view. Its URL is not recorded, and no matching HTTP-error response appears in the log, so its source remains unverified. The `net::ERR_FAILED` events in the error-state views were caused by the intentional local route abort. No page errors were recorded.

## Artifact index

- `.scan.stdout.json`, `.scan.stderr.txt`, `.scan.exit-code.txt`: detector result, stderr, and exit status.
- `.browser-captures.json`: corrected viewport, state, dialog, and overflow metadata.
- `.browser-logs.json`: captured console and request events.
- `*.desktop-1280x720.*.png` and `*.mobile-375x812.*.png`: state captures; `desktop-1280x720.overlay.png` contains the detector overlay.

## Limits

This evidence is limited to Assessment B and the local Mock preview. It does not include a heuristic score, persona walk-through, independent design review, or real-backend validation.
