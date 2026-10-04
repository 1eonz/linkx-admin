import { mount } from '@vue/test-utils';
import { LxTag } from 'lx-ui';
import { describe, expect, it } from 'vitest';

describe('LxTag', () => {
  it('renders semantic classes and forwards the disabled state to assistive technology', () => {
    const wrapper = mount(LxTag, {
      props: { type: 'warning', disabled: true },
      slots: { default: () => '降级' },
    });

    expect(wrapper.classes()).toContain('lx-tag--warning');
    expect(wrapper.attributes('aria-disabled')).toBe('true');
    expect(wrapper.text()).toContain('降级');
    wrapper.unmount();
  });

  it('emits close from a native button with a keyboard reachable target', async () => {
    const wrapper = mount(LxTag, {
      props: { closable: true },
      slots: { default: () => '检索条件' },
    });

    const close = wrapper.get('button.lx-tag__close');
    expect(close.attributes('type')).toBe('button');
    expect(close.attributes('aria-label')).toBe('关闭');
    await close.trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
    wrapper.unmount();
  });

  it('does not expose a close action when disabled', () => {
    const wrapper = mount(LxTag, { props: { closable: true, disabled: true } });

    expect(wrapper.find('button.lx-tag__close').exists()).toBe(false);
    wrapper.unmount();
  });
});
