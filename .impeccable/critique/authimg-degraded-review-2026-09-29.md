⚠️ DEGRADED: single-context (both isolated gpt-6-sol assessments failed to start with HTTP 503; browser page injection is read-only)

# AuthImg 复核（降级）

Target: `other-admin/admin-vue3/src/components/AuthImg/index.vue` and its host use in the Vue3 admin app. Mode: Operate. This is a one-context evidence review, not the required independent A/B Impeccable Critique.

## Design Health Score (Provisional)

| # | Heuristic | Score | Evidence |
|---|---|---:|---|
| 1 | Visibility of System Status | 3 | Loading spinner, `aria-busy`, and a retry control distinguish the current state. |
| 2 | Match System / Real World | 3 | The image and host labels use familiar Chinese descriptions. |
| 3 | User Control and Freedom | 4 | A failed resource can be retried in place; a changed source cancels the previous request. |
| 4 | Consistency and Standards | 3 | Native buttons, keyboard focus and current Element Plus tokens fit the host; the later lx-ui replacement remains planned. |
| 5 | Error Prevention | 4 | External/protocol-relative/backslash paths are rejected before a token-bearing request; stale responses are ignored. |
| 6 | Recognition Rather Than Recall | 4 | All ten current host uses provide descriptive `alt`; the retry control names the failure and image. |
| 7 | Flexibility and Efficiency | 3 | Keyboard retry avoids a page reload; there is no extra configuration burden. |
| 8 | Aesthetic and Minimalist Design | 3 | The placeholder preserves the image box and the retry remains compact. |
| 9 | Error Recovery | 4 | Request and decode failures can recover by retry; object URLs are released at resource boundaries. |
| 10 | Help and Documentation | 2 | Component usage is documented; the runtime does not expose backend failure details. |
| **Total** | | **33/40 provisional** | **Not a formal score because the required independent assessments did not run.** |

## Design Specificity

The compact image state fits an operational admin table and preserves the established 170x80 carousel thumbnail area. The new retry action and localized host descriptions improve recovery and accessibility. The image and icons still use the host Element Plus visual language; replacing them with the compatible lx-ui components remains in the planned Vue3 replacement phase.

## Deterministic and Browser Evidence

- Detector JSON: `[]`; stderr: empty; process exit code: 0. This means only that the scanned `AuthImg/index.vue` had zero static rule matches.
- Browser: a newly opened tab reached `http://127.0.0.1:30847/h5/carousel` and displayed both carousel images. The injection preflight failed because setting `document.title` raised `TypeError: Cannot set property title ... which has only a getter`. No overlay was injected and no overlay server was started.
- Existing screenshots in `evidence-2026-09-29-authimg-final/` cover desktop loaded/failed states, a 375px failure state, and reduced-motion loading. The prior `desktop-retry-success.png` is a transition frame captured before image load; the updated E2E now waits for `aria-busy=false` after keyboard retry.
- Isolated Assessment A and Assessment B agents both failed to start with provider HTTP 503. No independent A/B report or formal Impeccable snapshot exists for this run.

## What's Working

- Source changes abort the previous request and guard state writes with a request version; unmount and image decode failure release ObjectURLs.
- The retry action is a semantic button with a visible focus state and a descriptive accessible name; loading motion stops for `prefers-reduced-motion`.
- All ten current AuthImg host uses now provide descriptive `alt` text, including table thumbnails and form previews.

## Priority Issues

1. **[P2] The carousel table clips later columns at 375px.** The image itself stays within its fixed box, but the host page screenshot exposes only the first two columns without scrolling. Track this as a table/container responsive follow-up; it is outside the AuthImg component boundary.
2. **[P3] Host icons have not moved to lx-ui.** The component still uses Element Plus loading/picture icons. Move to `LxAuthImg`/`LxIcon` during UI-04 after verifying sizing, fit, fallback and auth adapter contracts.

## Persona Red Flags

- **Alex (frequent admin user):** failed thumbnails now have a direct retry action, so recovery does not require leaving and reopening the page.
- **Keyboard/screen-reader user:** the retry button has a visible focus style and its accessible name includes failure and image context; the host now provides image descriptions. The mobile carousel table still requires horizontal navigation to reach later columns.

## Minor Observations

- The browser screenshot set includes a retry transition frame; the updated E2E distinguishes that from the final loaded state by waiting for `aria-busy=false`.
- Real backend authentication and content-type behavior remain unverified; all request tests use local mocks.

## Questions to Consider

- During UI-04, should the host switch directly to `LxAuthImg` while injecting the authenticated Blob adapter?
- Should the carousel page expose an explicit horizontal-scroll cue on narrow viewports?
