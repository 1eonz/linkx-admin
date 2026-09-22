/**
 * 自定义 Base64 编码（浏览器原生 btoa，处理 UTF-8 字符）
 */
function base64Encode(str: string): string {
  // 处理 UTF-8 字符（中文等），避免 btoa 报 INVALID_CHARACTER_ERR
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * 自定义 Base64 解码（浏览器原生 atob，处理 UTF-8 字符）
 */
function base64Decode(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * 加密身份证号
 * @param idCard 身份证号码
 * @returns 加密后的字符串
 */
export function encryptIdCard(idCard: string): string {
  if (!idCard) return '';
  const reversed = idCard.split('').reverse().join('');
  return base64Encode(reversed);
}

/**
 * 解密身份证号
 * @param encrypted 加密后的字符串
 * @returns 原始身份证号码
 */
export function decryptIdCard(encrypted: string | null): string {
  if (!encrypted) return '';
  try {
    const decoded = base64Decode(encrypted);
    return decoded.split('').reverse().join('');
  } catch {
    return '';
  }
}
