import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { keepalive } from '@/api/user';
import { useUserStore } from '@/store/modules/useUserStore';
import { HEARTBEAT_INTERVAL, startSessionMonitoring, stopSessionMonitoring } from '@/utils/session';

vi.mock('@/api/user', () => ({ keepalive: vi.fn() }));
vi.mock('@/router', () => ({ default: { replace: vi.fn() } }));
vi.mock('@/store/modules/useKeepAliveStore', () => ({ useKeepAliveStore: () => ({ clearCachedViews: vi.fn() }) }));
vi.mock('@/store/modules/useUserStore', () => ({ useUserStore: vi.fn() }));

const keepaliveApi = vi.mocked(keepalive);
const userStore = vi.mocked(useUserStore);

describe('session monitoring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    userStore.mockReturnValue({ token: 'first-token', logoutAction: vi.fn() } as never);
    keepaliveApi.mockResolvedValue({ code: 0, msg: '', data: null } as never);
  });

  afterEach(() => {
    stopSessionMonitoring();
    vi.useRealTimers();
  });

  it('replaces the old heartbeat when monitoring starts again and stops it on logout', async () => {
    startSessionMonitoring();
    startSessionMonitoring();

    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL);
    expect(keepaliveApi).toHaveBeenCalledTimes(1);

    stopSessionMonitoring();
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL * 2);
    expect(keepaliveApi).toHaveBeenCalledTimes(1);
  });

  it('ignores a failed heartbeat returned for a prior account', async () => {
    const store = { token: 'first-token', logoutAction: vi.fn() };
    userStore.mockReturnValue(store as never);
    let complete!: (value: unknown) => void;
    keepaliveApi.mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }) as never,
    );

    startSessionMonitoring();
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL);
    store.token = 'second-token';
    complete({ code: 401, msg: 'expired', data: null });
    await Promise.resolve();

    expect(store.logoutAction).not.toHaveBeenCalled();
  });
});
