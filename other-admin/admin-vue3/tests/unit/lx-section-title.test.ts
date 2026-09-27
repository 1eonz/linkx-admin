import { mount } from '@vue/test-utils';
import { LxSectionTitle } from 'lx-ui';
import { describe, expect, it } from 'vitest';

describe('LxSectionTitle design variants', () => {
  it.each(['border', 'dashed', 'plain'] as const)('renders the %s variant and public slots', (variant) => {
    const wrapper = mount(LxSectionTitle, {
      props: { title: '警员在岗档案', variant },
      slots: { extra: '<button type="button">配置</button>' },
    });

    expect(wrapper.find('header').classes()).toContain(`lx-section-title--${variant}`);
    expect(wrapper.find('h3').text()).toBe('警员在岗档案');
    expect(wrapper.find('.lx-section-title__extra button').text()).toBe('配置');
    expect(wrapper.find('.lx-section-title__bar').exists()).toBe(variant === 'border');
  });

  it('renders a named LxIcon and supports caller-provided leading content', () => {
    const icon = mount(LxSectionTitle, {
      props: { title: '南向接口', variant: 'dashed', icon: 'link' },
    });
    const leading = mount(LxSectionTitle, {
      props: { title: '自定义前置内容' },
      slots: { leading: '<span data-testid="leading">自定义</span>' },
    });

    expect(icon.find('.lx-icon').attributes('data-icon-name')).toBe('link');
    expect(leading.get('[data-testid="leading"]').text()).toBe('自定义');
  });

  it.each(['small', 'default', 'large'] as const)('applies the %s size', (size) => {
    const wrapper = mount(LxSectionTitle, {
      props: { title: '协同指挥席位配置', size },
    });

    expect(wrapper.get('header').classes()).toContain(`lx-section-title--${size}`);
  });

  it.each(['primary', 'success', 'warning', 'info'] as const)(
    'renders a %s tag without changing the heading text',
    (tagType) => {
      const wrapper = mount(LxSectionTitle, {
        props: { title: '基础信息档案', tag: '8 项字段', tagType },
      });

      expect(wrapper.get('h3').text()).toContain('基础信息档案');
      expect(wrapper.get('h3 .lx-tag').classes()).toContain(`lx-tag--${tagType}`);
      expect(wrapper.get('h3 .lx-tag').text()).toBe('8 项字段');
    },
  );
});
