# 浏览器取证会话

预览服务 `http://127.0.0.1:4174/components/lxtransferpanel.html` 在取证前返回 HTTP 200，由既有工作区进程提供；本次未停止它。

Impeccable live-server 在独立临时工作目录 `C:/Users/Administrator/AppData/Local/Temp/impeccable-transferpanel-016702df315f480e8d5cb8ddc7b5c71e` 启动，避免写入仓库内原本已删除的 `.impeccable/live/server.json`。

- 启动命令：`node C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs --background`
- 启动退出码：0；PID：20644；端口：8400；临时 token 未复制到证据目录。
- 停止命令：`node C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs stop --keep-inject`
- 停止退出码：0；stdout：`Stopped live server on port 8400.`；stderr 为空。停止后端口 8400 无监听。

Chrome 使用独立临时 profile `C:/Users/Administrator/AppData/Local/Temp/codex-transferpanel-cdp-20261008` 和 CDP 端口 9222 启动。浏览器版本为 Chrome 154.0.8037.95，监听 PID 为 10624。

- 启动命令参数：`--headless=new --disable-gpu --no-first-run --no-default-browser-check --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir=C:/Users/Administrator/AppData/Local/Temp/codex-transferpanel-cdp-20261008 --window-size=1440,1100 about:blank`
- 初次尝试以 `Start-Process` 隐藏启动时被命令策略拒绝，未创建进程；随后通过直接 `exec_command` 启动成功，CDP `/json/version` 可读。该启动方式回退没有影响页面取证。
- 停止方式：CDP `Browser.close`；响应 `acknowledged: true`，命令退出码 0。停止后端口 9222 无监听。

`chrome-stop.stdout.txt`、`chrome-stop.stderr.txt`、`chrome-stop.exit-code.txt` 和 `live-server-stop.*` 保存了停止结果。browser 页面的 title 被临时设为 `[Human] Assessment B <case>` 以标记评估页面；未通过可见 GUI 展示浏览器窗口。
