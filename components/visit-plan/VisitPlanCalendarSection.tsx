import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import Icon from '@/components/Icon';
import SurfaceCard from '@/components/layout/SurfaceCard';
import ThemedText from '@/components/ThemedText';
import VisitPlanCalendarHighlightLegend from '@/components/visit-plan/VisitPlanCalendarHighlightLegend';
import VisitPlanVisitCalendarStrip from '@/components/visit-plan/VisitPlanVisitCalendarStrip';
import { useTranslation } from '@/hooks/useTranslation';
import { normalizeIsoDateString } from '@/utils/visitPlanDates';

type Props = {
  todayIso: string;
  idealVisitCenterIso: string;
  calendarIdealCenterIso: string;
  intervalDays: number;
  upcomingBookingDate: string | null;
  firstVisitMode?: boolean;
  showViewAll?: boolean;
  onDayPress?: (dateIso: string) => void;
};

export default function VisitPlanCalendarSection({
  todayIso,
  idealVisitCenterIso,
  calendarIdealCenterIso,
  intervalDays,
  upcomingBookingDate,
  firstVisitMode = false,
  showViewAll = true,
  onDayPress,
}: Props) {
  const { t } = useTranslation();
  const confirmedBookingIso = normalizeIsoDateString(upcomingBookingDate);
  const showLegend = firstVisitMode ? Boolean(confirmedBookingIso) : true;

  const viewAllLink = showViewAll ? (
    <Pressable
      onPress={() => router.push('/screens/visit-plan-calendar' as never)}
      accessibilityRole="link"
      className="shrink-0 flex-row items-center gap-0.5 px-0 active:opacity-70">
      <ThemedText className="text-sm font-semibold text-accent">
        {t('visitPlanCalendarViewAll')}
      </ThemedText>
      <Icon name="ChevronRight" size={16} color="#FF4F31" />
    </Pressable>
  ) : null;

  return (
    <View className="w-full gap-3 self-stretch">
      <ThemedText className="text-base font-bold">{t('visitPlanCalendarHeading')}</ThemedText>
      <SurfaceCard
        rounded="2xl"
        className="relative w-full self-stretch border border-light-secondary dark:border-dark-secondary">
        {viewAllLink ? <View className="absolute right-4 top-3 z-10">{viewAllLink}</View> : null}
        <View className={`px-4 pb-3 ${viewAllLink ? 'pt-9' : 'py-3'}`}>
          <VisitPlanVisitCalendarStrip
            todayIso={todayIso}
            idealVisitCenterIso={idealVisitCenterIso}
            calendarIdealCenterIso={calendarIdealCenterIso}
            intervalDays={intervalDays}
            upcomingBookingDate={confirmedBookingIso}
            firstVisitMode={firstVisitMode}
            onDayPress={onDayPress}
          />
        </View>
        {showLegend ? (
          <View className="px-4 pb-3 pt-2">
            <VisitPlanCalendarHighlightLegend
              hasUpcomingBooking={Boolean(confirmedBookingIso)}
              showNextRecommendedLegend={Boolean(confirmedBookingIso) && !firstVisitMode}
              suppressIdealLegend={firstVisitMode}
              legendTopClassName="pt-0"
            />
          </View>
        ) : null}
      </SurfaceCard>
    </View>
  );
}
