import Cookies from 'js-cookie';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppStore = defineStore('app', () => {
  // 桌面端默认展开侧边栏（不读 cookie 避免残留 '0' 导致桌面端折叠）
  // 用户手动折叠时写入 cookie，但刷新后重置为展开（桌面端优先可用性）
  const sidebar = ref({
    opened: true,
    withoutAnimation: false,
  });
  const device = ref<'desktop' | 'mobile'>('desktop');

  function toggleSideBar(): void {
    sidebar.value.opened = !sidebar.value.opened;
    if (sidebar.value.opened) {
      Cookies.set('sidebarStatus', '1');
    } else {
      Cookies.set('sidebarStatus', '0');
    }
  }

  function closeSideBar(withoutAnimation: boolean): void {
    Cookies.set('sidebarStatus', '0');
    sidebar.value.opened = false;
    sidebar.value.withoutAnimation = withoutAnimation;
  }

  function openSideBar(): void {
    Cookies.set('sidebarStatus', '1');
    sidebar.value.opened = true;
    sidebar.value.withoutAnimation = false;
  }

  function toggleDevice(value: 'desktop' | 'mobile'): void {
    device.value = value;
  }

  return {
    sidebar,
    device,
    toggleSideBar,
    closeSideBar,
    openSideBar,
    toggleDevice,
  };
});
