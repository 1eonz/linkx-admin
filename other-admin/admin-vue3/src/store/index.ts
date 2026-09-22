import { createPinia } from 'pinia';

const pinia = createPinia();

export default pinia;

export * from './modules/useAppStore';
export * from './modules/useSettingsStore';
export * from './modules/useUserStore';
