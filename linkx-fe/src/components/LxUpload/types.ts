import type { UploadRequestOptions, UploadRequestHandler } from 'element-plus'

export type LxUploadFileStatus = 'ready' | 'uploading' | 'success' | 'error'
export type LxUploadListType = 'standard-rows' | 'compact-chips'

/** 宿主上传适配器参数；分片协议和网络请求由宿主实现。 */
export interface LxUploadRequestOptions extends UploadRequestOptions {
  chunkSize: number
  /** 取消上传、受控列表移除文件或卸载组件时触发；宿主应将它传给可取消的请求实现。 */
  signal: AbortSignal
}

export type LxUploadRequestHandler = (
  options: LxUploadRequestOptions,
) => XMLHttpRequest | Promise<unknown>

export interface LxUploadFile {
  uid: string | number
  name: string
  size?: number
  type?: string
  status?: LxUploadFileStatus
  percentage?: number
  raw?: File
  url?: string
  /** 宿主上传适配器返回的原始结果；组件不会解析其中的业务字段。 */
  response?: unknown
  error?: Error
  [key: string]: unknown
}

export interface LxUploadProps {
  modelValue?: unknown[]
  action?: string
  accept?: string
  limit?: number
  maxSize?: number
  /** 兼容旧属性；未设置 drag 时生效。 */
  draggable?: boolean
  drag?: boolean
  autoUpload?: boolean
  disabled?: boolean
  multiple?: boolean
  listType?: LxUploadListType
  chunkSize?: number
  httpRequest?: LxUploadRequestHandler
  headers?: Record<string, string>
  name?: string
  withCredentials?: boolean
}

export interface LxUploadInstance {
  /** 手动提交已加入队列的文件。 */
  submit(): void
  /** 取消指定文件或全部文件的上传。 */
  abort(file?: LxUploadFile): void
  /** 清空列表并通知宿主更新 v-model。 */
  clearFiles(): void
}
