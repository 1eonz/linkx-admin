import { useUserStore } from '@/store/modules/useUserStore';

export type PermissionValue = string | string[];

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
 * 判断一组权限键是否命中。
 * 页面、按钮和文本权限共用后端返回的 actions 列表；该函数不改变权限协议。
 */
export function hasPermission(permission: PermissionValue): boolean {
  const values = Array.isArray(permission) ? permission : [permission];
  return values.some((value) => hasBtnPermission(value));
}

/**
 * 文本权限判断。
 * 文本权限与按钮权限使用相同的精确权限键，调用方可以据此决定显示占位文案或隐藏内容。
 */
export function hasTextPermission(permission: string): boolean {
  return hasBtnPermission(permission);
}

type PermissionBinding = {
  value: PermissionValue;
  modifiers?: Partial<Record<string, boolean>>;
  arg?: string;
};

const originalText = new WeakMap<HTMLElement, string>();

function clearPermissionPresentation(el: HTMLElement): void {
  el.style.visibility = '';
  el.style.pointerEvents = '';
  el.style.opacity = '';
  el.classList.remove('is-permission-disabled');
  el.removeAttribute('aria-disabled');
  if (el.getAttribute('tabindex') === '-1') el.removeAttribute('tabindex');
}

/**
 * 配置权限指令的统一消费入口。
 * - 默认无权限移除节点；`hide` 保留布局占位；`disable` 保留节点但禁止操作。
 * - `mask` 用于字段脱敏，权限码沿用 value，字段占位符默认为 `***`。
 * - 权限数据变化时由 updated 重新计算；账号切换不能沿用上一账号的展示状态。
 */
export function applyPermissionDirective(el: HTMLElement, binding: PermissionBinding): void {
  const allowed = hasPermission(binding.value);
  const modifiers = binding.modifiers ?? {};

  if (allowed) {
    clearPermissionPresentation(el);
    const text = originalText.get(el);
    if (text !== undefined) el.textContent = text;
    return;
  }

  if (modifiers.mask) {
    if (!originalText.has(el)) originalText.set(el, el.textContent ?? '');
    el.textContent = '***';
    el.setAttribute('aria-label', `${binding.arg ?? '字段'}已脱敏`);
    return;
  }

  if (modifiers.hide) {
    el.style.visibility = 'hidden';
    return;
  }

  if (modifiers.disable) {
    el.classList.add('is-permission-disabled');
    el.style.pointerEvents = 'none';
    el.style.opacity = '0.5';
    el.setAttribute('aria-disabled', 'true');
    el.setAttribute('tabindex', '-1');
    return;
  }

  el.parentNode?.removeChild(el);
}

/** 按钮权限指令：`v-has-perm="'/admin/role/delete'"`。 */
export const hasPermDirective = {
  mounted(el: HTMLElement, binding: PermissionBinding) {
    applyPermissionDirective(el, binding);
  },
  updated(el: HTMLElement, binding: PermissionBinding) {
    applyPermissionDirective(el, binding);
  },
};

/** 文本权限指令：无权限时移除受限文案，避免敏感提示泄漏。 */
export const hasTextPermDirective = {
  mounted(el: HTMLElement, binding: PermissionBinding) {
    applyPermissionDirective(el, binding);
  },
  updated(el: HTMLElement, binding: PermissionBinding) {
    applyPermissionDirective(el, binding);
  },
};

/**
 * 配置化权限指令，和 menu-config 设计保持同一消费语义。
 * 示例：`v-auth.hide="'export'"`、`v-auth.disable="'sync'"`、`v-auth.mask:phone="'phone:view'"`。
 */
export const authDirective = {
  mounted(el: HTMLElement, binding: PermissionBinding) {
    applyPermissionDirective(el, binding);
  },
  updated(el: HTMLElement, binding: PermissionBinding) {
    applyPermissionDirective(el, binding);
  },
};
