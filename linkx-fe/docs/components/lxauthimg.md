# LxAuthImg 鉴权图片

通过宿主注入的请求函数载入受保护图片。组件不读取 Token、不依赖 HTTP 客户端；公开图片可不传 `request`，由浏览器直接加载。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxAuthImg/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxAuthImg/demo/basic.vue
:::

示例使用本地 PNG 和内存 Mock，覆盖成功、延迟、失败、回退、空地址、取消、HUD 深色及减少动效，不调用业务接口。

## Props

| 名称       | 类型                                                       | 默认值      | 说明                                                           |
| ---------- | ---------------------------------------------------------- | ----------- | -------------------------------------------------------------- |
| `src`      | `string`                                                   | 必填        | 图片地址；未传 `request` 时作为浏览器图片地址。                |
| `request`  | `(src: string, signal?: AbortSignal) => Promise<Blob>`     | `undefined` | 宿主注入的 Blob 请求函数；将 `signal` 传给底层请求以支持取消。 |
| `alt`      | `string`                                                   | `''`        | 图片替代文本；占位状态会附加“正在加载”或“图片加载失败”。       |
| `fallback` | `string`                                                   | `''`        | 请求或图片解码失败时使用的公开回退图片地址。                   |
| `width`    | `number \| string`                                         | `undefined` | 图片宽度；数字按 px 处理。                                     |
| `height`   | `number \| string`                                         | `undefined` | 图片高度；数字按 px 处理。                                     |
| `fit`      | `'contain' \| 'cover' \| 'fill' \| 'none' \| 'scale-down'` | `'cover'`   | 图片填充方式。                                                 |

## Events

| 事件    | 参数          | 说明                                                           |
| ------- | ------------- | -------------------------------------------------------------- |
| `load`  | `src: string` | 图片解码载入后触发；鉴权图片返回 Blob 并不代表图片已成功解码。 |
| `error` | `unknown`     | 请求、主图或回退图解码失败时触发；取消的过期请求不会触发。     |

组件没有自定义插槽或公开实例方法。

## 请求与资源生命周期

- `request` 由宿主实现鉴权、网关 URL 和响应校验，成功时返回 `Blob`。Vue3 业务接口保持 `.then().catch().finally()` 链式处理，并将 `AbortSignal` 传给 HTTP 客户端。
- `src` 或 `request` 变化时，组件会终止旧请求、丢弃旧响应并回收已创建的对象 URL；卸载时也会执行相同清理。
- 取消请求不触发 `error`。提供 `fallback` 时，失败状态会显示回退图；回退地址应是浏览器可公开读取的资源。
- `src` 为空且无回退图时显示带可访问名称的图片占位符。受保护图片保持 `alt` 描述，加载占位同时表达加载状态。
- 请求阶段的加载图标遵守 `prefers-reduced-motion`；如果偏好减少动效，图标保持静态但状态仍可见。

## 用法

```vue
<LxAuthImg
  src="/api/files/avatar/42"
  alt="王警官头像"
  :request="requestBlob"
  fallback="/images/avatar-fallback.png"
  :width="72"
  :height="72"
  fit="cover"
/>
```

```ts
function requestBlob(src: string, signal?: AbortSignal): Promise<Blob> {
  return api
    .get(src, { responseType: 'blob', signal })
    .then((response) => response.data)
}
```
