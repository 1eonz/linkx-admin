---
target: Vue3 AuthImg host component and Mock carousel usage
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:F:\\work\\linkx-admin\\other-admin\\admin-vue3\\src\\components\\AuthImg\\index.vue"
target_fingerprint: "sha256:d2d5f0289796efb4f5427763aa6d433b14c7239f58941a576807eaf9aae50acf"
target_path: "F:\\work\\linkx-admin\\other-admin\\admin-vue3\\src\\components\\AuthImg\\index.vue"
timestamp: 2026-09-29T01-10-08Z
slug: admin-admin-vue3-src-components-authimg-index-vue
---
Method: dual-agent (A: /root/authimg_luna_a · B: /root/authimg_luna_b)

## Design Health

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3 | Loading and failure states exist; narrow slots hide retry text. |
| 2 | Match System / Real World | 4 | Image, loading, and retry language are familiar. |
| 3 | User Control and Freedom | 3 | Retry is in place and old requests are invalidated. |
| 4 | Consistency and Standards | 3 | Uses host icons and tokens; size/fit is owned by callers. |
| 5 | Error Prevention | 3 | Request ownership guards prevent stale images. |
| 6 | Recognition Rather Than Recall | 3 | Alt text is descriptive, but narrow retry becomes icon-only. |
| 7 | Flexibility and Efficiency | 2 | Multiple failures require one retry per image. |
| 8 | Aesthetic and Minimalist Design | 3 | Success state is compact and content-led. |
| 9 | Error Recovery | 3 | Retry works, but narrow-state purpose is less apparent. |
| 10 | Help and Documentation | 2 | User-facing failure guidance is limited to button label/title. |
| **Total** | | **29/40** | **Good; improve narrow failure-state clarity.** |

## Design Specificity Verdict

The neutral image component fits an operational admin surface. Its product-specific value is mostly behavioral: authenticated loading, request replacement, failure recovery, and object URL cleanup. The carousel page was visually checked at 1280x800 and 375x812 in fresh contexts; both Mock images loaded at 2/2 in each view. Source detector output was valid JSON `[]`, stderr was empty, and exit code was 0. This only means the component source had zero static rule matches.

The mutable injection preflight succeeded and the live overlay ran on both target views. Runtime hits belonged to the navigation shell, layout transitions, logo shadow, and table scroll container; no hit was attributed to AuthImg or its placeholder. The table-container hit is context-sensitive and not a component defect. The target remained on `/h5/carousel`; no business writes were allowed. Raw evidence and screenshots are in `.impeccable/critique/authimg-assessment-b-luna-max-2026-09-29.*`.

## Overall Impression

The loaded image is quiet and stable in the carousel table. Loading, failure, cancellation, and retry behavior are supported by source and existing tests, but the failed state was not deliberately forced in this browser pass. The clearest improvement is keeping retry meaning visible on small image slots.

## What's Working

- The 170x80 carousel thumbnail preserves its slot and both Mock images render without page overflow at desktop and mobile widths.
- Retry is a semantic button with an accessible name and visible keyboard focus; callers provide meaningful alt text.
- Loading motion respects reduced-motion preference, and old requests cannot replace the current source.

## Priority Issues

### [P2] Narrow retry becomes icon-only

Below 96px the visible “重试” label is hidden, leaving a refresh icon in 40px avatar slots. Touch users cannot rely on hover title text to learn the action. Keep a visible failure cue or expose adjacent recovery text while retaining the accessible name and focus treatment. Suggested command: `/impeccable clarify`.

### [P2] Long waits have no escalation cue

The loading state is a spinner without elapsed-time context. A stalled request and a normal short wait look alike. If the host can identify a long wait, provide restrained status text without changing the image box. Suggested command: `/impeccable harden`.

### [P3] Stable dimensions depend on every caller

AuthImg does not define width, height, or object-fit; a missed caller style can make its placeholder collapse. Document the stable-size requirement and verify each new call site. Suggested command: `/impeccable document`.

## Persona Red Flags

- **Alex:** several simultaneous failures require repetitive individual retries.
- **Sam:** current carousel call sites have meaningful alt text and the retry control has an accessible name; preserve both for future uses.
- **Casey:** a narrow touch slot hides the retry label and its 36px action is below the common 44px target guideline; verify touch recovery on the smallest host slot.

## Minor Observations

The carousel uses `object-fit: cover`, so edge content may crop. The browser pass verified loaded state only; failure and loading appearance were assessed from source and existing E2E evidence, not claimed as live captures. The first login-shell overlay attempt was excluded from target evidence.

## Questions to Consider

- Can a mobile operator identify and retry a failed image without hover?
- When several images fail together, should the host expose a shared recovery action?
- Which image content must remain uncropped in carousel thumbnails?
