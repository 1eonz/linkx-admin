import CryptoJS from 'crypto-js';

// 密钥
const SECRET_KEY = '8Jq4TvRz1WnXcY7bP9oK2mL6QvAsDfGhN1jUx3Zc5B6Y8tW0eRq==';

/**
 * 加密 JSON 对象为字符串
 * @param jsonObj 要加密的对象或字符串
 * @returns 加密后的密文
 */
export function encryptJson(jsonObj: unknown): string {
  try {
    const jsonString = typeof jsonObj === 'string' ? jsonObj : JSON.stringify(jsonObj);
    return CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
  } catch (error) {
    console.error('❌ 加密失败：', error);
    throw error;
  }
}

/**
 * 解密字符串为 JSON 对象
 * @param encryptedStr 加密后的字符串
 * @returns 解析后的对象，失败返回 null
 */
export function decryptJson<T = unknown>(encryptedStr: string | null): T | null {
  if (!encryptedStr) return null;
  try {
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedStr, SECRET_KEY);
    const decryptedStr = decryptedBytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedStr) {
      console.error('❌ 解密失败：可能密钥错误或数据已损坏');
      return null;
    }
    return JSON.parse(decryptedStr) as T;
  } catch (error) {
    console.error('❌ 解密失败：', error);
    return null;
  }
}
