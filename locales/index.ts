import { cs } from './cs';
import { en } from './en';
import { uk } from './uk';

import type { Locale } from '@/contexts/LanguageContext';

export type { TranslationKey } from './en';
export type TranslateFn = (key: import('./en').TranslationKey) => string;
export { en, cs, uk };

const translations: Record<Locale, Record<string, string>> = {
  en: { ...en },
  cs: { ...cs },
  uk: { ...uk },
};

export function getTranslation(locale: Locale, key: string): string {
  const dict = translations[locale];
  if (dict && key in dict) return dict[key];
  const fallback = translations.en;
  return (fallback && fallback[key]) ?? key;
}
