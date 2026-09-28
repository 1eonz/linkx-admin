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
    expect(fetchApi).toHaveBeenCalledWith({ keyword: '', pageNum: 1, pageSize: 10 }, expect.anything());
    expect(table.data.value).toEqual([{ id: 1, name: '服务端数据' }]);
    expect(table.total.value).toBe(1);
    wrapper.unmount();
  });

  it('取消后迟到的成功结果不会回写，并释放 loading', async () => {
    let resolveRequest!: (value: string) => void;
    let receivedSignal!: AbortSignal;
    const { state, wrapper } = mountUseFetch<string, [string]>({
      fetchFn: () => Promise.resolve('unused'),
      fetchFnWithSignal: (_key, signal) => {
        receivedSignal = signal;
        return new Promise<string>((resolve) => {
          resolveRequest = resolve;
        });
      },
    });

    const request = state.fetch('slow');
    await flushPromises();
    expect(receivedSignal.aborted).toBe(false);
    state.cancel();
    expect(receivedSignal.aborted).toBe(true);
    resolveRequest('迟到结果');

    await expect(request).resolves.toBeUndefined();
    expect(state.data.value).toBeUndefined();
    expect(state.loading.value).toBe(false);
    wrapper.unmount();
  });

  it('取消防抖调度时，所有等待中的 Promise 都会结束且不会发请求', async () => {
    const fetchFn = vi.fn().mockResolvedValue('不应发出');
    const { state, wrapper } = mountUseFetch({ fetchFn, debounceInterval: 20 });

    const first = state.fetch('first');
    const second = state.fetch('second');
    state.cancel();

    await expect(first).resolves.toBeUndefined();
    await expect(second).resolves.toBeUndefined();
    expect(fetchFn).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('取消会结束等待重试的请求，不等待重试间隔', async () => {
    let rejectObserved!: () => void;
    const failureObserved = new Promise<void>((resolve) => {
      rejectObserved = resolve;
    });
    const fetchFn = vi.fn().mockRejectedValue(new Error('暂时不可用'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { state, wrapper } = mountUseFetch({
      fetchFn,
      retryCount: 2,
      retryInterval: 60_000,
      onError: () => {
        rejectObserved();
        return false;
      },
    });

    const request = state.fetch();
    await failureObserved;
    await flushPromises();
    state.cancel();

    await expect(request).resolves.toBeUndefined();
    expect(fetchFn).toHaveBeenCalledOnce();
    expect(state.loading.value).toBe(false);
    consoleError.mockRestore();
    wrapper.unmount();
  });

  it('abortPrevious=false 时 cancel 仍中止全部活动请求', async () => {
    const signals: AbortSignal[] = [];
    const resolvers: Array<(value: string) => void> = [];
    const { state, wrapper } = mountUseFetch<string, [string]>({
      fetchFn: () => Promise.resolve('unused'),
      fetchFnWithSignal: (_key, signal) => {
        signals.push(signal);
        return new Promise<string>((resolve) => resolvers.push(resolve));
      },
      abortPrevious: false,
    });

    const first = state.fetch('first');
    const second = state.fetch('second');
    await flushPromises();
    expect(signals).toHaveLength(2);
    state.cancel();

    expect(signals.every((signal) => signal.aborted)).toBe(true);
    resolvers.forEach((resolve) => resolve('迟到结果'));
    await expect(Promise.all([first, second])).resolves.toEqual([undefined, undefined]);
    expect(state.data.value).toBeUndefined();
    wrapper.unmount();
  });
});
