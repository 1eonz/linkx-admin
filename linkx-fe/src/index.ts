/**
 * lx-ui — LinkX 业务组件库入口
 * 铁律（DESIGN-SPEC §11）：禁止出现 axios / router / pinia / 业务 API
 */
import type { App, Component } from 'vue'
// EP 变量桥接（先于组件加载，保证令牌生效）
import './styles/element-theme.css'
import LxIcon from './components/LxIcon/index.vue'
import LxStatusDot from './components/LxStatusDot/index.vue'
import LxSidebar from './components/LxSidebar/index.vue'
import LxSidebarBrand from './components/LxSidebar/LxSidebarBrand.vue'
import LxSidebarItem from './components/LxSidebar/LxSidebarItem.vue'
import LxSidebarGroup from './components/LxSidebar/LxSidebarGroup.vue'
import LxSidebarFooter from './components/LxSidebar/LxSidebarFooter.vue'
import LxGauge from './components/LxSidebar/LxGauge.vue'
import LxNodeBadge from './components/LxSidebar/LxNodeBadge.vue'
import LxTag from './components/LxTag/index.vue'
import LxActionButtons from './components/LxActionButtons/index.vue'
import LxPagination from './components/LxPagination/index.vue'
import LxEmpty from './components/LxEmpty/index.vue'
import LxProTable from './components/LxProTable/index.vue'
import LxSelectTree from './components/LxSelectTree/index.vue'
// 数据录入（stitch 表单控件 + _26 错误态规格）
import LxForm from './components/LxForm/index.vue'
import LxFormItem from './components/LxForm/LxFormItem.vue'
// 反馈与浮层（stitch Modals & Feedback 全标本）
import LxDialog from './components/LxDialog/index.vue'
import LxDrawer from './components/LxDrawer/index.vue'
import LxFormErrorBanner from './components/LxFormErrorBanner/index.vue'
import { lxMessage } from './components/LxMessage'
import { lxConfirm } from './components/LxConfirm'
// 新增业务组件（P0 → P2）
import LxPageCard from './components/LxPageCard/index.vue'
import LxSectionTitle from './components/LxSectionTitle/index.vue'
import LxMetricCard from './components/LxMetricCard/index.vue'
import LxDescriptions from './components/LxDescriptions/index.vue'
import LxCodeSlot from './components/LxCodeSlot/index.vue'
import LxSearchBar from './components/LxSearchBar/index.vue'
import LxStatusSwitch from './components/LxStatusSwitch/index.vue'
import LxUpload from './components/LxUpload/index.vue'
import LxSelectPagination from './components/LxSelectPagination/index.vue'
import LxPasswordInput from './components/LxPasswordInput/index.vue'
import LxVirtualTree from './components/LxVirtualTree/index.vue'
import LxTransferPanel from './components/LxTransferPanel/index.vue'
import LxAuthImg from './components/LxAuthImg/index.vue'
import LxNavbar from './components/LxNavbar/index.vue'
import LxTabsBar from './components/LxTabsBar/index.vue'
import LxBreadcrumb from './components/LxBreadcrumb/index.vue'
import LxSplitLayout from './components/LxSplitLayout/index.vue'
import LxDutyCalendar from './components/LxDutyCalendar/index.vue'
import LxDynamicForm from './components/LxDynamicForm/index.vue'
import LxButton from './components/LxButton/index.vue'
// 输入类族（design/表单控件八件套 01/03/04/07/08）
import LxInput from './components/LxInput/index.vue'
import LxTextarea from './components/LxTextarea/index.vue'
import LxRadio from './components/LxRadio/index.vue'
import LxRadioGroup from './components/LxRadioGroup/index.vue'
import LxCheckbox from './components/LxCheckbox/index.vue'
import LxCheckboxGroup from './components/LxCheckboxGroup/index.vue'
import LxSwitch from './components/LxSwitch/index.vue'
// 复合选择族（design/表单控件八件套 02/05/06）
import LxSelect from './components/LxSelect/index.vue'
import LxDatePicker from './components/LxDatePicker/index.vue'
import LxInputNumber from './components/LxInputNumber/index.vue'

