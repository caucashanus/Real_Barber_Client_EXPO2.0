import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';

import ThemedText from '@/components/ThemedText';
import { HOME_FAST_BOOK_SERVICES } from '@/constants/homeFastBookServices';
import type { TranslationKey } from '@/locales';

const KIDS_ICON = HOME_FAST_BOOK_SERVICES.find((s) => s.id === 'kids')!.iconImage;

type Props = {
  t: (key: TranslationKey) => string;
};

export default function KidsWatchPickEmptyState({ t }: Props) {
  return (
    <View className="items-center rounded-2xl border-2 border-dashed border-light-subtext/35 bg-light-surface px-6 py-8 dark:border-dark-subtext/35 dark:bg-dark-secondary">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-light-secondary dark:bg-dark-primary">
        <Image source={KIDS_ICON} style={{ width: 40, height: 40 }} contentFit="contain" />
      </View>
      <ThemedText className="text-center text-base font-semibold">
        {t('kidsWatchEmptyBookingsTitle')}
      </ThemedText>
      <ThemedText className="mt-2 text-center text-sm text-light-subtext dark:text-dark-subtext">
        {t('kidsWatchEmptyBookings')}
      </ThemedText>
    </View>
  );
}
