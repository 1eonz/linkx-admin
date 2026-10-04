# Cascader keyboard sidecar

- Target: `linkx-fe/src/components/LxCascader/index.vue` in the refreshed local docs page
- URL: `http://127.0.0.1:4174/components/lxcascader`
- Browser: Codex In-app Browser, fresh tab 2
- Docs theme and viewport: light, 1264 x 713
- Starting value after reload: `杭州市公安局 / 西湖区分局 / 情指中心`
- `Escape`: after opening the popup, Escape closed it; screenshot showed the field focused with the popup closed.
- `ArrowDown`: from the focused closed field, opened the popup and moved AX focus to `杭州市公安局`.
- `Right`: moved focus from the root to `西湖区分局`, then to the leaf column.
- `Down`: moved focus to sibling `巡防大队`.
- `Enter`: selected `巡防大队`; the field changed to `杭州市公安局 / 西湖区分局 / 巡防大队` and the current-value summary changed to `hangzhou / xihu / patrol`.
- Filtering: `Ctrl+A` followed by `滨江` visibly narrowed the popup to `杭州市公安局 / 滨江区分局`. Pressing Enter closed the popup but left the selected field and summary on the prior `巡防大队` path; this observation does not confirm keyboard selection of the filtered result.
- Delete guard: separately tested in the error state; pressing Delete left the selected path and error/retry feedback intact.
- Screenshots: each listed view was captured inline in the CUA tool results. The available screenshot API provides no workspace export path.
- External request count: unknown; the CUA interface did not expose request instrumentation.
- Overlay: unavailable and not passed; the CUA browser rejected the mutation preflight protocol. No alternate injection method was used.
