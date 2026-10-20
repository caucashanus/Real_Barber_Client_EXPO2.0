import React from 'react';
import { View } from 'react-native';

import ThemedText from '@/components/ThemedText';
import { useTranslation } from '@/hooks/useTranslation';
import {
  VISIT_PLAN_CONFIRMED_LEGEND_SWATCH,
  VISIT_PLAN_RECOMMENDED_LEGEND_SWATCH,
} from '@/utils/visitPlanCalendarDayStyles';

const LEGEND_LABEL_CLASS =
  'text-[9px] leading-tight text-light-subtext dark:text-dark-subtext';

type Props = {
  hasUpcomingBooking: boolean;
  /** Druhá položka legendy při upcoming (oranž = další doporučený termín). */
  showNextRecommendedLegend?: boolean;
  /** Bez proběhlé návštěvy neukazovat legendu ideálního okna. */
  suppressIdealLegend?: boolean;
  className?: string;
  /** Horní mezera pod řádkem dnů (týdenní strip — bez `margin`, aby neroztahovalo box). */
  legendTopClassName?: string;
};

export default function VisitPlanCalendarHighlightLegend({
  hasUpcomingBooking,
  showNextRecommendedLegend = false,
  suppressIdealLegend = false,
  className = '',
  legendTopClassName = 'pt-2',
}: Props) {
  const { t } = useTranslation();

  if (suppressIdealLegend && !hasUpcomingBooking) {
    return null;
  }

  if (showNextRecommendedLegend) {
    return (
      <View
        className={`w-full flex-row flex-nowrap items-center justify-between gap-x-2 ${legendTopClassName} ${className}`}>
        <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
          <View style={VISIT_PLAN_CONFIRMED_LEGEND_SWATCH} />
          <ThemedText numberOfLines={1} className={`min-w-0 flex-1 ${LEGEND_LABEL_CLASS}`}>
            {t('visitPlanCalendarConfirmedLegend')}
          </ThemedText>
        </View>
        <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
          <View style={VISIT_PLAN_RECOMMENDED_LEGEND_SWATCH} />
          <ThemedText numberOfLines={1} className={`min-w-0 flex-1 ${LEGEND_LABEL_CLASS}`}>
            {t('visitPlanCalendarNextRecommendedLegend')}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View
      className={`w-full flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1 ${legendTopClassName} ${className}`}>
      <View className="flex-row items-center gap-2">
        {hasUpcomingBooking ? (
          <View style={VISIT_PLAN_CONFIRMED_LEGEND_SWATCH} />
        ) : (
          <View style={VISIT_PLAN_RECOMMENDED_LEGEND_SWATCH} />
        )}
        <ThemedText className={LEGEND_LABEL_CLASS}>
          {hasUpcomingBooking
            ? t('visitPlanCalendarConfirmedLegend')
            : t('visitPlanCalendarIdealLegend')}
        </ThemedText>
      </View>
    </View>
  );
}
