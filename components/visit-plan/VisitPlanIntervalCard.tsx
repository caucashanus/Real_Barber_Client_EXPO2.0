import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';

import AppButton from '@/components/AppButton';
import SurfaceCard from '@/components/layout/SurfaceCard';
import ThemedText from '@/components/ThemedText';
import { VISIT_PLAN_INTERVAL_ICON } from '@/constants/visitPlanSetupWizardOptions';
import { useTranslation } from '@/hooks/useTranslation';
import { formatVisitPlanIntervalEvery } from '@/utils/visitPlanIntervalDisplay';

type Props = {
  intervalDays: number;
  onEdit: () => void;
};

export default function VisitPlanIntervalCard({ intervalDays, onEdit }: Props) {
  const { t } = useTranslation();
  const everyLabel = formatVisitPlanIntervalEvery(intervalDays, t);

  return (
    <View className="w-full gap-3 self-stretch">
      <ThemedText className="text-base font-bold">{t('visitPlanMyIntervalTitle')}</ThemedText>
      <SurfaceCard
        rounded="2xl"
        className="w-full self-stretch border border-light-secondary p-4 dark:border-dark-secondary">
        <View className="flex-row items-center gap-3">
          <Image
            source={VISIT_PLAN_INTERVAL_ICON}
            style={{ width: 44, height: 44 }}
            contentFit="contain"
          />
          <View className="min-w-0 flex-1">
            <ThemedText className="font-semibold">{everyLabel}</ThemedText>
          </View>
          <AppButton
            className="shrink-0"
            size="sm"
            variant="outline"
            rounded="full"
            title={t('visitPlanIntervalEdit')}
            onPress={onEdit}
          />
        </View>
      </SurfaceCard>
    </View>
  );
}
