import type { Locale } from '@/contexts/LanguageContext';

export type GuideLocale = Locale;

export function toGuideLocale(locale: string | undefined): GuideLocale {
  if (locale === 'en' || locale === 'uk') return locale;
  return 'cs';
}