const componentRegistry: Record<string, Component> = {
  LxIcon,
  LxButton,
  LxInput,
  LxTextarea,
  LxRadio,
  LxRadioGroup,
  LxCheckbox,
  LxCheckboxGroup,
  LxSwitch,
  LxSelect,
  LxDatePicker,
  LxInputNumber,
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
  LxPageCard,
  LxSectionTitle,
  LxMetricCard,
  LxDescriptions,
  LxCodeSlot,
  LxSearchBar,
  LxStatusSwitch,
  LxUpload,
  LxSelectPagination,
  LxPasswordInput,
  LxVirtualTree,
  LxTransferPanel,
  LxAuthImg,
  LxNavbar,
  LxTabsBar,
  LxBreadcrumb,
  LxSplitLayout,
  LxDutyCalendar,
  LxDynamicForm,
}

export * from './components/LxSidebar/types'
export * from './components/LxProTable/types'
export * from './components/LxSelectTree/types'
export * from './components/LxActionButtons/types'
export type { LxStatusDotProps } from './components/LxStatusDot/types'
export type { LxTagProps } from './components/LxTag/types'
export type { LxPaginationProps } from './components/LxPagination/types'
export type { LxEmptyProps } from './components/LxEmpty/types'
export type {
  LxFormProps,
  LxFormItemProps,
  LxFormInstance,
} from './components/LxForm/types'
export type { LxDialogProps } from './components/LxDialog/types'
export type { LxDrawerProps } from './components/LxDrawer/types'
export type { LxFormErrorBannerProps } from './components/LxFormErrorBanner/types'
export type { LxPageCardProps } from './components/LxPageCard/types'
export type {
  LxSectionTitleProps,
  LxSectionTitleSize,
  LxSectionTitleTagType,
  LxSectionTitleVariant,
} from './components/LxSectionTitle/types'
export type {
  LxMetricCardProps,
  LxMetricCardStatus,
  LxMetricCardValueType,
} from './components/LxMetricCard/types'
export type {
  LxDescriptionItem,
  LxDescriptionsProps,
} from './components/LxDescriptions/types'
export type { LxCodeSlotProps } from './components/LxCodeSlot/types'
export type {
  LxCascaderOption,
  LxCascaderOptionValue,
  LxSearchBarProps,
  LxSearchField,
  LxSearchFieldType,
  LxSearchOption,
} from './components/LxSearchBar/types'
export type { LxStatusSwitchProps } from './components/LxStatusSwitch/types'
export type {
  LxUploadFile,
  LxUploadFileStatus,
  LxUploadInstance,
  LxUploadListType,
  LxUploadProps,
  LxUploadRequestHandler,
  LxUploadRequestOptions,
} from './components/LxUpload/types'
export type {
  LxSelectPaginationApi,
  LxSelectPaginationItem,
  LxSelectPaginationPage,
  LxSelectPaginationProps,
  LxSelectPaginationRemoteMethod,
  LxSelectPaginationRemoteOptions,
  LxSelectPaginationRequestParams,
  LxSelectPaginationResult,
  LxSelectPaginationValue,
  LxSelectPaginationValueMapItem,
} from './components/LxSelectPagination/types'
export type { LxPasswordInputProps } from './components/LxPasswordInput/types'
export type {
  LxVirtualTreeExpose,
  LxVirtualTreeNode,
  LxVirtualTreeProps,
} from './components/LxVirtualTree/types'
export type { LxTransferPanelProps } from './components/LxTransferPanel/types'
export type { LxAuthImgProps } from './components/LxAuthImg/types'
export type {
  LxBreadcrumbItem,
  LxBreadcrumbProps,
} from './components/LxBreadcrumb/types'
export type { LxNavbarProps, LxNavbarUser } from './components/LxNavbar/types'
export type { LxTabItem, LxTabsBarProps } from './components/LxTabsBar/types'
export type { LxSplitLayoutProps } from './components/LxSplitLayout/types'
export type {
  LxDutyCalendarProps,
  LxDutyShift,
} from './components/LxDutyCalendar/types'
export type {
  LxDynamicFormField,
  LxDynamicFormFieldType,
  LxDynamicFormInstance,
  LxDynamicFormOption,
  LxDynamicFormProps,
  LxDynamicFormSlotProps,
} from './components/LxDynamicForm/types'
export type {
  LxButtonProps,
  LxButtonSize,
  LxButtonType,
} from './components/LxButton/types'
export type { LxInputProps, LxInputSize } from './components/LxInput/types'
export type { LxTextareaProps } from './components/LxTextarea/types'
export type { LxRadioProps, LxRadioValue } from './components/LxRadio/types'
export type { LxRadioGroupProps } from './components/LxRadioGroup/types'
export type {
  LxCheckboxProps,
  LxCheckboxValue,
} from './components/LxCheckbox/types'
export type { LxCheckboxGroupProps } from './components/LxCheckboxGroup/types'
export type { LxSwitchProps } from './components/LxSwitch/types'
export type {
  LxSelectModelValue,
  LxSelectOptionValue,
  LxSelectProps,
  LxSelectSize,
} from './components/LxSelect/types'
export type {
  LxDateModelValue,
  LxDatePickerProps,
  LxDatePickerShortcut,
  LxDatePickerSize,
  LxDatePickerType,
} from './components/LxDatePicker/types'
export type {
  LxInputNumberAlign,
  LxInputNumberProps,
  LxInputNumberSize,
} from './components/LxInputNumber/types'
export {
  lxMessage,
  type LxMessageApi,
  type LxMessageOptions,
  type LxMessageType,
} from './components/LxMessage'
export { lxConfirm, type LxConfirmOptions } from './components/LxConfirm'
export {
  getLxIconPaths,
  LX_ICON_ALIASES,
  LX_ICON_29_NAMES,
  LX_ICON_NAMES,
  LX_ICON_MOTION_NAMES,
  LX_ICON_P0_NAMES,
  LX_ICON_P1_NAMES,
  LX_ICONS,
  resolveLxIconName,
  type LxIconAliasName,
  type LxIconName,
  type LxIconSourceName,
} from './components/LxIcon/icons'
// 设计令牌（类型 + 主题切换 + 状态色映射）融合导出
export * from './tokens'
export {
  hasPermission,
  isFieldMasked,
  maskValue,
  setupLxPermission,
} from './permissions'
export type {
  LxPermissionCollection,
  LxPermissionKey,
  LxPermissionSource,
} from './permissions'

