import type { LxFeedback, LxStatus } from '../../tokens'
import type { LxVirtualTreeNode } from '../LxVirtualTree/types'

/** 穿梭节点状态色；状态文本仍由业务节点提供。 */
export type LxTransferPanelStatusTone = LxStatus | LxFeedback

/** 穿梭节点及已选项共用的元数据。 */
export interface LxTransferPanelMeta {
  /** 面向用户的稳定业务编码。 */
  code?: string
  /** 状态文本；推荐使用 LxStatus 语义值，也允许宿主传入中文业务状态。 */
  status?: LxStatus | (string & {})
  /** 状态点的语义色；缺省时由 status 推断。 */
  statusTone?: LxTransferPanelStatusTone
}

/** 左侧树节点与右侧已选项的公共数据结构。 */
export interface LxTransferPanelNode
  extends LxVirtualTreeNode, LxTransferPanelMeta {
  children?: LxTransferPanelNode[]
}

/** 右侧列表项类型，保留节点键、标题和可展示元数据。 */
export type LxTransferPanelItem = Pick<
  LxTransferPanelNode,
  'id' | 'label' | 'disabled' | 'code' | 'status' | 'statusTone'
>

export interface LxTransferPanelProps {
  treeData?: LxTransferPanelNode[]
  modelValue?: (string | number)[]
  /** 当前树未加载时，用于回显已选节点的最近详情；当前树节点始终优先。 */
  selectedItems?: LxTransferPanelItem[]
  titles?: [string, string]
  /** 左、右筛选框占位文案。 */
  filterPlaceholders?: [string, string]
  /**
   * 左右面板目标高度（px），向下取整且最低为 240px；非有限值回退到 380px。
   * 视口不宽于 767px 时，为保留窄屏树行的可操作高度，实际面板至少为 352px。
   */
  panelHeight?: number
  /** 左侧树首次展开的节点键；后续展开状态由树组件管理。 */
  defaultExpandedKeys?: (string | number)[]
  maxCount?: number
  inheritChild?: boolean
  /** 启用继承开关时，宿主需提供具体继承范围和关闭后的影响；缺失或纯空白时禁用开关。 */
  inheritChildDescription?: string
}
