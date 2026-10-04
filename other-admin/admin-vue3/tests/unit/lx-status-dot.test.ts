import { mount } from '@vue/test-utils';
import { LxStatusDot } from 'lx-ui';
import { describe, expect, it } from 'vitest';

describe('LxStatusDot', () => {
  it('renders a semantic status label and optional text', () => {
    const wrapper = mount(LxStatusDot, {
      props: { status: 'error', statusDesc: '布控告警', showText: true, pulse: false },
    });

    expect(wrapper.attributes('role')).toBe('img');
    expect(wrapper.attributes('aria-label')).toBe('布控告警');
    expect(wrapper.find('.lx-status-dot__text').text()).toBe('布控告警');
    expect(wrapper.find('.lx-status-dot__ping').exists()).toBe(false);
    wrapper.unmount();
  });

  it('maps legacy numeric codes before the named status', () => {
    const wrapper = mount(LxStatusDot, {
      props: { status: 'online', code: 0, pulse: false },
    });

    expect(wrapper.classes()).toContain('lx-status-dot--offline');
    expect(wrapper.attributes('aria-label')).toBe('offline');
    wrapper.unmount();
  });

  it('only adds the breathing layer for online status when pulse is enabled', () => {
    const online = mount(LxStatusDot, { props: { status: 'online', pulse: true } });
    expect(online.find('.lx-status-dot__ping').exists()).toBe(true);
    online.unmount();

    const busy = mount(LxStatusDot, { props: { status: 'busy', pulse: true } });
    expect(busy.find('.lx-status-dot__ping').exists()).toBe(false);
    busy.unmount();
  });
});
