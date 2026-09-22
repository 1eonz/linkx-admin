import { defineStore } from 'pinia';
import { ref } from 'vue';

const DEFAULT_SYSTEM_NAME = '警务协同';

export const useSettingsStore = defineStore('settings', () => {
  const showSettings = ref(false);
  const fixedHeader = ref(false);
  const sidebarLogo = ref(false);
  const systemName = ref(localStorage.getItem('SYSTEM_NAME') || DEFAULT_SYSTEM_NAME);

  function changeSetting(data: { key: string; value: unknown }): void {
    const { key, value } = data;
    switch (key) {
      case 'fixedHeader':
        fixedHeader.value = Boolean(value);
        break;
      case 'sidebarLogo':
        sidebarLogo.value = Boolean(value);
        break;
      case 'showSettings':
        showSettings.value = Boolean(value);
        break;
      default:
        break;
    }
  }

  function setSystemName(name: string): void {
    systemName.value = name;
    localStorage.setItem('SYSTEM_NAME', name);
  }

  return {
    showSettings,
    fixedHeader,
    sidebarLogo,
    systemName,
    changeSetting,
    setSystemName,
  };
});
