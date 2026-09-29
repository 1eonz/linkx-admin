/**
 * LxSwitch 类型契约
 *
 * 视觉源：design/表单控件八件套/code.html 07（状态开关）
 * 胶囊固定 40×20、滑块 16px；开启 #67c23a 成功绿、关闭 #909399 信息灰。
 * 本组件为通用开关，与场景化 LxStatusSwitch（表格行内状态列）并存。
 */
export interface LxSwitchProps {
  /** 开关值（v-model；自定义值经 active-value/inactive-value attrs 透传） */
  modelValue?: boolean | string | number
  /** 开启态文字；配合 inlinePrompt 显示在胶囊内，否则显示在胶囊右侧（EP active-text 契约） */
  activeText?: string
  /** 关闭态文字；配合 inlinePrompt 显示在胶囊内，否则显示在胶囊左侧（EP inactive-text 契约） */
  inactiveText?: string
  /**
   * 文字显示在胶囊内（EP inline-prompt）；开启后胶囊放宽至 42px 容纳两字文案。
   * Lx 默认 true（与 EP 原生默认 false 有意不同）：胶囊内文字为 LinkX 主用法，
   * 两侧文字模式显式传 false
   */
  inlinePrompt?: boolean
  /**
   * 禁用态：半透明 + 禁用手势（标本 07"上级锁定"行）。
   * 默认未设置（undefined）：不阻断 EP 内核 useFormDisabled 的 ?? 继承链，
   * loading 拦截 / ElForm 禁用继承正常生效；显式传 true/false 才覆盖继承
   */
  disabled?: boolean
  /** 加载态：滑块内 spinner + 点击拦截（EP 内核行为） */
  loading?: boolean
  /** 原生 name 属性 */
  name?: string
}
