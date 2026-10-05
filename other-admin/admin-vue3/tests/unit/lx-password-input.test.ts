import { mount } from '@vue/test-utils';
import { ElForm } from 'element-plus';
import { LxPasswordInput } from 'lx-ui';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

describe('LxPasswordInput', () => {
  it('renders a password input with autocomplete off by default', () => {
    const wrapper = mount(LxPasswordInput);

    const input = wrapper.get('input.el-input__inner');
    expect(input.attributes('type')).toBe('password');
    expect(input.attributes('autocomplete')).toBe('off');
    wrapper.unmount();
  });

  it('调用方透传 type 时仍由组件控制密码遮罩', async () => {
    const wrapper = mount(LxPasswordInput, { attrs: { type: 'text' } });
    const input = wrapper.get('input.el-input__inner');
    const toggle = wrapper.get('button.lx-password-input__toggle');

    expect(input.attributes('type')).toBe('password');
    await toggle.trigger('click');
    expect(input.attributes('type')).toBe('text');
    await toggle.trigger('click');
    expect(input.attributes('type')).toBe('password');

    wrapper.unmount();
  });

  it('动态更新透传 type 时仍由组件控制密码遮罩', async () => {
    const forwardedType = ref('text');
    const Host = defineComponent({
      setup() {
        return () => h(LxPasswordInput, { type: forwardedType.value });
      },
    });
    const wrapper = mount(Host);
    const input = wrapper.get('input.el-input__inner');

    forwardedType.value = 'email';
    await nextTick();
    expect(input.attributes('type')).toBe('password');

    wrapper.unmount();
  });

  it('仅在焦点离开整个组件后按需重新遮罩', async () => {
    const outsideButton = document.createElement('button');
    document.body.append(outsideButton);

    const wrapper = mount(LxPasswordInput, {
      attachTo: document.body,
      props: { maskOnBlur: true },
    });
    const input = wrapper.get('input.el-input__inner');
    const toggle = wrapper.get('button.lx-password-input__toggle');

    input.element.focus();
    await toggle.trigger('click');
    expect(input.attributes('type')).toBe('text');

    toggle.element.focus();
    expect(input.attributes('type')).toBe('text');
    outsideButton.focus();
    await nextTick();
    expect(input.attributes('type')).toBe('password');

    wrapper.unmount();
    outsideButton.remove();
  });

  it('默认不因焦点离开而改变已选择的明文状态', async () => {
    const outsideButton = document.createElement('button');
    document.body.append(outsideButton);

    const wrapper = mount(LxPasswordInput, {
      attachTo: document.body,
    });
    const input = wrapper.get('input.el-input__inner');
    const toggle = wrapper.get('button.lx-password-input__toggle');

    input.element.focus();
    await toggle.trigger('click');
    outsideButton.focus();
    await nextTick();
    expect(input.attributes('type')).toBe('text');

    wrapper.unmount();
    outsideButton.remove();
  });

  it('只读状态下透传 type 仍不能覆盖密码遮罩', async () => {
    const wrapper = mount(LxPasswordInput, {
      attrs: { type: 'text' },
      props: { readonly: true },
    });
    const input = wrapper.get('input.el-input__inner');
    const toggle = wrapper.get('button.lx-password-input__toggle');

    expect(input.attributes('type')).toBe('password');
    expect(input.attributes('readonly')).toBeDefined();
    await toggle.trigger('click');
    expect(input.attributes('type')).toBe('text');

    wrapper.unmount();
  });

  it('使用统一尺寸并通过语义按钮切换密码可见状态', async () => {
    const wrapper = mount(LxPasswordInput);
    const input = wrapper.get('input.el-input__inner');
    const toggle = wrapper.get('button.lx-password-input__toggle');

    expect(wrapper.find('.el-input--small').exists()).toBe(false);
    expect(input.attributes('type')).toBe('password');
    expect(toggle.attributes('type')).toBe('button');
    expect(toggle.attributes('aria-label')).toBe('显示密码');
    expect(toggle.attributes('aria-pressed')).toBe('false');

    await toggle.trigger('click');
    expect(input.attributes('type')).toBe('text');
    expect(toggle.attributes('aria-label')).toBe('隐藏密码');
    expect(toggle.attributes('aria-pressed')).toBe('true');

    await wrapper.setProps({ showPassword: false });
    expect(input.attributes('type')).toBe('password');
    await wrapper.setProps({ showPassword: true });
    expect(input.attributes('type')).toBe('password');
    wrapper.unmount();
  });

  it('支持旧尺寸别名并在禁用或关闭显隐能力时阻止切换', async () => {
    const legacy = mount(LxPasswordInput, { props: { size: 'small' } });
    expect(legacy.find('.el-input--small').exists()).toBe(true);
    legacy.unmount();

    const disabled = mount(LxPasswordInput, {
      props: { disabled: true },
    });
    await disabled.get('.lx-password-input__toggle').trigger('click');
    expect(disabled.get('input').attributes('type')).toBe('password');
    expect(disabled.get('.lx-password-input__toggle').attributes('disabled')).toBeDefined();
    disabled.unmount();

    const hidden = mount(LxPasswordInput, { props: { showPassword: false } });
    expect(hidden.find('.lx-password-input__toggle').exists()).toBe(false);
    hidden.unmount();
  });

  it('inherits disabled state from an enclosing Element Plus form', async () => {
    const wrapper = mount(ElForm, {
      props: { disabled: true },
      slots: { default: () => h(LxPasswordInput, { modelValue: 'secret' }) },
    });

    expect(wrapper.get('input.el-input__inner').attributes('disabled')).toBeDefined();
    const toggle = wrapper.get('.lx-password-input__toggle');
    expect(toggle.attributes('disabled')).toBeDefined();
    await toggle.trigger('click');
    expect(wrapper.get('input.el-input__inner').attributes('type')).toBe('password');
    wrapper.unmount();
  });

  it('默认允许剪贴板操作，并支持显式阻止', () => {
    for (const preventClipboard of [false, true]) {
      const wrapper = mount(LxPasswordInput, { props: { preventClipboard } });
      const input = wrapper.get('input.el-input__inner');

      for (const type of ['copy', 'cut', 'paste']) {
        const event = new Event(type, { cancelable: true });
        input.element.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(preventClipboard);
      }

      wrapper.unmount();
    }
  });
});
