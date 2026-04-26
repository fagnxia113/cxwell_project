import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import zh-CN modules
import zhAuth from './locales/zh-CN/auth.json';
import zhCommon from './locales/zh-CN/common.json';
import zhSidebar from './locales/zh-CN/sidebar.json';
import zhDashboard from './locales/zh-CN/dashboard.json';
import zhApprovals from './locales/zh-CN/approvals.json';
import zhWorkflow from './locales/zh-CN/workflow.json';
import zhPersonnel from './locales/zh-CN/personnel.json';
import zhProject from './locales/zh-CN/project.json';
import zhOrganization from './locales/zh-CN/organization.json';
import zhKnowledge from './locales/zh-CN/knowledge.json';
import zhNotifications from './locales/zh-CN/notifications.json';
import zhApiSettings from './locales/zh-CN/api_settings.json';

// Import en-US modules
import enAuth from './locales/en-US/auth.json';
import enCommon from './locales/en-US/common.json';
import enSidebar from './locales/en-US/sidebar.json';
import enDashboard from './locales/en-US/dashboard.json';
import enApprovals from './locales/en-US/approvals.json';
import enWorkflow from './locales/en-US/workflow.json';
import enPersonnel from './locales/en-US/personnel.json';
import enProject from './locales/en-US/project.json';
import enOrganization from './locales/en-US/organization.json';
import enKnowledge from './locales/en-US/knowledge.json';
import enNotifications from './locales/en-US/notifications.json';
import enApiSettings from './locales/en-US/api_settings.json';

const STORAGE_KEY = 'i18nextLng';

const normalizeLanguage = (language?: string): 'zh-CN' | 'en-US' => {
  if (language?.toLowerCase().startsWith('zh')) {
    return 'zh-CN';
  }
  return 'en-US';
};

// Combine modules for zh-CN
const zhCN = {
  login: zhAuth,
  auth: zhAuth, // Alias
  common: zhCommon,
  sidebar: zhSidebar,
  dashboard: zhDashboard,
  approvals: zhApprovals,
  workflow: zhWorkflow,
  personnel: zhPersonnel,
  project: zhProject,
  organization: zhOrganization,
  knowledge: zhKnowledge,
  notification: zhNotifications,
  notification_center: zhNotifications, // Alias
  notifications: zhNotifications, // Alias
  ...zhApiSettings
};

// Combine modules for en-US
const enUS = {
  login: enAuth,
  auth: enAuth, // Alias
  common: enCommon,
  sidebar: enSidebar,
  dashboard: enDashboard,
  approvals: enApprovals,
  workflow: enWorkflow,
  personnel: enPersonnel,
  project: enProject,
  organization: enOrganization,
  knowledge: enKnowledge,
  notification: enNotifications,
  notification_center: enNotifications, // Alias
  notifications: enNotifications, // Alias
  ...enApiSettings
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
