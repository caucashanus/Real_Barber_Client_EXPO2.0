import type { Locale } from '@/contexts/LanguageContext';

/** BCP 47 tag pro Intl / DateTimeFormat z app locale. */
export function intlLocaleTag(locale: Locale | string): string {
  if (locale === 'cs' || locale.startsWith('cs')) return 'cs-CZ';
  if (locale === 'uk' || locale.startsWith('uk')) return 'uk-UA';
  return 'en-GB';
}

/** BCP 47 pro localeCompare (Intl sort). */
export function localeCompareTag(locale: Locale): string {
  if (locale === 'cs') return 'cs';
  if (locale === 'uk') return 'uk';
  return 'en';
}

/** App locale z BCP 47 tagu (např. z dateLocaleTag ve flow). */
export function appLocaleFromIntlTag(tag: string): Locale {
  if (tag.startsWith('cs')) return 'cs';
  if (tag.startsWith('uk')) return 'uk';
  return 'en';
}
