Method: isolated Assessment A design review in a fresh browser tab. Target: `other-admin/admin-vue3/src/views/authority/adminPerson/index.vue`, with the adjacent `adminRole` surface inspected for consistency. No detector, overlay, or Assessment B evidence was consulted.

# CODE-03 Assessment A: Admin Person

## Evidence

- Fresh in-app browser tab 1 at `http://127.0.0.1:30847/authority/adminPerson`, verified after the page loaded. Desktop capture was 1280x720. The table showed three seeded users; every visible 角色 cell was blank.
- Entered `zzNoUser` by normal typing and clicked 搜索. The query remained visible, while the same three rows and `共 3 条` remained. Reset cleared the query and selection. Selecting a row showed a checked checkbox and a partial-select header state, but no batch controls appeared.
- Navigated through the app menu to `http://127.0.0.1:30847/authority/adminRole`. The three seeded roles rendered with status labels; the add control and all row operations were absent under the visible `Mock预览管理员` profile.
- The browser accessibility tree exposed the two page filter inputs as unnamed text fields. The global menu search was named `搜索菜单`, which provides a useful comparison.
- 375px rendering was not verified. The available CUA tab interface did not expose a viewport override, and the browser zoom shortcut did not change the captured viewport. No mobile layout claim is made.

## Design Specificity

Low but coherent for an Operate surface. The dark navigation rail, dark top bar, white table surface, blue primary action, and status tags form a consistent admin shell. The page is still category-interchangeable: the authority-management surface has no distinct visual signal beyond its title and navigation location. The restrained pattern supports scanning, but the current live profile and data leave the core management purpose visually unfulfilled.

## Overall Impression

The desktop composition is calm and easy to scan, with filters above a compact table and familiar pagination below. Confidence drops quickly when the role column is empty and searching an unmatched name leaves the same rows on screen. In the observed mock profile, both authority pages look read-only without saying so, and selecting a user reveals no available next action.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 2/4 | Breadcrumbs, status words, and totals are visible; search gives no discernible result change or loading/empty feedback in the observed mock. |
| 2 | Match Between System and Real World | 3/4 | Chinese labels are familiar and ordered naturally; the blank role value hides an important real-world attribute. |
| 3 | User Control and Freedom | 3/4 | Reset clears search and selection; there is no visible way to recover a search that appears to have had no effect. |
| 4 | Consistency and Standards | 3/4 | Both authority pages share the same search/table/pagination shell and textual status tags; role and person values do not render equally well. |
| 5 | Error Prevention | 2/4 | The source confirms delete confirmation and busy-state guards, but current visible controls do not communicate permission limits and the query behavior invites false assumptions. |
| 6 | Recognition Rather Than Recall | 2/4 | Table headings and status words aid recognition, while blank role cells and absent operation controls obscure available state and actions. |
| 7 | Flexibility and Efficiency | 2/4 | The implementation supports cross-page selection and batch actions, but the observed profile exposes selection without those actions; no keyboard accelerators were apparent. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Search, table, and pagination are well separated with restrained color; the expanded 33-item side navigation adds peripheral weight. |
| 9 | Error Recovery | 2/4 | Reset works and preserves a clear recovery path, but the unmatched query did not show an empty or error state. Cause may be the local mock/API behavior. |
| 10 | Help and Documentation | 0/4 | No contextual help or task guidance is visible on either authority page. |
| **Total** |  | **22/40 — Acceptable** | Main gaps are role data visibility, search feedback, and action/permission clarity. |

## Cognitive Load

Moderate: 3 of 8 checklist items fail. The central work area itself is focused and grouped: two filters, a table, and pagination. The left rail exposes 33 menu entries, the 权限中心 group has 10 children, and the screenshot shows groups expanded together; this exceeds the four-choice guideline and weakens progressive disclosure. The search/list workflow does not otherwise require substantial cross-screen memory.

## Emotional Journey

The initial table feels orderly and familiar, and the textual 正常/禁用 labels reduce uncertainty. An unmatched query then leaves the user with no visible confirmation that the list changed; seeing the same three records creates doubt about whether search ran. Selecting a row does visibly change the checkbox, but no batch action appears in the current profile. The user reaches the end of the interaction unsure whether the data is unchanged, the query was ignored, or their account lacks permission.

## What's Working

- The search area, table, and pagination read in a natural top-to-bottom sequence at desktop width.
- Status is expressed as text as well as red/green color, so state is not color-only.
- Reset visibly clears both filter text and row selection, and the page has a stable breadcrumb and active navigation item.

## Priority Issues

1. **[P1] The role column is blank for every seeded person.** The live table shows names, organizations, and statuses, but no roles. The column is declared with `prop: 'roleName'` while the slot renders `row.role.name` and falls back to an empty string in `adminPerson/index.vue:71,318`. The rendered result is confirmed; the exact API/mock field mismatch is not. Show the contract-backed role value and render an explicit “未分配” state when a user has no role. Suggested command: `/impeccable clarify`.
2. **[P1] Search gives no visible result for an unmatched query.** Typing `zzNoUser` and pressing 搜索 left all three seeded records and the total unchanged, with no empty state or progress feedback. This may be a mock/API filtering limitation rather than the control itself, so the backend cause remains uncertain. Ensure the query is applied and provide loading, no-results, and failure states; otherwise disable or explain the unavailable filter. Suggested command: `/impeccable harden`.
3. **[P1, conditional] The mock administrator sees no authority actions, while selection remains enabled.** In the observed `Mock预览管理员` session, 新增 and the person row/batch actions were absent; the role page also had an empty 操作 column. `adminPerson` gates its actions by permission around `index.vue:83-101,393`, and `adminRole` gates them around `index.vue:81-91,276-302`. If this profile is meant to demonstrate administrator workflows, it prevents the core task. If it is intentionally read-only, label that state and hide selection controls that cannot lead to an action. The fixture's intended permissions are uncertain.
4. **[P2] The page filters lack accessible names in the rendered accessibility tree.** The name and organization inputs appear as generic text fields, unlike the named global menu search. Their placeholders disappear once text is entered, making the fields harder to identify for screen-reader users. Add persistent labels or accessible names. Suggested command: `/impeccable audit`.

## Persona Red Flags

- **Alex, Power User:** The row checkbox responds, but the current preview profile offers no visible batch command. The unmatched search also leaves the same records, so a quick lookup cannot be trusted.
- **Sam, Accessibility-Dependent User:** The two filter fields lack names in the accessibility tree. Status text is available, which avoids a color-only state signal.
- **Riley, Stress Tester:** An unmatched query leaves seeded rows and a total of three instead of a useful empty state. The blank role cells also make it impossible to verify role assignment from the list. Whether the mock intentionally ignores filters is unconfirmed.

## Minor Observations

- The user table reserves a 280px action column even when no actions are shown in this preview, leaving a large blank strip to the right of the status column.
- The page uses “姓名” as the visible first column while its source comment describes the field as account/name; confirm whether users need a distinct login identifier for reliable matching.
- No empty, loading, or error result state was reachable from this mock dataset during the review.

## Questions to Consider

- Is `Mock预览管理员` meant to represent a working admin, or a read-only account? The visible controls should make the answer obvious.
- Should a missing role be called out as “未分配” so operators can identify accounts that need attention?
- What should an operator conclude when 搜索 is pressed and the previous rows remain unchanged?
