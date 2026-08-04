import { describe, expect, it } from 'vitest';

import { filterCountries, normalizeCountrySearchText } from '@/utils/filterCountries';
import { PHONE_COUNTRY_FILTER_ROWS } from '@/utils/phone';

describe('filterCountries', () => {
  it('normalizes diacritics', () => {
    expect(normalizeCountrySearchText('  Řecko  ')).toBe('recko');
    expect(normalizeCountrySearchText('CESKO')).toBe('cesko');
  });

  it('returns full ordered list for empty query', () => {
    const all = filterCountries(PHONE_COUNTRY_FILTER_ROWS, '', 'cs');
    expect(all.length).toBe(PHONE_COUNTRY_FILTER_ROWS.length);
    expect(all[0]?.iso2).toBe('CZ');
  });

  it('matches czech name without diacritics', () => {
    const result = filterCountries(PHONE_COUNTRY_FILTER_ROWS, 'recko', 'cs');
    expect(result.some((row) => row.iso2 === 'GR')).toBe(true);
  });

  it('matches dial digits', () => {
    expect(
      filterCountries(PHONE_COUNTRY_FILTER_ROWS, '420', 'cs').some((row) => row.iso2 === 'CZ')
    ).toBe(true);
    expect(
      filterCountries(PHONE_COUNTRY_FILTER_ROWS, '+49', 'cs').some((row) => row.iso2 === 'DE')
    ).toBe(true);
  });

  it('matches iso code', () => {
    expect(
      filterCountries(PHONE_COUNTRY_FILTER_ROWS, 'cz', 'cs').some((row) => row.iso2 === 'CZ')
    ).toBe(true);
  });

  it('returns flat alphabetically sorted results when searching', () => {
    const result = filterCountries(PHONE_COUNTRY_FILTER_ROWS, 'slov', 'cs');
    expect(result.length).toBeGreaterThan(0);
    const names = result.map((row) => row.nameCs);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, 'cs'));
    expect(names).toEqual(sorted);
  });

  it('returns empty for nonsense query', () => {
    expect(filterCountries(PHONE_COUNTRY_FILTER_ROWS, 'zzzznotacountry', 'cs')).toEqual([]);
  });
});
