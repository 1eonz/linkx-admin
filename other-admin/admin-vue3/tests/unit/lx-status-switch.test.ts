import { mount } from '@vue/test-utils';
import { LxStatusSwitch } from 'lx-ui';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

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

  it('blocks changes while loading', async () => {
    const wrapper = mountSwitch({ modelValue: true, loading: true, confirm: '关闭后停止服务。' });
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

  it('does not ask for confirmation while turning a value on', async () => {
    const wrapper = mountSwitch({ modelValue: false, confirm: '关闭后停止服务。' });
    const beforeChange = wrapper.getComponent(SwitchStub).props('beforeChange') as () => Promise<boolean>;

    await expect(beforeChange()).resolves.toBe(true);
    expect(lxConfirmMock).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
