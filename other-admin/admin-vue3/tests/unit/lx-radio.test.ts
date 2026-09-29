import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { LxRadio, LxRadioGroup } from 'lx-ui';
import { describe, expect, it } from 'vitest';

/** 组装"组 + 两项"的测试挂载（靶环选中态断言依赖内核 is-checked 类） */
function mountGroup(options: { modelValue?: string; disabled?: boolean; vertical?: boolean } = {}) {
  return mount(LxRadioGroup, {
    props: {
      modelValue: options.modelValue ?? 'daily',
      disabled: options.disabled,
      vertical: options.vertical,
    },
    slots: {
      default: () => [
        h(LxRadio, { value: 'daily' }, { default: () => '日常勤务' }),
        h(LxRadio, { value: 'emergency' }, { default: () => '应急处突' }),
      ],
    },
  });
}

describe('LxRadioGroup', () => {
  it('renders the group with LxRadio children and applies the vertical layout class', () => {
    const wrapper = mountGroup({ vertical: false });

    expect(wrapper.classes()).toContain('lx-radio-group');
    expect(wrapper.classes()).not.toContain('lx-radio-group--vertical');
    expect(wrapper.findAll('.lx-radio.el-radio')).toHaveLength(2);
    wrapper.unmount();

    const vertical = mountGroup({ vertical: true });
    expect(vertical.classes()).toContain('lx-radio-group--vertical');
    vertical.unmount();
  });

  it('marks the checked radio through the kernel is-checked class', () => {
    const wrapper = mountGroup({ modelValue: 'daily' });

    const [first, second] = wrapper.findAll('.lx-radio');
    expect(first?.classes()).toContain('is-checked');
    expect(second?.classes()).not.toContain('is-checked');
    wrapper.unmount();
  });

  it('emits update:modelValue with the clicked option value', async () => {
    const wrapper = mountGroup({ modelValue: 'daily' });

    // EP radio 的 v-model 走 change 事件：setValue 置 checked 后触发（jsdom 下 click 不派发 change）
    await wrapper.findAll('input[type="radio"]')[1]?.setValue(true);

    expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['emergency']);
    wrapper.unmount();
  });

  it('blocks selection while the whole group is disabled', async () => {
    const wrapper = mountGroup({ modelValue: 'daily', disabled: true });

    // EP 契约：组禁用经 provide 传导单项 is-disabled 类与 input disabled 属性
    const second = wrapper.findAll('.lx-radio')[1];
    expect(second?.classes()).toContain('is-disabled');
    expect(wrapper.findAll('input[type="radio"]')[1]?.attributes('disabled')).toBeDefined();
    await wrapper.findAll('input[type="radio"]')[1]?.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    wrapper.unmount();
  });
});

describe('LxRadio', () => {
  it('falls back to the label prop as the option value (EP legacy contract)', () => {
    // 存量 Vue2 迁移代码惯用 label 承载选中值：未传 value 时内核以 label 兼作值
    const wrapper = mount(LxRadioGroup, {
      props: { modelValue: 'encrypted' },
      slots: {
        default: () => [
          h(LxRadio, { label: 'encrypted' }, { default: () => '高密加密专线' }),
          h(LxRadio, { label: 'fiber' }, { default: () => '光纤骨干网' }),
        ],
      },
    });

    const [first, second] = wrapper.findAll('.lx-radio');
    expect(first?.classes()).toContain('is-checked');
    expect(second?.classes()).not.toContain('is-checked');
    expect(first?.text()).toContain('高密加密专线');
    wrapper.unmount();
  });

  it('renders the label prop text through the slot fallback', () => {
    const wrapper = mount(LxRadio, { props: { value: 'daily', label: '日常勤务' } });

    expect(wrapper.classes()).toContain('lx-radio');
    expect(wrapper.text()).toContain('日常勤务');
    wrapper.unmount();
  });

  it('marks the disabled state and keeps the native radio semantics', () => {
    const wrapper = mount(LxRadio, {
      props: { value: 'satellite', label: '卫星链路直通', disabled: true },
    });

    expect(wrapper.classes()).toContain('is-disabled');
    expect(wrapper.find('input[type="radio"]').exists()).toBe(true);
    wrapper.unmount();
  });
});
