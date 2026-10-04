import type { FormInstance, FormItemRule, FormRules } from 'element-plus'

/**
 * LxForm Props — el-form 二次封装（$attrs 全透传，未声明的 props/事件原样传给 el-form）
 * 视觉源：design/表单控件八件套/（32px 控件、标签与校验错误态）
 */
export interface LxFormProps {
  /** 表单数据对象（必传，供校验） */
  model?: Record<string, any>
  /** 校验规则（支持 computed 动态规则） */
  rules?: FormRules
  /** label 宽度（label-position 为 left/right 时生效，如 '120px'） */
  labelWidth?: string | number
  /**
   * label 位置，默认 top（设计稿表单 label 上置 12px/500）
   * 老项目迁移传 left/right + label-width 即可
   */
  labelPosition?: 'top' | 'left' | 'right'
  /** 行内表单（搜索栏场景），与 columns 互斥 */
  inline?: boolean
  /** 整表禁用 */
  disabled?: boolean
  /** 校验失败后滚动并聚焦到首个无效字段；默认 false，保持 Element Plus 契约。 */
  scrollToError?: boolean
  /** 网格列数（1=常规流式，2/3=双列/三列网格；视口不大于 640px 时折为单列）；inline 模式下失效 */
  columns?: number
  /** 网格模式行间距 px，默认 12（水平间距仍为 16px） */
  rowGap?: number
}

/** LxFormItem Props — el-form-item 二次封装（$attrs 全透传） */
export interface LxFormItemProps {
  /** 字段标签 */
  label?: string
  /** model 中的字段路径（校验绑定，必填项必传） */
  prop?: string
  /** 仅本项生效的校验规则 */
  rules?: FormItemRule[]
  /** 强制必填星号（不生成规则，仅视觉标记） */
  required?: boolean
  /** 网格跨列：1（默认）/ 2…跨多列 / 'full' 通栏；窄屏单列时各项自动通栏 */
  span?: number | 'full'
}

/**
 * 模板 ref 类型：转发 FormInstance 校验能力
 * 用法：const formRef = ref<LxFormInstance>()
 */
export type LxFormInstance = Pick<
  FormInstance,
  | 'validate'
  | 'validateField'
  | 'resetFields'
  | 'clearValidate'
  | 'scrollToField'
>
