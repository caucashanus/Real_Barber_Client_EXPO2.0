export interface PhoneCountryRow {
  value: string;
  dialCode: string;
  iso2: string;
  iso3: string;
  nameCs: string;
  nameEn: string;
  nameUk: string;
  priority: number | null;
}

export interface PhoneCountrySelectOption {
  value: string;
  label: string;
  shortLabel: string;
  dialCode: string;
  iso2: string;
  iso3: string;
  nameCs: string;
  nameEn: string;
  nameUk: string;
  flag: string;
}

function isoAlpha2ToFlagEmoji(iso2: string): string {
  const code = iso2.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...code.split('').map((char) => 0x1f1e6 + char.charCodeAt(0) - 65));
}

function phoneCountryValue(dialCode: string, iso2: string, hasDialCollision: boolean): string {
  return hasDialCollision ? `${dialCode}-${iso2}` : dialCode;
}

function regionDisplayName(iso2: string, locale: 'en' | 'uk'): string {
  try {
    const tag = locale === 'uk' ? 'uk' : 'en';
    return new Intl.DisplayNames([tag], { type: 'region' }).of(iso2) ?? iso2;
  } catch {
    return iso2;
  }
}

const RAW_PHONE_COUNTRIES: Array<{
  dialCode: string;
  iso2: string;
  iso3: string;
  nameCs: string;
  priority: number | null;
}> = [
  { dialCode: '+420', iso2: 'CZ', iso3: 'CZE', nameCs: 'Česko', priority: 1 },
  { dialCode: '+421', iso2: 'SK', iso3: 'SVK', nameCs: 'Slovensko', priority: 2 },
  { dialCode: '+380', iso2: 'UA', iso3: 'UKR', nameCs: 'Ukrajina', priority: 3 },
  { dialCode: '+49', iso2: 'DE', iso3: 'DEU', nameCs: 'Německo', priority: 4 },
  { dialCode: '+44', iso2: 'GB', iso3: 'GBR', nameCs: 'Velká Británie', priority: 5 },
  { dialCode: '+43', iso2: 'AT', iso3: 'AUT', nameCs: 'Rakousko', priority: 6 },
  { dialCode: '+48', iso2: 'PL', iso3: 'POL', nameCs: 'Polsko', priority: 7 },
  { dialCode: '+36', iso2: 'HU', iso3: 'HUN', nameCs: 'Maďarsko', priority: 8 },
  { dialCode: '+40', iso2: 'RO', iso3: 'ROU', nameCs: 'Rumunsko', priority: 9 },
  { dialCode: '+39', iso2: 'IT', iso3: 'ITA', nameCs: 'Itálie', priority: 10 },
  { dialCode: '+33', iso2: 'FR', iso3: 'FRA', nameCs: 'Francie', priority: 11 },
  { dialCode: '+34', iso2: 'ES', iso3: 'ESP', nameCs: 'Španělsko', priority: 12 },
  { dialCode: '+31', iso2: 'NL', iso3: 'NLD', nameCs: 'Nizozemsko', priority: 13 },
  { dialCode: '+32', iso2: 'BE', iso3: 'BEL', nameCs: 'Belgie', priority: 14 },
  { dialCode: '+41', iso2: 'CH', iso3: 'CHE', nameCs: 'Švýcarsko', priority: 15 },
  { dialCode: '+1', iso2: 'US', iso3: 'USA', nameCs: 'USA', priority: 16 },
  { dialCode: '+1', iso2: 'CA', iso3: 'CAN', nameCs: 'Kanada', priority: 17 },
  { dialCode: '+93', iso2: 'AF', iso3: 'AFG', nameCs: 'Afghánistán', priority: null },
  { dialCode: '+355', iso2: 'AL', iso3: 'ALB', nameCs: 'Albánie', priority: null },
  { dialCode: '+213', iso2: 'DZ', iso3: 'DZA', nameCs: 'Alžírsko', priority: null },
  { dialCode: '+376', iso2: 'AD', iso3: 'AND', nameCs: 'Andorra', priority: null },
  { dialCode: '+244', iso2: 'AO', iso3: 'AGO', nameCs: 'Angola', priority: null },
  { dialCode: '+54', iso2: 'AR', iso3: 'ARG', nameCs: 'Argentina', priority: null },
  { dialCode: '+374', iso2: 'AM', iso3: 'ARM', nameCs: 'Arménie', priority: null },
  { dialCode: '+61', iso2: 'AU', iso3: 'AUS', nameCs: 'Austrálie', priority: null },
  { dialCode: '+973', iso2: 'BH', iso3: 'BHR', nameCs: 'Bahrajn', priority: null },
  { dialCode: '+880', iso2: 'BD', iso3: 'BGD', nameCs: 'Bangladéš', priority: null },
  { dialCode: '+387', iso2: 'BA', iso3: 'BIH', nameCs: 'Bosna a Hercegovina', priority: null },
  { dialCode: '+55', iso2: 'BR', iso3: 'BRA', nameCs: 'Brazílie', priority: null },
  { dialCode: '+359', iso2: 'BG', iso3: 'BGR', nameCs: 'Bulharsko', priority: null },
  { dialCode: '+375', iso2: 'BY', iso3: 'BLR', nameCs: 'Bělorusko', priority: null },
  { dialCode: '+56', iso2: 'CL', iso3: 'CHL', nameCs: 'Chile', priority: null },
  { dialCode: '+385', iso2: 'HR', iso3: 'HRV', nameCs: 'Chorvatsko', priority: null },
  { dialCode: '+45', iso2: 'DK', iso3: 'DNK', nameCs: 'Dánsko', priority: null },
  { dialCode: '+20', iso2: 'EG', iso3: 'EGY', nameCs: 'Egypt', priority: null },
  { dialCode: '+372', iso2: 'EE', iso3: 'EST', nameCs: 'Estonsko', priority: null },
  { dialCode: '+251', iso2: 'ET', iso3: 'ETH', nameCs: 'Etiopie', priority: null },
  { dialCode: '+63', iso2: 'PH', iso3: 'PHL', nameCs: 'Filipíny', priority: null },
  { dialCode: '+358', iso2: 'FI', iso3: 'FIN', nameCs: 'Finsko', priority: null },
  { dialCode: '+233', iso2: 'GH', iso3: 'GHA', nameCs: 'Ghana', priority: null },
  { dialCode: '+995', iso2: 'GE', iso3: 'GEO', nameCs: 'Gruzie', priority: null },
  { dialCode: '+502', iso2: 'GT', iso3: 'GTM', nameCs: 'Guatemala', priority: null },
  { dialCode: '+504', iso2: 'HN', iso3: 'HND', nameCs: 'Honduras', priority: null },
  { dialCode: '+852', iso2: 'HK', iso3: 'HKG', nameCs: 'Hongkong', priority: null },
  { dialCode: '+91', iso2: 'IN', iso3: 'IND', nameCs: 'Indie', priority: null },
  { dialCode: '+62', iso2: 'ID', iso3: 'IDN', nameCs: 'Indonésie', priority: null },
  { dialCode: '+353', iso2: 'IE', iso3: 'IRL', nameCs: 'Irsko', priority: null },
  { dialCode: '+964', iso2: 'IQ', iso3: 'IRQ', nameCs: 'Irák', priority: null },
  { dialCode: '+354', iso2: 'IS', iso3: 'ISL', nameCs: 'Island', priority: null },
  { dialCode: '+972', iso2: 'IL', iso3: 'ISR', nameCs: 'Izrael', priority: null },
  { dialCode: '+876', iso2: 'JM', iso3: 'JAM', nameCs: 'Jamajka', priority: null },
  { dialCode: '+81', iso2: 'JP', iso3: 'JPN', nameCs: 'Japonsko', priority: null },
  { dialCode: '+967', iso2: 'YE', iso3: 'YEM', nameCs: 'Jemen', priority: null },
  { dialCode: '+27', iso2: 'ZA', iso3: 'ZAF', nameCs: 'Jihoafrická republika', priority: null },
  { dialCode: '+82', iso2: 'KR', iso3: 'KOR', nameCs: 'Jižní Korea', priority: null },
  { dialCode: '+962', iso2: 'JO', iso3: 'JOR', nameCs: 'Jordánsko', priority: null },
  { dialCode: '+855', iso2: 'KH', iso3: 'KHM', nameCs: 'Kambodža', priority: null },
  { dialCode: '+237', iso2: 'CM', iso3: 'CMR', nameCs: 'Kamerun', priority: null },
  { dialCode: '+974', iso2: 'QA', iso3: 'QAT', nameCs: 'Katar', priority: null },
  { dialCode: '+7', iso2: 'KZ', iso3: 'KAZ', nameCs: 'Kazachstán', priority: null },
  { dialCode: '+254', iso2: 'KE', iso3: 'KEN', nameCs: 'Keňa', priority: null },
  { dialCode: '+383', iso2: 'XK', iso3: 'XKX', nameCs: 'Kosovo', priority: null },
  { dialCode: '+506', iso2: 'CR', iso3: 'CRI', nameCs: 'Kostarika', priority: null },
  { dialCode: '+53', iso2: 'CU', iso3: 'CUB', nameCs: 'Kuba', priority: null },
  { dialCode: '+965', iso2: 'KW', iso3: 'KWT', nameCs: 'Kuvajt', priority: null },
  { dialCode: '+357', iso2: 'CY', iso3: 'CYP', nameCs: 'Kypr', priority: null },
  { dialCode: '+996', iso2: 'KG', iso3: 'KGZ', nameCs: 'Kyrgyzstán', priority: null },
  { dialCode: '+856', iso2: 'LA', iso3: 'LAO', nameCs: 'Laos', priority: null },
  { dialCode: '+961', iso2: 'LB', iso3: 'LBN', nameCs: 'Libanon', priority: null },
  { dialCode: '+218', iso2: 'LY', iso3: 'LBY', nameCs: 'Libye', priority: null },
  { dialCode: '+370', iso2: 'LT', iso3: 'LTU', nameCs: 'Litva', priority: null },
  { dialCode: '+371', iso2: 'LV', iso3: 'LVA', nameCs: 'Lotyšsko', priority: null },
  { dialCode: '+352', iso2: 'LU', iso3: 'LUX', nameCs: 'Lucembursko', priority: null },
  { dialCode: '+853', iso2: 'MO', iso3: 'MAC', nameCs: 'Macao', priority: null },
  { dialCode: '+60', iso2: 'MY', iso3: 'MYS', nameCs: 'Malajsie', priority: null },
  { dialCode: '+356', iso2: 'MT', iso3: 'MLT', nameCs: 'Malta', priority: null },
  { dialCode: '+212', iso2: 'MA', iso3: 'MAR', nameCs: 'Maroko', priority: null },
  { dialCode: '+230', iso2: 'MU', iso3: 'MUS', nameCs: 'Mauricius', priority: null },
  { dialCode: '+52', iso2: 'MX', iso3: 'MEX', nameCs: 'Mexiko', priority: null },
  { dialCode: '+373', iso2: 'MD', iso3: 'MDA', nameCs: 'Moldavsko', priority: null },
  { dialCode: '+976', iso2: 'MN', iso3: 'MNG', nameCs: 'Mongolsko', priority: null },
  { dialCode: '+258', iso2: 'MZ', iso3: 'MOZ', nameCs: 'Mosambik', priority: null },
  { dialCode: '+95', iso2: 'MM', iso3: 'MMR', nameCs: 'Myanmar', priority: null },
  { dialCode: '+977', iso2: 'NP', iso3: 'NPL', nameCs: 'Nepál', priority: null },
  { dialCode: '+234', iso2: 'NG', iso3: 'NGA', nameCs: 'Nigerie', priority: null },
  { dialCode: '+47', iso2: 'NO', iso3: 'NOR', nameCs: 'Norsko', priority: null },
  { dialCode: '+64', iso2: 'NZ', iso3: 'NZL', nameCs: 'Nový Zéland', priority: null },
  { dialCode: '+968', iso2: 'OM', iso3: 'OMN', nameCs: 'Omán', priority: null },
  { dialCode: '+970', iso2: 'PS', iso3: 'PSE', nameCs: 'Palestina', priority: null },
  { dialCode: '+507', iso2: 'PA', iso3: 'PAN', nameCs: 'Panama', priority: null },
  { dialCode: '+51', iso2: 'PE', iso3: 'PER', nameCs: 'Peru', priority: null },
  { dialCode: '+225', iso2: 'CI', iso3: 'CIV', nameCs: 'Pobřeží slonoviny', priority: null },
  { dialCode: '+351', iso2: 'PT', iso3: 'PRT', nameCs: 'Portugalsko', priority: null },
  { dialCode: '+92', iso2: 'PK', iso3: 'PAK', nameCs: 'Pákistán', priority: null },
  { dialCode: '+7', iso2: 'RU', iso3: 'RUS', nameCs: 'Rusko', priority: null },
  { dialCode: '+966', iso2: 'SA', iso3: 'SAU', nameCs: 'Saúdská Arábie', priority: null },
  { dialCode: '+221', iso2: 'SN', iso3: 'SEN', nameCs: 'Senegal', priority: null },
  { dialCode: '+389', iso2: 'MK', iso3: 'MKD', nameCs: 'Severní Makedonie', priority: null },
  { dialCode: '+65', iso2: 'SG', iso3: 'SGP', nameCs: 'Singapur', priority: null },
  { dialCode: '+386', iso2: 'SI', iso3: 'SVN', nameCs: 'Slovinsko', priority: null },
  { dialCode: '+971', iso2: 'AE', iso3: 'ARE', nameCs: 'Spojené arabské emiráty', priority: null },
  { dialCode: '+94', iso2: 'LK', iso3: 'LKA', nameCs: 'Srí Lanka', priority: null },
  { dialCode: '+249', iso2: 'SD', iso3: 'SDN', nameCs: 'Súdán', priority: null },
  { dialCode: '+963', iso2: 'SY', iso3: 'SYR', nameCs: 'Sýrie', priority: null },
  { dialCode: '+886', iso2: 'TW', iso3: 'TWN', nameCs: 'Tchaj-wan', priority: null },
  { dialCode: '+66', iso2: 'TH', iso3: 'THA', nameCs: 'Thajsko', priority: null },
  { dialCode: '+868', iso2: 'TT', iso3: 'TTO', nameCs: 'Trinidad a Tobago', priority: null },
  { dialCode: '+216', iso2: 'TN', iso3: 'TUN', nameCs: 'Tunisko', priority: null },
  { dialCode: '+90', iso2: 'TR', iso3: 'TUR', nameCs: 'Turecko', priority: null },
  { dialCode: '+993', iso2: 'TM', iso3: 'TKM', nameCs: 'Turkmenistán', priority: null },
  { dialCode: '+992', iso2: 'TJ', iso3: 'TJK', nameCs: 'Tádžikistán', priority: null },
  { dialCode: '+998', iso2: 'UZ', iso3: 'UZB', nameCs: 'Uzbekistán', priority: null },
  { dialCode: '+39', iso2: 'VA', iso3: 'VAT', nameCs: 'Vatikán', priority: null },
  { dialCode: '+84', iso2: 'VN', iso3: 'VNM', nameCs: 'Vietnam', priority: null },
  { dialCode: '+263', iso2: 'ZW', iso3: 'ZWE', nameCs: 'Zimbabwe', priority: null },
  { dialCode: '+994', iso2: 'AZ', iso3: 'AZE', nameCs: 'Ázerbájdžán', priority: null },
  { dialCode: '+98', iso2: 'IR', iso3: 'IRN', nameCs: 'Írán', priority: null },
  { dialCode: '+382', iso2: 'ME', iso3: 'MNE', nameCs: 'Černá Hora', priority: null },
  { dialCode: '+86', iso2: 'CN', iso3: 'CHN', nameCs: 'Čína', priority: null },
  { dialCode: '+30', iso2: 'GR', iso3: 'GRC', nameCs: 'Řecko', priority: null },
  { dialCode: '+46', iso2: 'SE', iso3: 'SWE', nameCs: 'Švédsko', priority: null },
];

