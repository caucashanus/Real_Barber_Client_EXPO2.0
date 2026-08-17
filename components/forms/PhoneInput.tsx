import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { useTranslation } from '@/hooks/useTranslation';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import type { CountryFilterLocale } from '@/utils/filterCountries';
import { filterCountries } from '@/utils/filterCountries';
import type { PhoneCountrySelectOption } from '@/utils/phoneCountryData';
import {
  COUNTRY_CODE_OPTIONS,
  formatPhoneDisplay,
  PHONE_COUNTRY_FILTER_ROWS,
  validatePhoneDigits,
  type PhoneValidationResult,
} from '@/utils/phone';

interface PhoneInputProps {
  label?: string;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  error?: string;
  onValidate?: (result: PhoneValidationResult) => void;
  placeholder?: string;
}

export function validatePhoneField(value: string): PhoneValidationResult {
  return validatePhoneDigits(value);
}

function localizedCountryName(option: PhoneCountrySelectOption, locale: CountryFilterLocale): string {
  if (locale === 'cs') return option.nameCs;
  if (locale === 'uk') return option.nameUk;
  return option.nameEn;
}

function toSheetOption(option: PhoneCountrySelectOption, locale: CountryFilterLocale) {
  const name = localizedCountryName(option, locale);
  return {
    ...option,
    label: `${option.flag} ${name} ${option.dialCode}`,
    sheetFlag: option.flag,
    sheetName: name,
    sheetDial: option.dialCode,
  };
}

export default function PhoneInput({
  label,
  countryCode,
  onCountryCodeChange,
  phone,
  onPhoneChange,
  error,
  onValidate,
  placeholder = '123 456 789',
}: PhoneInputProps) {
  const { t, locale } = useTranslation();
  const filterLocale: CountryFilterLocale = locale;

  const countryOptions = useMemo(
    () => COUNTRY_CODE_OPTIONS.map((option) => toSheetOption(option, filterLocale)),
    [filterLocale]
  );

  const optionsByValue = useMemo(
    () => new Map(countryOptions.map((option) => [String(option.value), option])),
    [countryOptions]
  );

  const filterCountryOptions = useCallback(
    (query: string) => {
      const filtered = filterCountries(PHONE_COUNTRY_FILTER_ROWS, query, filterLocale);
      return filtered
        .map((row) => optionsByValue.get(row.value))
        .filter((option): option is (typeof countryOptions)[number] => option != null);
    },
    [filterLocale, optionsByValue]
  );

  return (
    <View className="mb-4">
      {label ? (
        <ThemedText className="mb-1 font-medium text-light-text dark:text-dark-text">
          {label}
        </ThemedText>
      ) : null}
      <View className="flex-row items-stretch gap-2">
        <View style={{ width: 100 }}>
          <Select
            options={countryOptions}
            value={countryCode}
            onChange={(v) => onCountryCodeChange(String(v))}
            placeholder="+420"
            variant="classic"
            className="mb-0"
            searchable
            sheetTitle={t('phoneCountrySheetTitle')}
            searchPlaceholder={t('phoneCountrySearchPlaceholder')}
            searchEmptyLabel={t('phoneCountrySearchEmpty')}
            filterOptions={(query) => filterCountryOptions(query)}
          />
        </View>
        <View className="flex-1">
          <Input
            value={phone}
            onChangeText={(text) => {
              const formatted = formatPhoneDisplay(text);
              onPhoneChange(formatted);
              if (error && onValidate) {
                onValidate(validatePhoneDigits(text));
              }
            }}
            error={error}
            keyboardType="phone-pad"
            placeholder={placeholder}
            autoComplete="tel"
            containerClassName="mb-0"
          />
        </View>
      </View>
    </View>
  );
}
