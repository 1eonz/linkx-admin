import { mount } from '@vue/test-utils';
import { ElIcon } from 'lx-ui';
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
    expect(wrapper.get('[data-icon-name="map-pin"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('forwards design size and tag props while keeping legacy title slots', () => {
    const wrapper = mount(SectionTitle, {
      props: {
        title: '基础信息档案',
        size: 'large',
        tag: '8 项字段',
        tagType: 'primary',
      },
      slots: { default: '<span>自定义标题</span>' },
      global: { components: { ElIcon } },
    });

    expect(wrapper.get('header').classes()).toContain('lx-section-title--large');
    expect(wrapper.get('h3').text()).toContain('自定义标题');
    expect(wrapper.get('h3 .lx-tag').classes()).toContain('lx-tag--primary');
    wrapper.unmount();
  });
});
