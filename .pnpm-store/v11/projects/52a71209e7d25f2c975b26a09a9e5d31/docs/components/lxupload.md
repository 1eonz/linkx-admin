# LxUpload 文件上传

基于 Element Plus 上传能力统一文件校验、拖拽区域、上传进度和文件状态展示。网络请求由宿主通过 `action` 或 `httpRequest` 配置；组件不访问业务接口。

**拖拽区三态**：默认就绪（36px 图标 + 主副文案 + "浏览本地文件"下划线链接）；拖拽悬停时内容切换为圆形图标 + "释放鼠标即可上传"（由 Element Plus `.is-dragover` 类纯 CSS 驱动，含 inset 阴影）；上传中整体变形为聚合进度面板（实线主色边 + "正在上传 N 个文件" + 8px 条纹动画总进度条 + "取消上传"按钮，系统启用减少动效时条纹降级为静态）。

**文件列表**：行内胶囊徽章四态（排队中 / 上传中 / 上传成功 / 上传失败）；失败行红底 + 文件名红字 + 错误文案 + 重新上传；列表头显示"已选 N 个文件"与"全部清空"按钮。

进度轨道保持固定尺寸，填充部分通过 `transform` 表示进度，避免反复改变布局宽度；系统启用减少动效时直接更新进度。

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

| 名称              | 类型                                 | 默认值            | 说明                                                                                   |
| ----------------- | ------------------------------------ | ----------------- | -------------------------------------------------------------------------------------- |
| `modelValue`      | `unknown[]`                          | `[]`              | 受控文件列表，配合 `v-model`；变更时发出 `LxUploadFile[]`。                            |
| `action`          | `string`                             | `''`              | Element Plus 默认上传地址。为空且未配置 `httpRequest` 时，提交会被阻止并显示配置提示。 |
| `httpRequest`     | `LxUploadRequestHandler`             | `undefined`       | 宿主注入的请求适配器；设置后优先于 Element Plus 默认 XHR。                             |
| `accept`          | `string`                             | `''`              | 逗号分隔的扩展名或 MIME 类型，例如 `.xlsx,.csv,image/*`；组件会在上传前校验。          |
| `maxSize`         | `number`                             | `undefined`       | 单文件最大体积，单位 MB。                                                              |
| `limit`           | `number`                             | `undefined`       | 最多可选择的文件数量。                                                                 |
| `multiple`        | `boolean`                            | `false`           | 是否允许多选。                                                                         |
| `drag`            | `boolean`                            | `undefined`       | 是否展示拖拽区域；未设置时沿用兼容属性 `draggable`。                                   |
| `draggable`       | `boolean`                            | `true`            | 兼容旧属性；新代码优先使用 `drag`。                                                    |
| `autoUpload`      | `boolean`                            | `false`           | 选择后是否立即上传；默认先进入待提交队列。                                             |
| `listType`        | `'standard-rows' \| 'compact-chips'` | `'standard-rows'` | 文件列表布局。                                                                         |
| `chunkSize`       | `number`                             | `1024`            | 以 KB 为单位透传给 `httpRequest`，作为宿主分片适配器的配置提示。                       |
| `disabled`        | `boolean`                            | `false`           | 禁止选择、提交、重试、清空、移除和取消上传。                                           |
| `headers`         | `Record<string, string>`             | `{}`              | Element Plus 默认 XHR 请求头；自定义适配器从请求参数读取。                             |
| `name`            | `string`                             | `'file'`          | 上传表单字段名。                                                                       |
| `withCredentials` | `boolean`                            | `false`           | 默认 XHR 是否携带凭据。                                                                |

## Events

| 事件                | 参数             | 说明                                             |
| ------------------- | ---------------- | ------------------------------------------------ |
| `update:modelValue` | `LxUploadFile[]` | 文件被添加、状态更新、移除或清空时发出。         |
| `change`            | `(file, files)`  | 选择文件或上传状态变化时发出。                   |
| `progress`          | `(file, files)`  | 上传进度变化时发出；`file.percentage` 为 0–100。 |
| `success`           | `file`           | 单个文件上传成功。                               |
| `error`             | `(file, error)`  | 单个文件上传失败。                               |
| `remove`            | `file`           | 单个文件被移除。                                 |
| `exceed`            | `File[]`         | 选择数量超过 `limit`。                           |

## 插槽与实例

组件目前没有自定义插槽。实例公开 `submit()`、`abort(file?)` 和 `clearFiles()`；禁用时 `submit()`、`clearFiles()` 不执行。调用 `clearFiles()` 会同步发出空 `v-model`。

## 拖拽区与列表行为

- **默认就绪**：36px 上传图标 + 主副文案；"浏览本地文件"为下划线链接按钮，点击冒泡至 Element Plus 触发器根节点打开文件选择，无需额外处理。
- **拖拽悬停**：边框转主色 + 浅主色底 + inset 阴影，内容由就绪态切换为 40px 圆形图标 + "释放鼠标即可上传"。
- **上传中（态 C）**：拖区变形为聚合进度面板，显示上传中文件数量与平均总进度；"取消上传"会 abort 全部进行中请求并把文件复位回"排队中"（Element Plus 的 abort 不派发事件，组件主动复位 `v-model`）。禁用态下取消按钮同样禁用，宿主仍可调用实例 `abort()`。
- **状态徽章**：排队中 / 上传中 / 上传成功 / 上传失败四种胶囊徽章；失败行文件名红字显示。
- **列表头**：文件数不为空时显示"已选 N 个文件"和"全部清空"按钮（复用 `clearFiles` 逻辑，禁用时置灰）。

## 请求边界

- 默认使用手动提交；设置 `autoUpload` 前，应配置 `action` 或 `httpRequest`。
- `httpRequest` 接收 Element Plus 请求参数及 `chunkSize`。宿主负责服务端协议、分片合并、鉴权和结果映射；默认 XHR 不会自动分片。
- `accept` 与 `maxSize` 是前端校验，不能代替服务端文件类型、内容和体积校验。
- 上传进度和成功/失败状态由请求适配器回调更新；取消不代表服务端已回滚已接收的数据。