const DIAL_CODE_COLLISIONS = new Set<string>([
  '+1',
  '+7',
  '+39',
]);

export const PHONE_COUNTRIES: PhoneCountryRow[] = RAW_PHONE_COUNTRIES.map((row) => ({
  ...row,
  nameEn: regionDisplayName(row.iso2, 'en'),
  nameUk: regionDisplayName(row.iso2, 'uk'),
  value: phoneCountryValue(row.dialCode, row.iso2, DIAL_CODE_COLLISIONS.has(row.dialCode)),
}));

const PHONE_COUNTRY_BY_VALUE = new Map(PHONE_COUNTRIES.map((row) => [row.value, row]));

/** E.164 předvolba z hodnoty selectu (`+420`, `+1-US`, …). */
export function normalizeDialCode(selectValue: string): string {
  const trimmed = selectValue.trim();
  const suffixed = /^(\+\d+)-[A-Z]{2}$/.exec(trimmed);
  if (suffixed) return suffixed[1];
  return trimmed;
}

export function findPhoneCountryByValue(value: string): PhoneCountryRow | undefined {
  return PHONE_COUNTRY_BY_VALUE.get(value);
}

export function findPhoneCountryByIso2(iso2: string): PhoneCountryRow | undefined {
  const code = iso2.trim().toUpperCase();
  return PHONE_COUNTRIES.find((row) => row.iso2 === code);
}

