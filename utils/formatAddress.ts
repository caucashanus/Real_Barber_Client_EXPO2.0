/**
 * Odstraní české PSČ z adresy (formáty "123 45" i "12345"), jak vrací API.
 */
export function stripCzechPostalCodeFromAddress(raw: string): string {
  if (!raw?.trim()) return raw;

  let s = raw.replace(/\u00a0/g, ' ').trim();

  s = s
    .replace(/,\s*\d{3}\s*\d{2}\s+/g, ', ')
    .replace(/,\s*\d{3}\s*\d{2}\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/,\s*,/g, ', ')
    .replace(/^\s*,\s*/, '')
    .replace(/,\s*$/g, '')
    .trim();

  return s;
}
