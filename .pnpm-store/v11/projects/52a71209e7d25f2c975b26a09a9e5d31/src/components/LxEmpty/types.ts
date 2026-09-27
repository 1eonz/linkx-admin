/** LxEmpty Props（表格/列表空态兜底） */
export interface LxEmptyProps {
  /** 描述文案 */
  description?: string
  /** 尺寸：常规列表使用 default，弹窗或抽屉内使用 compact */
  size?: 'default' | 'compact'
  /** 图标尺寸，兼容 Element Plus Empty 的 image-size 属性 */
  imageSize?: number
}
