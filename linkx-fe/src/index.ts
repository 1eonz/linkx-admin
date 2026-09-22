/**
 * lx-ui — LinkX 业务组件库入口
 * 铁律（DESIGN-SPEC §11）：禁止出现 axios / router / pinia / 业务 API
 */
import type { App } from 'vue';
// EP 变量桥接（先于组件加载，保证令牌生效）
import './styles/element-theme.css';
import LxIcon from './components/LxIcon/index.vue';
import LxStatusDot from './components/LxStatusDot/index.vue';
import LxSidebar from './components/LxSidebar/index.vue';
import LxSidebarBrand from './components/LxSidebar/LxSidebarBrand.vue';
import LxSidebarItem from './components/LxSidebar/LxSidebarItem.vue';
import LxSidebarGroup from './components/LxSidebar/LxSidebarGroup.vue';
import LxSidebarFooter from './components/LxSidebar/LxSidebarFooter.vue';
import LxGauge from './components/LxSidebar/LxGauge.vue';
import LxNodeBadge from './components/LxSidebar/LxNodeBadge.vue';
import LxTag from './components/LxTag/index.vue';
import LxActionButtons from './components/LxActionButtons/index.vue';
import LxPagination from './components/LxPagination/index.vue';
import LxEmpty from './components/LxEmpty/index.vue';
import LxProTable from './components/LxProTable/index.vue';
import LxSelectTree from './components/LxSelectTree/index.vue';
// 数据录入（stitch 表单控件 + _26 错误态规格）
import LxForm from './components/LxForm/index.vue';
import LxFormItem from './components/LxForm/LxFormItem.vue';
// 反馈与浮层（stitch Modals & Feedback 全标本）
import LxDialog from './components/LxDialog/index.vue';
import LxDrawer from './components/LxDrawer/index.vue';
import LxFormErrorBanner from './components/LxFormErrorBanner/index.vue';
import { lxMessage } from './components/LxMessage';
import { lxConfirm } from './components/LxConfirm';

const components = [
  LxIcon,
  LxStatusDot,
  LxSidebar,
  LxSidebarBrand,
  LxSidebarItem,
  LxSidebarGroup,
  LxSidebarFooter,
  LxGauge,
  LxNodeBadge,
  LxTag,
  LxActionButtons,
  LxPagination,
  LxEmpty,
  LxProTable,
  LxSelectTree,
  LxForm,
  LxFormItem,
  LxDialog,
  LxDrawer,
  LxFormErrorBanner,
];

export * from './components/LxSidebar/types';
export * from './components/LxProTable/types';
export * from './components/LxSelectTree/types';
export * from './components/LxActionButtons/types';
export type { LxStatusDotProps } from './components/LxStatusDot/types';
export type { LxTagProps } from './components/LxTag/types';
export type { LxPaginationProps } from './components/LxPagination/types';
export type { LxEmptyProps } from './components/LxEmpty/types';
export type {
  LxFormProps,
  LxFormItemProps,
  LxFormInstance,
} from './components/LxForm/types';
export type { LxDialogProps } from './components/LxDialog/types';
export type { LxDrawerProps } from './components/LxDrawer/types';
export type { LxFormErrorBannerProps } from './components/LxFormErrorBanner/types';
export { lxMessage, type LxMessageApi, type LxMessageOptions, type LxMessageType } from './components/LxMessage';
export { lxConfirm, type LxConfirmOptions } from './components/LxConfirm';
export { LX_ICONS, type LxIconName } from './components/LxIcon/icons';
// 设计令牌（类型 + 主题切换 + 状态色映射）融合导出
export * from './tokens';

export {
  LxIcon,
  LxStatusDot,
  LxSidebar,
  LxSidebarBrand,
  LxSidebarItem,
  LxSidebarGroup,
  LxSidebarFooter,
  LxGauge,
  LxNodeBadge,
  LxTag,
  LxActionButtons,
  LxPagination,
  LxEmpty,
  LxProTable,
  LxSelectTree,
  LxForm,
  LxFormItem,
  LxDialog,
  LxDrawer,
  LxFormErrorBanner,
};

export default {
  install(app: App) {
    for (const c of components) app.component(c.name ?? '', c);
  },
};

// ===== Element Plus 全量透出（类似 lxcomponent 模式）=====
// element-plus 是本包 dependencies：安装 lx-ui 即自动携带 EP，宿主项目可直接使用，
// pnpm 严格模式下也可从本入口导入（ElButton / ElMessage / ElementPlus 插件 / 全部类型）。
// 宿主项目自身安装的 EP（npm/yarn 提升 或 显式依赖）与本包共享同一 node_modules 实例，无双实例冲突。
export * from 'element-plus';
