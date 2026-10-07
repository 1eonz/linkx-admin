# LxUpload 文件上传

基于 Element Plus 上传能力统一文件校验、拖拽区域、上传进度和文件状态展示。网络请求由宿主通过 `action` 或 `httpRequest` 配置；组件不访问业务接口。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxUpload/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxUpload/demo/basic.vue
:::

示例覆盖手动/自动上传、拖拽区三态、聚合进度面板与取消上传、成功/失败/排队徽章、进度、重试、文件校验、禁用、标准行/紧凑标签和 HUD 深色主题。请求由 Demo 内存 Mock 提供，不发送网络请求。

## Props

| 名称              | 类型                                 | 默认值            | 说明                                                                                                  |
| ----------------- | ------------------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------- |
| `modelValue`      | `unknown[]`                          | `[]`              | 受控文件列表，配合 `v-model`；变更时发出 `LxUploadFile[]`，保留文件 URL 和宿主适配器的原始 response。 |
| `action`          | `string`                             | `''`              | Element Plus 默认上传地址。为空且未配置 `httpRequest` 时，提交会被阻止并显示配置提示。                |
| `httpRequest`     | `LxUploadRequestHandler`             | `undefined`       | 宿主注入的请求适配器；设置后优先于 Element Plus 默认 XHR。                                            |
| `accept`          | `string`                             | `''`              | 逗号分隔的扩展名或 MIME 类型，例如 `.xlsx,.csv,image/*`；组件会在上传前校验。                         |
| `maxSize`         | `number`                             | `undefined`       | 单文件最大体积，单位 MB。                                                                             |
| `limit`           | `number`                             | `undefined`       | 最多可选择的文件数量。                                                                                |
| `multiple`        | `boolean`                            | `false`           | 是否允许多选。                                                                                        |
| `drag`            | `boolean`                            | `undefined`       | 是否展示拖拽区域；未设置时沿用兼容属性 `draggable`。                                                  |
| `draggable`       | `boolean`                            | `true`            | 兼容旧属性；新代码优先使用 `drag`。                                                                   |
| `autoUpload`      | `boolean`                            | `false`           | 选择后是否立即上传；默认先进入待提交队列。                                                            |
| `listType`        | `'standard-rows' \| 'compact-chips'` | `'standard-rows'` | 文件列表布局。                                                                                        |
| `chunkSize`       | `number`                             | `1024`            | 以 KB 为单位透传给 `httpRequest`，作为宿主分片适配器的配置提示。                                      |
| `disabled`        | `boolean`                            | `false`           | 禁止选择文件、提交、重试、清空、移除和取消上传。                                                      |
| `headers`         | `Record<string, string>`             | `{}`              | Element Plus 默认 XHR 请求头；自定义适配器从请求参数读取。                                            |
| `name`            | `string`                             | `'file'`          | 上传表单字段名。                                                                                      |
| `withCredentials` | `boolean`                            | `false`           | 默认 XHR 是否携带凭据。                                                                               |

## Events

| 事件                | 参数             | 说明                                                                            |
| ------------------- | ---------------- | ------------------------------------------------------------------------------- |
| `update:modelValue` | `LxUploadFile[]` | 文件被添加、状态更新、移除或清空时发出。                                        |
| `change`            | `(file, files)`  | 选择文件或上传状态变化时发出。                                                  |
| `progress`          | `(file, files)`  | 上传进度变化时发出；`file.percentage` 为 0–100。                                |
| `success`           | `file`           | 单个文件上传成功；适配器提供的响应以 `file.response` 原样保留，不解析业务字段。 |
| `error`             | `(file, error)`  | 单个文件上传失败。                                                              |
| `remove`            | `file`           | 单个文件被移除。                                                                |
| `exceed`            | `File[]`         | 选择数量超过 `limit`。                                                          |

## 插槽与实例

组件目前没有自定义插槽。实例公开 `submit()`、`abort(file?)` 和 `clearFiles()`；禁用时 `submit()`、`clearFiles()` 不执行。`abort(file?)` 会取消目标请求并将对应上传状态复位到队列；调用 `clearFiles()` 会同步发出空 `v-model`。

