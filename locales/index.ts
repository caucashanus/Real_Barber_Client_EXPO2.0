import { en } from './en';
import { cs } from './cs';
import type { Locale } from '@/app/contexts/LanguageContext';

export type { TranslationKey } from './en';
export { en, cs };

const translations: Record<Locale, Record<string, string>> = {
  en: { ...en },
  cs: { ...cs },
};

export function getTranslation(locale: Locale, key: string): string {
  const dict = translations[locale];
  if (dict && key in dict) return dict[key];
  const fallback = translations.en;
  return (fallback && fallback[key]) ?? key;
}
