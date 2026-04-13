import { useCallback } from 'react';

import { useLanguage } from '@/app/contexts/LanguageContext';
import { getTranslation } from '@/locales';
import type { TranslationKey } from '@/locales';

export function useTranslation() {
  const { locale } = useLanguage();

  /** Stabilní reference – bez useCallback by se měnil každý render a rozbíjel useEffect([..., t]). */
  const t = useCallback(
    (key: TranslationKey): string => {
      return getTranslation(locale, key);
    },
    [locale]
  );

  return { t, locale };
}
