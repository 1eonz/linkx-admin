export interface LxSplitLayoutProps {
  /** 侧栏宽度；数字按像素处理，字符串可使用 CSS 长度或百分比 */
  asideWidth?: number | string;
  /** 允许鼠标拖拽与左右方向键调整 */
  resizable?: boolean;
  /** 受控折叠状态 */
  collapsed?: boolean;
}
