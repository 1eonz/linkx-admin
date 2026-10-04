import type { LxInputSize } from '../LxInput/types'

export interface LxPasswordInputProps {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  showPassword?: boolean
  /** 是否阻止复制、剪切和粘贴；默认允许，宿主有明确策略时再启用。 */
  preventClipboard?: boolean
  maxlength?: number | string
  minlength?: number | string
  /** 尺寸使用 sm/md/lg；保留 small/default/large 旧值作为兼容别名。 */
  size?: LxInputSize | '' | 'small' | 'default' | 'large'
  autocomplete?: string
  readonly?: boolean
  name?: string
}
