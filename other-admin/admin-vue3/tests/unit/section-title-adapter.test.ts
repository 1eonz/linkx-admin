import { mount } from '@vue/test-utils';
import { ElIcon } from 'lx-ui';
import type { LxSectionTitleHeadingLevel } from 'lx-ui';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import SectionTitle from '@/components/SectionTitle/index.vue';

const MapLocationIcon = defineComponent({
  name: 'MapLocation',
  render: () => h('span'),
});

describe('SectionTitle lx-ui adapter', () => {
  it('keeps the legacy dashed default and maps supported Element Plus icon names', () => {
    const wrapper = mount(SectionTitle, {
      props: { title: '地图配置', icon: MapLocationIcon },
      global: { components: { ElIcon } },
    });

    expect(wrapper.get('header').classes()).toContain('lx-section-title--dashed');
    expect(wrapper.get('h3').text()).toBe('地图配置');
    expect(wrapper.get('.lx-section-title__label').attributes('title')).toBe('地图配置');
    expect(wrapper.get('[data-icon-name="map-pin"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('forwards design size and tag props while keeping legacy title slots', () => {
    const headingLevel: LxSectionTitleHeadingLevel = 4;
    const wrapper = mount(SectionTitle, {
      props: {
        title: '基础信息档案',
        headingLevel,
        size: 'large',
        tag: '8 项字段',
        tagType: 'primary',
      },
      slots: { default: '<span>自定义标题</span>' },
      global: { components: { ElIcon } },
    });

    expect(wrapper.get('header').classes()).toContain('lx-section-title--large');
    expect(wrapper.get('h4').text()).toContain('自定义标题');
    expect(wrapper.get('.lx-section-title__label').attributes('title')).toBeUndefined();
    expect(wrapper.get('h4 .lx-tag').classes()).toContain('lx-tag--primary');
    wrapper.unmount();
  });

  it('forwards subtitle props and slots to lx-ui', () => {
    const propWrapper = mount(SectionTitle, {
      props: { title: '基础信息', subtitle: '配置说明' },
      global: { components: { ElIcon } },
    });
    const slotWrapper = mount(SectionTitle, {
      props: { title: '基础信息', subtitle: '旧说明' },
      slots: { subtitle: '<strong data-testid="subtitle-slot">自定义说明</strong>' },
      global: { components: { ElIcon } },
    });

    expect(propWrapper.get('.lx-section-title__subtitle').text()).toBe('配置说明');
    expect(slotWrapper.get('[data-testid="subtitle-slot"]').text()).toBe('自定义说明');
    propWrapper.unmount();
    slotWrapper.unmount();
  });

  it('lets the leading slot override mapped and fallback icons', () => {
    const wrapper = mount(SectionTitle, {
      props: { title: '自定义标题', icon: MapLocationIcon },
      slots: { leading: '<span data-testid="leading-slot">自定义图标</span>' },
      global: { components: { ElIcon } },
    });

    expect(wrapper.get('[data-testid="leading-slot"]').text()).toBe('自定义图标');
    expect(wrapper.find('[data-icon-name="map-pin"]').exists()).toBe(false);
    wrapper.unmount();
  });
});
