import { mount } from '@vue/test-utils';
import { LxEmpty } from 'lx-ui';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

describe('LxEmpty', () => {
  it('renders the default description and an accessible status region', () => {
    const wrapper = mount(LxEmpty);

    expect(wrapper.get('[role="status"]').exists()).toBe(true);
    expect(wrapper.get('.lx-empty__desc').text()).toBe('暂无数据');
    expect(wrapper.get('.lx-empty__icon').attributes('aria-hidden')).toBeUndefined();
    expect(wrapper.get('.lx-empty__image').attributes('aria-hidden')).toBe('true');
    wrapper.unmount();
  });

  it('uses the compact variant while preserving the supplied description', () => {
    const wrapper = mount(LxEmpty, {
      props: { description: '暂无记录', size: 'compact' },
    });

    expect(wrapper.classes()).toContain('lx-empty--compact');
    expect(wrapper.get('.lx-empty__desc').text()).toBe('暂无记录');
    wrapper.unmount();
  });

  it('applies a positive imageSize and ignores non-positive values', async () => {
    const wrapper = mount(LxEmpty, { props: { imageSize: 80 } });
    const image = wrapper.get('.lx-empty__image');

    expect(image.attributes('style')).toContain('width: 80px');
    expect(image.attributes('style')).toContain('height: 80px');

    await wrapper.setProps({ imageSize: 0 });
    expect(wrapper.get('.lx-empty__image').attributes('style')).toBeUndefined();
    wrapper.unmount();
  });

  it('supports a custom icon area and a separate footer action slot', () => {
    const wrapper = mount(LxEmpty, {
      slots: {
        default: () => h('span', { 'data-testid': 'custom-image' }, '自定义图标'),
        footer: () => h('button', { type: 'button' }, '新建'),
      },
    });

    expect(wrapper.get('[data-testid="custom-image"]').text()).toBe('自定义图标');
    expect(wrapper.find('.lx-empty__icon').exists()).toBe(false);
    expect(wrapper.get('.lx-empty__footer button').text()).toBe('新建');
    wrapper.unmount();
  });

  it('forwards host classes to the root element', () => {
    const wrapper = mount(LxEmpty, { attrs: { class: 'mapper-empty' } });

    expect(wrapper.classes()).toContain('mapper-empty');
    wrapper.unmount();
  });
});
