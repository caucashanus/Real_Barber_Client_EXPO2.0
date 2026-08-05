import type { Locale } from '@/contexts/LanguageContext';

export function formatTravelDistanceMeters(meters: number, locale: Locale): string {
  const m = Math.max(0, Math.round(meters));
  if (m < 1000) {
    return `${m} m`;
  }

  const km = m / 1000;
  const rounded = Math.round(km * 10) / 10;
  const text =
    Number.isInteger(rounded) || Math.abs(rounded - Math.round(rounded)) < 0.05
      ? String(Math.round(rounded))
      : rounded.toFixed(1);

  const localized = locale === 'en' ? text : text.replace('.', ',');
  return `${localized} km`;
}
