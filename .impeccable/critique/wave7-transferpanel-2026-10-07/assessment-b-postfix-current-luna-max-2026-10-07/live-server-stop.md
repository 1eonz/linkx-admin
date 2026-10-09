# 辅助服务停止记录

- 停止前：`127.0.0.1:8489` 由 PID `26684` 监听；`127.0.0.1:4174` 由 PID `23396` 监听。
- 停止命令：`node C:\Users\Administrator\.codex\skills\impeccable\scripts\live-server.mjs stop --keep-inject`
- 命令输出：`Stopped live server on port 8489.`
- 退出码：`0`
- 停止后：8489 无监听，`/health` 连接被拒绝；4174 仍由 PID `23396` 监听，`/components/lxtransferpanel` 返回 HTTP `200`。
- 未停止 4174 预览服务，也未清理或改写页面注入标签。