export {
  LxIcon,
  LxButton,
  LxInput,
  LxTextarea,
  LxRadio,
  LxRadioGroup,
  LxCheckbox,
  LxCheckboxGroup,
  LxSwitch,
  LxSelect,
  LxDatePicker,
  LxInputNumber,
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
  LxPageCard,
  LxSectionTitle,
  LxMetricCard,
  LxDescriptions,
  LxCodeSlot,
  LxSearchBar,
  LxStatusSwitch,
  LxUpload,
  LxSelectPagination,
  LxPasswordInput,
  LxVirtualTree,
  LxTransferPanel,
  LxAuthImg,
  LxNavbar,
  LxTabsBar,
  LxBreadcrumb,
  LxSplitLayout,
  LxDutyCalendar,
  LxDynamicForm,
}

export default {
  install(app: App) {
    for (const [name, component] of Object.entries(componentRegistry)) {
      app.component(name, component)
    }
  },
}

// ===== Element Plus 全量透出（类似 lxcomponent 模式）=====
// element-plus 是本包 dependencies：安装 lx-ui 即自动携带 EP，宿主项目可直接使用，
// pnpm 严格模式下也可从本入口导入（ElButton / ElMessage / ElementPlus 插件 / 全部类型）。
// 宿主项目自身安装的 EP（npm/yarn 提升 或 显式依赖）与本包共享同一 node_modules 实例，无双实例冲突。
export * from 'element-plus'
