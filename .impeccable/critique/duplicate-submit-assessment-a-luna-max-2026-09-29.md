Method: isolated Assessment A by `/root/dupsubmit_luna_a` (design review only; Assessment B and detector evidence excluded)

## Scope And Evidence

- Target: `other-admin/admin-vue3/src/views/baseData/thirdParty/index.vue`; Mock route `http://127.0.0.1:30847/baseData/thirdParty`.
- The requested URL initially refused the connection because port 30847 had no listener. I started the Vue3 `dev:mock` server on that port; the target then loaded successfully in a new in-app browser tab.
- Desktop visual review was at 1280 x 720. I inspected the third-party list and opened then cancelled the create dialog. I also inspected `/authority/role` and `/authority/adminPerson` without activating write actions.
- No save, delete, status-change, password-change, or role-change action was submitted. Role and admin-user action columns were blank under the current Mock permissions, so their pending states could only be assessed from source. No mobile, zoom, keyboard-only, or screen-reader pass was performed, and no request was held open to observe a live pending state.
- The Impeccable context identifies `other-admin/admin-vue3/DESIGN.md` as the incumbent visual authority. Its blue primary, restrained shadows, and light table surfaces match the target screenshot. No old critique, detector, or Assessment B file was read; no detector was run.

## Design Specificity Verdict

The page has moderate product fit but low visual distinctiveness. The deep navy navigation, blue active state, white work surface, Chinese labels, masked application secret, and enabled/disabled tags form a coherent LinkX admin shell. The actual application fields and integration vocabulary give the page some domain character, but the composition and controls could be reused unchanged by most Element Plus admin products. The strongest opportunity is to make high-stakes write states consistent across integration, role, and administrator-account workflows, then give the integration form clearer credential handling.

## Design Health

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 2 | The integration dialog has a spinner and `aria-busy`; related account and backend-role writes do not expose consistent pending state. |
| 2 | Match System / Real World | 3 | Labels, status words, and token units map well to the operator's task; the `-1` lifetime default lacks an inline explanation. |
| 3 | User Control and Freedom | 2 | Cancel, close, and Escape are disabled while the integration request is pending, with no textual progress cue. |
| 4 | Consistency and Standards | 2 | The shared role dialog locks on `/authority/role`, but the backend-role route does not propagate that lock; account dialogs also omit it. |
| 5 | Error Prevention | 2 | The target blocks repeated saves and validates fields, while adjacent account and backend-role mutations can be triggered again during a request. |
| 6 | Recognition Rather Than Recall | 3 | Fields, units, action labels, status text, and breadcrumbs are visible; the credential fields can still be prefilled unexpectedly. |
| 7 | Flexibility and Efficiency | 2 | Search, Enter-to-search, reset, and pagination are familiar; the integration table has no batch path. |
| 8 | Aesthetic and Minimalist Design | 3 | The table and search controls are easy to scan, with only modest density in the expanded navigation. |
| 9 | Help Users Recover from Errors | 1 | Several write-request catch handlers are silent, leaving no recovery instruction when a request fails. |
| 10 | Help and Documentation | 1 | There is no contextual explanation for token lifetime values or the handling of an application secret. |
| **Total** |  | **21/40** | **Acceptable** |

## Overall Impression

The desktop list is calm and legible, and the main create/update dialog has a sound duplicate-submit affordance: the handler guards a second invocation, the primary button shows loading and becomes disabled, and close/Escape are blocked during the write. The main risk is unevenness around this otherwise clear pattern. A user can see a protected integration save but encounter repeatable role or account writes elsewhere in the same admin system.

## What's Working

- The main work area has a strong scan path: breadcrumb and page title first, search controls second, then a six-column table with status and three named row actions. The dark sidebar separates navigation from the white work surface.
- The integration form uses required markers, inline field validation, and explicit token units. Its submit lock is tied to the request state, with disabled/loading/`aria-busy` feedback and guarded dialog dismissal (`thirdPartyEdit.vue:109-139, 158-164, 230-240`).
- Row-action styling is consistent on the target. `ActionButtons` supports `disabled`, `loading`, and `aria-busy`, and the third-party page supplies those states for deletion (`ActionButtons/index.vue:37-50, 122-126`; `baseData/thirdParty/index.vue:267-320`). Status is communicated with text as well as color.

## Priority Issues

### [P1] Backend-role save loses the shared dialog's submit lock

**Why it matters:** `/authority/role` passes `submittingRole` into `EditRole`, but `/authority/adminRole` reuses the same dialog without a submit guard or `submitting` prop. The child only guards form validation; after it emits the payload, that local guard clears while the API request is still pending. A second save can therefore create or update the role again, with no visible spinner or disabled state.

**Fix:** Add an in-flight guard to `adminRole.handleSubmit`, pass its state to `EditRole`, and keep the shared dialog's existing disabled/loading/`aria-busy` treatment active until the request settles. Verify the backend-role route as well as `/authority/role`.

**Evidence:** `authority/auth/index.vue:32, 153-173, 267-273`; `authority/auth/components/EditRole.vue:406-434, 574-583`; `authority/adminRole/index.vue:152-166, 265`.

**Suggested command:** `/impeccable harden`

### [P1] Administrator-account mutations have no consistent pending lock

