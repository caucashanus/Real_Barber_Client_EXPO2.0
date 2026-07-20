/** Country code options for phone inputs (login, forgot password, etc.) */
export const COUNTRY_CODE_OPTIONS = [
  { value: '+420', label: '🇨🇿 +420' },
  { value: '+421', label: '🇸🇰 +421' },
  { value: '+48', label: '🇵🇱 +48' },
  { value: '+49', label: '🇩🇪 +49' },
  { value: '+43', label: '🇦🇹 +43' },
  { value: '+33', label: '🇫🇷 +33' },
  { value: '+39', label: '🇮🇹 +39' },
  { value: '+34', label: '🇪🇸 +34' },
  { value: '+31', label: '🇳🇱 +31' },
  { value: '+32', label: '🇧🇪 +32' },
  { value: '+41', label: '🇨🇭 +41' },
  { value: '+44', label: '🇬🇧 +44' },
  { value: '+36', label: '🇭🇺 +36' },
  { value: '+30', label: '🇬🇷 +30' },
  { value: '+351', label: '🇵🇹 +351' },
  { value: '+353', label: '🇮🇪 +353' },
  { value: '+45', label: '🇩🇰 +45' },
  { value: '+46', label: '🇸🇪 +46' },
  { value: '+47', label: '🇳🇴 +47' },
  { value: '+358', label: '🇫🇮 +358' },
  { value: '+7', label: '🇷🇺 +7' },
  { value: '+380', label: '🇺🇦 +380' },
  { value: '+1', label: '🇺🇸 +1' },
  { value: '+52', label: '🇲🇽 +52' },
  { value: '+55', label: '🇧🇷 +55' },
  { value: '+54', label: '🇦🇷 +54' },
  { value: '+56', label: '🇨🇱 +56' },
  { value: '+57', label: '🇨🇴 +57' },
  { value: '+58', label: '🇻🇪 +58' },
  { value: '+51', label: '🇵🇪 +51' },
  { value: '+90', label: '🇹🇷 +90' },
  { value: '+972', label: '🇮🇱 +972' },
  { value: '+971', label: '🇦🇪 +971' },
  { value: '+20', label: '🇪🇬 +20' },
  { value: '+27', label: '🇿🇦 +27' },
  { value: '+91', label: '🇮🇳 +91' },
  { value: '+86', label: '🇨🇳 +86' },
  { value: '+81', label: '🇯🇵 +81' },
  { value: '+82', label: '🇰🇷 +82' },
  { value: '+60', label: '🇲🇾 +60' },
  { value: '+65', label: '🇸🇬 +65' },
  { value: '+66', label: '🇹🇭 +66' },
  { value: '+84', label: '🇻🇳 +84' },
  { value: '+61', label: '🇦🇺 +61' },
  { value: '+64', label: '🇳🇿 +64' },
  { value: '+234', label: '🇳🇬 +234' },
  { value: '+254', label: '🇰🇪 +254' },
  { value: '+212', label: '🇲🇦 +212' },
];

/** Country options for profile (same order as COUNTRY_CODE_OPTIONS, value = ISO 3-letter code, label = flag + code) */
export const COUNTRY_OPTIONS = [
  { value: 'CZE', label: '🇨🇿 CZE' },
  { value: 'SVK', label: '🇸🇰 SVK' },
  { value: 'POL', label: '🇵🇱 POL' },
  { value: 'DEU', label: '🇩🇪 DEU' },
  { value: 'AUT', label: '🇦🇹 AUT' },
  { value: 'FRA', label: '🇫🇷 FRA' },
  { value: 'ITA', label: '🇮🇹 ITA' },
  { value: 'ESP', label: '🇪🇸 ESP' },
  { value: 'NLD', label: '🇳🇱 NLD' },
  { value: 'BEL', label: '🇧🇪 BEL' },
  { value: 'CHE', label: '🇨🇭 CHE' },
  { value: 'GBR', label: '🇬🇧 GBR' },
  { value: 'HUN', label: '🇭🇺 HUN' },
  { value: 'GRC', label: '🇬🇷 GRC' },
  { value: 'PRT', label: '🇵🇹 PRT' },
  { value: 'IRL', label: '🇮🇪 IRL' },
  { value: 'DNK', label: '🇩🇰 DNK' },
  { value: 'SWE', label: '🇸🇪 SWE' },
  { value: 'NOR', label: '🇳🇴 NOR' },
  { value: 'FIN', label: '🇫🇮 FIN' },
  { value: 'RUS', label: '🇷🇺 RUS' },
  { value: 'UKR', label: '🇺🇦 UKR' },
  { value: 'USA', label: '🇺🇸 USA' },
  { value: 'MEX', label: '🇲🇽 MEX' },
  { value: 'BRA', label: '🇧🇷 BRA' },
  { value: 'ARG', label: '🇦🇷 ARG' },
  { value: 'CHL', label: '🇨🇱 CHL' },
  { value: 'COL', label: '🇨🇴 COL' },
  { value: 'VEN', label: '🇻🇪 VEN' },
  { value: 'PER', label: '🇵🇪 PER' },
  { value: 'TUR', label: '🇹🇷 TUR' },
  { value: 'ISR', label: '🇮🇱 ISR' },
  { value: 'ARE', label: '🇦🇪 ARE' },
  { value: 'EGY', label: '🇪🇬 EGY' },
  { value: 'ZAF', label: '🇿🇦 ZAF' },
  { value: 'IND', label: '🇮🇳 IND' },
  { value: 'CHN', label: '🇨🇳 CHN' },
  { value: 'JPN', label: '🇯🇵 JPN' },
  { value: 'KOR', label: '🇰🇷 KOR' },
  { value: 'MYS', label: '🇲🇾 MYS' },
  { value: 'SGP', label: '🇸🇬 SGP' },
  { value: 'THA', label: '🇹🇭 THA' },
  { value: 'VNM', label: '🇻🇳 VNM' },
  { value: 'AUS', label: '🇦🇺 AUS' },
  { value: 'NZL', label: '🇳🇿 NZL' },
  { value: 'NGA', label: '🇳🇬 NGA' },
  { value: 'KEN', label: '🇰🇪 KEN' },
  { value: 'MAR', label: '🇲🇦 MAR' },
];

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
  return `${countryCode}${digitsOnlyPhone(localPhone)}`;
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

export function getCountryCodeFlagEmoji(countryCode: string): string | null {
  const option = COUNTRY_CODE_OPTIONS.find((row) => row.value === countryCode);
  return option ? extractCountryFlagEmoji(option.label) : null;
}

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
  ['rustina', '+7'],
  ['russian', '+7'],
  ['francouzstina', '+33'],
  ['french', '+33'],
  ['spanelsky', '+34'],
  ['spanish', '+34'],
  ['italstina', '+39'],
  ['italian', '+39'],
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
  ['ru', '+7'],
  ['fr', '+33'],
  ['es', '+34'],
  ['it', '+39'],
  ['pt', '+351'],
  ['hu', '+36'],
];

export function getLanguageFlagEmoji(language: string): string | null {
  const normalized = normalizeLanguageKey(language);
  if (!normalized) return null;

  const sorted = [...LANGUAGE_TO_COUNTRY_CODE].sort((a, b) => b[0].length - a[0].length);

  for (const [key, countryCode] of sorted) {
    if (normalized === key) return getCountryCodeFlagEmoji(countryCode);
  }

  for (const [key, countryCode] of sorted) {
    if (key.length >= 4 && normalized.includes(key)) {
      return getCountryCodeFlagEmoji(countryCode);
    }
  }

  return null;
}
