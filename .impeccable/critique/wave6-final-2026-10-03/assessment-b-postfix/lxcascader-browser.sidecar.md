# Cascader browser sidecar

- Target: `linkx-fe/src/components/LxCascader/index.vue` and `linkx-fe/docs/components/lxcascader.md`
- URL: `http://127.0.0.1:4174/components/lxcascader`
- Browser: Codex In-app Browser, fresh tab 2
- Capture time: 2026-10-03 (local session date); final capture followed the parent agent's completed Delete guard change
- View: after final-source reload, first failure state and then normal interactive state
- Component state: single-select; initial focused field value `杭州市公安局 / 西湖区分局 / 情指中心`; error message `组织数据加载失败` and `重试` action visible during the Delete check
- Delete check: pressed `Delete` while the focused field was in error state; the AX tree showed no value or state change and retained the selected path and error/retry feedback
- Normal keyboard path: after demo retry restored the normal state, clicking the field opened the popup; `Escape` closed it while the field retained focus. `ArrowDown` reopened the popup and focused `杭州市公安局`; `Right` moved focus to `西湖区分局`, a second `Right` moved into the leaf column, `Down` moved to `巡防大队`, and `Enter` changed the displayed path and current value to `杭州市公安局 / 西湖区分局 / 巡防大队` (`hangzhou / xihu / patrol`).
- Filter path: `Ctrl+A` then typing `滨江` produced a single visible match, `杭州市公安局 / 滨江区分局`. `Enter` closed the popup, but the field and current-value summary remained on `巡防大队`; the filtered match was not committed by this observed action.
- Capture reliability: a previous accessibility-index click unexpectedly appended text to the local demo field. The page was reloaded before the keyboard sequence; that transient value is excluded from the observations above.
- Docs theme: light
- Viewport: 1264 x 713 CSS pixels as rendered by the screenshot observation
- External request count: unknown; the CUA interface did not expose request instrumentation
- Screenshot: error-state, expanded-menu, filtered-result, and post-Enter views captured inline in CUA tool results; no file export API was exposed
- Overlay: skipped because the shared mutable-injection preflight was rejected by browser policy; no alternate injection was attempted
- Detector evidence: `lxcascader-detector.*` and `lxcascader-doc-detector.*`
