import { useUserStore } from '@/store/modules/useUserStore';

/**
 * 按钮权限判断
 * 优先从 Pinia user.buttons 取，否则回退到 localStorage
 */
export function hasBtnPermission(permission: string): boolean {
  const userStore = useUserStore();
  let buttonsList: string[] = [];

  if (userStore.buttons.length > 0) {
    buttonsList = userStore.buttons;
  } else {
    const raw = localStorage.getItem('buttons');
    if (raw) {
      try {
        buttonsList = JSON.parse(raw);
      } catch {
        buttonsList = [];
      }
    }
  }

  return buttonsList.indexOf(permission) > -1;
}

/**
 * v-hasPerm 指令
 * 用法: v-hasPerm="'/admin/role/delete'"
 */
export const hasPermDirective = {
  mounted(el: HTMLElement, binding: { value: string }) {
    if (!hasBtnPermission(binding.value)) {
      el.parentNode?.removeChild(el);
    }
  },
};
