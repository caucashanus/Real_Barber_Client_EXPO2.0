import React from 'react';
import { View } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';

interface SignupNameStepProps {
  firstName: string;
  lastName: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
}

export default function SignupNameStep({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
}: SignupNameStepProps) {
  const { t } = useTranslation();

  return (
    <View className="px-6 pb-8 pt-4">
      <ThemedText className="mb-1 text-3xl font-bold text-light-text dark:text-dark-text">
        {t('signupCreateAccount')}
      </ThemedText>
      <ThemedText className="mb-6 text-light-subtext dark:text-dark-subtext">
        {t('signupCreateAccountDesc')}
      </ThemedText>
      <Input
        label={t('editProfileFirstName')}
        value={firstName}
        onChangeText={onFirstNameChange}
        autoCapitalize="words"
        containerClassName="mb-4"
      />
      <Input
        label={t('editProfileLastName')}
        value={lastName}
        onChangeText={onLastNameChange}
        autoCapitalize="words"
        containerClassName="mb-4"
      />
    </View>
  );
}
