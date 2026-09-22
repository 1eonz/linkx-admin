/**
 * 系统标题统一管理
 *
 * systemTitle 从 settings store 读取，
 * 数据来源是 queryGlobalsList 接口返回的 SYSTEM_NAME / res.data.title。
 *
 * 使用场景：
 * - 登录页标题（mobileCommandName）
 * - 首页欢迎语（welcome）
 * - 浏览器标签页（pageTitle）
 * - 权限分配 Tab 标签（ICS/ICC/Capp）
 *
 * 注意：所有标题通过 computed 动态读取 store 中的 systemName，
 * setSystemName 修改后会自动响应更新。
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useSettingsStore } from '@/store/modules/useSettingsStore';

export function useSystemTitle() {
  const { t } = useI18n();
  const settingsStore = useSettingsStore();

  /** 系统名称（响应式，setSystemName 后自动更新） */
  const systemName = computed(() => settingsStore.systemName);

  /** 首页欢迎语：欢迎使用{title}后台管理系统 */
  const welcomeText = computed(() => t('index.welcome', { title: systemName.value }));

  /** 登录页标题：{title}后台管理系统-登录 */
  const loginTitle = computed(() => t('index.mobileCommandName', { title: systemName.value }));

  /** 浏览器标签页标题：{title}后台管理系统 */
  const pageTitle = computed(() => t('index.pageTitle', { title: systemName.value }));

  /** 后台管理系统 Tab：{title}后台管理系统 */
  const icsText = computed(() => t('index.ICS', { title: systemName.value }));

  /** 客户端 Tab：{title}客户端 */
  const iccText = computed(() => t('index.ICC', { title: systemName.value }));

  /** H5 Tab：{title}H5 */
  const cappText = computed(() => t('index.Capp', { title: systemName.value }));

  return {
    systemName,
    welcomeText,
    loginTitle,
    pageTitle,
    icsText,
    iccText,
    cappText,
  };
}
