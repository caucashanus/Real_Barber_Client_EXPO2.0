import React from 'react';
import { View } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import { Chip } from '@/components/Chip';
import ThemedText from '@/components/ThemedText';
import { DatePicker } from '@/components/forms/DatePicker';

interface SignupBirthdayStepProps {
  birthday: Date | null;
  minBirthDate: Date;
  maxBirthDate: Date;
  apiError: string;
  onBirthdayChange: (date: Date) => void;
  onSkip: () => void;
}

export default function SignupBirthdayStep({
  birthday,
  minBirthDate,
  maxBirthDate,
  apiError,
  onBirthdayChange,
  onSkip,
}: SignupBirthdayStepProps) {
  const { t } = useTranslation();

  return (
    <View className="px-6 pb-8 pt-4">
      <ThemedText className="text-2xl font-semibold text-light-text dark:text-dark-text">
        {t('signupStepBirthdayTitle')}
      </ThemedText>
      <ThemedText className="mb-2 mt-1 text-base text-light-subtext dark:text-dark-subtext">
        {t('signupStepBirthdaySubtitle')}
      </ThemedText>
      <ThemedText className="text-sm leading-5 text-light-subtext dark:text-dark-subtext">
        {t('signupStepBirthdayBenefits')}
      </ThemedText>
      <View className="mb-6 mt-4 self-start">
        <Chip label={t('multiStepSkip')} size="sm" onPress={onSkip} />
      </View>
      <DatePicker
        label={t('editProfileBirthday')}
        value={birthday ?? undefined}
        onChange={onBirthdayChange}
        maxDate={maxBirthDate}
        minDate={minBirthDate}
        variant="classic"
      />
      {apiError ? (
        <ThemedText className="mt-4 text-sm text-red-500 dark:text-red-400">{apiError}</ThemedText>
      ) : null}
    </View>
  );
}
