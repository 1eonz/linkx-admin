export interface LxAuthImgProps {
  /** 图片地址；未配置 request 时由浏览器直接加载。 */
  src: string
  /** 宿主注入的 Blob 请求函数，应将 AbortSignal 传给底层请求以支持取消。 */
  request?: (src: string, signal?: AbortSignal) => Promise<Blob>
  /** 图片的替代文本。 */
  alt?: string
  /** 加载失败时使用的公开图片地址。 */
  fallback?: string
  /** 图片宽度，数字按 px 处理。 */
  width?: number | string
  /** 图片高度，数字按 px 处理。 */
  height?: number | string
  /** 图片填充方式。 */
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
}

/** `error-actions` 插槽向宿主提供的失败恢复上下文。 */
export interface LxAuthImgErrorActionsSlot {
  /** 重新执行当前图片加载流程。 */
  retry: () => void
  /** 当前是否正在执行重试请求；宿主应在此期间禁用恢复控件。 */
  loading: boolean
}

/** LxAuthImg 的公开插槽契约。 */
export interface LxAuthImgSlots {
  'error-actions'?: (scope: LxAuthImgErrorActionsSlot) => unknown
}
