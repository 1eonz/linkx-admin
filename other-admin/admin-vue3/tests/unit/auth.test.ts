import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearAuthStorage,
  getAllNodeIdByDepartmentId,
  getIsAdmin,
  getRequestToken,
  getToken,
  getUserId,
  getUserName,
  setButtons,
  setIdCardNum,
  setIsAdmin,
  setLicenseAuth,
  setPasswordChangeToken,
  setToken,
  setUserId,
  setUserName,
} from '@/utils/auth';
import type { QueryDepartmentFn } from '@/utils/auth';

describe('authentication storage', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, String(value)),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
    });
  });

  it('removes every account-scoped value during logout or account switching', () => {
    setToken('old-token');
    setUserId('42');
    setUserName('previous-user');
    setButtons(['person:create']);
    setIsAdmin(true);
    setIdCardNum('110101199001010001');
    setLicenseAuth({
      groupCollaborationAuth: true,
      taskCollaborationAuth: true,
      businessCollaborationAuth: true,
      AICollaborationAuth: true,
      northboundDataInterface: true,
      licenseState: 1,
    });

    clearAuthStorage();

    expect(getToken()).toBeNull();
    expect(getUserId()).toBeNull();
    expect(getUserName()).toBeNull();
    expect(getIsAdmin()).toBe(false);
    expect(localStorage.getItem('buttons')).toBeNull();
    expect(localStorage.getItem('id_card_num')).toBeNull();
    expect(localStorage.getItem('license_auth')).toBeNull();
  });

  it('keeps a forced-password-change token available to requests without granting a logged-in session', () => {
    setPasswordChangeToken('password-only-token');

    expect(getRequestToken()).toBe('password-only-token');
    expect(getToken()).toBeNull();

    clearAuthStorage();
    expect(getRequestToken()).toBeNull();
  });
});

describe('department traversal', () => {
  it('collects nested department IDs in depth-first order', async () => {
    const queriedCodes: string[] = [];
    const queryDepartment: QueryDepartmentFn = ({ parentCode }) => {
      queriedCodes.push(parentCode);
      if (parentCode === 'root') {
        return Promise.resolve({
          data: [
            { id: 'child-1', code: 'child' },
            { id: 'child-2', code: '' },
          ],
        });
      }
      return Promise.resolve({ data: [{ id: 'grandchild', code: '' }] });
    };

    await expect(getAllNodeIdByDepartmentId('root-id', 'root', queryDepartment)).resolves.toBe(
      'root-id,child-1,grandchild,child-2',
    );
    expect(queriedCodes).toEqual(['root', 'child']);
  });
});
