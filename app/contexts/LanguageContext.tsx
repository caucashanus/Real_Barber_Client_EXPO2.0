import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCALE_KEY = '@app_locale';

export type Locale = 'en' | 'cs';

/** Výchozí jazyk při prvním spuštění (žádná uložená volba v AsyncStorage). */
export const DEFAULT_LOCALE: Locale = 'cs';

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  /** Výchozí čeština; uložená volba v AsyncStorage má přednost. */
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_KEY).then((stored) => {
      if (stored === 'cs' || stored === 'en') {
        setLocaleState(stored);
      } else {
        setLocaleState(DEFAULT_LOCALE);
        AsyncStorage.setItem(LOCALE_KEY, DEFAULT_LOCALE).catch(() => {});
      }
    });
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    AsyncStorage.setItem(LOCALE_KEY, next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next = prev === 'en' ? 'cs' : 'en';
      AsyncStorage.setItem(LOCALE_KEY, next);
      return next;
    });
  }, []);

  const value: LanguageContextType = { locale, setLocale, toggleLocale };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
