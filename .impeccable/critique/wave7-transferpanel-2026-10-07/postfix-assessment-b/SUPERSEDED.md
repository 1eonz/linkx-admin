# 已作废的 Assessment B 预采集

收到维护者要求后，本目录中的当前 detector 与 VitePress HTTP 结果均标记为 superseded，不构成本次 Wave 7 修后 Assessment B 的结论。启动期间使用的 VitePress 端口 `4191` 与 overlay 端口 `8488` 已停止；浏览器采集尚未开始。

静态结果对应旧冻结指纹：`index.vue` 和 `demo/basic.vue` 各自 detector stdout 为 `[]`、stderr 为空、退出码为 `0`；目标页 HTTP 为 `200`。由于目标源码将按 Vue peer 兼容要求更新，这些结果不得用于新指纹下的验收。

收到新的四文件 SHA-256 后，将重新核对目标，重新运行单文件 detector，并新建浏览器上下文采集最终证据。本目录的旧原始结果保留用于说明本次作废边界，不进入最终报告。
