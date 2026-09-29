---
target: CODE-03 admin authority pages
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:F:\\work\\linkx-admin\\other-admin\\admin-vue3\\src\\views\\authority\\adminPerson\\index.vue"
target_fingerprint: "sha256:f37131fbaa7f6b96ffcec675b8705982bf2babc263e1d7d5dd396cd08565307e"
target_path: "F:\\work\\linkx-admin\\other-admin\\admin-vue3\\src\\views\\authority\\adminPerson\\index.vue"
timestamp: 2026-09-29T03-51-06Z
slug: min-vue3-src-views-authority-adminperson-index-vue
---
Method: dual-agent (A: archived independent Luna max Assessment A; original agent id not retained in the artifact; B: /root/code03_browser_luna)

# CODE-03 Critique: Admin Person and Admin Role

Target: `other-admin/admin-vue3/src/views/authority/adminPerson/index.vue`, with `/authority/adminPerson` and `/authority/adminRole` inspected as one related authority-management surface. Assessment A finished independently before Assessment B evidence entered synthesis. Assessment B read neither A nor code-review findings. The archived A report does not retain its original agent identifier, so that provenance limit is stated explicitly.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 2/4 | An unmatched name search leaves the same three Mock rows and total visible. |
| 2 | Match Between System and Real World | 3/4 | Familiar Chinese labels and status words; every sample role cell is blank. |
| 3 | User Control and Freedom | 3/4 | Reset clears search and selection; the table gives no useful no-results feedback in the preview. |
| 4 | Consistency and Standards | 3/4 | Person and role pages share a table pattern, but mobile overflow and empty action space weaken consistency. |
| 5 | Error Prevention | 2/4 | Selection remains enabled when the read-only Mock profile exposes no batch action. |
| 6 | Recognition Rather Than Recall | 2/4 | Missing role values and hidden permission limits obscure current state and available actions. |
| 7 | Flexibility and Efficiency | 2/4 | Batch paths exist, but the observed profile cannot use them; mobile table width is difficult to inspect. |
| 8 | Aesthetic and Minimalist Design | 3/4 | The central desktop layout is restrained; the expanded 33-item sidebar dominates and some reserved action space is empty. |
| 9 | Error Recovery | 2/4 | Reset is available, but unmatched search does not produce a clear empty state. |
| 10 | Help and Documentation | 0/4 | No contextual guidance is visible on either authority page. |
| **Total** | | **22/40 — Acceptable** | Significant improvements remain in Mock data, search feedback, responsive behavior, and permission clarity. |

## Design Specificity Verdict

The pages are coherent for an operational admin tool but visually category-interchangeable. The dark navigation rail, dark top bar, white table surface, blue primary action, and textual status labels are consistent with the surrounding product. The authority pages have no stronger product-specific signal than their page title and menu position.

## Cognitive Load

Moderate. Three of eight observed checklist items fail. The work area groups filters, table, and pagination clearly, but the expanded navigation exposes 33 entries and the 权限中心 group has 10 children. This exceeds the four-choice guideline and adds peripheral scanning cost. The empty role cells and ineffective unmatched search add uncertainty without helping the main task.

## Emotional Journey

The initial desktop table looks orderly and familiar. An unmatched query then leaves the previous rows visible, making the operator unsure whether search ran. Selecting a person visibly changes the checkbox, but the read-only preview exposes no resulting batch action. The user finishes without knowing whether the account lacks permission or the selection failed.

## What's Working

- Search, table, and pagination follow a clear top-to-bottom order at desktop width.
- Status uses text as well as color, so state is not color-only.
- Reset clears filters and selection; both pages retain a stable breadcrumb and active navigation item.

## Priority Issues

1. **[P1] Mock role cells are blank.** A saw all three person rows with an empty role cell. The current preview fixture omits `role`, while the Vue2/Vue3 display contract reads `row.role.name`. Use the already-defined preview roles in the Mock data, and render a clear unassigned state when the role is absent. Real backend shape still needs separate contract confirmation.
2. **[P1] Mock name and organization searches do not filter the people list.** Typing `zzNoUser` and searching leaves all three rows and `共 3 条` unchanged. `sampleUserPage` paginates the full people array without applying the declared query fields. Fix the local Mock adapter and verify both matches and no-results feedback; do not add client-side production filtering without API evidence.
3. **[P1] Authority tables overflow the 390px viewport.** B measured `adminPerson` `clientWidth=390` and `scrollWidth=392`; `adminRole` reported `clientWidth=390` and `scrollWidth=456`. The role screenshot clips names and crowds search/reset controls. Keep horizontal scrolling inside the table where needed and prevent page-level overflow; preserve access to filters and actions.
4. **[P2] Read-only permission state leaves unusable selection and action space.** The preview returns `type: 1` and `actions: []`; add/edit/delete actions are absent, yet person checkboxes remain selectable and the person table reserves a 280px operation column. The role page also shows an empty operation column. Keep this profile read-only, but hide or disable selection without an authorized batch action and avoid reserving empty action space. Do not invent permission keys.
5. **[P2] Filter fields have no persistent accessible names.** A's accessibility tree exposed the name and organization controls as unnamed text fields. Add labels or stable accessible names so their purpose remains available after placeholder text disappears.

## Persona Red Flags

- **Alex, Power User:** Selecting a row in the read-only profile reveals no batch command; the mobile tables also require careful horizontal inspection.
- **Sam, Accessibility-Dependent User:** The name and organization filters lack accessible names. Status text is available and avoids a color-only state signal.
- **Riley, Stress Tester:** An unmatched query leaves stale-looking sample rows on screen, and every person role is blank in the preview.

## Minor Observations

- The desktop sidebar expands many groups at once, increasing peripheral weight.
- The Mock badge collapses to an `M` icon at mobile width; the full label is only visible on desktop.
- Assessment A did not verify 375px because its browser interface had no viewport override. B inspected 390px; no 375px claim is made.

## Detector and Browser Evidence

- CLI target: `other-admin/admin-vue3/src/views/authority/adminPerson/index.vue`.
- CLI stdout JSON: `[]` followed by LF (3 bytes); stderr: 0 bytes; exit code: 0. This is a valid static zero-hit result for that source file only.
- Fresh browser tabs verified `/authority/adminPerson` and `/authority/adminRole` by heading, table headers, Mock badge state, and absence of the login screen before setting the `[Human]` title.
- B injected `http://localhost:8400/detect.js` and confirmed the page scanner ran. Desktop console summaries reported 22 findings per view; mobile reported 4 for adminPerson and 5 for adminRole. The explicit callable scan returned 11 grouped desktop elements, 4 adminPerson mobile elements, and 5 adminRole mobile elements. These counts are separate detector outputs and are not additive.
- Desktop hits were on shared shell/navigation nodes (sidebar spacing, logo glow, width transitions, and body easing); the callable scan did not flag table-content nodes. The mobile adminRole scan additionally flagged the content panel as edge-flush. The screenshots and raw values are in `.impeccable/critique/code03-assessment-b-luna-max-2026-09-29/`.
- Four earlier Playwright captures showed the login screen because that profile lacked the Mock session and its POST filter blocked local permission requests. They are retained as failed controls and are excluded from this critique.
- Temporary overlay and screenshot services on ports 8400 and 8401 were stopped. The user preview on port 30847 remained HTTP 200.

## Questions

Should the local preview add a clearly labeled writable Mock profile alongside its current read-only profile?

- Keep the preview read-only and improve the empty-permission feedback.
- Add a separate writable Mock profile using only the permission keys already covered by tests.
