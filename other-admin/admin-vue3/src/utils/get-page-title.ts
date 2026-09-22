/**
 * 获取页面标题
 *
 * 函数内动态读取 store 中的 systemName，
 * 确保 systemName 变更后立即生效。
 *
 * 注意：此函数在非组件上下文调用（如 routerGuard），
 * 需确保 pinia 已初始化。
 */
import { useSettingsStore } from '@/store/modules/useSettingsStore';

export function getPageTitle(pageTitle?: string): string {
  const settingsStore = useSettingsStore();
  const systemName = settingsStore.systemName || '警务协同';

  if (pageTitle) {
    return `${pageTitle} - ${systemName}后台管理系统`;
  }
  return `${systemName}后台管理系统`;
}
