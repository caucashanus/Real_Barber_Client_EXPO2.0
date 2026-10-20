import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import AppButton from '@/components/AppButton';
import SurfaceCard from '@/components/layout/SurfaceCard';
import ThemedText from '@/components/ThemedText';
import { useTranslation } from '@/hooks/useTranslation';

/** Sekce „Vaše návštěvy“ při firstVisitMode (parita web VisitPlanFirstVisitEmptyCard). */
export default function VisitPlanFirstVisitEmptyCard() {
  const { t } = useTranslation();

  return (
    <View className="w-full gap-3 self-stretch">
      <ThemedText className="text-base font-bold">{t('visitPlanFirstVisitEmptyTitle')}</ThemedText>
      <SurfaceCard
        rounded="2xl"
        className="w-full self-stretch border border-light-secondary p-4 dark:border-dark-secondary">
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          {t('visitPlanFirstVisitEmptyLead')}
        </ThemedText>
        <AppButton
          className="mt-4 self-start"
          size="md"
          variant="default"
          rounded="full"
          title={t('visitPlanFirstVisitBookCta')}
          textClassName="text-white"
          onPress={() => router.push('/(tabs)/(home)/real-barber' as never)}
        />
      </SurfaceCard>
    </View>
  );
}
