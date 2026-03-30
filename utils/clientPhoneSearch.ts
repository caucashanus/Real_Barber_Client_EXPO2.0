/**
 * Normalizace pro vyhledávání klienta podle telefonu: jen číslice,
 * odstranění úvodních 00, úvodní 0 u domácího tvaru 0XXXXXXXXX.
 */
export function normalizePhoneDigitsForLookup(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('00')) {
    d = d.slice(2);
  }
  if (d.length === 10 && d.startsWith('0')) {
    d = d.slice(1);
  }
  return d;
}

/**
 * Kompletní číslo pro CZ: 9 číslic (národní) nebo 420 + 9 číslic.
 */
export function isCompleteCzPhoneForClientLookup(digits: string): boolean {
  if (digits.length === 9 && /^[1-9]\d{8}$/.test(digits)) {
    return true;
  }
  if (digits.length === 12 && /^420[1-9]\d{8}$/.test(digits)) {
    return true;
  }
  return false;
}

/** Řetězec dotazu pro API (číslice, vždy s předvolbou 420). */
export function toClientSearchPhoneQuery(digits: string): string {
  if (digits.length === 12 && digits.startsWith('420')) {
    return digits;
  }
  if (digits.length === 9 && /^[1-9]\d{8}$/.test(digits)) {
    return `420${digits}`;
  }
  return digits;
}
