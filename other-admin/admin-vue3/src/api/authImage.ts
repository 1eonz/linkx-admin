import { getToken } from '@/utils/auth';

function buildAuthImageUrl(authSrc: string): string {
  if (authSrc.trim() !== authSrc || authSrc.includes('\\') || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(authSrc)) {
    throw new Error('鉴权图片地址必须为站内相对路径');
  }

  const baseUrl = import.meta.env.VITE_BASE_API ?? '';
  const requestPath = authSrc.startsWith('/static') ? `/api${authSrc}` : authSrc;
  return `${baseUrl}${requestPath}`;
}

/** 获取鉴权图片 Blob；Token 只放在请求头中，支持调用方取消请求。 */
export function getAuthImageBlob(authSrc: string, signal: AbortSignal): Promise<Blob> {
  const token = getToken();
  const headers = token ? { Authorization: `token ${token}` } : undefined;

  return Promise.resolve()
    .then(() => fetch(buildAuthImageUrl(authSrc), { headers, signal }))
    .then((response) => {
      if (!response.ok) {
        throw new Error(`鉴权图片请求失败，HTTP ${response.status}`);
      }
      return response.blob();
    });
}
