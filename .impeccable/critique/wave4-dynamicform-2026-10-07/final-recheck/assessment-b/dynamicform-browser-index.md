# Assessment B：浏览器证据最终状态

## DynamicForm 补采

浏览器证据仍不完整，不能标记为正式通过。补采使用独立 Playwright BrowserContext/Page。首次尝试遇到 4174 连接拒绝；服务恢复后的唯一补采得到 HTTP 200，DOM mutation preflight 成功，detector 脚本也成功注入，`impeccableScan` 与 `impeccableDetect` 均为函数。

补采随后在 HUD 状态设置处失败：脚本尝试点击“深色主题（HUD）”文字，但它位于默认收起的“演示设置”`details` 内，目标不可见，Playwright 在 30 秒后超时。脚本没有先展开“演示设置”。因此没有调用 `impeccableScan`，`views=[]`、`screenshotIndex=[]`，没有本轮 overlay 命中或截图。页面 console 另有一条 404 资源错误；`pageErrors=[]`、`failedRequests=[]`。检测器注入成功不等于 overlay 扫描成功。

## 视图索引

| 状态 | 主题 | 视口 | 证据 |
|---|---|---:|---|
| desktop-light | 浅色 | 1365×900 | 先前部分证据：`screenshots/lxdynamicform--desktop-light.png`；有一次浏览器扫描 |
| desktop-hud-dark | HUD 深色 | 1365×900 | 缺失：本轮在展开设置前超时 |
| mobile-light | 浅色 | 375×812 | 缺失：本轮未到视口切换 |
| mobile-hud-dark | HUD 深色 | 375×812 | 缺失：本轮未到视口切换 |
| empty-submit-error | 浅色，空表单提交后 | 1365×900 | 缺失：未执行提交校验 |

## 既有 Overlay 分类

下表沿用 B 目录已保存的浏览器分类。组件命中、VitePress 壳层与文档正文分别列出；既有分类把 `.language-*`、`.shiki` 等代码块并入“文档正文”，因此代码块单独数量不可从该汇总确认。本轮 DynamicForm 补采没有产生新分类。

| 页面与状态 | 目标组件 | VitePress 壳层 | 文档正文（含未拆分代码块） |
|---|---:|---:|---:|
| DynamicForm desktop-light | 3 | 1 | 12 |
| Upload desktop-light | 5 | 1 | 8 |
| Upload desktop-hud-dark | 14 | 1 | 8 |
| Upload mobile-hud-dark | 14 | 2 | 148 |
| Upload mobile-light | 5 | 2 | 148 |
| DatePicker desktop-light | 9 | 1 | 9 |
| DatePicker desktop-hud-dark | 37 | 1 | 9 |
| DatePicker mobile-hud-dark | 35 | 2 | 2 |
| DatePicker mobile-light | 9 | 2 | 2 |

## 静态扫描与冻结

六个静态 detector 目标均为 `stdout=[]`、stderr 为空、退出码 0：DynamicForm demo/docs、Upload demo/docs、DatePicker demo/docs。静态零命中不能替代缺失的 DynamicForm browser overlay 证据。

本轮前后冻结校验均为 41/41 匹配，`allMatch=true`。恢复补采的命令、stdout、stderr、退出码及 runtime 记录保存在 `dynamicform-browser-capture-recovery.*` 与 `dynamicform-browser-runtime-recovery.json`。首次连接失败记录仍保留在 `dynamicform-browser-capture.*`。本任务未修改源码、测试、计划或 Assessment A 报告。
