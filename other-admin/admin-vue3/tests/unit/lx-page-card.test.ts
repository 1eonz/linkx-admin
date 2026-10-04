import { mount } from '@vue/test-utils';
import { LxPageCard } from 'lx-ui';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

describe('LxPageCard', () => {
  it('renders the titled region, subtitle, slots, and padding contract', () => {
    const wrapper = mount(LxPageCard, {
      props: { title: '接口运行概况', subtitle: '最近一次采集：09:30' },
      slots: {
        default: () => h('p', { 'data-testid': 'body' }, '18 / 20'),
        'header-extra': () => h('button', { type: 'button' }, '刷新'),
        footer: () => h('span', { 'data-testid': 'footer' }, '本地示例'),
      },
    });

    const region = wrapper.get('[role="region"]');
    expect(region.attributes('aria-labelledby')).toBe(wrapper.get('h2').attributes('id'));
    expect(wrapper.get('.lx-page-card__subtitle').text()).toContain('09:30');
    expect(wrapper.get('[data-testid="body"]').element.parentElement?.className).toContain('has-padding');
    expect(wrapper.get('[data-testid="footer"]').text()).toBe('本地示例');
    expect(wrapper.get('.lx-page-card__header-extra button').text()).toBe('刷新');
    wrapper.unmount();
  });

  it('exposes loading semantics and keeps the body mounted while busy', async () => {
    const wrapper = mount(LxPageCard, {
      props: { title: '同步状态', loading: true },
      slots: { default: '<span data-testid="content">内容</span>' },
    });

    const region = wrapper.get('[role="region"]');
    expect(region.attributes('aria-busy')).toBe('true');
    expect(wrapper.get('[data-testid="content"]').exists()).toBe(true);
    expect(wrapper.get('.lx-page-card__loading').attributes('aria-live')).toBe('polite');

    await wrapper.setProps({ loading: false });
    expect(wrapper.find('.lx-page-card__loading').exists()).toBe(false);
    expect(region.attributes('aria-busy')).toBeUndefined();
    wrapper.unmount();
  });

  it('supports borderless and no-padding variants while forwarding host classes', () => {
    const wrapper = mount(LxPageCard, {
      props: { bordered: false, bodyPadding: false },
      attrs: { class: 'host-card' },
      slots: { default: '内容' },
    });

    expect(wrapper.classes()).toContain('host-card');
    expect(wrapper.classes()).not.toContain('is-bordered');
    expect(wrapper.get('.lx-page-card__body').classes()).not.toContain('has-padding');
    wrapper.unmount();
  });
});
