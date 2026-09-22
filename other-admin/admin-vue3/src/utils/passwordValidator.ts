/**
 * 密码验证工具函数
 */
import type { FormItemRule } from 'element-plus';

// 特殊字符正则：`~!@#$%^&*()-_=+\|[{}];:'",<.>/? 和空格
// 注意：] 放在字符类开始位置，\ 和 - 需要转义
const SPECIAL_CHAR_PATTERN = /[\]`~!@#$%^&*()\-_=+\\|[{};:'",<.>\/\? ]/;

/** 是否包含中文 */
export function hasChinese(str: string): boolean {
  return /[\u4E00-\u9FA5]/.test(str);
}

/** 是否包含小写字母 */
export function hasLowercase(str: string): boolean {
  return /[a-z]/.test(str);
}

/** 是否包含大写字母 */
export function hasUppercase(str: string): boolean {
  return /[A-Z]/.test(str);
}

/** 是否包含数字 */
export function hasNumber(str: string): boolean {
  return /[0-9]/.test(str);
}

/** 是否包含特殊字符（含空格） */
export function hasSpecialChar(str: string): boolean {
  return SPECIAL_CHAR_PATTERN.test(str);
}

/** 统计密码包含的字符类型数量（0-4） */
export function countCharTypes(str: string): number {
  return [hasLowercase(str), hasUppercase(str), hasNumber(str), hasSpecialChar(str)].filter(Boolean).length;
}

type I18nFn = (key: string) => string;

/**
 * 简单模式验证（返回错误信息，null表示验证通过）
 */
export function validateSimpleMode(value: string, i18n?: I18nFn): string | null {
  if (!value || value === '') {
    return i18n ? i18n('index.pass.enterNewPassTip') : '请输入新密码';
  }
  if (hasChinese(value)) {
    return i18n ? i18n('index.pass.passRuledCannotContainChineseCharacters') : '密码不能含有中文';
  }
  return null;
}

/**
 * 复杂模式验证（返回错误信息，null表示验证通过）
 */
export function validateComplexMode(value: string, username: string, i18n?: I18nFn): string | null {
  const simpleError = validateSimpleMode(value, i18n);
  if (simpleError) {
    return simpleError;
  }
  if (value.length < 8) {
    return i18n ? i18n('index.pass.passRuledLength') : '密码长度至少8位';
  }
  const typeCount = countCharTypes(value);
  if (typeCount < 2) {
    return i18n
      ? i18n('index.pass.passRuleAtLeastTwoTypes')
      : '密码必须包含小写字母、大写字母、数字、特殊字符中的至少两种';
  }
  if (value === username) {
    return i18n ? i18n('index.pass.passCannotEqualToUsername') : '密码不能和账号一样';
  }
  return null;
}

/**
 * 确认密码验证（返回错误信息，null表示验证通过）
 */
export function validateRepeatPassword(value: string, newPassword: string, i18n?: I18nFn): string | null {
  if (!value || value === '') {
    return i18n ? i18n('index.pass.enterNewPassAgainTip') : '请再次输入新密码';
  }
  if (value !== newPassword) {
    return i18n ? i18n('index.pass.passUnIdenticalTip') : '两次输入的密码不一致';
  }
  return null;
}

/**
 * 创建 Element Plus 表单验证器（简单模式）
 */
export function createSimpleValidator(i18n: I18nFn): FormItemRule['validator'] {
  return (_rule, value, callback) => {
    const error = validateSimpleMode(value as string, i18n);
    if (error) {
      callback(new Error(error));
    } else {
      callback();
    }
  };
}

/**
 * 创建 Element Plus 表单验证器（复杂模式）
 */
export function createComplexValidator(i18n: I18nFn, getUsername: () => string): FormItemRule['validator'] {
  return (_rule, value, callback) => {
    const username = getUsername();
    const error = validateComplexMode(value as string, username, i18n);
    if (error) {
      callback(new Error(error));
    } else {
      callback();
    }
  };
}

/**
 * 创建 Element Plus 表单验证器（确认密码）
 */
export function createRepeatValidator(i18n: I18nFn, getNewPassword: () => string): FormItemRule['validator'] {
  return (_rule, value, callback) => {
    const newPassword = getNewPassword();
    const error = validateRepeatPassword(value as string, newPassword, i18n);
    if (error) {
      callback(new Error(error));
    } else {
      callback();
    }
  };
}
