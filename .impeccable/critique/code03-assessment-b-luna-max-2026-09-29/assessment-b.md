# CODE-03 Assessment B: detector and browser evidence

## Scope and disposition

This assessment records a static detector run for \`other-admin/admin-vue3/src/views/authority/adminPerson/index.vue\` and overlay evidence from the \`adminPerson\` and \`adminRole\` routes. Assessment A and code-review outputs were not read or used. No application source files were changed.

This is detector and browser evidence only. It is not a formal Impeccable Critique pass: no independent visual review or critique snapshot was produced.

## Static detector

- Target: \`other-admin/admin-vue3/src/views/authority/adminPerson/index.vue\`
- Command: \`node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json <sourcePath>\`
- Exit code: \`0\`
- Stdout: \`[]\` followed by LF (3 bytes; recorded in \`detector.stdout.json\`)
- Stderr: empty (0 bytes; recorded in \`detector.stderr.txt\`)
- Result: no static detector findings for this Vue file. This does not establish that the rendered pages pass a visual critique.

The raw process metadata is in \`detector.meta.json\`. The browser manifest is \`browser-evidence.json\`; it was validated as JSON and its \`stdoutText\` was corrected to match the detector's actual three stdout bytes.

## Browser evidence

Both target routes were verified in fresh tabs in the existing local Mock administrator session. The pages showed their expected headings and table headers, and neither showed the login page. The Mock badge text was visible on desktop; on mobile it collapsed to the \`M\` icon. No write action was invoked.

| Route | View | Screenshot | Overlay evidence |
| --- | --- | --- | --- |
| \`/authority/adminPerson\` | Desktop, 1280x720 | \`adminPerson-desktop-overlay.jpg\` | Console: 22 anti-patterns. Callable scan: 11 grouped elements (\`bounce-easing\` 1, \`clipped-overflow-container\` 1, \`cramped-padding\` 7, \`dark-glow\` 1, \`layout-transition\` 3). |
| \`/authority/adminPerson\` | Mobile, 390x844 | \`adminPerson-mobile-overlay.jpg\` | Console: 4 anti-patterns. Callable scan: 4 elements (\`bounce-easing\` 1, \`dark-glow\` 1, \`layout-transition\` 3). |
| \`/authority/adminRole\` | Desktop, 1280x720 | \`adminRole-desktop-overlay.jpg\` | Console: 22 anti-patterns. Callable scan: 11 grouped elements (\`clipped-overflow-container\` 1, \`cramped-padding\` 7, \`dark-glow\` 1, \`layout-transition\` 3). |
| \`/authority/adminRole\` | Mobile, 390x844 | \`adminRole-mobile-overlay.jpg\` | Console: 5 anti-patterns. Callable scan: 5 elements (\`dark-glow\` 1, \`edge-flush-cards\` 1, \`layout-transition\` 3). |

The desktop callable-scan hits were on shared shell elements: the sidebar wrapper, logo, navigation items, main container, and body. The scans did not report table-content nodes. On mobile, the person page hits were on the body/logo; the role page additionally had an \`edge-flush-cards\` hit on the content panel. Console counts and callable-scan counts are separate detector outputs and must not be added together or treated as confirmed defects.

The screenshots have the dimensions listed above. The emulated mobile viewport metrics were not identical between requested device size and page layout: \`adminPerson\` reported inner width 392, client width 390, and scroll width 392; \`adminRole\` reported inner width 456, client width 390, and scroll width 456. The person capture shows only the operation column header in the visible table area. The role capture clips long role names and crowds the search and reset controls. These are browser observations to investigate; the metrics do not by themselves identify the cause.

## Failed control

A separate Playwright profile redirected to login because it did not have the active Mock administrator session. Its blanket POST filter also blocked two local preview POST requests, and the manually assigned title did not prove that the target route had loaded. Those four login-page captures are invalid as target evidence and are retained only for traceability in \`failed-playwright-browser-evidence.json\`, \`failed-capture-note.txt\`, and the \`failed-control-login-*.png\` files.

## Preview lifecycle

At the time of verification, the user preview on port \`30847\` was still listening and returned HTTP 200. The temporary overlay server on port \`8400\` and screenshot receiver on port \`8401\` were stopped after capture.