## 文件值

`LxUploadFile` 包含 `uid`、`name` 及可选的 `size`、`type`、`status`、`percentage`、`raw`、`url`、`error` 和 `response`。`response` 是宿主上传适配器返回的原始值，组件不会假定其中存在特定 URL 字段。受控父级把文件值回传后，组件会继续保留 `url`、`response` 与失败 `Error`，后续进度或列表变更不会丢弃这些数据；重新挂载时，失败文案优先使用回传的 `error.message`，没有错误对象时显示通用提示。通过选择器加入的文件通常由 Element Plus 分配数值 UID；缺少 UID 的受控输入（包括直接传入未登记 UID 的 `File`）会在首次回传时获得实例级字符串 UID。尚未获得回传 UID 时，组件会根据原始 `File` 对象保持内部身份，因此同名同大小文件重排也不会交换上传请求；宿主仍应保存并原样回传生成的 UID，以保持受控身份稳定。UID 按原始类型严格匹配，字符串 `"42"` 与数字 `42` 是不同的文件身份。当 Element Plus 内部 UID 与宿主文件 UID 不一致时，上传队列会使用独立原始文件副本；事件与受控模型仍回传宿主 UID 和原始 `raw` 文件，不会改写宿主文件的 UID。

## 拖拽区与列表行为

- **默认就绪**：36px 上传图标 + 主副文案；"浏览本地文件"为下划线提示，整个上传区域提供单一按钮语义和键盘操作。
- **拖拽悬停**：边框转主色 + 浅主色底 + inset 阴影，内容由就绪态切换为 40px 圆形图标 + "释放鼠标即可上传"。
- **上传中（态 C）**：拖区变形为聚合进度面板，显示上传中文件数量与平均总进度；"取消上传"会 abort 全部进行中请求并把文件复位回"排队中"（Element Plus 的 abort 不派发事件，组件主动复位 `v-model`）。禁用态下取消按钮同样禁用，宿主仍可调用实例 `abort()`。
- **状态徽章**：排队中 / 上传中 / 上传成功 / 上传失败四种胶囊徽章；失败行文件名红字显示。
- **列表头**：文件数不为空时显示"已选 N 个文件"和"全部清空"按钮（复用 `clearFiles` 逻辑，禁用时置灰）。

## 窄屏与触屏

拖拽区高度至少为 120px；提示文案可换行，内容较多时区域随内容增高。窄屏文件名在行内省略，不撑宽页面。触屏模式下上传区域、取消、重试、移除和清空操作均保留至少 44px 的点按区域。

## 请求边界

- 默认使用手动提交；设置 `autoUpload` 前，应配置 `action` 或 `httpRequest`。
- `httpRequest` 接收 Element Plus 请求参数、`chunkSize` 和 `signal`。宿主负责服务端协议、分片合并、鉴权和结果映射；可取消的请求应将 `signal` 传给底层传输。组件也会在受控 `modelValue` 移除某个文件时取消对应请求。即使旧适配器忽略 `signal`，取消或重试后到达的进度、成功和失败回调也会被组件丢弃，但底层网络请求可能继续运行。
- `accept` 与 `maxSize` 是前端校验，不能代替服务端文件类型、内容和体积校验。
- 上传进度和成功/失败状态由请求适配器回调更新；取消不代表服务端已回滚已接收的数据。

## 设计对照记录

- 拖拽区最小高度 120px、2px dashed、8px 圆角，内容四周留白至少 12px 且长文案时自适应增高；就绪态使用卡片浅灰底，悬停/拖入切换主色边框与浅主色底。
- 上传中状态切换为 120px 实线进度面板，显示加载图标、聚合进度、8px 条纹进度条和取消操作；`prefers-reduced-motion` 时关闭条纹和进度过渡。
- 文件列表采用 8px 外框圆角，行内保留上传中/成功/失败/排队四种徽章、进度、错误说明、重试和移除操作；移动端操作命中区至少 44px。
- 组件仍只负责展示、前端校验和宿主注入的上传适配器，不发送真实业务请求。
