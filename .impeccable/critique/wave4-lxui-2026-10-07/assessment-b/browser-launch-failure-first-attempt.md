# 浏览器首次启动诊断

- 命令：`node .impeccable/critique/wave4-lxui-2026-10-07/assessment-b/browser-evidence.mjs http://127.0.0.1:8400`
- Playwright executable：`C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe`
- 退出码：`1`
- stdout：空
- stderr 诊断：

  ```text
  node:internal/modules/run_main:107
      triggerUncaughtException(
      ^

  browserType.launch: spawn UNKNOWN
  Call log:
    - <launching> C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe ... --headless --hide-scrollbars --mute-audio --no-sandbox --user-data-dir=C:\Users\Administrator\AppData\Local\Temp\playwright_chromiumdev_profile-Az6M3s --remote-debugging-pipe --no-startup-window

      at F:\work\linkx-admin\.impeccable\critique\wave4-lxui-2026-10-07\assessment-b\browser-evidence.mjs:19:32
      at async node:internal/modules/esm/loader:650:26 {
    name: 'Error'
  }

  Node.js v26.8.1
  ```

- 失败阶段：Chromium 进程启动，在导航和脚本注入之前。浏览器调用日志的首尾及启动参数已保留在上方；stderr 没有其他输出。
- 该浏览器未成功启动，因此没有页面或 overlay 结果。
- 后续只切换到本机已安装的 `chromium_headless_shell-1243` executable 启动一次；该启动成功，随后七个独立 context/page 均完成页面导航和 detector 注入。未重试 live-server 或已成功的注入。
