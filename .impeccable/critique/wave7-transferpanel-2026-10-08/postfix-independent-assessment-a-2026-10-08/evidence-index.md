# Wave 7 LxTransferPanel Post-fix Assessment A Evidence

All screenshots were captured from a fresh Playwright Chromium page at `http://127.0.0.1:4174/components/lxtransferpanel`, using the source hashes recorded in `browser-facts.json`. The browser context was isolated from the user's preview session. The 4174 listener (PID 28380) remains running.

## Review

- [assessment-a.md](assessment-a.md): independent design assessment, findings, scores, cognitive-load review and persona notes.
- [browser-facts.json](browser-facts.json): route metadata, browser measurements, state facts, console errors, screenshot list and before/after SHA-256 values.
- [capture.mjs](capture.mjs): repeatable local browser evidence capture; it did not modify component source.

## Screenshots

| Evidence | Screenshot | What it records |
|---|---|---|
| Desktop light | [01-desktop-light.png](01-desktop-light.png) | 1440px light theme, normal 5:2:5 layout, quota feedback and selected summary. |
| Desktop HUD dark | [02-desktop-hud-dark.png](02-desktop-hud-dark.png) | Dark theme and status/selection legibility. |
| HUD keyboard focus | [14-hud-dark-keyboard-focus.png](14-hud-dark-keyboard-focus.png) | Keyboard focus ring in HUD dark theme. |
| Expanded inversion scope | [03-invert-explanation-expanded.png](03-invert-explanation-expanded.png) | Scope wording and the tree area after expanding the explanation. |
| Light keyboard focus | [04-keyboard-focus.png](04-keyboard-focus.png) | Tab navigation reaches a named selected-item remove button with a visible focus ring. |
| Long name expanded | [05-long-name-expanded-desktop.png](05-long-name-expanded-desktop.png) | 80-character selected name expanded within the list viewport. |
| Loading | [06-loading-state.png](06-loading-state.png) | Busy region, status message and preserved selection. |
| Error | [07-error-state.png](07-error-state.png) | Alert and retry action, with selection retained. |
| Empty tree | [08-empty-state.png](08-empty-state.png) | “暂无数据” while prior selected entries remain visible. |
| Narrow light source panel | [09-narrow-light-source.png](09-narrow-light-source.png) | 375px responsive source panel. |
| Narrow light selected panel | [10-narrow-light-selected.png](10-narrow-light-selected.png) | 375px selected panel and mobile switcher. |
| Narrow HUD dark | [11-narrow-hud-dark-selected.png](11-narrow-hud-dark-selected.png) | HUD dark selected panel at 375px. |
| Narrow long name | [12-narrow-long-name-wrapped.png](12-narrow-long-name-wrapped.png) | Full 80-character name wraps without disclosure or horizontal overflow. |
| Reduced motion | [13-narrow-reduced-motion.png](13-narrow-reduced-motion.png) | Rendered state with `prefers-reduced-motion: reduce`. |

