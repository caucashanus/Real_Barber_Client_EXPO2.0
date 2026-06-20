import React from 'react';
import { View } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import ThemedText from '@/components/ThemedText';
import SignupAvatarPicker, { type AvatarChoice } from '@/components/signup/SignupAvatarPicker';

interface SignupAvatarStepProps {
  avatarChoice: AvatarChoice;
  apiError: string;
  onAvatarChange: (choice: AvatarChoice) => void;
}

export default function SignupAvatarStep({
  avatarChoice,
  apiError,
  onAvatarChange,
}: SignupAvatarStepProps) {
  const { t } = useTranslation();

  return (
    <View className="px-6 pb-8 pt-4">
      <ThemedText className="text-2xl font-semibold text-light-text dark:text-dark-text">
        {t('signupStepAvatarTitle')}
      </ThemedText>
      <ThemedText className="mb-6 mt-1 text-base text-light-subtext dark:text-dark-subtext">
        {t('signupStepAvatarSubtitle')}
      </ThemedText>
      <SignupAvatarPicker
        value={avatarChoice}
        onChange={onAvatarChange}
        carouselHint={t('signupAvatarCarouselHint')}
      />
      {apiError ? (
        <ThemedText className="mt-4 text-sm text-red-500 dark:text-red-400">{apiError}</ThemedText>
      ) : null}
    </View>
  );
}
