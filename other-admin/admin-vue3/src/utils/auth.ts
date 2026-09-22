import type { LicenseAuth } from '#/license';
import { encryptJson, decryptJson } from './crypto';
import { encryptIdCard, decryptIdCard } from './secure';

// localStorage Key 常量
const TokenKey = 'vue_admin_template_token';
const Buttons = 'buttons';
const UserName = 'back_username';
const IsAdmin = 'is_admin';
const IdCardNum = 'id_card_num';
const UserId = 'back_user_id';
const licenseAuthKey = 'license_auth';

export function getToken(): string | null {
  return localStorage.getItem(TokenKey);
}

export function setToken(token: string): void {
  localStorage.setItem(TokenKey, token);
}

export function removeToken(): void {
  localStorage.removeItem(TokenKey);
}

export function getUserId(): string | null {
  return localStorage.getItem(UserId);
}

export function setUserId(userId: string): void {
  localStorage.setItem(UserId, userId);
}

export function setButtons(buttons: string[]): void {
  localStorage.setItem(Buttons, JSON.stringify(buttons));
}

export function removeButtons(): void {
  localStorage.removeItem(Buttons);
}

export function setUserName(username: string): void {
  localStorage.setItem(UserName, username);
}

export function getUserName(): string | null {
  return localStorage.getItem(UserName);
}

export function setIsAdmin(isAdmin: boolean): void {
  localStorage.setItem(IsAdmin, JSON.stringify(isAdmin));
}

export function setIdCardNum(idCardNum: string): void {
  localStorage.setItem(IdCardNum, encryptIdCard(idCardNum));
}

export function getIsAdmin(): boolean {
  const raw = localStorage.getItem(IsAdmin);
  if (raw === null) return false;
  try {
    return JSON.parse(raw) as boolean;
  } catch {
    return raw === 'true';
  }
}

export function getIdCardNum(): string {
  return decryptIdCard(localStorage.getItem(IdCardNum));
}

export function removeIsAdmin(): void {
  localStorage.removeItem(IsAdmin);
}

export function removeIdCardNum(): void {
  localStorage.removeItem(IdCardNum);
}

export function getLicenseAuth(): LicenseAuth | null {
  return decryptJson<LicenseAuth>(localStorage.getItem(licenseAuthKey));
}

export function setLicenseAuth(obj: LicenseAuth): void {
  localStorage.setItem(licenseAuthKey, encryptJson(JSON.stringify(obj)));
}

export function removeLicenseAuth(): void {
  localStorage.removeItem(licenseAuthKey);
}

/**
 * 递归收集指定 departmentCode 下所有子部门的 id（逗号拼接）
 * 注：依赖 H5 协同 API，需在外部注入避免循环依赖
 */
export type QueryDepartmentFn = (params: {
  parentCode: string;
}) => Promise<{ data?: Array<{ id: string; code: string }> }>;

export async function getAllNodeIdByDepartmentId(
  departmentId: string,
  departmentCode: string,
  queryDepartment: QueryDepartmentFn,
): Promise<string> {
  const allIds: string[] = [departmentId];

  async function fetchAndCollectIds(code: string): Promise<void> {
    try {
      const res = await queryDepartment({ parentCode: code });
      const departments = res?.data;
      if (!departments || departments.length === 0) return;

      for (const dept of departments) {
        const { id, code: currentCode } = dept;
        if (id) allIds.push(id);
        if (currentCode) await fetchAndCollectIds(currentCode);
      }
    } catch (error) {
      console.error(`查询部门失败，code = ${code}，错误：`, error);
    }
  }

  await fetchAndCollectIds(departmentCode);
  return allIds.join(',');
}
