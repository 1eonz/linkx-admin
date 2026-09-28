import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ActionButtons from '@/components/ActionButtons/index.vue';
import { authDirective, hasPermDirective } from '@/composables/usePermission';
import { useUserStore } from '@/store/modules/useUserStore';

describe('权限展示消费', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    setActivePinia(createPinia());
  });

  it('ActionButtons 按 auth 权限码过滤按钮', () => {
    useUserStore().buttons = ['/admin/role/update'];
    const wrapper = mount(ActionButtons, {
      props: {
        buttons: [
          { label: '编辑', auth: '/admin/role/update' },
          { label: '删除', auth: '/admin/role/delete' },
          { label: '查看' },
        ],
      },
      global: {
        stubs: {
          'el-button': { template: '<button><slot /></button>' },
          'el-icon': { template: '<span><slot /></span>' },
        },
      },
    });

    expect(wrapper.text()).toContain('编辑');
    expect(wrapper.text()).toContain('查看');
    expect(wrapper.text()).not.toContain('删除');
  });

  it('ActionButtons 将行级 loading 状态传递给按钮', () => {
    const wrapper = mount(ActionButtons, {
      props: { buttons: [{ label: '删除', disabled: true, loading: true }] },
      global: {
        stubs: {
          'el-button': {
            template: '<button :disabled="$attrs.disabled" :data-loading="$attrs.loading"><slot /></button>',
          },
          'el-icon': { template: '<span><slot /></span>' },
        },
      },
    });

    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
    expect(wrapper.get('button').attributes('data-loading')).toBe('true');
  });

  it('v-auth.disable 在权限变化后恢复可操作状态', () => {
    const el = document.createElement('button');
    el.textContent = '同步';
    document.body.appendChild(el);
    useUserStore().buttons = [];

    authDirective.mounted(el, { value: 'sync', modifiers: { disable: true } });
    expect(el.classList.contains('is-permission-disabled')).toBe(true);
    expect(el.getAttribute('aria-disabled')).toBe('true');

    useUserStore().buttons = ['sync'];
    authDirective.updated(el, { value: 'sync', modifiers: { disable: true } });
    expect(el.classList.contains('is-permission-disabled')).toBe(false);
    expect(el.getAttribute('aria-disabled')).toBeNull();
  });

  it('无按钮权限时移除 v-has-perm 节点', () => {
    const parent = document.createElement('div');
    const el = document.createElement('button');
    parent.appendChild(el);
    hasPermDirective.mounted(el, { value: 'delete' });
    expect(parent.contains(el)).toBe(false);
  });
});