export function phoneCountrySelectValueFromIso2(iso2: string, fallback = '+420'): string {
  return findPhoneCountryByIso2(iso2)?.value ?? fallback;
}

function buildPhoneCountryLabel(row: PhoneCountryRow, includeName: boolean): string {
  const flag = isoAlpha2ToFlagEmoji(row.iso2);
  const prefix = flag ? `${flag} ${row.dialCode}` : row.dialCode;
  return includeName ? `${prefix} · ${row.nameCs}` : prefix;
}

export function buildPhoneCountryFilterRows(): Array<
  Pick<
    PhoneCountryRow,
    'value' | 'dialCode' | 'iso2' | 'nameCs' | 'nameEn' | 'nameUk' | 'priority'
  >
> {
  const priority = PHONE_COUNTRIES.filter((row) => row.priority != null).sort(
    (a, b) => (a.priority ?? 0) - (b.priority ?? 0)
  );
  const rest = PHONE_COUNTRIES.filter((row) => row.priority == null).sort((a, b) =>
    a.nameCs.localeCompare(b.nameCs, 'cs')
  );

  return [...priority, ...rest].map((row) => ({
    value: row.value,
    dialCode: row.dialCode,
    iso2: row.iso2,
    nameCs: row.nameCs,
    nameEn: row.nameEn,
    nameUk: row.nameUk,
    priority: row.priority,
  }));
}

export function buildPhoneCountryCodeOptions(): PhoneCountrySelectOption[] {
  return buildPhoneCountryFilterRows().map((row) => {
    const fullRow = PHONE_COUNTRIES.find((c) => c.value === row.value)!;
    const flag = isoAlpha2ToFlagEmoji(row.iso2);
    const dial = row.dialCode;
    return {
      value: row.value,
      dialCode: dial,
      iso2: row.iso2,
      iso3: fullRow.iso3,
      nameCs: row.nameCs,
      nameEn: row.nameEn,
      nameUk: row.nameUk,
      flag,
      label: buildPhoneCountryLabel(fullRow, true),
      shortLabel: flag ? `${flag} ${dial}` : dial,
    };
  });
}

export function buildProfileCountryOptions(): Array<{ value: string; label: string }> {
  return buildPhoneCountryCodeOptions().map((row) => ({
    value: row.iso3,
    label: `${isoAlpha2ToFlagEmoji(row.iso2)} ${row.iso3}`,
  }));
}

