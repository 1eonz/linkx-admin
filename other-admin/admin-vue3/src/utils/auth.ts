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
let passwordChangeToken: string | null = null;

export function getToken(): string | null {
  return localStorage.getItem(TokenKey);
}

/** 改密临时令牌仅供请求使用，不代表已登录。 */
export function getRequestToken(): string | null {
  return passwordChangeToken ?? getToken();
}

/** 114、115、137 状态的临时令牌只保存在当前页面内存中。 */
export function setPasswordChangeToken(token: string): void {
  passwordChangeToken = token;
}

export function setToken(token: string): void {
  passwordChangeToken = null;
  localStorage.setItem(TokenKey, token);
}

export function removeToken(): void {
  localStorage.removeItem(TokenKey);
}

export function removeUserId(): void {
  localStorage.removeItem(UserId);
}

export function removeUserName(): void {
  localStorage.removeItem(UserName);
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

/** 清除切换账号时不得继承的身份、权限和路由派生缓存。 */
export function clearAuthStorage(): void {
  passwordChangeToken = null;
  removeToken();
  removeButtons();
  removeUserId();
  removeUserName();
  removeIsAdmin();
  removeIdCardNum();
  removeLicenseAuth();
  localStorage.removeItem('hiddenGateWay');
  localStorage.removeItem('hiddenVehicle');
  sessionStorage.removeItem('gbId');
  sessionStorage.removeItem('supersetUrl');
}

/**
 * 递归收集指定 departmentCode 下所有子部门的 id（逗号拼接）
 * 注：依赖 H5 协同 API，需在外部注入避免循环依赖
 */
export type QueryDepartmentFn = (params: {
  parentCode: string;
}) => Promise<{ data?: Array<{ id: string; code: string }> }>;

export function getAllNodeIdByDepartmentId(
  departmentId: string,
  departmentCode: string,
  queryDepartment: QueryDepartmentFn,
): Promise<string> {
  const allIds: string[] = [departmentId];

  function fetchAndCollectIds(code: string): Promise<void> {
    return queryDepartment({ parentCode: code })
      .then((res) => {
        const departments = res?.data;
        if (!departments || departments.length === 0) return;

        return departments.reduce<Promise<void>>(
          (sequence, dept) =>
            sequence.then(() => {
              const { id, code: currentCode } = dept;
              if (id) allIds.push(id);
              if (currentCode) return fetchAndCollectIds(currentCode);
            }),
          Promise.resolve(),
        );
      })
      .catch((error) => {
        console.error(`查询部门失败，code = ${code}，错误：`, error);
      });
  }

  return fetchAndCollectIds(departmentCode).then(() => allIds.join(','));
}
