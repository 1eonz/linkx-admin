Assessment A INVALID — strict independence was compromised by an accidental broad source search.

This file is not a formal Impeccable Assessment A and contains no heuristic score. During HUD source discovery, a broad `rg` search returned snippets from the existing component audit and roadmap. Those snippets are excluded from the observations below, but their exposure means I cannot certify that a formal independent score would be free of anchoring. A clean Assessment A should be rerun by an evaluator that has not seen those snippets. No product source or running preview service was changed.

## Fresh browser evidence

The evidence was collected in a new Playwright browser context backed by the installed Microsoft Edge executable, at `http://127.0.0.1:4174/components/lxicons.html`. The page returned HTTP 200 and emitted no page errors.

- The live catalog rendered 96 available names. The page reports 94 glyphs and 96 usable names; runtime counts were 69 names with `data-lx-motion` and 27 without it.
- Searching the unique Chinese term `工作台` returned exactly one result, `dashboard`, in the `侧边栏菜单` group.
- Searching `zzzz___no_match_2026` returned zero cards and the message `无匹配图标`.
- Clicking the dashboard tile copied `<LxIcon name="dashboard" :size="20" />` to the clipboard and displayed the matching success toast.
- Keyboard focus moved from the search input to the dashboard result with a visible 2px outline. Tab moved beyond the single result to the next documentation anchor; Shift+Tab returned to the result.
- Hovering `delete` produced `lx-icon-delete-shake`; the static `dashboard` icon had no animation or transform. `loading` used its spin animation at rest and a distinct hover animation. With `prefers-reduced-motion: reduce`, the icon animation and transform were `none`, with transition duration at zero; the card transition was reduced to `0.01ms` by the global motion rule.
- At 375px, the catalog used two 159.5px columns inside a 327px region. Document width equaled the 375px viewport, with no horizontal overflow.
- The page exposes VitePress's light/dark switch, not a HUD switch. HUD was therefore checked by adding the documented `lx-theme-hud` class to the isolated page's `<html>` element. The catalog and tiles changed to the expected dark surfaces; sampled text contrast ranged from 5.36:1 to 15.19:1. The surrounding VitePress shell remained light, so this verifies the catalog's token behavior and text readability, not an in-product HUD switching workflow.

## Unscored observations

- The visible group title reads `P1 业务语义（26）`, while the design checklist coverage table lists 27 P1 names. `date` is the additional alias and appears in the separate compatibility group, so no name is missing; the two displayed counts use different grouping rules and could be clarified. Preliminary severity: P2.
- The empty state is understandable but only says `无匹配图标`; it offers no clear-search action or explicit recovery hint. Because the text field remains available, this is a small usability gap. Preliminary severity: P2/P3.
- No P0 or P1 failure was observed in the tested flows. These statements are runtime observations only, not a formal priority assessment.

## Evidence files

- `browser-evidence.json`: measurements, states, copy result, browser errors, and screenshot index.
- `desktop-default.png`
- `desktop-hud.png`
- `desktop-hud-search-workbench.png`
- `desktop-search-workbench.png`
- `desktop-keyboard-focus.png`
- `desktop-empty-state.png`
- `desktop-copy-feedback.png`
- `desktop-reduced-motion.png`
- `mobile-375-default.png`
- `browser-assessment.cjs`: Playwright evidence capture script.

The screenshots and JSON are evidence for the live behavior above. The requested independent heuristic rating and formal P0–P2 conclusions remain unverified because this Assessment A is invalid.
