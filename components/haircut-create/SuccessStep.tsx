import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import { View } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import ThemedText from '@/components/ThemedText';
import type { HaircutStepProps } from '@/components/haircut-create/types';

export default function SuccessStep(_props: HaircutStepProps) {
  const { t } = useTranslation();

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  return (
    <View className="flex-1 items-center justify-center p-8">
      <Image
        source={require('@/assets/img/gratulations.png')}
        className="h-32 w-32 rounded-lg"
        contentFit="cover"
      />
      <ThemedText className="mt-8 text-center text-3xl font-bold">
        {t('haircutCreateCongratulations')}
      </ThemedText>
      <ThemedText className="mb-8 mt-1 text-center text-sm text-light-subtext dark:text-dark-subtext">
        {t('haircutCreateSuccessMessage')}
      </ThemedText>
    </View>
  );
}
