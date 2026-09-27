import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  applyLoginLicenseWarning,
  attachResponseHeaders,
  httpService,
  isBinaryPayload,
  isCurrentAuthRequest,
} from '@/utils/http';
import { endSession } from '@/utils/session';

vi.mock('element-plus', () => ({ ElMessage: vi.fn() }));
vi.mock('@/router', () => ({ default: { replace: vi.fn() }, resetRouter: vi.fn() }));
vi.mock('@/utils/session', () => ({ endSession: vi.fn(() => Promise.resolve()) }));

const endSessionMock = vi.mocked(endSession);

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('authentication HTTP response handling', () => {
  it('keeps binary download responses intact', () => {
    const payload = new ArrayBuffer(4);

    expect(isBinaryPayload(payload)).toBe(true);
    expect(attachResponseHeaders(payload, { traceId: 'test' })).toBe(payload);
    expect((payload as ArrayBuffer & { headers?: unknown }).headers).toBeUndefined();
  });

  it('adds response headers only to business response objects', () => {
    const payload = { code: 0, data: 'ok' };

    attachResponseHeaders(payload, { traceId: 'test' });

    expect(payload).toMatchObject({ headers: { traceId: 'test' } });
  });

  it('keeps the password-expiry message while preserving the license warning', () => {
    const response = { code: 121, msg: '10 days', data: null };
    const encoded = btoa(String.fromCharCode(...new TextEncoder().encode('License 提醒')));
    applyLoginLicenseWarning(response, encoded);

    expect(response.msg).toBe('10 days');
    expect(response.licenseWarning).toBe('License 提醒');
  });

  it('does not let a stale 401 from a prior account end the current session', () => {
    expect(isCurrentAuthRequest('old-token', 'new-token')).toBe(false);
    expect(isCurrentAuthRequest('current-token', 'current-token')).toBe(true);
  });

  it('ends a current session before rejecting 401 and restores the prompt gate', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => (key === 'vue_admin_template_token' ? 'current-token' : null),
    });

    let firstError: unknown;
    const firstRequest = httpService.get('/expired', {
      adapter: (config) => {
        firstError = { config, response: { status: 401, data: {} } };
        return Promise.reject(firstError);
      },
    });

    const firstFailure = await firstRequest.catch((error: unknown) => error);
    expect(firstFailure).toBe(firstError);
    expect(endSessionMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);

    let secondError: unknown;
    const secondRequest = httpService.get('/expired-again', {
      adapter: (config) => {
        secondError = { config, response: { status: 401, data: {} } };
        return Promise.reject(secondError);
      },
    });

    const secondFailure = await secondRequest.catch((error: unknown) => error);
    expect(secondFailure).toBe(secondError);
    expect(endSessionMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1000);
  });

  it('cancels the actual Axios request through abortFetch', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null });
    const request = httpService.get('/slow', {
      adapter: (config) =>
        new Promise((_resolve, reject) => {
          config.signal?.addEventListener('abort', () => reject(new axios.CanceledError()));
        }),
    });

    await Promise.resolve();
    request.abortFetch();

    await expect(request).rejects.toMatchObject({ code: 'ERR_CANCELED' });
  });
});
