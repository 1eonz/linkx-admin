import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, reactive } from 'vue';

import { useFetch, type UseFetchOptions, type UseFetchReturn } from '@/composables/useFetch';
import { useTable, type UseTableReturn } from '@/composables/useTable';

function mountUseFetch<TData, TParams extends unknown[]>(options: UseFetchOptions<TData, TParams>) {
  let state!: UseFetchReturn<TData, TParams>;
  const wrapper = mount(
    defineComponent({
      setup() {
        state = useFetch(options);
        return () => null;
      },
    }),
  );

  return { state, wrapper };
}

describe('useFetch Promise 链请求编排', () => {
  it('成功时更新数据并在 finally 释放 loading', async () => {
    const onFinally = vi.fn();
    const { state, wrapper } = mountUseFetch({
      fetchFn: vi.fn().mockResolvedValue({ count: 3 }),
      onFinally,
    });

    await expect(state.fetch()).resolves.toEqual({ count: 3 });
    expect(state.data.value).toEqual({ count: 3 });
    expect(state.loading.value).toBe(false);
    expect(onFinally).toHaveBeenCalledOnce();
    wrapper.unmount();
  });

  it('请求失败后按配置重试，并保留最终成功结果', async () => {
    const requestError = new Error('暂时不可用');
    const fetchFn = vi.fn().mockRejectedValueOnce(requestError).mockResolvedValueOnce(['恢复']);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { state, wrapper } = mountUseFetch({ fetchFn, retryCount: 1, retryInterval: 0 });

    await expect(state.fetch()).resolves.toEqual(['恢复']);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(state.data.value).toEqual(['恢复']);
    expect(state.error.value).toBeUndefined();
    expect(state.loading.value).toBe(false);
    consoleError.mockRestore();
    wrapper.unmount();
  });

  it('较新的请求开始后不再执行较早请求的等待重试', async () => {
    let rejectObserved!: () => void;
    const firstFailureObserved = new Promise<void>((resolve) => {
      rejectObserved = resolve;
    });
    const fetchFn = vi.fn().mockRejectedValueOnce(new Error('旧请求失败')).mockResolvedValueOnce('新请求结果');
    const { state, wrapper } = mountUseFetch({
      fetchFn,
      retryCount: 1,
      retryInterval: 5,
      onError: () => {
        rejectObserved();
        return false;
      },
    });

    const oldRequest = state.fetch('old');
    await firstFailureObserved;
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await expect(state.fetch('new')).resolves.toBe('新请求结果');
    await expect(oldRequest).resolves.toBeUndefined();
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(state.data.value).toBe('新请求结果');
    wrapper.unmount();
  });

  it('较早的请求晚返回时不覆盖较新的结果', async () => {
    let resolveOld!: (value: string) => void;
    let resolveNew!: (value: string) => void;
    const fetchFn = vi.fn((key: string) => {
      return new Promise<string>((resolve) => {
        if (key === 'old') resolveOld = resolve;
        else resolveNew = resolve;
      });
    });
    const { state, wrapper } = mountUseFetch<string, [string]>({ fetchFn });

    const oldRequest = state.fetch('old');
    const newRequest = state.fetch('new');
    await flushPromises();
    resolveNew('new result');
    await expect(newRequest).resolves.toBe('new result');
    resolveOld('old result');
    await expect(oldRequest).resolves.toBeUndefined();
    expect(state.data.value).toBe('new result');
    wrapper.unmount();
  });
});

describe('useTable Promise 链请求包装', () => {
  it('搜索后应用响应，并让乐观更新直接作用于公开数据', async () => {
    type Row = { id: number; name: string };
    let table!: UseTableReturn<Row, { keyword: string }>;
    const fetchApi = vi.fn().mockResolvedValue({
      data: { records: [{ id: 1, name: '服务端数据' }], total: 1 },
    });
    const wrapper = mount(
      defineComponent({
        setup() {
          const query = reactive({ keyword: '' });
          table = useTable<Row, typeof query>({ fetchApi, query, immediate: false });
          return () => null;
        },
      }),
    );

    table.mutate((rows) => [...rows, { id: 2, name: '本地新增' }]);
    expect(table.data.value).toEqual([{ id: 2, name: '本地新增' }]);

    await table.search();
    expect(fetchApi).toHaveBeenCalledWith({ keyword: '', pageNum: 1, pageSize: 10 });
    expect(table.data.value).toEqual([{ id: 1, name: '服务端数据' }]);
    expect(table.total.value).toBe(1);
    wrapper.unmount();
  });
});
