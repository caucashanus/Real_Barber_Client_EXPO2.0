import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import CustomCard from '@/components/CustomCard';
import SlotTimePill from '@/components/SlotTimePill';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';

interface SectionIntroCardProps {
  t: (key: TranslationKey) => string;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  actionTitleKey?: TranslationKey;
  actionHref?: string;
  className?: string;
}

export default function SectionIntroCard({
  t,
  titleKey,
  bodyKey,
  actionTitleKey,
  actionHref,
  className = 'mb-6',
}: SectionIntroCardProps) {
  return (
    <View className={className}>
      <CustomCard rounded="2xl" padding="md" border background={false}>
        <ThemedText className="text-lg font-semibold">{t(titleKey)}</ThemedText>
        <ThemedText className="mt-3 text-sm leading-6 text-light-subtext dark:text-dark-subtext">
          {t(bodyKey)}
        </ThemedText>
        {actionTitleKey && actionHref ? (
          <View className="mt-4 flex-row justify-end">
            <SlotTimePill title={t(actionTitleKey)} onPress={() => router.push(actionHref as never)} />
          </View>
        ) : null}
      </CustomCard>
    </View>
  );
}
