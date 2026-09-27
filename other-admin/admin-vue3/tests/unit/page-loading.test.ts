import { ElLoading } from 'element-plus';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getProcess } from '@/api/h5/collaboration';
import { pageLoadingUtils } from '@/utils/pageLoading';

vi.mock('@/api/h5/collaboration', () => ({ getProcess: vi.fn() }));

const getProcessApi = vi.mocked(getProcess);

describe('synchronization page loading', () => {
  const close = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    pageLoadingUtils.closePageLoading();
    getProcessApi.mockReset();
    vi.spyOn(ElLoading, 'service').mockReturnValue({ close } as unknown as ReturnType<typeof ElLoading.service>);
  });

  afterEach(() => {
    pageLoadingUtils.closePageLoading();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts polling after the initial request reports an active synchronization', async () => {
    getProcessApi.mockResolvedValue({ code: 0, msg: '', data: false });

    await pageLoadingUtils.openPageLoading();

    expect(getProcessApi).toHaveBeenCalledTimes(2);
    expect(pageLoadingUtils.loadingState).toBe(true);
    expect(ElLoading.service).toHaveBeenCalledTimes(1);
    pageLoadingUtils.closePageLoading();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('closes loading when polling reports that synchronization is complete', async () => {
    getProcessApi.mockResolvedValue({ code: 0, msg: '', data: true });
    pageLoadingUtils.shouldContinue = true;
    pageLoadingUtils.loadingState = true;
    pageLoadingUtils.loadingInstance = { close } as unknown as ReturnType<typeof ElLoading.service>;

    await pageLoadingUtils.openPageLoadingPolling();

    expect(pageLoadingUtils.loadingState).toBe(false);
    expect(close).toHaveBeenCalledTimes(1);
  });
});
