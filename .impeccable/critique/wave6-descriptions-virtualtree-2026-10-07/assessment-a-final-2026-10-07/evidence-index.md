# Assessment A Evidence Index

Capture base: `http://127.0.0.1:4175`

Capture time: `2026-10-07T08:10:27.000Z` (Chrome 154.0.8037.95; exact ISO time is in `browser-evidence.json`).

The `screenshots/` directory contains 50 screenshots from this Assessment A run. `browser-evidence.json` contains 27 page/viewport records, 9 interaction records, source SHA-256 fingerprints, and the full relative screenshot list.

Coverage:

- `LxDescriptions`: desktop light, grid + bordered, HUD, loading, empty, error; 375px light/reduced-motion and error/reduced-motion; docs sidebar and mobile sidebar open.
- `LxCascader`: desktop light, HUD open, error, disabled; 375px light/reduced-motion and HUD open/reduced-motion; docs sidebar; ArrowDown/Escape keyboard path; popper bounds.
- `LxVirtualTree`: desktop light, controls open, keyboard focus, HUD, loading, empty, error; 375px light/reduced-motion and controls open/reduced-motion; docs sidebar; Tab sequence and control target sizes.
- Common checks: no document horizontal overflow at 1440px or 375px; reduced-motion media query true in reduced-motion captures.

Representative screenshots referenced by the report:

- `screenshots/descriptions-desktop-light-docs-sidebar.png`
- `screenshots/descriptions-desktop-hud-viewport.png`
- `screenshots/descriptions-mobile-375-light-reduced-motion-component.png`
- `screenshots/descriptions-mobile-375-error-reduced-motion-viewport.png`
- `screenshots/descriptions-mobile-375-sidebar-open.png`
- `screenshots/cascader-desktop-hud-open-component.png`
- `screenshots/cascader-mobile-375-hud-open-reduced-motion-viewport.png`
- `screenshots/virtualtree-desktop-light-docs-sidebar.png`
- `screenshots/virtualtree-desktop-controls-open-component.png`
- `screenshots/virtualtree-desktop-keyboard-focus-component.png`
- `screenshots/virtualtree-desktop-hud-component.png`
- `screenshots/virtualtree-mobile-375-controls-open-reduced-motion-component.png`

The one console error was separately reproduced as `GET http://127.0.0.1:4175/favicon.ico -> 404`; see `console-network.md`. It is VitePress shell chrome, not a component request.
