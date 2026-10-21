import React from 'react';
import { View } from 'react-native';

import ThemedText from '@/components/ThemedText';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/locales';
import { fillTranslationParams } from '@/utils/fillTranslationParams';
import type { VisitPlanPageBannerTiming } from '@/utils/visitPlanDates';

type Props = {
  timing: VisitPlanPageBannerTiming;
  daysLabel: string;
  accentColor: string;
};

function Line({
  text,
  accent,
  accentColor,
}: {
  text: string;
  accent: boolean;
  accentColor: string;
}) {
  const headlineClass = 'text-2xl font-bold leading-tight';
  if (accent) {
    return (
      <ThemedText className={headlineClass} style={{ color: accentColor }}>
        {text}
      </ThemedText>
    );
  }
  return <ThemedText className={`${headlineClass} !text-white`}>{text}</ThemedText>;
}

function homeBannerAriaKey(timing: VisitPlanPageBannerTiming): TranslationKey {
  if (timing.kind === 'overdue') return 'homeVisitPlanIntervalBannerOverdueAria';
  if (timing.kind === 'dueToday') return 'homeVisitPlanIntervalBannerDueTodayAria';
  if (timing.kind === 'tomorrow') return 'homeVisitPlanIntervalBannerTomorrowAria';
  return 'homeVisitPlanIntervalBannerInDaysAria';
}

export default function VisitPlanHomeCountdownHeadline({ timing, daysLabel, accentColor }: Props) {
  const { t } = useTranslation();
  const aria =
    timing.kind === 'inDays'
      ? fillTranslationParams(t('homeVisitPlanIntervalBannerInDaysAria'), { days: daysLabel })
      : t(homeBannerAriaKey(timing));

  if (timing.kind === 'overdue') {
    return (
      <View accessibilityRole="header" accessibilityLabel={aria} className="items-start">
        <Line text={t('homeVisitPlanIntervalBannerOverdueLine1')} accent accentColor={accentColor} />
        <Line text={t('homeVisitPlanIntervalBannerOverdueLine2')} accent={false} accentColor={accentColor} />
      </View>
    );
  }

  if (timing.kind === 'dueToday') {
    return (
      <View accessibilityRole="header" accessibilityLabel={aria} className="items-start">
        <Line text={t('homeVisitPlanIntervalBannerDueTodayLine1')} accent={false} accentColor={accentColor} />
        <Line text={t('homeVisitPlanIntervalBannerDueTodayLine2')} accent accentColor={accentColor} />
        <Line text={t('homeVisitPlanIntervalBannerDueTodayLine3')} accent={false} accentColor={accentColor} />
      </View>
    );
  }

  if (timing.kind === 'tomorrow') {
    return (
      <View accessibilityRole="header" accessibilityLabel={aria} className="items-start">
        <Line text={t('homeVisitPlanIntervalBannerTomorrowLine1')} accent={false} accentColor={accentColor} />
        <Line text={t('homeVisitPlanIntervalBannerTomorrowLine2')} accent accentColor={accentColor} />
        <Line text={t('homeVisitPlanIntervalBannerTomorrowLine3')} accent={false} accentColor={accentColor} />
      </View>
    );
  }

  return (
    <View accessibilityRole="header" accessibilityLabel={aria} className="items-start">
      <Line text={daysLabel} accent accentColor={accentColor} />
      <Line text={t('homeVisitPlanIntervalBannerInDaysLine2')} accent={false} accentColor={accentColor} />
      <Line text={t('homeVisitPlanIntervalBannerInDaysLine3')} accent={false} accentColor={accentColor} />
    </View>
  );
}
