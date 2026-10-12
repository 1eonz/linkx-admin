import { mount } from '@vue/test-utils';
import { LxInputNumber } from 'lx-ui';
import { describe, expect, it } from 'vitest';

describe('LxInputNumber', () => {
  it('renders the lx-input-number class on the EP kernel root', () => {
    const wrapper = mount(LxInputNumber, { props: { modelValue: 30 } });

    expect(wrapper.classes()).toContain('lx-input-number');
    expect(wrapper.classes()).toContain('el-input-number');
    expect(wrapper.find('input').exists()).toBe(true);
    wrapper.unmount();
  });

  it('defaults to right-positioned split controls and left alignment', () => {
    const wrapper = mount(LxInputNumber, { props: { modelValue: 30 } });

    // Lx 默认值差异：controlsPosition 默认 right（EP 原生默认 '' 两侧形态）；
    // align 默认 left（EP 原生默认 center），经根类 is-left 生效
    expect(wrapper.classes()).toContain('lx-input-number--custom-controls');
    expect(wrapper.classes()).toContain('is-left');
    expect(wrapper.find('.lx-input-number__stepper-button--increase').exists()).toBe(true);
    expect(wrapper.find('.lx-input-number__stepper-button--decrease').exists()).toBe(true);
    wrapper.unmount();
  });

  it('preserves Element Plus two-sided controls when explicitly requested', () => {
    const wrapper = mount(LxInputNumber, {
      props: { modelValue: 30, controlsPosition: '' },
    });

    expect(wrapper.classes()).not.toContain('lx-input-number--custom-controls');
    expect(wrapper.find('.el-input-number__increase').exists()).toBe(true);
    expect(wrapper.find('.el-input-number__decrease').exists()).toBe(true);
    wrapper.unmount();
  });

  it('maps the Lx size scale onto EP kernel size classes', () => {
    const sm = mount(LxInputNumber, { props: { size: 'sm' } });
    expect(sm.classes()).toContain('el-input-number--small');
    sm.unmount();

    const lg = mount(LxInputNumber, { props: { size: 'lg' } });
    expect(lg.classes()).toContain('el-input-number--large');
    lg.unmount();

    const md = mount(LxInputNumber, { props: { size: 'md' } });
    expect(md.classes()).not.toContain('el-input-number--small');
    expect(md.classes()).not.toContain('el-input-number--large');
    md.unmount();
  });

  it('keeps the declared name attribute on the native input and updates it', async () => {
    const wrapper = mount(LxInputNumber, { props: { name: 'patrolQuota' } });

    expect(wrapper.get('input').attributes('name')).toBe('patrolQuota');
    await wrapper.setProps({ name: 'updatedQuota' });
    expect(wrapper.get('input').attributes('name')).toBe('updatedQuota');
    wrapper.unmount();
  });

  it('emits update:modelValue with the stepped value on increase press', async () => {
    const wrapper = mount(LxInputNumber, {
      props: { modelValue: 30 },
      attachTo: document.body,
    });

    await wrapper.find('.lx-input-number__stepper-button--increase').trigger('click');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([31]);
    wrapper.unmount();
  });

  it('emits change with (current, previous) pair on stepping', async () => {
    const wrapper = mount(LxInputNumber, {
      props: { modelValue: 30 },
      attachTo: document.body,
    });

    await wrapper.find('.lx-input-number__stepper-button--increase').trigger('click');

    const emitted = wrapper.emitted('change');
    expect(emitted).toBeTruthy();
    expect(emitted!.at(-1)).toEqual([31, 30]);
    wrapper.unmount();
  });

  it('respects the step prop for each press', async () => {
    const wrapper = mount(LxInputNumber, {
      props: { modelValue: 0, step: 5 },
      attachTo: document.body,
    });

    await wrapper.find('.lx-input-number__stepper-button--increase').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([5]);
    wrapper.unmount();
  });

  it('localizes step controls and exposes their disabled state', () => {
    const wrapper = mount(LxInputNumber, {
      props: { modelValue: 1, min: 0, max: 1 },
      attachTo: document.body,
    });
    const increase = wrapper.get('.lx-input-number__stepper-button--increase');
    const decrease = wrapper.get('.lx-input-number__stepper-button--decrease');

    expect(increase.attributes('aria-label')).toBe('增加数值');
    expect(increase.attributes('aria-disabled')).toBe('true');
    expect(increase.attributes('tabindex')).toBe('-1');
    expect(increase.element.disabled).toBe(true);
    expect(decrease.attributes('aria-label')).toBe('减少数值');
    expect(decrease.attributes('aria-disabled')).toBe('false');
    expect(decrease.attributes('tabindex')).toBe('0');
    expect(decrease.element.disabled).toBe(false);
    wrapper.unmount();
  });

  it('steps when the custom controls are activated', async () => {
    const wrapper = mount(LxInputNumber, {
      props: { modelValue: 30 },
      attachTo: document.body,
    });
    const increase = wrapper.get('.lx-input-number__stepper-button--increase');

    expect(increase.attributes('tabindex')).toBe('0');
    await increase.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([31]);

    await wrapper.setProps({ modelValue: 31 });
    await increase.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([32]);
    wrapper.unmount();
  });

  it('does not bubble synthetic step keys to host keyboard listeners', async () => {
    const wrapper = mount(LxInputNumber, {
      props: { modelValue: 30 },
      attachTo: document.body,
    });
    let hostKeydownCount = 0;
    const onHostKeydown = () => {
      hostKeydownCount += 1;
    };
    document.addEventListener('keydown', onHostKeydown);

    try {
      await wrapper.get('.lx-input-number__stepper-button--increase').trigger('click');
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([31]);
      expect(hostKeydownCount).toBe(0);
    } finally {
      document.removeEventListener('keydown', onHostKeydown);
      wrapper.unmount();
    }
  });

  it('disables the increase button at the max boundary', async () => {
    const wrapper = mount(LxInputNumber, {
      props: { modelValue: 100, min: 1, max: 100 },
      attachTo: document.body,
    });

    const increase = wrapper.find('.lx-input-number__stepper-button--increase');
    expect(increase.element.disabled).toBe(true);
    await increase.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    wrapper.unmount();
  });

  it('disables the decrease button at the min boundary', async () => {
    const wrapper = mount(LxInputNumber, {
      props: { modelValue: 0, min: 0, max: 100 },
      attachTo: document.body,
    });

    const decrease = wrapper.find('.lx-input-number__stepper-button--decrease');
    expect(decrease.element.disabled).toBe(true);
    await decrease.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    wrapper.unmount();
  });

  it('applies precision to the displayed value', () => {
    const wrapper = mount(LxInputNumber, {
      props: { modelValue: 0.5, precision: 1 },
    });

    expect(wrapper.find('input').element.value).toBe('0.5');
    wrapper.unmount();
  });

  it('hides the step controls when controls is false', () => {
    const wrapper = mount(LxInputNumber, {
      props: { modelValue: 30, controls: false },
    });

    expect(wrapper.find('.lx-input-number__stepper').exists()).toBe(false);
    wrapper.unmount();
  });

  it('blocks interaction while disabled', async () => {
    const wrapper = mount(LxInputNumber, {
      props: { modelValue: 30, disabled: true },
      attachTo: document.body,
    });

    expect(wrapper.classes()).toContain('is-disabled');
    expect(wrapper.get('.lx-input-number__stepper-button--increase').element.disabled).toBe(true);
    await wrapper.find('.lx-input-number__stepper-button--increase').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    wrapper.unmount();
  });

  it('keeps read-only text entry locked while allowing in-range step controls', async () => {
    const wrapper = mount(LxInputNumber, {
      props: { modelValue: 100, min: 1, max: 100, readonly: true },
      attachTo: document.body,
    });
    const input = wrapper.get('input');
    const increase = wrapper.get('.lx-input-number__stepper-button--increase');
    const decrease = wrapper.get('.lx-input-number__stepper-button--decrease');

    expect((input.element as HTMLInputElement).readOnly).toBe(true);
    expect(increase.element.disabled).toBe(true);
    expect(decrease.element.disabled).toBe(false);
    await decrease.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([99]);
    wrapper.unmount();
  });

  it('exposes focus and blur methods', () => {
    // 波次 3 同口径：jsdom 不派发 programmatic focus 事件，
    // 仅断言实例方法透传存在（焦点态类留给浏览器 E2E 验收）
    const wrapper = mount(LxInputNumber, { props: { modelValue: 30 } });

    expect(wrapper.vm.focus).toBeTypeOf('function');
    expect(wrapper.vm.blur).toBeTypeOf('function');
    wrapper.unmount();
  });
});
