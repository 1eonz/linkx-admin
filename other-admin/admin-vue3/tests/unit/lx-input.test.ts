import { mount } from '@vue/test-utils';
import { LxForm, LxInput } from 'lx-ui';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

describe('LxInput', () => {
  it('renders the lx-input class family on the EP kernel root', () => {
    const wrapper = mount(LxInput);

    expect(wrapper.classes()).toContain('lx-input');
    expect(wrapper.classes()).toContain('el-input');
    // md 为默认档（省略尺寸类，与 lx-btn--md 档名体系一致）
    expect(wrapper.classes()).toContain('lx-input--md');
    wrapper.unmount();
  });

  it('maps engineering sizes onto the Element Plus kernel sizes', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const wrapper = mount(LxInput, { props: { size } });

      expect(wrapper.classes(), `size=${size}`).toContain(`lx-input--${size}`);
      // EP 内核档位类：sm→small 28px / md→default 32px / lg→large 40px（全局令牌桥）
      const epSizeClass = { sm: 'el-input--small', md: '', lg: 'el-input--large' }[size];
      if (epSizeClass) {
        expect(wrapper.classes(), `size=${size}`).toContain(epSizeClass);
      } else {
        // default 档无修饰类，根类 el-input 直接承载
        expect(wrapper.classes(), `size=${size}`).not.toContain('el-input--small');
        expect(wrapper.classes(), `size=${size}`).not.toContain('el-input--large');
      }
      wrapper.unmount();
    }
  });

  it('toggles the mono value class without changing the kernel DOM', async () => {
    const wrapper = mount(LxInput, { props: { mono: false } });

    expect(wrapper.classes()).not.toContain('lx-input--mono');

    await wrapper.setProps({ mono: true });
    expect(wrapper.classes()).toContain('lx-input--mono');
    // mono 命中 .el-input__inner 的字体族规则，不替换原生 input 节点
    expect(wrapper.find('input.el-input__inner').exists()).toBe(true);
    wrapper.unmount();
  });

  it('updates the model value through the v-model contract', async () => {
    const wrapper = mount(LxInput, { props: { modelValue: '' } });

    await wrapper.find('input.el-input__inner').setValue('GA-330106');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['GA-330106']);
    wrapper.unmount();
  });

  it('blocks editing and clearing when explicitly disabled', async () => {
    const wrapper = mount(LxInput, {
      props: { disabled: true, clearable: true, modelValue: 'x' },
    });

    const input = wrapper.get('input.el-input__inner');
    expect(input.attributes('disabled')).toBeDefined();
    expect(wrapper.classes()).toContain('is-disabled');
    await wrapper.trigger('mouseenter');
    const clear = wrapper.get('button.lx-input__clear');
    expect(clear.attributes('disabled')).toBeDefined();
    expect(clear.attributes('tabindex')).toBe('-1');
    await clear.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    wrapper.unmount();
  });

  it('blocks clearing when readonly', async () => {
    const wrapper = mount(LxInput, {
      props: { readonly: true, clearable: true, modelValue: 'x' },
    });

    const input = wrapper.get('input.el-input__inner');
    expect(input.attributes('readonly')).toBeDefined();
    await wrapper.trigger('mouseenter');
    const clear = wrapper.get('button.lx-input__clear');
    expect(clear.attributes('disabled')).toBeDefined();
    expect(clear.attributes('tabindex')).toBe('-1');
    await clear.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    wrapper.unmount();
  });

  it('inherits form-level disabled state for the clearable action', async () => {
    const wrapper = mount(
      {
        components: { LxForm, LxInput },
        data: () => ({ value: '330106' }),
        template: '<LxForm disabled><LxInput v-model="value" clearable /></LxForm>',
      },
      { attachTo: document.body },
    );

    await wrapper.get('input.el-input__inner').trigger('mouseenter');
    const clear = wrapper.get('button.lx-input__clear');

    expect(wrapper.get('input.el-input__inner').attributes('disabled')).toBeDefined();
    expect(clear.attributes('disabled')).toBeDefined();
    expect(clear.attributes('tabindex')).toBe('-1');
    await clear.trigger('click');
    expect(wrapper.vm.value).toBe('330106');

    wrapper.unmount();
  });

  it('shows the word limit counter when showWordLimit is set with maxlength', () => {
    const wrapper = mount(LxInput, {
      props: { modelValue: '330106', maxlength: 18, showWordLimit: true },
    });

    // 计数器渲染当前长度 / 上限（等宽 11px 契约由样式层承接）
    expect(wrapper.get('.el-input__count-inner').text()).toBe('6 / 18');
    wrapper.unmount();
  });

  it('clears the value through the clearable button after hover', async () => {
    const wrapper = mount(LxInput, {
      props: { modelValue: '330106', clearable: true },
    });

    // 清除按钮在聚焦或悬停时进入可访问状态，并保留 EP 内核清空事件契约。
    await wrapper.trigger('mouseenter');
    const clear = wrapper.get('button.lx-input__clear');
    expect(clear.attributes('aria-label')).toBe('清空输入框');
    expect(clear.attributes('tabindex')).toBe('0');
    await clear.trigger('click');

    expect(wrapper.emitted('clear')).toHaveLength(1);
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['']);
    expect(wrapper.emitted('change')?.at(-1)).toEqual(['']);
    expect(wrapper.emitted('input')?.at(-1)).toEqual(['']);
    wrapper.unmount();
  });

  it('passes native required semantics to the real input', () => {
    const wrapper = mount(LxInput, { props: { required: true } });

    expect(wrapper.get('input.el-input__inner').attributes('required')).toBeDefined();
    wrapper.unmount();
  });

  it('forwards the prefix slot and undeclared attrs onto the kernel', async () => {
    const wrapper = mount(LxInput, {
      attrs: { id: 'officer-name', 'data-testid': 'case-code' },
      slots: { prefix: 'AJ' },
    });

    expect(wrapper.get('.el-input__prefix').text()).toBe('AJ');
    // EP 2.14.6 契约：id 被内核声明为 prop，经 onMounted immediate watch 写入
    // inputId 再渲染到 input 元素——DOM 更新异步于 mount 返回，需 flush 微任务
    await nextTick();
    expect(wrapper.get('input#officer-name').exists()).toBe(true);
    expect(wrapper.get('input[data-testid="case-code"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('defaults autocomplete to off for sensitive police fields', () => {
    const wrapper = mount(LxInput);

    expect(wrapper.get('input.el-input__inner').attributes('autocomplete')).toBe('off');
    wrapper.unmount();
  });

  it('exposes focus, blur and select methods', () => {
    const wrapper = mount(LxInput);

    expect(wrapper.vm.focus).toBeTypeOf('function');
    expect(wrapper.vm.blur).toBeTypeOf('function');
    expect(wrapper.vm.select).toBeTypeOf('function');
    wrapper.unmount();
  });
});
