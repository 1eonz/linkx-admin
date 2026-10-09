# 浏览器复验服务记录

- 目标：`http://127.0.0.1:4174/components/lxicons.html`
- 原有 4174 实例在首轮连接时返回 HTTP 200；随后浏览器重采时连接被拒绝。
- 复验恢复命令：在 `linkx-fe` 目录运行 `pnpm exec vitepress dev docs --host 127.0.0.1 --port 4174`。终端报告服务地址 `http://127.0.0.1:4174/`，完整截图与状态采集均在该恢复后的实例完成。
- 停止方式：向本次 exec session 36726 发送 Ctrl+C；进程退出码为 1（由中断结束）。停止后 `Test-NetConnection 127.0.0.1 -Port 4174` 返回 `TcpTestSucceeded: False`。
- 另一次通过 package script 启动的临时 VitePress 进程使用 session 94537，实际监听默认 5173；同样通过 Ctrl+C 停止，并未保留服务。
- 本次复验没有修改页面源文件；生成的浏览器截图、状态 JSON、采集脚本和本报告均保存在本目录。
