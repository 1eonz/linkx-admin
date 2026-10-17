import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import StatusSwitch from '@/components/StatusSwitch/index.vue';

const LxStatusSwitchStub = defineComponent({
  name: 'LxStatusSwitch',
  props: {
    modelValue: { type: [Boolean, Number], default: false },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    fallbackTag: { type: Boolean, default: false },
    onText: { type: String, default: '' },
    offText: { type: String, default: '' },
  },
  emits: ['change'],
  setup(props, { emit }) {
    return () =>
      h('button', {
        type: 'button',
        'data-value': String(props.modelValue),
        'data-loading': String(props.loading),
        'data-disabled': String(props.disabled),
        'data-fallback-tag': String(props.fallbackTag),
        'data-on-text': props.onText,
        'data-off-text': props.offText,
        onClick: () => emit('change', false),
      });
  },
});

describe('StatusSwitch lx-ui 适配层', () => {
  it('保留旧 props 映射并将 change 转回数字业务值', async () => {
    const wrapper = mount(StatusSwitch, {
      props: {
        value: 0,
        loading: true,
        disabled: false,
        normalText: '开放',
        forbiddenText: '关闭',
      },
      global: { stubs: { LxStatusSwitch: LxStatusSwitchStub } },
    });

    const control = wrapper.get('button');
    expect(control.attributes('data-value')).toBe('0');
    expect(control.attributes('data-loading')).toBe('true');
    expect(control.attributes('data-fallback-tag')).toBe('true');
    expect(control.attributes('data-on-text')).toBe('开放');
    expect(control.attributes('data-off-text')).toBe('关闭');

    await control.trigger('click');
    expect(wrapper.emitted('change')).toEqual([[1]]);
    wrapper.unmount();
  });

  it('保留禁用态和数字关闭值，不自行渲染 Element Plus 开关', () => {
    const wrapper = mount(StatusSwitch, {
      props: { value: 1, disabled: true },
      global: { stubs: { LxStatusSwitch: LxStatusSwitchStub } },
    });

    expect(wrapper.get('button').attributes('data-value')).toBe('1');
    expect(wrapper.get('button').attributes('data-disabled')).toBe('true');
    expect(wrapper.find('.status-switch-wrapper').exists()).toBe(false);
    wrapper.unmount();
  });
});
