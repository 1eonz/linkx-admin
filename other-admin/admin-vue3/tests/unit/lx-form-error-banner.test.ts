import { mount } from '@vue/test-utils';
import { LxFormErrorBanner } from 'lx-ui';
import { describe, expect, it } from 'vitest';

describe('LxFormErrorBanner', () => {
  it('announces an aggregate form error with title, description, and extension slot', () => {
    const wrapper = mount(LxFormErrorBanner, {
      props: {
        title: '校验阻断：当前区域处于战备封控期',
        description: '封控期间禁止新增派单，请调整封控范围后重试。',
      },
      slots: { default: '<button type="button">查看受影响字段</button>' },
    });

    const alert = wrapper.get('[role="alert"]');
    expect(alert.attributes('aria-live')).toBe('assertive');
    expect(alert.attributes('aria-atomic')).toBe('true');
    expect(wrapper.get('.lx-error-banner__title').text()).toContain('校验阻断');
    expect(wrapper.get('.lx-error-banner__desc').text()).toContain('调整封控范围');
    expect(wrapper.get('button').text()).toBe('查看受影响字段');
    wrapper.unmount();
  });

  it('omits the optional description and forwards host classes', () => {
    const wrapper = mount(LxFormErrorBanner, {
      props: { title: '无法提交' },
      attrs: { class: 'form-error' },
    });

    expect(wrapper.classes()).toContain('form-error');
    expect(wrapper.find('.lx-error-banner__desc').exists()).toBe(false);
    expect(wrapper.get('.lx-error-banner__icon').exists()).toBe(true);
    wrapper.unmount();
  });
});
