# Detector 取证记录

运行目录：`F:/work/linkx-admin`。

命令模板：

```text
node C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs --json <target>
```

| 目标 | stdout JSON | stderr | exitCode |
|---|---|---|---|
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `[]` | 空 | `0` |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `[]` | 空 | `0` |
| `linkx-fe/docs/components/lxtransferpanel.md` | `[]` | 空 | `0` |

对应文件：`index.json`、`index.stderr`、`index.exitCode`；`demo.json`、`demo.stderr`、`demo.exitCode`；`doc.json`、`doc.stderr`、`doc.exitCode`。

三份扫描均在浏览器采集前完成，并在采集结束后复核文件内容。采集前后 SHA256：

```json
{
  "linkx-fe/src/components/LxTransferPanel/index.vue": "df58c2c12e70481654c38cbc7cde21cebe1a13f0ee4da8bca29233d7b826e83a",
  "linkx-fe/src/components/LxTransferPanel/demo/basic.vue": "8f6d04221ed5c225d21adcdcf8f2ae4a22912e24913972c9a0884882c1db65dd",
  "linkx-fe/docs/components/lxtransferpanel.md": "4f5bdb6bb993f7bd65fc51201e3ca91bb7b16b6ac7795fc0da98542cc928f5d5"
}
```

六视图浏览器证据均来自同一次 `capture.mjs` 运行；其结束记录为 `sourceUnchanged=true`。采集期间未发生源码变化，未修改产品文件。
