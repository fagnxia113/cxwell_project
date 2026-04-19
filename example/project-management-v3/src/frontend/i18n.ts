import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

const STORAGE_KEY = 'i18nextLng';

const normalizeLanguage = (language?: string): 'zh-CN' | 'en-US' => {
  if (language?.toLowerCase().startsWith('zh')) {
    return 'zh-CN';
  }
  return 'en-US';
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      'en-US': { translation: enUS },
      'zh': { translation: zhCN },
      'en': { translation: enUS }
    },
    lng: 'zh-CN',
    supportedLngs: ['zh-CN', 'en-US', 'zh', 'en'],
    nonExplicitSupportedLngs: true,
    fallbackLng: 'zh-CN',
    returnNull: false,
    returnEmptyString: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
      convertDetectedLanguage: (language: string) => normalizeLanguage(language)
    }
  });

i18n.on('languageChanged', (language) => {
  const normalizedLanguage = normalizeLanguage(language);
  if (normalizedLanguage !== language) {
    void i18n.changeLanguage(normalizedLanguage);
    return;
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = normalizedLanguage;
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, normalizedLanguage);
  }
});

export default i18n;
