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

示例使用本地 PNG、SVG 和内存 Mock，覆盖成功、延迟、失败、空地址、取消及 HUD 深色和减少动效。回退图片控件可独立于 Mock 状态添加、替换或清除回退地址，不调用业务接口。

## Props

<p class="lx-auth-img-props-hint">
  内容空间不足时可聚焦下方属性表并横向滚动；首列保持可见，便于对照完整类型、默认值和说明。
</p>

<div
  class="lx-auth-img-props-scroll"
  role="region"
  aria-label="LxAuthImg 属性 API 表格"
  tabindex="0"
>
  <table>
    <thead>
      <tr>
        <th>名称</th>
        <th>类型</th>
        <th>默认值</th>
        <th>说明</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>src</code></td>
        <td><code>string</code></td>
        <td>必填</td>
        <td>图片地址；未传 <code>request</code> 时作为浏览器图片地址。</td>
      </tr>
      <tr>
        <td><code>request</code></td>
        <td><code>(src: string, signal?: AbortSignal) =&gt; Promise&lt;Blob&gt;</code></td>
        <td><code>undefined</code></td>
        <td>宿主注入的 Blob 请求函数；将 <code>signal</code> 传给底层请求以支持取消。</td>
      </tr>
      <tr>
        <td><code>alt</code></td>
        <td><code>string</code></td>
        <td><code>''</code></td>
        <td>图片替代文本；有信息的图片应提供描述，纯装饰图片可留空或省略。</td>
      </tr>
      <tr>
        <td><code>fallback</code></td>
        <td><code>string</code></td>
        <td><code>''</code></td>
        <td>请求或图片解码失败时使用的公开回退图片地址。</td>
      </tr>
      <tr>
        <td><code>width</code></td>
        <td><code>number | string</code></td>
        <td><code>undefined</code></td>
        <td>图片宽度；数字按 px 处理。</td>
      </tr>
      <tr>
        <td><code>height</code></td>
        <td><code>number | string</code></td>
        <td><code>undefined</code></td>
        <td>图片高度；数字按 px 处理。</td>
      </tr>
      <tr>
        <td><code>fit</code></td>
        <td><code>'contain' | 'cover' | 'fill' | 'none' | 'scale-down'</code></td>
        <td><code>'cover'</code></td>
        <td>图片填充方式。</td>
      </tr>
    </tbody>
  </table>
</div>

成功图片使用原生 <code>img</code> 的替代文本：有身份或内容信息时传入具体描述，纯装饰图片使用 <code>alt=""</code> 或省略该参数。默认空字符串按纯装饰图片处理。

## Slots

| 插槽            | 参数                                      | 说明                                                                                                               |
| --------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `error-actions` | `{ retry: () => void, loading: boolean }` | 失败占位区域中的宿主恢复操作。组件只提供重新执行加载流程的回调和当前重试状态，不决定业务重试次数、提示或请求策略。 |

失败态不会内置业务按钮；宿主可以根据页面权限和请求策略渲染按钮、文字或其他恢复操作。重试期间恢复插槽保持挂载，宿主应使用 `loading` 禁用重复提交；如果用户从恢复控件发起重试，组件会保留同一恢复节点及其键盘焦点，直到宿主切换资源或状态。未提供该插槽时仍保留错误图标与状态播报。

## Events

| 事件    | 参数          | 说明                                                           |
| ------- | ------------- | -------------------------------------------------------------- |
| `load`  | `src: string` | 图片解码载入后触发；鉴权图片返回 Blob 并不代表图片已成功解码。 |
| `error` | `unknown`     | 请求、主图或回退图解码失败时触发；取消的过期请求不会触发。     |

组件没有公开实例方法；失败操作通过上面的 `error-actions` 插槽注入。

## 失败状态与恢复

| 状态               | 组件行为                                                             | 宿主处理                                                              |
| ------------------ | -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 请求失败           | 触发 `error`；有 `fallback` 时尝试回退图，没有回退图时显示失败占位。 | 在 `error-actions` 中决定是否显示 `retry`，并根据业务需要记录或提示。 |
| 主图解码失败       | 触发 `error`，随后切换到 `fallback`；回退图也失败时进入失败占位。    | 可使用 `retry` 重新执行当前流程，或更换 `src`/`fallback`。            |
| 请求取消或组件卸载 | 忽略过期响应，不触发 `error`。                                       | 由宿主决定新请求；不把取消当成失败提示。                              |
| 空地址             | 不发请求；无回退图时显示“暂无图片”。                                 | 修正 `src` 或提供 `fallback` 后由组件响应配置变化。                   |

## 请求与资源生命周期

- `request` 由宿主实现鉴权、网关 URL 和响应校验，成功时返回 `Blob`。Vue3 业务接口保持 `.then().catch().finally()` 链式处理，并将 `AbortSignal` 传给 HTTP 客户端。
- `src` 或 `request` 变化时，组件会终止旧请求、丢弃旧响应并回收已创建的对象 URL；卸载时也会执行相同清理。
- 取消请求不触发 `error`。提供 `fallback` 时，失败状态会显示回退图；回退地址应是浏览器可公开读取的资源。
- `fallback` 变化时，空态或失败态会更新为新的回退图，当前显示回退图时也会同步替换或清除；已经显示主图时只更新备用配置，不会重发主图请求。
- `src` 为空且无回退图时不发请求、不触发错误事件，显示“暂无图片”占位；真实请求或解码失败时显示带错误图标的失败占位。占位图片名称仅使用传入的 `alt`；纯装饰图片隐藏占位节点，实际图片使用原生图片替代文本。
- 加载中、加载完成、加载失败和空地址由唯一的 `role="status"` 礼貌播报；主图失败后正在载入或已显示回退图时，会同时说明失败原因和恢复结果。空地址使用回退图时也会说明地址为空。占位图标对辅助技术隐藏，状态与图片名称分开表达，同一加载阶段的播报在 Blob 返回和图片解码之间保持稳定。Demo 计数不进入播报内容。
- 占位图标负责区分空地址和失败状态；业务原因、重试次数和替换操作由宿主结合页面上下文提供可见说明和控制，失败恢复入口统一通过 `error-actions` 插槽承载。
- 文档 Demo 在预览区域旁显示可见状态说明，并通过 `aria-describedby` 关联图片；组件自身继续使用紧凑占位图标和唯一的 `role="status"` 播报。
- 请求等待和图片解码期间均显示加载图标，并遵守 `prefers-reduced-motion`；如果偏好减少动效，图标保持静态但状态仍可见。

Demo 的 Mock 状态和回退图片选择器相互独立，360px 以下改为纵向布局；组件本身不限制宿主的布局方式。

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
