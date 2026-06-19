import React from 'react';
import { View } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import { COUNTRY_CODE_OPTIONS, formatPhoneDisplay } from '@/utils/phone';

interface SignupPhoneStepProps {
  countryCode: string;
  phone: string;
  phoneError: string;
  onCountryCodeChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onPhoneValidate: (value: string) => void;
}

export default function SignupPhoneStep({
  countryCode,
  phone,
  phoneError,
  onCountryCodeChange,
  onPhoneChange,
  onPhoneValidate,
}: SignupPhoneStepProps) {
  const { t } = useTranslation();

  return (
    <View className="px-6 pb-8 pt-4">
      <ThemedText variant="h2">
        {t('signupStepPhoneTitle')}
      </ThemedText>
      <ThemedText className="mb-6 mt-1 text-base text-light-subtext dark:text-dark-subtext">
        {t('signupStepPhoneSubtitle')}
      </ThemedText>
      <ThemedText variant="body" className="mb-1">
        {t('signupPhoneLabel')}
      </ThemedText>
      <View className="mb-4 flex-row items-stretch gap-2">
        <View className="w-[100px]">
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
              onPhoneChange(formatPhoneDisplay(text));
              if (phoneError) onPhoneValidate(text);
            }}
            error={phoneError}
            keyboardType="phone-pad"
            placeholder="123 456 789"
            autoComplete="tel"
            containerClassName="mb-0"
          />
        </View>
      </View>
    </View>
  );
}
