import { flushPromises, shallowMount } from '@vue/test-utils';
import { LxProTable } from 'lx-ui';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';

import ProTable from '@/components/ProTable/index.vue';

const Table = defineComponent({
  props: ['data'],
  methods: {
    getTableRef() {
      return this;
    },
  },
  template: '<div>{{ JSON.stringify(data) }}<slot name="empty" /></div>',
});
function mountTable(props: Record<string, unknown>) {
  return shallowMount(ProTable, {
    props: { columns: [{ prop: 'name', label: '名称' }], immediate: false, ...props },
    global: {
      stubs: { LxProTable: Table, ElTableColumn: true, ElEmpty: true, ElIcon: true },
      directives: { loading: () => {} },
    },
  });
}

describe('business table compatibility', () => {
  it('keeps an explicitly empty controlled dataset empty despite a remote response', async () => {
    const response = { code: 0, data: { records: [{ id: 1, name: 'server' }], total: 1 } };
    const wrapper = mountTable({ data: [], fetchApi: vi.fn().mockResolvedValue(response) });
    await wrapper.vm.refresh();
    expect(wrapper.findComponent(LxProTable).props('data')).toEqual([]);
    expect(wrapper.emitted('response')?.[0][0]).toEqual(response);
    wrapper.unmount();
  });

  it('refresh retains the page, init resets it, and page-size changes return to page 1', async () => {
    const fetchApi = vi.fn().mockResolvedValue({ code: 0, data: { records: [], total: 40 } });
    const wrapper = mountTable({ fetchApi, page: 3, limit: 10, searchParams: { name: 'query' } });
    await wrapper.vm.refresh();
    expect(fetchApi).toHaveBeenLastCalledWith({ name: 'query', pageNum: 3, pageSize: 10 });
    await wrapper.vm.init();
    expect(fetchApi).toHaveBeenLastCalledWith({ name: 'query', pageNum: 1, pageSize: 10 });
    await wrapper.vm.fetchPage(4, 20);
    expect(fetchApi).toHaveBeenLastCalledWith({ name: 'query', pageNum: 1, pageSize: 20 });
    wrapper.unmount();
  });

  it('cancellation aborts supported requests and ignores their late results', async () => {
    let resolve!: (value: unknown) => void;
    const abortFetch = vi.fn();
    const request = Object.assign(
      new Promise((r) => {
        resolve = r;
      }),
      { abortFetch },
    );
    const wrapper = mountTable({ fetchApi: () => request });
    const pending = wrapper.vm.refresh();
    wrapper.vm.cancelFetch();
    expect(abortFetch).toHaveBeenCalledOnce();
    resolve({ code: 0, data: [{ id: 'stale' }] });
    await pending;
    await flushPromises();
    expect(wrapper.emitted('response')).toBeUndefined();
    expect(wrapper.findComponent(LxProTable).props('data')).toEqual([]);
    wrapper.unmount();
  });

  it('does not replace successful rows with a business error response', async () => {
    const fetchApi = vi
      .fn()
      .mockResolvedValueOnce({ code: 0, data: [{ id: 1 }] })
      .mockResolvedValueOnce({ code: 9, msg: '权限不足' });
    const wrapper = mountTable({ fetchApi });
    await wrapper.vm.refresh();
    await wrapper.vm.refresh();
    expect(wrapper.findComponent(LxProTable).props('data')).toEqual([{ id: 1 }]);
    expect(wrapper.emitted('response')).toHaveLength(1);
    expect(wrapper.emitted('response-error')).toHaveLength(1);
    wrapper.unmount();
  });
});
