import { createApp } from 'vue';
import { describe, expect, it } from 'vitest';

import LxUI from 'lx-ui';

const componentNames = [
  'LxIcon',
  'LxStatusDot',
  'LxSidebar',
  'LxSidebarBrand',
  'LxSidebarItem',
  'LxSidebarGroup',
  'LxSidebarFooter',
  'LxGauge',
  'LxNodeBadge',
  'LxTag',
  'LxActionButtons',
  'LxPagination',
  'LxEmpty',
  'LxProTable',
  'LxSelectTree',
  'LxForm',
  'LxFormItem',
  'LxDialog',
  'LxDrawer',
  'LxFormErrorBanner',
  'LxPageCard',
  'LxSectionTitle',
  'LxMetricCard',
  'LxDescriptions',
  'LxCodeSlot',
  'LxSearchBar',
  'LxStatusSwitch',
  'LxUpload',
  'LxSelectPagination',
  'LxPasswordInput',
  'LxVirtualTree',
  'LxTransferPanel',
  'LxAuthImg',
  'LxNavbar',
  'LxTabsBar',
  'LxBreadcrumb',
  'LxSplitLayout',
  'LxDutyCalendar',
  'LxDynamicForm',
];

describe('lx-ui 插件注册', () => {
  it('按显式公开名称注册所有组件且不产生空注册名', () => {
    const app = createApp({ render: () => null });
    app.use(LxUI);

    expect(app.component('')).toBeUndefined();
    for (const name of componentNames) {
      expect(app.component(name), `${name} 应全局注册`).toBeDefined();
    }
    expect(new Set(componentNames).size).toBe(componentNames.length);
  });
});
