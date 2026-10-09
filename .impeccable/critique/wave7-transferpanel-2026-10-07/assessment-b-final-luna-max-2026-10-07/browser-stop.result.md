清理脚本尝试连接 CDP 9515 时得到 ECONNREFUSED，退出码 1。随后端口快照确认 9515 已无监听，且不存在命令行指向本次独立 `browser-profile` 的 Chrome 进程，说明采集器退出时已关闭该浏览器进程；没有终止其他 Chrome 用户进程。
