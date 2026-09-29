/**
 * LxSelect 类型契约
 *
 * 视觉源：design/表单控件八件套/code.html 02（下拉选择器）
 * 尺寸档名 sm/md/lg 区别于 EP 的 small/default/large，映射关系见组件内 SIZE_MAP；
 * 高度经全局令牌桥（--el-component-size*）收敛为 28/32/40px。
 * 选项经默认插槽传入 ElOption（lx-ui 已透出 EP 全量导出），
 * remote-method / multiple-limit / tag-type 等低频 EP props 经 $attrs 透传。
 */

/** 单个选项的值（对象值场景经 attrs 透传，运行时兼容） */
export type LxSelectOptionValue = string | number | boolean

/** v-model 值：单选为标量，多选为数组 */
export type LxSelectModelValue = LxSelectOptionValue | LxSelectOptionValue[]

export type LxSelectSize = 'sm' | 'md' | 'lg'

export interface LxSelectProps {
  /** 选中值（v-model；multiple 时为数组） */
  modelValue?: LxSelectModelValue
  /** 占位文案 */
  placeholder?: string
  /**
   * 禁用态。默认未设置（undefined）：不阻断 EP 内核 useFormDisabled 的
   * ?? 继承链，ElForm/LxForm 禁用态可正常传导；显式传 true/false 才覆盖
   */
  disabled?: boolean
  /** 可清空：值非空时右侧出现清除按钮 */
  clearable?: boolean
  /** 可过滤（本地检索；远程检索配合 remote + remote-method attrs） */
  filterable?: boolean
  /** 多选（值为数组，配合 collapse-tags 收敛展示） */
  multiple?: boolean
  /** 多选时超出的选中项折叠为 +N（EP 原生契约） */
  collapseTags?: boolean
  /** 折叠项悬停提示完整列表（EP 原生契约） */
  collapseTagsTooltip?: boolean
  /** 远程/过滤加载态：面板显示加载中 */
  loading?: boolean
  /** 工程尺寸档：sm=28px / md=32px（基准）/ lg=40px */
  size?: LxSelectSize
  /** 原生 name 属性（表单序列化 / 读屏关联） */
  name?: string
}
