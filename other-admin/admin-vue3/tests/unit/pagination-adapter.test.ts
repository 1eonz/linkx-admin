import { shallowMount } from '@vue/test-utils';
import { LxPagination } from 'lx-ui';
import { describe, expect, it } from 'vitest';

import Pagination from '@/components/Pagination/index.vue';

describe('Pagination lx-ui adapter', () => {
  it('maps legacy defaults and preserves page, limit and pagination event contracts', async () => {
    const wrapper = shallowMount(Pagination, { props: { total: 85 } });
    const region = wrapper.get('[role="region"]');
    const pagination = wrapper.getComponent(LxPagination);

    expect(region.attributes('tabindex')).toBe('0');
    expect(region.attributes('aria-label')).toBe('列表分页，可横向滚动查看全部控件');
    expect(pagination.props()).toMatchObject({
      page: 1,
      pageSize: 20,
      total: 85,
      pageSizes: [10, 20, 50, 100],
      layout: 'total, sizes, prev, pager, next, jumper',
      background: true,
      autoScroll: false,
    });

    await pagination.vm.$emit('update:page', 4);
    await pagination.vm.$emit('change', 4, 20);
    await pagination.vm.$emit('update:page-size', 50);
    await pagination.vm.$emit('update:page', 1);
    await pagination.vm.$emit('change', 1, 50);

    expect(wrapper.emitted('update:page')).toEqual([[4], [1]]);
    expect(wrapper.emitted('update:limit')).toEqual([[50]]);
    expect(wrapper.emitted('pagination')).toEqual([[{ page: 4, limit: 20 }], [{ page: 1, limit: 50 }]]);
    wrapper.unmount();
  });

  it('keeps the legacy hidden flag and accepts a caller-supplied layout', () => {
    const wrapper = shallowMount(Pagination, {
      props: {
        total: 0,
        hidden: true,
        layout: 'prev, pager, next',
        background: false,
      },
    });
    const pagination = wrapper.getComponent(LxPagination);

    expect(wrapper.get('.pagination-wrapper').attributes('style')).toContain('display: none');
    expect(pagination.props('layout')).toBe('prev, pager, next');
    expect(pagination.props('background')).toBe(false);
    expect(pagination.props('autoScroll')).toBe(false);
    wrapper.unmount();
  });
});
