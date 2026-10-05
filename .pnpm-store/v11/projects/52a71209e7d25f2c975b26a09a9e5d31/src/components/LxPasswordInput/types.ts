import type { LxInputSize } from '../LxInput/types'

export interface LxPasswordInputProps {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  showPassword?: boolean
  /** 焦点离开整个组件后重新遮罩；默认关闭。 */
  maskOnBlur?: boolean
  /** 是否通过前端事件阻止复制、剪切和粘贴；默认允许，不能替代宿主或服务端安全控制。 */
  preventClipboard?: boolean
  maxlength?: number | string
  minlength?: number | string
  /** 尺寸使用 sm/md/lg；保留 small/default/large 旧值作为兼容别名。 */
  size?: LxInputSize | '' | 'small' | 'default' | 'large'
  autocomplete?: string
  readonly?: boolean
  name?: string
}
