import type { LicenseAuth } from '#/license';
import { useUserStore } from '@/store/modules/useUserStore';

/**
 * 异步获取 License 信息并写入 localStorage
 */
export async function getLicenseInfoUtil(): Promise<LicenseAuth> {
  return useUserStore().refreshLicenseAuthAction();
}
