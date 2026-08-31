import type { RbicekLocale } from '@/lib/rbicek/types';

export interface LocalizedWebUrls {
  webUrl?: string | null;
  webUrlEn?: string | null;
  webUrlUk?: string | null;
}

export function localizedWebUrl(
  urls: LocalizedWebUrls,
  locale: RbicekLocale,
  fallback = ''
): string {
  const cs = urls.webUrl?.trim() ?? '';
  const en = urls.webUrlEn?.trim() ?? '';
  const uk = urls.webUrlUk?.trim() ?? '';

  switch (locale) {
    case 'en':
      return en || cs || uk || fallback;
    case 'uk':
      return uk || cs || en || fallback;
    default:
      return cs || en || uk || fallback;
  }
}
