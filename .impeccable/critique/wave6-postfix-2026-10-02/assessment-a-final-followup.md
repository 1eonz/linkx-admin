# Assessment A Follow-up

Method: bounded source review plus an attempted focused mobile E2E; no Assessment B, detector, or overlay output consulted.

## Resolved in Current Source

- **Demo frame width:** TreeSelect and Cascader both use `width: 100%` with `max-width: 520px`; both now use the same `--lx-space-md` grid gap. The source discrepancy from Assessment A is resolved. See [TreeSelect Demo](/F:/work/linkx-admin/linkx-fe/src/components/LxTreeSelect/demo/basic.vue:146) and [Cascader Demo](/F:/work/linkx-admin/linkx-fe/src/components/LxCascader/demo/basic.vue:146).
- **TreeSelect label and initial expansion:** the demo now shows the “组织机构” label associated with its input and passes `default-expanded-keys=['hz']`, which expands only the root organization by default. See [TreeSelect Demo](/F:/work/linkx-admin/linkx-fe/src/components/LxTreeSelect/demo/basic.vue:82) and [TreeSelect Demo](/F:/work/linkx-admin/linkx-fe/src/components/LxTreeSelect/demo/basic.vue:91).
- **Locale control copy:** the visible checkbox now says “English locale”, which describes the broader scope of the `locale` prop. See [TreeSelect Demo](/F:/work/linkx-admin/linkx-fe/src/components/LxTreeSelect/demo/basic.vue:128).
- **Cascader retry target:** `.lx-cascader__retry` now has `min-height: 44px`. The E2E spec includes a 375px viewport assertion measuring the rendered feedback retry button at 44px or taller. See [Cascader styles](/F:/work/linkx-admin/linkx-fe/src/components/LxCascader/style.css:105) and [Cascader E2E](/F:/work/linkx-admin/other-admin/admin-vue3/tests/e2e/lx-cascader-docs.spec.ts:103).

No remaining source-level issue was found among these four requested fixes.

## Verification Limits

- The current sub-agent browser inventory was empty; selecting the in-app browser failed because it was unavailable. I could not open fresh pages to confirm the rendered card widths, label, initial tree expansion, or locale switch in the browser.
- I attempted only the focused 375px Cascader E2E. Playwright started the Vue dev server, but its Vite proxy logged timeouts while requesting `172.16.23.8:30844` endpoints. Since the page had no confirmed complete request mock, I stopped the test. No pass result is claimed. The Playwright-managed server was stopped; port 30846 is no longer listening.
- The E2E source contains the retry-height assertion, but its execution remains unverified in this environment.
