import React from 'react';
import { Pressable, View } from 'react-native';

import ShowRating from '@/components/ShowRating';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';

interface BarberHeaderInfoProps {
  name: string;
  average: number;
  onScrollToReviews: () => void;
  t: (key: TranslationKey) => string;
}

export default function BarberHeaderInfo({
  name,
  average,
  onScrollToReviews,
  t,
}: BarberHeaderInfoProps) {
  return (
    <View>
      <ThemedText className="text-center text-3xl font-semibold">{name}</ThemedText>
      <View className="mt-4 flex-row items-center justify-center">
        <Pressable onPress={onScrollToReviews} className="flex-row items-center active:opacity-70">
          <ShowRating
            rating={average}
            size="lg"
            className="border-r border-neutral-200 px-4 py-2 dark:border-dark-secondary"
          />
          <ThemedText className="px-4 text-base">{t('profileReviews')}</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}
