import React from 'react';
import { View } from 'react-native';

import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { useTranslation } from '@/hooks/useTranslation';

export default function VisitPlanUpcomingBookingNotice() {
  const { t } = useTranslation();

  return (
    <View
      accessibilityRole="summary"
      className="flex-row items-center gap-2"
      accessibilityLabel={t('visitPlanUpcomingBookingNotice')}>
      <View className="size-6 shrink-0 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/40">
        <Icon name="Check" size={14} color="#4ade80" />
      </View>
      <ThemedText className="flex-1 text-sm font-semibold text-green-400">
        {t('visitPlanUpcomingBookingNotice')}
      </ThemedText>
    </View>
  );
}
