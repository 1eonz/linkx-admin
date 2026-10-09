/**
 * LxDatePicker 类型契约
 *
 * 视觉源：design/表单控件八件套/code.html 06（日期范围选择器）
 * 尺寸档名 sm/md/lg 区别于 EP 的 small/default/large，映射关系见组件内 SIZE_MAP。
 * 周一起始为默认契约：注册 Day.js zh-cn 数据并局部注入日期面板语境，
 * 不修改宿主的全局 locale。
 * daterange 底部按钮组、shortcuts 左侧竖排位置随 EP 原生（裁剪记录 #6/#8）；
 * disabled-date / default-value / shortcuts 等低频 props 经 $attrs 透传。
 */

/** 面板类型常用子集；quarter 等新增类型经 attrs 透传扩展 */
export type LxDatePickerType =
  | 'date'
  | 'dates'
  | 'datetime'
  | 'daterange'
  | 'datetimerange'
  | 'week'
  | 'month'
  | 'monthrange'
  | 'year'
  | 'yearrange'

/**
 * v-model 值：单值为单标量，区间为二元数组；默认清空值为 null。
 * 数组形对齐 EP ModelValueType 同质数组契约（string[] | number[] | Date[]，
 * 区间起止值同类型），混合类型数组在运行时也会被 dayjs 归一失败。
 */
export type LxDateModelValue =
  string | number | Date | string[] | number[] | Date[] | null

export type LxDatePickerSize = 'sm' | 'md' | 'lg'

/** 快捷预设项（桌面沿用 EP 侧栏，窄屏改为日历上方横排） */
export interface LxDatePickerShortcut {
  text: string
  value: Date | (() => [Date, Date] | Date)
}

export interface LxDatePickerProps {
  /** 选中值（v-model；区间类型为二元数组，配 valueFormat 时为格式化字符串） */
  modelValue?: LxDateModelValue
  /** 面板类型（date/daterange/datetime 等） */
  type?: LxDatePickerType
  /** 占位文案（单值形态） */
  placeholder?: string
  /** 区间起始占位（range 形态） */
  startPlaceholder?: string
  /** 区间结束占位（range 形态） */
  endPlaceholder?: string
  /** 区间分隔符；Lx 默认"至"（中文契约，EP 原生默认 "-"） */
  rangeSeparator?: string
  /**
   * 禁用态。默认未设置（undefined）：不阻断 EP 内核 useFormDisabled 的
   * ?? 继承链，ElForm/LxForm 禁用态可正常传导；显式传 true/false 才覆盖
   */
  disabled?: boolean
  /** 只读态：可聚焦不可改值 */
  readonly?: boolean
  /** 可清空：值非空时悬停出现清除按钮 */
  clearable?: boolean
  /** 显示格式（dayjs format，如 YYYY-MM-DD） */
  format?: string
  /** 值格式（不传则 v-model 为 Date 对象；传则按格式序列化） */
  valueFormat?: string
  /** 快捷预设（如 今日/本周/近30天；位置随 EP 原生） */
  shortcuts?: LxDatePickerShortcut[]
  /** teleported 日期弹层的附加类，可用于响应式主题切换 */
  popperClass?: string
  /** 工程尺寸档：sm=28px / md=32px（基准）/ lg=40px */
  size?: LxDatePickerSize
  /** 原生 name 属性（表单序列化 / 读屏关联） */
  name?: string
  /** 单面板显示；默认视口不大于 640px 时启用，显式 true/false 可覆盖 */
  singlePanel?: boolean
}
