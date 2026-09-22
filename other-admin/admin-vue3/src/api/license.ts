import type { ApiResponse } from '#/axios';
import type { LicenseInfo } from '#/license';
import http from '@/utils/http';

/** 获取 License 信息 */
export function getLicenseInfo(): Promise<ApiResponse<LicenseInfo>> {
  return http.get('/api/msip/license/info');
}
