import { mount } from '@vue/test-utils';
import { LxSwitch } from 'lx-ui';
import { describe, expect, it } from 'vitest';

describe('LxSwitch', () => {
  it('renders the lx-switch class on the EP kernel root with switch semantics', () => {
    const wrapper = mount(LxSwitch);

    expect(wrapper.classes()).toContain('lx-switch');
    expect(wrapper.classes()).toContain('el-switch');
    // a11y：role=switch 的隐藏 input 承载键盘可达性（EP 内核契约）
    expect(wrapper.find('input.el-switch__input').exists()).toBe(true);
    wrapper.unmount();
  });

  it('emits update:modelValue with the flipped boolean on click', async () => {
    const wrapper = mount(LxSwitch, { props: { modelValue: false } });

    await wrapper.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    expect(wrapper.emitted('change')?.[0]).toEqual([true]);
    wrapper.unmount();
  });

  it('marks the checked state through the kernel is-checked class', () => {
    const wrapper = mount(LxSwitch, { props: { modelValue: true } });

    expect(wrapper.classes()).toContain('is-checked');
    wrapper.unmount();
  });

  it('blocks toggling while disabled', async () => {
    const wrapper = mount(LxSwitch, { props: { modelValue: true, disabled: true } });

    expect(wrapper.classes()).toContain('is-disabled');
    await wrapper.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    wrapper.unmount();
  });

  it('blocks toggling and shows the spinner state while loading', async () => {
    const wrapper = mount(LxSwitch, { props: { modelValue: false, loading: true } });

    // EP 2.14.6 契约：根节点无 is-loading 类，loading spinner 挂在滑块 action 图标上；
    // loading 经 useFormDisabled 的 fallback 并入禁用计算（disabled 未显式设置时不被短路）
    expect(wrapper.classes()).not.toContain('is-loading');
    expect(wrapper.find('.el-switch__action .is-loading').exists()).toBe(true);
    expect(wrapper.classes()).toContain('is-disabled');
    await wrapper.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    wrapper.unmount();
  });

  it('passes custom values through attrs (active-value / inactive-value)', async () => {
    const wrapper = mount(LxSwitch, {
      props: { modelValue: 'off' },
      attrs: { activeValue: 'on', inactiveValue: 'off' },
    });

    await wrapper.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['on']);
    wrapper.unmount();
  });

  it('renders the inline prompt text inside the capsule when inlinePrompt is on', () => {
    const wrapper = mount(LxSwitch, {
      props: { modelValue: false, inlinePrompt: true, activeText: '值守', inactiveText: '休整' },
    });

    // EP 内核契约：inline-prompt 时文字渲染在 el-switch__inner-wrapper 内
    const inner = wrapper.find('.el-switch__inner-wrapper');
    expect(inner.exists()).toBe(true);
    expect(inner.text()).toBe('休整');
    wrapper.unmount();

    const on = mount(LxSwitch, {
      props: { modelValue: true, inlinePrompt: true, activeText: '值守', inactiveText: '休整' },
    });
    expect(on.find('.el-switch__inner-wrapper').text()).toBe('值守');
    on.unmount();
  });

  it('renders the side labels outside the capsule without inlinePrompt', () => {
    const wrapper = mount(LxSwitch, {
      props: { modelValue: false, inlinePrompt: false, activeText: '已联动', inactiveText: '未联动' },
    });

    // EP 内核契约：显式关闭 inline-prompt 时文字渲染在胶囊两侧的 el-switch__label
    const labels = wrapper.findAll('.el-switch__label');
    expect(labels.map((label) => label.text())).toEqual(['未联动', '已联动']);
    expect(wrapper.find('.el-switch__inner-wrapper').exists()).toBe(false);
    wrapper.unmount();
  });

  it('defaults inlinePrompt to true so text goes inside the capsule', () => {
    const wrapper = mount(LxSwitch, {
      props: { modelValue: false, activeText: '值守', inactiveText: '休整' },
    });

    // Lx 默认值差异：inlinePrompt 默认 true（EP 原生默认 false），胶囊内渲染文字
    expect(wrapper.find('.el-switch__inner-wrapper').exists()).toBe(true);
    expect(wrapper.find('.el-switch__inner-wrapper').text()).toBe('休整');
    wrapper.unmount();
  });

  it('keeps the empty inner wrapper contentless without text props', () => {
    // EP 契约：inlinePrompt 下 inner-wrapper 始终渲染，但无文字时不含子元素；
    // 配合 :has(> *) 规则保证无文字胶囊保持标本 40×20（不被 42px 文字规格误放宽）
    const wrapper = mount(LxSwitch, { props: { modelValue: false } });

    const inner = wrapper.find('.el-switch__inner-wrapper');
    expect(inner.exists()).toBe(true);
    expect(inner.element.children).toHaveLength(0);
    wrapper.unmount();
  });
});
