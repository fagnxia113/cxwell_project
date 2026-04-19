import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const currentLanguage = i18n.resolvedLanguage || i18n.language;
  const isChinese = currentLanguage.startsWith('zh');

  const toggleLanguage = () => {
    const nextLang = isChinese ? 'en-US' : 'zh-CN';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
      title={isChinese ? t('common.switch_to_english') : t('common.switch_to_chinese')}
    >
      <Languages size={18} />
      <span>{isChinese ? 'EN' : '中'}</span>
    </button>
  );
};

export default LanguageSwitcher;
