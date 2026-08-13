import type { Locale } from '@/contexts/LanguageContext';
import { DEFAULT_LOCALE } from '@/contexts/LanguageContext';

export const SUPPORTED_APP_LOCALES: readonly Locale[] = ['cs', 'en'];

export function resolveLocaleFromLanguageCode(code: string | null | undefined): Locale | null {
  if (!code) return null;
  const lower = code.toLowerCase();
  if (lower === 'cs' || lower.startsWith('cs-')) return 'cs';
  if (lower === 'en' || lower.startsWith('en-')) return 'en';
  return null;
}

export function resolveAppLocaleFromLanguageCodes(
  codes: readonly (string | null | undefined)[]
): Locale {
  for (const code of codes) {
    const resolved = resolveLocaleFromLanguageCode(code);
    if (resolved) return resolved;
  }
  return DEFAULT_LOCALE;
}

/** Bezpečně načte languageCode ze systému (lazy require + fallback). */
export function getSystemLanguageCodes(): (string | null | undefined)[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Localization = require('expo-localization') as typeof import('expo-localization');
    return Localization.getLocales().map((tag) => tag.languageCode);
  } catch {
    return [];
  }
}

/** Mapuje systémové / per-app locale na podporovaný jazyk appky. */
export function resolveAppLocaleFromSystem(): Locale {
  const codes = getSystemLanguageCodes();
  if (codes.length === 0) return DEFAULT_LOCALE;
  return resolveAppLocaleFromLanguageCodes(codes);
}
