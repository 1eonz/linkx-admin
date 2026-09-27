import type { InjectionKey } from 'vue'
import type { LxRailTip } from './types'

/** 侧边栏容器与子组件的通信上下文（rail 浮层统一由容器管理） */
export interface LxSidebarContext {
  /** rail 态：显示 hover 浮层（直达项=文本 tooltip；分组项=二级 popper） */
  showRailTip: (
    e: MouseEvent | FocusEvent,
    tip: Omit<LxRailTip, 'visible'>,
  ) => void
  /** rail 态：隐藏浮层（带延时，浮层自身 hover 可取消） */
  hideRailTip: () => void
  /** rail 态：浮层内 hover，取消隐藏 */
  keepRailTip: () => void
  /** rail 分组通过键盘打开后，将焦点移动到第一个可用子项 */
  focusRailTipFirstItem: () => void
  /** 判断指定 rail 分组的子项浮层是否显示 */
  isRailTipOpen: (key: string) => boolean
  /** 当前激活 key（供子组件高亮判断） */
  activeKey?: string
}

export const LX_SIDEBAR_KEY: InjectionKey<LxSidebarContext> =
  Symbol('lx-sidebar')
