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
