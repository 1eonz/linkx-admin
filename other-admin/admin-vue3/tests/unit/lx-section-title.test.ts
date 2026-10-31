import { mount } from '@vue/test-utils';
import { LxSectionTitle } from 'lx-ui';
import { describe, expect, it } from 'vitest';

describe('LxSectionTitle design variants', () => {
  it.each(['', '   '])('空标题 %j 不生成无名称 heading，仍保留标签与操作', (title) => {
    const wrapper = mount(LxSectionTitle, {
      props: { title, tag: '配置中' },
      slots: { extra: '<button type="button">查看</button>' },
    });
    expect(wrapper.find('h3').exists()).toBe(false);
    expect(wrapper.get('.lx-section-title__text').element.tagName).toBe('DIV');
    expect(wrapper.get('.lx-tag').text()).toBe('配置中');
    expect(wrapper.get('button').text()).toBe('查看');
  });

  it('普通标题全文提示随属性变化，空标题不生成提示', async () => {
    const wrapper = mount(LxSectionTitle, { props: { title: '辖区设备综合配置' } });
    expect(wrapper.get('.lx-section-title__label').attributes('title')).toBe('辖区设备综合配置');
    await wrapper.setProps({ title: '更新后的完整标题' });
    expect(wrapper.get('.lx-section-title__label').attributes('title')).toBe('更新后的完整标题');
    await wrapper.setProps({ title: '' });
    expect(wrapper.get('.lx-section-title__label').attributes('title')).toBeUndefined();
  });

  it('自定义标题不会沿用属性中的旧全文提示', () => {
    const wrapper = mount(LxSectionTitle, {
      props: { title: '属性旧标题' },
      slots: { default: '<strong>插槽实际标题</strong>' },
    });
    expect(wrapper.get('.lx-section-title__label').text()).toBe('插槽实际标题');
    expect(wrapper.get('.lx-section-title__label').attributes('title')).toBeUndefined();
  });

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
      expect(wrapper.get('h3 .lx-tag').attributes('aria-label')).toBe('标题标记：8 项字段');
    },
  );

  it('allows the subtitle slot to replace the subtitle prop', () => {
    const wrapper = mount(LxSectionTitle, {
      props: { title: '预警策略', subtitle: '属性说明' },
      slots: { subtitle: '<strong data-testid="subtitle-slot">插槽说明</strong>' },
    });

    expect(wrapper.get('.lx-section-title__subtitle').text()).toBe('插槽说明');
    expect(wrapper.get('[data-testid="subtitle-slot"]').element.tagName).toBe('STRONG');
  });

  it('keeps numeric zero tags visible', () => {
    const wrapper = mount(LxSectionTitle, {
      props: { title: '空结果', tag: 0, tagType: 'info' },
    });

    expect(wrapper.get('.lx-section-title__text .lx-tag').text()).toBe('0');
  });

  it('uses the requested heading level without changing the title styling hook', () => {
    const wrapper = mount(LxSectionTitle, {
      props: { title: '设备配置', headingLevel: 2 },
    });

    expect(wrapper.get('h2.lx-section-title__text').text()).toBe('设备配置');
    expect(wrapper.find('h3.lx-section-title__text').exists()).toBe(false);
  });
});
