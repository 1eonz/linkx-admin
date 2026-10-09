# Assessment B Checkpoint: Mixed Pre-Fix Baseline

Status: incomplete and degraded. This evidence is not a formal post-fix Assessment B result and must not be used to claim a critique pass.

## Target and fingerprint

Targets: `linkx-fe/src/components/LxDynamicForm/**`, `linkx-fe/src/components/LxUpload/**`, `linkx-fe/docs/components/lxdynamicform.md`, and `linkx-fe/docs/components/lxupload.md` (23 files total). The pre-run aggregate SHA-256, stored with per-file hashes in `target-fingerprint-before.json`, was `bd1059a7e4cbc01e00d0ff308055ce0eec67eba28596c9d6cf23d5e757ac6586`. The end-of-run hash in `target-fingerprint-after.json` was `dfd7a8f4a300021ee56eac6efcdccdd5fc896936c1c6b0eb313448cc15c4ff34`; they differ.

Changed target files during capture:

- `linkx-fe/docs/components/lxdynamicform.md`
- `linkx-fe/src/components/LxDynamicForm/demo/basic.vue`
- `linkx-fe/src/components/LxDynamicForm/index.vue`
- `linkx-fe/src/components/LxDynamicForm/style.css`
- `linkx-fe/src/components/LxDynamicForm/types.ts`

The detector snapshots ran before the end hash was taken, but no contemporaneous post-scan fingerprint exists. Keep them as raw preliminary evidence only; do not attribute them to the final frozen source.

## CLI detector evidence

Commands, raw stdout JSON, stderr, and exit codes are stored separately for each target:

- `linkx-fe/src/components/LxDynamicForm`: `detector-dynamicform-source.command.txt`, `.stdout.json`, `.stderr.txt`, `.exit-code.txt`.
- `linkx-fe/src/components/LxUpload`: `detector-lxupload-source.command.txt`, `.stdout.json`, `.stderr.txt`, `.exit-code.txt`.
- `linkx-fe/docs/components/lxdynamicform.md`: `detector-dynamicform-doc.command.txt`, `.stdout.json`, `.stderr.txt`, `.exit-code.txt`.
- `linkx-fe/docs/components/lxupload.md`: `detector-lxupload-doc.command.txt`, `.stdout.json`, `.stderr.txt`, `.exit-code.txt`.

All four stdout JSON values are `[]`, stderr is empty, and exit code is `0`. An empty array means zero static findings only for that individual target at the time of its scan; it does not establish browser or full critique success.

## Browser evidence

Both custom capture scripts pass `node --check`; the scripts and every capture attempt are retained under this directory. The final DynamicForm attempt is `dynamicform-attempt-6.*`; it exited `1` with empty stderr. It injected the detector successfully and captured 10 desktop views with screenshots and overlay attribution under `screenshots/attempt-6/`. Per-view findings/visible overlay counts: light `19/10`, dark HUD `29/22`, main remote loading `325/34`, results `328/34`, selected result `334/37`, failure `331/37`, successful main retry `329/34`, valid submit `328/34`, preview loading `328/34`, preview failure `330/37`. All 16 checks reached before the stop passed. Capture ended because the preview retry flow did not expose the expected `李警官 · 指挥中心` option within five seconds; preview successful-retry and mobile views were not captured.

The final LxUpload attempt is `lxupload-attempt-6.*`; it exited `1` with empty stderr. It injected the detector and captured four desktop views with screenshot and overlay attribution: light `34/12`, dark HUD `90/38`, upload failure `173/21`, and after retry `193/20`. Queueing and the local Mock upload failure rendered. The retry action removed the file row; auto-upload did not enter the expected uploading/cancel state, so success, progress, cancellation, disabled, and mobile views were not captured. The one browser console error is the demo's intentional `UploadAjaxError: 本地 Mock 上传失败`; page errors, failed requests, blocked HTTP requests, and non-GET attempts are all zero in the saved evidence.

Browser captures use `[Human] Assessment B` title preflight and append `/detect.js`; successful injection is recorded in each browser JSON. The overlay pointer events were disabled by CSS in the capture tab after measurement so subsequent automation could interact with controls; this leaves overlay appearance unchanged. The first DynamicForm attempts also preserve allowlist failures for VitePress-only modules and harness timeouts.

## Servers and next run

VitePress used port `4182`; Impeccable live server used port `8400`. Stop commands and results are stored in `vitepress.stop.*` and `live-server-stop.*`; both stop commands returned exit `0`. Final port checks recorded both ports free and both URLs unreachable. The live-server state under `linkx-fe/.impeccable/live/server.json` was cleaned by its stop command. The existing repository-root `.impeccable/live/server.json` deletion remains untouched.

After the parent confirms a new source freeze, repeat the four CLI scans and both browser captures from a fresh matching pre/post fingerprint. This checkpoint is not a substitute for that run and contains no combined critique or Assessment A material.
