# Runtime Availability Record

Checked: 2026-10-07

The requested site at `http://127.0.0.1:4174` actively refused connections during initial probing. That instance was not stopped or restarted. After authorization, an independent acceptance instance at `http://127.0.0.1:4175` was used for the browser assessment.

| URL | 4174 probe | 4175 assessment |
|---|---|---|
| `/components/lxcascader` | Connection actively refused | Captured with Chrome 154 + Playwright |
| `/components/lxdescriptions` | Connection actively refused | Captured with Chrome 154 + Playwright |
| `/components/lxvirtualtree` | Connection actively refused | Captured with Chrome 154 + Playwright |

The 4175 run produced 50 screenshots, 27 page/viewport metric records, and 9 interaction records covering desktop 1440px, mobile 375px, light/HUD, reduced motion, keyboard, loading/error/empty/disabled, and sidebar states. All three routes had no document-level horizontal overflow. The only console/network error was the VitePress shell request `GET http://127.0.0.1:4175/favicon.ico -> 404`; it was excluded from the component issue count. Detector and overlay were not run in this isolated Assessment A pass.
