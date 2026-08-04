export type CountryFilterLocale = 'cs' | 'en' | 'uk';

export interface CountryFilterRow {
  value: string;
  dialCode: string;
  iso2: string;
  nameCs: string;
  nameEn: string;
  nameUk: string;
  priority: number | null;
}

/** Trim, lowercase, strip diacritics (recko → řecko, CESKO → cesko). */
export function normalizeCountrySearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function dialDigitsFromQuery(query: string): string {
  const trimmed = query.trim();
  const source = trimmed.startsWith('+') ? trimmed.slice(1) : trimmed;
  return source.replace(/\D/g, '');
}

function localizedName(row: CountryFilterRow, locale: CountryFilterLocale): string {
  if (locale === 'cs') return row.nameCs;
  if (locale === 'uk') return row.nameUk;
  return row.nameEn;
}

function sortByLocaleName(
  a: CountryFilterRow,
  b: CountryFilterRow,
  locale: CountryFilterLocale
): number {
  const tag = locale === 'cs' ? 'cs' : locale === 'uk' ? 'uk' : 'en';
  return localizedName(a, locale).localeCompare(localizedName(b, locale), tag);
}

function countryMatchesQuery(
  row: CountryFilterRow,
  query: string,
  locale: CountryFilterLocale
): boolean {
  const normalized = normalizeCountrySearchText(query);
  const dialDigits = dialDigitsFromQuery(query);

  if (normalized) {
    const nameLocal = normalizeCountrySearchText(localizedName(row, locale));
    if (nameLocal.includes(normalized)) return true;

    if (locale !== 'cs') {
      const nameCs = normalizeCountrySearchText(row.nameCs);
      if (nameCs.includes(normalized)) return true;
    }

    const iso = row.iso2.toLowerCase();
    if (iso.includes(normalized)) return true;
  }

  if (dialDigits.length > 0) {
    const dial = row.dialCode.replace(/\D/g, '');
    if (dial.includes(dialDigits)) return true;
  }

  return false;
}

/**
 * Filtr zemí pro picker předvolby.
 * Prázdný query → celý seznam (priority nahoře, zbytek abecedně — pořadí vstupu).
 * Aktivní search → flat list dle locale, bez priority sekcí.
 */
export function filterCountries(
  countries: CountryFilterRow[],
  query: string,
  locale: CountryFilterLocale
): CountryFilterRow[] {
  if (!query.trim()) {
    return countries;
  }

  const matched = countries.filter((row) => countryMatchesQuery(row, query, locale));
  return [...matched].sort((a, b) => sortByLocaleName(a, b, locale));
}
