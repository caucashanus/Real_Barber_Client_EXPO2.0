import {
  buildPhoneCountryCodeOptions,
  buildPhoneCountryFilterRows,
  buildProfileCountryOptions,
  findPhoneCountryByIso2,
  findPhoneCountryByValue,
  normalizeDialCode,
  phoneCountrySelectValueFromIso2,
  PHONE_COUNTRIES,
} from '@/utils/phoneCountryData';

/** Country code options for phone inputs (login, forgot password, etc.) */
export const COUNTRY_CODE_OPTIONS = buildPhoneCountryCodeOptions();

/** Ordered rows for filterCountries (priority block + abeceda). */
export const PHONE_COUNTRY_FILTER_ROWS = buildPhoneCountryFilterRows();

/** Country options for profile address (ISO3, same order as phone picker). */
export const COUNTRY_OPTIONS = buildProfileCountryOptions();

export {
  normalizeDialCode,
  findPhoneCountryByValue,
  findPhoneCountryByIso2,
  phoneCountrySelectValueFromIso2,
  PHONE_COUNTRIES,
};

export function formatPhoneDisplay(text: string): string {
  const cleaned = text.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})$/);
  if (match) return [match[1], match[2], match[3]].filter(Boolean).join(' ');
  return text;
}

export function digitsOnlyPhone(value: string): string {
  return value.replace(/\D/g, '');
}

export function buildFullPhone(countryCode: string, localPhone: string): string {
  return `${normalizeDialCode(countryCode)}${digitsOnlyPhone(localPhone)}`;
}

export interface PhoneValidationResult {
  valid: boolean;
  errorKey?: 'signupPhoneRequired' | 'signupPhoneInvalid';
}

/** Shared phone validation for auth screens (min 9 local digits). */
export function validatePhoneDigits(value: string, minDigits = 9): PhoneValidationResult {
  const digits = digitsOnlyPhone(value);
  if (digits.length === 0) {
    return { valid: false, errorKey: 'signupPhoneRequired' };
  }
  if (digits.length < minDigits) {
    return { valid: false, errorKey: 'signupPhoneInvalid' };
  }
  return { valid: true };
}

function normalizeLanguageKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** First grapheme from labels like `🇨🇿 +420` (same as phone prefix picker). */
export function extractCountryFlagEmoji(label: string): string {
  const trimmed = label.trim();
  const spaceIndex = trimmed.indexOf(' ');
  return spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex);
}

export function isoAlpha2ToFlagEmoji(iso2: string): string | null {
  const code = iso2.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return null;
  return String.fromCodePoint(...code.split('').map((char) => 0x1f1e6 + char.charCodeAt(0) - 65));
}

export function getCountryCodeFlagEmoji(countryCode: string): string | null {
  const row =
    findPhoneCountryByValue(countryCode) ??
    PHONE_COUNTRIES.find((entry) => entry.dialCode === normalizeDialCode(countryCode));
  if (!row) return null;
  return isoAlpha2ToFlagEmoji(row.iso2);
}

const ISO3_TO_DIAL_CODE = PHONE_COUNTRIES.reduce<Record<string, string>>((acc, row) => {
  acc[row.iso3.toLowerCase()] = row.dialCode;
  return acc;
}, {});

const LANGUAGE_TO_COUNTRY_CODE: Array<[string, string]> = [
  ['anglictina', '+44'],
  ['english', '+44'],
  ['nemcina', '+49'],
  ['german', '+49'],
  ['deutsch', '+49'],
  ['cestina', '+420'],
  ['czech', '+420'],
  ['slovencina', '+421'],
  ['slovak', '+421'],
  ['ukrajin', '+380'],
  ['ukrainian', '+380'],
  ['polstina', '+48'],
  ['polish', '+48'],
  ['rustina', '+7-RU'],
  ['russian', '+7-RU'],
  ['francouzstina', '+33'],
  ['french', '+33'],
  ['spanelsky', '+34'],
  ['spanish', '+34'],
  ['italstina', '+39-IT'],
  ['italian', '+39-IT'],
  ['portugal', '+351'],
  ['portuguese', '+351'],
  ['madarsky', '+36'],
  ['hungarian', '+36'],
  ['en', '+44'],
  ['de', '+49'],
  ['cs', '+420'],
  ['sk', '+421'],
  ['uk', '+380'],
  ['pl', '+48'],
  ['ru', '+7-RU'],
  ['fr', '+33'],
  ['es', '+34'],
  ['it', '+39-IT'],
  ['pt', '+351'],
  ['hu', '+36'],
];

export function getLanguageFlagEmoji(language: string): string | null {
  const trimmed = language.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('+')) {
    return getCountryCodeFlagEmoji(trimmed);
  }

  const normalized = normalizeLanguageKey(trimmed);
  if (!normalized) return null;

  if (normalized.length === 3 && ISO3_TO_DIAL_CODE[normalized]) {
    return getCountryCodeFlagEmoji(ISO3_TO_DIAL_CODE[normalized]);
  }

  const langTag = normalized.split(/[-_]/)[0];
  if (langTag && langTag !== normalized) {
    const fromTag = getLanguageFlagEmoji(langTag);
    if (fromTag) return fromTag;
  }

  const sorted = [...LANGUAGE_TO_COUNTRY_CODE].sort((a, b) => b[0].length - a[0].length);

  for (const [key, countryCode] of sorted) {
    if (normalized === key) return getCountryCodeFlagEmoji(countryCode);
  }

  for (const [key, countryCode] of sorted) {
    if (key.length >= 4 && normalized.includes(key)) {
      return getCountryCodeFlagEmoji(countryCode);
    }
  }

  for (const option of COUNTRY_CODE_OPTIONS) {
    if (normalizeLanguageKey(option.label) === normalized) {
      return extractCountryFlagEmoji(option.shortLabel ?? option.label);
    }
  }

  return null;
}
