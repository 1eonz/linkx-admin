# 服务生命周期

- 目标文档服务：`http://127.0.0.1:4174/components/lxdynamicform.html`。开始与结束均由 PID `15228` 监听，HTTP 状态为 `200`。
- Impeccable overlay 服务：从 `assessment-b/` 独立根目录运行技能自带 `live-server.mjs --background`，端口 `8400`、PID `16204`。健康检查为 `200`；隔离根未加载项目上下文（`hasProjectContext=false`）。
- 清理命令：`node "C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs" stop --keep-inject`，输出 `Stopped live server on port 8400.`。清理后 PID 已退出、8400 无监听、`assessment-b/.impeccable/live/server.json` 不存在。
- Chrome 使用新的临时 profile；最终三视图与 375px 对照均记录 `chromeStopped=true`、`profileRemoved=true`。页面 Chrome context 全新隔离，未复用已有窗口。
- 未停止或修改 4174 文档服务。
