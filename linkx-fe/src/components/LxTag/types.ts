import type { LxFeedback, LxSize } from '../../tokens';

/** LxTag Props（浅底深字标签，P1 例外场景使用） */
export interface LxTagProps {
  /** 语义类型（反馈语义，非状态语义） */
  type?: LxFeedback;
  /** 是否可关闭 */
  closable?: boolean;
  /** 尺寸 */
  size?: LxSize;
  /** 禁用 */
  disabled?: boolean;
}
