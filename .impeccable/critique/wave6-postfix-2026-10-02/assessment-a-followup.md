# Assessment A Follow-up: Cascader Demo and Auxiliary Text

This bounded addendum checks only the final Cascader demo state and auxiliary-text contrast tokens. It does not repeat the full design review or inspect detector/Assessment B evidence.

## P2 status: resolved by implementation and documentation

The demo now includes the mutually exclusive “加载中且失败” data-state option. Selecting it maps both `loading` and `error` to `true`. The component keeps `hasError` false while loading, shows the loading status, suppresses error/retry feedback, and retains `aria-busy`; the Chinese documentation explicitly says that the loading copy takes priority. The label, selected-state treatment, and documented outcome make the rule understandable.

I verified this from the current source and docs. The browser inventory returned no available browsers in this follow-up turn, so I could not visually exercise the new control or capture a fresh rendering. Record the P2 as resolved in code/docs with browser presentation still unverified.

## Auxiliary-text contrast

The Cascader demo’s state disclosure, current-value line, and status line now use `--lx-text-secondary-strong` instead of the weaker secondary text token. The light token is `#606266` on white (`#ffffff`), calculated contrast 6.11:1. The HUD override is `#94a3b8` on the declared card surface `#101a2c`, calculated contrast 6.79:1. Both exceed the 4.5:1 threshold for the demo’s 12 px text. This is a substantive improvement in legibility without changing the subdued hierarchy.

## Remaining P3s and limits

- TreeSelect’s English footer fallback remains documented but is not demonstrated in its interactive example.
- The Cascader and TreeSelect docs demos still use different framing: Cascader has a bordered card, TreeSelect is unframed.
- Mobile rendering, reduced-motion behavior, and the new combined state were not visually rechecked because no browser was available in this follow-up. Contrast ratios above were computed from the current declared tokens/surfaces.

No new P0-P2 finding was identified in this bounded source review.
