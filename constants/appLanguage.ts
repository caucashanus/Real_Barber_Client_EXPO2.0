import type { Locale } from '@/contexts/LanguageContext';

export const LOCALE_FLAG_CS = '🇨🇿';
export const LOCALE_FLAG_EN = '🇬🇧';

export interface AppLocaleItem {
  locale: Locale;
  flag: string;
  /** Nativní název — vždy stejný, nezávisle na UI jazyku. */
  label: string;
  /** Anglický podtitul — vždy stejný, nezávisle na UI jazyku. */
  subtitle: string;
}

/** Řádky jazyků ve draweru (web APP_LOCALE_ITEMS, bez uk). */
export const APP_LOCALE_ITEMS: readonly AppLocaleItem[] = [
  { locale: 'cs', flag: LOCALE_FLAG_CS, label: 'Čeština', subtitle: 'Czech' },
  { locale: 'en', flag: LOCALE_FLAG_EN, label: 'English', subtitle: 'International' },
] as const;

export function localeFlag(locale: Locale): string {
  return APP_LOCALE_ITEMS.find((item) => item.locale === locale)?.flag ?? LOCALE_FLAG_CS;
}
