import React, { createContext, useContext, useEffect, useState } from 'react';
import { I18nService } from '../core/i18n/i18nService';
import { useRouter } from 'next/router';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, string>) => string;
  availableLanguages: { code: string; name: string }[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  availableLanguages: []
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const router = useRouter();
  const i18n = I18nService.getInstance();

  useEffect(() => {
    // Initialize from cookie or browser language
    const savedLang = document.cookie
      .split('; ')
      .find(row => row.startsWith('i18n_lang='))
      ?.split('=')[1];

    const browserLang = navigator.language.split('-')[0];
    const initialLang = savedLang || (i18n.getAvailableLanguages().some(l => l.code === browserLang) 
      ? browserLang 
      : 'en');
    
    changeLanguage(initialLang);
  }, []);

  const changeLanguage = (lang: string) => {
    i18n.setLanguage(lang as any);
    setLanguage(lang);
    document.cookie = `i18n_lang=${lang}; path=/; max-age=${60 * 60 * 24 * 365}`;
    
    // Update Next.js locale for routing
    if (router.locale !== lang) {
      router.push(router.pathname, router.asPath, { locale: lang });
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: changeLanguage,
        t: i18n.t.bind(i18n),
        availableLanguages: i18n.getAvailableLanguages()
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);