import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import LxPagination from '../../../../linkx-fe/src/components/LxPagination/index.vue';

vi.mock('element-plus', async () => {
  const { defineComponent, h } = await import('vue');

  const ElPaginationStub = defineComponent({
    name: 'ElPagination',
    props: {
      currentPage: { type: Number, default: 1 },
      pageSize: { type: Number, default: 10 },
      pageSizes: { type: Array, default: () => [] },
      total: { type: Number, default: 0 },
      layout: { type: String, default: '' },
      background: { type: Boolean, default: false },
      small: { type: Boolean, default: false },
    },
    emits: ['update:current-page', 'update:page-size'],
    setup(props, { emit }) {
      return () =>
        h(
          'div',
          {
            class: ['el-pagination', props.background && 'is-background', props.small && 'is-small'],
            'data-current-page': String(props.currentPage),
            'data-page-size': String(props.pageSize),
            'data-page-sizes': JSON.stringify(props.pageSizes),
            'data-total': String(props.total),
            'data-layout': props.layout,
          },
          [
            h('button', { type: 'button', onClick: () => emit('update:current-page', 5) }, '切至第 5 页'),
            h('button', { type: 'button', onClick: () => emit('update:page-size', 20) }, '每页 20 条'),
          ],
        );
    },
  });

  return { ElPagination: ElPaginationStub };
});

function mountPagination(props: Record<string, unknown> = {}) {
  return mount(LxPagination, { props });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LxPagination', () => {
  it('builds the default layout from visibility props and forwards the controlled values', () => {
    const wrapper = mountPagination({ page: 3, pageSize: 20, total: 63 });
    const pagination = wrapper.get('.el-pagination');

    expect(pagination.attributes()).toMatchObject({
      'data-current-page': '3',
      'data-page-size': '20',
      'data-page-sizes': '[10,20,50,100]',
      'data-total': '63',
      'data-layout': 'total, sizes, prev, pager, next',
    });

    wrapper.unmount();
  });

  it('emits page updates before change and scrolls only when enabled', async () => {
    const events: string[] = [];
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const wrapper = mountPagination({
      page: 3,
      pageSize: 10,
      'onUpdate:page': (page: number) => events.push(`page:${page}`),
      onChange: (page: number, size: number) => events.push(`change:${page}:${size}`),
    });

    await wrapper.get('button').trigger('click');

    expect(events).toEqual(['page:5', 'change:5:10']);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    wrapper.unmount();
  });

  it('resets the page after a page-size update and reports events in order', async () => {
    const events: string[] = [];
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const wrapper = mountPagination({
      page: 4,
      pageSize: 10,
      'onUpdate:page-size': (size: number) => events.push(`size:${size}`),
      'onUpdate:page': (page: number) => events.push(`page:${page}`),
      onChange: (page: number, size: number) => events.push(`change:${page}:${size}`),
    });

    await wrapper.get('button:nth-of-type(2)').trigger('click');

    expect(events).toEqual(['size:20', 'page:1', 'change:1:20']);
    expect(scrollTo).toHaveBeenCalledOnce();
    wrapper.unmount();
  });

  it('preserves the current page without auto-reset and skips window scrolling when disabled', async () => {
    const events: string[] = [];
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const wrapper = mountPagination({
      page: 4,
      pageSize: 10,
      autoReset: false,
      autoScroll: false,
      'onUpdate:page-size': (size: number) => events.push(`size:${size}`),
      'onUpdate:page': (page: number) => events.push(`page:${page}`),
      onChange: (page: number, size: number) => events.push(`change:${page}:${size}`),
    });

    await wrapper.get('button:nth-of-type(2)').trigger('click');

    expect(events).toEqual(['size:20', 'change:4:20']);
    expect(scrollTo).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('supports an explicit layout, background buttons and compact size', () => {
    const wrapper = mountPagination({
      layout: 'total, prev, pager, next, jumper',
      background: true,
      size: 'small',
    });

    expect(wrapper.get('.el-pagination').classes()).toEqual(expect.arrayContaining(['is-background', 'is-small']));
    expect(wrapper.get('.el-pagination').attributes('data-layout')).toBe('total, prev, pager, next, jumper');
    wrapper.unmount();
  });
});
