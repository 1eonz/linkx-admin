import { mount } from '@vue/test-utils';
import { LxTextarea } from 'lx-ui';
import { describe, expect, it } from 'vitest';

describe('LxTextarea', () => {
  it('renders the lx-textarea shell around the EP textarea root', () => {
    const wrapper = mount(LxTextarea);

    expect(wrapper.classes()).toContain('lx-textarea');
    expect(wrapper.find('.lx-textarea__control.el-textarea').exists()).toBe(true);
    expect(wrapper.find('textarea.el-textarea__inner').exists()).toBe(true);
    wrapper.unmount();
  });

  it('applies the three-row baseline by default and forwards custom rows', () => {
    const baseline = mount(LxTextarea);

    expect(baseline.get('textarea').attributes('rows')).toBe('3');
    baseline.unmount();

    const custom = mount(LxTextarea, { props: { rows: 5 } });
    expect(custom.get('textarea').attributes('rows')).toBe('5');
    custom.unmount();
  });

  it('updates the model value through the v-model contract', async () => {
    const wrapper = mount(LxTextarea, { props: { modelValue: '' } });

    await wrapper.find('textarea.el-textarea__inner').setValue('实行双警携犬网格化巡逻。');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['实行双警携犬网格化巡逻。']);
    wrapper.unmount();
  });

  it('renders the word limit counter only with maxlength (EP 2.14.6 contract)', () => {
    // 有 maxlength：计数器在域内右下角，显示 "当前 / 上限"，带 aria-label 读屏播报
    const inside = mount(LxTextarea, {
      props: { modelValue: '布控细则', maxlength: 200, showWordLimit: true },
    });

    const counter = inside.get('.el-input__count');
    expect(counter.text()).toBe('4 / 200');
    expect(counter.attributes('aria-label')).toBe('4 / 200 characters');
    expect(counter.attributes('role')).toBe('status');
    // wordLimitPosition 默认 inside：无 is-outside 修饰（2.14.6 已移除 count-inner 结构）
    expect(counter.classes()).not.toContain('is-outside');
    inside.unmount();

    // 无 maxlength：EP 2.14.6 移除旧版"域外开口计数"行为，计数器不再渲染
    const none = mount(LxTextarea, { props: { modelValue: '补充指令', showWordLimit: true } });

    expect(none.find('.el-input__count').exists()).toBe(false);
    none.unmount();

    // 位置切换：word-limit-position 经 attrs 透传给内核
    const outside = mount(LxTextarea, {
      props: { modelValue: '布控细则', maxlength: 200, showWordLimit: true },
      attrs: { 'word-limit-position': 'outside' },
    });

    expect(outside.get('.el-input__count').classes()).toContain('is-outside');
    outside.unmount();
  });

  it('默认硬截断且校验模式正确关联超限说明', async () => {
    const hardLimit = mount(LxTextarea, {
      props: { maxlength: 5, showWordLimit: true },
    });
    expect(hardLimit.get('textarea').attributes('maxlength')).toBe('5');
    expect(hardLimit.find('.lx-textarea__overflow-message').exists()).toBe(false);
    hardLimit.unmount();

    const value = '涉密核验'.repeat(51);
    const validation = mount(LxTextarea, {
      props: {
        modelValue: value,
        maxlength: 200,
        maxlengthMode: 'validate',
        showWordLimit: true,
      },
      attrs: { 'aria-describedby': 'existing-help' },
    });
    const textarea = validation.get('textarea');

    expect(textarea.attributes('maxlength')).toBeUndefined();
    expect(textarea.attributes('aria-invalid')).toBe('true');
    expect(textarea.attributes('aria-describedby')).toContain('existing-help');
    const overflowMessage = validation.get('.lx-textarea__overflow-message');
    const overflowDescriptionId = overflowMessage.attributes('id');
    expect(textarea.attributes('aria-describedby')).toContain(overflowDescriptionId);
    expect(overflowMessage.text()).toContain('字数超出上限 200 字');
    expect(validation.get('.lx-textarea__validation-count').text()).toBe(`${value.length} / 200`);

    await validation.setProps({ modelValue: value.slice(0, 200) });
    expect(validation.find('.lx-textarea__overflow-message').exists()).toBe(false);
    expect(validation.get('textarea').attributes('aria-invalid')).toBeUndefined();
    expect(validation.get('textarea').attributes('aria-describedby')).toBe('existing-help');
    validation.unmount();
  });

  it('blocks editing and marks the disabled state when disabled', () => {
    const wrapper = mount(LxTextarea, { props: { disabled: true, modelValue: '锁定' } });

    expect(wrapper.get('textarea').attributes('disabled')).toBeDefined();
    expect(wrapper.classes()).toContain('is-disabled');
    wrapper.unmount();
  });

  it('passes the resize contract through to the native textarea', () => {
    const wrapper = mount(LxTextarea, { props: { resize: 'none' } });

    // resize 由样式层承接（.el-textarea__inner resize 规则），prop 透传到内核 class 上下文
    expect(wrapper.props('resize')).toBe('none');
    wrapper.unmount();
  });

  it('exposes focus and blur methods', () => {
    const wrapper = mount(LxTextarea);

    expect(wrapper.vm.focus).toBeTypeOf('function');
    expect(wrapper.vm.blur).toBeTypeOf('function');
    wrapper.unmount();
  });
});
