import { mount } from '@vue/test-utils';
import { LxStatusSwitch } from 'lx-ui';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { setupLxPermission } from '../../../../linkx-fe/src/permissions';

const { lxConfirmMock } = vi.hoisted(() => ({ lxConfirmMock: vi.fn() }));

vi.mock('../../../../linkx-fe/src/components/LxConfirm', () => ({
  lxConfirm: lxConfirmMock,
}));

const SwitchStub = defineComponent({
  name: 'ElSwitch',
  props: {
    modelValue: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    beforeChange: { type: Function, required: true },
  },
  setup(props, { attrs }) {
    return () =>
      h('button', {
        ...attrs,
        type: 'button',
        'data-state': String(props.modelValue),
        'data-loading': String(props.loading),
      });
  },
});

function mountSwitch(props: Record<string, unknown> = {}) {
  return mount(LxStatusSwitch, {
    props,
    global: { stubs: { ElSwitch: SwitchStub } },
  });
}

describe('LxStatusSwitch', () => {
  beforeEach(() => {
    lxConfirmMock.mockReset();
    lxConfirmMock.mockResolvedValue(true);
  });

  it('maps boolean and legacy numeric values to the switch state', () => {
    const enabled = mountSwitch({ modelValue: 0 });
    expect(enabled.getComponent(SwitchStub).props('modelValue')).toBe(true);
    enabled.unmount();

    const disabled = mountSwitch({ modelValue: 1 });
    expect(disabled.getComponent(SwitchStub).props('modelValue')).toBe(false);
    disabled.unmount();

    const boolean = mountSwitch({ modelValue: false });
    expect(boolean.getComponent(SwitchStub).props('modelValue')).toBe(false);
    boolean.unmount();
  });

  it('emits the matching business value for each model type', async () => {
    const numeric = mountSwitch({ modelValue: 0 });
    await numeric.getComponent(SwitchStub).vm.$emit('change', false);
    expect(numeric.emitted('update:modelValue')).toEqual([[1]]);
    expect(numeric.emitted('change')).toEqual([[1]]);
    numeric.unmount();

    const boolean = mountSwitch({ modelValue: true });
    await boolean.getComponent(SwitchStub).vm.$emit('change', false);
    expect(boolean.emitted('update:modelValue')).toEqual([[false]]);
    expect(boolean.emitted('change')).toEqual([[false]]);
    boolean.unmount();
  });

  it('renders the real current state when the control is read-only', async () => {
    const wrapper = mountSwitch({ modelValue: 0, disabled: true });
    expect(wrapper.text()).toContain('开启（只读）');
    expect(wrapper.findComponent(SwitchStub).exists()).toBe(false);

    await wrapper.setProps({ modelValue: 1 });
    expect(wrapper.text()).toContain('关闭（只读）');
    wrapper.unmount();
  });

  it('falls back to a read-only tag when an injected permission is absent', () => {
    const wrapper = mountSwitch({ modelValue: true, permission: 'demo:status-switch' });
    expect(wrapper.get('.lx-status-switch__fallback').text()).toContain('禁用/只读');
    expect(wrapper.findComponent(SwitchStub).exists()).toBe(false);
    wrapper.unmount();
  });

  it('blocks changes while loading', async () => {
    const wrapper = mountSwitch({ modelValue: true, loading: true, confirm: '关闭后停止服务。' });
    expect(wrapper.getComponent(SwitchStub).attributes('aria-busy')).toBe('true');
    const beforeChange = wrapper.getComponent(SwitchStub).props('beforeChange') as () => Promise<boolean>;

    await expect(beforeChange()).resolves.toBe(false);
    expect(lxConfirmMock).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('asks for confirmation only when turning an enabled value off', async () => {
    const wrapper = mountSwitch({ modelValue: true, confirm: '关闭后停止服务。' });
    const beforeChange = wrapper.getComponent(SwitchStub).props('beforeChange') as () => Promise<boolean>;

    await expect(beforeChange()).resolves.toBe(true);
    expect(lxConfirmMock).toHaveBeenCalledWith({
      title: '确认关闭？',
      message: '关闭后停止服务。',
      confirmText: '确认关闭',
      cancelText: '取消',
      danger: true,
    });

    lxConfirmMock.mockResolvedValueOnce(false);
    await expect(beforeChange()).resolves.toBe(false);
    wrapper.unmount();
  });

  it('drops a stale confirmation result when the host starts saving meanwhile', async () => {
    let resolveConfirm: ((value: boolean) => void) | undefined;
    lxConfirmMock.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveConfirm = resolve;
        }),
    );
    const wrapper = mountSwitch({ modelValue: true, confirm: '关闭后停止服务。' });
    const beforeChange = wrapper.getComponent(SwitchStub).props('beforeChange') as () => Promise<boolean>;

    const pending = beforeChange();
    await wrapper.setProps({ loading: true });
    resolveConfirm?.(true);

    await expect(pending).resolves.toBe(false);
    expect(wrapper.emitted('change')).toBeUndefined();
    wrapper.unmount();
  });

  it('drops a stale confirmation result when the host changes the model value', async () => {
    let resolveConfirm: ((value: boolean) => void) | undefined;
    lxConfirmMock.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveConfirm = resolve;
        }),
    );
    const wrapper = mountSwitch({ modelValue: true, confirm: '关闭后停止服务。' });
    const beforeChange = wrapper.getComponent(SwitchStub).props('beforeChange') as () => Promise<boolean>;

    const pending = beforeChange();
    await wrapper.setProps({ modelValue: false });
    resolveConfirm?.(true);

    await expect(pending).resolves.toBe(false);
    wrapper.unmount();
  });

  it('drops a stale confirmation result when the host makes the switch read-only', async () => {
    let resolveConfirm: ((value: boolean) => void) | undefined;
    lxConfirmMock.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveConfirm = resolve;
        }),
    );
    const wrapper = mountSwitch({ modelValue: true, confirm: '关闭后停止服务。' });
    const beforeChange = wrapper.getComponent(SwitchStub).props('beforeChange') as () => Promise<boolean>;

    const pending = beforeChange();
    await wrapper.setProps({ disabled: true });
    resolveConfirm?.(true);

    await expect(pending).resolves.toBe(false);
    wrapper.unmount();
  });

  it('drops a stale confirmation result when the permission prop is revoked', async () => {
    const disposePermission = setupLxPermission(() => ({
      codes: { authority: ['status:toggle'] },
      current: () => 'authority',
    }));
    try {
      let resolveConfirm: ((value: boolean) => void) | undefined;
      lxConfirmMock.mockImplementation(
        () =>
          new Promise<boolean>((resolve) => {
            resolveConfirm = resolve;
          }),
      );
      const wrapper = mountSwitch({
        modelValue: true,
        permission: 'status:toggle',
        confirm: '关闭后停止服务。',
      });
      const beforeChange = wrapper.getComponent(SwitchStub).props('beforeChange') as () => Promise<boolean>;

      const pending = beforeChange();
      await wrapper.setProps({ permission: 'status:toggle-revoked' });
      resolveConfirm?.(true);

      await expect(pending).resolves.toBe(false);
      wrapper.unmount();
    } finally {
      disposePermission();
    }
  });

  it('rechecks an in-place permission source change before accepting confirmation', async () => {
    let allowed = true;
    const disposePermission = setupLxPermission(() => ({
      codes: { authority: allowed ? ['status:toggle'] : [] },
      current: () => 'authority',
    }));
    try {
      let resolveConfirm: ((value: boolean) => void) | undefined;
      lxConfirmMock.mockImplementation(
        () =>
          new Promise<boolean>((resolve) => {
            resolveConfirm = resolve;
          }),
      );
      const wrapper = mountSwitch({
        modelValue: true,
        permission: 'status:toggle',
        confirm: '关闭后停止服务。',
      });
      const beforeChange = wrapper.getComponent(SwitchStub).props('beforeChange') as () => Promise<boolean>;

      const pending = beforeChange();
      allowed = false;
      resolveConfirm?.(true);

      await expect(pending).resolves.toBe(false);
      wrapper.unmount();
    } finally {
      disposePermission();
    }
  });

  it('marks read-only fallback content as disabled for assistive technology', () => {
    const wrapper = mountSwitch({ modelValue: 0, disabled: true });
    expect(wrapper.get('.lx-status-switch__fallback').attributes('aria-disabled')).toBe('true');
    wrapper.unmount();
  });

  it('keeps row naming on fallback tags and adds structured risk context', async () => {
    const fallback = mountSwitch({
      modelValue: true,
      permission: 'demo:status-switch',
      'aria-labelledby': 'row-name',
      'aria-describedby': 'row-description',
    });
    expect(fallback.get('.lx-status-switch__fallback').attributes('aria-labelledby')).toBe('row-name');
    expect(fallback.get('.lx-status-switch__fallback').attributes('aria-describedby')).toBe('row-description');
    fallback.unmount();

    const wrapper = mountSwitch({
      modelValue: true,
      confirm: {
        message: '关闭后将中断节点通信。',
        targetEntity: 'NODE-MAIN-01',
        impact: '跨域调度将中断。',
        audit: '写入审计日志。',
      },
    });
    const beforeChange = wrapper.getComponent(SwitchStub).props('beforeChange') as () => Promise<boolean>;
    await expect(beforeChange()).resolves.toBe(true);
    expect(lxConfirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '关闭后将中断节点通信。\n目标实体：NODE-MAIN-01\n影响范围：跨域调度将中断。\n审计记录：写入审计日志。',
      }),
    );
    wrapper.unmount();
  });

  it('does not ask for confirmation while turning a value on', async () => {
    const wrapper = mountSwitch({ modelValue: false, confirm: '关闭后停止服务。' });
    const beforeChange = wrapper.getComponent(SwitchStub).props('beforeChange') as () => Promise<boolean>;

    await expect(beforeChange()).resolves.toBe(true);
    expect(lxConfirmMock).not.toHaveBeenCalled();
    wrapper.unmount();
  });
  it('accepts structured confirmation options without a runtime prop warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const wrapper = mountSwitch({
      modelValue: true,
      confirm: {
        title: '停用服务',
        message: '停用后将停止接收事件。',
        confirmText: '继续停用',
        cancelText: '暂不停用',
        type: 'danger',
      },
    });
    const beforeChange = wrapper.getComponent(SwitchStub).props('beforeChange') as () => Promise<boolean>;

    await expect(beforeChange()).resolves.toBe(true);
    expect(lxConfirmMock).toHaveBeenCalledWith({
      title: '停用服务',
      message: '停用后将停止接收事件。',
      confirmText: '继续停用',
      cancelText: '暂不停用',
      danger: true,
    });
    expect(warn.mock.calls.some(([message]) => String(message).includes('confirm'))).toBe(false);
    warn.mockRestore();
    wrapper.unmount();
  });

  it('forwards row naming and confirmation theme class', async () => {
    const wrapper = mountSwitch({
      modelValue: true,
      'aria-labelledby': 'row-name',
      confirm: {
        message: '确认关闭',
        customClass: 'lx-theme-hud',
      },
    });
    const control = wrapper.getComponent(SwitchStub);
    expect(control.attributes('aria-labelledby')).toBe('row-name');

    const beforeChange = control.props('beforeChange') as () => Promise<boolean>;
    await beforeChange();
    expect(lxConfirmMock).toHaveBeenCalledWith({
      title: '确认关闭？',
      message: '确认关闭',
      confirmText: '确认关闭',
      cancelText: '取消',
      danger: true,
      customClass: 'lx-theme-hud',
    });
    wrapper.unmount();
  });

  it('adds impact and audit context to the confirmation message', async () => {
    const wrapper = mountSwitch({
      modelValue: true,
      confirm: {
        message: '关闭后将中断节点通信。',
        impact: '核心节点及关联警力暂时不可用。',
        audit: '操作人和变更原因写入审计日志。',
      },
    });
    const beforeChange = wrapper.getComponent(SwitchStub).props('beforeChange') as () => Promise<boolean>;

    await expect(beforeChange()).resolves.toBe(true);
    expect(lxConfirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          '关闭后将中断节点通信。\n影响范围：核心节点及关联警力暂时不可用。\n审计记录：操作人和变更原因写入审计日志。',
      }),
    );
    wrapper.unmount();
  });

  it('forwards row naming to a read-only fallback tag', () => {
    const wrapper = mountSwitch({
      modelValue: true,
      disabled: true,
      'aria-labelledby': 'readonly-row',
      'aria-describedby': 'readonly-help',
    });
    const fallback = wrapper.get('.lx-status-switch__fallback');
    expect(fallback.attributes('aria-labelledby')).toBe('readonly-row');
    expect(fallback.attributes('aria-describedby')).toBe('readonly-help');
    wrapper.unmount();
  });
});
