import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getAuthImageBlob } from '@/api/authImage';
import { getToken } from '@/utils/auth';

vi.mock('@/utils/auth', () => ({ getToken: vi.fn() }));

const token = vi.mocked(getToken);
const fetchMock = vi.fn<typeof fetch>();

describe('authenticated image API', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_BASE_API', '/linkx/admin');
    vi.stubGlobal('fetch', fetchMock);
    token.mockReturnValue('mock-token');
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('maps static images through the API gateway and keeps the token in headers', async () => {
    const blob = new Blob(['image'], { type: 'image/png' });
    const signal = new AbortController().signal;
    fetchMock.mockResolvedValueOnce(new Response(blob, { status: 200 }));

    await expect(getAuthImageBlob('/static/avatar.png', signal)).resolves.toEqual(blob);

    expect(fetchMock).toHaveBeenCalledWith(
      '/linkx/admin/api/static/avatar.png',
      expect.objectContaining({
        headers: { Authorization: 'token mock-token' },
        signal,
      }),
    );
  });

  it('uses the configured API base for non-static image paths', async () => {
    const blob = new Blob(['image'], { type: 'image/png' });
    fetchMock.mockResolvedValueOnce(new Response(blob, { status: 200 }));

    await getAuthImageBlob('/files/avatar.png', new AbortController().signal);

    expect(fetchMock).toHaveBeenCalledWith('/linkx/admin/files/avatar.png', expect.any(Object));
  });

  it.each([
    'https://outside.example/avatar.png',
    '//outside.example/avatar.png',
    '\\\\outside.example\\avatar.png',
    ' https://outside.example/avatar.png',
  ])('rejects external image paths without sending the token: %s', async (authSrc) => {
    vi.stubEnv('VITE_BASE_API', '');

    await expect(getAuthImageBlob(authSrc, new AbortController().signal)).rejects.toThrow(
      '鉴权图片地址必须为站内相对路径',
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects non-success responses and omits Authorization when no token exists', async () => {
    token.mockReturnValue(null);
    fetchMock.mockResolvedValueOnce(new Response('forbidden', { status: 403 }));

    await expect(getAuthImageBlob('/static/avatar.png', new AbortController().signal)).rejects.toThrow(
      '鉴权图片请求失败，HTTP 403',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      '/linkx/admin/api/static/avatar.png',
      expect.objectContaining({ headers: undefined }),
    );
  });
});
