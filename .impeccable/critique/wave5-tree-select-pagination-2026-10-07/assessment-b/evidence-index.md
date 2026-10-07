# Wave 5 Assessment B 证据索引

## 最终 detector

根目录：`detector-final/`

目标目录与原始文件：

- `lxtreeselect-source/`
- `lxcascader-source/`
- `lxselectpagination-source/`
- `lxtreeselect-demo/`
- `lxcascader-demo/`
- `lxselectpagination-demo/`
- `lxtreeselect-doc/`
- `lxcascader-doc/`
- `lxselectpagination-doc/`

每个目录固定包含：

- `command.txt`：实际执行的 detector 命令
- `stdout.json`：原始 JSON stdout，本轮均为 `[]`
- `stderr.txt`：原始 stderr，本轮均为空
- `exit-code.txt`：进程退出码，本轮均为 `0`

## 最终浏览器

根目录：`browser/`

- `capture-browser.mjs`：独立 Edge/CDP 捕获脚本
- `capture.command.txt`、`capture.stdout.json`、`capture.stderr.txt`、`capture.exit-code.txt`：捕获命令和原始进程结果
- `browser-evidence.json`：9 个场景的汇总，包括 viewport、主题、注入结果、状态断言、detector console 规则计数和截图路径
- `lxtreeselect-desktop-light.json`
- `lxtreeselect-desktop-hud-error.json`
- `lxtreeselect-mobile-375-hud-error.json`
- `lxcascader-desktop-light.json`
- `lxcascader-desktop-hud-error.json`
- `lxcascader-mobile-375-hud-loading-error.json`
- `lxselectpagination-desktop-light.json`
- `lxselectpagination-desktop-hud-error.json`
- `lxselectpagination-mobile-375-hud-error.json`
- `context-isolation.json`：独立 BrowserContext 证据
- `edge-version.json`：浏览器版本与 DevTools endpoint 元数据
- `edge-process.json`、`edge-start.command.txt`：临时 profile 和启动命令
- `edge-stop.json`：停止命令、临时 profile 清理和结果
- `target-crashes.json`：最终为 `[]`

截图根目录：`screenshots/`，与上述 9 个场景同名 `.png`。

## live-server

根目录：`live-server/`

- `start.command.txt`、`start.stdout.json`、`start.stderr.txt`、`start.exit-code.txt`：8400 服务启动证据
- `stop.command.txt`、`stop.stdout.txt`、`stop.stderr.txt`、`stop.exit-code.txt`：停止证据
- `stop.verification.txt`：停止后 `/health` 不可达的验证

## 历史尝试归档

- `detector-pre-final/`：最终源码修复前的 9 项静态扫描
- `browser/unstable-final-attempt/`：4177 重启导致部分 `chrome-error://chromewebdata/` 的浏览器尝试
- `browser/pre-final-pass/`、`browser/pre-correction-pass/`、`browser/before-final-source/`：最终状态修复前的浏览器尝试
- `screenshots/initial-pass/`、`screenshots/before-final-source/`：对应历史截图

历史目录只用于追溯，不代表最终 Assessment B 结果。
