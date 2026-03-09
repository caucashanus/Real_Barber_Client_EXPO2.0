import { useLanguage } from '@/app/contexts/LanguageContext';
import { getTranslation } from '@/locales';
import type { TranslationKey } from '@/locales';

export function useTranslation() {
  const { locale } = useLanguage();

  function t(key: TranslationKey): string {
    return getTranslation(locale, key);
  }

  return { t, locale };
}
