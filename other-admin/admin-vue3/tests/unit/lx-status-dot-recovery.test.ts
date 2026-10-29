import { flushPromises, mount } from '@vue/test-utils';
import type { LxStatus } from 'lx-ui';
import { describe, expect, it, vi } from 'vitest';

import Recovery from '../../../../linkx-fe/src/components/LxStatusDot/demo/recovery.vue';

function pending() {
  let resolve: (value: LxStatus | null) => void = () => {};
  const promise = new Promise<LxStatus | null>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('状态点宿主恢复示例', () => {
  it.each([
    ['busy', '忙碌'],
    ['processing', '处理中'],
    ['offline', '离线'],
    ['error', '错误'],
  ] as const)('返回%s时不错误播报恢复在线', async (status, label) => {
    const wrapper = mount(Recovery, { props: { loadStatus: () => Promise.resolve(status) } });
    try {
      await wrapper.get('button').trigger('click');
      await flushPromises();
      expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe(label);
      expect(wrapper.get('[role="status"]').text()).toBe('状态已更新。');
    } finally {
      wrapper.unmount();
    }
  });

  it('加载期间锁定重复刷新，成功后释放并更新状态', async () => {
    const request = pending();
    const adapter = vi.fn(() => request.promise);
    const wrapper = mount(Recovery, { props: { loadStatus: adapter } });
    try {
      await wrapper.get('button').trigger('click');
      await wrapper.get('button').trigger('click');
      await flushPromises();
      expect(adapter).toHaveBeenCalledOnce();
      expect(wrapper.attributes('aria-busy')).toBe('true');
      request.resolve('online');
      await flushPromises();
      expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('在线');
      expect(wrapper.attributes('aria-busy')).toBe('false');
    } finally {
      wrapper.unmount();
    }
  });

  it('同步适配器异常也保留上次状态并提供可恢复提示', async () => {
    const wrapper = mount(Recovery, {
      props: {
        loadStatus: () => {
          throw new Error('读取失败，请重试');
        },
      },
    });
    try {
      await wrapper.get('button').trigger('click');
      await flushPromises();
      expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('错误');
      expect(wrapper.get('[role="status"]').text()).toBe('读取失败，请重试');
      expect(wrapper.attributes('aria-busy')).toBe('false');
    } finally {
      wrapper.unmount();
    }
  });

  it('取消立即释放并允许重试，忽略信号的旧适配器不能覆盖新结果或解除新锁', async () => {
    const old = pending();
    const fresh = pending();
    const adapter = vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise);
    const wrapper = mount(Recovery, { props: { loadStatus: adapter } });
    try {
      await wrapper.get('button').trigger('click');
      await flushPromises();
      await wrapper.findAll('button')[1].trigger('click');
      expect(wrapper.attributes('aria-busy')).toBe('false');
      await wrapper.get('button').trigger('click');
      await flushPromises();
      old.resolve('online');
      await flushPromises();
      expect(wrapper.attributes('aria-busy')).toBe('true');
      expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('错误');
      fresh.resolve('busy');
      await flushPromises();
      expect(wrapper.attributes('aria-busy')).toBe('false');
      expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('忙碌');
    } finally {
      wrapper.unmount();
    }
  });

  it('空结果明确展示暂无状态，成功可恢复', async () => {
    const adapter = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce('online');
    const wrapper = mount(Recovery, { props: { loadStatus: adapter } });
    try {
      await wrapper.get('button').trigger('click');
      await flushPromises();
      expect(wrapper.get('[data-testid="status-recovery-result"]').text()).toBe('暂无节点状态');
      await wrapper.get('button').trigger('click');
      await flushPromises();
      expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('在线');
    } finally {
      wrapper.unmount();
    }
  });

  it('卸载取消注入请求，迟到的结果不产生后续读取', async () => {
    const request = pending();
    const adapter = vi.fn((_signal: AbortSignal) => request.promise);
    const wrapper = mount(Recovery, { props: { loadStatus: adapter } });
    await wrapper.get('button').trigger('click');
    await flushPromises();
    const signal = adapter.mock.calls[0][0];
    wrapper.unmount();
    expect(signal.aborted).toBe(true);
    request.resolve('online');
    await flushPromises();
    expect(adapter).toHaveBeenCalledOnce();
  });
});
