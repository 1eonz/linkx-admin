import { createI18n } from 'vue-i18n';

import cn from './lang/cn';
import en from './lang/en';

const storageKey = 'localLanguage';

function getDefaultLocale(): string {
  const saved = localStorage.getItem(storageKey);
  if (saved && ['cn', 'en'].includes(saved)) return saved;
  const browser = navigator.language.toLowerCase();
  if (browser.startsWith('zh')) return 'cn';
  if (browser.startsWith('en')) return 'en';
  return 'cn';
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: getDefaultLocale(),
  fallbackLocale: 'cn',
  messages: {
    cn: cn.message,
    en: en.message,
  },
});

export function setLanguage(lang: 'cn' | 'en'): void {
  i18n.global.locale.value = lang;
  localStorage.setItem(storageKey, lang);
}

export default i18n;
