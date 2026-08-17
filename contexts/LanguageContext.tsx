import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { resolveAppLocaleFromSystem } from '@/utils/resolveAppLocale';

const LOCALE_KEY = '@app_locale';
const LOCALE_SOURCE_KEY = '@app_locale_source';

export type Locale = 'cs' | 'en' | 'uk';

type LocaleSource = 'user' | 'system';

/** Fallback, když systém nevrátí podporovaný jazyk. */
export const DEFAULT_LOCALE: Locale = 'cs';

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

async function readStoredLocaleSource(): Promise<LocaleSource | null> {
  const raw = await AsyncStorage.getItem(LOCALE_SOURCE_KEY).catch(() => null);
  return raw === 'user' || raw === 'system' ? raw : null;
}

async function persistLocale(next: Locale, source: LocaleSource): Promise<void> {
  await AsyncStorage.multiSet([
    [LOCALE_KEY, next],
    [LOCALE_SOURCE_KEY, source],
  ]).catch(() => {});
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [stored, source] = await Promise.all([
        AsyncStorage.getItem(LOCALE_KEY).catch(() => null),
        readStoredLocaleSource(),
      ]);

      if (cancelled) return;

      if (source === 'user' && (stored === 'cs' || stored === 'en' || stored === 'uk')) {
        setLocaleState(stored);
        return;
      }

      const systemLocale = resolveAppLocaleFromSystem();
      setLocaleState(systemLocale);
      await persistLocale(systemLocale, 'system');
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const syncSystemLocale = () => {
      void (async () => {
        const source = await readStoredLocaleSource();
        if (source === 'user') return;

        const systemLocale = resolveAppLocaleFromSystem();
        setLocaleState((prev) => {
          if (prev === systemLocale) return prev;
          void persistLocale(systemLocale, 'system');
          return systemLocale;
        });
      })();
    };

    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') syncSystemLocale();
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    void persistLocale(next, 'user');
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next: Locale = prev === 'cs' ? 'en' : prev === 'en' ? 'uk' : 'cs';
      void persistLocale(next, 'user');
      return next;
    });
  }, []);

  const value: LanguageContextType = { locale, setLocale, toggleLocale };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
