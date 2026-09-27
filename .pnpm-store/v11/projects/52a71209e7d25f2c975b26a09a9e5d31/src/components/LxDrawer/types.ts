import type { LxIconName } from '../LxIcon/icons';

/** LxDrawer Props（stitch Modals & Feedback · DetailDrawer 480px） */
export interface LxDrawerProps {
  /** 显隐（v-model） */
  modelValue?: boolean;
  /** 标题（12px 加粗，stitch 规格） */
  title?: string;
  /** 标题左侧图标（圆形图标块，stitch DetailDrawer header） */
  icon?: LxIconName;
  /** 抽屉宽度（px），默认 480（设计稿标注） */
  size?: number | string;
  /** 点击遮罩关闭，默认 false（详情页含链接/操作，防误触） */
  closeOnClickModal?: boolean;
}