**Why it matters:** The backend-user page invokes status updates and deletion without row-level pending IDs. Its set-role and batch-role dialogs call their APIs from a plain Save button, and the password dialog also has no submit lock. Repeated clicks or rapid status toggles can send duplicate mutations, while the user receives no visual indication that the first request is still running. The current Mock role/account views hide their action buttons, so this risk comes from source review rather than a live pending-state observation.

**Fix:** Track pending state per row for status and delete actions; add a submit flag to set-role, batch-role, and password dialogs. Bind it to `loading`, `disabled`, and `aria-busy`, and release it in `finally` so failure restores the controls.

**Evidence:** `authority/adminPerson/index.vue:184-208, 239-260, 338-369`; `authority/person/components/setRole.vue:113-161, 317-320`; `authority/person/components/setBatchRole.vue:59-83, 128-130`; `permission/components/userPassword.vue:124-154, 176-179`.

**Suggested command:** `/impeccable harden`

### [P2] Create form is visibly populated before the operator enters credentials

**Why it matters:** In the live create dialog, the Application ID showed `preview` with the validation error “应用ID长度不能小于8位,” and the secret field already contained masked characters. The component's `defaultForm()` and `init()` set both fields to empty, so the visible values appear to come from browser autofill or session state rather than the form model. The operator must diagnose and replace a value before the new form is usable; a stale secret can also be mistaken for the intended application credential.

**Fix:** Recheck in a clean browser profile, then prevent credential-manager autofill on these application credential fields using the appropriate autocomplete hints and verify that new/create mode opens blank without an error. Keep edit mode's existing server values intentional and visible as masked values.

**Evidence:** Live desktop view of the opened create dialog; `thirdPartyEdit.vue:23-35, 91-105, 177-185`.

**Suggested command:** `/impeccable harden`

### [P2] Failed integration writes can end with no explanation

**Why it matters:** The create/update handler and delete flow catch rejected requests without user feedback. On a failed save the form remains open and the spinner clears, but the operator is not told whether to retry or what failed. This weakens the otherwise strong busy-state feedback at the highest-stakes end of the flow.

**Fix:** Show a concise failure message after a failed request, preserve the entered form values, and make the submit control available again. Keep confirmation cancellation silent, but distinguish it from a network or server failure.

**Evidence:** `thirdPartyEdit.vue:128-140`; `baseData/thirdParty/index.vue:137-153`.

**Suggested command:** `/impeccable clarify`

## Cognitive Load

**Checklist:** 2 failures, therefore moderate load.

- **Single focus:** Pass. The search area and table share one primary white work surface.
- **Chunking:** Fail. The create dialog puts five required values plus status and remark into one uninterrupted vertical form; related lifetime controls are not grouped under a shared section.
- **Grouping:** Pass. Search, table, form labels, and unit suffixes are visually grouped.
- **Visual hierarchy:** Pass. Primary actions and active navigation use the brand blue; table headers and body rows are distinct.
- **One thing at a time:** Pass. Create/edit details appear only after opening the dialog.
- **Minimal choices:** Fail. The target row exposes three actions and the search bar has search, reset, and add, but the expanded `权限中心` group exposes more than four sibling destinations in the role/account views.
- **Working memory:** Pass. The operator can read the row data and status in place; form units are shown alongside their fields.
- **Progressive disclosure:** Pass. Detail view and edit fields are not all shown on the list page.

The target's row and search decision points stay within four actions. The expanded permission navigation does not; the form also asks for several independent data values, which is intrinsic task complexity rather than a menu of alternatives.

## Emotional Journey

The page opens with familiar navigation and a readable list, so orientation is quick. Opening “新增” is an obvious next step, but the prefilled ID and secret puncture confidence before the operator begins. On a valid save, the locked button, spinner, and blocked dismissal protect against accidental repeat or interruption; there is no text change to “保存中,” so reassurance relies on the spinner. If the request fails, the silent catch leaves a flat ending with no explanation. The same operator then encounters less consistent safeguards in role and account workflows, which can make the integration modal feel unusually restrictive instead of intentionally protected.

## Persona Red Flags

- **Alex, impatient power user:** Search, reset, pagination, and three named row actions are quick to scan. Alex will be frustrated if an account or backend-role save accepts repeated clicks while waiting, especially after seeing the guarded integration dialog establish a different expectation.
- **Sam, keyboard and screen-reader user:** The target exposes `aria-busy` on its confirm and delete controls, which is a good start. The role/account forms omit that signal and a visible pending state; silent failures also make it hard to know whether the action completed. Keyboard-only and assistive-technology behavior was not exercised.
- **Jordan, first-timer:** The labels and units are plain, but an unexpected prefilled ID and secret with an immediate red error look like an existing value or a system problem. There is no inline explanation that the browser may have filled them.

## Minor Observations

- The target's action buttons fit within three options per row, while the wide sidebar remains a persistent visual anchor. The expanded navigation is long, but its categories and active state keep the current location legible.
- The component switches to a compact column set at 640 px and sets compact action buttons to 44 px. This is source evidence only; mobile rendering was not inspected.
- `Token有效期` and `RefreshToken有效期` accept `-1` in the visible form, but the screen does not explain what `-1` means.

## Provocative Questions

When a write takes several seconds, should the operator be told explicitly “保存中,” and is there a supported way to cancel without risking a partial update?

Should a Mock user who lacks role/account permissions see an explanation where the operation column is empty, so the absence is distinguishable from a rendering failure?
