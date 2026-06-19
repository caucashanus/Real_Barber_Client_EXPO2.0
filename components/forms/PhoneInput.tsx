import React from 'react';
import { View } from 'react-native';

import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import {
  COUNTRY_CODE_OPTIONS,
  formatPhoneDisplay,
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
  return (
    <View className="mb-4">
      {label ? (
        <ThemedText variant="body" className="mb-1">
          {label}
        </ThemedText>
      ) : null}
      <View className="flex-row items-stretch gap-2">
        <View style={{ width: 100 }}>
          <Select
            options={COUNTRY_CODE_OPTIONS}
            value={countryCode}
            onChange={(v) => onCountryCodeChange(String(v))}
            placeholder="+420"
            variant="classic"
            className="mb-0"
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
